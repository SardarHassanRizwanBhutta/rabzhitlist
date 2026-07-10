# Dashboard — Locked Product Requirements (v1)

**Status:** Locked for backend contract (2026-06).  
**Audience:** Product, frontend, backend.  
**Backend handoff:** [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md)

---

## 1. UI scope

Single dashboard page (`/`) with:

| Area | Content |
|------|---------|
| **Toolbar** | Presets: Today, Last 7 days, Last 30 days; calendar range (max **90** inclusive days); refresh |
| **Overview row** | Five module cards: Candidates, Employers, Projects, Universities, Certifications |
| **Detail row** | Two KPI cards for **selected module**: Total data progress, Progress gained |
| **Chart** | Progress gained daily bar chart for selected module |

**Removed / out of scope (v1):**

- Standalone Intake section (intake merged into overview cards)
- Records improved KPI (deferred)
- `% of max` subline on Total data progress (redundant with avg completion)
- Dual-axis total + gained trend chart (replaced by Progress gained bar chart only)

---

## 2. Metric classes

| Class | Examples | Follows date filter? |
|-------|----------|----------------------|
| **Stock (current fleet)** | Fleet count, total progress pts, avg completion % | **No** — always as of `generatedAt` / today |
| **Flow (period activity)** | +N new, progress gained, chart bars | **Yes** — selected `from`→`to` |

---

## 3. Overview cards (all modules)

| Field | Rule |
|-------|------|
| **Avg completion %** | Unweighted mean of active records’ completeness (0–100). **Always as of now** (`generatedAt`). |
| **Total count** | Active fleet (`deleted_at IS NULL`). **Fixed** — not affected by filter. |
| **+N new** | Count of records whose `created_at` falls in selected window (inclusive calendar days in `timezone`). **Dynamic.** Intake semantics: **ignore `deleted_at`** for creation-day count (Option A). |
| **Delta pill** | **Percentage points (pp):** `avg(today) − avg(end of prior equal-length window)`. **Only when `to` = today** in `timezone`; otherwise **`null`** (UI shows —). |
| **Delta tooltip** | Contextual to filter length, e.g. “Change vs prior 7 days” (not “vs yesterday” when range ≠ 1 day). |
| **Today / 1-day filter** | Prior window = **yesterday only** → `avg(today) − avg(yesterday)`. |

### Prior equal-length window (shared formula)

For selection `from`..`to` with `lenDays` inclusive:

```
prevTo   = calendar day before from
prevFrom = prevTo − (lenDays − 1) days
```

**Example:** Today = 2 Jul 2026, Last 7 days → current 26 Jun–2 Jul, prior 19 Jun–25 Jun:

```
delta pp = avg(2 Jul) − avg(25 Jun)
```

---

## 4. Detail KPI — Total data progress

| Field | Rule |
|-------|------|
| **Hero** | Fleet **total progress points** as of **now** (today), not historical `to`. |
| **Subline** | `Across {N} {recordNoun}` — fleet **record count** (same as overview total). |
| **Delta pill** | **Relative %:** `(total at end of to − total at end of prior window) / prior × 100`. When `to` = today, compares today vs prior window end. When historical `to`, hero stays **now** but delta uses **end of selected `to`** vs prior window (per Q3-A). |
| **Sparkline** | `totalDataProgress` from `daily[]` over **chart window** (see §6). |

**Avg completion** is shown only on overview cards (not duplicated here).

---

## 5. Detail KPI — Progress gained

| Field | Rule |
|-------|------|
| **Hero** | Sum of `daily[].progressPointsGained` over selected `from`→`to`. |
| **Subline** | `vs {N} pts last period` — sum over immediately preceding equal-length window. |
| **Delta pill** | **Relative %:** `(current period sum − prior period sum) / prior sum × 100`; hidden if prior = 0 or missing. |
| **Sparkline** | Daily `progressPointsGained` over chart window. |

---

## 6. Progress gained chart

| Filter | KPI header total | Chart bars (X-axis) |
|--------|------------------|------------------------|
| Multi-day | Sum over **filter** window | One bar per day in **filter** window |
| Single-day / Today | Sum for **that day only** | **Trailing 7 days** ending on selected day; highlight selected day |

Chart is the visual breakdown of the **Progress gained** metric (daily `progressPointsGained`).

---

## 7. Historical ranges (`to` < today)

| Metric | Behavior |
|--------|----------|
| +N new, Progress gained, chart | Scoped to selected past window |
| Fleet total, avg completion hero, total progress hero | **Current** values (today), not as-of `to` |
| Overview avg delta (pp) | **`null`** (H1 — show —) |

---

## 8. Per-record completeness (candidates — implemented)

- Backend field: `candidates.data_progress_percentage` (0–100).
- Frontend **does not** calculate completeness.
- Module avg: `SUM(data_progress_percentage) / COUNT(active records)` ≡ `totalDataProgress / recordCount` when each record is 0–100 points.

---

## 9. API (v1 — locked)

| Endpoint | Role |
|----------|------|
| `GET /api/dashboard/data-progress` | **Only dashboard API.** Progress (candidates v1) + `summary.modules` for all five modules (`recordCount`, `newInPeriod`, avg for candidates only). |
| ~~`GET /api/dashboard/intake`~~ | **Remove on data-progress go-live** (C1). Logic migrated into data-progress service. |

Frontend: **one fetch** per date/module change. Remove intake client and `intakeLive` overlay.

### Overview UI for non-candidate modules (C5)

When `available: false`: show **`0.0%` avg completion**, `avgDataProgressDelta: null` (—), live `recordCount` and `newInPeriod` from API.

---

## 10. Deferred

- Records improved KPI and `recordsImproved` in API responses (optional in daily rows later)
- `GET /api/dashboard/metrics` unified endpoint
- Authentication on dashboard APIs (v1: none, same as intake)

---

## Related documents

| Document | Purpose |
|----------|---------|
| [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend implementation contract (includes legacy intake migration — Appendix A) |
| [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Project entity progress (Phase 1); dashboard projects module Phase 2 |
| [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md) | Dashboard projects module (Phase 2 backend) |
| [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | University entity progress (Phase 1) |
| [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Certification entity progress (Phase 1) |
| [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md) | Dashboard universities + certifications (Phase 2) |
| [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md) | Per-candidate progress (entity level) |
