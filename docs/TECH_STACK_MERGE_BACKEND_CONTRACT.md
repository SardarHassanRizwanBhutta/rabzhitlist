# Backend contract: Tech stack catalog merge

**Status:** Implemented.

**Roles:** Super Admin `0`, Admin `1`. Recruiter `2` → **403** on merge routes. UI hides Catalog nav for Recruiter.

**Scope (v1):** Tech stacks catalog only. No employer–tech-stack relationship exists on the domain model; merge does **not** touch employers.

**Related docs (must stay consistent):**

| Doc | Action for backend agent |
|-----|---------------------------|
| `TECH_STACKS_USAGE_COUNT_BACKEND_CONTRACT.md` | **Amend L1 and L2** to **project-side** union (§5.3–§5.4). Add/update write hooks for `project_module_tech_stacks`. Merge recomputes using the same formulas. |
| `PROJECT_MODULES_BACKEND_CONTRACT_v1.md` | Junction table `project_module_tech_stacks` |

**Out of scope v1:** Audit log, undo, suggested-duplicate discovery (v2).

---

## 1. Locked product decisions

| # | Topic | Decision |
|---|--------|----------|
| **M1** | Cardinality | One operation: **many source catalog ids → one target** per request. |
| **M2** | Sources | **`sourceTechStackIds`** required, **≥ 1** id. Cannot merge zero sources into a new name (not a rename-only API). |
| **M3** | Target vs sources | Resolved target id **must not** appear in `sourceTechStackIds` → **400**. |
| **M4** | Target resolution | **`existing`:** use given catalog id. **`new`:** trim name; if a catalog row with that name already exists, **reuse** that id (same idempotency as `POST /api/TechStacks`). Otherwise create row (optional aspect links on create — see §4). |
| **M5** | Source rows | **Hard-delete** source `tech_stacks` rows after successful rewrite. Catalog rows have **no `DeletedAt`** — physical delete only. Removed ids absent from `GET /api/TechStacks`; optional get-by-id → **404**. |
| **M6** | Dedupe | **At most one link** per parent + target in each junction table (§5.1.1). Remove redundant source links; rewrite must be **PK-safe** (composite PK includes `tech_stack_id` — no blind bulk `UPDATE` of all sources). |
| **M7** | Aspect types | **Union:** survivor receives the **union** of all `(technical_aspect_type_id, tech_stack_id)` pairs from target + every source on `technical_aspect_type_tech_stacks` (dedupe pairs). |
| **M8** | Preview | **Required in v1:** read-only preview with the **same request body** as merge (§3). |
| **M9** | Counters | Recompute **global** and **scoped** materialized counts for the survivor in the **same transaction** as merge (§5.3–§5.4). Drop counters for deleted source ids. |
| **M10** | Filters / UI | No server-side migration of in-session filter state. Clients refetch catalog after merge. |
| **M11** | Modules | **`project_module_tech_stacks`** included in rewrite, dedupe, preview **impact** (`distinctModulesAffected` — separate line for UX), and **global/scoped `usageCount`** via **project-side** bucket (§5.3–§5.4), not a third additive term. |
| **M12** | Preview accuracy | For the same request body, **`impact`** and **`usageCountAfter`** on preview **must equal** post-merge **`impact`** and **`target.usageCount`** (no estimates). |
| **M13** | Missing ids | Unknown or already-deleted **source** or **target** catalog id → **404** (e.g. concurrent second merge). Invalid JSON / business rules → **400** (§3.1). |
| **M14** | Scoped list | **`GET /api/TechStacks?technicalAspectTypeId=T`:** Option A filter unchanged; scoped **`usageCount`** = **project-side union** (§5.4) — module links roll up **once per parent `project_id`**, not a separate module dimension. Candidates excluded from scoped counts. |

---

## 2. API surface

| Method | Path | Who | Effect |
|--------|------|-----|--------|
| **POST** | `/api/TechStacks/merge/preview` | Super Admin, Admin | Read-only impact (§6); **M12** |
| **POST** | `/api/TechStacks/merge` | Super Admin, Admin | Execute merge (§5) |

Unauthenticated → **401**. Recruiter → **403**:

```json
{
  "status": 403,
  "message": "You do not have permission to perform this action."
}
```

---

## 3. Request body (preview and merge)

```jsonc
{
  "sourceTechStackIds": [42, 43],
  "target": {
    "mode": "existing",
    "techStackId": 10
  }
}
```

```jsonc
{
  "sourceTechStackIds": [42, 43],
  "target": {
    "mode": "new",
    "name": ".NET 6",
    "technicalAspectTypeIds": [1, 3]
  }
}
```

