# Call Notes Extraction — Frontend API Contract and Integration Rules

## 1. Purpose

This document defines the complete frontend integration contract for the temporary Call Notes extraction flow:

```text
Browser frontend
    ↓
Next.js server proxy
    ↓
Python `call_notes` AI service
    ↓
Frontend receives structured extractions
    ↓
Frontend maps extractions into Candidate Edit Mode
    ↓
Recruiter reviews changes
    ↓
Update & Verify persists through existing ASP.NET APIs
```

This is an interim integration architecture.

The frontend must **not call the Python service directly from browser code** because the Python service URL and internal API key must remain server-side.

The correct temporary flow is:

```text
Browser → Next.js API Route → Python AI Service
```

The long-term production architecture remains:

```text
Browser → ASP.NET → Python AI Service
```

---

## 2. Core Integration Rules

The frontend implementation must follow these rules:

1. The Python service only extracts data.
2. The Python service does not save candidate data.
3. The Python service does not create lookup values.
4. The Python service does not resolve database IDs.
5. The Python service returns only fields supplied in `allowedEmptyFields`.
6. The frontend must only include currently empty fields in `allowedEmptyFields`.
7. The frontend must validate the response before using it.
8. Extracted values must populate Edit Mode only.
9. Candidate data is saved only after the recruiter clicks **Update & Verify**.
10. Existing non-empty values must never be overwritten automatically.
11. Lookup names must be resolved using existing application APIs.
12. Unmatched lookup names must require recruiter action.
13. Stable database IDs must be used for nested records.
14. Frontend array indexes must not be treated as stable entity identities.
15. Python credentials must remain server-side.
16. Raw call notes must never be logged to the browser console or proxy logs.
17. The extraction response is a proposal, not persisted candidate state.
18. The frontend must preserve source text for review.
19. The frontend must not treat AI confidence as verification.
20. Edit Mode remains the final review and persistence boundary.

---

## 3. Endpoint Overview

### Browser-facing endpoint

The frontend browser calls a Next.js API route:

```http
POST /api/call-notes/extract
```

### Server-to-server endpoint

The Next.js API route calls the Python service:

```http
POST {CALL_NOTES_AI_URL}/api/v1/call-notes/extract
```

The browser must never call this Python URL directly.

---

## 4. Server-Only Environment Variables

Configure these in the Next.js server environment:

```env
CALL_NOTES_AI_URL=http://localhost:8003
CALL_NOTES_AI_INTERNAL_API_KEY=replace-with-secret
CALL_NOTES_AI_TIMEOUT_MS=30000
```

Rules:

- Do not prefix these variables with `NEXT_PUBLIC_`.
- Do not expose them in client components.
- Do not serialize them into browser bundles.
- Do not log the internal API key.
- Do not return the Python service URL to the browser.

---

## 5. Next.js Proxy Route

Create:

```text
src/app/api/call-notes/extract/route.ts
```

Responsibilities:

1. Accept the frontend extraction request.
2. Validate the request with Zod.
3. Forward the validated request to Python.
4. Add the internal API key.
5. Add or forward a request ID.
6. Enforce a timeout.
7. Disable caching.
8. Normalize Python errors into a frontend-safe error contract.
9. Return the validated Python response.
10. Never log raw call notes.

Conceptual implementation:

