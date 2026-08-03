# `candidate_data` sent to the Question Service

This is the frontend payload posted to
`POST /api/generate-questions` on the Python QG service.

## Request envelope

```json
{
  "candidate_id": "<candidate.id>",
  "candidate_data": {
    "resume": null,
    "linkedinUrl": null,
    "currentSalary": null,
    "expectedSalary": null,
    "techStacks": [],
    "workExperiences": [],
    "certifications": [],
    "achievements": []
  },
  "fields_to_generate": [],
  "conversation_context": "cold_call"
}
```

The frontend does not send `missing_fields`.

## Frontend pipeline

1. Load the main-app `Candidate`.
2. Enrich Work Experience rows with linked employer data.
3. Project the enriched object through
   `mapMainAppCandidateToQuestionService()`.
4. Build the sparse missing-only payload and authoritative `fields_to_generate`
   for **all** allowlisted sections (`buildMissingOnlyQuestionRequest`).
5. Post the sparse payload plus `fields_to_generate`.

Employer IDs are used during enrichment but omitted from the QG payload.
Candidate Education is not projected or sent.

Empty top-level collections and empty nested `projects` / `locations` / `layoffs`
still emit synthetic index `0` missing keys.

## Type shape

```ts
interface CandidateDataForQuestionService {
  resume?: string | null
  linkedinUrl?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  techStacks?: string[]
  workExperiences?: WorkExperienceForService[]
  certifications?: CertificationForService[]
  achievements?: AchievementForService[]
}

interface WorkExperienceForService {
  employerName?: string | null
  jobTitle?: string | null
  startDate?: string | null
  shiftType?: string | null
  timeSupportZones?: string[]
  workMode?: string | null
  techStacks?: string[]
  benefits?: BenefitForService[]
  projects?: WorkExperienceProjectForService[]
  status?: string | null
  locations?: WorkExperienceOfficeForService[]
  headcount?: number | null
  types?: string[]
  foundedYear?: number | null
  linkedinUrl?: string | null
  salaryPolicy?: string | null
  layoffs?: WorkExperienceLayoffForService[]
}

interface WorkExperienceProjectForService {
  projectName?: string | null
  employerName?: string | null
  projectType?: string | null
  status?: string | null
  averageTeamSize?: number | null
  techStacks?: string[]
  technicalAspects?: string[]
  technicalDomains?: string[]
  horizontalDomains?: string[]
  verticalDomains?: string[]
  description?: string | null
  contributionNotes?: string | null
  latestUpdate?: string | null
  startDate?: string | null
  endDate?: string | null
  clientLocations?: string[]
}

interface WorkExperienceOfficeForService {
  country?: string | null
  city?: string | null
  address?: string | null
  isHeadquarters?: boolean | null
}

interface WorkExperienceLayoffForService {
  layoffDate?: string | null
  affectedEmployees?: number | null
  reason?: string | null
}

interface CertificationForService {
  certificationName?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  issuingBody?: string | null
}

interface AchievementForService {
  name?: string | null
  year?: number | null
  description?: string | null
  achievementType?: string | null
  ranking?: string | null
  url?: string | null
}
```

## Mapping conventions

- String values are trimmed; blank values become `null`.
- Missing arrays become `[]` when that property is included because it is missing.
- Dates become ISO-8601 strings.
- Project QG uses `averageTeamSize` / `clientLocations` (not `minTeamSize` /
  `maxTeamSize`, single `teamSize`, `link` / `projectLink`, download, or publish
  platforms).
- When WE has an employer, omit project `employerName` / `projectType` from sparse
  request generation.
- **All** allowlisted sections are sparse missing-only: populated properties are
  omitted from `candidate_data`; their values remain in FE for value cards.
- Missing list-typed properties are sent as `[]` (never `null`): `techStacks`,
  `timeSupportZones`, `benefits`, `types`, `clientLocations`,
  `technicalAspects`, `technicalDomains`, `horizontalDomains`, `verticalDomains`.
- `fields_to_generate` lists exactly every missing allowlisted API key across all
  sections. It is authoritative for generation.
- Certification payload `certificationName` maps to response suffix `name`.
- Achievement payload `achievementType` maps directly to response suffix
  `achievementType` (never legacy `_type`).
- `resume` is `"attached"` when `candidate.hasResume === true`; otherwise missing.
- Candidate Education, university IDs, and `education_*` keys are never included.
- `cnic` and `personalityType` are never included in the QG payload.
- Legacy `candidate_data.educations`, `educations`, or `education_*` generation
  keys are rejected by QG with HTTP `422`.
- Employer IDs are never included.

## Full example (sparse missing-only)

Populated top-level / role / certification properties are omitted.
Only missing properties appear in `candidate_data`, and every corresponding API
key is listed in `fields_to_generate`. Empty nested `layoffs` still gets a
synthetic index `0` row of missing fields.

```json
{
  "candidate_id": "42",
  "candidate_data": {
    "workExperiences": [
      {
        "layoffs": [
          {
            "layoffDate": null,
            "affectedEmployees": null,
            "reason": null
          }
        ],
        "projects": [
          {
            "latestUpdate": null,
            "endDate": null,
            "publishPlatforms": []
          }
        ]
      }
    ]
  },
  "fields_to_generate": [
    "work_experience_0_layoff_0_layoffDate",
    "work_experience_0_layoff_0_affectedEmployees",
    "work_experience_0_layoff_0_reason",
    "work_experience_0_project_0_latestUpdate",
    "work_experience_0_project_0_endDate",
    "work_experience_0_project_0_publishPlatforms"
  ],
  "conversation_context": "cold_call"
}
```

The payload never includes Education or any field outside this schema.
