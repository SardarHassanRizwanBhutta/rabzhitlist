# Call Notes Extract — Locked Product Requirements (v1)

**Status:** Locked (2026-08-04). Updated 2026-08-27 — WE `salaryPolicy` is extract-eligible when empty. Updated 2026-08-05 — exclude top-level independent tech stacks (CNE16).  
**Audience:** Product, frontend, Python QG service.  
**Supersedes:** Removed deferred extract docs (`call_notes_frontend_api_contract.md`, `cold_caller_call_notes_view_design.md`, `cold_caller_call_notes_frontend_implementation_handoff.md`).  
**Related (persistence, shipped):** [`CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md) (CN16).  
**Field allowlist (authoritative keys):** [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md) §3–§4.  
**API contract:** [`CALL_NOTES_EXTRACT_API_CONTRACT.md`](./CALL_NOTES_EXTRACT_API_CONTRACT.md)  
**Frontend handoff:** [`CALL_NOTES_EXTRACT_FRONTEND_HANDOFF.md`](./CALL_NOTES_EXTRACT_FRONTEND_HANDOFF.md)  
**Python handoff:** [`CALL_NOTES_EXTRACT_PYTHON_HANDOFF.md`](./CALL_NOTES_EXTRACT_PYTHON_HANDOFF.md)  
**QG agent contract (detailed):** [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md)

---

## 1. Purpose

Recruiters capture unstructured phone-call notes in Cold Caller. **Analyze Notes** sends the current textarea text (saved or unsaved) to the Python QG stack for **structured field proposals**. The recruiter **reviews** proposals in a **modal**, selects rows, resolves lookups, and **Apply Selected** fills **only empty** candidate fields. Persistence happens only through existing **Update & Verify** (saved) or **Create Candidate** (draft), plus optional **`callNotes`** on create.

Stored notes remain the **human source of truth** (CN16). Extract never rewrites the notes blob.

---

## 2. Scope (v1)

| In scope | Out of scope (v1) |
|----------|-------------------|
| **Analyze Notes** button alongside **Save Notes** (saved) or alongside draft actions | Auto-extract on save |
| Extract from **current textarea text** (DB save not required first) | Overwriting populated fields |
| **Empty-only** apply to Edit Mode (saved) and Create prefill (draft) | Full Create-form fields outside QG allowlist |
| **QG allowlist keys only** (Basic, Preferences, WE, projects, certs, achievements — see §7) | Education, CNIC, personalityType, postingTitle, top-level independent tech stacks, etc. |
| **Modal review** before apply | Inline-only review without modal |
| Next.js proxy → Python on **same QG process/port** (`:8002`) | Separate greenfield AI service |
| Recruiter **must review** before apply | Auto-apply after extract |
| Draft: **`callNotes`** still sent on `POST /api/candidates` when non-empty | Call notes on Candidate Details / list / main PUT |
| Lookup match / create / skip in review UI | Python creating catalog rows or resolving IDs |

---

## 3. Locked decisions

| # | Decision |
|---|----------|
| **CNE1** | **Empty-only:** proposals may target only fields **empty at extract request time**; apply re-checks empty before writing |
| **CNE2** | **Both apply targets in v1:** (a) saved candidate → Candidate Details **Edit Mode**; (b) draft → **Create** dialog prefill |
| **CNE3** | **Analyze Notes** is a explicit button next to **Save Notes** (saved) or in the same editor action row (draft). Not triggered automatically on save |
| **CNE4** | **Field scope:** QG Cold Caller allowlist keys per [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md) **except** top-level independent tech stacks (CNE16). No broader Create-only fields |
| **CNE5** | **Human review required:** extract → modal review → Apply Selected. No silent auto-apply |
| **CNE6** | **Python:** extend existing QG FastAPI app on **same host/port** as `POST /api/generate-questions` (default `:8002`). New route `POST /api/call-notes/extract` |
| **CNE7** | **Analyze input:** current **textarea value** (including unsaved draft text). Save Notes success is **not** a prerequisite |
| **CNE8** | **Review UI:** **modal / second step** after Analyze (not inline-only in the notes editor) |
| **CNE9** | **Draft create:** after Apply to Create prefill, **`callNotes`** is still included on `POST /api/candidates` when non-empty (existing persistence behavior) |
| **CNE10** | **CN16:** AI must **not** modify stored `call_notes` / editor text on extract or apply. Notes change only via explicit Save Notes / create body |
| **CNE11** | **Naming:** persisted sub-resource property **`call_notes`** (snake_case); create body **`callNotes`** (camelCase). Not `save_notes` |
| **CNE12** | **Browser → Python:** never direct; always **Next.js** `POST /api/call-notes/extract` proxy |
| **CNE13** | **Contribution (`contributionNotes`):** empty-only like other fields (unlike QG question exception) |
| **CNE14** | **Project `employerName` / `projectType`:** omit from extract allowlist when parent WE already has an employer (same rule as QG §3 nested projects) |
| **CNE15** | **`resume`:** include in allowlist only when candidate has **no** attached resume (`hasResume !== true`); notes cannot attach binary resume — extract may propose URL/text cues only if product adds later; v1 typically excludes populated resume attachment targets |
| **CNE16** | **Top-level independent tech stacks excluded:** do **not** include candidate-level `techStacks` / QG section `independent_tech_stacks` in extract v1 (hidden in Cold Caller Call Notes UI). **In scope:** `work_experience_{i}_techStacks` and `work_experience_{i}_project_{j}_techStacks` |

---

## 4. Relationship to persistence (CN3 superseded)

[`CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md) **CN3** deferred Analyze in favor of Save Notes only. **CNE3** supersedes CN3 for v1 extract: **both** **Save Notes** and **Analyze Notes** are visible for saved candidates. Save Notes behavior is unchanged.