```ts
import { NextRequest, NextResponse } from "next/server"

import {
  extractCallNotesRequestSchema,
  extractCallNotesResponseSchema,
} from "@/lib/contracts/call-notes-extraction"

const serviceUrl = process.env.CALL_NOTES_AI_URL
const internalApiKey = process.env.CALL_NOTES_AI_INTERNAL_API_KEY
const timeoutMs = Number(
  process.env.CALL_NOTES_AI_TIMEOUT_MS ?? "30000"
)

export async function POST(request: NextRequest) {
  if (!serviceUrl) {
    return NextResponse.json(
      {
        code: "CALL_NOTES_AI_NOT_CONFIGURED",
        message: "Call Notes AI service is not configured.",
      },
      { status: 500 }
    )
  }

  const rawBody = await request.json().catch(() => null)
  const parsedRequest =
    extractCallNotesRequestSchema.safeParse(rawBody)

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        message: "The call notes extraction request is invalid.",
        details: parsedRequest.error.flatten(),
      },
      { status: 400 }
    )
  }

  const requestId = parsedRequest.data.requestId

  try {
    const response = await fetch(
      `${serviceUrl}/api/v1/call-notes/extract`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          ...(internalApiKey
            ? {
                "X-Internal-Api-Key": internalApiKey,
              }
            : {}),
        },
        body: JSON.stringify(parsedRequest.data),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      }
    )

    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        {
          code: mapPythonStatusToErrorCode(response.status),
          message:
            getPythonErrorMessage(responseBody) ??
            "Unable to analyze call notes.",
        },
        { status: response.status }
      )
    }

    const parsedResponse =
      extractCallNotesResponseSchema.safeParse(responseBody)

    if (!parsedResponse.success) {
      return NextResponse.json(
        {
          code: "INVALID_AI_RESPONSE",
          message:
            "The Call Notes AI service returned an invalid response.",
        },
        { status: 502 }
      )
    }

    return NextResponse.json(parsedResponse.data)
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "TimeoutError"
    ) {
      return NextResponse.json(
        {
          code: "CALL_NOTES_AI_TIMEOUT",
          message:
            "The Call Notes AI service did not respond in time.",
        },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        code: "CALL_NOTES_AI_UNAVAILABLE",
        message:
          "The Call Notes AI service is currently unavailable.",
      },
      { status: 503 }
    )
  }
}
```

Use the project’s existing API/error utilities where available.

---

## 6. Request Contract

### Endpoint

```http
POST /api/call-notes/extract
```

### Content type

```http
Content-Type: application/json
```

### Request body

```ts
interface ExtractCallNotesRequest {
  requestId: string
  schemaVersion: string
  rawNotes: string
  minimumConfidence?: number | null
  allowedEmptyFields: AllowedEmptyField[]
  candidateContext: CandidateExtractionContext
}
```

---

## 7. Allowed Empty Field Contract

```ts
type CallNotesValueType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "lookup"
  | "lookup_list"
  | "text_list"

type CallNotesFieldSection =
  | "basic"
  | "workExperience"
  | "education"
  | "certifications"
  | "achievements"
  | "techStacks"
  | "projects"

interface AllowedEmptyField {
  fieldPath: string
  fieldLabel: string
  section: CallNotesFieldSection
  valueType: CallNotesValueType
  enumOptions: string[]
  context: AllowedEmptyFieldContext | null
}

interface AllowedEmptyFieldContext {
  entityType: string | null
  entityId: number | null
  parentEntityType: string | null
  parentEntityId: number | null
  employerName: string | null
  jobTitle: string | null
  projectName: string | null
}
```

Rules:

- `fieldPath` must uniquely identify the target field in the extraction request.
- `fieldPath` for nested existing records must use stable database IDs.
- `fieldLabel` must match the UI label.
- `valueType` must match the Edit Mode field type.
- `enumOptions` must contain canonical backend-compatible enum values for enum fields.
- `context.entityId` must be the database ID of the target nested record.
- `context.parentEntityId` should be the candidate ID when applicable.
- Only fields that are currently empty may be included.
- Unsupported or unsavable fields must not be included.

---

## 8. Stable Field Identity

Frontend array positions are not stable identities.

Do not rely on:

```text
workExperiences[0].techStacks
```

Use stable database IDs:

```text
workExperiences[81].techStacks
```

where `81` is the actual work-experience database ID.

In frontend state, also create a stable `fieldKey`:

```ts
interface StableFieldIdentity {
  fieldKey: string
  fieldName: string
  targetEntityType: string
  targetEntityId: number | null
}
```

Recommended formats:

```text
candidate:42:currentSalary
candidateWorkExperience:81:techStacks
candidateWorkExperience:94:benefits
candidateEducation:17:grades
candidateCertification:23:certificationUrl
candidateAchievement:35:ranking
candidateProject:44:contribution
```

The Python request uses `fieldPath`.

The frontend mapping layer should use `fieldKey`.

---

## 9. Frontend Empty Field Metadata

Extend the existing `EmptyField` type:

```ts
interface EmptyField {
  fieldPath: string
  fieldKey: string
  fieldName: string

  targetEntityType:
    | "candidate"
    | "candidateWorkExperience"
    | "candidateEducation"
    | "candidateCertification"
    | "candidateAchievement"
    | "candidateProject"

  targetEntityId: number | null

  apiFieldName: string
  fieldLabel: string
  fieldType: FieldType
  section: FieldSection
  context?: string
  options?: Array<{
    value: string
    label: string
  }>
  currentValue: unknown
  parentIndex?: number

  extractionContext?: {
    employerName?: string | null
    jobTitle?: string | null
    projectName?: string | null
  }
}
```

