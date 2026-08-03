# Cold Caller QG Field Allowlist Contract

**Status:** Basic Information + Preferences QG contract updated (2026-07-29).
**Scope:** `POST /api/generate-questions` (`:8002`) used by Cold Caller.  
**Replaces:** Always-ask / enrichment prompts for allowlisted fields.

---

## 1. Sections and tabs

Python returns exactly six sections, in this order:

1. `basic_information`
2. `preferences`
3. `work_experience`
4. `independent_tech_stacks`
5. `certifications`
6. `achievements`

`education` is removed. Python must not emit it. The FE runtime allowlist
discards it if an older service returns it. `cnic` and `personalityType` are
no longer QG allowlisted keys; if present in the request, Python **ignores /
drops** them (does **not** HTTP `422`). Education request data still HTTP `422`.

Cold Caller Call Notes displays five tabs (Independent Tech Stacks stays
hidden). Preferences is a **real Python section** (not FE-partitioned from
Basic):

1. Basic Information — `resume`, `linkedinUrl`
2. Work Experience
3. Certifications
4. Achievements
5. Preferences — `currentSalary`, `expectedSalary`
---

## 2. Prompt behavior (missing-only with Contribution exception)

Every allowlisted field is **missing-only**, except WE nested Project
**Contribution** (`contributionNotes`):

- Empty value: include the indexed API key in authoritative top-level
  `fields_to_generate`, keep a sparse `null`/`[]` property in `candidate_data`,
  and return a question with `prompt_type: "basic"` or `"advanced"` plus the key
  in `missing_fields`.
- Populated value (all fields except Contribution): **omit** the property from
  `candidate_data`, **do not** list it in `fields_to_generate`, and **do not**
  generate any question (no enrichment).
- **Contribution exception:** FE always includes
  `work_experience_{i}_project_{j}_contributionNotes` in `fields_to_generate`
  even when populated. Populated Contribution is still **omitted** from sparse
  `candidate_data`. Python always emits `prompt_type: "advanced"` for that key.
  Call Notes shows the Advanced question only (no populated value card).
  Session-only Add project local ask cues are unchanged until Generate Questions.
- FE renders other populated values from Candidate API data using the same
  question-card chrome (muted uppercase label, bold value, continuous numbering,
  locked weight badge, copy copies the API value).
- Do not return `existing_values`.
- Questions sort by server-assigned `priority` descending, then field key.
- Within a Work Experience, FE sorts Role / Employer / Project collapsibles by the
  highest priority of contained missing questions and populated value cards.

### Question types (`prompt_type`)

Python owns the field → type map. FE does not send `prompt_type`.

| `prompt_type` | Meaning |
|---|---|
| `basic` | Recruiter cue `Ask about {label}` (plain) or `Ask about {label} (Display1, Display2, …)` when the field is Basic+enum. Template-only; no LLM. |
| `advanced` | Candidate-facing in-depth question. LLM only. Advanced+enum must include every human display label in the question text. Advanced+open must not invent option lists. |
| `enrichment` | Compatibility only; QG must never emit it. FE drops it if present. |

Unclassified allowlisted keys (not in the Basic/Advanced map) are dropped and do
not generate questions.

`fields_to_generate` is authoritative for **all** sections. Python generates only
listed keys and must never infer omitted populated properties as missing.

### Collection openers removed

Do not generate:

- `work_experiences`
- `work_experience_{i}_projects`
- `certifications`
- `achievements`

### Synthetic index `0` (FE-owned)

When a top-level collection is empty, **FE** emits synthetic index `0` missing
allowlisted keys in `fields_to_generate`:

- empty `workExperiences` → `work_experience_0_*`
- empty `certifications` → `certification_0_*`
- empty `achievements` → `achievement_0_*`

When a nested array on a real or synthetic Work Experience row is empty, **FE**
also emits synthetic index `0`:

- empty `projects` → `work_experience_{i}_project_0_*`
- empty `locations` → `work_experience_{i}_office_0_*`
- empty `layoffs` → `work_experience_{i}_layoff_0_*`

Python **does not invent** synthetic keys — generate only keys present in
`fields_to_generate`.

