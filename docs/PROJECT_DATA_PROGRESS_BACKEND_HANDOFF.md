# Project Data Progress — Backend Handoff

Handoff for implementing **per-project Data Progress** (Phase 1). Mirrors the candidate progress pattern.

**Product spec (locked):** [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Frontend handoff:** [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md)  
**Reference:** Candidate columns `data_progress_percentage`, `GET /api/candidates/{id}/data-progress`

**Status:** Not implemented — contract for implementation.  
**Phasing:** Phase 1 only (dashboard projects module = Phase 2).

---

## 0. Locked decisions

| # | Decision |
|---|----------|
| **P1** | Store `projects.data_progress_percentage` (0–100, 1 decimal) + `data_progress_updated_at` |
| **P2** | Backend owns scoring; weights in locked spec §3 (total 100%) |
| **P3** | Technical 20%: all-or-nothing; ≥1 `techStack` + ≥1 `aspectTypeLabel` at project level |
| **P4** | Employer required for **all** project types |
| **P5** | End date always required |
| **P6** | Published/platforms/download always in denominator; `download_count` must be **> 0** to earn |
| **P7** | List API returns `dataProgressPercentage`; filter `minDataProgressPercentage` / `maxDataProgressPercentage` |
| **P8** | Recalc on all project mutations (create/update/delete + junction changes) |
| **P9** | Dashboard `projects` module **unchanged** in Phase 1 (`available: false`) |

---

## 1. Database migration

Add to `projects` table:

```sql
ALTER TABLE projects
  ADD COLUMN data_progress_percentage NUMERIC(5,1) NOT NULL DEFAULT 0,
  ADD COLUMN data_progress_updated_at TIMESTAMPTZ NULL;

CREATE INDEX ix_projects_data_progress_percentage
  ON projects (data_progress_percentage)
  WHERE deleted_at IS NULL;
```

Adjust naming to match existing EF conventions. Backfill: run recalc for all active projects after deploy.

---

## 2. Scoring service

Implement `IProjectDataProgressService` / `ProjectDataProgressCalculator` (names flexible).

### 2.1 Input model

Load project with:

- Scalar columns: `name`, `employer_id`, `type`, `status`, `min_team_size`, `max_team_size`, `start_date`, `end_date`, `description`, `latest_update`, `link`, `is_published`, `download_count`
- Collections: `client_locations`, `tech_stacks` (or `project_tech_stacks`), `vertical_domains`, `horizontal_domains`, `technical_domains`, `publish_platforms`
- Derived: distinct `aspect_type_labels` (same logic as list/detail DTO today — from tech stacks’ aspect types)

### 2.2 Field rules (implement exactly)

| Weight | Rule |
|--------|------|
| 5 | `name` IS NOT NULL |
| 7.5 | `employer_id` IS NOT NULL |
| 5 | `client_locations` count ≥ 1 |
| 1 | `type` IS NOT NULL |
| 2.5 | `status` IS NOT NULL |
| 2.5 | `min_team_size` IS NOT NULL |
| 2.5 | `max_team_size` IS NOT NULL |
| 2.5 | `start_date` IS NOT NULL |
| 2.5 | `end_date` IS NOT NULL |
| 20 | `tech_stacks` count ≥ 1 **AND** `aspect_type_labels` count ≥ 1 (else 0) |
| 10 | `vertical_domains` count ≥ 1 |
| 10 | `horizontal_domains` count ≥ 1 |
| 10 | `technical_domains` count ≥ 1 |
| 10 | `description` IS NOT NULL |
| 1 | `latest_update` IS NOT NULL |
| 5 | `link` IS NOT NULL |
| 1 | `is_published = true` |
| 1 | `publish_platforms` count ≥ 1 |
| 1 | `download_count` IS NOT NULL AND `download_count` > 0 |

`overallPercentage = ROUND(SUM(earned weights), 1)`.

### 2.3 Section aggregation

| `sectionKey` | Fields included |
|--------------|-----------------|
| `basicInformation` | name, employer, client location, type, status, min/max team size |
| `projectDates` | start, end |
| `technicalAspectsAndTechStacks` | single 20% bucket |
| `domains` | vertical, horizontal, technical |
| `descriptionAndLinks` | description, latest_update, link, published, platforms, download |

Use human `missingFields` labels from locked spec §3.

---

## 3. Persistence & recalc triggers

After successful commit of:

- `POST /api/projects`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}` (soft delete — optional recalc or leave stale; prefer recalc fleet on read or skip)
- Any mutation touching: client locations, tech stack links, domain links, publish platforms

Call:

```csharp
await _projectDataProgressService.RecalculateAndSaveAsync(projectId, ct);
```

Mirror candidate recalc hook pattern (search codebase for `data_progress_percentage` update on candidate mutations).

---

## 4. API endpoints

### 4.1 List — extend `GET /api/projects`

Add to each item DTO:

```json
{
  "id": 12,
  "name": "Payments API",
  "dataProgressPercentage": 67.5
}
```

**Query filters (new):**

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | decimal | Inclusive 0–100 |
| `maxDataProgressPercentage` | decimal | Inclusive 0–100; must be ≥ min |

Return `400` if out of range or min > max (match candidates filter behavior).

### 4.2 Detail breakdown — new

```http
GET /api/projects/{projectId}/data-progress
```

**200 response:**

```json
{
  "projectId": 12,
  "overallPercentage": 67.5,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 20.5,
      "maxScore": 26,
      "percentage": 78.8,
      "missingFields": ["Employer", "Max Team Size"]
    },
    {
      "sectionKey": "projectDates",
      "sectionName": "Project Dates",
      "score": 2.5,
      "maxScore": 5,
      "percentage": 50.0,
      "missingFields": ["End Date"]
    },
    {
      "sectionKey": "technicalAspectsAndTechStacks",
      "sectionName": "Technical Aspects & Tech Stacks",
      "score": 0,
      "maxScore": 20,
      "percentage": 0,
      "missingFields": ["Technical Aspects & Tech Stacks"]
    },
    {
      "sectionKey": "domains",
      "sectionName": "Domains",
      "score": 20,
      "maxScore": 30,
      "percentage": 66.7,
      "missingFields": ["Technical Domains"]
    },
    {
      "sectionKey": "descriptionAndLinks",
      "sectionName": "Description & Links",
      "score": 16,
      "maxScore": 19,
      "percentage": 84.2,
      "missingFields": ["Download Count"]
    }
  ]
}
```

**404** if project not found or soft-deleted (match project GET semantics).

Types align with `src/lib/types/project-data-progress.ts` (frontend will add).

---

## 5. Architecture (suggested)

```
ProjectsController
  └── IProjectDataProgressService
        ├── ProjectDataProgressCalculator (pure scoring)
        └── IProjectRepository (load aggregates)
