# Backend Task: `matchedProjects` on the Candidates List Response

This document is a ready-to-forward brief + prompt for the backend AI agent. It
explains the goal, the existing contract that must not change, the new response
structure, and the exact semantics. Hand the **"Prompt to forward"** section to
the backend agent verbatim.

> **REVISION (label format):** The first version of this brief asked for domain
> **names** (enum `.ToString()`). That has been changed: the frontend renders domain
> badges from a **hardcoded `id → human label` map** whose labels differ from the
> enum names (e.g. enum `Crm` vs UI `CRM (Customer Relationship Management)`, enum
> `FinancialServices` vs UI `Financial Services`). To keep badges identical to the
> filter dropdowns, **each matched domain must be returned as a `{ id, label }`
> object that includes the integer enum `id`.** See Sections 3–7.

---

## 1. Background / Why

The candidates **Cards View** shows a per-candidate **"Project Expertise"** match
summary: for each project that matched the active Project Expertise filters, the
UI renders the **project name as a heading** with the matched values as **badges**
beneath it (e.g. matched Vertical/Horizontal Domains).

The backend already filters the candidate list correctly by domains, but the list
response carries **no per-candidate project/domain data**, so the frontend cannot
show *which* projects/domains caused the match. We need the backend to return the
**matched values, grouped by project**, so the UI can rebuild those project-grouped
badges.

This is intentionally a **lean "matched values only"** payload (not full project
graphs), but **grouped per project** so it maps 1:1 onto the UI's per-project match
item and can be extended to other Project Expertise filters later **without another
contract change**.

**Why IDs are required (not just names):** the frontend resolves each domain to its
own human-readable label via a hardcoded `id → label` map (the same map that powers
the filter dropdowns). The enum `.ToString()` name does **not** match those labels
for multi-word domains. So each matched domain must carry the **integer enum `id`**;
the frontend maps that `id` to its display label. A `label` (the enum name) is also
included as a fallback/debug aid.

---

## 2. Existing contract — DO NOT CHANGE

- **Endpoint:** `GET /api/candidates` (paged list). Response: `PagedResult<CandidateListItemDto>`.
- **Filtering already works** and must remain unchanged, including the domain filters,
  which are sent as **repeated integer** query params:

  ```
  GET /api/candidates?verticalDomains=3&verticalDomains=7&horizontalDomains=2&pageNumber=1&pageSize=20
  ```

- Keep all existing list-item fields exactly as they are. The change below is **purely
  additive**.

---

## 3. What to add — `matchedProjects`

Add a new field to each candidate **list item**:

```jsonc
"matchedProjects": [
  {
    "projectId": 42,
    "projectName": "Acme Payments Platform",

    // Populated in THIS phase. Each entry is { id, label }:
    //   id    = the integer enum value (REQUIRED — frontend maps this to its label)
    //   label = the enum name via .ToString() (fallback/debug; frontend prefers id)
    "verticalDomains": [{ "id": 3, "label": "Healthcare" }],
    "horizontalDomains": [{ "id": 0, "label": "Crm" }]

    // RESERVED for future phases — include the keys ONLY if/when you implement them.
    // Do not populate them in this phase. Documented here so the shape is stable.
    // Same { id, label } object shape for consistency:
    // "techStacks": [{ "id": 12, "label": "React" }],
    // "technicalDomains": [{ "id": 4, "label": "Backend" }],
    // "technicalAspects": [{ "id": 7, "label": "Scalability" }],
    // "status": "Completed",       // scalar enum name (no id needed) — TBD next phase
    // "projectType": "Web",        // scalar enum name (no id needed) — TBD next phase
    // "matchedByName": true        // true only when the Project Name filter caused the match
  }
]
```

### Field meaning

