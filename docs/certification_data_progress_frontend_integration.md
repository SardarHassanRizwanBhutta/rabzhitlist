# Certification Data Progress — Frontend Integration Guide

**Status:** Not implemented — contract for implementation.  
**Audience:** Frontend / Next.js AI agent.  
**Product spec:** [`CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md`](./CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md)  
**Backend contract:** [`CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md`](./CERTIFICATION_DATA_PROGRESS_BACKEND_HANDOFF.md)  
**Reference pattern:** [`project_data_progress_frontend_integration.md`](./project_data_progress_frontend_integration.md)

---

## 1. Summary

| What | Detail |
|------|--------|
| **Phase 1** | Per-certification completion % on list + min/max filters; breakdown API available |
| **Phase 1 UI** | **Certifications table column** + **`certifications-filter-dialog.tsx`** only |
| **Deferred UI** | Data Progress panel in certification detail UI |
| **Phase 2** | Dashboard `certifications` module — [`DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md`](./DASHBOARD_UNIVERSITIES_CERTIFICATIONS_DATA_PROGRESS_PHASE2.md) |
| **Scoring** | **Backend only** — Name 50% + linked `issuerId` 50% |
| **Parallel work** | Universities Phase 1 in [`university_data_progress_frontend_integration.md`](./university_data_progress_frontend_integration.md) |

---

## 2. APIs to integrate

### 2.1 List certifications (extended)

```http
GET /api/certifications?minDataProgressPercentage={0-100}&maxDataProgressPercentage={0-100}&pageNumber=1&pageSize=10
```

Each item includes **`dataProgressPercentage`**:

```json
{
  "items": [
    {
      "id": 55,
      "name": "AWS Solutions Architect – Associate",
      "issuer": { "id": 3, "name": "Amazon Web Services", "websiteUrl": null },
      "dataProgressPercentage": 100.0,
      "createdAt": "2026-01-10T00:00:00Z",
      "updatedAt": "2026-07-01T00:00:00Z"
    }
  ],
  "totalCount": 79,
  "pageNumber": 1,
  "pageSize": 10
}
```

### 2.2 Certification data progress breakdown (new)

```http
GET /api/certifications/{certificationId}/data-progress
```

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

### 2.3 Create / update

`POST /api/certifications`, `PUT /api/certifications/{id}` — response includes **`dataProgressPercentage`**.

---

## 3. TypeScript types

Create `src/lib/types/certification-data-progress.ts`:

```typescript
export type CertificationDataProgressSectionKey = "basicInformation"

export interface CertificationDataProgressSection {
  sectionKey: CertificationDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface CertificationDataProgressResponse {
  certificationId: number
  overallPercentage: number
  sections: CertificationDataProgressSection[]
}
```

Extend `Certification` in `src/lib/types/certification.ts`:

```typescript
dataProgressPercentage: number
```

Extend `CertificationFilters` in `certifications-filter-dialog.tsx`:

```typescript
minDataProgressPercentage?: number
maxDataProgressPercentage?: number
```

---

## 4. Service layer

Update `src/lib/services/certifications-api.ts`:

- Map **`dataProgressPercentage`** on list items
- Pass min/max filter params
- Add `fetchCertificationDataProgress(certificationId)`

---

## 5. UI integration (Phase 1)

### 5.1 Certifications table — Data Progress column

| Rule | Detail |
|------|--------|
| Source | `certification.dataProgressPercentage` |
| Display | Pill/badge (shared tier helpers) |
| Format | One decimal |
| Sort | Client-side |

### 5.2 Certifications filter dialog

Min/max **Data progress %** in `CertificationsFilterDialog` → `certifications-page-client.tsx`.

### 5.3 Deferred

No detail modal progress panel in Phase 1.

---

## 6. Dashboard (Phase 2)

Verify when `summary.modules[certifications].available = true` — see Phase 2 doc.

---

## 7. Checklist

- [ ] Types + API + `fetchCertificationDataProgress`
- [ ] `certifications-table.tsx` — column
- [ ] `certifications-filter-dialog.tsx` — min/max %
- [ ] No client scoring
- [ ] Build passes

---

## 8. Agent prompt (frontend Phase 1)

```
Implement Certification Data Progress Phase 1 per docs/certification_data_progress_frontend_integration.md
and docs/CERTIFICATION_DATA_PROGRESS_REQUIREMENTS_LOCKED.md.

Add dataProgressPercentage to certification types and certifications-api.ts with min/max filters.
Add Data Progress column to certifications-table.tsx. Add min/max filters to
certifications-filter-dialog.tsx. Wire fetchCertificationDataProgress for future detail UI.

Do NOT add detail modal progress panel. Do NOT compute scores on the client.
Mirror projects-table and projects-filter-dialog patterns.
```
