# Dashboard Projects Data Progress — Frontend Integration Guide (Phase 2)

**Status:** Backend Phase 2 **implemented** (2026-07).  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Dashboard only — **verify and fix** if anything blocks `projects`; **no new dashboard features** unless broken.

**Depends on:**

- Entity Phase 1 shipped — [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) (projects table `%` column)
- Backend Phase 2 — [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md)

**Parent contracts (unchanged API shape):**

- [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md)
- [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md)

---

## 1. Summary

| Item | Phase 1 (before) | Phase 2 (now) |
|------|------------------|---------------|
| Dashboard API | `GET /api/dashboard/data-progress` | **Same route** — no new endpoint |
| `summary.modules[projects].available` | `false` | **`true`** |
| Projects overview avg % | Forced `0.0%` (C5) | **Live fleet avg** from API |
| Projects detail KPIs / chart | Zeros / placeholder | **Real values** — same UX as Candidates |
| Employers / universities / certifications | `available: false` | **Unchanged** (C5) |
| Projects list table (`GET /api/projects`) | Already has `dataProgressPercentage` | **Unchanged** — no list work in Phase 2 |
| Client-side scoring | Never | **Never** |

**Key point:** The dashboard UI was built **module-agnostic** for Candidates. Phase 2 is an **API flip** — the frontend should already work when `available: true`. This doc tells you what to verify and what **not** to change.

---

## 2. What changed on the API (only this)

### 2.1 Progress-enabled modules

| Module | `available` | Progress fields |
|--------|-------------|-----------------|
| `candidates` | `true` | Live fleet sum / avg / daily series |
| `projects` | **`true`** (new) | Live fleet sum / avg / daily series |
| `employers` | `false` | `avgDataProgress: 0`, `avgDataProgressDelta: null` |
| `universities` | `false` | Same |
| `certifications` | `false` | Same |

### 2.2 Request (unchanged)

```http
GET /api/dashboard/data-progress?module={module}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&timezone=Asia/Karachi
```

| Param | Notes |
|-------|-------|
| `module` | `candidates` \| `employers` \| `projects` \| `universities` \| `certifications` |
| `from` / `to` | Inclusive; max 90 days |
| `timezone` | Default `Asia/Karachi` |

**One fetch per** module / date-range change. Do **not** add a second dashboard API call.

### 2.3 Response shape (unchanged)

Types match existing `src/types/data-progress.ts` (or equivalent). **No new fields.** Reuse `DataProgressResponse`, `DataProgressModuleSummary`, `DataProgressDailyRow`.

---

## 3. Verified API example (`module=projects`)

Local smoke test (2026-07-08, `Asia/Karachi`):

```json
{
  "module": "projects",
  "generatedAt": "2026-07-08T16:08:25.5629201Z",
  "timezone": "Asia/Karachi",
  "range": { "from": "2026-07-08", "to": "2026-07-08" },
  "summary": {
    "current": {
      "totalDataProgress": 589,
      "avgDataProgress": 65.4,
      "recordCount": 9
    },
    "today": { "progressPointsGained": 589 },
    "modules": [
      {
        "module": "candidates",
        "avgDataProgress": 8.9,
        "avgDataProgressDelta": 0.0,
        "recordCount": 63,
        "newInPeriod": 0,
        "available": true
      },
      {
        "module": "employers",
        "avgDataProgress": 0,
        "avgDataProgressDelta": null,
        "recordCount": 164,
        "newInPeriod": 0,
        "available": false
      },
      {
        "module": "projects",
        "avgDataProgress": 65.4,
        "avgDataProgressDelta": 65.4,
        "recordCount": 9,
        "newInPeriod": 0,
        "available": true
      },
      {
        "module": "universities",
        "avgDataProgress": 0,
        "avgDataProgressDelta": null,
        "recordCount": 55,
        "newInPeriod": 0,
        "available": false
      },
      {
        "module": "certifications",
        "avgDataProgress": 0,
        "avgDataProgressDelta": null,
        "recordCount": 79,
        "newInPeriod": 0,
        "available": false
      }
    ]
  },
  "daily": [
    { "date": "2026-07-02", "newRecords": 0, "totalDataProgress": 0, "progressPointsGained": 0, "avgDataProgress": 0.0, "recordCount": 9 },
    { "date": "2026-07-03", "newRecords": 0, "totalDataProgress": 0, "progressPointsGained": 0, "avgDataProgress": 0.0, "recordCount": 9 },
    { "date": "2026-07-04", "newRecords": 0, "totalDataProgress": 0, "progressPointsGained": 0, "avgDataProgress": 0.0, "recordCount": 9 },
    { "date": "2026-07-05", "newRecords": 0, "totalDataProgress": 0, "progressPointsGained": 0, "avgDataProgress": 0.0, "recordCount": 9 },
    { "date": "2026-07-06", "newRecords": 0, "totalDataProgress": 0, "progressPointsGained": 0, "avgDataProgress": 0.0, "recordCount": 9 },
    { "date": "2026-07-07", "newRecords": 0, "totalDataProgress": 0, "progressPointsGained": 0, "avgDataProgress": 0.0, "recordCount": 9 },
    { "date": "2026-07-08", "newRecords": 0, "totalDataProgress": 589, "progressPointsGained": 589, "avgDataProgress": 65.4, "recordCount": 9 }
  ]
}
```