FE does not show an Overview item in entry navigation. It selects the first indexed
entry by default. Within a Work Experience, Role Details, Employer Details, and
every individual Project are separate single-open collapsible sections.

---

## 3. Request payload allowlist

FE enriches linked employer data first, then projects a **sparse**
payload containing only missing allowlisted properties plus structural arrays for
indexing. Employer catalog IDs are used during enrichment but are not sent to
Python. The request omits `candidate_data.educations` entirely.

```json
{
  "candidate_id": "123",
  "candidate_data": {},
  "fields_to_generate": [
    "resume",
    "linkedinUrl",
    "currentSalary",
    "work_experience_0_jobTitle",
    "work_experience_0_project_0_description"
  ],
  "conversation_context": "cold_call"
}
```

### Basic Information

```text
resume
linkedinUrl
```

`resume` is `"attached"` when the Candidate has a resume (`hasResume === true`);
missing when `null` / empty. Populated resume shows an FE value card and is not
questioned.

### Preferences

```text
currentSalary
expectedSalary
```

### Independent Tech Stacks

```text
techStacks
```
### Work Experience rows

**Role Details** (totals 100):

```text
jobTitle
startDate
shiftType
workMode
techStacks
timeSupportZones
benefits
```

**Employer Details** (totals 100; office/layoff nested):

```text
employerName
headcount
types
foundedYear
salaryPolicy
status
linkedinUrl
locations[].country
locations[].city
locations[].address
locations[].isHeadquarters
layoffs[].layoffDate
layoffs[].affectedEmployees
layoffs[].reason
```

`headcount`, `salaryPolicy`, `types`, `foundedYear`, and employer `linkedinUrl`
are company-wide (not per-office). `awards`, `ranking`, and `isDplCompetitor`
are not on the Cold Caller allowlist. Role `endDate` is not allowlisted.
Shift Type / Work Mode / Time Support Zones / Benefits live under **Role Details
only** (not Employer Details).

### Nested projects

Include a property only when missing. Project Employer (`employerName`) and
Project Type (`projectType`) are omitted from generation and UI when the parent
WE already has an employer (`employerId` set or non-empty `employerName`).

```text
projectName
employerName
projectType
startDate
status
description
contributionNotes
techStacks
verticalDomains
horizontalDomains
technicalDomains
technicalAspects
averageTeamSize
clientLocations
latestUpdate
endDate
```

Do **not** allowlist `downloadCount`, `publishPlatforms`, `projectLink`, or
single `teamSize`.

### Certification rows

```text
certificationName
issuingBody
issueDate
expiryDate
```

Payload `certificationName` maps to response suffix `name`. All four fields are
`prompt_type: "basic"`.

### Achievement rows

```text
name
year
description
achievementType
ranking
url
```

Payload `achievementType` maps directly to response suffix `achievementType`.
Python must not emit the legacy `_type` suffix.

---

## 4. Allowed response field keys and weights

### Basic Information

Section weightage totals **100**. Display/sort by weight descending. Both fields
use `prompt_type: "basic"`:

1. `resume` (80)
2. `linkedinUrl` (20)

| Field | Weight | Prompt |
|---|---:|---|
| `resume` | 80 | basic |
| `linkedinUrl` | 20 | basic |

### Preferences

Preferences has only Current/Expected Salary. Section weightage totals **100**.
Display/sort by weight descending. Both fields use `prompt_type: "basic"`:

1. `currentSalary` (85)
2. `expectedSalary` (15)

| Field | Weight | Prompt |
|---|---:|---|
| `currentSalary` | 85 | basic |
| `expectedSalary` | 15 | basic |

Cold Caller UI label for `expectedSalary` is **Expected Salary - Net** (API key
unchanged; profile Create/Edit / CandidateDetailsModal unchanged).

### Work Experience Role Details

Section weightage totals **100**. Display/sort by weight descending:

| Suffix | Weight | Prompt |
|---|---:|---|
| `jobTitle` | 19 | basic |
| `startDate` | 17 | basic |
| `shiftType` | 16 | basic (enum) |
| `workMode` | 14 | basic (enum) |
| `techStacks` | 13 | advanced |
| `timeSupportZones` | 11 | basic (open) |
| `benefits` | 10 | basic |