```

Reuse patterns from `CandidateDataProgressService` if it exists in the backend repo.

| Layer | Action |
|-------|--------|
| Domain | Optional value object for section scores |
| Application | Service + DTOs + recalc orchestration |
| Infrastructure | EF queries with includes for junction tables |
| API | New GET action; extend list DTO + filter |

---

## 6. Phase 2 pointer (dashboard — not Phase 1)

Do **not** change `DashboardDataProgressService` in Phase 1.

Phase 2 checklist (separate PR):

- [ ] Read `projects.data_progress_percentage` for snapshots + live today
- [ ] Set `summary.modules[projects].available = true`
- [ ] Update D2 in dashboard docs (candidates + projects)

---

## 7. Frontend integration checklist (Phase 1)

| File | Action |
|------|--------|
| `src/lib/types/project-data-progress.ts` | New types |
| `src/lib/services/projects-api.ts` | Map `dataProgressPercentage`; filter params; `fetchProjectDataProgress` |
| `src/lib/utils/project-data-progress.ts` | Tier/badge helpers (reuse or share with candidate helpers) |
| `src/components/projects-table.tsx` | Data Progress column only (no dialog panel in Phase 1) |
| `src/components/projects-filter-dialog.tsx` | Min/max % filters |

---

## 8. Contract checklist

- [ ] Migration `data_progress_percentage` + `data_progress_updated_at`
- [ ] Scoring matches locked weights §3
- [ ] Backfill job / script for existing projects
- [ ] Recalc hooks on all mutations
- [ ] `GET /api/projects/{id}/data-progress`
- [ ] List field + filter params
- [ ] Dashboard unchanged (projects still `available: false`)

---

## 9. Agent prompt (backend)

```
Implement Project Data Progress Phase 1 per docs/PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md
and docs/PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

Add projects.data_progress_percentage + data_progress_updated_at; recalc on all project
mutations. Scoring: exact field weights (100% total); technical 20% all-or-nothing
(>=1 tech stack AND >=1 aspect type label at project level); employer required for all
types; end date always required; download_count > 0 to earn 1%.

Expose GET /api/projects/{id}/data-progress with 5 sections + missingFields.
Extend GET /api/projects with dataProgressPercentage and min/max filter params.

Do NOT enable dashboard projects module (Phase 2). Mirror candidate data progress patterns.
```

---

## 10. Related documents

| Document | Purpose |
|----------|---------|
| [`PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./PROJECT_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Locked weights & UI rules |
| [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) | Frontend agent guide |
| [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md) | Candidate reference |
