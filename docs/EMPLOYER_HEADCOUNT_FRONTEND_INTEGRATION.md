# Employer Headcount — Frontend Integration

**Status:** Backend **implemented** (2026-07-18). Apply DB steps in order (see runbook), deploy API, then FE.  
**Audience:** Frontend / Next.js AI agent.

**Backend:**
- Replaced `minEmployees` / `maxEmployees` with single `headcount` (`int?`)
- Data: existing `max_employees` copied into `headcount`; `min_employees` discarded
- Data progress: one field **Headcount = 2.5** pts (Basic Information max still 22.5); missing label `"Headcount"`
- Employer filters: `sizeMin` / `sizeMax` keep names; compare against `headcount` (null headcount excluded)
- Candidate filters: `employerSizeMin` / `employerSizeMax` keep names; same headcount rules
- Matched employer size: `"size": { "headcount": 200 }` (was `{ minEmployees, maxEmployees }`)

---

## 1. API contract changes

| Area | Before | After |
|------|--------|--------|
| Employer GET/POST/PUT / list item | `minEmployees`, `maxEmployees` | **`headcount`** only |
| Employer `sizeMin` / `sizeMax` | Range min/max logic | `headcount >= sizeMin` / `headcount <= sizeMax`; null headcount excluded |
| Candidate `employerSizeMin` / `employerSizeMax` | Range min/max logic | Same vs employer `headcount`; null excluded |
| `matchedEmployers[].size` | `{ minEmployees, maxEmployees }` | `{ headcount }` |
| Data-progress missing fields | `Minimum Employees`, `Maximum Employees` | **`Headcount`** (2.5 pts) |

---

## 2. Files / areas to update (typical)

| Area | Action |
|------|--------|
| Employer create/edit/details/list | One Headcount control; remove Min/Max employees fields |
| Employer list size filters | Keep wiring to `sizeMin`/`sizeMax`; labels can say Headcount min/max if product wants |
| Candidate employer-size filters | Keep `employerSizeMin`/`employerSizeMax`; update labels/help text |
| Matched employers UI | Read `size.headcount` |
| Data-progress UI | Show Headcount 2.5; drop Min/Max employee progress rows |
| Types / API clients | Drop `minEmployees`/`maxEmployees`; add `headcount` |

---

## 3. Checklist

- [x] Backend deployed
- [x] DB: migration 1 → data SQL → migration 2 applied (local + prod)
- [x] Employer progress recalc run after migrate
- [x] Types/API: `headcount` only
- [x] UI: single Headcount field; filters still use sizeMin/sizeMax params
- [x] Matched size uses `headcount`
- [x] Build / typecheck pass

---

## 4. Agent prompt (frontend)

```
Implement employer Headcount per
docs/EMPLOYER_HEADCOUNT_FRONTEND_INTEGRATION.md.

Replace minEmployees/maxEmployees with headcount everywhere.
Keep sizeMin/sizeMax and employerSizeMin/employerSizeMax query params.
Matched size is { headcount }. Progress missing field is Headcount (2.5 pts).
```