| Field | Type | Rules |
|-------|------|--------|
| `sourceTechStackIds` | `long[]` | Required, length ≥ 1. **Unique** ids. Each id must exist in `tech_stacks` → else **404** (M13). |
| `target.mode` | `"existing"` \| `"new"` | Required. |
| `target.techStackId` | `long` | Required when `mode` is `"existing"`. Must exist → else **404**. Must not be in `sourceTechStackIds` → **400**. |
| `target.name` | `string` | Required when `mode` is `"new"`. Trim; empty → **400**. Resolve or create (§4). |
| `target.technicalAspectTypeIds` | `int[]` | Optional when `mode` is `"new"`. Used only when **inserting** a new catalog row; invalid ids → **400** (match `POST /api/TechStacks`). When name **reuses** an existing row: do not remove existing aspect links; **M7** union still applies from sources. |

### 3.1 Validation errors (**400**)

- Missing/empty `sourceTechStackIds`
- Duplicate ids in `sourceTechStackIds`
- Resolved or explicit target id listed in `sourceTechStackIds` (including `mode: "new"` name reuse resolving to a source id)
- Invalid `target.mode` or missing required target fields
- `target.name` whitespace-only

### 3.2 Not found (**404**) — M13

- Any id in `sourceTechStackIds` not found (already merged/deleted)
- `target.techStackId` not found when `mode` is `"existing"`

---

## 4. Target resolution (`mode: "new"`)

1. Trim `name`.
2. If catalog already has that name (**same rules as `POST /api/TechStacks`**), set `targetId` to that row’s id.
3. Else insert new `tech_stacks` row; apply `technicalAspectTypeIds` on create when provided.
4. If `targetId ∈ sourceTechStackIds` → **400** (M3).
5. Proceed with merge into `targetId`.

---

## 5. Merge algorithm (single transaction)

1. Resolve `targetId` (§4).
2. Validate every source id exists (**404** if not).
3. **Rewrite + dedupe (M6)** junction rows per §5.1.1 (PK-safe per parent; same outcome as “rewrite then dedupe”, not a deferred cleanup pass).
4. **Aspect union (M7)** onto `targetId`; remove aspect rows for source stack ids.
5. **Hard-delete** source catalog rows (M5).
6. Recompute **`usageCount`** for `targetId` only (§5.3); remove materialized values for deleted source ids if stored separately.

### 5.1 Junction tables

| Table | Parent key | Composite PK (typical) | Notes |
|-------|------------|------------------------|--------|
| `candidate_tech_stacks` | `candidate_id` | `(candidate_id, tech_stack_id)` | Exclude soft-deleted candidates (`DeletedAt IS NULL`). |
| `candidate_work_experience_tech_stacks` | `work_experience_id` | `(work_experience_id, tech_stack_id)` | Same parent soft-delete rules as today. |
| `project_tech_stacks` | `project_id` | `(project_id, tech_stack_id)` | Exclude soft-deleted projects. |
| `project_module_tech_stacks` | `module_id` | `(module_id, tech_stack_id)` | Exclude soft-deleted modules/projects per schema. |
| `technical_aspect_type_tech_stacks` | catalog metadata | aspect + stack pair | Union (M7), not the §5.1.1 loop. |

**No** employer tech junction.

### 5.1.1 PK-safe rewrite + dedupe (M6 — required)

Junction tables use a composite primary key that includes **`tech_stack_id`**. A single SQL statement of the form `UPDATE … SET tech_stack_id = @target WHERE tech_stack_id = ANY (@sourceIds)` can violate that PK (**PostgreSQL 23505**, e.g. `PK_candidate_tech_stacks`) when a parent already links to the target **or** has more than one source link in the same request.

**Do not** rely on “bulk UPDATE all sources, then dedupe in a later step.” Dedupe must happen **while** rewriting, **per parent** (candidate, work experience, project, module), for each table in §5.1 (respecting soft-delete filters):

1. If the parent **already** has a link to **`targetId`**: **delete** all junction rows for that parent where `tech_stack_id` is in `sourceTechStackIds` (redundant sources; survivor link unchanged).
2. Else: **repoint one** source link to `targetId` (any one source row for that parent), then **delete** any remaining source rows for that parent. **Repoint** here means end state is a single `(parent, targetId)` row — not necessarily an in-place `UPDATE` of `tech_stack_id` (see §5.1.2).

