# Certification Data Progress — Locked Product Requirements (v1)

**Status:** Locked (2026-07).  
**Audience:** Product, frontend, backend.  
**Phasing:** **Phase 1** — entity progress (stored %, list, breakdown API, filters). **Phase 2** — dashboard `certifications` module (`available: true`).  
**Backend handoff:** [`CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md`](./CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Frontend handoff:** [`certification_data_progress_frontend_integration.md`](./certification_data_progress_frontend_integration.md)

---

## 1. Scope

| Phase | In scope |
|-------|----------|
| **Phase 1** | Per-certification `data_progress_percentage`; recalc on mutations; `GET /api/certifications/{id}/data-progress` (API only); list field; certifications table column; min/max % filters |
| **Phase 1 deferred** | Data Progress panel in certification detail UI |
| **Phase 2** | Dashboard overview/detail for **certifications** module (see [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md)) |

**Out of scope (v1):**

- Frontend calculation of progress (backend owns all scoring)
- Data **Verification** — separate feature
- **Employers** dashboard progress (unchanged)
- **Universities** — see [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)

**Delivery:** Universities and certifications entity work ship **in parallel**.

---

## 2. Core rules

1. **Overall** completeness is **0–100%** (one decimal), sum of **field weights** earned.
2. **Denominator is always 100%** — both fields always count toward max.
3. **“Filled”** for **Name:** `name` non-null and non-empty after trim.
4. **Issuing Body (50%):** earned when **`issuer_id`** is **non-null** (linked `CertificationIssuer` catalog row). Issuer name string alone does **not** earn weight without a link.

---

## 3. Field weights (total 100%)

### 3.1 Basic Information — section max **100%**

| UI label | `missingFields` key | Weight % | Earned when |
|----------|---------------------|----------|-------------|
| Name | `Name` | 50 | `name` non-null and non-empty after trim |
| Issuing Body | `Issuing Body` | 50 | `issuer_id` non-null |

**Check:** 50 + 50 = **100**.

---

## 4. Section breakdown (UI)

One section matches `CertificationCreationDialog`:

| `sectionKey` | `sectionName` | Max weight % |
|--------------|---------------|--------------|
| `basicInformation` | Basic Information | 100 |

Per section:

- `score` = sum of earned field weights  
- `maxScore` = 100  
- `percentage` = `ROUND(score / maxScore × 100, 1)`  
- `missingFields` = labels from §3 not earning weight  

`overallPercentage` = `ROUND(SUM(earned weights), 1)`.

---

## 5. API (Phase 1)

| Endpoint / field | Role |
|------------------|------|
| `certifications.data_progress_percentage` | Stored overall 0–100 (1 decimal) |
| `certifications.data_progress_updated_at` | Last recalc timestamp (UTC) |
| `GET /api/certifications` items | Include `dataProgressPercentage` |
| `GET /api/certifications/{id}/data-progress` | Section breakdown + `missingFields` |

**Recalc:** After certification create/update/delete and when `issuer_id` changes.

**Precision:** One decimal.

---

## 6. Frontend (Phase 1)

| Surface | Behavior |
|---------|----------|
| **Certifications table** | Data Progress column (pill/badge) |
| **Certifications filter** | `minDataProgressPercentage` / `maxDataProgressPercentage` |
| **No client scoring** | Display only |

**Deferred:** Data Progress panel in certification detail modal.

---

## 7. Dashboard (Phase 2)

**Handoff:** [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md)

When Phase 2 ships (with universities):

- `summary.modules[certifications].available = true`
- Aggregate `certifications.data_progress_percentage` like other progress modules
- Frontend: verify existing dashboard UI

**Employers** remain `available: false`.

---

## 8. Related documents

| Document | Purpose |
|----------|---------|
| [`CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md`](./CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md) | Backend implementation contract |
| [`certification_data_progress_frontend_integration.md`](./certification_data_progress_frontend_integration.md) | Frontend agent guide |
| [`UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./UNIVERSITY_DATA_PROGRESS_REQUIREMENTS_LOCKED.md) | Parallel universities module |
| [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md) | Dashboard Phase 2 (both modules) |
