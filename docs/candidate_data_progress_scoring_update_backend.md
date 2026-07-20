# Candidate Data Progress Scoring Update — Backend Implementation Guide

## Purpose

The Candidate Data Progress feature has already been implemented on the backend and frontend. This document describes the **new scoring model changes** that must be applied to the existing backend implementation.

The goal is to replace the previous section-weighted progress formula with a **direct absolute 100-point scoring model**.

The backend must continue to be the source of truth for Data Progress.

---

## Current Architecture to Preserve

Do **not** redesign the existing architecture.

Keep the existing approach:

```text
Candidate-related data changes
    ↓
Backend saves the actual change
    ↓
CandidateDataProgressService recalculates progress
    ↓
Progress is stored on candidates.data_progress_percentage
    ↓
Frontend displays stored value
```

Keep using:

```text
Option B: Separate command after save
```

That means after every successful candidate-related create/update/delete operation:

```csharp
await dbContext.SaveChangesAsync(cancellationToken);

await candidateDataProgressService.RecalculateAndSaveAsync(
    candidateId,
    cancellationToken
);
```

---

## Important Existing Fields

`TotalExperienceYears` contributes points when assigned, including when its value is `0`.

Important:

```text
TotalExperienceYears = 0 is valid and should count as filled.
```

`IsTopDeveloper` was removed from the candidate model; its former +3 Basic points are on **Email** (4 pts).

So the check must be:

```csharp
candidate.TotalExperienceYears.HasValue
```

not:

```csharp
candidate.TotalExperienceYears > 0
```

---

## Database Changes

No new database table is required.

No new migration is required unless the existing candidate progress DTO/entity does not already expose required fields.

The existing columns should remain:

```sql
data_progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
data_progress_updated_at TIMESTAMP WITH TIME ZONE
```

Do not add a new progress column.

Do not change table relationships.

---

## New Scoring Model

The total score is **100 points**.

Each section contributes absolute points directly.

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

The final score is:

```csharp
overall = basicInformationScore
        + workExperienceScore
        + technicalSkillsScore
        + independentProjectsScore
        + educationScore
        + certificationsScore
        + achievementsScore;
```

Then:

```csharp
overall = Math.Round(Math.Clamp(overall, 0, 100), 2);
```

Because total max score is 100, the total score is also the overall percentage.

---

## Zero-Point Fields

Some fields are nice to have but must not contribute to Data Progress.

These fields should **not** add points and should **not** be shown as missing fields:

```text
Posting Title
GitHub URL
Source
University
Degree
Major
Education End Month
Achievement Description
```

They can still exist in the response and UI, but they must not affect progress percentage.

---

# Section 1: Basic Information — 10 Points

## Fields and Points

| Field | Points |
|---|---:|
| Name | 0.5 |
| City | 0.5 |
| Current Salary | 1 |
| Expected Salary | 1 |
| CNIC | 0.5 |
| Posting Title | 0 |
| Phone Number | 1 |
| Email | 4 |
| LinkedIn URL | 1 |
| GitHub URL | 0 |
| Source | 0 |
| Personality Type | 0.5 |
| Total Experience Years | 0 |
| **Total** | **10** |

This keeps the section mathematically correct:

```text
0.5 + 0.5 + 1 + 1 + 0.5 + 1 + 4 + 1 + 0.5 = 10
```

> **Note (2026-07):** `IsTopDeveloper (removed — see Email = 4 pts)` / Top Developer (+3) was removed; those points were added to Email (1 → 4).
## Implementation Logic

```csharp
private CandidateDataProgressSectionResult CalculateBasicInformationProgress(
    CandidateProgressData candidate)
{
    decimal score = 0;
    const decimal maxScore = 10;

    var missingFields = new List<string>();

    if (!string.IsNullOrWhiteSpace(candidate.Name)) score += 0.5m;
    else missingFields.Add("Name");

    if (!string.IsNullOrWhiteSpace(candidate.City)) score += 0.5m;
    else missingFields.Add("City");

    if (candidate.CurrentSalary.HasValue) score += 1m;
    else missingFields.Add("Current Salary");

    if (candidate.ExpectedSalary.HasValue) score += 1m;
    else missingFields.Add("Expected Salary");

    if (!string.IsNullOrWhiteSpace(candidate.Cnic)) score += 0.5m;
    else missingFields.Add("CNIC");

    if (!string.IsNullOrWhiteSpace(candidate.PhoneNumber)) score += 1m;
    else missingFields.Add("Phone Number");

    if (!string.IsNullOrWhiteSpace(candidate.Email)) score += 4m;
    else missingFields.Add("Email");

    if (!string.IsNullOrWhiteSpace(candidate.LinkedInUrl)) score += 1m;
    else missingFields.Add("LinkedIn URL");

    if (candidate.PersonalityType.HasValue) score += 0.5m;
    else missingFields.Add("Personality Type");

    return CreateSection(
        sectionKey: "basicInformation",
        sectionName: "Basic Information",
        score: score,
        maxScore: maxScore,
        missingFields: missingFields
    );
}
```