Apply the same rules to all four junction tables. Count rows removed in step 1 and extra rows removed in step 2 toward **`impact.duplicateLinksRemoved.*`** (M12).

### 5.1.2 ORM / EF Core (implementation)

When `tech_stack_id` is part of the entity **primary key** (composite key on junction types), **do not** assign a new value to `TechStackId` on a tracked row and call `SaveChanges`. EF Core rejects key mutation (`InvalidOperationException`: property is part of a key and cannot be modified).

**Preferred repoint (all four junction tables):** **delete** the source junction row(s), then **insert** `(parent_id, targetId)` when the parent does not already have the target link. Step §5.1.1 (1) remains delete-only (no insert). Raw SQL `UPDATE … SET tech_stack_id = @target` is acceptable only when dedupe guarantees no PK collision; with EF-tracked entities, **delete + insert** is the safe default.

### 5.2 Dedupe example

Candidate had links to **42** and **43**; merge into **10**. Candidate already had **10** → keep **one** `(candidate_id, 10)` row; delete `(candidate_id, 42)` and `(candidate_id, 43)` without updating them to **10** first.

### 5.3 Global `usageCount` (locked — extends usage-count L1)

**Amend** `TECH_STACKS_USAGE_COUNT_BACKEND_CONTRACT.md` **L1** to a **two-bucket** formula (product locked):

```text
distinct_candidates(S)  — UNION top-level + WE links; each candidate once (L8)

distinct_project_side(S) =
  COUNT(DISTINCT project_id FROM (
    SELECT pts.project_id
      FROM project_tech_stacks pts
      INNER JOIN projects p ON p.id = pts.project_id
      WHERE pts.tech_stack_id = S AND p.DeletedAt IS NULL
    UNION
    SELECT pm.project_id
      FROM project_module_tech_stacks pmts
      INNER JOIN project_modules pm ON pm.id = pmts.module_id
      INNER JOIN projects p ON p.id = pm.project_id
      WHERE pmts.tech_stack_id = S
        AND p.DeletedAt IS NULL
        AND pm deleted/null rules match project-modules contract
  ) u)

usageCount_global(S) = distinct_candidates(S) + distinct_project_side(S)
```

**Project-side bucket:** A stack on a project **and** on a module of that same project counts **once** (by `project_id`), not twice. Module-only links still increase the count via the module branch (one per parent project).

Module link create/update/delete (outside merge) **must** update **`distinct_project_side`** the same way as `project_tech_stacks` changes (synchronous on write per usage-count **L5**).

**`usageCountAfter`** (preview) and post-merge **`target.usageCount`** use this formula on the post-merge link graph.

### 5.4 Scoped `usageCount` (locked — M14; replaces usage-count L2 project-only SQL)

**Option A (filter):** `GET /api/TechStacks?technicalAspectTypeId=T` returns only stacks with a row on `technical_aspect_type_tech_stacks` for aspect **T**. Candidates never affect scoped **`usageCount`**.

**Option A + project-side (count):** Scoped **`usageCount`** uses the same **distinct `project_id`** union as §5.3 (project stacks ∪ module stacks → parent project), with **`tats`** requiring stack **S** linked to aspect **T**:

```text
usageCount_scoped(S, T) =
  COUNT(DISTINCT project_id FROM (
    SELECT pts.project_id
      FROM project_tech_stacks pts
      INNER JOIN projects p ON p.id = pts.project_id
      INNER JOIN technical_aspect_type_tech_stacks tats
        ON tats.tech_stack_id = S AND tats.technical_aspect_type_id = T
      WHERE pts.tech_stack_id = S AND p.DeletedAt IS NULL
    UNION
    SELECT pm.project_id
      FROM project_module_tech_stacks pmts
      INNER JOIN project_modules pm ON pm.id = pmts.module_id
      INNER JOIN projects p ON p.id = pm.project_id
      INNER JOIN technical_aspect_type_tech_stacks tats
        ON tats.tech_stack_id = S AND tats.technical_aspect_type_id = T
      WHERE pmts.tech_stack_id = S AND p.DeletedAt IS NULL
  ) u)
```

Candidates still **do not** affect scoped counts. Module links **do** count, rolled up to **one per project**. Aspect type **T** still gates which stacks appear in the filtered list; counts only include projects where **S** is tied to **T** on the catalog aspect link (same as Option A’s use of `tats`).

---

## 6. Preview response (`POST .../merge/preview`)

**200** — no mutations. **M12:** counts must match merge outcome for the same body.

