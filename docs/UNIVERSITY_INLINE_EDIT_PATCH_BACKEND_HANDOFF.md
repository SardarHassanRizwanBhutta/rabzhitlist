# University inline edit — PATCH backend handoff

**Status:** Implemented in API (`PATCH` routes, main-campus demotion, **GET by id active-only** aligned with PATCH).  
**Audience:** Backend team.  
**Frontend integration:** [`UNIVERSITY_INLINE_EDIT_PATCH_FRONTEND_INTEGRATION.md`](./UNIVERSITY_INLINE_EDIT_PATCH_FRONTEND_INTEGRATION.md)  
**Related:** [`EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md`](./EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md)

---

## 1. Summary

| What | Detail |
|------|--------|
| **Goal** | Support **single-field** saves from `UniversityDetailsModal` with minimal request bodies |
| **Style** | **Partial DTO merge** — only properties present in JSON are applied |
| **Responses** | **200** + full **`University`** DTO (same shape as `GET /api/universities/{id}`), including `locations[]` |
| **Empty body** | `PATCH` with `{}` → **200** + unchanged full `University` (idempotent) |
| **Unchanged v1** | `POST /api/universities`, `PUT /api/universities/{id}`, location `POST`/`PUT`/`DELETE` used by creation/edit dialog |
| **Verification** | Out of scope — no field-verification persistence |
| **Out of scope** | Add campus from details modal; PATCH nested arrays on university root |

JSON uses ASP.NET Core default **camelCase**. Validation errors: plain JSON **string** body (see name uniqueness handoff).

---

## 2. Routes

| Method | Route | Purpose |
|--------|--------|---------|
| `PATCH` | `/api/universities/{id}` | Partial update of university **scalars** |
| `PATCH` | `/api/universities/{id}/locations/{locationId}` | Partial update of **one** campus row |

| Status | Meaning |
|--------|---------|
| **200** | Success; body = full `University` |
| **404** | University or location not found (or soft-deleted) |
| **400** | Validation; body = exception message string |

---

## 3. Scalar PATCH — `/api/universities/{id}`

### 3.1 Body (all optional)

| Property | Type | Apply rule |
|----------|------|------------|
| `name` | `string` | Trim before save and duplicate check |
| `countryId` | `number \| null` | `null` clears country FK |
| `ranking` | `number \| null` | `0`–`3` (Tier1…DplFavourite) or `null` to clear |
| `websiteUrl` | `string \| null` | Trim; empty/whitespace → store `null` |
| `linkedInUrl` | `string \| null` | Same as website |

Properties **omitted** from JSON are unchanged.

### 3.2 Validation

| Condition | HTTP | Message (exact) |
|-----------|------|-----------------|
| Duplicate active university name | 400 | `A university with this name already exists.` |
| Empty / whitespace `name` when `name` is sent | 400 | `Name is required.` |
| Same trimmed `name` as current row | 200 | (exclude-self) |
| Invalid `ranking` (not 0–3 or null) | 400 | `Ranking must be null or a value between 0 and 3.` |
| Invalid `countryId` when not null | 400 | `Country not found.` |

See [`EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md`](./EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md) for name rules.

### 3.3 Example

```http
PATCH /api/universities/42
Content-Type: application/json

{ "websiteUrl": "https://example.edu" }
```

Response: **200** + full university including `locations[]`, `updatedAt`, `dataProgressPercentage` (when column exists).

```http
PATCH /api/universities/42

{}
```

Response: **200** + full university unchanged.

---

## 4. Location PATCH — `/api/universities/{id}/locations/{locationId}`

### 4.1 Body (all optional)

| Property | Type | Apply rule |
|----------|------|------------|
| `city` | `string` | Trim; if sent empty → **400** (align with PUT location rules) |
| `address` | `string \| null` | Trim; empty → `null` |
| `isMainCampus` | `boolean` | See §4.2 |

### 4.2 Main campus — Option A (required)

When a write sets **`isMainCampus: true`** for location `L` of university `U`:

1. In a **single transaction**, set `is_main_campus = false` on **all other** active locations for `U`.
2. Set `L.is_main_campus = true`.
3. Return **200** + full `University`.

Apply the **same demotion rule** on **`PUT /api/universities/{id}/locations/{locationId}`** when body includes `isMainCampus: true`, so bulk edit cannot leave duplicate mains.

**Note:** DB today does **not** enforce uniqueness on main campus (partial index without `.IsUnique()`). Server demotion is the source of truth until an optional unique partial index is added after cleanup.

### 4.3 Example

```http
PATCH /api/universities/42/locations/7

{ "isMainCampus": true }
```

Response: **200** + full `University` with exactly one `isMainCampus: true` (after demotion).

---

## 5. Side effects

When **`UniversityDataProgressService`** is enabled, recalculate **`dataProgressPercentage`** (and `dataProgressUpdatedAt`) on any successful scalar or location PATCH (same as other university/location mutations — handoff U8).

---

## 6. Acceptance criteria

- [x] Scalar PATCH updates only sent fields; `{}` returns 200 + unchanged entity (no data-progress recalc).
- [x] `countryId: null` clears country on GET response; invalid id → `Country not found.`
- [x] `ranking: null` clears ranking; invalid → `Ranking must be null or a value between 0 and 3.`
- [x] Name duplicate and empty name return documented 400 strings.
- [x] Location PATCH `isMainCampus: true` demotes other rows atomically (including when row was already main).
- [x] PUT/POST location with `isMainCampus: true` uses same demotion.
- [x] Empty city on location PATCH/PUT → `City is required.`
- [x] 404 for missing university/location / wrong `universityId` (active-only lookup on GET, PATCH, and post-save refresh).
- [x] Response shape matches `GET /api/universities/{id}`.

---

## 7. GET by id and soft delete (aligned)

| Route | Active-only (`deleted_at IS NULL`) |
|-------|-------------------------------------|
| `GET /api/universities/{id}` | **Yes** — `UniversityService.GetByIdAsync` → `GetActiveByIdAsync` |
| `PATCH /api/universities/{id}` | **Yes** — same helper |

Missing or soft-deleted university → **404** on both. Create/update refresh paths use `GetActiveByIdAsync` after save.

**Note:** `IUniversityRepository.GetByIdAsync` may still return deleted rows for **internal** callers; the public GET endpoint does not use it directly for inactive rows.

**Frontend:** `UniversityDetailsModal` already calls `fetchUniversityById` on open and shows “University not found.” on **404** — no change required for this alignment.

---

## 8. Frontend dependency

Frontend **`patchUniversity`** / **`patchUniversityLocation`** and **`UniversityDetailsModal`** wiring are in repo; enable E2E after API deploy (no frontend migration required).
