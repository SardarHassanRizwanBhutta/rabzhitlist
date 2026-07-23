# LLM Question Generation Service — Project Documentation

Complete reference for the **llm-questions** repository: purpose, architecture, repository layout, entry points, runtime, API behavior, and integration with the Next.js frontend.

---

## 1. Overview

This project is a **Python FastAPI service** that:

1. Accepts a candidate profile (`candidate_data`) from a cold-call / recruiter workflow.
2. Detects **missing fields** across **6 profile sections**.
3. Calls **OpenAI** once per request to generate natural, conversational questions grouped by section.
4. Returns questions sorted by **configured priority weights** (not LLM-assigned priority).

A **legacy demo UI** (`candidates_table.html`) lives in this repo for local testing. The **production UI** is a separate **Next.js** app on `localhost:3000` that calls this API directly.

| Role | Technology | Port (local) |
|---|---|---|
| Production frontend | Next.js (separate repo) | `3000` |
| **This service (API)** | FastAPI + Uvicorn | `8002` |
| Demo static UI | Python `http.server` | `8000` |
| LLM | OpenAI API | external |

---

## 2. Architecture

```
┌─────────────────────┐    HTTP POST     ┌──────────────────────────┐
│  Next.js Frontend   │─────────────────▶│  question_generator.py   │
│  localhost:3000     │   /api/generate-  │  FastAPI @ localhost:8002 │
│                     │   questions       │                          │
└─────────────────────┘                   └────────────┬─────────────┘
                                                       │
┌─────────────────────┐                                ▼
│  candidates_table   │                      ┌──────────────────┐
│  .html (demo)       │                      │   OpenAI API     │
│  localhost:8000     │                      └──────────────────┘
└─────────────────────┘
```

### Request flow

1. Client sends `POST /api/generate-questions` with `candidate_id`, `candidate_data`, optional `conversation_context`.
2. `MissingFieldsAnalyzer.analyze_by_section()` computes missing field keys per section (`missing_fields` in the request body is **ignored**).
3. `QuestionGenerator.generate_questions_by_section()` sends one LLM call with missing fields grouped by section.
4. Response is parsed; `_ensure_questions_for_fields()` fills gaps with **template fallbacks** if the LLM skips a field.
5. Questions and `missing_fields` are sorted by `get_field_priority()` within each section.
6. Response always contains **6 sections** (even when a section has no missing fields).

---

## 3. Entry points and how to run

### Primary entry points

| Entry point | Command | What it starts |
|---|---|---|
| **API only (main application)** | `python question_generator.py` | FastAPI on `0.0.0.0:8002` via Uvicorn |
| **Demo + API together** | `python run_servers.py` | Static server `:8000` + API `:8002` |
| **Static demo only** | `python -m http.server 8000` | Serves `candidates_table.html` (no API) |

### Recommended local setup

```bash
# From repo root
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

copy config.example.yaml config.yaml
# Edit config.yaml — set OPENAI_API_KEY and OPENAI_MODEL

python run_servers.py
```

### URLs after startup

| URL | Purpose |
|---|---|
| http://localhost:8002/health | API liveness + model name |
| http://localhost:8002/docs | Swagger UI |
| http://localhost:8002/api/generate-questions | Question generation |
| http://localhost:8000/candidates_table.html | Demo candidate table + Generate Questions modal |

### Production frontend (separate repo)

```bash
# In Next.js app .env.local
NEXT_PUBLIC_QUESTIONS_API_URL=http://localhost:8002
```

See `.env.frontend.example` and [FRONTEND_INTEGRATION_CONTRACT.md](./FRONTEND_INTEGRATION_CONTRACT.md).

### `question_generator.py` as `__main__`

At the bottom of `question_generator.py`:

```python
if __name__ == "__main__":
  import uvicorn
  uvicorn.run(app, host="0.0.0.0", port=8002)
```

This is the **canonical API entry point** when not using `run_servers.py`.

### `run_servers.py` behavior

