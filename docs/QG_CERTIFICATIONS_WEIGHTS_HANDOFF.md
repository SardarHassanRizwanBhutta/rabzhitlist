# QG Certifications Weights Update — Python Agent Handoff

**Status:** Required across every Python Question Generation consumer/mode  
**Effective contract date:** 2026-07-29  
**Endpoint:** `POST /api/generate-questions`

## Required outcome

Update Certifications field weights, display order, and prompt types to match
the frontend Cold Caller contract. Education remains removed. Achievements
remains the fifth section (see `QG_ACHIEVEMENTS_REINTRODUCTION_HANDOFF.md`).

## Certifications contract

Section weightage totals **100**. All four fields use `prompt_type: "basic"`.

Display/sort by weight descending (highest first):

| Response suffix | Payload property | Weight | Prompt |
|---|---|---:|---|
| `name` | `certificationName` | 35 | basic |
| `issuingBody` | `issuingBody` | 30 | basic |
| `issueDate` | `issueDate` | 20 | basic |
| `expiryDate` | `expiryDate` | 15 | basic |

Replace the former weights (`name`/`issueDate`/`expiryDate` = 1,
`issuingBody` = 7.5) entirely.

API keys are unchanged:

```text
certification_{i}_name
certification_{i}_issuingBody
certification_{i}_issueDate
certification_{i}_expiryDate
```

There is still no `certifications` collection opener. Issuing Body is a normal
indexed field (not a catalog/enrichment-only field).

## Python changes

1. Update Certifications priority/weight map to the values above.
2. Ensure generation emits `prompt_type: "basic"` for all four keys.
3. Preserve missing-only behavior and synthetic `certification_0_*` for empty
   collections.
4. Update fixtures, snapshots, examples, and tests that assert the old weights
   or old display/sort order.

## Acceptance criteria

- Certifications questions/missing keys use weights 35 / 30 / 20 / 15.
- All four Certifications prompts are `basic`.
- Sort/display order is Name → Issuing Body → Issue Date → Expiry Date when
  ordered by weight descending.
- Legacy Education rejection tests remain green.
- Achievements section behavior is unchanged by this update.

See also:

- `docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`
- `docs/FRONTEND_INTEGRATION_CONTRACT.md`
- `docs/CANDIDATE_DATA_MAPPING.md`
