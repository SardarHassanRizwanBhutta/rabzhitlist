# Call Notes Extract — Select label → value Python post-process lock

**Status:** Locked (2026-09-05). **Shipped** in QG `POST /api/call-notes/extract` (2026-09-05) — T-SL1 / T-SL2.  
**Python scope:** Shipped. Every extract `fieldType: select` with non-empty `options` emits `options[].value` (label match rewritten before enum drop).  
**Audience:** AI agent updating **`POST /api/call-notes/extract`** in the Python QG FastAPI app (`:8002`).  
**HTTP / allowlist (unchanged):** [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md) §5.3 `select`, §9 Step 4.  
**Related:** [`CALL_NOTES_EXTRACT_EMPLOYER_STATUS_PYTHON_PROMPT_LOCK.md`](./CALL_NOTES_EXTRACT_EMPLOYER_STATUS_PYTHON_PROMPT_LOCK.md) — **Shipped** (Active → Open synonym; still runs before SL1).

This lock is **extract `select` post-process only**. It applies to **every** whitelist row with `fieldType: select` and non-empty `options` (not only `achievementType`). Do **not** change the HTTP schema. Do **not** change generate-questions. Do **not** rewrite nested project domain **multiselect** values (CNE19 / PX5). Do **not** change PX2 unmatched `clientLocations`.

---

## 0. Agent prompt (copy-paste)

```text
You are updating Call Notes Extract in the existing Python QG FastAPI app (port 8002).

READ FIRST:
1. docs/CALL_NOTES_EXTRACT_SELECT_LABEL_VALUE_PYTHON_PROMPT_LOCK.md (this file)
2. docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md §5.3 select, §9 Step 4
3. docs/CALL_NOTES_EXTRACT_EMPLOYER_STATUS_PYTHON_PROMPT_LOCK.md (do not regress)

PROBLEM:
Extract select rows may return options[].label (e.g. achievementType "Medal")
instead of options[].value ("medal"). Membership then either drops the row or
leaves a value the FE select cannot bind. FE apply already maps labels as a
safety net. Extract JSON must still emit options[].value.

DELIVER (extract-api post-process only):
- For EVERY whitelist row with fieldType select and non-empty options: before
  the enum drop, rewrite the string if it matches options[].value or
  options[].label (trim, case-insensitive) to that option’s options[].value
  (original casing of .value). Not limited to achievementType.
- If still no match after rewrite (and after ES1/ES2 for employer status), drop
  the row (existing T8).
- Tests T-SL1, T-SL2
- Echo exact fieldPath and apiFieldName from the whitelist

Do not: persist data, rewrite rawNotes, change HTTP models, touch generate-questions.
Do not rewrite verticalDomains / horizontalDomains / technicalDomains (CNE19).
Do not change clientLocations unmatched spoken (PX2).
Do not change employer status Active → Open (ES1–ES3 still apply first).
```

---

## 1. Locked rules (extract)

| ID | Rule |
|----|------|
| **SL1** | **Every** `fieldType: select` row with non-empty `options` (not only `achievementType`): if `value` equals an `options[].value` or `options[].label` (trim, case-insensitive), set `value` to that option’s **`options[].value`** (keep the option’s original value casing). |
| **SL2** | If no match after SL1 (and after employer-status ES1/ES2 when applicable), **drop** the row. Do not keep the unmatched string. |
| **SL3** | Worked case: `achievement_0_achievementType` options include `{ value: "medal", label: "Medal" }`. LLM/`value` `"Medal"` → `"medal"`. Row is **not** dropped. |
| **SL4** | Out of scope for this rewrite: `multiselect` domain keys (PX5 / CNE19 spoken tokens); `clientLocations` unmatched spoken (PX2); `combobox`; `boolean`. |

Employer status **Active → Open** is not a label match (label is `Open`). Keep ES1–ES3 **before** SL1 for `work_experience_{i}_status`.

---

## 2. Prompt text

No new LLM prompt is required if post-process always rewrites. Optional one-liner in the extract system message:

```text
For select fields, emit options[].value (not options[].label). Example: achievement type Medal → medal.
```

---

## 3. Worked example (must pass)

Whitelist includes `achievement_0_achievementType` (`select`) with options including `{ "value": "medal", "label": "Medal" }`.

Notes: `Achieved Gold Medal in 2025 for getting 1st position in Computer Science Department`

**Required:** extraction `value` is `"medal"` (not `"Medal"`).

---

## 4. Tests (add in QG repo)

| # | Fixture | Expected |
|---|---------|----------|
| **T-SL1** | `achievement_0_achievementType` on whitelist; options include medal/Medal; LLM raw `"Medal"` | Row present; `value` is `"medal"` |
| **T-SL2** | Same field; LLM raw `"not-an-option"` | Row dropped (T8) |

---

## 5. Out of scope

| Out | Why |
|-----|-----|
| FE apply | Already maps select labels (safety net); do not remove |
| Generate-questions | Unchanged |
| Domain / clientLocations spoken tokens | CNE19 / PX5 / PX2 |
| Review UI label formatting | FE may still show `extractions[].value` as returned |
