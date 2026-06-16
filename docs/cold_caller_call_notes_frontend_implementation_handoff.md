# Cold Caller Mode — Call Notes View Frontend Implementation Handoff

## 1. Audience and Goal

This document is for the AI agent implementing the new **Call Notes View** inside the existing Cold Caller Mode in the Next.js frontend.

The existing Cold Caller Mode already has a field-by-field interface. That existing interface becomes:

- **Fields View**

The new interface becomes:

- **Call Notes View**

The feature must be implemented inside the existing `ColdCallerDialog`. Do not create a second Cold Caller dialog.

The goal is to let a recruiter enter one unstructured block of notes from a candidate phone call, submit it for AI extraction, review only high-confidence structured mappings, confirm unresolved lookup creation when needed, and apply selected values only to currently empty candidate fields.

---

## 2. Critical Product Rules

These rules are finalized and must not be changed:

1. There is one Cold Caller dialog with two internal views.
2. Raw call notes are entered once per cold-call session.
3. Raw submitted notes are stored permanently by the backend.
4. Submitted notes become immutable in the frontend.
5. Only currently empty candidate fields may be updated.
6. Only high-confidence mappings are returned by the backend.
7. The frontend must never write AI-extracted values directly to candidate APIs without the review/apply flow.
8. Unknown lookup values must not be created automatically.
9. Lookup creation requires explicit recruiter confirmation.
10. The Python service is called by ASP.NET, not by the frontend.
11. The frontend communicates only with ASP.NET APIs.
12. Both internal views must share candidate state and reflect updates immediately.
13. Existing Fields View functionality and all existing interaction modes must remain intact.
14. The feature must refresh Candidate Details, verification data, missing-field state, Data Progress, and derived candidate summary fields after successful apply.

---

## 3. Mandatory Agent Workflow Before Coding

Before modifying code:

1. Inspect the existing implementation.
2. Identify the actual API client conventions used by the project.
3. Identify how Candidate Details data is fetched and refreshed.
4. Identify the current candidate type definitions.
5. Identify how dialogs, forms, requests, errors, and toasts are implemented.
6. Compare the actual codebase with this specification.
7. Do not invent API contracts if the backend implementation differs.
8. Report any contract mismatch before implementing around it.

Inspect at minimum:

```text
src/components/candidate-details-modal.tsx
src/components/cold-caller/cold-caller-dialog.tsx
src/components/cold-caller/question-field-card.tsx
src/components/cold-caller/index.ts
src/types/cold-caller.ts
src/lib/utils/empty-field-detection.ts
src/lib/services/questions-api.ts
src/app/api/generate-questions/route.ts
src/lib/types/candidate.ts
```

Also inspect the project's existing:

- API utility/client
- authentication handling
- query caching/fetching library, if any
- request cancellation pattern
- error-response format
- lookup combobox components
- creation dialogs
- verification API integration
- Candidate Details refresh logic

---

## 4. Existing Architecture to Preserve

The current hierarchy is approximately:

```text
CandidateDetailsModal
└── ColdCallerDialog
    ├── Header
    ├── Existing section tabs
    ├── Existing Fields sidebar
    ├── QuestionFieldCard list
    ├── Footer
    └── Nested creation dialogs
```

The implementation must evolve to:

```text
CandidateDetailsModal
└── ColdCallerDialog
    ├── Shared header
    ├── ColdCallerViewSwitcher
    ├── Fields View
    │   └── Existing tabbed implementation
    └── Call Notes View
        ├── MissingFieldsSidebar
        ├── CallNotesEditor
        ├── ExtractionProgress
        ├── SubmittedNotesPanel
        ├── ExtractedMappingsPanel
        ├── LookupResolutionDialog
        └── ApplyMappingsFooter
```

Do not duplicate candidate state, empty-field detection, verification state, or refresh logic between views.

---

## 5. Recommended Component Boundaries

Create or adapt the following components:

```text
src/components/cold-caller/
├── cold-caller-dialog.tsx
├── cold-caller-view-switcher.tsx
├── cold-caller-call-notes-view.tsx
├── call-notes-editor.tsx
├── call-notes-extraction-progress.tsx
├── submitted-call-notes-panel.tsx
├── extracted-mappings-panel.tsx
├── extracted-mapping-card.tsx
├── lookup-resolution-dialog.tsx
├── call-notes-fields-sidebar.tsx
├── apply-mappings-footer.tsx
└── index.ts
```

