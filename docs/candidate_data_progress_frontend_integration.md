# Candidate Data Progress — Frontend Integration Guide

## Purpose

This document is a handoff guide for the AI Agent working on the **Next.js frontend** to integrate the already-implemented backend **Candidate Data Progress** feature.

The UI for Data Progress already exists, but it currently has no backend functionality connected.

The goal is to wire the frontend to the backend so that:

1. The **All Candidates table** displays each candidate's stored `dataProgressPercentage`.
2. The **Candidate Detail page** can fetch and display section-level progress breakdown.
3. The frontend does **not calculate progress locally**.
4. The frontend only consumes backend-provided progress values.

---

## Tech Stack

Frontend:

- Next.js App Router
- TypeScript
- shadcn/ui
- Tailwind CSS
- Existing candidate table and candidate detail UI

Backend:

- ASP.NET Core Web API
- PostgreSQL
- EF Core

---

## Core Rule

The frontend must **not calculate Data Progress**.

Data Progress is owned by the backend.

The frontend should only:

- display `dataProgressPercentage` in candidate lists
- fetch section breakdown from the candidate detail progress endpoint
- render loading, empty, and error states properly

---

## Backend Behavior Summary

The backend now stores the overall candidate data progress on the `candidates` table.

Backend columns added:

```sql
candidate.data_progress_percentage
candidate.data_progress_updated_at
```

The backend recalculates and saves progress after candidate-related mutations such as:

- basic information update
- work experience changes
- work experience projects changes
- work experience tech stacks changes
- work experience time support zones changes
- work experience benefits changes
- technical skills changes
- independent projects changes
- education changes
- certification changes
- achievement changes

Therefore, the frontend should expect the progress value in list responses to already be updated.

---

# 1. All Candidates Table Integration

## Required API Field

The candidate list API should now return:

```json
{
  "id": 1,
  "name": "Ali Khan",
  "email": "ali@example.com",
  "postingTitle": "Full Stack .NET Developer",
  "city": "Lahore",
  "status": "sourced",
  "dataProgressPercentage": 72.5
}
```

The exact candidate list DTO may contain more fields, but the frontend must use:

```ts
dataProgressPercentage: number
```

---

## Frontend Type Update

Find the existing Candidate list item type/interface and add:

```ts
export interface CandidateListItem {
  id: number;
  name: string;
  email?: string | null;
  postingTitle?: string | null;
  city?: string | null;
  status?: string | null;
  dataProgressPercentage: number;
}
```

If the project uses a different type name, update the existing type accordingly.

Do not create duplicate types if a type already exists.

---

## Table Column

Add or wire the existing **Data Progress** column in the All Candidates table.

Column label:

```text
Data Progress
```

Render using existing UI if already implemented. If not already wired, use shadcn/ui `Progress` component.

Example rendering:

```tsx
import { Progress } from "@/components/ui/progress";

function CandidateDataProgressCell({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <Progress value={safeValue} className="h-2 w-24" />
      <span className="text-sm font-medium tabular-nums">
        {Math.round(safeValue)}%
      </span>
    </div>
  );
}
```

Use existing styling conventions if the UI already has a progress component implemented.

---

## Recommended Progress Labels

If the existing UI supports badges or labels, use this mapping:

| Progress Range | Label |
|---|---|
| 0–39 | Incomplete |
| 40–69 | Needs Data |
| 70–89 | Good |
| 90–100 | Complete |

Helper function:

```ts
export function getDataProgressStatus(value: number) {
  if (value >= 90) return "Complete";
  if (value >= 70) return "Good";
  if (value >= 40) return "Needs Data";
  return "Incomplete";
}
```

Do not block integration if labels are not currently part of the UI.

---

## Important List Behavior

The All Candidates table should not call the detail progress endpoint for every candidate.

Do **not** do this:

```text
For each candidate row → GET /api/candidates/{id}/data-progress
```

That creates an N+1 API problem.

Correct behavior:

```text
GET /api/candidates
```

Use `dataProgressPercentage` returned by the list API.

---

# 2. Candidate Detail Progress Endpoint Integration

## Endpoint

The backend exposes:

```http
GET /api/candidates/{candidateId}/data-progress
```

