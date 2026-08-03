# QG Python Sync Handoff — Achievements through Contribution

**Audience:** AI / engineer implementing changes in the Python Question Generation
service repo (`POST /api/generate-questions`)  
**Baseline already done on Python:** Education removal
(`docs/QG_EDUCATION_REMOVAL_HANDOFF.md` — do not re-implement; keep `422`
rejection for `educations` / `education_*`)  
**Effective contract date:** 2026-07-29  
**Frontend status:** Implemented in the Next.js Cold Caller QG integration  
**Python status:** Sync implemented (service + local demo/fixtures). Restart the
running Python service to load changes.

Implement the phases below **in order**. Later phases supersede earlier field
tables where they conflict (final end-state is Phase 4 + Preferences weights
from Phase 3).

---

## Python decisions locked (post-implementation)

Recorded after Python QG sync so FE contracts and future agents stay aligned:

| Topic | Decision |
|---|---|
| Scope shipped | Python service **and** local demo / fixtures |
| Synthetic index `0` | **FE owns** synthetics in `fields_to_generate`. Python **does not invent keys** — generates only listed keys |
| Employer-present → omit project Employer / Type | **Trust FE only** (if keys absent from `fields_to_generate`, do not generate; no `employerId` / extra Python filter) |
| Legacy `achievement_{i}_type` | **Migrate** to `achievementType` (`achievementType` wins if both present) |
| `timeSupportZones` | `prompt_type: "basic"` **(open)** — no enum label list in question text |
| `options[]` / LONG_ENUM contract | **Out of scope** this round — do not implement |
| `cnic` / `personalityType` | **Ignore / drop** if present in `candidate_data` or `fields_to_generate` (not HTTP `422`) |
| Education | Still HTTP **`422`** for `educations` / `education_*` |
| Contribution (`contributionNotes`) | Always in `fields_to_generate` (even when populated); omit populated value from sparse payload; Python always emits **`advanced`**; Call Notes: Advanced question only |

---

## Share set (give these files to the Python agent)

### Consolidated + feature handoffs

1. `docs/QG_PYTHON_SYNC_HANDOFF.md` ← **this file**
2. `docs/QG_ACHIEVEMENTS_REINTRODUCTION_HANDOFF.md`
3. `docs/QG_CERTIFICATIONS_WEIGHTS_HANDOFF.md`
4. `docs/QG_BASIC_PREFERENCES_HANDOFF.md`
5. `docs/QG_WE_ROLE_EMPLOYER_PROJECT_HANDOFF.md`

### Contracts / mapping (source of truth for keys & payload)

6. `docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`
7. `docs/FRONTEND_INTEGRATION_CONTRACT.md`
8. `docs/CANDIDATE_DATA_MAPPING.md`
9. `docs/CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md`
10. `docs/PROJECT_DOCUMENTATION.md` — architecture / runtime reference for the
    Python service; **field/section tables in this sync handoff and the
    allowlist contract override any older section counts or weights** inside
    `PROJECT_DOCUMENTATION.md`.

### Context only (already shipped on Python)

- `docs/QG_EDUCATION_REMOVAL_HANDOFF.md`

---

## Locked section order (final)

Return exactly these **six** sections for every mode:

1. `basic_information`
2. `preferences`
3. `work_experience`
4. `independent_tech_stacks`
5. `certifications`
6. `achievements`

Never return `education`. Never emit collection openers
(`work_experiences`, `work_experience_{i}_projects`, `certifications`,
`achievements`).

`fields_to_generate` is authoritative. Sparse missing-only `candidate_data`.
When collections are empty, **FE** emits synthetic index `0` keys in
`fields_to_generate` (and matching sparse stubs). Python must **not** invent
synthetic keys — only generate keys present in `fields_to_generate`.

---

## Phase 1 — Achievements reintroduction

Restore Achievements globally (not Cold-Caller-only).

**Keys:**

