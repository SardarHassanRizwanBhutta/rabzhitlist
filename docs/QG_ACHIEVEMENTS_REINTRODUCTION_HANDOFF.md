# QG Achievements Reintroduction — Python Agent Handoff

**Status:** Required across every Python Question Generation consumer/mode  
**Effective contract date:** 2026-07-29  
**Endpoint:** `POST /api/generate-questions`

## Required outcome

Achievements is part of the Question Generation service contract again.
Restore it globally in the Python QG repository, not only for the Cold Caller
conversation context.

The Next.js frontend now:

- sends `candidate_data.achievements` again;
- may send `achievement_*` keys in `fields_to_generate`;
- has an `achievements` QG response type, allowlist entry, parser, grouping, and
  Cold Caller tab;
- still keeps Candidate Education data and UI outside Cold Caller/QG, with
  Education rejected by QG.

## Python changes

Restore Achievements in:

1. request/Pydantic models, including `achievements` rows;
2. section enums, constants, ordering, labels, and generation dispatch;
3. field allowlists, indexed-field parsing, missing-field detection, synthetic
   row generation, and `fields_to_generate` validation;
4. Basic prompt maps, templates, fallback templates, priorities/weights, and
   any LLM context builders that enumerate active sections;
5. response models and serialization (`sections[]` must contain
   `section: "achievements"` when appropriate);
6. every API mode/consumer, fixture, example, snapshot, and test.

Required keys:

```text
achievement_{i}_name
achievement_{i}_year
achievement_{i}_description
achievement_{i}_achievementType
achievement_{i}_ranking
achievement_{i}_url
```

Do not use the legacy `achievement_{i}_type` suffix.

## Response contract

Return exactly these six sections, in order:

1. `basic_information`
2. `preferences`
3. `work_experience`
4. `independent_tech_stacks`
5. `certifications`
6. `achievements`

Do not return an Education section.

## Achievement behavior

- Every Achievement field uses `prompt_type: "basic"`.
- Section weightage totals **100**. Display/sort by weight descending
  (highest first):
  1. `name` — 20
  2. `year` — 18
  3. `description` — 17
  4. `achievementType` — 16
  5. `ranking` — 15
  6. `url` — 14
- Emit these exact numeric priorities/weights (do not use the former `1…6`
  sequence).
- `achievementType` is an enum. Use the existing values:
  `competition`, `openSource`, `award`, `medal`, `publication`,
  `certification`, `recognition`, `other`.
- There is no `achievements` collection-opener question or missing key.
- When `candidate_data.achievements` is empty, **FE** emits `achievement_0_*` in
  `fields_to_generate`; Python evaluates only those listed keys (does not invent
  index `0` on its own).

## Compatibility and validation

- A request containing legacy `candidate_data.educations` is still rejected with
  HTTP `422`.
- A legacy `educations` or `education_*` value in `fields_to_generate` is still
  rejected with HTTP `422`.
- `candidate_data.achievements` and `achievement_*` keys must no longer 422.
- Legacy `achievement_*_type` must be **migrated** to `achievementType`
  (`achievementType` wins if both present). Do not HTTP `422` solely for the
  legacy suffix. Canonical response suffix remains `_achievementType`.
- No Education data should be forwarded to an LLM.

## Required test updates

- Update expected section count/order from four/five to six (include
  `preferences` after `basic_information`).
- Add missing-only, populated, partial, and synthetic-index-0 Achievement tests.
- Add a request validation test proving `candidate_data.achievements` and
  `achievement_*` keys are accepted.
- Add or update legacy-key coverage for `achievement_*_achievementType` vs
  removed `_type`.
- Keep Education rejection tests green.
- Update API examples, fixtures, snapshots, and schema/OpenAPI assertions.

## Acceptance criteria

- `/api/generate-questions` returns the six sections above for every mode.
- A normal request with `candidate_data.achievements: []` returns HTTP `200`
  when FE lists `achievement_0_*` in `fields_to_generate`.
- No response contains `education`, `educations`, or an `education_*` field.
- No response uses the legacy `achievement_*_type` suffix (migrate inbound
  legacy keys to `achievementType`).
- Non-Achievement and Education-rejection QG tests remain green.

See also:

- `docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`
- `docs/FRONTEND_INTEGRATION_CONTRACT.md`
- `docs/CANDIDATE_DATA_MAPPING.md`
- `docs/CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md`