---

## 5. User flow

### 5.1 Saved candidate (numeric id)

1. Open Cold Caller → Call Notes view.  
2. Edit notes in textarea (loaded from GET and/or session draft).  
3. Optional: **Save Notes** → PATCH `call_notes`.  
4. **Analyze Notes** → build `allowedEmptyFields` from current candidate + QG allowlist → proxy extract.  
5. **Review modal:** accept/reject rows; resolve lookups.  
6. **Apply Selected** → merge into Edit Mode form (empty fields only).  
7. Recruiter **Update & Verify** → existing ASP.NET APIs persist fields.  
8. Notes blob unchanged unless recruiter edits and Save Notes again.

### 5.2 Draft candidate (non-numeric id)

1. Open draft Cold Caller (Auto-Profiler path). **Save Notes** hidden.  
2. Edit local notes; optional **Apply to Create Candidate** (unchanged — opens Create without extract).  
3. **Analyze Notes** uses textarea text + draft candidate snapshot.  
4. Review modal → **Apply Selected** → Create dialog prefill (empty fields only).  
5. On create: existing fields + optional **`callNotes`** when non-empty.  
6. Clear session draft per persistence rules after successful create.

---

## 6. Empty-only rules

### 6.1 What counts as empty

Same as QG / persistence trim rules:

- `null`, `undefined`, `""`, whitespace-only strings  
- empty arrays `[]`  
- Use `isQgValueMissing()` semantics on the FE

### 6.2 When empty is evaluated

| Stage | Rule |
|-------|------|
| Build `allowedEmptyFields` | Include only allowlisted keys that are empty **now** |
| Python response | Return extractions only for keys sent in `allowedEmptyFields` |
| Apply Selected | Skip any target that became non-empty since extract (race / parallel edit) |

### 6.3 Overwrite

**Not allowed in v1.** Populated fields are never in the whitelist and must never be written by apply.

---

## 7. Field allowlist (v1)

**Authoritative list:** QG allowlist keys from [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md) §3–§4 that appear in **Cold Caller Call Notes** (five visible tabs), **minus** CNE16:

- Basic: `resume`, `linkedinUrl` (subject to CNE15)  
- Preferences: `currentSalary`, `expectedSalary`  
- Work experience role, employer, office, layoff, and nested project fields (including role and project **tech stacks**, and WE-owned **`salaryPolicy`**)  
- Certification and achievement row fields  

**Excluded from extract v1 (never send to extract):**

- **Top-level independent tech stacks:** candidate-level `techStacks` / QG `independent_tech_stacks` section (CNE16 — hidden in Call Notes UI)  
- Education and all `education_*` keys  
- `cnic`, `personalityType`, postingTitle, contact fields outside allowlist  
- Project fields explicitly forbidden in QG §5  
- WE role `endDate` (not QG allowlisted)

**Synthetic index `0`:** when collections are empty (draft / new rows), FE emits the same synthetic `0` keys as QG (`work_experience_0_*`, `certification_0_*`, etc.) in `apiFieldName`, with `fieldPath` using bracket `[0]`.

---

## 8. UX rules (Cold Caller Call Notes view)

| Rule | Detail |
|------|--------|
| Analyze placement | Same editor footer row as Save Notes (saved) or draft actions |
| Analyze enabled | Notes non-empty (trim); at least one empty allowlisted field; not while extract/apply in flight |
| Analyze disabled copy | Explain: empty notes / nothing empty to fill / service unavailable |
| Save Notes | Unchanged persistence behavior; independent of Analyze |
| Review | Modal lists proposed field, value preview, source snippet, confidence (display-only) |
| Apply | **Apply Selected** closes modal and merges into target form; toast on success / partial skip |
| Errors | Extract failure → modal or inline error with retry; no partial silent apply |
| Feature flag | `CALL_NOTES_EXTRACT_V1` (env or config) gates Analyze UI until stack is ready |

---

## 9. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Security | No raw notes in client console, analytics, or server logs |
| Privacy | Same PII handling as QG / resume parse |
| Performance | Extract timeout documented in API contract; FE shows loading state |
| Idempotency | Re-analyze replaces prior **unsaved** review session; does not persist |
| Audit | Applied values persist through existing candidate APIs only |

---

## 10. Phasing

| Phase | Owner | Deliverable |
|-------|-------|-------------|
| **1 — Python** | QG service | `POST /api/call-notes/extract` + tests |
| **2 — Next proxy** | Next.js | `/api/call-notes/extract` route + Zod types |
| **3 — FE** | Next.js | Analyze button, allowlist builder, review modal, apply engine (Edit + Create) |
| **4 — QA** | All | Saved + draft smoke; field matrix vs QG allowlist |

---

## 11. Open items

None for v1 product rules. Exact HTTP error payload shapes may be documented in implementation notes as long as status codes match the API contract.

---

## 12. Agent prompt (product)

```
Implement Call Notes Extract v1 per CALL_NOTES_EXTRACT_* docs.

Locked: empty-only; QG allowlist fields only (exclude top-level independent techStacks per CNE16);
Analyze button; modal review; both Edit Mode and Create prefill; textarea text OK without prior Save Notes;
extend QG Python on :8002; never rewrite call_notes; draft create still sends callNotes.
```