Prefer existing project naming conventions if they differ.

### Refactoring rule

Do not perform a large unrelated refactor of the current Fields View in the same task.

Safest pattern:

```tsx
{viewMode === "fields" ? (
  existingFieldsViewJsx
) : (
  <ColdCallerCallNotesView ... />
)}
```

The existing tabbed JSX may be extracted into a separate component only when it can be done safely without changing behavior.

---

## 6. View Switcher

Add a segmented control or equivalent shadcn/ui control in the Cold Caller header:

```text
[ Fields View ] [ Call Notes View ]
```

Type:

```ts
export type ColdCallerViewMode = "fields" | "callNotes"
```

Default:

```ts
"fields"
```

Requirements:

- Switching views must not close the dialog.
- Switching views must not clear field answers, generated questions, verification state, notes draft, session status, or extracted mappings.
- Applied mappings must update both views.
- Do not overload the existing Interaction Mode selector. The new switcher is internal to the selected interaction mode.
- Initially expose Call Notes View only for Cold Caller Mode unless product requirements explicitly enable it for Interviewer/L1/L2.

---

## 7. Call Notes State Machine

Use an explicit state machine:

```ts
export type CallNotesStage =
  | "draft"
  | "submitting"
  | "extracting"
  | "review"
  | "applying"
  | "completed"
  | "extractionError"
  | "applyError"
```

Recommended state:

```ts
export interface CallNotesViewState {
  stage: CallNotesStage
  rawNotesDraft: string
  sessionId?: number
  sessionStatus?: ColdCallSessionStatus
  submittedNotes?: string
  mappings: ExtractedMapping[]
  selectedMappingIds: Set<number>
  unresolvedLookupCount: number
  extractionError?: string
  applyError?: string
}
```

Keep this state inside `ColdCallerDialog` or in a dedicated hook owned by the dialog:

```text
useColdCallerCallNotesSession
```

Do not store the canonical session only inside deeply nested presentational components.

---

## 8. TypeScript Contracts

Create types matching the actual backend contract.

The following shapes are expected. Adjust property casing only to match the real API.

### Session status

```ts
export type ColdCallSessionStatus =
  | "submitted"
  | "extracting"
  | "readyForReview"
  | "completed"
  | "extractionFailed"
  | "applyFailed"
```

### Mapping status

```ts
export type ExtractedMappingStatus =
  | "ready"
  | "needsLookupConfirmation"
  | "selected"
  | "rejected"
  | "applied"
  | "skipped"
  | "stale"
```

### Lookup resolution

```ts
export interface ExtractedLookupValue {
  name: string
  matchedId?: number | null
  status: "matched" | "needsLookupConfirmation"
  lookupEntityType?: string | null
}
```

### Mapping

```ts
export interface ExtractedMapping {
  mappingId: number
  fieldPath: string
  section: string
  fieldLabel: string
  value: unknown
  displayValue?: string | null
  sourceText: string
  confidence?: number
  status: ExtractedMappingStatus

  matchedContext?: {
    workExperienceId?: number | null
    employerName?: string | null
    jobTitle?: string | null
    startDate?: string | null
    endDate?: string | null
  } | null

  lookupValues?: ExtractedLookupValue[]
}
```

### Create session request/response

```ts
export interface CreateColdCallSessionRequest {
  rawNotes: string
}

export interface CreateColdCallSessionResponse {
  sessionId: number
  candidateId: number
  status: ColdCallSessionStatus
}
```

### Session details response

```ts
export interface ColdCallSessionDetails {
  sessionId: number
  candidateId: number
  status: ColdCallSessionStatus
  rawNotes: string
  submittedAt?: string
  summary?: {
    extractedCount: number
    lookupConfirmationCount: number
    missingCount: number
  }
  mappings: ExtractedMapping[]
  error?: string | null
}
```

### Apply request

```ts
export type MappingApplyAction = "apply" | "reject"

export interface ApplyMappingItem {
  mappingId: number
  action: MappingApplyAction
  resolvedLookupIds?: number[]
  editedValue?: unknown
}

export interface ApplyExtractedMappingsRequest {
  mappings: ApplyMappingItem[]
}
```

### Apply response

```ts
export interface ApplyExtractedMappingsResponse {
  candidateId: number
  sessionId: number
  appliedCount: number
  rejectedCount: number
  staleCount: number
  dataProgressPercentage?: number
}
```

Do not use `any`. Use `unknown` where the mapping value is field-dependent and narrow it inside field-specific editors.

