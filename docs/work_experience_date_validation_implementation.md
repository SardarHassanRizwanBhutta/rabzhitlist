# Implementation: Work experience date validation (candidate create / update)

Handover for the frontend agent integrating error handling when saving candidates with invalid work experience dates.

---

## Summary

The backend now **validates work experience date ranges before save** on candidate create and work-experience create/update. Invalid dates return **HTTP 400 Bad Request** with a plain-text error message instead of an unhandled **500** (which the browser often surfaced as CORS / `Failed to fetch`).

**Database rule** (unchanged): `check_work_dates` on `candidate_work_experiences`:

```sql
end_date IS NULL OR start_date <= end_date
```

**Application rules** (mirror the constraint):

| Condition | Result |
|-----------|--------|
| `endDate` is null/omitted | Valid (current role) |
| `endDate` set, `startDate` missing | **400** |
| Both set, `startDate > endDate` | **400** |
| Both set, `startDate <= endDate` | Valid |

---

## Affected endpoints

| Method | Path | When validation runs |
|--------|------|----------------------|
| `POST` | `/api/candidates` | Each item in nested `workExperiences[]` before insert |
| `POST` | `/api/candidates/{candidateId}/work-experiences` | Request body `startDate` / `endDate` |
| `PUT` | `/api/candidates/{candidateId}/work-experiences/{id}` | Request body `startDate` / `endDate` |

Nested work experience shape on create (`CreateCandidateDto.workExperiences[]`):

```jsonc
{
  "employerId": 42,
  "jobTitle": "Senior Engineer",
  "startDate": "2024-12-01",   // ISO DateOnly (yyyy-MM-dd) or null
  "endDate": "2024-03-01",     // null = current role
  "shiftType": null,
  "workMode": null
}
```

Standalone create/update DTOs use the same `startDate` / `endDate` fields (`CreateCandidateWorkExperienceDto`, `UpdateCandidateWorkExperienceDto`).

---

## Error response contract

| Item | Value |
|------|-------|
| Status | **400 Bad Request** |
| Content-Type | `application/json` (ASP.NET serializes string as JSON string) |
| Body | Single human-readable message string |

Handled by existing `ValidationExceptionFilter` — same pattern as other validation errors (e.g. filter param validation on `GET /api/candidates`).

### Example responses

**End before start** (e.g. start `2024-12-01`, end `2024-03-01` on bulk create, first row):

```json
"Work experience 1: end date (2024-03-01) must be on or after start date (2024-12-01)."
```

**End set without start** (bulk create, row 2):

```json
"Work experience 2: start date is required when end date is provided."
```

**Standalone create/update** (no index prefix):

```json
"Work experience: end date (2024-03-01) must be on or after start date (2024-12-01)."
```

---

## Frontend integration checklist

### 1. Parse 400 on candidate save

When `POST /api/candidates` fails:

- Read response body on **400** (not only on 2xx).
- Display the message string in the existing error toast / form error UI.
- Do **not** treat 400 as a generic network/CORS failure.

Example:

```typescript
const response = await fetch(url, { method: "POST", body: JSON.stringify(payload), ... });

if (!response.ok) {
  const message = await response.text();
  // ASP.NET may return JSON-encoded string — parse if needed:
  const errorText =
    message.startsWith('"') ? JSON.parse(message) : message;
  throw new Error(errorText);
}
```

### 2. Client-side validation (recommended)

Mirror backend rules on the work experience form **before** submit:

- If user enters an end date, require a start date.
- If both are set, enforce `startDate <= endDate`.
- Highlight the offending row; include row index in the message when multiple work experiences exist.

This avoids a round-trip and matches backend messages.

### 3. Date format

- Send **`startDate` / `endDate` as ISO `yyyy-MM-dd`** strings (or omit / `null` for current role).
- Avoid ambiguous locale strings in the API payload (e.g. `01/12/2024` vs `01/03/2024`); parse in the UI with a fixed format, then send ISO.

### 4. Current role

- **`endDate: null`** (or omit) = currently working at that employer — always valid regardless of `startDate` for the DB constraint (though product may still require start date for UX).

### 5. Standalone work experience APIs

Apply the same 400 handling on:

- `POST /api/candidates/{candidateId}/work-experiences`
- `PUT /api/candidates/{candidateId}/work-experiences/{id}`

---

## Backend files changed

| File | Change |
|------|--------|
| `MyApp.Application/Common/WorkExperienceDateValidation.cs` | Shared validator; throws `ValidationException` |
| `MyApp.Application/Services/CandidateService.cs` | Validates each `workExperiences[]` entry in `CreateAsync` (1-based index in messages) |
| `MyApp.Application/Services/CandidateWorkExperienceService.cs` | Validates on `CreateAsync` and `UpdateAsync` |
| `MyApp.API/Filters/ValidationExceptionFilter.cs` | Unchanged — maps `ValidationException` → 400 + message |

---

## Real-world failure example

User entered:

- Start: `01/12/2024`
- End: `01/03/2024`

Depending on locale parsing, ISO payload may become start **after** end → backend returns **400** with the dated message above instead of failing silently with `Failed to fetch`.

**Corrected payload** (job Mar–Dec 2024):

```json
"startDate": "2024-03-01",
"endDate": "2024-12-01"
```

---

## Not in scope (this release)

- Education / certification date validation on nested create (separate DB constraints; no pre-save validation added yet).
- Structured error JSON (e.g. `{ "code", "field", "message" }`) — body remains a plain string for consistency with existing validation errors.

---

## Quick test

```http
POST /api/candidates
Content-Type: application/json

{
  "name": "Test User",
  "workExperiences": [
    {
      "jobTitle": "Engineer",
      "startDate": "2024-12-01",
      "endDate": "2024-03-01"
    }
  ]
}
```

Expected: **400** with body containing `Work experience 1: end date (2024-03-01) must be on or after start date (2024-12-01).`
