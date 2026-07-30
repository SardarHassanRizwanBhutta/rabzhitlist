# QG Work Experience Role / Employer / Project — Python Agent Handoff

**Status:** Required across every Python Question Generation consumer/mode  
**Effective contract date:** 2026-07-29  
**Endpoint:** `POST /api/generate-questions`

## Required outcome

1. Replace **Role Details** allowlist/weights/`prompt_type` map.
2. Replace **Employer Details** allowlist/weights/`prompt_type` map (drop awards;
   add `types`, `foundedYear`, employer `linkedinUrl`, office `isHeadquarters`).
3. Replace **nested Project** allowlist/weights/`prompt_type` map
   (`minTeamSize` / `maxTeamSize` / `clientLocations` / `contributionNotes`;
   drop download / publish / link / single `teamSize`).
4. When parent WE has an employer, **FE** omits project `employerName` /
   `projectType` from `fields_to_generate`. Python **trusts FE only** (no
   `employerId` / extra Python filter).
5. Preferences weights: Current **85** / Expected **15** (both `basic`).
6. Keep Education removed/rejected.

## Role Details (totals 100)

Display/sort weight descending:

| Suffix | Weight | Prompt |
|---|---:|---|
| `jobTitle` | 19 | basic |
| `startDate` | 17 | basic |
| `shiftType` | 16 | basic (enum) |
| `workMode` | 14 | basic (enum) |
| `techStacks` | 13 | advanced |
| `timeSupportZones` | 11 | basic (open) |
| `benefits` | 10 | basic |

- `employerName` is **not** a Role Details field (Employer Details only).
- Role `endDate` remains **not** allowlisted.
- `timeSupportZones` is **basic (open)** — no enum label list in question text.

## Employer Details (totals 100)

Display/sort weight descending. Synthetic office/layoff index `0` when empty.
Weights apply per office/layoff row.

| Key | Weight | Prompt |
|---|---:|---|
| `employerName` | 18 | basic |
| `office_{j}_country` | 14 | basic |
| `office_{j}_city` | 12.5 | basic |
| `headcount` | 11.5 | basic |
| `types` | 10.5 | advanced (enum) |
| `foundedYear` | 8.5 | basic |
| `salaryPolicy` | 7.5 | advanced (enum) |
| `status` | 6 | advanced (enum) |
| `linkedinUrl` | 5 | basic |
| `office_{j}_address` | 2.5 | basic |
| `office_{j}_isHeadquarters` | 1.5 | basic |
| `layoff_{j}_layoffDate` | 1 | basic |
| `layoff_{j}_affectedEmployees` | 0.8 | basic |
| `layoff_{j}_reason` | 0.7 | basic |

Do **not** place Shift Type / Work Mode / Time Support Zones / Benefits under
Employer Details (Role only). Drop `awards` from QG.

## Nested Project (totals 100)

Display/sort weight descending:

| Suffix | Weight | Prompt |
|---|---:|---|
| `projectName` | 15.98 | basic |
| `employerName` | 12.69 | basic |
| `projectType` | 10.34 | advanced (enum) |
| `startDate` | 8.46 | basic |
| `status` | 7.05 | basic (enum) |
| `description` | 6.11 | advanced |
| `contributionNotes` | 6 | advanced |
| `techStacks` | 5.45 | advanced |
| `verticalDomains` | 4.89 | advanced (enum) |
| `horizontalDomains` | 4.42 | advanced (enum) |
| `technicalDomains` | 3.95 | advanced (enum) |
| `technicalAspects` | 3.57 | advanced (enum) |
| `minTeamSize` | 3.2 | basic |
| `clientLocations` | 2.82 | basic |
| `latestUpdate` | 2.35 | basic |
| `maxTeamSize` | 1.69 | basic |
| `endDate` | 1.03 | basic |

`contributionNotes` is always listed in `fields_to_generate` (even when
populated); omit the populated property from sparse `candidate_data`. Python
always emits `prompt_type: "advanced"`. Call Notes shows Advanced question only
(no value card). Session-only local ask cues apply only before Generate Questions.

**Permanent contract:** **FE** omits project `employerName` and `projectType`
from `fields_to_generate` when the WE has an employer. Python trusts FE only —
if those keys are absent, do not generate them.

## Preferences (reminder)

| Field | Weight | Prompt |
|---|---:|---|
| `currentSalary` | 85 | basic |
| `expectedSalary` | 15 | basic |

## Acceptance criteria

- Role / Employer / Project weights and `prompt_type` values match tables above.
- Empty WE emits synthetic `work_experience_0_*` Role Details including
  `startDate` (not `employerName` under Role).
- Empty office/layoff emit `office_0_*` / `layoff_0_*` with new suffixes
  including `isHeadquarters`.
- Project emits `contributionNotes` (weight 6, `prompt_type: "advanced"`) whenever
  FE lists the key — including when Contribution is populated (populated value
  omitted from sparse `candidate_data`). Still does not emit `downloadCount`,
  `publishPlatforms`, `projectLink`, or single `teamSize`.
- Employer-present WE never returns project Employer / Project Type questions.
- Awards never returned for WE Employer Details.
- Preferences weights 85 / 15.

See also:

- `docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`
- `docs/FRONTEND_INTEGRATION_CONTRACT.md`
- `docs/QG_BASIC_PREFERENCES_HANDOFF.md`
- `docs/QG_PYTHON_SYNC_HANDOFF.md` (consolidated Achievements → Contribution)
