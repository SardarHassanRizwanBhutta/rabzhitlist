# Latest Job Title Frontend Integration Guide

## Purpose

Integrate the backend's new **Latest Job Title** derived field into the Candidates UI.

Candidates do not directly own a current job title field. The backend now derives the value from the candidate's latest work experience and exposes it as:

```text
latestJobTitle
```

The frontend must use this field for:

```text
1. Displaying Job Title in the Candidates table
2. Filtering candidates by latest job title
```

Do not derive this value on the frontend from work experiences.

---

## Backend Contract Summary

The backend now stores and exposes:

```text
candidates.latest_job_title
```

as:

```ts
latestJobTitle: string | null
```

This value represents the job title from the candidate's latest work experience.

The backend determines latest work experience using:

```text
1. latest startDate
2. latest createdAt if startDate ties
3. highest id if still tied
```

The backend also includes this field in a broader recalculation endpoint:

```http
POST /api/admin/candidates/recalculate-derived-fields
```

That endpoint recalculates:

```text
latestJobTitle
totalExperienceMonths
dataProgressPercentage
```

This endpoint is backend/admin-only and should not be called from normal candidate UI flows.

---

## Candidate List API Response

The Candidates listing API should now return `latestJobTitle` in each candidate row.

Example:

```json
{
  "id": 1,
  "name": "Ali Khan",
  "latestJobTitle": "Senior Backend Engineer",
  "totalExperienceMonths": 72,
  "dataProgressPercentage": 83.5
}
```

Update the frontend candidate list item type accordingly.

Example:

```ts
export type CandidateListItem = {
  id: number;
  name: string;
  latestJobTitle?: string | null;
  totalExperienceMonths?: number;
  dataProgressPercentage?: number;
  // keep existing fields
};
```

Use the project's existing type naming and file structure.

---

## Candidates Table Display

Use the backend-provided `latestJobTitle` value in the Candidates table under the **Job Title** column.

Display behavior:

```tsx
{candidate.latestJobTitle || "—"}
```

Do not calculate the latest job title on the frontend.

Do not fetch work experiences just to display the table job title.

---

## Filter API Parameter

The backend now supports filtering candidates by latest job title using:

```text
jobTitle
```

Example request:

```http
GET /api/candidates?jobTitle=backend&pageNumber=1&pageSize=20
```

The backend filter matches only:

```text
candidates.latest_job_title
```

It does **not** match all historical work experience job titles.

---

## Filter Behavior Expected by Product

Only candidates whose **latest work experience job title** matches the filter should appear.

Example:

| Candidate | Historical Job Title | Latest Job Title | Filter | Should Appear? |
|---|---|---|---|---|
| A | QA Engineer | Backend Engineer | Backend | Yes |
| B | Backend Engineer | Project Manager | Backend | No |
| C | Frontend Engineer | Senior Frontend Engineer | Backend | No |
| D | Junior Backend Engineer | Senior Backend Engineer | Backend | Yes |

This behavior is controlled by the backend. The frontend only sends the filter value.

---

## Filter UI Integration

Add or wire the existing Job Title filter input to the candidate query parameter:

```text
jobTitle
```

Recommended UI type:

```text
Text input
```

Suggested label:

```text
Job Title
```

Suggested placeholder:

```text
Search by latest job title
```

If the UI already has a Job Title field without functionality, keep the existing UI and only connect it to the API query parameter.

---

## Query State

Add `jobTitle` to the Candidates filter/query state.

Example:

```ts
type CandidateFilters = {
  jobTitle?: string;
  minExperienceYears?: number;
  maxExperienceYears?: number;
  // existing filters
};
```

Use the actual existing frontend filter type names.

---

## Request Building

When building query params for the candidate listing endpoint, include `jobTitle` only when it has a non-empty value.

Example:

```ts
if (filters.jobTitle?.trim()) {
  params.set("jobTitle", filters.jobTitle.trim());
}
```

Do not send empty strings.

---

## Pagination Behavior

