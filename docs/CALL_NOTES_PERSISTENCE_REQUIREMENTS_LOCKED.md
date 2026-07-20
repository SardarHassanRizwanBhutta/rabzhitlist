# Call Notes Persistence — Locked Product Requirements (v1)

**Status:** Locked (2026-07-17).  
**Audience:** Product, frontend, backend.  
**Backend handoff:** [`CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md`](./CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md)  
**Frontend handoff:** [`CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md`](./CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md)  
**Related (deferred AI extract):** [`call_notes_frontend_api_contract.md`](./call_notes_frontend_api_contract.md)

---

## 1. Scope (v1)

| In scope | Out of scope (v1) |
|----------|-------------------|
| Persist one plain-text call-notes blob per candidate | Python / LLM extract → structured candidate fields |
| Dedicated GET + PATCH APIs | Call notes on Candidate Details / Create / Edit / list |
| Cold Caller **Save Notes** (replaces Analyze Notes) | Rich text (bold, lists, HTML, Markdown) |
| Preserve newlines / blank lines exactly as typed | Call-notes history / multi-session append |
| sessionStorage draft until successful save | Concurrent-edit / conflict handling |
| | Including `call_notes` on `GET`/`PUT` `/api/candidates/{id}` |

---

## 2. Locked decisions

| # | Decision |
|---|----------|
| **CN1** | **One** `call_notes` value per candidate; save **overwrites** the previous value |
| **CN2** | Persist only via explicit **Save Notes** in Cold Caller (not on Update & Verify, not auto-save to DB) |
| **CN3** | Replace **Analyze Notes** with **Save Notes** while AI extract is deferred |
| **CN4** | Visibility: **Cold Caller only** for now |
| **CN5** | Format: **plain text only** — newlines and blank lines allowed; no bold/lists/rich text in v1 |
| **CN6** | Always editable by cold callers (overwrite allowed under CN8) |
| **CN7** | Keep **sessionStorage** draft as offline buffer; **clear draft after successful DB save** |
| **CN8** | After first successful save, notes **must remain**: reject clear to empty (see §3) |
| **CN9** | Before first successful save, DB value is **`null`** (never saved) |
| **CN10** | APIs: **`GET` + `PATCH`** `/api/candidates/{id}/call-notes` only |
| **CN11** | Never saved: GET returns **`200`** with `"call_notes": null` |
| **CN12** | Column type: **`nvarchar(max)`** / unbounded text |
| **CN13** | JSON property name: **`call_notes`** (snake_case) |
| **CN14** | Do **not** include `call_notes` on main `GET`/`PUT` `/api/candidates/{id}` |
| **CN15** | Concurrent edits: **deferred** (last-write-wins is acceptable if it occurs; no conflict API) |
| **CN16** | Future AI: stored notes remain **human source of truth**; AI may only **propose** field fills and must **not** rewrite the stored notes blob |

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

### 3.3 Exact text preservation

- Store the request string **as received** (do **not** trim the stored value).
- Emptiness uses **trim only for validation**, not for mutating stored content.
- Newlines (`\n`) and blank lines inside non-empty notes must round-trip unchanged on GET.

### 3.4 Display (FE)

- Render with preserved whitespace (e.g. textarea or `white-space: pre-wrap`).

---

## 4. UX rules (Cold Caller)

1. Editor remains a plain multiline text control.
2. Primary action: **Save Notes** (replaces Analyze Notes).
3. Disable Save when current editor text is empty per §3.1.
4. On dialog open: load via dedicated GET; if `call_notes` is non-null, show it; else restore sessionStorage draft if any.
5. On successful PATCH: clear sessionStorage draft for that candidate; keep editor showing saved text (still editable).
6. Do not surface call notes on Candidate Details / Create / Edit in v1.

---

## 5. Phasing

| Phase | Work |
|-------|------|
| **Backend** | Migration + GET/PATCH + validation (this handoff) |
| **Frontend** | After backend ships; see FE handoff (no FE implementation until API is available) |
| **Later** | AI extract; optional Details visibility; concurrent edits; rich text if product revisits |

---

## 6. Open items

None for v1 product rules. Backend may document exact error payload shape for `400`/`404` in its implementation notes as long as status codes match the backend handoff.
