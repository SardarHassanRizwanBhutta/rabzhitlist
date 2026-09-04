# Call Notes Extract — Multi-office Python prompt lock

**Status:** Locked (2026-09-03).  
**Audience:** AI agent implementing / updating **`POST /api/call-notes/extract`** in the Python QG FastAPI app (`:8002`).  
**HTTP / allowlist (unchanged):** [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md) §4–§6.  
**FE already shipped:** Next.js pads employer-catalog office slots to **five** (`office_0` … `office_4`) on Analyze Notes and on `fields_to_generate`. Apply writes `workExperiences[].locations[j]` (create-employer prefill), **not** WE `employerLocationId`.

This lock is **extract prompt + post-process only**. Do **not** change the request/response JSON schema. Do **not** invent `office_{j}` keys that are absent from `allowedEmptyFields` (CNE1).

---

## 0. Agent prompt (copy-paste)

```text
You are updating Call Notes Extract in the existing Python QG FastAPI app (port 8002).

READ FIRST:
1. docs/CALL_NOTES_EXTRACT_MULTI_OFFICE_PYTHON_PROMPT_LOCK.md  (this file — authoritative for this change)
2. docs/CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md §4–§6, §9 Step 2–4 (CNE1, office_{j} allowlist, pipeline)

PROBLEM:
FE used to send only work_experience_{i}_office_0_*. Notes that listed several offices (e.g. Islamabad HQ, Lahore, Karachi) all collapsed into office_0. FE now sends up to five empty office slots: office_0 … office_4 (and corresponding fieldPath …locations[0] …locations[4]). Extract still often returns only office_0.

DELIVER (extract-api only):
- Update the extract LLM system/user prompt (call_notes_extract prompt module — NOT generate-questions prompts)
- Update post-process if it collapses all office_* rows onto j=0
- Add tests T-MO1, T-MO2, T-MO3 below
- Keep CNE1: never emit office_5 or any apiFieldName / fieldPath not in allowedEmptyFields
- Echo the exact fieldPath and apiFieldName from the matching whitelist row
- Unused slots (no distinct office in notes): omit those keys (do not invent a city)

Do not: persist data, rewrite rawNotes, change HTTP models, resolve catalog IDs, write employerLocationId.
```

---

## 1. Locked rules (extract)

| ID | Rule |
|----|------|
| **MO1** | Each **distinct office site** in `rawNotes` maps to a **different** office index `j` that **already appears** on whitelist keys `work_experience_{i}_office_{j}_{country\|city\|address\|isHeadquarters}`. |
| **MO2** | **Do not** merge multiple sites into `office_0`. Islamabad, Lahore, and Karachi are three sites → `j=0`, `j=1`, `j=2` (order: first mentioned in notes → lowest `j` among whitelist office indexes for that WE). |
| **MO3** | **Do not** emit `office_{j}` unless that `j` is present in `allowedEmptyFields` for that `i`. FE cap is **5** slots (`j` in `0..4`). If notes mention more sites than whitelist slots, fill the available slots only; drop the rest (no extra keys). |
| **MO4** | If notes mention **fewer** sites than whitelist slots, **omit** unused `j` (no placeholder city/address). High-confidence omit is correct. |
| **MO5** | For a given `(i, j)`, return only the office subfields that are both in the whitelist **and** evidenced in notes (city without address is OK). |
| **MO6** | `isHeadquarters`: `true` only when notes **explicitly** call that site HQ / head office / headquarters / headquarter. Other sites: `false` if that boolean is whitelisted and you are filling the site; **omit** the boolean if unsure. |
| **MO7** | Same employer / same WE `i`: offices are **catalog locations** of that employer (`locations[j]`), not a new work-experience row. |
| **MO8** | Post-process must **not** rewrite every office `fieldPath` to `locations[0]` / `office_0`. |

CNE1, confidence ≥ 0.85, enum/`sourceText` rules from the agent contract still apply.

---

## 2. Prompt text to add (system or user — extract module only)

Add these bullets to the extract system message (or an “Offices” block in the user message after the whitelist table):

```text
Employer offices (work_experience_{i}_office_{j}_*):
- The whitelist may contain several j values for the same i (typically 0–4).
- Each j is a separate physical office (city / address / country / HQ flag).
- If the notes list multiple offices, assign each distinct site to a different j.
- Sort by first appearance in the notes; use the lowest unused j that exists in the whitelist for that i.
- Never put two cities in one j. Never copy one address into every j.
- Never invent j that is not in the whitelist.
- If a slot j has no matching site in the notes, omit all keys for that j.
```

---

## 3. Worked example (must pass)

Notes (abridged): three Arcana Info offices — Islamabad (called head office), Lahore, Karachi.

Whitelist includes, for WE index `0`:

- `work_experience_0_office_0_{country,city,address,isHeadquarters}`
- `work_experience_0_office_1_{…}`
- `work_experience_0_office_2_{…}`
- `work_experience_0_office_3_{…}`
- `work_experience_0_office_4_{…}`

(with `fieldPath` `workExperiences[{stableWeId}].locations[{j}].…` — echo those paths exactly.)

**Required extractions (minimum):**

| `j` | city (or equivalent) | address | isHeadquarters |
|-----|----------------------|---------|----------------|
| 0 | Islamabad | Islamabad street/address from notes | `true` |
| 1 | Lahore | Lahore street/address from notes | not `true` |
| 2 | Karachi | Karachi street/address from notes | not `true` |

**Forbidden:**

- Only `office_0` filled with Islamabad, Lahore/Karachi missing  
- Lahore or Karachi address stored on `locations[0]` / `office_0`  
- Any `office_5_*`  
- Fake cities on `office_3` / `office_4`

Country may be inferred when evidenced (e.g. Pakistan) **per site** if `office_{j}_country` is whitelisted.

---

## 4. Tests (add in QG repo)

| # | Fixture | Expected |
|---|---------|----------|
| **T-MO1** | Three offices in notes; whitelist `office_0`–`office_4` | At least three distinct `j` with different cities; HQ only on the site called head office |
| **T-MO2** | Three offices in notes; whitelist **only** `office_0` | Only `j=0` (CNE1); no invented `office_1` |
| **T-MO3** | One office in notes; whitelist `office_0`–`office_4` | Only one `j` filled; others omitted |

Use anonymized notes; do not log full `rawNotes` in production.

---

## 5. Out of scope

| Out | Why |
|-----|-----|
| `employerLocationId` | Candidate WE office FK — not an extract key |
| Padding layoff slots | FE still sends synthetic `layoff_0` only |
| Changing generate-questions **prompts** | FE already lists `office_0`–`office_4` in `fields_to_generate`; generate only those keys (existing QG rule) |
| HTTP schema / new field types | Unchanged |

---

## 6. Checklist

- [ ] Extract prompt includes the office bullets in §2  
- [ ] Post-process does not collapse `j` to 0  
- [ ] T-MO1, T-MO2, T-MO3 pass  
- [ ] CNE1 still rejects unknown `apiFieldName`; unused slots omitted  
- [ ] `fieldPath` / `apiFieldName` echoed from whitelist  
