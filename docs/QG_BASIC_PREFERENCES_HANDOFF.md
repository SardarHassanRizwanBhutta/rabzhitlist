# QG Basic Information + Preferences — Python Agent Handoff

**Status:** Required across every Python Question Generation consumer/mode  
**Effective contract date:** 2026-07-29  
**Endpoint:** `POST /api/generate-questions`

## Required outcome

1. Replace Basic Information allowlist with **Resume** + **LinkedIn URL** only.
2. Add a real **`preferences`** section for Current/Expected Salary.
3. Remove **CNIC** and **Personality Type** from QG entirely.
4. Keep Education removed/rejected.

The Next.js frontend now:

- sends `resume` (`"attached"` when present) and `linkedinUrl`;
- sends salaries under the Preferences section contract;
- no longer sends `cnic` / `personalityType` to QG;
- no longer partitions salaries from `basic_information` on the FE;
- still may show CNIC / Personality in Cold Caller **Fields** empty-field
  detection only (not Call Notes / QG).

## New response contract

Return exactly these six sections, in order:

1. `basic_information`
2. `preferences`
3. `work_experience`
4. `independent_tech_stacks`
5. `certifications`
6. `achievements`

## Basic Information

| Field | Weight | Prompt | Notes |
|---|---:|---|---|
| `resume` | 80 | basic | Present = `"attached"`; missing = null/empty |
| `linkedinUrl` | 20 | basic | |

Section totals **100**. Display/sort by weight descending:
Resume → LinkedIn URL.

## Preferences

| Field | Weight | Prompt |
|---|---:|---|
| `currentSalary` | 85 | basic |
| `expectedSalary` | 15 | basic |

Preferences section totals **100**. Display/sort by weight descending:
Current Salary → Expected Salary - Net (Cold Caller UI label only; API key
`expectedSalary` unchanged).

Do **not** keep salaries under `basic_information`.

## Removed from QG

- `cnic`
- `personalityType`
- FE-only Preferences ask cues (Benefits / Work Mode / Preferred Location) — FE
  removed; Python must not invent them.

## Python changes

1. Add `preferences` to section enums, ordering, labels, dispatch, response
   models, serializers, fixtures, and tests.
2. Move Current/Expected Salary generation from Basic into Preferences.
3. Replace Basic allowlist/weights/prompt map with `resume` + `linkedinUrl`.
4. Remove `cnic` / `personalityType` from allowlists, templates, weights, and
   generation. If they still appear in `candidate_data` or `fields_to_generate`,
   **ignore/drop** them (do **not** HTTP `422`).
5. Accept `candidate_data.resume` as `"attached"` when present.
6. Keep Education HTTP `422` rejection rules.

## Acceptance criteria

- `/api/generate-questions` returns the six sections above for every mode.
- Basic questions/missing keys are only `resume` / `linkedinUrl` with weights
  80 / 20 and `prompt_type: "basic"`.
- Preferences questions/missing keys are only `currentSalary` /
  `expectedSalary` with weights 85 / 15 and `prompt_type: "basic"`.
- No response contains `cnic`, `personalityType`, `education`, or `education_*`
  as generated QG fields (`cnic` / `personalityType` are ignored if sent;
  Education remains `422`).
- Existing Achievements / Certifications / Work Experience behavior remains
  otherwise unchanged.

See also:

- `docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`
- `docs/FRONTEND_INTEGRATION_CONTRACT.md`
- `docs/CANDIDATE_DATA_MAPPING.md`
- `docs/CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md`
