# Candidate Standalone Projects Consolidation — Backend Handoff

**Status:** Backend **implemented** (2026-07-15). Cutover SQL + EF commands: [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_CUTOVER.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_CUTOVER.md).  
**Audience:** Backend AI agent / engineer.  
**Scope:** Migrate `candidate_projects` → orphan work experiences + `candidate_work_experience_projects`; hard-remove top-level candidate `projects[]`; allow null/empty `jobTitle` + nullable `employerId` on work experiences.

**Frontend:** [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_FRONTEND_INTEGRATION.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_FRONTEND_INTEGRATION.md)  
**API reference (current, pre-change):** [`CANDIDATE-API-REFERENCE.md`](./CANDIDATE-API-REFERENCE.md)  
**Filters / match paths:** [`CandidateFilterIntegration.md`](./CandidateFilterIntegration.md), matched-projects docs (dual link path today)

**Deploy order (locked):** **Backend migrate + hard-remove `projects[]` first** (local + prod), then frontend removal.  
**Cutover note:** No new candidates will be created while shipping backend + frontend — **no dual-write** required.

---

## 1. Product summary

| Before | After |
|--------|--------|
| Projects live under Work Experience **and** a separate candidate-level Projects section (`candidate_projects`) | **All** candidate–project links live under work experiences only (`candidate_work_experience_projects`) |
| Top-level API `projects[]` | **Hard-removed** from create / update / GET |
| Nested CRUD `/api/candidates/{id}/projects/...` | **Removed** (or permanently 410) |
| Standalone / resume “personal” projects | Stored as projects on an **orphan** work experience (`employerId` null, `jobTitle` null/empty) |

**Why:** Consolidate project UX so end users only edit projects inside Work Experience.

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **CSP1** | Remove standalone project storage (`candidate_projects` table) after migration |
| **CSP2** | Preserve same `project_id` + contribution when moving rows into `candidate_work_experience_projects` |
| **CSP3** | One **new** orphan WE per candidate that had ≥1 standalone project — **do not reuse** an existing WE even if that WE already has null employer + empty title |
| **CSP4** | That orphan WE holds **all** former standalone projects for the candidate |
| **CSP5** | If the same `project_id` already exists under another WE for that candidate → **still insert** under the orphan WE (**duplicate links allowed**) |
| **CSP6** | Copy contribution text **as-is** onto the WE project row |
| **CSP7** | `employerId` and `jobTitle` may be **null/empty** on create/update for work experiences |
| **CSP8** | Hard-remove top-level `projects[]` from DTOs and persistence (create/update reject or omit; GET omits) |
| **CSP9** | **No dual-write** — cutover assumes no candidate create traffic during backend + FE ship |
| **CSP10** | Avg tenure / filters: **no special exclusion** of orphan WEs for this release |
| **CSP11** | Run migration on **local and prod** before FE removal |

---

## 3. Schema / API changes

### 3.1 Work experience nullability

Confirm (and migrate if needed) that:

- `candidate_work_experiences.employer_id` is **nullable**
- `candidate_work_experiences.job_title` is **nullable** (or empty string allowed) — **override prior docs that marked `jobTitle` as required**

Validation: create/update WE must accept `employerId: null` and `jobTitle: null` or `""`.

### 3.2 Remove top-level projects API surface

| Change | Detail |
|--------|--------|
| `CreateCandidateDto` / `UpdateCandidateDto` | Remove `projects` / `Projects` property |
| `CandidateDto` (GET by id / create response) | Remove top-level `projects` array |
| Nested routes | Remove or return **410 Gone**: `GET/PUT/DELETE /api/candidates/{candidateId}/projects/...` |
| List/search mapping | Project filters continue via **`candidate_work_experience_projects` only** (drop `candidate_projects` OR path after cutover) |

### 3.3 No dual-write (CSP9)

After migration, **immediately** remove top-level `projects[]` from the API contract:

- Create/update: do **not** persist `candidate_projects`; if clients still send `projects[]`, **400** (or ignore with no write — prefer **400** for clarity).
- GET: omit top-level `projects`.

No transitional “accept old `projects[]` and rewrite to orphan WE” path — product will not create candidates during the ship window.

---

## 4. Data migration (local + prod)

### 4.1 Preconditions

- Backup / snapshot prod.
- Confirm FKs: `candidate_projects.candidate_id`, `candidate_projects.project_id`, contribution column name (`contribution` / equivalent).
- Confirm `candidate_work_experience_projects` unique constraints: if unique on `(work_experience_id, project_id)` only, duplicates across different WEs are fine (CSP5). If unique on `(candidate_id, project_id)` somehow — **this migration would fail**; verify no candidate-level uniqueness blocks CSP5.

