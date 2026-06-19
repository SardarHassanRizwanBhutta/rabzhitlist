# Candidate Data Mapping — Main App → Question Generation Service

**Status:** Complete — frontend mapper implemented; Python service aligned to **apiFieldName** keys below.

**Related:** [FRONTEND_INTEGRATION_CONTRACT.md](./FRONTEND_INTEGRATION_CONTRACT.md)

**Frontend references (Next.js repo):**

| Artifact | Path |
|---|---|
| Main app `Candidate` type | `src/lib/types/candidate.ts` |
| Mapper | `src/lib/utils/map-candidate-for-question-service.ts` |
| Empty-field / apiFieldName keys | `src/lib/utils/empty-field-detection.ts` |

---

## Summary for Python team

1. Next.js maps `Candidate` → `CandidateDataForQuestionService` before `POST /api/generate-questions`.
2. **`candidate_data`** uses **payload property names** (e.g. `certificationName`, `certificationLevel`).
3. **Response `field` and `missing_fields`** must use **indexed apiFieldName keys** (e.g. `certification_0_level`, not `certificationLevel`).
4. **`missing_fields` in the request body is ignored** — server computes missing fields from `candidate_data`.
5. **`resume`:** `null` / `""` = missing; `"attached"` = present (file on S3, no URL sent).
6. **Benefits:** accept `{ name, amount?, unit? }` with `unit` of `"PKR"` or `"percent"` only; do not expect `id` or `hasValue`.

---

## Section ID mapping (Python ↔ UI)

| Python `QuestionSectionId` | UI `FieldSection` | Tab label |
|---|---|---|
| `basic_information` | `basic` | Basic Information |
| `work_experience` | `workExperience` | Work Experience |
| `independent_tech_stacks` | `techStacks` | Tech Stacks |
| `independent_projects` | `projects` | Independent Projects |
| `education` | `education` | Education |
| `certifications` | `certifications` | Certifications |
| `achievements` | `achievements` | Achievements |

---

## Missing-field key convention

The frontend links generated questions to editable UI fields via **`apiFieldName`**. Python **must** emit these exact strings in:

- `sections[].missing_fields[]`
- `sections[].questions[].field`

**Rules:**

- `{i}`, `{j}` are **0-based** array indices matching order in `candidate_data`.
- Top-level basic fields use **camelCase** property names (same as payload).
- Indexed sections use **snake_case prefixes** + index + **short api suffix** (not always the payload property name).

### Master table — all apiFieldName keys

#### Basic Information (top-level)

