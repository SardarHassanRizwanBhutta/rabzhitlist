# Dashboard Data Progress — Backend Handoff

Handoff for the **backend AI agent** implementing **`GET /api/dashboard/data-progress`** and supporting **daily fleet progress snapshots** for the Next.js dashboard.

**Product spec (locked):** [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md)  
**Legacy intake code (migrate):** [Appendix A](#appendix-a--legacy-intake-code-migrate-then-remove)  
**Per-candidate progress (entity level):** [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md)

**Status:** Not implemented — contract for implementation.  
**Test cases:** Intentionally omitted from this document (separate QA / test plan).

---

## 0. Locked product decisions

| # | Decision | Status |
|---|----------|--------|
| **D1** | **Candidates-only progress in v1.** `available: true` only for `candidates`. Other modules return `available: false`; progress fields (`avgDataProgress`, `totalDataProgress` in `daily[]`) are zero or omitted semantics per §4. | **Locked** |
| **D2** | Only **`candidates.data_progress_percentage`** exists today. No progress column on employers, projects, universities, certifications until a future phase. | **Locked** |
| **D3** | **Yes** — universities and certifications `recordCount` and `newInPeriod` (and `daily[].newRecords`) come from **this endpoint** via `created_at` on those tables. | **Locked** |
| **D4** | **Single dashboard API call.** Frontend drops `GET /api/dashboard/intake` and uses only `GET /api/dashboard/data-progress`. Intake fields live in `summary.modules` (+ `daily[].newRecords` for selected module). See §0.1. | **Locked** |
| **D5** | **Persisted daily snapshots** required (§5). Scheduled job is the recommended way to build immutable historical days; see §5.2 for why and alternatives. | **Locked** |

### 0.1 D4 — Single call (performance & consistency)

**Recommendation: agree — one call is better for the dashboard.**

| Single call (`data-progress` only) | Dual call (intake + data-progress) |
|-----------------------------------|-------------------------------------|
| One network round trip | Two RTTs; slower on mobile / high latency |
| One `generatedAt` — totals and progress align | Risk of mismatch if requests straddle midnight or data changes between calls |
| Simpler frontend state (one loading/error path) | Two abort controllers, merge logic (`intakeLive` overlay) |
| Backend can share intake SQL inside data-progress service | Duplicate validation and date logic |

**Backend:** Reuse intake query logic inside `DashboardDataProgressService` (shared repository helpers). **`GET /api/dashboard/intake` is removed** once data-progress ships — dashboard is the only consumer (C1).

**Frontend:** Remove `fetchDashboardIntake` and `dashboard-intake-api.ts` usage from dashboard; read `newInPeriod` and `recordCount` from `summary.modules` only.

### 0.2 Additional locked decisions (C1–C5)

| # | Decision | Status |
|---|----------|--------|
| **C1** | **Remove `GET /api/dashboard/intake`** from the API when data-progress is deployed. Dashboard is the only consumer; intake SQL moves into data-progress service (no duplicate public endpoint). | **Locked** |
| **C2** | **Universities / certifications** use same semantics as intake Option A: `newRecords` = all `created_at` by calendar day (ignore `deleted_at`); `recordCount` = active fleet (`deleted_at IS NULL`). | **Locked** |
| **C3** | **Today’s snapshot:** upsert continuously through the day; **past days frozen** at midnight (`Asia/Karachi`). | **Locked** |
| **C4** | **Backfill** on first deploy: **150 calendar days** of snapshot history per module. | **Locked** |
| **C5** | Modules with `available: false` show **`avgDataProgress: 0`** on overview (no frontend mock progress). `avgDataProgressDelta: null`. | **Locked** |

---

## 1. Relationship to implemented intake API

### 1.1 Intake API — superseded for dashboard (C1)

`GET /api/dashboard/intake` was implemented for dashboard v1 but is **replaced** by `GET /api/dashboard/data-progress`. On data-progress go-live:

1. **Move** intake aggregation SQL into `DashboardDataProgressService` (all five modules).
2. **Remove** the intake controller action, service registration, and public route (or mark removed in changelog).
3. **Do not** maintain two endpoints with duplicate logic.

See [Appendix A](#appendix-a--legacy-intake-code-migrate-then-remove) for existing backend file paths and intake SQL rules to migrate.

| Former intake capability | Data-progress replacement |
|--------------------------|---------------------------|
| Daily `newCandidates`, `newEmployers`, `newProjects` | `daily[].newRecords` + `summary.modules[].newInPeriod` |
| `summary.totals` (c/e/p) | `summary.modules[].recordCount` |
| Universities / certifications counts | `summary.modules` (D3, C2) |

### 1.1b Intake logic to internalize in data-progress

| Module | `recordCount` | `newRecords` / `newInPeriod` |
|--------|---------------|------------------------------|
| `candidates` | Active fleet | `created_at` day bucket; ignore `deleted_at` |
| `employers` | Active fleet | Same (parity with intake API) |
| `projects` | Active fleet | Same (parity with intake API) |
| `universities` | Active fleet (`deleted_at IS NULL`) | `created_at` day bucket; ignore `deleted_at` (C2) |
| `certifications` | Active fleet (`deleted_at IS NULL`) | `created_at` day bucket; ignore `deleted_at` (C2) |

### 1.2 What intake does **not** cover (gaps for data-progress)

| Gap | Data-progress responsibility |
|-----|------------------------------|
| Progress KPIs (`totalDataProgress`, `progressPointsGained`, `avgDataProgress`) | **This endpoint** |
| Universities / certifications fleet totals and new counts | **This endpoint** (`summary.modules`) unless intake is extended later |
| Daily historical fleet snapshots | **New snapshot pipeline** (§5) |
| Overview avg completion delta (pp) | **This endpoint** (`avgDataProgressDelta`) |

### 1.3 Refactoring / architecture (recommended)

Extend existing dashboard stack — **do not** bolt progress into `DashboardIntakeService`:

```
DashboardController
  └── IDashboardDataProgressService    (new — includes former intake aggregation)
        └── IDashboardDataProgressRepository
              ├── live candidates.data_progress_percentage
              ├── created_at / fleet counts (all 5 modules)
              └── dashboard_module_daily_snapshots
```

**Remove** after migration (C1): `IDashboardIntakeService`, intake controller route, intake-specific DTOs if fully subsumed.

| Layer | Action |
|-------|--------|
| `DashboardController` | Add `GET data-progress`; **remove** `GET intake` |
| Application | New data-progress service; **migrate** intake SQL from `DashboardIntakeService` then delete intake service |
| Infrastructure | New repository + SQL; optional snapshot writer job |
| Domain | Snapshot entity / interface |
| Migrations | Snapshot table + indexes |

Reuse from intake implementation:

- Query validation (`INVALID_DATE`, `RANGE_TOO_LARGE`, `FUTURE_DATE`, `INVALID_TIMEZONE`)
- `FormattableString` parameterized SQL via `AppDbContext.Database.SqlQuery<T>()`
- Exception filter pattern (`DashboardIntakeValidationExceptionFilter` → generalize or duplicate for data-progress)

---

## 2. Endpoint

### 2.1 Request

```http
GET /api/dashboard/data-progress?module={module}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&timezone={IANA}
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `module` | Yes | — | One of: `candidates`, `employers`, `projects`, `universities`, `certifications` |
| `from` | Yes | — | Inclusive start of **user selection** (`YYYY-MM-DD`) |
| `to` | Yes | — | Inclusive end of user selection |
| `timezone` | No | `Asia/Karachi` | IANA timezone for calendar-day boundaries |

### 2.2 Validation

Same rules as intake (§ intake handoff):

| Rule | HTTP | `code` |
|------|------|--------|
| Invalid `from` / `to` | 400 | `INVALID_DATE` |
| `from` > `to` | 400 | `INVALID_DATE_RANGE` |
| More than 90 inclusive days | 400 | `RANGE_TOO_LARGE` |
| `to` after today in `timezone` | 400 | `FUTURE_DATE` |
| Invalid `timezone` | 400 | `INVALID_TIMEZONE` |
| Invalid `module` | 400 | `INVALID_MODULE` |

### 2.3 Authentication

**None** for v1 (consistent with intake).

---

## 3. Response schema

JSON **camelCase**. Types align with `src/types/data-progress.ts`.

```typescript
type DataProgressModule =
  | "candidates"
  | "employers"
  | "projects"
  | "universities"
  | "certifications"

interface DataProgressDailyRow {
  date: string                    // YYYY-MM-DD in timezone
  newRecords: number              // intake count that day (ignore deleted_at)
  totalDataProgress: number       // fleet sum of progress points EOD
  progressPointsGained: number    // net day-over-day change in totalDataProgress
  avgDataProgress: number         // totalDataProgress / recordCount, 1 decimal
  recordCount: number             // active fleet EOD (deleted_at IS NULL)
}

interface DataProgressCurrentSummary {
  totalDataProgress: number       // always as of generatedAt (today)
  avgDataProgress: number
  recordCount: number
}

interface DataProgressTodaySummary {
  progressPointsGained: number    // gained on current calendar day in timezone
}

interface DataProgressModuleSummary {
  module: DataProgressModule
  avgDataProgress: number         // always as of generatedAt
  avgDataProgressDelta: number | null  // pp; null when to !== today (H1)
  recordCount: number             // fleet now
  newInPeriod: number             // sum newRecords in user from..to
  available: boolean
}

interface DataProgressResponse {
  module: DataProgressModule      // echo requested module (detail series)
  generatedAt: string             // ISO-8601 UTC
  timezone: string
  range: { from: string; to: string }  // user selection (echo)
  summary: {
    current: DataProgressCurrentSummary
    today: DataProgressTodaySummary
    modules: DataProgressModuleSummary[]  // all 5 modules, every response
  }
  daily: DataProgressDailyRow[]   // contiguous series; see §4.3
}
```

**Explicitly omit from v1:**

- `recordsImproved` (deferred product feature)
- Precomputed delta percentages (frontend computes from `daily[]` and `summary.current`)

### 3.1 Example success response (candidates, truncated)

```json
{
  "module": "candidates",
  "generatedAt": "2026-07-02T10:00:00.000Z",
  "timezone": "Asia/Karachi",
  "range": { "from": "2026-06-26", "to": "2026-07-02" },
  "summary": {
    "current": {
      "totalDataProgress": 245300,
      "avgDataProgress": 58.2,
      "recordCount": 4213
    },
    "today": {
      "progressPointsGained": 142
    },
    "modules": [
      {
        "module": "candidates",
        "avgDataProgress": 58.2,
        "avgDataProgressDelta": 0.9,
        "recordCount": 4213,
        "newInPeriod": 84,
        "available": true
      },
      {
        "module": "employers",
        "avgDataProgress": 0,
        "avgDataProgressDelta": null,
        "recordCount": 312,
        "newInPeriod": 5,
        "available": false
      }
    ]
  },
  "daily": [
    {
      "date": "2026-06-19",
      "newRecords": 11,
      "totalDataProgress": 241800,
      "progressPointsGained": 118,
      "avgDataProgress": 57.5,
      "recordCount": 4205
    }
  ]
}
```

---

## 4. Metric rules

### 4.1 Per-record progress points

For each **active** record at snapshot time (`deleted_at IS NULL`):

```
progressPoints = data_progress_percentage   // 0–100, 1 decimal allowed
```

**Candidates:** use `candidates.data_progress_percentage` (already maintained by backend).

**Other modules:** apply same pattern when column exists; until then `available: false`.

### 4.2 Fleet aggregates (per module, per calendar day EOD in `timezone`)

```
recordCount       = COUNT(active records)
totalDataProgress = ROUND(SUM(progressPoints), 0)   // integer pts in API
avgDataProgress   = ROUND(totalDataProgress / recordCount, 1)   // 0 if count=0
```

### 4.3 `daily[]` series span (critical)

Frontend needs history for **prior-window deltas**, **sparklines**, and **7-day trailing chart** on single-day selection. The client sends only user `from`/`to`; **backend must expand** the series.

Compute:

```
lenDays     = inclusive days(from, to)
prevTo      = from - 1 day
prevFrom    = prevTo - (lenDays - 1) days

chartFrom   = if from = to then to - 6 days else from

seriesFrom  = min(prevFrom, chartFrom)
seriesTo    = to

daily[]     = one row per calendar day from seriesFrom through seriesTo (zero-filled)
```

**Example:** User selects Today (`from = to = 2026-07-02`):

```
lenDays = 1, prevTo = 2026-07-01, prevFrom = 2026-07-01
chartFrom = 2026-06-26
seriesFrom = 2026-06-26, seriesTo = 2026-07-02  → 7 rows
```

**Example:** User selects Last 7 days (`2026-06-26`..`2026-07-02`):

```
prevFrom = 2026-06-19, chartFrom = 2026-06-26
seriesFrom = 2026-06-19  → 14 rows
```

### 4.4 `progressPointsGained` (daily)

Net change in fleet total progress points:

```
progressPointsGained(D) = totalDataProgress(EOD D) - totalDataProgress(EOD D-1)
```

Includes effect of:

- Existing records increasing completeness
- New records added that day (initial points appear in EOD total)
- Fleet shrinkage (soft deletes) — value **may be negative**; do not clamp

### 4.5 `newRecords` (daily intake per module)

Count rows where **local calendar date of `created_at` = D** in `timezone`.

**Soft-delete:** **do not** filter `deleted_at` (Option A — same as intake).

For **candidates / employers / projects**, counts **must match** intake daily fields when the same `from`/`to`/`timezone` is used.

### 4.6 `summary.current` (stock — always now)

Values at **`generatedAt`** (live query or latest snapshot for today). **Independent** of user `from`/`to`.

Frontend uses for:

- Overview avg completion hero
- Total data progress KPI hero
- Overview + detail fleet counts

### 4.7 `summary.today.progressPointsGained`

`progressPointsGained` for **current calendar day** in `timezone` (for Today preset shortcut).

### 4.8 `summary.modules[]` (overview row)

Return **all five** modules on every request.

| Field | Rule |
|-------|------|
| `avgDataProgress` | Same as `summary.current` for that module (always now) |
| `recordCount` | Fleet now (`deleted_at IS NULL`) |
| `newInPeriod` | `SUM(newRecords)` over user `from`..`to` (from `daily[]` subset) |
| `avgDataProgressDelta` | See §4.9 |
| `available` | `true` only for `candidates` (D1). `false` otherwise — **`avgDataProgress` = `0`**, **`avgDataProgressDelta` = `null`** (C5) |

**Former intake parity (candidates, employers, projects):** `recordCount` / `newInPeriod` must match the rules previously implemented on `GET /api/dashboard/intake` (for regression comparison during migration only).

### 4.9 `avgDataProgressDelta` (overview delta, percentage points)

Only when **`to` equals today’s calendar date** in `timezone`:

```
avgDataProgressDelta = avgDataProgress(EOD to) - avgDataProgress(EOD prevTo)
```

where `prevTo = from - 1 day` using the **user selection’s** `from` (not `seriesFrom`).

Round to **1 decimal**. Unit is **percentage points**, not relative percent.

When **`to` < today** (historical selection): return **`null`** (H1).

When **`to` = today** and prior snapshot missing: return **`null`**.

### 4.10 Detail KPI derivations (frontend — document for parity)

Backend supplies `daily[]` + `summary.current`; frontend computes:

| UI element | Computation |
|------------|-------------|
| Total progress hero | `summary.current.totalDataProgress` |
| Total progress delta % | `(daily[to].total - daily[prevTo].total) / daily[prevTo].total × 100` |
| Total sparkline | `daily[].totalDataProgress` over chart window |
| Progress gained hero | `SUM(daily[].progressPointsGained)` for `from`..`to` |
| Progress gained previous | Same sum for `prevFrom`..`prevTo` |
| Progress gained delta % | `(hero - previous) / previous × 100` |
| Chart bars | `daily[].progressPointsGained` over chart window |

**Note:** Frontend should be updated to use `summary.current.totalDataProgress` for hero (today fixed), not end-of-filter row. Until then, contract still requires `summary.current`.

---

## 5. Daily snapshots (required infrastructure)

Historical metrics **cannot** be derived from live `data_progress_percentage` alone. The column only stores **current** completeness; it does not tell you what the fleet average was on **25 Jun** vs **2 Jul**. Implement **end-of-day fleet snapshots per module**.

### 5.1 Why a scheduled job is suggested (D5)

| Approach | Problem |
|----------|---------|
| **Query live table for past dates** | Impossible — past daily fleet totals were never stored. |
| **Recompute from audit/change log** | Only works if a complete per-record history exists (not documented for this codebase). |
| **Persisted daily snapshot table** | Stores `totalDataProgress`, `avgDataProgress`, `recordCount` per module per calendar day — powers `daily[]`, deltas, sparklines, chart. |

A **scheduled job** (e.g. shortly after midnight `Asia/Karachi`) is recommended because:

1. **Immutable history** — once day D ends, snapshot row for D is fixed; metrics don’t shift when you view the dashboard later.
2. **Clear EOD semantics** — matches “avg at end of prior window” (pp delta) and day-over-day `progressPointsGained`.
3. **Cheap reads** — API reads pre-aggregated rows instead of scanning millions of candidate rows for every dashboard load.
4. **Backfill** — one-off job can seed the last N days before go-live.

**Locked approach (C3):** **Upsert today’s row continuously** (trigger on candidate progress recalc and/or scheduled every N minutes). **Finalize yesterday** at midnight — prior dates are **immutable**.

### 5.1a C3 worked example (today = 2 Jul 2026, timezone `Asia/Karachi`)

Snapshots are stored in `dashboard_module_daily_snapshots` — **one row per module per calendar day**. Example for module `candidates`:

| `snapshot_date` | `record_count` | `total_data_progress` | `avg_data_progress` |
|-----------------|----------------|------------------------|------------------------|
| 2026-07-01 | 4200 | 244,100 | 58.1 |
| 2026-07-02 | 4213 | 245,300 | 58.2 |

#### Rule 1 — Past days frozen at midnight

After **2026-07-02 00:00 PKT** becomes **2026-07-03**, the row for **`2026-07-02` is final**. Edits on 3 Jul do **not** change 1 Jul or 2 Jul snapshot rows. API `daily[]` for historical dates must always return these frozen values.

#### Rule 2 — Today upserted continuously

On **2026-07-02** (still “today”):

| Time | Event | Row `2026-07-02` after upsert |
|------|--------|--------------------------------|
| 10:00 | Candidates added / progress recalculated | `4210` records, `244,900` pts, `58.0%` avg |
| 15:00 | More progress updates | **Same row updated:** `4213` records, `245,300` pts, `58.2%` avg |

There is still **only one row** per `snapshot_date`; the afternoon job **overwrites** the morning values for today.

`summary.current` on the API should reflect the **latest** today upsert (≈ 15:00 values above).

#### Midnight rollover (2 Jul → 3 Jul)

| Step | Action |
|------|--------|
| 1 | **Freeze** `2026-07-02` row (no further updates) |
| 2 | **Create / upsert** `2026-07-03` row; continue intraday upserts through 3 Jul |

On **3 Jul at 09:00**, a chart for Last 7 days still shows **245,300** pts for **2 Jul** — not a number recomputed from live tables on 3 Jul.

#### Why both rules matter

| Only midnight write (no intraday today) | Only live recompute (no freeze) |
|----------------------------------------|-----------------------------------|
| Dashboard “now” and today’s sparkline lag until EOD | Yesterday’s metrics change when viewed later — unreliable history |
| **C3 avoids both** | |

#### UI mapping (implementation parity)

| UI element | Snapshot source |
|------------|-----------------|
| Overview **avg completion** hero | Latest **today** upsert → `summary.current.avgDataProgress` |
| Overview **delta (pp)** when `to` = today | Today avg vs **frozen** EOD `prevTo` (e.g. 25 Jun for Last 7d) |
| **Progress gained** chart (multi-day) | **Frozen** `progress_points_gained` per day in range |
| **Progress gained** Today KPI | Sum for selected day only; chart may use trailing 7 days (frozen past + live today) |

**Triggers for today upsert (suggested):** after `data_progress_percentage` recalc on any candidate; optional scheduled refresh every N minutes; final midnight job freezes yesterday and ensures no gap.

### 5.2 Suggested table (implementation detail)

```sql
-- Illustrative; adjust naming to project conventions
CREATE TABLE dashboard_module_daily_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  module          VARCHAR(32) NOT NULL,   -- candidates | employers | ...
  snapshot_date   DATE NOT NULL,          -- calendar date in Asia/Karachi (or store timezone)
  record_count    INT NOT NULL,
  total_data_progress INT NOT NULL,
  avg_data_progress NUMERIC(5,1) NOT NULL,
  progress_points_gained INT NOT NULL,    -- vs previous snapshot day
  new_records     INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module, snapshot_date)
);
```

### 5.3 Snapshot job (C3, C4)

- **Historical days:** one row per module per calendar day; **frozen** after midnight in `timezone`.
- **Today:** **upsert in place** as fleet changes so `summary.current`, sparklines, and today’s chart stay current.
- **Backfill on first deploy:** **150 calendar days** per module (C4).

### 5.4 `progressPointsGained` from snapshots

When building snapshot for day D:

```
progressPointsGained = total_data_progress(D) - total_data_progress(D-1)
```

Store in snapshot row; serve via API `daily[]`.

---

## 6. Module → database mapping (D2, C2)

| Module | Table (expected) | Fleet filter | Progress column (v1) | `newRecords` |
|--------|------------------|--------------|----------------------|--------------|
| `candidates` | `candidates` | `deleted_at IS NULL` | `data_progress_percentage` ✓ | `created_at`; ignore `deleted_at` |
| `employers` | `employers` | `deleted_at IS NULL` | None (D2) — `available: false` | `created_at`; ignore `deleted_at` |
| `projects` | `projects` | `deleted_at IS NULL` | None (D2) | `created_at`; ignore `deleted_at` |
| `universities` | `universities` | `deleted_at IS NULL` (C2) | None (D2) | `created_at`; ignore `deleted_at` (C2) |
| `certifications` | Confirm table name with schema | `deleted_at IS NULL` (C2) | None (D2) | `created_at`; ignore `deleted_at` (C2) |

---

## 7. Frontend integration (after backend ships)

| File | Change |
|------|--------|
| `src/components/dashboard/dashboard-page-client.tsx` | **Remove** `fetchDashboardIntake` / `intakeLive`; single `fetchDataProgress` drives section |
| `src/lib/services/data-progress-api.ts` | Set `NEXT_PUBLIC_DATA_PROGRESS_USE_MOCK=false` |
| `src/lib/utils/data-progress-metrics.ts` | Use `summary.current` for total hero; H1 null delta on overview |
| `src/components/dashboard/data-progress-overview-card.tsx` | Dynamic delta tooltip; — when delta null; **`available: false` → 0% avg** (C5) |
| `src/components/dashboard/dashboard-data-progress-section.tsx` | Read all overview fields from `summary.modules` only |
| `src/types/data-progress.ts` | Add `summary.current`; update JSDoc |
| `src/lib/services/dashboard-intake-api.ts` | **Delete** or stop exporting after dashboard wire-up (C1) |

**Single fetch only** — no `GET /api/dashboard/intake` (C1, D4).

---

## 8. Implementation checklist

- [x] D1–D5 and C1–C5 locked (§0, §0.2)
- [ ] Migration: `dashboard_module_daily_snapshots` (+ indexes)
- [ ] Snapshot job: today upsert (C3) + midnight finalize + **150-day backfill** (C4)
- [ ] Migrate intake SQL into `DashboardDataProgressService`
- [ ] `GET /api/dashboard/data-progress` with validation
- [ ] **Remove** `GET /api/dashboard/intake` (C1)
- [ ] `daily[]` expanded to `seriesFrom`..`seriesTo` (§4.3)
- [ ] `summary.modules` all five modules; C5 zeros for non-candidates
- [ ] `avgDataProgressDelta` pp + H1 null when `to` ≠ today
- [ ] Candidates: live `data_progress_percentage` + snapshots
- [ ] Universities / certifications intake (C2)
- [ ] `summary.current` always reflects `generatedAt`
- [ ] Frontend: single fetch; remove intake client (§7)

---

## 9. Agent prompt (copy to backend session)

```
Implement GET /api/dashboard/data-progress per docs/DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md
and docs/DASHBOARD_REQUIREMENTS_LOCKED.md.

