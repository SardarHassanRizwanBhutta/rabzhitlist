# Call Notes Extract — Benefits FE Handoff

**Status:** Locked (2026-08-18). §10.1 save shipped and smoke-tested (Update & Verify, 2026-08-18).  
**Audience:** Next.js Cold Caller frontend (`rabzhitlist`) — Analyze Notes, review modal, Apply to form.  
**Python scope:** Shipped in QG service (`POST /api/call-notes/extract`, port `8002`).  
**Related docs:**

| Document | Role |
|----------|------|
| [`CALL_NOTES_EXTRACT_API_CONTRACT.md`](./CALL_NOTES_EXTRACT_API_CONTRACT.md) | Cross-repo HTTP contract (§3.3, §5.3, §8.3, §9, §10.1) |
| [`CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md`](./CALL_NOTES_EXTRACT_QG_SERVICE_AGENT_CONTRACT.md) | Python agent contract |
| [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md) | `work_experience_{i}_benefits` allowlist |

---

## 1. Summary

Python now **fully supports benefits extraction** for work-experience role fields (`fieldType: "benefits"`).

| Before | After |
|--------|-------|
| Notes like *"benefits are car fuel and paid leaves"* often returned `extractions: []` | Returns structured benefit rows when LLM proposes the field with sufficient confidence |
| LLM had no benefits-specific prompt guidance | Prompt includes rules + DPL worked example |
| Post-process only accepted pre-formed `[{name}]` dict arrays | Post-process splits compound phrases, title-cases names, accepts string/list shapes, falls back to `sourceText` |

**FE responsibility unchanged:** extract returns **spoken benefit names** only. Catalog match / create happens on **Apply** and **save**, not in Python.

---

## 2. Bug fixed (repro)

### Input

```text
At dpl, the benefits are car fuel and paid leaves
```

### Whitelist row (FE → Python)

```json
{
  "fieldPath": "workExperiences[15].benefits",
  "apiFieldName": "work_experience_0_benefits",
  "fieldLabel": "Benefits",
  "fieldType": "benefits",
  "context": "DPL-IT (Pvt Ltd.) - Full Stack Developer"
}
```

### Snapshot (disambiguation)

One work experience: `id: "15"`, `employerName: "DPL-IT (Pvt Ltd.)"`, `jobTitle: "Full Stack Developer"`.

### Actual (before fix)

```json
{ "extractions": [], "meta": { "model": "gpt-4.1", "processingMs": … } }
```

### Expected (after fix)

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
  "meta": { "model": "gpt-4.1", "processingMs": 2400 }
}
```

Full request/response mirror: **API contract §8.3**.

---

## 3. Python implementation (what shipped)

| Component | Path | Role |
|-----------|------|------|
| Benefits normalizer | `call_notes_extract/benefits_normalize.py` | `normalize_benefits_value()` — split phrases, title-case, dedupe, optional amount/unit |
| Post-process hook | `call_notes_extract/postprocess.py` | Runs normalizer for every `fieldType: "benefits"` row after LLM |
| LLM prompt | `call_notes_extract/prompts.py` | Rules 11–12 + whitelist table hint for benefits shape |
| Tests | `tests/test_call_notes_extract.py` | DPL repro + string split + list split + sourceText fallback |

### 3.1 Post-process guarantees (`normalize_benefits_value`)

Python normalizes LLM output to:

```ts
Array<{ name: string; amount?: number; unit?: string }>
```

| Input shape (LLM `value`) | Python output |
|---------------------------|---------------|
| `[{ "name": "Car Fuel" }, { "name": "Paid Leaves" }]` | Same names (title-cased) |
| `"car fuel and paid leaves"` | `[{ name: "Car Fuel" }, { name: "Paid Leaves" }]` |
| `["car fuel", "paid leaves"]` | Two objects (title-cased) |
| `[]` with valid `sourceText` | Parsed from `sourceText` (fallback) |
| `[{ "name": "fuel allowance", "amount": 40, "unit": "L" }]` | Preserves `amount` / `unit` when present |
| Unparseable / no evidence | Row **omitted** (not in `extractions`) |

**Splitting rules:**

- Strips prefixes: `benefits are`, `benefits include`, etc.
- Splits on `,`, `;`, and ` and `
- Deduplicates case-insensitively
- Title-cases each name (`car fuel` → `Car Fuel`)

**Not done in Python:**

- No catalog lookup against `GET /api/benefits`
- No fuzzy map (`Car Fuel` → `Fuel Allowance`)
- No benefit IDs in response

---

## 4. FE request contract (Analyze Notes → Python)

### 4.1 When to include a benefits whitelist row

Include when **work experience role `benefits`** is empty on the candidate form and is in the QG allowlist.

| Property | Value |
|----------|--------|
| `apiFieldName` | `work_experience_{i}_benefits` (indexed key, not DB id) |
| `fieldPath` | `workExperiences[{stableWeId}].benefits` |
| `fieldType` | `"benefits"` |
| `fieldLabel` | e.g. `"Benefits"` |
| `context` | Recommended: `"{employerName} - {jobTitle}"` for disambiguation |
| `options` | **Omit** — explicit rule (API §3.3, §9.5) |

### 4.2 Example TypeScript whitelist builder

```ts
// Pseudocode — align with existing buildCallNotesAllowedEmptyFields()
if (emptyField.apiFieldName.endsWith("_benefits")) {
  return {
    fieldPath: `workExperiences[${we.id}].benefits`,
    apiFieldName: `work_experience_${weIndex}_benefits`,
    fieldLabel: "Benefits",
    fieldType: "benefits",
    context: `${we.employerName ?? ""} - ${we.jobTitle ?? ""}`.trim(),
    // NO options
  }
}
```

### 4.3 Validation (Next proxy — unchanged)

- Do **not** attach `options` for benefits rows.
- Reject Analyze if whitelist is empty (existing behavior).

---

## 5. FE response contract (Python → review modal)

### 5.1 Extraction row shape

```ts
interface BenefitsExtractionValue {
  name: string
  amount?: number
  unit?: string
}

