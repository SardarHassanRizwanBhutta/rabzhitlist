# Dashboard Universities & Certifications Data Progress — Frontend Integration Guide (Phase 2)

**Status:** Backend Phase 2 **implemented** (2026-07). Frontend **verified** — no code changes required (module-agnostic UI).  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Dashboard only — **verify and fix** if anything blocks `universities` / `certifications`; **no new dashboard features** unless broken.

**Depends on:**

- Entity Phase 1 — [`university_certification_data_progress_frontend_integration.md`](./university_certification_data_progress_frontend_integration.md)
- Backend Phase 2 — [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md)

**Parent contracts (unchanged API shape):**

- [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md)
- [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md)

**Reference:** [`project_data_progress_frontend_integration_phase2.md`](./project_data_progress_frontend_integration_phase2.md)

---

## 1. Summary

| Item | Phase 1 (before) | Phase 2 (now) |
|------|------------------|---------------|
| Dashboard API | `GET /api/dashboard/data-progress` | **Same route** — no new endpoint |
| `summary.modules[universities].available` | `false` | **`true`** |
| `summary.modules[certifications].available` | `false` | **`true`** |
| Overview avg % (U / C) | Forced `0.0%` (C5) | **Live fleet avg** from API |
| Detail KPIs / chart | Zeros | **Real values** — same UX as Candidates/Projects |
| **Employers** | `available: false` | **Unchanged** (still disabled) |
| List tables | Already have `dataProgressPercentage` | **Unchanged** — no list work in Phase 2 |
| Client-side scoring | Never | **Never** |

**Key point:** Dashboard UI is **module-agnostic**. Phase 2 is an **API flip** — verify that `available: true` drives progress UI for universities and certifications.

---

## 2. What changed on the API (only this)

### 2.1 Progress-enabled modules

| Module | `available` | Progress fields |
|--------|-------------|-----------------|
| `candidates` | `true` | Live fleet sum / avg / daily series |
| `projects` | `true` | Live fleet sum / avg / daily series |
| `universities` | **`true`** (new) | Live fleet sum / avg / daily series |
| `certifications` | **`true`** (new) | Live fleet sum / avg / daily series |
| `employers` | `false` | `avgDataProgress: 0`, `avgDataProgressDelta: null` |

### 2.2 Request (unchanged)

```http
GET /api/dashboard/data-progress?module={module}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&timezone=Asia/Karachi
```

| Param | Notes |
|-------|-------|
| `module` | `candidates` \| `employers` \| `projects` \| `universities` \| `certifications` |
| `from` / `to` | Inclusive; max 90 days |
| `timezone` | Default `Asia/Karachi` |

**One fetch** per module / date-range change.

### 2.3 Response shape (unchanged)

Reuse existing `DataProgressResponse` types. **No new fields.**

---

## 3. Verified API example (local, 2026-07-10, `Asia/Karachi`)

### Universities (`module=universities`, Today)

| Field | Value |
|-------|-------|
| `summary.current` | `totalDataProgress: 4800`, `avgDataProgress: 87.3`, `recordCount: 55` |
| `universities.available` | `true` |
| `universities.avgDataProgressDelta` | `87.3` (pp vs prior window — first-deploy jump) |
| `employers.available` | `false`, `avgDataProgress: 0` |
| `daily` | 7 rows; Jul 4–9 zeros; Jul 10 → 4800 gained |

### Certifications (`module=certifications`, Today)

| Field | Value |
|-------|-------|
| `summary.current` | `totalDataProgress: 7900`, `avgDataProgress: 100`, `recordCount: 79` |
| `certifications.available` | `true` |
| `certifications.avgDataProgressDelta` | `100.0` |
| `daily` | 7 rows; historical zeros then today jump |

---

## 4. Frontend behaviour (drive everything from `available`)

```typescript
// ✅ Correct
const isProgressModule = (m: DataProgressModuleSummary) => m.available

// ❌ Wrong — do not gate on module name lists that omit universities/certifications
const isProgressModule = (m) =>
  m.module === "candidates" || m.module === "projects"
```

| UI area | When `available: true` | When `available: false` (employers) |
|---------|------------------------|-------------------------------------|
| Overview card avg % | Show `avgDataProgress` (1 decimal) | Show **`0.0%`** |
| Overview delta pill | Show `avgDataProgressDelta` when not `null` | Show **—** |
| Detail Total data progress | `summary.current.totalDataProgress` | Zeros |
| Detail Progress gained | Sum `daily[].progressPointsGained` in filter | Zeros |
| Bar chart | `daily[].progressPointsGained` | Flat zeros |

**Remove** any stale “coming soon” or candidates/projects-only guards that block universities/certifications.

**Code status (verified):** `dashboard-data-progress-section.tsx` already uses `summary?.available === false ? 0 : summary?.avgDataProgress`. No `module === 'candidates'` progress guards found.

---

## 5. First-deploy chart shape (expected — not a UI bug)

