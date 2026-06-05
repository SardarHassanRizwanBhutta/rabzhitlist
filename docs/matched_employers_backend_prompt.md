# Backend Task: `matchedEmployers` on the Candidates List Response

This document is a ready-to-forward brief + prompt for the backend AI agent. It
explains the goal, the existing contract that must not change, the new response
structure, and the exact semantics. Hand the **"Prompt to forward"** section to
the backend agent verbatim.

---

## 1. Background / Why

The candidates **Cards View** (and Table match summary) shows a per-candidate
**"Employer Experience"** match category when Employer Characteristics filters are
active. For each qualifying work experience, the UI renders the **employer name as a
heading** with **job title / dates as context** and matched values as **badges**
(e.g. Employer Status, Country, Company Size).

The backend already filters the candidate list correctly via work-experience → employer
joins (see `docs/CandidateFilterIntegration copy 4.md`, Employer filters section), but
the list response carries **no per-candidate employer match data**. The list mapper sets
`workExperiences: []`, so the frontend cannot show *which* employers / work experiences
caused the match.

We need the backend to return **matched values, grouped by work experience**, mirroring
the existing `matchedProjects` pattern so the UI can rebuild the purple **Employer
Experience** blocks without loading full candidate graphs on the list endpoint.

This is intentionally a **lean "matched values only"** payload (not full employer
objects), grouped per **work experience** so repeated stints at the same company remain
distinct when job title or dates differ.

**Why IDs are required (not just labels):** the frontend renders enum badges from
hardcoded `id → display label` maps (the same maps that power the filter dropdowns).
Those display labels differ from raw C# enum names (e.g. ranking tiers). Each matched
enum value must carry the **integer enum `id`** (the same integer sent in query params)
plus a human-readable `label` as fallback.

---

## 2. Existing contract — DO NOT CHANGE

- **Endpoint:** `GET /api/candidates` (paged list). Response: `PagedResult<CandidateListItemDto>`.
- **Employer filtering already works** and must remain unchanged. Active query params
  (repeated where array):

  ```
  GET /api/candidates
    ?employerIds=12&employerIds=34
    &employerStatuses=0&employerStatuses=1
    &employerTypes=2
    &employerCountries=840&employerCountries=826
    &employerCity=San
    &employerSalaryPolicies=1
    &employerRankings=0
    &employerSizeMin=50&employerSizeMax=500
    &pageNumber=1&pageSize=20
  ```

  Semantics are documented in `docs/CandidateFilterIntegration copy 4.md` (Employer
  filters table). **Do not change** param names, types, or filter behavior.

- Keep all existing list-item fields exactly as they are. The change below is **purely
  additive**.

---

## 3. What to add — `matchedEmployers`

Add a new field to each candidate **list item**:

```jsonc
"matchedEmployers": [
  {
    // Identity / display (always present on each item)
    "workExperienceId": 901,
    "employerId": 42,
    "employerName": "Acme Corp",
    "jobTitle": "Senior Software Engineer",
    "startDate": "2021-03-01",   // ISO DateOnly; null if unknown
    "endDate": null,               // null = current role

    // Populated ONLY when the corresponding filter is active AND this work experience
    // matched via that filter. See §4.

    // true when `employerIds` filter is active and this WE's employer id is in the set
    "matchedByEmployerId": true,

    // Intersection with requested `employerStatuses` filter (employer may have many)
    "statuses": [{ "id": 0, "label": "Active" }],

    // Intersection with requested `employerCountries` filter (from employer locations)
    "countries": [{ "id": 840, "label": "United States" }],

    // Location cities that satisfied `employerCity` substring filter (plain strings)
    "cities": ["San Francisco"],

    // Intersection with requested `employerTypes` filter
    "employerTypes": [{ "id": 1, "label": "Product Based" }],

    // Employer's salary policy when `employerSalaryPolicies` filter matched
    "salaryPolicy": { "id": 1, "label": "Above Market" },

    // Employer's ranking when `employerRankings` filter matched
    "ranking": { "id": 0, "label": "Tier 1" },

    // Employer's headcount range when `employerSizeMin` / `employerSizeMax` filter matched
    "size": { "minEmployees": 200, "maxEmployees": 500 }
  }
]
```

### Field meaning