```jsonc
{
  "target": {
    "techStackId": 10,
    "name": ".NET 6",
    "usageCountAfter": 95
  },
  "sources": [
    { "techStackId": 42, "name": ".NET6", "usageCountBefore": 12 },
    { "techStackId": 43, "name": ".NET-6", "usageCountBefore": 8 }
  ],
  "impact": {
    "distinctCandidatesAffected": 15,
    "distinctProjectsAffected": 4,
    "distinctModulesAffected": 2,
    "duplicateLinksRemoved": {
      "candidateTechStacks": 3,
      "workExperienceTechStacks": 1,
      "projectTechStacks": 0,
      "projectModuleTechStacks": 0
    }
  }
}
```

| Field | Meaning |
|-------|---------|
| `distinctCandidatesAffected` | **Union** across sources: distinct candidates with ≥1 link to **any** source (top-level or WE). **Do not sum** per-source counts. |
| `distinctProjectsAffected` | **Union:** distinct projects with ≥1 source link on `project_tech_stacks`. |
| `distinctModulesAffected` | **Union:** distinct modules with ≥1 source link on `project_module_tech_stacks`. |
| `duplicateLinksRemoved.*` | Junction rows removed by dedupe (M6); **exact** on preview and merge (M12). |
| `usageCountAfter` | Global count (§5.3) after merge, before persisting. |

---

## 7. Merge response (`POST .../merge`)

**200**

| vs preview | Field |
|------------|--------|
| Same | `impact`, `sources` (optional to omit on merge if redundant) |
| Rename | `target.usageCount` (not `usageCountAfter`) |
| Add | `mergedSourceIds`: `long[]` |

```jsonc
{
  "target": { "techStackId": 10, "name": ".NET 6", "usageCount": 95 },
  "mergedSourceIds": [42, 43],
  "impact": { /* identical to preview for same request */ }
}
```

---

## 8. Verification checklist

1. Merge into existing target → sources gone from GET list; **`usageCount`** = candidates + **project-side** (§5.3).
2. Stack on project **and** module of same project → project-side contributes **1**, not 2.
3. Module-only link on a source → **`usageCountAfter`** increases project-side by 1 (via that module’s `project_id`).
4. Candidate with two sources → one target link; `duplicateLinksRemoved` exact on preview and merge (M12).
5. Parent already has **target** and a **source** link → preview and merge **200** (no PK violation); redundant source links removed per §5.1.1.
6. EF-backed merge: repoint path uses delete + insert, not mutating `TechStackId` on tracked entities (§5.1.2).
7. Aspect union from sources with different aspect types.
8. `mode: "new"` reuses existing name id; no duplicate catalog name.
9. `mode: "new"` resolving to a source id → **400**.
10. Recruiter → **403**.
11. Second merge referencing deleted source id → **404** (M13).
12. Recruiter not in nav; admin preview → merge → GET catalog updated.
13. Scoped GET with `technicalAspectTypeId`: module link on stack **S** increments scoped count by parent project (once); direct project link + module link on same project → **1** (M14).

---

## 9. Frontend integration

| Item | Decision |
|------|----------|
| Route | `/catalog/merge-technologies` |
| Nav | **Catalog** → **Merge technologies**; hidden for Recruiter |
| Data | `GET /api/TechStacks`; `POST …/merge/preview` and `POST …/merge` via `tech-stack-merge-api.ts` |
| UI | `tech-stack-merge-page-client.tsx` — live catalog, preview dialog, confirm merge |

---

## 10. Backend agent handoff (copy-paste)

Implement **`POST /api/TechStacks/merge/preview`** and **`POST /api/TechStacks/merge`** per this document.

- Admin + Super Admin only; Recruiter **403**.
- Rewrite + dedupe (§5.1.1, PK-safe per parent): `candidate_tech_stacks`, `candidate_work_experience_tech_stacks`, `project_tech_stacks`, `project_module_tech_stacks`, aspect union on `technical_aspect_type_tech_stacks`.
- Hard-delete source `tech_stacks` (no catalog soft delete).
- **Amend** global and scoped `usageCount` per §5.3–§5.4 (candidates + **project-side** union); update counters on module link writes and on merge.
- Preview and merge **`impact`** must match for the same request (M12).
- Missing catalog id → **404**.

Cross-read: `TECH_STACKS_USAGE_COUNT_BACKEND_CONTRACT.md`, `PROJECT_MODULES_BACKEND_CONTRACT_v1.md`.

Scoped **Option A** + project-side extension is locked in §5.4; amend `TECH_STACKS_USAGE_COUNT_BACKEND_CONTRACT.md` L1 and L2 accordingly.