| Field               | Type                          | Required this phase | Notes |
|---------------------|-------------------------------|---------------------|-------|
| `projectId`         | number                        | Yes                 | Stable id of the candidate's project. Used by the UI to key/dedupe and (future) to open the project. |
| `projectName`       | string                        | Yes                 | Display name; this is the **heading** shown for each project block in the UI. |
| `verticalDomains`   | `{ id: number, label: string }[]` | Yes             | Project's vertical domains that **intersect** the requested `verticalDomains` filter. `id` = integer enum value (required); `label` = enum name. |
| `horizontalDomains` | `{ id: number, label: string }[]` | Yes             | Project's horizontal domains that **intersect** the requested `horizontalDomains` filter. `id` = integer enum value (required); `label` = enum name. |
| (reserved fields)   | —                             | No                  | Do **not** populate this phase. Listed only to lock the shape for later. |

---

## 4. Semantics (read carefully)

1. **Matched-only scope.** A project appears in `matchedProjects` **only if it matched
   at least one active Project Expertise filter**. In this phase the only active
   drivers are the Vertical and Horizontal Domain filters, so a project is included
   only if it has at least one vertical domain in the requested `verticalDomains` set
   **or** at least one horizontal domain in the requested `horizontalDomains` set.

2. **No domain filter applied → `matchedProjects: []`** (empty array, never `null`).
   Do not return the candidate's projects when no relevant filter is active.

3. **Each array holds only the intersection** of the project's domains with the
   **requested filter values** — not the project's entire domain list. If the
   `horizontalDomains` filter is not applied, `horizontalDomains` on each item should
   be `[]` (only `verticalDomains` would be populated), and vice versa.

4. **Return the integer enum `id` (REQUIRED) plus the enum-name `label`.** Each matched
   domain is a `{ id, label }` object. `id` is the same integer used by the
   `verticalDomains` / `horizontalDomains` query-param filter (the enum's underlying
   int). `label` is `enum.ToString()`. The frontend maps `id` → its own display label;
   `label` is a fallback only.

5. **Distinct + stable order.** Dedupe by `id` within each array. Return them in a
   deterministic order (e.g. ascending by `id`, or alphabetical by `label`) so the UI
   is stable across requests.

6. **Projects source.** Consider the candidate's projects from **both**
   work-experience-linked projects (`candidate_work_experience_projects`) **and**
   standalone projects (`candidate_projects`). If the same project can appear via
   multiple paths, **dedupe by `projectId`** so each project appears at most once in
   `matchedProjects`. Respect `Project.DeletedAt == null` (same as the existing filters).

7. **Additive & backwards-compatible.** Existing consumers ignoring the new field must
   be unaffected.

8. **Performance.** Compute this as part of the existing filtered list query. **Avoid
   N+1 queries** — batch/join the needed domain ids+names in the same query or a single
   batched lookup. The list endpoint must stay fast and must **not** start returning
   full project objects — only the matched arrays described above.

---

## 5. Example

**Request:**

```
GET /api/candidates?verticalDomains=3&verticalDomains=7&horizontalDomains=0&pageNumber=1&pageSize=20
```

**Response (one list item, abbreviated):**

```jsonc
{
  "id": 123,
  "name": "Jane Doe",
  "latestJobTitle": "Senior Backend Engineer",
  "totalExperienceYears": 6,
  "...": "...all other existing list fields unchanged...",
  "matchedProjects": [
    {
      "projectId": 42,
      "projectName": "Acme Payments Platform",
      "verticalDomains": [{ "id": 3, "label": "Healthcare" }],
      "horizontalDomains": [{ "id": 0, "label": "Crm" }]
    },
    {
      "projectId": 88,
      "projectName": "FactoryOps",
      "verticalDomains": [{ "id": 7, "label": "Manufacturing" }],
      "horizontalDomains": []
    }
  ]
}
```

A candidate that matched via the list-level filter but has no overlapping domains on
any single project (edge case) should return `"matchedProjects": []`.

---

## 6. Deliverables / confirm back

When done, please report:

1. The exact **JSON property names + casing** you used (we requested camelCase:
   `matchedProjects`, `projectId`, `projectName`, `verticalDomains`,
   `horizontalDomains`, and nested `id` / `label`).