---

## 9. Expected ASP.NET Endpoints

Confirm the exact routes in the backend before implementation.

Expected:

### Submit notes

```http
POST /api/candidates/{candidateId}/cold-call-sessions
```

Body:

```json
{
  "rawNotes": "Current salary is 150000. In DPL his tech stacks were .NET and Azure."
}
```

Expected success:

```json
{
  "sessionId": 125,
  "candidateId": 42,
  "status": "extracting"
}
```

The backend may return `202 Accepted`.

### Get session

```http
GET /api/candidates/{candidateId}/cold-call-sessions/{sessionId}
```

### Apply mappings

```http
POST /api/candidates/{candidateId}/cold-call-sessions/{sessionId}/apply
```

### Lookup creation/search

Reuse existing lookup endpoints for:

- Tech stacks
- Benefits
- Projects
- Employers
- Universities
- Certifications
- Other supported lookup types

Do not create frontend-only fake IDs.

---

## 10. API Service Layer

Create a dedicated frontend service following the project's API conventions, for example:

```text
src/lib/services/cold-call-sessions-api.ts
```

Expected functions:

```ts
createColdCallSession(
  candidateId: number,
  request: CreateColdCallSessionRequest,
  signal?: AbortSignal
): Promise<CreateColdCallSessionResponse>

getColdCallSession(
  candidateId: number,
  sessionId: number,
  signal?: AbortSignal
): Promise<ColdCallSessionDetails>

applyColdCallMappings(
  candidateId: number,
  sessionId: number,
  request: ApplyExtractedMappingsRequest,
  signal?: AbortSignal
): Promise<ApplyExtractedMappingsResponse>
```

Rules:

- Use the existing authenticated API client.
- Use the project's established error parsing.
- Support `AbortSignal`.
- Do not call the Python service or Next.js AI route directly.
- Do not put API calls directly in presentational mapping cards.

---

## 11. Draft Stage UX

Use a large multiline editor, not a ChatGPT-style message stream.

Recommended heading:

```text
Call Notes
```

Helper text:

```text
Enter everything discussed during the call in natural language. The system will identify high-confidence values for currently empty candidate fields.
```

Placeholder:

```text
Enter everything discussed during the call.

Example:
Current salary is 150000. In DPL his tech stacks were .NET and Azure.
At Swipbox he received paid leaves and matrimonial leaves.
```

Requirements:

- Minimum height approximately `320–420px`
- Auto-grow or comfortable fixed height
- Use shadcn/ui `Textarea`
- Disable Analyze when empty/whitespace-only
- Primary button: **Analyze Notes**
- Optional shortcut: `Ctrl/Cmd + Enter`
- Normal Enter inserts a newline
- Show submission error inline and by toast
- Prevent duplicate submission while submitting

---

## 12. Draft Persistence

Because only one final submission is allowed, preserve the unsent draft locally.

Recommended:

```text
sessionStorage
```

Key:

```text
cold-caller-notes-draft:{candidateId}
```

Rules:

- Save draft while typing, preferably debounced.
- Restore draft when reopening the same candidate before submission.
- Keep drafts isolated per candidate.
- Clear local draft only after session creation succeeds.
- Once submitted, use backend `rawNotes` as the source of truth.
- Submitted notes are read-only.
- Do not allow editing and resubmitting the same session.

---

## 13. Missing Fields Sidebar

The Call Notes View must include a dedicated left panel similar to Fields View.

Reuse:

- `getEmptyFields(candidate)`
- section grouping
- existing field labels
- existing field paths

Do not implement a separate competing empty-field detector.

### Status mapping

| Status | Meaning |
|---|---|
| Missing | No returned mapping |
| Extracted | High-confidence mapping returned |
| Lookup confirmation | Mapping contains unresolved lookup |
| Selected | Mapping selected for apply |
| Applied | Mapping successfully saved |
| Skipped | Recruiter rejected it |
| Stale | Backend refused because field is no longer empty |

Requirements:

- Group fields by section.
- Show counts.
- Clicking an extracted field should focus/scroll to its review card.
- Use icon plus label; do not communicate status through color alone.
- After apply, rerun empty-field detection using refreshed candidate data.

---

## 14. Extraction Submission Flow

When the recruiter clicks **Analyze Notes**:

1. Trim the draft.
2. Validate non-empty content.
3. Set stage to `submitting`.
4. Call create-session API.
5. Store returned `sessionId`.
6. Clear the local unsent draft.
7. Set stage to `extracting`.
8. Begin polling the session endpoint.
9. Display submitted notes as read-only.
10. Do not create another session on technical retry.

---

## 15. Polling Strategy

Poll only while status is non-terminal and extraction is active.

Recommended behavior:

- First poll after approximately 1 second.
- Continue every 1–2 seconds initially.
- Back off to 2–3 seconds for longer processing.
- Stop on:
  - `readyForReview`
  - `completed`
  - `extractionFailed`
  - `applyFailed`
- Abort polling when the dialog closes or candidate changes.
- Prevent overlapping polling requests.
- Resume polling when reopening an active stored session, if the backend exposes it.
- Do not continue polling in the background after component unmount.

Use the project's query library where appropriate. If React Query/TanStack Query is present, use conditional `refetchInterval`; otherwise implement an abortable polling hook.

---

## 16. Extracting Stage UX

Keep the submitted notes visible and read-only.

Show meaningful progress text:

```text
Analyzing call notes…
Matching candidate fields…
Resolving work experience context…
Matching known lookup values…
```

Do not show a blank screen with only a spinner.

Use `aria-live="polite"` for status updates.

---

## 17. Review Stage Layout

Desktop:

```text
┌──────────────────┬────────────────────────┬──────────────────────────┐
│ Field Status     │ Submitted Notes        │ Extracted Data           │
└──────────────────┴────────────────────────┴──────────────────────────┘
```

Responsive/mobile:

```text
Step 1: Submitted Notes
Step 2: Review Extracted Data
Step 3: Apply Changes
```

The Fields sidebar may become a Sheet/Drawer on smaller screens.

---

## 18. Extracted Mapping Cards

Each mapping card must show:

- Selection checkbox
- Field label
- Section
- Extracted/display value
- Source text excerpt
- Matched work-experience context when applicable
- Lookup resolution status
- Edit action when supported
- Reject action
- Stale warning when returned by backend

Example:

```text
☑ Current Salary
150,000

Source:
“Current salary is 150000”

Ready
```

Nested example:

```text
☑ Work Experience — DPL
Tech Stacks: .NET, Azure

Matched to:
DPL • Software Engineer • Jan 2021–Apr 2023

Source:
“In DPL his tech stacks were .NET and Azure”
```

Do not display or calculate a frontend confidence threshold. The backend already returns only high-confidence mappings.

Confidence may be displayed if included, but must not control acceptance logic.

---

## 19. Mapping Value Editors

If editing extracted values is supported, use field-aware controls.

Examples:

| Value type | Editor |
|---|---|
| text | Input |
| multiline contribution/notes | Textarea |
| number/salary | Number input |
| date | Existing date picker |
| enum | Select |
| boolean | Checkbox/Select |
| single lookup | Search combobox |
| lookup array | Multi-select combobox |
| benefits | Existing BenefitsSelector, adapted for resolution |

Do not convert all values into a generic string input.

Edited values must be sent through `editedValue` or the actual backend contract.

---

## 20. Unknown Lookup Resolution

A mapping with unresolved lookups must show:

```text
Match Existing
Create New
Reject
```

### Match Existing

- Open existing server-side search combobox.
- Select an existing lookup ID.
- Attach the ID to the mapping.
- Mark mapping resolved.

### Create New

- Open a confirmation dialog.
- Clearly show lookup type and proposed name.
- Call the existing lookup creation endpoint only after confirmation.
- Attach returned ID.
- Mark mapping resolved.

### Reject

- Exclude the unresolved item or mapping from apply according to backend granularity.

Rules:

- Never create a lookup automatically.
- Disable Apply Selected while a selected mapping remains unresolved.
- Prevent duplicate creation errors using backend error handling.
- If backend reports an existing matching record due to a race, use that record when supported.

---

## 21. Selection Behavior

Recommended defaults:

- Automatically select mappings with status `ready`.
- Do not automatically select mappings needing lookup confirmation.
- Stale mappings cannot be selected.
- Rejected mappings are unselected.
- Provide Select All Ready / Clear Selection if mappings are numerous.

Footer shows:

```text
3 selected
1 lookup confirmation required
```

Primary button:

```text
Apply Selected Changes
```

Disable it when:

- no mappings are selected;
- apply request is running;
- any selected mapping has unresolved required lookup values.

---

## 22. Apply Flow

When applying:

1. Build request from all mappings:
   - selected mappings → `apply`
   - explicitly rejected mappings → `reject`
2. Include resolved lookup IDs.
3. Include edited values when present.
4. Set stage to `applying`.
5. Call apply API once.
6. Prevent duplicate submissions.
7. Handle stale mappings returned by backend.
8. After success, refresh all related frontend data.

Do not call separate candidate update endpoints per mapping from the frontend.

The ASP.NET apply endpoint owns transactional persistence.

---

## 23. Required Refresh After Apply

After successful apply:

1. Refetch Candidate Details.
2. Update `viewCandidate` in `CandidateDetailsModal`.
3. Refetch verification records.
4. Re-run `getEmptyFields` using refreshed candidate data.
5. Refresh Data Progress from the backend-backed candidate response.
6. Refresh latest job title and total experience display if present in candidate summary.
7. Update Fields View statuses.
8. Update Call Notes View statuses to applied/stale/skipped.
9. Preserve the completed call session as read-only history.

Do not rely only on optimistic local field mutation because nested relations and derived candidate fields are recalculated by the backend.

The current candidate details save flow is reportedly partially stubbed; implement a real refresh callback rather than only showing a toast.

Recommended prop/callback concept:

```ts
onCandidateUpdated?: () => Promise<void>
```

or reuse the actual query invalidation/refetch mechanism already present.

---

## 24. Completed State

Do not immediately close the dialog.

Show:

```text
Call notes processed

4 candidate fields were updated.
1 lookup value was created.
1 field was skipped.
Data Progress is now 78%.
```

Actions:

```text
[View Updated Candidate] [Back to Fields View] [Close]
```

`View Updated Candidate` may switch back to Fields View or focus the Candidate Details content depending on existing modal behavior.

---

## 25. Error Handling

### Session creation error

- Keep draft intact.
- Return to draft stage.
- Show actionable error.

### Extraction failure

Show:

```text
We could not analyze these notes.
Your submitted notes were saved and have not been lost.
```

Actions:

```text
[Retry Analysis] [Close]
```

Retry must reuse the same session ID and backend retry mechanism. Do not create a second submission.

### Apply failure

- Keep reviewed mappings and selections.
- Show error.
- Allow retry.
- Refetch session before retry when needed.

### Unauthorized/forbidden

- Show appropriate access error.
- Do not expose audit notes to unauthorized users.

### Validation errors

Map backend field/mapping validation errors to the relevant review card when possible.

---

## 26. Verification Behavior

AI extraction does not automatically verify fields.

When verification integration is available, mapping cards may offer:

```text
Apply
Apply & Verify
```

Only explicit recruiter action should send verification intent.

Do not infer verification from high confidence.

If the current backend apply contract does not support verification, omit this control from the first implementation rather than faking it.

---

## 27. Existing Question Generation Must Remain Intact

The existing Fields View uses:

```text
POST /api/generate-questions
```

Do not remove or repurpose that workflow.

Call Notes extraction is a separate backend workflow.

Preserve:

- existing Generate Questions button
- existing QuestionFieldCard behavior
- current interaction mode header
- current tabs
- current dynamic entry controls
- existing nested creation dialogs

Do not route Call Notes through the existing question-generation API.

---

## 28. Accessibility

Requirements:

- View switcher supports keyboard navigation.
- Textarea has a visible label.
- Extraction status uses `aria-live`.
- Mapping cards have accessible checkbox labels.
- Status is shown with text/icons, not color alone.
- Focus moves to Review Extracted Data when extraction completes.
- Confirmation dialogs trap focus.
- All actions are keyboard accessible.
- Submitted notes panel is readable by screen readers.
- Avoid nested interactive elements inside buttons.

---

## 29. Security and Data Handling

Frontend must:

- Use authenticated ASP.NET requests.
- Never log raw call notes to the browser console.
- Never persist submitted raw notes in localStorage/sessionStorage after successful submission.
- Clear candidate-specific unsent draft on successful session creation.
- Avoid exposing notes in URLs/query strings.
- Render all source text as plain text, never as raw HTML.
- Respect backend authorization errors.
- Avoid sending the full candidate object to the Python service or any AI endpoint from the browser.

---

## 30. Performance

- Keep existing Fields View mounted only when needed if its rendering is expensive.
- Memoize derived mapping/field status structures.
- Avoid rebuilding large Maps/Sets unnecessarily.
- Poll one active session only.
- Abort requests on candidate change/dialog close.
- Do not refetch Candidate Details on every poll.
- Refetch Candidate Details after apply, not after extraction.
- Use server-side lookup search for large lookup datasets.
- Do not preload all employers, projects, tech stacks, or benefits.

