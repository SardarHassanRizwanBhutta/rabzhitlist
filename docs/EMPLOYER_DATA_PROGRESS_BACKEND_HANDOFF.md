# Employer Data Progress — Backend Handoff

Handoff for implementing **per-employer Data Progress** (Phase 1). Mirrors candidate/project/university progress patterns.

**Product spec (locked):** [`EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Frontend handoff:** [`employer_data_progress_frontend_integration.md`](./employer_data_progress_frontend_integration.md)  
**Locations API:** [`EmployerApiReference.md`](./EmployerApiReference.md)

**Status:** Not implemented — contract for implementation.  
**Phasing:** Phase 1 only (dashboard `employers` module = Phase 2).

---

## 0. Locked decisions

| # | Decision |
|---|----------|
| **E1** | Store `employers.data_progress_percentage` (0–100, 1 decimal) + `data_progress_updated_at` |
| **E2** | Backend owns scoring; weights in locked spec §3 (total 100%) |
| **E3** | Denominator always 100%; zero offices / zero layoffs → those sections earn 0% |
| **E4** | Office Country requires linked `country_id` (not free-text alone) |
| **E5** | Office / layoff scoring: full section if any all-complete row; else best-row partial (university tie-break) |
| **E6** | Layoff Reason: enum non-null enough (including `other`); affected count must be **> 0** |
| **E7** | DPL Competitive: only `is_dpl_competitor = true` earns weight |
| **E8** | List returns `dataProgressPercentage`; filter `minDataProgressPercentage` / `maxDataProgressPercentage` |
| **E9** | Recalc on employer + junction + location + layoff mutations |
| **E10** | Dashboard `employers` **unchanged** in Phase 1 (`available: false`) |

---

## 1. Database migration

```sql
ALTER TABLE employers
  ADD COLUMN data_progress_percentage NUMERIC(5,1) NOT NULL DEFAULT 0,
  ADD COLUMN data_progress_updated_at TIMESTAMPTZ NULL;

CREATE INDEX ix_employers_data_progress_percentage
  ON employers (data_progress_percentage)
  WHERE deleted_at IS NULL;
```

Backfill: run recalc for all active employers after deploy.

---

## 2. Scoring service

Implement `IEmployerDataProgressService` / `EmployerDataProgressCalculator`.

### 2.1 Input model

Load employer with:

- Scalars: `name`, `founded_year`, `ranking`, `min_employees`, `max_employees`, `website_url`, `linked_in_url`, `is_dpl_competitor`, `work_mode`, `shift_type`, `salary_policy`
- Junctions / collections: statuses, employer types, tags, time support zones, benefits
- Locations: `id`, `country_id`, `city`, `address`, `is_headquarters`
- Layoffs: `id`, `layoff_date`, `number_of_employees_laid_off`, `reason`, `source`

### 2.2 Field rules (implement exactly)

See locked spec §3. Pseudocode for office Country:

```csharp
bool CountryFilled(Location l) => l.CountryId != null; // linked FK required
```

Layoff affected employees:

```csharp
bool AffectedFilled(Layoff x) =>
    x.NumberOfEmployeesLaidOff != null && x.NumberOfEmployeesLaidOff > 0;
```

### 2.3 Section aggregation

| `sectionKey` | Max |
|--------------|-----|
| `basicInformation` | 22.5 |
| `workArrangementsAndTags` | 17.5 |
| `benefitsAndSalaryPolicy` | 40 |
| `officeLocations` | 10 |
| `layoffs` | 10 |

`missingFields` labels must match locked spec §3 exactly.

---

## 3. Persistence & recalc triggers

After successful commit of:

- `POST` / `PUT` / `DELETE` `/api/employers`
- Mutations to statuses, types, tags, time support zones, benefits (via employer PUT joins)
- `POST` / `PUT` / `DELETE` `/api/employers/{id}/locations/...`
- Layoff create/update/delete endpoints (whatever routes exist today)

```csharp
await _employerDataProgressService.RecalculateAndSaveAsync(employerId, ct);
```

**Note:** Location changes are **not** part of `PUT /api/employers/{id}` — hooks must fire on location and layoff controllers as well.

---

## 4. API endpoints

### 4.1 List — extend `GET /api/employers`

Each item:

```json
{
  "id": 12,
  "name": "Acme Corp",
  "dataProgressPercentage": 67.5
}
```

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | decimal | Inclusive 0–100 |
| `maxDataProgressPercentage` | decimal | Inclusive 0–100; must be ≥ min |

**400** if invalid (match candidates/projects).

### 4.2 Detail breakdown — new

```http
GET /api/employers/{employerId}/data-progress
```

**200 example:**

```json
{
  "employerId": 12,
  "overallPercentage": 67.5,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 20.0,
      "maxScore": 22.5,
      "percentage": 88.9,
      "missingFields": ["DPL Competitive"]
    },
    {
      "sectionKey": "workArrangementsAndTags",
      "sectionName": "Work Arrangements & Tags",
      "score": 15.0,
      "maxScore": 17.5,
      "percentage": 85.7,
      "missingFields": ["Tags"]
    },
    {
      "sectionKey": "benefitsAndSalaryPolicy",
      "sectionName": "Benefits & Salary Policy",
      "score": 20.0,
      "maxScore": 40,
      "percentage": 50.0,
      "missingFields": ["Benefits"]
    },
    {
      "sectionKey": "officeLocations",
      "sectionName": "Office Locations",
      "score": 7.5,
      "maxScore": 10,
      "percentage": 75.0,
      "missingFields": ["Headquarters"]
    },
    {
      "sectionKey": "layoffs",
      "sectionName": "Layoffs",
      "score": 0,
      "maxScore": 10,
      "percentage": 0,
      "missingFields": ["Date", "No. of Affected Employees", "Reason", "Source"]
    }
  ]
}
```

**404** if employer not found or soft-deleted.

---

## 5. Phase 2 pointer (dashboard — not Phase 1)

See [`DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_EMPLOYERS_DATA_PROGRESS_PHASE2.md):

