# Cold Caller QG Field Allowlist Contract

**Status:** Locked for FE implementation and Python QG handoff (2026-07-22).  
**Scope:** `POST /api/generate-questions` (`:8002`) used by Cold Caller.  
**Replaces:** Always-ask / enrichment prompts for allowlisted fields.

---

## 1. Sections and tabs

Python returns exactly five sections, in this order:

1. `basic_information`
2. `work_experience`
3. `independent_tech_stacks`
4. `education`
5. `certifications`

`achievements` is removed. Python must not emit it and FE must ignore it if an older
service returns it.

FE displays six tabs because `currentSalary` and `expectedSalary` are moved from
`basic_information` into the frontend-only **Preferences** tab:

1. Basic Information
2. Work Experience
3. Independent Tech Stacks
4. Education
5. Certifications
6. Preferences

---

## 2. Prompt behavior (missing-only everywhere)

Every allowlisted field is **missing-only**:

- Empty value: include the indexed API key in authoritative top-level
  `fields_to_generate`, keep a sparse `null`/`[]` property in `candidate_data`,
  and return a question with `prompt_type: "basic"` or `"advanced"` plus the key
  in `missing_fields`.
- Populated value: **omit** the property from `candidate_data`, **do not** list it
  in `fields_to_generate`, and **do not** generate any question (no enrichment).
- FE renders populated values from Candidate API data using the same question-card
  chrome (muted uppercase label, bold value, continuous numbering, locked weight
  badge, copy copies the API value).
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
- `educations`
- `certifications`

### Synthetic index `0` (Option B + B1)

When a top-level collection is empty, still emit synthetic index `0` missing
allowlisted fields:

- empty `workExperiences` → `work_experience_0_*`
- empty `educations` → `education_0_*`
- empty `certifications` → `certification_0_*`

When a nested array on a real or synthetic Work Experience row is empty, also emit
synthetic index `0`:

- empty `projects` → `work_experience_{i}_project_0_*`
- empty `locations` → `work_experience_{i}_office_0_*`
- empty `layoffs` → `work_experience_{i}_layoff_0_*`

FE does not show an Overview item in entry navigation. It selects the first indexed
entry by default. Within a Work Experience, Role Details, Employer Details, and
every individual Project are separate single-open collapsible sections.

---

## 3. Request payload allowlist

FE enriches linked employer/university data first, then projects a **sparse**
payload containing only missing allowlisted properties plus structural arrays for
indexing. Catalog IDs are used during enrichment but are not sent to Python.

```json
{
  "candidate_id": "123",
  "candidate_data": {},
  "fields_to_generate": [
    "cnic",
    "work_experience_0_jobTitle",
    "work_experience_0_project_0_description",
    "education_0_universityName"
  ],
  "conversation_context": "cold_call"
}
```

### Basic Information

```text
cnic
personalityType
currentSalary
expectedSalary
```

### Independent Tech Stacks

```text
techStacks
```

### Work Experience rows

```text
employerName
jobTitle
shiftType
timeSupportZones
workMode
techStacks
benefits

# Employer catalog facts on this WE row
status
headcount
salaryPolicy
locations[].country
locations[].city
locations[].address
layoffs[].layoffDate
layoffs[].affectedEmployees
layoffs[].reason
awards
```

`employerName` and `benefits` are shared role/employer fields and generate one
question each per WE row when missing. `headcount` and `salaryPolicy` are
company-wide (not per-office). `ranking` and `isDplCompetitor` are not on the
Cold Caller allowlist.

### Nested projects

Include a property only when missing. Payload `link` maps to response suffix
`projectLink`.

```text
projectName
contributionNotes
employerName
downloadCount
publishPlatforms
projectType
status
teamSize
techStacks
technicalAspects
technicalDomains
horizontalDomains
verticalDomains
description
latestUpdate
startDate
endDate
link
```

### Education rows

```text
universityName
isTopper
```

### Certification rows

```text
certificationName
issueDate
expiryDate
issuingBody
```

Payload `certificationName` maps to response suffix `name`.

---

## 4. Allowed response field keys and weights

### Basic Information

| Field | Weight |
|---|---:|
| `cnic` | 0.5 |
| `personalityType` | 0.5 |
| `currentSalary` | 1 |
| `expectedSalary` | 1 |

### Work Experience role / shared fields

