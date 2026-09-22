# Users admin — frontend integration

**Status:** Implemented — FE wired to shipped `/api/users` (see post-backend checklist for manual smoke).  
**Backend contract:** [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md)  
**List excludes signed-in user:** [`USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md)

---

## Backend summary (shipped)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/users` | JWT; paged (`pageNumber`, `pageSize` default 20, max 100); filters `fullName`, `email` (ILIKE); active users only; `created_at` DESC |
| `POST` | `/api/users` | **201** + `UserListItemDto`; duplicate email **409** |
| `PUT` | `/api/users/{id}` | Optional `password` (blank/omitted = unchanged); **404** / **409** |
| `DELETE` | `/api/users/{id}` | Soft delete **204**; self-delete **400** — `You cannot delete your own account.` |

**Deploy:** New API image only on prod (no DB migration for this feature).

---

## Route & navigation

| Item | Value |
|------|--------|
| Path | `/users` |
| Sidebar | **Users**, `UserCog` icon |
| Guard | Dashboard layout (`DashboardAuthGuard`) — any signed-in user |

---

## Files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/users/page.tsx` | Page shell + Suspense |
| `src/components/users-page-client.tsx` | Fetch, filters, CRUD handlers |
| `src/components/users-table.tsx` | Sortable table, pagination, delete confirm |
| `src/components/users-filter-dialog.tsx` | Name + email search filters |
| `src/components/user-form-dialog.tsx` | Create / edit user |
| `src/lib/services/users-api.ts` | API client |
| `src/lib/types/app-user.ts` | `AppUser` type |

---

## API client

- `fetchUsersPage({ fullName?, email?, pageNumber, pageSize })`
- `createUser({ fullName, email, password })`
- `updateUser(id, { fullName, email, password? })`
- `deleteUser(id)`

Errors surface via `extractApiErrorMessage` + toasts (including **409** conflict and **400** self-delete message from API).

---

## UX parity

Matches certifications list pattern:

- Server-side paging + filter query params
- **`GET /api/users` omits the signed-in user** — see dedicated doc above for paging, `totalCount`, empty states, and smoke tests
- Client-side sort on **current page** (Full name, Email, Created At)
- Rows-per-page selector (10 / 20 / 50 / 100)
- Filter dialog with active filter count badge

---

## Create / edit form

| Field | Create | Edit |
|-------|--------|------|
| Full name | **Required** | Required |
| Email | **Required** | Required |
| Password | **Required**, min 8 characters | Optional (blank = unchanged) |

---

## Created At display

ISO string from API → `new Date(createdAt).toLocaleDateString()` (same helper pattern as `candidates-table`).

---

## Post-backend checklist

- [ ] Signed-in user **not** in table; `totalCount` excludes self (see [list exclude doc](./USERS_ADMIN_LIST_EXCLUDE_CURRENT_USER_FRONTEND_INTEGRATION.md))
- [ ] Sole active user → empty list **200**, “No other users” (not an error)
- [ ] Filter by own email → empty list **200**, “No users match filters”
- [ ] `GET /api/users` loads other seeded users
- [ ] Create user → appears in list; can login with new password
- [ ] Edit name/email; optional password change works
- [ ] Delete other user → removed from list; login fails
- [ ] Self-delete via API → **400** toast; session intact
- [ ] Filters narrow results for other users
