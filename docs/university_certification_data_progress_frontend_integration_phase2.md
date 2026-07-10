# Dashboard Universities & Certifications Data Progress — Frontend Integration Guide (Phase 2)

**Status:** Not implemented — verify when backend Phase 2 ships.  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Dashboard only — **verify and fix** if anything blocks `universities` or `certifications`; **no new dashboard features** unless broken.

**Depends on:**

- Entity Phase 1 — [`university_data_progress_frontend_integration.md`](./university_data_progress_frontend_integration.md), [`certification_data_progress_frontend_integration.md`](./certification_data_progress_frontend_integration.md)
- Backend Phase 2 — [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md)

**Parent contracts (unchanged API shape):**

- [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md)
- [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md)
- [`project_data_progress_frontend_integration_phase2.md`](./project_data_progress_frontend_integration_phase2.md) — same verify pattern as projects

---

## 1. Summary

| Item | Before Phase 2 | After Phase 2 |
|------|----------------|---------------|
| `summary.modules[universities].available` | `false` | **`true`** |
| `summary.modules[certifications].available` | `false` | **`true`** |
| Universities / certifications overview avg % | Forced `0.0%` (C5) | **Live fleet avg** |
| Detail KPIs / chart | Zeros / placeholder | **Real values** — same UX as Candidates/Projects |
| **Employers** | `available: false` | **Unchanged** |
| List tables | Already have `dataProgressPercentage` (Phase 1) | **Unchanged** |

**Key point:** Dashboard UI is **module-agnostic**. Phase 2 is an **API flip** for two modules — same as projects Phase 2.

---

## 2. Progress-enabled modules (after Phase 2)

| Module | `available` |
|--------|-------------|
| `candidates` | `true` |
| `projects` | `true` |
| `universities` | **`true`** |
| `certifications` | **`true`** |
| `employers` | `false` |

---

## 3. Frontend behaviour

Drive all progress UI from **`summary.modules[].available`**, not module name:

```typescript
const isProgressModule = (m: DataProgressModuleSummary) => m.available
```

| UI area | When `available: true` | When `available: false` |
|---------|------------------------|-------------------------|
| Overview avg % | `avgDataProgress` | **`0.0%`** |
| Overview delta pill | `avgDataProgressDelta` pp when not `null` | **—** |
| Detail KPIs / chart | Live API values | Zeros |

**Metric classes** (unchanged): stock (fleet total, avg %) vs flow (progress gained, chart) — see [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md).

---

## 4. First-deploy chart shape (expected)

After Phase 2 first ships, historical `daily[]` may show **zeros** then a **jump on today** (entity `%` backfill + snapshot history). **Not a frontend bug.** See projects Phase 2 doc §5.

---

## 5. Files to verify

| File | Check |
|------|-------|
| `src/components/dashboard/dashboard-data-progress-section.tsx` | Uses `available`, not `module === 'candidates'` |
| `src/lib/services/data-progress-api.ts` | Single fetch; `module=universities` / `certifications` |
| `src/lib/utils/data-progress-metrics.ts` | Module-agnostic KPI helpers |
| `src/types/data-progress.ts` | Includes both modules |

**Do not change** (Phase 1 entity scope):

- `universities-table.tsx`, `certifications-table.tsx`
- `universities-filter-dialog.tsx`, `certifications-filter-dialog.tsx`

---

## 6. Checklist

- [ ] `GET ...?module=universities` → `available: true`, non-zero KPIs when fleet has data
- [ ] `GET ...?module=certifications` → same
- [ ] Employers overview still **0.0%** / delta **—**
- [ ] Candidates + projects **regression** unchanged
- [ ] Last 7 days: progress gained = sum `daily[].progressPointsGained` (may match total on first deploy)
- [ ] Historical `to < today`: overview delta **—** (H1)

---

## 7. Smoke tests

1. `/` → **Universities** → overview avg matches fleet; detail KPIs non-zero if data exists  
2. `/` → **Certifications** → same  
3. **Employers** → 0% avg, no delta  
4. **Candidates** / **Projects** → unchanged  
5. Custom date ending today → delta pill shows pp change  

---

## 8. Agent prompt (frontend Phase 2)

```
Verify Dashboard Universities & Certifications Data Progress Phase 2 per
docs/university_certification_data_progress_frontend_integration_phase2.md.

Backend has set summary.modules[universities].available and
summary.modules[certifications].available to true. Confirm dashboard at /
shows live avg %, KPIs, and chart for both modules. Employers must remain
available:false (0% avg). No module === 'candidates' guards. Fix only if
something blocks real data. No new dashboard features. No list table changes.
```