- Changes working directory to the repo root.
- Verifies `config.yaml` exists (repo root or parent).
- Starts **static server** (thread, port 8000) with **no-cache** headers for development.
- Starts **API** (thread) by spawning `python question_generator.py`.
- Blocks until Ctrl+C.

---

## 4. Repository structure

```
llm-questions/
├── docs/                              # Integration and project documentation
│   ├── PROJECT_DOCUMENTATION.md       # This file
│   ├── FRONTEND_INTEGRATION_CONTRACT.md
│   └── CANDIDATE_DATA_MAPPING.md
│
├── question_generator.py              # ★ Main application — FastAPI app, analyzer, LLM, priorities
├── run_servers.py                     # ★ Dev launcher — demo UI + API together
│
├── candidates_table.html              # Demo frontend (embedded sample data, 6-tab questions modal)
├── sample_candidates.py               # Python sample candidate payloads (reference shape)
├── sample_certifications.py           # Reference certification catalog data
├── sample_employers.py                # Reference employer catalog data
├── sample_projects.py                 # Reference standalone project catalog data
├── sample_universities.py             # Reference university/location catalog data
├── predefined_benefits.py             # Predefined benefit names/units (reference; not wired into API)
│
├── requirements.txt                   # Python dependencies (pinned versions)
├── config.example.yaml                # Safe template for OpenAI config
├── config.yaml                        # Local secrets — DO NOT commit (OpenAI API key)
├── .env.frontend.example              # Next.js env template for separate frontend repo
│
├── README.md                          # Quick start and links to docs
├── cursor_predefined_benefits_data_convers.md  # Archived Cursor conversation export (reference only)
│
├── .venv/                             # Local virtualenv (optional, not committed)
└── __pycache__/                       # Python bytecode cache (generated)
```

There is **no `src/` package layout** — the service is a single-module FastAPI application at the repo root.

---

## 5. File reference

### Core application

| File | Description |
|---|---|
| **`question_generator.py`** | Entire backend: config loading, FastAPI app, CORS, Pydantic models, `MissingFieldsAnalyzer`, priority weight tables, `QuestionGenerator` (OpenAI), template fallbacks, `POST /api/generate-questions`, `GET /health`. ~900 lines. |
| **`run_servers.py`** | Development orchestrator: static file server + API subprocess. |

### Demo and sample data

| File | Description |
|---|---|
| **`candidates_table.html`** | Self-contained demo: candidate table, detail modal, tabbed Generate Questions UI, client-side priority sort, `fetch` to `:8002/api/generate-questions`. Embeds its own `sample_candidates` JSON (not imported from `.py`). |
| **`sample_candidates.py`** | Six sample candidates in the **Python service payload shape** (`workExperiences`, `achievements`, etc.). Use as reference for API `candidate_data` and demo data sync. |
| **`sample_certifications.py`** | Certification name/issuer/level reference list. |
| **`sample_employers.py`** | Employer reference data (DPL, etc.). |
| **`sample_projects.py`** | Standalone project reference data. |
| **`sample_universities.py`** | University and location reference data. |
| **`predefined_benefits.py`** | Benefit dropdown options (PKR, percent, days). Not used by `question_generator.py` today. |

### Configuration

| File | Description |
|---|---|
| **`config.yaml`** | Runtime config: `OPENAI_API_KEY`, `OPENAI_MODEL`. Loaded from repo root (or parent). **Keep out of git.** |
| **`config.example.yaml`** | Template without real keys. |
| **`requirements.txt`** | `fastapi`, `uvicorn`, `openai`, `pydantic`, `pyyaml`, `python-multipart`. |
| **`.env.frontend.example`** | `NEXT_PUBLIC_QUESTIONS_API_URL=http://localhost:8002` for the Next.js app. |

### Documentation

| File | Description |
|---|---|
| **`docs/FRONTEND_INTEGRATION_CONTRACT.md`** | API contract, TypeScript types, UI rules, env vars, priority tables, agent checklist for Next.js integration. |
| **`docs/CANDIDATE_DATA_MAPPING.md`** | Main app `Candidate` → Python `candidate_data` mapping, **apiFieldName** keys, empty-section synthetic keys, benefits/resume transforms. |
| **`docs/PROJECT_DOCUMENTATION.md`** | This document. |

