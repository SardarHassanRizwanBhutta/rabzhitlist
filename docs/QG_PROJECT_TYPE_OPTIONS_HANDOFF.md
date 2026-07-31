# QG Project Type `options[]` — Python Agent Handoff

**Status:** Python shipped (2026-07-31)  
**Audience:** AI / engineer implementing changes in the Python Question
Generation service (`POST /api/generate-questions`)  
**Frontend status:** No FE override. Call Notes renders Python `options[]` as
chips/copy as-is (`docs/COLD_CALLER_QG_LONG_ENUM_OPTIONS_CONTRACT.md`).  
**Related product remap:** Catalog / C# / DB already trimmed to three values —
see `docs/PROJECT_TYPE_ENUM_REMAP_RUNBOOK.md` and
`docs/CANDIDATE_WE_PROJECT_TYPE_FRONTEND_INTEGRATION.md`.  
**Effective contract date:** 2026-07-31  
**Endpoint:** `POST /api/generate-questions`

### Python ship notes

- `PROJECT_TYPE_DISPLAY_LABELS` → `["Employer", "Freelance", "Independent"]`
- `BackendDataModelAndDtoReference.md` `ProjectType` → same three values (0 / 1 / 2)
- Smoke: `…_projectType` returns exactly those `options`, stem-only question, no
  Academic / Personal / Open Source

---

## 1. Problem

For `work_experience_{i}_project_{j}_projectType` (Advanced enum), Python still
returns `options` (and sometimes stems that enumerate) using the **old** list:

- Employer
- Academic
- Personal
- Freelance
- Open Source

Cold Caller / project catalog now have only **three** Project Types.

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **PT1** | `options[]` for `projectType` must be **exactly** the three display labels below — no more, no less |
| **PT2** | Labels are Title Case human display strings (same as FE `PROJECT_TYPES` / Call Notes chips) |
| **PT3** | Canonical order matches API / FE enum order **0 → 1 → 2** |
| **PT4** | `question` remains a **stem only** — do **not** inline the option catalog in prose (LE2) |
| **PT5** | FE will **not** override or filter `options[]`; Python is authoritative (LE4) |
| **PT6** | Scope is **Project Type only** (`…_projectType` / nested project `projectType`). Do not change Achievement types, employer `types`, domains, etc. |

---

## 3. Required `options[]`

| Order | Display label | Aligns with API int |
|------:|---------------|--------------------:|
| 1 | `Employer` | 0 |
| 2 | `Freelance` | 1 |
| 3 | `Independent` | 2 |

```json
"options": [
  "Employer",
  "Freelance",
  "Independent"
]
```

### Removed (must not appear in `options` or stem catalogs)

- `Academic`
- `Personal`
- `Open Source` / `OpenSource`

---

## 4. Field keys in scope

Any generated question whose `field` matches:

```text
work_experience_{i}_project_{j}_projectType
```

(`prompt_type: "advanced"`, section `work_experience` — unchanged.)

When the parent WE has an employer, FE continues to **omit** `projectType` from
`fields_to_generate` (existing contract). Python still must not invent those
keys; this handoff only updates the enum list when the key **is** generated.

---

## 5. Python changes (checklist)

1. Update the Project Type enum / label map used for LONG_ENUM `options[]` to
   the three labels in §3 (order preserved).
2. Remove Academic / Personal / Open Source from that map, fixtures, demos, and
   tests.
3. Ensure Advanced (enum) stems for `projectType` do **not** list the old five
   (or the new three) inline — put labels in `options` only.
4. If any prompt template, few-shot, or static catalog still teaches the old
   five-value list, replace it with the three-value list.
5. Restart the running Python service after deploy so Call Notes picks up the
   new `options[]`.

### Out of scope for this handoff

- FE Call Notes rendering / override
- C# / Postgres remap (already done per runbook)
- Changing weights, `prompt_type`, or allowlist membership for `projectType`

---

## 6. Acceptance criteria

- [x] For every `…_projectType` question in `/api/generate-questions` responses,
      `options` is exactly `["Employer", "Freelance", "Independent"]` in that
      order.
- [x] No response includes Academic, Personal, or Open Source in `options` or as
      an inlined stem catalog for Project Type.
- [x] `question` is stem-only; chips/copy on FE show only the three labels.
- [x] Fixtures / local demos updated; service restarted.

---

## 7. Agent prompt (copy to Python session)

```
Update Project Type LONG_ENUM options for Cold Caller QG per
docs/QG_PROJECT_TYPE_OPTIONS_HANDOFF.md in the Next.js repo.

For field work_experience_{i}_project_{j}_projectType:
- options must be exactly ["Employer", "Freelance", "Independent"] (order 0/1/2)
- remove Academic, Personal, Open Source from options maps, templates, fixtures
- keep question as stem only (do not inline the catalog)
- no FE changes; Python owns options[] (LE4)

Endpoint: POST /api/generate-questions
```
