# Call Notes Extract — Employer status Python prompt lock

**Status:** Locked (2026-09-04).  
**Audience:** AI agent updating **`POST /api/call-notes/extract`** in the Python QG FastAPI app (`:8002`).  
**HTTP / allowlist (unchanged):** [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md) §4–§6.  
**Whitelist options (FE):** `work_experience_{i}_status` is `select` with **`Open`** and **`Closed`** only.

This lock is **extract prompt + post-process synonym map only**. Do **not** change the HTTP schema. Do **not** add `Active` as a new option value.

---

## 0. Agent prompt (copy-paste)

```text
You are updating Call Notes Extract in the existing Python QG FastAPI app (port 8002).

READ FIRST:
1. docs/CALL_NOTES_EXTRACT_EMPLOYER_STATUS_PYTHON_PROMPT_LOCK.md  (this file)
2. docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md §5.3 select, §9 Step 2–4

PROBLEM:
Notes say "Company is Active". Whitelist work_experience_{i}_status options are only
"Open" and "Closed". Extract omits status: the model emits "Active" (or skips), and
select post-process drops any value not in options[].value.

DELIVER (extract-api only):
- Prompt: map spoken Active → option "Open"; spoken Closed / inactive → option "Closed"
- Post-process: before dropping a select row, apply that synonym map for
  apiFieldName matching work_experience_{i}_status, then re-check options
- Tests T-ES1, T-ES2 below
- Echo exact fieldPath and apiFieldName from the whitelist

Do not: persist data, rewrite rawNotes, change HTTP models, invent option values.
```

---

## 1. Locked rules (extract)

| ID | Rule |
|----|------|
| **ES1** | If `work_experience_{i}_status` is on the whitelist and notes say the company is **Active** (e.g. `Company is Active`), return **`Open`** (the whitelist `options[].value`). Do **not** return `"Active"`. |
| **ES2** | If notes say the company is **Closed** or **inactive**, return **`Closed`** when that option exists. |
| **ES3** | Select post-process still requires `value ∈ options[].value`. Apply ES1/ES2 **before** the drop, or the row is omitted (current bug). |
| **ES4** | `sourceText` may still be `Company is Active`. Only `value` must be `Open`. |

---

## 2. Prompt text to add (extract module only)

```text
Employer status (work_experience_{i}_status):
- Options are Open and Closed only.
- "Company is Active" / company is active → value "Open".
- Company closed / inactive → value "Closed".
- Never emit "Active" as the select value (it will be dropped).
```

---

## 3. Worked example (must pass)

Notes: `Company is Active`

Whitelist includes `work_experience_0_status` with options `Open`, `Closed`.

**Required:** one extraction, `value`: `"Open"`, `sourceText` containing `Company is Active`.

**Forbidden:** omitting the row; `value`: `"Active"`.

---

## 4. Tests (add in QG repo)

| # | Fixture | Expected |
|---|---------|----------|
| **T-ES1** | Notes: “Company is Active”; whitelist `work_experience_0_status` options Open/Closed | Extraction present; `value` is `"Open"` |
| **T-ES2** | Same notes; LLM raw `"Active"` then post-process | Row **not** dropped; `value` becomes `"Open"` |

---

## 5. Out of scope

| Out | Why |
|-----|-----|
| Adding Active to FE employer status enum | DB/UI remain Open / Closed |
| `isDplCompetitor` / website URL | Not this whitelist key |
| generate-questions prompts | Unchanged |
