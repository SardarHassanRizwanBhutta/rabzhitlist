# Candidate Data Mapping — Main App to Question Generation Service

**Status:** FE mapper synced with Basic/Preferences QG update (2026-07-29).
**Related:** [COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)

The frontend enriches linked employer data first, then projects a
**sparse** `CandidateDataForQuestionService` containing only missing allowlisted
properties. Entity IDs support enrichment but are not sent to Python. Missing
indexed API keys are listed in authoritative top-level `fields_to_generate`.
Candidate Education remains unchanged in the main app but is not sent to QG.

## Section mapping

| Python section | FE section | FE tab |
|---|---|---|
| `basic_information` | `basic` | Basic Information |
| `preferences` | `preferences` | Preferences |
| `work_experience` | `workExperience` | Work Experience |
| `independent_tech_stacks` | `techStacks` | Independent Tech Stacks |
| `certifications` | `certifications` | Certifications |
| `achievements` | `achievements` | Achievements |

Independent Projects have no QG section.

## Top-level projection

| Payload property | Candidate source | Response key | Section |
|---|---|---|---|
| `resume` | `hasResume === true` → `"attached"` else `null` | `resume` | `basic_information` |
| `linkedinUrl` | `candidate.linkedinUrl` | `linkedinUrl` | `basic_information` |
| `currentSalary` | `candidate.currentSalary` | `currentSalary` | `preferences` |
| `expectedSalary` | `candidate.expectedSalary` | `expectedSalary` | `preferences` |
| `techStacks` | `candidate.techStacks` | `techStacks` | `independent_tech_stacks` |
| `workExperiences` | enriched `candidate.workExperiences` | indexed keys | `work_experience` |
| `certifications` | `candidate.certifications` | indexed keys | `certifications` |
| `achievements` | `candidate.achievements` | indexed keys | `achievements` |

`cnic` and `personalityType` are not projected to QG.

## Work Experience projection

### Role Details

| Payload property | Response suffix |
|---|---|
| `jobTitle` | `jobTitle` |
| `startDate` | `startDate` |
| `shiftType` | `shiftType` |
| `workMode` | `workMode` |
| `techStacks` | `techStacks` |
| `timeSupportZones` | `timeSupportZones` |
| `benefits` | `benefits` |
| `projects` | Nested container only; no overview/add-more response key |

Response prefix: `work_experience_{i}_`.

Benefits remain `{ name, amount?, unit? }[]`. Role `endDate` is not allowlisted.
`employerName` is Employer Details only (not Role Details).

### Employer Details on the WE row

| Payload path | Response key/suffix |
|---|---|
| `employerName` | `work_experience_{i}_employerName` |
| `headcount` | `work_experience_{i}_headcount` |
| `types` | `work_experience_{i}_types` |
| `foundedYear` | `work_experience_{i}_foundedYear` |
| `salaryPolicy` | `work_experience_{i}_salaryPolicy` |
| `status` | `work_experience_{i}_status` |
| `linkedinUrl` | `work_experience_{i}_linkedinUrl` |
| `locations[j].country` | `work_experience_{i}_office_{j}_country` |
| `locations[j].city` | `work_experience_{i}_office_{j}_city` |
| `locations[j].address` | `work_experience_{i}_office_{j}_address` |
| `locations[j].isHeadquarters` | `work_experience_{i}_office_{j}_isHeadquarters` |
| `layoffs[j].layoffDate` | `work_experience_{i}_layoff_{j}_layoffDate` |
| `layoffs[j].affectedEmployees` | `work_experience_{i}_layoff_{j}_affectedEmployees` |
| `layoffs[j].reason` | `work_experience_{i}_layoff_{j}_reason` |

`headcount`, `types`, `foundedYear`, `salaryPolicy`, `status`, and employer
`linkedinUrl` are company-wide on the WE row (not office-prefixed). `awards`,
`ranking`, and `isDplCompetitor` are not sent to QG.

### Nested projects

Response prefix: `work_experience_{i}_project_{j}_`.
A Project property is sent to QG only when missing. When the parent WE has an
employer (`employerId` or non-empty `employerName`), omit project `employerName`
and `projectType` from `fields_to_generate` / generation.

| Payload property | Response suffix |
|---|---|
| `projectName` | `projectName` |
| `employerName` | `employerName` |
| `projectType` | `projectType` |
| `startDate` | `startDate` |
| `status` | `status` |
| `description` | `description` |
| `contributionNotes` | `contributionNotes` |
| `techStacks` | `techStacks` |
| `verticalDomains` | `verticalDomains` |
| `horizontalDomains` | `horizontalDomains` |
| `technicalDomains` | `technicalDomains` |
| `technicalAspects` | `technicalAspects` |
| `minTeamSize` | `minTeamSize` |
| `clientLocations` | `clientLocations` |
| `latestUpdate` | `latestUpdate` |
| `maxTeamSize` | `maxTeamSize` |
| `endDate` | `endDate` |

**Contribution exception:** always include in `fields_to_generate` even when
populated; omit populated value from sparse `candidate_data`. Python always
emits Advanced. Call Notes: Advanced question only (no value card).

Do not send or emit `downloadCount`, `publishPlatforms`,
`projectLink` / `link`, single `teamSize`, or `isPublished` for Cold Caller QG.

## Education exclusion

The frontend does not include `candidate.educations` in
`CandidateDataForQuestionService`, does not emit `candidate_data.educations`, and
does not add any `education_*` key to `fields_to_generate`. Candidate Education
types, Candidate API mapping, profile UI, and non-Cold-Caller features remain
unchanged.

## Certification projection

| Payload property | Response key | Weight |
|---|---|---:|
| `certificationName` | `certification_{i}_name` | 35 |
| `issuingBody` | `certification_{i}_issuingBody` | 30 |
| `issueDate` | `certification_{i}_issueDate` | 20 |
| `expiryDate` | `certification_{i}_expiryDate` | 15 |

`issuingBody` falls back to `certificationIssuerName` before projection. Dates are
ISO-8601 strings when present. There is no `certifications` opener. Display order
follows weight descending (Name → Issuing Body → Issue Date → Expiry Date); all
four fields are `basic`.

## Achievement projection

| Payload property | Response key |
|---|---|
| `name` | `achievement_{i}_name` |
| `year` | `achievement_{i}_year` |
| `description` | `achievement_{i}_description` |
| `achievementType` | `achievement_{i}_achievementType` |
| `ranking` | `achievement_{i}_ranking` |
| `url` | `achievement_{i}_url` |

There is no `achievements` opener. The frontend preserves the display order
`name → year → description → achievementType → ranking → url` for both value
cards and generated questions.

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

- `cnic` and `personalityType` (not QG allowlisted; may still appear in Cold
  Caller Fields empty-field detection);
- legacy `competitions`;
- all basic fields except Resume and LinkedIn URL;
- WE dates and non-allowlisted employer catalog properties;
- project `isPublished`;
- all Education data and `education_*` fields;
- all certification fields except Certification Name, Issuing Body, Issue Date,
  and Expiry Date;
- IDs and removed legacy keys (`isTopDeveloper`, tags, min/max employees, layoff
  source, project `notes`, top-level projects).
