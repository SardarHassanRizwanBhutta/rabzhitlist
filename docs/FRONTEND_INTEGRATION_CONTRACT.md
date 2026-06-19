# Frontend Integration Contract — Generate Questions API

This document is the **source of truth** for AI agents and engineers integrating the **Next.js frontend** (`http://localhost:3000`) with the **Python LLM Question Generation Service** (`http://localhost:8002`).

**Local testing pattern (confirmed):** direct browser `fetch` from Next.js → Python API. No Next.js route-handler proxy required for local dev.

**Candidate data (confirmed):** the production Next.js app uses a **different shape** than this repo’s `sample_candidates.py`. The frontend **must map** main-app candidate objects to the Python service shape **before** calling the API. See [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md) for payload mapping and **apiFieldName** keys returned in `field` / `missing_fields`.

---

## 1. Services & URLs (local)

| Service | URL | Purpose |
|---|---|---|
| Next.js frontend | `http://localhost:3000` | Production UI under development |
| Python LLM API | `http://localhost:8002` | Question generation |
| API health | `GET http://localhost:8002/health` | Liveness check |
| OpenAPI docs | `GET http://localhost:8002/docs` | Interactive Swagger UI |
| Demo HTML (optional) | `http://localhost:8000/candidates_table.html` | Legacy prototype in this repo |

### Start the Python API locally

From the repo root:

```bash
pip install -r requirements.txt
# Create config.yaml from config.example.yaml and set OPENAI_API_KEY
python question_generator.py
# OR run API + demo static server together:
python run_servers.py
```

### Frontend environment variable

In the Next.js app (`.env.local`):

```bash
NEXT_PUBLIC_QUESTIONS_API_URL=http://localhost:8002
```

Reference: [.env.frontend.example](../.env.frontend.example)

---

## 2. API endpoints

### 2.1 `POST /api/generate-questions`

Generates cold-call questions for **missing** candidate fields, grouped into **7 sections**.

**Request headers**

```
Content-Type: application/json
```

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `candidate_id` | `string` | Yes | Stable candidate identifier from your app |
| `candidate_data` | `object` | Yes | Full candidate profile in **Python service shape** (after mapping) |
| `conversation_context` | `string` | No | Default: `"cold_call"` |
| `missing_fields` | `string[]` | No | **Ignored by the server.** Missing fields are computed server-side. Do not rely on sending this. |

**Example request**

```json
{
  "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidate_data": {
    "name": "Umais Rasheed",
    "email": null,
    "mobileNo": null,
    "workExperiences": [],
    "techStacks": ["TypeScript"],
    "projects": [],
    "educations": [],
    "certifications": [],
    "achievements": []
  },
  "conversation_context": "cold_call"
}
```

**Success response `200`**

| Field | Type | Description |
|---|---|---|
| `sections` | `SectionResult[]` | Always **7 entries**, one per section (see below) |
| `generated_at` | `string` (ISO datetime) | Server timestamp |
| `candidate_id` | `string` | Echo of request `candidate_id` |
| `total_questions` | `number` | Sum of questions across all sections |

**`SectionResult`**

| Field | Type | Description |
|---|---|---|
| `section` | `QuestionSectionId` | Machine id (snake_case) |
| `label` | `string` | Human label for UI tabs |
| `missing_fields` | `string[]` | Missing field keys for this section, **sorted by priority (high → low)** |
| `questions` | `GeneratedQuestion[]` | LLM questions, **sorted by priority (high → low)** |

**`GeneratedQuestion`**

| Field | Type | Description |
|---|---|---|
| `question` | `string` | Question text for the cold caller |
| `field` | `string` | Missing field key this question targets |
| `section` | `QuestionSectionId` | Section id |
| `priority` | `number` | **Server-assigned** weight (higher = ask first within tab). Not LLM-authored. |
| `context` | `string` | Interviewer guidance from LLM |

**`QuestionSectionId` (fixed order)**

1. `basic_information`
2. `work_experience`
3. `independent_tech_stacks`
4. `independent_projects`
5. `education`
6. `certifications`
7. `achievements`

**Example response (abbreviated)**

