# Candidate Data Mapping — Main App to Question Generation Service

**Status:** FE mapper synced to missing-only Cold Caller allowlist (2026-07-22).
**Related:** [COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)

The frontend enriches linked employer and university data first, then projects a
**sparse** `CandidateDataForQuestionService` containing only missing allowlisted
properties. Entity IDs support enrichment but are not sent to Python. Missing
indexed API keys are listed in authoritative top-level `fields_to_generate`.

## Section mapping

| Python section | FE section | FE tab |
|---|---|---|
| `basic_information` | `basic` | Basic Information |
| `work_experience` | `workExperience` | Work Experience |
| `independent_tech_stacks` | `techStacks` | Independent Tech Stacks |
| `education` | `education` | Education |
| `certifications` | `certifications` | Certifications |
| frontend-only | `preferences` | Preferences |

Achievements and Independent Projects have no QG section.

## Top-level projection

| Payload property | Candidate source | Response key |
|---|---|---|
| `cnic` | `candidate.cnic` | `cnic` |
| `personalityType` | `candidate.personalityType` | `personalityType` |
| `currentSalary` | `candidate.currentSalary` | `currentSalary` |
| `expectedSalary` | `candidate.expectedSalary` | `expectedSalary` |
| `techStacks` | `candidate.techStacks` | `techStacks` |
| `workExperiences` | enriched `candidate.workExperiences` | indexed keys |
| `educations` | enriched `candidate.educations` | indexed keys |
| `certifications` | `candidate.certifications` | indexed keys |

Current and Expected Salary are returned under `basic_information`; FE moves their
questions and missing keys to the Preferences tab.

## Work Experience projection

### Role and shared employer fields

| Payload property | Response suffix |
|---|---|
| `employerName` | `employerName` |
| `jobTitle` | `jobTitle` |
| `shiftType` | `shiftType` |
| `timeSupportZones` | `timeSupportZones` |
| `workMode` | `workMode` |
| `techStacks` | `techStacks` |
| `benefits` | `benefits` |
| `projects` | Nested container only; no overview/add-more response key |

Response prefix: `work_experience_{i}_`.

Benefits remain `{ name, amount?, unit? }[]`. `employerName` and `benefits` are
shared role/employer facts and generate one question each per row.

### Employer catalog facts on the WE row

| Payload path | Response key/suffix |
|---|---|
| `status` | `work_experience_{i}_status` |
| `headcount` | `work_experience_{i}_headcount` |
| `salaryPolicy` | `work_experience_{i}_salaryPolicy` |
| `locations[j].country` | `work_experience_{i}_office_{j}_country` |
| `locations[j].city` | `work_experience_{i}_office_{j}_city` |
| `locations[j].address` | `work_experience_{i}_office_{j}_address` |
| `layoffs[j].layoffDate` | `work_experience_{i}_layoff_{j}_layoffDate` |
| `layoffs[j].affectedEmployees` | `work_experience_{i}_layoff_{j}_affectedEmployees` |
| `layoffs[j].reason` | `work_experience_{i}_layoff_{j}_reason` |
| `awards` | `work_experience_{i}_awards` |

`headcount` and `salaryPolicy` are company-wide employer fields on the WE row
(same as Employer dialog Basic Information). They are not office properties and
must not use an `office_{j}_` prefix. FE renders them in the Employer accordion
above Office groups. `ranking` and `isDplCompetitor` are not sent to QG.

### Nested projects

Response prefix: `work_experience_{i}_project_{j}_`.
The table defines the schema and stable FE display order. A Project property is
sent to QG only when missing; populated values stay in Candidate API state for
rendering in the existing question-card design. The corresponding missing
response keys are listed in top-level `fields_to_generate`.

| Payload property | Response suffix |
|---|---|
| `projectName` | `projectName` |
| `contributionNotes` | `contributionNotes` |
| `employerName` | `employerName` |
| `downloadCount` | `downloadCount` |
| `publishPlatforms` | `publishPlatforms` |
| `projectType` | `projectType` |
| `status` | `status` |
| `teamSize` | `teamSize` |
| `techStacks` | `techStacks` |
| `technicalAspects` | `technicalAspects` |
| `technicalDomains` | `technicalDomains` |
| `horizontalDomains` | `horizontalDomains` |
| `verticalDomains` | `verticalDomains` |
| `description` | `description` |
| `latestUpdate` | `latestUpdate` |
| `startDate` | `startDate` |
| `endDate` | `endDate` |
| `link` | `projectLink` |

Do not send or emit `isPublished`, `minTeamSize`, or `maxTeamSize`.

## Education projection

| Payload property | Response key |
|---|---|
| `universityName` | `education_{i}_universityName` |
| `isTopper` | `education_{i}_isTopper` |

`universityName` may resolve from `universityName` or legacy
`universityLocationName` before projection. All other education and university
catalog properties are omitted. There is no `educations` opener.

## Certification projection

| Payload property | Response key |
|---|---|
| `certificationName` | `certification_{i}_name` |
| `issueDate` | `certification_{i}_issueDate` |
| `expiryDate` | `certification_{i}_expiryDate` |
| `issuingBody` | `certification_{i}_issuingBody` |

`issuingBody` falls back to `certificationIssuerName` before projection. Dates are
ISO-8601 strings when present. There is no `certifications` opener.

## Prompt metadata

Every mapped allowlisted field is missing-only:

- missing value: listed in `fields_to_generate`, returned as
  `prompt_type: "basic"` or `"advanced"` and present in `missing_fields`;
- populated value: omitted from the QG payload and not questioned; FE renders the
  Candidate API value in the same numbered, weighted, copy-enabled card design.

Python must never emit enrichment prompts or `existing_values` for these fields.

Empty top-level collections and empty nested `projects` / `locations` / `layoffs`
still use synthetic index `0` missing allowlisted fields.

## Explicitly excluded

- `achievements` and legacy `competitions`;
- all basic fields except CNIC, Personality Type, Current Salary, Expected Salary;
- WE dates and non-allowlisted employer catalog properties;
- project `isPublished`;
- all education fields except University Name and Topper;
- all certification fields except Certification Name, Issue Date, Expiry Date, and
  Issuing Body;
- IDs and removed legacy keys (`isTopDeveloper`, tags, min/max employees, layoff
  source, project `notes`, top-level projects).
