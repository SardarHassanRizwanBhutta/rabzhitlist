# Backend contract: education campus location

Handoff for an optional **university campus location** on each candidate education / `CandidateUniversity` row. Recruiters link a candidate to a **university**, and to a **specific location of that university** when known.

This is **not** a second join table. JSON name for the campus PK is **`universityLocationId`**. Do **not** store city/country text as the link.

**Frontend (after this API ships):** Create/Edit/Cold Caller — University combobox, then optional Location select (city only). Details — same, with field verification. Candidates list filter — location multi-select **only after** one or more universities are selected.

---

## 1. Locked product decisions

| # | Topic | Decision |
|---|--------|----------|
| **L1** | Grain | **Per education row** (same entity as today: education / `CandidateUniversity`). |
| **L2** | Unknown campus | `universityId` set, `universityLocationId` **null** (whole university). |
| **L3** | Known campus | Both set. At most **one** location per education. |
| **L4** | Identity | `universityLocationId` is the **`university_locations` primary key**. |
| **L5** | Existing rows | Migration sets `university_location_id` **null**. |
| **L6** | UI location label | **City — Address**. City only when address is empty. |
| **L7** | List filter | Multi-value OR on location ids. Control enabled only when **≥1 university** is selected. Options = locations of those universities. **No** “unknown location” filter. |
| **L8** | Verification | Location is a verifiable education field. |

---

## 2. Database

On the education / `candidate_universities` (or equivalent) table:

- Add **`university_location_id`** nullable FK → `university_locations.id`.
- **Existing rows:** `UPDATE` to **null**.
- Soft-deleted rows: still null in the backfill.

Keep **`university_id`** as today.

---

## 3. JSON field

| Field | Type | Meaning |
|-------|------|---------|
| `universityId` | `number` | Catalog university (unchanged). |
| `universityLocationId` | `number \| null` | Campus location PK, or **null** if unknown. |

On GET education, include both. Do **not** reuse `universityLocationId` as an alias for `universityId`.

---

## 4. Write rules

### POST create education / nested `educations[]`

| Body | Behavior |
|------|----------|
| `universityLocationId` omit / `null` | Persist **null**. |
| valid id whose `university_id` equals the row’s `universityId` | Persist that id. |
| id missing, or location belongs to another university | **400**. |
| `universityLocationId` set and `universityId` missing / 0 | **400**. |

### PUT update education

Same write rules as create. Omit/`null` stores **null**. A new `universityId` with the previous location (or any location that does not belong to that university) → **400**. Frontend must send a valid pair or `universityLocationId: null` when the university changes.

Frontend always sends `universityLocationId` (`number` or `null`) on create/update of an education row.

---

## 5. `GET /api/candidates` (list)

**New query (repeatable, OR within this field, AND with every other active candidate filter):**

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `universityLocationIds` | `long[]?` | length > 0 | Candidate has **≥1** education whose `universityLocationId` is **any** of the ids. |

Omit / empty = filter off. Invalid / non-positive id → **400**. Apply in SQL so paging / `totalCount` are correct.

Rows with `universityLocationId` null **do not** match this filter.

When `universityIds` and `universityLocationIds` are both sent: both predicates apply (AND). A location always belongs to one university; the UI only offers locations of the selected universities.

### `matchedEducations` when `universityLocationIds` is active

Include each education row that matched via location (and still include rows that match other education filters, as today).

| Field | Type | When |
|-------|------|------|
| `universityLocationId` | `number \| null` | Location PK when this row matched the location filter. |
| `universityLocationCity` | `string \| null` | That location’s **city**. |
| `universityLocationAddress` | `string \| null` | That location’s **address** (UI shows `City — Address`). |
| `matchedByUniversityLocationId` | `boolean` | `true` when this row matched `universityLocationIds`. |

---

## 6. `GET /api/candidates/{id}`

Each `educations[]` item includes `universityId` and `universityLocationId` (`number` or `null`).

---

## 7. Out of scope (v1)

- QG / question-service / call-notes extract for location
- Filtering “location unknown”
- Location label other than **City — Address**

---

## 8. Acceptance

- GET by id returns `universityLocationId` null or a location PK on every education.
- POST/PUT with omit/null stores null; valid pair stores the id; cross-university location → **400**.
- `GET /api/candidates?universityLocationIds=1&universityLocationIds=2` returns only candidates with a matching education location; `matchedEducations` includes city + `matchedByUniversityLocationId`.
- Existing rows after migrate are null.
