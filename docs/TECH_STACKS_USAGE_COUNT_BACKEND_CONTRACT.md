# Backend Contract: `usageCount` on Tech Stack Catalog (`GET /api/TechStacks`)

Handoff for the **backend AI agent** implementing **`usageCount`** on the tech stack lookup catalog so the Next.js frontend can sort all tech-stack multi-selects by popularity.

**Frontend reference (already implemented; tolerates missing `usageCount` as `0`):**

| File | Purpose |
|------|---------|
| `src/lib/utils/tech-stack-lookup.ts` | Normalizes `usageCount`, sorts `usageCount DESC`, `name ASC` |
| `src/lib/services/lookups-api.ts` | `fetchTechStacks(technicalAspectTypeId?)` |
| Candidate / project create & edit dialogs, filter dialogs, tables | All consume sorted catalog via `fetchTechStacks` or shared helpers |

---

## 1. Goal

Extend **`GET /api/TechStacks`** so each catalog row includes a non-negative **`usageCount`**, reflecting how often that stack is used across **candidates** (including work-experience links) and **projects**.

The frontend uses this field **only for dropdown ordering** — not for filtering, badges, or display text.

---

## 2. Locked product decisions (do not change without FE sign-off)

These were confirmed by product on **2026-08-10**:

| # | Topic | Decision |
|---|--------|----------|
| **L1** | **What “used” means (global list)** | `usageCount` = **count of distinct candidates** referencing the stack **plus** **count of distinct projects** referencing the stack. **Not** a raw sum of junction-table rows. **Not** employer usage. |
| **L2** | **Scoped list formula** | For `GET /api/TechStacks?technicalAspectTypeId=T`, **`usageCount` = distinct projects** using stack `S` where `S` is catalog-linked to aspect type `T` (**Option A**). Candidate usage does **not** affect scoped counts. |
| **L7** | **Soft delete** | **Exclude** links on soft-deleted candidates and projects (`DeletedAt IS NULL` on parent entity). |
| **L8** | **Candidate dedupe** | Each candidate counts **at most once** per stack globally, even if linked via top-level `candidate_tech_stacks` and/or multiple `candidate_work_experience_tech_stacks` rows. |
| **L3** | **Zero usage** | Stacks with `usageCount = 0` **remain in the response** and sort **last**. |
| **L4** | **Sort order** | Primary: `usageCount DESC`. Tie-break: **`name ASC`** (case-insensitive). |
| **L5** | **Caching preference** | **Materialized counters updated synchronously on write**, plus **nightly reconciliation** as drift repair only (see §8). |
| **L6** | **Out of scope** | `employer_tech_stacks` — **never** included in `usageCount`. |
| **L9** | **`POST` response** | **`POST /api/TechStacks`** returns **`usageCount: 0`** on newly created stacks. |
| **L10** | **Server-side sort** | Backend **must** return the JSON array pre-sorted: `usageCount DESC`, `name ASC` (case-insensitive). FE re-sorts idempotently. |
| **L11** | **Debug breakdown** | **`usageBreakdown` omitted** in v1 — response is `{ id, name, usageCount }` only. |
| **L12** | **Freshness / accuracy** | **Near-real-time on write** (same transaction as link changes). Nightly job is **not** the primary update path — only corrects drift (see §8.3). |

---

## 3. Decision log (all locked)

All product decisions for v1 are locked in **§2**. No open items remain before backend implementation.

## 4. API surface

### 4.1 Endpoints in scope

| Method | Path | Change |
|--------|------|--------|
| **GET** | `/api/TechStacks` | Add `usageCount` per row (global formula) |
| **GET** | `/api/TechStacks?technicalAspectTypeId={id}` | Add `usageCount` per row (scoped formula — **L2**) |
| **POST** | `/api/TechStacks` | Response includes **`usageCount: 0`** (L9) |

**Out of scope for this contract:** search endpoint (`/api/tech-stacks/search`), employer stacks, changing create/link semantics, persisting `technicalAspectTypeIds` on projects.

### 4.2 Query parameters (unchanged)

| Param | Type | Behavior |
|-------|------|----------|
| `technicalAspectTypeId` | `int` (optional) | Return only stacks linked to that aspect type via `technical_aspect_type_tech_stacks`. Invalid/inactive id → **400** (existing behavior). |

