# Dashboard Employers Data Progress — Frontend Integration Guide (Phase 2)

**Status:** Not implemented — verify when backend Phase 2 ships.  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Dashboard only — **verify and fix** if anything blocks `employers`; **no new dashboard features** unless broken.

**Depends on:**

- Entity Phase 1 — [`employer_data_progress_frontend_integration.md`](./employer_data_progress_frontend_integration.md)
- Backend Phase 2 — [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md)

**Reference:** [`university_certification_data_progress_frontend_integration_phase2.md`](./university_certification_data_progress_frontend_integration_phase2.md)

---

## 1. Summary

| Item | Before Phase 2 | After Phase 2 |
|------|----------------|---------------|
| `summary.modules[employers].available` | `false` | **`true`** |
| Employers overview avg % | Forced `0.0%` (C5) | **Live fleet avg** |
| Detail KPIs / chart | Zeros | **Real values** |
| List tables | Already have `dataProgressPercentage` (Phase 1) | **Unchanged** |

**Key point:** Dashboard UI is module-agnostic. Phase 2 is an **API flip**.

---

## 2. Progress-enabled modules (after Phase 2)

| Module | `available` |
|--------|-------------|
| `candidates` | `true` |
| `projects` | `true` |
| `universities` | `true` |
| `certifications` | `true` |
| `employers` | **`true`** |

---

## 3. Frontend behaviour

Drive all progress UI from **`summary.modules[].available`**, not module name.

| UI area | When `available: true` |
|---------|------------------------|
| Overview avg % | `avgDataProgress` |
| Overview delta pill | `avgDataProgressDelta` when not `null` |
| Detail KPIs / chart | Live API values |

First-deploy chart: historical zeros then jump on today — **expected**.

---

## 4. Files to verify

| File | Check |
|------|-------|
| `dashboard-data-progress-section.tsx` | Uses `available` |
| `data-progress-api.ts` | `module=employers` |
| `data-progress-metrics.ts` | Module-agnostic |
| `types/data-progress.ts` | Includes `employers` |

**Do not change** employers list/table (Phase 1).

---

## 5. Checklist

- [ ] Overview **Employers** live avg (not 0%)
- [ ] Select Employers → detail KPIs match `summary.current`
- [ ] Chart non-zero when API daily gains non-zero
- [ ] Candidates / projects / universities / certifications regression
- [ ] Historical `to < today` → delta **—** (H1)

---

## 6. Agent prompt (frontend Phase 2)

```
Verify Dashboard Employers Data Progress Phase 2 per
docs/employer_data_progress_frontend_integration_phase2.md.

Backend has set summary.modules[employers].available = true. Confirm dashboard at /
shows live avg %, KPIs, and chart for Employers. Drive UI from available only.
Fix only if something blocks real data. No new dashboard features. No list table changes.
```
