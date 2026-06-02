# Implementation: `technicalAspectTypeIds` on `GET /api/candidates`

Delivery summary for backend Phase 2 (Technical Aspect Type catalog filtering) and frontend wiring.

**Spec:** `docs/candidate_technical_aspect_type_ids_backend_prompt.md`  
**Integration reference:** `docs/CandidateFilterIntegration.md`

---

## Summary

Added **`technicalAspectTypeIds`** (`long[]?`) to candidate list filtering so the Candidates filter dialog can filter by **Technical Aspect Type** catalog ids from `GET /api/TechnicalAspectTypes`.

This is **separate** from the legacy **`technicalAspects`** enum filter (`project_technical_aspects`). Do not send catalog ids as `technicalAspects`.

---

## Changes

### 1. `MyApp.Application/DTOs/CandidateFilterRequest.cs`

- Added `TechnicalAspectTypeIds` (`long[]?`).
- Clarified in XML docs that `TechnicalAspects` is the **legacy enum** on `project_technical_aspects` and is independent of `TechnicalAspectTypeIds`.

### 2. `MyApp.Application/Services/CandidateService.cs`

- Injected `ITechnicalAspectTypeRepository` for id validation.
- Added `ValidateTechnicalAspectTypeIdsFilterAsync` — returns **400** when any requested id is unknown or inactive.
- Passes `filter.TechnicalAspectTypeIds` through to `ICandidateRepository.GetPagedAsync`.

### 3. `MyApp.Domain/Interfaces/ICandidateRepository.cs`

- Extended `GetPagedAsync` signature with `long[]? technicalAspectTypeIds = null` (after `technicalAspects`, before `techStackIds`).

### 4. `MyApp.Infrastructure/Repositories/CandidateRepository.cs`

- Extended `GetPagedAsync` signature to match the interface.
- Added filter when `technicalAspectTypeIds is { Length: > 0 }`:

  Candidate has a linked **non-deleted** project (via `candidate_projects` **or** `candidate_work_experience_projects`) where **any** project tech stack is linked to **any** requested aspect type:

  ```
  Project.TechStacks
    → TechStack.TechnicalAspectTypeTechStacks
    → TechnicalAspectTypeId ∈ requested ids
  ```

### 5. `docs/CandidateFilterIntegration.md`

- Added `technicalAspectTypeIds` row to the Project filters table.
- Noted legacy vs catalog distinction and that this filter does **not** trigger `matchedProjects` in this release.

### Not changed

- Legacy `technicalAspects` filter — unchanged.
- `matchedProjects` — no `technicalAspectTypes[]` badges yet (follow-up).
- `GET /api/projects` — no server-side `technicalAspectTypeIds` filter yet (optional parity).
- Database — no migration (uses existing joins).

---

## Query contract

| Item | Value |
|------|-------|
| Endpoint | `GET /api/candidates` |
| Param name | `technicalAspectTypeIds` |
| Type | `long[]?` (repeated query keys) |
| Active when | `Length > 0` |
| Binding | `[FromQuery] CandidateFilterRequest` (case-insensitive) |

### Example requests

```http
GET /api/candidates?pageNumber=1&pageSize=20&technicalAspectTypeIds=22&technicalAspectTypeIds=1
```

```http
# Combined with tech stacks (AND across filters)
GET /api/candidates?technicalAspectTypeIds=22&techStackIds=12&pageSize=5

# Legacy enum still works independently (AND if both sent)
GET /api/candidates?technicalAspects=0&technicalAspectTypeIds=1&pageSize=5
```

### Filter semantics

| Rule | Behavior |
|------|----------|
| Within `technicalAspectTypeIds` array | **OR** — any listed id can match |
| With other active filters | **AND** — candidate must satisfy every active filter |
| Link paths | **OR** — `candidate_projects` or work-experience project links |
| Empty / omitted | Filter not applied |
| Deleted projects | Excluded (`Project.DeletedAt == null`) |

### Match path (data model)

```
technical_aspect_types
  └── technical_aspect_type_tech_stacks (M:N)
        └── tech_stacks
              └── project_tech_stacks
                    └── projects
                          ├── candidate_projects → candidates
                          └── candidate_work_experience_projects → work experiences → candidates
```

---

## Validation

When `technicalAspectTypeIds` is non-empty:

- Each id is checked against active rows in `technical_aspect_types`.
- **HTTP 400** if any id is unknown or inactive.

**Response body (example):**

```json
{
  "message": "One or more technicalAspectTypeIds are unknown or inactive."
}
```

(Exact shape depends on `ValidationExceptionFilter` in the API.)

---

## Notes for frontend

### Do

