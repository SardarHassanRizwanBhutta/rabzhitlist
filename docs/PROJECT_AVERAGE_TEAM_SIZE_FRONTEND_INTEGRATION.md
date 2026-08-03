# Project `averageTeamSize` — Frontend Integration

**Status:** Backend **implemented** (2026-08-03).  
**Audience:** Frontend / Next.js AI agent.  
**DB cutover:** [`PROJECT_AVERAGE_TEAM_SIZE_RUNBOOK.md`](./PROJECT_AVERAGE_TEAM_SIZE_RUNBOOK.md)  
**Filters:** [`CandidateFilterIntegration.md`](./CandidateFilterIntegration.md), [`ProjectFilterChanges.md`](./ProjectFilterChanges.md)

---

## 1. Breaking change

| Removed | Replacement |
|---------|-------------|
| `minTeamSize` / `maxTeamSize` on project DTOs | **`averageTeamSize`** (`number \| null`) |
| Query `minTeamSize` / `maxTeamSize` (candidate + project list) | **`averageTeamSizeMin`** / **`averageTeamSizeMax`** |
| `matchedProjects[].teamSize: { minTeamSize, maxTeamSize }` | **`matchedProjects[].averageTeamSize: number \| null`** |

`averageTeamSize` is whole people only (`int?`). Create/update may send `null` to clear.

---

## 2. Surfaces

- `GET`/`POST`/`PUT` `/api/projects` — `averageTeamSize`
- Candidate/project list filters — range on that field
- `matchedProjects[].averageTeamSize` — non-null only when `averageTeamSizeMin` and/or `averageTeamSizeMax` is active and that project’s average matched

---

## 3. FE checklist

- [x] Types / forms: single `averageTeamSize`
- [x] Clear with `null` on update
- [x] Filters renamed to `averageTeamSizeMin` / `averageTeamSizeMax`
- [x] Cards: scalar `averageTeamSize` on matched projects (no `teamSize` wrapper)
- [x] Typecheck / smoke
- [x] Employer list UI: `averageTeamSizeMin`/`Max` → API `projectTeamSizeMin`/`Max`

---

## 4. Agent prompt

```
Replace project min/max team size with averageTeamSize per
docs/PROJECT_AVERAGE_TEAM_SIZE_FRONTEND_INTEGRATION.md.

DTO: averageTeamSize number|null. Filters: averageTeamSizeMin/Max.
matchedProjects.averageTeamSize scalar number|null (drop teamSize object).
```
