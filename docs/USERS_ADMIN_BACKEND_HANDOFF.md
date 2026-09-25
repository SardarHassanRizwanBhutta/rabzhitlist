# Users admin — backend handoff

**Status:** Implemented in `MyApp.API` (includes **RBAC v1** on `/api/users`).  
**Audience:** Backend team.  
**Frontend integration:** [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md)  
**RBAC (roles, candidates, dashboard):** [`RBAC_BACKEND_HANDOFF.md`](./RBAC_BACKEND_HANDOFF.md)  
**User contributions (counts):** [`USER_CONTRIBUTIONS_BACKEND_HANDOFF.md`](./USER_CONTRIBUTIONS_BACKEND_HANDOFF.md)  
**Related:** [`AUTH_LOGIN_BACKEND_HANDOFF.md`](./AUTH_LOGIN_BACKEND_HANDOFF.md) (`users` table, JWT, Identity password hashing)

---

## 1. Summary

| Item | Detail |
|------|--------|
| **Goal** | **SuperAdmin** and **Admin** manage application users (list, create, update, soft-delete). |
| **Auth** | All routes require **JWT Bearer** (global fallback on `/api/**`). |
| **Authorization** | **`[AdminOnly]`** on `UsersController` — **Recruiter (`role` 2) → 403** on all methods. SuperAdmin vs Admin **scope** enforced in `UserAdminService` + `UserRoleAdminRules`. |
| **Soft delete** | Set `deleted_at`; excluded from list and from login (`GET /api/auth/me`). |
| **Password** | ASP.NET Identity hasher (same as login / seed / `UserPasswordHashGen`). |
| **`role`** | Required on create/update; returned on list/create/update DTOs. |

---

## 2. Data model

Table `users`:

| Column | Notes |
|--------|--------|
| `full_name` | Display name |
| `email` | `citext`, unique among rows where `deleted_at IS NULL` |
| `password` | Identity hash |
| `role` | PostgreSQL enum `user_role`: `super_admin` (0), `admin` (1), `recruiter` (2) — see §2.1 |
| `created_at`, `updated_at`, `deleted_at` | Timestamps |

List/detail DTOs must **not** expose `password`.

**Migration:** `20260923212300_AddUserRole` — adds `role` column; seeds SuperAdmins (Rabiah, Syed, Hassan, Ahmed) and Admin (Reyyan). Default for new column: Recruiter.

### 2.1 Role enum (API JSON)

| Value | `UserRole` | PG label |
|------:|------------|----------|
| **0** | SuperAdmin | `super_admin` |
| **1** | Admin | `admin` |
| **2** | Recruiter | `recruiter` |

JWT claim **`role`** = string `"0"` \| `"1"` \| `"2"` (see auth handoff). Login / `me` return numeric `role`.

---

## 3. Authorization rules

Implemented in `MyApp.Application/Users/UserRoleAdminRules.cs` and `UserAdminService`.

### 3.1 Who may call `/api/users`

| Caller role | Access |
|-------------|--------|
| **Recruiter** | **403** — `ForbiddenException` (default message or filter JSON — see §3.5) |
| **Admin** | List/create/update/delete **Recruiter** users only |
| **SuperAdmin** | List/create/update/delete **Admin + Recruiter** only (never SuperAdmin rows in list; cannot assign SuperAdmin) |

### 3.2 List visibility

- Filter `users.role` to roles in `VisibleRolesForList(viewer)`:
  - SuperAdmin → Admin, Recruiter
  - Admin → Recruiter only
- **Exclude** authenticated user id from list (unchanged from pre-RBAC).
- SuperAdmin users **do not appear** in the list for any viewer (including other SuperAdmins).

### 3.3 Create — assignable roles

| Viewer | May set `role` to |
|--------|-------------------|
| SuperAdmin | **1** Admin or **2** Recruiter |
| Admin | **2** Recruiter only |

**403** if SuperAdmin sends `role: 0` (`CannotAssignSuperAdminMessage`).

### 3.4 Update / delete guards

- Cannot manage a user whose `role` is outside the viewer’s visible set → **403**.
- Cannot demote or delete the **last active SuperAdmin** → **403** (`LastSuperAdminMessage`).
- Cannot delete self → **400** (`You cannot delete your own account.`).

### 3.5 Error shapes

| Status | When | Body |
|--------|------|------|
| **403** | Recruiter, forbidden role assignment, out-of-scope target, last SuperAdmin | `{ "status": 403, "message": "..." }` via `ForbiddenExceptionFilter` |
| **400** | Validation, self-delete, missing `role` | JSON string (e.g. `"Role is required."`) via `ValidationExceptionFilter` |
| **409** | Duplicate email | Via `ConflictExceptionFilter` |

**403 message constants:**

| Message | When |
|---------|------|
| `You do not have permission to perform this action.` | Default / Recruiter on users API |
| `You cannot assign the SuperAdmin role.` | SuperAdmin tries `role: 0` on create/update |
| `Admins can only manage Recruiter accounts.` | Admin assigns non-Recruiter |
| `At least one SuperAdmin must remain in the system.` | Last SuperAdmin demotion/delete |

---

## 4. Endpoints

Base path: **`/api/users`** — controller: `UsersController` (`[AdminOnly]`).