**Sanity checks:**

- `589 ÷ 9 ≈ 65.4` — fleet avg matches `summary.current.avgDataProgress`
- `daily.length === 7` for **Today** preset (trailing 7-day chart)
- `employers.available === false` with `avgDataProgress === 0`

---

## 4. Frontend behaviour (drive everything from `available`)

### 4.1 Rule: never hardcode module progress availability

```typescript
// ✅ Correct — trust API
const isProgressModule = (m: DataProgressModuleSummary) => m.available

// ❌ Wrong — do not gate on module name
const isProgressModule = (m) => m.module === "candidates"
```

Apply `available` consistently for:

| UI area | When `available: true` | When `available: false` (C5) |
|---------|------------------------|------------------------------|
| Overview card avg % | Show `avgDataProgress` (1 decimal) | Show **`0.0%`** |
| Overview delta pill | Show `avgDataProgressDelta` pp when not `null` | Show **—** (`null`) |
| Detail Total data progress | `summary.current.totalDataProgress` + sparkline | Zeros / no progress semantics |
| Detail Progress gained | Sum `daily[].progressPointsGained` in filter window | Zeros |
| Bar chart | `daily[].progressPointsGained` | Flat zeros |

**Remove** any Projects-specific “coming soon”, placeholder, or `if (module !== 'candidates')` progress guards **if** they prevent real data from showing.

### 4.2 Metric classes (unchanged — same as Candidates)

| Class | Examples | Follows date filter? |
|-------|----------|----------------------|
| **Stock** | Fleet count, total progress pts, avg completion % | **No** — always as of `generatedAt` / today |
| **Flow** | +N new, progress gained, chart bars | **Yes** — selected `from`→`to` |

See [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) §2–§7.

### 4.3 Overview card — Projects

| Field | Source |
|-------|--------|
| Avg completion % | `summary.modules.find(m => m.module === 'projects').avgDataProgress` |
| Total count | `.recordCount` |
| +N new | `.newInPeriod` |
| Delta pill (pp) | `.avgDataProgressDelta` — only when `to === today`; else `null` → **—** |

### 4.4 Detail row — when Projects selected

| KPI | Source |
|-----|--------|
| **Total data progress** hero | `summary.current.totalDataProgress` |
| Subline | `Across {summary.current.recordCount} projects` |
| **Progress gained** hero | Sum of `daily[].progressPointsGained` over user `from`..`to` |
| Chart | Daily `progressPointsGained`; **Today** preset = trailing 7 days ending on selected day |

### 4.5 `avgDataProgressDelta` (H1)

- Populated when **`to` = today** in timezone: live avg now − frozen avg at end of prior equal-length window.
- **`null`** when `to < today` → UI shows **—** (not `0`).
- Applies to **both** `candidates` and `projects` when `available: true`.

### 4.6 Cross-check with projects list (optional QA)

Fleet avg on dashboard should be **close to** unweighted mean of `dataProgressPercentage` on active projects from `GET /api/projects` (not identical row-by-row if list is paginated — compute from full fleet or trust API).

```
dashboard avg ≈ ROUND(SUM(dataProgressPercentage) / COUNT, 1)
dashboard total ≈ ROUND(SUM(dataProgressPercentage), 0)
```

Do **not** recompute on the client for display — use dashboard API values.

---

## 5. First-deploy chart shape (expected — not a frontend bug)

After Phase 2 first ships, historical `daily[]` days may show **`totalDataProgress: 0`** while **today** jumps to the live fleet total. This happens because:

1. Entity `data_progress_percentage` was backfilled recently.
2. Snapshot backfill uses stored % at EOD; past days were 0 before backfill.

**UI:** No special handling required. After a few days of edits, the chart shows normal day-over-day bars. Do **not** fabricate historical bars on the client.

---

## 6. Files to verify (do not rewrite unless broken)

| File | What to check |
|------|----------------|
| `src/components/dashboard/dashboard-data-progress-section.tsx` | Module selection, overview cards, detail KPIs, chart — all use `available`, not `module === 'candidates'` |
| `src/lib/services/data-progress-api.ts` | Single `fetchDataProgress`; passes `module=projects`; no intake overlay |
| `src/lib/utils/data-progress-metrics.ts` | Delta / sum helpers work for any `available: true` module |
| `src/types/data-progress.ts` | Types already include `projects` in `DataProgressModule` |