interface CallNotesExtraction {
  fieldPath: string           // echo request
  apiFieldName: string        // echo request
  value: BenefitsExtractionValue[]
  sourceText: string
  confidence: number          // already filtered ≥ 0.85 in Python
}
```

### 5.2 Display in review modal

| UI element | Source |
|------------|--------|
| Field label | Request `fieldLabel` (or existing field metadata) |
| Proposed value | Render `value[]` as list: `Car Fuel`, `Paid Leaves` |
| Optional amount/unit | Show when present, e.g. `Fuel Allowance — 40 L` |
| Evidence | `sourceText` snippet |
| Confidence | `confidence` (display only; no FE threshold in v1) |

### 5.3 Empty extractions

`extractions: []` remains valid when:

- Notes do not mention benefits for a whitelisted row
- Confidence below Python threshold
- LLM omits the row entirely (post-process cannot invent rows without an LLM extraction row + `sourceText`)

Show existing “no high-confidence mappings” empty state.

---

## 6. Apply semantics (FE — critical)

Extract does **not** write to the candidate API. Apply is client-side only (API §10).

### 6.1 On Apply Selected (benefits row)

1. Re-verify `workExperiences[{id}].benefits` is still empty (or merge policy if product allows partial fill).
2. Write `value[]` into react-hook-form state for that work experience’s benefits array.
3. Each item is `{ name, amount?, unit? }` — **names from extract, not catalog IDs**.

### 6.2 On save (create / update candidate) — API §10.1

| Step | Rule |
|------|------|
| Form state | Benefit rows from applied extraction |
| Catalog match | Case-insensitive **exact name** match against `GET /api/benefits` |
| No match | `POST /api/benefits` with that name, then link on WE |
| No fuzzy link | Do **not** map `"Car Fuel"` → `"Fuel Allowance"` unless names match (case-insensitive) |

This mirrors manual **+ Add** in the benefits picker.

### 6.3 Name expectations after Apply

Python title-cases spoken names. FE should:

- Display applied names as returned
- On save, exact match may **miss** catalog entries with different spelling (`Car Fuel` vs `Fuel Allowance`) → **create new catalog row** per §10.1 (by design)
- Optionally show recruiter a hint that catalog resolution happens at save

---

## 7. TypeScript types (suggested updates)

Ensure `src/types/call-notes-extraction.ts` (or equivalent) includes:

```ts
export interface ExtractedBenefit {
  name: string
  amount?: number
  unit?: string
}

export type CallNotesExtractionValue =
  | string
  | number
  | boolean
  | string[]
  | ExtractedBenefit[]
  // ... other field types