Example:

```http
GET /api/candidates/15/data-progress
```

---

## Expected Response

```json
{
  "candidateId": 15,
  "overallPercentage": 72.5,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "percentage": 84.62,
      "weight": 30,
      "missingFields": ["CNIC", "GitHub URL"]
    },
    {
      "sectionKey": "workExperience",
      "sectionName": "Work Experience",
      "percentage": 75,
      "weight": 25,
      "missingFields": ["Benefits", "Time Support Zones"]
    }
  ]
}
```

---

## TypeScript Types

Create or update types:

```ts
export interface CandidateDataProgressSection {
  sectionKey: string;
  sectionName: string;
  percentage: number;
  weight: number;
  missingFields: string[];
}

export interface CandidateDataProgressResponse {
  candidateId: number;
  overallPercentage: number;
  sections: CandidateDataProgressSection[];
}
```

---

## API Client Function

Add an API client function in the existing API layer.

Example:

```ts
export async function getCandidateDataProgress(candidateId: number) {
  const response = await api.get<CandidateDataProgressResponse>(
    `/api/candidates/${candidateId}/data-progress`
  );

  return response.data;
}
```

Adapt this to the project’s existing API client pattern.

If the project uses `fetch`, use:

```ts
export async function getCandidateDataProgress(candidateId: number) {
  const response = await fetch(`/api/candidates/${candidateId}/data-progress`);

  if (!response.ok) {
    throw new Error("Failed to fetch candidate data progress");
  }

  return response.json() as Promise<CandidateDataProgressResponse>;
}
```

Use the actual backend base URL configuration already present in the project.

---

# 3. Candidate Detail Page UI Integration

## Where to Display

On the Candidate Detail page, use the already implemented Data Progress UI if it exists.

Recommended layout:

```text
Overall Data Progress: 72%

Basic Information       84%
Work Experience         75%
Technical Skills        100%
Independent Projects    0%
Education               66%
Certifications          100%
Achievements            0%
```

Each section should show:

- section name
- progress percentage
- progress bar
- optional missing fields

---

## Section Keys

Backend section keys:

```text
basicInformation
workExperience
technicalSkills
independentProjects
education
certifications
achievements
```

Do not hardcode calculations based on these keys.

It is acceptable to use keys for ordering or icons only.

Recommended display order:

```ts
const sectionOrder = [
  "basicInformation",
  "workExperience",
  "technicalSkills",
  "independentProjects",
  "education",
  "certifications",
  "achievements",
];
```

Sort sections by this order before rendering if backend does not already return them ordered.

---

## Missing Fields Display

If `missingFields` has values, display them as small badges, tooltip, or text list.

Example:

```tsx
{section.missingFields.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-1">
    {section.missingFields.map((field) => (
      <Badge key={field} variant="secondary">
        {field}
      </Badge>
    ))}
  </div>
)}
```

If there are no missing fields, show nothing or show:

```text
Complete
```

based on existing design.

---

## Loading State

While fetching candidate detail progress, show a skeleton or loading placeholder.

Example:

```tsx
<Skeleton className="h-4 w-40" />
<Skeleton className="h-2 w-full" />
```

Use existing project loading conventions.

---

## Error State

If the progress endpoint fails, do not break the whole Candidate Detail page.

Show a small inline error:

```text
Unable to load data progress.
```

Provide a retry button if the project has retry patterns.

---

# 4. After Candidate Mutations

Backend recalculates and saves progress after candidate-related mutations.

Frontend behavior after a successful mutation:

1. Invalidate/refetch the candidate detail data.
2. Invalidate/refetch candidate progress endpoint.
3. If returning to All Candidates table, ensure candidate list is refetched or cache invalidated.

Examples of mutations:

- Update Basic Information
- Add/Edit/Delete Work Experience
- Add/Edit/Delete Work Experience Project
- Add/Edit/Delete Work Experience Tech Stack
- Add/Edit/Delete Work Experience Time Support Zone
- Add/Edit/Delete Work Experience Benefit
- Add/Edit/Delete Technical Skill
- Add/Edit/Delete Independent Project
- Add/Edit/Delete Education
- Add/Edit/Delete Certification
- Add/Edit/Delete Achievement

