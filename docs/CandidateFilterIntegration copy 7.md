# Candidate list filters - front-end integration guide

This document describes **`GET /api/candidates`** filtering behavior for front-end integration.
It is based on:

- `MyApp.Application/DTOs/CandidateFilterRequest.cs`
- `MyApp.Application/Services/CandidateService.cs`
- `MyApp.Infrastructure/Repositories/CandidateRepository.cs`

All active filters are combined with **logical AND** (a candidate must satisfy every active filter).

---

## Endpoint and binding

| Item | Value |
|------|-------|
| Method / path | `GET /api/candidates` |
| Binding | `[FromQuery] CandidateFilterRequest` (ASP.NET Core query model binding, case-insensitive keys) |
| Soft delete | Only candidates with `DeletedAt == null` are considered |
| Default sort | `CreatedAt` descending |

---

## Pagination

| Query param | Type | Default | Behavior |
|-------------|------|---------|----------|
| `pageNumber` | `int` | `1` | 1-based page number |
| `pageSize` | `int` | `10` | capped to `100` |

Response is `PagedResult<CandidateListItemDto>`.

---

## Global filter semantics

- Omitted / `null` scalar = filter is not applied.
- Empty arrays = filter is not applied (`Length > 0` is required to activate array filters).
- String filters use `ILIKE` with `%value%` (case-insensitive substring) and trim input.
- Array filters are OR within the array (e.g. any provided enum/id match), but still AND with other filters.
- For many filters using related entities, backend checks for **at least one related row** using `.Any(...)`.

---

## Query parameters (complete)

### Candidate core

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `name` | `string?` | non-empty after trim | candidate name contains substring (case-insensitive) |
| `postingTitle` | `string?` | non-empty after trim | candidate posting title contains substring |
| `jobTitle` | `string?` | non-empty after trim | candidate latest work experience job title (`candidates.latest_job_title`) contains substring; matches latest only, not historical work experiences |
| `city` | `string?` | non-empty after trim | candidate city contains substring |
| `personalityTypes` | `MbtiType[]?` | length > 0 | `PersonalityType` not null and in array |
| `source` | `CandidateSource?` | has value | exact match |
| `isTopDeveloper` | `bool?` | has value | exact match |
| `currentSalaryMin` | `decimal?` | has value | `CurrentSalary` not null and `>=` min |
| `currentSalaryMax` | `decimal?` | has value | `CurrentSalary` not null and `<=` max |
| `expectedSalaryMin` | `decimal?` | has value | `ExpectedSalary` not null and `>=` min |
| `expectedSalaryMax` | `decimal?` | has value | `ExpectedSalary` not null and `<=` max |
| `minExperienceYears` | `decimal?` | has value | `TotalExperienceMonths >= round(years × 12)` (stored value from work history) |
| `maxExperienceYears` | `decimal?` | has value | `TotalExperienceMonths <= round(years × 12)` |
| `minDataProgressPercentage` | `decimal?` | has value | `DataProgressPercentage >=` min (stored 0–100 profile completion) |
| `maxDataProgressPercentage` | `decimal?` | has value | `DataProgressPercentage <=` max |

`minExperienceYears` / `maxExperienceYears` support decimals (e.g. `2.5`). Both must be non-negative; max cannot be less than min (400 if invalid).

`minDataProgressPercentage` / `maxDataProgressPercentage` filter on stored `candidates.data_progress_percentage` (0–100 inclusive). Both must be in range; max cannot be less than min (400 if invalid). Does not trigger `matchedProjects`.

List/detail responses include `totalExperienceMonths` and `totalExperienceYears` (derived from months). Detail also includes manual `totalExperienceYears` profile field when set on the candidate row.

### Certification filters

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `certificationId` | `long?` | has value | candidate has any certification row with this `CertificationId` |
| `issuingBodyIds` | `long[]?` | length > 0 | candidate has any certification whose `Certification.IssuerId` is in array |
| `certificationLevels` | `CertificationLevel[]?` | length > 0 | candidate has any certification whose `Level` is non-null and in array |

### Education filters

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `universityId` | `long?` | has value | candidate has any education row with this university id |
| `degreeIds` | `long[]?` | length > 0 | candidate has any education with non-null `DegreeId` in array |
| `majorIds` | `long[]?` | length > 0 | candidate has any education with non-null `MajorId` in array |
| `isTopper` | `bool?` | has value | candidate has any education row with matching `IsTopper` |
| `isMainCheetah` | `bool?` | has value | candidate has any education row with matching `IsMainCheetah` |
| `graduateDateStart` | `DateOnly?` | start or end provided | education `EndMonth` not null and `>= start` |
| `graduateDateEnd` | `DateOnly?` | start or end provided | education `EndMonth` not null and `<= end` |