2. Confirmation that each domain object includes the **integer enum `id`** and that the
   `id` is the **same integer** accepted by the `verticalDomains` / `horizontalDomains`
   query-param filters (so the frontend's `id → label` map lines up). State which
   enum/type the `id` and `label` come from.
3. Updated **OpenAPI/Swagger** (or API docs) for the list item including
   `matchedProjects` and its nested `{ id, label }` shape.

---

## 7. Prompt to forward (verbatim)

> We have an existing paged endpoint `GET /api/candidates` returning
> `PagedResult<CandidateListItemDto>`. It already supports filtering by project
> domains via repeated integer query params
> (`?verticalDomains=3&verticalDomains=7&horizontalDomains=2`), and that filtering
> works correctly. **Do not change the existing query-param contract or filtering
> behavior.**
>
> **Task (additive only):** Add a new field `matchedProjects` to each item in the
> candidates list response so the frontend can show which projects/domains caused the
> match.
>
> **IMPORTANT — return IDs, not just names.** A previous version of this request asked
> for domain names; that is now changed. The frontend renders domain badges from its
> own hardcoded `id → label` map, and those labels differ from the enum names (e.g.
> enum `Crm` vs UI `CRM (Customer Relationship Management)`; enum `FinancialServices`
> vs UI `Financial Services`). So each matched domain must be returned as a
> `{ id, label }` object where `id` is the integer enum value (the SAME integer used by
> the `verticalDomains`/`horizontalDomains` query-param filter) and `label` is
> `enum.ToString()`.
>
> **Shape (per candidate list item):**
> ```jsonc
> "matchedProjects": [
>   {
>     "projectId": 42,
>     "projectName": "Acme Payments Platform",
>     "verticalDomains": [{ "id": 3, "label": "Healthcare" }],
>     "horizontalDomains": [{ "id": 0, "label": "Crm" }]
>   }
> ]
> ```
> Reserve (but DO NOT populate in this phase) these future keys so the shape stays
> stable, using the same `{ id, label }` object shape for the array ones: `techStacks`,
> `technicalDomains`, `technicalAspects` (arrays of `{ id, label }`); and `status`,
> `projectType`, `matchedByName` (scalars, TBD next phase).
>
> **Semantics:**
> 1. Matched-only scope: include a project ONLY if it matched at least one active
>    Project Expertise filter. In this phase the drivers are the Vertical and
>    Horizontal Domain filters — include a project only if it has ≥1 vertical domain in
>    the requested `verticalDomains` set OR ≥1 horizontal domain in the requested
>    `horizontalDomains` set.
> 2. If no relevant filter is applied, return `"matchedProjects": []` (never null).
> 3. Each array contains ONLY the intersection of the project's domains with the
>    REQUESTED filter values (not the project's full domain list). If a sub-filter isn't
>    applied, its array is `[]`.
> 4. Each matched domain is `{ id, label }`: `id` = integer enum value (REQUIRED, same
>    int as the query-param filter), `label` = `enum.ToString()`.
> 5. Dedupe by `id` within each array; return in a stable, deterministic order
>    (ascending by `id` or alphabetical by `label`).
> 6. Consider both work-experience-linked projects and standalone projects, respect
>    `Project.DeletedAt == null`, and dedupe by `projectId` so each project appears at
>    most once.
> 7. Additive and backwards-compatible; keep all existing list fields unchanged.
> 8. Implement efficiently within the existing filtered query — avoid N+1, do not return
>    full project objects, keep the list endpoint fast.
>
> **When finished, report:** the exact JSON property names + casing; confirmation that
> each domain object carries the integer enum `id` matching the query-param filter ints
> (and which enum/type `id`+`label` come from); and the updated OpenAPI/Swagger schema
> for the list item.
>
> **Important:** Do NOT make assumptions. If anything is ambiguous — JSON casing
> conventions in this codebase, which enum/type the domain `id`+`label` come from,
> whether the domain enum int matches the query-param filter int, how projects are
> linked to candidates, the most efficient way to avoid N+1, or how to handle edge
> cases — STOP and ask clarifying questions before implementing.
