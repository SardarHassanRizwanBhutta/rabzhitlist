# QG Education Removal — Python Agent Handoff

**Status:** Required across every Python Question Generation consumer/mode  
**Effective contract date:** 2026-07-29  
**Endpoint:** `POST /api/generate-questions`

## Required outcome

Education is no longer part of the Question Generation service contract.
Remove it globally from the Python QG repository, not only from the Cold Caller
conversation context.

The Next.js frontend now:

- omits `candidate_data.educations`;
- never sends an `education_*` key in `fields_to_generate`;
- has no `education` QG response type, allowlist entry, parser, grouping, or Cold
  Caller tab;
- preserves Candidate Education data and UI outside Cold Caller/QG.

## Python changes

Remove Education from:

1. request/Pydantic models, including `educations` and Education-specific nested
   request models;
2. section enums, constants, ordering, labels, and generation dispatch;
3. field allowlists, indexed-field parsing, missing-field detection, synthetic
   row generation, and `fields_to_generate` validation;
4. Basic/Advanced prompt maps, templates, fallback templates, priorities/weights,
   LLM context builders, and existing-value handling;
5. response models and serialization (`sections[]` must not contain
   `section: "education"`);
6. every API mode/consumer, fixture, example, snapshot, and test.

Removed keys include, at minimum:

```text
educations
education_{i}_universityName
education_{i}_isTopper
```

Also remove any other Education key supported internally by Python, even if it was
not in the former frontend allowlist.

## New response contract

This document covers Education removal only. Achievements has since been
reintroduced as a separate QG section; see
`docs/QG_ACHIEVEMENTS_REINTRODUCTION_HANDOFF.md` for the current full
five-section contract.

Return exactly these non-Education sections, in order:

1. `basic_information`
2. `work_experience`
3. `independent_tech_stacks`
4. `certifications`
5. `achievements`

Do not return a placeholder/empty Education section.

## Compatibility and validation

- A request containing legacy `candidate_data.educations` is rejected with HTTP
  `422`; it must never trigger Education generation.
- A legacy `educations` or `education_*` value in `fields_to_generate` is rejected
  with HTTP `422`.
- No Education data should be forwarded to an LLM.
- Existing Candidate Education behavior belongs to the main application and is
  outside the Python QG service.

## Required test updates

- Update expected section count/order from six to five, with Education removed
  and Achievements retained.
- Delete Education generation, enrichment, missing-only, populated, synthetic
  index `0`, priority, prompt-template, and response serialization tests.
- Add a regression test proving a normal request produces no `education` section
  and no `education_*` question/missing key.
- Add a legacy-input test proving `educations` / `education_*` cannot generate
  questions.
- Update API examples, fixtures, snapshots, and schema/OpenAPI assertions.

## Acceptance criteria

- Repository-wide search finds no active QG schema, generator, prompt, weight, or
  serializer for Education.
- `/api/generate-questions` returns only the five non-Education sections above
  for every mode.
- No response contains `education`, `educations`, or an `education_*` field.
- Non-Education QG tests remain green.

See also:

- `docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`
- `docs/FRONTEND_INTEGRATION_CONTRACT.md`
- `docs/CANDIDATE_DATA_MAPPING.md`