### 4.2 Algorithm (per candidate with ≥1 `candidate_projects` row)

```
FOR EACH candidate_id WITH COUNT(candidate_projects) >= 1:
  INSERT candidate_work_experiences (
    candidate_id,
    employer_id = NULL,
    job_title = NULL,   -- or '' if column NOT NULL empty-string
    start_date = NULL,
    end_date = NULL,
    ...defaults...
  ) → orphan_we_id   -- ALWAYS new row (CSP3 / CSP4)

  FOR EACH row IN candidate_projects WHERE candidate_id = ...:
    INSERT candidate_work_experience_projects (
      work_experience_id = orphan_we_id,
      project_id = row.project_id,      -- CSP2 preserve
      contribution = row.contribution     -- CSP6 as-is
    )
    -- CSP5: insert even if project_id already on another WE

  DELETE (or soft-delete) those candidate_projects rows
```

Batch in a transaction per candidate or per chunk; log candidates processed + row counts.

### 4.3 Drop table (after migration + FE removal)

Only after:

1. Migration complete (zero remaining active `candidate_projects` rows, or intentional leftovers reviewed).
2. Application code no longer reads/writes `candidate_projects`.
3. Prefer drop after FE removal is verified; safe earlier if no code path writes the table.

```sql
-- After cutover verification
DROP TABLE candidate_projects;  -- exact name: confirm schema (candidate_projects vs candidates_projects)
```

Confirm table name against live schema (`candidate_projects` per CANDIDATE-API-REFERENCE / filter docs).

---

## 5. Downstream systems (backend)

| Area | Action |
|------|--------|
| Candidate filters (`projectIds`, tech/domain via projects) | Query **only** via work-experience project links after cutover |
| Matched projects / technical aspect type filters | Same — remove `candidate_projects` join path |
| Question-generation / export payloads | Stop emitting standalone `projects[]`; nested WE `projects[]` only |
| Swagger / OpenAPI | Update DTOs; mark jobTitle optional |

---

## 6. Backend checklist

- [x] Nullable `employer_id` + nullable/empty `job_title` on WE create/update
- [ ] Data SQL + EF `database update` — **you run** per cutover runbook (local first)
- [x] CSP5 duplicate links OK (PK is work_experience_id + project_id)
- [x] Hard-remove top-level `projects` from GET; create with `projects` → 400; nested controller deleted
- [x] Filter / match: WE projects only
- [x] EF migration drops `candidate_projects` (after your data SQL)
- [ ] Smoke tests §7 after your cutover

---

## 7. Smoke tests

1. **Migration:** Candidate with N standalone rows → 1 new orphan WE, N WE-project rows, same `project_id`s + contributions; `candidate_projects` empty for that candidate.
2. **CSP5:** Candidate who already had project P on WE₁ and standalone P → after migrate, P on WE₁ **and** on orphan WE.
3. **Create WE:** `{ "employerId": null, "jobTitle": null, "projects": [{ "projectId": X, "contribution": "…" }] }` succeeds.
4. **Create candidate:** body **without** top-level `projects` succeeds; body **with** `projects` after hard-remove → **400**.
5. **GET candidate:** no top-level `projects`; orphan WE appears under `workExperiences` with null employer/title and nested projects.
6. **Filter by projectId:** still finds candidates linked only via former standalone (now WE path).

---

## 8. Agent prompt (backend)

```
Implement Candidate Standalone Projects Consolidation per
docs/CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_BACKEND_HANDOFF.md.

- Allow null employerId and null/empty jobTitle on work experiences.
- Migrate candidate_projects → one NEW orphan WE per candidate (≥1 standalone)
  holding all links; preserve project_id + contribution; allow duplicate
  project_id on orphan WE if already linked elsewhere.
- Hard-remove top-level projects[] (no dual-write). Migrate then drop
  candidate_projects. Deploy backend before FE; no candidate creates during cutover.
- Update filters/match joins to WE project links only.
Do not invent product rules beyond the locked decisions table.
```

---

## 9. Related documents

| Document | Purpose |
|----------|---------|
| [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_FRONTEND_INTEGRATION.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_FRONTEND_INTEGRATION.md) | FE removal + resume remap |
| [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_CUTOVER.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_CUTOVER.md) | Manual data SQL + EF commands |
| [`CANDIDATE-API-REFERENCE.md`](./CANDIDATE-API-REFERENCE.md) | Pre-change API (update after ship) |
| [`CandidateFilterIntegration.md`](./CandidateFilterIntegration.md) | Filter joins |
| [`CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md`](./CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md) | Payload shape (drop standalone projects) |
| [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) | Resume parser still may emit `standalone_projects` (FE remaps) |