- [ ] Read `employers.data_progress_percentage` for snapshots + live today
- [ ] Set `summary.modules[employers].available = true`
- [ ] Recalc hooks → today snapshot upsert for `module=employers`

---

## 6. Frontend integration checklist (Phase 1)

| File | Action |
|------|--------|
| `src/lib/types/employer-data-progress.ts` | New types |
| `src/lib/services/employers-api.ts` | Map field; filters; `fetchEmployerDataProgress` |
| `src/lib/utils/data-progress.ts` | Reuse shared formatter/tiers |
| `src/components/employers-table.tsx` | Data Progress column |
| Employers filter dialog | Min/max % |

---

## 7. Contract checklist

- [ ] Migration columns + index
- [ ] Scoring matches locked §3 (office `countryId`, layoff count > 0)
- [ ] Backfill all active employers
- [ ] Recalc on employer + locations + layoffs + junctions
- [ ] `GET /api/employers/{id}/data-progress`
- [ ] List field + filter params
- [ ] Dashboard unchanged (`employers` still `available: false`)

---

## 8. Agent prompt (backend)

```
Implement Employer Data Progress Phase 1 per docs/EMPLOYER_DATA_PROGRESS_BACKEND_HANDOFF.md
and docs/EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

Add employers.data_progress_percentage + data_progress_updated_at; recalc on employer,
junction, location, and layoff mutations. Scoring: Basic 22.5 + Work Arrangements 17.5 +
Benefits/Salary 40 + Office 10 + Layoffs 10 (always 100% denominator).

Office: full 10% if any row has countryId + city + address + isHeadquarters; else best-row
partial (university tie-break). Country requires linked countryId.
Layoffs: full 10% if any complete row; zero rows = 0%; else best-row; affected count > 0;
Reason enum non-null enough (including other).

Expose GET /api/employers/{id}/data-progress with 5 sections + missingFields.
Extend GET /api/employers with dataProgressPercentage and min/max filter params.

Do NOT enable dashboard employers module (Phase 2). Mirror university/candidate patterns.
```

---

## 9. Related documents

| Document | Purpose |
|----------|---------|
| [`EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./EMPLOYER_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Locked weights & algorithms |
| [`employer_data_progress_frontend_integration.md`](./employer_data_progress_frontend_integration.md) | Frontend agent guide |
| [`EmployerApiReference.md`](./EmployerApiReference.md) | Location CRUD |
