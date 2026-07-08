# Project Data Progress — Frontend Integration Guide

**Status:** Backend Phase 1 **implemented** (2026-07).  
**Audience:** Frontend / Next.js AI agent.  
**Product spec:** [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Backend contract:** [`PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md`](./PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Reference pattern:** Candidates table + `dataProgressPercentage` (mirror styling and API usage)

---

## 1. Summary

| What | Detail |
|------|--------|
| **Phase 1** | Per-project completion % on list + min/max filters; breakdown API available |
| **Phase 1 UI** | **Projects table column** + **filter dialog** only |
| **Deferred UI** | Data Progress panel inside `ProjectDetailDialog` — **do not build** until requested |
| **Phase 2** | Dashboard `projects` module — see [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md) (backend first; frontend verify only) |
| **Scoring** | **Backend only** — never compute weights or % on the client |

After create/update, backend recalculates and persists `dataProgressPercentage` automatically. List responses include the stored value.

---

## 2. APIs to integrate

Base URL: your existing `API_BASE_URL` / `NEXT_PUBLIC_API_URL` (local dev: `http://localhost:5103`).

### 2.1 List projects (extended)

```http
GET /api/projects?minDataProgressPercentage={0-100}&maxDataProgressPercentage={0-100}&pageNumber=1&pageSize=10
```

All existing query params still work. New optional filters:

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | number | Inclusive 0–100 |
| `maxDataProgressPercentage` | number | Inclusive 0–100; must be ≥ min |

**400** (plain text message body) when out of range or min > max — same pattern as candidates list filter.

**Response:** existing paged shape; each item in `items` now includes `dataProgressPercentage`:

```json
{
  "items": [
    {
      "id": 12,
      "name": "Payments API",
      "employerId": 3,
      "employerName": "Acme Corp",
      "dataProgressPercentage": 67.5,
      "type": "employer",
      "status": "maintenance",
      "techStacks": ["PostgreSQL", "React"],
      "aspectTypeLabels": ["Backend"],
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-07-07T14:00:00Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 231,
  "totalPages": 24,
  "hasPrevious": false,
  "hasNext": true
}
```

Use **`dataProgressPercentage`** from list for the table column (stored value, fast). Do not call the breakdown endpoint per row.

### 2.2 Project data progress breakdown (new)

```http
GET /api/projects/{projectId}/data-progress
```

| Status | Meaning |
|--------|---------|
| **200** | Breakdown JSON (live calculation) |
| **404** | Project not found or soft-deleted |

**200 example:**

```json
{
  "projectId": 12,
  "overallPercentage": 67.5,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 20.5,
      "maxScore": 26,
      "percentage": 78.8,
      "missingFields": ["Employer", "Max Team Size"]
    },
    {
      "sectionKey": "projectDates",
      "sectionName": "Project Dates",
      "score": 2.5,
      "maxScore": 5,
      "percentage": 50.0,
      "missingFields": ["End Date"]
    },
    {
      "sectionKey": "technicalAspectsAndTechStacks",
      "sectionName": "Technical Aspects & Tech Stacks",
      "score": 0,
      "maxScore": 20,
      "percentage": 0,
      "missingFields": ["Technical Aspects & Tech Stacks"]
    },
    {
      "sectionKey": "domains",
      "sectionName": "Domains",
      "score": 20,
      "maxScore": 30,
      "percentage": 66.7,
      "missingFields": ["Technical Domains"]
    },
    {
      "sectionKey": "descriptionAndLinks",
      "sectionName": "Description & Links",
      "score": 16,
      "maxScore": 19,
      "percentage": 84.2,
      "missingFields": ["Download Count"]
    }
  ]
}
```

**Note:** Breakdown is computed live on each request (same pattern as `GET /api/candidates/{id}/data-progress`). List column uses stored `dataProgressPercentage`; they should match after mutations.

### 2.3 Create / update (unchanged routes, new field on response)

```http
POST /api/projects
PUT /api/projects/{id}
```

Response body includes updated **`dataProgressPercentage`** after backend recalc. No extra client call needed after save.

### 2.4 Admin backfill (ops only — not for UI)

```http
POST /api/admin/projects/recalculate-data-progress
```

Response: `{ "projectsProcessed": 231 }`. Run once after deploy/migration to populate existing rows. Not called from the Next.js app.

---

## 3. TypeScript types

Create `src/lib/types/project-data-progress.ts`:

```typescript
export type ProjectDataProgressSectionKey =
  | "basicInformation"
  | "projectDates"
  | "technicalAspectsAndTechStacks"
  | "domains"
  | "descriptionAndLinks"

export interface ProjectDataProgressSection {
  sectionKey: ProjectDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface ProjectDataProgressResponse {
  projectId: number
  overallPercentage: number
  sections: ProjectDataProgressSection[]
}
```

Extend your existing **project list item** type (wherever `ProjectDto` is mapped):

```typescript
export interface ProjectListItem {
  id: number
  name: string
  // ...existing fields...
  dataProgressPercentage: number
}
```

Extend **projects filter** state / API params:

```typescript
export interface ProjectListFilters {
  // ...existing...
  minDataProgressPercentage?: number
  maxDataProgressPercentage?: number
}
```

---

## 4. Service layer

Update `src/lib/services/projects-api.ts` (or equivalent):

### 4.1 List — map field + pass filters

```typescript
export async function fetchProjects(filters: ProjectListFilters): Promise<PagedProjects> {
  const params = new URLSearchParams()
  // ...existing params...
  if (filters.minDataProgressPercentage != null) {
    params.set("minDataProgressPercentage", String(filters.minDataProgressPercentage))
  }
  if (filters.maxDataProgressPercentage != null) {
    params.set("maxDataProgressPercentage", String(filters.maxDataProgressPercentage))
  }
  const res = await fetch(`${API_BASE_URL}/api/projects?${params}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

Ensure JSON mapping preserves **`dataProgressPercentage`** (camelCase from API).

### 4.2 Breakdown (wire now; UI can use later)

```typescript
export async function fetchProjectDataProgress(
  projectId: number
): Promise<ProjectDataProgressResponse> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/data-progress`)
  if (res.status === 404) throw new ProjectNotFoundError()
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

---

## 5. UI integration (Phase 1)

### 5.1 Projects table — Data Progress column

| Rule | Detail |
|------|--------|
| Source | `item.dataProgressPercentage` from list API |
| Display | Pill/badge — **reuse candidate tier styling** (`src/lib/utils/data-progress.ts` or shared helper) |
| Format | One decimal, e.g. `67.5%` |
| Sort | Client-side only unless backend adds sort later; no new sort param in Phase 1 |

**Do not** fetch `/data-progress` for every row in the table.

### 5.2 Projects filter dialog

Add min/max **Data progress %** inputs (0–100):

- Bind to `minDataProgressPercentage` / `maxDataProgressPercentage`
- Validate on client: min ≤ max, both in 0–100 (optional but improves UX)
- Pass through to `fetchProjects` on apply
- Clear filters should omit params (not send `0` unless intentional)

Mirror **`projects-filter-dialog.tsx`** / candidates filter UX if it exists.

### 5.3 Project detail dialog — **deferred**

Per locked requirements: **do not** add a Data Progress accordion/panel in `ProjectDetailDialog` in Phase 1. The breakdown API is ready for a future pass.

### 5.4 Dashboard (Phase 2)

**Handoff:** [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md)

No dashboard code changes until backend sets `summary.modules[projects].available = true`. Then verify Projects card + detail KPIs/chart on `/`.

---

## 6. Display helpers

Create `src/lib/utils/project-data-progress.ts` (or extend candidate helpers):

```typescript
/** Reuse candidate tier colors/thresholds if product agrees; otherwise mirror the same bands. */
export function formatProjectDataProgress(value: number): string {
  return `${value.toFixed(1)}%`
}
```

**Do not** implement scoring, section weights, or `missingFields` derivation on the client — only display API values.

---

## 7. Section keys ↔ form accordions

When you eventually build the detail panel, map sections to `ProjectCreationDialog` accordions:

| `sectionKey` | Form accordion |
|--------------|----------------|
| `basicInformation` | Basic Information |
| `projectDates` | Project Dates |
| `technicalAspectsAndTechStacks` | Technical Aspects & Tech Stacks |
| `domains` | Domains |
| `descriptionAndLinks` | Description & Links |

`missingFields` strings match product labels exactly (e.g. `"Employer"`, `"Download Count"`) — safe to show as bullet list.

---

## 8. Behaviour notes for UX

1. **Recalc timing:** Saving a project (POST/PUT) updates `%` on the response; refresh list or use returned value after create/edit flows.
2. **List vs breakdown:** Table uses stored column; breakdown endpoint is for detail/analytics views only.
3. **Technical 20% rule:** UI cannot infer this — if breakdown shows `Technical Aspects & Tech Stacks` missing, user needs both tech stacks and aspect type labels (from stacks).
4. **Download count:** `0` does not earn the 1% weight — breakdown will list `"Download Count"` until > 0.
5. **Empty strings:** Non-null empty string counts as “filled” for backend scoring; rare in practice.

---

## 9. Implementation checklist

| # | Task | File(s) |
|---|------|---------|
| 1 | Add TypeScript types | `src/lib/types/project-data-progress.ts` |
| 2 | Extend project list type with `dataProgressPercentage` | `src/lib/types/project.ts` (or equivalent) |
| 3 | Pass min/max filter query params | `src/lib/services/projects-api.ts` |
| 4 | Add `fetchProjectDataProgress` (for future detail UI) | `src/lib/services/projects-api.ts` |
| 5 | Data Progress column in table | `src/components/projects-table.tsx` |
| 6 | Min/max % in filter dialog | `src/components/projects-filter-dialog.tsx` |
| 7 | Tier/badge helper | `src/lib/utils/project-data-progress.ts` |
| 8 | **Skip** detail dialog panel | — |
| 9 | **Skip** dashboard projects progress | — |

---

## 10. Smoke tests (manual)

1. **List:** `GET /api/projects?pageNumber=1&pageSize=5` → each item has `dataProgressPercentage`.
2. **Filter:** `GET /api/projects?minDataProgressPercentage=50&maxDataProgressPercentage=100` → only projects ≥ 50%.
3. **Invalid filter:** min > max → **400** with message text.
4. **Breakdown:** `GET /api/projects/{id}/data-progress` → 5 sections, `overallPercentage` 0–100.
5. **After edit:** PUT project, add employer → response `dataProgressPercentage` increases; list matches.
6. **Dashboard:** unchanged — projects card still `0%` avg (Phase 2).

---

## 11. Related documents

| Document | Purpose |
|----------|---------|
| [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Weights, section rules, phasing |
| [`PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md`](./PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend implementation details |
| [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md) | Candidate reference (if present in repo) |
| [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md) | Dashboard projects module Phase 2 |
| [`DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md) | Dashboard candidates implementation |

---

## 12. Agent prompt (frontend)

```
Wire Project Data Progress Phase 1 per docs/project_data_progress_frontend_integration.md
and docs/PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

- Show dataProgressPercentage on projects table (badge/pill, mirror candidates).
- Add minDataProgressPercentage / maxDataProgressPercentage to projects filter + projects-api.
- Add fetchProjectDataProgress and types; do NOT build ProjectDetailDialog progress panel yet.
- Do NOT change dashboard projects module (Phase 2).
- Do NOT compute progress on the client.
```
