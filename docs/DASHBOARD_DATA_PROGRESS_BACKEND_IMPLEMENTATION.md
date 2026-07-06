# Dashboard Data Progress — Backend Implementation Summary

**Status:** Implemented and smoke-tested (2026-07-06).  
**Audience:** Frontend / Next.js AI agent wiring the dashboard.  
**Contracts:** [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md), [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md)

This document describes **what the backend actually ships** and how to map the JSON response to the locked UI requirements.

---

## 1. Executive summary

| Item | Status |
|------|--------|
| `GET /api/dashboard/data-progress` | **Live** — single dashboard API |
| `GET /api/dashboard/intake` | **Removed** (C1) — returns 404 |
| Five modules in `summary.modules` | **Implemented** (D3, C2) |
| Candidates-only progress (`available: true`) | **Implemented** (D1, C5) |
| Daily snapshot table + 150-day backfill | **Implemented** (D5, C3, C4) |
| `daily[]` expanded series (`seriesFrom`..`seriesTo`) | **Implemented** (§4.3) |
| `avgDataProgressDelta` (pp) + H1 null when `to` ≠ today | **Implemented** (§4.9) |
| Authentication | **None** (v1) |
| `recordsImproved` | **Omitted** (deferred) |

**Frontend rule:** One fetch per date/module change. Do **not** call intake. Read overview counts from `summary.modules`; read detail progress from `summary.current` + `daily[]` for the **selected** `module`.

---

## 2. Endpoint

### 2.1 Request

```http
GET /api/dashboard/data-progress?module={module}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&timezone={IANA}
```

| Parameter | Required | Default | Notes |
|-----------|----------|---------|-------|
| `module` | Yes | — | `candidates` \| `employers` \| `projects` \| `universities` \| `certifications` |
| `from` | Yes | — | Inclusive start of **user selection** |
| `to` | Yes | — | Inclusive end of user selection |
| `timezone` | No | `Asia/Karachi` | IANA timezone for calendar-day boundaries |

**Example (verified locally):**

```http
GET /api/dashboard/data-progress?module=candidates&from=2026-06-30&to=2026-07-06&timezone=Asia/Karachi
```

### 2.2 Success response

- HTTP `200`
- JSON **camelCase** (ASP.NET Core default)
- `generatedAt` is ISO-8601 UTC

### 2.3 Error response

HTTP `400` body:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| Rule | `code` |
|------|--------|
| Missing/invalid `from` or `to` | `INVALID_DATE` |
| `from` > `to` | `INVALID_DATE_RANGE` |
| More than 90 inclusive days | `RANGE_TOO_LARGE` |
| `to` after today in `timezone` | `FUTURE_DATE` |
| Invalid IANA `timezone` | `INVALID_TIMEZONE` |
| Invalid `module` | `INVALID_MODULE` |

---

## 3. TypeScript response shape

Align `src/types/data-progress.ts` with this (matches backend DTOs):

```typescript
type DataProgressModule =
  | "candidates"
  | "employers"
  | "projects"
  | "universities"
  | "certifications"

interface DataProgressDailyRow {
  date: string                    // YYYY-MM-DD
  newRecords: number              // created that day; ignore deleted_at
  totalDataProgress: number       // fleet sum of progress points (0 for non-candidate modules)
  progressPointsGained: number    // day-over-day change in totalDataProgress
  avgDataProgress: number         // 1 decimal; 0 when no progress column
  recordCount: number             // active fleet EOD
}

interface DataProgressCurrentSummary {
  totalDataProgress: number       // always as of generatedAt (live for selected module)
  avgDataProgress: number
  recordCount: number
}

interface DataProgressTodaySummary {
  progressPointsGained: number    // today's calendar day in timezone
}

interface DataProgressModuleSummary {
  module: DataProgressModule
  avgDataProgress: number         // always as of generatedAt
  avgDataProgressDelta: number | null  // pp; null when to !== today OR available === false
  recordCount: number             // active fleet now
  newInPeriod: number             // sum newRecords over user from..to
  available: boolean              // true only for candidates
}

interface DataProgressResponse {
  module: DataProgressModule      // echo requested module (detail series)
  generatedAt: string
  timezone: string
  range: { from: string; to: string }
  summary: {
    current: DataProgressCurrentSummary
    today: DataProgressTodaySummary
    modules: DataProgressModuleSummary[]  // all 5, every response
  }
  daily: DataProgressDailyRow[]   // expanded series; see §5
}
```

