# Call Notes Persistence — Backend Handoff

**Status:** Ready for backend implementation (2026-07-17).  
**Audience:** ASP.NET / API / DB.  
**Product spec (locked):** [`CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md)  
**Frontend handoff (implement after this API ships):** [`CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md`](./CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md)

---

## 0. Locked decisions (implement exactly)

| # | Decision |
|---|----------|
| **CN1** | One string per candidate; PATCH overwrites |
| **CN8–CN9** | Nullable until first valid save; after that reject empty clears |
| **CN10** | `GET` + `PATCH` `/api/candidates/{id}/call-notes` |
| **CN11** | Never saved → `200` + `"call_notes": null` |
| **CN12** | `nvarchar(max)` |
| **CN13** | JSON property **`call_notes`** (snake_case — use explicit JSON name if default is camelCase) |
| **CN14** | Do **not** add `call_notes` to main candidate GET/PUT DTOs |
| **CN15** | No concurrency token / ETag required in v1 |
| **CN16** | No AI / extract involvement |

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

## 3. Emptiness helper (pseudocode)

```csharp
static bool IsEmpty(string? value) =>
    value is null || string.IsNullOrWhiteSpace(value);

// PATCH:
// if (IsEmpty(dto.CallNotes)) return 400;
// entity.CallNotes = dto.CallNotes; // as-is, no Trim()
```

After first save, `entity.CallNotes` is never set back to `null` via this API (only overwrite with non-empty content).

---

## 4. Out of scope

- Python call-notes extract service  
- History / append / timestamps of note revisions  
- Optimistic concurrency  
- Exposing notes on list or main candidate detail DTOs  
- Data-progress scoring of call notes  

---

## 5. Backend checklist

- [x] Migration: `candidates.call_notes` `text` NULL (PostgreSQL; product intent of nvarchar(max))
- [x] GET `/api/candidates/{id}/call-notes` → `{ call_notes: string | null }`
- [x] PATCH `/api/candidates/{id}/call-notes` with emptiness rules
- [x] JSON property name exactly `call_notes`
- [x] Main candidate GET/PUT DTOs unchanged (no `call_notes`)
- [x] Soft-delete / 404 behavior consistent with other sub-resources
- [x] Do not log raw call notes in application logs

**Migration name:** `20260717152530_AddCandidateCallNotes` — apply with `dotnet ef database update` (not applied by agent). 

---

## 6. Agent prompt (backend)

```
Implement call notes persistence per
docs/CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md and
docs/CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md.

Add candidates.call_notes nvarchar(max) NULL.
Expose GET + PATCH /api/candidates/{id}/call-notes with JSON property call_notes.
Never saved → 200 { call_notes: null }.
PATCH rejects null/empty/whitespace-only; stores exact text including newlines.
Do not add call_notes to main candidate GET/PUT.
```