Existing UI array paths may remain for display and scroll behavior, but extraction mapping must use stable IDs.

---

## 10. Candidate Context Contract

```ts
interface CandidateExtractionContext {
  candidateId: number
  workExperiences: WorkExperienceExtractionContext[]
}

interface WorkExperienceExtractionContext {
  workExperienceId: number
  employerId: number | null
  employerName: string | null
  jobTitle: string | null
  startDate: string | null
  endDate: string | null
}
```

Rules:

- Include only existing work experiences with stable IDs.
- Include only context needed to disambiguate allowed empty fields.
- Do not send the entire candidate object.
- Use ISO dates.
- Use `null` for unavailable optional values.
- Never invent IDs.
- Do not include sensitive unrelated data.

---

## 11. Example Request

```json
{
  "requestId": "candidate-42-1718530000000",
  "schemaVersion": "1.0",
  "rawNotes": "Current salary is 150000. In DPL his tech stacks were .NET and Azure. In Swipbox he received paid leaves and matrimonial leaves.",
  "minimumConfidence": 0.85,
  "allowedEmptyFields": [
    {
      "fieldPath": "currentSalary",
      "fieldLabel": "Current Salary",
      "section": "basic",
      "valueType": "number",
      "enumOptions": [],
      "context": null
    },
    {
      "fieldPath": "workExperiences[81].techStacks",
      "fieldLabel": "Tech Stacks",
      "section": "workExperience",
      "valueType": "lookup_list",
      "enumOptions": [],
      "context": {
        "entityType": "candidateWorkExperience",
        "entityId": 81,
        "parentEntityType": "candidate",
        "parentEntityId": 42,
        "employerName": "DPL",
        "jobTitle": "Software Engineer",
        "projectName": null
      }
    },
    {
      "fieldPath": "workExperiences[94].benefits",
      "fieldLabel": "Benefits",
      "section": "workExperience",
      "valueType": "lookup_list",
      "enumOptions": [],
      "context": {
        "entityType": "candidateWorkExperience",
        "entityId": 94,
        "parentEntityType": "candidate",
        "parentEntityId": 42,
        "employerName": "Swipbox",
        "jobTitle": "Backend Engineer",
        "projectName": null
      }
    }
  ],
  "candidateContext": {
    "candidateId": 42,
    "workExperiences": [
      {
        "workExperienceId": 81,
        "employerId": 5,
        "employerName": "DPL",
        "jobTitle": "Software Engineer",
        "startDate": "2021-01-01",
        "endDate": "2023-04-01"
      },
      {
        "workExperienceId": 94,
        "employerId": 18,
        "employerName": "Swipbox",
        "jobTitle": "Backend Engineer",
        "startDate": "2023-05-01",
        "endDate": null
      }
    ]
  }
}
```

---

## 12. Response Contract

```ts
interface ExtractCallNotesResponse {
  requestId: string
  schemaVersion: string
  promptVersion: string
  model: string
  extractions: CallNotesExtraction[]
  warnings: string[]
  ignoredStatements: string[]
  metadata: CallNotesExtractionMetadata
}
```

---

## 13. Extraction Contract

```ts
type ExtractedValueKind =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "enum"
  | "lookup"
  | "lookup_list"
  | "text_list"

interface ExtractedValue {
  kind: ExtractedValueKind
  textValue: string | null
  numberValue: number | null
  booleanValue: boolean | null
  dateValue: string | null
  listValue: string[]
}

interface CallNotesExtraction {
  fieldPath: string
  fieldLabel: string
  section: CallNotesFieldSection
  value: ExtractedValue
  sourceText: string
  confidence: number
  targetContextId: number | null
}

interface CallNotesExtractionMetadata {
  durationMs: number
  inputTokens: number | null
  outputTokens: number | null
}
```

---

## 14. Example Response

