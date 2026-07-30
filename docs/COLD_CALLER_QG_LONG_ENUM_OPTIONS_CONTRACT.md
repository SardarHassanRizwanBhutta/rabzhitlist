# Cold Caller QG — Long Enum `options[]` Contract

**Status:** Python shipped + FE Call Notes chips/copy implemented (2026-07-30).  
**FE status:** Call Notes QG sidebar renders read-only chips for **any** question with non-empty `options[]` (includes §3 fields, layoff `reason`, and future fields).  
**Audience:** Python QG service + Cold Caller FE (Call Notes QG sidebar).  
**Supersedes:** Prior “`options[]` / LONG_ENUM out of scope” note for the fields listed below.

---

## 1. Problem

For Basic (enum) and Advanced (enum) fields, inlining every display label into the
`question` string (comma-separated prose) makes Call Notes hard to scan. Cold
callers need a short stem plus a scannable list of values.

---

## 2. Locked product decisions

| # | Decision |
|---|----------|
| **LE1** | Python returns structured **`options: string[]`** (human display labels only) |
| **LE2** | `question` is a **stem only** — do **not** inline enum labels in the question text |
| **LE3** | Applies to **every** allowlisted Basic (enum) and Advanced (enum) field below, **plus** `achievementType` as **basic (enum)** — **no** minimum option-count threshold |
| **LE4** | Python **owns** authoritative label lists (from its enums / existing QG maps). This contract names fields + shape only; it does not enumerate every label |
| **LE5** | Call Notes FE (later): read-only wrap **chips/badges** under the stem |
| **LE6** | Call Notes FE (later): Copy = stem + bulleted options |
| **LE7** | Scope of FE rendering: **Call Notes QG sidebar only** |
| **LE8** | Implementation order: **this contract** → **Python ships** → **FE implements** (no FE until `options[]` is live) |

---

## 3. In-scope response field suffixes

Emit non-empty `options` and a stem-only `question` when generating questions for
these suffixes (on their normal indexed keys, e.g.
`work_experience_{i}_shiftType`,
`work_experience_{i}_project_{j}_technicalAspects`,
`achievement_{i}_achievementType`).

### 3.1 Basic (enum)

| Suffix | Section / parent |
|--------|------------------|
| `shiftType` | Work Experience — Role Details |
| `workMode` | Work Experience — Role Details |
| `status` | Nested Project Details (`work_experience_{i}_project_{j}_status`) |
| `achievementType` | Achievements (`achievement_{i}_achievementType`) — treat as **basic (enum)** |
| `reason` | Layoff row (`work_experience_{i}_layoff_{j}_reason`) — Python ships `options[]`; FE chips whenever present |

### 3.2 Advanced (enum)

| Suffix | Section / parent |
|--------|------------------|
| `types` | Work Experience — Employer Details |
| `salaryPolicy` | Work Experience — Employer Details |
| `status` | Work Experience — Employer Details (`work_experience_{i}_status`) |
| `projectType` | Nested Project Details |
| `verticalDomains` | Nested Project Details |
| `horizontalDomains` | Nested Project Details |
| `technicalDomains` | Nested Project Details |
| `technicalAspects` | Nested Project Details |

**`status` disambiguation:** Employer vs project both use suffix `status`.
Python distinguishes by full field key:

- Employer (advanced enum): `work_experience_{i}_status`
- Project (basic enum): `work_experience_{i}_project_{j}_status`

**Out of scope for `options[]`:** Advanced **open** fields (`techStacks`,
`description`, `contributionNotes`, etc.), Basic **open** / non-enum fields
(`timeSupportZones`, salaries, names, dates, …), and Independent Tech Stacks.

---

## 4. Response shape

### 4.1 Per-question object (additive)

```json
{
  "question": "In your fourth project, which technical aspects did you work on? Please elaborate on each.",
  "field": "work_experience_0_project_0_technicalAspects",
  "section": "work_experience",
  "priority": 3.57,
  "context": "…",
  "prompt_type": "advanced",
  "options": [
    "Software Development",
    "Frontend Development",
    "Backend Development"
  ]
}
```

