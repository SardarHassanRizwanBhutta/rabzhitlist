# Call Notes Extract — Frontend Implementation Handoff

**Status:** Locked (2026-08-04). Updated 2026-08-27 — WE `salaryPolicy` in `getEmptyFields()`. Updated 2026-08-13 — defer-catalog review modal (no inline lookups). Updated 2026-08-06 — browser calls QG directly (Amplify fix).  
**Audience:** Next.js / TypeScript AI agent.  
**Product spec:** [`CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md`](./CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md)  
**API contract:** [`CALL_NOTES_EXTRACT_API_CONTRACT.md`](./CALL_NOTES_EXTRACT_API_CONTRACT.md)  
**Persistence (unchanged):** [`CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md`](./CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md)  
**QG allowlist:** [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md)

---

## 1. Goal

Add **Analyze Notes** to Cold Caller Call Notes view. On click, send textarea text + empty QG-allowlisted fields to the **QG service** (`POST …/api/call-notes/extract`, same base URL as generate-questions), show results in a **review modal**, and **Apply Selected** into:

- **Saved candidate:** Candidate Details Edit Mode (opened from Cold Caller as today).  
- **Draft candidate:** `CandidateCreationDialog` prefill (same path as resume prefill / Apply to Create).

Do **not** change Save Notes, GET/PATCH call-notes, or draft `callNotes` on create.

---

## 2. Existing code map

| Area | File(s) |
|------|---------|
| Call Notes editor + Save Notes | `src/components/cold-caller/call-notes-editor.tsx` |
| Call Notes workspace / layout | `src/components/cold-caller/call-notes-workspace.tsx`, `cold-caller-call-notes-view.tsx` |
| Cold Caller shell | `src/components/cold-caller/cold-caller-dialog.tsx` |
| Call notes API (persist only) | `src/lib/services/candidate-call-notes-api.ts` |
| Session draft | `src/hooks/useCallNotesDraft.ts`, `src/lib/utils/call-notes-draft-storage.ts` |
| Empty field detection | `src/lib/utils/empty-field-detection.ts` (`getEmptyFields`) |
| QG missing-only builder | `src/lib/utils/missing-only-question-request.ts` |
| QG empty check | `src/lib/utils/qg-value.ts` (`isQgValueMissing`) |
| Draft → Create | `src/components/candidates-page-client.tsx` (`pendingCreateCallNotes`, `handleApplyCallNotesToCreate`) |
| Resume prefill pattern | `src/lib/candidate/resume-to-candidate-form.ts`, `src/components/resume-parser-dialog.tsx` |
| QG client (generate + extract) | `src/lib/services/questions-api.ts`, `src/lib/services/call-notes-extract-api.ts` |
| Stage types (already defined) | `src/types/cold-caller.ts` (`CallNotesStage`) |

---

## 3. New files (suggested)

| File | Purpose |
|------|---------|
| `src/app/api/call-notes/extract/route.ts` | **Optional** server proxy to Python (not used by shipped UI) |
| `src/types/call-notes-extraction.ts` | Request/response types + Zod schemas |
| `src/lib/services/call-notes-extract-api.ts` | Browser client `extractCallNotes()` → QG direct |
| `src/lib/utils/call-notes-allowed-empty-fields.ts` | Build whitelist from candidate |
| `src/lib/utils/call-notes-apply-extractions.ts` | Map extractions → form paths |
| `src/components/cold-caller/call-notes-extract-review-dialog.tsx` | Review modal UI |

---

## 4. UI changes

### 4.1 `CallNotesEditor`

Add props:

```ts
onAnalyzeNotes?: () => void
isAnalyzing?: boolean
analyzeDisabled?: boolean
analyzeDisabledReason?: string
showAnalyzeButton?: boolean  // default true; set false to hide Analyze (e.g. read-only)
```

Layout (saved candidate):

```text
[ Call Notes textarea                                    ]
[ hint text                              ] [ Analyze Notes ] [ Save Notes ]
```

Layout (draft):

```text
[ Call Notes textarea                                    ]
[ hint text          ] [ Analyze Notes ] [ Apply to Create Candidate ]
```

