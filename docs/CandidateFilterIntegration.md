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
| `city` | `string?` | non-empty after trim | candidate city contains substring |
| `personalityTypes` | `MbtiType[]?` | length > 0 | `PersonalityType` not null and in array |
| `source` | `CandidateSource?` | has value | exact match |
| `isTopDeveloper` | `bool?` | has value | exact match |
| `currentSalaryMin` | `decimal?` | has value | `CurrentSalary` not null and `>=` min |
| `currentSalaryMax` | `decimal?` | has value | `CurrentSalary` not null and `<=` max |
| `expectedSalaryMin` | `decimal?` | has value | `ExpectedSalary` not null and `>=` min |
| `expectedSalaryMax` | `decimal?` | has value | `ExpectedSalary` not null and `<=` max |

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
3. Debounce text inputs (`name`, `postingTitle`, `city`, `employerCity`, `achievementName`).
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
