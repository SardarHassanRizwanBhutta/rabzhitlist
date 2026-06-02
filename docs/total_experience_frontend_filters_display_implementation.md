# Frontend Implementation Guide: Total Experience Filters and Years of Experience Display

## Purpose

The backend now supports a calculated candidate experience value based on candidate work experiences.

This document contains the complete frontend instructions required to integrate:

1. **Total Experience filters** in the Candidates filter UI
2. **Years of Experience display** in the Candidates table

The existing Candidates table and filter UI already exist. Do **not** redesign existing UI. Only add the new filtering and display functionality described here.

---

## Backend Summary

The backend calculates total experience from `candidate_work_experiences` using each work experience's `startDate` and `endDate`.

Backend behavior:

- Work experiences are the source of truth.
- Backend stores a calculated value on the candidate record.
- Experience is stored internally as total months.
- Backend merges overlapping work experience date ranges before calculating total experience.
- If a work experience has no `endDate`, backend treats it as ongoing up to the current date.
- Candidate filtering is performed using the stored calculated experience value.

Frontend must not calculate total experience from work experiences.

Frontend should only:

- send filter values to the API
- display the experience value returned by the API

---

## API Contract

### Candidate List Endpoint

Existing endpoint:

```http
GET /api/candidates
```

The backend now supports two optional query parameters:

```http
minExperienceYears
maxExperienceYears
```

Example:

```http
GET /api/candidates?minExperienceYears=3&maxExperienceYears=5&pageNumber=1&pageSize=20
```

Meaning:

```text
Return candidates whose calculated total experience is between 3 and 5 years.
```

### Supported Query Parameters

| Parameter | Type | Required | Description |
|---|---:|---:|---|
| `minExperienceYears` | number/decimal | No | Minimum total years of experience |
| `maxExperienceYears` | number/decimal | No | Maximum total years of experience |

Both fields are optional.

Valid examples:

```http
/api/candidates?minExperienceYears=3
/api/candidates?maxExperienceYears=5
/api/candidates?minExperienceYears=2.5&maxExperienceYears=6
```

---

## Candidate List Response

The Candidates list API should now return total experience information for each candidate.

Expected candidate item shape:

```json
{
  "id": 1,
  "name": "Ali Khan",
  "email": "ali@example.com",
  "postingTitle": "Senior Software Engineer",
  "city": "Lahore",
  "dataProgressPercentage": 76.5,
  "totalExperienceMonths": 42,
  "totalExperienceYears": 3.5
}
```

Depending on backend implementation, the API may return either:

1. `totalExperienceMonths` only
2. both `totalExperienceMonths` and `totalExperienceYears`

Frontend should support both safely.

Recommended frontend rule:

```ts
const years =
  candidate.totalExperienceYears ??
  candidate.totalExperienceMonths / 12;
```

If neither value exists, display `0 years` or `—` depending on current table convention.

Recommended display for missing/null:

```text
—
```

Recommended display for zero:

```text
0 years
```

---

## TypeScript Type Updates

Update the Candidate list item/interface/type used by the Candidates table.

Example:

```ts
export type CandidateListItem = {
  id: number;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  postingTitle?: string | null;
  city?: string | null;
  status?: string | null;
  dataProgressPercentage?: number | null;

  totalExperienceMonths?: number | null;
  totalExperienceYears?: number | null;
};
```

If your project has a generated API type or centralized DTO type, update that instead of creating a duplicate local type.

---

## Filter UI Requirements

Add two numeric input fields to the existing Candidates filter UI:

1. **Minimum Years of Experience**
2. **Maximum Years of Experience**

Do not replace existing filters.

Place them near other candidate numeric filters if such a section exists.

Recommended labels:

```text
Minimum Years of Experience
Maximum Years of Experience
```

Shorter labels are also acceptable if the UI is compact:

```text
Min Experience
Max Experience
```

Recommended placeholders:

```text
Min e.g. 2
Max e.g. 5
```

---

## Filter Form State

Add these values to the candidate filter state:

```ts
minExperienceYears?: number | null;
maxExperienceYears?: number | null;
```

Example:

```ts
type CandidateFilters = {
  search?: string;
  status?: string;
  city?: string;
  // existing filters...

  minExperienceYears?: number | null;
  maxExperienceYears?: number | null;
};
```

---

## Input Behavior

Use numeric inputs.

Recommended configuration:

```tsx
<Input
  type="number"
  min={0}
  step={0.5}
  placeholder="Min e.g. 2"
  value={filters.minExperienceYears ?? ""}
  onChange={(event) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      minExperienceYears: value === "" ? null : Number(value),
    }));
  }}
/>
```

For max:

```tsx
<Input
  type="number"
  min={0}
  step={0.5}
  placeholder="Max e.g. 5"
  value={filters.maxExperienceYears ?? ""}
  onChange={(event) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      maxExperienceYears: value === "" ? null : Number(value),
    }));
  }}
/>
```

Allow decimals because candidates may have experience such as:

```text
2.5 years
3.5 years
4.5 years
```

---

## Validation Rules

Frontend should apply basic validation before calling the API.

Rules:

1. Minimum years cannot be negative.
2. Maximum years cannot be negative.
3. Maximum years cannot be less than minimum years.
4. Empty values should be treated as no filter.
5. Decimals should be allowed.

Validation examples:

| Min | Max | Valid | Meaning |
|---:|---:|---:|---|
| empty | empty | Yes | No experience filter |
| 3 | empty | Yes | 3+ years |
| empty | 5 | Yes | Up to 5 years |
| 3 | 5 | Yes | Between 3 and 5 years |
| 5 | 3 | No | Invalid range |
| -1 | 5 | No | Negative value |

Recommended validation message:

```text
Maximum experience cannot be less than minimum experience.
```

Recommended negative value message:

```text
Experience years cannot be negative.
```

---

## Building API Query Parameters

When applying filters, include only values that are not null, undefined, or empty.

Example:

```ts
const params = new URLSearchParams();

if (filters.minExperienceYears !== null && filters.minExperienceYears !== undefined) {
  params.set("minExperienceYears", String(filters.minExperienceYears));
}

if (filters.maxExperienceYears !== null && filters.maxExperienceYears !== undefined) {
  params.set("maxExperienceYears", String(filters.maxExperienceYears));
}
```

If the project already uses Axios params, TanStack Query params, or a custom API client, add the fields to the existing request object:

```ts
const query = {
  ...existingFilters,
  minExperienceYears: filters.minExperienceYears ?? undefined,
  maxExperienceYears: filters.maxExperienceYears ?? undefined,
  pageNumber,
  pageSize,
};
```

Do not send empty strings.

Avoid this:

```http
/api/candidates?minExperienceYears=&maxExperienceYears=
```

Use this instead when filters are empty:

```http
/api/candidates?pageNumber=1&pageSize=20
```

---

## Reset / Clear Filters Behavior

When the user clears filters, reset both fields:

```ts
minExperienceYears: null,
maxExperienceYears: null,
```

or remove them from the filter object entirely.

The cleared request should not include experience filter parameters.

---

## Pagination Behavior

When applying or changing the experience filters, reset pagination to page 1.

Example:

```ts
setPageNumber(1);
fetchCandidates({
  ...filters,
  minExperienceYears,
  maxExperienceYears,
  pageNumber: 1,
});
```

This should match the behavior of existing filters.

---

## Candidate Table Display

The Candidates table already has or needs a column named:

```text
Years of Experience
```

Populate this column from the backend total experience value.

Do not calculate total experience from work experience rows on the frontend.

### Formatting Rules

Use the backend value:

```ts
candidate.totalExperienceYears
```

If that is not available, derive from months:

```ts
candidate.totalExperienceMonths / 12
```

Recommended helper:

```ts
export function formatYearsOfExperience(candidate: {
  totalExperienceYears?: number | null;
  totalExperienceMonths?: number | null;
}) {
  const years =
    candidate.totalExperienceYears ??
    (candidate.totalExperienceMonths != null
      ? candidate.totalExperienceMonths / 12
      : null);

  if (years == null) {
    return "—";
  }

  if (years === 0) {
    return "0 years";
  }

  const rounded = Math.round(years * 10) / 10;

  return `${rounded} ${rounded === 1 ? "year" : "years"}`;
}
```

Examples:

| Months | Display |
|---:|---|
| null | — |
| 0 | 0 years |
| 6 | 0.5 years |
| 12 | 1 year |
| 18 | 1.5 years |
| 42 | 3.5 years |
| 60 | 5 years |

If the backend returns `totalExperienceYears` already rounded, display that value directly using the same formatter.

---

## Optional Display Enhancement

