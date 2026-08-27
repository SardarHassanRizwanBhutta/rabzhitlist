# Call Notes Extract — API Contract

**Status:** Locked (2026-08-04). Updated 2026-08-27 — FE must whitelist empty WE `salaryPolicy`.  
**Audience:** Next.js proxy, frontend client, Python QG service.  
**QG agent contract:** [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md)  
**Product spec:** [`CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md)  
**Field keys:** [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)

---

## 1. Architecture

```text
Browser (Cold Caller)
    ↓  POST /api/call-notes/extract  (same-origin)
Next.js route (server)
    ↓  POST {QUESTIONS_API_URL}/api/call-notes/extract
Python QG FastAPI (:8002)
    ↓  JSON extractions[]
Browser review modal → Apply Selected → Edit Mode / Create prefill
    ↓  Update & Verify / POST /api/candidates (+ optional callNotes)
ASP.NET Candidate APIs
```

- The browser **must not** call Python directly.  
- Extract shares the **same base URL** as question generation: `QUESTIONS_API_URL` (server) / `NEXT_PUBLIC_QUESTIONS_API_URL` (browser health checks only). Default `http://localhost:8002`.  
- Extract is **stateless**: no DB writes on Python or Next proxy.

---

## 2. Endpoints

| Layer | Method | Path |
|-------|--------|------|
| Next.js (public to browser) | `POST` | `/api/call-notes/extract` |
| Python QG service | `POST` | `/api/call-notes/extract` |

---

## 3. Request (browser → Next.js)

### 3.1 Headers

```http
Content-Type: application/json
```

No browser auth beyond existing app session (same as other Next API routes).

### 3.2 Body

```ts
interface CallNotesExtractRequest {
  /** Plain-text call notes from the textarea at Analyze time. Not persisted by this route. */
  rawNotes: string

  /**
   * Candidate context for disambiguation only. Python must not treat omitted
   * populated properties as empty extraction targets.
   */
  candidateSnapshot?: CallNotesExtractCandidateSnapshot

  /**
   * Only currently empty, QG-allowlisted fields. Authoritative whitelist.
   * Extract must not return paths outside this list.
   */
  allowedEmptyFields: AllowedEmptyField[]
}
```

```ts
interface CallNotesExtractCandidateSnapshot {
  candidateId?: string | null
  linkedinUrl?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  /** Optional disambiguation context only — not an extract target in v1 (CNE16). */
  techStacks?: string[]
  workExperiences?: CallNotesExtractWorkExperienceSnapshot[]
  certifications?: CallNotesExtractCertificationSnapshot[]
  achievements?: CallNotesExtractAchievementSnapshot[]
  hasResume?: boolean
}

interface CallNotesExtractWorkExperienceSnapshot {
  /** Stable id string from Candidate API (`WorkExperience.id`) or "0" for synthetic draft row */
  id: string
  employerName?: string | null
  jobTitle?: string | null
  projects?: Array<{ id: string; projectName?: string | null }>
}

interface CallNotesExtractCertificationSnapshot {
  id: string
  certificationName?: string | null
}

interface CallNotesExtractAchievementSnapshot {
  id: string
  name?: string | null
}
```

### 3.3 `AllowedEmptyField`

Each entry describes one empty target the recruiter may fill.

```ts
interface AllowedEmptyField {
  /**
   * FE apply path. Must uniquely identify the target in Edit Mode / Create form.
   * Examples:
   *   "currentSalary"
   *   "linkedinUrl"
   *   "workExperiences[42].jobTitle"
   *   "workExperiences[42].projects[7].techStacks"
   *   "workExperiences[0].employerName"   // synthetic draft row
   *   "certifications[3].issuingBody"
   */
  fieldPath: string

  /**
   * QG-style api key (same vocabulary as `fields_to_generate`).
   * Example: "work_experience_0_jobTitle", "certification_0_issuingBody"
   */
  apiFieldName: string

  /** Human label for review UI */
  fieldLabel: string

  /** FE field typing for apply + lookup resolution */
  fieldType:
    | "text"
    | "number"
    | "select"
    | "date"
    | "multiselect"
    | "benefits"
    | "boolean"
    | "textarea"
    | "combobox"

  /** Optional disambiguation, e.g. "Swipbox - Senior .NET Developer" */
  context?: string

  /** For enum/select/multiselect — allowed DB/display values */
  options?: Array<{ value: string; label: string }>

  /** When true, Apply must resolve to a catalog id before writing (employer, project, etc.) */
  requiresLookupResolution?: boolean
}
```

**Benefits rows:** omit `options`. The benefit catalog is dynamic and can be large; extract returns **spoken names** from notes (same free-text pattern as `combobox`). FE resolves or creates catalog rows on Apply via `GET /api/benefits` — not during extract.

### 3.4 Validation (Next.js — reject before proxy)

| Rule | HTTP |
|------|------|
| `rawNotes` missing or whitespace-only after trim | `400` |
| `allowedEmptyFields` missing or empty array | `400` |
| Duplicate `fieldPath` | `400` |
| Any `apiFieldName` not in QG allowlist | `400` |
| `apiFieldName` exactly `techStacks` (top-level independent — CNE16) | `400` |
| `rawNotes` length over server max (define in env, e.g. 100_000 chars) | `413` or `400` |

---

## 4. Request (Next.js → Python)

Same JSON body as §3.2. Next.js forwards unchanged (optionally strip unknown top-level keys).

Optional future: internal service key header if QG adds auth — **not required in v1** (matches current `generate-questions` proxy).

---

## 5. Response (success)

### 5.1 Shape

```ts
interface CallNotesExtractResponse {
  extractions: CallNotesExtraction[]
  /** Echo for debugging; optional metadata */
  meta?: {
    model?: string
    processingMs?: number
  }
}
```

```ts
interface CallNotesExtraction {
  /** Must exactly match a request `allowedEmptyFields[].fieldPath` */
  fieldPath: string

  /** Echo of request apiFieldName */
  apiFieldName: string

  /**
   * Typed proposed value. Shape must match fieldType / ASP.NET expectations.
   * Python returns canonical enum **values** (DB codes), not display labels.
   */
  value: unknown

  /** Short verbatim snippet from rawNotes supporting this proposal */
  sourceText: string

  /**
   * Model confidence 0–1. Python applies service threshold before returning;
   * FE displays only — no second threshold in v1.
   */
  confidence: number
}
```

### 5.2 Python response rules

1. Return **only** `fieldPath` values present in `allowedEmptyFields`.  
2. Return **high-confidence only** (threshold owned by Python — document in Python handoff).  
3. **No** extractions for ambiguous targets when confidence is below threshold — omit row, do not return low-confidence rows.  
4. **No** duplicate `fieldPath`.  
5. Empty result `extractions: []` is valid → FE shows “no high-confidence mappings” state.  
6. Do **not** return modified `rawNotes`.  
7. Do **not** return lookup IDs — only primitive / enum / string[] values FE can resolve.

### 5.3 Value typing by field class

| fieldType | JSON value shape |
|-----------|------------------|
| `text`, `textarea` | `string` |
| `number` | `number` |
| `date` | ISO date string `YYYY-MM-DD` |
| `boolean` | `boolean` |
| `select` | `string` (enum value from `options`) |
| `multiselect` | `string[]` |
| `benefits` | array of `{ name: string; amount?: number; unit?: string }` — **free-text names** from notes; no catalog `options` on whitelist |
| `combobox` | `string` (free-text name — FE resolves to catalog id) |

---

## 6. Error responses

### 6.1 Next.js proxy

| Status | When |
|--------|------|
| `400` | Client validation failed (§3.4) |
| `502` | Python unreachable or non-JSON body |
| `504` | Upstream timeout (recommend 60s proxy timeout) |
| `503` | `QUESTIONS_API_URL` not configured |

Error body (minimum):

```json
{
  "error": "Human-readable message",
  "detail": "Optional technical detail"
}
```

Pass through Python `4xx`/`5xx` when body is JSON; map upstream `5xx` to `502` for browser when appropriate.

### 6.2 Python service

| Status | When |
|--------|------|
| `400` | Malformed JSON, empty whitelist, invalid apiFieldName |
| `422` | Pydantic validation failure |
| `500` | LLM / internal failure |

---

## 7. Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `QUESTIONS_API_URL` | Next.js server | Python base URL (same as generate-questions proxy) |
| `NEXT_PUBLIC_QUESTIONS_API_URL` | Browser | Optional health / dev only |
| `CALL_NOTES_EXTRACT_MAX_NOTES_LENGTH` | Next.js server | Optional; default e.g. `100000` |
| `CALL_NOTES_EXTRACT_TIMEOUT_MS` | Next.js server | Optional; default e.g. `60000` |

---

## 8. Example

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
        { "value": "Evening", "label": "Evening" }
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

### 8.3 Benefits (work experience role)

Notes that mention employer benefits for a linked work experience. Whitelist row uses `fieldType: "benefits"` **without** `options` (catalog is resolved on FE Apply, not in extract).

**Request (excerpt)**

```json
{
  "rawNotes": "At dpl, the benefits are car fuel and paid leaves",
  "candidateSnapshot": {
    "candidateId": "71",
    "workExperiences": [
      {
        "id": "15",
        "employerName": "DPL-IT (Pvt Ltd.)",
        "jobTitle": "Full Stack Developer",
        "projects": [
          { "id": "proj-0", "projectName": "Rabz Hit List" },
          {
            "id": "proj-1",
            "projectName": "Balochistan Board of Revenue – Land Records Digitization & Agriculture Income Tax Management System"
          }
        ]
      }
    ]
  },
  "allowedEmptyFields": [
    {
      "fieldPath": "workExperiences[15].benefits",
      "apiFieldName": "work_experience_0_benefits",
      "fieldLabel": "Benefits",
      "fieldType": "benefits",
      "context": "DPL-IT (Pvt Ltd.) - Full Stack Developer"
    }
  ]
}
```

**Response**

```json
{
  "extractions": [
    {
      "fieldPath": "workExperiences[15].benefits",
      "apiFieldName": "work_experience_0_benefits",
      "value": [
        { "name": "Car Fuel" },
        { "name": "Paid Leaves" }
      ],
      "sourceText": "benefits are car fuel and paid leaves",
      "confidence": 0.92
    }
  ],
  "meta": {
    "model": "gpt-4.1",
    "processingMs": 2400
  }
}
```

**Rules**

- Return **one object per benefit**; split compound phrases (`"car fuel and paid leaves"` → two rows).
- `amount` and `unit` are optional; include only when explicitly stated in notes.
- Do **not** require benefit names to match a catalog list at extract time.
- Match `fieldPath` exactly from the whitelist row; echo `apiFieldName` from the request.

---

## 9. Building `allowedEmptyFields` (FE responsibility)

1. Start from catalog-enriched candidate (same as Cold Caller QG).  
2. Filter `getEmptyFields()` (or QG missing-only builder) to **QG allowlist** keys only.  
3. Drop fields excluded by CNE14 / CNE15 / **CNE16** (top-level `techStacks` only).  
4. Map each `EmptyField` to `AllowedEmptyField` (`fieldPath`, `apiFieldName`, `fieldLabel`, `fieldType`, `context`, `options`).  
5. **Do not** attach `options` for `fieldType: "benefits"` (dynamic catalog; see §3.3).  
6. For saved rows, use **stable** `WorkExperience.id` / project `id` in `fieldPath` brackets.  
7. For empty collections, use synthetic `[0]` paths and `work_experience_0_*` api keys.  
8. Reject Analyze when resulting list is empty.  
9. **WE `salaryPolicy`:** when empty, include `fieldType: "select"` with options from `SALARY_POLICY_DB_LABELS` (e.g. `"Gross Salary"`). `apiFieldName` is `work_experience_{i}_salaryPolicy`. Python only extracts fields present in this list — omitting the row drops salary policy even when notes mention it.

---

## 10. Apply semantics (FE — not this HTTP route)

Apply Selected is **client-side only**:

1. For each accepted extraction, re-verify target is still empty.  
2. Resolve combobox / catalog fields via existing employer/project APIs.  
3. Write into react-hook-form / Create prefill state.  
4. Persist via Update & Verify or POST create — **not** via extract route.

### 10.1 Benefits after Apply

Extract returns **spoken benefit names** only (§8.3). On **save** (create/update candidate):

| Step | Rule |
|------|------|
| Name on form | From extraction apply — `{ name, amount?, unit? }` rows on the work experience |
| Catalog match | Case-insensitive match against `GET /api/benefits` by **exact name** (after trim) |
| No match | **Create** a new benefit via `POST /api/benefits` with that name, then link on the WE |
| No fuzzy link | Do **not** map `"Car Fuel"` → `"Fuel Allowance"` unless names match (case-insensitive) |

This mirrors manual **+ Add** in the benefits picker: new catalog rows are allowed; extract does not send benefit `options` (§3.3).

## 11. Versioning

- v1 path: `/api/call-notes/extract` (no version prefix).  
- Breaking changes require a new doc revision and coordinated FE/Python deploy.

---

## 12. Checklist

### Next.js proxy

- [ ] `POST /api/call-notes/extract` route  
- [ ] Zod validation for request/response  
- [ ] Proxy to `{QUESTIONS_API_URL}/api/call-notes/extract`  
- [ ] Timeout + no notes in logs  
- [ ] `400` when whitelist empty  

### Python

- [ ] Route registered on same FastAPI app as QG  
- [ ] Pydantic models mirror §3–§5  
- [ ] High-confidence filter  
- [ ] Tests: empty notes rejected upstream; empty extractions valid  

### Frontend client

- [ ] `extractCallNotes()` → same-origin POST only  
- [ ] Types in `src/types/call-notes-extraction.ts` (suggested)