`graduateDateStart` and `graduateDateEnd` form an inclusive completion window over `candidate_educations.end_month`.

### Work experience filters

Filters on `candidate_work_experiences` rows (any matching stint; OR within array values).

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `shiftTypes` | `ShiftType[]?` | length > 0 | any work experience with non-null `shift_type` in array |
| `workModes` | `WorkMode[]?` | length > 0 | any work experience with non-null `work_mode` in array |
| `timeSupportZoneIds` | `long[]?` | length > 0 | any work experience with at least one linked time support zone id in array (`candidate_work_experience_time_support_zones`) |
| `workExperienceTechStackIds` | `long[]?` | length > 0 | any work experience with at least one linked tech stack id in array (`candidate_work_experience_tech_stacks`). **Not** the same as project `techStackIds`. |

**ShiftType** enum (same integers as work experience create/update): `0` Day, `1` Night, `2` Evening, `3` Rotational, `4` Flexible, `5` OnCall.

**WorkMode** enum: `0` Onsite, `1` Remote, `2` Hybrid.

Example: `GET /api/candidates?shiftTypes=0&shiftTypes=4` — candidates with at least one Day or Flexible shift work experience.

Example: `GET /api/candidates?workModes=1&workModes=2` — candidates with at least one Remote or Hybrid work experience.

Example: `GET /api/candidates?timeSupportZoneIds=1&timeSupportZoneIds=3` — candidates with at least one work experience linked to time support zone id 1 or 3.

Example: `GET /api/candidates?workExperienceTechStackIds=12&workExperienceTechStackIds=45` — candidates with at least one work experience using tech stack id 12 or 45.

Work experience row driver filters trigger **`matchedWorkExperiences`** on the list response (see below). They do **not** trigger `matchedEmployers` or `matchedProjects`.

### Employer filters (through candidate work experience)

These use candidate work experiences linked to employer rows (`CandidateWorkExperiences -> Employer`) and generally require non-deleted employers.

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `employerIds` | `long[]?` | length > 0 | any work experience with employer id in array and employer not deleted |
| `employerSalaryPolicies` | `SalaryPolicy[]?` | length > 0 | linked employer salary policy non-null and in array |
| `employerTypes` | `EmployerType[]?` | length > 0 | linked employer has any employer type in array |
| `employerCountries` | `short[]?` | length > 0 | linked employer has any location with country id in array |
| `employerCity` | `string?` | non-empty after trim | linked employer has any location city containing substring |
| `employerStatuses` | `EmployerStatus[]?` | length > 0 | linked employer has any status in array |
| `employerRankings` | `Ranking[]?` | length > 0 | linked employer ranking non-null and in array |
| `employerSizeMin` | `int?` | has value | `(MaxEmployees ?? MinEmployees ?? 0) >= min` on linked employer |
| `employerSizeMax` | `int?` | has value | `(MinEmployees ?? MaxEmployees ?? 0) <= max` on linked employer |

Employer driver filters trigger **`matchedEmployers`** on the list response (see below). Filtering behavior is unchanged.

### Project filters (candidate-linked projects)

Project-related filters match projects linked through either:

- `candidate_projects` (`CandidateProjects`)
- `candidate_work_experience_projects` (`CandidateWorkExperiences -> Projects`)

For project filters, backend enforces `Project.DeletedAt == null`.

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `projectIds` | `long[]?` | length > 0 | any linked project id in array |
| `verticalDomains` | `VerticalDomain[]?` | length > 0 | linked project has any vertical domain in array |
| `horizontalDomains` | `HorizontalDomain[]?` | length > 0 | linked project has any horizontal domain in array |
| `technicalDomains` | `TechnicalDomain[]?` | length > 0 | linked project has any technical domain in array |
| `technicalAspects` | `TechnicalAspect[]?` | length > 0 | linked project has any **legacy enum** technical aspect on `project_technical_aspects` in array (separate from aspect type catalog) |
| `technicalAspectTypeIds` | `long[]?` | length > 0 | linked project has any tech stack linked to any requested `technical_aspect_types` id via `technical_aspect_type_tech_stacks` (OR within array). Unknown/inactive ids → **400**. Triggers `matchedProjects` when active. |
| `techStackIds` | `long[]?` | length > 0 | linked project has any tech stack id on `project_tech_stacks` in array (project stacks only; not candidate or work-experience stacks) |
| `clientLocations` | `long[]?` | length > 0 | linked project has any client location id in array |
| `projectStatus` | `ProjectStatus[]?` | length > 0 | linked project status non-null and in array |
| `projectTypes` | `ProjectType[]?` | length > 0 | linked project type non-null and in array |
| `publishPlatforms` | `PublishedPlatform[]?` | length > 0 | linked project has any publish platform in array |
| `isPublished` | `bool?` | has value | `(hasAnyLinkedPublishedProject == value)` |
| `minDownloadCount` | `long?` | has value | linked project `DownloadCount` non-null and `>=` min |
| `minTeamSize` | `int?` | has value | linked project `MinTeamSize` non-null and `>=` min |
| `maxTeamSize` | `int?` | has value | linked project `MaxTeamSize` non-null and `<=` max |
| `projectStartFrom` | `DateOnly?` | has value | linked project `StartDate` non-null and `>= from` |
| `projectStartTo` | `DateOnly?` | has value | linked project `StartDate` non-null and `<= to` |