| Field | Type | Required on item | Notes |
|-------|------|------------------|-------|
| `workExperienceId` | `long` | Yes | Stable id of `CandidateWorkExperience`. Used to key/dedupe items. |
| `employerId` | `long` | Yes | Linked employer id (`Employer.Id`, non-deleted). |
| `employerName` | `string` | Yes | Display name; **heading** for each block in the UI. |
| `jobTitle` | `string \| null` | Yes | From the work experience row (context subtitle). |
| `startDate` | `string \| null` | Yes | ISO `DateOnly` from work experience. |
| `endDate` | `string \| null` | Yes | ISO `DateOnly`; `null` = currently working at this employer. |
| `matchedByEmployerId` | `boolean` | Yes | `true` only when `employerIds` filter is active **and** this WE's employer id is in the requested set. Otherwise `false`. |
| `statuses` | `{ id: number, label: string }[]` | Yes (may be `[]`) | Intersection of employer statuses with requested `employerStatuses`. |
| `countries` | `{ id: number, label: string }[]` | Yes (may be `[]`) | Intersection of location country ids with requested `employerCountries`. `id` = same catalog id as query param. |
| `cities` | `string[]` | Yes (may be `[]`) | Cities from employer locations that matched `employerCity` substring filter. |
| `employerTypes` | `{ id: number, label: string }[]` | Yes (may be `[]`) | Intersection with requested `employerTypes`. |
| `salaryPolicy` | `{ id: number, label: string } \| null` | Yes | Non-null only when `employerSalaryPolicies` filter active and employer policy matched. |
| `ranking` | `{ id: number, label: string } \| null` | Yes | Non-null only when `employerRankings` filter active and employer ranking matched. |
| `size` | `{ minEmployees?: number, maxEmployees?: number } \| null` | Yes | Non-null only when size filter(s) active and employer size satisfied the filter (see §4.5). |

Reuse the same `{ id, label }` object shape as `matchedProjects[].verticalDomains`.

For enum-backed fields, `id` must be the **same integer** used by the corresponding
query-param filter (`EmployerStatus`, `EmployerType`, `SalaryPolicy`, `Ranking` enums).
`label` should be the **server-normalized display string** (same style as
`EmployerListItemDto`), with `enum.ToString()` acceptable as fallback.

---

## 4. Semantics (read carefully)

### 4.1 When to compute `matchedEmployers`

Compute `matchedEmployers` when **any** of these query filters is active:

| Driver filter | Query param |
|---------------|-------------|
| Specific employers | `employerIds` |
| Employer status | `employerStatuses` |
| Employer type | `employerTypes` |
| Employer country | `employerCountries` |
| Employer city | `employerCity` |
| Salary policy | `employerSalaryPolicies` |
| Ranking | `employerRankings` |
| Company size (min) | `employerSizeMin` |
| Company size (max) | `employerSizeMax` |

If **none** of the above is active → `"matchedEmployers": []` (empty array, **never**
`null`).

**Not drivers** (do not trigger population alone):

- `isCurrentlyWorking` — Work Experience filter; list filtering may already restrict
  candidates, but this param alone must not populate `matchedEmployers`.
- Job title, years of experience, work mode, shift type, time support zone filters on
  work experience — out of scope for this payload.

### 4.2 Matched-only scope (work experience inclusion)

Include a work experience in `matchedEmployers` **only if** it matched **at least one
active driver** above (OR across drivers), using the **same logic as the existing list
filter** for that field.

Requirements:

- Join through `CandidateWorkExperiences → Employer` with `Employer.DeletedAt == null`
  (consistent with list filtering).
- **One array entry per work experience** (not deduped by `employerId`). A candidate
  with two stints at the same company produces two items when both match.
- When the list is filtered to currently-working candidates (`isCurrentlyWorking` or
  equivalent backend flag), only work experiences that pass that filter should appear
  in `matchedEmployers` (if the backend applies that constraint on the list query, reuse
  the same rule here).

### 4.3 Per-field intersection

Each field holds **only** values that intersect the **active filter** for that field —
not the employer's full attribute set.

| Field | When filter inactive |
|-------|----------------------|
| `matchedByEmployerId` | `false` |
| `statuses` | `[]` |
| `countries` | `[]` |
| `cities` | `[]` |
| `employerTypes` | `[]` |
| `salaryPolicy` | `null` |
| `ranking` | `null` |
| `size` | `null` |

