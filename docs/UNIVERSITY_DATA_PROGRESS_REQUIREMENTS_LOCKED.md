# University Data Progress — Locked Product Requirements (v1)

**Status:** Locked (2026-07).  
**Audience:** Product, frontend, backend.  
**Phasing:** **Phase 1** — entity progress (stored %, list, breakdown API, filters). **Phase 2** — dashboard `universities` module (`available: true`).  
**Backend handoff:** [`UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md`](./UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Frontend handoff:** [`university_data_progress_frontend_integration.md`](./university_data_progress_frontend_integration.md)

---

## 1. Scope

| Phase | In scope |
|-------|----------|
| **Phase 1** | Per-university `data_progress_percentage`; recalc on mutations; `GET /api/universities/{id}/data-progress` (API only); list field; universities table column; min/max % filters |
| **Phase 1 deferred** | Data Progress panel in `UniversityDetailsModal` |
| **Phase 2** | Dashboard overview/detail for **universities** module (see [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md)) |

**Out of scope (v1):**

- Frontend calculation of progress (backend owns all scoring)
- Data **Verification** (cold-caller verified fields) — separate feature
- **Employers** dashboard progress (unchanged)
- **Certifications** entity/dashboard — see [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)

**Delivery:** Universities and certifications entity work ship **in parallel** (separate modules, same phase).

---

## 2. Core rules

1. **Overall** completeness is **0–100%** (one decimal), sum of **field weights** earned.
2. **Denominator is always 100%** — campus fields (45%) count toward max even when there are **zero** campus rows (campus earns 0%).
3. **“Filled”** for strings/URLs: **non-null** and **non-empty after trim**. No URL format validation for scoring.
4. **Country:** earned when `country_id` is **non-null**.
5. **Ranking:** earned when `ranking` enum is **non-null** (any tier 0–3).
6. **Main Campus (15%):** earned when `is_main_campus = true` on the **scoring location row** (see §3.2).
7. **Campus Locations scoring** uses **one** location row per university per recalc (§3.2) — not per-location stacking beyond 45% max.
8. **Multiselect / collection:** not applicable to basic scalars; campus is evaluated per §3.2.

---

## 3. Field weights (total 100%)

### 3.1 Basic Information — section max **55%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Name | `Name` | 15 | `name` non-null and non-empty after trim |
| Country | `Country` | 5 | `country_id` non-null |
| Ranking | `Ranking` | 5 | `ranking` non-null |
| Website URL | `Website URL` | 15 | `website_url` non-null and non-empty after trim |
| Linkedin URL | `Linkedin URL` | 15 | `linked_in_url` non-null and non-empty after trim |

### 3.2 Campus Locations — section max **45%**

Per-field weights (apply to **one** selected location row only):

| UI label | `missingFields` key | Weight % | Earned when (on selected row) |
|----------|---------------------|----------|-------------------------------|
| City | `City` | 10 | `city` non-null and non-empty after trim |
| Main Campus | `Main Campus` | 15 | `is_main_campus = true` |
| Address | `Address` | 20 | `address` non-null and non-empty after trim |

**UI note:** form label “Office location” maps to **`Address`** in `missingFields`.

#### 3.2.1 Campus scoring algorithm (locked)

Evaluate active campus rows (`university_locations` for the university).

**Step A — full credit (45%):**  
If **any** location has **all three** filled on the **same row** (city + `is_main_campus = true` + address) → earn **45%** for the campus section. `missingFields` for campus = empty.

**Step B — zero locations:**  
If there are **no** campus rows → campus section earns **0%**. `missingFields` = `["City", "Main Campus", "Address"]`.

**Step C — partial credit (no row satisfies Step A):**

1. For each location, count **filled fields** among {city, main campus, address} using rules above.
2. Select the **single best** location:
   - Primary: **highest filled-field count**
   - Tie: prefer row with **`is_main_campus = true`**
   - Tie: prefer row with **higher sum of earned weights** (10 / 15 / 20 per filled field on that row)
   - Tie: **lowest location `id`** (deterministic)
3. From the winning row only, earn **per-field weights** for each filled field (max 45%).
4. `missingFields` = campus labels not earned from the winning row.

**Examples:**

| Scenario | Campus earned | missingFields |
|----------|---------------|---------------|
| 0 locations | 0% | City, Main Campus, Address |
| 1 row: city + main, no address | 25% | Address |
| 2 rows: row A city+address (30 wt); row B main only (15 wt) | 30% from row A | Main Campus |
| 1 row: all three filled | 45% | (none) |

**Check:** 55 + 45 = **100**.

---

## 4. Section breakdown (UI)

Two sections match `UniversityCreationDialog` accordions:

| `sectionKey` | `sectionName` | Max weight % |
|--------------|---------------|--------------|
| `basicInformation` | Basic Information | 55 |
| `campusLocations` | Campus Locations | 45 |

Per section:

- `score` = sum of earned field weights in that section  
- `maxScore` = section max from table above  
- `percentage` = `ROUND(score / maxScore × 100, 1)` (0 if `maxScore = 0`)  
- `missingFields` = human labels from §3 for fields not earning weight in that section  

`overallPercentage` = `ROUND(SUM(all earned weights), 1)`.

---

## 5. API (Phase 1)

| Endpoint / field | Role |
|------------------|------|
| `universities.data_progress_percentage` | Stored overall 0–100 (1 decimal) |
| `universities.data_progress_updated_at` | Last recalc timestamp (UTC) |
| `GET /api/universities` items | Include `dataProgressPercentage` |
| `GET /api/universities/{id}/data-progress` | Section breakdown + `missingFields` |

**Recalc:** After every university create/update/delete and campus location create/update/delete.

**Precision:** One decimal, same as candidates/projects.

---

## 6. Frontend (Phase 1)

| Surface | Behavior |
|---------|----------|
| **Universities table** | Data Progress column (pill/badge), same tier styling as candidates/projects |
| **Universities filter** | `minDataProgressPercentage` / `maxDataProgressPercentage` on list API (0–100 inclusive) |
| **No client scoring** | Display only |

**Deferred (not Phase 1):** Data Progress panel in **`UniversityDetailsModal`**.

---

## 7. Dashboard (Phase 2)

**Handoff:** [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md)

When Phase 2 ships (with certifications):

- `GET /api/dashboard/data-progress` → `summary.modules[universities].available = true`
- Aggregate `universities.data_progress_percentage` like candidates/projects
- Frontend: verify existing dashboard UI (no new components)

**Employers** remain `available: false`.

---

## 8. Related documents

| Document | Purpose |
|----------|---------|
| [`UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md`](./UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend implementation contract |
| [`university_data_progress_frontend_integration.md`](./university_data_progress_frontend_integration.md) | Frontend agent guide |
| [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Parallel certifications module |
| [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md) | Dashboard Phase 2 (both modules) |
| [`candidate_data_progress_frontend_integration.md`](./candidate_data_progress_frontend_integration.md) | Reference pattern |