```json
{
  "sections": [
    {
      "section": "basic_information",
      "label": "Basic Information",
      "missing_fields": ["currentSalary", "email", "mobileNo"],
      "questions": [
        {
          "question": "Could you share your current compensation?",
          "field": "currentSalary",
          "section": "basic_information",
          "priority": 1,
          "context": "Ask naturally after rapport."
        }
      ]
    }
  ],
  "generated_at": "2026-06-18T12:00:00",
  "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_questions": 12
}
```

**Error responses**

| Status | When |
|---|---|
| `422` | Invalid JSON / Pydantic validation failure |
| `500` | OpenAI error, config error, or unhandled server error (`detail` string in body) |

### 2.2 `GET /health`

```json
{
  "status": "healthy",
  "model": "gpt-4.1"
}
```

Use before showing “Generate Questions” or on app load to verify the Python service is up.

---

## 3. TypeScript types (frontend)

Copy into the Next.js codebase (e.g. `types/question-generation.ts`):

```typescript
export type QuestionSectionId =
  | 'basic_information'
  | 'work_experience'
  | 'independent_tech_stacks'
  | 'independent_projects'
  | 'education'
  | 'certifications'
  | 'achievements';

export interface GenerateQuestionsRequest {
  candidate_id: string;
  candidate_data: CandidateDataForQuestionService;
  conversation_context?: 'cold_call' | string;
}

export interface GeneratedQuestion {
  question: string;
  field: string;
  section: QuestionSectionId;
  priority: number;
  context: string;
}

export interface SectionQuestionResult {
  section: QuestionSectionId;
  label: string;
  missing_fields: string[];
  questions: GeneratedQuestion[];
}

export interface GenerateQuestionsResponse {
  sections: SectionQuestionResult[];
  generated_at: string;
  candidate_id: string;
  total_questions: number;
}

// See CANDIDATE_DATA_MAPPING.md — map from your main app type to this shape.
export interface CandidateDataForQuestionService {
  name?: string | null;
  postingTitle?: string | null;
  email?: string | null;
  mobileNo?: string | null;
  cnic?: string | null;
  city?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  resume?: string | null;
  currentSalary?: number | null;
  expectedSalary?: number | null;
  source?: string | null;
  personalityType?: string | null;
  isTopDeveloper?: boolean | null;
  techStacks?: string[];
  projects?: StandaloneProject[];
  workExperiences?: WorkExperience[];
  educations?: Education[];
  certifications?: Certification[];
  achievements?: Achievement[];
}

export interface WorkExperience {
  employerName?: string | null;
  jobTitle?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  techStacks?: string[];
  shiftType?: string | null;
  workMode?: string | null;
  timeSupportZones?: string[];
  benefits?: Benefit[];
  projects?: WorkExperienceProject[];
}

export interface WorkExperienceProject {
  projectName?: string | null;
  contributionNotes?: string | null;
}

export interface StandaloneProject {
  projectName?: string | null;
  contributionNotes?: string | null;
}

export interface Education {
  universityLocationName?: string | null;
  degreeName?: string | null;
  majorName?: string | null;
  startMonth?: string | null;
  endMonth?: string | null;
  grades?: string | null;
  isTopper?: boolean | null;
  isCheetah?: boolean | null;
}

export interface Certification {
  certificationName?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  certificationUrl?: string | null;
  certificationLevel?: string | null;
}

export type AchievementType =
  | 'competition'
  | 'openSource'
  | 'award'
  | 'medal'
  | 'publication'
  | 'certification'
  | 'recognition'
  | 'other';

export interface Achievement {
  name?: string | null;
  achievementType?: AchievementType | null;
  type?: number | null; // API DTO: 0–7 maps to achievementType if achievementType omitted
  ranking?: string | null;
  year?: number | null;
  url?: string | null;
  description?: string | null;
}

export interface Benefit {
  name?: string;
  amount?: number | null;
  unit?: string | null;
}
```

---

## 4. Client implementation rules

### 4.1 API client function

```typescript
const API_BASE = process.env.NEXT_PUBLIC_QUESTIONS_API_URL ?? 'http://localhost:8002';

export async function generateQuestions(
  candidateId: string,
  candidateData: CandidateDataForQuestionService,
): Promise<GenerateQuestionsResponse> {
  const response = await fetch(`${API_BASE}/api/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: candidateId,
      candidate_data: candidateData,
      conversation_context: 'cold_call',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Generate questions failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}
