# Backend contract: Recruiter edit/delete own candidates

**Status:** Implemented.

**Roles:** Super Admin `0`, Admin `1`, Recruiter `2`.

Recruiters may **create** candidates today (`POST /api/candidates`). They must **not** read or write salary or work-experience compensation fields (existing recruiter compensation rules stay unchanged).

This contract adds **ownership-scoped** update and delete for Recruiters. Super Admin and Admin behavior is unchanged (full mutate on any candidate).

---

## 1. Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| **RO1** | Ownership | A Recruiter may mutate a candidate only when `candidate.CreatedByUserId` equals the authenticated user’s id. |
| **RO2** | List `createdBy` | Every `GET /api/candidates` list item includes `createdBy` (same snapshot shape as detail: `id`, `fullName`, `email`) so the UI can show Edit/Delete per row. Use `null` only when the database has no creator (Recruiter cannot mutate those rows). |
| **RO3** | Detail | `GET /api/candidates/{id}` already includes `createdBy`; unchanged. |
| **RO4** | Recruiter PUT | Recruiter `PUT /api/candidates/{id}` is **403** when `CreatedByUserId` ≠ current user. When equal, apply non-compensation fields. **Omit** compensation keys (do not clear stored salaries). Sending `currentSalary` / `expectedSalary` → **400**. |
| **RO5** | Recruiter DELETE | Recruiter `DELETE /api/candidates/{id}` is **403** when not owner; **204** when owner (same soft-delete semantics as Admin). |
| **RO6** | Nested writes | All existing nested candidate sub-resource routes (education, certification, achievement, work experience and WE sub-resources, tech stacks, resume, call notes where already allowed, project links, **module links**, **mentor links**) follow the same ownership gate for Recruiter: **403** if not owner, otherwise same rules as Admin (still no compensation fields on WE bodies for Recruiter). |
| **RO7** | Mentor links | For candidates they own, Recruiter may `POST`/`PUT`/`DELETE` `/api/candidates/{id}/mentors` and `/api/candidates/{id}/mentors/{linkId}`. For other candidates, **403**. This overrides **M9** in `MENTORS_RECRUITER_ACCESS_BACKEND_CONTRACT.md` only when **RO1** is satisfied. |
| **RO8** | Compensation | Recruiter must not set `currentSalary`, `expectedSalary`, work-experience `salaryPolicy`, `minimumSalary`, `maximumSalary`, or WE benefit writes. **400** when compensation is sent on create or update; omitting compensation on WE update preserves existing values. WE benefit upsert/delete remains **admin-only**. Do not widen salary read on list/detail. |
| **RO9** | Admin paths | Super Admin and Admin are not subject to **RO1** (no ownership check). |
| **RO10** | POST create | Unchanged. New candidates get `CreatedByUserId` = current user; Recruiter creator can edit/delete after create. |

---

## 2. Who can call what (Recruiter)

| Method | Path | Not owner | Owner (`CreatedByUserId` = current user) |
|--------|------|-----------|------------------------------------------|
| `PUT` | `/api/candidates/{id}` | **403** | **200** (non-compensation fields) |
| `DELETE` | `/api/candidates/{id}` | **403** | **204** |
| `POST`/`PUT`/`DELETE` | `/api/candidates/{id}/…` (all nested mutation routes used by Edit Candidate) | **403** | Same as Admin, minus compensation |
| `POST`/`PUT`/`DELETE` | `/api/candidates/{id}/mentors[/{linkId}]` | **403** | Same as Admin |

Unauthenticated → **401**. Unknown candidate id → **404**.

**403** body (same as other modules):

```json
{
  "status": 403,
  "message": "You do not have permission to perform this action."
}
```

---

## 3. List item JSON (`createdBy`)

On each admin and recruiter list DTO item, include:

```json
"createdBy": {
  "id": 42,
  "fullName": "Alex Recruiter",
  "email": "alex@example.com"
}
```

When `CreatedByUserId` is null, `"createdBy": null`.

---

## 4. Verification checklist

1. Recruiter A creates a candidate → `createdBy.id` = A on list and detail.
2. Recruiter A `PUT` and nested updates on that candidate succeed; compensation keys omitted.
3. Recruiter A `DELETE` that candidate → **204**; list no longer shows the row (or shows deleted per existing rules).
4. Recruiter B `PUT`/`DELETE` on A’s candidate → **403**.
5. Recruiter B list row for A’s candidate has no Edit/Delete in UI when `createdBy.id` ≠ B (frontend); direct API still **403**.
6. Admin can still `PUT`/`DELETE` any candidate.
7. Recruiter `PUT` with `currentSalary` or WE compensation → **400** or strip per existing salary contracts; must not persist compensation.
8. Recruiter owner can sync mentor links on own candidate; **403** on another user’s candidate.

---

## 5. Frontend (aligned)

The frontend maps list `createdBy`, shows Edit/Delete only when `createdBy.id` matches the signed-in user, opens the full Edit Candidate dialog for owners, **omits** compensation keys on Recruiter `PUT` and WE bodies (does not send `null`), skips WE benefit sync for Recruiters, and calls nested sync routes after `PUT`. Resume delete is not exposed in the UI (admin-only on the API).
