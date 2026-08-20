# Backend: multi-university candidate filter (`universityIds`) — **Done**

Backend shipped `UniversityIds` on `CandidateFilterRequest` with `ResolveUniversityIds` semantics. See **`docs/CandidateFilterIntegration.md`** (Education filters + `matchedEducations`).

## Backend contract (live)

| Query param | Type | Resolution |
|-------------|------|------------|
| `universityIds` | `long[]?` | Primary — OR match on education rows |
| `universityId` | `long?` | Legacy — used only when `universityIds` is empty (`ResolveUniversityIds`: array wins, else `[UniversityId]`, else null) |

## Frontend wiring (this repo)

- `src/lib/services/candidates-api.ts` — `fetchCandidatesPage()` sends repeated **`universityIds`** only (same as `employerIds` / `projectIds`).
- `src/components/candidates-page-client.tsx` — `filters.universities` + URL chip → `universityIds` array.
- `src/components/candidates-filter-dialog.tsx` — Education section multi-select combobox.
- `src/lib/utils/candidate-matches.ts` — card badges from backend `matchedEducations.matchedByUniversityId` when present; client-side fallback uses `filters.universities.some()`.

## Verification

1. `GET /api/candidates?universityIds=3&universityIds=7` — candidates with education at university 3 **or** 7.
2. `GET /api/candidates?universityId=3` — still works via legacy alias (external deep-links).
3. `matchedEducations[].matchedByUniversityId: true` when row university is in the resolved set.
