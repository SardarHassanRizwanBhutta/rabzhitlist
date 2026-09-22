# Users admin list — exclude signed-in user (frontend integration)

**Status:** Backend **shipped** — FE should align expectations and smoke tests with this behavior.  
**Parent docs:** [`USERS_ADMIN_FRONTEND_INTEGRATION.md`](./USERS_ADMIN_FRONTEND_INTEGRATION.md), [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md)  
**Audience:** Frontend AI agent / developers working on the Next.js app.

---

## 1. Summary of the change

| Before (incorrect assumption) | After (current API) |
|-------------------------------|---------------------|
| `GET /api/users` returned **all** active users, including the caller | `GET /api/users` returns **all active users except the caller** |
| `totalCount` = count of every active user | `totalCount` = count **after** excluding the signed-in user |
| Paging applied to the full set | Paging applies to the **filtered** set (no self row) |

The backend derives the caller from the **JWT Bearer** token (`sub` claim = application user id). No new query parameters were added; exclusion is **always on** for `GET /api/users`.

---

## 2. What did **not** change

| Area | Behavior |
|------|----------|
| **Auth** | All `/api/users` routes still require `Authorization: Bearer <accessToken>`. |
| **Request shape** | `GET` query params unchanged: `pageNumber`, `pageSize`, `fullName`, `email`. |
| **Response shape** | Same paged wrapper and `UserListItemDto` fields: `id`, `fullName`, `email`, `createdAt`. |
| **`POST /api/users`** | Create another user — unchanged. |
| **`PUT /api/users/{id}`** | Update any active user by id — **including your own id** if the FE calls it (list simply does not show your row). |
| **`DELETE /api/users/{id}`** | Soft delete — unchanged; **self-delete still returns 400** with message `You cannot delete your own account.` |
| **Filters** | `fullName` / `email` still case-insensitive **contains** (ILIKE); applied **after** excluding self. |
| **Sort order** | Server: `created_at` DESC. Client-side sort on current page unchanged. |

There is **no** new endpoint to “list including self” in v1.

---

## 3. `GET /api/users` — detailed contract

### 3.1 Request

```http
GET /api/users?pageNumber=1&pageSize=20
Authorization: Bearer <accessToken>
```

Optional query (unchanged):

| Param | Description |
|-------|-------------|
| `fullName` | Filter: `full_name` contains value (case-insensitive) |
| `email` | Filter: `email` contains value (case-insensitive) |
| `pageNumber` | Default `1`, minimum effective `1` |
| `pageSize` | Default `20`, maximum `100` |

The FE **must not** send a “exclude user id” param — the server ignores such a param if added client-side.

### 3.2 Who is excluded

- The user whose **id** matches the JWT **`sub`** claim (same id as `GET /api/auth/me` → `id`).
- Only that **one** row is excluded.
- Soft-deleted users are never listed (unchanged).

### 3.3 Response semantics (important for paging UI)

Example: **5** active users in the database, you are user **id = 3**.

| Field | Value | Meaning |
|-------|-------|---------|
| `items` | Length ≤ `pageSize`, **never includes your user** | Other users only |
| `totalCount` | **4** | Active users minus you (and minus anyone filtered out by `fullName`/`email`) |
| `totalPages` | `ceil(totalCount / pageSize)` | Based on excluded set |
| `hasNext` / `hasPrevious` | Standard | Based on excluded set |

**Implications for the FE:**

1. **Do not** expect your own email/name to appear in the Users table after a successful load.
2. **Do not** client-filter out the current user if the API already excludes you — redundant, but harmless if `me.id` is missing; prefer trusting the API.
3. **Pagination labels** (“Showing X of Y”) should use API `totalCount`, not “users in DB” or `items.length` on page 1 alone.
4. If you are the **only** active user, expect `totalCount: 0`, `items: []` — empty state is **valid**, not an error.
5. **Empty list ≠ auth failure** — distinguish **401** (no/invalid token) from **200** with empty `items`.

### 3.4 Example response (caller excluded)

Caller: `hassan.b@dplit.com` (id `6`). DB has 5 active users including Hassan.

