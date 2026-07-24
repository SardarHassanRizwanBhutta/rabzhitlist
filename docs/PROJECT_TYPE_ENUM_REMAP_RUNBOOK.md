# ProjectType enum remap — DB runbook

**Audience:** Anyone applying this change on **local** or **prod**.  
**Date:** 2026-07-24.

Postgres `project_type` is trimmed to `{ employer, freelance, independent }`.  
C# / API ints after the change: **Employer = 0**, **Freelance = 1**, **Independent = 2**.

---

## Order (required)

1. Apply EF migration **`AddProjectTypeIndependent`** (adds Postgres label `independent`).
2. Run the **data remap SQL** below (this runbook).
3. Apply EF migration **`TrimProjectTypeEnum`** (drops `academic` / `personal` / `open_source`).

Do **not** skip step 2. Step 3 will **fail** if any `projects.type` is still `academic`, `personal`, or `open_source`.

App code ships the **final** three-value C# enum; it is only fully consistent with the DB after all three steps.

---

## Step 1 — Migration (add `independent`)

```bash
dotnet ef database update AddProjectTypeIndependent --project MyApp.Infrastructure --startup-project MyApp.API
```

Or apply migrations up through `20260724020100_AddProjectTypeIndependent` with your usual process.

---

## Step 2 — Data remap (manual)

Maps **Academic**, **Personal**, and **OpenSource** → **Independent**. Leaves `employer` and `freelance` unchanged. Leaves `NULL` unchanged.

### Preview counts

```sql
SELECT type::text AS type, COUNT(*) AS cnt
FROM projects
GROUP BY type
ORDER BY type NULLS FIRST;
```

### Remap

```sql
UPDATE projects
SET type = 'independent'::project_type,
    updated_at = CURRENT_TIMESTAMP
WHERE type IN (
    'academic'::project_type,
    'personal'::project_type,
    'open_source'::project_type
);
```

### Verify (must be 0 for removed labels)

```sql
SELECT type::text AS type, COUNT(*) AS cnt
FROM projects
WHERE type IN (
    'academic'::project_type,
    'personal'::project_type,
    'open_source'::project_type
)
GROUP BY type;
```

Expected: **no rows**.

Optional: confirm independents after remap:

```sql
SELECT COUNT(*) AS independent_count
FROM projects
WHERE type = 'independent'::project_type;
```

---

## Step 3 — Migration (trim enum)

```bash
dotnet ef database update TrimProjectTypeEnum --project MyApp.Infrastructure --startup-project MyApp.API
```

Or apply through `20260724020101_TrimProjectTypeEnum`.

If this fails on cast to `project_type`, re-run the verify query in step 2 — leftover old labels remain.

---

## Frontend

Update enum maps to:

| Int | Name |
|----:|------|
| 0 | Employer |
| 1 | Freelance |
| 2 | Independent |

See also `docs/CANDIDATE_WE_PROJECT_TYPE_FRONTEND_INTEGRATION.md`.
