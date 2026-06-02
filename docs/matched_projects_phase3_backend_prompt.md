# Backend Task (Phase 3): Extend `matchedProjects` — Project Type, Client Location, Team Size, Publish, Downloads, Start Date

This document extends **Phase 1** (`docs/matched_projects_backend_prompt.md`) and **Phase 2**
(`docs/matched_projects_phase2_backend_prompt.md`). Phases 1–2 deliver `matchedProjects` with
domain, technical domain, status, and tech-stack match data. Phase 3 adds the remaining
**Project Expertise** filters so the Candidates Cards/Table can show **project name headings +
matched-value badges** (including store links) without relying on mock data.

Hand the **"Prompt to forward"** section to the backend agent verbatim.

---

## 1. Background

The frontend list (`GET /api/candidates`) already filters correctly by the query params below.
Phase 3 populates match-summary badges for them inside **`matchedProjects`** under the single
**Project Expertise** category (no separate "Published Apps" category on the frontend).

| Query param | Filter UI label |
|-------------|-----------------|
| `projectTypes` | Project Type (repeated enum int) |
| `clientLocations` | Client Location (repeated catalog id) |
| `minTeamSize` / `maxTeamSize` | Project Team Size (min / max scalars) |
| `publishPlatforms` | Publish Platforms (repeated enum int) |
| `isPublished` | Published App (bool) |
| `minDownloadCount` | Minimum Project Download Count (scalar) |
| `projectStartFrom` / `projectStartTo` | Start Date Range (ISO `DateOnly`) |

**Do not change** existing query-param contracts or filtering behavior.

---

## 2. Current shape (Phases 1–2 — unchanged fields)

```jsonc
"matchedProjects": [
  {
    "projectId": 42,
    "projectName": "Acme Payments Platform",
    "verticalDomains": [{ "id": 3, "label": "Healthcare" }],
    "horizontalDomains": [{ "id": 0, "label": "Crm" }],
    "technicalDomains": [{ "id": 0, "label": "CloudComputing" }],
    "techStacks": [{ "id": 12, "label": "React" }],
    "status": { "id": 0, "label": "Development" }
  }
]
```

---

## 3. Phase 3 additions — extend `MatchedProjectDto`

Add these fields to each object inside `matchedProjects`:

```jsonc
{
  "projectId": 42,
  "projectName": "Acme Mobile App",
  "verticalDomains": [],
  "horizontalDomains": [],
  "technicalDomains": [],
  "techStacks": [],
  "status": null,

  // NEW Phase 3:
  "projectType": { "id": 0, "label": "Employer" },
  "clientLocations": [{ "id": 5, "label": "San Francisco" }],
  "publishPlatforms": [{ "id": 0, "label": "AppStore" }],
  "storeLink": "https://apps.apple.com/app/example",
  "teamSize": { "minTeamSize": 20, "maxTeamSize": 30 },
  "downloadCount": 150000,
  "startDate": "2024-06-15"
}
```

### Field meaning

| Field | Type | When populated | Content |
|-------|------|----------------|---------|
| `projectType` | `{ id: number, label: string } \| null` | `projectTypes` filter active & this project's type matched | `id` = `(int)ProjectType`; `label` = `enum.ToString()` |
| `clientLocations` | `{ id: number, label: string }[]` | `clientLocations` filter active | Intersection of project's client location ids with **requested** filter ids. `id` = same catalog id as query param; `label` = location display name from catalog |
| `publishPlatforms` | `{ id: number, label: string }[]` | `publishPlatforms` and/or publish-related driver active & matched | Intersection with requested `publishPlatforms` filter. See §4.5 for `isPublished` interaction |
| `storeLink` | `string \| null` | Project has a store/app link URL and publish-related matching applies on this item | Full URL string (App Store, Play Store, etc.). Frontend renders as a badge (mock parity) |
| `teamSize` | `{ minTeamSize?: number, maxTeamSize?: number } \| null` | `minTeamSize` and/or `maxTeamSize` filter active & this project's team size satisfied the filter | Project's own `MinTeamSize` / `MaxTeamSize` values (not the filter bounds). Frontend formats badge as `"20-30"` |
| `downloadCount` | `number \| null` | `minDownloadCount` filter active & project's `DownloadCount >=` threshold | Project's **actual** download count. Frontend badge shows **threshold met** (e.g. `≥ 100K`), not this raw number |
| `startDate` | `string \| null` (ISO `DateOnly`) | `projectStartFrom` and/or `projectStartTo` active & project's `StartDate` in range | Project's start date that satisfied the filter. Frontend formats as `"Jun 2024"` |

**Still reserved (do NOT populate this phase):** `technicalAspects`, `matchedByName`, `projectIds`.

---

## 4. Semantics (read carefully)

### 4.1 When to compute `matchedProjects`

