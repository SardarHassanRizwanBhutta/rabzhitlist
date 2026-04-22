# Project list filter — date filter changes

This document describes the **date-related** changes to **`GET /api/projects`** query parameters (`ProjectFilterRequest` → `ProjectRepository`). All filters still combine with **logical AND**.

---

## Breaking change (removed parameters)

These query properties were **removed** from `ProjectFilterRequest`:

| Removed | Old behavior (approximate) |
|---------|----------------------------|
| `startDate` | `Project.StartDate != null && StartDate >= startDate` |
| `endDate` | `Project.EndDate != null && EndDate <= endDate` |

They were **not** a single logical “project activity range”; they behaved as **two independent lower/upper constraints** on different columns. The front-end should **stop** sending `startDate` / `endDate` and use the six parameters below instead.

---

## New parameters (six optional `DateOnly` values)

Binding is the usual ASP.NET Core `[FromQuery]` model: **camelCase** query names match property names.

| Query parameter (camelCase) | Property | Applies to DB column | Rule |
|----------------------------|-----------|----------------------|------|
| `completionFrom` | `CompletionFrom` | `EndDate` | If set: `EndDate != null` **and** `EndDate >= completionFrom` (inclusive). |
| `completionTo` | `CompletionTo` | `EndDate` | If set: `EndDate != null` **and** `EndDate <= completionTo` (inclusive). |
| `projectStartFrom` | `ProjectStartFrom` | `StartDate` | If set: `StartDate != null` **and** `StartDate >= projectStartFrom` (inclusive). |
| `projectStartTo` | `ProjectStartTo` | `StartDate` | If set: `StartDate != null` **and** `StartDate <= projectStartTo` (inclusive). |
| `activeWindowFrom` | `ActiveWindowFrom` | overlap (see below) | See **Active window** section. |
| `activeWindowTo` | `ActiveWindowTo` | overlap (see below) | See **Active window** section. |

Use ISO **dates** only (e.g. `2025-03-15`).

---

## Semantics by feature

### 1. Completion (end date bounds)

Independent optional **inclusive** range on **`projects.end_date`** only.

- Any bound that is set requires a **non-null** `EndDate` on the project; rows with **null** `EndDate` **do not** match that bound.
- `completionFrom` only → “ended on or after …”
- `completionTo` only → “ended on or before …”
- Both → “ended within [from, to]”

### 2. Start-only (start date bounds)

Independent optional **inclusive** range on **`projects.start_date`** only.

- Any bound that is set requires a **non-null** `StartDate`; rows with **null** `StartDate` **do not** match that bound.
- `projectStartFrom` only → “started on or after …”
- `projectStartTo` only → “started on or before …”
- Both → “started within [from, to]”

### 3. Active window (timeline overlap)

Filters projects whose **timeline** intersects a **window** on the calendar. Project interval is **`[StartDate, EndDate]`** with special handling for **null** `EndDate`.

| `EndDate` on row | Treated as (for overlap math) |
|------------------|-------------------------------|
| non-null | closed end at `EndDate` |
| **null** | **open-ended** — upper end is **`DateOnly.MaxValue`** (project still running for overlap purposes) |

**Important:** If **`StartDate` is null**, the row **never** matches **any** active-window branch (start cannot be anchored).

**Branches:**

| `activeWindowFrom` | `activeWindowTo` | Meaning |
|--------------------|------------------|---------|
| set | set | Closed window **`[from, to]`** (inclusive). Match iff `StartDate ≤ to` **and** `(EndDate ?? MaxValue) ≥ from`. Standard segment overlap. |
| set | omitted | One-sided window **`[from, +∞)`**. Match iff `StartDate != null` **and** `(EndDate ?? MaxValue) ≥ from`. |
| omitted | set | One-sided window **`(−∞, to]`**. Match iff `StartDate != null` **and** `StartDate ≤ to`. |
| omitted | omitted | No active-window filter. |

If `from > to` when both are set, the predicate can yield **no rows** (invalid window); the API does not normalize or swap dates.

---

## Interaction with other filters

- **Completion**, **start-only**, and **active-window** filters are **independent**: all that are “active” apply together with **AND**.
- Unchanged filters (name, link, types, statuses, employers, domains, downloads, team size, publish flags, etc.) behave as before; see `ProjectFilterRequest` and `ProjectRepository` for the full list.

---

## Source files

| Area | Path |
|------|------|
| Query DTO | `MyApp.Application/DTOs/ProjectFilterRequest.cs` |
| Repository logic | `MyApp.Infrastructure/Repositories/ProjectRepository.cs` (`ApplyProjectDateFilters`, `GetFilteredAsync`, `GetFilteredWithDetailsAsync`) |
| Repository contract | `MyApp.Domain/Interfaces/IProjectRepository.cs` |
| Service wiring | `MyApp.Application/Services/ProjectService.cs` (`GetFilteredAsync`) |
| HTTP entry | `MyApp.API/Controllers/ProjectsController.cs` — `GET /api/projects` |

---

## Example queries

```
GET /api/projects?completionFrom=2024-01-01&completionTo=2024-12-31
GET /api/projects?projectStartFrom=2023-06-01&projectStartTo=2023-06-30
GET /api/projects?activeWindowFrom=2025-01-01&activeWindowTo=2025-03-31
GET /api/projects?completionTo=2020-12-31&projectStartFrom=2019-01-01&activeWindowFrom=2018-01-01&activeWindowTo=2022-12-31&pageNumber=1&pageSize=20
```

---

*Document reflects the implementation as of the repository version that introduced `ApplyProjectDateFilters` and removed `StartDate` / `EndDate` from `ProjectFilterRequest`.*
