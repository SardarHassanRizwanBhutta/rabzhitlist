# Employer Data Progress — Frontend Integration Guide (Phase 1)

**Status:** Backend Phase 1 **implemented** (2026-07). Frontend Phase 1 **implemented** (2026-07).  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Employers table column + min/max filters only.

**Product spec:** [`EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Backend contract:** [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Reference pattern:** [`university_certification_data_progress_frontend_integration.md`](./university_certification_data_progress_frontend_integration.md) / projects Phase 1  
**Phase 2 (later):** [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md) · [`employer_data_progress_frontend_integration_phase2.md`](./employer_data_progress_frontend_integration_phase2.md)

---

## 1. Summary

| What | Detail |
|------|--------|
| **Phase 1 UI** | **Employers table column** + **filter dialog** only |
| **Deferred UI** | Data Progress panel in employer detail modal — **do not build** yet |
| **Phase 2** | Dashboard `employers` module — still `available: false`; out of scope |
| **Scoring** | **Backend only** — never compute weights or `%` on the client |
| **List source** | `dataProgressPercentage` from `GET /api/employers` (stored value; **always a number**) |

After create/update (and location/layoff mutations), backend recalculates and persists `%` automatically. Refresh the list (or invalidate query) after those saves.

Base URL: `NEXT_PUBLIC_API_URL` (local: `http://localhost:5103`).

---

## 2. Backend change summary (what frontend consumes)

| Change | Detail |
|--------|--------|
| Stored columns | `employers.data_progress_percentage`, `data_progress_updated_at` |
| List field | `dataProgressPercentage` on each list item (**required `number`**, never null/omitted; often `0` before backfill) |
| List filters | `minDataProgressPercentage`, `maxDataProgressPercentage` (0–100 inclusive) |
| Breakdown | `GET /api/employers/{id}/data-progress` — 5 sections + `missingFields` |
| Admin backfill | `POST /api/admin/employers/recalculate-data-progress` (ops only — not for UI) |
| Dashboard | Unchanged — `summary.modules[employers].available === false` |

### Recalc triggers (important for UX refresh)

| Mutation | Recalc? |
|----------|---------|
| `POST` / `PUT` `/api/employers` | Yes |
| `DELETE` `/api/employers/{id}` | No (hard delete — row gone; still **refetch list** for UX) |
| Statuses / types / tags / time zones / benefits via employer PUT | Yes |
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

**Response:** each item in `items` includes `dataProgressPercentage` (always a number):

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
      "minEmployees": 50,
      "maxEmployees": 200,
      "locations": [],
      "tags": ["FinTech"],
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
| **404** | Employer unavailable for progress — id missing, soft-deleted (`deleted_at` set), or hard-deleted |

Treat **404** as “employer unavailable for progress,” not only “never existed.”

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
      "sectionKey": "workArrangementsAndTags",
      "sectionName": "Work Arrangements & Tags",
      "score": 15.0,
      "maxScore": 17.5,
      "percentage": 85.7,
      "missingFields": ["Tags"]
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
      "missingFields": ["Date", "No. of Affected Employees", "Reason", "Source"]
    }
  ]
}
```

Wire `fetchEmployerDataProgress` now; detail modal panel is deferred.

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
  | "workArrangementsAndTags"
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

export const EMPLOYER_DATA_PROGRESS_SECTION_ORDER: EmployerDataProgressSectionKey[] = [
  "basicInformation",
  "workArrangementsAndTags",
  "benefitsAndSalaryPolicy",
  "officeLocations",
  "layoffs",
]
```

Extend employer list/domain types with **required** progress:

```typescript
dataProgressPercentage: number
```

Do **not** use `number | null` or optional `?` for this field on list items.

**Filter dialog / page state** (match candidates, projects, universities, certifications):

```typescript
dataProgressMin: string  // "" = cleared
dataProgressMax: string
```

**API / `FetchEmployersParams`** (query string):

```typescript
minDataProgressPercentage?: number
maxDataProgressPercentage?: number
```

Page client parses non-empty strings → numbers and omits params when cleared.

---

## 5. Service layer

Update `src/lib/services/employers-api.ts`:

- Map **`dataProgressPercentage`** on list items (preserve camelCase; treat as required `number`)
- Pass `minDataProgressPercentage` / `maxDataProgressPercentage` when set
- Add `fetchEmployerDataProgress(employerId)` — surface **404** as employer unavailable for progress

Reuse `@/lib/utils/data-progress` for `formatDataProgressPercentage` + tier badge classes.

---

## 6. UI integration (Phase 1)

### 6.1 Employers table — Data Progress column

| Rule | Detail |
|------|--------|
| Source | `item.dataProgressPercentage` from list API |
| Display | Pill/badge via shared `data-progress` helpers |
| Format | One decimal, e.g. `67.5%` |
| Placement | Just **before Actions** |
| Responsive | Show on **`lg+`** (`hidden lg:table-cell`) |
| Sort | **Client-side** on column |
| Per-row breakdown | **Do not** call `/data-progress` for each row |

**File:** `src/components/employers-table.tsx`

### 6.2 Employers filter dialog

Add min/max **Data progress %** inputs (0–100):

- Bind to `dataProgressMin` / `dataProgressMax` (strings; same as universities/projects)
- Page client maps → `minDataProgressPercentage` / `maxDataProgressPercentage`
- Client validate: min ≤ max, both in 0–100 (optional UX; backend returns **400** plain text if violated)
- Clear filters → omit params

**File:** `src/components/employers-filter-dialog.tsx` (+ page client param mapping)

### 6.3 Detail modal — **deferred**

Do **not** add a Data Progress panel in the employer detail UI in Phase 1.