```json
{
  "requestId": "cold-call-session-125",
  "schemaVersion": "1.0",
  "promptVersion": "1.0",
  "model": "gpt-4.1",
  "extractions": [
    {
      "fieldPath": "currentSalary",
      "fieldLabel": "Current Salary",
      "section": "basic",
      "value": {
        "kind": "number",
        "textValue": null,
        "numberValue": 150000,
        "booleanValue": null,
        "dateValue": null,
        "listValue": []
      },
      "sourceText": "Current salary is 150000.",
      "confidence": 1,
      "targetContextId": null
    },
    {
      "fieldPath": "workExperiences[81].techStacks",
      "fieldLabel": "Tech Stacks",
      "section": "workExperience",
      "value": {
        "kind": "lookup_list",
        "textValue": null,
        "numberValue": null,
        "booleanValue": null,
        "dateValue": null,
        "listValue": [
          ".NET",
          "Azure"
        ]
      },
      "sourceText": "In DPL his tech stacks were .NET and Azure.",
      "confidence": 1,
      "targetContextId": 81
    },
    {
      "fieldPath": "workExperiences[94].benefits",
      "fieldLabel": "Benefits",
      "section": "workExperience",
      "value": {
        "kind": "lookup_list",
        "textValue": null,
        "numberValue": null,
        "booleanValue": null,
        "dateValue": null,
        "listValue": [
          "paid leaves",
          "matrimonial leaves"
        ]
      },
      "sourceText": "In Swipbox he received paid leaves and matrimonial leaves.",
      "confidence": 1,
      "targetContextId": 94
    }
  ],
  "warnings": [],
  "ignoredStatements": [],
  "metadata": {
    "durationMs": 7962,
    "inputTokens": 1663,
    "outputTokens": 253
  }
}
```

---

## 15. Tagged Value Conversion

Create one conversion utility.

```ts
function getExtractedPrimitiveValue(
  extractedValue: ExtractedValue
): unknown {
  switch (extractedValue.kind) {
    case "text":
    case "enum":
    case "lookup":
      return extractedValue.textValue

    case "number":
      return extractedValue.numberValue

    case "boolean":
      return extractedValue.booleanValue

    case "date":
      return extractedValue.dateValue

    case "lookup_list":
    case "text_list":
      return extractedValue.listValue

    default:
      return undefined
  }
}
```

Rules:

- Do not read `textValue` for a number field.
- Do not read `listValue` for a scalar field.
- Reject extraction objects whose active value does not match `kind`.
- Date values must be complete ISO dates.
- Empty lists are invalid for list types.

---

## 16. Frontend Validation Rules

The Python response must not be trusted blindly.

Validate every extraction before mapping it into Edit Mode.

For each extraction:

1. `fieldPath` must exist in the exact request whitelist.
2. `fieldLabel` must match the allowed field.
3. `section` must match the allowed field.
4. `value.kind` must be compatible with the allowed `valueType`.
5. `targetContextId` must match the expected nested entity ID.
6. Candidate-level fields must have `targetContextId = null`.
7. Nested fields must have a valid stable target ID.
8. The field must still be empty in the current Candidate frontend state.
9. `sourceText` must not be blank.
10. Duplicate `fieldPath` values must be rejected.
11. Unsupported field mappings must be ignored.
12. Values must satisfy basic frontend constraints.
13. Enum values must be among canonical `enumOptions`.
14. Empty lookup lists must be rejected.
15. Invalid date strings must be rejected.

Create:

```ts
interface ValidatedExtraction {
  extraction: CallNotesExtraction
  emptyField: EmptyField
  fieldKey: string
  primitiveValue: unknown
}

function validateExtractionResponse(
  response: ExtractCallNotesResponse,
  emptyFields: EmptyField[],
  candidate: Candidate
): {
  valid: ValidatedExtraction[]
  rejected: Array<{
    extraction: CallNotesExtraction
    reason: string
  }>
}
```

Frontend validation must not apply another confidence threshold. Python already returns only high-confidence values.

---

## 17. Value Type Compatibility

Use this mapping:

```ts
const compatibleKinds: Record<
  CallNotesValueType,
  ExtractedValueKind[]
> = {
  text: ["text"],
  number: ["number"],
  boolean: ["boolean"],
  date: ["date"],
  enum: ["enum"],
  lookup: ["lookup"],
  lookup_list: ["lookup_list"],
  text_list: ["text_list"],
}
```

Any mismatch must be rejected.

---

## 18. Building `allowedEmptyFields`

Create:

```ts
function buildAllowedEmptyFields(
  candidate: Candidate,
  emptyFields: EmptyField[]
): AllowedEmptyField[]
```

Include only fields that:

- are actually empty;
- belong to existing persisted records;
- have stable target IDs for nested records;
- have an existing Edit Mode update path;
- have a supported Python value type;
- can be represented in the current API contract.

Exclude:

- populated fields;
- visual-only fields;
- unsupported placeholders;
- fields for newly added unsaved rows;
- fields whose parent entity does not exist;
- fields that cannot be saved through current Update & Verify logic.

---

## 19. Supported Initial Scope

For the first integration, prioritize:

### Candidate fields

- Current salary
- Expected salary
- City
- CNIC
- Phone number
- Email
- LinkedIn URL
- Personality type
- Top developer, if Edit Mode supports it

### Existing work-experience fields

- Job title
- Start date
- End date
- Shift type
- Work mode
- Tech stacks
- Time support zones
- Benefits

### Existing persisted related records

- Education fields
- Certification fields
- Achievement fields
- Existing independent project contribution
- Existing work-experience project contribution

Defer extracting completely new parent records:

- new work experience;
- new education row;
- new certification row;
- new achievement row;
- new independent project row.

---

## 20. Candidate Context Builder

Create:

```ts
function buildCandidateExtractionContext(
  candidate: Candidate,
  allowedFields: AllowedEmptyField[]
): CandidateExtractionContext
```

Rules:

- Include only work experiences referenced by eligible allowed fields.
- Use persisted database IDs.
- Use existing employer IDs and names.
- Include job title and dates for disambiguation.
- Avoid sending unrelated work experiences when unnecessary.
- Do not send salary, contact information, or other unrelated populated data as context.

---

## 21. Request Builder

Create:

```ts
function buildCallNotesExtractionRequest(args: {
  candidate: Candidate
  rawNotes: string
  emptyFields: EmptyField[]
}): ExtractCallNotesRequest
```

Implementation behavior:

```ts
function buildCallNotesExtractionRequest({
  candidate,
  rawNotes,
  emptyFields,
}: {
  candidate: Candidate
  rawNotes: string
  emptyFields: EmptyField[]
}): ExtractCallNotesRequest {
  const supportedEmptyFields =
    emptyFields.filter(canBeMappedByCallNotes)

  const allowedEmptyFields =
    buildAllowedEmptyFields(
      candidate,
      supportedEmptyFields
    )

  return {
    requestId: `candidate-${candidate.id}-${Date.now()}`,
    schemaVersion: "1.0",
    rawNotes: rawNotes.trim(),
    minimumConfidence: 0.85,
    allowedEmptyFields,
    candidateContext:
      buildCandidateExtractionContext(
        candidate,
        allowedEmptyFields
      ),
  }
}
```

Reject submission when `allowedEmptyFields` is empty.

---

## 22. Frontend Service

Create:

```text
src/lib/services/call-notes-extraction-api.ts
```

```ts
export async function extractCallNotes(
  request: ExtractCallNotesRequest,
  signal?: AbortSignal
): Promise<ExtractCallNotesResponse> {
  const response = await fetch("/api/call-notes/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    cache: "no-store",
    signal,
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new CallNotesExtractionError({
      status: response.status,
      code:
        body?.code ??
        "CALL_NOTES_EXTRACTION_FAILED",
      message:
        body?.message ??
        "Unable to analyze call notes.",
      details: body?.details,
    })
  }

  return extractCallNotesResponseSchema.parse(body)
}
```

---

## 23. Error Contract

The Next.js proxy should return:

```ts
interface CallNotesApiErrorResponse {
  code: string
  message: string
  details?: unknown
}
```

Supported codes:

```text
INVALID_REQUEST
CALL_NOTES_AI_NOT_CONFIGURED
CALL_NOTES_AI_UNAUTHORIZED
CALL_NOTES_AI_VALIDATION_FAILED
CALL_NOTES_AI_TIMEOUT
CALL_NOTES_AI_UNAVAILABLE
CALL_NOTES_AI_REFUSED
INVALID_AI_RESPONSE
CALL_NOTES_EXTRACTION_FAILED
```

Recommended status mapping:

| Error | Status |
|---|---:|
| Invalid frontend request | 400 |
| Python validation error | 422 |
| Python internal authentication error | 502 or 500 |
| Timeout | 504 |
| Python unavailable | 503 |
| Invalid AI response | 502 |
| Model refusal | 422 |
| Unexpected proxy error | 500 |

Frontend must show user-friendly messages and must not display Python stack traces.

---

## 24. Analyze Notes Handler