- **Analyze Notes** uses `Sparkles` or similar icon; loading spinner when `isAnalyzing`.  
- Disabled when: notes empty (trim), whitelist empty, `readOnly`, or extract in flight.  
- Tooltip / `analyzeDisabledReason` when disabled for whitelist empty.

### 4.2 Review modal (`CallNotesExtractReviewDialog`)

Open as **second step** after successful extract (not inline in sidebar). **Split-pane layout:** read-only **Call notes** snapshot beside scrollable **Proposals** checklist. **Dialog shell** matches `CandidateCreationDialog`: `sm:max-w-[750px] lg:max-w-[850px] xl:max-w-[950px]`, `max-h-[95vh]` (see `candidate-form-dialog-layout.ts`). Side-by-side from `sm`; stacks on very narrow viewports.

**Defer-catalog linking (shipped):** The review modal is **select-only**. It does **not** host employer/project/certification comboboxes or block Apply on unresolved lookups. After **Apply Selected**, catalog linking happens in **CandidateCreationDialog** (Create or Edit opened from Cold Caller) via comboboxes, the **Link catalog records** checklist, and `validateForm()` before save.

| Element | Behavior |
|---------|----------|
| Title | “Review extracted fields” |
| Call notes pane | Full `rawNotes` snapshot sent to extract; read-only; independent scroll |
| Proposals pane | Label, context, proposed value, source snippet, confidence %; row checkboxes |
| Row checkbox | Default **checked** for all returned rows |
| Primary | **Apply Selected** → `applyCallNotesExtractionsToFormData(..., { deferCatalogLinking: true })`; closes modal |
| Secondary | **Cancel** → discard unsaved review session |
| Tertiary | **Analyze again** → re-run extract (replaces review list) |

**Post-apply (both draft and saved):**

| Target | Next step |
|--------|-----------|
| **Draft** | Merge into draft session → **Apply to Create Candidate** → Create dialog with prefilled values + catalog linking UI |
| **Saved** | Open Edit dialog via `editFormBootstrap` → same catalog linking UI → **Update & Verify** |

Apply writes **names only** for employer/project/cert lookups (`*Id` stays `null`); employer/project **catalog scalars** (headcount, office, layoff, project description, etc.) land on form state for **+ Add New Employer/Project** prefill.

Zero extractions copy:

> No high-confidence values were found for the candidate’s currently empty fields.

### 4.3 Stage wiring

Use existing `CallNotesStage` in `cold-caller-dialog.tsx` or Call Notes view state:

```text
draft → extracting → review → applying → completed
                  ↘ extractionError
                  ↘ applyError
```

---

## 5. Analyze flow (implementation)

### Step A — Prerequisites

1. Read `rawNotes` from editor state (`rawNotesDraft` / `useCallNotesDraft`).  
2. Ensure candidate is catalog-enriched (`candidateWithCatalog` in dialog).  
3. Build `allowedEmptyFields` (§6).  
4. If whitelist empty → toast + do not call API.

### Step B — API call

```ts
await extractCallNotes({
  rawNotes,
  candidateSnapshot: buildExtractCandidateSnapshot(candidate),
  allowedEmptyFields,
})
```

### Step C — Review

Store `extractions` in component state; open modal.

### Step D — Apply Selected

1. Filter to **checked** rows only (no lookup resolution in the modal).  
2. Call `applyCallNotesExtractionsToFormData(baseForm, extractions, allowedEmptyFields, undefined, { deferCatalogLinking: true })`.  
3. **Saved:** `onApplyExtractComplete` → `editFormBootstrap` → Edit dialog.  
4. **Draft:** `onApplyExtractComplete` → update draft session → **Apply to Create Candidate**.  
5. **Do not** PATCH call notes or mutate textarea.  
6. Toast: applied count + reminder to link catalog records in the candidate form before save.

---

## 6. Building `allowedEmptyFields`

Create `buildCallNotesAllowedEmptyFields(candidate, options)`:

### 6.1 Source rows

