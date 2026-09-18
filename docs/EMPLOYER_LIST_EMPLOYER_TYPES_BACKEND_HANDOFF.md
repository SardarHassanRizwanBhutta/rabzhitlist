# Employer list — multi-value `employerTypes` backend handoff

**Status:** Implemented in `MyApp.API` (`employerTypes` on list items; `employerType` removed).  
**Audience:** Backend team.  
**Frontend integration:** [`EMPLOYER_LIST_EMPLOYER_TYPES_FRONTEND_INTEGRATION.md`](./EMPLOYER_LIST_EMPLOYER_TYPES_FRONTEND_INTEGRATION.md)  
**Related:** [`EMPLOYER_MULTI_VALUE_WORK_ARRANGEMENTS_FRONTEND_INTEGRATION.md`](./EMPLOYER_MULTI_VALUE_WORK_ARRANGEMENTS_FRONTEND_INTEGRATION.md), [`EmployerFilterIntegration.md`](./EmployerFilterIntegration.md)

---

## 1. Summary

| What | Detail |
|------|--------|
| **Problem** | `GET /api/employers` list rows expose singular **`employerType`** (one label), while storage and **`GET /api/employers/{id}`** expose full **`types: number[]`**. |
| **Goal** | List rows return **all** employer types, consistent with **`workModes` / `shiftTypes` / `salaryPolicies`**. |
| **Breaking change** | Remove **`employerType`** from **`EmployerListItemDto`**. Add **`employerTypes: string[]`**. Next.js is the only API client. |
| **Unchanged** | Detail **`EmployerDto.types`** (int array), POST **`employerTypes`**, PUT **`types`**, filters **`employerTypes`** query param. |

---

## 2. DTO change — `EmployerListItemDto`

**File:** `MyApp.Application/DTOs/EmployerListItemDto.cs`

| Action | Property | Type | Notes |
|--------|----------|------|--------|
| **Remove** | `EmployerType` / JSON `employerType` | string | Legacy first-type-only projection. |
| **Add** | `EmployerTypes` / JSON **`employerTypes`** | `string[]` | Server-normalized **display labels** for every row in `employer_employer_types` (or equivalent junction). |

### 2.1 Label format

Labels come from **`EmployerTypeToString`** (same as the legacy singular list field), e.g.:

- `"Services Based"`, `"Product Based"`, **`"SAAS"`** (SaaS enum — not `"SaaS"`), `"Startup"`, `"Integrator"`, `"Resource Augmentation"`, `"IT Consulting"`, `"Business Process Outsourcing (BPO)"`

Do **not** return raw C# enum member names on list rows unless they already match FE parsers (FE accepts these display strings and optional PascalCase wire names — see `parseEmployerTypesFromApi` in the FE repo). After parse, the table shows **`"SaaS"`** badges via `EMPLOYER_TYPE_DB_LABELS`.

### 2.2 Ordering

Return types in a **stable order** (recommended: ascending by enum int / `EmployerType` value) so list UI and tests are deterministic.

### 2.3 Empty employer

If an employer has no type junction rows, return **`employerTypes: []`** (not `null`).

---

## 3. Implementation (shipped)

| Area | Change |
|------|--------|
| **`EmployerListItemDto`** | `string? EmployerType` → **`IReadOnlyList<string> EmployerTypes`** (JSON **`employerTypes`**) |
| **`EmployerService.GetFilteredAsync`** | All junction rows, ordered by **`EmployerType`** enum; each label via **`EmployerTypeToString`**. Empty junction → **`[]`**. |
| **Repository** | No migration; list/filter already includes **`EmployerTypes`**. |

**Example:** Detail `types: [0, 2, 4]` → list:

```json
"employerTypes": ["Services Based", "SAAS", "Integrator"]
```

---

## 4. Example list item

```json
{
  "id": 1,
  "name": "DPL",
  "status": 0,
  "foundedYear": 2022,
  "ranking": "Tier 1",
  "employerTypes": ["Services Based", "SAAS", "Integrator"],
  "workModes": ["Onsite"],
  "shiftTypes": ["Night"],
  "salaryPolicies": ["Fixed Salary + Commission/ Monthly Bonus"],
  "headcount": 50,
  "locations": [],
  "benefits": [],
  "timeSupportZones": [],
  "awards": [],
  "isDPLCompetitive": true,
  "dataProgressPercentage": 100
}
```

---

## 5. Verification checklist

- [x] `EmployerListItemDto` has **`employerTypes`** only (no **`employerType`**).
- [x] Paged **`GET /api/employers`** returns full type set for employers with multiple junction rows.
- [x] Labels use **`EmployerTypeToString`** (including **`"SAAS"`** for SaaS).
- [ ] Swagger/OpenAPI updated (if applicable).
- [x] No other consumers depend on **`employerType`** (Next.js FE only).

**Smoke after deploy:** `GET /api/employers` — each item has **`employerTypes`** (array) and no **`employerType`**.

---

## 6. Source files (maintenance)

| Area | Path |
|------|------|
| List row DTO | `MyApp.Application/DTOs/EmployerListItemDto.cs` |
| List mapping | `MyApp.Application/Services/EmployerService.cs`, `MyApp.Infrastructure/Repositories/EmployerRepository.cs` |
| Detail types (reference) | `MyApp.Application/DTOs/EmployerDto.cs` (`types`) |
| Controller | `MyApp.API/Controllers/EmployersController.cs` |
