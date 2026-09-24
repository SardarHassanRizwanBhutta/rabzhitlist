# Users admin — frontend integration

**Status:** Implemented — FE wired to `/api/users`; **RBAC v1** adds **`role`** and restricts access to **SuperAdmin + Admin** (Recruiter → **403**).  
**Backend contract:** [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md)  
**RBAC (guards, role assignment rules, 403 messages):** [`RBAC_FRONTEND_INTEGRATION.md`](./RBAC_FRONTEND_INTEGRATION.md) §7  
**Auth (`role` on session):** [`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md)  
**List excludes signed-in user:** [`USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md)

---

## Access control (RBAC v1)

| Role | `/users` UI | `/api/users` |
|------|-------------|----------------|
| **SuperAdmin (0)** | Allowed | List/manage **Admin + Recruiter** only (no SuperAdmin rows; signed-in user excluded from list) |
| **Admin (1)** | Allowed | List/manage **Recruiter** only |
| **Recruiter (2)** | **Hide route / nav** | **403** on all methods |

**Route guard:** Require **`role === 0` or `role === 1`** (not “any signed-in user”). Redirect or show forbidden for Recruiter.

---

## Backend summary

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/users` | JWT; **Admin/SuperAdmin only**; paged (`pageNumber`, `pageSize` default 20, max 100); filters `fullName`, `email` (ILIKE); active users only; `created_at` DESC; **excludes current user** |
| `POST` | `/api/users` | **201** + user DTO; **`role` required**; duplicate email **409** |
| `PUT` | `/api/users/{id}` | **`role` required**; optional `password` (blank/omitted = unchanged); **404** / **409** / **403** |
| `DELETE` | `/api/users/{id}` | Soft delete **204**; self-delete **400** — `You cannot delete your own account.` |

**Deploy:** API image + DB migration **`20260923212300_AddUserRole`** on prod (`dotnet ef database update`).

**List item shape (`200` / `201`):**

```json
{
  "id": 2,
  "fullName": "Muhammad Reyyan",
  "email": "reyyan.m@dplit.com",
  "role": 1,
  "createdAt": "2026-09-21T11:57:26Z"
}
```

| `role` | Meaning |
|-------:|---------|
| `0` | SuperAdmin (not shown in list for SuperAdmin viewer) |
| `1` | Admin |
| `2` | Recruiter |

---

## Route & navigation

| Item | Value |
|------|--------|
| Path | `/users` |
| Sidebar | **Users**, `UserCog` icon — **visible only for SuperAdmin + Admin** |
| Guard | `role === 0 \|\| role === 1` (e.g. extend `DashboardAuthGuard` or dedicated `UsersAdminGuard`) |

---

## Files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/users/page.tsx` | Page shell + Suspense |
| `src/components/users-page-client.tsx` | Fetch, filters, CRUD handlers |
| `src/components/users-table.tsx` | Sortable table, pagination, delete confirm |
| `src/components/users-filter-dialog.tsx` | Full name + email search filters |
| `src/components/user-form-dialog.tsx` | Create / edit user (+ **role**) |
| `src/lib/services/users-api.ts` | API client |
| `src/lib/types/app-user.ts` | `AppUser` type (+ **`role`**) |

Paths are illustrative — confirm in the FE repo.

---

## API client

- `fetchUsersPage({ fullName?, email?, pageNumber, pageSize })`
- `createUser({ fullName, email, password, role })` — **`role` required** (`1` or `2` for SuperAdmin; `2` only for Admin)
- `updateUser(id, { fullName, email, password?, role })` — **`role` required**
- `deleteUser(id)`

**403** responses (forbidden role assignment or out-of-scope user): JSON `{ "status": 403, "message": "..." }` — see [`RBAC_FRONTEND_INTEGRATION.md`](./RBAC_FRONTEND_INTEGRATION.md) §7.3.

Errors surface via `extractApiErrorMessage` + toasts (including **409** conflict and **400** self-delete / `Role is required`).

---

## Role assignment (create / edit)

| Viewer | Role options in UI | Users visible in list |
|--------|--------------------|------------------------|
| **SuperAdmin** | Assign **Admin (1)** or **Recruiter (2)** only — never SuperAdmin | Admin + Recruiter rows |
| **Admin** | Assign **Recruiter (2)** only | Recruiter rows only |

Do not offer SuperAdmin in the role dropdown.

---

## UX parity

Matches certifications list pattern:

- Server-side paging + filter query params
- **`GET /api/users` omits the signed-in user** — see dedicated doc above for paging, `totalCount`, empty states, and smoke tests
- Client-side sort on **current page** (Full name, Email, **Role**, Created At)
- Rows-per-page selector (10 / 20 / 50 / 100)
- Filter dialog with active filter count badge

---

## Create / edit form

| Field | Create | Edit |
|-------|--------|------|
| Full name | **Required** | Required |
| Email | **Required** | Required |
| Password | **Required**, min 8 characters | Optional (blank = unchanged) |
| **Role** | **Required** (see assignment table) | **Required** |

Display labels: Super Admin / Admin / Recruiter for values 0 / 1 / 2 (only show assignable values in the select).

---

## Created At display

ISO string from API → `new Date(createdAt).toLocaleDateString()` (same helper pattern as `candidates-table`).

---

## Post-backend / RBAC checklist

- [ ] Recruiter cannot open `/users` or call users API
- [ ] SuperAdmin list shows Admin + Recruiter with **role** column
- [ ] Admin list shows Recruiters only; create/edit only `role: 2`
- [ ] Create user with `role` → appears in list; can login with new password
- [ ] Edit name/email/role; optional password change works
- [ ] Delete user → removed from list; login fails
- [ ] Delete current user → error toast, session intact
- [ ] Filters narrow results
- [ ] **403** toasts show server `message` for invalid role assignment
