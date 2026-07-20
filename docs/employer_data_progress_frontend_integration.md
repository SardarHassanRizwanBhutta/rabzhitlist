# Employer Data Progress — Frontend Integration Guide (Phase 1)

**Status:** Backend Phase 1 **implemented** (2026-07).  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Employers table column + min/max filters only.

**Product spec:** [`EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Backend contract:** [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Reference pattern:** [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) / universities Phase 1

---

## 1. Summary

| What | Detail |
|------|--------|
| **Phase 1 UI** | **Employers table column** + **filter dialog** only |
| **Deferred UI** | Data Progress panel in employer detail modal — **do not build** yet |
| **Phase 2** | Dashboard `employers` module — still `available: false`; out of scope |
| **Scoring** | **Backend only** — never compute weights or `%` on the client |
| **List source** | `dataProgressPercentage` from `GET /api/employers` (stored value) |

After create/update (and location/layoff mutations), backend recalculates and persists `%` automatically. Refresh the list (or invalidate query) after those saves.

Base URL: `API_BASE_URL` / `NEXT_PUBLIC_API_URL` (local: `http://localhost:5103`).

---

## 2. Backend change summary (what frontend consumes)

| Change | Detail |
|--------|--------|
| Stored columns | `employers.data_progress_percentage`, `data_progress_updated_at` |
| List field | `dataProgressPercentage` on each list item |
| List filters | `minDataProgressPercentage`, `maxDataProgressPercentage` (0–100 inclusive) |
| Breakdown | `GET /api/employers/{id}/data-progress` — 5 sections + `missingFields` |
| Admin backfill | `POST /api/admin/employers/recalculate-data-progress` (ops only) |
| Dashboard | Unchanged — `summary.modules[employers].available === false` |

### Recalc triggers (important for UX refresh)

| Mutation | Recalc? |
|----------|---------|
| `POST` / `PUT` `/api/employers` | Yes |
| `DELETE` `/api/employers/{id}` | No (hard delete — row gone) |
| Statuses / types / time zones / benefits via employer PUT | Yes |
| **`POST` / `PUT` / `DELETE` `/api/employers/{id}/locations/...`** | **Yes — separate routes** |
| **`POST` / `PUT` / `DELETE` `/api/employers/{id}/layoffs/...`** | **Yes — separate routes** |

**Note:** `PUT /api/employers/{id}` does **not** update locations or layoffs. Location/layoff changes go through nested controllers only. After those saves, **refresh the employers list** so `dataProgressPercentage` updates.

---

## 3. APIs to integrate

### 3.1 List — `GET /api/employers`

Existing query params unchanged. **New optional filters:**

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | number | Inclusive 0–100 |
| `maxDataProgressPercentage` | number | Inclusive 0–100; must be ≥ min |

**400** (plain text) when out of range or min > max.

**Response:** each item in `items` includes `dataProgressPercentage`:

```json
{
  "items": [
    {
      "id": 12,
      "name": "Acme Corp",
      "websiteUrl": "https://acme.example",
      "linkedInUrl": "https://linkedin.com/company/acme",
      "status": "Open",
      "foundedYear": 2015,
      "ranking": "Tier 1",
      "employerType": "Product Based",
      "workMode": "Hybrid",
      "shiftType": "Day",
      "salaryPolicy": "Gross Salary",
      "headcount": 200,
      "locations": [],
      "benefits": ["Health Insurance"],
      "timeSupportZones": ["PKT"],
      "isDPLCompetitive": true,
      "dataProgressPercentage": 67.5
    }
  ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 164,
  "totalPages": 17,
  "hasPrevious": false,
  "hasNext": true
}
```

Use **`dataProgressPercentage`** for the table column. Do **not** call the breakdown endpoint per row.

### 3.2 Breakdown — `GET /api/employers/{employerId}/data-progress`

| Status | Meaning |
|--------|---------|
| **200** | Live calculation breakdown |
| **404** | Employer not found / unavailable |

```json
{
  "employerId": 12,
  "overallPercentage": 67.5,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 20.0,
      "maxScore": 22.5,
      "percentage": 88.9,
      "missingFields": ["DPL Competitive"]
    },
    {
      "sectionKey": "workArrangements",
      "sectionName": "Work Arrangements",
      "score": 15.0,
      "maxScore": 17.5,
      "percentage": 85.7,
      "missingFields": ["Work Mode"]
    },
    {
      "sectionKey": "benefitsAndSalaryPolicy",
      "sectionName": "Benefits & Salary Policy",
      "score": 20.0,
      "maxScore": 40,
      "percentage": 50.0,
      "missingFields": ["Benefits"]
    },
    {
      "sectionKey": "officeLocations",
      "sectionName": "Office Locations",
      "score": 7.5,
      "maxScore": 10,
      "percentage": 75.0,
      "missingFields": ["Headquarters"]
    },
    {
      "sectionKey": "layoffs",
      "sectionName": "Layoffs",
      "score": 0,
      "maxScore": 10,
      "percentage": 0,
      "missingFields": ["Date", "No. of Affected Employees", "Reason"]
    }
  ]
}
```

### 3.3 Admin backfill (ops — not for UI)

```http
POST /api/admin/employers/recalculate-data-progress
```

Response: `{ "employersProcessed": 164 }`.

---

## 4. TypeScript types

Create `src/lib/types/employer-data-progress.ts`:

```typescript
export type EmployerDataProgressSectionKey =
  | "basicInformation"
  | "workArrangements"
  | "benefitsAndSalaryPolicy"
  | "officeLocations"
  | "layoffs"

export interface EmployerDataProgressSection {
  sectionKey: EmployerDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface EmployerDataProgressResponse {
  employerId: number
  overallPercentage: number
  sections: EmployerDataProgressSection[]
}
```

Extend employer list item:

```typescript
export interface EmployerListItem {
  id: number
  name: string
  // ...existing fields...
  dataProgressPercentage: number
}
```

Extend filter state / API params:

```typescript
export interface EmployerListFilters {
  // ...existing...
  minDataProgressPercentage?: number
  maxDataProgressPercentage?: number
}
```

---

## 5. Service layer

Update `src/lib/services/employers-api.ts` (or equivalent):

```typescript
export async function fetchEmployers(filters: EmployerListFilters): Promise<PagedEmployers> {
  const params = new URLSearchParams()
  // ...existing params...
  if (filters.minDataProgressPercentage != null) {
    params.set("minDataProgressPercentage", String(filters.minDataProgressPercentage))
  }
  if (filters.maxDataProgressPercentage != null) {
    params.set("maxDataProgressPercentage", String(filters.maxDataProgressPercentage))
  }
  const res = await fetch(`${API_BASE_URL}/api/employers?${params}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchEmployerDataProgress(
  employerId: number
): Promise<EmployerDataProgressResponse> {
  const res = await fetch(`${API_BASE_URL}/api/employers/${employerId}/data-progress`)
  if (res.status === 404) throw new EmployerNotFoundError()
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
```

Preserve camelCase `dataProgressPercentage` from JSON.

---

## 6. UI integration (Phase 1)

### 6.1 Employers table — Data Progress column

| Rule | Detail |
|------|--------|
| Source | `item.dataProgressPercentage` from list API |
| Display | Pill/badge — **reuse** shared `data-progress` tier styling (candidates/projects) |
| Format | One decimal, e.g. `67.5%` |
| Per-row breakdown | **Do not** call `/data-progress` for each row |

**File:** `src/components/employers-table.tsx` (or equivalent)

### 6.2 Employers filter dialog

Add min/max **Data progress %** inputs (0–100):

- Bind to `minDataProgressPercentage` / `maxDataProgressPercentage`
- Client validate: min ≤ max, both in 0–100 (optional UX)
- Clear filters → omit params

Mirror projects/candidates filter UX.

### 6.3 Detail modal — **deferred**

Do **not** add a Data Progress panel in the employer detail UI in Phase 1. Breakdown API is ready for a future pass.

### 6.4 Dashboard — **no changes**

`GET /api/dashboard/data-progress` still returns `employers` with `available: false` and `avgDataProgress: 0`.

---

## 7. Section keys ↔ form accordions (future detail UI)

| `sectionKey` | Form accordion | Max % |
|--------------|----------------|-------|
| `basicInformation` | Basic Information | 22.5 |
| `workArrangements` | Work Arrangements | 17.5 |
| `benefitsAndSalaryPolicy` | Benefits & Salary Policy | 40 |
| `officeLocations` | Office Locations | 10 |
| `layoffs` | Layoffs | 10 |

`missingFields` labels match product copy exactly (e.g. `"DPL Competitive"`, `"No. of Affected Employees"`, `"LinkedIn URL"`).

---

## 8. Behaviour notes for UX

1. **Recalc timing:** After employer create/update, list `%` updates when you refresh/refetch.
2. **Locations & layoffs:** Saving nested location/layoff APIs changes `%` even if you never hit employer PUT — **invalidate/refetch employers list** after those mutations.
3. **DPL Competitive:** Only `true` earns weight; `false` shows as missing in breakdown.
4. **Office Country:** Linked country is required on location rows; UI still shows Country in `missingFields` only when there are **zero** locations.
5. **Layoffs:** Affected employee count must be **> 0** to earn that field; zero does not count.
6. **List vs breakdown:** Table uses stored column; breakdown is live (for future detail view).
7. Invalid filter (min > max) → **400** with message text.

---

## 9. Implementation checklist

| # | Task | File(s) |
|---|------|---------|
| 1 | Types | `src/lib/types/employer-data-progress.ts` |
| 2 | Extend list type with `dataProgressPercentage` | employer types |
| 3 | Pass min/max filter query params | `src/lib/services/employers-api.ts` |
| 4 | `fetchEmployerDataProgress` | `src/lib/services/employers-api.ts` |
| 5 | Data Progress column | `src/components/employers-table.tsx` |
| 6 | Min/max % in filter dialog | employers filter component |
| 7 | Refetch list after location/layoff saves | location/layoff mutation flows |
| 8 | Reuse shared tier/format helpers | `src/lib/utils/data-progress.ts` |
| 9 | **Skip** detail modal progress panel | — |
| 10 | **Skip** dashboard employers progress | — |

---

## 10. Smoke tests (manual)

1. **List:** `GET /api/employers?pageNumber=1&pageSize=5` → each item has `dataProgressPercentage`.
2. **Filter:** `GET /api/employers?minDataProgressPercentage=50&maxDataProgressPercentage=100` → filtered results.
3. **Invalid filter:** min > max → **400**.
4. **Breakdown:** `GET /api/employers/{id}/data-progress` → 5 sections, `overallPercentage` 0–100.
5. **After edit:** PUT employer (e.g. set DPL competitive) → list `%` increases on refresh.
6. **Location:** POST location under employer → list `%` updates on refresh.
7. **Layoff:** POST layoff → list `%` updates on refresh.
8. **Dashboard:** `module=employers` still `available: false`, `avgDataProgress: 0`.

---

## 11. Related documents

| Document | Purpose |
|----------|---------|
| [`EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Weights & office/layoff algorithms |
| [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend contract |
| [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) | Reference pattern |
| [`university_certification_data_progress_frontend_integration.md`](./university_certification_data_progress_frontend_integration.md) | Parallel modules Pattern |

---

## 12. Agent prompt (frontend)

```
Wire Employer Data Progress Phase 1 per
docs/employer_data_progress_frontend_integration.md and
docs/EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

- Show dataProgressPercentage on employers table (badge/pill, mirror candidates/projects).
- Add minDataProgressPercentage / maxDataProgressPercentage to employers filter + employers-api.
- Add fetchEmployerDataProgress and types; do NOT build employer detail progress panel yet.
- After location or layoff create/update/delete, refetch employers list (those routes are
  separate from PUT /api/employers/{id} and also update %).
- Do NOT change dashboard employers module (Phase 2 — available still false).
- Do NOT compute progress on the client.

Run smoke tests in §10 when done.
```