```text
achievement_{i}_name
achievement_{i}_year
achievement_{i}_description
achievement_{i}_achievementType
achievement_{i}_ranking
achievement_{i}_url
```

Do **not** emit legacy `achievement_{i}_type` as the canonical response suffix.
If a request still sends legacy `achievement_*_type` (payload or
`fields_to_generate`), **migrate** to `achievementType` (`achievementType` wins
if both are present). Do not HTTP `422` solely for the legacy suffix.

| Suffix | Weight | Prompt |
|---|---:|---|
| `name` | 20 | basic |
| `year` | 18 | basic |
| `description` | 17 | basic |
| `achievementType` | 16 | basic (enum) |
| `ranking` | 15 | basic |
| `url` | 14 | basic |

Section totals **100**. Empty `achievements: []` → **FE** emits
`achievement_0_*` in `fields_to_generate`; Python generates only listed keys.
Accept `candidate_data.achievements` and `achievement_*` (no 422). Keep Education
`422` rules.

**Detail:** `docs/QG_ACHIEVEMENTS_REINTRODUCTION_HANDOFF.md`

---

## Phase 2 — Certifications weights

API keys unchanged. Replace former weights entirely.

| Response suffix | Payload | Weight | Prompt |
|---|---|---:|---|
| `name` | `certificationName` | 35 | basic |
| `issuingBody` | `issuingBody` | 30 | basic |
| `issueDate` | `issueDate` | 20 | basic |
| `expiryDate` | `expiryDate` | 15 | basic |

Section totals **100**. Display weight-descending:
Name → Issuing Body → Issue Date → Expiry Date.
No `certifications` opener. Synthetic `certification_0_*` when empty.

**Detail:** `docs/QG_CERTIFICATIONS_WEIGHTS_HANDOFF.md`

---

## Phase 3 — Basic Information + Preferences

### Basic Information (totals 100)

| Field | Weight | Prompt | Notes |
|---|---:|---|---|
| `resume` | 80 | basic | Present = `"attached"` |
| `linkedinUrl` | 20 | basic | |

**Remove from QG allowlist / generation:** `cnic`, `personalityType`.
If they still appear in `candidate_data` or `fields_to_generate`, **ignore/drop**
them (same as other non-allowlisted keys) — do **not** HTTP `422`.
Do not invent FE-only Preferences cues (Benefits / Work Mode / Preferred Location).

### Preferences (totals 100) — real section `preferences`

| Field | Weight | Prompt |
|---|---:|---|
| `currentSalary` | 85 | basic |
| `expectedSalary` | 15 | basic |

Salaries must **not** live under `basic_information`.
API key stays `expectedSalary` (Cold Caller UI label “Expected Salary - Net”
is FE-only).

**Detail:** `docs/QG_BASIC_PREFERENCES_HANDOFF.md`

---

## Phase 4 — Work Experience Role / Employer / Project (+ Contribution)

**Detail:** `docs/QG_WE_ROLE_EMPLOYER_PROJECT_HANDOFF.md`

### Role Details (totals 100)

| Suffix | Weight | Prompt |
|---|---:|---|
| `jobTitle` | 19 | basic |
| `startDate` | 17 | basic |
| `shiftType` | 16 | basic (enum) |
| `workMode` | 14 | basic (enum) |
| `techStacks` | 13 | advanced |
| `timeSupportZones` | 11 | basic (open) |
| `benefits` | 10 | basic |

- `employerName` is **Employer Details only** (not Role).
- Role `endDate` is **not** allowlisted.
- Empty WE → **FE** emits synthetic `work_experience_0_*` including Role
  `startDate` in `fields_to_generate`.

### Employer Details (totals 100)

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

- Do **not** put Shift Type / Work Mode / Time Support Zones / Benefits under
  Employer (Role only).
- Drop `awards` from QG.
- Empty `locations` / `layoffs` → **FE** emits synthetic index `0` keys;
  weights apply per row. Python does not invent those keys.

