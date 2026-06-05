# Backend Task: `matchedWorkExperiences` on the Candidates List Response

This document is a ready-to-forward brief + prompt for the backend AI agent. It
explains the goal, the existing contract that must not change, the new response
structure, and the exact semantics. Hand the **"Prompt to forward"** section to
the backend agent verbatim.

---

## 1. Background / Why

The candidates **Cards View** (and Table match summary) shows a per-candidate
**"Work Experience"** match category when Work Experience filters are active
(shift type, work mode, time support zones, work-experience tech stacks).

For each qualifying work experience, the UI renders **`{employerName} - {jobTitle}`**
as the item heading with matched values as **badges** beneath it (e.g. Remote,
PST, React).

The backend already filters the candidate list correctly via
`candidate_work_experiences` (see `docs/CandidateFilterIntegration copy 6.md`,
Work experience filters section), but the list response carries **no per-candidate
work-experience match data**. The list mapper sets `workExperiences: []`, so the
frontend cannot show *which* work experiences caused the match.

We need the backend to return **matched values, grouped by work experience**,
mirroring the existing `matchedProjects` and `matchedEmployers` patterns so the UI
can rebuild **Work Experience** blocks without loading full candidate graphs on the
list endpoint.

This is intentionally a **lean "matched values only"** payload (not full work
experience graphs), grouped per **work experience** so repeated stints at the same
company remain distinct when job title or dates differ.

**Why IDs are required (not just labels):** the frontend renders enum badges from
hardcoded `id → display label` maps (the same maps that power the filter
dropdowns). Each matched enum/catalog value must carry the **integer `id`** (the
same integer sent in query params) plus a human-readable `label` as fallback.

**Relationship to `matchedEmployers`:** Employer Characteristics filters
(`employerIds`, `employerStatuses`, etc.) already populate `matchedEmployers`.
Work Experience row filters (`shiftTypes`, `workModes`, `timeSupportZoneIds`,
`workExperienceTechStackIds`) are a **separate concern** and populate
`matchedWorkExperiences`. The same `workExperienceId` **may** appear in both
arrays when both filter groups are active; the UI shows **two categories**
(Employer Experience vs Work Experience).

---

## 2. Existing contract — DO NOT CHANGE

- **Endpoint:** `GET /api/candidates` (paged list). Response: `PagedResult<CandidateListItemDto>`.
- **Work experience filtering already works** and must remain unchanged. Active query
  params (repeated where array):

  ```
  GET /api/candidates
    ?shiftTypes=0&shiftTypes=4
    &workModes=1&workModes=2
    &timeSupportZoneIds=1&timeSupportZoneIds=3
    &workExperienceTechStackIds=12&workExperienceTechStackIds=45
    &pageNumber=1&pageSize=20
  ```

  Semantics are documented in `docs/CandidateFilterIntegration copy 6.md` (Work
  experience filters table). **Do not change** param names, types, or filter
  behavior.

- **`workExperienceTechStackIds` is not `techStackIds`.** Project tech stacks use
  `techStackIds` on linked projects and populate `matchedProjects` — out of scope
  for this payload.

- Keep all existing list-item fields exactly as they are. The change below is **purely
  additive**.

---

## 3. What to add — `matchedWorkExperiences`

Add a new field to each candidate **list item**:

```jsonc
"matchedWorkExperiences": [
  {
    // Identity / display (always present on each item)
    "workExperienceId": 5501,
    "employerId": 42,
    "employerName": "Acme Corp",
    "jobTitle": "Staff Engineer",
    "startDate": "2022-06-01",   // ISO DateOnly; null if unknown
    "endDate": null,             // null = current role

    // Populated ONLY when the corresponding filter is active AND this work experience
    // matched via that filter. See §4.

    // When `shiftTypes` filter active and this WE's shift_type matched
    "shiftType": { "id": 1, "label": "Remote" },

    // When `workModes` filter active and this WE's work_mode matched
    "workMode": { "id": 2, "label": "Hybrid" },

    // Intersection with requested `timeSupportZoneIds` filter
    "timeSupportZones": [{ "id": 1, "label": "PST" }],

    // Intersection with requested `workExperienceTechStackIds` filter
    "techStacks": [{ "id": 12, "label": "React" }]
  }
]
```

### Field meaning