### Other

| File | Description |
|---|---|
| **`README.md`** | Short overview, quick start, links to detailed docs. |
| **`cursor_predefined_benefits_data_convers.md`** | Large exported chat log (~2MB). Historical reference only; not used at runtime. |

---

## 6. The six question sections

Fixed order in all API responses (`SECTION_ORDER` in `question_generator.py`):

| # | Section ID | Tab label | Top-level / scope |
|---|---|---|---|
| 1 | `basic_information` | Basic Information | Candidate root fields |
| 2 | `work_experience` | Work Experience | `workExperiences[]` (incl. nested `projects[]`) |
| 3 | `independent_tech_stacks` | Independent Tech Stacks | Top-level `techStacks[]` |
| 4 | `education` | Education | `educations[]` |
| 5 | `certifications` | Certifications | `certifications[]` |
| 6 | `achievements` | Achievements | `achievements[]` |

**Removed:** `independent_projects` / top-level `projects[]`. Legacy top-level `projects` on the request is ignored.

### Missing-field rules

A value is **missing** when it is `null`, `""`, or `[]`.

**Special cases:**

- **`resume`:** `null` = missing; `"attached"` = present (file on S3, no URL).
- **Work experience `endDate`:** `null` allowed only for the **current role** (first entry with `endDate: null`).
- **Benefits:** empty `benefits[]` on a role is missing; non-empty array with `amount: null` entries is not missing at per-benefit level.

### Empty-section expansion (synthetic first row)

When an entire array section is empty, the server emits a **section opener** key plus **synthetic `*_0_*` mini-question keys** for the first row to collect:

| Section | Opener key | Synthetic keys count | Total keys |
|---|---|---|---|
| Work Experience | `work_experiences` | 9 link + 10 catalog + 4 office + 3 layoff + nested opener + 21 project | **49** |
| Independent Tech Stacks | `techStacks` | — (single multi-value field) | **1** |
| Education | `educations` | 15 (`education_0_*` link + catalog + campus_0) | **16** |
| Certifications | `certifications` | 7 (`certification_0_*`) | **8** |
| Achievements | `achievements` | 6 (`achievement_0_*`) | **7** |

Independent Tech Stacks and **Work Experience nested projects** (openers + Name/Contribution) emit **enrichment** questions when populated from resume. See contract § 4.9 and § 4.10.

Full key tables: [CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md).

---

## 7. API summary

### `POST /api/generate-questions`

```http
POST http://localhost:8002/api/generate-questions
Content-Type: application/json

{
  "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidate_data": { },
  "conversation_context": "cold_call"
}
```

**Response (abbreviated):**

```json
{
  "sections": [
    {
      "section": "basic_information",
      "label": "Basic Information",
      "missing_fields": ["email", "currentSalary"],
      "questions": [
        {
          "question": "...",
          "field": "email",
          "section": "basic_information",
          "priority": 1,
          "context": "..."
        }
      ]
    }
  ],
  "generated_at": "2026-06-18T12:00:00",
  "candidate_id": "...",
  "total_questions": 12
}
```

- Response `field` values use **apiFieldName** keys (e.g. `certification_0_level`, `achievement_0_type`) — see mapping doc.
- `missing_fields` in the **request** is ignored.

### `GET /health`

```json
{ "status": "healthy", "model": "gpt-4o-mini" }
```

Full types, UI rules, and frontend checklist: [FRONTEND_INTEGRATION_CONTRACT.md](./FRONTEND_INTEGRATION_CONTRACT.md).

---

## 8. Key modules inside `question_generator.py`

| Component | Responsibility |
|---|---|
| `load_config()` | Reads `config.yaml` or env vars |
| `MissingFieldsAnalyzer` | `analyze_by_section()` — missing field keys per section |
| `empty_*_field_keys()` | Synthetic keys when array sections are empty |
| `get_field_priority()` / `sort_by_field_priority()` | Weight-based ordering within a section |
| `QuestionGenerator` | OpenAI prompt, parse JSON response, fallbacks |
| `_ensure_questions_for_fields()` | Template backfill when LLM omits a field |
| `*_FIELD_TEMPLATES` | Deterministic fallback question text |