**Not in v1:** `recordsImproved`, precomputed relative delta percentages (frontend computes those).

---

## 4. UI field mapping (requirements → API)

### 4.1 Stock vs flow (locked §2)

| UI metric class | Follows date filter? | API source |
|-----------------|----------------------|------------|
| **Stock** — fleet count, total progress pts, avg completion % | **No** (always now) | `summary.modules[].recordCount`, `summary.modules[].avgDataProgress`, `summary.current` (detail, selected module) |
| **Flow** — +N new, progress gained, chart bars | **Yes** (`range.from`..`range.to`) | `summary.modules[].newInPeriod`, sum of `daily[].progressPointsGained` over filter window |

### 4.2 Overview row (five module cards)

Read **only** from `summary.modules[]` (find row by `module`):

| UI field | API field | Notes |
|----------|-----------|-------|
| Avg completion % | `avgDataProgress` | If `available === false` → show **0.0%** (C5); do not mock |
| Total count | `recordCount` | Active fleet; not affected by filter |
| +N new | `newInPeriod` | Sum of creations in selected `from`..`to` |
| Delta pill (pp) | `avgDataProgressDelta` | Show **—** when `null` (historical `to` or non-candidate) |
| Delta tooltip | *(frontend)* | e.g. “Change vs prior 7 days” from filter length |

**`avgDataProgressDelta` backend rule (only candidates, only when `to` = today):**

```
prevTo = user from − 1 day
avgDataProgressDelta = live avg(now) − frozen avg(EOD prevTo)
```

Rounded to **1 decimal**. Unit is **percentage points**, not relative percent.

### 4.3 Detail row — selected module

Use `module` query param / `response.module` to pick the detail series.

| UI KPI | API source | Notes |
|--------|------------|-------|
| **Total data progress** hero | `summary.current.totalDataProgress` | Always **now**, not end of filter |
| Subline “Across N …” | `summary.current.recordCount` | Same as overview total for that module |
| Total progress delta % | *(frontend)* | From `daily[]`: compare end of `to` vs end of prior window |
| Total sparkline | `daily[].totalDataProgress` | Over chart window (§6) |
| **Progress gained** hero | *(frontend)* | `SUM(daily[].progressPointsGained)` for `range.from`..`range.to` |
| Progress gained subline | *(frontend)* | Sum over prior equal-length window |
| Progress gained delta % | *(frontend)* | Relative % vs prior period sum |
| Progress gained sparkline / chart | `daily[].progressPointsGained` | See chart rules §6 |

**Candidates only:** `summary.current` and progress fields in `daily[]` are meaningful when `available === true`. For other modules, progress fields are **0**; `newRecords` in `daily[]` is still valid for intake-style charts if needed later.

### 4.4 Today preset shortcut

`summary.today.progressPointsGained` = `progressPointsGained` for **today’s calendar date** in `timezone` (from expanded `daily[]`, live-overridden for candidates).

---

## 5. `daily[]` series expansion (critical for frontend)

The client sends only user `from`/`to`. The backend **expands** `daily[]`:

```
lenDays     = inclusive days(from, to)
prevTo      = from − 1 day
prevFrom    = prevTo − (lenDays − 1) days
chartFrom   = if from = to then to − 6 days else from
seriesFrom  = min(prevFrom, chartFrom)
seriesTo    = to
```

`daily[]` = one row per calendar day from `seriesFrom` through `seriesTo`, zero-filled.

### Examples

**Today** (`from = to = 2026-07-06`):

- `seriesFrom = 2026-06-30`, `seriesTo = 2026-07-06` → **7 rows** (trailing chart)

**Last 7 days** (`from = 2026-06-30`, `to = 2026-07-06`):

- `seriesFrom = 2026-06-23`, `seriesTo = 2026-07-06` → **14 rows**

### Frontend slicing

| Use case | Slice `daily[]` by |
|----------|-------------------|
| Filter-window KPIs (progress gained hero) | `range.from` .. `range.to` |
| Prior-window comparison | `prevFrom` .. `prevTo` (compute client-side from `range`) |
| Trailing 7-day chart on single-day selection | Last 7 rows ending on `range.to` (or `chartFrom`..`to`) |
| Multi-day chart bars | `range.from` .. `range.to` |

**`daily[]` is for the requested `module` only.** Overview cards still use `summary.modules` for all five.

---

## 6. Chart rules (locked §6)

