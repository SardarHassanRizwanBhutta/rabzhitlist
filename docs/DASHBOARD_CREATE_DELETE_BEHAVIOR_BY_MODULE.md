# Dashboard CREATE / DELETE behavior by module

**Status:** Updated **2026-08-04** for candidates **C6 / B1** ship (prior body generated from code 2026-08-03).  
**Endpoint:** `GET /api/dashboard/data-progress`  
**Audience:** Backend / product / FE agents.  
**Rule for this doc:** Describes **implemented** behavior.

---

## 0. How `GET /api/dashboard/data-progress` assembles metrics

Entry: `DashboardController.GetDataProgress` → `DashboardDataProgressService.GetDataProgressAsync`.

1. Validate `from` / `to` / `timezone` (`DashboardQueryValidation.ValidateAsync`).
2. **`UpsertTodayAsync(timezone)`** — refreshes **today’s** snapshot for **all** modules (`DashboardSnapshotService`).
3. Load stored snapshots for the chart series range.
4. Load **live** `GetDailyNewRecordsAsync` for that series → drives each day’s `newRecords` and module-summary `newInPeriod`.
5. For modules with progress: **`ApplyLiveTodayProgressAsync`** overwrites **today’s** row `recordCount` / `totalDataProgress` / `avgDataProgress` / `progressPointsGained` from **live** fleet SQL (`deleted_at IS NULL`). It does **not** rewrite today’s `newRecords`.
6. `summary.current` and each `summary.modules[].recordCount` / `avgDataProgress` use **live** fleet (`deleted_at IS NULL`).
7. `summary.modules[].newInPeriod` = sum of live daily new-record counts over `[from, to]`.

**Default timezone** if query `timezone` omitted: `Asia/Karachi` (`DashboardModules.DefaultTimezone`).

**Calendar day for `created_at`:** `(created_at AT TIME ZONE {timezone})::date` with bounds  
`created_at >= ({day}::date AT TIME ZONE {timezone})` and  
`created_at < (({day}::date + INTERVAL '1 day')::date AT TIME ZONE {timezone})`.

`created_at` / `deleted_at` are stored as timestamptz; “today” for snapshots is `(NOW() AT TIME ZONE {timezone})::date`.

Also: hosted `DashboardSnapshotRefreshHostedService` every **15 minutes** runs `EnsureBackfillAsync` + `UpsertTodayAsync` with **`Asia/Karachi` only** (not the request timezone).

---

## 1. Per-module matrix

### Shared +N (newRecords / newInPeriod) rule

Live and snapshot upsert use `DashboardDataProgressRepository.GetDailyCountsAsync`.

| Module | +N predicate |
|--------|----------------|
| **candidates (C6 B1)** | `created_at` in TZ day window **and** `deleted_at IS NULL` |
| **employers / projects / universities / certifications** | `created_at` in TZ day window only (**no** `deleted_at` filter); hard delete removes the row |

---

### 1.1 `candidates`

| Event | recordCount | avgDataProgress / totalDataProgress | newRecords (that calendar day) | newInPeriod (Today / window) | Snapshot / recompute trigger |
|-------|-------------|--------------------------------------|--------------------------------|------------------------------|------------------------------|
| **CREATE** | Live fleet **includes** new row (`deleted_at IS NULL`). After progress recalc, today’s snapshot fleet refreshed. | Live sum/avg over non-deleted; today’s row overwritten on GET via `ApplyLiveTodayProgressAsync`. | **+1** for create day’s TZ calendar day (`created_at` **and** `deleted_at IS NULL`). | Sum of those daily counts; includes this create. | `CandidateService.CreateAsync` → progress recalc → **`UpsertTodayForModuleAsync(Candidates, Asia/Karachi)`**. |
| **SOFT-DELETE** | Live fleet **excludes** row. | Live totals drop that row’s progress. | **−1** for create day — B1 excludes `deleted_at IS NOT NULL`. | Decrements for windows containing create day. | `CandidateService.DeleteAsync` sets `DeletedAt` then **`UpsertTodayForModuleAsync(Candidates, Asia/Karachi)`**. Historical snapshot `new_records` refreshed via `EnsureBackfillAsync` / `UpdateSnapshotNewRecordsAsync`. |

**Delete kind:** **soft-delete** only (among dashboard modules). **C6 / B1 shipped.**

---

### 1.2 `employers`

| Event | recordCount | avg / total progress | newRecords (day) | newInPeriod | Snapshot / recompute trigger |
|-------|-------------|----------------------|------------------|-------------|------------------------------|
| **CREATE** | Included in live fleet. | Live progress includes row. | +1 by `created_at` day (no `deleted_at` filter). | Includes create. | `EmployerService.CreateAsync` → `EmployerDataProgressService.RecalculateAndSaveAsync` → **`UpsertTodayForModuleAsync(Employers, Asia/Karachi)`**. |
| **DELETE** | Live fleet excludes (row gone). | Live progress excludes. | If hard-deleted: row **removed from DB** → daily count for create day **drops** on next live `GetDailyNewRecordsAsync` (no longer in table). | Recalculated from live counts. | `EmployerService.DeleteAsync` → `EmployerRepository.DeleteAsync` **`Remove`** (hard) → **`UpsertTodayForModuleAsync`**. |

