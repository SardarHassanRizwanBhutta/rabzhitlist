# RBAC v1 — backend handoff

**Status:** Implemented.  
**Related:** [`RBAC_FRONTEND_INTEGRATION.md`](./RBAC_FRONTEND_INTEGRATION.md), [`AUTH_LOGIN_BACKEND_HANDOFF.md`](./AUTH_LOGIN_BACKEND_HANDOFF.md), [`USERS_ADMIN_BACKEND_HANDOFF.md`](./USERS_ADMIN_BACKEND_HANDOFF.md) (users API + RBAC rules)


---

## Summary

| Item | Detail |
|------|--------|
| Roles | `SuperAdmin` (0), `Admin` (1), `Recruiter` (2) — one role per user |
| Storage | PostgreSQL enum `user_role`, column `users.role` |
| JWT | Claim `role` = string `"0"` \| `"1"` \| `"2"` on login |
| Authoritative role | **Database** on each request (`OnTokenValidated`) |
| Stale JWT | Missing/wrong `role` claim vs DB → **401** `"Session outdated. Please sign in again."` |
| Forbidden | **403** `{ "status": 403, "message": "..." }` (default: no permission message) |

**Migration:** `20260923212300_AddUserRole` — seeds Rabiah, Syed, Hassan, Ahmed → SuperAdmin; Reyyan → Admin; column default Recruiter for new rows.

---

## Users (`/api/users`)

- **Recruiter:** 403 on all methods (`[AdminOnly]`).
- **SuperAdmin:** list/create/update/delete **Admin + Recruiter only** (no SuperAdmin rows; self excluded from list).
- **Admin:** list/manage **Recruiter only** (self excluded from list).
- **Create/update:** `role` **required** (omit → 400 `"Role is required."`).
- **SuperAdmin** cannot assign **SuperAdmin** on create/update.
- **Admin** cannot assign Admin/SuperAdmin.
- **Last SuperAdmin** cannot be demoted or deleted.

---

## Dashboard & admin

- **Recruiter:** 403 on `/api/dashboard/**` and `/api/admin/**`.

---

## Candidates (Recruiter)

| Allowed | Blocked (403) |
|---------|----------------|
| `GET` list, detail, `data-progress` (masked) | `PUT`/`DELETE` candidate |
| `POST /api/candidates` (no salary / WE comp fields — **400** if sent) | Nested **POST/PUT/PATCH/DELETE** except resume upload |
| Nested **GET** (WE masked) | Salary-related **list filters** |
| **R2:** `POST …/resume/upload-url`, `POST …/resume/confirm`, `GET …/resume/open-url` | `DELETE …/resume` |

**Recruiter read responses:** separate DTOs (`CandidateRecruiterListItemDto`, `CandidateRecruiterDetailDto`, `CandidateWorkExperienceRecruiterDto`, `MatchedWorkExperienceRecruiterDto`) — sensitive properties are **not on the type**, so JSON omits them (not `null`).

---

## Deploy

1. `dotnet ef database update` (same connection string as API).
2. Deploy API; users must **re-login** (old JWTs without `role` → 401).
3. Coordinate FE: `role` on login/`me`, hide UI per [`RBAC_FRONTEND_INTEGRATION.md`](./RBAC_FRONTEND_INTEGRATION.md).

---

## Smoke checklist

- [ ] Login as SuperAdmin → `user.role` = 0; JWT includes `"role":"0"`.
- [ ] Recruiter `GET /api/users` → 403.
- [ ] Recruiter `GET /api/candidates` → no salary fields; `?currentSalaryMin=1` → 403.
- [ ] Recruiter `POST /api/candidates` with `currentSalary` → 400.
- [ ] Recruiter `POST …/resume/upload-url` → 200; `DELETE …/resume` → 403.
- [ ] Change user role in DB → same JWT → 401 session outdated.
