# Employer Data Progress — Locked Product Requirements (v1)

**Status:** Locked (2026-07).  
**Audience:** Product, frontend, backend.  
**Phasing:** **Phase 1** — entity progress (stored %, list, breakdown API, filters). **Phase 2** — dashboard `employers` module (`available: true`).  
**Backend handoff:** [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Frontend handoff:** [`employer_data_progress_frontend_integration.md`](./employer_data_progress_frontend_integration.md)

---

## 1. Scope

| Phase | In scope |
|-------|----------|
| **Phase 1** | Per-employer `data_progress_percentage`; recalc on mutations; `GET /api/employers/{id}/data-progress` (API only); list field; employers table column; min/max % filters |
| **Phase 1 deferred** | Data Progress panel in employer detail UI |
| **Phase 2** | Dashboard overview/detail for **employers** module (see [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md)) |

**Out of scope (v1):**

- Frontend calculation of progress (backend owns all scoring)
- Data **Verification** (cold-caller verified fields) — separate feature

---

## 2. Core rules

1. **Overall** completeness is **0–100%** (one decimal), sum of **field weights** earned.
2. **Denominator is always 100%** — Office Locations (10%) and Layoffs (10%) count toward max even when there are **zero** rows (those sections earn 0%).
3. **“Filled”** for strings/URLs: **non-null** and **non-empty after trim**. No URL format validation for scoring.
4. **Multiselect / collections:** **≥1** value earns the **full** field weight (Status, Type, Time Support Zones, Benefits).
5. **DPL Competitive:** earns only when `is_dpl_competitor` / `isDplCompetitor` / `isDPLCompetitive` is **`true`** (`false` or null does not earn).
6. **Office Locations** and **Layoffs** each score **one** selected row per employer per recalc (§3.4, §3.5) — not stacking beyond section max.
7. **Office Country:** earned when location **`country_id` / `countryId` is non-null** (linked country FK), not merely a free-text name.

---

## 3. Field weights (total 100%)

### 3.1 Basic Information — section max **22.5%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Name | `Name` | 2.5 | `name` non-null and non-empty after trim |
| Founded Year | `Founded Year` | 2.5 | `founded_year` / `foundedYear` non-null |
| Status | `Status` | 2.5 | ≥1 row in employer statuses junction (`statuses`) |
| Type | `Type` | 2.5 | ≥1 row in employer types junction (`employerTypes` / `types`) |
| Ranking | `Ranking` | 2.5 | `ranking` enum non-null |
| Headcount | `Headcount` | **2.5** | `headcount` non-null |
| Website URL | `Website URL` | 2.5 | `website_url` / `websiteUrl` non-null and non-empty after trim |
| LinkedIn URL | `LinkedIn URL` | 2.5 | `linked_in_url` / `linkedInUrl` non-null and non-empty after trim |
| DPL Competitive | `DPL Competitive` | 2.5 | `is_dpl_competitor` / `isDplCompetitor` = **true** |

> **Note (2026-07-18):** Min/Max employees replaced by single **Headcount** (2.5 pts; was 1.5 + 1). Basic Information section max remains **22.5%**.

### 3.2 Work Arrangements — section max **17.5%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Work Mode | `Work Mode` | **7.5** | `work_mode` / `workMode` enum non-null |
| Shift Type | `Shift Type` | 5 | `shift_type` / `shiftType` enum non-null |
| Time Support Zones | `Time Support Zones` | 5 | ≥1 time support zone |

> **Note (2026-07):** Tags (+2.5) removed; weight added to Work Mode (5 → 7.5). Section key is `workArrangements` (was `workArrangementsAndTags`).

### 3.3 Benefits & Salary Policy — section max **40%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Salary Policy | `Salary Policy` | 20 | company-wide `salary_policy` / `salaryPolicy` non-null |
| Benefits | `Benefits` | 20 | ≥1 benefit |

### 3.4 Office Locations — section max **10%**

Per-field weights (apply to **one** selected location row only):

| UI label | `missingFields` key | Weight % | Earned when (on selected row) |
|----------|---------------------|----------|-------------------------------|
| Country | `Country` | 2.5 | `country_id` / `countryId` **non-null** (linked FK) |
| City | `City` | 2.5 | `city` non-null and non-empty after trim |
| Address | `Address` | 2.5 | `address` non-null and non-empty after trim |
| Headquarters | `Headquarters` | 2.5 | `is_headquarters` / `isHeadquarters` = **true** |

#### 3.4.1 Office scoring algorithm (locked)

Evaluate active employer location rows.

**Step A — full credit (10%):**  
If **any** location has **all four** filled on the **same row** (`countryId` + city + address + `isHeadquarters = true`) → earn **10%**. `missingFields` for office = empty.

**Step B — zero locations:**  
If there are **no** location rows → office section earns **0%**. `missingFields` = `["Country", "City", "Address", "Headquarters"]`.

**Step C — partial credit (no row satisfies Step A):**

1. For each location, count **filled fields** among {countryId, city, address, headquarters} using rules above.
2. Select the **single best** location (same tie-break as universities):
   - Primary: **highest filled-field count**
   - Tie: prefer row with **`isHeadquarters = true`**
   - Tie: prefer row with **higher sum of earned weights** (2.5 each)
   - Tie: **lowest location `id`**
3. From the winning row only, earn **per-field weights** for each filled field (max 10%).
4. `missingFields` = office labels not earned from the winning row.

### 3.5 Layoffs — section max **10%**

Per-field weights (apply to **one** selected layoff row only):

| UI label | `missingFields` key | Weight % | Earned when (on selected row) |
|----------|---------------------|----------|-------------------------------|
| Date | `Date` | 2.5 | `layoff_date` / `layoffDate` non-null |
| No. of Affected Employees | `No. of Affected Employees` | 2.5 | count non-null **and > 0** |
| Reason | `Reason` | **5** | `reason` enum non-null (including `other` — **`reasonOther` not required** for scoring) |

> **Note (2026-07):** Source (+2.5) removed; weight added to Reason (2.5 → 5).

#### 3.5.1 Layoff scoring algorithm (locked)

**Step A — full credit (10%):**  
If **any** layoff has **all three** filled on the **same row** (Date + Affected Employees + Reason) → earn **10%**. `missingFields` = empty.

**Step B — zero layoffs:**  
If there are **no** layoff rows → section earns **0%**. `missingFields` = `["Date", "No. of Affected Employees", "Reason"]`.

**Step C — partial credit:**

1. Count filled fields per layoff row.
2. Select best row (university-style, no HQ flag):
   - Highest filled-field count
   - Tie: higher earned weight sum
   - Tie: lowest layoff `id`
3. Earn per-field weights from that row only.
4. `missingFields` = layoff labels not earned from the winning row.

**Check:** 22.5 + 17.5 + 40 + 10 + 10 = **100**.

---

## 4. Section breakdown (UI)

Five sections match `EmployerCreationDialog` accordions:

| `sectionKey` | `sectionName` | Max weight % |
|--------------|---------------|--------------|
| `basicInformation` | Basic Information | 22.5 |
| `workArrangements` | Work Arrangements | 17.5 |
| `benefitsAndSalaryPolicy` | Benefits & Salary Policy | 40 |
| `officeLocations` | Office Locations | 10 |
| `layoffs` | Layoffs | 10 |

Per section:

- `score` = sum of earned field weights in that section  
- `maxScore` = section max from table above  
- `percentage` = `ROUND(score / maxScore × 100, 1)` (0 if `maxScore = 0`)  
- `missingFields` = human labels from §3 for fields not earning weight  

`overallPercentage` = `ROUND(SUM(all earned weights), 1)`.

---

## 5. API (Phase 1)

| Endpoint / field | Role |
|------------------|------|
| `employers.data_progress_percentage` | Stored overall 0–100 (1 decimal) |
| `employers.data_progress_updated_at` | Last recalc timestamp (UTC) |
| `GET /api/employers` items | Include `dataProgressPercentage` |
| `GET /api/employers/{id}/data-progress` | Section breakdown + `missingFields` |

**Recalc:** After every employer create/update/delete and mutations to: statuses, types, time support zones, benefits, locations, layoffs.

**Precision:** One decimal, same as other modules.

---

## 6. Frontend (Phase 1)

| Surface | Behavior |
|---------|----------|
| **Employers table** | Data Progress column (pill/badge), same tier styling as candidates/projects |
| **Employers filter** | `minDataProgressPercentage` / `maxDataProgressPercentage` on list API (0–100 inclusive) |
| **No client scoring** | Display only |

**Deferred:** Data Progress panel in employer detail modal.

---

## 7. Dashboard (Phase 2)

**Handoff:** [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md)

When Phase 2 ships:

- `GET /api/dashboard/data-progress` → `summary.modules[employers].available = true`
- Aggregate `employers.data_progress_percentage` like other progress modules
- Frontend: verify existing dashboard UI (no new components)

---

## 8. Related documents

| Document | Purpose |
|----------|---------|
| [`EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md`](./EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend implementation contract |
| [`employer_data_progress_frontend_integration.md`](./employer_data_progress_frontend_integration.md) | Frontend agent guide |
| [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md) | Dashboard Phase 2 |
| [`EmployerApiReference.md`](./EmployerApiReference.md) | Locations / DTO reference |
| [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Campus algorithm pattern |