If the frontend uses TanStack Query, invalidate:

```ts
queryClient.invalidateQueries({ queryKey: ["candidate", candidateId] });
queryClient.invalidateQueries({ queryKey: ["candidate-data-progress", candidateId] });
queryClient.invalidateQueries({ queryKey: ["candidates"] });
```

Use the actual query keys in the project.

---

# 5. All Candidates Table Cache Behavior

If the All Candidates table uses a paginated query, ensure `dataProgressPercentage` is part of the returned candidate DTO and cache.

When candidate data is updated from candidate detail page and user navigates back to All Candidates, the table should show the updated progress.

Possible solutions:

- refetch candidates list on page focus
- invalidate candidates list after successful mutations
- use stale time appropriate to existing project conventions

Do not manually recalculate progress on frontend.

---

# 6. Defensive UI Handling

Always normalize the percentage before rendering.

```ts
export function normalizeProgress(value?: number | null) {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
```

Use this for both list and detail UI.

---

# 7. Formatting Rules

Display percentages as whole numbers in table:

```ts
Math.round(value)
```

For detail page, one decimal is acceptable if design supports it:

```ts
value.toFixed(1)
```

Recommended:

- Table: `73%`
- Detail: `72.5%`

---

# 8. Frontend Files to Update

The agent should inspect the codebase and update the actual existing files.

Likely files/modules:

```text
Candidate types / DTOs
Candidate API client
All Candidates table columns
Candidate Detail page
Candidate Detail Data Progress component
Candidate mutation success handlers
```

Do not create duplicate components if equivalent components already exist.

Wire existing UI to backend data.

---

# 9. Do Not Do These Things

Do not calculate progress in frontend.

Do not fetch detail progress endpoint for every candidate row.

Do not add fake/static progress values.

Do not infer missing fields on frontend.

Do not change backend API contracts.

Do not rename backend response fields unless the existing API client already maps them.

Do not block candidate profile rendering if progress endpoint fails.

---

# 10. Suggested Implementation Steps for Agent

## Step 1: Inspect current UI

Find where Data Progress UI already exists:

- All Candidates table
- Candidate Detail page
- Any progress component already created

## Step 2: Update TypeScript types

Add:

```ts
dataProgressPercentage: number
```

to candidate list item type.

Add detail progress response types.

## Step 3: Update API client

Add function for:

```http
GET /api/candidates/{candidateId}/data-progress
```

## Step 4: Wire All Candidates table

Use `candidate.dataProgressPercentage` from the list API.

## Step 5: Wire Candidate Detail progress UI

Fetch progress breakdown by candidate ID.

Render:

- overall percentage
- sections
- missing fields

## Step 6: Add loading/error states

Use existing UI conventions.

## Step 7: Update cache invalidation

After candidate mutations, invalidate/refetch:

- candidate detail
- candidate data progress
- candidate list

## Step 8: Test manually

Test:

1. Candidate with 0% progress
2. Candidate with partial progress
3. Candidate with complete basic information
4. Candidate with complete work experience
5. Candidate detail section breakdown
6. Candidate update triggers progress refresh
7. All Candidates table displays stored percentage

---

# 11. Example Component for Detail Page

Use this only as guidance. Prefer existing project components if available.

```tsx
function CandidateDataProgressCard({ progress }: { progress: CandidateDataProgressResponse }) {
  const overall = normalizeProgress(progress.overallPercentage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-semibold">{overall.toFixed(1)}%</span>
          </div>
          <Progress value={overall} />
        </div>

        <div className="space-y-3">
          {progress.sections.map((section) => {
            const value = normalizeProgress(section.percentage);

            return (
              <div key={section.sectionKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{section.sectionName}</span>
                  <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>
                </div>
                <Progress value={value} />

                {section.missingFields.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {section.missingFields.map((field) => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

# 12. Final Expected Result

After implementation:

1. All Candidates table displays backend-provided progress percentage.
2. Candidate Detail page displays overall progress and section breakdown.
3. Missing fields are shown using backend response.
4. Updating candidate data refreshes progress.
5. No frontend-side progress calculation exists.
6. No N+1 progress API calls exist in the list page.

