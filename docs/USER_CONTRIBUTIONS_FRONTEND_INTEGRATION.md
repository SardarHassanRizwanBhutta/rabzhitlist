# User contribution tracking v1 — frontend integration (AI agent handover)

**Status:** Backend **shipped**; FE integration **not started** in this monorepo (Next.js app lives in a separate repository — discover paths there before editing).  
**Backend contract:** [`USER_CONTRIBUTIONS_BACKEND_HANDOFF.md`](./USER_CONTRIBUTIONS_BACKEND_HANDOFF.md)  
**Prerequisites (must already be done):**  
- Auth: [`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md) (Bearer on `/api/**`, session + `user.role`)  
- RBAC: [`RBAC_FRONTEND_INTEGRATION.md`](./RBAC_FRONTEND_INTEGRATION.md) (role guards, **403** parsing)  
- Users admin: [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md) + [`USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md)  

**Audience:** AI agent (or developer) on the **Next.js** frontend.

---

## 1. Executive summary

| Item | Detail |
|------|--------|
| **Feature** | Show **how many active records** a user **created** in five areas: candidates, employers, projects, universities, certifications. |
| **APIs** | **Self:** `GET /api/auth/me/contributions` (all roles). **Others:** `GET /api/users/{id}/contributions` (Admin/SuperAdmin only; users-admin scope). |
| **Who sees “my” UI** | **Any signed-in role** (SuperAdmin, Admin, Recruiter) — placement is FE-owned |
| **Who sees “others” UI** | **SuperAdmin** and **Admin** on `/users` — targets from **`GET /api/users`** list scope (backend **Option A**) |
| **v1 limits** | **Counts only** — no lists, no links to filtered entity pages, no `createdBy` on candidate/employer/etc. DTOs |
| **Data caveat** | Rows created **before** migration `20260924173606_AddCreatedByUserId` have **no** creator → counts stay **0** until that user creates **new** rows after deploy |

---

## 2. Product scope (what to build / not build)

### 2.1 In scope (v1)

- **Self:** `GET /api/auth/me/contributions` for the signed-in user (all roles).
- **Others (admin):** `GET /api/users/{id}/contributions` for ids from the users list (Admin/SuperAdmin only).
- Display five non-negative integers with clear labels.
- **Read-only** — no mutations; **UX/routes** are frontend-owned.

### 2.2 Out of scope (v1) — do **not** implement

| Item | Reason |
|------|--------|
| Drill-down to filtered candidate/employer/etc. lists | Backend does not expose list-by-creator APIs |
| `createdBy` column on entity tables | Not on entity DTOs |
| Viewing **another** user via `/api/users/{id}/contributions` as Recruiter | **403** — use **`/api/auth/me/contributions`** for self only |
| Viewing **own** counts via `/api/users/{ownId}/contributions` | **403** — use **`/api/auth/me/contributions`** |
| Caching counts across sessions | Optional; no backend cache — refetch on open is fine |

### 2.3 UX and layout (frontend-owned)

The API does **not** specify screens, components, routes, or interaction patterns. The **frontend team / FE agent** decides:

- Where counts appear (table, dialog, drawer, dedicated page, etc.)
- When to call the API (on row select, on edit open, on button click, etc.)
- Copy, icons, density, and whether to show explanatory text about pre-migration data

**Hard requirements** (contract + RBAC — not negotiable in v1):

| Requirement | Detail |
|-------------|--------|
| **Self** | Any authenticated user may call `GET /api/auth/me/contributions` |
| **Others** | Only **SuperAdmin** and **Admin** call `GET /api/users/{id}/contributions` for in-scope ids (see §3.2) |
| **Create-user flow** | No `id` until after `POST /api/users` — do not call contributions during create unless FE explicitly loads after **201** (unusual; not required by backend) |
| **Data shown** | All five keys under `counts` on **200**; treat **0** as valid |
| **No scope creep** | No drill-down lists, no entity-module changes (§2.2) |

**FE agent:** Discover the Users admin implementation in the Next.js repo (see [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md) for illustrative file names) and integrate using the same auth client, guards, and error/toast patterns as existing users CRUD.

---

## 3. Access control

### 3.1 Self (`GET /api/auth/me/contributions`)

| `user.role` | May call API? | Typical UI |
|-------------|---------------|------------|
| **0** SuperAdmin | Yes | Account/profile area (FE-owned) |
| **1** Admin | Yes | Same |
| **2** Recruiter | Yes | Same |

Requires valid Bearer token. Response shape identical to the users-admin contributions DTO (§4).

### 3.2 Others (`GET /api/users/{id}/contributions`)

| `user.role` | May call? |
|-------------|-----------|
| **0** SuperAdmin | Yes — for list rows (Admin + Recruiter ids) |
| **1** Admin | Yes — for Recruiter ids only |
| **2** Recruiter | **No** — **403** on all `/api/users/**` |

```typescript
import { UserRole } from '@/lib/types/user-role' // match existing RBAC types

export function canViewOtherUsersContributions(role: UserRole): boolean {
  return role === UserRole.SuperAdmin || role === UserRole.Admin
}
```

Do **not** call `/api/users/{id}/contributions` for Recruiter or for **own** id — use §3.1 instead.

### 3.3 Target user (admin route — whose counts are shown)

Visibility matches **user list / manage** rules (`UserRoleAdminRules.EnsureCanViewContributions` on API):

| Viewer | Valid target `role` in response |
|--------|----------------------------------|
| SuperAdmin | **1** Admin, **2** Recruiter |
| Admin | **2** Recruiter only |

**Invalid targets (API → 403):** SuperAdmin users, Admin users when viewer is Admin, any id not in scope, attempting to use contributions as a substitute for a “list all users including SuperAdmin” API.

**Practical rule for FE:** Only call the endpoint with `id` from a row returned by **`GET /api/users`** (after list refresh). Do not build a separate user picker.

**404:** User soft-deleted or unknown id (e.g. stale UI after delete) → show “User not found” / close dialog and refresh list.

---

## 4. API reference

Use the same **authenticated fetch helper** as auth/users clients (Bearer + base URL from `NEXT_PUBLIC_API_URL` / project convention).

### 4.1 Self — `GET /api/auth/me/contributions`

```http
GET /api/auth/me/contributions
Authorization: Bearer <accessToken>
```

| Part | Detail |
|------|--------|
| Query params | **None** |
| Body | **None** |

**Errors:** **401** unauthenticated; **404** if user row missing (rare).

### 4.2 Others — `GET /api/users/{id}/contributions`

```http
GET /api/users/{id}/contributions
Authorization: Bearer <accessToken>
```

| Part | Detail |
|------|--------|
| `{id}` | Target user id (`number` / `long`) — not your own id |
| Query params | **None** |
| Body | **None** |

**Errors:** **401**; **403** Recruiter or out-of-scope target; **404** unknown/deleted user.

### 4.3 Success `200` (both routes)

**JSON (camelCase):**

```json
{
  "id": 5,
  "fullName": "Jane Recruiter",
  "email": "jane.r@dplit.com",
  "role": 2,
  "counts": {
    "candidates": 12,
    "employers": 0,
    "projects": 1,
    "universities": 2,
    "certifications": 0
  }
}
```

| Field | Type | Notes |
|-------|------|--------|
| `id` | number | Same as list row `id` |
| `fullName` | string | Display in panel header |
| `email` | string | Display in panel header |
| `role` | number | **`0` SuperAdmin, `1` Admin, `2` Recruiter** — echo of target; list rows only show 1 or 2 |
| `counts.candidates` | number | Active candidates created by this user |
| `counts.employers` | number | Active employers created by this user |
| `counts.projects` | number | Active projects created by this user |
| `counts.universities` | number | Active universities created by this user |
| `counts.certifications` | number | Active certifications created by this user |

**Count semantics (optional to surface in UI — copy is FE-owned):**

- Only rows where `created_by_user_id` = this user and **`deleted_at` is null**.
- Updates do **not** change creator; only **creates** after migration increment counts.
- Linking **existing** catalog ids on candidate create does **not** attribute those catalogs to the user — only the **candidate** row (and any **new** catalog row created via that module’s POST) counts.

### 4.4 Errors (admin route — §4.2)

| Status | When | FE action |
|--------|------|-----------|
| **401** | Missing/invalid token, session outdated | Same as rest of app — clear session, `/login` |
| **403** | Recruiter caller, or target out of scope | Toast: parse `message` if JSON (see §6); close panel |
| **404** | Target user not found / deleted | Toast or inline “User not found”; refresh users list |

**403 body** (when `ForbiddenException`):

```json
{
  "status": 403,
  "message": "You do not have permission to perform this action."
}
```

Recruiter hitting any `/api/users` route may get **403** with a generic body — use shared `extractApiErrorMessage` / `parseApiError` from RBAC doc §8.

---

## 5. TypeScript types

Add alongside existing user types (e.g. `src/lib/types/app-user.ts` or `user-contributions.ts`):

```typescript
import type { UserRole } from './user-role' // align with RBAC doc

export type UserContributionCounts = {
  candidates: number
  employers: number
  projects: number
  universities: number
  certifications: number
}

export type UserContributions = {
  id: number
  fullName: string
  email: string
  role: UserRole
  counts: UserContributionCounts
}
```

**Display metadata (static, FE-owned):**

```typescript
export const CONTRIBUTION_COUNT_KEYS: {
  key: keyof UserContributionCounts
  label: string
}[] = [
  { key: 'candidates', label: 'Candidates' },
  { key: 'employers', label: 'Employers' },
  { key: 'projects', label: 'Projects' },
  { key: 'universities', label: 'Universities' },
  { key: 'certifications', label: 'Certifications' },
]
```

Reuse sidebar/module naming/icons from the app if they exist — do not invent new routes in v1.

**Role label for header** (target user):

| `role` | Label |
|-------:|-------|
| 0 | Super Admin |
| 1 | Admin |
| 2 | Recruiter |

(List UI should only open contributions for rows with role 1 or 2.)

---

## 6. API client

**Self** — e.g. `src/lib/services/auth-api.ts` or shared API module:

```typescript
export async function fetchMyContributions(): Promise<UserContributions> {
  const response = await authenticatedFetch('/api/auth/me/contributions')
  if (!response.ok) throw await toApiError(response)
  return response.json() as Promise<UserContributions>
}
```

**Others (admin)** — `src/lib/services/users-api.ts`:

```typescript
export async function fetchUserContributions(userId: number): Promise<UserContributions> {
  const response = await authenticatedFetch(`/api/users/${userId}/contributions`)
  if (!response.ok) throw await toApiError(response)
  return response.json() as Promise<UserContributions>
}
```

**Rules:**

- No query params; no body.
- Throw on non-OK so the UI layer can toast.
- For **own** stats, always use `fetchMyContributions()` — not `fetchUserContributions(session.user.id)`.

---

## 7. UI integration guide

### 7.1 Data loading

| Event | Action |
|-------|--------|
| Open **my** contributions UI | `fetchMyContributions()` |
| Open **another user’s** UI (admin) | `fetchUserContributions(id)` |
| Close dialog/drawer | Cancel in-flight request if using AbortController (optional; match Users module) |
| Successful user **delete** | Do not refetch; close contributions UI |
| User **updated** (name/email/role) | Optional refetch contributions (counts unchanged); at minimum refresh header from edit form or refetch contributions for updated `fullName`/`email` |

**Create user flow:** Do **not** call contributions (no id until after create — and v1 does not require counts on create success).

### 7.2 Presentation

Layout and components are **not specified** here. Minimum content to render from a **200** response:

- Target identity: `fullName`, `email`, and optionally role label from `role`
- Five metrics: `counts.candidates`, `counts.employers`, `counts.projects`, `counts.universities`, `counts.certifications` with human-readable labels (see `CONTRIBUTION_COUNT_KEYS` in §5)

Implementation notes (optional):

- Format integers with `toLocaleString()` if counts can grow large.
- **Zero is valid** — especially right after migration deploy; do not treat as an API failure.

### 7.3 Loading / empty / error

| State | UX |
|-------|-----|
| Loading | Skeleton or spinner in panel; disable duplicate fetches |
| Success | Render all five keys from `counts` (always present on **200**) |
| Error | Toast + optional inline message; **403**/**404** copy from §4.3 |

### 7.4 What not to change elsewhere

- **Do not** add contribution fetches to candidate/employer/project/university/certification list pages.
- **Do not** add Recruiter-facing UI for this feature.
- **Do not** extend `POST`/`PUT` user payloads with contribution fields.

---

## 8. File-level checklist (discover in FE repo)

Illustrative targets from Users admin doc — **verify paths** before editing:

| Area | Likely file | Change |
|------|-------------|--------|
| Types | `src/lib/types/user-contributions.ts` (new) or `app-user.ts` | Add §5 types |
| API | `auth-api.ts` / `users-api.ts` | `fetchMyContributions`, `fetchUserContributions` |
| UI | Profile/account + Users module (paths vary) | Integrate per §2.3 |
| Guards | `canViewOtherUsersContributions` for admin-only UI | Self UI: any authenticated user |

---

## 9. Implementation checklist (AI agent)

Work in order; reference in PR description.

### 9.1 Types & client

- [ ] Add `UserContributions` + `UserContributionCounts` types
- [ ] Add `fetchMyContributions()` and `fetchUserContributions(userId)`
- [ ] Reuse existing API error helper for **401** / **403** / **404**

### 9.2 UI

- [ ] **Self:** contributions entry for all roles → `fetchMyContributions()`
- [ ] **Others:** gate with `canViewOtherUsersContributions`; in-scope ids only (§3.3)
- [ ] Loading + error + success states
- [ ] Header shows `fullName`, `email`, role label from response (or from list row before load)

### 9.3 Edge cases

- [ ] After target user delete, handle stale UI (**404** on refetch or refresh list)

### 9.4 Manual smoke tests

Prerequisites: API with migration **`20260924173606_AddCreatedByUserId`** applied; test users per RBAC doc.

**SuperAdmin**

1. Open `/users` — pick a **Recruiter** row → open contributions → **200**, five numbers render.
2. Pick an **Admin** row → **200**.
3. Create a candidate as that Recruiter (or use known test data) → refetch contributions → `candidates` increments (if create happened after migration).

**Admin**

4. List shows Recruiters only → contributions **200** for a Recruiter.
5. Manually call API with a SuperAdmin user id (devtools) → **403** toast.

**Recruiter**

6. `/users` not reachable; no **other-user** contributions UI.
7. `GET /api/auth/me/contributions` → **200** (own counts).
8. `GET /api/users/5/contributions` → **403**.

**Self (all roles)**

9. `GET /api/auth/me/contributions` → **200**; `id` matches `GET /api/auth/me`.
10. `GET /api/users/{ownId}/contributions` as Admin/SuperAdmin → **403** (use me route).

**Edge cases**

11. Invalid id `GET /api/users/999999/contributions` → **404**.
12. Delete user while admin contributions panel open → **404** on refetch or refresh list.
13. All zeros after fresh deploy → still **200**; UI shows zeros without error.

---

## 10. Deploy coordination

| Component | Requirement |
|-----------|-------------|
| API | `AuthController.GetMyContributions`, `UsersController.GetContributions` |
| Database | Migration **`20260924173606_AddCreatedByUserId`** on each environment |
| FE | Can ship **before** or **after** migration; until migration, endpoint works but counts stay **0** for new creates until column exists |

Order for meaningful QA: **migrate DB → deploy API → deploy FE**.

---

## 11. v2 (backend not implemented — do not FE-scope)

- Per-entity contribution **lists** with paging  
- `createdBy` on entity DTOs  
- Backfilled historical attribution  

---

## 12. Backend constraints the FE must respect (not UX decisions)

| Topic | Rule |
|-------|------|
| **Self** | Use **`GET /api/auth/me/contributions`** (all roles). Do **not** use `GET /api/users/{ownId}/contributions` — **403** |
| **SuperAdmin targets** | Not in list scope → **403** if contributions API is called for their id |
| **Recruiter viewer** | **403** on all `/api/users/**` — do not expose UI |
| **Historical data** | Pre-migration rows have NULL creator → counts may be **0** even when the user “owns” data in a business sense |

All presentation choices beyond these rules are **frontend-owned** (§2.3).
