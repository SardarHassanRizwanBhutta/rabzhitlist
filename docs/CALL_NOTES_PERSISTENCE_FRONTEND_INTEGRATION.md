# Call Notes Persistence — Frontend Integration

**Status:** Backend GET/PATCH + POST `callNotes` live; FE draft Cold Caller wired (2026-07-30).  
**Audience:** Frontend / Next.js AI agent.  
**Product spec (locked):** [`CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md)  
**Backend handoff:** [`CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md`](./CALL_NOTES_PERSISTENCE_BACKEND_HANDOFF.md)  
**Deferred AI extract (do not wire for save):** [`call_notes_frontend_api_contract.md`](./call_notes_frontend_api_contract.md)

---

## 1. API contract (consume exactly)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/candidates/{id}/call-notes` | Load notes when Cold Caller opens (saved candidate) |
| `PATCH` | `/api/candidates/{id}/call-notes` | Save Notes (saved candidate) |
| `POST` | `/api/candidates` | Create candidate; optional **`callNotes`** (camelCase) when non-empty |

**Sub-resource JSON property:** `call_notes` (snake_case).  
**Create body property:** `callNotes` (camelCase). Omit when blank.

**GET never saved:**

```json
{ "call_notes": null }
```

**PATCH body / success response:**

```json
{ "call_notes": "…exact plain text…" }
```

**Do not** read or write call notes via `GET`/`PUT` `/api/candidates/{id}`.

---

## 2. UI / UX changes (Cold Caller)

| Area | Action |
|------|--------|
| Saved candidate `CallNotesEditor` | **Save Notes** → PATCH |
| Draft Cold Caller | Hide **Save Notes**; show **Apply to Create Candidate**; notes local until create |
| Save enablement (saved) | Disabled when editor text is empty |
| Draft | Keep `useCallNotesDraft` / sessionStorage; clear after successful PATCH or create-with-notes |
| Load on open (numeric id) | `GET` call-notes; if non-null use it; else session draft |
| Load on open (draft id) | Skip GET; session draft only |
| Surfaces | **No** Candidate Details / Create / Edit field for notes; draft notes travel only via create `callNotes` |
| AI extract | Leave unused for save path |

### Suggested load precedence (saved)

1. Dialog opens for candidate `id`.  
2. `GET /api/candidates/{id}/call-notes`.  
3. If `call_notes` is a non-null string → editor = that value.  
4. Else → editor = sessionStorage draft.  
5. **Save Notes** → `PATCH` → clear session draft on success.

### Draft → Create

1. Auto-Profiler **Open Cold Caller** builds ephemeral candidate + local resume blob.  
2. User edits notes (local draft).  
3. **Apply to Create Candidate** → Create dialog prefilled; pass notes into submit options.  
4. On create: include `callNotes` only when non-empty (exact string); then resume upload as today.  
5. Create cancel → silent discard of draft session.  

---

## 3. Types / client (typical)

```ts
export interface CandidateCallNotesDto {
  call_notes: string | null
}

export async function fetchCandidateCallNotes(candidateId: number): Promise<CandidateCallNotesDto>
export async function patchCandidateCallNotes(
  candidateId: number,
  call_notes: string,
): Promise<CandidateCallNotesDto>

// CreateCandidateDto
callNotes?: string // omit when blank
```

---

## 4. UX copy (suggested)

- Saved: Button **Save Notes**; hint “Draft saved locally” / “Notes saved”.  
- Draft: Button **Apply to Create Candidate**; title **Cold Caller** + **Draft** badge.  
- Helper may note that notes save with the candidate on create in draft mode.

---

## 5. Checklist

- [x] Backend GET/PATCH deployed and verified  
- [x] Backend POST `callNotes` (parallel)  
- [x] API client: fetch + patch `call_notes`  
- [x] Cold Caller: load on open; Save Notes; clear draft on success  
- [x] Draft Cold Caller: blob resume; Apply to Create; create with `callNotes`  
- [x] Analyze Notes removed/replaced  
- [x] Empty Save disabled; server `400` handled  
- [x] Newlines preserved in editor after reload  
- [x] No Details/Create/Edit exposure of notes field  
- [x] Typecheck / smoke draft Open Cold Caller + create with `callNotes`  

---

## 6. Agent prompt (frontend)

```
Implement draft Cold Caller from Auto-Profiler and optional create callNotes per
docs/CALL_NOTES_PERSISTENCE_REQUIREMENTS_LOCKED.md and
docs/CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md.

Saved candidates: GET + PATCH call_notes unchanged.
Draft: local notes; Apply to Create Candidate; POST /api/candidates with optional callNotes (camelCase) when non-empty.
```