1. Run `getEmptyFields(enrichedCandidate)`.  
2. **Filter** to QG allowlist: keep only rows whose `apiFieldName` matches keys from [`COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md`](./COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md) §3.  
   - Practical approach: reuse `buildMissingOnlyQuestionRequest` → intersect `fieldsToGenerate` with empty-field rows.  
3. **Drop** non-allowlist basic fields (`postingTitle`, `cnic`, `personalityType`, `githubUrl`, etc.).  
4. **Drop** `resume` when `hasResume === true` (CNE15).  
5. **Drop** top-level independent tech stacks (CNE16): `section === 'techStacks'` or `apiFieldName === 'techStacks'` exactly — **keep** `work_experience_{i}_techStacks` and `work_experience_{i}_project_{j}_techStacks`.  
6. **Drop** project `employerName` / `projectType` when parent WE has employer (`isWorkExperienceEmployerPresent`).  
7. **Include** `contributionNotes` only when empty (CNE13 — not QG always-ask).  
8. **Include** empty WE `salaryPolicy` as a **role-level** `select` (`work_experience_{i}_salaryPolicy`, `fieldPath` `workExperiences[{id}].salaryPolicy`). Emit from `getEmptyFields()` / `createEntryFields()` with `SALARY_POLICY_OPTIONS` (display labels from `SALARY_POLICY_DB_LABELS`, same as the candidate form). Do **not** emit it from `employer-catalog-empty-fields.ts` — that module skips `salaryPolicy` because it is WE-owned. If this row is omitted, Python will not extract salary policy.

### 6.2 Stable `fieldPath`

| Case | `fieldPath` bracket id |
|------|-------------------------|
| Saved WE row | `workExperiences[{WorkExperience.id}]` |
| Saved project | `...projects[{ProjectExperience.id}]` |
| Saved cert / achievement | `certifications[{id}]`, `achievements[{id}]` |
| Synthetic empty collection | `[0]` + matching `work_experience_0_*` apiFieldName |

Replace array **index** paths from `getEmptyFields` with **stable id** paths when the row has a persisted id.

### 6.3 Map to API shape

```ts
{
  fieldPath,
  apiFieldName: emptyField.apiFieldName,
  fieldLabel: emptyField.fieldLabel,
  fieldType: emptyField.fieldType,
  context: emptyField.context,
  options: emptyField.options,
  requiresLookupResolution: emptyField.onCreateEntity != null,
}
```

---

## 7. Apply engine

`applyCallNotesExtractions` responsibilities:

1. **Empty-only guard:** for each extraction, read current value at `fieldPath`; skip if `!isQgValueMissing(current)`.  
2. **Type coercion:** dates → `Date`; numbers → number; enums → validate against `options`. WE `shiftType` / `workMode` / `salaryPolicy` use the same display helpers as the candidate form (`shiftTypeToSelectValue`, `workModeToSelectValue`, `salaryPolicyToSelectValue`) so informal extract text (e.g. `"Gross salary policy"`) maps to `"Gross Salary"`.  
3. **Defer-catalog apply:** employer/project/cert **names** and catalog scalars on form state; IDs resolved in Create/Edit via comboboxes (not in review modal).  
4. **Benefits / multiselect:** merge policy for v1 = **set** (field was empty).  
5. **Form integration:**  
   - **Edit Mode:** use same update helpers as manual field entry in `CandidateDetailsModal`.  
   - **Create:** extend resume prefill merge in `resume-to-candidate-form.ts` pattern — new function `mergeCallNotesExtractionsIntoCreateForm`.  
6. Return `{ applied: string[]; skipped: Array<{ fieldPath; reason }> }` for toast.

**Do not** call ASP.NET from apply — recruiter still clicks Update & Verify / Create.

---

## 8. QG integration

**Shipped (primary):** `src/lib/services/call-notes-extract-api.ts` calls QG directly:

```ts
// POST `${getQuestionsApiBaseUrl()}/api/call-notes/extract`
// Same NEXT_PUBLIC_QUESTIONS_API_URL as generate-questions
```

**Optional:** `src/app/api/call-notes/extract/route.ts` — server proxy for non-browser callers. Not used by Analyze Notes UI. Validates with Zod, forwards to Python, does not log `rawNotes`.

