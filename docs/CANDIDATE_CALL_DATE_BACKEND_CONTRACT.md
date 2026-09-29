# Backend contract: candidate Call Date

**Status:** Implemented. Migration `20260929153200_AddCandidateCallDate` adds nullable `candidates.call_date` (`date`). Apply with `dotnet ef database update`.

Handoff for one nullable calendar date on `candidates`. The UI label is **Call Date**. It is the date of the latest information-gathering call, so staff can see when the profile was last collected.

This is **not** `callStatus` (Pending / Done / Follow-up). Setting one does not change the other.

This is **not** call notes. Do **not** add it to `GET`/`PATCH /api/candidates/{id}/call-notes`. Do **not** use `callNotes` or `call_notes`.

**Frontend already sends and reads this field** (2026-09-29). The candidates table and the details modal show **N/A** until the API stores it. The cards view does not render it. The list JSON must still include it, because the table reads list items.

---

## 1. Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| **CD1** | Grain | One current date per candidate. No call-date history. |
| **CD2** | JSON name | `callDate` (camelCase). |
| **CD3** | Value | Calendar date only. No time. No timezone. JSON is `yyyy-MM-dd` or `null`. |
| **CD4** | Storage | `candidates.call_date`, SQL `date NULL`. Not `datetime` / `datetimeoffset`. |
| **CD5** | Empty | `null`, omit, or `""` → store `null`. Do not 400 for empty. |
| **CD6** | Invalid | A value that is not a real calendar date → **400**. Example: `"2026-02-31"`, `"29-09-2026"`, a number, an object. |
| **CD7** | Range | Any real calendar date is valid, including a future date. Do not reject future dates. |
| **CD8** | Existing rows | Migration adds the column. Every existing row stays `null`. No backfill. |
| **CD9** | List | Each `GET /api/candidates` item includes `callDate`, on the admin list DTO **and** `CandidateRecruiterListItemDto`. |
| **CD10** | Detail | `GET /api/candidates/{id}` includes `callDate` on the admin detail DTO **and** `CandidateRecruiterDetailDto`. |
| **CD11** | Write | Same property on `POST /api/candidates` and `PUT /api/candidates/{id}` bodies, and on those success responses. |
| **CD12** | Recruiter write | Recruiter `POST /api/candidates` may include `callDate` (not a salary or work-experience compensation field; do not 400 for it). Recruiter `PUT /api/candidates/{id}` stays **403** for the whole request. |
| **CD13** | Filter | No query parameter and no list filter. No index. |
| **CD14** | Verification | The create/edit checkbox is UI-only. Do not persist a verified flag. |
| **CD15** | Other routes | No new route. Saving this date does not change `callStatus` or call notes. Nested candidate routes, resume, and recalculate endpoints do not read or write this column. |

---

## 2. Database

```sql
ALTER TABLE candidates
  ADD call_date date NULL;
```

- Nullable. No default other than `NULL`.
- Existing and soft-deleted rows stay `NULL`.
- No index.

---

## 3. JSON

| Field | Type | Present |
|-------|------|---------|
| `callDate` | `string \| null` (`yyyy-MM-dd`) | List item, `GET /api/candidates/{id}`, `POST` response, `PUT` response |

Always include the key on those payloads. Empty is `null`, not `""`, and not an omitted key.

---

## 4. Endpoints

Soft-deleted or unknown id → **404**, same as the other candidate routes.

### `GET /api/candidates` (list)

Every `items[]` element, admin and recruiter:

```json
{
  "id": 42,
  "name": "Ayesha Khan",
  "callStatus": 1,
  "callDate": null
}
```

After a date is saved:

```json
{
  "id": 42,
  "name": "Ayesha Khan",
  "callStatus": 1,
  "callDate": "2026-09-29"
}
```

No new query parameter.

### `GET /api/candidates/{id}`

Same `callDate` property on admin detail and recruiter detail.

### `POST /api/candidates`

Accepted for Admin, SuperAdmin, and Recruiter (recruiter salary rules are unchanged).

| Body | Stored |
|------|--------|
| property omitted | `null` |
| `null` or `""` | `null` |
| `"2026-09-29"` | that calendar date |
| not a real date | **400** |

`201`/`200` body is the full candidate and includes `callDate` as stored (`yyyy-MM-dd` or `null`).

### `PUT /api/candidates/{id}`

Basic-info replacement, same as `city`. Admin and SuperAdmin only. Recruiter → **403** before any field is applied.

| Body | Stored |
|------|--------|
| `null`, omitted, or `""` | `null` (clears a previous date) |
| `"2026-09-29"` | that calendar date |
| not a real date | **400** |

`200` body is the full candidate and includes `callDate` as stored.

`callStatus` is unchanged by this field. Call notes are unchanged.

---

## 5. Acceptance

1. After migrate, an old candidate has `"callDate": null` on list and on GET by id.
2. `POST` with `"callDate": "2026-09-29"` persists that date. List, GET by id, and the create response return `"2026-09-29"`. `callStatus` is whatever was sent for call status, not derived from the date.
3. `POST` with `"callDate": null`, `""`, or without the property stores `null`.
4. `POST` with `"callDate": "2026-02-31"` → **400**.
5. `PUT` with a new date replaces the stored date. `PUT` with `null` clears it.
6. A future date such as `"2030-01-01"` is stored.
7. Recruiter list items and recruiter GET by id include `callDate`.
8. Recruiter `POST` with `callDate` and no salary fields succeeds. Recruiter `PUT /api/candidates/{id}` is **403**.
9. `GET /api/candidates` has no `callDate` query. `GET`/`PATCH /api/candidates/{id}/call-notes` is unchanged.
