# Frontend handoff: employer & university name uniqueness

Handoff for the frontend agent after the backend blocked **duplicate active names** for **employers** and **universities**.

JSON uses ASP.NET Core default **camelCase** on success payloads. Validation errors are documented in §3.

This document covers **only** name-uniqueness behavior. It does **not** cover domain catalogs, candidate nested `project`, or other API work.

---

## 1. Summary

| Entity | Uniqueness scope | Case sensitivity | Active rows only |
|--------|------------------|------------------|------------------|
| **Employer** | Global: one **name** worldwide among active employers | **Insensitive** (`citext`) | Yes (`deleted_at IS NULL`) |
| **University** | Global: one **name** worldwide among active universities (not per country) | **Insensitive** | Yes (`deleted_at IS NULL`) |

**Server behavior on write:** `name` is **trimmed** before save and before the duplicate check.

**Soft-deleted employers:** A name held only by soft-deleted employer rows does **not** block creating a new active employer with that name.

**Universities:** List/search already ignore `deleted_at IS NULL` rows. Uniqueness uses the same active set. (University delete in API may hard-delete today; uniqueness still applies to any row with `deleted_at IS NULL`.)

---

## 2. Endpoints affected (no success-shape change)

Successful **GET** responses are unchanged. **POST/PUT** bodies and success responses use the same DTOs as before.

### Employers

| Method | Route | When duplicate name matters |
|--------|--------|-----------------------------|
| POST | `/api/employers` | Create |
| PUT | `/api/employers/{id}` | Rename |

Unchanged for this work: `GET /api/employers`, `GET /api/employers/search`, `GET /api/employers/{id}`, etc.

### Universities

| Method | Route | When duplicate name matters |
|--------|--------|-----------------------------|
| POST | `/api/universities` | Create |
| PUT | `/api/universities/{id}` | Rename |

Unchanged for this work: `GET /api/universities`, `GET /api/universities/search`, `GET /api/universities/{id}`, etc.

**No new endpoints.** No new query parameters.

---

## 3. New / stricter validation (400 Bad Request)

`ValidationException` is mapped by `ValidationExceptionFilter` to **HTTP 400** with body = **the exception message** (plain string in JSON, e.g. `"An employer with this name already exists."` — not a `{ "errors": ... }` object unless your client already wraps string bodies).

| Condition | HTTP | Message (exact string) |
|-----------|------|-------------------------|
| Duplicate active **employer** name (create or rename) | 400 | `An employer with this name already exists.` |
| Duplicate active **university** name (create or rename) | 400 | `A university with this name already exists.` |
| Empty / whitespace **employer** name on create or update | 400 | `Name is required.` |
| Empty / whitespace **university** name on create or update | 400 | `Name is required.` |

**Matching rules (for client-side hints only — server is authoritative):**

- Compare after **trim**.
- Treat differing **case** as the same name (`"LUMS"` vs `"lums"` → duplicate).
- **University `countryId` does not** make the same name allowed twice; names are unique globally among active universities.

**Updating without renaming:** PUT with the same trimmed name as the current employer/university → **200** (exclude-self logic on the server).

---

## 4. What the frontend should do

### Required

- On employer **create/edit** and university **create/edit**, handle **400** and show the response message to the user (especially the two “already exists” strings).
- Do **not** rely on client-only checks; always handle API 400.

### Optional (UX)

- Before submit, optional warning if search/combobox already shows an exact name match — still submit through API and handle 400 if needed.
- Disable double-submit on create to avoid race duplicates (two tabs can still race; DB enforces uniqueness).

### Not required

- No new catalog GET or id mapping.
- No change to list/search response shapes.
- No change to employer/university field names on JSON (`name`, `countryId`, etc.).

---

## 5. Backend migrations (coordination)

Deploy frontend against APIs that have these migrations applied:

| Migration | Effect |
|-----------|--------|
| `20260916112645_AddEmployerActiveNameUniqueIndex` | Unique index `idx_employers_name_unique` on `employers(name)` WHERE `deleted_at IS NULL` |
| `20260916131517_AddUniversityActiveNameUniqueIndex` | Unique index `idx_universities_name_unique` on `universities(name)` WHERE `deleted_at IS NULL` |

If the API is new but the DB is not migrated, behavior may be inconsistent (app check only vs DB constraint). Target: **API + both migrations** on each environment.

---

## 6. Frontend (this repo)

- `extractApiErrorMessage` parses JSON string 400 bodies from `ValidationException`.
- `createEmployer` / `updateEmployer` and `createUniversity` / `updateUniversity` throw `Error(message)` with the server string on 400.
- **EmployerCreationDialog** and **UniversityCreationDialog**: toast + inline **name** error for duplicate / required name messages.
- **Employers** / **Universities** page clients: existing `toast.error(err.message)` on submit.

---

## 7. QA checklist

**Employers**

- [ ] POST new unique name → 201.
- [ ] POST same name again (any casing) → 400, `An employer with this name already exists.`
- [ ] PUT employer A’s name to employer B’s name → 400, same message.
- [ ] PUT employer keeping same name → 200.

**Universities**

- [ ] POST new unique name → 201 (with or without `countryId`).
- [ ] POST same name with different `countryId` → 400, `A university with this name already exists.`
- [ ] PUT rename collision → 400.
- [ ] PUT same name on same id → 200.

---

## 8. Example error handling (conceptual)

```ts
// After POST/PUT employers or universities — adapt to your HTTP client.
if (response.status === 400) {
  const message = await response.json(); // string body
  // show message in form / toast
}
```

Exact parsing depends on your existing API client; match how other `ValidationException` 400 responses are handled in the app.