No new query params required for v1. Optional future: `sortBy=name` for backward-compat tooling — **not requested**.

### 4.3 Response shape

**Global and scoped list items:**

```jsonc
[
  {
    "id": 42,
    "name": "React",
    "usageCount": 87
  }
]
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `id` | `long` | yes | Existing catalog id |
| `name` | `string` | yes | Trimmed display name |
| `usageCount` | `int` | yes | **≥ 0**. Integer; no floats. |

**`POST /api/TechStacks` create response:** same shape; **`usageCount` must be `0`** (L9).

**Backward compatibility:** Existing clients that ignore unknown fields continue to work. FE normalizer treats missing/invalid `usageCount` as **`0`**.

### 4.4 Sort order (locked — L10)

Backend **must** return items in this order (FE also sorts idempotently):

```
ORDER BY usageCount DESC, name ASC  -- case-insensitive name compare
```

Zero-usage stacks appear after all positive counts; among zeros, alphabetical.

### 4.5 HTTP status codes (unchanged)

| Code | When |
|------|------|
| **200** | Success |
| **400** | Invalid `technicalAspectTypeId` |
| **5xx** | Server error |

---

## 5. Global `usageCount` definition (locked — L1)

Use **live** or **materialized** counts; the **semantic definition** is:

```text
distinct_candidates(S) =
  COUNT(DISTINCT candidate_id FROM (
    SELECT cts.candidate_id FROM candidate_tech_stacks cts
      INNER JOIN candidates c ON c.id = cts.candidate_id
      WHERE cts.tech_stack_id = S AND c.DeletedAt IS NULL
    UNION
    SELECT we.candidate_id FROM candidate_work_experience_tech_stacks wets
      INNER JOIN candidate_work_experiences we ON we.id = wets.work_experience_id
      INNER JOIN candidates c ON c.id = we.candidate_id
      WHERE wets.tech_stack_id = S AND c.DeletedAt IS NULL
  ) u)

distinct_projects(S) =
  COUNT(DISTINCT pts.project_id
        FROM project_tech_stacks pts
        INNER JOIN projects p ON p.id = pts.project_id
        WHERE pts.tech_stack_id = S AND p.DeletedAt IS NULL)

usageCount_global(S) = distinct_candidates(S) + distinct_projects(S)
```

**L8:** `distinct_candidates` uses **UNION** across top-level and work-experience links — never sum the two sources separately.

### 5.1 Source tables (verify exact EF / SQL names in backend repo)

| UI surface | Documented junction table | Contributes to |
|------------|---------------------------|----------------|
| Candidate → Independent Tech Stacks | `candidate_tech_stacks` | Distinct **candidate** |
| Work Experience → Tech Stacks | `candidate_work_experience_tech_stacks` (alias: `work_experience_tech_stacks` in some docs) | Distinct **candidate** (via `work_experience.candidate_id`) |
| Project → Tech Stacks | `project_tech_stacks` | Distinct **project** |
| Employer → Tech Stacks | `employer_tech_stacks` | **Excluded (L6)** |

**Not a separate dimension:** work experience is **not** added as its own counter; it rolls up to **distinct candidate** per L1.

**Nested WE projects:** When a work-experience row links to a catalog `project_id`, project stacks live on **`project_tech_stacks`** for that project — they contribute to the **project** term, not a fourth bucket.

### 5.2 Worked examples (global)

| Data | `usageCount` |
|------|--------------|
| Stack linked to 3 candidates (top-level only) and 2 projects | **5** |
| Same stack on candidate #1 top-level **and** on two WEs for candidate #1 | **1 + project counts** (one distinct candidate — L8) |
| Stack on `employer_tech_stacks` only | **0** (employers excluded) |
| New catalog stack, never linked | **0** |

---

## 6. Scoped `usageCount` definition (locked — L2, Option A)

```text
usageCount_scoped(S, T) =
  COUNT(DISTINCT pts.project_id
        FROM project_tech_stacks pts
        INNER JOIN projects p ON p.id = pts.project_id
        INNER JOIN technical_aspect_type_tech_stacks tats
          ON tats.tech_stack_id = pts.tech_stack_id
         AND tats.technical_aspect_type_id = T
        WHERE pts.tech_stack_id = S
          AND p.DeletedAt IS NULL)
