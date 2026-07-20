# Call Notes Persistence — Frontend Integration

**Status:** Backend **implemented** (2026-07-17). Deploy API + apply EF migration `AddCandidateCallNotes`, then implement FE.  
**Audience:** Frontend / Next.js AI agent.  
**Product spec (locked):** [`CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md)  
**Backend handoff:** [`CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md`](./CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md)  
**Deferred AI extract (do not wire for save):** [`call_notes_frontend_api_contract.md`](./call_notes_frontend_api_contract.md)

---

## 1. API contract (consume exactly)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/candidates/{id}/call-notes` | Load notes when Cold Caller opens |
| `PATCH` | `/api/candidates/{id}/call-notes` | Save Notes |

**JSON property:** `call_notes` (snake_case).

**GET never saved:**

```json
{ "call_notes": null }
```

**PATCH body / success response:**

```json
{ "call_notes": "…exact plain text…" }
```

**Do not** read or write `call_notes` via `GET`/`PUT` `/api/candidates/{id}`.

---

## 2. UI / UX changes (Cold Caller only)

| Area | Action |
|------|--------|
| `CallNotesEditor` | Replace **Analyze Notes** with **Save Notes** |
| Save enablement | Disabled when editor text is empty (`null` / `""` / whitespace-only after trim) |
| Formatting | Plain `textarea`; display with preserved newlines (`pre-wrap` / native textarea) |
| Draft | Keep `useCallNotesDraft` / sessionStorage; **clear draft after successful PATCH** |
| Load on open | `GET` call-notes; if `call_notes != null`, set editor to that value; else restore session draft |
| Surfaces | **No** Candidate Details / Create / Edit / list for v1 |
| AI extract | Leave extract flow unused for this save path; do not call `/api/call-notes/extract` from Save Notes |

### Suggested load precedence

1. Dialog opens for candidate `id`.  
2. `GET /api/candidates/{id}/call-notes`.  
3. If `call_notes` is a non-null string → editor = that value (saved source of truth).  
4. Else → editor = sessionStorage draft (may be `""`).  
5. User edits; draft continues to debounce into sessionStorage until save.  
6. **Save Notes** → `PATCH` with current editor text → on success clear session draft; keep editor content; toast success.  
7. On `400` (empty reject): show API/error message; do not clear draft.

---

## 3. Types / client (typical)

```ts
// Example — align names with repo conventions when implementing
export interface CandidateCallNotesDto {
  call_notes: string | null
}

export async function fetchCandidateCallNotes(candidateId: number): Promise<CandidateCallNotesDto>
export async function patchCandidateCallNotes(
  candidateId: number,
  call_notes: string,
): Promise<CandidateCallNotesDto>
```

Map into Cold Caller state; do not add `call_notes` to the main `Candidate` list/detail type **unless** needed for Cold Caller-only state (prefer dedicated fetch).

---

## 4. UX copy (suggested)

- Button: **Save Notes**  
- Helper: drop “system will identify high-confidence values…” AI wording while extract is deferred; use copy that notes are saved for this candidate and newlines are kept. Exact final strings are FE-owned as long as behavior matches the locked spec.  
- Hint: keep “Draft saved locally” for sessionStorage; after PATCH success, optional “Notes saved”.

---

## 5. Checklist (after backend is live)

- [x] Backend GET/PATCH deployed and verified  
- [x] API client: fetch + patch `call_notes`  
- [x] Cold Caller: load on open; Save Notes; clear draft on success  
- [x] Analyze Notes removed/replaced  
- [x] Empty Save disabled; server `400` handled  
- [x] Newlines preserved in editor after reload  
- [x] No Details/Create/Edit exposure  
- [x] Typecheck / smoke Cold Caller save + reopen  

---

## 6. Agent prompt (frontend — run only after backend ships)

```
Implement call notes DB persistence per
docs/CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md and
docs/CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md.

Wire Cold Caller to GET + PATCH /api/candidates/{id}/call-notes (property call_notes).
Replace Analyze Notes with Save Notes. Keep sessionStorage draft; clear after successful save.
Plain text + newlines only. Cold Caller only. Do not use AI extract for this path.
```
