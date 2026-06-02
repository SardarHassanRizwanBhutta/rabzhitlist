# Backend Task: `matchedProjects.technicalAspectTypes[]` (Cards View badges)

Forward this brief to the backend agent when implementing **match summary badges** for the
**Technical Aspect Type** catalog filter on `GET /api/candidates`.

**Prerequisite:** List filtering via `technicalAspectTypeIds` is already shipped — see
`docs/candidate_technical_aspect_type_ids_implementation.md`.

**Frontend status:** Types, API mapper, and Cards View match summary are **ready** for this field.

---

## 1. Goal

When **`technicalAspectTypeIds`** is active on `GET /api/candidates`, populate
`matchedProjects[].technicalAspectTypes` so the Cards View can show **teal "Technical Aspect"**
badges (catalog display names) under each matched project heading — same pattern as
`techStacks`, `clientLocations`, etc.

Do **not** overload legacy `matchedProjects.technicalAspects` (reserved for the
`TechnicalAspect` enum on `project_technical_aspects` if ever populated).

---

## 2. Response shape

Add to each item in `CandidateListItemDto.matchedProjects`:

```jsonc
{
  "projectId": 42,
  "projectName": "Acme Mobile App",
  "technicalAspectTypes": [{ "id": 22, "label": "Frontend" }],
  // ...existing fields unchanged...
}
```

| Field | Type | Notes |
|-------|------|-------|
| `technicalAspectTypes` | `{ id: number, label: string }[]` | Intersection with requested `technicalAspectTypeIds` only |

- `id` — same catalog `long` as `GET /api/TechnicalAspectTypes` `value` / query param.
- `label` — display name from `technical_aspect_types` (same as catalog API).
- Default when filter not active: `[]` (not `null`).
- Distinct by `id`, ascending by `id`.

---

## 3. When to compute `matchedProjects`

Add **`technicalAspectTypeIds`** to the set of filters that **trigger** `matchedProjects`
computation (alongside `verticalDomains`, `techStackIds`, `projectTypes`, etc.).

When **only** `technicalAspectTypeIds` is active:

- Return projects that matched via stack ↔ aspect type join.
- Each item includes only the aspect types that were **both requested and matched** on that project.

When combined with other drivers (e.g. `techStackIds` + `technicalAspectTypeIds`):

- Same **matched-only / per-project intersection** semantics as existing phases.
- A project appears if it matched ≥1 active driver (OR across drivers).
- Each sub-field holds only the intersection with its filter.

---

## 4. Match semantics (per project)

For a linked non-deleted project, `technicalAspectTypes` on the DTO item = distinct
aspect types where:

1. The type id is in the request's `technicalAspectTypeIds` array, **and**
2. The project has at least one tech stack linked to that type:

```
Project.TechStacks
  → TechStack.TechnicalAspectTypeTechStacks
  → TechnicalAspectTypeId ∈ requested ids
```

Same join path as the list filter in `CandidateRepository` — reuse shared logic if possible.

---

## 5. Touch points

| Layer | Change |
|-------|--------|
| `MatchedProjectDto` (or equivalent) | Add `TechnicalAspectTypes: MatchedCatalogItem[]` |
| `matchedProjects` builder / service | Populate intersection when filter active |
| Driver filter set | Include `technicalAspectTypeIds.Length > 0` |
| `docs/CandidateFilterIntegration.md` | Document field + trigger rule |

No migration if joins already exist.

---

## 6. Example list response (redacted)

```jsonc
{
  "items": [
    {
      "id": 123,
      "name": "Jane Doe",
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
    }
  ]
}
```

Request: `GET /api/candidates?technicalAspectTypeIds=22&pageSize=10`

---

## 7. Confirm-back

1. JSON property name: **`technicalAspectTypes`** (camelCase array).
2. Trigger: `technicalAspectTypeIds` added to `matchedProjects` driver set.
3. `label` = catalog display name from `technical_aspect_types`.
4. Legacy `technicalAspects` on `matchedProjects` remains unpopulated.
5. Sample response with at least one non-empty `technicalAspectTypes` array.

---

## 8. Frontend mapping (already implemented)

| Layer | File | Behavior |
|-------|------|----------|
| Type | `src/lib/types/candidate.ts` | `MatchedProjectDto.technicalAspectTypes` |
| Mapper | `src/lib/services/candidates-api.ts` | `mapMatchedDomains(item.technicalAspectTypes)` |
| Match summary | `src/lib/utils/candidate-matches.ts` | Badge type `technicalAspect`, label from `label` |
| Cards colors | `src/components/candidates-cards-view.tsx` | Existing teal `technicalAspect` style |

No frontend change required after backend ships — verify manually in Cards View with aspect type filter active.
