# Question Generation Service — Property Sync Contract (2026-07-20)

**Status:** Python QG **shipped** + FE **synced** (2026-07-20).  
**Audience:** Python Question Generation service (`:8002`) + Next.js FE.  
**Related FE docs:**  
[`CANDIDATE_DATA_MAPPING.md`](./CANDIDATE_DATA_MAPPING.md),  
[`CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md`](./CANDIDATE_DATA_QUESTION_SERVICE_PAYLOAD.md),  
[`FRONTEND_INTEGRATION_CONTRACT.md`](./FRONTEND_INTEGRATION_CONTRACT.md)

**Out of scope:** Resume parser; call-notes extract; ASP.NET API (already shipped these domain changes).  
**Already done (do not re-open):** Remove `independent_projects` / top-level `projects` — see [`CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_QG_SERVICE.md`](./CANDIDATE_STANDALONE_PROJECTS_CONSOLIDATION_QG_SERVICE.md).

---

## 0. Summary

Align QG request `candidate_data` missing-field detection and response `field` keys with main-app / ASP.NET after:

| Change | Action |
|--------|--------|
| Employer size | `minEmployees` + `maxEmployees` → single **`headcount`** |
| Employer awards | Add **`awards: string[]`** (names) on WE employer catalog |
| Employer tags | **Remove** `tags` |
| Layoff source | **Remove** layoff `source` |
| Candidate `isTopDeveloper` | **Remove** |
| Project notes | Nested project **`notes` → `latestUpdate`** only (no WE-level field) |

---

## 1. Locked decisions

| # | Decision |
|---|----------|
| **QG-S1** | Payload property on each `workExperiences[i]`: **`headcount: number \| null`**. Drop `minEmployees`, `maxEmployees`. |
| **QG-S2** | apiFieldName: **`work_experience_{i}_headcount`**. Never emit `…_minEmployees` / `…_maxEmployees`. |
| **QG-S3** | Payload property on each `workExperiences[i]`: **`awards: string[]`** (employer award **names**). Empty `[]` → missing key **`work_experience_{i}_awards`** (same pattern as former `tags`). |
| **QG-S4** | Do **not** emit `work_experience_{i}_tags` or read `tags` on the row. If legacy client still sends `tags`, **ignore**. |
| **QG-S5** | Layoff objects: only `layoffDate`, `affectedEmployees`, `reason`. Drop **`source`**. Never emit `work_experience_{i}_layoff_{j}_source`. If legacy sends `source`, **ignore**. |
| **QG-S6** | Drop top-level **`isTopDeveloper`** from payload contract and from basic_information missing/questions. If present in request, **ignore**. |
| **QG-S7** | Nested projects under WE: payload property **`latestUpdate`** (not `notes`). apiFieldName **`work_experience_{i}_project_{j}_latestUpdate`**. Do **not** add `work_experience_{i}_latestUpdate`. |
| **QG-S8** | If legacy nested project still sends `notes`, treat as **`latestUpdate`** for missing detection (compat) **or** ignore `notes` after FE cutover — prefer: read `latestUpdate` first; if absent, fall back to `notes` once; do not emit `…_notes` in responses. |
| **QG-S9** | `independent_projects` remains removed (**already shipped**). |
| **QG-S10** | Awards / headcount live on the **WE JSON row** as employer-catalog fields (same pattern as `foundedYear`, former `tags`). They are employer facts for that role’s employer, not role link fields. |
| **QG-S11** | Priority weights (apiFieldName suffix / field): **`headcount` = `2.5`** (only `work_experience_{i}_headcount`). **`awards` = `0`** — still ask when `awards[]` empty; sorts last within the tab. |

---

## 2. Request `candidate_data` deltas

### 2.1 Basic information — remove

```text
isTopDeveloper   # DELETE from schema + detection + questions
```

### 2.2 Work experience row — employer catalog

**Before → After**

| Property | Before | After |
|----------|--------|--------|
| Size | `minEmployees`, `maxEmployees` | **`headcount: number \| null`** |
| Awards | _(absent)_ | **`awards: string[]`** |
| Tags | `tags: string[]` | **Removed** |

### 2.3 Layoffs — `workExperiences[i].layoffs[j]`

| Property | After |
|----------|--------|
| `layoffDate` | Keep |
| `affectedEmployees` | Keep |
| `reason` | Keep |
| `source` | **Removed** |

### 2.4 Nested projects — `workExperiences[i].projects[j]`

| Property | After |
|----------|--------|
| `latestUpdate` | **`string \| null`** (replaces `notes`) |
| `notes` | **Do not require**; optional legacy read only (QG-S8) |

No other project fields change in this pass.

---

## 3. Response `field` / `missing_fields` deltas

### 3.1 Stop emitting (forbidden after cutover)

```text
isTopDeveloper
work_experience_{i}_minEmployees
work_experience_{i}_maxEmployees
work_experience_{i}_tags
work_experience_{i}_layoff_{j}_source
work_experience_{i}_project_{j}_notes
# and any standalone / independent project notes keys if still present
```

### 3.2 Start emitting

