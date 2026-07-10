# University Data Progress — Backend Handoff

Handoff for implementing **per-university Data Progress** (Phase 1). Mirrors the candidate/project progress pattern.

**Product spec (locked):** [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Frontend handoff:** [`university_data_progress_frontend_integration.md`](./university_data_progress_frontend_integration.md)  
**Reference:** `candidates.data_progress_percentage`, `projects.data_progress_percentage`

**Status:** Not implemented — contract for implementation.  
**Phasing:** Phase 1 only (dashboard `universities` module = Phase 2, shipped with certifications).

---

## 0. Locked decisions

| # | Decision |
|---|----------|
| **U1** | Store `universities.data_progress_percentage` (0–100, 1 decimal) + `data_progress_updated_at` |
| **U2** | Backend owns scoring; weights in locked spec §3 (total 100%) |
| **U3** | Campus 45%: full credit when any row has city + main + address; else best-row partial per §3.2.1 |
| **U4** | Campus tie-break: main campus → higher weight sum → lowest location `id` |
| **U5** | Zero campus rows: campus earns 0%; denominator still 100% |
| **U6** | Filled = non-null + non-empty trim (strings); `country_id` / `ranking` non-null |
| **U7** | List API returns `dataProgressPercentage`; filter `minDataProgressPercentage` / `maxDataProgressPercentage` |
| **U8** | Recalc on university + location mutations |
| **U9** | Dashboard `universities` module **unchanged** in Phase 1 (`available: false`) |

---

## 1. Database migration

Add to `universities` table:

```sql
ALTER TABLE universities
  ADD COLUMN data_progress_percentage NUMERIC(5,1) NOT NULL DEFAULT 0,
  ADD COLUMN data_progress_updated_at TIMESTAMPTZ NULL;

CREATE INDEX ix_universities_data_progress_percentage
  ON universities (data_progress_percentage)
  WHERE deleted_at IS NULL;
```

Backfill: run recalc for all active universities after deploy.

---

## 2. Scoring service

Implement `IUniversityDataProgressService` / `UniversityDataProgressCalculator`.

### 2.1 Input model

Load university with:

- Scalars: `name`, `country_id`, `ranking`, `website_url`, `linked_in_url`
- Collection: `locations` (`university_locations`) — `id`, `city`, `address`, `is_main_campus`

### 2.2 Basic Information rules

| Weight | Rule |
|--------|------|
| 15 | `TRIM(name)` non-empty |
| 5 | `country_id` IS NOT NULL |
| 5 | `ranking` IS NOT NULL |
| 15 | `TRIM(website_url)` non-empty |
| 15 | `TRIM(linked_in_url)` non-empty |

### 2.3 Campus Locations rules (implement §3.2.1 exactly)

```csharp
// Pseudocode
decimal ScoreCampus(IReadOnlyList<Location> locations, out List<string> missing)
{
    if (locations.Any(FullCampusRow)) // city + main + address on same row
        return 45m, [];

    if (locations.Count == 0)
        return 0m, ["City", "Main Campus", "Address"];

    var best = locations
        .OrderByDescending(FilledFieldCount)
        .ThenByDescending(l => l.IsMainCampus)
        .ThenByDescending(l => RowWeightSum(l))
        .ThenBy(l => l.Id)
        .First();

    decimal score = 0;
    missing = [];
    if (IsFilled(best.City)) score += 10; else missing.Add("City");
    if (best.IsMainCampus) score += 15; else missing.Add("Main Campus");
    if (IsFilled(best.Address)) score += 20; else missing.Add("Address");
    return score, missing;
}

bool FullCampusRow(Location l) =>
    IsFilled(l.City) && l.IsMainCampus && IsFilled(l.Address);

bool IsFilled(string? s) => s != null && s.Trim().Length > 0;
```

`overallPercentage = ROUND(basicScore + campusScore, 1)`.

### 2.4 Section aggregation

| `sectionKey` | `sectionName` | Max |
|--------------|---------------|-----|
| `basicInformation` | Basic Information | 55 |
| `campusLocations` | Campus Locations | 45 |

`missingFields` per section from §3.1 and campus algorithm output.

---

## 3. Persistence & recalc triggers

After successful commit of:

- `POST /api/universities`
- `PUT /api/universities/{id}`
- `DELETE /api/universities/{id}` (soft delete)
- `POST /api/universities/{universityId}/locations`
- `PUT /api/universities/{universityId}/locations/{locationId}`
- `DELETE /api/universities/{universityId}/locations/{locationId}`

```csharp
await _universityDataProgressService.RecalculateAndSaveAsync(universityId, ct);
```

---

## 4. API endpoints

### 4.1 List — extend `GET /api/universities`

Add to each item:

```json
{
  "id": 42,
  "name": "MIT",
  "dataProgressPercentage": 70.0
}
```

**Query filters (new):**

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | decimal | Inclusive 0–100 |
| `maxDataProgressPercentage` | decimal | Inclusive 0–100; must be ≥ min |

Return `400` if out of range or min > max (match candidates/projects).

### 4.2 Detail breakdown — new

```http
GET /api/universities/{universityId}/data-progress
```

**200 example:**

```json
{
  "universityId": 42,
  "overallPercentage": 70.0,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 50.0,
      "maxScore": 55,
      "percentage": 90.9,
      "missingFields": ["Ranking"]
    },
    {
      "sectionKey": "campusLocations",
      "sectionName": "Campus Locations",
      "score": 20.0,
      "maxScore": 45,
      "percentage": 44.4,
      "missingFields": ["Main Campus", "Address"]
    }
  ]
}
```

**404** if university not found or soft-deleted.

---

## 5. Phase 2 pointer (dashboard — not Phase 1)

Do **not** change `DashboardDataProgressService` in Phase 1.

Phase 2 — see [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md):

- [ ] Read `universities.data_progress_percentage` for snapshots + live today
- [ ] Set `summary.modules[universities].available = true`
- [ ] Recalc hooks → today snapshot upsert for `module=universities`

---

## 6. Frontend integration checklist (Phase 1)

| File | Action |
|------|--------|
| `src/lib/types/university-data-progress.ts` | New types |
| `src/lib/services/universities-api.ts` | Map `dataProgressPercentage`; filter params; `fetchUniversityDataProgress` |
| `src/lib/utils/university-data-progress.ts` | Tier/badge helpers (reuse candidate/project helpers) |
| `src/components/universities-table.tsx` | Data Progress column |
| `src/components/universities-filter-dialog.tsx` (or page filters) | Min/max % filters |

---

## 7. Contract checklist

- [ ] Migration columns + index
- [ ] Scoring matches locked spec §3 (campus algorithm §3.2.1)
- [ ] Backfill all active universities
- [ ] Recalc hooks on all mutations
- [ ] `GET /api/universities/{id}/data-progress`
- [ ] List field + filter params
- [ ] Dashboard unchanged (`universities` still `available: false`)

---

## 8. Agent prompt (backend)

```
Implement University Data Progress Phase 1 per docs/UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md
and docs/UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

Add universities.data_progress_percentage + data_progress_updated_at; recalc on university
and location mutations. Scoring: Basic 55% + Campus 45% (always 100% denominator).
Campus: full 45% if any row has city + isMainCampus + address; zero rows = 0% campus;
else best single row by filled-field count, tie-break main campus then weight sum then
lowest id; earn per-field weights from that row only.

Expose GET /api/universities/{id}/data-progress with 2 sections + missingFields.
Extend GET /api/universities with dataProgressPercentage and min/max filter params.

Do NOT enable dashboard universities module (Phase 2). Mirror candidate/project patterns.
```

---

## 9. Related documents

| Document | Purpose |
|----------|---------|
| [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Locked weights & campus rules |
| [`university_data_progress_frontend_integration.md`](./university_data_progress_frontend_integration.md) | Frontend agent guide |
| [`CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md`](./CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md) | Parallel certifications work |