If the backend returns only months and product wants a more human-friendly format, this helper can be used:

```ts
export function formatExperienceFromMonths(months?: number | null) {
  if (months == null) return "—";
  if (months <= 0) return "0 years";

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  }

  return `${years} ${years === 1 ? "year" : "years"} ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
}
```

Examples:

| Months | Display |
|---:|---|
| 6 | 6 months |
| 12 | 1 year |
| 18 | 1 year 6 months |
| 42 | 3 years 6 months |

Use this only if the current UI has enough space. For compact tables, prefer decimal years.

Recommended table display:

```text
3.5 years
```

---

## Sorting

Only implement sorting by Years of Experience if the backend already supports sorting by total experience.

If backend sorting is not implemented, do not add client-side sorting over paginated server data because it will only sort the current page and produce incorrect results.

If sorting is added later, the frontend should send something like:

```http
/api/candidates?sortBy=totalExperienceMonths&sortDirection=desc
```

Do not implement this unless confirmed by backend contract.

---

## Error Handling

If the API rejects invalid experience filters, show the backend error message if available.

Frontend should still prevent obvious invalid requests before submitting.

Recommended behavior:

- invalid range: keep filter dialog open
- show inline validation message near the fields
- do not call API until fixed

---

## Loading State

No special loading behavior is required.

Use the existing candidate list loading state when filters are applied.

---

## Empty State

If no candidates match the experience filter, use the existing empty table state.

No special new empty state is required.

---

## Frontend Implementation Checklist

### Types

- [ ] Add `totalExperienceMonths?: number | null` to Candidate list item type.
- [ ] Add `totalExperienceYears?: number | null` if backend returns it.
- [ ] Add `minExperienceYears?: number | null` to candidate filter state.
- [ ] Add `maxExperienceYears?: number | null` to candidate filter state.

### Filter UI

- [ ] Add `Minimum Years of Experience` numeric input.
- [ ] Add `Maximum Years of Experience` numeric input.
- [ ] Allow decimal input, recommended `step={0.5}`.
- [ ] Prevent negative values.
- [ ] Validate max is not less than min.
- [ ] Reset page number to 1 when filters change/apply.
- [ ] Clear both fields when filters are reset.

### API Integration

- [ ] Send `minExperienceYears` only when provided.
- [ ] Send `maxExperienceYears` only when provided.
- [ ] Do not send empty strings.
- [ ] Preserve existing filters and pagination behavior.

### Table Display

- [ ] Populate `Years of Experience` column using backend value.
- [ ] Prefer `totalExperienceYears` if returned.
- [ ] Fallback to `totalExperienceMonths / 12`.
- [ ] Display `—` for missing/null values.
- [ ] Display `0 years` for zero experience.
- [ ] Round to one decimal place for compact display.

### Testing

- [ ] Candidate with 0 months shows `0 years`.
- [ ] Candidate with 6 months shows `0.5 years` or `6 months`, depending on chosen formatter.
- [ ] Candidate with 42 months shows `3.5 years`.
- [ ] Min only filter works.
- [ ] Max only filter works.
- [ ] Min + Max filter works.
- [ ] Invalid range shows validation and does not call API.
- [ ] Clear filters removes experience params from API request.
- [ ] Pagination resets to page 1 after applying experience filters.
- [ ] Existing filters still work together with experience filters.

---

## Example End-to-End Flow

User enters:

```text
Minimum Years of Experience: 3
Maximum Years of Experience: 5
```

Frontend request:

```http
GET /api/candidates?minExperienceYears=3&maxExperienceYears=5&pageNumber=1&pageSize=20
```

Backend filters using calculated total experience months.

Candidate response item:

```json
{
  "id": 12,
  "name": "Sara Ahmed",
  "postingTitle": "Backend Engineer",
  "city": "Karachi",
  "totalExperienceMonths": 42,
  "totalExperienceYears": 3.5,
  "dataProgressPercentage": 81
}
```

Frontend displays in table:

```text
3.5 years
```

---

## Important Notes

- Do not calculate candidate experience from work experience rows on the frontend.
- Do not call a separate endpoint per candidate to fetch experience.
- Do not client-side filter experience after fetching paginated candidates.
- Do not sort experience client-side unless all candidates are loaded, which should not be done.
- The Candidates list API is the source of truth for table display and filtering.
- Experience filters must be server-side filters.

