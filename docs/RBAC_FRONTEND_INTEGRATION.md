# RBAC v1 — frontend integration (AI agent handover)

**Status:** Backend RBAC v1 **shipped** (roles, JWT `role` claim, recruiter candidate DTOs, route guards).  
**Backend reference:** [`RBAC_BACKEND_HANDOFF.md`](./RBAC_BACKEND_HANDOFF.md)  
**Prerequisites:** Auth login already integrated per [`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md) (Bearer on all `/api/**`, `/login`, `GET /api/auth/me`).  
**Users admin (extended for RBAC):** [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md) — update that doc’s assumptions where this doc overrides (roles, Recruiter blocked from `/users`).  
**Audience:** AI agent (or developer) on the **Next.js** frontend repository.

---

## 1. What changed (executive summary)

| Before RBAC | After RBAC v1 |
|-------------|----------------|
| Any logged-in user sees full app | **Three roles** with different nav, API access, and candidate JSON shapes |
| Login `user` had no `role` | Login + `me` include **`role`** as number **`0` \| `1` \| `2`** |
| Same candidate JSON for everyone | **Recruiter** gets **different response types** (sensitive keys **absent**, not `null`) |
| All `/api/users` for any user | **Recruiter → 403** on all `/api/users` |
| Dashboard for everyone | **Recruiter → 403** on `/api/dashboard/**` |
| Full candidate CRUD + nested writes | **Recruiter:** create + read only; **no** candidate PUT/DELETE; **no** nested writes except **resume upload (R2)** |

**Deploy coordination:** API migration `20260923212300_AddUserRole` must be applied; **all users must sign in again** after deploy (old JWTs without valid `role` claim → **401**).

---

## 2. Role model

### 2.1 Numeric enum (API JSON)

Use this everywhere in TypeScript (store as `number` from API; avoid string enum names in JSON).

| `role` | Name | Typical seeded users (dev) |
|-------:|------|----------------------------|
| **0** | SuperAdmin | rabiah.z, syed, hassan.b, ahmed.m @dplit.com |
| **1** | Admin | reyyan.m @dplit.com |
| **2** | Recruiter | Users created as Recruiter via Users admin |

```typescript
export const UserRole = {
  SuperAdmin: 0,
  Admin: 1,
  Recruiter: 2,
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]
```

### 2.2 JWT

- Claim name: **`role`** (string **`"0"`**, **`"1"`**, or **`"2"`** inside JWT payload).
- **Do not** use JWT as the sole source of truth for UI if you can avoid it — prefer **`user.role`** from login / `GET /api/auth/me` (same numeric values).
- If an admin changes a user’s role in DB, the next API call with an old token returns **401** `"Session outdated. Please sign in again."` → force re-login.

### 2.3 Auth API — extend existing types

Update [`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md) types:

**`POST /api/auth/login` — `200` `user` object now includes:**

```json
{
  "id": 4,
  "fullName": "Syed Ahmad",
  "email": "syed@dplit.com",
  "role": 0
}
```

**`GET /api/auth/me` — `200` now includes:**

```json
{
  "id": 4,
  "fullName": "Syed Ahmad",
  "email": "syed@dplit.com",
  "role": 0,
  "createdAt": "2026-09-22T10:04:28Z"
}
```

```typescript
export type AuthUser = {
  id: number
  fullName: string
  email: string
  role: UserRole
}

export type CurrentUser = AuthUser & {
  createdAt: string
}
```

**Persistence:** Store `role` next to `accessToken` / user snapshot (same storage as auth today). Refresh from `me` on app bootstrap.

---

## 3. Recommended FE architecture

### 3.1 Role context (single source for UI)

Add a small auth/role layer used by layout, sidebar, and feature guards:

```typescript
// Illustrative — match existing auth context naming in FE repo
export type AuthSession = {
  user: CurrentUser
  accessToken: string
  expiresAt: string
}

export function isSuperAdmin(role: UserRole) {
  return role === UserRole.SuperAdmin
}
export function isAdmin(role: UserRole) {
  return role === UserRole.Admin
}
export function isRecruiter(role: UserRole) {
  return role === UserRole.Recruiter
}
export function isAdminOrAbove(role: UserRole) {
  return role === UserRole.SuperAdmin || role === UserRole.Admin
}
```

Expose hooks/helpers, e.g. `useCurrentUser()`, `useUserRole()`, `canAccessUsersAdmin(role)`, `canAccessDashboard(role)`, `canMutateCandidate(role)`, `canUseCandidateSalaryUi(role)`.

### 3.2 Route & navigation matrix

Implement **hide + block** (do not rely on hide alone — deep links must redirect or show forbidden).

| Surface | SuperAdmin (0) | Admin (1) | Recruiter (2) |
|---------|----------------|-----------|---------------|
| **Dashboard** (`/dashboard` or app home widgets using `/api/dashboard/**`) | Show | Show | **Hide**; do not call API |
| **Users** (`/users`) | Show | Show | **Hide**; **403** if called |
| **Employers, projects, universities, certifications, catalogs, etc.** | Full | Full | Full (same as today) |
| **Candidates list/detail** | Full | Full | Read + **create**; restricted JSON (§5) |
| **Candidate edit / delete** | Yes | Yes | **Hide**; PUT/DELETE → **403** |
| **Candidate nested tabs (educations, WE, etc.)** | Read/write | Read/write | **Read only**; writes → **403** |
| **Resume** | Full | Full | **Upload + open**; **no delete** (§6) |
| **Admin maintenance** (`/api/admin/**`) | Yes | Yes | **403** |

**FE agent:** Map rows to actual sidebar entries and routes by **reading the Next.js repo** (paths may differ from examples).

### 3.3 API client behavior

Keep shared `fetchWithAuth` from auth integration. Add:

1. **403 handler** — parse JSON when present: `{ "status": 403, "message": "..." }` (see §8). Show `message` in toast; do not retry blindly.
2. **401 handler** — distinguish:
   - Login form wrong password: body often plain string `"Email or password is incorrect."`
   - Session outdated / invalid token: may include `"Session outdated. Please sign in again."` → clear session, redirect `/login`
3. **Optional:** skip calling endpoints that are known **403** for Recruiter (dashboard prefetch, users page) to avoid noisy errors.

---

## 4. API access matrix (by role)

Legend: **✓** allowed · **✗** **403** (forbidden) · **R** read · **W** write

### 4.1 Blocked for Recruiter only (`[AdminOnly]`)

| Method | Path pattern |
|--------|----------------|
| * | `/api/dashboard/**` |
| * | `/api/admin/**` |
| * | `/api/users/**` |
| `PUT`, `DELETE` | `/api/candidates/{id}` |
| `POST`, `PUT`, `PATCH`, `DELETE` | `/api/candidates/{id}/educations/**` |
| `PUT`, `DELETE` | `/api/candidates/{id}/certifications/**` |
| `POST`, `PUT`, `DELETE` | `/api/candidates/{id}/achievements/**` |
| `POST`, `DELETE` | `/api/candidates/{id}/tech-stacks/**` |
| `PATCH` | `/api/candidates/{id}/call-notes` |
| `POST`, `PUT`, `DELETE` | `/api/candidates/{id}/work-experiences/**` (including sub-routes) |
| `DELETE` | `/api/candidates/{id}/resume` |

### 4.2 Allowed for Recruiter

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/candidates` | Recruiter list JSON (§5.1) |
| `GET` | `/api/candidates/{id}` | Recruiter detail JSON (§5.2) |
| `GET` | `/api/candidates/{id}/data-progress` | Same shape as admin (no salary masking in this endpoint) |
| `POST` | `/api/candidates` | No salary / WE comp fields in body (§5.4) |
| `GET` | `/api/candidates/{id}/work-experiences` | Recruiter WE JSON (§5.3) |
| `GET` | `/api/candidates/{id}/work-experiences/{weId}` | Recruiter WE JSON |
| `GET` | Other candidate nested **GET** routes | Unmasked except work-experiences (compensation stripped on WE GET) |
| `POST` | `/api/candidates/{id}/resume/upload-url` | R2 |
| `POST` | `/api/candidates/{id}/resume/confirm` | R2 |
| `GET` | `/api/candidates/{id}/resume/open-url` | R2 download/open |

### 4.3 Unchanged for all roles

All other authenticated `/api/**` modules (employers, projects, universities, certifications, benefits, tech stacks, etc.) remain **read/write** for **Recruiter** unless the app already restricted them for other reasons.

---

## 5. Candidates — types, JSON shapes, UI rules

### 5.1 List — `GET /api/candidates`

**SuperAdmin / Admin:** existing `CandidateListItem` type (includes `currentSalary`, `expectedSalary`, full `matchedWorkExperiences` with `salaryPolicy`, `benefits`, etc.).

**Recruiter:** same URL and paging/filter query params **except** salary-related filters (§5.5). Response items **do not include** these JSON keys at all:

| Omitted property | Notes |
|------------------|--------|
| `currentSalary` | |
| `expectedSalary` | |
| On each `matchedWorkExperiences[]` item: `salaryPolicy`, `benefits` | Other matched WE fields unchanged |

**Still present for Recruiter:** `matchedEmployers[]` may include **`salaryPolicies`** when filters are active (employer-level, not candidate salary). Do not display if product wants parity with hidden compensation — **confirm with product** if UI should hide employer salary policy chips for Recruiter.

```typescript
// Admin/SuperAdmin — extend existing app type
export type CandidateListItem = {
  id: number
  name: string
  // ...
  currentSalary: number | null
  expectedSalary: number | null
  matchedWorkExperiences: MatchedWorkExperience[]
  // ...
}

export type MatchedWorkExperience = {
  workExperienceId: number
  employerId: number
  employerName: string
  salaryPolicy?: { id: number; label: string } | null
  benefits?: { id: number; label: string }[]
  // ...
}

// Recruiter — separate type (no optional salary fields)
export type CandidateRecruiterListItem = Omit<
  CandidateListItem,
  'currentSalary' | 'expectedSalary'
> & {
  matchedWorkExperiences: MatchedWorkExperienceRecruiter[]
}

export type MatchedWorkExperienceRecruiter = Omit<
  MatchedWorkExperience,
  'salaryPolicy' | 'benefits'
>
```

**Typing strategy (required):**

```typescript
export function parseCandidateListPage(
  role: UserRole,
  json: PagedResult<unknown>,
): PagedResult<CandidateListItem> | PagedResult<CandidateRecruiterListItem> {
  if (isRecruiter(role)) {
    return json as PagedResult<CandidateRecruiterListItem>
  }
  return json as PagedResult<CandidateListItem>
}
```

Use **role branch at call site** (preferred): `candidates-api.ts` exports `fetchCandidatesPage(role, ...)` returning the correct generic.

### 5.2 Detail — `GET /api/candidates/{id}`

**Omitted for Recruiter (keys absent):**

| Location | Omitted |
|----------|---------|
| Root | `currentSalary`, `expectedSalary` |
| Each `workExperiences[]` | `salaryPolicy`, `benefits` |

```typescript
export type CandidateWorkExperienceRecruiter = Omit<
  CandidateWorkExperience,
  'salaryPolicy' | 'benefits'
>

export type CandidateRecruiterDetail = Omit<
  CandidateDetail,
  'currentSalary' | 'expectedSalary' | 'workExperiences'
> & {
  workExperiences: CandidateWorkExperienceRecruiter[]
}
```

### 5.3 Work experiences — `GET .../work-experiences`

Recruiter responses use `CandidateWorkExperienceRecruiter` (no `salaryPolicy`, `benefits` keys). Admin uses full `CandidateWorkExperience`.

### 5.4 Create — `POST /api/candidates`

| Role | Body |
|------|------|
| Admin / SuperAdmin | Existing create payload (salary + WE comp allowed) |
| Recruiter | **Omit** `currentSalary`, `expectedSalary`; omit `salaryPolicy` and `benefits` on each `workExperiences[]` item |

If Recruiter sends forbidden fields → **400** with message:

- `"Current salary and expected salary cannot be set for your role."`
- `"Work experience salary policy and benefits cannot be set for your role."`

**Response:** Recruiter receives **201** body shaped as **`CandidateRecruiterDetail`** (same omissions as GET detail).

**UI:** Recruiter create modal = single-shot create with nested educations/WE/etc. in one POST (no post-create nested write APIs).

### 5.5 List filters — Recruiter must not send

If Recruiter calls list with any of these query params → **403** with message:  
`"You do not have permission to filter candidates by salary or compensation fields."`

| Query param (camelCase) | |
|-------------------------|---|
| `currentSalaryMin`, `currentSalaryMax` | |
| `expectedSalaryMin`, `expectedSalaryMax` | |
| `workExperienceSalaryPolicies` | repeated enum ints |
| `employerSalaryPolicies` | repeated enum ints |
| `workExperienceBenefitIds` | repeated longs |

**UI:** Hide salary / WE salary policy / WE benefit filter controls for Recruiter; strip from URL state if user bookmarked an admin URL.

Reference: [`CandidateFilterIntegration.md`](./CandidateFilterIntegration.md).

### 5.6 Candidate UI checklist (Recruiter)

- [ ] List/table: no salary columns; no salary filter fields
- [ ] Detail: no salary fields; WE sections without policy/benefits
- [ ] Create: no salary inputs; WE rows without policy/benefits pickers
- [ ] Hide edit candidate, delete candidate, save on detail
- [ ] Hide or disable nested “add/edit/delete” on educations, certifications, achievements, tech stacks, call-notes patch, WE mutations
- [ ] Keep resume upload + view/download; hide resume delete
- [ ] Types: use `CandidateRecruiter*` types when `role === 2` so TypeScript catches illegal field access

---

## 6. Resume (R2) — Recruiter

| Step | Method | Path |
|------|--------|------|
| Request upload URL | `POST` | `/api/candidates/{id}/resume/upload-url` |
| Confirm after S3 | `POST` | `/api/candidates/{id}/resume/confirm` |
| Open/download | `GET` | `/api/candidates/{id}/resume/open-url` |
| Delete | `DELETE` | `/api/candidates/{id}/resume` → **403** for Recruiter |

Wire existing S3 upload flow; only gate **delete** button by role.

---

## 7. Users admin (`/users`)

**Recruiter:** no route, no API calls.

**SuperAdmin / Admin:** extend existing users feature.

### 7.1 List item — add `role`

```json
{
  "id": 2,
  "fullName": "Muhammad Reyyan",
  "email": "reyyan.m@dplit.com",
  "role": 1,
  "createdAt": "2026-09-21T11:57:26Z"
}
```

### 7.2 Create / update — `role` required

```json
{
  "fullName": "Jane Doe",
  "email": "jane@dplit.com",
  "password": "minimum8chars",
  "role": 2
}
```

```json
{
  "fullName": "Jane Doe",
  "email": "jane@dplit.com",
  "password": null,
  "role": 2
}
```

Omitting `role` or sending invalid JSON null without field → **400** `"Role is required."`

### 7.3 Who can assign which role

| Viewer | Users in list | May assign on create/update |
|--------|---------------|-----------------------------|
| SuperAdmin | Admin + Recruiter only (not SuperAdmin rows; not self) | **1** Admin or **2** Recruiter only |
| Admin | Recruiter only (not self) | **2** Recruiter only |

**403 messages (show in toast):**

| Message | When |
|---------|------|
| `You cannot assign the SuperAdmin role.` | SuperAdmin tries to set `role: 0` on create/update |
| `Admins can only manage Recruiter accounts.` | Admin tries to set Admin/SuperAdmin |
| `At least one SuperAdmin must remain in the system.` | Demote/delete last SuperAdmin |
| `You do not have permission to perform this action.` | Default forbidden (e.g. manage out-of-scope user) |

**409** duplicate email unchanged.

### 7.4 Users UI checklist

- [ ] Add **Role** column (labels: Super Admin / Admin / Recruiter — only show values that appear in list)
- [ ] Role select on create/edit: options depend on **current user’s** role (not the row being edited)
- [ ] Guard `/users` route: `isAdminOrAbove(role)` else redirect
- [ ] Update `users-api.ts` types and payloads with `role: UserRole`

---

## 8. Error handling reference

| Status | Body shape | FE action |
|--------|------------|-----------|
| **401** | Often JSON **string** (quoted) | If message contains `Session outdated` or on any authenticated call after deploy → clear token, login |
| **401** | Login failure string | Inline form error only |
| **403** | `{ "status": 403, "message": "..." }` when thrown as `ForbiddenException` | Show `message`; hide action |
| **403** | Empty or generic (ASP.NET `[AdminOnly]` without exception) | Show generic “You don’t have permission” |
| **400** | JSON string validation | Show message (Recruiter salary on create, `Role is required`, etc.) |
| **409** | Users email conflict | Existing handling |

```typescript
export type ApiForbiddenBody = {
  status: 403
  message: string
}

export async function parseApiError(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const json = JSON.parse(text)
    if (typeof json === 'string') return json
    if (json && typeof json.message === 'string') return json.message
  } catch {
    /* fall through */
  }
  return text || response.statusText
}
```

---

## 9. Implementation checklist (AI agent)

Work in order; tick in PR description.

### 9.1 Auth & session

- [ ] Extend `AuthUser` / `CurrentUser` with `role: UserRole`
- [ ] Persist `role` on login; rehydrate from `GET /api/auth/me`
- [ ] Add `useUserRole()` (or equivalent) used by layout and features
- [ ] Handle **401** session outdated after RBAC deploy (force re-login once)

### 9.2 Navigation & routes

- [ ] Hide Dashboard nav + block dashboard routes for Recruiter
- [ ] Hide Users nav + block `/users` for Recruiter
- [ ] Hide candidate edit/delete and nested write actions for Recruiter
- [ ] Hide resume delete for Recruiter

### 9.3 Candidates module

- [ ] Add `CandidateRecruiterListItem`, `CandidateRecruiterDetail`, `CandidateWorkExperienceRecruiter`, `MatchedWorkExperienceRecruiter` types
- [ ] Branch `candidates-api` return types by `role`
- [ ] Recruiter list: remove salary columns and salary/compensation filters from UI and query builder
- [ ] Recruiter create: omit forbidden fields from POST body
- [ ] Recruiter detail: do not reference `currentSalary` / `expectedSalary` / WE `salaryPolicy` / `benefits` in components (types enforce)
- [ ] Stop calling nested **write** APIs for Recruiter (educations, WE, etc.)

### 9.4 Users module

- [ ] Add `role` to table and create/edit form
- [ ] Restrict role dropdown by viewer role (§7.3)
- [ ] API: include `role` on POST/PUT

### 9.5 Dashboard & admin

- [ ] Guard dashboard data fetches with `isAdminOrAbove`
- [ ] Hide admin maintenance UI that calls `/api/admin/**` from Recruiter (if exposed in FE)

### 9.6 Errors

- [ ] Parse **403** JSON `message` in shared client
- [ ] Tests / manual smoke (§10)

---

## 10. Manual smoke tests (three roles)

Use Postman or browser after FE changes. Passwords are team-provided (not in repo).

### 10.1 SuperAdmin (`role: 0`)

1. Login → `user.role === 0`
2. Dashboard loads (`GET /api/dashboard/data-progress`)
3. Users list includes Admin/Recruiter rows with `role`; create Recruiter with `role: 2`
4. Candidates list shows salary columns; detail shows full WE with policy/benefits
5. Candidate PUT/DELETE works

### 10.2 Admin (`role: 1`)

1. Users list shows **Recruiters only** (no SuperAdmin rows)
2. Create user only with `role: 2`
3. Full candidates access (same as SuperAdmin for non-users modules)

### 10.3 Recruiter (`role: 2`)

1. No dashboard API calls (or 403 if forced)
2. `/users` not reachable; `GET /api/users` → 403
3. `GET /api/candidates` → items **without** `currentSalary` / `expectedSalary` keys
4. `GET /api/candidates/{id}` → no salary keys; WE without `salaryPolicy` / `benefits`
5. `POST /api/candidates` without salary → 201; with `currentSalary` → 400
6. `PUT /api/candidates/{id}` → 403
7. `POST .../resume/upload-url` → 200; `DELETE .../resume` → 403
8. `GET /api/candidates?currentSalaryMin=1` → 403

---

## 11. Backend source reference (read-only)

| Topic | Path |
|-------|------|
| Recruiter DTOs | `MyApp.Application/DTOs/Recruiter/CandidateRecruiterDtos.cs` |
| Mapper | `MyApp.Application/Candidates/RecruiterCandidateDtoMapper.cs` |
| Recruiter rules | `MyApp.Application/Candidates/RecruiterCandidateAccessRules.cs` |
| User rules | `MyApp.Application/Users/UserRoleAdminRules.cs` |
| Candidates controller | `MyApp.API/Controllers/CandidatesController.cs` |
| JWT role claim | `MyApp.API/Auth/JwtTokenGenerator.cs`, `ActiveUserJwtBearerEvents.cs` |
| Admin-only attribute | `MyApp.API/Auth/AdminOnlyAttribute.cs` |

---

## 12. Open questions — resolve in FE repo (do not guess)

Read the Next.js codebase and confirm:

1. **Exact routes** for dashboard, candidates list/detail/create, users.
2. **Where candidate filters are built** — ensure Recruiter query builder excludes §5.5 params.
3. **Whether Recruiter detail uses nested GETs or only detail payload** — align WE display with §5.3.
4. **Whether to hide `matchedEmployers[].salaryPolicies` in UI** for Recruiter (API may still return them).
5. **Post-login default landing** per role (e.g. Recruiter → `/candidates` not `/dashboard`).

If product requirements differ from this handoff, ask the product owner before shipping.

---

## 13. Related docs

| Doc | Relationship |
|-----|----------------|
| [`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md) | Login/`me` **`role`**, session outdated **401**; app shell RBAC defers here |
| [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md) | `/users` feature: **`role`** field, guards, API payloads |
| [`AUTH_LOGIN_BACKEND_HANDOFF.md`](./AUTH_LOGIN_BACKEND_HANDOFF.md) | Auth endpoints (pair with auth FE doc) |
| [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md) | Users API (pair with users FE doc; confirm `role` in handoff when updated) |
