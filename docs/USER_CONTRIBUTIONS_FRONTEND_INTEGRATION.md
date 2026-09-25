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
| **Feature** | Show **how many active records** a managed user **created** in five areas: candidates, employers, projects, universities, certifications. |
| **API** | Single read: **`GET /api/users/{id}/contributions`** |
| **Who sees UI** | **SuperAdmin** and **Admin** only (same gate as `/users`) |
| **Who can be viewed** | Same users as in **`GET /api/users`** list scope (backend visibility **Option A**) — if the row is in the table, the contributions call should **200** |
| **v1 limits** | **Counts only** — no lists, no links to filtered entity pages, no `createdBy` on candidate/employer/etc. DTOs |
| **Data caveat** | Rows created **before** migration `20260924173606_AddCreatedByUserId` have **no** creator → counts stay **0** until that user creates **new** rows after deploy |

---

## 2. Product scope (what to build / not build)

### 2.1 In scope (v1)

- Fetch contribution counts for a **user id** that is in scope for the signed-in Admin/SuperAdmin (typically an id from **`GET /api/users`**).
- Display five non-negative integers with clear labels.
- Loading and error handling consistent with the rest of the Users admin module.
- **Read-only** — no mutations; no new **API** routes (FE may add routes or not — **UX is entirely a frontend decision**).

### 2.2 Out of scope (v1) — do **not** implement

| Item | Reason |
|------|--------|
| Drill-down to filtered candidate/employer/etc. lists | Backend does not expose list-by-creator APIs |
| `createdBy` column on entity tables | Not on entity DTOs |
| Recruiter “my contributions” / profile | Not in API scope; Recruiter gets **403** on `/api/users/**` |
| SuperAdmin / self contribution views | Targets outside list scope → **403**; self not in list |
| Caching counts across sessions | Optional; no backend cache — refetch on open is fine |

### 2.3 UX and layout (frontend-owned)

The API does **not** specify screens, components, routes, or interaction patterns. The **frontend team / FE agent** decides:

- Where counts appear (table, dialog, drawer, dedicated page, etc.)
- When to call the API (on row select, on edit open, on button click, etc.)
- Copy, icons, density, and whether to show explanatory text about pre-migration data

**Hard requirements** (contract + RBAC — not negotiable in v1):

| Requirement | Detail |
|-------------|--------|
| **Gate** | Only **SuperAdmin** and **Admin** see or trigger this feature (same as `/users`) |
| **Target id** | Call `GET /api/users/{id}/contributions` only for users the viewer is allowed to manage (see §3.2) |
| **Create-user flow** | No `id` until after `POST /api/users` — do not call contributions during create unless FE explicitly loads after **201** (unusual; not required by backend) |
| **Data shown** | All five keys under `counts` on **200**; treat **0** as valid |
| **No scope creep** | No drill-down lists, no entity-module changes (§2.2) |

**FE agent:** Discover the Users admin implementation in the Next.js repo (see [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md) for illustrative file names) and integrate using the same auth client, guards, and error/toast patterns as existing users CRUD.

---

## 3. Access control

### 3.1 Viewer (signed-in user)

| `user.role` | Show contributions UI? | Call `GET /api/users/{id}/contributions`? |
|-------------|--------------------------|-------------------------------------------|
| **0** SuperAdmin | Yes (on `/users`) | Yes |
| **1** Admin | Yes (on `/users`) | Yes |
| **2** Recruiter | **No** — hide nav/route (already) | **403** on all `/api/users` |

Use the same guard as Users admin:

```typescript
import { UserRole } from '@/lib/types/user-role' // match existing RBAC types

export function canAccessUsersAdmin(role: UserRole): boolean {
  return role === UserRole.SuperAdmin || role === UserRole.Admin
}
```

Do **not** prefetch contributions for Recruiter (avoid noisy **403** in network tab).

### 3.2 Target user (whose counts are shown)

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

### 4.1 Request

```http
GET /api/users/{id}/contributions
Authorization: Bearer <accessToken>
```

| Part | Detail |
|------|--------|
| `{id}` | Target user id (`number` / `long`) |
| Query params | **None** |
| Body | **None** |

Use the same **authenticated fetch helper** as `users-api.ts` (Bearer + base URL from `NEXT_PUBLIC_API_URL` / project convention).

### 4.2 Success `200`

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

### 4.3 Errors

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

Extend the users service file (illustrative path: `src/lib/services/users-api.ts`):

```typescript
import type { UserContributions } from '@/lib/types/user-contributions'
import { authenticatedFetch } from '@/lib/services/api-client' // match FE repo

export async function fetchUserContributions(userId: number): Promise<UserContributions> {
  const response = await authenticatedFetch(`/api/users/${userId}/contributions`)
  if (!response.ok) {
    throw await toApiError(response) // use existing helper that calls extractApiErrorMessage
  }
  return response.json() as Promise<UserContributions>
}
```

**Rules:**

- No query params.
- Do not send `userId` in body.
- Throw on non-OK so the UI layer can toast (same as `deleteUser`, `createUser`, etc.).

---

## 7. UI integration guide

### 7.1 Data loading

| Event | Action |
|-------|--------|
| Open contributions UI for user `id` | `fetchUserContributions(id)` |
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
| API | `src/lib/services/users-api.ts` | Add `fetchUserContributions` |
| UI | Users module components (paths vary) | Integrate fetch + display per §2.3 |
| Guards | Existing Users route guard | No change if Recruiter already blocked |

---

## 9. Implementation checklist (AI agent)

Work in order; reference in PR description.

### 9.1 Types & client

- [ ] Add `UserContributions` + `UserContributionCounts` types
- [ ] Add `fetchUserContributions(userId)` using authenticated fetch
- [ ] Reuse existing API error helper for **401** / **403** / **404**

### 9.2 UI

- [ ] Gate feature with `canAccessUsersAdmin(session.user.role)`
- [ ] Integrate fetch + UI per frontend UX choice (§2.3); only for in-scope user ids (§3.2)
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

6. `/users` not reachable; no contributions UI.
7. `GET /api/users/5/contributions` → **403**.

**Edge cases**

8. Invalid id `GET /api/users/999999/contributions` → **404**.
9. Delete user while contributions panel open → **404** on refetch or refresh list.
10. All zeros after fresh deploy → still **200**; UI shows zeros without error.

---

## 10. Deploy coordination

| Component | Requirement |
|-----------|-------------|
| API | Shipped with `UsersController.GetContributions` |
| Database | Migration **`20260924173606_AddCreatedByUserId`** on each environment |
| FE | Can ship **before** or **after** migration; until migration, endpoint works but counts stay **0** for new creates until column exists |

Order for meaningful QA: **migrate DB → deploy API → deploy FE**.

---

## 11. v2 (backend not implemented — do not FE-scope)

- Per-entity contribution **lists** with paging  
- Self-service profile contributions  
- `createdBy` on entity DTOs  
- Backfilled historical attribution  

---

## 12. Backend constraints the FE must respect (not UX decisions)

| Topic | Rule |
|-------|------|
| **Self** | Signed-in user is excluded from `GET /api/users` — there is **no** v1 API path for “my contributions” via users admin |
| **SuperAdmin targets** | Not in list scope → **403** if contributions API is called for their id |
| **Recruiter viewer** | **403** on all `/api/users/**` — do not expose UI |
| **Historical data** | Pre-migration rows have NULL creator → counts may be **0** even when the user “owns” data in a business sense |

All presentation choices beyond these rules are **frontend-owned** (§2.3).