Example: request has `employerStatuses=0` only → item may have non-empty `statuses` but
`countries`, `cities`, `employerTypes`, etc. remain empty/null even if the employer has
those attributes.

### 4.4 Multi-value employer attributes

- **Statuses:** employer can have multiple statuses (`employer_employer_statuses`). Return
  only statuses in the requested `employerStatuses` set.
- **Types:** employer can have multiple types. Return only types in the requested
  `employerTypes` set.
- **Countries:** from employer locations; return only country ids in the requested
  `employerCountries` set.
- **Cities:** when `employerCity` is active, include each distinct location city string
  that satisfies the same case-insensitive substring rule as the list filter.

Dedupe by `id` within each `{ id, label }[]` array; use stable ascending order by `id`.

### 4.5 Company size alignment

When `employerSizeMin` and/or `employerSizeMax` is active and the employer satisfies the
**same size logic as the list filter**:

```
employerSizeMin: (MaxEmployees ?? MinEmployees ?? 0) >= min
employerSizeMax: (MinEmployees ?? MaxEmployees ?? 0) <= max
```

Populate `size` with the employer's actual `{ minEmployees, maxEmployees }` values (either
may be null if unknown — frontend formats the badge). Do **not** return the filter bounds.

### 4.6 Performance

- Implement within the existing filtered query; avoid N+1 per candidate.
- Do not return full employer graphs, location lists, or work-experience collections.
- Keep payload lean: matched scalars/arrays only.

### 4.7 Backwards compatibility

- Additive field on `CandidateListItemDto`; omit or return `[]` for clients that ignore it.
- JSON property name: **`matchedEmployers`** (camelCase).

---

## 5. Sample response

Request:

```
GET /api/candidates?employerStatuses=0&employerCountries=840&employerCity=Francisco&pageSize=10
```

Fragment:

```json
{
  "items": [
    {
      "id": 1001,
      "name": "Jane Doe",
      "matchedEmployers": [
        {
          "workExperienceId": 5501,
          "employerId": 42,
          "employerName": "Acme Corp",
          "jobTitle": "Staff Engineer",
          "startDate": "2022-06-01",
          "endDate": null,
          "matchedByEmployerId": false,
          "statuses": [{ "id": 0, "label": "Active" }],
          "countries": [{ "id": 840, "label": "United States" }],
          "cities": ["San Francisco"],
          "employerTypes": [],
          "salaryPolicy": null,
          "ranking": null,
          "size": null
        }
      ]
    }
  ]
}
```

Request with no employer driver filters → every item has `"matchedEmployers": []`.

---

## 6. Confirm-back checklist

When finished, report:

1. JSON property name: **`matchedEmployers`** (camelCase array).
2. Trigger set matches §4.1 exactly.
3. Each enum `{ id, label }` uses the **same integer** as the query-param filter.
4. One entry per matching work experience; not deduped by employer.
5. Empty array (never null) when no driver filters active.
6. Sample response with at least one non-empty `matchedEmployers` item.
7. Updated OpenAPI/Swagger schema for `CandidateListItemDto`.

---

## 7. Frontend mapping (planned — not yet implemented)

After backend ships, the frontend will wire:

| Layer | File | Planned behavior |
|-------|------|------------------|
| Type | `src/lib/types/candidate.ts` | `MatchedEmployerDto` + `Candidate.matchedEmployers` |
| Mapper | `src/lib/services/candidates-api.ts` | `mapMatchedEmployers()` in list DTO → `Candidate` |
| Match summary | `src/lib/utils/candidate-matches.ts` | `appendBackendMatchedEmployerItems()` — category `employers`, label **Employer Experience**, purple / 🏢 |
| Cards colors | `src/components/candidates-cards-view.tsx` | Reuse existing criterion types: `employer`, `employerStatus`, `country`, `city`, `employerType`, `salaryPolicy`, `size`, `ranking` |

Badge mapping (active filter → criterion):