**Do not change** (Phase 1 scope, already done):

- `src/components/projects-table.tsx`
- `src/components/projects-filter-dialog.tsx`
- `src/lib/services/projects-api.ts` (list filters / column)

---

## 7. Anti-patterns (do NOT do these)

| Anti-pattern | Why |
|--------------|-----|
| Compute fleet avg from `GET /api/projects` for dashboard | Backend owns aggregation; duplicates logic |
| Hardcode `projects.available = false` | Blocks Phase 2 |
| Show “Coming soon” on Projects overview when `available: true` | Stale Phase 1 placeholder |
| Add `GET /api/dashboard/intake` | Removed (C1); data lives in `summary.modules` |
| New dashboard endpoint or response fields | Out of scope |
| Build project breakdown panel in dashboard | Entity breakdown is `GET /api/projects/{id}/data-progress` (detail dialog — separate future work) |

---

## 8. Deploy order

1. **Backend** deployed first (Phase 2 on EC2).
2. Optional ops: `POST /api/admin/projects/recalculate-data-progress` if `%` columns empty on prod.
3. **Frontend:** redeploy only if you fixed a hardcoded guard; otherwise verification-only.
4. QA: Dashboard → select **Projects** → compare with API smoke test.

---

## 9. Verification checklist

| # | Task | Pass criteria |
|---|------|----------------|
| 1 | Overview **Projects** card | Shows live `avgDataProgress` (e.g. `65.4%`), not `0.0%` |
| 2 | Select **Projects** | Detail KPIs match `summary.current` |
| 3 | Progress gained chart | Non-zero bars when API `daily[].progressPointsGained` non-zero |
| 4 | Edit project ↑ `%` | Dashboard `summary.current.totalDataProgress` increases on refresh |
| 5 | **Candidates** regression | Unchanged behaviour vs pre–Phase 2 |
| 6 | **Employers** / **Universities** / **Certifications** | Still `0.0%` avg, delta **—**, `available: false` |
| 7 | Historical range (`to < today`) | Overview delta **—** for projects (H1) |
| 8 | Today / Last 7 / Last 30 presets | Chart window rules unchanged (§6 of locked requirements) |

---

## 10. Smoke tests (manual)

Base: `http://localhost:5103` (or prod API after deploy).

```http
GET /api/dashboard/data-progress?module=projects&from=2026-07-08&to=2026-07-08&timezone=Asia/Karachi
```

| # | Assert |
|---|--------|
| 1 | `summary.modules` entry for `projects` has `available === true` |
| 2 | `summary.current.totalDataProgress` > 0 when fleet has partial projects |
| 3 | `summary.current.avgDataProgress` ≈ total / recordCount (1 decimal) |
| 4 | `daily.length === 7` for Today preset |
| 5 | `employers.available === false`, `avgDataProgress === 0` |
| 6 | `module=candidates` same request shape — no regression |
| 7 | After PUT project, dashboard fetch shows increased `summary.current` |

**UI mirror:** Repeat checks on `/` dashboard with Projects selected.

---

## 11. Relationship to Phase 1 frontend doc

[`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) §5.4 said *“Skip dashboard projects progress”* — **superseded by this document** for dashboard only. Phase 1 list/filter/breakdown work remains valid and unchanged.

---

## 12. Related documents

| Document | Purpose |
|----------|---------|
| [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md) | Backend Phase 2 handoff |
| [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) | Full dashboard API contract |
| [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) | KPI / chart semantics |
| [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) | Projects list Phase 1 |
| [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Entity scoring rules |

---

## 13. Agent prompt (frontend)

```
Integrate Dashboard Projects Data Progress Phase 2 per
docs/project_data_progress_frontend_integration_phase2.md,
docs/DASHBOARD_REQUIREMENTS_LOCKED.md, and
docs/DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md.

Backend already returns summary.modules[projects].available = true with live
progress fields on GET /api/dashboard/data-progress.

Tasks:
- VERIFY dashboard works for Projects module (overview card, detail KPIs, chart).
- Drive all progress UI from summary.modules[].available — NOT hardcoded module names.
- Remove any stale "coming soon" or candidates-only guards for projects if present.
- Do NOT add new dashboard APIs, types, or features unless something is broken.
- Do NOT change projects list/table/filter (Phase 1 — already done).
- Do NOT compute fleet progress on the client.
- Confirm employers / universities / certifications still show 0% (C5).
- Regression-test Candidates dashboard unchanged.

Run verification checklist §9 and smoke tests §10 when done.
```
