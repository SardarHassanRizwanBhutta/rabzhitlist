# Contribution list filter — backend contract

**Status:** Implemented. Optional `createdByUserId` on the five paged lists. Frontend can ship “View all” against this API.  
**Audience:** Backend agent.  
**Related:** [`USER_CONTRIBUTIONS_BACKEND_HANDOFF.md`](./USER_CONTRIBUTIONS_BACKEND_HANDOFF.md) (counts + `created_by_user_id`), [`RBAC_BACKEND_HANDOFF.md`](./RBAC_BACKEND_HANDOFF.md), [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md)

This document adds a **list filter**. It does not change contribution count endpoints.

---

## 1. Summary

| Item | Detail |
|------|--------|
| **Goal** | Page the **active** rows a given user **created**, on the five modules that already store `created_by_user_id`. |
| **Query parameter** | **`createdByUserId`** (`long`). **Same name** on every endpoint in §2. |
| **When omitted** | List behavior is **unchanged** (no creator predicate). |
| **When present** | **AND** with every other filter already on that list. Do not replace existing filters. |
| **Row match** | `created_by_user_id = createdByUserId` **and** `deleted_at IS NULL`. Same predicate as contribution counts (`IUserRepository.GetActiveContributionCountsByUserIdAsync`). |
| **NULL creator** | Rows with `created_by_user_id` NULL **never** match. No backfill. |
| **Response DTO** | **Unchanged.** Do **not** add `createdBy` / `createdByUserId` to list or detail JSON. |
| **Search routes** | **Out of scope.** Do not add this parameter to `GET /api/*/search` or to `GET /api/{module}/{id}`. |

Paging (`pageNumber`, `pageSize`, `totalCount`, `totalPages`, `hasPrevious`, `hasNext`) stays as each list already implements it.

**Count check:** `GET` that module with **only** `createdByUserId={id}` (no other filters, page 1) must return `totalCount` equal to that module’s integer on `GET /api/auth/me/contributions` or `GET /api/users/{id}/contributions` for the same user.

---

## 2. Endpoints

Add optional query `createdByUserId` to the **existing paged list** only:

| Method | Path | Count key |
|--------|------|-----------|
| `GET` | `/api/candidates` | `counts.candidates` |
| `GET` | `/api/employers` | `counts.employers` |
| `GET` | `/api/projects` | `counts.projects` |
| `GET` | `/api/universities` | `counts.universities` |
| `GET` | `/api/certifications` | `counts.certifications` |

Example:

```http
GET /api/candidates?createdByUserId=5&pageNumber=1&pageSize=20
Authorization: Bearer <accessToken>
```

Bind as a single `long`. Repeated `createdByUserId` keys → **400**.

---

## 3. Authorization

JWT required. Missing or invalid token → **401** (existing auth behavior).

`createdByUserId` is the **target user** (whose created rows are listed), not “the viewer” unless they are the same person.

### 3.1 Allowed

| Viewer `role` | `createdByUserId` |
|---------------|-------------------|
| **0 SuperAdmin** | **Own** user id, **or** an active **Admin (1)** or **Recruiter (2)** |
| **1 Admin** | **Own** user id, **or** an active **Recruiter (2)** |
| **2 Recruiter** | **Own** user id **only** |

**Own id is allowed for every role**, including SuperAdmin and Admin. This is **not** the same rule as `GET /api/users/{id}/contributions`, which returns **403** for the caller’s own id. Reuse `UserRoleAdminRules.EnsureCanViewContributions` only for **other** users. Self must short-circuit to allow.

Other-user scope matches contributions Option A:

| Viewer | Other user they may filter by |
|--------|--------------------------------|
| SuperAdmin | Active Admin, active Recruiter |
| Admin | Active Recruiter |
| Recruiter | Nobody else |

### 3.2 Forbidden → **403**

JSON body, same shape as the rest of RBAC:

```json
{ "status": 403, "message": "You do not have permission to perform this action." }
```

Use the existing permission message if the API already has a shared string. Do not invent a second format.

**403** when the target user **exists and is active**, but is outside §3.1. Examples:

- Recruiter passes another user’s id
- Admin passes an Admin id that is **not** their own, or any SuperAdmin id
- SuperAdmin passes another SuperAdmin’s id
- Any role passes a user id that is outside Option A and is not themselves

Existing Recruiter candidate rules stay in force **in addition** to this filter. Example: Recruiter `GET /api/candidates?createdByUserId={self}&currentSalaryMin=1` is still **403** because salary query params are forbidden for Recruiter. Do not weaken that.

### 3.3 Not found → **404**

Target user id is unknown **or** the user is soft-deleted.

Do **not** return **200** with an empty page for a missing user. The frontend treats that as “user not found”, same as contributions.

### 3.4 Bad query → **400**

- Missing numeric value, non-integer, or value `<= 0`
- `createdByUserId` sent more than once

---

## 4. Filter combination

When `createdByUserId` is present, apply it as an **additional AND** predicate on the existing list query (name, city, and every other current filter for that module).

Do **not** implement “drop creator filter when other filters change”. The frontend removes `createdByUserId` from the next request when the user applies or clears module filters. The API only honors the query string it receives.

---

## 5. Out of scope

- New routes (no `GET /api/users/{id}/candidates` or similar)
- `createdBy` on entity list/detail DTOs
- Backfill of NULL `created_by_user_id`
- Changing `GET /api/auth/me/contributions` or `GET /api/users/{id}/contributions`
- Search/combobox endpoints
- Issuers, locations, degrees, or any table without `created_by_user_id`

---

## 6. Test checklist

- [ ] Param omitted → list identical to today
- [ ] `createdByUserId` only → `totalCount` equals that module’s contribution count for the same user
- [ ] NULL `created_by_user_id` rows excluded
- [ ] Soft-deleted entity excluded
- [ ] AND with one existing filter on each of the five lists (narrows further; does not drop the creator predicate)
- [ ] Recruiter + **own** id → **200** on all five lists
- [ ] Recruiter + another id → **403**
- [ ] Admin + **own** id → **200**
- [ ] Admin + Recruiter id → **200**
- [ ] Admin + another Admin id → **403**
- [ ] Admin + SuperAdmin id → **403**
- [ ] SuperAdmin + **own** id → **200**
- [ ] SuperAdmin + Admin id → **200**
- [ ] SuperAdmin + Recruiter id → **200**
- [ ] SuperAdmin + another SuperAdmin id → **403**
- [ ] Unknown id → **404**
- [ ] Soft-deleted user id → **404**
- [ ] `createdByUserId=0` or non-numeric → **400**
- [ ] Repeated `createdByUserId` → **400**
- [ ] Unauthenticated → **401**
- [ ] Response items still have **no** `createdBy` / `createdByUserId` property
- [ ] Recruiter candidates list still omits compensation fields and still **403**s forbidden salary query params when combined with own `createdByUserId`
