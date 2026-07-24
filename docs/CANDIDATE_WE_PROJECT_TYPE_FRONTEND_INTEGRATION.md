# Candidate WE Project `type` — Frontend Integration

**Status:** Backend **implemented** (2026-07-23). Enum remap **2026-07-24** — see `docs/PROJECT_TYPE_ENUM_REMAP_RUNBOOK.md`.  
**Audience:** Frontend / Next.js AI agent.

**Change:** Nested work-experience projects include catalog project **`type`** (`ProjectType` enum integer, nullable).

---

## 1. Where it appears

Any response using `WorkExperienceProjectDto`, including:

- `GET /api/candidates/{id}` → `workExperiences[].projects[]`
- Work-experience project endpoints that return the same DTO

---

## 2. Contract

Each project item:

| JSON property | Type | Notes |
|---------------|------|--------|
| `workExperienceId` | number | unchanged |
| `projectId` | number | unchanged |
| `projectName` | string \| null | unchanged |
| **`type`** | **number \| null** | **`ProjectType` enum int**; `null` if unset on catalog project |
| `contribution` | string \| null | unchanged (contribution notes) |

**`ProjectType` integers** (same as project catalog after remap):

| Value | Name |
|------:|------|
| 0 | Employer |
| 1 | Freelance |
| 2 | Independent |

Example:

```json
{
  "workExperienceId": 10,
  "projectId": 42,
  "projectName": "Payments API",
  "type": 0,
  "contribution": "Owned checkout service"
}
```

---

## 3. FE checklist

- [x] Types: add `type: number | null` on WE nested project
- [x] Candidate details / WE project UI: color badge after name (contribution unchanged)
- [x] Handle `type: null` (hide badge)
- [x] Typecheck / smoke `GET /api/candidates/{id}`
- [x] Remap FE maps to Employer / Freelance / Independent (0 / 1 / 2); no legacy Academic / Personal / Open Source compat

---

## 4. Agent prompt

```
Add project type to nested WE projects per
docs/CANDIDATE_WE_PROJECT_TYPE_FRONTEND_INTEGRATION.md.

workExperiences[].projects[] now includes type (ProjectType int | null)
alongside projectName and contribution.

ProjectType ints: 0=Employer, 1=Freelance, 2=Independent.
```
