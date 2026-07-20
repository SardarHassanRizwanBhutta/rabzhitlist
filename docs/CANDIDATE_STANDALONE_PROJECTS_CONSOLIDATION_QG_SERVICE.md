# Question Generation Service — Remove Independent Projects Section

**Status:** Python QG shipped (prod/local). FE types/response mapping aligned — no `independent_projects` filter.  
**Audience:** Python Question Generation service / AI agent implementing the change.  
**Scope:** Stop emitting the Independent Projects section entirely. All candidate projects live under Work Experience (including orphan WEs with null/empty employer + job title).

**Related:**
- [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_BACKEND_HANDOFF.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_BACKEND_HANDOFF.md) — ASP.NET cutover (done)
- [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_FRONTEND_INTEGRATION.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_FRONTEND_INTEGRATION.md) — FE Phase 1 + Phase 2
- [`FRONTEND_INTEGRATION_CONTRACT.md`](./FRONTEND_INTEGRATION_CONTRACT.md) — QG↔FE contract (updated)
- [`CANDIDATE_DATA_MAPPING.md`](./CANDIDATE_DATA_MAPPING.md) — missing-field key rules (updated)
- [`CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md`](./CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md) — request `candidate_data` shape (updated)

---

## 1. Summary (locked)

| Area | Before | After (required) |
|------|--------|------------------|
| Response section id | `independent_projects` | **Never emit** |
| Response field keys | `projects`, `project_{j}_*` | **Never emit** |
| Request `candidate_data.projects` | Optional top-level array | **Omit from contract**; if present → **ignore** (do not score) |
| Nested WE projects | `workExperiences[i].projects[]` → `work_experience_{i}_project_{j}_*` | **Unchanged** — sole project source |
| Section count / tab order | 7 sections (incl. Independent Projects) | **6 sections** (drop Independent Projects) |
| Independent Tech Stacks | `independent_tech_stacks` | **Unchanged** (keep) |

Deploy order: Python shipped; FE no longer filters `independent_projects` (type removed from `QuestionSectionId`).

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **QG1** | Remove `independent_projects` from `QuestionSectionId` and from every `GenerateQuestionsResponse.sections[]` entry |
| **QG2** | Do **not** emit missing-field keys `projects` or `project_{j}_*` (including synthetic `project_0_*` when empty) |
| **QG3** | Do **not** generate questions with `section: "independent_projects"` or `field` matching `^projects$` / `^project_\d+_` |
| **QG4** | Score nested projects **only** via `workExperiences[].projects[]` → keys `work_experience_{i}_projects` and `work_experience_{i}_project_{j}_*` (existing WE rules) |
| **QG5** | If request body still includes top-level `projects[]` → **ignore** (no 4xx required); do not map into missing fields or questions |
| **QG6** | Orphan WEs (`employerName` / `jobTitle` null or empty, with nested `projects`) remain valid; do **not** invent a synthetic employer label for scoring; follow existing WE empty-row / nested-project rules |
| **QG7** | Keep `independent_tech_stacks` (standalone tech stacks ≠ standalone projects) |
| **QG8** | `total_questions` and section labels must exclude Independent Projects |

---

## 3. Response contract changes

### 3.1 `QuestionSectionId` (new fixed order)

1. `basic_information`
2. `work_experience`
3. `independent_tech_stacks`
4. `education`
5. `certifications`
6. `achievements`

**Removed:** `independent_projects`

### 3.2 Forbidden in response

Do not return any of the following after cutover:

```text
sections[].section === "independent_projects"
missing_fields containing: "projects" | "project_0_projectName" | "project_{j}_*"
questions[].section === "independent_projects"
questions[].field matching: ^projects$ | ^project_\d+_
```

### 3.3 Still required (unchanged)

Work Experience nested projects (examples):

| Key pattern | When |
|-------------|------|
| `work_experience_{i}_projects` | Nested projects array empty (opener) |
| `work_experience_{i}_project_{j}_projectName` | Link / enrichment |
| `work_experience_{i}_project_{j}_contributionNotes` | Link / enrichment |
| `work_experience_{i}_project_{j}_*` (catalog suffixes) | Same as today for nested WE projects |

UI tab count: **6** API sections (FE may still show a frontend-only Preferences split from basic — out of scope for Python).

---

## 4. Request `candidate_data` changes

### 4.1 Stop requiring / documenting top-level `projects`

| Property | Action |
|----------|--------|
| `projects` | **Removed** from the supported `CandidateDataForQuestionService` contract |
| `workExperiences[].projects` | **Required path** for all project link + catalog gap detection |

Frontend (`mapMainAppCandidateToQuestionService`) already omits `projects`.

### 4.2 Legacy clients

If `projects` is present on the request:

1. Do **not** fail validation solely because of it (QG5).
2. Do **not** use it for missing-field detection or question generation.
3. Prefer logging/metrics once if useful, then drop.

---

## 5. Code / config checklist (Python)

- [ ] Remove `independent_projects` from section enum / registry / fixed order list
- [ ] Remove missing-field detectors for top-level `projects[]` and synthetic `project_0_*`
- [ ] Remove question builders / enrichment (§ 4.10 / § 4.11 style) for Independent Projects
- [ ] Remove OpenAPI / Pydantic field for request `projects` **or** keep optional + ignored (document as deprecated ignored)
- [ ] Update unit/integration tests that assert 7 sections or `independent_projects`
- [ ] Confirm WE nested project tests still pass (empty nested → opener + `work_experience_{i}_project_0_*`)
- [ ] Confirm orphan WE payload (null employer/title + nested projects) still produces WE project keys only
- [ ] Smoke: POST generate-questions without `projects` → response has **no** `independent_projects` section
- [ ] Smoke: POST with legacy `projects: [...]` → same (ignored); still no Independent section

---

## 6. Smoke tests

1. Candidate with only nested WE projects → questions/missing fields under `work_experience` only; no Independent section.
2. Candidate with orphan WE (empty employer/title + nested projects) → nested `work_experience_{i}_project_*` keys; no `project_*` top-level keys.
3. Candidate with empty `workExperiences` → existing WE empty-section behavior; **no** Independent Projects synthetic `project_0_*`.
4. Response `sections.map(s => s.section)` equals the 6 ids in §3.1 (order preserved).
5. `total_questions` equals sum of questions across those 6 sections only.

---

## 7. Agent prompt (Python QG)

```
Implement QG Independent Projects removal per
docs/CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_QG_SERVICE.md.

Stop emitting section independent_projects and all top-level projects /
project_* missing-field keys and questions. Ignore request candidate_data.projects
if present. Keep independent_tech_stacks. Score projects only via
workExperiences[].projects → work_experience_{i}_project_{j}_* (and WE projects opener).
Do not invent product rules beyond the locked decisions table (QG1–QG8).
```

---

## 8. Follow-ups (docs after Python ships)

| Document | Status |
|----------|--------|
| `FRONTEND_INTEGRATION_CONTRACT.md` | Updated by QG agent |
| `CANDIDATE_DATA_MAPPING.md` | Updated by QG agent |
| `CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md` | Updated by QG agent; FE wording cleanup done |
| FE types `QuestionSectionId` | `"independent_projects"` removed; response filter dropped |
