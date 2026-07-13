# Dashboard Universities & Certifications Data Progress — Phase 2 Backend Handoff

**Status:** Backend Phase 2 **implemented** (2026-07).  
**Audience:** Backend AI agent / engineer.  
**Depends on:** Entity Phase 1 shipped for both modules (`universities.data_progress_percentage`, `certifications.data_progress_percentage`).

**Parent contracts (unchanged API shape):**

- [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md)
- [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md)
- [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)
- [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)

**Frontend:** No new dashboard components expected — verify existing UI when API flips (§6).

---

## 1. Summary

| Item | Phase 2 change |
|------|----------------|
| Progress-enabled modules | **`candidates`**, **`projects`**, **`universities`**, **`certifications`** (`available: true`) |
| Still disabled **in this phase** | **`employers`** only — `available: false`, progress fields **0**, `avgDataProgressDelta: null` (C5). **Superseded for employers by** [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md) (do not treat “employers remain false” as the current global target after that doc ships). |
| Progress source | `universities.data_progress_percentage`, `certifications.data_progress_percentage` |
| Snapshots | Backfill **`module = universities`** and **`module = certifications`** in `dashboard_module_daily_snapshots` (C3/C4) |
| Recalc triggers | University/certification mutations → refresh **today’s** snapshot for that module |
| API route | **Same** `GET /api/dashboard/data-progress` |
| Frontend | Select **Universities** or **Certifications** → same KPIs/chart as Candidates/Projects |
| Deploy | **Backend first** (EC2), then frontend verify on Amplify |

Ship **both** dashboard modules in **one** backend deploy.

---

## 2. Locked decisions (Phase 2)

| # | Decision |
|---|----------|
| **UC2-D1** | `summary.modules[universities].available = true` and `summary.modules[certifications].available = true` when Phase 2 ships |
| **UC2-D2** | Fleet aggregation **identical** to candidates/projects (§3) |
| **UC2-D3** | Snapshot rules **identical**: today upsert (C3), 150-day backfill (C4), `Asia/Karachi` |
| **UC2-D4** | Entity mutations trigger today snapshot upsert for respective module |
| **UC2-D5** | Historical backfill uses **current** stored `%` at EOD — same first-deploy flat-then-jump caveat as projects |
| **UC2-D6** | **Employers** remain `available: false` **for this universities/certifications Phase 2 ship** (historical). Current employers dashboard work: [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md) |
| **UC2-D7** | Frontend verification only — no new dashboard components |
| **UC2-D8** | Deploy backend before frontend |

---

## 3. Progress aggregation (universities & certifications = candidates/projects)

For **active** rows (`deleted_at IS NULL`) at snapshot time or `generatedAt`:

```
progressPoints       = entity.data_progress_percentage   // 0–100
recordCount          = COUNT(active rows)
totalDataProgress    = ROUND(SUM(progressPoints), 0)
avgDataProgress      = ROUND(totalDataProgress / recordCount, 1)   // 0 if count=0
```

**`daily[]` when `module=universities` or `module=certifications`:**

| Field | Rule |
|-------|------|
| `totalDataProgress` | Fleet sum from snapshot / live today |
| `avgDataProgress` | Fleet avg |
| `recordCount` | Active fleet EOD |
| `progressPointsGained` | Day-over-day delta in `totalDataProgress` |
| `newRecords` | `created_at` calendar day; ignore `deleted_at` (C2) |

**`summary.modules[]` when `available: true`:**

| Field | Rule |
|-------|------|
| `avgDataProgress` | Live fleet avg now |
| `recordCount` | Active fleet now |
| `newInPeriod` | Sum `newRecords` over user `from`..`to` |
| `avgDataProgressDelta` | pp vs prior window end — **only when `to` = today** (H1); else `null` |
| `available` | `true` |

---

## 4. What changes in `DashboardDataProgressService`

Extend existing implementation — **do not** add a second dashboard endpoint.

### 4.1 `available` flag

```csharp
bool IsProgressModule(module) =>
    module is Candidates or Projects or Universities or Certifications;
```