### Achievement filters

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `achievementTypes` | `AchievementType[]?` | length > 0 | any achievement with non-null `Type` in array |
| `achievementName` | `string?` | non-empty after trim | any achievement name contains substring |

---

## Important AND/OR behavior examples

- **Across different filters:** AND
  - Example: `source=Manual` + `isTopDeveloper=true` -> candidate must satisfy both.
- **Inside array filter:** OR
  - Example: `projectTypes=Employer&projectTypes=Freelance` -> either type can match.
- **Per-related-table checks:** existential (`Any`)
  - Candidate can satisfy one filter via one related row and another filter via a different related row.
  - Example: `employerStatuses` and `employerCity` do not need to be satisfied by the same employer row.

---

## Response: `matchedProjects` (Project Expertise match summary)

Each `CandidateListItemDto` includes a **`matchedProjects`** array so the Cards View can render, per candidate,
which projects/domains caused the match (project name heading + matched-value badges).

```jsonc
"matchedProjects": [
  {
    "projectId": 42,
    "projectName": "Acme Mobile App",
    "verticalDomains": [{ "id": 3, "label": "Healthcare" }],
    "horizontalDomains": [{ "id": 0, "label": "Crm" }],
    "technicalDomains": [{ "id": 0, "label": "CloudComputing" }],
    "techStacks": [{ "id": 12, "label": "React" }],
    "technicalAspectTypes": [{ "id": 22, "label": "Frontend" }],
    "status": { "id": 0, "label": "Development" },
    "projectType": { "id": 0, "label": "Employer" },
    "clientLocations": [{ "id": 5, "label": "San Francisco" }],
    "publishPlatforms": [{ "id": 0, "label": "AppStore" }],
    "storeLink": "https://apps.apple.com/app/example",
    "teamSize": { "minTeamSize": 20, "maxTeamSize": 30 },
    "downloadCount": 150000,
    "startDate": "2024-06-15"
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `projectId` | `number` | Stable project id; use to key/dedupe in the UI. |
| `projectName` | `string` | Project display name (the per-project heading). |
| `verticalDomains` | `{ id: number, label: string }[]` | Intersection with requested `verticalDomains` filter. |
| `horizontalDomains` | `{ id: number, label: string }[]` | Intersection with requested `horizontalDomains` filter. |
| `technicalDomains` | `{ id: number, label: string }[]` | Intersection with requested `technicalDomains` filter. |
| `techStacks` | `{ id: number, label: string }[]` | Intersection with requested `techStackIds` filter (catalog id + name). |
| `technicalAspectTypes` | `{ id: number, label: string }[]` | Intersection with requested `technicalAspectTypeIds` filter (`technical_aspect_types.display_name`). |
| `status` | `{ id: number, label: string } \| null` | When `projectStatus` filter active and this project's status matched. |
| `projectType` | `{ id: number, label: string } \| null` | When `projectTypes` filter active and this project's type matched. |
| `clientLocations` | `{ id: number, label: string }[]` | Intersection with requested `clientLocations` filter (catalog id + name). |
| `publishPlatforms` | `{ id: number, label: string }[]` | Intersection with requested `publishPlatforms` filter. |
| `storeLink` | `string \| null` | Project link URL when publish-related matching applies (`projects.link`). |
| `teamSize` | `{ minTeamSize?: number, maxTeamSize?: number } \| null` | Project's actual team size when team size filter(s) satisfied. |
| `downloadCount` | `number \| null` | Project's actual count when `minDownloadCount` filter satisfied. |
| `startDate` | `string \| null` (ISO `DateOnly`) | Project's start date when start date range filter satisfied. |

Each matched enum/catalog value is a `{ id, label }` object:

- `id` — the **same integer** the corresponding query-param filter accepts (enum int or catalog id).
- `label` — enum name (`enum.ToString()`) or catalog name; fallback/debug aid.

**When `matchedProjects` is computed:** any of these filters is active:

- Phase 1–2: `verticalDomains`, `horizontalDomains`, `technicalDomains`, `techStackIds`, `projectStatus`
- Aspect types: `technicalAspectTypeIds`
- Phase 3: `projectTypes`, `clientLocations`, `publishPlatforms`, `isPublished`, `minDownloadCount`,
  `minTeamSize`, `maxTeamSize`, `projectStartFrom`, `projectStartTo`

Otherwise → `matchedProjects: []` (never `null`). Other project filters alone (`projectIds`, `technicalAspects`) do not trigger population.

Semantics:

- **Matched-only:** a project appears only if it matched ≥1 **active** driver filter (OR across drivers).
- Each field holds only the **intersection** with its filter. When a sub-filter is not applied, defaults per field:
  arrays → `[]`; scalars (`status`, `projectType`, `storeLink`, `teamSize`, `downloadCount`, `startDate`) → `null`.
- **Publish:** if only `publishPlatforms` is set, unpublished projects with matching platforms appear (same as list filter).
  `storeLink` from `projects.link` when publish-related matching applies on the item.
- Values are **distinct by `id`**, ordered **ascending by `id`**; projects ordered by `projectId`.
- Projects from **both** `candidate_projects` and `candidate_work_experience_projects`, **deduped by `projectId`**.
- **Reserved (not populated):** `technicalAspects` (legacy enum), `matchedByName`, `projectIds`.

---

## Response: `matchedWorkExperiences` (Work Experience row match summary)

Each `CandidateListItemDto` includes a **`matchedWorkExperiences`** array so the Cards View can render, per candidate,
which work experiences caused the match for shift type, work mode, time support zones, or work-experience tech stacks
(heading: `{employerName} - {jobTitle}`).

```jsonc
"matchedWorkExperiences": [
  {
    "workExperienceId": 5501,
    "employerId": 42,
    "employerName": "Acme Corp",
    "jobTitle": "Staff Engineer",
    "startDate": "2022-06-01",
    "endDate": null,
    "shiftType": { "id": 0, "label": "Day" },
    "workMode": { "id": 1, "label": "Remote" },
    "timeSupportZones": [{ "id": 1, "label": "PST" }],
    "techStacks": [{ "id": 12, "label": "React" }]
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `workExperienceId` | `number` | Stable id of `CandidateWorkExperience`; one entry per matching work experience. |
| `employerId` | `number` | Linked non-deleted employer id (for UI heading context). |
| `employerName` | `string` | Employer display name. |
| `jobTitle` | `string \| null` | From the work experience row. |
| `startDate` | `string \| null` (ISO `DateOnly`) | Work experience start date. |
| `endDate` | `string \| null` (ISO `DateOnly`) | Work experience end date; `null` = current role. |
| `shiftType` | `{ id: number, label: string } \| null` | When `shiftTypes` filter active and this WE's shift matched (scalar, not array). |
| `workMode` | `{ id: number, label: string } \| null` | When `workModes` filter active and this WE's mode matched (scalar). |
| `timeSupportZones` | `{ id: number, label: string }[]` | Intersection with requested `timeSupportZoneIds` filter. |
| `techStacks` | `{ id: number, label: string }[]` | Intersection with requested `workExperienceTechStackIds` (WE stacks only, not project `techStackIds`). |

**When `matchedWorkExperiences` is computed:** any of these filters is active:

- `shiftTypes`, `workModes`, `timeSupportZoneIds`, `workExperienceTechStackIds`

Otherwise → `matchedWorkExperiences: []` (never `null`).

Semantics:

- **Matched-only:** a work experience appears only if it matched ≥1 **active** driver filter (OR across drivers), with a non-deleted employer.
- **One entry per work experience** — not deduped by `employerId`.
- Each field holds only the **intersection** with its filter. When a sub-filter is not applied: `shiftType` / `workMode` → `null`; arrays → `[]`.
- The same `workExperienceId` may appear in both `matchedEmployers` and `matchedWorkExperiences` when both filter groups are active — payloads are independent.
- Enum `{ id, label }` uses the **same integer** as the query-param filter; arrays distinct by `id`, ascending; items ordered by `workExperienceId`.

---

## Response: `matchedEmployers` (Employer Characteristics match summary)

Each `CandidateListItemDto` includes a **`matchedEmployers`** array so the Cards View can render, per candidate,
which work experiences / employers caused the match (employer name heading + job title/dates context + matched-value badges).

```jsonc
"matchedEmployers": [
  {
    "workExperienceId": 5501,
    "employerId": 42,
    "employerName": "Acme Corp",
    "jobTitle": "Staff Engineer",
    "startDate": "2022-06-01",
    "endDate": null,
    "matchedByEmployerId": false,
    "statuses": [{ "id": 0, "label": "Open" }],
    "countries": [{ "id": 840, "label": "United States" }],
    "cities": ["San Francisco"],
    "employerTypes": [],
    "salaryPolicy": null,
    "ranking": null,
    "size": null
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `workExperienceId` | `number` | Stable id of `CandidateWorkExperience`; one entry per matching work experience. |
| `employerId` | `number` | Linked employer id (non-deleted). |
| `employerName` | `string` | Employer display name (heading for each block). |
| `jobTitle` | `string \| null` | From the work experience row. |
| `startDate` | `string \| null` (ISO `DateOnly`) | Work experience start date. |
| `endDate` | `string \| null` (ISO `DateOnly`) | Work experience end date; `null` = current role. |
| `matchedByEmployerId` | `boolean` | `true` only when `employerIds` filter is active and this WE's employer id is in the set. |
| `statuses` | `{ id: number, label: string }[]` | Intersection with requested `employerStatuses` filter. |
| `countries` | `{ id: number, label: string }[]` | Intersection with requested `employerCountries` filter (catalog country id + name). |
| `cities` | `string[]` | Cities from employer locations matching `employerCity` substring filter. |
| `employerTypes` | `{ id: number, label: string }[]` | Intersection with requested `employerTypes` filter. |
| `salaryPolicy` | `{ id: number, label: string } \| null` | When `employerSalaryPolicies` filter active and employer policy matched. |
| `ranking` | `{ id: number, label: string } \| null` | When `employerRankings` filter active and employer ranking matched. |
| `size` | `{ minEmployees?: number, maxEmployees?: number } \| null` | Employer's actual headcount range when size filter(s) satisfied. |

**When `matchedEmployers` is computed:** any of these filters is active:

- `employerIds`, `employerStatuses`, `employerTypes`, `employerCountries`, `employerCity`,
  `employerSalaryPolicies`, `employerRankings`, `employerSizeMin`, `employerSizeMax`

Otherwise → `matchedEmployers: []` (never `null`). Work-experience-only filters (e.g. job title, years) do not trigger population.

Semantics:

- **Matched-only:** a work experience appears only if it matched ≥1 **active** driver filter (OR across drivers).
- **One entry per work experience** — not deduped by `employerId` (repeated stints at the same company remain distinct).
- Each field holds only the **intersection** with its filter. When a sub-filter is not applied: arrays → `[]`;
  scalars (`salaryPolicy`, `ranking`, `size`) → `null`; `matchedByEmployerId` → `false`.
- Enum `{ id, label }` objects use the **same integer** as the query-param filter; `label` is server-normalized display text.
- Values are **distinct by `id`** within arrays, ordered **ascending by `id`**; cities ordered alphabetically; items ordered by `workExperienceId`.

---

## Query-string format recommendations

Use repeated keys for arrays (most reliable):

- `projectTypes=Employer&projectTypes=Freelance`
- `employerIds=10&employerIds=22`
- `certificationLevels=Associate&certificationLevels=Professional`

Dates (`DateOnly`) should be ISO:

- `graduateDateStart=2025-01-01`
- `projectStartTo=2025-06-30`

---

## Front-end implementation tips

1. Keep filter state typed (arrays for multi-select, nullable scalar for single-value filters).
2. Send only active filters (omit null/empty values).
3. Debounce text inputs (`name`, `postingTitle`, `jobTitle`, `city`, `employerCity`, `achievementName`).
4. Use repeated query keys for arrays.
5. For min/max pairs, validate on UI (`min <= max`) before firing.
6. If enums are not hardcoded in FE, generate from shared schema/Swagger to avoid drift.

---

## Source references

- DTO contract: `MyApp.Application/DTOs/CandidateFilterRequest.cs`
- Service mapping to repository args: `MyApp.Application/Services/CandidateService.cs`
- Actual SQL/EF filtering semantics: `MyApp.Infrastructure/Repositories/CandidateRepository.cs`

---

If behavior ever appears inconsistent, treat repository logic as source of truth.
