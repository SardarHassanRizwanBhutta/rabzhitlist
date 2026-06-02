# Backend: `technicalAspectTypeIds` on `GET /api/candidates`

This document is the **backend implementation spec** for candidate list filtering by **Technical Aspect Type** catalog ids (`GET /api/TechnicalAspectTypes`). It unblocks **frontend Phase 2** wiring in the Candidates filter dialog.

**Related docs**

- Front-end filter integration (existing): `docs/CandidateFilterIntegration copy 3.md`
- Front-end Phase 1 (done): Candidates filter dropdown loads aspect types from `GET /api/TechnicalAspectTypes`; filter state field is `technicalAspectTypeIds: string[]` (catalog id strings). Selection does **not** filter the list until this backend work ships.

---

## 1. Problem / context

The Candidates filter **Technical Aspects** dropdown uses the same catalog as Projects (`GET /api/TechnicalAspectTypes`). Today:

| Layer | Technical Aspect **Types** (catalog) | Legacy `TechnicalAspect` **enum** |
|-------|--------------------------------------|-----------------------------------|
| UI catalog | `GET /api/TechnicalAspectTypes` → `{ value, label }[]` | `GET /api/technicalaspects` → enum ordinals |
| DB | `technical_aspect_types` ↔ `technical_aspect_type_tech_stacks` ↔ `tech_stacks` | `project_technical_aspects` |
| Project link | `project_tech_stacks` (project → stack → aspect type via M:N) | direct enum on join table |
| `GET /api/candidates` filter | **Not implemented** | `technicalAspects` (`TechnicalAspect[]?`) — **exists** |
| `GET /api/projects` filter | **Not implemented** (FE uses client-side `aspectTypeLabels`) | `technicalAspects` — **exists** |

**Do not** send Technical Aspect Type catalog ids as `technicalAspects` query values. They are a different id space; values outside the enum range can cause server errors.

---

## 2. Goal

Add **`technicalAspectTypeIds: long[]?`** to candidate list filtering so that:

> When non-empty, return only candidates linked to at least one **non-deleted** project where **any project tech stack** is linked to **any requested aspect type** (OR within the array).

This aligns with how the Projects UI thinks about “Technical Aspects” (aspect types that scope tech stacks), not the legacy enum on `project_technical_aspects`.

**Scope for this task**

- Required: list filter on `GET /api/candidates`
- Optional follow-ups: `matchedProjects` badges, `GET /api/projects` parity, validation of unknown ids

**Out of scope (explicit product decision)**

- Per-aspect-type tech stack sub-pickers on the Candidates filter (frontend will **not** add these; only the top-level aspect type multi-select).

---

## 3. Query contract

### Endpoint

| Item | Value |
|------|-------|
| Method / path | `GET /api/candidates` |
| Binding | `[FromQuery] CandidateFilterRequest` |
| New param | `technicalAspectTypeIds` |

### Parameter semantics

| Query param | Type | Active when | Behavior |
|-------------|------|-------------|----------|
| `technicalAspectTypeIds` | `long[]?` | `Length > 0` | Candidate has a linked non-deleted project (via `candidate_projects` **or** `candidate_work_experience_projects`) where **any** project tech stack is linked to **any** requested aspect type id (OR within array). |

### Query-string format

Use **repeated keys** (same as other array filters):

```http
GET /api/candidates?pageNumber=1&pageSize=20&technicalAspectTypeIds=22&technicalAspectTypeIds=1
```

ASP.NET Core model binding is case-insensitive (`technicalAspectTypeIds` / `TechnicalAspectTypeIds`).

### Global filter semantics (unchanged)

- **Across filters:** AND — candidate must satisfy every active filter.
- **Inside `technicalAspectTypeIds` array:** OR — any listed id can match.
- **Across link paths:** OR — match via `candidate_projects` **or** work-experience project links (same as `techStackIds`, `verticalDomains`, etc.).
- **Empty / omitted array:** filter not applied.

### Coexistence with other project filters

| Combined with | Semantics |
|---------------|-----------|
| `techStackIds` | AND — candidate must satisfy both (possibly via **different** linked projects, same as other project filters today). |
| `technicalAspects` (legacy enum) | AND — independent taxonomies; keep **both** params unless legacy enum is deprecated. |
| `verticalDomains`, `projectTypes`, etc. | AND — unchanged. |

---

## 4. Data model (reference)

```
technical_aspect_types
  └── technical_aspect_type_tech_stacks (M:N)
        └── tech_stacks
              └── project_tech_stacks
                    └── projects
                          ├── candidate_projects → candidates
                          └── candidate_work_experience_projects → candidate_work_experiences → candidates

project_technical_aspects  ← legacy TechnicalAspect enum (separate from aspect types)
```

