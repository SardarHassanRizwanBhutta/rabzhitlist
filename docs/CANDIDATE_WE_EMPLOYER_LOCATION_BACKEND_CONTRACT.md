# Backend contract: work-experience employer office location

Handoff for an optional **employer office location** on each candidate work-experience row. Recruiters link a candidate to an **employer**, and to a **specific office of that employer** when known.

This is **not** a second join table. JSON name for the office PK is **`employerLocationId`**. Do **not** store city/country/address text as the link.

This is **not** `workExperiences[].locations[]`. That array is an employer-catalog snapshot used by existing QG / extract code. Leave it unchanged. The new field is a single FK on the WE row.

**Frontend (after this API ships):** Create/Edit/Cold Caller — Employer combobox, then optional Office Location combobox (`City — Address`). Details — same, with field verification. Candidates list filter — office multi-select **only after** one or more employers are selected.

---

## 1. Locked product decisions

| # | Topic | Decision |
|---|--------|----------|
| **L1** | Grain | **Per work-experience row** (`candidate_work_experiences`). At most **one** office per WE. |
| **L2** | Unknown office | `employerId` set, `employerLocationId` **null** (whole employer). |
| **L3** | Known office | Both set. |
| **L4** | Identity | `employerLocationId` is the **`employer_locations` primary key**. |
| **L5** | Existing rows | Migration sets `employer_location_id` **null**. |
| **L6** | UI option label | **City — Address**. City only when address is empty. Country and HQ are **not** in the option text. |
| **L7** | List filter | Multi-value OR on office ids. Control enabled only when **≥1 employer** is selected. Options = offices of those employers. **No** “unknown office” filter. |
| **L8** | Verification | Office Location is a verifiable work-experience field. |
| **L9** | Change employer | Frontend clears office. Backend **400** if the new `employerId` does not own the sent `employerLocationId`. |
| **L10** | Auto-pick | Do **not** auto-select the only office or HQ. |
| **L11** | Catalog snapshot | Leave `workExperiences[].locations[]` (QG/extract snapshot) as-is. Do **not** replace it with this FK. |

---

## 2. Database

On **`candidate_work_experiences`**:

- Add **`employer_location_id`** nullable FK → **`employer_locations.id`**.
- **Existing rows:** `UPDATE` to **null**.
- Soft-deleted WE rows: still null in the backfill.

Keep **`employer_id`** as today (already nullable).

---

## 3. JSON field

| Field | Type | Meaning |
|-------|------|---------|
| `employerId` | `number \| null` | Catalog employer (unchanged). |
| `employerLocationId` | `number \| null` | Office PK (`employer_locations.id`), or **null** if unknown. |

On GET work experience, include both. Do **not** reuse `employerLocationId` as an alias for `employerId`. Do **not** send or require `workExperiences[].locations[]` for this feature.

---

## 4. Write rules

Apply to:

- `POST /api/candidates` nested `workExperiences[]`
- `POST /api/candidates/{candidateId}/work-experiences`
- `PUT /api/candidates/{candidateId}/work-experiences/{id}`

| Body | Behavior |
|------|----------|
| `employerLocationId` omit / `null` | Persist **null**. |
| valid id whose `employer_id` equals the row’s `employerId` | Persist that id. |
| id missing, or office belongs to another employer | **400**. |
| `employerLocationId` set and `employerId` missing / 0 / null | **400**. |

A new `employerId` with the previous office (or any office that does not belong to that employer) → **400**. Frontend must send a valid pair or `employerLocationId: null` when the employer changes.

Frontend always sends `employerLocationId` (`number` or `null`) on create/update of a work-experience row.

---

## 5. `GET /api/candidates` (list)

**New query (repeatable, OR within this field, AND with every other active candidate filter):**

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `employerLocationIds` | `long[]?` | length > 0 | Candidate has **≥1** work experience whose `employerLocationId` is **any** of the ids. |

Omit / empty = filter off. Invalid / non-positive id → **400**. Apply in SQL so paging / `totalCount` are correct.

Rows with `employerLocationId` null **do not** match this filter.

When `employerIds` and `employerLocationIds` are both sent: both predicates apply (AND). An office always belongs to one employer; the UI only offers offices of the selected employers.

This filter drives **`matchedWorkExperiences`** (same as other WE-row filters). It does **not** drive `matchedEmployers`.

### `matchedWorkExperiences` when `employerLocationIds` is active

Include each work-experience row that matched via office (and still include rows that match other WE filters, as today).

| Field | Type | When |
|-------|------|------|
| `employerLocationId` | `number \| null` | Office PK when this row matched the office filter. |
| `employerLocationCity` | `string \| null` | That office’s **city**. |
| `employerLocationAddress` | `string \| null` | That office’s **address** (UI shows `City — Address`). |
| `matchedByEmployerLocationId` | `boolean` | `true` when this row matched `employerLocationIds`. |

---

## 6. `GET /api/candidates/{id}`

Each `workExperiences[]` item includes `employerId` and `employerLocationId` (`number` or `null`).

---

## 7. Out of scope (v1)

- QG / question-service / call-notes extract for office
- Data-progress / completeness weight
- Filtering “office unknown”
- Option label other than **City — Address**
- Changing or removing `workExperiences[].locations[]` catalog snapshot

---

## 8. Acceptance

- GET by id returns `employerLocationId` null or an office PK on every work experience.
- POST/PUT with omit/null stores null; valid pair stores the id; cross-employer office → **400**.
- `GET /api/candidates?employerLocationIds=1&employerLocationIds=2` returns only candidates with a matching WE office; `matchedWorkExperiences` includes city + address + `matchedByEmployerLocationId`.
- Existing rows after migrate are null.
- `workExperiences[].locations[]` snapshot behavior is unchanged.
