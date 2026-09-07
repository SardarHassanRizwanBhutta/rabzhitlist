# Call Notes Extract — Main Contributor Python prompt lock

**Status:** Locked (2026-09-04).  
**Audience:** AI agent updating **`POST /api/call-notes/extract`** in the Python QG FastAPI app (`:8002`).  
**HTTP / allowlist:** add `work_experience_{i}_project_{j}_isMainContribution` to the **extract** allowlist only. Do **not** add it to `POST /api/generate-questions`.  
**Related:** [`CALL_NOTES_EXTRACT_PROJECT_PYTHON_PROMPT_LOCK.md`](./CALL_NOTES_EXTRACT_PROJECT_PYTHON_PROMPT_LOCK.md) (contribution text vs this boolean).  
**Product:** [`CANDIDATE_WE_PROJECT_MAIN_CONTRIBUTION_BACKEND_CONTRACT.md`](./CANDIDATE_WE_PROJECT_MAIN_CONTRIBUTION_BACKEND_CONTRACT.md) L3, L4, L8.

This lock is **extract HTTP allowlist + prompt + post-process**. Do **not** invent the key when it is absent from `allowedEmptyFields` (CNE1). Do **not** emit QG questions for this field.

JSON name is **`isMainContribution`**. UI label is **Main Contributor**. It is a WE-project **link** boolean (not a project-catalog field). `fieldType` is **`boolean`**.

---

## 0. Agent prompt (copy-paste)

```text
You are updating Call Notes Extract in the existing Python QG FastAPI app (port 8002).

READ FIRST:
1. docs/CALL_NOTES_EXTRACT_MAIN_CONTRIBUTOR_PYTHON_PROMPT_LOCK.md  (this file)
2. docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md §4–§6.4, §9 Step 2–4
3. docs/CALL_NOTES_EXTRACT_PROJECT_PYTHON_PROMPT_LOCK.md PN4 / PN9

PROBLEM:
Notes say "Was Main Contributor in the project". FE now sends
work_experience_{i}_project_{j}_isMainContribution on the extract whitelist
(boolean, options Yes/No). Extract currently has no mapping for that key (or
rejects it as unknown) and puts the sentence on contributionNotes instead.
The Create/Edit Main Contributor switch never turns on.

DELIVER (extract-api only):
- Accept apiFieldName work_experience_{i}_project_{j}_isMainContribution on
  extract (do NOT add it to generate-questions)
- Prompt: that language → value true on isMainContribution; do not copy it into
  contributionNotes
- Post-process: boolean true/false (or "true"/"false" coerced); do not drop
  because default snapshot is false
- Tests T-MC1, T-MC2 below
- Echo exact fieldPath and apiFieldName from the whitelist

Do not: persist data, rewrite rawNotes, generate a QG question, put this on
project catalog, use a different JSON name.
```

---

## 1. Locked rules (extract)

| ID | Rule |
|----|------|
| **MC1** | If `work_experience_{i}_project_{j}_isMainContribution` is on the whitelist and notes say the candidate was the **main contributor** / **main owner of delivery** on that project (e.g. `Was Main Contributor in the project`), return **`true`** (boolean). |
| **MC2** | That sentence is **not** `contributionNotes`. If `contributionNotes` is also whitelisted, **omit** it unless notes have separate contribution evidence (what they did). |
| **MC3** | If notes do not evidence main contributor, **omit** the `isMainContribution` row (do not return `false` just to echo the default). |
| **MC4** | Extract HTTP must **accept** this `apiFieldName`. generate-questions must still **reject** it if sent. |
| **MC5** | `requiresLinkedCatalogId` is not set. This is a WE-project link field, same grain as `contributionNotes`. |
| **MC6** | Echo `fieldPath` exactly (often `workExperiences[{weId}].projects[0].isMainContribution` when the slot is synthetic). |

CNE1, CNE17, confidence ≥ 0.85, and `sourceText` rules from the agent contract still apply.

---

## 2. Prompt text to add (extract module only)

```text
Nested project Main Contributor (work_experience_{i}_project_{j}_isMainContribution):
- Boolean. Return true when notes say the candidate was the main contributor / main owner of delivery on that project (e.g. Was Main Contributor in the project).
- Do not copy that sentence into contributionNotes. contributionNotes is what they did; isMainContribution is the switch.
- Omit the boolean row if notes do not evidence it. Do not return false only because the snapshot defaults to false.
- If the key is not on the whitelist, do not emit it (CNE1).
```

---

## 3. Worked example (must pass)

Notes (abridged):

```text
Working on Jazz Project.
Was Main Contributor in the project
```

Whitelist includes (WE index `0`, project index `0`):

- `work_experience_0_project_0_isMainContribution` (`boolean`, options `true`/`false`)
- `work_experience_0_project_0_contributionNotes` (`textarea`)

**Required:**

| Key | `value` |
|-----|---------|
| `isMainContribution` | `true` |

**Forbidden:**

- Returning `"Was Main Contributor in the project"` as `contributionNotes`  
- Omitting `isMainContribution` because snapshot / form default is `false`  
- Rejecting the whitelist key as unknown on extract HTTP  
- Emitting this key when it is not on the whitelist  

---

## 4. Tests (add in QG repo)

| # | Fixture | Expected |
|---|---------|----------|
| **T-MC1** | Notes include “Was Main Contributor in the project”; whitelist includes `isMainContribution` and `contributionNotes` | `isMainContribution: true`; `contributionNotes` omitted |
| **T-MC2** | Same notes; whitelist **omits** `isMainContribution` | No `isMainContribution` extraction (CNE1); do not invent the key |

Use anonymized notes; do not log full `rawNotes` in production.

---

## 5. Out of scope

| Out | Why |
|-----|-----|
| generate-questions | L8 / CNE17 — no QG question, no weight |
| FE apply | Writes `true` over default `false`; does not treat `false` as already filled |
| Project catalog | Flag lives on the candidate WE-project link |
| HTTP schema / new field types | `boolean` already exists (same as `isHeadquarters`) |

---

## 6. Checklist

- [ ] Extract allowlist accepts `work_experience_{i}_project_{j}_isMainContribution`  
- [ ] generate-questions still rejects that key  
- [ ] Extract prompt includes the bullets in §2  
- [ ] T-MC1, T-MC2 pass  
- [ ] CNE1 still rejects the key when it is not on the whitelist  
- [ ] `fieldPath` / `apiFieldName` echoed from whitelist  
