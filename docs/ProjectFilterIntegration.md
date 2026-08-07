# Project list filters — front-end integration guide

This document describes **`GET /api/projects`**, the paged project list endpoint. Filters are query-string parameters combined with **logical AND** (a project must satisfy every active constraint).

The API model is `ProjectFilterRequest` (`MyApp.Application/DTOs/ProjectFilterRequest.cs`). Server-side behavior is implemented in `ProjectRepository.GetFilteredAsync` unless noted otherwise.

For **date-related** parameters (`completionFrom`, `projectStartFrom`, `activeWindowFrom`, etc.), see [ProjectFilterChanges.md](./ProjectFilterChanges.md).

---

## Endpoint and HTTP

| Item | Value |
|------|--------|
| **Method / path** | `GET /api/projects` |
| **Binding** | `[FromQuery] ProjectFilterRequest` — ASP.NET Core model binding (property names are **case-insensitive**) |
| **Soft-deleted projects** | Excluded (`DeletedAt == null` only) |

---

## Pagination

| Query parameter | Type | Default | Rules |
|-----------------|------|---------|--------|
| `pageNumber` | `int` | `1` | 1-based page index |
| `pageSize` | `int` | `10` | Capped at **100** |

Response: `PagedResult<ProjectListItemDto>` (`items`, `totalCount`, `totalPages`, `hasPrevious`, `hasNext`).

---

## `employerIds` filter

| Query parameter | Type | When active | Match rule |
|-----------------|------|-------------|--------------|
| `employerIds` | `long[]?` | length > 0 after binding | Project’s linked **`employer_id`** is in the array (non-deleted employer row). |

### Query string

Pass numeric ids as **repeated keys** (safest portable style for ASP.NET Core):

```
GET /api/projects?employerIds=30&pageNumber=1&pageSize=20
GET /api/projects?employerIds=30&employerIds=42&pageNumber=1&pageSize=20
```

Within the array, ids combine with **OR** (project matches if its employer is any listed id). Other active filters still apply with **AND**.

### Front-end wiring

| Layer | Detail |
|-------|--------|
| **Projects filter dialog** | `ProjectFilters.employers` — string employer ids from debounced `GET /api/employers/search` |
| **URL deep link (Employers table)** | `/projects?employerFilter={name}&employerId={id}` — page client merges `employerId` into `employers` before fetch |
| **API client** | `buildFetchProjectsParams()` → `FetchProjectsParams.employerIds` → `buildListQuery()` appends `employerIds` |

```typescript
// src/lib/services/projects-api.ts
params.employerIds?.forEach((id) => search.append("employerIds", String(id)))
```

### UI notes

- When opened from the Employers **Projects** (folder) icon, show an **Active filters** badge (`Employer: {name}`) with a clear control; keep the page heading as **All Projects** (do not replace the title).
- Clearing the badge navigates to `/projects` and drops URL params; dialog filters are unchanged unless the user clears them separately.

### Not the same as

| Endpoint / param | Meaning |
|------------------|---------|
| `GET /api/candidates?employerIds=…` | Candidates with **work experience** at those employers |
| `GET /api/candidates?projectIds=…` | Candidates linked to specific **project** ids |

---

## Source files (for agents / maintainers)

| Area | File |
|------|------|
| Query DTO | `MyApp.Application/DTOs/ProjectFilterRequest.cs` |
| Query logic | `MyApp.Infrastructure/Repositories/ProjectRepository.cs` |
| HTTP entry | `MyApp.API/Controllers/ProjectsController.cs` |
| Front-end API client | `src/lib/services/projects-api.ts` |
| Projects page URL filter | `src/components/projects-page-client.tsx` |
| Projects filter dialog | `src/components/projects-filter-dialog.tsx` |

---

*Other list filters (name, link, types, statuses, domains, tech stacks, publish flags, data progress %, dates) remain on `ProjectFilterRequest`; see `ProjectFilterChanges.md` and backend source for the full set.*