| Filter | Progress gained KPI header | Chart X-axis |
|--------|---------------------------|--------------|
| Multi-day | Sum over **filter** `from`..`to` | One bar per day in filter window |
| Single-day / Today | Sum for **that day only** | **Trailing 7 days** ending on selected day |

Chart metric: `daily[].progressPointsGained`.

---

## 7. Historical ranges (`to` < today) — H1

| Metric | Behavior |
|--------|----------|
| `newInPeriod`, progress gained, chart | Scoped to selected past window |
| Fleet total, avg completion, total progress hero | **Current** values (`summary.current` / `summary.modules`) |
| `avgDataProgressDelta` | **`null`** on all modules → UI shows **—** |

---

## 8. Verified smoke-test response

Request:

```http
GET /api/dashboard/data-progress?module=candidates&from=2026-06-30&to=2026-07-06&timezone=Asia/Karachi
```

Observed (abbreviated):

```json
{
  "module": "candidates",
  "generatedAt": "2026-07-06T10:52:07.4590647Z",
  "timezone": "Asia/Karachi",
  "range": { "from": "2026-06-30", "to": "2026-07-06" },
  "summary": {
    "current": { "totalDataProgress": 469, "avgDataProgress": 7.6, "recordCount": 62 },
    "today": { "progressPointsGained": 0 },
    "modules": [
      { "module": "candidates", "avgDataProgress": 7.6, "avgDataProgressDelta": 0.0, "recordCount": 62, "newInPeriod": 0, "available": true },
      { "module": "employers", "avgDataProgress": 0, "avgDataProgressDelta": null, "recordCount": 164, "newInPeriod": 0, "available": false },
      { "module": "projects", "avgDataProgress": 0, "avgDataProgressDelta": null, "recordCount": 9, "newInPeriod": 0, "available": false },
      { "module": "universities", "avgDataProgress": 0, "avgDataProgressDelta": null, "recordCount": 55, "newInPeriod": 0, "available": false },
      { "module": "certifications", "avgDataProgress": 0, "avgDataProgressDelta": null, "recordCount": 79, "newInPeriod": 0, "available": false }
    ]
  },
  "daily": [
    { "date": "2026-06-23", "newRecords": 0, "totalDataProgress": 466, "progressPointsGained": 0, "avgDataProgress": 7.6, "recordCount": 61 },
    "… 12 more days …",
    { "date": "2026-06-28", "newRecords": 1, "totalDataProgress": 469, "progressPointsGained": 3, "avgDataProgress": 7.6, "recordCount": 62 },
    { "date": "2026-07-06", "newRecords": 0, "totalDataProgress": 469, "progressPointsGained": 0, "avgDataProgress": 7.6, "recordCount": 62 }
  ]
}
```

**Validation notes:**

- 14 `daily[]` rows = correct expansion for 7-day filter
- `newInPeriod: 0` for Jun 30–Jul 6 (the `newRecords: 1` on Jun 28 is outside filter but inside expanded series)
- `avgDataProgressDelta: 0.0` = live 7.6% minus frozen Jun 29 avg 7.6%
- Non-candidate modules: C5 zeros + `null` delta

---

## 9. Intake migration (what replaced `GET /api/dashboard/intake`)

| Former intake | Data-progress replacement |
|---------------|---------------------------|
| `summary.totals.candidates/employers/projects` | `summary.modules[].recordCount` |
| `summary.today.newCandidates` etc. | Not duplicated per-type; use `newInPeriod` + `daily[].newRecords` for selected module |
| `daily[].newCandidates` etc. | `daily[].newRecords` (single module per request) |
| Universities / certifications | `summary.modules` only (were not on intake) |

**Remove from frontend:**

- `fetchDashboardIntake`, `intakeLive` overlay
- `src/lib/services/dashboard-intake-api.ts` (delete or stop exporting)

---

## 10. Module semantics (implemented)

| Module | Table | `recordCount` | `newRecords` / `newInPeriod` | Progress |
|--------|-------|---------------|-------------------------------|----------|
| `candidates` | `candidates` | `deleted_at IS NULL` | `created_at` day; **ignore** `deleted_at` | `data_progress_percentage` |
| `employers` | `employers` | active fleet | same intake semantics | none (`available: false`) |
| `projects` | `projects` | active fleet | same | none |
| `universities` | `universities` | active fleet | same (C2) | none |
| `certifications` | `certifications` | active fleet | same (C2) | none |

