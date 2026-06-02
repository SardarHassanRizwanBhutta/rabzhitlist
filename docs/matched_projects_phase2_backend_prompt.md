# Backend Task (Phase 2): Extend `matchedProjects` — Technical Domains, Project Status, Tech Stacks

This document extends **Phase 1** (`docs/matched_projects_backend_prompt.md`). Phase 1 delivered
`matchedProjects` with per-project `verticalDomains` / `horizontalDomains` as `{ id, label }[]`.
Phase 2 adds **Technical Domains**, **Project Status**, and **Technology Stack** to the same
per-project match summary for the Candidates Cards/Table **Project Expertise** badges.

Hand the **"Prompt to forward"** section to the backend agent verbatim.

---

## 1. Background

The frontend list (`GET /api/candidates`) already filters correctly by:

| Query param | Filter UI label |
|-------------|-----------------|
| `technicalDomains` | Technical Domains (repeated enum int) |
| `projectStatus` | Project Status (repeated enum int) |
| `techStackIds` | Technology Stack (repeated catalog id) |

Phase 1 populates match-summary badges for Vertical/Horizontal Domains from `matchedProjects`.
Phase 2 needs the same for the three filters above: **project name heading + matched-value badges**.

**Do not change** existing query-param contracts or filtering behavior.

---

## 2. Current shape (Phase 1 — unchanged fields)

```jsonc
"matchedProjects": [
  {
    "projectId": 42,
    "projectName": "Acme Payments Platform",
    "verticalDomains": [{ "id": 3, "label": "Healthcare" }],
    "horizontalDomains": [{ "id": 0, "label": "Crm" }]
  }
]
```

---

## 3. Phase 2 additions — extend `MatchedProjectDto`

Add these fields to each object inside `matchedProjects`:

```jsonc
{
  "projectId": 42,
  "projectName": "Acme Payments Platform",
  "verticalDomains": [{ "id": 3, "label": "Healthcare" }],
  "horizontalDomains": [{ "id": 0, "label": "Crm" }],

  // NEW Phase 2:
  "technicalDomains": [{ "id": 0, "label": "CloudComputing" }],
  "techStacks": [{ "id": 12, "label": "React" }],
  "status": { "id": 0, "label": "Development" }
}
```

| Field | Type | When populated | Content |
|-------|------|----------------|---------|
| `technicalDomains` | `{ id: number, label: string }[]` | `technicalDomains` query filter active | Intersection of project's technical domains with **requested** filter enum ints. `id` = `(int)TechnicalDomain`, `label` = `enum.ToString()`. |
| `techStacks` | `{ id: number, label: string }[]` | `techStackIds` query filter active | Intersection of project's linked stacks (`project_tech_stacks`) with **requested** catalog ids. `id` = same long/int as `techStackIds` filter param. `label` = stack display name from catalog. |
| `status` | `{ id: number, label: string } \| null` | `projectStatus` query filter active | Present **only if** this project's status is in the requested filter set. `id` = `(int)ProjectStatus`, `label` = `enum.ToString()`. Omit or `null` when status filter not applied or status did not match. |

**Reuse `MatchedDomainDto`** (or equivalent `{ id, label }`) for `technicalDomains` and `techStacks`.
Tech stacks use **catalog ids**, not enums, but the same JSON shape is intentional.

**Still reserved (do NOT populate this phase):** `technicalAspects`, `projectType`, `matchedByName`.

---

## 4. Semantics (read carefully)

### 4.1 When to compute `matchedProjects`

Expand the trigger beyond domain-only filters. Compute `matchedProjects` when **any** of these
query filters is active (length > 0):

- `verticalDomains`
- `horizontalDomains`
- `technicalDomains`
- `techStackIds`
- `projectStatus`

If **none** of the above is active → `"matchedProjects": []` (never `null`).

Other project filters (`projectIds`, `projectTypes`, `clientLocations`, `technicalAspects`, etc.)
must **not** alone trigger population of `matchedProjects` in this phase (frontend has no badge
data for those yet).

### 4.2 Matched-only project inclusion

Include a project in `matchedProjects` **only if** it matched **at least one active driver**
from the list in §4.1 (OR across drivers for inclusion).

Example: filter `technicalDomains=0&projectStatus=1` — include a project if it has technical
domain 0 **or** status 1 (not necessarily both on the same project).

### 4.3 Per-field intersection

Each array/scalar holds only values that **intersect the requested filter** for that field —
not the project's full attribute set.

- If `horizontalDomains` filter is not applied → `horizontalDomains: []` on every item.
- If `projectStatus` filter is not applied → `status: null` (or omit) on every item.
- If `techStackIds` filter is not applied → `techStacks: []`.

### 4.4 Distinct + stable order

- Arrays: dedupe by `id`, order ascending by `id` (or alphabetical by `label`).
- Projects: dedupe by `projectId` across standalone + work-experience-linked paths; stable order
  (e.g. ascending `projectId`) — **confirm** current Phase 1 ordering is preserved.

### 4.5 Sources

Same as Phase 1 and existing list filters:

- Standalone: `candidate_projects`
- Work experience: `candidate_work_experience_projects`
- Respect `Project.DeletedAt == null`
- Tech stacks: **project stacks only** (`project_tech_stacks`), not candidate or work-experience stacks

### 4.6 Additive

Keep all existing list-item fields and Phase 1 behavior unchanged.

---

## 5. Example

**Request:**

```
GET /api/candidates?technicalDomains=0&projectStatus=0&techStackIds=12&pageNumber=1&pageSize=20
```

**Response item (abbreviated):**

```jsonc
{
  "id": 123,
  "name": "Jane Doe",
  "...": "...",
  "matchedProjects": [
    {
      "projectId": 42,
      "projectName": "Acme Cloud Platform",
      "verticalDomains": [],
      "horizontalDomains": [],
      "technicalDomains": [{ "id": 0, "label": "CloudComputing" }],
      "techStacks": [{ "id": 12, "label": "React" }],
      "status": { "id": 0, "label": "Development" }
    }
  ]
}
```

---

## 6. Frontend label mapping (why `id` matters)

The frontend maps **`id` → human-readable badge text** (same pattern as Phase 1 domains):

| Field | FE filter sends | FE badge display source |
|-------|-----------------|-------------------------|
| `technicalDomains[].id` | `(int)TechnicalDomain` via `technicalDomainLabelToInt` | `TECHNICAL_DOMAIN_HUMAN_LABELS[id]` (fallback: `label`) |
| `status.id` | `(int)ProjectStatus` via `PROJECT_STATUS_UI_TO_NUM` (`Development`=0, `Maintenance`=1, `Closed`=2) | UI status strings (fallback: `label`) |
| `techStacks[].id` | catalog id via tech stack lookup | **`label`** (catalog name); `id` must match `techStackIds` filter |

Enum `.ToString()` labels (e.g. `CloudComputing`, `Development`) often **differ** from UI strings
(e.g. `Cloud Computing`). Returning **`id`** is required for enums; for tech stacks, returning
**accurate `label`** (catalog name) is required.

---

## 7. Open questions — STOP and confirm before assuming

1. **`status` shape:** Is `{ id, label } | null` acceptable (recommended), or do you prefer
   `{ id, label }[]` with 0–1 entries? Frontend will support `{ id, label } | null` first.
2. **Enum id alignment:** Confirm sample mappings match frontend maps:
   - `(int)TechnicalDomain` index 0 = frontend `TECHNICAL_DOMAIN_HUMAN_LABELS[0]` (`"Cloud Computing"`)?
   - `(int)ProjectStatus` 0 = `"Development"`, 1 = `"Maintenance"`, 2 = `"Closed"`?
3. **Tech stack `id`:** Confirm `id` is the same catalog primary key used by `techStackIds` query
   param and `GET` tech stack lookups.
4. **Combined global AND filters:** When `verticalDomains=3 AND techStackIds=12`, candidate may
   match via different projects; each `matchedProjects` item should only show fields that matched
   **that project**. Confirm this matches your implementation.
5. **Phase 1 regression:** When only domain filters are active, Phase 1 behavior unchanged?

---

## 8. Deliverables / confirm back

When done, report:

1. Exact JSON property names + casing (`technicalDomains`, `techStacks`, `status`, nested `id`/`label`).
2. Confirmation of enum/catalog id alignment (§7.2–7.3) with 2–3 examples.
3. Updated OpenAPI/Swagger for extended `MatchedProjectDto`.
4. Answers to §7 open questions.

---

## 9. Prompt to forward (verbatim)

> **Context:** Phase 1 added `matchedProjects` to `GET /api/candidates` list items with per-project
> `verticalDomains` / `horizontalDomains` as `{ id, label }[]`. Filtering works; do **not** change
> query params or filter semantics.
>
> **Phase 2 task:** Extend each `matchedProjects` item with:
> - `technicalDomains`: `{ id, label }[]` — intersection with requested `technicalDomains` filter
> - `techStacks`: `{ id, label }[]` — intersection with requested `techStackIds` filter (catalog id + name)
> - `status`: `{ id, label } | null` — present only when `projectStatus` filter active and this project's status matched
>
> **Expand when `matchedProjects` is computed:** any of
> `verticalDomains`, `horizontalDomains`, `technicalDomains`, `techStackIds`, `projectStatus`
> is active. Otherwise `matchedProjects: []`.
>
> **Include a project** only if it matched ≥1 active driver (OR). Each field holds intersection-only
> with its filter. Dedupe by `projectId` / domain `id`. Same project sources as Phase 1.
> Reserved keys still unpopulated: `technicalAspects`, `projectType`, `matchedByName`.
>
> **IDs must match filter params:** `technicalDomains`/`projectStatus` enum ints; `techStacks` catalog ids.
>
> **When finished:** report JSON casing, id alignment examples, Swagger update, and answers to open
> questions in §7 of `docs/matched_projects_phase2_backend_prompt.md`.
>
> **Do NOT make assumptions.** If `status` shape, enum ordering, tech stack id source, or combined-filter
> behavior is unclear — ask before implementing.
