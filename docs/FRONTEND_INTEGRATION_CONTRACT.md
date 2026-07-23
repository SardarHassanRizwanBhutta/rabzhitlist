# Frontend Integration Contract — Generate Questions API

**Status:** FE synced to the locked Cold Caller allowlist (2026-07-21).
**Service:** Python Question Generation API (`NEXT_PUBLIC_QUESTIONS_API_URL`,
default `http://localhost:8002`).
**Detailed Python handoff:** [COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)

## Endpoint

`POST /api/generate-questions`

```json
{
  "candidate_id": "123",
  "candidate_data": {},
  "fields_to_generate": [
    "work_experience_0_project_0_description"
  ],
  "conversation_context": "cold_call"
}
```

The frontend does not send `missing_fields`. `fields_to_generate` is authoritative
for every missing allowlisted key across all sections. Populated properties are
omitted from `candidate_data` and must not be treated as missing.

## Sections and UI tabs

Python returns exactly five sections:

1. `basic_information`
2. `work_experience`
3. `independent_tech_stacks`
4. `education`
5. `certifications`

Cold Caller renders six tabs in this order:

1. Basic Information
2. Work Experience
3. Independent Tech Stacks
4. Education
5. Certifications
6. Preferences

Preferences is frontend-only. `currentSalary` and `expectedSalary` are partitioned
from the Basic Information response into Preferences. Basic Information therefore
shows only CNIC and Personality Type questions.

`achievements` and `independent_projects` are not valid API sections. The response
mapper ignores either section if returned by an older service.

## Response

```ts
type QuestionSectionId =
  | "basic_information"
  | "work_experience"
  | "independent_tech_stacks"
  | "education"
  | "certifications"

type PromptType = "basic" | "advanced" | "enrichment"

interface ApiGeneratedQuestion {
  question: string
  field: string
  section: QuestionSectionId
  priority: number
  context: string
  prompt_type?: PromptType
}

interface SectionQuestionResult {
  section: QuestionSectionId
  label: string
  missing_fields: string[]
  questions: ApiGeneratedQuestion[]
}
```

For every allowlisted field:

- empty data produces `prompt_type: "basic"` or `"advanced"` (Python-owned map) and
  the key appears in `missing_fields` (and in request `fields_to_generate`);
- populated data produces **no** QG question; FE renders the Candidate API value
  in the existing question-card chrome;
- Python does not return `existing_values` or enrichment prompts;
- missing tab badges count only `missing_fields`;
- questions are displayed by descending server-assigned priority.

Populated fields in every section (Basic, Preferences, Role, Employer, Tech
Stacks, Education, Certifications, Projects) use the same numbered, weighted,
copy-enabled card design as missing-field questions.

## Allowed response keys

### Basic Information

`cnic`, `personalityType`, `currentSalary`, `expectedSalary`

### Work Experience

- role/shared:
  `work_experience_{i}_{employerName|jobTitle|shiftType|timeSupportZones|workMode|techStacks|benefits|status|headcount|salaryPolicy|awards}`
- office:
  `work_experience_{i}_office_{j}_{country|city|address}`
- layoff:
  `work_experience_{i}_layoff_{j}_{layoffDate|affectedEmployees|reason}`
- nested project:
  `work_experience_{i}_project_{j}_{projectName|contributionNotes|employerName|downloadCount|publishPlatforms|projectType|status|teamSize|techStacks|technicalAspects|technicalDomains|horizontalDomains|verticalDomains|description|latestUpdate|startDate|endDate|projectLink}`

The synchronized Python service does not emit `work_experiences` or
`work_experience_{i}_projects`. Indexed nested Project questions remain.

### Independent Tech Stacks

`techStacks`

### Education

`education_{i}_universityName`, `education_{i}_isTopper`

### Certifications

`certification_{i}_name`, `certification_{i}_issueDate`,
`certification_{i}_expiryDate`, `certification_{i}_issuingBody`

Payload `certificationName` maps to response suffix `name`. Payload project `link`
maps to response suffix `projectLink`.

## Defensive frontend filtering

`src/lib/utils/question-field-allowlist.ts` is the runtime allowlist.
`mapGenerateQuestionsResponse()`:

1. ignores unknown/removed sections;
2. filters both `missing_fields` and `questions`;
3. drops questions whose declared section differs from the containing section;
4. drops any `prompt_type: "enrichment"` questions;
5. restores the locked section order;
6. deduplicates missing keys.

## Grouping and synthetic rows

Collection openers are removed (`educations`, `certifications`,
`work_experiences`, `work_experience_{i}_projects`).

Empty top-level collections and empty nested `projects` / `locations` / `layoffs`
still use synthetic index `0` missing allowlisted fields so Cold Caller can collect
the first entry.

Work Experience keeps role cards with nested Project Details and Employer Details.
Entry navigation has no Overview item and selects the first entry by default for
Work Experience, Education, and Certifications. Work Experience uses tabs for 2–3
entries and a select for 4+. Education uses a select whenever there are 2+ entries
(no entry chrome for a single education). Certifications keep the shared tabs/select
threshold. Work Experience entry navigation remains sticky while its question
sections scroll.
Inside the selected Work Experience, Role Details, Employer Details, and each
individual Project render as distinct collapsible sections. Only one section is
open at a time; the section with the highest contained priority opens by default.
Each header shows its missing-field count. All sections use stable field order and
one continuous numbering sequence within each group. Populated cards show/copy the
API value with the locked FE weight; missing fields retain the unchanged
question-card behavior.

## Priorities

Python owns ordering for missing-field questions. The final field-specific weights
are specified in
[COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md#4-allowed-response-field-keys-and-weights).
FE supplies the same locked weights on populated value cards. Within each Work
Experience, FE sorts all render units by priority descending.

## Verification

- Five API sections and six FE tabs.
- No Achievements tab, payload, questions, count, icon, or empty-field path.
- No non-allowlisted request or response keys.
- Salary questions/values render in Preferences.
- CNIC and Personality Type remain in Basic Information.
- Missing badges count only `missing_fields`.
- No enrichment prompts; populated values render as FE value cards only.