Historical `daily[]` days may show **`totalDataProgress: 0`** while **today** jumps to the live fleet total.

Cause: snapshot rows for universities/certifications already existed from the original dashboard backfill (progress fields were 0). Past days stay frozen; only **today** is upserted with live `%`.

**UI:** No special handling. After a few days of edits, the chart normalizes. Do **not** fabricate historical bars on the client.

---

## 6. Files to verify (do not rewrite unless broken)

| File | What to check | Result |
|------|----------------|--------|
| `src/components/dashboard/dashboard-data-progress-section.tsx` | Uses `available`, not hardcoded module names | Pass |
| `src/lib/services/data-progress-api.ts` | Passes `module=universities` / `certifications` | Pass |
| `src/lib/utils/data-progress-metrics.ts` | Works for any `available: true` module | Pass |
| `src/types/data-progress.ts` | Types already include both modules | Pass |

**Do not change** (Phase 1 — already done):

- Universities / certifications table columns and filters

---

## 7. Anti-patterns (do NOT do these)

| Anti-pattern | Why |
|--------------|-----|
| Hardcode `universities.available = false` | Blocks Phase 2 |
| Only treat `candidates` / `projects` as progress modules | Misses U + C |
| Compute fleet avg from list APIs for dashboard | Backend owns aggregation |
| New dashboard endpoint or response fields | Out of scope |
| Detail modal progress panels | Separate deferred work |

---

## 8. Deploy order

1. **Backend** deployed first (this Phase 2).
2. Optional: ensure entity `%` backfilled (`POST /api/admin/universities/recalculate-data-progress`, `POST /api/admin/certifications/recalculate-data-progress`).
3. **Frontend:** redeploy only if you fixed a hardcoded guard; otherwise verification-only (optional Amplify redeploy for docs).
4. QA: Dashboard → **Universities** and **Certifications** → KPIs/chart match API.

---

## 9. Verification checklist

| # | Task | Pass criteria | Local API |
|---|------|----------------|-----------|
| 1 | Overview **Universities** card | Live `avgDataProgress`, not `0.0%` | 87.3% |
| 2 | Overview **Certifications** card | Live `avgDataProgress`, not `0.0%` | 100% |
| 3 | Select **Universities** | Detail KPIs match `summary.current` | 4800 / 55 |
| 4 | Select **Certifications** | Detail KPIs match `summary.current` | 7900 / 79 |
| 5 | Progress gained chart | Non-zero when API `daily[].progressPointsGained` non-zero | Today bar |
| 6 | **Employers** | Still `0.0%`, delta **—**, `available: false` | Pass |
| 7 | **Candidates** / **Projects** | Unchanged (regression) | 8.9% / 65.4% |
| 8 | Historical range (`to < today`) | Overview delta **—** (H1) | Manual UI |

---

## 10. Smoke tests (manual)

```http
GET /api/dashboard/data-progress?module=universities&from={today}&to={today}&timezone=Asia/Karachi
GET /api/dashboard/data-progress?module=certifications&from={today}&to={today}&timezone=Asia/Karachi
```

| # | Assert | Local |
|---|--------|-------|
| 1 | `universities.available === true` | Pass |
| 2 | `certifications.available === true` | Pass |
| 3 | `employers.available === false`, `avgDataProgress === 0` | Pass |
| 4 | `summary.current` populated for selected module | Pass |
| 5 | `daily.length === 7` for Today preset | Pass |
| 6 | Candidates / projects unchanged | Pass |

**UI mirror:** Repeat on `/` with Universities and Certifications selected.

---

## 11. Related documents

| Document | Purpose |
|----------|---------|
| [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md) | Backend Phase 2 handoff |
| [`university_certification_data_progress_frontend_integration.md`](./university_certification_data_progress_frontend_integration.md) | Entity Phase 1 frontend |
| [`project_data_progress_frontend_integration_phase2.md`](./project_data_progress_frontend_integration_phase2.md) | Prior dashboard verify pattern |
| [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) | KPI / chart semantics |

---

## 12. Agent prompt (frontend)

```
Integrate Dashboard Universities & Certifications Data Progress Phase 2 per
docs/university_certification_data_progress_frontend_integration_phase2.md
and docs/DASHBOARD_REQUIREMENTS_LOCKED.md.

Backend already returns summary.modules[universities].available = true and
summary.modules[certifications].available = true on GET /api/dashboard/data-progress.

Tasks:
- VERIFY dashboard works for Universities and Certifications (overview, detail KPIs, chart).
- Drive all progress UI from summary.modules[].available — NOT hardcoded module names.
- Remove any stale guards that only enable candidates/projects.
- Confirm employers still show 0% (C5).
- Regression-test Candidates and Projects unchanged.
- Do NOT add new dashboard APIs, types, or features unless something is broken.
- Do NOT change universities/certifications list tables (Phase 1).

Run verification checklist §9 and smoke tests §10 when done.
```
