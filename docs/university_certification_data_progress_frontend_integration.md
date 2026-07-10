# University & Certification Data Progress — Frontend Integration Guide (Phase 1)

**Status:** Backend Phase 1 **implemented** (2026-07).  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Entity list tables + filters only — **both modules in parallel**.

**Product specs:**

- [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)
- [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)

**Backend contracts:**

- [`UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md`](./UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md)
- [`CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md`](./CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md)

**Reference pattern:** Candidates / Projects Phase 1 — [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md)

---

## 1. Summary

| Module | Phase 1 UI | Breakdown API | Dashboard (Phase 2) |
|--------|------------|---------------|---------------------|
| **Universities** | Table column + min/max filters | `GET /api/universities/{id}/data-progress` | `available: false` — no dashboard work |
| **Certifications** | Table column + min/max filters | `GET /api/certifications/{id}/data-progress` | `available: false` — no dashboard work |

| Rule | Detail |
|------|--------|
| **Scoring** | **Backend only** — never compute weights or `%` on the client |
| **List column source** | `dataProgressPercentage` from list API (stored value) |
| **Breakdown** | Wire types + `fetch*` now; **do not** call per table row |
| **Deferred UI** | Data Progress panel in `UniversityDetailsModal` / certification detail modal |
| **Recalc** | Automatic on create/update/delete; universities also recalc on **campus location** mutations |

Base URL: `API_BASE_URL` / `NEXT_PUBLIC_API_URL` (local: `http://localhost:5103`).

---

## 2. Shared integration pattern (mirror projects)

Both modules follow the same frontend pattern already used for candidates and projects:

1. Extend list item type with `dataProgressPercentage: number`
2. Add optional `minDataProgressPercentage` / `maxDataProgressPercentage` to filter state + API query params
3. Add **Data Progress** table column (pill/badge via shared tier helper)
4. Add `fetchUniversityDataProgress` / `fetchCertificationDataProgress` + types (for future detail panels)
5. **Do not** add dashboard changes in Phase 1

### Filter validation (client — optional UX)

