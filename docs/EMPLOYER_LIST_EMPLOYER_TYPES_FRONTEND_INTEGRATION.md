# Employer list — multi-value `employerTypes` frontend integration

**Status:** FE + backend **shipped** — run E2E after API deploy (`GET /api/employers` → **`employerTypes`** array, no **`employerType`**).  
**Backend contract:** [`EMPLOYER_LIST_EMPLOYER_TYPES_BACKEND_HANDOFF.md`](./EMPLOYER_LIST_EMPLOYER_TYPES_BACKEND_HANDOFF.md)

---

## 1. Summary

| What | Detail |
|------|--------|
| **UI** | `EmployersTable` Type column — multiple badges via `getEmployerTypeDbList` |
| **List API** | **`employerTypes: string[]`** on each `EmployerListItemDto`; **`employerType`** removed |
| **Mapping** | `employerListItemToEmployer` → `employerTypes` (db keys) + `employerType` (first display label on `Employer`) |
| **Detail** | Unchanged — `GET /api/employers/{id}` **`types: number[]`** via `employerDtoToEmployer` |

---

## 2. API client (`src/lib/services/employers-api.ts`)

### 2.1 `EmployerListItemDto`

- **`employerTypes?: string[]`** — display labels from list API  
- **`employerType`** — **removed** from type definition

### 2.2 Parser

**`parseEmployerTypesFromApi(raw)`** — list rows only:

- Accepts **int** enum values or **string** labels (and PascalCase wire names defensively).
- Maps list **`"SAAS"`** → `saas` via `EMPLOYER_TYPE_DISPLAY_TO_DB` (badges still render **`SaaS`** from `EMPLOYER_TYPE_DB_LABELS`).
- Dedupes while preserving order.

### 2.3 `employerListItemToEmployer`

```typescript
const employerTypesDb = parseEmployerTypesFromApi(item.employerTypes)
// sets employerTypes + employerType (first display label)
```

---

## 3. Table (`src/components/employers-table.tsx`)

No change required: **`getEmployerTypeDbList`** prefers **`employer.employerTypes`**, then falls back to singular **`employerType`**.

---

## 4. E2E smoke

1. Deploy API with list **`employerTypes`**.  
2. Open Employers table — employer with detail `types: [0, 2, 4]` should show **three** type badges (e.g. Services Based, SaaS, Integrator).  
3. Confirm list JSON has no **`employerType`** property.

---

## 5. Related docs

- [`EmployerFilterIntegration.md`](./EmployerFilterIntegration.md) — list item field list  
- [`EMPLOYER_MULTI_VALUE_WORK_ARRANGEMENTS_FRONTEND_INTEGRATION.md`](./EMPLOYER_MULTI_VALUE_WORK_ARRANGEMENTS_FRONTEND_INTEGRATION.md) — list vs detail wire formats