Expand the trigger to include **all** Phase 1–3 drivers. Compute `matchedProjects` when **any**
of these query filters is active:

**Phase 1–2:**

- `verticalDomains`, `horizontalDomains`, `technicalDomains`, `techStackIds`, `projectStatus`

**Phase 3 (new):**

- `projectTypes`, `clientLocations`, `publishPlatforms`, `isPublished`, `minDownloadCount`,
  `minTeamSize`, `maxTeamSize`, `projectStartFrom`, `projectStartTo`

If **none** of the above is active → `"matchedProjects": []` (never `null`).

Other project filters alone (`projectIds`, `projectTypes` without other drivers, `technicalAspects`,
etc.) must **not** trigger population unless listed above.

### 4.2 Matched-only project inclusion

Include a project in `matchedProjects` **only if** it matched **at least one active driver**
(OR across drivers). Same semantics as Phases 1–2.

Example: `projectTypes=Employer` + `minDownloadCount=100000` — candidate may match via different
projects; each `matchedProjects` item shows **only** fields that matched **that** project.

### 4.3 Per-field intersection

Each field holds only values that **intersect the active filter** for that field — not the
project's full attribute set. When a sub-filter is not applied:

| Field | Default when filter inactive |
|-------|------------------------------|
| `projectType` | `null` |
| `clientLocations` | `[]` |
| `publishPlatforms` | `[]` |
| `storeLink` | `null` |
| `teamSize` | `null` |
| `downloadCount` | `null` |
| `startDate` | `null` |
| Phase 1–2 arrays / `status` | unchanged (empty / null) |

### 4.4 Team size filter alignment

Use the **same logic as the existing list filter** (repository source of truth):

- `minTeamSize`: linked project `MinTeamSize` not null and `>= min`
- `maxTeamSize`: linked project `MaxTeamSize` not null and `<= max`

Return the project's actual `minTeamSize` / `maxTeamSize` on the matched item when the filter
is satisfied (for frontend `"20-30"` badge formatting).

### 4.5 Publish platforms and `isPublished` (product decision — locked)

- **Frontend uses Project Expertise badges only** (no separate Published Apps category).
- **If only `publishPlatforms` is set** (without `isPublished=true`): **unpublished** projects
  with matching platforms **must appear** in the list and in `matchedProjects` with
  `publishPlatforms` populated — same as list filter behavior.
- **If `isPublished=true`**: include published projects; populate `publishPlatforms` when the
  platform filter is also active (intersection).
- **`storeLink`**: return when the project has a link URL and publish-related matching applies
  on this item (`publishPlatforms` and/or `isPublished` driver). Confirm exact source column
  (e.g. project store URL field) in confirm-back.

### 4.6 Download count

When `minDownloadCount` is active and a project's `DownloadCount >=` threshold, set
`downloadCount` to the project's **actual** count. Frontend displays **`≥ {threshold}`**
formatted from the filter value (e.g. `≥ 100K`), not the raw count.

### 4.7 Start date range

When `projectStartFrom` / `projectStartTo` is active, include projects whose `StartDate` falls
in the inclusive range (same as list filter). Return that date as ISO `DateOnly` in `startDate`.

### 4.8 Distinct + stable order

- Arrays: dedupe by `id`, order ascending by `id`.
- Projects: dedupe by `projectId`; stable order (e.g. ascending `projectId`) — preserve Phase 1–2 behavior.

### 4.9 Sources

Same as Phases 1–2:

- `candidate_projects` and `candidate_work_experience_projects`
- `Project.DeletedAt == null`
- Avoid N+1; batch/join in the existing filtered list query

### 4.10 Additive

Keep all existing list-item fields and Phase 1–2 `matchedProjects` behavior unchanged.

---

## 5. Example

**Request:**

```
GET /api/candidates?projectTypes=0&clientLocations=5&publishPlatforms=0&isPublished=true&minDownloadCount=100000&minTeamSize=10&projectStartFrom=2024-01-01&projectStartTo=2024-12-31&pageNumber=1&pageSize=20
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
      "projectName": "Acme Mobile App",
      "verticalDomains": [],
      "horizontalDomains": [],
      "technicalDomains": [],
      "techStacks": [],
      "status": null,
      "projectType": { "id": 0, "label": "Employer" },
      "clientLocations": [{ "id": 5, "label": "San Francisco" }],
      "publishPlatforms": [{ "id": 0, "label": "AppStore" }],
      "storeLink": "https://apps.apple.com/app/example",
      "teamSize": { "minTeamSize": 20, "maxTeamSize": 30 },
      "downloadCount": 150000,
      "startDate": "2024-06-15"
    }
  ]
}
```

---

## 6. Frontend label mapping (why `id` / shape matters)

