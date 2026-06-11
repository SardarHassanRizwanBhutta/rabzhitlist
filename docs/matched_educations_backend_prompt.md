# Backend Task: `matchedEducations` on the Candidates List Response

## 1. Goal

Add **`matchedEducations`** to each `CandidateListItemDto` on `GET /api/candidates` so the
Cards/Table match summary can show which **education rows** caused the list match when
Education Background filters (or the URL **`universityId`** chip) are active — mirroring
`matchedProjects`, `matchedEmployers`, and `matchedWorkExperiences`.

---

## 2. UI contract (Cards View)

- **Category:** `Education Background` (green, graduation cap).
- **One item per matching education row** — heading = **university name** (`universityName`).
- **Badges** (only for active driver filters with non-empty intersection on that row):
  - `university` — when `universityId` filter active and row matched by university
  - `degree` — when `degreeIds` active and row has matched degree
  - `major` — when `majorIds` active and row has matched major
  - `isTopper` — when `isTopper=true` filter active and row is topper (**only when filter is true**)
  - `isCheetah` — when `isMainCheetah=true` filter active and row is main cheetah (**only when filter is true**)
  - `endMonth` — when graduate date range filter active and row's `endMonth` satisfied filter
  - `grades` — include row **`grades`** string as a display badge whenever non-null/non-empty on a matched row (not a list filter today; contextual display)

---

## 3. Payload shape

```jsonc
"matchedEducations": [
  {
    "educationId": 901,
    "universityId": 42,
    "universityName": "MIT",
    "matchedByUniversityId": true,
    "degree": { "id": 3, "label": "Bachelor's" },
    "major": { "id": 12, "label": "Computer Science" },
    "endMonth": "2020-06-01",
    "grades": "3.8 GPA",
    "isTopper": true,
    "isMainCheetah": null
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `educationId` | `number` | Stable id of `candidate_educations`; **one entry per matching education row**. |
| `universityId` | `number` | Linked university id. |
| `universityName` | `string` | University display name (Cards heading). |
| `matchedByUniversityId` | `boolean` | `true` when **`universityId`** query filter active and this row's university matched. |
| `degree` | `{ id, label } \| null` | Intersection with requested **`degreeIds`** filter; `null` when sub-filter not applied or no match on this field. |
| `major` | `{ id, label } \| null` | Intersection with requested **`majorIds`** filter. |
| `endMonth` | `string \| null` (ISO DateOnly) | Row graduation month when **graduate date range** filter satisfied on this row; else `null`. |
| `grades` | `string \| null` | Row grades for UI display when present; not filter-driven (no grades query param today). |
| `isTopper` | `boolean \| null` | `true` when **`isTopper=true`** filter active and row matched via topper; else `null`. Do not set when filter inactive. |
| `isMainCheetah` | `boolean \| null` | `true` when **`isMainCheetah=true`** filter active and row matched via cheetah; else `null`. |

---

## 4. When to compute

Compute when **any** of these query filters is active:

- `universityId`
- `degreeIds`
- `majorIds`
- `isTopper` (has value)
- `isMainCheetah` (has value)
- `graduateDateStart` and/or `graduateDateEnd`

Otherwise → `matchedEducations: []` (never `null`).

Semantics:

- **Matched-only:** include a row only if it matched ≥1 **active** driver filter (OR across drivers).
- **One entry per education row** — not deduped by university.
- Each field holds only intersection / applicable value for active filters; inactive sub-filters → `null` or omitted per field rules above.
- Items ordered by `educationId` ascending.

---

## 5. Sample

```
GET /api/candidates?degreeIds=3&majorIds=12&isTopper=true&graduateDateStart=2018-01-01
```

```json
{
  "matchedEducations": [
    {
      "educationId": 901,
      "universityId": 42,
      "universityName": "MIT",
      "matchedByUniversityId": false,
      "degree": { "id": 3, "label": "Bachelor's" },
      "major": { "id": 12, "label": "Computer Science" },
      "endMonth": "2020-06-01",
      "grades": "3.8 GPA",
      "isTopper": true,
      "isMainCheetah": null
    }
  ]
}
```

URL university chip:

```
GET /api/candidates?universityId=42
```

```json
{
  "matchedEducations": [
    {
      "educationId": 901,
      "universityId": 42,
      "universityName": "MIT",
      "matchedByUniversityId": true,
      "degree": null,
      "major": null,
      "endMonth": null,
      "grades": "3.8 GPA",
      "isTopper": null,
      "isMainCheetah": null
    }
  ]
}
```

---

## 6. Frontend mapping (after backend ships)

| Layer | File |
|-------|------|
| Type | `MatchedEducationDto` + `Candidate.matchedEducations` in `candidate.ts` |
| Mapper | `mapMatchedEducations()` in `candidates-api.ts` |
| Match summary | `hasBackendMatchedEducationFilterDrivers()`, `appendBackendMatchedEducationItems()` in `candidate-matches.ts` |
| URL university | `universities: string[]` on `CandidateFilters` + merge from URL chip in `candidates-page-client.tsx` |

List filtering for education drivers is **already wired** in `candidates-page-client.tsx` → `fetchCandidatesPage`.