Do not add missing fields for:

```text
Posting Title
GitHub URL
Source
```

because these are zero-point nice-to-have fields.

---

# Section 2: Work Experience — 50 Points

Work Experience is dynamic.

A candidate may have multiple parsed historical work experiences. Many can be incomplete.

Use:

```text
best completed work experience
```

Do **not** average all work experiences.

For each work experience, calculate score out of 50, then use the highest score.

```csharp
workExperienceScore = workExperiences.Any()
    ? workExperiences.Max(CalculateSingleWorkExperienceScore)
    : 0;
```

## Fields and Points

| Field / Related Data | Points |
|---|---:|
| Job Title | 2 |
| Employer | 5 |
| Start Date | 2.5 |
| End Date | 2.5 |
| Tech Stacks | 10 |
| Shift Type | 2 |
| Work Mode | 1 |
| Time Support Zones | 1 |
| Benefits | 7 |
| Work Experience Project Name / Project | 3 |
| Work Experience Project Contribution | 14 |
| **Total** | **50** |

## Dynamic Rules

### Tech Stacks

Uses:

```text
candidate_work_experience_tech_stacks
```

Rule:

```text
At least one tech stack = full 10 points
No tech stack = 0
```

### Time Support Zones

Uses:

```text
candidate_work_experience_time_support_zones
```

Rule:

```text
At least one time support zone = full 1 point
No time support zone = 0
```

### Benefits

Uses:

```text
candidate_work_experience_benefits
```

Rule:

```text
At least one benefit = full 7 points
No benefit = 0
```

Do not require benefit unit/value for Data Progress.

A benefit with or without a unit/value counts as present.

### Work Experience Projects

Uses:

```text
candidate_work_experience_projects
```

This is mandatory for strong Work Experience completion.

These are projects that belong to a work experience.

Do not confuse them with `candidate_projects`.

For each work experience, score the best related work experience project:

| Field | Points |
|---|---:|
| Project Name / Project | 3 |
| Contribution | 14 |

Rule:

```text
At least one work experience project with ProjectId = 3 points.
At least one work experience project with Contribution = 14 points.
```

Use the best project score inside the work experience.

## Implementation Logic

```csharp
private CandidateDataProgressSectionResult CalculateWorkExperienceProgress(
    List<WorkExperienceProgressData> workExperiences)
{
    const decimal maxScore = 50;

    if (workExperiences.Count == 0)
    {
        return CreateSection(
            "workExperience",
            "Work Experience",
            0,
            maxScore,
            new List<string> { "Work Experience" }
        );
    }

    var best = workExperiences
        .Select(CalculateSingleWorkExperienceScore)
        .OrderByDescending(x => x.Score)
        .First();

    return CreateSection(
        "workExperience",
        "Work Experience",
        best.Score,
        maxScore,
        best.MissingFields
    );
}
```

```csharp
private WorkExperienceScoreResult CalculateSingleWorkExperienceScore(
    WorkExperienceProgressData exp)
{
    decimal score = 0;
    var missingFields = new List<string>();

    if (!string.IsNullOrWhiteSpace(exp.JobTitle)) score += 2m;
    else missingFields.Add("Job Title");

    if (exp.EmployerId.HasValue) score += 5m;
    else missingFields.Add("Employer");

    if (exp.StartDate.HasValue) score += 2.5m;
    else missingFields.Add("Start Date");

    if (exp.EndDate.HasValue) score += 2.5m;
    else missingFields.Add("End Date");

    if (exp.TechStackCount > 0) score += 10m;
    else missingFields.Add("Tech Stacks");

    if (exp.ShiftType.HasValue) score += 2m;
    else missingFields.Add("Shift Type");

    if (exp.WorkMode.HasValue) score += 1m;
    else missingFields.Add("Work Mode");

    if (exp.TimeSupportZoneCount > 0) score += 1m;
    else missingFields.Add("Time Support Zones");

    if (exp.BenefitCount > 0) score += 7m;
    else missingFields.Add("Benefits");

    var bestProjectScore = 0m;
    var hasProject = false;
    var hasContribution = false;

    foreach (var project in exp.WorkExperienceProjects)
    {
        decimal projectScore = 0;

        if (project.ProjectId.HasValue)
        {
            projectScore += 3m;
            hasProject = true;
        }

        if (!string.IsNullOrWhiteSpace(project.Contribution))
        {
            projectScore += 14m;
            hasContribution = true;
        }

        if (projectScore > bestProjectScore)
            bestProjectScore = projectScore;
    }

    score += bestProjectScore;

    if (!hasProject) missingFields.Add("Work Experience Project");
    if (!hasContribution) missingFields.Add("Work Experience Project Contribution");

    return new WorkExperienceScoreResult
    {
        Score = score,
        MissingFields = missingFields
    };
}
```

