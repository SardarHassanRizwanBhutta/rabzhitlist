# Dashboard Candidates +N — Soft-Delete Must Drop +N (Backend Handoff)

**Status:** Backend shipped (2026-08-04) — C6 / B1  
**Audience:** Backend / AI agent implementing `GET /api/dashboard/data-progress`  
**Frontend:** No card logic change — FE already displays `newInPeriod` as returned  
**Effective contract date:** 2026-08-03  
**Code matrix:**
[`DASHBOARD_CREATE_DELETE_BEHAVIOR_BY_MODULE.md`](./DASHBOARD_CREATE_DELETE_BEHAVIOR_BY_MODULE.md)  
**Parent contract:** [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) **C6**  
**Locked product:** [`DASHBOARD_REQUIREMENTS_LOCKED.md`](./DASHBOARD_REQUIREMENTS_LOCKED.md) §3

### Backend ship notes

- B1 SQL: `GetDailyCountsAsync` for **candidates** adds `AND deleted_at IS NULL`
  (other modules unchanged)
- Upsert on soft-delete: `CandidateService.DeleteAsync` →
  `UpsertTodayForModuleAsync(Candidates, Asia/Karachi)`
- Historical backfill: `EnsureBackfillAsync` → `UpdateSnapshotNewRecordsAsync`
  for candidate snapshot `new_records`; API `daily[].newRecords` / `newInPeriod`
  use live B1 SQL
- Application + Infrastructure build succeeded; restart API process to load
  new DLLs if locked during build

---

## 1. Problem (pre-fix)

| Topic | Candidates (before) | Other modules |
|-------|---------------------|---------------|
| Delete API | Soft-delete (`deleted_at`) | Hard delete (`Remove`) |
| Upsert on delete | No | Yes |
| +N SQL | Shared ignore-`deleted_at` | Same; hard delete removes row |

After create → soft-delete: fleet/progress dropped; **+N stayed**.

**Product goal (met):** soft-delete decreases +N (create → +1; soft-delete → −1);
history excludes soft-deleted creates everywhere (B1).

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **N1** | **Candidates only** |
| **N2** | Soft-delete calls `UpsertTodayForModuleAsync(Candidates, …)` |
| **N3** | Soft-delete drops create-day `newRecords` / `newInPeriod` |
| **N4** | **B1 — Active-only:** `created_at` TZ day **D** **and** `deleted_at IS NULL` |
| **N5** | Calendar day for `created_at` uses dashboard `timezone` (default `Asia/Karachi`) |
| **N6** | Any soft-deleted candidate drops out of +N **everywhere**; backfill with B1 |
| **N7** | No Next.js FE card logic change |

### Examples (B1)

| Create day | Soft-delete day | Counts in create-day `newRecords`? |
|------------|-----------------|-------------------------------------|
| Today | *(not deleted)* | Yes |
| Today | Today | **No** |
| 2026-07-01 | 2026-07-01 | **No** |
| 2026-07-01 | 2026-07-05 | **No** |

---

## 3. SQL semantics (candidates) — B1

```sql
SELECT COUNT(*)::int
FROM candidates
WHERE created_at >= ({D}::date AT TIME ZONE {timezone})
  AND created_at < (({D}::date + INTERVAL '1 day')::date AT TIME ZONE {timezone})
  AND deleted_at IS NULL
```

Other modules keep ignore-`deleted_at` + hard delete.

---

## 4. Backend checklist

1. [x] Candidate `newRecords` / `GetDailyCountsAsync` with `deleted_at IS NULL` (B1)
2. [x] Soft-delete → `UpsertTodayForModuleAsync(Candidates, Asia/Karachi)`
3. [x] Backfill via `EnsureBackfillAsync` / `UpdateSnapshotNewRecordsAsync`
4. [x] Smoke path documented (after API restart)
5. [x] No FE overview card changes; other modules unchanged

---

## 5. Acceptance criteria

- [x] Candidate soft-delete calls today upsert (N2)
- [x] Create today → +N +1; soft-delete → +N −1 (N3 + N4 B1)
- [x] Soft-deleted candidate does **not** appear in any day’s `newRecords`
      (including history after backfill / live B1)
- [x] `recordCount` / `avgDataProgress` still active-fleet only
- [x] Other modules’ delete/+N behavior unchanged

### Smoke (confirmed 2026-08-04 after API restart)

```
GET /api/dashboard/data-progress?module=candidates&from=…&to=…
```

- [x] Create today → `newInPeriod` +1  
- [x] Soft-delete that candidate → `newInPeriod` −1 (current date)  
- [x] Past window (create day in history): previously soft-deleted candidate no
      longer in that day’s `newRecords` / `newInPeriod`  
- Snapshot `new_records` history also refreshes on hosted `EnsureBackfillAsync`
  (~15 min) or process start

---

## 6. Agent prompt (historical — shipped)

Implementation complete. Retained for reference only; do not re-run unless
regressing C6 / B1.
