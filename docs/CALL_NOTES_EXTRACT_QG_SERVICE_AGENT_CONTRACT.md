# Call Notes Extract — QG Service Agent Contract (v1)

**Status:** Locked (2026-08-05).  
**Audience:** AI agent implementing **`POST /api/call-notes/extract`** in the **Python Question Generation (QG) service** (`llm-questions` / FastAPI on port **`8002`**).  
**This document is the primary implementation contract for the QG agent.**  
**Related (shorter summary):** [`CALL_NOTES_EXTRACT_PYTHON_HANDOFF.md`](./CALL_NOTES_EXTRACT_PYTHON_HANDOFF.md)  
**Cross-repo API mirror:** [`CALL_NOTES_EXTRACT_API_CONTRACT.md`](./CALL_NOTES_EXTRACT_API_CONTRACT.md)  
**Product locks:** [`CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md)  
**Shared field vocabulary:** [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)

---

## 0. Agent prompt (copy-paste)

```text
You are implementing Call Notes Extract v1 in the existing Python QG FastAPI app (port 8002).

READ FIRST (in order):
1. docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md  (this file — authoritative for Python)
2. docs/CALL_NOTES_EXTRACT_API_CONTRACT.md
3. docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md §3–§5

DELIVER:
- POST /api/call-notes/extract on the SAME FastAPI app as POST /api/generate-questions
- Pydantic request/response models matching §4–§5 below
- Separate module call_notes_extract.py (or prompts/call_notes_extract.py) — DO NOT reuse generate-questions handler
- Allowlist validation: allowedEmptyFields is authoritative; reject unknown keys; reject apiFieldName exactly "techStacks" (CNE16)
- High-confidence extractions only (default min confidence 0.85)
- Post-process: enum validation, date normalization, salary integers, whitelist filter
- Never persist data, never rewrite rawNotes, never return education_* or independent_tech_stacks top-level techStacks
- Tests per §12; OpenAPI example per §8
- No full rawNotes in production logs

The Next.js frontend repo already ships:
- POST /api/call-notes/extract proxy → {QUESTIONS_API_URL}/api/call-notes/extract
- allowedEmptyFields builder (QG allowlist minus CNE16)
- Analyze Notes UI + review modal (Apply to profile is separate FE work)

Your endpoint must accept the exact JSON body defined in §4 and return §5.
```

---

## 1. What you are building

| Item | Value |
|------|--------|
| **Endpoint** | `POST /api/call-notes/extract` |
| **Host app** | Existing QG FastAPI application (same process as `/api/generate-questions`, `/health`) |
| **Port** | `8002` (local default) |
| **Caller** | Next.js server proxy (browser never calls Python directly) |
| **Purpose** | Read recruiter **plain-text call notes** + an **explicit whitelist** of empty candidate fields → return **high-confidence structured value proposals** |
| **Not** | Question generation, DB writes, catalog creation, notes rewriting, auto-apply |

### 1.1 Relationship to `generate-questions`

| | `POST /api/generate-questions` | `POST /api/call-notes/extract` |
|---|----------------------------------|--------------------------------|
| Input | Sparse `candidate_data` + `fields_to_generate` | `rawNotes` + `allowedEmptyFields[]` + optional snapshot |
| Output | Sectioned `questions[]` | Flat `extractions[]` |
| LLM role | Generate recruiter/candidate questions | Extract values from notes |
| Share | OpenAI client, enum maps, allowlist vocabulary, FastAPI app | Same |
| Do **not** share | Question prompt templates, `MissingFieldsAnalyzer` output path | — |

---

## 2. End-to-end flow (your boundary)

```text
Next.js POST /api/call-notes/extract
    → forwards JSON unchanged
Python POST /api/call-notes/extract   ← YOU IMPLEMENT THIS
    → validate request
    → LLM structured extract (whitelist-only)
    → post-process + confidence filter
    → JSON { extractions, meta? }
Next.js review modal (already shipped)
    → recruiter reviews → Apply Selected (FE — not your scope)
ASP.NET candidate APIs (not your scope)
```

---

## 3. Locked product rules (Python-relevant)

| ID | Rule |
|----|------|
| **CNE1** | Only propose values for keys listed in `allowedEmptyFields` |
| **CNE5** | Return proposals only — no auto-apply |
| **CNE6** | Same QG process/port |
| **CNE10** | Never modify or return a rewritten `rawNotes` |
| **CNE16** | **Reject** requests containing `apiFieldName: "techStacks"` (top-level independent tech stacks). **Allow** `work_experience_{i}_techStacks` and `work_experience_{i}_project_{j}_techStacks` |
| **CN16** | Notes blob is human source of truth — extract proposes only |

---

## 4. Request contract

### 4.1 HTTP

```http
POST /api/call-notes/extract
Content-Type: application/json
```

No auth header in v1 (matches `generate-questions`).

### 4.2 JSON body (canonical)

```json
{
  "rawNotes": "string — plain text from Cold Caller textarea",
  "candidateSnapshot": { "... optional — §4.4" },
  "allowedEmptyFields": [ { "... §4.3 — min 1 item" } ]
}
```

Property names are **camelCase** (match Next.js / TypeScript client).

### 4.3 `AllowedEmptyField` object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `fieldPath` | string | yes | FE apply path with **stable row ids** in brackets. Examples: `currentSalary`, `workExperiences[81].jobTitle`, `workExperiences[81].projects[15].techStacks`, `certifications[3].issuingBody` |
| `apiFieldName` | string | yes | QG key (same vocabulary as `fields_to_generate`). Examples: `currentSalary`, `work_experience_0_jobTitle`, `certification_0_name` |
| `fieldLabel` | string | yes | Human label for LLM context |
| `fieldType` | enum | yes | One of: `text`, `number`, `select`, `date`, `multiselect`, `benefits`, `boolean`, `textarea`, `combobox` |
| `context` | string | no | Disambiguation, e.g. `"Swipbox - Senior .NET Developer"` |
| `options` | `{value,label}[]` | no | Allowed enum values — **return `value` not `label`** |
| `requiresLookupResolution` | boolean | no | Hint only — return free-text name; FE resolves catalog id |

#### 4.3.1 `fieldPath` vs `apiFieldName`

- **`fieldPath`** — stable FE form path (uses DB row id strings in brackets). **Your response must echo the exact `fieldPath` from the matching whitelist row.**
- **`apiFieldName`** — QG indexed key (`work_experience_0_*` uses **collection index**, not DB id). Index `0` is synthetic for empty draft rows. **Echo exactly from request.**

Do **not** infer or remap between them. Match extractions to whitelist rows by **`fieldPath`** (primary) and echo **`apiFieldName`**.

### 4.4 `candidateSnapshot` (optional, disambiguation only)

```json
{
  "candidateId": "123",
  "linkedinUrl": null,
  "currentSalary": null,
  "expectedSalary": null,
  "techStacks": [".NET"],
  "hasResume": false,
  "workExperiences": [
    {
      "id": "81",
      "employerName": "Swipbox",
      "jobTitle": null,
      "projects": [{ "id": "15", "projectName": "Payments API" }]
    }
  ],
  "certifications": [{ "id": "3", "certificationName": null }],
  "achievements": [{ "id": "7", "name": null }]
}
```

| Rule | Detail |
|------|--------|
| Purpose | Help LLM attach values to the correct WE/project/cert row |
| `techStacks` on snapshot | **Context only** — **not** an extract target (CNE16) |
| Missing snapshot | Still valid — rely on `context` + `fieldPath` |
| Do **not** treat omitted snapshot fields as empty targets | Whitelist is sole target list |

### 4.5 Request validation (return `400` unless noted)

| # | Rule | HTTP |
|---|------|------|
| R1 | `rawNotes` missing or whitespace-only after `.strip()` | `400` |
| R2 | `allowedEmptyFields` missing or empty array | `400` |
| R3 | Duplicate `fieldPath` | `400` |
| R4 | Any `apiFieldName` not in extract allowlist (§6) | `400` |
| R5 | `apiFieldName` exactly `"techStacks"` | `400` |
| R6 | Any `education_*` key | `400` |
| R7 | `rawNotes` length > config `max_notes_length` (default 100000) | `400` |
| R8 | Pydantic shape errors | `422` |

Error body (minimum):

```json
{ "error": "Human-readable message", "detail": "Optional detail" }
```

---

## 5. Response contract

### 5.1 Success (`200`)

```json
{
  "extractions": [
    {
      "fieldPath": "currentSalary",
      "apiFieldName": "currentSalary",
      "value": 150000,
      "sourceText": "Current salary is 150000 PKR",
      "confidence": 0.94
    }
  ],
  "meta": {
    "model": "gpt-4.1",
    "processingMs": 4200
  }
}
```

| Property | Type | Required | Rules |
|----------|------|----------|-------|
| `extractions` | array | yes | May be empty `[]` |
| `extractions[].fieldPath` | string | yes | Must match a request whitelist `fieldPath` exactly |
| `extractions[].apiFieldName` | string | yes | Must echo matching whitelist row |
| `extractions[].value` | any | yes | Typed per §5.3 |
| `extractions[].sourceText` | string | yes | Verbatim snippet from `rawNotes`, max ~200 chars |
| `extractions[].confidence` | number | yes | `0.0`–`1.0`; only include if ≥ threshold (§7) |
| `meta` | object | no | `model`, `processingMs` recommended |

### 5.2 Response rules

1. Return **only** whitelist `fieldPath` values — never invent targets.  
2. **No duplicate** `fieldPath` in response.  
3. **Omit** rows below confidence threshold — do not return “low confidence” rows.  
4. **Never** return modified `rawNotes`.  
5. **Never** return catalog IDs — only primitives, enum values, string names for combobox.  
6. Empty extractions is success: `{ "extractions": [] }`.  
7. If LLM proposes a value not supported by notes evidence → omit row (do not guess).

### 5.3 Value typing (`value` must match whitelist `fieldType`)

| `fieldType` | JSON `value` shape | Post-process notes |
|-------------|-------------------|-------------------|
| `text`, `textarea` | string | Trim; non-empty |
| `number` | number | Integer for salaries; strip currency words in pre-parse |
| `date` | string | **`YYYY-MM-DD`** ISO date only |
| `boolean` | boolean | |
| `select` | string | Must be in `options[].value`; else **drop row** |
| `multiselect` | string[] | Each item non-empty; enum members must be in `options` when provided |
| `benefits` | object[] | `{ "name": string, "amount"?: number, "unit"?: string }` |
| `combobox` | string | Employer/project **name** as spoken — not id |

#### 5.3.1 Salary fields

| `apiFieldName` | Rule |
|----------------|------|
| `currentSalary`, `expectedSalary` | Integer PKR amount. Notes may say "150k" or "150000" — normalize to integer. |

#### 5.3.2 Tech stack fields (in scope)

| Pattern | Rule |
|---------|------|
| `work_experience_{i}_techStacks` | `string[]` — technology names |
| `work_experience_{i}_project_{j}_techStacks` | `string[]` |
| `techStacks` (exact, no prefix) | **Request rejected (CNE16)** — never in whitelist |

#### 5.3.3 Certification name key

| Whitelist `apiFieldName` suffix | Maps from QG |
|---------------------------------|--------------|
| `certification_{i}_name` | Certification name (payload key `certificationName` in QG sparse data) |

#### 5.3.4 `resume` field

Rarely whitelisted (only when candidate has no attached resume). If present:

- Return a **string hint** only (e.g. `"mentioned in call"` or URL if explicitly stated in notes).
- Do **not** imply file attachment.

---

## 6. Extract allowlist (`apiFieldName`)

**Source of truth:** [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md) §3, **minus CNE16**.

Implement validation as **pattern matching** (recommended) or shared module with QG allowlist.

### 6.1 Top-level keys (exact match)

```text
resume
linkedinUrl
currentSalary
expectedSalary
```

**Forbidden exact match:**

```text
techStacks          ← CNE16: reject request if present in allowedEmptyFields
```

### 6.2 Work experience role (pattern)

```text
work_experience_{i}_jobTitle
work_experience_{i}_startDate
work_experience_{i}_shiftType
work_experience_{i}_workMode
work_experience_{i}_techStacks
work_experience_{i}_timeSupportZones
work_experience_{i}_benefits
```

`{i}` = non-negative integer (0 = synthetic empty row).

**Not allowlisted:** `work_experience_{i}_endDate`

### 6.3 Work experience employer (pattern)

```text
work_experience_{i}_employerName
work_experience_{i}_headcount
work_experience_{i}_types
work_experience_{i}_foundedYear
work_experience_{i}_salaryPolicy
work_experience_{i}_status
work_experience_{i}_linkedinUrl
work_experience_{i}_office_{j}_country
work_experience_{i}_office_{j}_city
work_experience_{i}_office_{j}_address
work_experience_{i}_office_{j}_isHeadquarters
work_experience_{i}_layoff_{j}_layoffDate
work_experience_{i}_layoff_{j}_affectedEmployees
work_experience_{i}_layoff_{j}_reason
```

**Not allowlisted:** `awards`, `ranking`, `isDplCompetitor`, `tags`, layoff `source`

### 6.4 Nested project (pattern)

```text
work_experience_{i}_project_{j}_projectName
work_experience_{i}_project_{j}_employerName
work_experience_{i}_project_{j}_projectType
work_experience_{i}_project_{j}_startDate
work_experience_{i}_project_{j}_status
work_experience_{i}_project_{j}_description
work_experience_{i}_project_{j}_contributionNotes
work_experience_{i}_project_{j}_techStacks
work_experience_{i}_project_{j}_verticalDomains
work_experience_{i}_project_{j}_horizontalDomains
work_experience_{i}_project_{j}_technicalDomains
work_experience_{i}_project_{j}_technicalAspects
work_experience_{i}_project_{j}_averageTeamSize
work_experience_{i}_project_{j}_clientLocations
work_experience_{i}_project_{j}_latestUpdate
work_experience_{i}_project_{j}_endDate
```

**Not allowlisted:** `downloadCount`, `publishPlatforms`, `projectLink`, single `teamSize`, `notes`

Note: FE may omit `employerName` / `projectType` when parent WE already has employer (CNE14) — you only validate what is sent.

### 6.5 Certification row (pattern)

```text
certification_{i}_name
certification_{i}_issuingBody
certification_{i}_issueDate
certification_{i}_expiryDate
```

### 6.6 Achievement row (pattern)

```text
achievement_{i}_name
achievement_{i}_year
achievement_{i}_description
achievement_{i}_achievementType
achievement_{i}_ranking
achievement_{i}_url
```

**Forbidden suffix:** `achievement_{i}_type` (legacy)

### 6.7 Explicitly forbidden (reject if in whitelist)

```text
education_*
work_experiences
work_experience_{i}_projects
certifications          (collection opener)
achievements            (collection opener)
cnic
personalityType
```

---

## 7. Confidence threshold

| Setting | Default | Config key |
|---------|---------|------------|
| Minimum confidence to include row | **0.85** | `call_notes_extract.min_confidence` |

- FE does **not** apply a second threshold in v1.  
- Rows below threshold: **omit** (not returned with lower confidence).  
- Tune in eval; stricter for `select` / enum fields recommended.

---

## 8. Full worked example

### 8.1 Request

```json
{
  "rawNotes": "Current salary is 150000 PKR. At Swipbox he worked on .NET and Azure. Shift was morning, remote.",
  "candidateSnapshot": {
    "candidateId": "123",
    "workExperiences": [
      {
        "id": "81",
        "employerName": "Swipbox",
        "jobTitle": null,
        "projects": [{ "id": "15", "projectName": "Payments API" }]
      }
    ]
  },
  "allowedEmptyFields": [
    {
      "fieldPath": "currentSalary",
      "apiFieldName": "currentSalary",
      "fieldLabel": "Current Salary",
      "fieldType": "number"
    },
    {
      "fieldPath": "workExperiences[81].jobTitle",
      "apiFieldName": "work_experience_0_jobTitle",
      "fieldLabel": "Job Title",
      "fieldType": "text",
      "context": "Swipbox"
    },
    {
      "fieldPath": "workExperiences[81].shiftType",
      "apiFieldName": "work_experience_0_shiftType",
      "fieldLabel": "Shift Type",
      "fieldType": "select",
      "options": [
        { "value": "Morning", "label": "Morning" },
        { "value": "Evening", "label": "Evening" },
        { "value": "Night", "label": "Night" },
        { "value": "Rotational", "label": "Rotational" },
        { "value": "24x7", "label": "24x7" }
      ]
    },
    {
      "fieldPath": "workExperiences[81].workMode",
      "apiFieldName": "work_experience_0_workMode",
      "fieldLabel": "Work Mode",
      "fieldType": "select",
      "options": [
        { "value": "Remote", "label": "Remote" },
        { "value": "Onsite", "label": "Onsite" },
        { "value": "Hybrid", "label": "Hybrid" }
      ]
    },
    {
      "fieldPath": "workExperiences[81].techStacks",
      "apiFieldName": "work_experience_0_techStacks",
      "fieldLabel": "Tech Stacks",
      "fieldType": "multiselect",
      "context": "Swipbox"
    }
  ]
}
```

### 8.2 Response

```json
{
  "extractions": [
    {
      "fieldPath": "currentSalary",
      "apiFieldName": "currentSalary",
      "value": 150000,
      "sourceText": "Current salary is 150000 PKR",
      "confidence": 0.94
    },
    {
      "fieldPath": "workExperiences[81].shiftType",
      "apiFieldName": "work_experience_0_shiftType",
      "value": "Morning",
      "sourceText": "Shift was morning",
      "confidence": 0.88
    },
    {
      "fieldPath": "workExperiences[81].workMode",
      "apiFieldName": "work_experience_0_workMode",
      "value": "Remote",
      "sourceText": "remote",
      "confidence": 0.87
    },
    {
      "fieldPath": "workExperiences[81].techStacks",
      "apiFieldName": "work_experience_0_techStacks",
      "value": [".NET", "Azure"],
      "sourceText": "worked on .NET and Azure",
      "confidence": 0.91
    }
  ],
  "meta": {
    "model": "gpt-4.1",
    "processingMs": 4200
  }
}
```

Note: `jobTitle` omitted — not stated clearly enough (below threshold or no evidence). Valid partial response.

---

## 9. Implementation pipeline (required)

### Step 1 — Validate request (§4.5)

Fail fast with `400`/`422` before LLM call.

### Step 2 — Build LLM prompt

**System message (intent):**

- Extract **only** listed whitelist fields from notes.  
- Never invent fields not in the list.  
- Never rewrite or summarize the full notes.  
- Return JSON matching response schema.  
- Use `candidateSnapshot` + `context` to disambiguate rows.  
- If uncertain, omit the field (do not guess).  
- For enums, output exact `options[].value` strings.  
- Include verbatim `sourceText` substring supporting each value.

**User message content:**

1. `rawNotes` (full text)  
2. Numbered table of whitelist targets: `fieldPath`, `apiFieldName`, `fieldLabel`, `fieldType`, `context`, enum labels  
3. Optional compact `candidateSnapshot` JSON  

**Do not** reuse QG question-generation system prompts.

### Step 3 — LLM call

- Use same OpenAI client / model config as QG Advanced prompts.  
- Prefer **structured output** / JSON schema response format.  
- Timeout: config `timeout_seconds` (default **55**; Next.js proxy timeout **60s**).

### Step 4 — Post-process (deterministic)

For each LLM row:

1. Drop if `fieldPath` not in whitelist.  
2. Drop if `confidence` < threshold.  
3. Validate `value` type vs `fieldType`.  
4. For `select` / enum multiselect: drop if value ∉ `options[].value`.  
5. Normalize dates → `YYYY-MM-DD`.  
6. Coerce salaries → integer.  
7. Truncate `sourceText` to ~200 chars.  
8. Echo correct `apiFieldName` from whitelist row.  
9. Deduplicate by `fieldPath`.

### Step 5 — Return response

Include `meta.processingMs` and `meta.model`.

---

## 10. Error handling

| Case | HTTP | Body |
|------|------|------|
| Validation (§4.5) | `400` | `{ "error": "..." }` |
| Pydantic parse | `422` | FastAPI default or `{ "error": "..." }` |
| LLM timeout | `504` or `500` | `{ "error": "Call notes extract timed out" }` |
| LLM malformed JSON | `500` | `{ "error": "Failed to parse extract response" }` |
| Unexpected exception | `500` | `{ "error": "Internal extract error" }` |

### 10.1 Logging

| Log | Do | Do not |
|-----|-----|--------|
| `candidateId` | yes | |
| Whitelist count | yes | |
| Duration, model | yes | |
| Full `rawNotes` | | **no** (production) |
| PII from notes | | **no** |

---

## 11. Configuration (`config.yaml`)

```yaml
call_notes_extract:
  min_confidence: 0.85
  max_notes_length: 100000
  model: null              # null → fall back to OPENAI_MODEL
  timeout_seconds: 55
```

Reuse existing `OPENAI_API_KEY` / `OPENAI_MODEL` from QG config.

---

## 12. Required tests

Use **anonymized** fixture notes only.

| # | Test | Expected |
|---|------|----------|
| T1 | Happy path (§8) | `200`, typed extractions, valid enums |
| T2 | Empty `rawNotes` | `400` |
| T3 | Empty `allowedEmptyFields` | `400` |
| T4 | Duplicate `fieldPath` | `400` |
| T5 | Unknown `apiFieldName` | `400` |
| T6 | `apiFieldName: "techStacks"` | `400` |
| T7 | `education_0_degree` in whitelist | `400` |
| T8 | Enum value not in `options` | Row dropped; `200` with remaining rows or `[]` |
| T9 | Confidence 0.5 | Row omitted |
| T10 | No evidence for whitelisted field | Row omitted; `200` `[]` or partial ok |
| T11 | Two employers ambiguous | At most one WE row filled, or none |
| T12 | `work_experience_0_techStacks` in whitelist | `200` allowed (not CNE16) |

---

## 13. Suggested file layout (QG repo)

```text
question_generator.py          # register route
call_notes_extract/
  __init__.py
  models.py                    # Pydantic request/response
  allowlist.py                 # is_extract_api_field_allowed()
  service.py                   # orchestration
  postprocess.py               # enum/date/salary normalization
  prompts.py                   # system + user template
tests/
  test_call_notes_extract.py
```

Exact paths may follow existing QG repo conventions — adapt to match.

---

## 14. Definition of done

- [ ] `POST /api/call-notes/extract` registered on same FastAPI app  
- [ ] Request/response match §4–§5 exactly (camelCase JSON keys)  
- [ ] Allowlist validation §6 + CNE16 `techStacks` reject  
- [ ] Separate prompt module (not `generate-questions`)  
- [ ] Confidence gate §7  
- [ ] Post-process pipeline §9 step 4  
- [ ] Tests §12 pass  
- [ ] OpenAPI `/docs` shows endpoint with §8 example  
- [ ] No full `rawNotes` in production logs  
- [ ] Manual smoke: Next.js proxy → Python `:8002` returns `200`  

---

## 15. Coordination with Next.js repo (`rabzhitlist`)

Already shipped in frontend repo (do not re-implement there):

| Item | Status |
|------|--------|
| `POST /api/call-notes/extract` Next.js proxy | Shipped |
| Zod types `src/types/call-notes-extraction.ts` | Shipped |
| `buildCallNotesAllowedEmptyFields()` (QG allowlist − CNE16) | Shipped |
| Analyze Notes button + review modal | Shipped |
| Apply to Edit Mode / Create prefill | **Pending** (FE step 3) |

Local / EC2: ensure QG is reachable at `QUESTIONS_API_URL` (Next.js server; default `http://localhost:8002`). Analyze UI requires no env flag — always on when prerequisites pass.

---

## 16. Open items

None for v1 Python contract. If the QG repo uses different module layout, adapt §13 — behavior in §4–§12 is authoritative.