---

# Section 3: Independent Technical Skills — 10 Points

Uses:

```text
candidate_tech_stacks
```

Rule:

```text
At least one independent technical skill = 10 points
No independent technical skills = 0
```

---

# Section 4: Independent Projects — 10 Points

Uses:

```text
candidate_projects
```

These are standalone candidate projects.

Do not include `candidate_work_experience_projects` here.

## Fields and Points

| Field | Points |
|---|---:|
| Project Name / Project | 3 |
| Contribution | 7 |
| **Total** | **10** |

Use the best independent project.

---

# Section 5: Education — 5 Points

Uses:

```text
candidate_educations
```

Use the best education entry.

## Fields and Points

| Field | Points |
|---|---:|
| University | 0 |
| Degree | 0 |
| Major | 0 |
| Start Month | 1 |
| End Month | 0 |
| Average Grade / Grades | 1 |
| Topper | 1 |
| Cheetah | 2 |
| **Total** | **5** |

Do not include zero-point fields as missing fields.

---

# Section 6: Certifications — 10 Points

Uses:

```text
candidate_certifications
```

Use the best certification entry.

## Fields and Points

| Field | Points |
|---|---:|
| Certification Name / Certification | 1 |
| Issue Date | 1 |
| Expiry Date | 1 |
| Certification URL | 5 |
| Certification Level | 2 |
| **Total** | **10** |

---

# Section 7: Achievements — 5 Points

Uses:

```text
candidate_achievements
```

Use the best achievement entry.

## Fields and Points

| Field | Points |
|---|---:|
| Name | 1 |
| Type | 1 |
| Ranking | 1 |
| Year | 1 |
| URL | 1 |
| Description | 0 |
| **Total** | **5** |

Do not include Description in scoring or missing fields.

---

# DTO Updates

The candidate data progress detail endpoint should return section score data.

Expected response:

```json
{
  "candidateId": 1,
  "overallPercentage": 72.5,
  "sections": [
    {
      "sectionKey": "basicInformation",
      "sectionName": "Basic Information",
      "score": 7.5,
      "maxScore": 10,
      "percentage": 75,
      "missingFields": ["CNIC", "Top Developer"]
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

Update DTOs if needed:

```csharp
public sealed class CandidateDataProgressResult
{
    public long CandidateId { get; set; }
    public decimal OverallPercentage { get; set; }
    public List<CandidateDataProgressSectionResult> Sections { get; set; } = new();
}

public sealed class CandidateDataProgressSectionResult
{
    public string SectionKey { get; set; } = default!;
    public string SectionName { get; set; } = default!;
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
    public decimal Percentage { get; set; }
    public List<string> MissingFields { get; set; } = new();
}
```

Helper:

```csharp
private CandidateDataProgressSectionResult CreateSection(
    string sectionKey,
    string sectionName,
    decimal score,
    decimal maxScore,
    List<string> missingFields)
{
    score = Math.Clamp(score, 0, maxScore);

    var percentage = maxScore == 0
        ? 0
        : Math.Round(score / maxScore * 100, 2);

    return new CandidateDataProgressSectionResult
    {
        SectionKey = sectionKey,
        SectionName = sectionName,
        Score = Math.Round(score, 2),
        MaxScore = maxScore,
        Percentage = percentage,
        MissingFields = missingFields
    };
}
```

---

# Data Projection Requirements

Update the existing progress data projection to include all required fields.

Required candidate fields:

```text
Name
City
CurrentSalary
ExpectedSalary
Cnic
PhoneNumber
Email
LinkedInUrl
PersonalityType
TotalExperienceYears
IsTopDeveloper (removed — see Email = 4 pts)
```

Required work experience fields:

```text
JobTitle
EmployerId
StartDate
EndDate
ShiftType
WorkMode
TechStackCount
TimeSupportZoneCount
BenefitCount
WorkExperienceProjects
    ProjectId
    Contribution
```

Required independent project fields:

```text
CandidateProjects
    ProjectId
    Contribution