**Delete kind:** **hard delete** (`Remove`). Entity has `DeletedAt` and list queries filter it, but **delete path does not soft-delete**. Soft-delete +N rules are **N/A** for current delete API.

---

### 1.3 `projects`

| Event | recordCount | avg / total progress | newRecords (day) | newInPeriod | Snapshot / recompute trigger |
|-------|-------------|----------------------|------------------|-------------|------------------------------|
| **CREATE** | Included live. | Included live. | +1 by `created_at` day. | Includes create. | `ProjectService.CreateAsync` → `ProjectDataProgressService.RecalculateAndSaveAsync` → **`UpsertTodayForModuleAsync(Projects, Asia/Karachi)`**. |
| **DELETE** | Excluded (row gone). | Excluded. | Create-day count drops when row hard-deleted. | Live recalc. | `ProjectService.DeleteAsync` → `ProjectRepository.DeleteAsync` **`Remove`** → **`UpsertTodayForModuleAsync`**. |

**Delete kind:** **hard delete**. `DeletedAt` exists on entity / list filters; delete API does not set it.

---

### 1.4 `universities`

| Event | recordCount | avg / total progress | newRecords (day) | newInPeriod | Snapshot / recompute trigger |
|-------|-------------|----------------------|------------------|-------------|------------------------------|
| **CREATE** | Included live. | Included live. | +1 by `created_at` day. | Includes create. | `UniversityService.CreateAsync` → `UniversityDataProgressService.RecalculateAndSaveAsync` → **`UpsertTodayForModuleAsync(Universities, Asia/Karachi)`**. |
| **DELETE** | Excluded (row gone). | Excluded. | Create-day count drops after hard delete. | Live recalc. | `UniversityService.DeleteAsync` → `UniversityRepository.DeleteAsync` **`Remove`** → **`UpsertTodayForModuleAsync`**. |

**Delete kind:** **hard delete**.

---

### 1.5 `certifications`

| Event | recordCount | avg / total progress | newRecords (day) | newInPeriod | Snapshot / recompute trigger |
|-------|-------------|----------------------|------------------|-------------|------------------------------|
| **CREATE** | Included live. | Included live. | +1 by `created_at` day. | Includes create. | `CertificationService.CreateAsync` → `CertificationDataProgressService.RecalculateAndSaveAsync` → **`UpsertTodayForModuleAsync(Certifications, Asia/Karachi)`**. |
| **DELETE** | Excluded if delete succeeds. | Excluded if delete succeeds. | Create-day count drops after hard delete. | Live recalc. | `CertificationService.DeleteAsync` → `CertificationRepository.DeleteAsync` **`Remove`** → **`UpsertTodayForModuleAsync`**. Hard delete **fails** with FK `RESTRICT` if `candidate_certifications` still reference the row (500 today). |

**Delete kind:** **hard delete** (intended soft-delete not implemented on this path). List/search already filter `DeletedAt == null`.

---

## 2. Timezone / calendar-day rules

| Concern | Implementation |
|---------|----------------|
| Default TZ | `Asia/Karachi` |
| Request TZ | Query `timezone`; validated against `pg_timezone_names` |
| “Today” | `(NOW() AT TIME ZONE {tz})::date` |
| New-record day bucketing | `(created_at AT TIME ZONE {tz})::date` |
| Soft-delete timestamp (candidates) | `DateTime.UtcNow` → `deleted_at`; candidate newRecords require `deleted_at IS NULL` (C6 B1) |
| Live fleet / progress | `WHERE deleted_at IS NULL` |
| Historical snapshot EOD fleet (backfill) | Created before end of day instant **and** (`deleted_at IS NULL` **OR** `deleted_at >=` end of that day) — used only in `GetProgressFleetAtEndOfDayAsync` / employer EOD count, **not** in live +N |

**Live vs stored snapshots**

- **Past days:** chart `recordCount` / progress from **stored** snapshot rows; `newRecords` always from **live** `GetDailyNewRecordsAsync` (not the snapshot’s `NewRecords` column when building the response — see `BuildDailyRows`: `newRecords.GetValueOrDefault(day)`).
- **Today:** after upsert, progress/fleet on today’s daily row then **overridden** by live progress; `newRecords` still from live create-day SQL.

---

## 3. Evidence (paths + predicates)

### 3.1 API / orchestration

| Symbol | Path |
|--------|------|
| `DashboardController.GetDataProgress` | `MyApp.API/Controllers/DashboardController.cs` |
| `DashboardDataProgressService.GetDataProgressAsync` | `MyApp.Application/Dashboard/DashboardDataProgressService.cs` |
| `ApplyLiveTodayProgressAsync` | same |
| `BuildModuleSummariesAsync` / `SumNewRecords` | same |
| `DashboardSnapshotService.UpsertTodayAsync` / `UpsertTodayForModuleAsync` | `MyApp.Application/Dashboard/DashboardSnapshotService.cs` |
| `DashboardModules.DefaultTimezone` | `MyApp.Application/Dashboard/DashboardModules.cs` |
| `DashboardQueryValidation.ValidateAsync` | `MyApp.Application/Dashboard/DashboardQueryValidation.cs` |
| `DashboardSnapshotRefreshHostedService` | `MyApp.Infrastructure/Dashboard/DashboardSnapshotRefreshHostedService.cs` |