### Work Experience Employer Details

Section weightage totals **100** (scalars + per office/layoff row). Display/sort
by weight descending. Empty `locations` / `layoffs` use synthetic index `0`.

| Suffix / key | Weight | Prompt |
|---|---:|---|
| `employerName` | 18 | basic |
| `office_{j}_country` | 14 | basic |
| `office_{j}_city` | 12.5 | basic |
| `headcount` | 11.5 | basic |
| `types` | 10.5 | advanced (enum) |
| `foundedYear` | 8.5 | basic |
| `salaryPolicy` | 7.5 | advanced (enum) |
| `status` | 6 | advanced (enum) |
| `linkedinUrl` | 5 | basic |
| `office_{j}_address` | 2.5 | basic |
| `office_{j}_isHeadquarters` | 1.5 | basic |
| `layoff_{j}_layoffDate` | 1 | basic |
| `layoff_{j}_affectedEmployees` | 0.8 | basic |
| `layoff_{j}_reason` | 0.7 | basic |

API keys: `work_experience_{i}_headcount` remains an employer-row suffix (never
`work_experience_{i}_office_{j}_headcount`). Drop `awards` from QG.

### Nested Project Details

Section weightage totals **100**. Display/sort by weight descending. When the
parent WE has an employer, omit `employerName` and `projectType`.

| Suffix | Weight | Prompt |
|---|---:|---|
| `projectName` | 15.98 | basic |
| `employerName` | 12.69 | basic |
| `projectType` | 10.34 | advanced (enum) |
| `startDate` | 8.46 | basic |
| `status` | 7.05 | basic (enum) |
| `description` | 6.11 | advanced |
| `contributionNotes` | 6 | advanced |
| `techStacks` | 5.45 | advanced |
| `verticalDomains` | 4.89 | advanced (enum) |
| `averageTeamSize` | 4.89 | basic |
| `horizontalDomains` | 4.42 | advanced (enum) |
| `technicalDomains` | 3.95 | advanced (enum) |
| `technicalAspects` | 3.57 | advanced (enum) |
| `clientLocations` | 2.82 | basic |
| `latestUpdate` | 2.35 | basic |
| `endDate` | 1.03 | basic |

`contributionNotes` is always listed in `fields_to_generate` (even when
populated). Python always returns an Advanced question for that key. Call Notes
hides the populated value card and shows the Advanced question only.
Session-only local ask cues apply only before Generate Questions.

Weight `0` still generates a question when missing and sorts last.

### Independent Tech Stacks

| Field | Weight |
|---|---:|
| `techStacks` | 5 |

### Certifications

Section weightage totals **100**. All four fields use `prompt_type: "basic"`.
FE and Python display/sort by weight descending (highest first). Issuing Body
is a main-list field (no catalog accordion):

1. `name` (35)
2. `issuingBody` (30)
3. `issueDate` (20)
4. `expiryDate` (15)

| Response suffix | Payload property | Weight | Prompt |
|---|---|---:|---|
| `name` | `certificationName` | 35 | basic |
| `issuingBody` | `issuingBody` | 30 | basic |
| `issueDate` | `issueDate` | 20 | basic |
| `expiryDate` | `expiryDate` | 15 | basic |

### Achievements

Section weightage totals **100**. FE and Python display/sort by weight
descending (highest first):

1. `name` (20)
2. `year` (18)
3. `description` (17)
4. `achievementType` (16)
5. `ranking` (15)
6. `url` (14)

| Response suffix | Payload property | Weight |
|---|---|---:|
| `name` | `name` | 20 |
| `year` | `year` | 18 |
| `description` | `description` | 17 |
| `achievementType` | `achievementType` | 16 |
| `ranking` | `ranking` | 15 |
| `url` | `url` | 14 |

---

## 5. Forbidden response data

Python must not return:

- section `education`;
- any collection opener (`work_experiences`, `work_experience_{i}_projects`,
  `certifications`);