```

Required education fields:

```text
StartMonth
Grades
IsTopper
IsMainCheetah
```

Required certification fields:

```text
CertificationId
IssueDate
ExpiryDate
Url
Level
```

Required achievement fields:

```text
Name
Type
Ranking
Year
Url
```

Use projection instead of loading full entity graphs with many `Include`s.

Use `AsNoTracking()` for calculation.

---

# Candidate Detail Progress Endpoint

Keep or update existing endpoint:

```http
GET /api/candidates/{candidateId}/data-progress
```

It should return the updated scoring breakdown.

The endpoint can calculate live using:

```csharp
await candidateDataProgressService.CalculateAsync(candidateId, cancellationToken);
```

It does not need to save progress.

---

# Stored Progress Recalculation

`RecalculateAndSaveAsync` should use the updated scoring formula.

It should update:

```text
candidates.data_progress_percentage
candidates.data_progress_updated_at
```

---

# Recalculation Triggers

No architectural changes are required.

Keep calling recalculation after successful save for:

```text
Candidate basic info create/update
Candidate work experience create/update/delete
Work experience tech stack add/remove
Work experience project add/remove/update contribution
Work experience time support zone add/remove
Work experience benefit add/remove/update
Candidate tech stack add/remove
Candidate independent project add/remove/update contribution
Candidate education add/remove/update
Candidate certification add/remove/update
Candidate achievement add/remove/update
```

---

# Backfill Required

After this scoring change is implemented, run the backfill endpoint again.

```http
POST /api/admin/candidates/recalculate-data-progress
```

Why?

Stored values currently use the old formula.

All existing candidates must be recalculated using the new 100-point scoring model.

---

# Validation / Testing Checklist

## Basic Information

- Candidate with only name should receive 0.5 points in Basic Information.
- Candidate with TotalExperienceYears = 0 should receive 1 point.
- Candidate with IsTopDeveloper (removed — see Email = 4 pts) = true should receive 2 points.
- PostingTitle, GitHubUrl, and Source should not affect score.

## Work Experience

- No work experience = 0 / 50.
- One work experience with job title only = 2 / 50.
- One work experience with tech stacks should receive 10 points for tech stacks.
- One work experience with at least one benefit should receive 7 points for benefits.
- One work experience with at least one time support zone should receive 1 point.
- One work experience project with ProjectId only should receive 3 points.
- One work experience project with Contribution only should receive 14 points.
- One work experience project with both ProjectId and Contribution should receive 17 points.
- Candidate with several incomplete experiences and one complete experience should use the complete/best one.

## Technical Skills

- No candidate tech stacks = 0 / 10.
- At least one candidate tech stack = 10 / 10.

## Independent Projects

- No independent projects = 0 / 10.
- ProjectId only = 3 / 10.
- Contribution only = 7 / 10.
- ProjectId + Contribution = 10 / 10.

## Education

- No education = 0 / 5.
- StartMonth only = 1 / 5.
- Grades only = 1 / 5.
- Topper true = 1 / 5.
- Cheetah true = 2 / 5.
- University, Degree, Major, and EndMonth should not affect score.

## Certifications

- No certifications = 0 / 10.
- CertificationId only = 1 / 10.
- Url only = 5 / 10.
- Level only = 2 / 10.
- Fully complete certification = 10 / 10.

## Achievements

- No achievements = 0 / 5.
- Name only = 1 / 5.
- Type only = 1 / 5.
- Ranking only = 1 / 5.
- Year only = 1 / 5.
- Url only = 1 / 5.
- Description should not affect score.

## Overall

- Sum of all section scores should never exceed 100.
- OverallPercentage should equal total score.
- Candidate list should show updated `dataProgressPercentage`.
- Candidate detail endpoint should show section score, maxScore, percentage, and missingFields.

---

# Final Implementation Summary

Implement the updated Candidate Data Progress model as an absolute 100-point scoring system.

Key scoring:

```text
Basic Information = 10
Work Experience = 50
Technical Skills = 10
Independent Projects = 10
Education = 5
Certifications = 10
Achievements = 5
```

Use best completed entry for dynamic sections:

```text
Work Experience
Independent Projects
Education
Certifications
Achievements
```

For Work Experience, use the best completed work experience and include:

```text
Job Title
Employer
Start Date
End Date
Tech Stacks
Shift Type
Work Mode
Time Support Zones
Benefits
Work Experience Projects
Work Experience Project Contribution
```

Use `TotalExperienceYears.HasValue`, so `0` counts as filled.

Use `IsTopDeveloper (removed — see Email = 4 pts) == true` for Top Developer points.

After implementation, run:

```http
POST /api/admin/candidates/recalculate-data-progress
```

to recalculate all existing candidates.