---

## 31. Suggested Implementation Phases

### Phase 1 — Structure and draft UI

- Add view switcher
- Add Call Notes View
- Reuse missing Fields sidebar
- Implement draft editor
- Implement sessionStorage draft
- No backend mock data

### Phase 2 — Session submission and extraction

- Add API service
- Create session
- Implement extracting state
- Implement polling
- Render submitted immutable notes

### Phase 3 — Review

- Add TypeScript mapping models
- Render mapping cards
- Implement selection/rejection
- Implement field-aware editing where supported

### Phase 4 — Lookups

- Match existing
- Explicit create confirmation
- Integrate existing lookup endpoints
- Prevent apply while unresolved

### Phase 5 — Apply and refresh

- Apply mappings
- Handle stale mappings
- Refetch candidate
- Refresh verification and Data Progress
- Sync both views
- Completed state

### Phase 6 — Tests and hardening

- Accessibility
- Responsive layout
- Request cancellation
- Retry behavior
- Regression testing of Fields View

---

## 32. Acceptance Criteria

### View architecture

- [ ] One Cold Caller dialog contains Fields View and Call Notes View.
- [ ] Existing Fields View behavior is unchanged.
- [ ] Switching views preserves session and field state.
- [ ] Applied changes appear in both views.

### Draft and submission

- [ ] Recruiter can enter one multiline note block.
- [ ] Empty notes cannot be submitted.
- [ ] Unsubmitted draft survives dialog close/reopen for the same candidate.
- [ ] One session is created after Analyze Notes.
- [ ] Submitted notes become immutable.
- [ ] Submitted notes are not retained in browser storage.

### Extraction

- [ ] Frontend communicates only with ASP.NET.
- [ ] Extracting state is visible.
- [ ] Polling stops correctly.
- [ ] Only backend-returned high-confidence mappings appear.
- [ ] No frontend confidence threshold is applied.
- [ ] Extraction failure preserves the submitted session.

### Review

- [ ] Each mapping displays target field, value, and source text.
- [ ] Work-experience mappings display matched context.
- [ ] Ready mappings can be selected.
- [ ] Mappings can be rejected.
- [ ] Selected unresolved mappings block apply.
- [ ] Stale mappings cannot be applied.

### Lookups

- [ ] Unknown lookup values are not automatically created.
- [ ] Recruiter can match an existing record.
- [ ] Recruiter can explicitly confirm creation.
- [ ] Created lookup ID is attached to the mapping.

### Apply

- [ ] Apply is one backend request, not one request per field.
- [ ] Duplicate apply is prevented.
- [ ] Candidate Details refetches after success.
- [ ] Empty fields, Data Progress, verification, latest job title, and total experience refresh.
- [ ] Completed state shows outcome counts.
- [ ] Dialog does not close automatically.

### Regression

- [ ] Generate Questions still works in Fields View.
- [ ] Interaction Mode selector still works.
- [ ] Existing nested dialogs still work.
- [ ] Existing candidate details modal behavior is preserved.
- [ ] Dark mode and responsive behavior remain valid.

---

## 33. Do Not Do

Do not:

- Create a second Cold Caller modal.
- Replace the existing Fields View.
- Call the Python AI service directly.
- Send raw notes through the existing Generate Questions route.
- Automatically save AI mappings.
- Automatically create lookup values.
- Allow overwriting non-empty fields.
- Build a frontend confidence filter.
- Fetch all lookup records on mount.
- Store submitted notes permanently in browser storage.
- Use only optimistic local updates after apply.
- Implement unrelated Interviewer/L1/L2 changes in this task.
- Rewrite the entire Cold Caller module without need.

---

## 34. Final Expected Experience

```text
Candidate Details Modal
→ Cold Caller Mode
→ Call Notes View
→ Recruiter enters one natural-language notes block
→ Analyze Notes
→ Notes are stored and extracted by backend/Python service
→ Frontend displays only high-confidence mappings
→ Recruiter reviews, edits, rejects, and resolves lookups
→ Apply Selected Changes
→ Backend saves only still-empty fields
→ Candidate details and derived summaries refresh
→ Both Cold Caller views show the updated state
```

This implementation must optimize for recruiter speed while preserving data integrity, auditability, and explicit human control.