```ts
const handleAnalyzeNotes = async () => {
  const notes = rawNotesDraft.trim()

  if (!notes || isAnalyzing) {
    return
  }

  const emptyFields = getEmptyFields(candidate)
    .filter(canBeMappedByCallNotes)

  if (emptyFields.length === 0) {
    toast.info(
      "There are no supported empty fields to map."
    )
    return
  }

  const request =
    buildCallNotesExtractionRequest({
      candidate,
      rawNotes: notes,
      emptyFields,
    })

  const controller = new AbortController()
  extractionAbortControllerRef.current = controller

  try {
    setStage("extracting")
    setExtractionError(null)

    const response = await extractCallNotes(
      request,
      controller.signal
    )

    const validation =
      validateExtractionResponse(
        response,
        emptyFields,
        candidate
      )

    setExtractionResponse(response)
    setValidatedExtractions(validation.valid)
    setRejectedExtractions(validation.rejected)

    if (validation.valid.length === 0) {
      setStage("noResults")
      return
    }

    setStage("review")
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return
    }

    setExtractionError(getErrorMessage(error))
    setStage("extractionError")
  } finally {
    extractionAbortControllerRef.current = null
  }
}
```

Abort the request when:

- the dialog closes;
- candidate changes;
- component unmounts.

---

## 25. Extraction UI States

Recommended stages:

```ts
type CallNotesStage =
  | "draft"
  | "extracting"
  | "review"
  | "noResults"
  | "extractionError"
  | "editReady"
```

### Draft

- Notes are editable.
- Analyze button enabled when valid.

### Extracting

- Notes shown read-only.
- Loading indicator displayed.
- Duplicate analyze prevented.

### Review

- Display extracted field summary.
- Allow recruiter to continue to Edit Mode.

### No results

Show:

```text
No high-confidence values were found for the candidate’s currently empty fields.
```

### Extraction error

Show safe error and retry.

---

## 26. Frontend Lookup Resolution

Python returns lookup names, not IDs.

Examples:

```text
.NET
Azure
Paid Leaves
Matrimonial Leaves
```

The Edit Candidate form may require IDs.

Create:

```ts
interface LookupResolution {
  extractedName: string
  normalizedName: string
  matchedId: number | null
  matchedName: string | null
  status:
    | "matched"
    | "unmatched"
    | "ambiguous"
}
```

Resolution flow:

1. Normalize extracted name.
2. Search the correct lookup API.
3. Prefer case-insensitive exact match.
4. Accept one unambiguous exact result.
5. Mark no match as `unmatched`.
6. Mark multiple plausible matches as `ambiguous`.
7. Do not automatically create new lookup records.
8. Recruiter resolves unmatched/ambiguous values in Edit Mode.

Do not fetch all large lookup datasets on page mount.

Use existing server-side search endpoints.

---

## 27. Lookup Normalization

Recommended normalization:

```ts
function normalizeLookupName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase()
}
```

Do not remove meaningful symbols such as:

```text
.NET
C++
C#
Node.js
```

Use normalization for comparison only. Preserve display names from the database or AI response.

---

## 28. AI-Prefilled Edit Draft

Do not mutate `candidate` directly.

Create a draft:

```ts
interface AiPrefilledEditDraft {
  formValues: CandidateEditFormValues
  mappedFields: Map<string, AiMappedField>
}

interface AiMappedField {
  fieldKey: string
  fieldPath: string
  fieldLabel: string
  targetEntityType: string
  targetEntityId: number | null
  sourceText: string
  extractedValue: unknown
  displayValue: string
  status:
    | "mapped"
    | "lookupUnresolved"
    | "invalid"
}
```

Build the draft by:

1. Converting the current candidate to existing Edit Mode form values.
2. Applying only validated AI extraction values.
3. Preserving all non-empty existing form values.
4. Attaching mapping metadata.
5. Resolving known lookup IDs where possible.
6. Marking unresolved lookup values.

---

## 29. Mapping to Edit Form

Create:

```ts
function mapExtractionsToEditDraft(args: {
  candidate: Candidate
  currentFormValues: CandidateEditFormValues
  validatedExtractions: ValidatedExtraction[]
  lookupResolutions: Map<string, LookupResolution[]>
}): AiPrefilledEditDraft
```

The mapping must be explicit per supported field.

Do not implement arbitrary dot-path mutation without validating the target entity and field.

Example candidate-level mapping:

```ts
case "candidate:currentSalary":
  if (isEmpty(formValues.currentSalary)) {
    formValues.currentSalary =
      extraction.primitiveValue as number
  }
  break
```

Example work-experience mapping:

```ts
const workExperience =
  formValues.workExperiences.find(
    (item) =>
      item.id === extraction.emptyField.targetEntityId
  )

if (!workExperience) {
  markInvalid(extraction)
  break
}

if (extraction.emptyField.fieldName === "techStacks") {
  workExperience.techStackIds =
    resolvedLookupIds
}
```

Use stable IDs, not array indexes.

---

## 30. Edit Mode Opening Contract

After extraction review:

```ts
interface OpenEditModeWithAiDraftArgs {
  candidateId: number
  draft: AiPrefilledEditDraft
}
```

Recommended behavior:

1. Show extraction count.
2. User clicks **Review in Edit Mode**.
3. Open Edit Candidate Mode.
4. Pass the AI-prefilled form values.
5. Pass AI mapping metadata.
6. Keep all fields editable.
7. Highlight AI-prefilled fields.
8. Do not mark any field saved yet.

---

## 31. AI-Prefilled Field Presentation

Recommended UI:

```text
Current Salary
[ 150000 ]

AI extracted
Source: “Current salary is 150000.”
```

Use:

- subtle AI highlight;
- Sparkles icon;
- **AI extracted** badge;
- source excerpt tooltip/popover;
- remove/reset AI value action.

For nested fields:

```text
Work Experience — DPL
Tech Stacks
[.NET] [Azure]

AI extracted from call notes
```

For unresolved lookup values:

```text
Matrimonial Leaves
Needs lookup matching
```

---

## 32. Update & Verify Contract

The **Update & Verify** button is the only persistence action.

On click:

1. Validate the entire Edit Mode form.
2. Prevent saving unresolved required lookup values.
3. Allow recruiter to remove unsupported AI values.
4. Build existing ASP.NET update DTOs.
5. Save using existing candidate update APIs.
6. Save nested changes using existing nested APIs or aggregate update flow.
7. Apply verification according to existing behavior.
8. Refetch Candidate Details.
9. Refresh Data Progress.
10. Refresh Total Experience Months.
11. Refresh Latest Job Title.
12. Clear temporary AI draft metadata.
13. Show success.

The Python extraction response must never be submitted directly to ASP.NET candidate update endpoints.

---

## 33. Empty-Field Protection

Before overlaying an AI value into Edit Mode, confirm:

- candidate field remains empty;
- nested target record still exists;
- nested field remains empty;
- no newer local edit has filled the field;
- the target ID still matches the correct entity.

If not, reject the mapping as stale.

The recruiter may manually enter values in Edit Mode, but AI values must not overwrite them.

---

## 34. Zod Schemas

Create:

```text
src/lib/contracts/call-notes-extraction.ts
```

It should export:

```ts
extractCallNotesRequestSchema
extractCallNotesResponseSchema
allowedEmptyFieldSchema
candidateExtractionContextSchema
callNotesExtractionSchema
extractedValueSchema
callNotesApiErrorSchema
```

Use `.strict()` on object schemas where practical.

Example extracted value schema:

```ts
const extractedValueSchema = z
  .object({
    kind: z.enum([
      "text",
      "number",
      "boolean",
      "date",
      "enum",
      "lookup",
      "lookup_list",
      "text_list",
    ]),
    textValue: z.string().nullable(),
    numberValue: z.number().finite().nullable(),
    booleanValue: z.boolean().nullable(),
    dateValue: z.string().nullable(),
    listValue: z.array(z.string()),
  })
  .strict()
```

Add refinement to ensure the active property matches `kind`.

---

## 35. Testing Requirements

### Request builder tests

- Candidate-level empty field
- Existing work-experience empty field
- Stable database IDs
- Enum options included
- Populated fields excluded
- Unsupported placeholders excluded
- Candidate context minimized
- Empty request rejected

### Response validation tests

- Valid salary extraction
- Valid nested tech-stack extraction
- Valid nested benefit extraction
- Unknown field rejected
- Wrong context ID rejected
- Wrong value kind rejected
- Duplicate field path rejected
- Invalid enum rejected
- Invalid date rejected
- Field no longer empty rejected

### Lookup resolution tests

- Exact case-insensitive match
- Symbol-sensitive tech stack
- No match
- Multiple match ambiguity
- Lookup API failure
- Unmatched value preserved for review