### 6.4 Dashboard — **no changes**

`GET /api/dashboard/data-progress` still returns `employers` with `available: false` and `avgDataProgress: 0`. Do **not** hardcode `available: false` forever in frontend code (Phase 2 will flip the API).

---

## 7. Section keys ↔ form accordions (future detail UI)

| `sectionKey` | Form accordion | Max % |
|--------------|----------------|-------|
| `basicInformation` | Basic Information | 22.5 |
| `workArrangementsAndTags` | Work Arrangements & Tags | 17.5 |
| `benefitsAndSalaryPolicy` | Benefits & Salary Policy | 40 |
| `officeLocations` | Office Locations | 10 |
| `layoffs` | Layoffs | 10 |

`missingFields` labels match product copy exactly (e.g. `"DPL Competitive"`, `"No. of Affected Employees"`, `"LinkedIn URL"`).

---

## 8. Behaviour notes for UX

1. **Recalc timing:** After employer create/update, list `%` updates when you refresh/refetch.
2. **Locations & layoffs:** Saving nested location/layoff APIs changes `%` even if you never hit employer PUT — **invalidate/refetch employers list** after those mutations.
3. **DPL Competitive:** Only `true` earns weight; `false` shows as missing in breakdown.
4. **Office Country:** Linked `countryId` is required on location rows. **`"Country"` appears in `missingFields` only when there are zero locations.** With ≥1 location, Country is always scored (2.5%); only City / Address / Headquarters can appear as missing. Any full office row → `missingFields` is `[]`.
5. **Layoffs:** Affected employee count must be **> 0** to earn that field; zero does not count.
6. **List vs breakdown:** Table uses stored column; breakdown is live (for future detail view).
7. Invalid filter (min > max or out of 0–100) → **400** with plain-text message.

---

## 9. Anti-patterns

| Anti-pattern | Why |
|--------------|-----|
| Client-side office/layoff best-row algorithm | Backend owns scoring |
| Hardcode `employers.available = false` on dashboard forever | Blocks Phase 2 |
| Forget list refresh after location/layoff CRUD | `%` will look stale |
| Call `/data-progress` per table row | Unnecessary; use list field |
| Type list `%` as `number \| null` or optional | API always sends a number |

---

## 10. Implementation checklist

| # | Task | File(s) |
|---|------|---------|
| 1 | Types | `src/lib/types/employer-data-progress.ts` |
| 2 | Extend list/domain type with required `dataProgressPercentage: number` | employer types + DTO |
| 3 | Pass min/max filter query params | `src/lib/services/employers-api.ts` |
| 4 | `fetchEmployerDataProgress` | `src/lib/services/employers-api.ts` |
| 5 | Data Progress column (before Actions, `lg+`, client sort) | `src/components/employers-table.tsx` |
| 6 | Min/max % in filter dialog (`dataProgressMin` / `dataProgressMax` → API params) | `employers-filter-dialog.tsx` + page client |
| 7 | Refetch list after location/layoff saves | location/layoff mutation flows |
| 8 | Reuse shared tier/format helpers | `src/lib/utils/data-progress.ts` |
| 9 | **Skip** detail modal progress panel | — |
| 10 | **Skip** dashboard employers progress | — |
| 11 | Build passes | — |

---

## 11. Smoke tests (manual)

1. **List:** `GET /api/employers?pageNumber=1&pageSize=5` → each item has numeric `dataProgressPercentage`.
2. **Filter:** `GET /api/employers?minDataProgressPercentage=50&maxDataProgressPercentage=100` → filtered results.
3. **Invalid filter:** min > max → **400** plain text.
4. **Breakdown:** `GET /api/employers/{id}/data-progress` → 5 sections, `overallPercentage` 0–100.
5. **404:** soft-deleted or missing id → **404**.
6. **After edit:** PUT employer (e.g. set DPL competitive) → list `%` increases on refresh.
7. **Location:** POST location under employer → list `%` updates on refresh.
8. **Layoff:** POST layoff → list `%` updates on refresh.
9. **Dashboard:** `module=employers` still `available: false`, `avgDataProgress: 0`.

---

## 12. Related documents

| Document | Purpose |
|----------|---------|
| [`EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Weights & office/layoff algorithms |
| [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend contract |
| [`EmployerApiReference.md`](./EmployerApiReference.md) | Locations API (not on employer PUT) |
| [`university_certification_data_progress_frontend_integration.md`](./university_certification_data_progress_frontend_integration.md) | Parallel modules pattern |
| [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) | Reference pattern |
| [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md) | Dashboard Phase 2 (later) |
| [`employer_data_progress_frontend_integration_phase2.md`](./employer_data_progress_frontend_integration_phase2.md) | Frontend Phase 2 verify |

---

## 13. Agent prompt (frontend Phase 1)

```
Wire Employer Data Progress Phase 1 per
docs/employer_data_progress_frontend_integration.md and
docs/EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

- Show dataProgressPercentage on employers table (required number; badge/pill;
  just before Actions; lg+; client sort).
- Add dataProgressMin / dataProgressMax (strings) to employers filter dialog;
  map to minDataProgressPercentage / maxDataProgressPercentage in page client + API.
- Add fetchEmployerDataProgress and types; treat 404 as employer unavailable
  for progress; do NOT build employer detail progress panel yet.
- After location or layoff create/update/delete, refetch employers list (those
  routes are separate from PUT /api/employers/{id} and also update %).
- Do NOT change dashboard employers module (Phase 2 — available still false).
- Do NOT compute progress on the client.
- Reuse @/lib/utils/data-progress helpers.

Run smoke tests in §11 when done.
```
