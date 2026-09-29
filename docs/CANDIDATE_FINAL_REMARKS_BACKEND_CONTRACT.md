# Backend contract: candidate Final Remarks

Handoff for one nullable text column on `candidates`. The UI label is **Final Remarks**. It stores remarks written after a call or after reviewing the profile.

This is **not** call notes. Do **not** add it to `GET`/`PATCH /api/candidates/{id}/call-notes`. Do **not** use the JSON names `callNotes` or `call_notes`.

**Frontend already sends and reads this field** (2026-09-29). Create and update will drop the text until this API stores it.

---

## 1. Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| **FR1** | Grain | One current value per candidate. No history table. |
| **FR2** | JSON name | `finalRemarks` (camelCase) on the main candidate DTOs. |
| **FR3** | Storage | `candidates.final_remarks`, `nvarchar(max) NULL`. No application max length. No 400 for length. |
| **FR4** | Empty | `null`, omit, or whitespace-only → store `null`. A non-empty string is stored **exactly** (keep internal newlines and spaces). Do not 400 for empty. |
| **FR5** | Existing rows | Migration adds the column. Every existing row stays `null`. No backfill. |
| **FR6** | List | **Do not** put `finalRemarks` on list item DTOs (`GET /api/candidates` `items[]`, admin or recruiter). |
| **FR7** | Read | `GET /api/candidates/{id}` includes `finalRemarks` on the admin detail DTO **and** on `CandidateRecruiterDetailDto`. |
| **FR8** | Write | Same property on `POST /api/candidates` and `PUT /api/candidates/{id}` bodies, and on those success responses. |
| **FR9** | Recruiter write | Recruiter `POST /api/candidates` may include `finalRemarks` (it is not a salary or work-experience compensation field; do not 400 for it). Recruiter `PUT /api/candidates/{id}` stays **403** for the whole request, unchanged. |
| **FR10** | Filter | No query parameter, no search, no list filter. No index. |
| **FR11** | Verification | The create/edit checkbox is UI-only. Do not persist a verified flag for this field. |
| **FR12** | Other routes | No new route. Nested candidate routes, call-notes, resume, and recalculate endpoints do not read or write this column. |

---

## 2. Database

```sql
ALTER TABLE candidates
  ADD final_remarks nvarchar(max) NULL;
```

- Nullable. No default other than `NULL`.
- Existing and soft-deleted rows stay `NULL`.
- No index.

---

## 3. JSON

| Field | Type | Present |
|-------|------|---------|
| `finalRemarks` | `string \| null` | `GET /api/candidates/{id}` (admin and recruiter detail), `POST /api/candidates` response, `PUT /api/candidates/{id}` response |

Always include the key on those payloads. Empty is `null`, not `""`, and not an omitted key.

List payloads omit the key entirely.

---

## 4. Endpoints

Soft-deleted or unknown id → **404**, same as the other candidate routes.

### `GET /api/candidates/{id}`

Admin detail and recruiter detail:

```json
{
  "id": 42,
  "name": "Ayesha Khan",
  "finalRemarks": null
}
```

After a non-empty save:

```json
{
  "id": 42,
  "name": "Ayesha Khan",
  "finalRemarks": "Strong communicator.\nFollow up next week."
}
```

### `GET /api/candidates` (list)

Do not add `finalRemarks` to list items.

### `POST /api/candidates`

Accepted for Admin, SuperAdmin, and Recruiter (recruiter salary rules are unchanged).

| Body | Stored |
|------|--------|
| property omitted | `null` |
| `null` | `null` |
| `""` or whitespace only | `null` |
| any other string | that string, unchanged |

Wrong JSON type (number, object, array) → **400**.

`201`/`200` body is the full candidate and includes `finalRemarks` as stored.

### `PUT /api/candidates/{id}`

Basic-info replacement, same as `city`. Admin and SuperAdmin only. Recruiter → **403** before any field is applied.

| Body | Stored |
|------|--------|
| `null`, omitted, `""`, or whitespace only | `null` (clears a previous value) |
| any other string | that string, unchanged |

Wrong JSON type → **400**.

`200` body is the full candidate and includes `finalRemarks` as stored.

This PUT does not change call notes. Saving call notes does not change `finalRemarks`.

---

## 5. Acceptance

1. After migrate, `GET /api/candidates/{id}` for an old candidate returns `"finalRemarks": null`. List `items[]` do not contain `finalRemarks`.
2. `POST` with `"finalRemarks": "Follow up Friday."` persists that exact text. GET by id and the create response return it.
3. `POST` with `"finalRemarks": null`, `""`, `"   "`, or without the property stores `null`.
4. `PUT` with a new string replaces the stored text. `PUT` with `null` clears it back to `null`.
5. A string longer than typical `nvarchar(n)` caps (multi-paragraph) is stored. No length **400**.
6. Recruiter `GET /api/candidates/{id}` includes `finalRemarks`. Recruiter list items do not.
7. Recruiter `POST` with `finalRemarks` and no salary fields succeeds. Recruiter `PUT /api/candidates/{id}` is **403**.
8. `GET`/`PATCH /api/candidates/{id}/call-notes` is unchanged.
9. No `finalRemarks` query on the candidates list.
