# Call Notes Persistence — Backend Handoff

**Status:** Backend **complete** (GET/PATCH + POST create `callNotes`, 2026-07-30).  
**Audience:** ASP.NET / API / DB.  
**Product spec (locked):** [`CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md)  
**Frontend handoff:** [`CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md`](./CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md)

---

## 0. Locked decisions (implement exactly)

| # | Decision |
|---|----------|
| **CN1** | One string per candidate; PATCH overwrites |
| **CN8–CN9** | Nullable until first valid save; after that reject empty clears on PATCH |
| **CN10** | `GET` + `PATCH` `/api/candidates/{id}/call-notes` **and** optional `callNotes` on `POST /api/candidates` |
| **CN11** | Never saved → `200` + `"call_notes": null` on GET |
| **CN12** | `nvarchar(max)` |
| **CN13** | Sub-resource JSON: **`call_notes`** (snake_case). Create body: **`callNotes`** (camelCase) |
| **CN14** | Do **not** add call notes to main candidate **GET/PUT** DTOs |
| **CN15** | No concurrency token / ETag required in v1 |
| **CN16** | No AI / extract involvement |
| **CN17** | Create: omit / empty / whitespace `callNotes` → store `null` (do **not** 400); non-empty → persist exact string |

---

## 1. Database

```sql
ALTER TABLE candidates
  ADD call_notes nvarchar(max) NULL;
```

- No default other than `NULL`.
- No backfill required (all existing rows remain `NULL` = never saved).
- Index: **not required** for v1 (no list filter on notes).

---

## 2. API

Base path (same auth / soft-delete rules as other candidate sub-resources):

```http
GET   /api/candidates/{id}/call-notes
PATCH /api/candidates/{id}/call-notes
```

`{id}` = candidate id. Soft-deleted / missing candidate → **`404`**.

### 2.1 GET

**Response `200`**

Never saved:

```json
{
  "call_notes": null
}
```

After at least one successful save:

```json
{
  "call_notes": "Current Salary is 750000. The Expected Salary is 95000.\n\nand the Employer DPL has Team Size of 15 employees."
}
```

- Preserve stored newlines exactly.
- Do not include `call_notes` on `GET /api/candidates/{id}`.

### 2.2 PATCH

**Request body**

```json
{
  "call_notes": "Current Salary is 750000. The Expected Salary is 95000.\n\nand the Employer DPL has Team Size of 15 employees."
}
```

**Validation**

| Condition | Result |
|-----------|--------|
| Candidate missing / soft-deleted | `404` |
| `call_notes` missing from body | `400` |
| `call_notes` is `null` | `400` |
| `call_notes` is `""` | `400` |
| `call_notes` is whitespace-only after trim | `400` |
| `call_notes` has non-whitespace content | `200` — persist **exact** string (do not trim stored value) |

**Response `200`** (echo saved value):

```json
{
  "call_notes": "<exact string stored>"
}
```

**Empty-reject message (suggested):**  
`Call notes cannot be empty once saved.` / `Call notes must contain non-whitespace content.`  
Exact message text is backend-owned; status **`400`** is required.

---

### 2.3 POST `/api/candidates` — optional `callNotes` (extension)

Add optional property on the **create** DTO only:

```json
{
  "name": "…",
  "callNotes": "Current Salary is 750000.\nExpected Salary is 95000."
}
```

| Condition | Result |
|-----------|--------|
| `callNotes` omitted | Column stays `null` (never saved) |
| `callNotes` is `null` | Store `null` (do **not** 400) |
| `callNotes` is `""` or whitespace-only | Store `null` (do **not** 400) |
| `callNotes` has non-whitespace content | Persist **exact** string (no Trim on stored value) |

- Property name on create body: **`callNotes`** (camelCase).
- Do **not** add this field to GET/PUT candidate DTOs (CN14).
- After a non-empty create `callNotes`, GET `/call-notes` returns that string; later updates use PATCH with PATCH emptiness rules.

---

## 3. Emptiness helper (pseudocode)

```csharp
static bool IsEmpty(string? value) =>
    value is null || string.IsNullOrWhiteSpace(value);

// PATCH:
// if (IsEmpty(dto.CallNotes)) return 400;
// entity.CallNotes = dto.CallNotes; // as-is, no Trim()

// POST create:
// if (!IsEmpty(dto.CallNotes)) entity.CallNotes = dto.CallNotes; // as-is
// else leave null
```

After first save (PATCH or non-empty create `callNotes`), `entity.CallNotes` is never set back to `null` via PATCH (only overwrite with non-empty content).

---

## 4. Out of scope

- Python call-notes extract service  
- History / append / timestamps of note revisions  
- Optimistic concurrency  
- Exposing notes on list or main candidate detail / update DTOs  
- Data-progress scoring of call notes  

---

## 5. Backend checklist

- [x] Migration: `candidates.call_notes` `text` NULL (PostgreSQL; product intent of nvarchar(max))
- [x] GET `/api/candidates/{id}/call-notes` → `{ call_notes: string | null }`
- [x] PATCH `/api/candidates/{id}/call-notes` with emptiness rules
- [x] JSON property name exactly `call_notes` on GET/PATCH
- [x] Main candidate GET/PUT DTOs unchanged (no call notes)
- [x] **POST `/api/candidates`:** optional `callNotes` (camelCase); empty/whitespace → null; non-empty → exact persist
- [x] Soft-delete / 404 behavior consistent with other sub-resources
- [x] Do not log raw call notes in application logs

**Migration name:** `20260717152530_AddCandidateCallNotes` — apply with `dotnet ef database update` (not applied by agent). 

---

## 6. Agent prompt (backend — create extension)

```
Extend candidate create per docs/CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md §2.3
and docs/CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md (CN10/CN13/CN17).

POST /api/candidates accepts optional callNotes (camelCase).
Omit/null/empty/whitespace → leave candidates.call_notes null (do not 400).
Non-empty → store exact string (newlines preserved).
GET/PUT candidate DTOs stay without call notes.
Existing GET+PATCH /api/candidates/{id}/call-notes unchanged (property call_notes).
```
