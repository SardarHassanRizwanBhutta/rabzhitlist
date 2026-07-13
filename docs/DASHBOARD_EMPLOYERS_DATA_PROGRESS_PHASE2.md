# Dashboard Employers Data Progress — Phase 2 Backend Handoff

**Status:** Backend Phase 2 **implemented** (2026-07-13). Smoke-tested on local `:5103`.  
**Audience:** Backend AI agent / engineer.  
**Depends on:** Entity Phase 1 **shipped** (`employers.data_progress_percentage`) — [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md).

**Parent contracts (unchanged API shape):**

- [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md)
- [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md)
- [`EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)

**Frontend:** No new dashboard components — verify existing UI when API flips.

---

## 1. Summary

| Item | Phase 2 change |
|------|----------------|
| Progress-enabled modules | **All five:** candidates, projects, universities, certifications, **employers** (`available: true`) |
| Progress source | `employers.data_progress_percentage` |
| Snapshots | Backfill **`module = employers`** (C3/C4); today upsert on employer/location/layoff mutations |
| API route | **Same** `GET /api/dashboard/data-progress` |
| Frontend | Select **Employers** → same KPIs/chart as other modules |
| Deploy | **Backend first** (EC2), then frontend verify |

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **E2-D1** | `summary.modules[employers].available = true` when Phase 2 ships |
| **E2-D2** | Fleet aggregation identical to candidates/projects/universities |
| **E2-D3** | Snapshot rules identical: today upsert (C3), 150-day backfill (C4), `Asia/Karachi` |
| **E2-D4** | Employer / location / layoff mutations → today snapshot upsert for `module=employers` |
| **E2-D5** | First-deploy flat history then jump on today — expected |
| **E2-D6** | Frontend verification only |
| **E2-D7** | Deploy backend before frontend |

---

## 3. Progress aggregation

```
progressPoints       = employers.data_progress_percentage
recordCount          = COUNT(active employers)
totalDataProgress    = ROUND(SUM(progressPoints), 0)
avgDataProgress      = ROUND(totalDataProgress / recordCount, 1)   // 0 if count=0
```

Same `daily[]` / `summary.modules[employers]` / H1 delta rules as other progress modules.

---

## 4. `available` flag

```csharp
bool IsProgressModule(module) =>
    module is Candidates or Projects or Universities or Certifications or Employers;
```

---

## 5. Frontend verification

**Guide:** [`employer_data_progress_frontend_integration_phase2.md`](./employer_data_progress_frontend_integration_phase2.md)

Drive UI from `available` only. No list-table changes.

---

## 6. Backend checklist

- [x] `IsProgressModule` includes employers
- [x] Snapshot backfill 150 days for `module=employers` (Option A: historical zeros left as-is)
- [x] Today upsert on entity mutations (incl. location/layoff) and DELETE
- [x] `avgDataProgressDelta` + H1 null when `to !== today`
- [x] Regression: other modules unchanged
- [x] Smoke tests §7 (2026-07-13)

---

## 7. Smoke tests

```http
GET /api/dashboard/data-progress?module=employers&from={today}&to={today}&timezone=Asia/Karachi
```

- `summary.modules[employers].available === true`
- `summary.current` matches fleet sum/avg
- Candidates / projects / universities / certifications regression OK

---

## 8. Agent prompt (backend Phase 2)

```
Implement Dashboard Employers Data Progress Phase 2 per
docs/DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md.

Extend GET /api/dashboard/data-progress: set summary.modules[employers].available = true.
Aggregate employers.data_progress_percentage like other progress modules. Snapshot
backfill (150 days) + today upsert on employer/location/layoff mutations.
avgDataProgressDelta (pp) when to=today; H1 null otherwise.

Do not add new dashboard routes. Deploy backend before frontend verification.
```

---

## 9. Related documents

| Document | Purpose |
|----------|---------|
| [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md) | Entity Phase 1 |
| [`employer_data_progress_frontend_integration_phase2.md`](./employer_data_progress_frontend_integration_phase2.md) | Frontend verify |
| [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md) | Prior Phase 2 pattern |