| Field | FE sends | FE badge display |
|-------|----------|------------------|
| `projectType.id` | `(int)ProjectType` | Reverse `PROJECT_TYPE_UI_TO_NUM` → `"Employer"`, etc. |
| `clientLocations[].id` | catalog id | **`label`** (location name; filter dropdown uses names) |
| `publishPlatforms[].id` | `(int)PublishedPlatform` | Reverse `PUBLISH_PLATFORM_UI_TO_NUM` → `"App Store"`, etc. |
| `storeLink` | — | URL string as badge |
| `teamSize` | `minTeamSize` / `maxTeamSize` filter scalars | `"20-30"` from project's min/max |
| `downloadCount` | `minDownloadCount` filter scalar | `≥ 100K` (threshold, not actual count) |
| `startDate` | `projectStartFrom` / `projectStartTo` | `"Jun 2024"` (formatted from ISO date) |

Enum `.ToString()` labels may differ from UI strings — return **`id`** for enums; return
**catalog name in `label`** for client locations and tech stacks.

---

## 7. Open questions — STOP and confirm before assuming

1. **`storeLink` JSON property name:** use `storeLink` (frontend preference) or existing
   `projectLink` / other column name? Map to the same URL field used in project detail.
2. **`storeLink` source:** which table/column holds the App Store / Play Store URL?
3. **Client location `label`:** confirm it is the catalog **display name** (same as location
   lookup `name`), not a city/country code alone.
4. **Enum id alignment:** confirm samples match frontend maps:
   - `ProjectType.Employer = 0`
   - `PublishedPlatform.AppStore = 0` (or equivalent)
   - Client location id matches `clientLocations` query param id
5. **Phase 1–2 regression:** when only Phase 1–2 filters are active, behavior unchanged?

---

## 8. Deliverables / confirm back

When done, report:

1. Exact JSON property names + casing (`projectType`, `clientLocations`, `publishPlatforms`,
   `storeLink`, `teamSize`, `downloadCount`, `startDate`, nested shapes).
2. Answers to §7 open questions with 2–3 examples.
3. Updated OpenAPI/Swagger for extended `MatchedProjectDto`.
4. Confirmation that `publishPlatforms`-only filter includes unpublished projects with matching
   platforms (§4.5).

---

## 9. Prompt to forward (verbatim)

> **Context:** Phases 1–2 added `matchedProjects` to `GET /api/candidates` list items with
> per-project domain, technical domain, status, and tech-stack match data (`{ id, label }[]`
> and `status: { id, label } | null`). List filtering works; do **not** change query params
> or filter semantics.
>
> **Phase 3 task:** Extend each `matchedProjects` item so the frontend can show Project
> Expertise badges (project name heading + matched values + store link) for:
> - Project Type (`projectTypes`)
> - Client Location (`clientLocations`)
> - Project Team Size (`minTeamSize`, `maxTeamSize`)
> - Publish Platforms (`publishPlatforms`)
> - Published App (`isPublished`)
> - Minimum Download Count (`minDownloadCount`)
> - Start Date Range (`projectStartFrom`, `projectStartTo`)
>
> **Add to each matched project item:**
> ```jsonc
> "projectType": { "id": 0, "label": "Employer" },
> "clientLocations": [{ "id": 5, "label": "San Francisco" }],
> "publishPlatforms": [{ "id": 0, "label": "AppStore" }],
> "storeLink": "https://apps.apple.com/app/example",
> "teamSize": { "minTeamSize": 20, "maxTeamSize": 30 },
> "downloadCount": 150000,
> "startDate": "2024-06-15"
> ```
>
> **Expand `matchedProjects` compute trigger** to include all Phase 1–3 drivers listed in
> §4.1 of `docs/matched_projects_phase3_backend_prompt.md`. Otherwise `matchedProjects: []`.
>
> **Semantics:**
> - Matched-only: include project if it matched ≥1 active driver (OR).
> - Per-field intersection only; defaults per §4.3 when sub-filter inactive.
> - Combined global AND filters: each item shows only fields that matched **that** project.
> - Team size / download count / start date: same rules as existing repository list filters.
> - **Publish (locked):** if only `publishPlatforms` is set, unpublished projects with matching
>   platforms must appear. Frontend uses Project Expertise badges only (no separate category).
> - `storeLink`: URL when available and publish-related matching applies.
> - `downloadCount`: actual count on project; frontend displays threshold met (≥ filter value).
> - Reserved unpopulated: `technicalAspects`, `matchedByName`, `projectIds`.
> - Additive; Phases 1–2 unchanged; avoid N+1.
>
> **When finished:** report JSON casing, id alignment examples, Swagger update, and answers to
> §7 open questions (especially `storeLink` property name and source column).
>
> **Do NOT make assumptions.** If anything is ambiguous — property naming, publish behavior on
> unpublished projects, team size edge cases, or date/timezone handling — ask before implementing.