| apiFieldName (`field` key) | Payload property | Main app source |
|---|---|---|
| `name` | `name` | `name` |
| `postingTitle` | `postingTitle` | `postingTitle` |
| `email` | `email` | `email` |
| `mobileNo` | `mobileNo` | `mobileNo` |
| `cnic` | `cnic` | `cnic` |
| `city` | `city` | `city` |
| `githubUrl` | `githubUrl` | `githubUrl` |
| `linkedinUrl` | `linkedinUrl` | `linkedinUrl` |
| `resume` | `resume` | `hasResume` (see [Resume](#resume-hasresume--null--attached)) |
| `currentSalary` | `currentSalary` | `currentSalary` |
| `expectedSalary` | `expectedSalary` | `expectedSalary` |
| `source` | `source` | `source` |
| `personalityType` | `personalityType` | `personalityType` |
| `isTopDeveloper` | `isTopDeveloper` | `isTopDeveloper` |

#### Work Experience

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `work_experiences` | empty `workExperiences[]` | no roles — **also emits synthetic `work_experience_0_*` keys** (see below) |
| `work_experience_{i}_employerName` | `workExperiences[i].employerName` | `employerName` |
| `work_experience_{i}_jobTitle` | `workExperiences[i].jobTitle` | `jobTitle` |
| `work_experience_{i}_startDate` | `workExperiences[i].startDate` | `startDate` |
| `work_experience_{i}_endDate` | `workExperiences[i].endDate` | `endDate` (null allowed on current role only) |
| `work_experience_{i}_techStacks` | `workExperiences[i].techStacks` | `techStacks` |
| `work_experience_{i}_shiftType` | `workExperiences[i].shiftType` | `shiftType` |
| `work_experience_{i}_workMode` | `workExperiences[i].workMode` | `workMode` |
| `work_experience_{i}_timeSupportZones` | `workExperiences[i].timeSupportZones` | `timeSupportZones` |
| `work_experience_{i}_benefits` | `workExperiences[i].benefits` | `benefits` (empty `[]` only) |
| `work_experience_{i}_projects` | empty `workExperiences[i].projects[]` | no nested projects on role |
| `work_experience_{i}_project_{j}_projectName` | nested project name | `projects[j].projectName` |
| `work_experience_{i}_project_{j}_contributionNotes` | nested notes | `projects[j].contributionNotes` |

### Empty work experience section (synthetic first role)

When `workExperiences[]` is **empty**, the server emits **13 missing-field keys**:

| apiFieldName | UI label | Purpose |
|---|---|---|
| `work_experiences` | — | Section opener — broad reminder that no work experience entries exist yet |
| `work_experience_0_jobTitle` | Job Title | Mini-question for job title |
| `work_experience_0_employerName` | Employer | Mini-question for employer |
| `work_experience_0_startDate` | Start Date | Mini-question for start date (duration) |
| `work_experience_0_endDate` | End Date | Mini-question for end date (duration) |
| `work_experience_0_techStacks` | Tech Stacks | Mini-question for technologies used in role |
| `work_experience_0_shiftType` | Shift Type | Mini-question for shift |
| `work_experience_0_workMode` | Work Mode | Mini-question for remote/hybrid/on-site |
| `work_experience_0_timeSupportZones` | Time Support Zones | Mini-question for time zones supported |
| `work_experience_0_benefits` | Benefits | Mini-question for role benefits |
| `work_experience_0_projects` | Projects | Mini-question prompting first nested project on role |
| `work_experience_0_project_0_projectName` | Project Name | Mini-question for first nested project name |
| `work_experience_0_project_0_contributionNotes` | Contribution | Mini-question for first nested project contribution |

- Questions are **LLM-generated** (one per key); server fills any gaps with templates.
- **`work_experience_0_*` applies only to the first role** while the array is empty. After rows are added and generation re-runs, missing keys use real indices (`work_experience_1_*`, etc.).
- UI: show as a **numbered list** (section opener first by priority, then field mini-questions).

#### Independent Tech Stacks

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `techStacks` | empty top-level `techStacks[]` | `techStacks` |

#### Independent Projects

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `projects` | empty top-level `projects[]` | no standalone projects — **also emits synthetic `project_0_*` keys** (see below) |
| `project_{i}_projectName` | `projects[i].projectName` | `projectName` (UI: Name) |
| `project_{i}_contributionNotes` | `projects[i].contributionNotes` | `contributionNotes` (UI: Contribution) |

### Empty independent projects section (synthetic first row)

When top-level `projects[]` is **empty**, the server emits **3 missing-field keys**:

| apiFieldName | UI label | Purpose |
|---|---|---|
| `projects` | — | Section opener — broad reminder that no standalone projects exist yet |
| `project_0_projectName` | Name | Mini-question for project name |
| `project_0_contributionNotes` | Contribution | Mini-question for contribution notes |

- Questions are **LLM-generated** (one per key); server fills any gaps with templates.
- **`project_0_*` applies only to the first entry** while the array is empty. After rows are added and generation re-runs, missing keys use real indices (`project_1_*`, etc.).
- UI: show as a **numbered list** (section opener first by priority, then field mini-questions).

#### Education

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `educations` | empty `educations[]` | no education rows — **also emits synthetic `education_0_*` keys** (see below) |
| `education_{i}_universityLocationName` | `educations[i].universityLocationName` | `universityLocationName` — ask **university name only**, not location |
| `education_{i}_degreeName` | `educations[i].degreeName` | `degreeName` |
| `education_{i}_majorName` | `educations[i].majorName` | `majorName` |
| `education_{i}_startMonth` | `educations[i].startMonth` | `startMonth` |
| `education_{i}_endMonth` | `educations[i].endMonth` | `endMonth` |
| `education_{i}_grades` | `educations[i].grades` | `grades` |
| `education_{i}_isTopper` | `educations[i].isTopper` | `isTopper` |
| `education_{i}_isCheetah` | `educations[i].isCheetah` | `isCheetah` |

### Empty education section (synthetic first row)

When `educations[]` is **empty**, the server emits **9 missing-field keys**:

| apiFieldName | UI label | Purpose |
|---|---|---|
| `educations` | — | Section opener — broad reminder that no education entries exist yet |
| `education_0_universityLocationName` | University Name | Mini-question for **university name only** (not campus/city/location) |
| `education_0_degreeName` | Degree Name | Mini-question for degree (e.g. Bachelor of Science) |
| `education_0_majorName` | Major Name | Mini-question for major (e.g. Computer Science) |
| `education_0_startMonth` | Start Month | Mini-question for start date |
| `education_0_endMonth` | End Month | Mini-question for end/completion date (priority weight 0 — sorts last) |
| `education_0_grades` | Grades | Mini-question for grades/GPA |
| `education_0_isTopper` | Topper | Mini-question for topper status |
| `education_0_isCheetah` | Cheetah | Mini-question for Cheetah status |

- Questions are **LLM-generated** (one per key); server fills any gaps with templates.
- **`education_0_*` applies only to the first entry** while the array is empty. After rows are added and generation re-runs, missing keys use real indices (`education_1_*`, etc.).
- UI: show as a **numbered list** (section opener first by priority, then field mini-questions).

#### Certifications — payload property ≠ apiFieldName suffix

| apiFieldName | Payload property (read) | Main app source |
|---|---|---|
| `certifications` | empty `certifications[]` | no certification rows — **also emits synthetic `certification_0_*` keys** (see below) |
| `certification_{i}_name` | `certificationName` | `certificationName` |
| `certification_{i}_level` | `certificationLevel` | `certificationLevel` |
| `certification_{i}_url` | `certificationUrl` | `certificationUrl` |
| `certification_{i}_issueDate` | `issueDate` | `issueDate` |
| `certification_{i}_expiryDate` | `expiryDate` | `expiryDate` |

> **Do not emit** `certification_{i}_certificationName`, `certification_{i}_certificationLevel`, or `certification_{i}_certificationUrl`.

### Empty certifications section (synthetic first row)

When `certifications[]` is **empty**, the server emits **6 missing-field keys**:

| apiFieldName | Purpose |
|---|---|
| `certifications` | Section opener — broad reminder that no certifications exist yet |
| `certification_0_name` | Mini-question for Name |
| `certification_0_issueDate` | Mini-question for Issue Date |
| `certification_0_expiryDate` | Mini-question for Expiry Date |
| `certification_0_url` | Mini-question for Certification URL |
| `certification_0_level` | Mini-question for Certification Level |

Valid **level** values: `Foundation`, `Associate`, `Professional`, `Expert`, `Master`.

- Questions are **LLM-generated** (one per key); server fills any gaps with templates.
- **`certification_0_*` applies only to the first entry** while the array is empty. After rows are added and generation re-runs, missing keys use real indices (`certification_1_*`, etc.).
- UI: show as a **numbered list** (section opener first by priority, then field mini-questions).

#### Achievements — payload property ≠ apiFieldName suffix

| apiFieldName | Payload property (read) | Main app source |
|---|---|---|
| `achievements` | empty `achievements[]` | no achievement rows — **also emits synthetic `achievement_0_*` keys** (see below) |
| `achievement_{i}_name` | `name` | `name` (legacy `competitions[].competitionName`) |
| `achievement_{i}_type` | `achievementType` or numeric `type` | `achievementType` |
| `achievement_{i}_ranking` | `ranking` | `ranking` |
| `achievement_{i}_year` | `year` | `year` |
| `achievement_{i}_url` | `url` | `url` |
| `achievement_{i}_description` | `description` | `description` |

> **Do not emit** `achievement_{i}_achievementType`.

### Empty achievements section (synthetic first row)

When `achievements[]` is **empty**, the server emits **7 missing-field keys**:

| apiFieldName | Purpose |
|---|---|
| `achievements` | Section opener — broad reminder that no achievements exist yet |
| `achievement_0_name` | Mini-question for Name (first entry to collect) |
| `achievement_0_type` | Mini-question for Type |
| `achievement_0_ranking` | Mini-question for Ranking |
| `achievement_0_year` | Mini-question for Year |
| `achievement_0_url` | Mini-question for URL |
| `achievement_0_description` | Mini-question for Description |

- Questions are **LLM-generated** (one per key); server fills any gaps with templates.
- **`achievement_0_*` applies only to the first entry** while the array is empty. After the frontend/backend adds row(s) and re-runs generation, missing keys use real indices (`achievement_1_*`, etc.) for additional incomplete rows.
- UI: show as a **numbered list** (section opener first by priority, then field mini-questions).

Legacy `competitions[]` is mapped to `achievements[]` with `achievementType: "competition"` before POST.

### Achievement type (payload)

Send `achievementType` as string enum. Numeric `type` 0–7 is also accepted when `achievementType` is absent:

| `type` | `achievementType` |
|---|---|
| 0 | `competition` |
| 1 | `openSource` |
| 2 | `award` |
| 3 | `medal` |
| 4 | `publication` |
| 5 | `certification` |
| 6 | `recognition` |
| 7 | `other` |

---

## Resume: `hasResume` → `null` / `"attached"`

The main app stores resume as a boolean `hasResume` (file in S3). The question service never receives a resume URL.

| Main app `hasResume` | Payload `resume` | Missing? |
|---|---|---|
| `false`, `undefined`, or field omitted | `null` | Yes |
| `true` | `"attached"` | **No** — treat as present |

**Python detection:**

```python
def _is_resume_missing(value):
    if value is None or value == "":
        return True
    if value == "attached":
        return False
    return False  # any other non-empty string also treated as present
```

**Do not** require a URL for `resume`. The frontend omits `hasResume` from the payload; only `resume` is sent.

---

## Benefits transform

Main app `EmployerBenefit` (per work experience):

```typescript
{
  id: string
  name: string
  hasValue: boolean
  amount: number | null
  unit: "PKR" | "percent" | null
}
```

Python `Benefit` (after frontend mapping):

```typescript
{
  name: string
  amount?: number | null
  unit?: string | null  // "PKR" | "percent" | null
}
```

### Mapping rules

| Main app | → Python payload |
|---|---|
| `hasValue: false` | `{ name, amount: null, unit: null }` |
| `hasValue: true`, `unit: "PKR"` | `{ name, amount, unit: "PKR" }` |
| `hasValue: true`, `unit: "percent"` | `{ name, amount, unit: "percent" }` |

**Dropped fields:** `id`, `hasValue` — Python must not require or return these.

### Missing-field detection for benefits

| Condition | apiFieldName emitted |
|---|---|
| `workExperiences[i].benefits` is `[]` or missing | `work_experience_{i}_benefits` |
| Non-empty array (even if all `amount` are `null`) | **Not missing** — recruiter may ask about values in conversation, but there is no per-benefit apiFieldName today |

---

## Payload field mapping worksheet

### Basic Information

| Payload field | Main app field | Transform | Status |
|---|---|---|---|
| `name` | `name` | string; `""` → missing | ✅ |
| `postingTitle` | `postingTitle` | `string \| null` | ✅ |
| `email` | `email` | string | ✅ |
| `mobileNo` | `mobileNo` | string | ✅ |
| `cnic` | `cnic` | `string \| null` | ✅ |
| `city` | `city` | string | ✅ |
| `githubUrl` | `githubUrl` | `string \| null` | ✅ |
| `linkedinUrl` | `linkedinUrl` | `string \| null` | ✅ |
| `resume` | `hasResume` | `false`/missing → `null`; `true` → `"attached"` | ✅ |
| `currentSalary` | `currentSalary` | `number \| null` | ✅ |
| `expectedSalary` | `expectedSalary` | `number \| null` | ✅ |
| `source` | `source` | string | ✅ |
| `personalityType` | `personalityType` | `string \| null` | ✅ |
| `isTopDeveloper` | `isTopDeveloper` | `boolean` (default `false`) | ✅ |

**Omitted from payload:** `id`, `status`, `hasResume`, resume metadata, `matched*`, `latestJobTitle`, `totalExperience*`, `dataProgressPercentage`, `createdAt`, `updatedAt`, `organizationalRoles`, deprecated resume URL field.

### Work Experience (`workExperiences[]`)

| Payload field | Main app field | Transform | Status |
|---|---|---|---|
| `employerName` | `employerName` | string; omit `employerId` | ✅ |
| `jobTitle` | `jobTitle` | string | ✅ |
| `startDate` | `startDate` | `Date` → ISO 8601 or `null` | ✅ |
| `endDate` | `endDate` | `Date` → ISO 8601 or `null` (current role) | ✅ |
| `techStacks` | `techStacks` | `string[]` | ✅ |
| `shiftType` | `shiftType` | enum string or `null` if empty | ✅ |
| `workMode` | `workMode` | enum string or `null` if empty | ✅ |
| `timeSupportZones` | `timeSupportZones` | `string[]` | ✅ |
| `benefits` | `benefits` | [Benefits transform](#benefits-transform) | ✅ |
| `projects` | `projects` | `{ projectName, contributionNotes }[]`; omit `projectId` | ✅ |

### Independent Tech Stacks / Projects / Education / Certifications / Achievements

See master table above. Certification level uses payload `certificationLevel` but apiFieldName `certification_{i}_level`.

---

## Priority weight suffixes (must match apiFieldName)

When sorting `missing_fields` and `questions` within a section, priority lookup uses the **apiFieldName suffix** after the index:

| Section | Suffix examples | Notes |
|---|---|---|
| Certifications | `name`, `level`, `url`, `issueDate`, `expiryDate` | Not `certificationName` / `certificationLevel` |
| Achievements | `name`, `type`, `ranking`, `year`, `url`, `description` | Not `achievementType` |
| Education | `universityLocationName`, `isCheetah`, … | Same as payload property names |
| Work experience | `employerName`, `benefits`, `projectName`, … | Unchanged |

---

## Mapper reference (frontend)

```typescript
import type { Candidate } from "@/lib/types/candidate"
import type { CandidateDataForQuestionService } from "@/types/question-generation"
import { mapMainAppCandidateToQuestionService } from "@/lib/utils/map-candidate-for-question-service"

const payload = mapMainAppCandidateToQuestionService(candidate)
// POST { candidate_id, candidate_data: payload, conversation_context: "cold_call" }
```

---

## Python team action items

| # | Action | Status |
|---|---|---|
| 1 | Emit `field` and `missing_fields` using **indexed apiFieldName keys** from the master table (not payload property names like `certificationName`, `achievementType`) | ✅ `question_generator.py` |
| 2 | Certification keys: `certification_{i}_name`, `certification_{i}_level`, `certification_{i}_url`, `certification_{i}_issueDate`, `certification_{i}_expiryDate` | ✅ |
| 3 | Achievement type key: `achievement_{i}_type` (not `achievementType`) | ✅ |
| 4 | Treat `resume: "attached"` as **present** (not missing) | ✅ `_is_resume_missing()` |
| 5 | Accept benefits with `unit` values `"PKR"` and `"percent"`; ignore `id` / `hasValue` | ✅ (no validation rejects them) |
| 6 | Priority weights use api suffixes: cert `name`/`level`/`url`, achievement `type` | ✅ |
| 7 | Return **7 sections** always in `sections[]` with snake_case `section` ids | ✅ |
| 8 | Keep demo `candidates_table.html` priority weights aligned with Python | ✅ |
| 9 | Update `sample_candidates.py` if examples use old certification/achievement field keys in test assertions | ⬜ optional |
| 10 | Empty `achievements[]`: emit `achievements` + `achievement_0_*` synthetic keys; LLM section opener + field mini-questions | ✅ |
| 11 | Empty `certifications[]`: emit `certifications` + `certification_0_*` synthetic keys; LLM section opener + field mini-questions | ✅ |
| 12 | Empty `educations[]`: emit `educations` + `education_0_*` synthetic keys (incl. `endMonth`); LLM section opener + field mini-questions | ✅ |
| 13 | Empty top-level `projects[]`: emit `projects` + `project_0_*` synthetic keys; LLM section opener + field mini-questions | ✅ |
| 14 | Empty `workExperiences[]`: emit `work_experiences` + `work_experience_0_*` synthetic keys (incl. nested `project_0_*`); LLM section opener + field mini-questions | ✅ |

### Python implementation map (`question_generator.py`)

```python
CERTIFICATION_PAYLOAD_TO_API_KEY = {
    "certificationName": "name",
    "issueDate": "issueDate",
    "expiryDate": "expiryDate",
    "certificationUrl": "url",
    "certificationLevel": "level",
}
# achievements: achievement_{i}_type when achievementType/type missing
```

---

## Example: certification missing keys

Payload:

```json
{
  "certifications": [
    {
      "certificationName": "AWS Solutions Architect",
      "certificationLevel": null,
      "certificationUrl": "https://example.com/badge",
      "issueDate": "2024-01-01T00:00:00.000Z",
      "expiryDate": null
    }
  ]
}
```

Expected apiFieldName keys:

```json
["certification_0_level", "certification_0_expiryDate"]
```

(sorted by priority: `level` weight 2, `expiryDate` weight 1)

---

## Reference payloads

- API contract: [FRONTEND_INTEGRATION_CONTRACT.md](./FRONTEND_INTEGRATION_CONTRACT.md)
- Python sample data: `sample_candidates.py` (payload shape; response keys must match this doc)
