# Frontend Integration Contract — Generate Questions API

**Status:** Basic Information + Preferences QG contract updated (2026-07-29).
**Service:** Python Question Generation API (`NEXT_PUBLIC_QUESTIONS_API_URL`,
default `http://localhost:8002`).
**Detailed Python handoff:** [COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)
and [QG_BASIC_PREFERENCES_HANDOFF.md](./QG_BASIC_PREFERENCES_HANDOFF.md)

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
omitted from `candidate_data` and must not be treated as missing. Education is
outside the QG contract: `candidate_data.educations` and every `education_*` key
are omitted. The QG API rejects either legacy form with HTTP `422`. `cnic` and
`personalityType` are also outside the QG allowlist; if still sent, Python
**ignores/drops** them (does not `422`).

## Sections and UI tabs

Python returns exactly six sections:

1. `basic_information`
2. `preferences`
3. `work_experience`
4. `independent_tech_stacks`
5. `certifications`
6. `achievements`

Cold Caller Call Notes renders five tabs in this order:

1. Basic Information
2. Work Experience
3. Certifications
4. Achievements
5. Preferences

Preferences is a **real Python section**. Independent Tech Stacks is not
displayed in Cold Caller. Basic Information shows Resume + LinkedIn URL only.
Preferences shows Current Salary + Expected Salary only.

`education` and `independent_projects` are not valid API sections. The response
mapper ignores them if returned by an older service.

## Response

```ts
type QuestionSectionId =
  | "basic_information"
  | "preferences"
  | "work_experience"
  | "independent_tech_stacks"
  | "certifications"
  | "achievements"

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
  in the existing question-card chrome — **except Contribution**
  (`contributionNotes`): FE always lists it in `fields_to_generate`; Python
  always returns `prompt_type: "advanced"`; Call Notes shows that question only
  (no value card). Session-only local ask cues apply only before Generate
  Questions;
- Python does not return `existing_values` or enrichment prompts;
- missing tab badges count only `missing_fields`;
- questions are displayed by descending server-assigned priority.

Populated fields in every remaining section (Basic, Preferences, Role, Employer,
Tech Stacks, Certifications, Achievements, Projects) use the same numbered,
weighted, copy-enabled card design as missing-field questions.

## Allowed response keys

### Basic Information

`resume`, `linkedinUrl`

Weights (section totals 100; display descending): `resume` 80, `linkedinUrl` 20.
Both are `prompt_type: "basic"`. `resume` is `"attached"` when present.

### Preferences

`currentSalary`, `expectedSalary`

Weights (section totals 100; display descending): `currentSalary` 85,
`expectedSalary` 15. Both are `prompt_type: "basic"`. Cold Caller UI label for
`expectedSalary` is **Expected Salary - Net**.

### Work Experience

- Role Details:
  `work_experience_{i}_{jobTitle|startDate|shiftType|workMode|techStacks|timeSupportZones|benefits}`
- Employer Details:
  `work_experience_{i}_{employerName|headcount|types|foundedYear|salaryPolicy|status|linkedinUrl}`
- office:
  `work_experience_{i}_office_{j}_{country|city|address|isHeadquarters}`
- layoff:
  `work_experience_{i}_layoff_{j}_{layoffDate|affectedEmployees|reason}`
- nested project:
  `work_experience_{i}_project_{j}_{projectName|employerName|projectType|startDate|status|description|contributionNotes|techStacks|verticalDomains|horizontalDomains|technicalDomains|technicalAspects|minTeamSize|clientLocations|latestUpdate|maxTeamSize|endDate}`

When the parent WE has an employer (`employerId` or non-empty `employerName`),
omit project `employerName` and `projectType` from generation and UI.

The synchronized Python service does not emit `work_experiences` or
`work_experience_{i}_projects`. Indexed nested Project questions remain.

### Independent Tech Stacks

`techStacks`

### Certifications

`certification_{i}_name`, `certification_{i}_issuingBody`,
`certification_{i}_issueDate`, `certification_{i}_expiryDate`

Weights (section totals 100; display descending): name 35, issuingBody 30,
issueDate 20, expiryDate 15. All four are `prompt_type: "basic"`. Issuing Body
renders in the main card list (no catalog accordion).

Payload `certificationName` maps to response suffix `name`. Payload project `link`
maps to response suffix `projectLink`.

### Achievements

`achievement_{i}_name`, `achievement_{i}_year`,
`achievement_{i}_description`, `achievement_{i}_achievementType`,
`achievement_{i}_ranking`, `achievement_{i}_url`

Payload `achievementType` maps directly to response suffix
`achievementType`. Inbound legacy `achievement_*_type` is **migrated** to
`achievementType` (`achievementType` wins if both present). Python must not emit
the legacy `_type` response suffix.

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

Collection openers are removed (`certifications`, `achievements`,
`work_experiences`, `work_experience_{i}_projects`).

Empty top-level collections and empty nested `projects` / `locations` / `layoffs`
use synthetic index `0` keys **emitted by FE** in `fields_to_generate` so Cold
Caller can collect the first entry. Python generates only listed keys and does
not invent synthetics.

Empty `achievements` also uses FE-emitted synthetic index `0`:
`achievement_0_{name|year|description|achievementType|ranking|url}`.

Work Experience keeps role cards with nested Project Details and Employer Details.
Entry navigation has no Overview item and selects the first entry by default for
Work Experience, Certifications, and Achievements. Work Experience uses a select
whenever there are 2+ entries. Certifications keep the shared tabs/select
threshold. Achievements always shows a select so `+ Add achievement` remains
available. Work Experience entry navigation remains sticky while its question
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

- Six API sections and five Cold Caller Call Notes tabs.
- No Education tab, candidate payload property, `fields_to_generate` key,
  response section/type, grouping, question, count, icon, or empty-field path.
- Achievements payload, response section, grouping, icon, empty-field paths, and
  Call Notes/Fields tabs are present and ordered before Preferences.
- No non-allowlisted request or response keys.
- Basic Information is Resume + LinkedIn URL only (`resume` 80, `linkedinUrl` 20).
- Preferences is a real Python section with Current/Expected Salary
  (`currentSalary` 35, `expectedSalary` 25).
- CNIC and Personality Type are not QG allowlisted / not on Call Notes Basic.
- Missing badges count only `missing_fields`.
- No enrichment prompts; populated values render as FE value cards only, except
  Contribution which always shows the Advanced QG question after Generate.