### Nested Project (totals 100)

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
| `averageTeamSize` | 4.89 | basic |
| `horizontalDomains` | 4.42 | advanced (enum) |
| `technicalDomains` | 3.95 | advanced (enum) |
| `technicalAspects` | 3.57 | advanced (enum) |
| `clientLocations` | 2.82 | basic |
| `latestUpdate` | 2.35 | basic |
| `endDate` | 1.03 | basic |

**Contribution exception:** FE always includes
`work_experience_{i}_project_{j}_contributionNotes` in `fields_to_generate`
(even when populated) and omits the populated value from sparse
`candidate_data`. Python always emits `prompt_type: "advanced"`. Call Notes
shows the Advanced question only (no value card). Session-only ask cues only
before Generate Questions.

**Permanent contract (FE-owned filter):** if parent WE has an employer, **FE**
omits project `employerName` and `projectType` from `fields_to_generate`.
Python **trusts FE only** — no `employerId` on the payload and no extra Python
employer-present filter; if those keys are absent from `fields_to_generate`,
do not generate them.

**Do not emit for Project QG:** `downloadCount`, `publishPlatforms`,
`projectLink` / `link`, single `teamSize`, `minTeamSize`, `maxTeamSize`.

---

## Frontend summary (for Python context)

Already implemented on Next.js Cold Caller Call Notes QG (Fields empty-field
detection for Basic/WE largely left unchanged except Achievements Fields wiring):

1. Achievements section + synthetic `0` + session Add.
2. Certifications weight/order update; Issuing Body in main list.
3. Basic = resume + LinkedIn; Preferences section; Expected Salary - Net label
   (Cold Caller only); six-section API order.
4. WE Role / Employer / Project allowlists & weights; Contribution restored at
   weight 6 (`advanced`) after Description with proportional 2-decimal
   redistribution; employer-present suppresses project Employer + Type.

Python must match the **final tables in this file** and the allowlist contract.

---

## Global acceptance checklist

- [ ] Six sections in locked order; no Education section.
- [ ] Education `422` still green; Achievements accepted.
- [ ] Achievements weights 20→14, all `basic`; FE emits synthetic `0` keys.
- [ ] Legacy `achievement_*_type` migrated to `achievementType` (not 422).
- [ ] Certifications weights 35/30/20/15, all `basic`.
- [ ] Basic only `resume`/`linkedinUrl` (80/20); `cnic`/`personalityType` ignored/dropped.
- [ ] Preferences section only salaries 85/15, both `basic`.
- [ ] WE Role / Employer / Project tables match Phase 4 (including
      `contributionNotes` = 6 advanced; `timeSupportZones` = basic open).
- [ ] Project Employer / Type omitted only when FE leaves them out of
      `fields_to_generate` (trust FE).
- [ ] No awards; no project download/publish/link/single `teamSize` /
      `minTeamSize` / `maxTeamSize`.
- [ ] Nested Project uses `averageTeamSize` (weight 4.89, `basic`) — not min/max.
- [ ] `options[]` / LONG_ENUM **not** required this round.
- [ ] Tests, fixtures, OpenAPI/examples updated for six sections and new keys.

---

## Recommended Python agent prompt

```text
Education removal is already done. Implement the Next.js Cold Caller QG sync
from docs/QG_PYTHON_SYNC_HANDOFF.md in phase order (Achievements → Certs →
Basic/Preferences → WE Role/Employer/Project including contributionNotes and
averageTeamSize). Use COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md and
FRONTEND_INTEGRATION_CONTRACT.md as field/key source of truth. For the
minTeamSize/maxTeamSize → averageTeamSize cutover alone, use
docs/QG_AVERAGE_TEAM_SIZE_HANDOFF.md. Use PROJECT_DOCUMENTATION.md for service
architecture only — override any outdated section counts/weights with this
sync handoff. Keep Education HTTP 422. fields_to_generate is authoritative.
```
