# Employer Awards — Frontend Integration

**Status:** Backend **implemented** (2026-07-19). FE integration **done** (local).  
**Audience:** Frontend / Next.js AI agent.

**Backend:**
- Master catalog `awards` (`id`, unique `citext` `name`) + junction `employer_awards`
- CRUD `/api/awards` (same shape as time support zones)
- Employer create/update: `awardIds: number[]`
- Employer detail GET: `awards: { id, name }[]`
- Employer list: `awards: string[]` (names)
- List filter: `awards` = `long[]` award ids; match if employer has **any** of the ids
- No data-progress scoring in v1
- Candidate employer-awards filter: **deferred**

**FE product decisions (locked):**
- No separate awards admin page — `GET/POST /api/awards` + “+ Add Award” on multi-select (same as Time Support Zones)
- Skip Awards column on employer list table in v1
- Create/edit/details: Work Arrangements section (next to Time Support Zones)
- Details: editable multi-select; persists via `PUT` employer / `awardIds` (always send array, including `[]` to clear)
- Nested “+ Add Employer” (candidates / projects / cold caller dialog): awards multi-select included
- Filter: options from `GET /api/awards`; UI names → id query params

---

## 1. Catalog API

| Method | Path | Body / notes |
|--------|------|----------------|
| GET | `/api/awards` | All awards `{ id, name }[]` |
| GET | `/api/awards/{id}` | Single award |
| POST | `/api/awards` | `{ "name": "…" }` → 201 |
| PUT | `/api/awards/{id}` | `{ "name": "…" }` |
| DELETE | `/api/awards/{id}` | 204; **fails** if still linked to employers (Restrict) |

---

## 2. Employer contract changes

| Area | Change |
|------|--------|
| Create / Update | `awardIds: number[]` (update **always** sends array; `[]` clears) |
| Detail GET | `awards: { id, name }[]` |
| List item | `awards: string[]` (names) |
| List filter | `?awards=1&awards=2` — employer has any of these award ids |

---

## 3. UI areas

| Area | Action |
|------|--------|
| Awards admin / catalog | **No** separate page — load + create from multi-select only |
| Employer create/edit | Multi-select awards → send `awardIds` |
| Employer details | Editable multi-select; persists via employer update |
| Employer list table | **Skip** Awards column in v1 |
| Employer list filters | Multi-select awards → `awards` id query params |

---

## 4. Checklist

- [x] Migration `AddEmployerAwards` applied (local env)
- [x] Backend awards APIs live (local)
- [x] Catalog load + “+ Add Award” on employer multi-select (`awards-api.ts`)
- [x] Employer create/update/detail + filter (no list column)
- [x] Typecheck

---

## 5. Agent prompt (frontend)

```
Implement employer Awards per
docs/EMPLOYER_AWARDS_FRONTEND_INTEGRATION.md.

Catalog via GET/POST /api/awards on multi-select (no admin page).
Employer awardIds on create/update (always send on update).
Detail awards editable; list awards string[]; filter awards long[] (any match).
No list Awards column; no candidate filter in v1.
```