```

### 4.2 Mapping layer (required)

1. Load candidate from **main app API/state**.
2. Run `mapMainAppCandidateToQuestionService(candidate)` → `CandidateDataForQuestionService`.
3. POST mapped object as `candidate_data`.

Do **not** send the main-app shape directly unless it already matches `CandidateDataForQuestionService`. Fill in [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md).

### 4.3 UI — Generate Questions modal

Implement a **7-tab** modal matching section ids:

| Tab label | `section` id |
|---|---|
| Basic Information | `basic_information` |
| Work Experience | `work_experience` |
| Independent Tech Stacks | `independent_tech_stacks` |
| Independent Projects | `independent_projects` |
| Education | `education` |
| Certifications | `certifications` |
| Achievements | `achievements` |

**Per tab:**

- If `missing_fields.length === 0` → show **“Section complete”** (no missing fields).
- Else show:
  - Missing fields list (already priority-sorted by API)
  - Numbered questions list (already priority-sorted by API)
  - Each question: **bold** question text, gray `context` line, small `field` label
- Tab badge (optional): `missing_fields.length` when > 0

**Header summary:**

- `total_questions`
- Sum of `missing_fields` across sections

**Loading state:** show spinner while `POST` is in flight (LLM call may take several seconds).

**Error state:** show message + retry button; display `error.message`.

**Empty profile:** if every section is complete, still show all 7 tabs with “Section complete”.

### 4.4 Display order

- Trust **`priority` from the API** for question order within each tab.
- Do **not** re-sort by LLM’s internal ordering; server overwrites priority from configured weights.
- Optional: secondary sort by `field` name when priorities tie.

### 4.5 Dates and serialization

- Send dates as **ISO 8601 strings** in JSON (e.g. `"2021-07-01T00:00:00.000Z"`).
- `null` = missing; `""` = missing; `[]` = missing for arrays.

### 4.6 CORS (local)

Python service allows all origins (`*`) with credentials disabled. Browser calls from `localhost:3000` → `localhost:8002` work without a Next.js proxy.

---

## 5. Missing-field detection (server-side)

The Python service decides what is “missing.” Frontend **must not** duplicate this logic for gating the API call — always call the API and render the response.

### 5.1 What counts as missing

- `null`, `""`, or `[]` → missing

### 5.2 Section rules (summary)

**Basic Information** — top-level fields:  
`name`, `postingTitle`, `email`, `mobileNo`, `cnic`, `city`, `githubUrl`, `linkedinUrl`, `resume`, `currentSalary`, `expectedSalary`, `source`, `personalityType`, `isTopDeveloper`

**Work Experience**

- No roles → `work_experiences` plus synthetic `work_experience_0_*` keys (13 keys total, including nested `work_experience_0_project_0_*`). See [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md).
- Per role: `employerName`, `jobTitle`, `startDate`, `endDate`, `techStacks`, `shiftType`, `workMode`, `timeSupportZones`, `benefits`, `projects`
- `endDate` null is **allowed** only for the **current role** (first experience with `endDate: null`)
- Per role project rows: `projectName`, `contributionNotes` → keys like `work_experience_0_project_1_contributionNotes`

**Independent Tech Stacks** — top-level `techStacks` array

**Independent Projects** — top-level `projects` array (not work-experience nested projects). When `projects[]` is empty, server also emits synthetic `project_0_*` keys plus section key `projects` (3 keys total). See [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md).

**Education** — `educations` array or per-entry fields. When `educations[]` is empty, server also emits synthetic `education_0_*` keys plus section key `educations` (9 keys total, including `endMonth`). For `universityLocationName`, questions ask **university name only** (not campus/city). See [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md).

**Certifications** — `certifications` array or per-entry payload fields (`certificationName`, `certificationLevel`, …). **Response keys:** `certification_{i}_name`, `certification_{i}_level`, `certification_{i}_url`, etc. When `certifications[]` is empty, server also emits synthetic `certification_0_*` keys plus section key `certifications` (6 keys total). Level values: Foundation, Associate, Professional, Expert, Master. See [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md).

**Achievements** — `achievements` array or per-entry payload fields. **Response keys:** `achievement_{i}_name`, `achievement_{i}_type`, … (not `achievementType`). When `achievements[]` is empty, server also emits synthetic `achievement_0_*` keys plus section key `achievements` (7 keys total). See [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md).

### 5.3 Achievement `type` mapping (numeric DTO)

If `achievementType` string is absent, server reads `type: number`:

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

## 6. Priority weights (display order within each tab)

Priorities are **computed on the server** from static weight tables in `question_generator.py`. The LLM does **not** control final ordering.

Weights with **0** still generate questions when missing but sort **last** within the tab.

### Basic Information (total weight scale 10)

| Field | Weight |
|---|---|
| `isTopDeveloper` | 2 |
| `currentSalary`, `expectedSalary`, `mobileNo`, `email`, `linkedinUrl`, `resume` | 1 each |
| `name`, `city`, `cnic`, `personalityType` | 0.5 each |
| `postingTitle`, `githubUrl`, `source` | 0 |

### Work Experience (total scale 55)

| Field | Weight |
|---|---|
| `work_experiences` (empty section) | 55 |
| `techStacks` | 10 |
| `benefits` | 7 |
| `employerName` | 5 |
| `projects` (empty list on role) | 22 |
| `contributionNotes` (nested project) | 17.6 |
| `projectName` (nested project) | 4.4 |
| `jobTitle` | 2 |
| `startDate`, `endDate` | 2.5 each |
| `shiftType` | 2 |
| `workMode`, `timeSupportZones` | 1 each |

### Independent Tech Stacks (5)

| Field | Weight |
|---|---|
| `techStacks` | 5 |

### Independent Projects (5)

| Field | Weight |
|---|---|
| `projects` (empty section) | 5 |
| `contributionNotes` | 4 |
| `projectName` | 1 |

### Education (6)

| Field | Weight |
|---|---|
| `educations` (empty section) | 6 |
| `isCheetah` | 3 |
| `startMonth`, `grades`, `isTopper` | 1 each |
| `universityLocationName`, `degreeName`, `majorName`, `endMonth` | 0 |

### Certifications (9)

| Field | Weight |
|---|---|
| `certifications` (empty section) | 9 |
| `url` (apiFieldName; payload `certificationUrl`) | 4 |
| `level` (apiFieldName; payload `certificationLevel`) | 2 |
| `name`, `issueDate`, `expiryDate` | 1 each |

### Achievements (5)

| Field | Weight |
|---|---|
| `achievements` (empty section) | 5 |
| `name`, `type`, `ranking`, `year`, `url` | 1 each |
| `description` | 0 |

---

## 7. What the LLM receives (for debugging)

Single OpenAI call per request. The server sends:

- **System prompt:** JSON output schema + conversational rules
- **User prompt:** candidate name, `conversation_context`, **missing fields by section** (JSON), and a **short summary** (counts only — not full profile)

The LLM returns question text and `context`. **Priority in LLM JSON is discarded**; server assigns weights from section 6.

---

## 8. Agent checklist (frontend integration)

- [ ] Add `NEXT_PUBLIC_QUESTIONS_API_URL=http://localhost:8002` to `.env.local`
- [ ] Implement `mapMainAppCandidateToQuestionService` (see mapping doc)
- [ ] Implement `generateQuestions()` client
- [ ] Build 7-tab modal per section 4.3
- [ ] Handle loading / error / retry
- [ ] Verify health: `GET /health`
- [ ] Manual test with candidate missing email, salary, benefits (see `sample_candidates.py` id `"1"`)
- [ ] Do **not** commit API keys; Python service reads `config.yaml` / env

---

## 9. Out of scope (local testing)

- Authentication on the Python API
- Next.js API route proxy
- AWS Amplify / production deployment
- Rate limiting

Document production hardening separately when deploying the Python service off localhost.

---

## 10. Reference implementation

| Artifact | Location |
|---|---|
| Python API | `question_generator.py` |
| Demo UI (7-tab modal) | `candidates_table.html` |
| Sample candidate payloads | `sample_candidates.py` |
| Mapping worksheet | `docs/CANDIDATE_DATA_MAPPING.md` |
| Frontend env example | `.env.frontend.example` |

When in doubt, treat **`question_generator.py`** and this contract as authoritative over `README.md` or older chat logs.