// Narrow when fieldType === "benefits":
function isBenefitsExtraction(
  field: AllowedEmptyField,
  extraction: CallNotesExtraction,
): extraction is CallNotesExtraction & { value: ExtractedBenefit[] } {
  return field.fieldType === "benefits" && Array.isArray(extraction.value)
}
```

---

## 8. FE checklist

### Whitelist builder

- [x] Emit `fieldType: "benefits"` for empty `work_experience_{i}_benefits` — `empty-field-detection.ts` + `buildCallNotesAllowedEmptyFields()`
- [x] Use stable `workExperiences[{id}].benefits` in `fieldPath` — `toStableExtractFieldPath()`
- [x] **Do not** send `options` on benefits rows — benefits empty fields omit `options`
- [x] Include `context` with employer + job title when available — `formatWorkExperienceEmptyFieldContext()`

### Proxy / client

- [x] No change to proxy URL or body shape
- [x] Forward benefits rows unchanged to Python

### Review modal

- [x] Render `value[]` as human-readable benefit list — `formatQgDisplayValue()` in review dialog
- [x] Support optional `amount` / `unit` on each item — via `formatQgDisplayValue()` / apply coercion
- [x] Handle empty `extractions` gracefully

### Apply + save

- [x] Apply writes `{ name, amount?, unit? }[]` to form state — `coerceBenefits()` in `call-notes-apply-extractions.ts`
- [x] Save path: exact catalog match → link; else create via `POST /api/benefits` — `ensureBenefitsInLookup()` + `prepareCandidateCreateLookups()` in `candidates-api.ts` (§10.1)
- [x] No fuzzy rename at Apply time

### Regression smoke (manual)

| Step | Expected | Verified |
|------|----------|----------|
| 1. Candidate with empty WE benefits, employer DPL-IT, id `15` | Whitelist includes benefits row | Yes |
| 2. Notes: `At dpl, the benefits are car fuel and paid leaves` | — | Yes |
| 3. Analyze → review modal | Car Fuel, Paid Leaves | Yes |
| 4. Apply → form | Benefits visible on WE | Yes |
| 5. **Update & Verify** → reload | Benefits on WE + catalog rows created | Yes (2026-08-18) |
| 5b. **Create Candidate** → reload | Same as §10.1 | Not smoke-tested (shares `prepareCandidateCreateLookups()`) |

---

## 9. Out of scope (FE + Python)

| Item | Owner / note |
|------|----------------|
| Benefit catalog `options` in extract request | FE must not send |
| Benefit IDs in extract response | Python never returns |
| Fuzzy catalog matching at extract | FE on save only |
| Tech stacks via extract | v2 excluded — manual entry |
| Education benefits | Not on extract allowlist |

---

## 10. Coordination / deploy

| Layer | Action |
|-------|--------|
| Python QG | Deploy image with `call_notes_extract/benefits_normalize.py` + prompt/post-process updates |
| Next.js | No proxy change required if whitelist builder already omits `options` for benefits |
| FE types + Apply | Shipped — apply uses `coerceBenefits()`; optional `ExtractedBenefit` type still suggested (§7) |
| FE save §10.1 | Shipped — `collectBenefitNamesFromCandidateForm`, `ensureBenefitsInLookup` |

**Env (unchanged):**

```env
NEXT_PUBLIC_CALL_NOTES_EXTRACT_V1=true
QUESTIONS_API_URL=http://localhost:8002   # or Nginx /questions base in prod
```

---

## 11. Open items (FE — resolved 2026-08-18)

1. **`buildCallNotesAllowedEmptyFields()`** — **Confirmed.** Empty WE `benefits` emit `fieldType: "benefits"` with no `options`.
2. **Review modal / Apply** — **Confirmed.** `coerceBenefits()` treats `value` as `{ name, amount?, unit? }[]`.
3. **Save pipeline §10.1** — **Shipped.** `ensureBenefitsInLookup()` in `prepareCandidateCreateLookups()` mirrors tech stacks; manual **+ Add** still uses `createBenefit()` directly — both paths POST missing catalog names.
4. **Partial benefits** — **Out of scope v1.** Whitelist is empty-only; partial merge when WE already has benefits is not implemented.

---

## 12. Python test coverage (for FE reference)

| Test | Asserts |
|------|---------|
| `test_benefits_dpl_repro_contract_section_8_3` | Full §8.3 fixture |
| `test_benefits_postprocess_splits_compound_string_value` | String `value` → two objects |
| `test_benefits_postprocess_splits_string_list_value` | String array → two objects |
| `test_benefits_fallback_from_source_text_when_value_empty` | `value: []` + `sourceText` → parsed |
| `test_benefits_normalize_unit` | `amount` / `unit` preserved |

Run: `python -m pytest tests/test_call_notes_extract.py -v`

---

## 13. Agent prompt (FE)

```
Benefits extract is shipped on Python POST /api/call-notes/extract.

FE must:
- Whitelist empty work_experience_{i}_benefits as fieldType "benefits" WITHOUT options
- Display extraction.value as [{ name, amount?, unit? }]
- Apply to form state; on save match GET /api/benefits by exact name (case-insensitive) or POST new benefit

See docs/CALL_NOTES_EXTRACT_BENEFITS_FE_HANDOFF.md and API contract §8.3 / §10.1.
```
