# Employer Multi-Value Work Arrangements — Frontend Integration

**Status:** Backend **implemented** (2026-08-21). Frontend **implemented** (2026-08-21).  
**Audience:** Frontend / Next.js AI agent.

**Summary:** Employer `workMode`, `shiftType`, and `salaryPolicy` are now **arrays** stored in join tables (`employer_work_modes`, `employer_shift_types`, `employer_salary_policies`). An employer can have multiple values for each (union set). **Time support zones** were already multi-value via `timeSupportZoneIds` / `timeSupportZones` — no schema change there.

**Out of scope (backend):** Auto-deriving employer values from candidate work experiences. Values are **manual** via employer create/update for now.

---

## 1. API contract changes (breaking)

### Shape change (singular → plural arrays)

| Before (singular) | After (plural arrays) |
|-------------------|------------------------|
| `workMode` | **`workModes`** |
| `shiftType` | **`shiftTypes`** |
| `salaryPolicy` | **`salaryPolicies`** |

**Removed fields:** `workMode`, `shiftType`, `salaryPolicy` (singular).

- Empty / unset → **`[]`** (empty array), not `null` (create/update may omit or send `[]`).
- Duplicates in POST/PUT are deduplicated server-side.

### JSON body serialization (POST / PUT / GET detail) — **numeric enums**

This API project does **not** use `JsonStringEnumConverter` / `AddJsonOptions`. ASP.NET Core’s default **System.Text.Json** binding serializes C# enums as **0-based integers** on the wire.

**Do not send string enum names** (e.g. `"Remote"`, `"GrossSalary"`) in JSON bodies — model binding will fail with errors like:

```text
The JSON value could not be converted to MyApp.Domain.Enums.WorkMode
Path: $.workModes[0]
```

Use **integer arrays**, consistent with other employer DTO fields (`ranking`, `status`, `types` / `employerTypes`, etc.).

#### `CreateEmployerDto` (POST `/api/employers`)

```json
{
  "name": "Acme Corp",
  "workModes": [1, 2],
  "shiftTypes": [0],
  "salaryPolicies": [0],
  "timeSupportZoneIds": [1, 2],
  "employerTypes": [1],
  "isDplCompetitor": false
}
```

#### `UpdateEmployerDto` (PUT `/api/employers/{id}`)

Same numeric arrays for work arrangements. Employer types use **`types`** (not `employerTypes`):

```json
{
  "name": "Acme Corp",
  "workModes": [1, 2],
  "shiftTypes": [0, 1],
  "salaryPolicies": [0],
  "timeSupportZoneIds": [1, 2],
  "types": [1],
  "isDplCompetitor": false
}
```

Example mapping (0-based):

| Field | Int | Enum |
|-------|-----|------|
| `workModes` | `0` | Onsite |
| | `1` | Remote |
| | `2` | Hybrid |
| `shiftTypes` | `0` | Day |
| | `1` | Night |
| | `2` | Evening |
| | `3` | Rotational |
| | `4` | Flexible |
| | `5` | OnCall |
| `salaryPolicies` | `0` | GrossSalary |
| | `1` | RemittanceSalary |
| | `2` | NetSalary |
| | `3` | FixedSalaryPlusCommissionOrMonthlyBonus |

FE reference (Next.js repo): `WORK_MODE_TO_API`, `SHIFT_TYPE_TO_API`, `SALARY_POLICY_TO_API` in `src/lib/services/employers-api.ts`.

#### `EmployerDto` (GET `/api/employers/{id}`)

Same plural **numeric** arrays on read:

```json
{
  "id": 1,
  "name": "Acme Corp",
  "workModes": [1, 2],
  "shiftTypes": [0, 1],
  "salaryPolicies": [0],
  "timeSupportZones": [{ "id": 1, "name": "US Eastern" }],
  "types": [1]
}
```

### `EmployerListItemDto` (GET `/api/employers` paged list)

List rows may return **human-readable label strings** in arrays (server-normalized display text):

| Before | After |
|--------|--------|
| `workMode: "Remote"` | **`workModes: ["Remote", "Hybrid"]`** |
| `shiftType: "Day"` | **`shiftTypes: ["Day"]`** |
| `salaryPolicy: "Gross Salary"` | **`salaryPolicies: ["Gross Salary", "Net Salary"]`** |

**Parsing by endpoint:**

| Endpoint | `workModes` / `shiftTypes` / `salaryPolicies` wire format |
|----------|-----------------------------------------------------------|
| **GET `/api/employers/{id}`** (detail) | **Integer arrays** (same as POST/PUT) |
| **GET `/api/employers`** (paged list) | **Label string arrays** (display text only) |

List parsers may accept int or string elements defensively (see `parseWorkModesFromApi`, `parseShiftTypesFromApi`, `parseSalaryPoliciesFromApi` in the FE repo). **Detail parsers should expect integers only.**

---

## 2. Filters (unchanged query param names)

`GET /api/employers` filter query params keep existing names:

- `workModes=0&workModes=1`
- `shiftTypes=0`
- `salaryPolicies=0`

Send **repeated numeric enum values** (same integer mapping as POST/PUT). FE builds these via `WORK_MODE_TO_API`, `SHIFT_TYPE_TO_API`, `SALARY_POLICY_TO_API`.