Priority: candidates module (available: true) with daily snapshots (C3, C4: 150-day backfill).
Migrate intake aggregation from DashboardIntakeService; then REMOVE GET /api/dashboard/intake (C1).
Dashboard uses only data-progress — single API call (D4).

All modules in summary.modules: intake fields for all five; progress only for candidates.
Non-candidate modules: avgDataProgress 0, available false (C5).
Omit recordsImproved and test cases from v1.
```

---

## Appendix A — Legacy intake code (migrate then remove)

`GET /api/dashboard/intake` was implemented in 2026-06 and is **replaced** by this contract (C1). Migrate SQL/rules below into `DashboardDataProgressService`, then **delete** the intake route and related DI.

### A.1 Architecture (current — remove after migration)

```
DashboardController
  └── IDashboardIntakeService (DashboardIntakeService)
        └── IDashboardIntakeRepository (DashboardIntakeRepository)
              └── AppDbContext.Database.SqlQuery<T>()  (parameterized SQL)
```

### A.2 Backend files to migrate or delete

| Layer | Path |
|-------|------|
| API | `MyApp.API/Controllers/DashboardController.cs` (intake action) |
| API | `MyApp.API/Filters/DashboardIntakeValidationExceptionFilter.cs` |
| API | `MyApp.API/Program.cs` (intake DI + exception filter) |
| Application | `MyApp.Application/Dashboard/DashboardIntakeDtos.cs` |
| Application | `MyApp.Application/Dashboard/DashboardIntakeService.cs` |
| Application | `MyApp.Application/Dashboard/IDashboardIntakeService.cs` |
| Application | `MyApp.Application/Dashboard/DashboardIntakeValidationException.cs` |
| Domain | `MyApp.Domain/Interfaces/IDashboardIntakeRepository.cs` |
| Infrastructure | `MyApp.Infrastructure/Repositories/DashboardIntakeRepository.cs` |
| Infrastructure | `MyApp.Infrastructure/Queries/DashboardIntakeQueryResults.cs` |

Reuse validation filter pattern and `FormattableString` SQL style in data-progress stack.

### A.3 Intake metric rules (carry forward into data-progress)

**Daily `newRecords` (candidates, employers, projects):** count by local calendar date of `created_at` in `timezone`; **ignore `deleted_at`** (Option A).

```sql
-- Bucketing pattern
(created_at AT TIME ZONE {timezone})::date
```

**Fleet `recordCount`:** `COUNT(*)` where `deleted_at IS NULL` (active fleet at `generatedAt`).

**Former intake `summary.totals` mapping:**

| Intake field | Data-progress field |
|--------------|---------------------|
| `summary.totals.candidates` | `summary.modules[candidates].recordCount` |
| `summary.totals.employers` | `summary.modules[employers].recordCount` |
| `summary.totals.projects` | `summary.modules[projects].recordCount` |

Universities and certifications fleet + `newRecords` are **new** in data-progress (D3, C2).

### A.4 Database (already applied)

Migration **`20260628161338_AddDashboardIntakeCreatedAtIndexes`** — indexes on `created_at`:

- `candidates`, `employers`, `projects`

Tables: `candidates`, `employers`, `projects` — column `created_at` (UTC).

---

## Related documents

| Document | Purpose |
|----------|---------|
| [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) | Locked UI/metric semantics |
| [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md) | Entity-level candidate % |