### LLM vs templates

- **Primary:** LLM generates question text and `context`.
- **Fallback:** `*_FIELD_TEMPLATES` used when the LLM fails entirely or skips specific field keys.

### Priority weights

Configured in constants at the top of `question_generator.py` (e.g. `BASIC_INFORMATION_FIELD_WEIGHTS`, `WORK_EXPERIENCE_SUFFIX_WEIGHTS`). The server **overwrites** LLM `priority` with these weights before returning.

---

## 9. Frontend integration (Next.js)

The production app:

1. Loads `Candidate` from ASP.NET / main API.
2. Maps to `CandidateDataForQuestionService` via `map-candidate-for-question-service.ts`.
3. `POST`s to `NEXT_PUBLIC_QUESTIONS_API_URL/api/generate-questions`.
4. Renders a **6-tab modal**; links questions to UI fields via **apiFieldName**.

**Share with frontend team:**

- `docs/FRONTEND_INTEGRATION_CONTRACT.md`
- `docs/CANDIDATE_DATA_MAPPING.md`
- `.env.frontend.example`

**Do not share:** `config.yaml` (API keys).

---

## 10. Configuration reference

### `config.yaml`

```yaml
OPENAI_API_KEY: "sk-..."
OPENAI_MODEL: "gpt-4o-mini"   # or gpt-4.1, etc.
```

### CORS

Origins are configured via `ALLOWED_ORIGINS` (comma-separated). Defaults:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:8000` (legacy demo UI via `run_servers.py`)
- `http://127.0.0.1:8000`
- `https://main.dnqtv881k8qvg.amplifyapp.com`

Implemented with FastAPI `CORSMiddleware` only (no wildcard `*` in production/Docker).

### Ports

| Port | Set in |
|---|---|
| `8002` | `question_generator.py` (`uvicorn.run(..., port=8002)`) |
| `8000` | `run_servers.py` (`ThreadingHTTPServer` on 8000) |

---

## 11. Troubleshooting

| Issue | Check |
|---|---|
| `ModuleNotFoundError: yaml` | `pip install -r requirements.txt` or activate `.venv` |
| API call failed from demo UI | API running on 8002; `config.yaml` valid |
| Stale demo HTML after edits | Hard refresh; `run_servers.py` sends no-cache headers |
| Empty questions | Candidate may have no missing fields; check analyzer keys in response |
| CORS errors | Use direct fetch to 8002; CORS is open for local dev |
| pydantic build errors on Python 3.14+ | Use `pydantic==2.13.4` from `requirements.txt` |

---

## 12. Security notes

- Store OpenAI keys in `config.yaml` locally only; use `config.example.yaml` for onboarding.
- No authentication on the API today (local/dev scope).
- Do not log or expose `candidate_data` containing PII in production without a retention policy.

---

## 13. Related documents (reading order)

1. **This file** — repo layout, entry points, runtime.
2. **[FRONTEND_INTEGRATION_CONTRACT.md](./FRONTEND_INTEGRATION_CONTRACT.md)** — API + TypeScript + UI contract.
3. **[CANDIDATE_DATA_MAPPING.md](./CANDIDATE_DATA_MAPPING.md)** — Payload mapping and apiFieldName keys.
4. **[README.md](../README.md)** — Quick start.

---

## 14. Document history

| Area | Notes |
|---|---|
| Empty-section mini-questions | Work Experience, Projects, Education, Certifications, Achievements |
| Education | Link fields visible; university catalog + `locations[]` campuses in accordion (§ 4.12); link enrichment when populated |
| Resume | `hasResume` → `null` / `"attached"` in mapped payload |

When code and docs disagree, treat **`question_generator.py`** and **`docs/CANDIDATE_DATA_MAPPING.md`** as authoritative for field keys and behavior.
