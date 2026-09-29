# Backend contract: work-experience salary range

**Status:** Implemented. Migration `20260929181000_AddCandidateWorkExperienceSalaryRange` adds nullable `candidate_work_experiences.minimum_salary` and `candidate_work_experiences.maximum_salary` (`integer`). Apply with `dotnet ef database update`.

Handoff for one optional minimum and one optional maximum on each work-experience row. The UI labels are **Minimum Salary** and **Maximum Salary**. They are the salary range for that row’s job title.

This is **not** `salaryPolicy` on the work experience. Setting these amounts does not change salary policy.

This is **not** the candidate’s `currentSalary` or `expectedSalary`. Those fields, their filters (`currentSalaryMin` / `currentSalaryMax`, `expectedSalaryMin` / `expectedSalaryMax`), and their recruiter rules stay as they are.

This is **not** employer salary policy (`employerSalaryPolicies`).

**Frontend already sends and reads these fields** (2026-09-29). Create, Edit, the details modal, the experience filter, and card match badges are wired to the names and rules below. The candidates table does not show them.

---

## 1. Locked decisions

| # | Topic | Decision |
|---|--------|----------|
| **SR1** | Grain | One minimum and one maximum per `candidate_work_experiences` row. Not per project. Not per candidate. |
| **SR2** | JSON names | `minimumSalary` and `maximumSalary` (camelCase) on each work experience. |
| **SR3** | Query names | `workExperienceSalaryMin` and `workExperienceSalaryMax` on `GET /api/candidates` only. |
| **SR4** | Value | Whole number of PKR. Same unit as `currentSalary` and `expectedSalary`. No currency code and no separate currency column. |
| **SR5** | Storage | `candidate_work_experiences.minimum_salary` and `candidate_work_experiences.maximum_salary`, SQL `int NULL`. Not `decimal`. Not `float`. |
| **SR6** | Empty | On a work-experience write, `null` or omit → store `null` for that side. Do not 400 for empty. `0` is a real amount, not empty. |
| **SR7** | Both sides | Either side may be null. If both are non-null, `minimumSalary` must be `<=` `maximumSalary`. Otherwise **400**. |
| **SR8** | Invalid | A value that is not a whole number from `0` through `2147483647` → **400**. Reject negatives, fractions, strings, arrays, and objects. |
| **SR9** | Existing rows | Migration adds both columns. Every existing row, including soft-deleted rows, stays `null` on both sides. No backfill. |
| **SR10** | Detail | Each `workExperiences[]` item on admin `GET /api/candidates/{id}`, and on admin create/update responses that return work experiences, includes both keys (`number` or `null`). |
| **SR11** | List root | Do **not** add these keys to the candidate list item. List items still omit the full work-experience graph. |
| **SR12** | Match payload | When the new filter is active, `matchedWorkExperiences[]` includes the stored amounts for each work experience that overlapped the filter. See §5. |
| **SR13** | Filter meaning | Range **overlap**, not “one salary falls inside the filter.” A missing stored bound is unbounded on that side. A missing filter bound is unbounded on that side. Match is inclusive. A candidate matches if **any** non-deleted work experience overlaps. |
| **SR14** | Recruiter read | Omit both keys from recruiter DTOs (not `null`): `CandidateWorkExperienceRecruiterDto`, recruiter detail, and `MatchedWorkExperienceRecruiterDto`. Same omission style as `currentSalary` and work-experience `salaryPolicy`. |
| **SR15** | Recruiter write | These are work-experience compensation fields, same class as `salaryPolicy`. Recruiter `POST /api/candidates` that sends either property as a number → **400** with the existing message below. Recruiter `PUT /api/candidates/{id}` stays **403** for the whole request. Recruiter nested work-experience writes stay **403**. |
| **SR16** | Recruiter filter | Recruiter `GET /api/candidates` with either new query parameter present → **403** with the existing salary-filter message below. Check this before parsing the value. |
| **SR17** | Verification | The create/edit checkboxes are UI-only. Do not persist a verified flag. |
| **SR18** | Out of scope | Do not change salary policy, current salary, expected salary, data-progress scoring, question generation, call notes, or resume parsing. Do not add a candidates-table column. |

Recruiter `POST` **400** message (existing, do not invent a new one):

`Work experience salary policy and benefits cannot be set for your role.`