| Field | Type | Required on item | Notes |
|-------|------|------------------|-------|
| `workExperienceId` | `long` | Yes | Stable id of `CandidateWorkExperience`. Used to key/dedupe items. |
| `employerId` | `long` | Yes | Linked employer id (non-deleted). For context only; not an employer-filter driver here. |
| `employerName` | `string` | Yes | Employer display name; part of UI heading `{employerName} - {jobTitle}`. |
| `jobTitle` | `string \| null` | Yes | From the work experience row. |
| `startDate` | `string \| null` | Yes | ISO `DateOnly` from work experience. |
| `endDate` | `string \| null` | Yes | ISO `DateOnly`; `null` = currently working in this role. |
| `shiftType` | `{ id: number, label: string } \| null` | Yes | Non-null only when `shiftTypes` filter is active **and** this WE's non-null `shift_type` is in the requested set. At most one value (scalar on the row). |
| `workMode` | `{ id: number, label: string } \| null` | Yes | Non-null only when `workModes` filter is active **and** this WE's non-null `work_mode` is in the requested set. At most one value (scalar on the row). |
| `timeSupportZones` | `{ id: number, label: string }[]` | Yes (may be `[]`) | Intersection of WE linked zones with requested `timeSupportZoneIds`. Catalog id + name from `time_support_zones`. |
| `techStacks` | `{ id: number, label: string }[]` | Yes (may be `[]`) | Intersection of WE linked stacks with requested `workExperienceTechStackIds`. Catalog id + name from `tech_stacks`. |

Reuse the same `{ id, label }` object shape as `matchedProjects[].techStacks` and
`matchedEmployers[].statuses`.

For enum-backed fields (`shiftType`, `workMode`), `id` must be the **same integer**
used by the corresponding query-param filter. `label` should be server-normalized
display text (or `enum.ToString()` as fallback).

---

## 4. Semantics (read carefully)

### 4.1 When to compute `matchedWorkExperiences`

Compute `matchedWorkExperiences` when **any** of these query filters is active:

| Driver filter | Query param |
|---------------|-------------|
| Shift type | `shiftTypes` |
| Work mode | `workModes` |
| Time support zones | `timeSupportZoneIds` |
| Work experience tech stacks | `workExperienceTechStackIds` |

If **none** of the above is active → `"matchedWorkExperiences": []` (empty array,
**never** `null`).

**Not drivers** (do not trigger population alone):

- Employer Characteristics filters → use `matchedEmployers` instead.
- Project filters → use `matchedProjects` instead.
- `jobTitle`, `minExperienceYears` / `maxExperienceYears` — candidate-level filters;
  out of scope for this payload (frontend uses `latestJobTitle` / `totalExperienceYears`
  on the list item when those filters are active).
- `isCurrentlyWorking`, tech-stack min-years, work-mode min-years, top-developer,
  mutual-connection, average tenure, joined-from-start — not implemented on list API;
  out of scope.

Update `docs/CandidateFilterIntegration copy 6.md` line that currently says work
experience filters do not trigger `matchedEmployers` / `matchedProjects` to also
state they **do** trigger `matchedWorkExperiences`.

### 4.2 Matched-only scope (work experience inclusion)

Include a work experience in `matchedWorkExperiences` **only if** it matched **at
least one active driver** above (OR across drivers), using the **same logic as the
existing list filter** for that field.

Requirements:

- Source rows from `candidate_work_experiences` linked to non-deleted employers
  (consistent with list filtering).
- **One array entry per work experience** (not deduped by `employerId`). A candidate
  with two stints at the same company produces two items when both match.
- A work experience with `shift_type = null` cannot satisfy a `shiftTypes` driver
  (same as list filter). Same for `work_mode = null` and `workModes`.

### 4.3 Per-field intersection

Each field holds **only** values that intersect the **active filter** for that field —
not the work experience's full attribute set.

| Field | When filter inactive |
|-------|----------------------|
| `shiftType` | `null` |
| `workMode` | `null` |
| `timeSupportZones` | `[]` |
| `techStacks` | `[]` |

Example: request has `workModes=1` only → item may have non-null `workMode` but
`shiftType` remains `null`, `timeSupportZones` and `techStacks` remain `[]` even if
the WE has other attributes.

### 4.4 Multi-value fields

- **Time support zones:** from `candidate_work_experience_time_support_zones`. Return
  only zone ids in the requested `timeSupportZoneIds` set.
