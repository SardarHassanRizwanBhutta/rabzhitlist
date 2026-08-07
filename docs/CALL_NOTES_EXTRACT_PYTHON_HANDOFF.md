# Call Notes Extract — Python QG Service Handoff

**Status:** Locked (2026-08-04). Updated 2026-08-05 — see detailed agent contract.  
**Audience:** Python / FastAPI agent maintaining the Question Generation service (`:8002`).  
**Primary agent contract (detailed):** [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md)  
**Product spec:** [`CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md)  
**API contract:** [`CALL_NOTES_EXTRACT_API_CONTRACT.md`](./CALL_NOTES_EXTRACT_API_CONTRACT.md)  
**Shared field vocabulary:** [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)

---

## 1. Goal

Add **`POST /api/call-notes/extract`** to the **existing** FastAPI application that serves **`POST /api/generate-questions`**. Same process, port (`8002`), config (`config.yaml`, `OPENAI_API_KEY`), deployment, and logging conventions.

This endpoint **reads unstructured call notes** and returns **high-confidence structured field proposals** for keys explicitly listed in `allowedEmptyFields`. It does **not** generate recruiter questions and does **not** write to any database.

---

## 2. Non-goals (v1)

| Non-goal | Reason |
|----------|--------|
| Persist candidate or notes | ASP.NET + FE responsibility |
| Create employer/project catalog rows | FE lookup resolution |
| Resolve stable IDs from natural language | FE sends `fieldPath` + snapshot |
| Overwrite populated fields | Not in whitelist |
| Modify / summarize / rewrite `rawNotes` | CN16 / CNE10 |
| Return education / non-allowlist keys | Locked scope |
| Top-level independent `techStacks` / `independent_tech_stacks` | CNE16 — hidden in Call Notes UI |
| Emit QG `questions[]` or `fields_to_generate` | Separate capability |

---

## 3. Endpoint

```http
POST /api/call-notes/extract
Content-Type: application/json
```

Register on the **same** `app` instance as `/api/generate-questions` and `/health`.

---

## 4. Request model (Pydantic)

Mirror [`CALL_NOTES_EXTRACT_API_CONTRACT.md`](./CALL_NOTES_EXTRACT_API_CONTRACT.md) §3.

```python
class AllowedEmptyField(BaseModel):
    fieldPath: str
    apiFieldName: str
    fieldLabel: str
    fieldType: Literal[
        "text", "number", "select", "date", "multiselect",
        "benefits", "boolean", "textarea", "combobox",
    ]
    context: str | None = None
    options: list[FieldOption] | None = None
    requiresLookupResolution: bool | None = None

class CallNotesExtractRequest(BaseModel):
    rawNotes: str
    candidateSnapshot: CallNotesExtractCandidateSnapshot | None = None
    allowedEmptyFields: list[AllowedEmptyField]
```

### 4.1 Validation

| Rule | Response |
|------|----------|
| `rawNotes.strip()` empty | `400` |
| `allowedEmptyFields` empty | `400` |
| Duplicate `fieldPath` | `400` |
| Unknown `apiFieldName` (not in QG allowlist) | `400` |
| `education_*` or forbidden keys | `400` |

Reuse or import the **same allowlist set** maintained for QG `fields_to_generate` validation.

---

## 5. Response model

```python
class CallNotesExtraction(BaseModel):
    fieldPath: str
    apiFieldName: str
    value: Any
    sourceText: str
    confidence: float  # 0.0 – 1.0

class CallNotesExtractResponse(BaseModel):
    extractions: list[CallNotesExtraction]
    meta: CallNotesExtractMeta | None = None
```

### 5.1 Response rules

1. **`fieldPath`** must be copied from request whitelist only.  
2. **`apiFieldName`** must echo request entry.  
3. **`value`** type must match `fieldType` (see API contract §5.3).  
4. **`sourceText`** — short substring of `rawNotes` (≤ ~200 chars).  
5. **`confidence`** — float; apply **server-side threshold** before inclusion.  
6. Omit extractions below threshold (do not return “low confidence” rows to FE).  
7. Valid empty list: `{"extractions": []}`.

---

## 6. Confidence threshold

| Setting | Recommendation |
|---------|----------------|
| Default minimum confidence | **`0.85`** (document in `config.yaml` as `call_notes_extract_min_confidence`) |
| FE threshold | **None in v1** — Python is sole gate |

Tune per field type in eval notebooks; stricter for enums, slightly lower for free-text only if product approves in a later revision.

---

## 7. LLM pipeline (suggested)

### 7.1 High-level steps

1. Validate request.  
2. Build compact prompt context:  
   - `rawNotes`  
   - numbered list of allowed targets (`fieldLabel`, `apiFieldName`, `fieldType`, `context`, enum labels from `options`)  
   - optional `candidateSnapshot` for disambiguation (employer names, existing WE rows)  
3. Call structured-output LLM (same client as QG advanced prompts).  
4. Parse JSON array of candidate extractions.  
5. Post-process:  
   - Drop rows not in whitelist  
   - Validate enum values ∈ `options[].value`  
   - Normalize dates to `YYYY-MM-DD`  
   - Coerce salary strings to numbers  
   - Attach `sourceText` via span alignment or model citation  
   - Filter by confidence threshold  
6. Return response.

### 7.2 Reuse from QG stack

| Asset | Reuse |
|-------|--------|
| OpenAI client / model config | Yes |
| Enum label maps (shift, work mode, project status, domains, etc.) | Yes — same DB values as QG |
| Field suffix → semantics map | Share with QG allowlist module |
| FastAPI app, CORS, `/health` | Yes |
| Question prompt templates | **No** — separate extract prompt module |

### 7.3 Separate prompt module

Create e.g. `call_notes_extract.py` or `prompts/call_notes_extract.py`:

- System: extract **only** listed fields; **never** invent fields; **never** edit notes; return JSON only.  
- User: raw notes + whitelist table.  
- Output schema: `{ "extractions": [ { "fieldPath", "apiFieldName", "value", "sourceText", "confidence" } ] }`.

Do **not** route through `generate-questions` handler.

---

## 8. Field typing rules (Python)

Align with QG payload semantics and [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md):

| apiFieldName pattern | Notes |
|----------------------|--------|
| `currentSalary`, `expectedSalary` | Integer PKR amounts |
| `*_techStacks` (WE role / project only), domain enums | String arrays; enum values must match QG catalogs |
| `*_shiftType`, `*_workMode`, `*_status` | Single enum value |
| `*_benefits` | Structured benefit rows |
| `*_startDate`, `*_endDate`, cert/achievement dates | ISO dates |
| `*_headcount`, `*_averageTeamSize`, `*_year` | Integers |
| `*_contributionNotes`, `*_description` | Free text |
| `resume` | v1: generally omit — FE rarely whitelists; if present, string hint only (not file upload) |

### 8.1 Disambiguation

When multiple WE rows exist, use `candidateSnapshot.workExperiences` + `AllowedEmptyField.context` to attach values to the correct `fieldPath`. If ambiguous below confidence threshold → **omit** extraction.

---

## 9. Allowlist enforcement

Maintain a single source of truth (recommended):

```python
COLD_CALLER_EXTRACT_ALLOWLIST: frozenset[str]  # apiFieldName suffixes or full keys
```

Must match QG contract §3–§5 **minus CNE16**. Reject at HTTP layer any request containing keys outside the extract set.

**Extract-specific exclusion (CNE16):**

- Top-level `techStacks` apiFieldName (QG `independent_tech_stacks` section) — **reject** if present in `allowedEmptyFields`

**Forbidden** (same as QG §5):

- `education_*`, collection openers, enrichment keys  
- `cnic`, `personalityType`  
- project `downloadCount`, `publishPlatforms`, `projectLink`, single `teamSize`  
- legacy removed keys

---

## 10. Error handling

| Case | HTTP |
|------|------|
| Validation errors | `422` (Pydantic) or `400` (business rules) |
| LLM timeout | `504` or `500` with `{ "error": "…" }` |
| LLM malformed JSON | `500`; log request id, not raw notes body |
| Empty notes | `400` |

Logging:

- Log `candidateId`, field count, duration, model.  
- **Do not** log full `rawNotes` in production.

---

## 11. Configuration

Add to `config.yaml` (example):

```yaml
call_notes_extract:
  min_confidence: 0.85
  max_notes_length: 100000
  model: null  # null → use OPENAI_MODEL default
  timeout_seconds: 55
```

---

## 12. Tests (required)

| Test | Assert |
|------|--------|
| Happy path salary + shift | Extractions returned with valid types |
| Empty whitelist | `400` |
| Empty notes | `400` |
| Unknown apiFieldName | `400` |
| `apiFieldName` exactly `techStacks` (CNE16) | `400` |
| Enum value not in options | Row dropped or `400` on post-validate |
| Ambiguous two employers | Omit or single high-confidence row |
| Confidence below threshold | Row omitted |
| Whitelist field with no evidence | Omitted (empty extractions ok) |
| `education_*` in whitelist | `400` |

Use anonymized fixture notes; no PII in committed tests.

---

## 13. Swagger / docs

- Add route to OpenAPI (`/docs`).  
- Example request/response matching API contract §8.  
- Cross-link from `PROJECT_DOCUMENTATION.md` endpoint table (optional FE doc task).

---

## 14. Deployment

- Same `python question_generator.py` / Uvicorn entrypoint.  
- No extra port.  
- Expose `POST /api/call-notes/extract` on the same public base path as generate-questions (e.g. reverse-proxy `/questions`).  
- **CORS:** allow browser `POST /api/call-notes/extract` from the app origin (required — shipped FE calls QG directly, same as generate-questions).  
- Coordinate release: deploy Python extract route with generate-questions on the same QG host; FE Analyze is always on when prerequisites pass.

---

## 15. Checklist

- [ ] `POST /api/call-notes/extract` registered  
- [ ] Pydantic models + allowlist validation  
- [ ] Extract prompt module (separate from QG questions)  
- [ ] Confidence filtering  
- [ ] Enum / date / number post-processors shared with QG where possible  
- [ ] Tests §12  
- [ ] `/docs` example  
- [ ] No raw notes in logs  
- [ ] `config.yaml` keys documented  

---

## 16. Agent prompt

```
Implement POST /api/call-notes/extract per docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md
(primary). Shorter summary: CALL_NOTES_EXTRACT_PYTHON_HANDOFF.md.
```
