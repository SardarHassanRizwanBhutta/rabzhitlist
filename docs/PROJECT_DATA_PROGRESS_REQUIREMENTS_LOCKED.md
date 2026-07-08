# Project Data Progress — Locked Product Requirements (v1)

**Status:** Locked (2026-07).  
**Audience:** Product, frontend, backend.  
**Phasing:** **Phase 1** — entity progress (stored %, list, detail breakdown, filters). **Phase 2** — dashboard `projects` module (`available: true`).  
**Backend handoff:** [`PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md`](./PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Frontend handoff:** [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md)

---

## 1. Scope

| Phase | In scope |
|-------|----------|
| **Phase 1** | Per-project `data_progress_percentage`; recalc on mutations; `GET /api/projects/{id}/data-progress` (API only); list field; projects table column; projects filter by min/max % |
| **Phase 1 deferred** | Data Progress panel in `ProjectDetailDialog` |
| **Phase 2** | Dashboard overview/detail for **projects** module (see [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) §0 — extend D1/D2) |

**Out of scope (v1):**

- Frontend calculation of progress (backend owns all scoring)
- Data **Verification** (cold-caller verified fields) — separate feature; do not conflate with Data Progress
- Employers, universities, certifications dashboard progress (unchanged)

---

## 2. Core rules

1. **Overall** completeness is **0–100%** (one decimal), sum of **field weights** earned.
2. **Denominator is always 100%** — no conditional exclusion of fields from the max (e.g. `publishPlatforms` and `downloadCount` count toward 100% even when `isPublished = false`).
3. **Multiselect fields:** **≥1** selected value earns the **full** field weight (not proportional to count).
4. **Technical Aspects & Tech Stacks (20%):** **All-or-nothing** — earn full 20% when **both** conditions hold at project level: **≥1** tech stack (`techStackIds` / `techStacks`) **and** **≥1** aspect type label (`aspectTypeLabels` derived from stacks). Stack–type linkage per row is **not** required for scoring.
5. **Domain fields (10% each):** **Binary** — 0% or full 10% when **≥1** value in that domain list.
6. **“Filled”** means **non-null** on the stored value (see §4 per field). Strings: non-null in DB/API (empty string counts as filled if non-null).
7. **Employer** is required for **all** project types (including Personal, Academic, etc.).
8. **End date** is **always** required (all statuses).
9. **`isPublished`:** `true` earns the 1% weight; `false` does not.
10. **`downloadCount`:** must be **> 0** to earn its 1% (non-null and zero does **not** earn).

---

## 3. Field weights (total 100%)

### 3.1 Basic Information — section max **26%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Project Name | `Project Name` | 5 | `name` not null |
| Employer | `Employer` | 7.5 | `employer_id` not null |
| Client Location | `Client Location` | 5 | ≥1 client location |
| Project Type | `Project Type` | 1 | `type` not null |
| Project Status | `Project Status` | 2.5 | `status` not null |
| Min Team Size | `Min Team Size` | 2.5 | `min_team_size` not null |
| Max Team Size | `Max Team Size` | 2.5 | `max_team_size` not null |

### 3.2 Project Dates — section max **5%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Start Date | `Start Date` | 2.5 | `start_date` not null |
| End Date | `End Date` | 2.5 | `end_date` not null |

### 3.3 Technical Aspects & Tech Stacks — section max **20%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Technical Aspects & Tech Stacks | `Technical Aspects & Tech Stacks` | 20 | ≥1 tech stack **and** ≥1 aspect type label (all-or-nothing) |

If only one side is present, section earns **0%** and missing field lists `Technical Aspects & Tech Stacks`.

### 3.4 Domains — section max **30%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Vertical Domains | `Vertical Domains` | 10 | ≥1 vertical domain |
| Horizontal Domains | `Horizontal Domains` | 10 | ≥1 horizontal domain |
| Technical Domains | `Technical Domains` | 10 | ≥1 technical domain |

### 3.5 Description & Links — section max **19%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Description | `Description` | 10 | `description` not null |
| Notes | `Notes` | 1 | `notes` not null |
| Link | `Link` | 5 | `link` not null |
| Published App | `Published App` | 1 | `is_published = true` |
| Platforms | `Platforms` | 1 | ≥1 publish platform |
| Download Count | `Download Count` | 1 | `download_count` not null **and** > 0 |

**Check:** 26 + 5 + 20 + 30 + 19 = **100**.

---

## 4. Section breakdown (UI)

Five sections match the project form accordions (`ProjectCreationDialog`; same keys for a future `ProjectDetailDialog` panel):

| `sectionKey` | `sectionName` | Max weight % |
|--------------|---------------|--------------|
| `basicInformation` | Basic Information | 26 |
| `projectDates` | Project Dates | 5 |
| `technicalAspectsAndTechStacks` | Technical Aspects & Tech Stacks | 20 |
| `domains` | Domains | 30 |
| `descriptionAndLinks` | Description & Links | 19 |

Per section:

- `score` = sum of earned field weights in that section  
- `maxScore` = section max from table above  
- `percentage` = `ROUND(score / maxScore × 100, 1)` (0 if `maxScore = 0`)  
- `missingFields` = human labels from §3 for fields not earning weight  

`overallPercentage` = `ROUND(SUM(all earned weights), 1)` (same as sum of section scores).

---

## 5. API (Phase 1)

| Endpoint / field | Role |
|------------------|------|
| `projects.data_progress_percentage` | Stored overall 0–100 (1 decimal) |
| `projects.data_progress_updated_at` | Last recalc timestamp (UTC) |
| `GET /api/projects` items | Include `dataProgressPercentage` |
| `GET /api/projects/{id}/data-progress` | Section breakdown + `missingFields` |

**Recalc:** After every project create/update/delete and junction changes affecting scored fields (locations, stacks, domains, platforms).

**Precision:** One decimal, same as candidates.

---

## 6. Frontend (Phase 1)

| Surface | Behavior |
|---------|----------|
| **Projects table** | Data Progress column (pill/badge), same tier styling pattern as candidates table |
| **Projects filter** | `minDataProgressPercentage` / `maxDataProgressPercentage` on list API (0–100 inclusive) |
| **No client scoring** | Display only |

**Deferred (not Phase 1):** Data Progress panel in **`ProjectDetailDialog`** — do not add until explicitly requested. Backend may still expose `GET /api/projects/{id}/data-progress` for a future UI pass.

---

## 7. Dashboard (Phase 2)

**Handoff:** [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md)

When Phase 2 ships:

- `GET /api/dashboard/data-progress` → `summary.modules[projects].available = true`
- Aggregate `projects.data_progress_percentage` like candidates (fleet sum, avg, snapshots)
- Frontend: verify existing dashboard UI (no new components)

Employers / universities / certifications remain `available: false`.

---

## 8. Related documents

| Document | Purpose |
|----------|---------|
| [`PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md`](./PROJECT_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend implementation contract |
| [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md) | Frontend wiring guide |
| [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md) | Reference pattern (candidates) |
| [`DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_PROJECTS_DATA_PROGRESS_PHASE2.md) | Dashboard Phase 2 backend handoff |
| [`project_data_progress_frontend_integration_phase2.md`](./project_data_progress_frontend_integration_phase2.md) | Dashboard Phase 2 frontend verification |
| [`DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md`](./DASHBOARD_DATA_PROGRESS_BACKEND_HANDOFF.md) | Full dashboard API contract |