- **Tech stacks:** from `candidate_work_experience_tech_stacks`. Return only stack ids
  in the requested `workExperienceTechStackIds` set.

Dedupe by `id` within each `{ id, label }[]` array; stable ascending order by `id`.
Cities are not used on this payload.

### 4.5 Enum reference (must match list filter ints)

**ShiftType** (`shiftTypes` query param):

| `id` | Name |
|------|------|
| 0 | Day |
| 1 | Night |
| 2 | Evening |
| 3 | Rotational |
| 4 | Flexible |
| 5 | OnCall |

**WorkMode** (`workModes` query param):

| `id` | Name |
|------|------|
| 0 | Onsite |
| 1 | Remote |
| 2 | Hybrid |

These are the same integers as work experience create/update (`ShiftType` /
`WorkMode` enums on `CandidateWorkExperience`).

### 4.6 Overlap with `matchedEmployers`

When both employer driver filters and work-experience driver filters are active:

- Populate **both** `matchedEmployers` and `matchedWorkExperiences` independently.
- The same `workExperienceId` may appear in both arrays if it satisfied drivers in
  each group.
- Do **not** merge payloads; the frontend renders separate categories.

### 4.7 Performance

- Implement within the existing filtered query; avoid N+1 per candidate.
- Do not return full work experience graphs, project lists, or employer location lists.
- Keep payload lean: matched scalars/arrays only.

### 4.8 Backwards compatibility

- Additive field on `CandidateListItemDto`; omit or return `[]` for clients that ignore it.
- JSON property name: **`matchedWorkExperiences`** (camelCase, plural).

---

## 5. Sample responses

### 5.1 Shift + work mode

Request:

```
GET /api/candidates?shiftTypes=0&workModes=1&workModes=2&pageSize=10
```

Fragment:

```json
{
  "items": [
    {
      "id": 1001,
      "name": "Jane Doe",
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
          "timeSupportZones": [],
          "techStacks": []
        }
      ]
    }
  ]
}
```

### 5.2 Time zones + tech stacks only

Request:

```
GET /api/candidates?timeSupportZoneIds=1&workExperienceTechStackIds=12&workExperienceTechStackIds=45
```

Fragment:

```json
{
  "matchedWorkExperiences": [
    {
      "workExperienceId": 5502,
      "employerId": 99,
      "employerName": "Globex",
      "jobTitle": "Senior Developer",
      "startDate": "2020-01-15",
      "endDate": "2023-08-01",
      "shiftType": null,
      "workMode": null,
      "timeSupportZones": [
        { "id": 1, "label": "PST" }
      ],
      "techStacks": [
        { "id": 12, "label": "React" },
        { "id": 45, "label": "TypeScript" }
      ]
    }
  ]
}
```

Request with no work-experience driver filters → every item has
`"matchedWorkExperiences": []`.

---

## 6. Confirm-back checklist

When finished, report:

1. JSON property name: **`matchedWorkExperiences`** (camelCase array).
2. Trigger set matches §4.1 exactly (four query params only).
3. Each enum `{ id, label }` uses the **same integer** as the query-param filter.
4. One entry per matching work experience; not deduped by employer.
5. Empty array (never null) when no driver filters active.
6. `shiftType` / `workMode` are scalars (nullable), not arrays.
7. `techStacks` on this payload reflects **work experience** stacks only (not project
   `techStackIds`).
8. Sample response with at least one non-empty `matchedWorkExperiences` item.
9. Updated OpenAPI/Swagger schema for `CandidateListItemDto`.
10. `docs/CandidateFilterIntegration copy 6.md` updated with response section.

---

## 7. Frontend mapping (planned — after backend ships)

After backend ships, the frontend will wire:

| Layer | File | Planned behavior |
|-------|------|------------------|
| Type | `src/lib/types/candidate.ts` | `MatchedWorkExperienceDto` + `Candidate.matchedWorkExperiences` |
| Mapper | `src/lib/services/candidates-api.ts` | `mapMatchedWorkExperiences()` in list DTO → `Candidate` |
| Match summary | `src/lib/utils/candidate-matches.ts` | `hasBackendMatchedWorkExperienceFilterDrivers()`, `appendBackendMatchedWorkExperienceItems()` — category label **Work Experience**, distinct from **Employer Experience** |
| Cards colors | `src/components/candidates-cards-view.tsx` | Criterion types: `shiftType`, `workMode`, `timeSupportZones`, `candidateTechStack` |