- any enrichment prompt (`prompt_type: "enrichment"`) for allowlisted fields;
- `existing_values`;
- any key not listed in `fields_to_generate` for that request;
- any non-allowlisted Basic Information key (`cnic`, `personalityType`, etc.);
- salaries returned under `basic_information` (they belong in `preferences`);
- WE role `endDate`, `awards`, or other non-allowlisted employer/role fields;
- project `downloadCount`, `publishPlatforms`, `projectLink`,
  single `teamSize`, `isPublished`, or other non-allowlisted project fields;
- any `education_*` field, and any non-allowlisted certification/achievement
  field;
- legacy `achievement_*_type` as a **response** suffix (inbound legacy keys are
  migrated to `achievementType`; `achievementType` wins if both present);
- legacy removed keys (`isTopDeveloper`, min/max employees, tags, layoff source,
  project `notes`, `independent_projects`).

FE applies the same allowlist defensively to `missing_fields` and `questions`, and
drops any `prompt_type: "enrichment"` questions.

---

## 6. Python checklist

- [ ] Accept required `fields_to_generate: list[str]` as authoritative for **all**
  sections; generate only listed keys.
- [ ] Never infer omitted populated properties as missing.
- [ ] Remove enrichment prompt generation entirely for Cold Caller allowlisted
  fields; emit `prompt_type` `"basic"` or `"advanced"` only (`enrichment` never).
- [ ] Template Basic fields; LLM Advanced fields only; Basic+enum lists every
  display label in `Ask about {label} (…)` form.
- [ ] Drop `ranking` / `isDplCompetitor`; allowlist `technicalDomains`.
- [ ] Remove `existing_values` from response models, serialization, examples, and
  tests.
- [ ] Remove Education from every QG mode/consumer: request models, section enums,
  generation dispatch, prompt maps/templates, weights, response models, serializers,
  examples, and tests.
- [ ] Reject `candidate_data.educations`, `educations`, and `education_*`
  generation keys with HTTP `422`; never return an `education` section.
- [ ] Remove collection openers: `work_experiences`,
  `work_experience_{i}_projects`, `certifications`.
- [ ] Support synthetic index `0` keys **when FE lists them** in
  `fields_to_generate` (Python does not invent synthetics).
- [ ] Apply the weights in §4 by full field context.
- [ ] Never emit forbidden fields from §5.
- [ ] Return exactly six API sections in locked order (including `preferences`).
- [ ] Basic allowlist is only `resume` + `linkedinUrl` (weights 80 / 20, both basic).
- [ ] Preferences allowlist is only `currentSalary` + `expectedSalary`
  (weights 85 / 15, both basic); do not keep salaries under `basic_information`.
- [ ] Ignore/drop `cnic` / `personalityType` if sent (do not 422); never emit them
  as QG fields.
- [ ] `timeSupportZones` is `basic` (open) — no enum label list in question text.
- [ ] Do not implement `options[]` / LONG_ENUM contract this round.
- [ ] Update tests for empty, partially populated, and fully populated payloads
  (fully populated → zero questions / empty `missing_fields` for that section).

---

## 7. Python agent prompt

```text
Implement the Cold Caller QG allowlist exactly as specified in
docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md.

Return six sections only, in this order:
`basic_information`, `preferences`, `work_experience`,
`independent_tech_stacks`, `certifications`, `achievements`. Keep Education
removed from every QG consumer/mode. Do not accept or emit
`candidate_data.educations`, `education_*`, or an `education` section.
Reject legacy Education request data/keys with HTTP 422.

Basic Information allowlists only `resume` (80) and `linkedinUrl` (20), both
`prompt_type: "basic"`. Preferences is a real section with only
`currentSalary` (35) and `expectedSalary` (25), both basic. Do not keep
salaries under `basic_information`. Do not accept or emit `cnic` /
`personalityType` as QG fields.

Treat required `fields_to_generate` as authoritative for every allowlisted key
across all sections: generate missing prompts only for those exact keys; never
infer omitted properties as missing; never generate enrichment prompts; do not
return `existing_values`. Remove collection openers
(`work_experiences`, `work_experience_{i}_projects`, `certifications`,
`achievements`). Support synthetic index 0 for remaining empty top-level
collections and empty nested projects/locations/layoffs as sent by FE. Apply
the context-specific weights in the contract and never emit forbidden keys.
```
