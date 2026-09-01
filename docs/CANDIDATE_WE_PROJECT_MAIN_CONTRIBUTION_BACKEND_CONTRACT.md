# Backend contract: Main Contribution on work-experience projects

Handoff for a boolean **Main Contribution** flag on each **candidate work-experience project** row (the candidate’s link to a project under a work experience). It means they were the **main owner of delivery** on that project.

This is **not** a project-catalog field. Do **not** put it on `projects`. JSON name is **`isMainContribution`**.

**Frontend (after this API ships):** checkbox on Create/Edit Candidate and Candidate Details (with field verification); Candidates list filter (has at least one flagged project) plus match-expand badge when that filter is on. Cold Caller uses the **same create form checkbox**. No QG question, no call-notes extract, no QG / completeness weight.

---

## 1. Locked product decisions

| # | Topic | Decision |
|---|--------|----------|
| **L1** | Grain | One boolean per **candidate ↔ work-experience ↔ project** row. |
| **L2** | Cardinality | **Any number** of projects on the **same** work experience may be `true`. No uniqueness. |
| **L3** | Meaning | Candidate was the **main owner of delivery** on that project. Independent of contribution text. |
| **L4** | JSON / storage | Boolean **`isMainContribution`**. Never strings. Never `mainContribution`. |
| **L5** | Required | Optional. **Default `false`**. |
| **L6** | Existing rows | Migration sets **`false`** on all current WE-project rows (including soft-deleted). |
| **L7** | New rows | **`false`** when omitted/`null` on create or upsert. |
| **L8** | Cold Caller / QG | **Do not** add to question generation, call-notes extract, or QG / data-progress weights. |
| **L9** | List filter | Candidates who have **at least one** WE project with `isMainContribution = true`. v1 does **not** filter “only false”. |
| **L10** | List badge | **Match-expand only** (like Topper), when the filter in L9 is on. No standing table column. |

---

## 2. Database

- Add `is_main_contribution` (or equivalent) on **`candidate_work_experience_projects`** (junction / WE-project link), **NOT NULL**, default **`false`**.
- **Existing rows:** `UPDATE` all current rows to **`false`** in the same migration.
- Soft-deleted rows: still set to `false` in the backfill so a restore does not leave NULL.

No change to the project catalog table.

---

## 3. JSON field

| Field | Type | Where |
|-------|------|--------|
| `isMainContribution` | `boolean` | Nested WE `projects[]` on GET candidate-by-id; POST create WE `projects[]`; PUT WE-project upsert body; GET list `matchedProjects[]` when the list filter is active |

Contribution text stays **`contribution`** on write (frontend maps to `contributionNotes` on read). Do not rename it.

---

## 4. Endpoints

### `GET /api/candidates/{id}`

Each `workExperiences[].projects[]` item includes `isMainContribution` (`true` / `false`, never omit after migrate).

### `POST /api/candidates`

Nested `workExperiences[].projects[]`:

| Body | Behavior |
|------|----------|
| omit / `null` | Persist **`false`**. |
| `true` / `false` | Persist that value. |
| other | **400**. |

Example fragment:

```json
{
  "projectId": 3,
  "contribution": "Led delivery",
  "isMainContribution": true
}
```

### `PUT /api/candidates/{id}/work-experiences/{weId}/projects/{projectId}`

Same shape as today plus `isMainContribution`.

| Body | Behavior |
|------|----------|
| omit / `null` | Persist **`false`** (full replacement of this link’s scalars, same as treating missing contribution as clear/null). |
| `true` / `false` | Persist that value. |
| other | **400**. |

Frontend will **always send** the boolean on upsert so a project-name change does not wipe the flag.

### `GET /api/candidates` (list)

**New query (AND with every other active candidate filter):**

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `isMainContribution` | `bool?` | `true` | Candidate has **≥ 1** `candidate_work_experience_projects` row with `isMainContribution = true`. |

- Send only `isMainContribution=true` from the UI. Do **not** implement `false` in v1.
- Invalid value → **400**.
- Apply in SQL so `totalCount` / paging are correct.

**`matchedProjects` when `isMainContribution=true` is active:**

Include every linked WE project that has `isMainContribution = true` (and still include projects that match other active project filters, same as today).

Each matched project object includes:

| Field | Type | When |
|-------|------|------|
| `isMainContribution` | `boolean` | `true` when this project matched because it is a main contribution (always `true` for rows included solely by this filter). |

Other `matchedProjects` fields stay as today (`projectId`, `projectName`, domain/stack intersections, etc.). Empty arrays / nulls when those other filters are off.

Do not require other project filters to be on for `matchedProjects` to be populated for this flag.

---

## 5. Out of scope (v1)

- QG / question-service field, call-notes extract, data-progress scoring weight
- Resume parser auto-fill (leave `false`)
- Filtering candidates who have **no** main-contribution projects (`isMainContribution=false`)
- Standing Candidates table column

---

## 6. Acceptance

- GET by id returns `isMainContribution` on every WE project.
- POST nested project with omit/`null` stores `false`; `true` stores `true`.
- PUT WE-project upsert persists `isMainContribution`.
- `GET /api/candidates?isMainContribution=true` returns only candidates with at least one flagged WE project; those rows include `matchedProjects` with `isMainContribution: true` on the flagged projects.
- Existing rows after migrate are `false`.
- Invalid boolean → **400**.