### 3.2 Daily newRecords SQL (exact filter)

`DashboardDataProgressRepository.GetDailyCountsAsync`:

```sql
SELECT (created_at AT TIME ZONE {timezone})::date AS "Day", COUNT(*)::int AS "Count"
FROM {candidates|employers|projects|universities|certifications}
WHERE created_at >= ({from}::date AT TIME ZONE {timezone})
  AND created_at < (({to}::date + INTERVAL '1 day')::date AT TIME ZONE {timezone})
  -- candidates only (C6 B1):
  -- AND deleted_at IS NULL
GROUP BY 1
ORDER BY 1
```

**Candidates:** `AND deleted_at IS NULL`. **Other modules:** no `deleted_at` predicate.

### 3.3 Live fleet / progress SQL

Example (`GetLiveCandidateProgressAsync`; peers identical for projects / universities / certifications / employers):

```sql
SELECT
    COUNT(*)::int AS "RecordCount",
    COALESCE(ROUND(SUM(data_progress_percentage))::int, 0) AS "TotalDataProgress"
FROM candidates
WHERE deleted_at IS NULL
```

`GetFleetRecordCountAsync`: EF `CountAsync(x => x.DeletedAt == null)` per module.

### 3.4 CREATE / DELETE hooks

| Module | CREATE upsert | DELETE behavior + upsert |
|--------|---------------|---------------------------|
| candidates | `CandidateDataProgressService.RecalculateAndSaveAsync` → `UpsertTodayForModuleAsync` | Soft: `CandidateService.DeleteAsync` → **`UpsertTodayForModuleAsync`** (C6) |
| employers | `EmployerDataProgressService.RecalculateAndSaveAsync` | Hard: `EmployerRepository.DeleteAsync` + upsert in `EmployerService.DeleteAsync` |
| projects | `ProjectDataProgressService.RecalculateAndSaveAsync` | Hard: `ProjectRepository.DeleteAsync` + upsert in `ProjectService.DeleteAsync` |
| universities | `UniversityDataProgressService.RecalculateAndSaveAsync` | Hard: `UniversityRepository.DeleteAsync` + upsert in `UniversityService.DeleteAsync` |
| certifications | `CertificationDataProgressService.RecalculateAndSaveAsync` | Hard: `CertificationRepository.DeleteAsync` + upsert in `CertificationService.DeleteAsync` |

---

## 4. Docs vs code (create / delete / +N)

Listed under `docs/DASHBOARD*`. Content not used as source of truth for §1–3; drift called from **code facts** above:

| Doc | Create/delete / +N soft-delete |
|-----|--------------------------------|
| `DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md` | Treat as **STALE** unless re-verified against §3 predicates (esp. +N ignoring `deleted_at`). |
| `DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md` | **STALE** risk — verify against `GetDailyCountsAsync` / live fleet SQL. |
| `DASHBOARD_REQUIREMENTS_LOCKED.md` | **MATCHES** C6 B1 candidates +N (shipped). |
| `DASHBOARD_CANDIDATES_NEW_IN_PERIOD_SOFT_DELETE_HANDOFF.md` | **MATCHES** shipped C6 B1. Other modules remain hard-delete. |
| `DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md` | Phase doc; employer **hard** delete + upsert **MATCHES** code; soft-delete +N N/A. |
| `DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md` | Same pattern as employers/projects hard delete. |
| `DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md` | Same; certification hard delete + FK failure **not** soft-delete. |
| `DASHBOARD_CREATE_DELETE_BEHAVIOR_BY_MODULE.md` (this file) | **MATCHES CODE** as of generation date. |

---

## 5. Candidates vs other modules (explicit)

| Topic | Candidates | Employers / Projects / Universities / Certifications |
|-------|------------|------------------------------------------------------|
| API delete | **Soft-delete** (`deleted_at`) | **Hard delete** (`Remove`) |
| Upsert on delete | **Yes** `UpsertTodayForModuleAsync` (C6) | **Yes** `UpsertTodayForModuleAsync` |
| Live `recordCount` / progress | Excludes soft-deleted | Hard delete removes row |
| `newRecords` / `newInPeriod` | `created_at` day **and** `deleted_at IS NULL` (C6 B1) | `created_at` day only; hard delete removes contribution |
| +N after delete | Drops (B1) | Drops (row gone) |

**Conclusion:** Candidates soft-delete; other modules hard-delete. Candidate +N uses **B1** (`deleted_at IS NULL`). Other modules’ +N SQL still has no `deleted_at` filter.

---

## 6. Quick reference — candidates soft-delete +N (implemented C6 B1)

> **Require `deleted_at IS NULL`** for candidate `newRecords` / `newInPeriod`.  
> Soft-delete upserts today; history backfill drops previously soft-deleted creates.