| Rule | Backend returns **400** if violated |
|------|-------------------------------------|
| Min/max in 0–100 | Yes |
| `max >= min` when both set | Yes |
| Clear filters | Omit params (don't send `0` unless intentional) |

---

## 3. Universities

### 3.1 List — `GET /api/universities`

Existing query params unchanged. **New optional filters:**

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | number | Inclusive 0–100 |
| `maxDataProgressPercentage` | number | Inclusive 0–100; must be ≥ min |

**Response:** each item in `items` includes `dataProgressPercentage`:

```json
{
  "items": [
    {
      "id": 42,
      "name": "MIT",
      "websiteUrl": "https://mit.edu",
      "linkedInUrl": "https://linkedin.com/school/mit",
      "country": { "id": 1, "name": "United States" },
      "ranking": "Tier 1",
      "locations": [
        {
          "id": 10,
          "universityId": 42,
          "city": "Cambridge",
          "address": "77 Massachusetts Ave",
          "isMainCampus": true,
          "createdAt": "2026-01-01T00:00:00Z"
        }
      ],
      "dataProgressPercentage": 70.0
    }
  ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 55,
  "totalPages": 6,
  "hasPrevious": false,
  "hasNext": true
}
```

### 3.2 Breakdown — `GET /api/universities/{universityId}/data-progress`

| Status | Meaning |
|--------|---------|
| **200** | Live calculation breakdown |
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

**Scoring sections (for future detail UI only):**

| `sectionKey` | Form accordion | Max % |
|--------------|----------------|-------|
| `basicInformation` | Basic Information | 55 |
| `campusLocations` | Campus Locations | 45 |

**Campus `missingFields` labels:** `City`, `Main Campus`, `Address` (form label “Office location” → `Address`).

### 3.3 University recalc triggers (why list `%` changes)

Backend recalculates after:

- `POST` / `PUT` / `DELETE` `/api/universities/{id}`
- `POST` / `PUT` / `DELETE` `/api/universities/{universityId}/locations` (+ `/{locationId}`)

After saving a university or campus, **refresh the list** (or invalidate query) so `dataProgressPercentage` updates.

### 3.4 Admin backfill (ops — not for UI)

```http
POST /api/admin/universities/recalculate-data-progress
```

Response: `{ "universitiesProcessed": 55 }`. Run once after migration/deploy.

---

## 4. Certifications

### 4.1 List — `GET /api/certifications`

**New optional filters:** same `minDataProgressPercentage` / `maxDataProgressPercentage` as universities.

```json
{
  "items": [
    {
      "id": 55,
      "name": "AWS Solutions Architect – Associate",
      "issuer": {
        "id": 3,
        "name": "Amazon Web Services",
        "websiteUrl": "https://aws.amazon.com"
      },
      "dataProgressPercentage": 100.0
    }
  ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 79,
  "totalPages": 8,
  "hasPrevious": false,
  "hasNext": true
}
```

### 4.2 Breakdown — `GET /api/certifications/{certificationId}/data-progress`

| Status | Meaning |
|--------|---------|
| **200** | Live calculation breakdown |
| **404** | Certification not found or soft-deleted |

```json
{
  "certificationId": 55,
  "overallPercentage": 50.0,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 50.0,
      "maxScore": 100,
      "percentage": 50.0,
      "missingFields": ["Issuing Body"]
    }
  ]
}
```

**Scoring (for future detail UI):**

| Field | Weight | Earned when |
|-------|--------|-------------|
| Name | 50% | non-null, non-empty trim |
| Issuing Body | 50% | `issuer` linked (`issuer_id` set) — name alone is **not** enough |

### 4.3 Admin backfill (ops — not for UI)

```http
POST /api/admin/certifications/recalculate-data-progress
```

Response: `{ "certificationsProcessed": 79 }`.

---

## 5. TypeScript types

### 5.1 University — `src/lib/types/university-data-progress.ts`

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
```

Extend university list item:

```typescript
export interface UniversityListItem {
  id: number
  name: string
  // ...existing fields...
  dataProgressPercentage: number
}
```

Extend filter state:

```typescript
export interface UniversityListFilters {
  // ...existing...
  minDataProgressPercentage?: number
  maxDataProgressPercentage?: number
}
```

### 5.2 Certification — `src/lib/types/certification-data-progress.ts`

```typescript
export type CertificationDataProgressSectionKey = "basicInformation"

export interface CertificationDataProgressSection {
  sectionKey: CertificationDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface CertificationDataProgressResponse {
  certificationId: number
  overallPercentage: number
  sections: CertificationDataProgressSection[]
}
```

Extend certification list item + filters similarly with `dataProgressPercentage`, `minDataProgressPercentage`, `maxDataProgressPercentage`.

---

## 6. Service layer

### 6.1 Universities — `src/lib/services/universities-api.ts`

```typescript
export async function fetchUniversities(filters: UniversityListFilters): Promise<PagedUniversities> {
  const params = new URLSearchParams()
  // ...existing params...
  if (filters.minDataProgressPercentage != null) {
    params.set("minDataProgressPercentage", String(filters.minDataProgressPercentage))
  }
  if (filters.maxDataProgressPercentage != null) {
    params.set("maxDataProgressPercentage", String(filters.maxDataProgressPercentage))
  }
  const res = await fetch(`${API_BASE_URL}/api/universities?${params}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchUniversityDataProgress(
  universityId: number
): Promise<UniversityDataProgressResponse> {
  const res = await fetch(`${API_BASE_URL}/api/universities/${universityId}/data-progress`)
  if (res.status === 404) throw new UniversityNotFoundError()
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

Ensure JSON mapping preserves **`dataProgressPercentage`** (camelCase).

### 6.2 Certifications — `src/lib/services/certifications-api.ts`

Same pattern:

```typescript
// minDataProgressPercentage / maxDataProgressPercentage on list fetch
export async function fetchCertificationDataProgress(
  certificationId: number
): Promise<CertificationDataProgressResponse> { /* ... */ }
```

---

## 7. UI integration (Phase 1)

### 7.1 Universities table

| Rule | Detail |
|------|--------|
| Source | `item.dataProgressPercentage` from list API |
| Display | Pill/badge — **reuse** `src/lib/utils/data-progress.ts` (or shared helper with candidates/projects) |
| Format | One decimal, e.g. `70.0%` |
| Per-row breakdown | **Do not** call `/data-progress` for each row |

**File:** `src/components/universities-table.tsx`

### 7.2 Universities filter

Add min/max **Data progress %** inputs (0–100) in `universities-filter-dialog.tsx` (or page filters).

Mirror projects/candidates filter UX.

### 7.3 Certifications table + filter

Same as universities:

| File | Action |
|------|--------|
| `src/components/certifications-table.tsx` | Data Progress column |
| Certifications filter UI | Min/max % filters |

### 7.4 Detail modals — **deferred**

| Surface | Phase 1 |
|---------|---------|
| `UniversityDetailsModal` progress panel | **Do not build** |
| Certification detail progress panel | **Do not build** |

Breakdown APIs are ready for a future pass.

### 7.5 Dashboard — **no changes (Phase 1)**

```http
GET /api/dashboard/data-progress
```

- `summary.modules[universities].available` → **`false`**, `avgDataProgress: 0`
- `summary.modules[certifications].available` → **`false`**, `avgDataProgress: 0`

Dashboard enablement is **Backend Phase 2** — verify-only when that ships (see §11).

---

## 8. Display helpers

Prefer one shared formatter:

```typescript
export function formatDataProgressPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
```

Optional module-specific wrappers in `university-data-progress.ts` / `certification-data-progress.ts` that delegate to the shared helper.

**Do not** implement scoring, campus algorithm, or `missingFields` derivation on the client.

---

## 9. Behaviour notes for UX

### Universities

1. **Campus edits affect %** — adding/updating/deleting a location changes university progress; refresh list after location saves.
2. **Main Campus** — only earns 15% when `isMainCampus: true` on the scoring row (backend picks best row).
3. **Zero campuses** — campus section = 0%; `missingFields` = City, Main Campus, Address.
4. **List vs breakdown** — table uses stored column; breakdown is for future detail view.

### Certifications

1. **Issuer link required** — 50% for Issuing Body only when issuer is linked in API (`issuer` object present); free-text name without link does not earn weight.
2. **After create/update** — backend recalculates; refresh list after save flows.

### Both

1. Invalid filter (min > max) → **400** with plain-text message — surface in filter dialog if possible.
2. Empty `missingFields` array = section complete.

---

## 10. Implementation checklist

### Universities

| # | Task | File(s) |
|---|------|---------|
| U1 | Types | `src/lib/types/university-data-progress.ts` |
| U2 | Extend list type | `src/lib/types/university.ts` (or equivalent) |
| U3 | Filter params + list mapping | `src/lib/services/universities-api.ts` |
| U4 | `fetchUniversityDataProgress` | `src/lib/services/universities-api.ts` |
| U5 | Data Progress column | `src/components/universities-table.tsx` |
| U6 | Min/max % filters | `src/components/universities-filter-dialog.tsx` |
| U7 | **Skip** detail modal panel | — |

### Certifications

| # | Task | File(s) |
|---|------|---------|
| C1 | Types | `src/lib/types/certification-data-progress.ts` |
| C2 | Extend list type | `src/lib/types/certification.ts` (or equivalent) |
| C3 | Filter params + list mapping | `src/lib/services/certifications-api.ts` |
| C4 | `fetchCertificationDataProgress` | `src/lib/services/certifications-api.ts` |
| C5 | Data Progress column | `src/components/certifications-table.tsx` |
| C6 | Min/max % filters | Certifications filter component |
| C7 | **Skip** detail modal panel | — |

### Shared

| # | Task |
|---|------|
| S1 | Reuse tier/badge styling from candidates/projects |
| S2 | **Skip** dashboard universities/certifications (Phase 2) |

---

## 11. Dashboard Phase 2 (out of scope — pointer only)

When backend Phase 2 ships (both modules together):

- `summary.modules[universities].available = true`
- `summary.modules[certifications].available = true`
- Frontend: **verify only** on `/` — same pattern as [`project_data_progress_frontend_integration_phase2.md`](./project_data_progress_frontend_integration_phase2.md)
- **Employers** remain `available: false`

Do **not** implement dashboard Phase 2 in this pass.

---

## 12. Smoke tests (manual)

### Universities

1. `GET /api/universities?pageNumber=1&pageSize=5` → each item has `dataProgressPercentage`.
2. `GET /api/universities?minDataProgressPercentage=50&maxDataProgressPercentage=100` → filtered results.
3. `GET /api/universities/{id}/data-progress` → 2 sections (`basicInformation`, `campusLocations`).
4. Edit university (add website) → list `%` increases on refresh.
5. Add campus location → list `%` updates.

### Certifications

1. `GET /api/certifications?pageNumber=1&pageSize=5` → each item has `dataProgressPercentage`.
2. `GET /api/certifications?minDataProgressPercentage=50` → filtered results.
3. `GET /api/certifications/{id}/data-progress` → 1 section (`basicInformation`).
4. Link issuer on PUT → `%` increases to 100 when name + issuer both set.

### Dashboard (unchanged)

6. `GET /api/dashboard/data-progress?module=universities&...` → `available: false`, `avgDataProgress: 0`.
7. Same for `module=certifications`.

---

## 13. Related documents

| Document | Purpose |
|----------|---------|
| [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | University weights & campus rules |
| [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Certification weights |
| [`UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md`](./UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md) | University backend contract |
| [`CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md`](./CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md) | Certification backend contract |
| [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) | Reference implementation |
| [`project_data_progress_frontend_integration_phase2.md`](./project_data_progress_frontend_integration_phase2.md) | Dashboard verify pattern (future) |

---

## 14. Agent prompt (frontend)

```
Wire University & Certification Data Progress Phase 1 per
docs/university_certification_data_progress_frontend_integration.md,
docs/UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md, and
docs/CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

Universities:
- Show dataProgressPercentage on universities table (badge/pill, mirror candidates/projects).
- Add minDataProgressPercentage / maxDataProgressPercentage to universities filter + universities-api.
- Add fetchUniversityDataProgress and types; do NOT build UniversityDetailsModal progress panel yet.
- Refresh list after university or campus location mutations (progress may change).

Certifications:
- Show dataProgressPercentage on certifications table (badge/pill).
- Add min/max % filters to certifications filter + certifications-api.
- Add fetchCertificationDataProgress and types; do NOT build certification detail progress panel yet.

Shared:
- Do NOT compute progress on the client.
- Do NOT change dashboard (universities/certifications still available: false — Phase 2).
- Reuse shared data-progress tier/format helpers from candidates/projects.

Run smoke tests in §12 when done.
```