**Progress aggregation (candidates):**

```
totalDataProgress = ROUND(SUM(data_progress_percentage))  // integer in API
avgDataProgress   = ROUND(total / count, 1)
```

---

## 11. Snapshot infrastructure (background — affects data freshness)

Not called directly by frontend, but explains behavior:

| Mechanism | Behavior |
|-----------|----------|
| Table `dashboard_module_daily_snapshots` | One row per `module` + `snapshot_date` |
| First deploy backfill | 150 calendar days per module (C4) |
| Today (C3) | Upserted on every API call, every 15 min, and after candidate progress recalc |
| Past days | Frozen after midnight `Asia/Karachi`; not overwritten |
| Migration | `20260702140909_AddDashboardModuleDailySnapshots` |

**Historical caveat:** Backfilled candidate progress uses **current** `data_progress_percentage` for records active at end-of-day (no per-record history). Past days may look flat until real fleet changes. **Today and forward are live-accurate.**

---

## 12. Frontend integration checklist

From handoff §7 — actionable for Next.js agent:

| File | Action |
|------|--------|
| `src/components/dashboard/dashboard-page-client.tsx` | Remove `fetchDashboardIntake` / `intakeLive`; single `fetchDataProgress` |
| `src/lib/services/data-progress-api.ts` | Point at `GET /api/dashboard/data-progress`; set `NEXT_PUBLIC_DATA_PROGRESS_USE_MOCK=false` |
| `src/lib/utils/data-progress-metrics.ts` | Use `summary.current` for total hero; handle H1 null delta |
| `src/components/dashboard/data-progress-overview-card.tsx` | `available: false` → 0% avg; **—** when `avgDataProgressDelta === null` |
| `src/components/dashboard/dashboard-data-progress-section.tsx` | Overview from `summary.modules` only |
| `src/types/data-progress.ts` | Match §3 types; include `summary.current` |
| `src/lib/services/dashboard-intake-api.ts` | Delete or stop using |

### Suggested fetch signature

```typescript
async function fetchDataProgress(params: {
  module: DataProgressModule
  from: string   // YYYY-MM-DD
  to: string
  timezone?: string  // default Asia/Karachi
}): Promise<DataProgressResponse>
```

Call when: preset changes, calendar range changes, selected module changes, manual refresh.

---

## 13. Backend code map

| Layer | Path |
|-------|------|
| Controller | `MyApp.API/Controllers/DashboardController.cs` |
| Service | `MyApp.Application/Dashboard/DashboardDataProgressService.cs` |
| Snapshots | `MyApp.Application/Dashboard/DashboardSnapshotService.cs` |
| DTOs | `MyApp.Application/Dashboard/DashboardDataProgressDtos.cs` |
| Validation | `MyApp.Application/Dashboard/DashboardQueryValidation.cs` |
| Repository | `MyApp.Infrastructure/Repositories/DashboardDataProgressRepository.cs` |
| Hosted refresh | `MyApp.Infrastructure/Dashboard/DashboardSnapshotRefreshHostedService.cs` |
| Entity | `MyApp.Domain/Entities/DashboardModuleDailySnapshot.cs` |
| Error filter | `MyApp.API/Filters/DashboardValidationExceptionFilter.cs` |

**Removed:** `DashboardIntakeService`, `DashboardIntakeRepository`, `GET /api/dashboard/intake`.

---

## 14. Contract checklist (implementation vs handoff §8)

| Item | Done |
|------|------|
| Migration `dashboard_module_daily_snapshots` | Yes |
| Snapshot job: today upsert + 150-day backfill | Yes |
| Intake SQL migrated into data-progress service | Yes |
| `GET /api/dashboard/data-progress` + validation | Yes |
| `GET /api/dashboard/intake` removed | Yes |
| `daily[]` expanded `seriesFrom`..`seriesTo` | Yes |
| `summary.modules` all five; C5 for non-candidates | Yes |
| `avgDataProgressDelta` pp + H1 null | Yes |
| Candidates live progress + snapshots | Yes |
| Universities / certifications intake (C2) | Yes |
| `summary.current` at `generatedAt` | Yes |
| Frontend single fetch | **Pending** (frontend task) |

---

## 15. Related documents

| Document | Purpose |
|----------|---------|
| [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) | Locked UI/metric semantics |
| [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) | Original backend contract |
| [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md) | Per-candidate `data_progress_percentage` (entity level, not dashboard) |