### 4.1 `GET /api/users` — paged list

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `pageNumber` | int | no | Default `1`, min `1` |
| `pageSize` | int | no | Default `20`, max `100` |
| `fullName` | string | no | Case-insensitive **contains** on `full_name` |
| `email` | string | no | Case-insensitive **contains** on `email` |

**Rules:** active users only; role filter per §3.2; exclude current user; `created_at` DESC.

**200 response:**

```json
{
  "items": [
    {
      "id": 2,
      "fullName": "Muhammad Reyyan",
      "email": "reyyan.m@dplit.com",
      "role": 1,
      "createdAt": "2026-09-21T11:57:26Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 2,
  "totalPages": 1,
  "hasPrevious": false,
  "hasNext": false
}
```

---

### 4.2 `POST /api/users` — create

**Request:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane.d@dplit.com",
  "password": "initial-secret",
  "role": 2
}
```

| Field | Validation |
|-------|------------|
| `fullName` | **Required**; trimmed; max length enforced in service |
| `email` | **Required**; valid email; unique among non-deleted |
| `password` | **Required**; min **8** characters |
| `role` | **Required** (`null`/omitted → **400** `"Role is required."`); must be assignable per §3.3 |

**201:** `UserListItemDto` (includes `role`).

**400:** Validation.  
**403:** Role rules (§3).  
**409:** Email already in use.

---

### 4.3 `PUT /api/users/{id}` — update

**Request:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane.d@dplit.com",
  "password": "optional-new-password",
  "role": 2
}
```

| Field | Validation |
|-------|------------|
| `fullName` | Required |
| `email` | Required; unique among non-deleted (exclude current id) |
| `password` | Optional; empty/omitted → hash unchanged; if set, min 8 chars |
| `role` | **Required**; assignable per §3.3; last-SuperAdmin rules §3.4 |

**200:** Updated `UserListItemDto`.

**404:** Unknown or soft-deleted id.  
**400 / 403 / 409:** As above.

---

### 4.4 `DELETE /api/users/{id}` — soft delete

**204** on success.

**404:** Unknown or already deleted.  
**400:** Self-delete.  
**403:** Out-of-scope target or last SuperAdmin.

---

### 4.5 Contribution counts (v1)

| Route | Who |
|-------|-----|
| `GET /api/auth/me/contributions` | **Any** authenticated role — **own** counts |
| `GET /api/users/{id}/contributions` | **Admin/SuperAdmin** — **other** users in list scope (not self) |

See [`USER_CONTRIBUTIONS_BACKEND_HANDOFF.md`](./USER_CONTRIBUTIONS_BACKEND_HANDOFF.md) for full rules.

**200:** `UserContributionsDto` — user header + `counts` for candidates, employers, projects, universities, certifications (active rows only).

**403:** Recruiter or target outside list/manage scope.  
**404:** Unknown or soft-deleted user.

---

## 5. Implementation (shipped)

| Area | Path / detail |
|------|----------------|
| Enum | `MyApp.Domain/Enums/UserRole.cs` |
| Entity | `User.Role` on `MyApp.Domain/Entities/User.cs` |
| DTOs | `UserListItemDto` (+ `role`), `CreateUserRequest`, `UpdateUserRequest` (+ `UserRole? Role`) |
| Rules | `MyApp.Application/Users/UserRoleAdminRules.cs` |
| Service | `UserAdminService` (viewer role from controller) |
| Repository | `UserRepository` — `allowedRoles` on paged list, `CountActiveSuperAdminsAsync`, `UpdateAsync` includes role |
| API | `UsersController` — `[AdminOnly]`; passes `ICurrentUserAccessor` role into service; `GET {id}/contributions` → `UserAdminService.GetContributionsAsync` |
| Contributions | `USER_CONTRIBUTIONS_BACKEND_HANDOFF.md`; migration `20260924173606_AddCreatedByUserId` |
| Auth attribute | `AdminOnlyAttribute` → policy `ExcludeRecruiter` |
| Errors | `ForbiddenException` + `ForbiddenExceptionFilter`; `ConflictException` → **409** |

---

## 6. Frontend expectations

See [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md): **`/users`** only for Admin/SuperAdmin; **Role** column and required on create/edit; Recruiter must not see nav or call API.

---

## 7. Test checklist (backend)

### Pre-RBAC (still valid)

- [x] List excludes soft-deleted users
- [x] Filters `fullName` / `email` (ILIKE)
- [x] Create duplicate email → 409
- [x] Update email conflict → 409
- [x] Update without password leaves hash unchanged
- [x] Delete sets `deleted_at`; user cannot login
- [x] Delete self → 400
- [x] Valid Bearer required

### RBAC v1

- [ ] Recruiter token → **403** on GET/POST/PUT/DELETE `/api/users`
- [ ] SuperAdmin list: only Admin + Recruiter; no self; no SuperAdmin rows
- [ ] Admin list: only Recruiter
- [ ] SuperAdmin create `role: 2` and `role: 1` → 201; `role: 0` → 403
- [ ] Admin create `role: 2` → 201; `role: 1` → 403
- [ ] Create/update without `role` → 400
- [ ] Demote/delete last SuperAdmin → 403
- [ ] Response includes `role` on all user DTOs
