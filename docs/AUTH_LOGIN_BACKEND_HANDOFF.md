# Auth login — backend handoff

**Status:** Implemented (users table + seed migration; local DB seeded).  
**Audience:** Backend + frontend.

---

## Summary

| Item | Detail |
|------|--------|
| Auth | JWT Bearer, 7-day access token (no refresh token) |
| Login | `email` + `password` |
| Users | `users` table: `full_name`, `email` (citext), `password` (Identity hash), `created_at`, `updated_at`, `deleted_at` |
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
  "user": { "id": 1, "fullName": "...", "email": "..." }
}
```

**401:** `"Email or password is incorrect."` (unknown email, soft-deleted, wrong password).

**400:** validation (missing email/password).

### `POST /api/auth/logout` — Bearer

**204** No Content.

### `GET /api/auth/me` — Bearer

**200:** `{ "id", "fullName", "email", "createdAt" }`  
**401:** invalid/expired token or soft-deleted user.

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

---

## Migration

- `20260921113107_AddUsersTable` — creates `users` + `idx_users_email_unique` (`deleted_at IS NULL`).
- `20260921115726_SeedInitialUsers` — inserts the three users (hashes must be pasted into the migration file before apply).

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
