# Work Experience `salaryPolicy` — Frontend Integration

**Status:** Backend **implemented** (2026-07-31).  
**Audience:** Frontend / Next.js AI agent.  
**Related filter doc:** [`CandidateFilterIntegration.md`](./CandidateFilterIntegration.md)  
**DB backfill (manual):** [`WE_SALARY_POLICY_BACKFILL_RUNBOOK.md`](./WE_SALARY_POLICY_BACKFILL_RUNBOOK.md)

---

## 1. Contract

Nullable `SalaryPolicy` enum int on work experience rows — **independent** of employer `salaryPolicy`.

| Surface | Property | Type |
|---------|----------|------|
| WE GET / create / update | `salaryPolicy` | `number \| null` |
| Nested on `GET /api/candidates/{id}` → `workExperiences[]` | `salaryPolicy` | `number \| null` |
| Nested on `POST /api/candidates` → `workExperiences[]` | `salaryPolicy` | `number \| null` (optional) |
| List filter | `workExperienceSalaryPolicies` | repeated enum int |
| `matchedWorkExperiences[].salaryPolicy` | when filter active | `{ id, label } \| null` |

**Do not** confuse with `employerSalaryPolicies` (still employer-only).

### `SalaryPolicy` integers (unchanged)

| Value | Name | Label (matched) |
|------:|------|-----------------|
| 0 | GrossSalary | Gross Salary |
| 1 | RemittanceSalary | Remittance Salary |
| 2 | NetSalary | Net Salary |
| 3 | FixedSalaryPlusCommissionOrMonthlyBonus | Fixed Salary + Commission/ Monthly Bonus |

### Clear on update

WE update may send `"salaryPolicy": null` to clear a previously set value.

---

## 2. FE checklist

- [x] Types: `salaryPolicy: number | null` on WE models
- [x] Candidate details / WE form: read + write + clear
- [x] Create candidate nested WE: optional `salaryPolicy`
- [x] List filter: `workExperienceSalaryPolicies` (separate from employer)
- [x] Cards: `matchedWorkExperiences[].salaryPolicy` when that filter is active
- [x] Typecheck / smoke

---

## 3. Agent prompt

```
Add work-experience salaryPolicy per
docs/WE_SALARY_POLICY_FRONTEND_INTEGRATION.md and
docs/CandidateFilterIntegration.md (workExperienceSalaryPolicies).

WE create/update/GET + candidate nested: salaryPolicy enum int | null.
Clear with null on update. Filter workExperienceSalaryPolicies (WE only).
matchedWorkExperiences.salaryPolicy { id, label } | null when filter active.
employerSalaryPolicies unchanged.
```