```

**Response filter:** only stacks where ∃ row in `technical_aspect_type_tech_stacks` with `(tech_stack_id = S, technical_aspect_type_id = T)`.

**Important:** Scoped `usageCount` is **independent** of global `usageCount`. A stack may rank high globally (many candidates) but low in a scoped picker (few projects in that aspect family), and vice versa.

---

## 7. Frontend consumption (informational for backend)

| Consumer | API call | Expectation |
|----------|----------|-------------|
| `candidates-page-client.tsx` | `GET /api/TechStacks` | Global usage sort |
| `projects-page-client.tsx` | `GET /api/TechStacks` | Global usage sort |
| `candidate-creation-dialog.tsx` | Global + per-aspect via parent | Usage-ordered multi-selects |
| `project-creation-dialog.tsx` | `?technicalAspectTypeId=` per selected aspect | **Scoped** usage sort (L2) |
| `candidates-filter-dialog.tsx` | Global + scoped | Same |
| `projects-filter-dialog.tsx` | Global + scoped | Same |
| `candidate-details-modal.tsx`, `projects-table.tsx` | Global | Same |

FE **does not** send `usageCount` on write payloads. Sorting is **display-only**.

---

## 8. Caching & maintenance (locked preference — L5)

### 8.1 Recommended schema

**Global counter on catalog row:**

```text
tech_stacks
  global_usage_count  INT NOT NULL DEFAULT 0
```

**Scoped counters (required — L2 Option A):**

```text
tech_stack_aspect_type_usage
  tech_stack_id              BIGINT  NOT NULL  -- FK → tech_stacks
  technical_aspect_type_id   INT     NOT NULL  -- FK → technical_aspect_types
  project_usage_count        INT     NOT NULL DEFAULT 0
  updated_at                 TIMESTAMPTZ
  PRIMARY KEY (tech_stack_id, technical_aspect_type_id)
