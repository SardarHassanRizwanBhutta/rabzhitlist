# Call Notes Extract — Nested project Python prompt lock

**Status:** Locked (2026-09-03).  
**Audience:** AI agent updating **`POST /api/call-notes/extract`** in the Python QG FastAPI app (`:8002`).  
**HTTP / allowlist (unchanged):** [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md) §4–§6.  
**Related:** [`CALL_NOTES_EXTRACT_MULTI_OFFICE_PYTHON_PROMPT_LOCK.md`](./CALL_NOTES_EXTRACT_MULTI_OFFICE_PYTHON_PROMPT_LOCK.md) (offices — do not mix with this).

This lock is **extract prompt + post-process only**. Do **not** change the request/response JSON schema. Do **not** invent `project_{j}` keys that are absent from `allowedEmptyFields` (CNE1).

---

## 0. Agent prompt (copy-paste)

```text
You are updating Call Notes Extract in the existing Python QG FastAPI app (port 8002).

READ FIRST:
1. docs/CALL_NOTES_EXTRACT_PROJECT_PYTHON_PROMPT_LOCK.md  (this file — authoritative for this change)
2. docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md §4–§6, §5.3 combobox, §9 Step 2–4

PROBLEM:
FE sends nested project whitelist keys (work_experience_{i}_project_{j}_projectName,
work_experience_{i}_project_{j}_description, and contributionNotes). Notes name a
project and include a project description/discription paragraph. Extract returns offices
and employer scalars but omits the entire project block. Apply cannot map fields that
are not in extractions[]. Description and contributionNotes are different fields:
the description paragraph must not be copied into contributionNotes.

DELIVER (extract-api only):
- Update the extract LLM system/user prompt (call_notes_extract prompt module — NOT generate-questions)
- Update post-process if it drops combobox rows when options is empty or requiresLookupResolution is true
- Add tests T-PN1, T-PN2, T-PN3 below
- Keep CNE1: never emit project keys / fieldPaths not in allowedEmptyFields
- Echo the exact fieldPath and apiFieldName from the matching whitelist row

Do not: persist data, rewrite rawNotes, change HTTP models, resolve catalog IDs.
```

---

## 1. Locked rules (extract)

| ID | Rule |
|----|------|
| **PN1** | If `work_experience_{i}_project_{j}_projectName` is on the whitelist and notes name a project (e.g. `Working on Jazz Project`, `Jazz project`), **return** that name as a **string** (`"Jazz Project"` or `"Jazz"`). Do not omit the row because snapshot `projects` is `[]` or `projectName` is null. |
| **PN2** | `fieldType: combobox` + `options: []` (or missing options) is **not** a select enum. **Do not drop** the row in post-process for “value not in options”. Return the spoken name. |
| **PN3** | `requiresLookupResolution: true` is a **hint only**. Still return the free-text name. Do **not** omit lookup/combobox fields. FE resolves catalog id after apply. |
| **PN4** | If `work_experience_{i}_project_{j}_contributionNotes` is on the whitelist: extract **only** candidate contribution (what they did on the project). **Do not** copy `Project Description` / `Project Discription` into `contributionNotes`. If notes have no contribution evidence, **omit** the row. |
| **PN5** | If `work_experience_{i}_project_{j}_description` is on the whitelist: extract the `Project Description` / `Project Discription` paragraph **only** into `description`. That paragraph must not also be returned as `contributionNotes`. |
| **PN6** | Nested `project_{j}` keys belong to the **same** WE `i` as other `work_experience_{i}_*` rows (employer offices, benefits). A named project in notes is **not** a new work-experience row. |
| **PN7** | `j` comes from the whitelist (`project_0` in `work_experience_0_project_0_projectName`). Echo `fieldPath` exactly (often `workExperiences[{weId}].projects[0].projectName` when the slot is synthetic). |
| **PN8** | Post-process **select/enum** “value must be in `options[]`” applies to `select` / enum `multiselect` only — **never** to `combobox` or `textarea`. |

CNE1, confidence ≥ 0.85, and `sourceText` rules from the agent contract still apply.

---

## 2. Prompt text to add (extract module only)

Add these bullets to the extract system message (or a “Projects” block in the user message after the whitelist table):

```text
Nested projects (work_experience_{i}_project_{j}_*):
- If the whitelist lists project_{j} keys for a WE, that slot exists even when candidateSnapshot.projects is empty or projectName is null.
- When notes name a project (Working on X Project / project X), fill projectName if that key is whitelisted.
- combobox projectName: return the name string. Empty options is normal. requiresLookupResolution does not mean skip.
- description: fill from Project Description / Project Discription when that key is whitelisted. That paragraph is description only.
- contributionNotes: fill only from contribution evidence (what the candidate did). Never copy the description/discription paragraph into contributionNotes. Omit if no contribution evidence.
- Do not skip the whole project block because you already filled employer offices or foundedYear.
```

---

## 3. Worked example (must pass)

Notes (abridged):

```text
Working on Jazz Project.
Project Discription: Pakistan Mobile Communications Limited) is the largest mobile network...
```

Whitelist includes (WE index `0`, project index `0`):

- `work_experience_0_project_0_projectName` (`combobox`, `options: []`, `requiresLookupResolution: true`)
- `work_experience_0_project_0_description` (`textarea`)
- `work_experience_0_project_0_contributionNotes` (`textarea`) — on the whitelist, but **omit** for this notes fixture (no contribution evidence)

`fieldPath` examples (echo exactly):

- `workExperiences[{weId}].projects[0].projectName`
- `workExperiences[{weId}].projects[0].description`

**Required extractions (minimum when those keys are on the whitelist):**

| Key | `value` (shape) |
|-----|-----------------|
| `projectName` | string containing Jazz (e.g. `"Jazz Project"` or `"Jazz"`) |
| `description` | the PMCL / Discription paragraph |

**Forbidden:**

- Returning the Discription paragraph as `contributionNotes`  
- Offices/benefits/foundedYear returned but **no** `projectName` / `description` despite whitelist + notes evidence  
- Dropping `projectName` because `options` is `[]` or `requiresLookupResolution` is true  
- Emitting a `project_1_*` key that is not on the whitelist  

---

## 4. Tests (add in QG repo)

| # | Fixture | Expected |
|---|---------|----------|
| **T-PN1** | Notes: “Working on Jazz Project” + Project Discription paragraph; whitelist includes `project_0_projectName`, `project_0_description`, and `project_0_contributionNotes` | `projectName` and `description` present; **`contributionNotes` omitted**; description text must not appear as contributionNotes |
| **T-PN2** | Same notes; `projectName` combobox `options: []` | `projectName` row **not** dropped in post-process |
| **T-PN3** | Same notes; whitelist **omits** all `project_*` keys | No `project_*` extractions (CNE1) |

Use anonymized notes; do not log full `rawNotes` in production.

---

## 5. Out of scope

| Out | Why |
|-----|-----|
| FE apply / Create Candidate | Already writes `projectName` + `contributionNotes` when extract returns them (`deferCatalogLinking`) |
| Resolving `projectId` catalog | FE lookup after apply |
| HTTP schema / new field types | Unchanged |
| generate-questions prompts | Unchanged |

---

## 6. Checklist

- [ ] Extract prompt includes the project bullets in §2  
- [ ] Post-process does not drop combobox rows for empty `options`  
- [ ] `requiresLookupResolution` does not omit `projectName`  
- [ ] T-PN1, T-PN2, T-PN3 pass  
- [ ] CNE1 still rejects unknown `apiFieldName`; unused project slots omitted  
- [ ] `fieldPath` / `apiFieldName` echoed from whitelist  
