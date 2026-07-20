# Remove Candidate `isTopDeveloper` — Frontend Integration

**Status:** FE implemented (2026-07-16). Backend hard-remove + migration already applied.  
**Audience:** Frontend / Next.js AI agent.  
**Scope:** Remove all Top Developer UI, types, API mapping, and filters. Do not invent a replacement flag. Also remove **Worked with Top Developer** filter + related client match UI (product decision).

**Backend:** Column `candidates.is_top_developer` dropped; field removed from create/update/GET/list DTOs and `isTopDeveloper` list query param. Data progress: Top Developer +3 removed; **Email** now worth **4** pts (Basic max still 10) — FE scoring unchanged (backend-owned).

---

## 1. API contract changes

| Area | Before | After |
|------|--------|--------|
| GET `/api/candidates`, GET `/api/candidates/{id}` | `isTopDeveloper: boolean` | **Field omitted** |
| POST create / PUT update body | `isTopDeveloper` accepted | **Do not send** (ignored if unknown; prefer omit) |
| List filter `?isTopDeveloper=` | Supported | **Removed** — do not send |
| Data-progress Basic section | Missing field `"Top Developer"` possible | No Top Developer; Email worth more |

---

## 2. Files / areas to update (typical)

| Area | Action |
|------|--------|
| Candidate form types / `CandidateFormData` | Remove `isTopDeveloper` |
| Create / Edit / Details UI | Remove Top Developer toggle/checkbox/badge |
| List table / filters | Remove Top Developer **and** Worked with Top Developer filter controls |
| Client match context | Remove Top Developer / collaboration sample matching for those filters |
| `candidates-api.ts` (or equivalent) | Stop mapping `isTopDeveloper` on read/write; drop filter query param |
| Prefill / resume merge | Drop any mapping into Top Developer |
| QG `candidate_data` | Omit `isTopDeveloper` |
| Data-progress / missing-fields UI | Stop treating `"Top Developer"`; Email remains the missing-field label for email |

---

## 3. Checklist

- [x] Backend deployed + migration `DropCandidateIsTopDeveloper` applied
- [x] Types/API client: no `isTopDeveloper`
- [x] Create / Edit / Details: no Top Developer control
- [x] List filter: no `isTopDeveloper` query param
- [x] Worked with Top Developer filter + match UI removed
- [x] QG payload: no `isTopDeveloper`
- [x] Build / typecheck pass
- [ ] Manual: create/edit candidate without the field; list filters still work

---

## 4. Agent prompt (frontend)

```
Remove candidate isTopDeveloper per
docs/REMOVE_CANDIDATE_IS_TOP_DEVELOPER_FRONTEND_INTEGRATION.md.

Backend no longer returns or accepts isTopDeveloper; list filter is gone.
Also remove Worked with Top Developer from filters and client match UI.
Remove from QG candidate_data. Do not invent a replacement flag.
```
