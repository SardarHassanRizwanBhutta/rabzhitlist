# Backend contract: employer `status` (scalar)

Handoff for **one** stored status per employer (`Open` or `Closed`, or none). JSON is a **scalar**, not an array. Postgres type `employer_status` is **`open` | `closed` only** (no `flagged`).

**Frontend:** map `EmployerDto.status` `0` | `1` | `null`. Do **not** send `[0]` / `[1]`. PUT: omit to leave unchanged; send `null` to clear.

---

## 1. Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| **L1** | Values | `0` Open, `1` Closed. No Flagged. |
| **L2** | Cardinality | At most one join row per employer. |
| **L3** | Detail GET | `EmployerDto.status`: `0` \| `1` \| `null`. Always present. `null` = no join row. |
| **L4** | List GET | Same ints (or `null`), **not** a display string. |
| **L5** | POST | Omit / `null` → no row. `0` / `1` → that one row. |
| **L6** | PUT | Omit → unchanged. `"status": null` → clear. `0` / `1` → replace with that one. |
| **L7** | Filters | Single value. Employer list: `status=0`. Candidates: `employerStatus` (not `employerStatuses`). |
| **L8** | Data cleanup | Delete `flagged` rows (employer then has no status). If Open **and** Closed on the same employer, delete **all** that employer’s status rows. |

---

## 2. Enum

C# `EmployerStatus`. Postgres `employer_status` (`open`, `closed`). `MapEnum<EmployerStatus>()` in `Program.cs`.

| Int | C# | Postgres | Display label |
|-----|-----|----------|----------------|
| `0` | `Open` | `open` | Open |
| `1` | `Closed` | `closed` | Closed |

JSON and query convention: **integers**.

---

## 3. Storage

Table `employer_employer_statuses`:

- PK: `(employer_id, status)`
- `status` type `employer_status`, **not null**
- FK to `employers` **ON DELETE CASCADE**
- Index: `idx_employer_employer_statuses_status`

No status → **zero rows**, not a null column on `employers`.

Soft-deleted employers (`employers.deleted_at`) are excluded from list/filter and return not-found on detail GET.

---

## 4. `GET /api/employers/{id}`

| JSON field | C# | Type |
|------------|-----|------|
| `status` | `Status` | `EmployerStatus?` (`0` \| `1` \| `null`) |

Examples:

```json
{ "id": 42, "name": "Acme Corp", "types": [1], "status": 0 }
```

```json
{ "id": 43, "name": "Name Only Inc", "types": [], "status": null }
```

Do not emit `"Open"`, `"open"`, or `[0]` on this field.

---

## 5. HTTP / DTO

JSON enums remain **integers**.

| API | JSON field | Type | Behavior |
|-----|------------|------|----------|
| **POST** `/api/employers` | `status` | `EmployerStatus?` | Omit / `null` → no row. `0` / `1` → one row. |
| **PUT** `/api/employers/{id}` | `status` | omitted vs `null` vs `0`/`1` | Omit → do not change. JSON `null` → **clear**. `0`/`1` → replace with that one. Arrays are invalid (400). |
| **GET** `/api/employers` (list) | `status` | `EmployerStatus?` | `0` / `1` / `null`. |
| **GET** `/api/employers` filter | `status` | `EmployerStatus?` | `status=0` or `status=1`. Omit → filter off. |
| **GET** `/api/candidates` filter | `employerStatus` | `EmployerStatus?` | Candidate matches if any work experience’s **non-deleted** employer has that stored status. |
| Candidate list `matchedEmployers` | `statuses` | `{ id, label }[]` | When employer match filters are active; intersection with requested `employerStatus`. Labels: `"Open"` / `"Closed"`. |

---

## 6. Data progress

If there is **one** join row, status contributes **2.5** points. Zero rows → missing field `"Status"`.

---

## 7. Acceptance

1. Detail JSON `"status"` is `0`, `1`, or `null` — never an array, never `2`.
2. List `status` is the same int-or-null shape.
3. POST omit/`null` creates zero join rows; POST `0` creates Open.
4. PUT omit leaves join rows unchanged; PUT `null` clears; PUT `1` replaces with Closed.
5. Soft-deleted employer: not-found; no `EmployerDto`.

---

## 8. Frontend integration

Implemented:

- Scalar `status` maps to the employer form’s single select (`Open`, `Closed`, or no status).
- POST sends `null`, `0`, or `1`; never an array.
- PUT omits `status` when unchanged, sends `null` when explicitly cleared, and sends `0`/`1` when changed.
- Employer list filter sends scalar `status`.
- Candidate filter sends singular `employerStatus`.
