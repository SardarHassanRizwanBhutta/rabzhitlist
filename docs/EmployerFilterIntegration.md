# Employer list filters — front-end integration guide

This document describes **`GET /api/employers`**, which returns a **paged** list of employers. All filters are passed as **query string** parameters and are combined with **logical AND** (an employer must satisfy every filter that is "active").

The API model is `EmployerFilterRequest` (`MyApp.Application/DTOs/EmployerFilterRequest.cs`). Server-side behavior is implemented in `EmployerRepository.GetFilteredAsync` unless noted otherwise.

**Related docs:**

- Multi-value work arrangements (list/detail shapes, POST/PUT): `docs/EMPLOYER_MULTI_VALUE_WORK_ARRANGEMENTS_FRONTEND_INTEGRATION.md`
- Data progress list column + filters: `docs/employer_data_progress_frontend_integration.md`

---

## Endpoint and HTTP

| Item | Value |
|------|--------|
| **Method / path** | `GET /api/employers` |
| **Binding** | `[FromQuery] EmployerFilterRequest` — standard ASP.NET Core model binding (property names are **case-insensitive**) |
| **Soft-deleted employers** | Excluded (`DeletedAt == null` only) |
| **Default sort** | `Name` ascending |

**Separate lookup (not the filter list):** `GET /api/employers/search?search=…&limit=…` — typeahead on employer name (minimum **2** characters after trim, capped limit). This is **not** the same as the `name` filter on the list endpoint.

---

## Pagination

| Query parameter | Type | Default | Rules |
|-----------------|------|---------|--------|
| `pageNumber` | `int` | `1` | 1-based page index |
| `pageSize` | `int` | `10` | Capped at **100** on set (values above 100 become 100) |

---

## Response shape

The handler returns `PagedResult<EmployerListItemDto>` (JSON property names are typically **camelCase**).

| Field | Meaning |
|-------|---------|
| `items` | Array of `EmployerListItemDto` |
| `pageNumber` | Echo of request page |
| `pageSize` | Echo of request page size (after cap) |
| `totalCount` | Total rows matching filters (all pages) |
| `totalPages` | `ceil(totalCount / pageSize)` |
| `hasPrevious` | `pageNumber > 1` |
| `hasNext` | `pageNumber < totalPages` |

### `EmployerListItemDto` (summary row)

Each item includes: `id`, `name`, `websiteUrl`, `linkedInUrl`, `status`, `foundedYear`, `ranking`, `employerType`, **`workModes`**, **`shiftTypes`**, **`salaryPolicies`**, `headcount`, `locations` (array of `{ id, country, city, address, isHeadquarters }`), `benefits` (string array of benefit **names**), `timeSupportZones`, `awards`, `isDPLCompetitive`, **`dataProgressPercentage`**.

**Multi-value work arrangements on list rows:** `workModes`, `shiftTypes`, and `salaryPolicies` are **string arrays** of server-normalized display labels (e.g. `["Remote", "Hybrid"]`, `["Day"]`, `["Gross Salary"]`). Singular `workMode` / `shiftType` / `salaryPolicy` are **removed**.

Display strings for enums (e.g. ranking tier labels) are **server-normalized** in the DTO; do not assume they match raw C# enum names.

Use **`dataProgressPercentage`** for the table column. Do **not** call the per-employer data-progress breakdown endpoint for each list row.

---

## How filters combine

- **Omitted** or **null** parameters: that constraint is **not** applied.
- **Empty arrays** (`[]`): treated as **no constraint** for that filter (same as omitting), except where noted.
- **Strings**: leading/trailing whitespace is usually **trimmed** where documented.
- **Text matching**: `name`, `city`, and `employeeCity` use **case-insensitive substring** match (`ILIKE '%value%'` in PostgreSQL). `%` and `_` in the user's string behave as SQL wildcards.

---

## Enum query parameters (FE convention)

ASP.NET Core model binding may accept **PascalCase enum names** (e.g. `status=Open`) or **0-based integers** (e.g. `status=0`) depending on configuration.

The Next.js FE sends **repeated numeric** values for enum array filters (`workModes=0&workModes=1`, `salaryPolicies=0`, etc.) via `WORK_MODE_TO_API`, `SHIFT_TYPE_TO_API`, `SALARY_POLICY_TO_API`, `EMPLOYER_STATUS_TO_API`, and related maps in `src/lib/services/employers-api.ts`.

| Enum | 0-based int mapping (query / JSON) |
|------|-------------------------------------|
| **WorkMode** | `0` Onsite, `1` Remote, `2` Hybrid |
| **ShiftType** | `0` Day, `1` Night, `2` Evening, `3` Rotational, `4` Flexible, `5` OnCall |
| **SalaryPolicy** | `0` GrossSalary, `1` RemittanceSalary, `2` NetSalary, `3` FixedSalaryPlusCommissionOrMonthlyBonus |
| **EmployerStatus** | `0` Open, `1` Closed, `2` Flagged |