```

Pre-create scoped rows for each `(stack, aspect type)` pair in `technical_aspect_type_tech_stacks`.

### 8.2 Incremental update hooks

Maintain counts in **application services** (same layer as candidate/project/stack CRUD), not only DB triggers.

| Event | Global counter | Scoped counter (if materialized) |
|-------|----------------|----------------------------------|
| Insert/delete `candidate_tech_stacks` | Recompute or ±1 distinct candidate for stack (respect L8 union) | — |
| Insert/delete `candidate_work_experience_tech_stacks` | ±1 distinct candidate for stack (respect L8 union) | — |
| Insert/delete `project_tech_stacks` | ±1 distinct project for stack | ±1 per aspect type linked to that stack |
| Insert/delete `technical_aspect_type_tech_stacks` | — | Rebuild scoped rows for affected stack |
| Soft-delete / restore candidate | Decrement/increment if link removed/restored | Same for project path |
| Hard-delete candidate/project | Junction CASCADE removes links → decrement | Same |

**Distinct-count caveat:** Incremental ±1 is safe for **insert first link** / **delete last link** per `(stack, candidate)` or `(stack, project)`. When L8 union logic is non-trivial, call **`RebuildForStack(stackId)` synchronously in the same transaction** — do **not** defer to the nightly job (L12).

### 8.3 Freshness strategy (locked — L12)

**Recommended optimal approach:** **write-path synchronous accuracy** + **nightly drift repair**.

| Layer | Role | When it runs |
|-------|------|--------------|
| **Primary — write hooks** | Update materialized counters in the **same DB transaction** as candidate / project / stack saves | Every CRUD that changes junction rows |
| **Fallback — per-stack rebuild** | `RebuildForStack(stackId)` for affected stacks when distinct-candidate (L8) math is easier to recompute than increment | Same transaction, after diffing stack ids |
| **Safety net — full rebuild** | `RebuildAllTechStackUsageCounts` | **Nightly** (drift correction only) |
| **Manual repair (optional)** | `POST /api/TechStacks/rebuild-usage-counts` (admin-only) | Incidents / support |

**Why this is optimal for this product:**

- **Use case is dropdown ordering only** — not billing, auth, or filtering. Perfect global ordering is nice-to-have, but **stale order after a save** is visibly wrong UX (“I just added React — why is it still at the bottom?”).
- **Write hooks** make the **next `GET /api/TechStacks`** reflect the save immediately, with no Redis, no FE cache protocol, and no compute-on-read cost.
- **Nightly reconciliation** is cheap insurance against edge-case drift (failed partial transaction, manual SQL, bug in ±1). It must **not** be the mechanism users wait on for fresh ordering.
- **Do not** rely on “eventual consistency within ~24h” for normal operations — that applies only if write hooks fail and drift survives until the nightly job.

**Per-entity update guidance:**

| Link change | Recommended update |
|-------------|-------------------|
| `project_tech_stacks` insert/delete | ±1 global project count; ±1 scoped count per aspect type linked to that stack |
| `candidate_tech_stacks` / WE stacks diff | Collect affected `tech_stack_id`s → **`RebuildForStack` for each** (simplest correct L8 union), **or** maintain incremental first/last-link tracking if team prefers micro-optimization |
| Soft-delete / restore parent | Same hooks as link removal/addition |
| Bulk import / migration | `RebuildAll()` once at end of batch |

**Acceptance (freshness):** After saving a candidate or project with a new tech stack link, a subsequent `GET /api/TechStacks` (same session, new request) shows updated `usageCount` and sort order **without** waiting for the nightly job.

### 8.4 Reconciliation safety net

| Job | Schedule | Action |
|-----|----------|--------|
| `RebuildAllTechStackUsageCounts` | **Nightly** | Recompute all global (+ scoped) counts from source tables; fix drift only |
| Manual repair (optional) | On demand | `POST /api/TechStacks/rebuild-usage-counts` (admin-only) |

### 8.5 Alternatives (not preferred)

| Approach | Why not default |
|----------|-----------------|
| Compute on every GET | Acceptable at ~400 stacks today; cost grows with junction table size |
| Redis-only cache | Same invalidation complexity without transactional guarantees |

---

## 9. Backend implementation checklist

### 9.1 DTO / controller

- [ ] Add `UsageCount` (`int`, ≥ 0) to tech stack **list** DTO returned by `GET /api/TechStacks`.
- [ ] Map from materialized column or live aggregate per §5 / §6.
- [ ] Apply sort §4.4 (L10 — required).
- [ ] Scoped GET: filter + scoped count per §6 (Option A).
- [ ] POST response: **`usageCount: 0`** (L9).

### 9.2 Domain service (`TechStackUsageService` or extend `TechStackService`)

- [ ] `GetGlobalUsageCount(stackId)` / batch for list endpoint
- [ ] `GetScopedUsageCount(stackId, aspectTypeId)`
- [ ] `OnCandidateTechStacksChanged(candidateId, before, after)`
- [ ] `OnWorkExperienceTechStacksChanged(workExperienceId, before, after)`
- [ ] `OnProjectTechStacksChanged(projectId, before, after)`
- [ ] `OnStackAspectTypeLinksChanged(stackId, before, after)`
- [ ] `RebuildForStack(stackId)` / `RebuildAll()`

### 9.3 Migration

- [ ] Add columns/tables §8.1
- [ ] One-time backfill using formulas §5 / §6
- [ ] Verify backfill totals on sample stacks before deploy

### 9.4 Tests

| Case | Expected |
|------|----------|
| 3 distinct candidates + 2 distinct projects use stack | `usageCount = 5` |
| Same candidate, top-level + WE link | `usageCount` candidate term = **1** (L8) |
| Soft-deleted candidate with link | **Excluded** (L7) |
| Employer-only stack | `usageCount = 0` |
| POST create new stack | Response `{ id, name, usageCount: 0 }`; appears at bottom of GET list |
| After candidate/project save | Next GET shows updated counts without nightly job (L12) |
| Tie on count | Alphabetical by `name` |
| Scoped GET | Count ignores candidates; only non-deleted projects with stack in aspect type |
| Invalid `technicalAspectTypeId` | **400** |

---

## 10. Rollout

1. Deploy backend (migration + backfill + GET/POST API).
2. Verify via Swagger/curl (see §11).
3. Frontend already consumes `usageCount`; no FE deploy strictly required for correctness (missing → alphabetical).

---

## 11. Verification commands

```http
GET /api/TechStacks
GET /api/TechStacks?technicalAspectTypeId=3
```

**Acceptance:**

- Every item has `usageCount` ≥ 0.
- JSON array is pre-sorted (L10).
- Highest-usage stacks appear first.
- React/.NET/etc. order reflects real data after backfill.
- Scoped response ⊆ stacks linked to aspect type; scoped counts may differ from global (L2).

---

## 12. Prompt to forward (backend AI agent)

> Implement **`usageCount`** on **`GET /api/TechStacks`** and **`GET /api/TechStacks?technicalAspectTypeId=`** per **`docs/TECH_STACKS_USAGE_COUNT_BACKEND_CONTRACT.md`**.
>
> **Locked semantics:**
> - **Global:** UNION-distinct candidates (`candidate_tech_stacks` ∪ WE stacks) + distinct non-deleted projects; exclude employers; exclude soft-deleted parents (L7); one candidate once per stack (L8).
> - **Scoped (`?technicalAspectTypeId=`):** distinct non-deleted projects only, where stack is linked to that aspect type (L2 Option A).
> - **POST:** return **`usageCount: 0`** on create (L9).
> - **Sort:** backend **must** pre-sort JSON `usageCount DESC`, `name ASC` (L10); no `usageBreakdown` (L11).
> - **Caching / freshness:** materialized counters updated **synchronously on write** (L12); nightly `RebuildAll` for drift only (§8.3–§8.4).
>
> **Deliverables:** migration + backfill, incremental hooks on candidate/project/stack writes, updated list DTO, tests in §9.4, Swagger updated.

---

## 13. Related docs

| Doc | Relevance |
|-----|-----------|
| `docs/APPLICATION_DOCUMENTATION.md` §5 | Junction table relationships |
| `docs/CANDIDATE-API-REFERENCE.md` §6.1 | Candidate / WE tech stack DTOs |
| `docs/candidate_technical_aspect_type_ids_backend_prompt.md` | Aspect type ↔ stack M:N |
| `docs/CandidateFilterIntegration.md` | `workExperienceTechStackIds` vs project `techStackIds` |
| `src/lib/utils/tech-stack-lookup.ts` | FE sort/normalize contract |

---

## 14. Backend implementation status (2026-08-13)

**Shipped** per this contract. Summary from backend team:

### API

| Endpoint | Behavior |
|----------|----------|
| `GET /api/TechStacks` | `{ id, name, usageCount }[]`; pre-sorted `usageCount DESC`, `name ASC` (L10) |
| `GET /api/TechStacks?technicalAspectTypeId=` | Scoped project-only counts (L2 Option A); same sort |
| `POST /api/TechStacks` | **New** stack → `usageCount: 0` (L9). **Dedupe-by-name** (existing stack) → returns **actual** `usageCount` (expected; not a new stack) |
| `POST /api/TechStacks/rebuild-usage-counts` | Manual repair |

### Semantics

- Global (L1, L7, L8): UNION-distinct active candidates (top-level + WE) + distinct active projects; employers excluded; soft-deleted parents excluded; one candidate once per stack.
- Scoped (L2): distinct active projects only; candidate usage ignored.

### Storage & freshness (L5, L12)

| Artifact | Notes |
|----------|-------|
| Migration `20260813120000_AddTechStackUsageCounts` | `tech_stacks.global_usage_count`, `tech_stack_aspect_type_usage` |
| Deploy backfill | SQL backfill on migration |
| Write hooks | Rebuild affected stacks after candidate / project / stack link changes |
| `TechStackUsageReconciliationHostedService` | **Nightly + startup** `RebuildAll` (startup rebuild is additive vs contract; acceptable drift repair) |

### Frontend readiness

FE **requires no deploy** for basic integration:

- `fetchTechStacks()` normalizes `usageCount` and sorts (`src/lib/utils/tech-stack-lookup.ts`, `lookups-api.ts`).
- Missing `usageCount` still defaults to `0` (backward compat).
- `createTechStack()` POST response `{ id, name, usageCount? }` is merged into page lookup state at runtime even though the TS return type is still `LookupItem`.

### Suggested manual QA (FE)

1. Open **Create Candidate** → Tech Stacks dropdown — popular stacks near top.
2. Open **Create Project** → pick aspect type → Technologies — order may differ from global (scoped counts).
3. **Add technology** (new name) — appears at bottom until used.
4. **Add technology** (existing name, dedupe) — existing row retained with real usage rank.
5. Save candidate/project with new stack link → refresh/reopen dialog → stack moved up without waiting for nightly job.

---

*Document version: 2026-08-13 (backend shipped; §14 added).*
