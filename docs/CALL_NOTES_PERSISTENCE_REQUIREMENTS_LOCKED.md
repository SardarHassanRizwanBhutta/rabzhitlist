# Call Notes Persistence — Locked Product Requirements (v1)

**Status:** Locked (2026-07-17). Updated 2026-07-30 — optional `callNotes` on candidate **POST create** (draft Cold Caller).  
**Audience:** Product, frontend, backend.  
**Backend handoff:** [`CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md`](./CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md)  
**Frontend handoff:** [`CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md`](./CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md)  
**Related (AI extract v1):** [`CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md) (CNE3 supersedes CN3 deferral).

---

## 1. Scope (v1)

| In scope | Out of scope (v1) |
|----------|-------------------|
| Persist one plain-text call-notes blob per candidate | Python / LLM extract → structured candidate fields |
| Dedicated GET + PATCH APIs | Call notes on Candidate Details / Create / Edit / list UI |
| Optional `callNotes` on **`POST /api/candidates`** (create only) | Including notes on `GET`/`PUT` `/api/candidates/{id}` |
| Cold Caller **Save Notes** (saved candidates) / draft Apply→Create | Rich text (bold, lists, HTML, Markdown) |
| Preserve newlines / blank lines exactly as typed | Call-notes history / multi-session append |
| sessionStorage draft until successful save | Concurrent-edit / conflict handling |

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **CN1** | **One** call-notes value per candidate; save **overwrites** the previous value |
| **CN2** | For **saved** candidates: persist via explicit **Save Notes** → PATCH (not on Update & Verify, not auto-save). For **unsaved draft** Cold Caller: notes are local until **Create Candidate** includes them on POST |
| **CN3** | Replace **Analyze Notes** with **Save Notes** while AI extract is deferred (saved candidates only) |
| **CN4** | Visibility: **Cold Caller only** for now |
| **CN5** | Format: **plain text only** — newlines and blank lines allowed; no bold/lists/rich text in v1 |
| **CN6** | Always editable by cold callers (overwrite allowed under CN8) |
| **CN7** | Keep **sessionStorage** draft as offline buffer; **clear draft after successful DB save** (PATCH or create-with-notes) |
| **CN8** | After first successful save, notes **must remain**: PATCH reject clear to empty (see §3) |
| **CN9** | Before first successful save, DB value is **`null`** (never saved) |
| **CN10** | APIs: **`GET` + `PATCH`** `/api/candidates/{id}/call-notes`, plus optional **`callNotes`** on **`POST /api/candidates`** (create only) |
| **CN11** | Never saved: GET returns **`200`** with `"call_notes": null` |
| **CN12** | Column type: **`nvarchar(max)`** / unbounded text |
| **CN13** | Sub-resource JSON property: **`call_notes`** (snake_case). Create body property: **`callNotes`** (camelCase, match other create fields) |
| **CN14** | Do **not** include call notes on main `GET`/`PUT` `/api/candidates/{id}` |
| **CN15** | Concurrent edits: **deferred** (last-write-wins is acceptable if it occurs; no conflict API) |
| **CN16** | Future AI: stored notes remain **human source of truth**; AI may only **propose** field fills and must **not** rewrite the stored notes blob |
| **CN17** | Draft Cold Caller (pre-create): hide **Save Notes**; **Apply to Create Candidate** carries local notes into create; blank notes → omit `callNotes` on POST |

---

## 3. Emptiness and storage rules

### 3.1 What counts as empty

A value is **empty** when it is:

- `null`, or  
- `""`, or  
- **whitespace-only after trim** (spaces, tabs, newlines alone → empty)

### 3.2 PATCH validation

- Every successful **PATCH** must send a **non-empty** `call_notes` string (not empty per §3.1).
- Therefore the first save and every overwrite require real content.
- After the first successful save, PATCH with empty content → **reject** (notes must remain).
- Before the first successful save, DB stays `null` until a valid (non-empty) PATCH succeeds.

### 3.2b POST create (`callNotes`)

- Property name: **`callNotes`** (camelCase).
- When notes are blank (empty per §3.1): **omit** the property from the create body (FE).
- If `callNotes` is present but empty/whitespace-only: backend **treats as omit** / stores `null` (**do not** `400`).
- If `callNotes` is non-empty: persist **exact** string (same preservation rules as PATCH); this counts as the first successful save (CN8/CN9).

### 3.3 Exact text preservation

- Store the request string **as received** (do **not** trim the stored value).
- Emptiness uses **trim only for validation**, not for mutating stored content.
- Newlines (`\n`) and blank lines inside non-empty notes must round-trip unchanged on GET.

### 3.4 Display (FE)

- Render with preserved whitespace (e.g. textarea or `white-space: pre-wrap`).

---

## 4. UX rules (Cold Caller)

1. Editor remains a plain multiline text control.
2. **Saved candidate:** Primary action **Save Notes** → PATCH. Disable Save when editor text is empty per §3.1.
3. **Draft (unsaved) Cold Caller:** Hide **Save Notes**; show **Apply to Create Candidate** instead. Notes stay local (sessionStorage) until create succeeds with optional `callNotes`.
4. On dialog open (saved id): load via dedicated GET; if `call_notes` is non-null, show it; else restore sessionStorage draft if any. Draft id (non-numeric): skip GET; use sessionStorage only.
5. On successful PATCH or successful create-with-notes: clear sessionStorage draft for that draft/candidate key.
6. Do not surface call notes on Candidate Details / Create / Edit form fields in v1 (notes travel only via draft Apply→create body).

---

## 5. Phasing

| Phase | Work |
|-------|------|
| **Backend** | Migration + GET/PATCH + validation (this handoff) |
| **Frontend** | After backend ships; see FE handoff (no FE implementation until API is available) |
| **Later** | Optional Details visibility; concurrent edits; rich text if product revisits |
| **Extract v1** | See [`CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md) |

---

## 6. Open items

None for v1 product rules. Backend may document exact error payload shape for `400`/`404` in its implementation notes as long as status codes match the backend handoff.