**Match path for `technicalAspectTypeIds`:**

`Project.TechStacks` → `TechStack.TechnicalAspectTypeTechStacks` → `TechnicalAspectTypeId ∈ requested ids`

Use the same EF navigation names your codebase already uses for stack ↔ aspect type joins (e.g. in `TechStackService` / stack create-update).

---

## 5. Backend touch points

### 5.1 `CandidateFilterRequest.cs`

Add property (adjust namespace / XML style to match repo):

```csharp
/// <summary>
/// When non-empty, only candidates linked to at least one non-deleted project that uses
/// at least one tech stack associated with any of these <see cref="TechnicalAspectType"/> ids
/// (via <c>technical_aspect_type_tech_stacks</c>) are returned (OR within the array).
/// Matches via <c>candidate_projects</c> or <c>candidate_work_experience_projects</c>,
/// same as other project-based filters.
/// </summary>
public long[]? TechnicalAspectTypeIds { get; set; }
```

**Keep** existing `TechnicalAspects` (`TechnicalAspect[]?`) unchanged.

### 5.2 `CandidateService.GetPagedAsync` (or equivalent)

Pass `TechnicalAspectTypeIds` from the request DTO into repository args / filter object (same pattern as `TechStackIds`, `ClientLocations`, etc.).

### 5.3 `ICandidateRepository` / `CandidateRepository.GetPagedAsync`

Apply filter when `technicalAspectTypeIds is { Length: > 0 }`:

```csharp
if (technicalAspectTypeIds is { Length: > 0 })
{
    query = query.Where(c =>
        c.CandidateProjects.Any(cp =>
            cp.Project.DeletedAt == null
            && cp.Project.TechStacks.Any(pts =>
                pts.TechStack.TechnicalAspectTypeTechStacks.Any(j =>
                    technicalAspectTypeIds.Contains(j.TechnicalAspectTypeId))))
        || c.CandidateWorkExperiences.Any(we =>
            we.Projects.Any(cwp =>
                cwp.Project.DeletedAt == null
                && cwp.Project.TechStacks.Any(pts =>
                    pts.TechStack.TechnicalAspectTypeTechStacks.Any(j =>
                        technicalAspectTypeIds.Contains(j.TechnicalAspectTypeId)))));
}
```

**Notes**

- Adjust navigation property names to match your EF model (`TechStacks`, join entity type, etc.).
- No migration required if joins already exist for stack ↔ aspect type.
- Prefer reusing a private helper if other project filters share the same “linked project” predicate shape.

### 5.4 Optional: id validation

Mirror `TechStackService` behavior if desired:

- Reject unknown or inactive `technical_aspect_types` ids with **400** and a clear message, **or**
- Silently ignore unknown ids (document whichever you choose).

Recommendation: **400 on any unknown/inactive id** when the array is non-empty — easier for frontend debugging.

### 5.5 Documentation

Update **`docs/CandidateFilterIntegration copy 3.md`** (or your canonical integration doc):

1. Add row to **Project filters** table for `technicalAspectTypeIds`.
2. Clarify that `technicalAspects` remains the **legacy enum** on `project_technical_aspects` (separate from aspect types).
3. Optionally note whether `technicalAspectTypeIds` alone triggers `matchedProjects` (see §6).

### 5.6 Swagger / OpenAPI

Ensure the new query parameter appears on `GET /api/candidates` with `array` + `long` item type and `style: form` / `explode: true` for repeated keys.

---

## 6. Optional: `matchedProjects` (Cards View badges)

**Not required** to unblock Phase 2 list filtering. Implement when Cards View should show which aspect types matched.

Today `matchedProjects.technicalAspects` is **reserved** (legacy enum). For aspect **types**, add a **new** field — do not overload `technicalAspects`:

```jsonc
"matchedProjects": [
  {
    "projectId": 42,
    "projectName": "Acme Mobile App",
    "technicalAspectTypes": [{ "id": 22, "label": "Frontend" }],
    // ...existing fields...
  }
]
```

| Field | Type | When populated |
|-------|------|----------------|
| `technicalAspectTypes` | `{ id: number, label: string }[]` | `technicalAspectTypeIds` filter active **and** this project matched via stack ↔ aspect type join |

**Semantics (align with existing `matchedProjects` phases)**

