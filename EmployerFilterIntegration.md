# Employer list filters — front-end integration guide

This document describes **`GET /api/employers`**, which returns a **paged** list of employers. All filters are passed as **query string** parameters and are combined with **logical AND** (an employer must satisfy every filter that is “active”).

The API model is `EmployerFilterRequest` (`MyApp.Application/DTOs/EmployerFilterRequest.cs`). Server-side behavior is implemented in `EmployerRepository.GetFilteredAsync` unless noted otherwise.

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

Each item includes: `id`, `name`, `websiteUrl`, `linkedInUrl`, `status`, `foundedYear`, `ranking`, `employerType`, `workMode`, `shiftType`, `salaryPolicy`, `minEmployees`, `maxEmployees`, `locations` (array of `{ id, country, city, address, isHeadquarters }`), `tags`, `benefits`, `timeSupportZones`, `isDPLCompetitive`.

Display strings for enums (e.g. ranking tier labels) are **server-normalized** in the DTO; do not assume they match raw C# enum names.

---

## How filters combine

- **Omitted** or **null** parameters: that constraint is **not** applied.
- **Empty arrays** (`[]`): treated as **no constraint** for that filter (same as omitting), except where noted.
- **Strings**: leading/trailing whitespace is usually **trimmed** where documented.
- **Text matching**: `name`, `city`, and `employeeCity` use **case-insensitive substring** match (`ILIKE '%value%'` in PostgreSQL). `%` and `_` in the user’s string behave as SQL wildcards.

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
| `salaryPolicies` | `SalaryPolicy[]?` | Length > 0 | Employer-level `SalaryPolicy` is **not null** and is in the list. |
| `rankings` | `Ranking[]?` | Length > 0 | `Ranking` is **not null** and is in the list. |
| `tags` | `string[]?` | After trim, at least one non-empty entry | Employer has a tag whose name matches one of the patterns with `ILIike` **without** automatic `%` wrapping — in practice treat as **case-insensitive match to the literal string** unless the UI sends wildcards. |
| `isDPLCompetitive` | `bool?` | Has value | Must equal employer `IsDplCompetitor`. |

**`EmployerStatus` values (query / enum names):** `Open`, `Closed`, `Flagged`

**`EmployerType` values:** `ServicesBased`, `ProductBased`, `Saas`, `Startup`, `Integrator`, `ResourceAugmentation`

**`SalaryPolicy` values:** `GrossSalary`, `RemittanceSalary`, `NetSalary`, `FixedSalaryPlusCommissionOrMonthlyBonus`

**`Ranking` values:** `Tier1`, `Tier2`, `Tier3`, `DplFavourite`

---

### Size and locations

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `sizeMin` | `int?` | Has value | `(MaxEmployees ?? MinEmployees ?? 0) >= sizeMin` (employer-level headcount range). |
| `sizeMax` | `int?` | Has value | `(MinEmployees ?? MaxEmployees ?? 0) <= sizeMax` |
| `minLocationsCount` | `int?` | Has value | Count of employer locations `>=` value. |
| `minCitiesCount` | `int?` | Has value | Distinct city strings across locations `>=` value. If `countries` is also set, distinct cities are counted **only** among locations in those countries. |

---

### Employee / candidate (work experience at this employer)

Data comes from **`CandidateWorkExperience`** rows linked to the employer (`EmployerId`).

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `employeeCity` | `string?` | Non-whitespace after trim | At least one work experience whose candidate has a **non-null** city containing substring (case-insensitive). |
| `employeeCountries` | `short[]?` | — | **Present on the request model and mapped in the application layer, but not applied in `EmployerRepository` today.** Sending it has **no effect** until implemented. |
| `benefits` | `string[]?` | After trim, at least one non-empty | Employer-level benefit **or** any candidate work-experience benefit name matches one entry (same `ILIke` semantics as `tags`). |
| `shiftTypes` | `ShiftType[]?` | Length > 0 | **Non-strict:** at least one work experience has a shift type in the list. **Strict** (`shiftTypesStrict=true`): there is **at least one** work experience **and every** work experience has a non-null shift type in the list. |
| `workModes` | `WorkMode[]?` | Length > 0 | Same pattern as shift types, using `workModesStrict`. |
| `timeSupportZones` | `long[]?` | Length > 0 | At least one work experience uses **any** of the listed time-zone IDs. |
| `avgJobTenureMin` / `avgJobTenureMax` | `double?` | Either set | Per-employer **average** tenure in years over all that employer’s candidate work experiences (computed in SQL). Open-ended roles use “today” for end date in the average. |

**`ShiftType` values:** `Day`, `Night`, `Evening`, `Rotational`, `Flexible`, `OnCall`

**`WorkMode` values:** `Onsite`, `Remote`, `Hybrid`

---

### Project-based (employer’s `Projects`)

Unless stated, “match” means: employer has **at least one** project satisfying the predicate.

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `techStacks` | `long[]?` | Length > 0 | Project has a tech stack join whose `TechStackId` is in the list. |
| `verticalDomains` | `VerticalDomain[]?` | Length > 0 | Project vertical domain in list. |
| `horizontalDomains` | `HorizontalDomain[]?` | Length > 0 | Project horizontal domain in list. |
| `technicalDomains` | `TechnicalDomain[]?` | Length > 0 | Project technical domain in list. |
| `technicalAspects` | `TechnicalAspect[]?` | Length > 0 | Project technical aspect in list. |
| `clientLocations` | `long[]?` | Length > 0 | Project client location id in list. |
| `projectStatus` | `ProjectStatus[]?` | Length > 0 | Project `Status` non-null and in list. |
| `projectTeamSizeMin` | `int?` | Has value | At least one project with `(MinTeamSize ?? MaxTeamSize ?? 0) >= value`. |
| `projectTeamSizeMax` | `int?` | Has value | At least one project with `MaxTeamSize != null` and `MaxTeamSize <= value`. |
| `hasPublishedProject` | `bool?` | Has value | `true` if **any** project `IsPublished`; `false` requires **no** published projects. |
| `publishPlatforms` | `PublishedPlatform[]?` | Length > 0 | At least one project published on a listed platform. |
| `minDownloadCount` | `long?` | Has value | At least one project with `DownloadCount >= value`. |

**`ProjectStatus` values:** `Development`, `Maintenance`, `Closed`

**`PublishedPlatform` values:** `AppStore`, `PlayStore`, `Web`, `Desktop`

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

- **Repeated keys:** `status=Open&status=Closed`
- **Comma-separated** may work depending on configuration; repeated keys are the safest portable choice.

For **`int[]`**, **`long[]`**, **`short[]`** you can usually pass numeric strings the same way.

---

## Practical checklist for the UI

1. **Pagination:** always send `pageNumber` and `pageSize`; read `totalCount` / `totalPages` for paging controls.
2. **Clear filters:** omit parameters or send empty arrays where applicable; do not send placeholder strings for unused text filters.
3. **Founded year:** multi-select sends multiple integers; employers without a founded year never match when this filter is active.
4. **Strict modes:** `shiftTypesStrict` / `workModesStrict` are separate booleans; pair them with their respective enum arrays.
5. **Layoffs:** combining date range with `minLayoffEmployees` uses the **sum inside the date window**, not all-time, when dates are present.
6. **`employeeCountries`:** currently **no-op** on the server — hide or stub until backend support exists.

---

## Source files (for agents / maintainers)

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

*Generated from the backend codebase. If behavior diverges, trust the repository implementation and Swagger.*
