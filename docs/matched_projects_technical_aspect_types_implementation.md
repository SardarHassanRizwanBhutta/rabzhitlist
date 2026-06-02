# Implementation: `matchedProjects.technicalAspectTypes[]`

Delivery summary for **Cards View match-summary badges** when the **Technical Aspect Type** catalog filter is active on `GET /api/candidates`.

**Spec:** `docs/matched_projects_technical_aspect_types_backend_prompt.md`  
**Prerequisite:** List filtering via `technicalAspectTypeIds` — see `docs/candidate_technical_aspect_type_ids_implementation.md`  
**Integration reference:** `docs/CandidateFilterIntegration.md`

---

## Summary

When **`technicalAspectTypeIds`** is active on `GET /api/candidates`, each item in **`matchedProjects`** now includes **`technicalAspectTypes: { id, label }[]`** — the intersection of requested aspect type ids with aspect types linked to that project's tech stacks.

This enables the Cards View to show **teal "Technical Aspect" badges** under each matched project heading (frontend mapping already in place).

**Do not** use legacy `matchedProjects.technicalAspects` for catalog aspect types — that field remains reserved for the `TechnicalAspect` enum on `project_technical_aspects` if ever populated.

---

## Changes

### 1. `MyApp.Domain/Models/MatchedProjectInfo.cs`

- Added `TechnicalAspectTypes` (`List<MatchedCatalogItemInfo>`).
- Reuses existing `MatchedCatalogItemInfo` (`Id` + `Name`) for catalog id and display name.

### 2. `MyApp.Application/DTOs/CandidateDto.cs`

- Extended `MatchedProjectDto` with `TechnicalAspectTypes: IReadOnlyList<MatchedDomainDto>` (placed after `TechStacks`, before `Status`).

### 3. `MyApp.Domain/Interfaces/ICandidateRepository.cs`

- Extended `GetMatchedProjectsAsync` with parameter `long[]? technicalAspectTypeIds` (after `techStackIds`, before `projectStatus`).

### 4. `MyApp.Infrastructure/Repositories/CandidateRepository.cs`

- Extended `GetMatchedProjectsAsync` signature to match the interface.
- **Project inclusion (OR driver):** when `technicalAspectTypeIds` is active, include a project if any of its tech stacks links to any requested aspect type:

  ```
  Project.TechStacks
    → TechStack.TechnicalAspectTypeTechStacks
    → TechnicalAspectTypeId ∈ requested ids
  ```

  Same join path as the list filter in `GetPagedAsync`.

- **Per-project intersection:** populate `TechnicalAspectTypes` from the same join, selecting:
  - `Id` = `TechnicalAspectTypeId`
  - `Name` = `TechnicalAspectType.DisplayName`

- Applied for both link paths: `candidate_projects` and `candidate_work_experience_projects`.

### 5. `MyApp.Application/Services/CandidateService.cs`

- Added `filter.TechnicalAspectTypeIds is { Length: > 0 }` to the **`matchedProjects` compute trigger** set.
- Passes `filter.TechnicalAspectTypeIds` to `GetMatchedProjectsAsync`.
- Maps `TechnicalAspectTypes` via existing `ToMatchedCatalogDtos` (distinct by `id`, ascending by `id`).

### 6. Documentation

- **`docs/CandidateFilterIntegration.md`** — added `technicalAspectTypes` field, example JSON, trigger rule; updated `technicalAspectTypeIds` row to note it triggers `matchedProjects`.
- **`docs/candidate_technical_aspect_type_ids_implementation.md`** — updated confirm-back and follow-ups to reflect badges are now shipped.

### Not changed

- List filter semantics for `technicalAspectTypeIds` — unchanged.
- Legacy `technicalAspects` on `matchedProjects` — still unpopulated.
- Legacy `technicalAspects` list filter — unchanged.
- Database — no migration (uses existing joins).

---

## Response shape

```jsonc
"matchedProjects": [
  {
    "projectId": 42,
    "projectName": "Acme Mobile App",
    "verticalDomains": [],
    "horizontalDomains": [],
    "technicalDomains": [],
    "techStacks": [],
    "technicalAspectTypes": [{ "id": 22, "label": "Frontend" }],
    "status": null,
    "projectType": null,
    "clientLocations": [],
    "publishPlatforms": [],
    "storeLink": null,
    "teamSize": null,
    "downloadCount": null,
    "startDate": null
  }
]
```

| Field | Type | When populated |
|-------|------|----------------|
| `technicalAspectTypes` | `{ id: number, label: string }[]` | `technicalAspectTypeIds` filter active **and** this project matched via stack ↔ aspect type join |

| Property | Detail |
|----------|--------|
| `id` | Same catalog `long` as `GET /api/TechnicalAspectTypes` `value` / `technicalAspectTypeIds` query param |
| `label` | `technical_aspect_types.display_name` (same as catalog API) |
| Default when filter inactive | `[]` (never `null`) |
| Ordering | Distinct by `id`, ascending by `id` |

