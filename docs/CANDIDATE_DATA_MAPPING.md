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

**Always-ask fields (cold call):** `currentSalary`, `expectedSalary`, `linkedinUrl` — the API **always** generates a question for each on every request. When empty → `prompt_type: 'missing'` (in `missing_fields`). When populated → `prompt_type: 'enrichment'` with **Reminder** badge (not in `missing_fields`). Other basic fields remain missing-only. See contract § 4.14.

#### Work Experience

**Link fields** (visible in UI; enrichment when populated — § 4.13.2a in contract doc):

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `work_experiences` | empty `workExperiences[]` | no roles — **also emits synthetic `work_experience_0_*` keys** (see below) |
| `work_experience_{i}_employerName` | `workExperiences[i].employerName` | `employerName` |
| `work_experience_{i}_jobTitle` | `workExperiences[i].jobTitle` | `jobTitle` |
| `work_experience_{i}_startDate` | `workExperiences[i].startDate` | `startDate` |
| `work_experience_{i}_endDate` | `workExperiences[i].endDate` | `endDate` (null allowed on current role only) |
| `work_experience_{i}_techStacks` | `workExperiences[i].techStacks` | `techStacks` — enrichment § 4.9 |
| `work_experience_{i}_shiftType` | `workExperiences[i].shiftType` | shared with employer catalog |
| `work_experience_{i}_workMode` | `workExperiences[i].workMode` | shared with employer catalog |
| `work_experience_{i}_timeSupportZones` | `workExperiences[i].timeSupportZones` | shared with employer catalog |
| `work_experience_{i}_benefits` | `workExperiences[i].benefits` | shared with employer catalog (empty `[]` only) |
| `work_experience_{i}_projects` | empty `workExperiences[i].projects[]` | nested projects opener + synthetic `project_0_*` |
| `work_experience_{i}_project_{j}_*` | nested project row | Same suffixes as `project_{i}_*` — see [nested projects](#work-experience-nested-projects-catalog-fields) |

**Employer catalog** (accordion; missing-only; flat on row after `enrichWorkExperiencesWithEmployerCatalog`):

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `work_experience_{i}_foundedYear` | `workExperiences[i].foundedYear` | Employer catalog |
| `work_experience_{i}_status` | `workExperiences[i].status` | `open`, `closed`, `flagged` |
| `work_experience_{i}_types` | empty `types[]` | Employer type enum strings |
| `work_experience_{i}_ranking` | `workExperiences[i].ranking` | `tier_1` … `dpl_favourite` |
| `work_experience_{i}_minEmployees` | `workExperiences[i].minEmployees` | |
| `work_experience_{i}_maxEmployees` | `workExperiences[i].maxEmployees` | |
| `work_experience_{i}_websiteUrl` | `workExperiences[i].websiteUrl` | |
| `work_experience_{i}_linkedInUrl` | `workExperiences[i].linkedInUrl` | |
| `work_experience_{i}_isDplCompetitor` | `isDplCompetitor` is `null` | `false` is **present** |
| `work_experience_{i}_salaryPolicy` | `workExperiences[i].salaryPolicy` | |
| `work_experience_{i}_tags` | empty `tags[]` | |

**Office locations** (`locations[]`; country is **string** name on payload):

| apiFieldName | Payload check |
|---|---|
| `work_experience_{i}_office_{j}_country` | `locations[j].country` (string) |
| `work_experience_{i}_office_{j}_city` | `locations[j].city` |
| `work_experience_{i}_office_{j}_address` | `locations[j].address` |
| `work_experience_{i}_office_{j}_isHeadquarters` | `isHeadquarters` is `null` |

Synthetic `office_0_*` when `locations[]` empty.

**Layoffs** (`layoffs[]`):

| apiFieldName | Payload property |
|---|---|
| `work_experience_{i}_layoff_{j}_layoffDate` | `layoffDate` |
| `work_experience_{i}_layoff_{j}_affectedEmployees` | `affectedEmployees` |
| `work_experience_{i}_layoff_{j}_reason` | `reason` |
| `work_experience_{i}_layoff_{j}_source` | `source` |

Synthetic `layoff_0_*` when `layoffs[]` empty.

**UI:** link fields visible → projects block → accordion **Complete employer details** (catalog + offices + layoffs). See [CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md](./CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md) and contract § 4.7 / § 4.13.

### Empty work experience section (synthetic first role)

When `workExperiences[]` is **empty**, the server emits **51 missing-field keys**:

| Group | Keys |
|---|---|
| Section opener | `work_experiences` |
| First role link | `work_experience_0_*` link fields (9) |
| Employer catalog | `work_experience_0_foundedYear` … `work_experience_0_tags` (11) |
| First office | `work_experience_0_office_0_*` (4) |
| First layoff | `work_experience_0_layoff_0_*` (4) |
| Nested projects opener | `work_experience_0_projects` |
| First nested project | `work_experience_0_project_0_*` (21) |

- **`work_experience_0_*` applies only while the array is empty.** After rows are added, keys use real indices (`work_experience_1_*`, etc.).
- **`employerId`** and row ids are never question fields.

### Work experience link enrichment (§ 4.13.2a)

When `workExperiences[]` has rows, enrichment for opener + populated link fields (`jobTitle`, `employerName`, `startDate`, `endDate`, `shiftType`, `workMode`, `timeSupportZones`, `benefits`). Catalog/offices/layoffs remain missing-only. `techStacks` and projects keep existing enrichment rules.

#### Independent Tech Stacks

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `techStacks` | empty top-level `techStacks[]` | `techStacks` |

**Enrichment (always ask when populated):**

| apiFieldName | Payload check | Response |
|---|---|---|
| `techStacks` | non-empty `techStacks[]` | Question with `prompt_type: 'enrichment'` — **not** in `missing_fields` |

Resume-parsed stacks may be incomplete; cold callers should ask for **additional** technologies. See [FRONTEND_INTEGRATION_CONTRACT.md § 4.9](./FRONTEND_INTEGRATION_CONTRACT.md#49-tech-stack-enrichment-prompts).

**Work experience role tech stacks** — same enrichment rule for `work_experience_{i}_techStacks` when `workExperiences[i].techStacks[]` is populated.

#### Independent Projects

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `projects` | empty top-level `projects[]` | no standalone projects — **also emits synthetic `project_0_*` keys** (see below) |
| `project_{i}_projectName` | `projects[i].projectName` | ASP.NET `Project.Name` (candidate link) |
| `project_{i}_contributionNotes` | `projects[i].contributionNotes` | `CandidateProject` junction (candidate link) |
| `project_{i}_employerName` | `projects[i].employerName` | `Project.Employer` navigation name |
| `project_{i}_clientLocations` | `projects[i].clientLocations` | `Project.ClientLocations` → `string[]` |
| `project_{i}_projectType` | `projects[i].projectType` | `Project.Type` enum |
| `project_{i}_status` | `projects[i].status` | `Project.Status` enum |
| `project_{i}_minTeamSize` | `projects[i].minTeamSize` | `Project.MinTeamSize` (weight 2.5; team size group 5 total) |
| `project_{i}_maxTeamSize` | `projects[i].maxTeamSize` | `Project.MaxTeamSize` (weight 2.5) |
| `project_{i}_startDate` | `projects[i].startDate` | `Project.StartDate` |
| `project_{i}_endDate` | `projects[i].endDate` | `Project.EndDate` |
| `project_{i}_verticalDomains` | `projects[i].verticalDomains` | `Project.VerticalDomains` collection |
| `project_{i}_horizontalDomains` | `projects[i].horizontalDomains` | `Project.HorizontalDomains` collection |
| `project_{i}_technicalDomains` | `projects[i].technicalDomains` | `Project.TechnicalDomains` collection |
| `project_{i}_description` | `projects[i].description` | `Project.Description` |
| `project_{i}_notes` | `projects[i].notes` | `Project.Notes` |
| `project_{i}_projectLink` | `projects[i].link` | `Project.Link` (payload **`link`**, apiFieldName **`projectLink`**) |
| `project_{i}_isPublished` | `projects[i].isPublished` | `Project.IsPublished` (`false` = present, not missing) |
| `project_{i}_publishPlatforms` | `projects[i].publishPlatforms` | `Project.PublishPlatforms` collection |
| `project_{i}_downloadCount` | `projects[i].downloadCount` | `Project.DownloadCount` (`0` = present, not missing) |
| `project_{i}_technicalAspects` | `projects[i].technicalAspects` | `Project.TechnicalAspects` collection |
| `project_{i}_techStacks` | `projects[i].techStacks` | `Project.TechStacks` collection |

**Link field weights (Tier A — always visible, fixed UI order Name → Contribution):** `projectName` 4, `contributionNotes` 1.

### Empty independent projects section (synthetic first row)

When top-level `projects[]` is **empty**, the server emits **22 missing-field keys**:

| apiFieldName | UI label | Purpose |
|---|---|---|
| `projects` | — | Section opener |
| `project_0_projectName` | Name | Candidate link (weight 4) |
| `project_0_contributionNotes` | Contribution | Candidate link (weight 1) |
| `project_0_employerName` … `project_0_techStacks` | (catalog) | Accordion — see master table |

- **21 `project_0_*` field keys** per synthetic row (2 link + 19 catalog).
- Questions are **LLM-generated** (one per key); server fills gaps with templates.
- **`project_0_*` applies only to the first entry** while the array is empty. After rows are added and generation re-runs, missing keys use real indices (`project_1_*`, etc.).
- **UI (Cold Caller):** see [FRONTEND_INTEGRATION_CONTRACT.md § 4.11](./FRONTEND_INTEGRATION_CONTRACT.md#411-independent-projects-tab-rendering-spec) — section opener → per project: **Name + Contribution visible** → collapsible **Complete project details** for catalog. Enrichment § 4.10.

### Project enrichment (Option B)

When `projects[]` or nested `workExperiences[i].projects[]` is **populated**:

| Field | Enrichment when |
|---|---|
| `projects` / `work_experience_{i}_projects` | List non-empty — ask for **more** projects |
| `*_projectName` | Value present — verify/correct name |
| `*_contributionNotes` | Value present — add/correct contribution |

Enrichment fields are **not** in `missing_fields`. Catalog suffixes remain missing-only. See [FRONTEND_INTEGRATION_CONTRACT.md § 4.10](./FRONTEND_INTEGRATION_CONTRACT.md#410-project-enrichment-prompts-option-b).

### Work experience nested projects (catalog fields)

When `workExperiences[i].projects[]` is **empty**, the server emits `work_experience_{i}_projects` plus **21** synthetic `work_experience_{i}_project_0_*` keys (same suffixes as independent projects).

When nested projects exist, missing keys use `work_experience_{i}_project_{j}_{suffix}` for each empty catalog/link field on that row.

| apiFieldName pattern | Example |
|---|---|
| `work_experience_{i}_project_{j}_projectName` | Nested project name |
| `work_experience_{i}_project_{j}_contributionNotes` | Nested contribution |
| `work_experience_{i}_project_{j}_employerName` | … all catalog suffixes same as `project_{i}_*` |

**UI:** nested under the Work Experience card — projects opener visible; Name + Contribution inside accordion. Enrichment rules § 4.10 when rows populated from resume.

#### Education

**Link fields** (visible in UI; enrichment when populated — § 4.12.2a):

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `educations` | empty `educations[]` | no education rows — **also emits synthetic `education_0_*` keys** (see below) |
| `education_{i}_universityName` | `educations[i].universityName` (legacy: `universityLocationName`) | `universityName` |
| `education_{i}_degreeName` | `educations[i].degreeName` | `degreeName` |
| `education_{i}_majorName` | `educations[i].majorName` | `majorName` |
| `education_{i}_startMonth` | `educations[i].startMonth` | `startMonth` |
| `education_{i}_endMonth` | `educations[i].endMonth` | `endMonth` |
| `education_{i}_grades` | `educations[i].grades` | `grades` |
| `education_{i}_isTopper` | `educations[i].isTopper` is `null` | `isTopper` — `false` is **present** |
| `education_{i}_isCheetah` | `educations[i].isCheetah` is `null` | `isCheetah` — `false` is **present** |

**University catalog** (accordion in UI; missing-only; flat on each row, merged from DB by `universityId`):

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `education_{i}_country` | `educations[i].country` | University — `Country` |
| `education_{i}_ranking` | `educations[i].ranking` | University — `Ranking` (`tier_1`, `tier_2`, `tier_3`, `dpl_favourite`; display: Tier 1, Tier 2, Tier 3, DPL Favourite) |
| `education_{i}_websiteUrl` | `educations[i].websiteUrl` | University — `WebsiteUrl` |
| `education_{i}_linkedinUrl` | `educations[i].linkedinUrl` | University — `LinkedInUrl` |

**Campus locations** (`locations[]` on row; accordion under catalog; apiFieldName uses `campus_{j}_` index):

| apiFieldName | Payload check | Main app source |
|---|---|---|
| `education_{i}_campus_{j}_city` | `educations[i].locations[j].city` | Campus — `City` |
| `education_{i}_campus_{j}_isMainCampus` | `locations[j].isMainCampus` is `null` | Campus — `IsMainCampus` |
| `education_{i}_campus_{j}_address` | `educations[i].locations[j].address` | Campus — `Address` (UI: Office Location) |

When `locations[]` is **empty**, server emits synthetic `education_{i}_campus_0_*` keys.

**UI:** link fields visible outside accordion; catalog + campuses inside **Complete university details**. See § 4.12.

### Empty education section (synthetic first row)

When `educations[]` is **empty**, the server emits **16 missing-field keys**:

| apiFieldName | UI label | Purpose |
|---|---|---|
| `educations` | — | Section opener |
| `education_0_universityName` | University Name | Link |
| `education_0_degreeName` | Degree Name | Link |
| `education_0_majorName` | Major Name | Link |
| `education_0_startMonth` | Start Month | Link |
| `education_0_endMonth` | End Month | Link |
| `education_0_grades` | Grades | Link |
| `education_0_isTopper` | Topper | Link |
| `education_0_isCheetah` | Cheetah | Link |
| `education_0_country` | Country | Catalog |
| `education_0_ranking` | Ranking | Catalog |
| `education_0_websiteUrl` | Website URL | Catalog |
| `education_0_linkedinUrl` | LinkedIn URL | Catalog |
| `education_0_campus_0_city` | City | Campus 1 |
| `education_0_campus_0_isMainCampus` | Main Campus | Campus 1 |
| `education_0_campus_0_address` | Office Location | Campus 1 |

- **`education_0_*` applies only while the array is empty.** After rows are added, keys use real indices (`education_1_*`, etc.).
- **`universityId`**, **`universityLocationId`**, campus `id`, education `id` — never question fields.

#### Certifications — payload property ≠ apiFieldName suffix

| apiFieldName | Payload property (read) | Main app source |
|---|---|---|
| `certifications` | empty `certifications[]` | no certification rows — **also emits synthetic `certification_0_*` keys** (see below) |
| `certification_{i}_name` | `certificationName` | `certificationName` |
| `certification_{i}_level` | `certificationLevel` | `certificationLevel` |
| `certification_{i}_url` | `certificationUrl` | `certificationUrl` |
| `certification_{i}_issueDate` | `issueDate` | `issueDate` |
| `certification_{i}_expiryDate` | `expiryDate` | `expiryDate` |
| `certification_{i}_issuingBody` | `issuingBody` | Certification catalog — `IssuingBody` |
| `certification_{i}_issuingBodyUrl` | `issuingBodyUrl` | Certification catalog — official issuer website URL |

> **Do not emit** `certification_{i}_certificationName`, `certification_{i}_certificationLevel`, or `certification_{i}_certificationUrl`.  
> **`certificationId`** is for DB linking only — not a generated question field.

**Field tiers (UI):**

| Tier | apiFieldName suffixes | UI placement |
|---|---|---|
| Link (visible) | `name`, `issueDate`, `expiryDate`, `url`, `level` | Flat list per certification card |
| Catalog (accordion) | `issuingBody`, `issuingBodyUrl` | Collapsible **Complete certification details** |

When a row is **linked** to an existing Certification record, the frontend **must merge** catalog values (`issuingBody`, `issuingBodyUrl`, `certificationName`) into the payload before POST. The API only asks for catalog fields that are still `null` / `""` in the payload.

**Issuer body / URL dependency** (existing rows only — not synthetic `certification_0_*` when `certifications[]` is empty):

| Condition | API behavior |
|---|---|
| `issuingBody` present | Do **not** emit `certification_{i}_issuingBodyUrl` |
| `issuingBodyUrl` present | Do **not** emit `certification_{i}_issuingBody` |
| Both empty | Emit both when missing |
| `certifications[]` empty (synthetic first row) | Always emit both catalog keys (unchanged) |

### Certification link enrichment (existing rows)

When `certifications[]` is **not** empty, the server emits **`prompt_type: enrichment`** questions (not in `missing_fields`) for:

| Field | When |
|---|---|
| `certifications` | Section has at least one row — ask for more certifications |
| `certification_{i}_name` | `certificationName` present |
| `certification_{i}_issueDate` | `issueDate` present |
| `certification_{i}_expiryDate` | `expiryDate` present |
| `certification_{i}_url` | `certificationUrl` present |
| `certification_{i}_level` | `certificationLevel` present |

Catalog fields (`issuingBody`, `issuingBodyUrl`) are **not** enrichment — missing-only, with issuer body ↔ URL skip rule above.

Fully complete rows still receive link-field enrichment Reminders. See [FRONTEND_INTEGRATION_CONTRACT.md § 4.8.2a](./FRONTEND_INTEGRATION_CONTRACT.md#482a-certification-link-enrichment-prompt_type-enrichment).

### Empty certifications section (synthetic first row)

When `certifications[]` is **empty**, the server emits **8 missing-field keys**:

| apiFieldName | Tier | Purpose |
|---|---|---|
| `certifications` | — | Section opener |
| `certification_0_name` | Link | Certification name |
| `certification_0_issueDate` | Link | Issue date |
| `certification_0_expiryDate` | Link | Expiry date |
| `certification_0_url` | Link | Candidate verification / badge URL |
| `certification_0_level` | Link | Certification level |
| `certification_0_issuingBody` | Catalog | Issuer body (e.g. AWS) |
| `certification_0_issuingBodyUrl` | Catalog | Issuer official website URL |

Valid **level** values: `Foundation`, `Associate`, `Professional`, `Expert`, `Master`.

- Questions are **LLM-generated** (one per key); server fills any gaps with templates.
- **`certification_0_*` applies only to the first entry** while the array is empty. After rows are added and generation re-runs, missing keys use real indices (`certification_1_*`, etc.).
- **UI:** see [FRONTEND_INTEGRATION_CONTRACT.md § 4.8](./FRONTEND_INTEGRATION_CONTRACT.md#48-certifications-tab-rendering-spec) — section opener → per certification: link fields visible → accordion for catalog fields.

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
| Education | `universityName`, `isCheetah`, `country`, `campus_0_city`, … | Same as payload / apiFieldName suffix |
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
| 11 | Empty `certifications[]`: emit `certifications` + `certification_0_*` synthetic keys (**8** total incl. catalog); § 4.8 UI | ✅ |
| 17 | Certification catalog: `issuingBody`, `issuingBodyUrl` on flat payload row; accordion in UI | ✅ |
| 18 | Tech stack enrichment: always prompt when populated; `prompt_type: enrichment`; exclude from `missing_fields` | ✅ |
| 19 | Project enrichment (Option B): openers + Name/Contribution when populated; catalog missing-only | ✅ |
| 20 | Independent Projects tab UI spec § 4.11 (grouped cards, no flat missing-field dump) | ✅ docs |
| 21 | Certification catalog: `issuingBody` present → skip `issuingBodyUrl`; URL present → skip `issuingBody` (existing rows only) | ✅ |
| 22 | Certification link enrichment: opener + present link fields when `certifications[]` populated; `prompt_type: enrichment` | ✅ |
| 12 | Empty `educations[]`: emit `educations` + `education_0_*` synthetic keys (**16** total incl. catalog + campus_0); § 4.12 UI | ✅ |
| 23 | Education university catalog: country, ranking, websiteUrl, linkedinUrl flat on row; locations[] campuses; accordion in UI | ✅ |
| 24 | Education link enrichment: opener + present link fields when `educations[]` populated; `prompt_type: enrichment` | ✅ |
| 13 | Empty top-level `projects[]`: emit `projects` + **21** `project_0_*` synthetic keys | ✅ |
| 26 | Basic information always-ask: `currentSalary`, `expectedSalary`, `linkedinUrl` — enrichment when populated (§ 4.14) | ✅ |
| 14 | Empty `workExperiences[]`: emit `work_experiences` + link + catalog + office_0 + layoff_0 + projects (**51** keys) | ✅ |
| 15 | Linked project rows: detect missing catalog fields on `projects[]` and nested `workExperiences[].projects[]` | ✅ |
| 16 | Payload `link` → apiFieldName `projectLink`; `isPublished: false` and `downloadCount: 0` are **present** | ✅ |

### Python implementation map (`question_generator.py`)

```python
CERTIFICATION_PAYLOAD_TO_API_KEY = {
    "certificationName": "name",
    "issueDate": "issueDate",
    "expiryDate": "expiryDate",
    "certificationUrl": "url",
    "certificationLevel": "level",
    "issuingBody": "issuingBody",
    "issuingBodyUrl": "issuingBodyUrl",
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
