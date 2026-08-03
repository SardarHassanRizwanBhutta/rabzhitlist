# QG Nested Project `averageTeamSize` — Python Agent Handoff

**Status:** Python shipped (2026-08-03)  
**Audience:** AI / engineer implementing changes in the Python Question  
Generation service (`POST /api/generate-questions`)  
**Frontend status:** Shipped — Cold Caller FE allowlist and sparse payload use  
`averageTeamSize` only (weight **4.89**, `basic`).  
**Effective contract date:** 2026-08-03  
**Endpoint:** `POST /api/generate-questions`

### Python ship notes

- Nested Project allowlist: `averageTeamSize` (4.89, basic); removed `minTeamSize` /
  `maxTeamSize`
- Nested Project weights still sum to 100
- Legacy min/max in request / `fields_to_generate` ignored (no 422)
- Equal-weight sort: `verticalDomains` then `averageTeamSize`
- Demo sparse request + allowlist/weights/sort updated the same way

**Source of truth:**

- `docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md` (Nested Project allowlist + weights)
- `docs/FRONTEND_INTEGRATION_CONTRACT.md` (indexed field key shape)
- `docs/QG_WE_ROLE_EMPLOYER_PROJECT_HANDOFF.md` (full WE project table)
- `docs/QG_PYTHON_SYNC_HANDOFF.md` (consolidated sync tables)

---

## 1. Problem

FE Call Notes / generate-questions requests now send:

```text
work_experience_{i}_project_{j}_averageTeamSize
```

and sparse nested-project property `averageTeamSize` (`number | null`).

Python still allowlists / templates / weights:

- `minTeamSize` (3.2, basic)
- `maxTeamSize` (1.69, basic)

So Average Team Size questions are dropped (or legacy min/max keys are never
requested by FE).

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **ATS1** | Replace project QG suffixes `minTeamSize` + `maxTeamSize` with **one** suffix: `averageTeamSize` |
| **ATS2** | Weight **4.89**, `prompt_type: "basic"` (confirmed; equals former 3.2 + 1.69) |
| **ATS3** | Nested Project section still totals **100** with the updated table (see §3) |
| **ATS4** | Display/sort by weight descending; `averageTeamSize` sits with weight 4.89 (after `verticalDomains` at the same weight) |
| **ATS5** | If legacy `minTeamSize` / `maxTeamSize` appear in `candidate_data` or `fields_to_generate`, **ignore/drop** them (same as other non-allowlisted keys) — do **not** HTTP `422` |
| **ATS6** | Still do **not** allowlist single `teamSize`, `downloadCount`, `publishPlatforms`, `projectLink` / `link` |
| **ATS7** | No change to Contribution exception, employer-present omit of project `employerName` / `projectType`, or other WE fields |

---

## 3. Nested Project table (deltas only)

**Remove:**

| Suffix | Former weight | Former prompt |
|---|---:|---|
| `minTeamSize` | 3.2 | basic |
| `maxTeamSize` | 1.69 | basic |

**Add:**

| Suffix | Weight | Prompt |
|---|---:|---|
| `averageTeamSize` | 4.89 | basic |

Full Nested Project table (weight descending) — match allowlist contract:

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

---

## 4. Field keys in scope

Generate when FE lists the key in `fields_to_generate`:

```text
work_experience_{i}_project_{j}_averageTeamSize
```

Sparse `candidate_data` property (when missing):

```text
work_experiences[i].projects[j].averageTeamSize
```

(`null` / omitted when populated — missing-only sparse contract unchanged.)

---

## 5. Python changes (checklist)

1. Allowlist / field map: add `averageTeamSize`; remove `minTeamSize` and `maxTeamSize`.
2. Weights / `prompt_type`: `averageTeamSize` → **4.89**, **basic**.
3. Templates / stems / few-shots: ask for average team size (whole people), not min/max range.
4. Indexed-field parsers, fixtures, OpenAPI/examples, demos: rename keys.
5. Ignore/drop legacy `…_minTeamSize` / `…_maxTeamSize` if still present (no 422).
6. Restart the running Python service after deploy.

### Out of scope

- FE Call Notes / allowlist (already shipped)
- C# / Postgres `average_team_size` cutover
- Candidate/project/employer list filters
- Changing other Nested Project weights or Contribution behavior

---

## 6. Acceptance criteria

- [x] `…_averageTeamSize` generates a **basic** question when listed in `fields_to_generate` and missing in sparse data.
- [x] Sort/display weight for that field is **4.89**.
- [x] Responses never include `…_minTeamSize` or `…_maxTeamSize` questions.
- [x] Legacy min/max keys in a request are ignored/dropped (not 422).
- [x] Nested Project weights still sum to **100**.
- [x] Fixtures / local demos updated; service restarted.

---

## 7. Agent prompt (copy to Python session)

```
Update Cold Caller nested Project QG for averageTeamSize per
docs/QG_AVERAGE_TEAM_SIZE_HANDOFF.md in the Next.js repo
(rabzhitlist). Cross-check
docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md Nested Project table.

Breaking rename:
- REMOVE allowlist/weights/templates for minTeamSize and maxTeamSize
- ADD averageTeamSize weight 4.89 prompt_type basic
- Field key: work_experience_{i}_project_{j}_averageTeamSize
- Sparse property: averageTeamSize (number|null)
- Ignore/drop legacy minTeamSize/maxTeamSize if present (do not 422)
- Do not allowlist single teamSize / download / publish / link
- Keep contributionNotes exception and FE-owned employer-present omit

Endpoint: POST /api/generate-questions
Restart service after deploy.
```
