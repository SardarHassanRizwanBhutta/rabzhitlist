# User creator on admin profile — backend contract

**Status:** Implemented. Migration `20260928143000_AddUserCreatedByUserId` adds nullable `users.created_by_user_id`. Apply with `dotnet ef database update`.  
**Audience:** Backend agent.  
**Related:** [`USER_CONTRIBUTIONS_BACKEND_HANDOFF.md`](./USER_CONTRIBUTIONS_BACKEND_HANDOFF.md), [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md)

This adds who created a **user account**. It does not change contribution counts, list filters, or entity `created_by_user_id` columns.

---

## 1. Summary

| Item | Detail |
|------|--------|
| **Goal** | `/users/{id}` can show the account that created this user. |
| **Read** | `createdByFullName` on **`GET /api/users/{id}/contributions` only**. |
| **Write** | `POST /api/users` sets the creator to the signed-in caller. `PUT /api/users/{id}` does **not** change it. |
| **No creator** | Existing rows and seed users stay NULL. JSON field is **`null`**. |
| **Name** | Current `full_name` of the referenced user, including when that user is **soft-deleted**. |
| **Out of scope** | `GET /api/auth/me/contributions`, `GET /api/users`, `POST`/`PUT` user response bodies, My Profile. |

Authorization for `GET /api/users/{id}/contributions` is unchanged (Admin/SuperAdmin, other users in list scope, not self). **403** and **404** rules stay as they are today.

---

## 2. Data model

Add to table `users`:

| Column | Type | Notes |
|--------|------|--------|
| `created_by_user_id` | `bigint` NULL | FK → `users(id)`. Indexed. |

- **No backfill.** Rows that already exist, including seed SuperAdmins and the seed Admin, stay NULL.
- **Soft delete** of the creator sets `deleted_at` on that row. It must **not** clear `created_by_user_id` on users they created.
- **ON DELETE SET NULL** if a creator row is hard-deleted. Product delete is soft delete, so the name remains available for soft-deleted creators.
- A user does not create their own row. The caller id and the new user id are different.

---

## 3. Writes

| Action | `created_by_user_id` |
|--------|----------------------|
| `POST /api/users` | Set to the authenticated caller (`sub`). |
| `PUT /api/users/{id}` | Leave unchanged, including when name, email, role, or password changes. |
| `DELETE /api/users/{id}` | Soft-delete the target only. Do not change this column on the target or on users they created. |

`POST` / `PUT` response bodies stay `UserListItemDto`. Do **not** add `createdByFullName` there.

---

## 4. Read

### 4.1 `GET /api/users/{id}/contributions`

Add one property to the existing **200** body. Always include the key.

```json
{
  "id": 5,
  "fullName": "Jane Recruiter",
  "email": "jane.r@dplit.com",
  "role": 2,
  "createdByFullName": "Muhammad Reyyan",
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
| `createdByFullName` | `string \| null` | Current `users.full_name` for `created_by_user_id`. **`null`** when the column is NULL. |

Resolve the name even when:

- the creator’s `deleted_at` is set
- the creator is a **SuperAdmin**, or any user the viewer cannot open in the users list

Return the name only. Do not add `createdByUserId`, email, or role.

Counts and the other identity fields stay as they are today.

### 4.2 Unchanged routes

| Route | Change |
|-------|--------|
| `GET /api/auth/me/contributions` | **No** `createdByFullName`. Same JSON as today. |
| `GET /api/users` | List items unchanged. |
| `POST /api/users`, `PUT /api/users/{id}` | Response DTO unchanged. Creator is stored on create only. |

If admin and self contributions share one DTO type, do not serialize `createdByFullName` on the self route.

---

## 5. Frontend (after this ships)

Not part of the API work. Profile UI waits until this field is live.

- Page: **`/users/[id]` only**. Not My Profile (`/profile`).
- Placement: profile card, its own row under the avatar and the name/email, left edge lined up with the avatar.
- Copy: one line, `Created By: {createdByFullName}`. Label and value use the Name label and Name value styles from the candidate details modal.
- Plain text. Not a link.
- Hide the line when `createdByFullName` is `null`, missing, or blank.

---

## 6. Test checklist

- [ ] Migration applies; existing and seed users have NULL `created_by_user_id`
- [ ] `POST /api/users` as Admin → new Recruiter’s `created_by_user_id` is that Admin
- [ ] `POST /api/users` as SuperAdmin → new Admin or Recruiter’s creator is that SuperAdmin
- [ ] `PUT /api/users/{id}` does not change `created_by_user_id`
- [ ] `GET /api/users/{id}/contributions` for a user with a creator returns `createdByFullName` equal to the creator’s **current** `full_name`
- [ ] Same call for a seed user (NULL creator) returns `"createdByFullName": null`
- [ ] Soft-delete the creator → the same call still returns that creator’s `full_name`
- [ ] Admin opens a Recruiter created by a SuperAdmin → **200** and the SuperAdmin’s `full_name` (Admin still cannot list SuperAdmins)
- [ ] `GET /api/auth/me/contributions` body has **no** `createdByFullName`
- [ ] `GET /api/users` items have **no** `createdByFullName`
- [ ] **403** / **404** on `GET /api/users/{id}/contributions` unchanged
