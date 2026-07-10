# University Data Progress — Frontend Integration Guide

**Status:** Not implemented — contract for implementation.  
**Audience:** Frontend / Next.js AI agent.  
**Product spec:** [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Backend contract:** [`UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md`](./UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Reference pattern:** [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md)

---

## 1. Summary

| What | Detail |
|------|--------|
| **Phase 1** | Per-university completion % on list + min/max filters; breakdown API available |
| **Phase 1 UI** | **Universities table column** + **`universities-filter-dialog.tsx`** only |
| **Deferred UI** | Data Progress panel in `UniversityDetailsModal` — **do not build** until requested |
| **Phase 2** | Dashboard `universities` module — [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md) |
| **Scoring** | **Backend only** — never compute campus algorithm or weights on the client |
| **Parallel work** | Certifications Phase 1 in [`certification_data_progress_frontend_integration.md`](./certification_data_progress_frontend_integration.md) |

---

## 2. APIs to integrate

Base URL: `NEXT_PUBLIC_API_URL` (local: `http://localhost:5103`).

### 2.1 List universities (extended)

```http
GET /api/universities?minDataProgressPercentage={0-100}&maxDataProgressPercentage={0-100}&pageNumber=1&pageSize=10
```

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | number | Inclusive 0–100 |
| `maxDataProgressPercentage` | number | Inclusive 0–100; must be ≥ min |

**400** when out of range or min > max.

Each item includes **`dataProgressPercentage`**:

```json
{
  "items": [
    {
      "id": 42,
      "name": "MIT",
      "country": { "id": 1, "name": "United States" },
      "ranking": "Tier 1",
      "dataProgressPercentage": 70.0,
      "websiteUrl": "https://mit.edu",
      "linkedInUrl": "https://linkedin.com/school/mit",
      "locations": []
    }
  ],
  "totalCount": 55,
  "pageNumber": 1,
  "pageSize": 10
}
```

### 2.2 University data progress breakdown (new)

```http
GET /api/universities/{universityId}/data-progress
```

| Status | Meaning |
|--------|---------|
| **200** | Breakdown JSON |
| **404** | University not found or soft-deleted |

```json
{
  "universityId": 42,
  "overallPercentage": 70.0,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 50.0,
      "maxScore": 55,
      "percentage": 90.9,
      "missingFields": ["Ranking"]
    },
    {
      "sectionKey": "campusLocations",
      "sectionName": "Campus Locations",
      "score": 20.0,
      "maxScore": 45,
      "percentage": 44.4,
      "missingFields": ["Main Campus", "Address"]
    }
  ]
}
```

Wire `fetchUniversityDataProgress` now; detail modal panel is deferred.

### 2.3 Create / update (unchanged routes)

`POST /api/universities`, `PUT /api/universities/{id}`, location CRUD — response includes updated **`dataProgressPercentage`** after backend recalc.

---

## 3. TypeScript types

Create `src/lib/types/university-data-progress.ts`:

```typescript
export type UniversityDataProgressSectionKey =
  | "basicInformation"
  | "campusLocations"

export interface UniversityDataProgressSection {
  sectionKey: UniversityDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface UniversityDataProgressResponse {
  universityId: number
  overallPercentage: number
  sections: UniversityDataProgressSection[]
}

export const UNIVERSITY_DATA_PROGRESS_SECTION_ORDER: UniversityDataProgressSectionKey[] = [
  "basicInformation",
  "campusLocations",
]
```

Extend `University` / list item in `src/lib/types/university.ts`:

```typescript
dataProgressPercentage: number
```

Extend `UniversityFilters` in `universities-filter-dialog.tsx`:

```typescript
minDataProgressPercentage?: number
maxDataProgressPercentage?: number
```

---

## 4. Service layer

Update `src/lib/services/universities-api.ts`:

- Map **`dataProgressPercentage`** on list/detail DTOs
- Pass `minDataProgressPercentage` / `maxDataProgressPercentage` in `fetchUniversitiesFiltered`
- Add `fetchUniversityDataProgress(universityId)`

---

## 5. UI integration (Phase 1)

### 5.1 Universities table — Data Progress column

| Rule | Detail |
|------|--------|
| Source | `university.dataProgressPercentage` from list API |
| Display | Pill/badge — reuse `project-data-progress.ts` / candidate tier helpers |
| Format | One decimal, e.g. `70.0%` |
| Responsive | Show on `lg+` (match projects table) |
| Sort | Client-side sort on column |

**Do not** call `/data-progress` per row.

### 5.2 Universities filter dialog

Add min/max **Data progress %** (0–100) to `UniversitiesFilterDialog`:

- Bind to filter state on `universities-page-client.tsx`
- Validate min ≤ max
- Pass through to `fetchUniversitiesFiltered`

### 5.3 Deferred — UniversityDetailsModal

**Do not** add a Data Progress breakdown panel in Phase 1.

---

## 6. Dashboard (Phase 2)

No dashboard code changes expected when backend sets `summary.modules[universities].available = true`.

Verify per [`university_data_progress_frontend_integration_phase2.md`](./university_data_progress_frontend_integration_phase2.md) (create with certifications Phase 2 doc).

---

## 7. Anti-patterns

| Anti-pattern | Why |
|--------------|-----|
| Client-side campus best-row algorithm | Backend owns scoring |
| Hardcode `universities.available = false` on dashboard | Blocks Phase 2 |
| Fetch breakdown for every table row | Use list `dataProgressPercentage` |

---

## 8. Checklist

- [ ] Types + API mapping + `fetchUniversityDataProgress`
- [ ] `universities-table.tsx` — Data Progress column
- [ ] `universities-filter-dialog.tsx` — min/max %
- [ ] `University` type includes `dataProgressPercentage`
- [ ] No detail modal panel
- [ ] `tsc` + `npm run build` pass

---

## 9. Agent prompt (frontend Phase 1)

```
Implement University Data Progress Phase 1 per docs/university_data_progress_frontend_integration.md
and docs/UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

Add dataProgressPercentage to universities list/detail types and universities-api.ts with
minDataProgressPercentage/maxDataProgressPercentage filters. Add Data Progress column to
universities-table.tsx (pill, 1 decimal, lg+, client sort). Add min/max filters to
universities-filter-dialog.tsx. Wire fetchUniversityDataProgress for future detail UI.

Do NOT add UniversityDetailsModal progress panel. Do NOT compute scores on the client.
Mirror projects-table and projects-filter-dialog patterns.
```
