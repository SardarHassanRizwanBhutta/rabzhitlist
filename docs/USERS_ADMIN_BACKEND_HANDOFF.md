# Users admin — backend handoff

**Status:** Implemented in `MyApp.API`.  
**Audience:** Backend team.  
**Frontend integration:** [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md)  
**Related:** [`AUTH_LOGIN_BACKEND_HANDOFF.md`](./AUTH_LOGIN_BACKEND_HANDOFF.md) (`users` table, Identity password hashing)

---

## 1. Summary

| Item | Detail |
|------|--------|
| **Goal** | Authenticated admins manage application users (list, create, update, soft-delete). |
| **Auth** | All routes require **JWT Bearer** (same as other `/api/**` routes). |
| **Authorization** | **No roles yet** — any signed-in user may call these endpoints (match current auth model). |
| **Soft delete** | Set `deleted_at`; excluded from list and from login (`GET /api/auth/me`). |
| **Password** | ASP.NET Identity hasher (same as login / seed / `UserPasswordHashGen`). |

---

## 2. Data model (existing)

Table `users` (see auth handoff):

| Column | Notes |
|--------|--------|
| `full_name` | Display name |
| `email` | `citext`, unique among rows where `deleted_at IS NULL` |
| `password` | Identity hash |
| `created_at`, `updated_at`, `deleted_at` | Timestamps |

List/detail DTOs must **not** expose `password`.

---

## 3. Endpoints

Base path: **`/api/users`**

### 3.1 `GET /api/users` — paged list

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `pageNumber` | int | no | Default `1`, min `1` |
| `pageSize` | int | no | Default `20`, max e.g. `100` |
| `fullName` | string | no | Case-insensitive **contains** filter on `full_name` |
| `email` | string | no | Case-insensitive **contains** filter on `email` |

**Rules:**

- Only rows with **`deleted_at IS NULL`**.
- **Exclude** the **currently authenticated** user (by JWT `sub` / user id).
- Order by **`created_at` DESC** (recommended; FE also sorts current page client-side).

**200 response:**

```json
{
  "items": [
    {
      "id": 1,
      "fullName": "Rabiah Zareen",
      "email": "rabiah.z@dplit.com",
      "createdAt": "2026-09-21T11:31:07Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 3,
  "totalPages": 1,
  "hasPrevious": false,
  "hasNext": false
}
```

Shape matches other paged APIs in this solution (e.g. certifications).

---

### 3.2 `POST /api/users` — create

**Request:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane.d@dplit.com",
  "password": "initial-secret"
}
```

| Field | Validation |
|-------|------------|
| `fullName` | **Required** on create; trimmed, reasonable max length |
| `email` | **Required** on create; valid email, unique among non-deleted users |
| `password` | **Required** on create; min **8** characters (same rule as change-password) |

**201:** Created user DTO (same fields as list item).

**400:** Validation errors.  
**409:** Email already in use (non-deleted).

---

### 3.3 `PUT /api/users/{id}` — update

**Request:**

```json
{
  "fullName": "Jane Doe",
  "email": "jane.d@dplit.com",
  "password": "optional-new-password"
}
```

| Field | Validation |
|-------|------------|
| `fullName` | Required |
| `email` | Required, unique among non-deleted (exclude current id) |
| `password` | Optional; if omitted or empty, **do not** change hash; if provided, min 8 chars and re-hash |

**200:** Updated user DTO.

**404:** Unknown id or soft-deleted user.  
**400 / 409:** Same as create.

---

### 3.4 `DELETE /api/users/{id}` — soft delete

**204** No Content on success.

**404:** Unknown id or already deleted.

**400 (recommended):** Cannot delete the **currently authenticated** user (prevent self-lockout). Message e.g. `"You cannot delete your own account."`

Implementation: set `deleted_at` and `updated_at`; do not remove row.

---

## 4. Implementation (shipped)

| Area | Path / detail |
|------|----------------|
| DTOs | `UserFilterRequest`, `UserListItemDto`, `CreateUserRequest`, `UpdateUserRequest` |
| Service | `UserAdminService` |
| Repository | `UserRepository` / `IUserRepository` (list filters, soft delete) |
| API | `UsersController` at `/api/users` |
| Errors | `ConflictException` + `ConflictExceptionFilter` (duplicate email → **409**) |

**Migration:** None — uses existing `users` table.

---

## 5. Frontend expectations

- Route: **`/users`**, table columns **Full name**, **Email**, **Created At**; create / edit / delete wired to the endpoints above.
- `createdAt` displayed with `Date#toLocaleDateString()` (same as candidates table).
- FE client: `src/lib/services/users-api.ts` (Bearer via shared `apiFetch`).
- **`GET /api/users` never includes the signed-in user** — see [`USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md).

---

## 6. Test checklist (backend)

- [x] List excludes soft-deleted users
- [x] List excludes authenticated caller (`GET /api/users`)
- [x] Filters `fullName` / `email` work case-insensitively (ILIKE)
- [x] Create with duplicate email → 409
- [x] Update email to existing → 409
- [x] Update without password leaves hash unchanged
- [x] Delete sets `deleted_at`; user cannot login
- [x] Delete self → 400 (`You cannot delete your own account.`)
- [x] All routes require valid Bearer token