| Active filter | Badge type | Display source |
|---------------|--------------|----------------|
| `employerIds` | `employer` | `employerName` |
| `employerStatuses` | `employerStatus` | Map `statuses[].id` → `EMPLOYER_STATUS_LABELS` |
| `employerCountries` | `country` | Map `countries[].id` → country name (or use `label`) |
| `employerCity` | `city` | `cities[]` strings |
| `employerTypes` | `employerType` | Map `employerTypes[].id` → `EMPLOYER_TYPE_LABELS` |
| `employerSalaryPolicies` | `salaryPolicy` | Map `salaryPolicy.id` → `SALARY_POLICY_LABELS` |
| `employerRankings` | `ranking` | Map `ranking.id` → `EMPLOYER_RANKING_LABELS` |
| `employerSizeMin` / `Max` | `size` | Format `size` as `"200-500 employees"` |

When backend `matchedEmployers` is present and employer driver filters are active, the
frontend will prefer the backend payload and skip the legacy mock path
(`sampleEmployers` / empty `workExperiences`).

---

## 8. Prompt to forward

> We have an existing paged endpoint `GET /api/candidates` returning
> `PagedResult<CandidateListItemDto>`. It already supports Employer Characteristics
> filtering via work-experience → employer joins (`employerIds`, `employerStatuses`,
> `employerTypes`, `employerCountries`, `employerCity`, `employerSalaryPolicies`,
> `employerRankings`, `employerSizeMin`, `employerSizeMax`). That filtering works
> correctly. **Do not change the existing query-param contract or filtering behavior.**
>
> **Task (additive only):** Add a new field `matchedEmployers` to each item in the
> candidates list response so the frontend can show which work experiences / employers
> caused the match in the Cards View "Employer Experience" summary (mirroring the
> existing `matchedProjects` pattern).
>
> **Shape (per candidate list item):**
> ```jsonc
> "matchedEmployers": [
>   {
>     "workExperienceId": 901,
>     "employerId": 42,
>     "employerName": "Acme Corp",
>     "jobTitle": "Senior Software Engineer",
>     "startDate": "2021-03-01",
>     "endDate": null,
>     "matchedByEmployerId": true,
>     "statuses": [{ "id": 0, "label": "Active" }],
>     "countries": [{ "id": 840, "label": "United States" }],
>     "cities": ["San Francisco"],
>     "employerTypes": [{ "id": 1, "label": "Product Based" }],
>     "salaryPolicy": { "id": 1, "label": "Above Market" },
>     "ranking": { "id": 0, "label": "Tier 1" },
>     "size": { "minEmployees": 200, "maxEmployees": 500 }
>   }
> ]
> ```
>
> **Semantics:**
> 1. **Drivers:** compute when any of `employerIds`, `employerStatuses`, `employerTypes`,
>    `employerCountries`, `employerCity`, `employerSalaryPolicies`, `employerRankings`,
>    `employerSizeMin`, `employerSizeMax` is active. Otherwise `"matchedEmployers": []`
>    (never null).
> 2. **Matched-only:** include a work experience only if it matched ≥1 active driver,
>    using the same rules as the list filter. Join `CandidateWorkExperiences → Employer`,
>    exclude deleted employers. **One entry per work experience** (not deduped by employer).
> 3. **Per-field intersection:** each array/scalar holds only values intersecting the
>    **requested** filter for that field. When a sub-filter is inactive, use `[]`, `null`,
>    or `matchedByEmployerId: false` as documented.
> 4. **Enum objects:** `{ id, label }` where `id` is the same integer as the query-param
>    filter enum value; `label` is server-normalized display text (or `enum.ToString()`).
> 5. **Cities:** plain strings for locations matching `employerCity` substring rule.
> 6. **Size:** when size filter matched, return employer's actual min/max employees
>    (same satisfaction logic as list filter), not the filter bounds.
> 7. Dedupe by `id` within arrays; stable ascending order. Additive and backwards-compatible.
> 8. Implement efficiently — no N+1, no full employer graphs.
>
> **Reference docs in repo:** `docs/CandidateFilterIntegration copy 4.md` (employer filter
> params), `docs/matched_projects_backend_prompt.md` (parallel pattern for projects).
>
> **When finished, report:** JSON property names + casing; confirmation that enum `id`
> values match query-param ints; sample response; updated OpenAPI schema.
>
> **Important:** Do NOT make assumptions. If anything is ambiguous — JSON casing,
> enum int mapping, multi-status/type join tables, size overlap logic, or how to avoid
> N+1 — STOP and ask clarifying questions before implementing.