When the Job Title filter changes, reset pagination to page 1.

Expected behavior:

```text
User enters/changes job title filter
→ pageNumber resets to 1
→ Candidates API refetches with jobTitle query param
```

---

## Debounce Recommendation

If filters are applied while typing, debounce the Job Title input.

Recommended debounce:

```text
300ms to 500ms
```

If the existing filter dialog only applies filters after clicking an Apply button, debounce is not required.

---

## Clear Filter Behavior

When Job Title filter is cleared:

- remove `jobTitle` from query params
- reset page to 1
- refetch candidates without this filter

Do not send:

```http
jobTitle=
```

---

## URL Query Parameters

If the Candidates page persists filters in the URL, include:

```text
jobTitle
```

Example:

```http
/candidates?jobTitle=backend&minExperienceYears=3&maxExperienceYears=5&pageNumber=1&pageSize=20
```

When parsing from URL, map `jobTitle` back into filter state.

---

## Candidate Detail Page

No special frontend calculation is required for latest job title.

If the candidate detail page displays a current/latest job title summary, use:

```text
latestJobTitle
```

from the candidate detail API if available.

If the detail API does not yet return it, either:

1. Ask backend to include it in candidate detail response, or
2. Keep this feature limited to the Candidates table until detail API is updated.

Do not infer latest job title from the work experience list on the frontend unless explicitly required for a detail-only display.

---

## Admin Recalculation Endpoint

The backend has a broader derived-fields recalculation endpoint:

```http
POST /api/admin/candidates/recalculate-derived-fields
```

This endpoint recalculates:

```text
latestJobTitle
totalExperienceMonths
dataProgressPercentage
```

### Frontend handling

Normal Candidates UI should not call this endpoint.

If there is an existing admin/maintenance UI, optionally add a protected admin action for this endpoint. Otherwise, no frontend implementation is required for recalculation.

If an admin UI is added later, make sure:

- action is admin-only
- user sees a confirmation before running it
- user sees success/failure message
- action is not exposed on normal candidate pages

---

## Error Handling

If API request fails after applying Job Title filter, use the same error handling already used for other candidate filters.

Do not add special behavior for this filter.

---

## Empty State Handling

If no candidates match the Job Title filter, show the existing empty table state.

No special empty state is required.

---

## Testing Checklist

### Table Display

Verify:

1. Candidate with latest job title shows the title in the Job Title column
2. Candidate without work experience shows `—`
3. Candidate without valid job title shows `—`
4. Long job titles do not break table layout

### Filter Query

Verify request includes:

```http
jobTitle=backend
```

when the filter is applied.

Verify request does not include `jobTitle` when the field is empty.

### Filter Behavior

Create/test candidates such as:

| Candidate | Previous Job Title | Latest Job Title | Filter | Expected |
|---|---|---|---|---|
| A | QA Engineer | Backend Engineer | Backend | Appears |
| B | Backend Engineer | Project Manager | Backend | Does not appear |
| C | Frontend Engineer | Senior Frontend Engineer | Backend | Does not appear |
| D | Junior Backend Engineer | Senior Backend Engineer | Backend | Appears |

### Pagination

Verify changing Job Title filter resets the page to 1.

### Combined Filters

Verify Job Title filter works together with existing filters, such as:

```text
minExperienceYears
maxExperienceYears
dataProgress
other candidate filters
```

Example:

```http
GET /api/candidates?jobTitle=backend&minExperienceYears=3&maxExperienceYears=5&pageNumber=1&pageSize=20
```

### Clear Filter

Verify clearing Job Title:

- removes it from request params
- resets page to 1
- refetches candidates

---

## Important Implementation Notes

- Use `latestJobTitle` from backend.
- Do not compute latest job title on frontend.
- Do not fetch work experiences for the Candidates table.
- Do not match job title against historical work experiences on frontend.
- The backend owns latest-job-title selection logic.
- The frontend only sends `jobTitle` as a filter value and displays `latestJobTitle`.