**Employers** remain excluded.

### 4.2 Snapshot backfill

On first deploy after Phase 2:

- Run 150-day backfill for `module=universities` and `module=certifications`
- Use stored `data_progress_percentage` for active fleet at each EOD (same caveat as projects §5 in projects Phase 2 doc)

### 4.3 Recalc hooks

| Entity mutation | Snapshot module |
|-----------------|-----------------|
| University / location CRUD | `universities` |
| Certification CRUD | `certifications` |

Upsert **today’s** row in `dashboard_module_daily_snapshots` (C3).

### 4.4 `avgDataProgressDelta`

For `universities` and `certifications` when `available: true`:

```
avgDataProgressDelta = live avg(now) - frozen avg(EOD prevTo)
```

Only when **`to` = today** in timezone; else **`null`** (H1).

---

## 5. Example response snippets

```json
{
  "module": "universities",
  "summary": {
    "modules": [
      { "module": "universities", "avgDataProgress": 42.3, "avgDataProgressDelta": 1.2, "available": true },
      { "module": "certifications", "avgDataProgress": 88.0, "avgDataProgressDelta": 0.5, "available": true },
      { "module": "employers", "avgDataProgress": 0, "avgDataProgressDelta": null, "available": false }
    ]
  }
}
```

---

## 6. Frontend verification (no new features)

**Guide:** [`university_certification_data_progress_frontend_integration_phase2.md`](./university_certification_data_progress_frontend_integration_phase2.md)

| Check | Expected |
|-------|----------|
| Overview cards | Live avg % when `available: true`; employers still 0% **at the time of this ship** (see employers Phase 2 for flip) |
| Detail KPIs | `summary.current` stock + flow gained from `daily[]` |
| Chart | Same semantics as candidates/projects |
| First deploy | Historical zeros then jump on today — **not a UI bug** |
| Anti-pattern | No `module === 'candidates'` guards — use `available` |

---

## 7. Backend checklist

- [ ] `IsProgressModule` includes universities + certifications
- [ ] Snapshot backfill both modules (150 days)
- [ ] Today upsert on entity mutations
- [ ] `avgDataProgressDelta` + H1 null when `to !== today`
- [ ] Employers still `available: false` (**acceptance for this UC Phase 2 ship only**)
- [ ] Smoke tests §8

---

## 8. Smoke tests

```http
GET /api/dashboard/data-progress?module=universities&from={today}&to={today}&timezone=Asia/Karachi
GET /api/dashboard/data-progress?module=certifications&from={today}&to={today}&timezone=Asia/Karachi
```

- `summary.modules[universities].available === true`
- `summary.modules[certifications].available === true`
- `summary.modules[employers].available === false` (**expected for this UC Phase 2 ship**; later flipped by employers Phase 2)
- `summary.current` matches fleet sum/avg from entity table
- Candidates and projects **unchanged** (regression)

---

## 9. Agent prompt (backend Phase 2)

```
Implement Dashboard Universities & Certifications Data Progress Phase 2 per
docs/DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md.

Extend GET /api/dashboard/data-progress: set summary.modules[universities].available
and summary.modules[certifications].available to true. Aggregate
universities.data_progress_percentage and certifications.data_progress_percentage
like candidates/projects. Snapshot backfill (150 days) + today upsert on entity
mutations. avgDataProgressDelta (pp) when to=today; H1 null otherwise.

Employers remain available:false. Do not add new dashboard routes.
Deploy backend before frontend verification.
```

---

## 10. Related documents

| Document | Purpose |
|----------|---------|
| [`UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md`](./UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md) | Entity Phase 1 universities |
| [`CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md`](./CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md) | Entity Phase 1 certifications |
| [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md) | Prior Phase 2 pattern (projects) |
| [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md) | Next / employers dashboard Phase 2 (supersedes “employers remain false” as global target) |
| [`university_certification_data_progress_frontend_integration_phase2.md`](./university_certification_data_progress_frontend_integration_phase2.md) | Frontend verify guide |
