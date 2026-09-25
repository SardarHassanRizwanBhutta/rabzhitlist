# Auth login — backend handoff

**Status:** Implemented (users table + seed migration; **RBAC v1** `role` on users/JWT).  
**Audience:** Backend + frontend.  
**RBAC:** [`RBAC_BACKEND_HANDOFF.md`](./RBAC_BACKEND_HANDOFF.md) · **FE:** [`AUTH_LOGIN_FRONTEND_INTEGRATION.md`](./AUTH_LOGIN_FRONTEND_INTEGRATION.md)

---

## Summary

| Item | Detail |
|------|--------|
| Auth | JWT Bearer, 7-day access token (no refresh token) |
| Login | `email` + `password` |
| Users | `users` table: `full_name`, `email` (citext), `password` (Identity hash), **`role`** (`user_role` enum), `created_at`, `updated_at`, `deleted_at` |
| Roles | `0` SuperAdmin, `1` Admin, `2` Recruiter — on login/`me` and JWT claim `role` (`"0"`\|`"1"`\|`"2"`) |
| Protection | Fallback policy: all `/api/**` require auth except anonymous auth routes and `GET /api/health` |
| Config | `Jwt` section in `appsettings.json` (same key all environments) |

---

## Endpoints

### `POST /api/auth/login` — anonymous

**Request:** `{ "email": "...", "password": "..." }`

**200:**

```json
{
  "accessToken": "eyJ...",
  "expiresAt": "2026-09-28T12:00:00Z",
  "user": { "id": 1, "fullName": "...", "email": "...", "role": 0 }
}
```

**401:** `"Email or password is incorrect."` (unknown email, soft-deleted, wrong password).

**400:** validation (missing email/password).

### `POST /api/auth/logout` — Bearer

**204** No Content.

### `GET /api/auth/me` — Bearer

**200:** `{ "id", "fullName", "email", "role", "createdAt" }` — `role` is **0 \| 1 \| 2**  
**401:** invalid/expired token, soft-deleted user, or **JWT `role` claim missing/mismatch** with DB (`Session outdated. Please sign in again.` in `ActiveUserJwtBearerEvents`).

### `GET /api/auth/me/contributions` — Bearer

**200:** `UserContributionsDto` — active contribution **counts** for the signed-in user (all roles). See [`USER_CONTRIBUTIONS_BACKEND_HANDOFF.md`](./USER_CONTRIBUTIONS_BACKEND_HANDOFF.md) §4.1.  
**401** / **404:** same patterns as other authenticated auth routes.

### `POST /api/auth/change-password` — Bearer

**Request:** `{ "currentPassword", "newPassword" }`  
**200:** `{ "message": "Success" }`  
**401:** `"Current password is incorrect."`  
**400:** e.g. `"New password must be at least 8 characters."`

### `GET /api/health` — anonymous

**200:** `{ "status": "healthy" }`

---

## Seeding users

1. Generate a hash (same hasher as the API):

   ```bash
   dotnet run --project tools/UserPasswordHashGen -- "<initial-password>"
   ```

2. Add a **data migration** (or extend `AddUsersTable` before first deploy) with `INSERT` into `users` (`full_name`, `email`, `password`, `created_at`, `updated_at`) — **never** commit plaintext passwords.

3. Send initial passwords to users out-of-band.

**Seed users (local / prod):**

1. Generate hashes: `dotnet run --project tools/UserPasswordHashGen -- "<password>"` (from repo root).
2. Open `Migrations/20260921115726_SeedInitialUsers.cs` and replace the three `PASTE_HASH_FOR_*` constants with the matching hashes (order: Rabiah → Reyyan → Ahmed).
3. Apply: `dotnet ef database update --project MyApp.Infrastructure/MyApp.Infrastructure.csproj --startup-project MyApp.API/MyApp.API.csproj`

| full_name | email |
|-----------|--------|
| Rabiah Zareen | rabiah.z@dplit.com |
| Muhammad Reyyan | reyyan.m@dplit.com |
| Muhammad Ahmed | ahmed.m@dplit.com |
| Syed Ahmad | syed@dplit.com |
| Sardar Hassan Rizwan Bhutta | hassan.b@dplit.com |

---

## Migration

- `20260921113107_AddUsersTable` — creates `users` + `idx_users_email_unique` (`deleted_at IS NULL`).
- `20260921115726_SeedInitialUsers` — inserts the three users (hashes must be pasted into the migration file before apply).
- `20260922100428_SeedAdditionalUsers` — inserts Syed Ahmad and Sardar Hassan Rizwan Bhutta.
- `20260923212300_AddUserRole` — adds `users.role`; seeds SuperAdmins (Rabiah, Syed, Hassan, Ahmed) and Admin (Reyyan). **Required for RBAC v1.**

---

## Source files

| Area | Path |
|------|------|
| Entity | `MyApp.Domain/Entities/User.cs` |
| Repository | `MyApp.Infrastructure/Repositories/UserRepository.cs` |
| Service | `MyApp.Application/Services/AuthService.cs` |
| JWT | `MyApp.API/Auth/JwtTokenGenerator.cs`, `ActiveUserJwtBearerEvents.cs` |
| Controllers | `MyApp.API/Controllers/AuthController.cs`, `HealthController.cs` |
| Wiring | `MyApp.API/Program.cs` |