---

## Semantics

### When `matchedProjects` is computed

`technicalAspectTypeIds` is now included in the driver set alongside:

- Phase 1–2: `verticalDomains`, `horizontalDomains`, `technicalDomains`, `techStackIds`, `projectStatus`
- Phase 3: `projectTypes`, `clientLocations`, `publishPlatforms`, `isPublished`, `minDownloadCount`, `minTeamSize`, `maxTeamSize`, `projectStartFrom`, `projectStartTo`

If **none** of the drivers (including `technicalAspectTypeIds`) is active → `matchedProjects: []`.

### Matched-only / per-project intersection

- A project appears only if it matched **≥1 active driver** (OR across drivers).
- `technicalAspectTypes` holds only aspect types that were **both requested and matched** on **that** project.
- When `technicalAspectTypeIds` is not active → `technicalAspectTypes: []` on every item.

### Combined filters

Example: `techStackIds=12&technicalAspectTypeIds=22`

- Candidate must satisfy **both** list filters (AND globally; may use different projects).
- Each `matchedProjects` item shows only fields that matched **that** project.
- A project may appear with only `techStacks` populated, only `technicalAspectTypes`, or both.

---

## Example request

```http
GET /api/candidates?technicalAspectTypeIds=22&pageNumber=1&pageSize=10
```

---

## Confirm-back

1. **JSON property name:** **`technicalAspectTypes`** (camelCase array of `{ id, label }`).

2. **Trigger:** `technicalAspectTypeIds` added to the `matchedProjects` driver set in `CandidateService.BuildMatchedProjectsAsync`.

3. **`label` source:** Catalog display name from `technical_aspect_types.display_name` (`TechnicalAspectType.DisplayName`) — same as `GET /api/TechnicalAspectTypes` `label`.

4. **`id` source:** `technical_aspect_types.id` — same integer as the `technicalAspectTypeIds` query param and catalog API `value`.

5. **Legacy `technicalAspects` on `matchedProjects`:** Remains **unpopulated**. Catalog aspect types use **`technicalAspectTypes`** only.

6. **Sample response:** When filtering with `technicalAspectTypeIds=22`, a matched project includes e.g. `"technicalAspectTypes": [{ "id": 22, "label": "Frontend" }]`; other sub-fields default to `[]` or `null` when their filters are inactive.

7. **Swagger:** `MatchedProjectDto` schema automatically includes `technicalAspectTypes` as an array of `{ id, label }`.

8. **Regression:** Omitting `technicalAspectTypeIds` behaves as before; existing `matchedProjects` fields unchanged.

---

## Test plan (manual)

1. **`technicalAspectTypeIds` only** — `matchedProjects` populated; each item has non-empty `technicalAspectTypes` where applicable; other arrays empty / scalars null.
2. **Filter inactive** — `technicalAspectTypes: []` on all items (or `matchedProjects: []` if no other driver active).
3. **Multiple ids (OR)** — item includes all requested types that match on that project.
4. **Both link paths** — match via standalone project and work-experience-linked project.
5. **Combined with `techStackIds`** — per-project fields show only respective intersections.
6. **Deleted projects** — excluded.
7. **Distinct types** — project with multiple stacks under same aspect type returns one entry per type id.

---

## Frontend (aligned — verify after deploy)

Frontend wiring matches this backend delivery; **no code changes required** unless API shape differs in testing.

| Layer | File | Behavior |
|-------|------|----------|
| Type | `src/lib/types/candidate.ts` | `MatchedProjectDto.technicalAspectTypes: MatchedDomainDto[]` |
| Mapper | `src/lib/services/candidates-api.ts` | `mapMatchedDomains(item.technicalAspectTypes)` |
| Driver set | `src/lib/utils/candidate-matches.ts` | `technicalAspectTypeIds` in `hasBackendMatchedProjectFilterDrivers` |
| Badges | `src/lib/utils/candidate-matches.ts` | Criterion type `technicalAspect`, labels from `label` |
| Cards / Table | `candidates-cards-view.tsx`, `candidates-table.tsx` | Teal `technicalAspect` badge style via `getCriterionColor` |

### Manual verification

1. Candidates → Filter → **Technical Aspects** → select a catalog type → Apply.
2. Switch to **Cards** (or expand Table match row).
3. Under **Project Expertise**, each matched project should show teal badges (e.g. `Frontend`) from `matchedProjects[].technicalAspectTypes`.
4. Network: `GET /api/candidates?technicalAspectTypeIds=…` response includes `"technicalAspectTypes": [{ "id": …, "label": "…" }]`.

---

## Related docs

| Document | Purpose |
|----------|---------|
| `docs/matched_projects_technical_aspect_types_backend_prompt.md` | Original task brief |
| `docs/candidate_technical_aspect_type_ids_implementation.md` | List filter + validation |
| `docs/CandidateFilterIntegration.md` | Full filter + `matchedProjects` reference |