Badge mapping (active filter → criterion):

| Active filter (UI) | Query param | Badge type | Display source |
|--------------------|-------------|------------|----------------|
| Shift Type | `shiftTypes` | `shiftType` | Map `shiftType.id` → `SHIFT_TYPE_DB_LABELS` (or use `label`) |
| Work Mode | `workModes` | `workMode` | Map `workMode.id` → `WORK_MODE_DB_LABELS` (or use `label`) |
| Time Support Zones | `timeSupportZoneIds` | `timeSupportZones` | `timeSupportZones[].label` |
| Technology Stack | `workExperienceTechStackIds` | `candidateTechStack` | `techStacks[].label` |

Item heading in UI: `{employerName} - {jobTitle}` (fallback `N/A` when job title null).

When backend `matchedWorkExperiences` is present and work-experience driver filters
are active, the frontend will prefer the backend payload and skip the legacy mock
path (empty `workExperiences` on list items).

List filtering for the four drivers is **already wired** in
`src/components/candidates-page-client.tsx` → `fetchCandidatesPage`.

---

## 8. Prompt to forward

> We have an existing paged endpoint `GET /api/candidates` returning
> `PagedResult<CandidateListItemDto>`. It already supports Work Experience row
> filtering on `candidate_work_experiences` (`shiftTypes`, `workModes`,
> `timeSupportZoneIds`, `workExperienceTechStackIds`). That filtering works
> correctly. **Do not change the existing query-param contract or filtering behavior.**
>
> **Task (additive only):** Add a new field `matchedWorkExperiences` to each item in
> the candidates list response so the frontend can show which work experiences caused
> the match in the Cards View "Work Experience" summary (mirroring the existing
> `matchedProjects` and `matchedEmployers` patterns).
>
> **Shape (per candidate list item):**
> ```jsonc
> "matchedWorkExperiences": [
>   {
>     "workExperienceId": 5501,
>     "employerId": 42,
>     "employerName": "Acme Corp",
>     "jobTitle": "Staff Engineer",
>     "startDate": "2022-06-01",
>     "endDate": null,
>     "shiftType": { "id": 0, "label": "Day" },
>     "workMode": { "id": 1, "label": "Remote" },
>     "timeSupportZones": [{ "id": 1, "label": "PST" }],
>     "techStacks": [{ "id": 12, "label": "React" }]
>   }
> ]
> ```
>
> **Semantics:**
> 1. **Drivers:** compute when any of `shiftTypes`, `workModes`, `timeSupportZoneIds`,
>    `workExperienceTechStackIds` is active. Otherwise `"matchedWorkExperiences": []`
>    (never null). Do **not** use employer or project filter params as drivers.
> 2. **Matched-only:** include a work experience only if it matched ≥1 active driver,
>    using the same rules as the list filter. **One entry per work experience** (not
>    deduped by employer). Exclude deleted employers.
> 3. **Per-field intersection:** each field holds only values intersecting the
>    **requested** filter for that field. When a sub-filter is inactive, use `[]` or
>    `null` as documented. `shiftType` and `workMode` are nullable scalars (one enum
>    per WE row).
> 4. **Enum objects:** `{ id, label }` where `id` is the same integer as the query-param
>    enum value; `label` is server-normalized display text (or `enum.ToString()`).
> 5. **`techStacks`** = work experience stacks only (`candidate_work_experience_tech_stacks`),
>    not project `techStackIds`.
> 6. Same `workExperienceId` may appear in both `matchedEmployers` and
>    `matchedWorkExperiences` when both filter groups are active — do not merge.
> 7. Dedupe by `id` within arrays; stable ascending order by `id`; items ordered by
>    `workExperienceId`. Additive and backwards-compatible.
> 8. Implement efficiently — no N+1, no full WE graphs.
>
> **Reference docs in repo:** `docs/CandidateFilterIntegration copy 6.md` (work
> experience filter params), `docs/matched_employers_backend_prompt.md` and
> `docs/matched_projects_backend_prompt.md` (parallel patterns).
>
> **When finished, report:** JSON property names + casing; confirmation that enum `id`
> values match query-param ints; sample response; updated OpenAPI schema; integration
> doc section added.
>
> **Important:** Do NOT make assumptions. If anything is ambiguous — JSON casing,
> enum int mapping, join table shapes, or how to avoid N+1 — STOP and ask clarifying
> questions before implementing.
