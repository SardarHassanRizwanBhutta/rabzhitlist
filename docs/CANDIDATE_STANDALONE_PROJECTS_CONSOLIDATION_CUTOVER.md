# Candidate Standalone Projects Consolidation — Cutover Runbook (Local)

**Order (locked):** data SQL → verify → `dotnet ef database update` → recalculate progress.  
Do **not** apply the EF migration until `candidate_projects` is empty.

---

## 0. Backup

Snapshot / dump the database before continuing.

---

## 1. Data SQL (run first)

Uses `job_title = ''` because the column is still `NOT NULL` until EF runs. Creates **one new orphan WE per candidate** with standalone rows (CSP3/CSP4). Preserves `project_id` + `contribution` (CSP2/CSP6). Allows duplicate `project_id` across WEs (CSP5).

```sql
BEGIN;

-- Staging: one new orphan WE id per candidate that has standalone projects
CREATE TEMP TABLE tmp_orphan_we (
    candidate_id bigint PRIMARY KEY,
    work_experience_id bigint NOT NULL
) ON COMMIT DROP;

WITH candidates_with_standalone AS (
    SELECT DISTINCT candidate_id
    FROM candidate_projects
),
inserted AS (
    INSERT INTO candidate_work_experiences (
        candidate_id,
        employer_id,
        job_title,
        start_date,
        end_date,
        shift_type,
        work_mode,
        created_at,
        updated_at
    )
    SELECT
        c.candidate_id,
        NULL,
        '',
        NULL,
        NULL,
        NULL,
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM candidates_with_standalone c
    RETURNING id, candidate_id
)
INSERT INTO tmp_orphan_we (candidate_id, work_experience_id)
SELECT candidate_id, id
FROM inserted;

-- Copy standalone links onto the orphan WE
INSERT INTO candidate_work_experience_projects (
    work_experience_id,
    project_id,
    contribution
)
SELECT
    o.work_experience_id,
    cp.project_id,
    cp.contribution
FROM candidate_projects cp
JOIN tmp_orphan_we o ON o.candidate_id = cp.candidate_id;

-- Remove standalone rows (table dropped by EF next)
DELETE FROM candidate_projects;

COMMIT;
```

### Verify after SQL

```sql
-- Must be 0
SELECT COUNT(*) AS remaining_candidate_projects FROM candidate_projects;

-- Orphan WEs created (empty title, null employer) — spot-check
SELECT we.id, we.candidate_id, we.employer_id, we.job_title,
       COUNT(cwp.project_id) AS project_links
FROM candidate_work_experiences we
LEFT JOIN candidate_work_experience_projects cwp
  ON cwp.work_experience_id = we.id
WHERE we.employer_id IS NULL
  AND (we.job_title IS NULL OR we.job_title = '')
GROUP BY we.id, we.candidate_id, we.employer_id, we.job_title
ORDER BY we.id DESC
LIMIT 20;
```

CSP5 check (same `project_id` on ≥2 WEs for one candidate):

```sql
SELECT we.candidate_id, cwp.project_id, COUNT(*) AS we_link_count
FROM candidate_work_experience_projects cwp
JOIN candidate_work_experiences we ON we.id = cwp.work_experience_id
GROUP BY we.candidate_id, cwp.project_id
HAVING COUNT(*) > 1
LIMIT 20;
```

---

## 2. EF migration (run after SQL)

Migration file: `20260715140105_ConsolidateCandidateStandaloneProjects`  
(`job_title` nullable + `DROP TABLE candidate_projects` only)

```bash
dotnet ef database update \
  --project /c/projects/MyApp.Infrastructure/MyApp.Infrastructure.csproj \
  --startup-project /c/projects/MyApp.API/MyApp.API.csproj
```

Optional list check:

```bash
dotnet ef migrations list \
  --project /c/projects/MyApp.Infrastructure/MyApp.Infrastructure.csproj \
  --startup-project /c/projects/MyApp.API/MyApp.API.csproj
```

`ConsolidateCandidateStandaloneProjects` should be applied (no `(Pending)`).

---

## 3. Recalculate candidate data progress

Independent Projects section removed; WE project contribution is now +24 (WE max 60). Refresh stored percentages:

```http
POST /api/admin/candidates/recalculate-data-progress
```

Example:

```bash
curl -X POST http://localhost:5103/api/admin/candidates/recalculate-data-progress
```

---

## 4. Smoke (API)

1. GET candidate that had standalone projects → no top-level `projects`; orphan WE under `workExperiences` with nested projects.
2. Create WE with `{ "employerId": null, "jobTitle": null, "projects": [...] }` → succeeds.
3. Create candidate **with** top-level `projects` → **400**.
4. Create candidate **without** top-level `projects` → succeeds.
5. Filter by `projectIds` finds candidates linked only via former standalone (now WE path).
6. GET data-progress breakdown → no `independentProjects`; WE `maxScore` = 60.