| Suffix | Weight |
|---|---:|
| `employerName` | 5 |
| `jobTitle` | 2 |
| `shiftType` | 2 |
| `timeSupportZones` | 1 |
| `workMode` | 1 |
| `techStacks` | 10 |
| `benefits` | 7 |
| nested `projectName` | 4 |
| nested `contributionNotes` | 1 |

### Nested Project Details

| Suffix | Weight |
|---|---:|
| `employerName` | 7.5 |
| `downloadCount` | 1 |
| `publishPlatforms` | 1 |
| `projectType` | 1 |
| `status` | 2.5 |
| `teamSize` | 5 |
| `techStacks` | 10 |
| `technicalAspects` | 10 |
| `technicalDomains` | 10 |
| `horizontalDomains` | 10 |
| `verticalDomains` | 10 |
| `description` | 10 |
| `latestUpdate` | 1 |
| `startDate` | 2.5 |
| `endDate` | 2.5 |
| `projectLink` | 5 |

### Employer Details

FE Employer accordion display order (company-wide fields are not nested under
Office groups):

1. `status`
2. `headcount`
3. `salaryPolicy`
4. `office_{j}_*` (country, city, address)
5. `layoff_{j}_*` (layoffDate, affectedEmployees, reason)
6. `awards`

API keys are unchanged: `work_experience_{i}_headcount` remains an employer-row
suffix (never `work_experience_{i}_office_{j}_headcount`).

| Suffix / key | Weight |
|---|---:|
| `status` | 2.5 |
| `headcount` | 2.5 |
| `salaryPolicy` | 20 |
| `office_{j}_country` | 2.5 |
| `office_{j}_city` | 2.5 |
| `office_{j}_address` | 2.5 |
| shared `benefits` | 7 |
| `layoff_{j}_layoffDate` | 2.5 |
| `layoff_{j}_affectedEmployees` | 2.5 |
| `layoff_{j}_reason` | 5 |
| `awards` | 0 |

Weight `0` still generates a question when missing and sorts last.

### Independent Tech Stacks

| Field | Weight |
|---|---:|
| `techStacks` | 5 |

### Education

| Suffix | Weight |
|---|---:|
| `universityName` | 2 |
| `isTopper` | 1 |

### Certifications

FE certification card display order:

1. `name`
2. `issueDate`
3. `expiryDate`
4. `issuingBody` (catalog accordion)

| Response suffix | Payload property | Weight |
|---|---|---:|
| `name` | `certificationName` | 1 |
| `issueDate` | `issueDate` | 1 |
| `expiryDate` | `expiryDate` | 1 |
| `issuingBody` | `issuingBody` | 7.5 |

---

## 5. Forbidden response data

Python must not return:

- section `achievements`;
- any collection opener (`work_experiences`, `work_experience_{i}_projects`,
  `educations`, `certifications`);
- any enrichment prompt (`prompt_type: "enrichment"`) for allowlisted fields;
- `existing_values`;
- any key not listed in `fields_to_generate` for that request;
- any non-allowlisted Basic Information key;
- WE role dates, employer types/URLs/founded year, office headquarters, or other
  non-allowlisted employer fields;
- project `isPublished`, client locations, min/max team size, or other
  non-allowlisted project fields;
- non-allowlisted education or certification fields;
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
- [ ] Remove collection openers: `work_experiences`, `work_experience_{i}_projects`,
  `educations`, `certifications`.
- [ ] Support synthetic index `0` for empty top-level collections and empty nested
  `projects` / `locations` / `layoffs`.
- [ ] Apply the weights in §4 by full field context.
- [ ] Never emit forbidden fields from §5.
- [ ] Return exactly five API sections.
- [ ] Update tests for empty, partially populated, and fully populated payloads
  (fully populated → zero questions / empty `missing_fields` for that section).

---

## 7. Python agent prompt

```text
Implement the Cold Caller QG allowlist exactly as specified in
docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md.

Return five sections only (no achievements). Treat required
`fields_to_generate` as authoritative for every allowlisted key across all
sections: generate generic missing prompts only for those exact keys; never
infer omitted properties as missing; never generate enrichment prompts; do not
return `existing_values`. Remove collection openers
(`work_experiences`, `work_experience_{i}_projects`, `educations`,
`certifications`). Support synthetic index 0 for empty top-level collections and
empty nested projects/locations/layoffs as sent by FE. Apply the
context-specific weights in the contract and never emit forbidden keys.
```
