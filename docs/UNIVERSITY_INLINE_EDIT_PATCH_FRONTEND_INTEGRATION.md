# University inline edit — frontend integration

**Status:** Frontend implemented; backend PATCH + GET active-only **shipped** — run E2E after API deploy.  
**Backend contract:** [`UNIVERSITY_INLINE_EDIT_PATCH_BACKEND_HANDOFF.md`](./UNIVERSITY_INLINE_EDIT_PATCH_BACKEND_HANDOFF.md)  
**Name errors:** [`EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md`](./EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md)

---

## 1. Summary

| What | Detail |
|------|--------|
| **UI** | `UniversityDetailsModal` — inline edit for scalars + existing campus rows |
| **Writes** | `PATCH` only (not PUT merge from modal) |
| **State** | Replace `localUniversity` with **PATCH response** (full `University`) |
| **Verification** | **Disabled** in modal until backend contract exists |
| **List table** | Refetch filtered list when details modal **closes** after an inline save or location delete (`onPersistedChange` → `loadUniversities`) |
| **Unchanged** | `UniversityCreationDialog` / `handleUniversitySubmit` → PUT + location POST/PUT/DELETE |
| **Out of scope** | Add campus in modal; edit `createdAt`/`updatedAt`; employer details modal |

---

## 2. API client (`src/lib/services/universities-api.ts`)

### 2.1 Types

```typescript
export interface PatchUniversityDto {
  name?: string
  countryId?: number | null
  ranking?: Ranking | null
  websiteUrl?: string | null
  linkedInUrl?: string | null
}

export interface PatchUniversityLocationDto {
  city?: string
  address?: string | null
  isMainCampus?: boolean
}
```

### 2.2 Functions

| Function | Route |
|----------|--------|
| `patchUniversity(id, body)` | `PATCH /api/universities/{id}` |
| `patchUniversityLocation(universityId, locationId, body)` | `PATCH /api/universities/{id}/locations/{locationId}` |

- **404** → throw `new Error("Not found")` (match existing helpers).
- **400** → `extractApiErrorMessage` on response text.
- **200** → `mapUniversityDto` → `University`.

Do **not** use `clearUniversityMainCampus` before PATCH once backend Option A is live.

---

## 3. Modal wiring (`src/components/university-details-modal.tsx`)

### 3.1 Handlers

| Handler | PATCH body |
|---------|------------|
| `handleFieldSave` → `name` | `{ name: trimmed }` |
| `handleFieldSave` → `ranking` | `{ ranking: LABEL_TO_RANKING[label] ?? null }` (empty selection → `null`) |
| `handleFieldSave` → `websiteUrl` / `linkedInUrl` | `{ …: trim \|\| null }` |
| `handleCountrySave` | `{ countryId: number \| null }` |
| `handleLocationFieldSave` | `{ city \| address \| isMainCampus }` per field |

On success: `setLocalUniversity(response)`; toast with human label (not raw field name).  
On failure: revert to snapshot; rethrow for inline field error UI.

### 3.2 Name field errors

Use `universityNameFieldErrorFromApi(message)` for inline error on **University Name** when API returns duplicate/required messages.

### 3.3 Country clear

`InlineEditableCountryField`:

- `onSave: (country: Country | null) => Promise<void>`
- Reselect the **same country** in the combobox to clear selection; save → PATCH `{ countryId: null }` when cleared
- Save enabled when selection changed including clear

### 3.4 Verification UI

Constant `UNIVERSITY_DETAILS_INLINE_VERIFY = false` — hides verification badges and “Mark as verified” checkboxes in this modal only.

### 3.5 Ranking select

Display uses `getRankingLabel(ranking)`; edit options use `UniversityRanking` labels; empty/clear → PATCH `{ ranking: null }`.

### 3.6 Main campus

Single PATCH `{ isMainCampus: true \| false }`; merge full response (server demotes other mains).

### 3.7 Delete location

Unchanged: `DELETE` + `fetchUniversityById` (or keep DELETE then refetch).

---

## 4. Deploy order

1. Deploy API build with PATCH routes (no new migration).
2. Frontend already calls PATCH from `UniversityDetailsModal`; smoke-test inline fields after deploy.

Creation dialog **PUT** flow unchanged. PATCH missing → inline saves fail; PUT edit still works.

### API 400 strings (inline saves — toast via `extractApiErrorMessage`)

| Message |
|---------|
| `Country not found.` |
| `Ranking must be null or a value between 0 and 3.` |
| `City is required.` |
| Name messages in [`EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md`](./EMPLOYER_UNIVERSITY_NAME_UNIQUENESS_FRONTEND_HANDOFF.md) |

---

## 5. Manual QA

- [ ] Each scalar field saves; modal stays open; dialog title updates on rename.
- [ ] Duplicate name → inline error + toast; modal open.
- [ ] Clear country (reselect current country) → `countryId: null` in UI after response.
- [ ] Clear ranking → null in UI.
- [ ] Two campuses: toggle main → only one main in response.
- [ ] Delete campus still works.
- [ ] Edit & Verify dialog still uses PUT flow.

---

## 6. Follow-ups (not v1)

- Shared inline components + `EmployerDetailsModal` PATCH handoff.
- Optional: refresh list while the details modal stays open (implemented: refresh on **close** after edits).
- Field verification API + enable `UNIVERSITY_DETAILS_INLINE_VERIFY`.