**Semantics:** Employer matches if its **stored set** intersects the filter (any value in the employer’s join table matches any filter value). Same OR-within-array behavior as before, now against multi-value storage.

`timeSupportZones` filter unchanged (already multi; numeric zone ids).

> **Note:** JSON request/response bodies require **integer** enum values (no `JsonStringEnumConverter` on this API). **Query-string filters** may also accept enum **names** via ASP.NET model binding (e.g. `workModes=Remote`), but the FE should use **repeated numeric** params (`workModes=0&workModes=1`) to match JSON and avoid ambiguity.

---

## 3. Candidate list — matched employers (secondary breaking change)

`matchedEmployers[].salaryPolicy` (singular object) → **`matchedEmployers[].salaryPolicies`** (array of `{ id, label }` — `MatchedDomainDto`, not `name`).

Only populated when `employerSalaryPolicies` filter is active; contains the **intersection** of employer stored policies with the filter set (same pattern as `employerTypes`).

Work experience filters (`workModes`, `shiftTypes`, `workExperienceSalaryPolicies`) still apply to **per-experience** fields on `CandidateWorkExperience` — unchanged.

---

## 4. Data progress

`GET /api/employers/{id}/data-progress` does **not** return `workModes` / `shiftTypes` / `salaryPolicies` arrays. It returns sections with `missingFields` string labels.

Employer data-progress **scoring** (unchanged weighting):

- **Work Mode** section complete when the employer has **at least one** stored work mode (`"Work Mode"` absent from `missingFields`)
- **Shift Type** — at least one stored shift type
- **Salary Policy** — at least one stored salary policy
- **Time Support Zones** — at least one time support zone (unchanged)

Missing-field labels: `"Work Mode"`, `"Shift Type"`, `"Salary Policy"`, `"Time Support Zones"`.

---

## 5. DB migration (backend / ops)

Migration: **`20260821061551_EmployerMultiValueWorkArrangements`**

- Creates join tables
- Backfills from legacy scalar columns on `employers`
- Drops `employers.work_mode`, `employers.shift_type`, `employers.salary_policy`

After deploy:

```bash
dotnet ef database update \
  --project MyApp.Infrastructure/MyApp.Infrastructure.csproj \
  --startup-project MyApp.API/MyApp.API.csproj \
  --context AppDbContext
```

Optional: run employer data-progress recalc for all employers after migrate.

---

## 6. Files / areas updated (FE — Next.js repo paths)

| Area | Action |
|------|--------|
| `src/lib/services/employers-api.ts` | Plural arrays; POST/PUT send **int[]**; list parsers accept int or string; detail parsers expect **int[]** |
| `src/lib/types/employer.ts` | `workModes`, `shiftTypes`, `salaryPolicies` on `Employer` |
| `src/components/employer-creation-dialog.tsx` | Multi-select for work mode, shift type, salary policy |
| `src/components/employer-details-modal.tsx` | Multi-select + `PUT` persistence |
| `src/components/employers-table.tsx` | Badge chips for all values |
| `src/components/employers-page-client.tsx` | Filter query params as repeated **ints** |
| `src/lib/services/candidates-api.ts` | `matchedEmployers[].salaryPolicies` |
| `src/lib/utils/candidate-matches.ts` | Match display for `salaryPolicies[]` |

---

## 7. Enum reference

### JSON body & filter query params (integers, 0-based)

| Enum | Values |
|------|--------|
| **WorkMode** | `0` Onsite, `1` Remote, `2` Hybrid |
| **ShiftType** | `0` Day, `1` Night, `2` Evening, `3` Rotational, `4` Flexible, `5` OnCall |
| **SalaryPolicy** | `0` GrossSalary, `1` RemittanceSalary, `2` NetSalary, `3` FixedSalaryPlusCommissionOrMonthlyBonus |

### List item display labels (examples)

`"Remote"`, `"Day"`, `"Gross Salary"` — use for UI only; map via FE parsers when received from list API.

---

## 8. Checklist

- [ ] Migration applied (local + prod)
- [ ] API deployed
- [x] Types: plural arrays only; remove singular fields
- [x] Forms: multi-select for work modes, shift types, salary policies
- [x] POST/PUT: send **integer** enum arrays (not strings)
- [x] List/detail UI shows all values
- [x] Filters: repeated **numeric** `workModes`, `shiftTypes`, `salaryPolicies` query params
- [x] Matched employers: `salaryPolicies` array
- [x] Build / typecheck pass

---

## 9. Agent prompt (frontend)

```
Implement employer multi-value work arrangements per
docs/EMPLOYER_MULTI_VALUE_WORK_ARRANGEMENTS_FRONTEND_INTEGRATION.md.

Breaking change: workMode/shiftType/salaryPolicy → workModes/shiftTypes/salaryPolicies (arrays).
Use multi-select on employer create/edit. List/detail show all values.

JSON POST/PUT/GET detail: send and expect numeric enum arrays (0-based ints).
POST uses employerTypes; PUT uses types for employer type arrays.
Do NOT send string enum names like "Remote" in JSON — no JsonStringEnumConverter on this API.

List GET returns display label strings in arrays; detail GET returns integer arrays.
Filters: repeated numeric query params (workModes=0&workModes=1).
Matched employers use salaryPolicies[] with { id, label }.
Time support zones unchanged (already multi).
```
