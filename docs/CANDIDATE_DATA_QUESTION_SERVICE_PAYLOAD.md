# `candidate_data` sent to the Question Service

This is the frontend payload posted to
`POST /api/generate-questions` on the Python QG service.

## Request envelope

```json
{
  "candidate_id": "<candidate.id>",
  "candidate_data": {
    "cnic": null,
    "personalityType": null,
    "currentSalary": null,
    "expectedSalary": null,
    "techStacks": [],
    "workExperiences": [],
    "educations": [],
    "certifications": []
  },
  "fields_to_generate": [],
  "conversation_context": "cold_call"
}
```

The frontend does not send `missing_fields`.

## Frontend pipeline

1. Load the main-app `Candidate`.
2. Enrich Education rows with linked university data.
3. Enrich Work Experience rows with linked employer data.
4. Project the enriched object through
   `mapMainAppCandidateToQuestionService()`.
5. Build the sparse missing-only payload and authoritative `fields_to_generate`
   for **all** allowlisted sections (`buildMissingOnlyQuestionRequest`).
6. Post the sparse payload plus `fields_to_generate`.

IDs are used in steps 2–3 but omitted from step 4.

Empty top-level collections and empty nested `projects` / `locations` / `layoffs`
still emit synthetic index `0` missing keys.

## Type shape

```ts
interface CandidateDataForQuestionService {
  cnic?: string | null
  personalityType?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  techStacks?: string[]
  workExperiences?: WorkExperienceForService[]
  educations?: EducationForService[]
  certifications?: CertificationForService[]
}

interface WorkExperienceForService {
  employerName?: string | null
  jobTitle?: string | null
  shiftType?: string | null
  timeSupportZones?: string[]
  workMode?: string | null
  techStacks?: string[]
  benefits?: BenefitForService[]
  projects?: WorkExperienceProjectForService[]
  status?: string | null
  locations?: WorkExperienceOfficeForService[]
  headcount?: number | null
  salaryPolicy?: string | null
  layoffs?: WorkExperienceLayoffForService[]
  awards?: string[]
}

interface WorkExperienceProjectForService {
  projectName?: string | null
  contributionNotes?: string | null
  employerName?: string | null
  downloadCount?: number | null
  publishPlatforms?: string[]
  projectType?: string | null
  status?: string | null
  teamSize?: string | number | null
  techStacks?: string[]
  technicalAspects?: string[]
  technicalDomains?: string[]
  horizontalDomains?: string[]
  verticalDomains?: string[]
  description?: string | null
  latestUpdate?: string | null
  startDate?: string | null
  endDate?: string | null
  link?: string | null
}

interface WorkExperienceOfficeForService {
  country?: string | null
  city?: string | null
  address?: string | null
}

interface WorkExperienceLayoffForService {
  layoffDate?: string | null
  affectedEmployees?: number | null
  reason?: string | null
}

interface EducationForService {
  universityName?: string | null
  isTopper?: boolean | null
}

interface CertificationForService {
  certificationName?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  issuingBody?: string | null
}
```

## Mapping conventions

- String values are trimmed; blank values become `null`.
- Missing arrays become `[]` when that property is included because it is missing.
- Dates become ISO-8601 strings.
- Project `teamSize` may be derived from existing single/min/max app values, but
  only a missing normalized `teamSize` property is sent.
- Project payload `link` maps to response suffix `projectLink`.
- **All** allowlisted sections are sparse missing-only: populated properties are
  omitted from `candidate_data`; their values remain in FE for value cards.
- Missing list-typed properties are sent as `[]` (never `null`): `techStacks`,
  `timeSupportZones`, `benefits`, `awards`, `publishPlatforms`,
  `technicalAspects`, `technicalDomains`, `horizontalDomains`, `verticalDomains`.
- `fields_to_generate` lists exactly every missing allowlisted API key across all
  sections (not Projects only). It is authoritative for generation.
- Certification payload `certificationName` maps to response suffix `name`.
- University and employer IDs are never included.

## Full example (sparse missing-only)

Populated top-level / role / education / certification properties are omitted.
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

The payload never includes Achievements or any field outside this schema.