PascalCase names for reference: **EmployerStatus** `Open`, `Closed`, `Flagged`; **EmployerType** `ServicesBased`, `ProductBased`, `Saas`, `Startup`, `Integrator`, `ResourceAugmentation`; **Ranking** `Tier1`, `Tier2`, `Tier3`, `DplFavourite`; **ProjectStatus** `Development`, `Maintenance`, `Closed`; **PublishedPlatform** `AppStore`, `PlayStore`, `Web`, `Desktop`.

---

## Filter reference

### Core employer

| Query param | C# type | Active when | Behavior |
|-------------|---------|-------------|----------|
| `name` | `string?` | Non-whitespace after trim | Employer `Name` contains substring (case-insensitive). |
| `status` | `EmployerStatus[]?` | Length > 0 | Employer has **at least one** of the given statuses (join table `employer_employer_statuses`). **OR** within the array. |
| `foundedYears` | `int[]?` | Length > 0 | `FoundedYear` is **not null** and equals **one of** the listed years. Employers with no founded year are **excluded**. |
| `countries` | `short[]?` | Length > 0 | Has **at least one** location whose `countryId` is in the list. |
| `city` | `string?` | Non-whitespace after trim | Has **at least one** location whose city contains substring (case-insensitive). |
| `employerTypes` | `EmployerType[]?` | Length > 0 | Has **at least one** of the listed employer types. |
| `salaryPolicies` | `SalaryPolicy[]?` | Length > 0 | Employer **stored set** (join table `employer_salary_policies`) **intersects** the filter list — any stored value matching any filter value. **OR** within the array. |
| `rankings` | `Ranking[]?` | Length > 0 | `Ranking` is **not null** and is in the list. |
| `workModes` | `WorkMode[]?` | Length > 0 | Employer **stored set** (join table `employer_work_modes`) **intersects** the filter list — any stored value matching any filter value. **OR** within the array. |
| `shiftTypes` | `ShiftType[]?` | Length > 0 | Employer **stored set** (join table `employer_shift_types`) **intersects** the filter list — any stored value matching any filter value. **OR** within the array. |
| `timeSupportZones` | `long[]?` | Length > 0 | Employer has **at least one** row in **`employer_time_support_zones`** whose `time_support_zone_id` is in the list. |
| `awards` | `long[]?` | Length > 0 | Employer has **at least one** row in **`employer_awards`** whose `award_id` is in the list. |
| `isDPLCompetitive` | `bool?` | Has value | Must equal employer `IsDplCompetitor`. |

---

### Size and locations

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `sizeMin` | `int?` | Has value | `Headcount` is **not null** and `Headcount >= sizeMin`. |
| `sizeMax` | `int?` | Has value | `Headcount` is **not null** and `Headcount <= sizeMax`. |
| `minLocationsCount` | `int?` | Has value | Count of employer locations `>=` value. |
| `minCitiesCount` | `int?` | Has value | Distinct city strings across locations `>=` value. If `countries` is also set, distinct cities are counted **only** among locations in those countries. |

---

### Employee / candidate (work experience at this employer)

Data comes from **`CandidateWorkExperience`** rows linked to the employer (`EmployerId`).

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `employeeCity` | `string?` | Non-whitespace after trim | At least one work experience whose candidate has a **non-null** city containing substring (case-insensitive). |
| `benefits` | `string[]?` | After trim, at least one non-empty | Employer-level benefit **or** any candidate work-experience benefit name matches one entry (`ILIKE` without automatic `%` wrapping — use **exact catalog names**). |
| `avgJobTenureMin` / `avgJobTenureMax` | `double?` | Either set | Per-employer **average** tenure in years over all that employer's candidate work experiences (computed in SQL). Open-ended roles use "today" for end date in the average. |

**Benefits filter UI (FE):** dropdown options from **`GET /api/benefits`** (benefit catalog names). Page client maps selected names to repeated `benefits=` query params. Same lookup used for employer create/edit benefit pickers.

---

### Data progress

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `minDataProgressPercentage` | `decimal?` | Has value | Stored `dataProgressPercentage >=` min (inclusive 0–100). |
| `maxDataProgressPercentage` | `decimal?` | Has value | Stored `dataProgressPercentage <=` max (inclusive 0–100; must be ≥ min). |

**400** (plain text) when out of range or min > max. See `docs/employer_data_progress_frontend_integration.md` for FE wiring (`employers-page-client.tsx`, `employers-api.ts`).

---

### Project-based (employer's `Projects`)