```text
work_experience_{i}_headcount     # missing when headcount is null
work_experience_{i}_awards        # missing when awards is [] or absent
work_experience_{i}_project_{j}_latestUpdate
```

### 3.3 Empty `workExperiences[]` synthetic key recount

Previously documented as **51** keys when the array is empty. After this sync, employer catalog and layoff counts change:

| Group | Count change |
|-------|----------------|
| Employer catalog | Was 11 (incl. min, max, tags) → **10** (`headcount` + `awards`, no min/max/tags) |
| First layoff | Was 4 → **3** (no `source`) |
| Nested project `project_0_*` | Same count; suffix `notes` → **`latestUpdate`** |

**Recompute and document the new total** in Python + FE mapping docs when implementing (do not keep “51” if inaccurate).

**Empty-WE total after this sync: 49** (`1` opener + `9` link + `10` catalog + `4` office + `3` layoff + `1` projects opener + `21` project fields).

Suggested catalog list for empty synthetic role `work_experience_0_*`:

1. `foundedYear`  
2. `status`  
3. `types`  
4. `ranking`  
5. **`headcount`**  
6. `websiteUrl`  
7. `linkedInUrl`  
8. `isDplCompetitor`  
9. `salaryPolicy`  
10. **`awards`**

Layoff synthetic: `layoff_0_layoffDate`, `layoff_0_affectedEmployees`, `layoff_0_reason` only.

---

## 4. Missing / empty rules (unchanged semantics)

| Field | Missing when |
|-------|----------------|
| `headcount` | `null` / absent |
| `awards` | `[]` or absent |
| `latestUpdate` | `null` / `""` / absent (after legacy `notes` fallback if used) |
| Booleans (`isDplCompetitor`, etc.) | Only `null` is missing; `false` is present |

Catalog fields (incl. headcount, awards) remain **missing-only** (no enrichment prompts) unless an existing enrichment rule already covers them — **do not** add enrichment for headcount/awards in this pass.

---

## 4.1 Priority weights (locked)

| apiFieldName / suffix | Weight | Notes |
|----------------------|--------|--------|
| `work_experience_{i}_headcount` | **2.5** | Employer catalog only — not applied to any other field |
| `work_experience_{i}_awards` | **0** | Still generate missing question when `awards[]` empty; sorts **last** within Work Experience |

Remove any legacy weights for `minEmployees`, `maxEmployees`, `tags`, layoff `source`, and `isTopDeveloper`.

---

## 5. Frontend obligations (this repo)

| Area | Change | Status |
|------|--------|--------|
| `WorkExperienceForService` | `headcount`, `awards`; drop min/max | Done |
| `map-work-experience-for-service` | Map/enrich `headcount` + `awards` from employer GET | Done |
| Nested project mapper | Emit `latestUpdate` only | Done |
| Labels / catalog suffix sets | `headcount`, `awards`; drop min/max/tags/source/notes | Done |
| Docs | Mapping + payload + integration contract | Done |

### FE checklist

- [x] Types: `headcount`, `awards` on WE service payload; drop `minEmployees` / `maxEmployees`
- [x] Enrich employer catalog with `headcount` + award **names**
- [x] Map WE payload with `headcount` / `awards` (preserve `headcount: 0` as present)
- [x] Nested projects emit `latestUpdate` (not `notes`)
- [x] Cold Caller catalog suffixes + field labels (`headcount`, `awards`)
- [x] Docs: mapping, payload, integration contract, this sync contract
- [x] No FE emit of `isTopDeveloper`, `tags`, layoff `source`, min/max employees

---

## 6. Checklist (Python)

- [x] Drop `isTopDeveloper` from models, detection, priorities, sample data, demos  
- [x] Replace min/max employees with `headcount` (payload + apiFieldName)  
- [x] Add `awards: string[]` + `work_experience_{i}_awards`  
- [x] Remove `tags` handling / keys  
- [x] Remove layoff `source` handling / keys  
- [x] Nested project `notes` → `latestUpdate` (response keys never `…_notes`)  
- [x] Update empty-WE synthetic key list + total count (**49**)  
- [x] Ignore legacy request fields listed in §1 without 4xx (silent)  
- [x] Set priority: `headcount` = 2.5; `awards` = 0 (still ask when empty)
- [x] Smoke: generate-questions with enriched employer (headcount + awards) and project `latestUpdate`

---

## 7. Agent prompt (Python QG)

```
Implement QG property sync per docs/QUESTION_GENERATION_PROPERTY_SYNC_CONTRACT.md
in this Python Question Generation service repo.

1) Remove isTopDeveloper from basic_information.
2) On workExperiences[i]: replace minEmployees/maxEmployees with headcount;
   add awards: string[]; remove tags.
3) On layoffs[j]: remove source.
4) On workExperiences[i].projects[j]: notes → latestUpdate;
   emit work_experience_{i}_project_{j}_latestUpdate only (no WE-level latestUpdate).
5) Priority weights: headcount=2.5; awards=0 (still ask when empty, sort last).
6) Update missing_fields / question field keys; recompute empty-WE synthetic totals.
7) Keep independent_projects removed. Ignore listed legacy fields if still sent.
```