---

## 9. Environment

Analyze Notes is always available when prerequisites pass (no feature flag). Uses the **same public QG URL** as Generate Questions:

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_QUESTIONS_API_URL` | Browser (build-time) | **Required on Amplify / hosted apps.** QG base URL (e.g. `https://example.com/questions`). Client calls `{base}/api/call-notes/extract`. |
| `QUESTIONS_API_URL` | Next.js server | Optional — only for `/api/call-notes/extract` proxy route (not shipped UI path) |
| `CALL_NOTES_EXTRACT_MAX_NOTES_LENGTH` | Next.js server | Optional proxy-only; default `100000` |
| `CALL_NOTES_EXTRACT_TIMEOUT_MS` | Next.js server | Optional proxy-only; default `60000` |

**Why direct browser call:** Hosted Next.js (e.g. AWS Amplify) may fail server-side `fetch` to QG (`{"error":"fetch failed"}`) while browser → QG works (same as generate-questions). Shipped UI therefore mirrors `questions-api.ts`.

Ensure QG **CORS** allows `POST /api/call-notes/extract` from the app origin.

---

## 10. Draft vs saved matrix

| | Saved | Draft |
|---|-------|-------|
| Save Notes | PATCH | Hidden |
| Analyze source text | Textarea (DB or draft) | Textarea (session only) |
| Apply target | Edit Mode | Create prefill |
| Persist fields | Update & Verify | POST create |
| `callNotes` on create | N/A | Yes when non-empty (unchanged) |
| GET call-notes before Analyze | Not required | Skipped (non-numeric id) |

---

## 11. Error handling

| Error | UX |
|-------|-----|
| `400` whitelist empty | Disable Analyze; inline hint |
| `502` / timeout / network | Toast + retry in modal (check QG URL + CORS on hosted apps) |
| Catalog not linked at save | `validateForm()` blocks Create/Update until employer/project/cert IDs resolved |
| Apply skip (field filled) | Silent skip + count in toast |
| Extract while Save in flight | Disable Analyze |

---

## 12. Accessibility

- Analyze button: `aria-busy` when extracting.  
- Modal: focus trap, `role="dialog"`, labelled title.  
- Review list: checkbox labels include field name + value.

---

## 13. Testing checklist

Signed off **2026-08-13** (staging/prod FE + QG).

- [x] Saved: Analyze → review → apply → Update & Verify persists  
- [x] Saved: Analyze with unsaved textarea edits (no prior Save Notes)  
- [x] Saved: populated field not in whitelist / not overwritten  
- [x] Draft: Analyze → apply → Create shows prefilled empty fields  
- [x] Draft: create includes `callNotes` when non-empty  
- [x] Zero extractions modal copy  
- [x] Whitelist empty disables Analyze
- [x] Notes textarea unchanged after apply  
- [x] No raw notes in console  
- [x] Catalog linking in Create/Edit form (employer/project/cert comboboxes + Link catalog checklist)  
- [x] Synthetic `[0]` draft WE row  
- [x] Top-level `techStacks` not in whitelist (CNE16); WE/project tech stacks still work  
- [x] Empty WE `salaryPolicy` is in `allowedEmptyFields`; notes `"Gross salary policy"` → extract `"Gross Salary"` → Apply fills Create/Edit (2026-08-27)  

---

## 14. Agent prompt

```
Implement Call Notes Extract v1 frontend per:
- docs/CALL_NOTES_EXTRACT_REQUIREMENTS_LOCKED.md
- docs/CALL_NOTES_EXTRACT_API_CONTRACT.md
- docs/CALL_NOTES_EXTRACT_FRONTEND_HANDOFF.md

Add Analyze Notes beside Save Notes; modal review (checkboxes only); defer-catalog apply to Edit Mode
and Create prefill; link employers/projects/certs in candidate form; QG allowlist whitelist only (exclude top-level techStacks per CNE16);
browser POST to {NEXT_PUBLIC_QUESTIONS_API_URL}/api/call-notes/extract (same as generate-questions);
do not change call_notes persistence or draft callNotes on create.
```
