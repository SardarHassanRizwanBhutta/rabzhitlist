# Dashboard Projects Data Progress — Phase 2 Backend Handoff

**Status:** Not implemented — contract for backend work.  
**Audience:** Backend AI agent / engineer.  
**Depends on:** Entity-level Project Data Progress Phase 1 shipped (`projects.data_progress_percentage`).

**Parent contracts (unchanged API shape):**

- [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) — full `GET /api/dashboard/data-progress` contract
- [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) — locked UI/metric semantics
- [`DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md) — candidates implementation record
- [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) — entity-level project scoring (Phase 1)

**Frontend:** No new dashboard components expected — verify existing UI when API flips (§6).

---

## 1. Summary

| Item | Phase 2 change |
|------|----------------|
| Progress-enabled modules | **`candidates`** + **`projects`** (`available: true`) |
| Other modules | `employers`, `universities`, `certifications` — **`available: false`**, progress fields **0**, `avgDataProgressDelta: null` (C5) |
| Progress source (projects) | `projects.data_progress_percentage` (0–100, 1 decimal) |
| Snapshots | Populate/backfill **`module = projects`** in `dashboard_module_daily_snapshots` (same C3/C4 rules as candidates) |
| Recalc triggers | Project create/update/delete → refresh **today’s** projects snapshot (mirror candidates) |
| API route | **Same** `GET /api/dashboard/data-progress` — no new endpoint |
| Frontend | Select **Projects** on dashboard → same KPIs/chart as Candidates (already implemented) |

---

## 2. Locked decisions (Phase 2)

| # | Decision |
|---|----------|
| **P2-D1** | `summary.modules[projects].available = true` when Phase 2 ships |
| **P2-D2** | Fleet aggregation for projects **identical** to candidates (§3) |
| **P2-D3** | Snapshot rules **identical** to candidates: today upsert (C3), 150-day backfill (C4), past days frozen at midnight `Asia/Karachi` |
| **P2-D4** | Project entity mutations trigger today snapshot upsert for `module=projects` (same hook pattern as candidate progress recalc) |
| **P2-D5** | Historical backfill uses **current** `data_progress_percentage` for active fleet at EOD — same caveat as candidates (flat history until real fleet changes) |
| **P2-D6** | Employers / universities / certifications remain **`available: false`** until a future phase |
| **P2-D7** | No frontend dashboard code changes required beyond verification (§6) |
| **P2-D8** | Deploy **backend first** on EC2, then frontend commit/deploy (if any doc-only) |

---

## 3. Progress aggregation (projects = candidates)

For **active** projects (`deleted_at IS NULL`) at snapshot time or `generatedAt`:

```
progressPoints       = projects.data_progress_percentage   // 0–100
recordCount          = COUNT(active projects)
totalDataProgress    = ROUND(SUM(progressPoints), 0)     // integer in API
avgDataProgress      = ROUND(totalDataProgress / recordCount, 1)   // 0 if count=0
```

**`daily[]` when `module=projects`:**

| Field | Rule |
|-------|------|
| `totalDataProgress` | Fleet sum from snapshot / live today |
| `avgDataProgress` | Fleet avg |
| `recordCount` | Active fleet EOD |
| `progressPointsGained` | Day-over-day delta in `totalDataProgress` (§4.4 parent handoff) |
| `newRecords` | Intake Option A — `created_at` calendar day; **ignore** `deleted_at` |

**`summary.modules[projects]` when `available: true`:**

| Field | Rule |
|-------|------|
| `avgDataProgress` | Live fleet avg now |
| `recordCount` | Active fleet now |
| `newInPeriod` | Sum `newRecords` over user `from`..`to` |
| `avgDataProgressDelta` | pp vs prior window end — **only when `to` = today** (H1); else `null` |
| `available` | `true` |

**`summary.current`** when request `module=projects`: same live values for selected module detail KPIs.

---

## 4. What changes in `DashboardDataProgressService`

Extend existing candidates implementation — **do not** add a second dashboard endpoint.

### 4.1 `available` flag

```csharp
// Pseudocode
bool IsProgressModule(module) =>
    module is Candidates or Projects;

// summary.modules[].available
available = IsProgressModule(module);

// C5 for non-progress modules
if (!available) {
    avgDataProgress = 0;
    avgDataProgressDelta = null;
    // daily[] progress fields = 0 for detail series when module not progress-enabled
}
```

Update **D1** semantics in code comments: progress modules = **candidates + projects**.

### 4.2 Live query (today / `summary.current`)

When resolving **projects** fleet at `generatedAt`:

```sql
SELECT
  COUNT(*)::int AS record_count,
  COALESCE(ROUND(SUM(data_progress_percentage))::int, 0) AS total_data_progress,
  COALESCE(ROUND(SUM(data_progress_percentage) / NULLIF(COUNT(*), 0), 1), 0) AS avg_data_progress
FROM projects
WHERE deleted_at IS NULL;
```

Mirror EF/SQL style used for candidates in `DashboardDataProgressRepository`.

### 4.3 Snapshots (`dashboard_module_daily_snapshots`)

Table already exists from candidates deploy. Phase 2 work:

1. **Backfill** `module = 'projects'` for **150 calendar days** (C4) if not already present.
2. **Today (C3):** upsert on:
   - Every `GET /api/dashboard/data-progress` where projects series is needed (optional optimization: only when module=projects or overview modules built)
   - **Project progress recalc** (after create/update/delete) — **required** (P2-D4)
   - Hosted refresh job (15 min) — include projects module
3. **Past days:** frozen after midnight; do not overwrite.

Snapshot row fields per day: `record_count`, `total_data_progress`, `avg_data_progress`, `progress_points_gained`, `new_records` — same as candidates.

### 4.4 `daily[]` expansion

**No change** to formulas — reuse §4.3 of parent handoff (`seriesFrom`..`seriesTo`). When `module=projects`, serve expanded series from **projects** snapshot rows (zero-filled).

### 4.5 `avgDataProgressDelta` (overview, projects)

Same as candidates §4.9 parent handoff:

```
When to = today in timezone:
  avgDataProgressDelta = live avg(now) - frozen avg(EOD prevTo)
  prevTo = user from - 1 day
When to < today: null (H1)
```

Only for `available: true` modules (candidates + projects).

---

## 5. Recalc triggers (projects → dashboard snapshot)

Hook into existing project data progress pipeline (Phase 1):

| Event | Action |
|-------|--------|
| `POST /api/projects` | After `data_progress_percentage` saved → upsert **today** snapshot for `module=projects` |
| `PUT /api/projects/{id}` | Same |
| `DELETE /api/projects/{id}` (soft delete) | Same (fleet count may drop) |
| Junction changes affecting project score | Same (if already trigger entity recalc) |

Reuse `DashboardSnapshotService` / candidate hook pattern — single method e.g. `UpsertTodaySnapshotAsync("projects")`.

**Optional admin backfill** (entity-level, separate from dashboard):

`POST /api/admin/projects/recalculate-data-progress` — after bulk run, also refresh today’s dashboard snapshot for projects.

---

## 6. Frontend verification (no new features)

**Frontend guide:** [`project_data_progress_frontend_integration_phase2.md`](./project_data_progress_frontend_integration_phase2.md)

Dashboard UI is **module-agnostic**. After backend ships, verify only:

| Check | Expected |
|-------|----------|
| Overview **Projects** card | Live `avgDataProgress` > 0 when fleet has partial projects; not forced 0% |
| Select **Projects** | Detail KPIs use `summary.current` + `daily[]` with real values |
| Progress gained chart | Bars from `daily[].progressPointsGained` |
| Employers / universities / certifications | Still `0%` avg, no pp delta pill |
| `module=candidates` | Unchanged (regression) |

**Files (verify, do not rewrite unless broken):**

- `src/components/dashboard/dashboard-data-progress-section.tsx`
- `src/lib/utils/data-progress-metrics.ts`
- `src/lib/services/data-progress-api.ts`

---

## 7. API diff (before vs after)

### Before (current production)

```json
{
  "module": "projects",
  "summary": {
    "current": { "totalDataProgress": 0, "avgDataProgress": 0, "recordCount": 9 },
    "modules": [
      { "module": "projects", "avgDataProgress": 0, "avgDataProgressDelta": null, "available": false }
    ]
  },
  "daily": [{ "totalDataProgress": 0, "avgDataProgress": 0, "progressPointsGained": 0 }]
}
```

### After (Phase 2 target)

```json
{
  "module": "projects",
  "summary": {
    "current": { "totalDataProgress": 412, "avgDataProgress": 45.8, "recordCount": 9 },
    "modules": [
      { "module": "projects", "avgDataProgress": 45.8, "avgDataProgressDelta": 1.2, "available": true }
    ]
  },
  "daily": [
    { "date": "2026-07-08", "totalDataProgress": 412, "avgDataProgress": 45.8, "progressPointsGained": 15, "newRecords": 0 }
  ]
}
```

Values illustrative — must match live `projects.data_progress_percentage` fleet math.

---

## 8. Implementation checklist

- [ ] Live projects fleet query uses `projects.data_progress_percentage`
- [ ] `summary.modules[projects].available = true`
- [ ] `summary.current` correct when `module=projects`
- [ ] Projects rows in `dashboard_module_daily_snapshots` (150-day backfill if missing)
- [ ] Today upsert on project mutations (P2-D4)
- [ ] Hosted job includes `projects` module
- [ ] `daily[]` expansion unchanged; projects series non-zero when data exists
- [ ] `avgDataProgressDelta` for projects when `to = today`; H1 null otherwise
- [ ] C5 unchanged for employers / universities / certifications
- [ ] Candidates regression pass
- [ ] Smoke tests (§9)
- [ ] Update `DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md` §1 / §14 when done (optional)

---

## 9. Smoke tests

Base: `http://localhost:5103` (or prod EC2 after deploy).

```http
GET /api/dashboard/data-progress?module=projects&from=2026-07-08&to=2026-07-08&timezone=Asia/Karachi
```

| # | Assert |
|---|--------|
| 1 | `summary.modules[projects].available === true` |
| 2 | `summary.current.totalDataProgress` = `ROUND(SUM(data_progress_percentage))` over active projects (cross-check DB or `GET /api/projects`) |
| 3 | `summary.current.avgDataProgress` ≈ total / recordCount (1 decimal) |
| 4 | `daily[]` length = 7 for Today preset (trailing chart) |
| 5 | `summary.modules[employers].available === false` and `avgDataProgress === 0` (C5) |
| 6 | `GET ...?module=candidates&...` unchanged vs pre-deploy baseline |
| 7 | Edit a project (increase %) → `summary.current` increases on next dashboard fetch |

---

## 10. Agent prompt (backend)

```
Implement Dashboard Projects Data Progress Phase 2 per
docs/DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md,
docs/DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md, and
docs/DASHBOARD_REQUIREMENTS_LOCKED.md.

Enable projects on GET /api/dashboard/data-progress:
- summary.modules[projects].available = true
- Aggregate projects.data_progress_percentage like candidates (fleet sum, avg, snapshots)
- Backfill/populate dashboard_module_daily_snapshots for module=projects (150 days, C4)
- Today upsert on project create/update/delete after entity progress recalc (C3, P2-D4)
- avgDataProgressDelta (pp) + H1 null when to !== today for projects

Keep employers, universities, certifications available=false (C5).
Do not change API route or response shape. Candidates must not regress.
No new frontend dashboard features — API flip only.

After implementation, run smoke tests in §9 of DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md.
```

---

## 11. Deploy order

1. Deploy **backend** to EC2 (migrations if any, snapshot backfill for projects, recalc hooks).
2. Run admin entity backfill if needed: `POST /api/admin/projects/recalculate-data-progress`.
3. Smoke test §9 on EC2.
4. **Frontend:** commit/deploy only if doc updates; UI already supports projects module.
5. Prod QA: dashboard → select **Projects** → KPIs/chart match projects list `%` trends.

---

## 12. Related documents

| Document | Purpose |
|----------|---------|
| [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) | Full dashboard API contract |
| [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) | Stock vs flow, chart rules |
| [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Entity project scoring |
| [`PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md`](./PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md) | Entity Phase 1 backend |
| [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) | Projects list Phase 1 frontend |