- Add `technicalAspectTypeIds` to the set of filters that **trigger** `matchedProjects` computation (when you implement badges).
- Per project: intersection only — ids/labels that were both requested **and** matched on that project.
- Distinct by `id`, ascending by `id`; `label` = catalog display name from `technical_aspect_types`.

Frontend follow-up (separate task): extend `MatchedProjectDto`, mapper in `candidates-api.ts`, and `appendBackendMatchedProjectItems` in `candidate-matches.ts`.

---

## 7. Optional: `GET /api/projects` parity

`ProjectFilterRequest` today only has legacy `TechnicalAspects`. For consistency, the same `technicalAspectTypeIds` filter can be added to project list with the same stack ↔ aspect type predicate on `Project` directly.

The Projects page currently **client-filters** by `aspectTypeLabels` when only aspect types are selected; server support would fix pagination/count accuracy.

---

## 8. What NOT to do

| Anti-pattern | Why |
|--------------|-----|
| Map catalog ids into `TechnicalAspects` enum filter | Wrong taxonomy; risk of 500 / wrong results |
| Filter `technical_aspect_types` without going through `project_tech_stacks` | Would not reflect which stacks the project actually uses |
| Remove legacy `technicalAspects` filter | Still valid for `project_technical_aspects`; other clients may use it |
| Use `GET /api/techstacks?technicalAspectTypeId=` as a candidate filter | That endpoint scopes the **stack catalog** only; it does not filter candidates |

---

## 9. Acceptance criteria / test plan

### List filtering

1. **No param** — same result set as before (regression).
2. **Single valid id** — only candidates with a linked project whose stacks include that aspect type.
3. **Multiple ids (OR)** — candidate matches if **any** id matches on **any** linked project.
4. **Both link paths** — matches via `candidate_projects` and via work-experience projects.
5. **Deleted projects** — excluded (`Project.DeletedAt == null`).
6. **AND with `techStackIds`** — both filters active; candidate must satisfy both (may use different projects).
7. **AND with legacy `technicalAspects`** — independent; both can be active.
8. **Unknown id** — 400 if validation enabled, or zero results if ignored (document behavior).
9. **Inactive aspect type id** — same as unknown (per validation policy).

### Example manual checks

```http
# Catalog ids from GET /api/TechnicalAspectTypes
GET /api/candidates?technicalAspectTypeIds=1&pageSize=5

# Combined with tech stacks (AND)
GET /api/candidates?technicalAspectTypeIds=22&techStackIds=12&pageSize=5

# Legacy enum still works independently
GET /api/candidates?technicalAspects=0&pageSize=5
```

---

## 10. Frontend Phase 2 checklist (after backend deploys)

Once `technicalAspectTypeIds` is live, frontend will:

| File | Change |
|------|--------|
| `src/lib/services/candidates-api.ts` | Add `technicalAspectTypeIds?: number[]` to `fetchCandidatesPage` options; append repeated query keys. |
| `src/components/candidates-page-client.tsx` | In `backendListOptions`, map `filters.technicalAspectTypeIds` → `number[]` and pass to `fetchCandidatesPage`. |
| `docs/CandidateFilterIntegration copy 3.md` | Sync with backend (or point to canonical doc). |

**Already done (Phase 1)**

- `fetchTechnicalAspectTypes()` on candidates page mount
- `CandidatesFilterDialog` prop `technicalAspectTypes`
- Filter state: `technicalAspectTypeIds: string[]`
- `hasActiveFilters` counts aspect type selections

**Not in Phase 2 scope**

- Per-type tech stack sub-pickers on Candidates filter
- `matchedProjects` aspect-type badges (unless backend §6 ships in same release)

---

## 11. Confirm-back template (for backend PR)

When implementation is complete, please confirm:

1. Exact query param name: `technicalAspectTypeIds` (repeated `long`).
2. OR-within-array / AND-with-other-filters semantics as §3.
3. Validation policy for unknown/inactive ids (400 vs ignore).
4. Whether `matchedProjects` includes `technicalAspectTypes[]` in this release or a follow-up.
5. Sample response snippet for a filtered list (redacted ids ok).

---

## 12. Source references (backend)

| Area | Typical path |
|------|----------------|
| Request DTO | `MyApp.Application/DTOs/CandidateFilterRequest.cs` |
| Service | `MyApp.Application/Services/CandidateService.cs` |
| Repository | `MyApp.Infrastructure/Repositories/CandidateRepository.cs` |
| Aspect type catalog | `GET /api/TechnicalAspectTypes` |
| Stack ↔ type join | Same entities used by `TechStackService` / `technical_aspect_type_tech_stacks` |

If behavior appears inconsistent, treat **repository logic** as source of truth and update this doc.
