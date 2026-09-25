# User contribution tracking v1 — backend handoff

**Status:** Implemented in `MyApp.API` / `MyApp.Application` / `MyApp.Infrastructure`.  
**Audience:** Backend team.  
**Frontend integration:** [`USER_CONTRIBUTIONS_FRONTEND_INTEGRATION.md`](./USER_CONTRIBUTIONS_FRONTEND_INTEGRATION.md)  
**Related:** [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md) (users API, RBAC scope), [`RBAC_BACKEND_HANDOFF.md`](./RBAC_BACKEND_HANDOFF.md)

---

## 1. Summary

| Item | Detail |
|------|--------|
| **Goal** | Record **who created** certain catalog/entity rows; expose **active counts per user** to Admin/SuperAdmin via a dedicated read API. |
| **v1 scope** | Column `created_by_user_id` (nullable FK → `users.id`) on **candidates**, **employers**, **projects**, **universities**, **certifications** only. |
| **Out of scope v1** | Issuers, university locations, degrees, `updated_by`, backfill of historical rows, `createdBy` on entity list/detail DTOs, contribution **lists** (counts only). |
| **Auth** | JWT Bearer on all routes. |
| **Read API** | `GET /api/users/{id}/contributions` — `[AdminOnly]`; visibility **Option A** (same as user list/manage scope). |

---

## 2. Data model

### 2.1 Column

On each of the five tables:

| Column | Type | Notes |
|--------|------|--------|
| `created_by_user_id` | `bigint` NULL | FK → `users(id)` ON DELETE SET NULL; indexed (`idx_<table>_created_by_user_id`) |

**Existing rows:** remain **NULL** (no backfill in v1).

**Seeds / SQL scripts:** do not set creator (NULL).

### 2.2 When `created_by_user_id` is set

| Operation | Behavior |
|-----------|----------|
| **Create** (POST) on the five entity types | Set to authenticated user id from `ICurrentUserAccessor.UserId` when present. |
| **Update** (PUT/PATCH) | **Do not** change `created_by_user_id`. |
| **Recruiter `POST /api/candidates`** | **Yes** — recruiter’s user id is stored. |
| **Candidate create linking existing catalog ids** | Only the **candidate** row gets the creator; linking existing employers/projects/etc. does **not** retroactively set those catalogs’ creator. |
| **Inline catalog create during another flow** | Only if a **new** row is inserted via the catalog service’s `CreateAsync` (same as standalone POST). |

### 2.3 Count semantics

Contribution counts include only rows where:

- `created_by_user_id = {target user id}`, and  
- `deleted_at IS NULL` (active only).

---

## 3. Authorization (`GET /api/users/{id}/contributions`)

Uses `UserRoleAdminRules.EnsureCanViewContributions` — identical to **manage/list target visibility** (Option A).

| Viewer | May load contributions for |
|--------|----------------------------|
| **Recruiter** | **403** (controller is `[AdminOnly]`) |
| **Admin** | Active **Recruiter** users only |
| **SuperAdmin** | Active **Admin** and **Recruiter** users only |

**Not allowed (403):** SuperAdmin/Admin targets, users outside list scope, self (Admin/SuperAdmin are excluded from list scope by role filter).

**404:** Target user id unknown or soft-deleted.

---

## 4. Endpoint

Base: **`/api/users`** — `UsersController` (`[AdminOnly]`).

### `GET /api/users/{id}/contributions`

**200 response:**

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

| Field | Notes |
|-------|--------|
| `id`, `fullName`, `email`, `role` | Same meaning as user list DTO (`role` **0** SuperAdmin, **1** Admin, **2** Recruiter) |
| `counts.*` | Non-negative integers; active rows only (§2.3) |

**401:** Missing/invalid JWT.  
**403:** Recruiter or out-of-scope target.  
**404:** User not found.

---

## 5. Implementation (shipped)

| Area | Path / detail |
|------|----------------|
| Migration | `20260924173606_AddCreatedByUserId` — adds columns, indexes, FKs |
| Entities | `CreatedByUserId` on `Candidate`, `Employer`, `Project`, `University`, `Certification` |
| EF mapping | `AppDbContext` — column + `HasOne<User>()` FK |
| Writes | `CandidateService.CreateAsync`, `EmployerService.CreateAsync`, `ProjectService.CreateAsync`, `UniversityService.CreateAsync`, `CertificationService.CreateAsync` |
| Counts | `IUserRepository.GetActiveContributionCountsByUserIdAsync` → `UserRepository` |
| DTOs | `UserContributionsDto`, `UserContributionCountsDto` |
| Service | `UserAdminService.GetContributionsAsync` |
| Rules | `UserRoleAdminRules.EnsureCanViewContributions` |
| API | `UsersController.GetContributions` |

Entity list/detail APIs **do not** expose `createdByUserId` in v1.

---

## 6. Deploy

After RBAC migration (if not already applied):

```bash
dotnet ef database update --project MyApp.Infrastructure --startup-project MyApp.API
```

Apply on EC2 against prod DB before or with API deploy. No data backfill required.

---

## 7. Test checklist

- [ ] Migration applies cleanly; existing rows have NULL `created_by_user_id`
- [ ] POST candidate (Admin) → row has `created_by_user_id` = caller
- [ ] POST candidate (Recruiter) → same
- [ ] POST employer/project/university/certification → creator set
- [ ] PUT update on those entities → `created_by_user_id` unchanged
- [ ] Soft-deleted entity excluded from counts
- [ ] Recruiter → **403** on contributions endpoint
- [ ] Admin → **200** for Recruiter target; **403** for Admin/SuperAdmin target
- [ ] SuperAdmin → **200** for Admin/Recruiter; **403** for SuperAdmin target
- [ ] Unknown user id → **404**

---

## 8. v2 (not implemented)

- Backfill `created_by_user_id` where inferable  
- `updated_by_user_id` on updates  
- `createdBy` on entity DTOs  
- Contribution **lists** and profile self-service  
- Additional tables (issuers, locations, etc.)