### Edit draft tests

- AI value overlays empty field
- Existing value not overwritten
- Work experience matched by ID
- Missing nested entity rejected
- Lookup IDs mapped correctly
- Unresolved lookup marked
- Source metadata preserved

### Proxy route tests

- Valid request forwarded
- Internal API key added
- Timeout handled
- Python 422 normalized
- Python unavailable normalized
- Invalid Python response rejected
- Raw notes not logged

---

## 36. Acceptance Criteria

### API

- [ ] Browser calls `/api/call-notes/extract`.
- [ ] Browser never calls Python directly.
- [ ] Internal API key remains server-side.
- [ ] Proxy request and response are validated.
- [ ] Timeouts and Python errors are normalized.

### Request construction

- [ ] Only empty fields are sent.
- [ ] Stable nested IDs are used.
- [ ] Candidate context is limited.
- [ ] Unsupported fields are excluded.
- [ ] Enum options are canonical.

### Response handling

- [ ] Every extraction is validated.
- [ ] Tagged values are converted correctly.
- [ ] Invalid mappings are ignored safely.
- [ ] No frontend confidence threshold is added.
- [ ] Source text is retained.

### Lookup handling

- [ ] Lookup names are resolved through application APIs.
- [ ] Lookup IDs are never invented.
- [ ] New lookups are not created automatically.
- [ ] Unmatched values require recruiter review.

### Edit Mode

- [ ] AI values populate a draft only.
- [ ] Existing values are not overwritten.
- [ ] AI-prefilled fields are highlighted.
- [ ] Source excerpts are visible.
- [ ] All values remain editable.
- [ ] Update & Verify is the only persistence action.

### Persistence

- [ ] Existing ASP.NET update APIs are used.
- [ ] Nested entities save correctly.
- [ ] Candidate Details refetches.
- [ ] Data Progress refreshes.
- [ ] Total Experience and Latest Job Title refresh where relevant.
- [ ] Temporary AI state clears after success.

---

## 37. Temporary Architecture Limitations

This frontend-to-Python integration does not yet provide:

- permanent raw-note audit history;
- ASP.NET-side extraction validation;
- backend-managed empty-field whitelist;
- database-backed extraction sessions;
- backend lookup resolution;
- transactional mapping application;
- stale-field protection before extraction review;
- extraction retry history.

These limitations must be documented.

This temporary integration is appropriate for internal development and controlled testing because the AI output still requires Edit Mode review before persistence.

---

## 38. Final Integration Flow

```text
Recruiter enters call notes
    ↓
Clicks Analyze Notes
    ↓
Frontend detects supported empty fields
    ↓
Frontend builds Python extraction request
    ↓
Browser calls Next.js proxy
    ↓
Next.js securely calls Python service
    ↓
Python returns structured extractions
    ↓
Frontend validates extractions
    ↓
Frontend resolves lookup names
    ↓
Frontend builds AI-prefilled Edit Mode draft
    ↓
Recruiter reviews and edits values
    ↓
Recruiter clicks Update & Verify
    ↓
Existing ASP.NET APIs save candidate changes
    ↓
Candidate Details and derived values refresh
```

---

## 39. Do Not Do

Do not:

- call Python directly from browser code;
- expose the Python internal API key;
- send populated fields as allowed empty fields;
- use unstable array indexes as record identities;
- mutate the displayed Candidate object directly;
- auto-save extraction results;
- auto-create lookup values;
- treat AI confidence as verification;
- overwrite existing candidate values;
- submit raw Python extraction objects to ASP.NET update APIs;
- log raw call notes;
- fetch every lookup record on page load;
- claim persistence before Update & Verify succeeds.

---

## 40. Definition of Done

The frontend integration is complete when:

1. Analyze Notes calls the Next.js proxy.
2. The proxy securely calls the Python service.
3. The request contains only supported empty fields.
4. Nested records use stable database IDs.
5. The response is schema-validated.
6. Invalid mappings are rejected safely.
7. Lookup names are resolved or flagged for review.
8. An AI-prefilled Edit Mode draft is created.
9. Existing values remain untouched.
10. AI-filled fields are visibly identified.
11. Update & Verify saves through ASP.NET.
12. Candidate details and derived values refresh.
13. Automated tests cover request construction, mapping, lookups, proxy handling, and Edit Mode prefilling.