Recruiter list-filter **403** message (existing, do not invent a new one):

`You do not have permission to filter candidates by salary or compensation fields.`

---

## 2. Database

```sql
ALTER TABLE candidate_work_experiences
  ADD minimum_salary int NULL,
      maximum_salary int NULL;
```

- Both nullable. No default other than `NULL`.
- Existing and soft-deleted rows stay `NULL` / `NULL`.
- No check constraint that rejects a null side. A row may have only a minimum, only a maximum, both, or neither.
- If a check constraint is added, it must allow either side to be null and, when both are non-null, require `minimum_salary <= maximum_salary`.
- No new index is required.

`salary_policy` is unchanged.

---

## 3. JSON on a work experience

Admin work-experience objects only (detail, create body, create response, work-experience sub-resource body and response).

| Field | Type | Present |
|-------|------|---------|
| `minimumSalary` | `number \| null` | Always on admin work-experience reads. `null` when unset. |
| `maximumSalary` | `number \| null` | Always on admin work-experience reads. `null` when unset. |

Numbers are JSON integers. `0` is valid. Do not return a fractional number.

Recruiter work-experience JSON does not contain these keys.

```json
{
  "employerId": 1,
  "jobTitle": "Staff Engineer",
  "salaryPolicy": 0,
  "minimumSalary": 150000,
  "maximumSalary": 250000
}
```

Open-ended examples:

```json
{ "minimumSalary": 120000, "maximumSalary": null }
```

```json
{ "minimumSalary": null, "maximumSalary": 180000 }
```

```json
{ "minimumSalary": null, "maximumSalary": null }
```

---

## 4. Write endpoints

Soft-deleted or unknown candidate id → **404**, same as the other candidate routes. Unknown work-experience id → **404**, same as the other work-experience routes.

Apply the same parent `updatedBy` behavior already used when `salaryPolicy` on that work experience is created or updated. Do not add a separate stamp rule. Recalculate endpoints must not write these columns.

### `POST /api/candidates`

Nested `workExperiences[]` items may include both properties. Admin and SuperAdmin.

| Body on that work experience | Stored |
|------------------------------|--------|
| property omitted | `null` |
| `null` | `null` |
| `150000` | `150000` |
| `0` | `0` |
| not a whole number in `0..2147483647` | **400** |
| both set and minimum > maximum | **400** |

`201`/`200` body is the full candidate. Each returned work experience includes both keys as stored.

Recruiter `POST` may still create a candidate with work experiences. If any nested work experience includes `minimumSalary` or `maximumSalary` as a number, **400** with the compensation message in §1, and persist nothing from that request. Omit, or `null`, does not by itself cause that 400.

### `POST /api/candidates/{id}/work-experiences`

### `PUT /api/candidates/{id}/work-experiences/{workExperienceId}`

Same property rules as the nested create item. Admin and SuperAdmin only. Recruiter → **403** before any field is applied.

`PUT` replaces these two columns the same way it replaces `salaryPolicy`: omitted or `null` clears that side. Sending a new number replaces the stored number.

The work-experience response includes both keys as stored.

### `PUT /api/candidates/{id}`

Basic-info replacement. These properties are not candidate-root fields. Do not read them from the candidate root. This route’s body is otherwise unchanged.

---

## 5. List filter

`GET /api/candidates`

| Query | Type | When |
|-------|------|------|
| `workExperienceSalaryMin` | whole number `0..2147483647` | optional |
| `workExperienceSalaryMax` | whole number `0..2147483647` | optional |

Admin and SuperAdmin. Recruiter: if either key is present, **403** with the message in §1, even when the value is invalid.

For Admin and SuperAdmin:

| Query | Result |
|-------|--------|
| both omitted | this filter is off |
| not a whole number in range | **400** |
| both set and min > max | **400** |
| only min | filter span is `[min, +∞)` |
| only max | filter span is `(-∞, max]` |
| both set | filter span is `[min, max]` |

### Overlap

Compare each non-deleted work experience to the filter span.

Treat a null stored minimum as −∞ and a null stored maximum as +∞. A work experience with **both** sides null does **not** match.

The row matches when:

`storedMin <= filterMax` AND `storedMax >= filterMin`

using those open ends.

The candidate is returned when **any** of their work experiences matches. Other active filters still AND with this one, same as `workExperienceSalaryPolicies`.

Confirmed cases for filter `100000`–`200000`:

| Stored minimum | Stored maximum | Match |
|----------------|----------------|-------|
| `150000` | `250000` | yes |
| `120000` | `null` | yes |
| `null` | `180000` | yes |
| `250000` | `null` | no |
| `null` | `50000` | no |
| `null` | `null` | no |
| `100000` | `100000` | yes |
| `200000` | `200000` | yes |

`salaryPolicy` is not part of this comparison.

### `matchedWorkExperiences`

Add this filter as a driver, alongside `shiftTypes`, `workModes`, `workExperienceSalaryPolicies`, `timeSupportZoneIds`, `workExperienceTechStackIds`, `workExperienceBenefitIds`, and `employerLocationIds`.

If this filter is off, every admin matched item still includes the keys with `null`:

```json
{ "minimumSalary": null, "maximumSalary": null }
```

If this filter is on, include a work experience when it overlaps, even if no other driver matched it. On that item, set `minimumSalary` and `maximumSalary` to the **stored** values (`null` on a side that is unset). Do not echo the filter bounds.

If this filter is on but this work experience was included because of a different driver and it does **not** overlap, both keys stay `null`.

One entry per matching work experience, not deduped by employer. Soft-deleted work experiences are excluded, same as the other work-experience drivers.

Recruiter `matchedWorkExperiences` items omit both keys. Recruiters cannot turn this driver on.

Example, filter `workExperienceSalaryMin=100000&workExperienceSalaryMax=200000`, stored `150000`–`250000`:

```json
{
  "workExperienceId": 5501,
  "employerId": 42,
  "employerName": "Acme Corp",
  "jobTitle": "Staff Engineer",
  "startDate": "2022-06-01",
  "endDate": null,
  "salaryPolicy": null,
  "minimumSalary": 150000,
  "maximumSalary": 250000
}
```

`salaryPolicy` in that example is `null` because `workExperienceSalaryPolicies` was not in the query. Do not fill it from the salary-range filter.

---

## 6. Acceptance

1. After migrate, an old work experience has `"minimumSalary": null` and `"maximumSalary": null` on `GET /api/candidates/{id}`.
2. Admin `POST /api/candidates` with a work experience `"minimumSalary": 150000, "maximumSalary": 250000` persists both. GET by id and the create response return those integers. `salaryPolicy`, `currentSalary`, and `expectedSalary` are unchanged by these properties.
3. Admin `POST` with only `"minimumSalary": 120000` stores maximum `null`. Only `"maximumSalary": 180000` stores minimum `null`. Both omitted or `null` stores `null` / `null`. `"minimumSalary": 0` stores `0`.
4. Admin `POST` with `"minimumSalary": 200000, "maximumSalary": 100000` → **400**. `"minimumSalary": 1.5`, `"-1"`, or `"150000"` (a string) → **400**.
5. Admin `PUT /api/candidates/{id}/work-experiences/{workExperienceId}` with a new pair replaces both sides. `null` on one side clears that side and leaves the other side as sent.
6. `PUT /api/candidates/{id}` without these properties does not clear them.
7. `GET /api/candidates?workExperienceSalaryMin=100000&workExperienceSalaryMax=200000` returns a candidate who has any of: `150000`–`250000`, minimum-only `120000`, or maximum-only `180000`. It does not return a candidate whose only ranged role is minimum-only `250000` or maximum-only `50000`.
8. That same query’s `matchedWorkExperiences` entry for the overlapping role has `"minimumSalary"` and `"maximumSalary"` equal to the stored amounts. A role that did not overlap is absent unless another active driver included it, in which case both salary keys are `null`.
9. `GET /api/candidates?workExperienceSalaryMin=200000&workExperienceSalaryMax=100000` → **400** for Admin. `workExperienceSalaryMin=abc` → **400** for Admin.
10. Recruiter `GET /api/candidates?workExperienceSalaryMin=1` → **403** with the existing salary-filter message. Recruiter list and detail JSON do not contain `minimumSalary` or `maximumSalary`.
11. Recruiter `POST /api/candidates` with `workExperiences[].minimumSalary: 100000` → **400** with the existing work-experience compensation message. Recruiter `POST` without these properties still succeeds when the rest of the body is valid. Recruiter `PUT /api/candidates/{id}` is **403**.
12. No data-progress weight, question-generation field, or call-notes field is added for these columns.
