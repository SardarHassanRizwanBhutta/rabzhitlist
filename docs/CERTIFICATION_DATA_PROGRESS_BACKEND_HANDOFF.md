# Certification Data Progress — Backend Handoff

Handoff for implementing **per-certification Data Progress** (Phase 1). Mirrors the candidate/project progress pattern.

**Product spec (locked):** [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Frontend handoff:** [`certification_data_progress_frontend_integration.md`](./certification_data_progress_frontend_integration.md)  
**Reference:** `candidates.data_progress_percentage`, `projects.data_progress_percentage`

**Status:** Not implemented — contract for implementation.  
**Phasing:** Phase 1 only (dashboard `certifications` module = Phase 2, shipped with universities).

---

## 0. Locked decisions

| # | Decision |
|---|----------|
| **C1** | Store `certifications.data_progress_percentage` (0–100, 1 decimal) + `data_progress_updated_at` |
| **C2** | Backend owns scoring; Name 50% + Issuing Body 50% |
| **C3** | Name: non-null + non-empty trim |
| **C4** | Issuing Body: `issuer_id` non-null (linked catalog row) |
| **C5** | List API returns `dataProgressPercentage`; min/max filter params |
| **C6** | Recalc on certification create/update/delete |
| **C7** | Dashboard `certifications` module **unchanged** in Phase 1 (`available: false`) |

---

## 1. Database migration

Add to `certifications` table:

```sql
ALTER TABLE certifications
  ADD COLUMN data_progress_percentage NUMERIC(5,1) NOT NULL DEFAULT 0,
  ADD COLUMN data_progress_updated_at TIMESTAMPTZ NULL;

CREATE INDEX ix_certifications_data_progress_percentage
  ON certifications (data_progress_percentage)
  WHERE deleted_at IS NULL;
```

Backfill: run recalc for all active certifications after deploy.

---

## 2. Scoring service

Implement `ICertificationDataProgressService` / `CertificationDataProgressCalculator`.

### 2.1 Input model

Load certification with:

- `name`
- `issuer_id` (FK to certification issuers / issuing bodies catalog)

### 2.2 Field rules

| Weight | Rule |
|--------|------|
| 50 | `TRIM(name)` non-empty |
| 50 | `issuer_id` IS NOT NULL |

`overallPercentage = ROUND(SUM(earned), 1)`.

### 2.3 Section aggregation

| `sectionKey` | `sectionName` | Max |
|--------------|---------------|-----|
| `basicInformation` | Basic Information | 100 |

`missingFields`: `Name` and/or `Issuing Body` when not earned.

---

## 3. Persistence & recalc triggers

After successful commit of:

- `POST /api/certifications`
- `PUT /api/certifications/{id}`
- `DELETE /api/certifications/{id}` (soft delete)

```csharp
await _certificationDataProgressService.RecalculateAndSaveAsync(certificationId, ct);
```

If issuer is changed via nested update on certification PUT, recalc the certification row.

---

## 4. API endpoints

### 4.1 List — extend `GET /api/certifications`

Add to each item:

```json
{
  "id": 55,
  "name": "AWS Solutions Architect – Associate",
  "dataProgressPercentage": 100.0
}
```

**Query filters (new):**

| Param | Type | Rule |
|-------|------|------|
| `minDataProgressPercentage` | decimal | Inclusive 0–100 |
| `maxDataProgressPercentage` | decimal | Inclusive 0–100; must be ≥ min |

Return `400` if invalid (match candidates/projects).

### 4.2 Detail breakdown — new

```http
GET /api/certifications/{certificationId}/data-progress
```

**200 example:**

```json
{
  "certificationId": 55,
  "overallPercentage": 50.0,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 50.0,
      "maxScore": 100,
      "percentage": 50.0,
      "missingFields": ["Issuing Body"]
    }
  ]
}
```

**404** if certification not found or soft-deleted.

---

## 5. Phase 2 pointer (dashboard — not Phase 1)

See [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md):

- [ ] Read `certifications.data_progress_percentage` for snapshots
- [ ] Set `summary.modules[certifications].available = true`
- [ ] Recalc hooks → today snapshot upsert for `module=certifications`

---

## 6. Frontend integration checklist (Phase 1)

| File | Action |
|------|--------|
| `src/lib/types/certification-data-progress.ts` | New types |
| `src/lib/services/certifications-api.ts` | Map `dataProgressPercentage`; filters; `fetchCertificationDataProgress` |
| `src/lib/utils/certification-data-progress.ts` | Tier/badge helpers |
| `src/components/certifications-table.tsx` | Data Progress column |
| Certifications filter UI | Min/max % filters |

---

## 7. Contract checklist

- [ ] Migration columns + index
- [ ] Scoring: Name 50% + issuer_id 50%
- [ ] Backfill all active certifications
- [ ] Recalc hooks
- [ ] `GET /api/certifications/{id}/data-progress`
- [ ] List field + filter params
- [ ] Dashboard unchanged (`certifications` still `available: false`)

---

## 8. Agent prompt (backend)

```
Implement Certification Data Progress Phase 1 per docs/CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md
and docs/CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

Add certifications.data_progress_percentage + data_progress_updated_at; recalc on certification
mutations. Scoring: Name 50% (non-null non-empty trim) + Issuing Body 50% (issuer_id non-null).

Expose GET /api/certifications/{id}/data-progress with basicInformation section + missingFields.
Extend GET /api/certifications with dataProgressPercentage and min/max filter params.

Do NOT enable dashboard certifications module (Phase 2). Mirror candidate/project patterns.
```

---

## 9. Related documents

| Document | Purpose |
|----------|---------|
| [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Locked weights |
| [`certification_data_progress_frontend_integration.md`](./certification_data_progress_frontend_integration.md) | Frontend agent guide |
| [`UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md`](./UNIVERSITY_DATA_PROGRESS_BACKEND_HANDOFF.md) | Parallel universities work |
