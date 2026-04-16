# Backend: debounced university search (combobox)

This document specifies what the **.NET (or existing) API** should implement so the Next.js app can add **debounced university search** in **Create Candidate** (and other comboboxes), **mirroring** the existing **employer** search used in `ProjectCreationDialog` / `CandidateCreationDialog` / `EmployerCombobox`.

## Reference implementation: employers

The web app calls the backend directly (see `API_BASE_URL`):

- **Method / path:** `GET /api/employers/search`
- **Query parameters:**
  - `search` (optional string): user-typed filter; trimmed on the client.
  - `limit` (optional int): client clamps to **1–20** (default **10** on the client).
- **Response:** JSON array of lightweight rows, shape equivalent to:

```json
[
  { "id": 1, "name": "Acme Corp" }
]
```

- **Behavior expectations (match employers):**
  - Same **authentication / authorization** rules as other employer read endpoints.
  - **Abort-friendly:** short requests; suitable for typing with 300ms debounce and `AbortController` on the client.
  - When `search` is **empty or too short**, the client may **not** call the API (`useEmployerSearch` requires **≥ 2** characters after trim). The endpoint should still behave predictably if called with an empty `search` (e.g. return `[]` or a capped default list—**document the chosen behavior** so the frontend can align).

Frontend reference:

- `src/lib/services/employers-api.ts` — `searchEmployers()`
- `src/hooks/useEmployerSearch.ts` — 300ms debounce, min 2 chars, abort stale requests

## New endpoint: universities (required)

Add a **parallel** endpoint for universities:

- **Method / path:** `GET /api/universities/search`
- **Query parameters (same semantics as employers):**
  - `search` (optional string): match against **university name** (and optionally aliases / normalized name if you have them).
  - `limit` (optional int): **clamp server-side** to a reasonable max (e.g. **1–20**) to avoid abuse; default e.g. **10** if omitted.
- **Response:** JSON array:

```json
[
  { "id": 42, "name": "Example University" }
]
```

### Critical: `id` is the **university** primary key

- **`id` MUST be the university entity’s primary key** (the same identifier the candidate education API expects as **`universityId`**).
- Do **not** return campus/location rows as the combobox `id`. The product requirement is to associate the candidate with a **university**, not a specific campus/location record, for this picker.

### Search behavior (recommendations)

- **Case-insensitive** partial match on name is sufficient for v1.
- **Ordering:** relevance or alphabetical by name; stable enough for UX.
- **Performance:** index-friendly query (e.g. `LIKE` prefix or full-text if volume is high).
- **Empty / short `search`:** either return `[]` or a small capped set; keep consistent with `GET /api/employers/search`.

## Alignment with candidate education API

The SPA already maps form education to create/update DTOs using **`universityId`** (see `src/lib/services/candidates-api.ts`, `CreateCandidateEducationDto` / `candidateFormDataToCreateDto`). The form field is still named `universityLocationId` in some places for historical reasons; the **numeric value sent as `universityId` must be the university pk**.

Backend checklist:

1. Confirm **`CreateCandidateEducationDto.universityId`** (or equivalent) FK targets the **universities** table, not **university locations**.
2. If legacy data or old clients sent **location** ids into `universityId`, define **migration or compatibility** (reject, map, or dual-field support) and document it for the frontend team.
3. **GET candidate** responses should expose a stable university identifier and display name for education rows (e.g. `universityId` + `universityName`), consistent with what the search endpoint returns, so the UI can round-trip selections.

## Contract summary for implementers

| Item | Employers (existing) | Universities (new) |
|------|----------------------|---------------------|
| Route | `GET /api/employers/search` | `GET /api/universities/search` |
| Params | `search`, `limit` | Same |
| Item shape | `{ id, name }` | `{ id, name }` with `id` = **university** pk |
| Auth | Same as employer reads | Same as university reads |

## Verification (backend)

- `GET /api/universities/search?search=mit&limit=10` returns plausible rows; `id` matches a row in the universities table.
- `limit=0`, negative, or very large values are clamped or rejected consistently.
- Unauthorized callers receive the same status as comparable list/search endpoints.

After this ships, the frontend will add `searchUniversities()` in `universities-api.ts`, a `useUniversitySearch` hook (mirror `useEmployerSearch`), and replace the bulk `GET /api/universities` + per-campus options in **Create Candidate** with the debounced search combobox pattern used for employers.