```json
{
  "items": [
    {
      "id": 5,
      "fullName": "Syed Ahmad",
      "email": "syed@dplit.com",
      "createdAt": "2026-09-22T10:04:28Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 4,
  "totalPages": 1,
  "hasPrevious": false,
  "hasNext": false
}
```

Note: **no** item with `id: 6` even though Hassan exists in `users`.

### 3.5 Errors

| Status | When |
|--------|------|
| **401** | Missing/invalid/expired Bearer token, soft-deleted caller, or JWT without a parseable `sub` / user id |
| **200** | Valid token; list may be empty |

Validation errors on **GET** are unchanged (invalid paging is clamped server-side).

---

## 4. Frontend integration guidance

### 4.1 API client (`users-api.ts`)

No signature change required for `fetchUsersPage({ fullName?, email?, pageNumber, pageSize })`.

Ensure every call still uses the shared **authenticated** fetch helper (Bearer token).

### 4.2 Users page / table

| Topic | Recommendation |
|-------|----------------|
| **Empty state** | Copy like “No other users” or “No users match filters” when `items.length === 0` and **200** — avoid implying the API failed. |
| **Edit self from table** | Your row is **not** in the list — you cannot open edit/delete for **your** account from this table unless the FE adds a separate Profile/Account UI that calls `PUT /api/users/{me.id}`. |
| **Delete self** | Still impossible via API (**400**). Delete button should only exist for rows returned (other users). |
| **Create user** | Unchanged; new user appears in list on refresh (they are a different id). |
| **Filters** | If filter matches **only** your email, expect **empty** `items` with `totalCount: 0`. |

### 4.3 Session / `GET /api/auth/me`

Keep using `me` for header display (name/email). Do **not** use the users list as the source of truth for the signed-in identity.

### 4.4 Client-side sort

Still sorts **only the current page** (`items`). Excluding self does not change that pattern; sort keys remain `fullName`, `email`, `createdAt`.

---

## 5. What the FE should **not** do

- Assume `totalCount` equals the number of rows in the `users` table.
- Show an error when the signed-in user is absent from `items` (that is **correct**).
- Add `excludeUserId` or similar query params (server does not document support).
- Rely on deleting or editing “your” row from the admin table without a separate account/settings flow.

---

## 6. Smoke test checklist (frontend)

Prerequisites: API running with this behavior; logged in as user **A**.

1. **List:** Open `/users` — user **A**’s email **not** in the table.
2. **Count:** Note `totalCount` from network tab (or UI) — should be **(active users in DB − 1 − filter effect)**.
3. **Other user:** Row for user **B** visible; edit/delete **B** still works.
4. **Create:** Create user **C** → **C** appears; **A** still absent.
5. **Filter:** Filter by **A**’s email → empty list, **200**, not **401**.
6. **Only user in system:** If **A** is the sole active user → empty list, **200**.
7. **Self delete:** Attempt delete **A** via API (if UI ever allows) → **400** toast; session intact.
8. **Logout/login as B:** **B** not in list; **A** now visible.

---

## 7. Backend reference (for debugging)

| Layer | Responsibility |
|-------|----------------|
| `UsersController.GetAll` | Resolves current user id from JWT; **401** if missing |
| `UserAdminService.GetPagedAsync` | Passes `currentUserId` into repository |
| `UserRepository.GetPagedAsync` | `WHERE id != excludeUserId` (and `deleted_at IS NULL`, filters, paging) |

Related auth: [`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md).

---

## 8. Deploy note

This is **API-only** logic — no database migration. Ship an updated API Docker image to EC2; FE changes are **behavioral/documentation** unless you add empty-state copy or remove incorrect client-side “filter self” hacks.

---

## 9. Open questions (resolve in FE repo only)

1. Should the product add a **Profile / Account settings** page for `PUT /api/users/{me.id}` and `POST /api/auth/change-password` since the admin list no longer shows self?
2. Should empty-state messaging differ when **filters are active** vs **no other users exist**?

If product owner has no preference, keep current certifications-style empty states and rely on filter badge for context.