| Task | Detail |
|------|--------|
| Query param | Send **`technicalAspectTypeIds`** as repeated keys with **catalog long ids** from `GET /api/TechnicalAspectTypes` (`value` field). |
| Wire filter state | Map `filters.technicalAspectTypeIds: string[]` → `number[]` and append to `fetchCandidatesPage` query string. |
| Omit when empty | Do not send the param when no aspect types are selected. |
| Handle 400 | Show a clear error if the API rejects unknown/inactive ids (e.g. stale catalog after deploy). |

### Do not

| Anti-pattern | Why |
|--------------|-----|
| Send catalog ids as `technicalAspects` | Wrong taxonomy; enum ordinals ≠ catalog ids; can cause errors or wrong results |
| Use `GET /api/techstacks?technicalAspectTypeId=` to filter candidates | That scopes the **stack catalog** only, not the candidate list |
| Expect `matchedProjects` badges for aspect types yet | Badges ship with backend `matchedProjects.technicalAspectTypes[]` — see `docs/matched_projects_technical_aspect_types_implementation.md` |

### Two “Technical Aspects” concepts

| UI label source | Query param | Id type |
|-----------------|-------------|---------|
| `GET /api/TechnicalAspectTypes` | `technicalAspectTypeIds` | Catalog `long` (e.g. `22`) |
| `GET /api/technicalaspects` (legacy) | `technicalAspects` | Enum ordinal (`TechnicalAspect`) |

The Candidates filter dialog **Technical Aspects** dropdown (Phase 1) uses the **catalog** → wire **`technicalAspectTypeIds`**.

### Suggested frontend files (Phase 2)

| File | Change |
|------|--------|
| `src/lib/services/candidates-api.ts` | Add `technicalAspectTypeIds?: number[]`; append repeated query keys |
| `src/components/candidates-page-client.tsx` | Pass `filters.technicalAspectTypeIds` into list fetch options |

### Coexistence with other filters

- **`techStackIds` + `technicalAspectTypeIds`:** AND — candidate must satisfy both (possibly via **different** linked projects).
- **`technicalAspects` + `technicalAspectTypeIds`:** AND — independent taxonomies; both may be active.

---

## Frontend Phase 2 — complete

**Status:** Shipped on the frontend (list filtering wired).

| File | Change |
|------|--------|
| `src/lib/services/candidates-api.ts` | `technicalAspectTypeIds?: number[]` on `fetchCandidatesPage`; repeated query keys appended. |
| `src/components/candidates-page-client.tsx` | `backendListOptions` maps `filters.technicalAspectTypeIds` → `number[]`. |

Phase 1 (dropdown from `GET /api/TechnicalAspectTypes`) was already in place. Selecting aspect types now filters the candidate list server-side.

**`matchedProjects` badges:** Shipped end-to-end — see `docs/matched_projects_technical_aspect_types_implementation.md`. Frontend maps `technicalAspectTypes` → teal **Technical Aspect** badges in Cards/Table match summary.

---

## Confirm-back

1. **Query param name:** `technicalAspectTypeIds` (repeated `long`, camelCase JSON property on request DTO; query binding case-insensitive).

2. **Semantics:** OR within array; AND with other filters; OR across `candidate_projects` and work-experience project links — same as `techStackIds` / domain filters.

3. **Validation:** **400** when any requested id is unknown or inactive. Message: `"One or more technicalAspectTypeIds are unknown or inactive."`

4. **`matchedProjects`:** **`technicalAspectTypes[]` shipped** — see `docs/matched_projects_technical_aspect_types_implementation.md`. Legacy `matchedProjects.technicalAspects` (enum) remains unpopulated.

5. **Swagger:** New query parameter appears on `GET /api/candidates` automatically from `CandidateFilterRequest` (`array` of `integer` / `int64`, form style with repeated keys).

6. **Regression:** Omitting `technicalAspectTypeIds` behaves exactly as before. Legacy `technicalAspects` unchanged.

---

## Test plan (manual)

1. No param — same results as before.
2. Single valid catalog id — only candidates with a linked project whose stacks include that aspect type.
3. Multiple ids — OR within array.
4. Match via standalone project and via work-experience-linked project.
5. Soft-deleted projects excluded.
6. `technicalAspectTypeIds` + `techStackIds` — both must be satisfied (AND).
7. `technicalAspectTypeIds` + `technicalAspects` — both independent (AND).
8. Unknown or inactive id — **400**.

---

## Follow-ups (out of scope)

- **`GET /api/projects`** — add same `technicalAspectTypeIds` filter for server-side pagination/count accuracy.
- Per-aspect-type tech stack sub-pickers on Candidates filter — explicitly **not** planned on frontend.
- Legacy **`matchedProjects.technicalAspects`** (enum badges) — still unpopulated if ever needed.
