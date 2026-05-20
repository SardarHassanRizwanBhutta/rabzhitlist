# Candidate Data Progress Frontend Integration Update

## Purpose

This document is a handoff guide for the AI Agent working on the **Next.js frontend** to integrate the latest backend changes for the **Candidate Data Progress** feature.

The Data Progress UI already exists. The task is **not to redesign the UI**, but to update the frontend integration so it works correctly with the updated backend response shape and scoring model.

---

## Important Instruction for the Frontend Agent

Do **not** rebuild or redesign the existing Data Progress UI.

Only update the frontend where required to consume the new backend response correctly.

Do **not** make unrelated changes to:

- table layout
- candidate detail page layout
- unrelated candidate fields
- backend API contracts
- API routes
- styling unrelated to Data Progress values

---

## Backend Changes Summary

The backend Data Progress calculation has been updated from the previous weighted percentage model to a **direct point-based scoring model**.

Previously, sections were weighted like:

```text
Basic Information 30%
Work Experience 25%
...
```

Now, each section has a fixed maximum point value, and the final progress is calculated by summing all section scores.

---

## New Scoring Model

Total maximum score is **100 points**.

| Section | Max Points |
|---|---:|
| Basic Information | 10 |
| Work Experience | 50 |
| Independent Technical Skills | 10 |
| Independent Projects | 10 |
| Education | 5 |
| Certifications | 10 |
| Achievements | 5 |
| **Total** | **100** |

Backend formula:

```text
overallPercentage = sum(section.score), clamped between 0 and 100
```

Because the total max score is 100, the `overallPercentage` is numerically equal to the total earned points.

Example:

```text
Basic Information: 8 / 10
Work Experience: 42 / 50
Technical Skills: 10 / 10
Independent Projects: 7 / 10
Education: 3 / 5
Certifications: 8 / 10
Achievements: 4 / 5

Overall = 82%
```

---

## Backend Endpoints

### Candidate List Endpoint

The candidate list endpoint remains unchanged in purpose.

It still returns the stored progress value for the All Candidates table.

Example:

```http
GET /api/candidates
```

Expected candidate list item contains:

```json
{
  "id": 1,
  "name": "Ali Khan",
  "postingTitle": "Full Stack .NET Developer",
  "city": "Lahore",
  "dataProgressPercentage": 82
}
```

Frontend should continue using:

```ts
dataProgressPercentage
```

for the All Candidates table progress display.

---

### Candidate Detail Data Progress Endpoint

The candidate detail progress endpoint still exists:

```http
GET /api/candidates/{candidateId}/data-progress
```

However, the section response shape has changed.

---

## Updated Candidate Detail Progress Response

The backend now returns each section with:

- `score`
- `maxScore`
- `percentage`
- `missingFields`

The old field:

```text
weight
```

has been removed.

### New Response Example

```json
{
  "candidateId": 1,
  "overallPercentage": 82,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 8,
      "maxScore": 10,
      "percentage": 80,
      "missingFields": ["CNIC"]
    },
    {
      "sectionKey": "workExperience",
      "sectionName": "Work Experience",
      "score": 42,
      "maxScore": 50,
      "percentage": 84,
      "missingFields": ["Benefits"]
    }
  ]
}
```

---

## TypeScript Type Updates

Update the frontend DTO/type definitions for candidate data progress.

### Old Section Type

The old type may have looked similar to this:

```ts
export type CandidateDataProgressSection = {
  sectionKey: string;
  sectionName: string;
  percentage: number;
  weight: number;
  missingFields: string[];
};
```

### New Section Type

Replace it with:

```ts
export type CandidateDataProgressSection = {
  sectionKey: string;
  sectionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  missingFields: string[];
};
```

### Full Response Type

```ts
export type CandidateDataProgressResponse = {
  candidateId: number;
  overallPercentage: number;
  sections: CandidateDataProgressSection[];
};
```

---

## Required Frontend Changes

### 1. Remove Usage of `weight`

Search the frontend code for:

```ts
weight
```

inside Data Progress components/types.

Remove or replace all Data Progress usages of `weight`.

The backend no longer returns it.

---

### 2. Use `score` and `maxScore` in Section Breakdown

Where the Candidate Detail page displays section breakdowns, use:

```text
score / maxScore
```

Example display:

```text
Work Experience: 42 / 50
```

The section progress bar should use:

```ts
section.percentage
```

not `score` directly.

Example:

```tsx
<Progress value={section.percentage} />
<span>{section.score} / {section.maxScore}</span>
```

---

### 3. Overall Progress Still Uses `overallPercentage`

Overall progress should continue to use:

```ts
overallPercentage
```

Example:

```tsx
<Progress value={data.overallPercentage} />
<span>{data.overallPercentage}%</span>
```

---

### 4. All Candidates Table Still Uses Stored Progress

The All Candidates table should continue using:

```ts
candidate.dataProgressPercentage
```

No major UI change is required for the table unless the current implementation depends on the old breakdown structure.

Example:

```tsx
<Progress value={candidate.dataProgressPercentage ?? 0} />
<span>{candidate.dataProgressPercentage ?? 0}%</span>
```

---

### 5. Missing Fields Behavior

`missingFields` is still returned by the backend and should keep the same purpose:

```text
Show which scored fields are missing for a section.
```

Important backend behavior:

The backend does **not** include zero-point nice-to-have fields in `missingFields`.

So the frontend should simply display whatever is returned by the backend.

Do not hardcode missing field rules on the frontend.

---

## Section Keys Returned by Backend

The backend may return these section keys:

```text
basicInformation
workExperience
technicalSkills
independentProjects
education
certifications
achievements
```

Frontend should not rely on hardcoded order unless the UI already does so.

Preferred behavior:

- render sections in the order returned by the backend, or
- define a stable frontend order using these section keys.

Suggested display labels come from:

```ts
section.sectionName
```

Do not manually remap labels unless necessary.

---

## Important Backend Scoring Details for Frontend Awareness

The frontend does not need to calculate these scores, but the agent should understand them to display the data correctly.

### Basic Information

Max score: `10`

Important scored fields include:

- Name
- City
- Current Salary
- Expected Salary
- CNIC
- Phone Number
- Email
- LinkedIn URL
- Personality Type
- Top Developer

Zero-point fields do not contribute and should not appear as missing:

- Posting Title
- GitHub URL
- Source
- Total Experience Years

---

### Work Experience

Max score: `50`

Backend uses the **best single work experience**, not an average of all experiences.

This is intentional because parsed resumes can create multiple incomplete historical experiences.

Frontend should not try to recompute or reinterpret this.

---

### Independent Technical Skills

Max score: `10`

At least one independent skill gives full section score.

---

### Independent Projects

Max score: `10`

Backend uses the best independent project score.

This is based on:

- project/project name
- contribution

---

### Education

Max score: `5`

Backend uses the best education entry.

Only these fields contribute:

- Start Month
- Grades
- Topper
- Cheetah

Zero-point fields include:

- University
- Degree
- Major
- End Month

---

### Certifications

Max score: `10`

Backend uses the best certification entry.

Fields scored:

- Certification
- Issue Date
- Expiry Date
- URL
- Level

---

### Achievements

Max score: `5`

Backend uses the best achievement entry.

Fields scored:

- Name
- Type
- Ranking
- Year
- URL

Description is zero-point and does not affect completion.

---

## API Integration Checklist

The frontend agent should verify these items:

### Candidate List

- [ ] Candidate list type includes `dataProgressPercentage`.
- [ ] All Candidates table uses `dataProgressPercentage` for the progress bar.
- [ ] Null/undefined progress values safely fallback to `0`.
- [ ] No frontend-side progress calculation is performed.

### Candidate Detail

- [ ] Candidate detail page calls `GET /api/candidates/{id}/data-progress` where needed.
- [ ] Response type includes `score`, `maxScore`, and `percentage`.
- [ ] Old `weight` usage is removed.
- [ ] Section progress bars use `section.percentage`.
- [ ] Section numeric display uses `section.score / section.maxScore`.
- [ ] Missing fields display uses `section.missingFields` directly.

### Error and Loading States

- [ ] Keep existing loading skeleton/spinner if already implemented.
- [ ] Keep existing error handling if already implemented.
- [ ] Do not break the page if the detail endpoint returns no sections.

---

## UI Display Recommendations

Do not redesign the UI, but if the existing UI already has a section breakdown, update the displayed values as follows.

### Overall

```text
Data Progress: 82%
```

### Section

```text
Work Experience
42 / 50
84%
```

Use:

```ts
section.score
section.maxScore
section.percentage
```

---

## Important: Do Not Implement These on Frontend

Do **not** calculate:

- Basic Information score
- Work Experience score
- Technical Skills score
- Project score
- Education score
- Certification score
- Achievement score
- Overall score

The backend is the source of truth.

The frontend should only display values returned by the API.

---

## Backfill Note

After backend deployment, existing candidates must be recalculated using:

```http
POST /api/admin/candidates/recalculate-data-progress
```

This is a backend/admin operation.

The frontend agent does not need to implement this unless an admin UI already exists for maintenance actions.

---

## Expected Final Result

After frontend integration:

1. All Candidates table displays updated `dataProgressPercentage` from the backend.
2. Candidate detail progress breakdown displays:
   - section score
   - section max score
   - section percentage
   - missing fields
3. No frontend code depends on the removed `weight` field.
4. No frontend code calculates progress locally.
5. Existing Data Progress UI remains visually intact, only data binding is updated.

---

## Agent Implementation Instruction

Implement only the frontend integration changes required by the new backend Data Progress response.

Do not redesign the UI.

Do not modify unrelated candidate forms, filters, tables, or backend API contracts.

Focus on:

- TypeScript DTO updates
- API client response handling
- Candidate list data binding
- Candidate detail progress section binding
- Removing old `weight` usage
- Displaying `score / maxScore`