| Property | Type | Rules |
|----------|------|--------|
| `question` | `string` | Stem only. **Must not** list enum labels (no comma-separated “A, B, or C?” catalogs). |
| `options` | `string[]` | Required for in-scope enum fields. Non-empty. Each entry is a **display label**. Stable canonical order from Python’s enum/map. |
| `prompt_type` | `"basic"` \| `"advanced"` | Unchanged meaning; Basic (enum) stay `basic`, Advanced (enum) stay `advanced`. |

### 4.2 Basic (enum) stem convention

Template-style recruiter cue **without** parenthetical labels:

- Good: `"Ask about Shift Type"`
- Bad: `"Ask about Shift Type (Day, Night, Evening, …)"`

FE will render chips from `options`.

### 4.3 Advanced (enum) stem convention

LLM (or template) candidate-facing question **without** embedding the option
catalog in the prose. Put every display label in `options` only.

- Good: stem that asks which aspects/domains/types apply and invites elaboration  
- Bad: stem that enumerates Software Development, Frontend Development, …

### 4.4 Non-enum / out-of-scope fields

- **Omit** `options` (or send only when non-empty is not applicable — prefer omit).
- Do not invent option lists for open fields.

### 4.5 Emptiness

| Condition | Result |
|-----------|--------|
| In-scope enum field, labels available | `options` non-empty `string[]` |
| In-scope enum field, labels somehow missing | Do **not** emit empty `options: []` as success; treat as implementation bug — fix the map |
| Out-of-scope field | Omit `options` |

---

## 5. FE behavior (implemented)

1. Call Notes QG question card:
   - Show `question` stem as today.
   - If `options` is a non-empty `string[]` (any field), render read-only wrap chips under the stem.
   - When `options.length > 8`, chips start **collapsed** (`Show N options` / `Hide options`). When expanded, all chips show (no fixed height / inner scroll). When `options.length ≤ 8`, all chips are visible with no toggle.
2. Copy: stem + newline + bulleted options (`- label` per line) when options present (full list); otherwise stem only.
3. If `options` absent/empty: show stem only (no chips).
4. No chip selection / no persistence of check-off (read-only).
5. `context` (including any `Valid values: …` text) is not surfaced on the Call Notes card.
6. Fields View and other surfaces: unchanged in this round.

---

## 6. Python checklist

- [x] Add optional `options: list[str]` on generated question response model / JSON
- [x] For every in-scope suffix in §3, when emitting a question:
  - [x] Set stem-only `question` (no inlined label catalog)
  - [x] Set non-empty `options` from authoritative display labels
  - [x] Keep correct `prompt_type` (`basic` vs `advanced`)
- [x] Treat `achievementType` as **basic (enum)** with stem + `options`
- [x] Do **not** attach `options` to open / non-enum fields
- [x] Layoff `reason` also emits `options[]` (FE treats any non-empty `options`)
- [x] Smoke: Technical Aspects / Domains questions return short stem + full `options[]`

---

## 7. Python agent prompt (copy/paste)

```
Implement Cold Caller QG long-enum options per
docs/COLD_CALLER_QG_LONG_ENUM_OPTIONS_CONTRACT.md.

For all Basic (enum) and Advanced (enum) allowlisted fields listed in §3
(including achievementType as basic enum):

1. question = stem only — do NOT inline enum labels in the question text.
2. options = non-empty string[] of human display labels (Python owns the lists).
3. Basic enum stems: e.g. "Ask about Shift Type" (no parenthetical list).
4. Advanced enum stems: LLM/template without embedding the catalog; labels only in options.
5. Omit options on non-enum / open fields.

FE will render chips later; ship the API shape first.
```

---

## 8. Out of scope (this round)

- Patching allowlist / `FRONTEND_INTEGRATION_CONTRACT.md` / sync handoff (unless requested)
- Chip check-off or writing selected options back to the candidate
- Surfacing or stripping `context` / `Valid values:` in Call Notes
- `techStacks` as `options[]` (Advanced open — not enum catalog)
- Changing weights or allowlist membership (except documenting `achievementType` / layoff `reason` for options)