Unless stated, "match" means: employer has **at least one** project satisfying the predicate.

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `techStacks` | `long[]?` | Length > 0 | Project has a tech stack join whose `TechStackId` is in the list. *(Backend only — not exposed in current FE employers filter UI.)* |
| `verticalDomains` | `VerticalDomain[]?` | Length > 0 | Project vertical domain in list. |
| `horizontalDomains` | `HorizontalDomain[]?` | Length > 0 | Project horizontal domain in list. |
| `technicalDomains` | `TechnicalDomain[]?` | Length > 0 | Project technical domain in list. |
| `technicalAspects` | `TechnicalAspect[]?` | Length > 0 | Project technical aspect in list. *(Backend only — not exposed in current FE employers filter UI.)* |
| `clientLocations` | `long[]?` | Length > 0 | Project client location id in list. |
| `projectStatus` | `ProjectStatus[]?` | Length > 0 | Project `Status` non-null and in list. |
| `projectTeamSizeMin` | `int?` | Has value | At least one project with non-null `AverageTeamSize` and `AverageTeamSize >= value`. |
| `projectTeamSizeMax` | `int?` | Has value | At least one project with non-null `AverageTeamSize` and `AverageTeamSize <= value`. |
| `hasPublishedProject` | `bool?` | Has value | `true` if **any** project `IsPublished`; `false` requires **no** published projects. |
| `publishPlatforms` | `PublishedPlatform[]?` | Length > 0 | At least one project published on a listed platform. |
| `minDownloadCount` | `long?` | Has value | At least one project with `DownloadCount >= value`. |

**Domain enums** (`VerticalDomain`, `HorizontalDomain`, `TechnicalDomain`, `TechnicalAspect`) have many members — use the same names as in `MyApp.Domain/Enums/*.cs` (PascalCase). Prefer **Swagger** (`/swagger`) or a shared OpenAPI spec to stay in sync.

---

### Layoffs

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `layoffDateStart` | `DateOnly?` | Has value | Has **any** layoff with `LayoffDate >= start`. |
| `layoffDateEnd` | `DateOnly?` | Has value | Has **any** layoff with `LayoffDate <= end`. |
| `minLayoffEmployees` | `int?` | Has value | If **either** layoff date bound is set: sum of `AffectedEmployees` over layoffs **within that inclusive date window** `>=` value. If **no** date bounds: sum over **all** layoffs `>=` value. |

Use ISO **date** strings (e.g. `2024-01-15`) for `DateOnly` query parameters.

---

## Passing arrays in the query string

ASP.NET Core accepts typical styles; confirm in your environment / Swagger:

- **Repeated keys (preferred):** `status=0&status=1`, `workModes=0&workModes=1`, `benefits=Health%20Insurance&benefits=Dental%20and%20vision%20coverage`
- **Comma-separated** may work depending on configuration; repeated keys are the safest portable choice.

For **`int[]`**, **`long[]`**, **`short[]`**, pass numeric strings the same way.

---

## Practical checklist for the UI

1. **Pagination:** always send `pageNumber` and `pageSize`; read `totalCount` / `totalPages` for paging controls.
2. **Clear filters:** omit parameters or send empty arrays where applicable; do not send placeholder strings for unused text filters.
3. **Founded year:** multi-select sends multiple integers; employers without a founded year never match when this filter is active.
4. **Work arrangements:** send repeated **numeric** `workModes`, `shiftTypes`, `salaryPolicies`; filter matches if employer stored set **intersects** the selected values.
5. **Benefits:** populate multi-select from **`GET /api/benefits`**; send selected benefit **names** as repeated `benefits` params.
6. **Layoffs:** combining date range with `minLayoffEmployees` uses the **sum inside the date window**, not all-time, when dates are present.
7. **Data progress:** send `minDataProgressPercentage` / `maxDataProgressPercentage` (0–100 inclusive); validate min ≤ max client-side before apply.

---

## FE source files (Next.js repo)

| Area | File |
|------|------|
| Filter UI | `src/components/employers-filter-dialog.tsx` |
| Filter → API params | `src/components/employers-page-client.tsx` |
| Query builder + list mapping | `src/lib/services/employers-api.ts` |
| Benefits catalog | `src/lib/services/benefits-api.ts` (`GET /api/benefits`) |
| Time zones / awards / client locations lookups | respective `*-api.ts` services |

---

## Backend source files (for agents / maintainers)

| Area | File |
|------|------|
| Query DTO | `MyApp.Application/DTOs/EmployerFilterRequest.cs` |
| Domain filter | `MyApp.Domain/Models/EmployerListFilter.cs` |
| Mapping DTO → domain | `MyApp.Application/Services/EmployerService.cs` (`GetFilteredAsync`) |
| Query logic | `MyApp.Infrastructure/Repositories/EmployerRepository.cs` (`GetFilteredAsync`) |
| Controller | `MyApp.API/Controllers/EmployersController.cs` |
| Paged wrapper | `MyApp.Application/Common/PagedResult.cs` |
| List row DTO | `MyApp.Application/DTOs/EmployerListItemDto.cs` |

---

*Generated from the backend codebase and aligned with FE implementation. If behavior diverges, trust the repository implementation and Swagger.*
