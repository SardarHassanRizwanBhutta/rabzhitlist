# Candidate Resume Storage — Frontend Implementation Handoff

## 1. Purpose

Implement candidate resume upload and open/download functionality in the Next.js frontend using the completed ASP.NET API contract.

The backend already provides:

```http
POST /api/candidates/{candidateId}/resume/upload-url
POST /api/candidates/{candidateId}/resume/confirm
GET  /api/candidates/{candidateId}/resume/open-url
```

The file must be uploaded directly from the browser to the private S3 bucket using the presigned URL returned by the backend.

The frontend must not:

- convert the file to Base64;
- send resume bytes through the ASP.NET API;
- store or cache presigned URLs permanently;
- expose the S3 object key in normal UI;
- create public S3 URLs;
- retry candidate creation when only the resume upload failed.

The intended flow is:

```text
User selects resume
→ Candidate is created or already exists
→ Frontend requests a presigned upload URL
→ Browser uploads the File directly to S3
→ Frontend confirms upload with ASP.NET
→ Candidate data is refreshed
→ Resume icon becomes visible
→ Clicking the icon requests a presigned open URL
→ Resume opens in a new tab or downloads
```

---

## 2. Confirmed Backend Contract

### Upload authorization

```http
POST /api/candidates/{candidateId}/resume/upload-url
```

Request:

```json
{
  "fileName": "resume.pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 842319
}
```

Response:

```json
{
  "uploadUrl": "https://...",
  "objectKey": "resumes/candidates/42/abc123....pdf",
  "expiresAt": "2026-06-17T08:15:00Z",
  "requiredHeaders": {
    "Content-Type": "application/pdf"
  }
}
```

### Upload confirmation

```http
POST /api/candidates/{candidateId}/resume/confirm
```

Request:

```json
{
  "objectKey": "resumes/candidates/42/abc123....pdf",
  "originalFileName": "resume.pdf",
  "contentType": "application/pdf",
  "expectedFileSizeBytes": 842319
}
```

Response:

```json
{
  "candidateId": 42,
  "hasResume": true,
  "resumeFileName": "resume.pdf",
  "resumeContentType": "application/pdf",
  "resumeFileSizeBytes": 842319,
  "uploadedAt": "2026-06-17T08:11:42Z"
}
```

### Open/download URL

```http
GET /api/candidates/{candidateId}/resume/open-url
```

Response:

```json
{
  "url": "https://...",
  "fileName": "resume.pdf",
  "contentType": "application/pdf",
  "expiresAt": "2026-06-17T08:20:00Z"
}
```

### Candidate DTO fields

The candidate list/detail DTOs include:

```ts
hasResume: boolean
resumeFileName: string | null
resumeContentType: string | null
resumeFileSizeBytes: number | null
resumeUploadedAt: string | null
```

The legacy `resumeUrl` remains unused.

---

## 3. Supported File Rules

Frontend validation must match backend validation exactly.

### Allowed extensions

```text
.pdf
.docx
```

### Allowed MIME types

```text
application/pdf
application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### Maximum size

```text
10 MB
10485760 bytes
```

Do not support `.doc`, `.txt`, `.rtf`, images, archives, or other file types.

Do not accept files with mismatched extension and MIME type.

---

## 4. Mandatory Agent Workflow Before Coding

Before modifying code:

1. Inspect the current Candidate Create dialog.
2. Inspect the Candidate Edit dialog if replacement should be supported there.
3. Inspect the Candidates table columns.
4. Inspect the Candidate Details Modal.
5. Inspect current candidate DTO/types.
6. Inspect existing API client conventions.
7. Inspect current mutation/query/refetch patterns.
8. Inspect toast and error-handling conventions.
9. Inspect the existing resume file input UI.
10. Confirm whether the resume field currently stores a `File`, file name, or placeholder string.
11. Preserve all current candidate creation behavior.
12. Do not invent different backend endpoints.

Inspect likely files, adapting to the actual repository:

```text
src/components/candidates/create-candidate-dialog.tsx
src/components/candidates/edit-candidate-dialog.tsx
src/components/candidates/candidates-table.tsx
src/components/candidate-details-modal.tsx
src/types/candidate.ts
src/lib/services/candidates-api.ts
src/lib/api-client.ts
```

---

## 5. Recommended Frontend File Structure

Create or update:

```text
src/
├── lib/
│   ├── contracts/
│   │   └── candidate-resume.ts
│   ├── services/
│   │   └── candidate-resume-api.ts
│   └── utils/
│       └── candidate-resume.ts
│
├── components/
│   └── candidates/
│       ├── resume-file-input.tsx
│       ├── resume-upload-status.tsx
│       └── resume-open-button.tsx
```

Reuse existing project conventions and avoid unnecessary abstraction if the current structure differs.

---

## 6. TypeScript Contracts

Create:

```text
src/lib/contracts/candidate-resume.ts
```

```ts
export interface CreateResumeUploadUrlRequest {
  fileName: string
  contentType: string
  fileSizeBytes: number
}

export interface CreateResumeUploadUrlResponse {
  uploadUrl: string
  objectKey: string
  expiresAt: string
  requiredHeaders: Record<string, string>
}

export interface ConfirmCandidateResumeRequest {
  objectKey: string
  originalFileName: string
  contentType: string
  expectedFileSizeBytes: number
}

export interface CandidateResumeMetadata {
  candidateId: number
  hasResume: boolean
  resumeFileName: string
  resumeContentType: string
  resumeFileSizeBytes: number
  uploadedAt: string
}

export interface CandidateResumeOpenUrlResponse {
  url: string
  fileName: string
  contentType: string
  expiresAt: string
}
```

Update candidate list/detail types:

```ts
export interface Candidate {
  // existing properties

  hasResume: boolean
  resumeFileName: string | null
  resumeContentType: string | null
  resumeFileSizeBytes: number | null
  resumeUploadedAt: string | null
}
```

Update separate list/detail interfaces when the project uses distinct models.

---

## 7. Frontend File Validation

Create:

```text
src/lib/utils/candidate-resume.ts
```

```ts
export const MAX_RESUME_FILE_SIZE_BYTES =
  10 * 1024 * 1024

export const ALLOWED_RESUME_FILES = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const

export interface ResumeFileValidationResult {
  isValid: boolean
  error?: string
}

export function getFileExtension(
  fileName: string
): string {
  const index = fileName.lastIndexOf(".")

  return index >= 0
    ? fileName.slice(index).toLowerCase()
    : ""
}

export function validateResumeFile(
  file: File
): ResumeFileValidationResult {
  if (!file.name.trim()) {
    return {
      isValid: false,
      error: "Please select a valid resume file.",
    }
  }

  if (file.size <= 0) {
    return {
      isValid: false,
      error: "The selected resume file is empty.",
    }
  }

  if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: "Resume size cannot exceed 10 MB.",
    }
  }

  const extension = getFileExtension(file.name)

  if (!(extension in ALLOWED_RESUME_FILES)) {
    return {
      isValid: false,
      error: "Only PDF and DOCX resumes are supported.",
    }
  }

  const expectedContentType =
    ALLOWED_RESUME_FILES[
      extension as keyof typeof ALLOWED_RESUME_FILES
    ]

  if (file.type !== expectedContentType) {
    return {
      isValid: false,
      error:
        "The selected file type does not match its extension.",
    }
  }

  return { isValid: true }
}
```

Do not read the file into Base64 for validation.

---

## 8. Resume API Service

Create:

```text
src/lib/services/candidate-resume-api.ts
```

Use the existing authenticated ASP.NET API client.

### Request upload URL

```ts
export async function createCandidateResumeUploadUrl(
  candidateId: number,
  request: CreateResumeUploadUrlRequest,
  signal?: AbortSignal
): Promise<CreateResumeUploadUrlResponse> {
  return apiClient.post(
    `/api/candidates/${candidateId}/resume/upload-url`,
    request,
    { signal }
  )
}
```

Adapt to the actual client syntax.

### Upload directly to S3

```ts
export async function uploadResumeToS3(
  uploadUrl: string,
  requiredHeaders: Record<string, string>,
  file: File,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: requiredHeaders,
    body: file,
    signal,
  })

  if (!response.ok) {
    throw new Error(
      "The resume could not be uploaded to storage."
    )
  }
}
```

Important:

- use the exact `requiredHeaders` returned by the backend;
- do not add the ASP.NET bearer token to the S3 request;
- do not use an API client that automatically adds authentication headers for S3;
- do not send `FormData`;
- send the raw `File` as the request body;
- do not add JSON headers;
- do not modify the presigned URL.

### Confirm upload

```ts
export async function confirmCandidateResumeUpload(
  candidateId: number,
  request: ConfirmCandidateResumeRequest,
  signal?: AbortSignal
): Promise<CandidateResumeMetadata> {
  return apiClient.post(
    `/api/candidates/${candidateId}/resume/confirm`,
    request,
    { signal }
  )
}
```

### Open URL

```ts
export async function getCandidateResumeOpenUrl(
  candidateId: number,
  signal?: AbortSignal
): Promise<CandidateResumeOpenUrlResponse> {
  return apiClient.get(
    `/api/candidates/${candidateId}/resume/open-url`,
    { signal }
  )
}
```

---

## 9. Combined Upload Orchestrator

Create one reusable function.

```ts
export type ResumeUploadStage =
  | "requestingUploadUrl"
  | "uploadingToS3"
  | "confirmingUpload"
  | "completed"

export async function uploadCandidateResume({
  candidateId,
  file,
  signal,
  onStageChange,
}: {
  candidateId: number
  file: File
  signal?: AbortSignal
  onStageChange?: (
    stage: ResumeUploadStage
  ) => void
}): Promise<CandidateResumeMetadata> {
  const validation = validateResumeFile(file)

  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  onStageChange?.("requestingUploadUrl")

  const authorization =
    await createCandidateResumeUploadUrl(
      candidateId,
      {
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
      },
      signal
    )

  onStageChange?.("uploadingToS3")

  await uploadResumeToS3(
    authorization.uploadUrl,
    authorization.requiredHeaders,
    file,
    signal
  )

  onStageChange?.("confirmingUpload")

  const metadata =
    await confirmCandidateResumeUpload(
      candidateId,
      {
        objectKey: authorization.objectKey,
        originalFileName: file.name,
        contentType: file.type,
        expectedFileSizeBytes: file.size,
      },
      signal
    )

  onStageChange?.("completed")

  return metadata
}
```

Use this orchestrator for Create Candidate and Edit Candidate replacement.

---

## 10. Resume File Input Component

Create or update the existing resume input.

```ts
interface ResumeFileInputProps {
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  error?: string
}
```

Behavior:

- accept `.pdf,.docx`;
- display selected filename;
- display formatted size;
- allow removal before submission;
- validate immediately;
- reset the native input when removed;
- do not upload when selected;
- upload only after candidate ID exists and the user submits.

```tsx
<input
  type="file"
  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  onChange={handleFileChange}
  disabled={disabled}
/>
```

Recommended selected-file display:

```text
resume.pdf
824 KB
[Remove]
```

Use a `FileText` icon.

---

## 11. Create Candidate Flow

The selected `File` stays in frontend state until candidate creation succeeds.

```ts
const [selectedResume, setSelectedResume] =
  useState<File | null>(null)

const [resumeUploadStage, setResumeUploadStage] =
  useState<ResumeUploadStage | null>(null)

const [resumeUploadError, setResumeUploadError] =
  useState<string | null>(null)
```

### Submission flow

```text
1. Validate candidate form
2. Validate selected resume if present
3. Create candidate through existing API
4. Receive candidate ID
5. If no resume, complete normally
6. If resume exists, call uploadCandidateResume
7. Refresh candidate data/list
8. Close dialog and show success
```

Conceptual handler:

```ts
const handleCreateCandidate = async (
  values: CreateCandidateFormValues
) => {
  setIsSubmitting(true)
  setResumeUploadError(null)

  try {
    if (selectedResume) {
      const validation =
        validateResumeFile(selectedResume)

      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    const candidate =
      await createCandidate(values)

    if (selectedResume) {
      try {
        await uploadCandidateResume({
          candidateId: candidate.id,
          file: selectedResume,
          onStageChange: setResumeUploadStage,
        })
      } catch (resumeError) {
        setResumeUploadError(
          getErrorMessage(resumeError)
        )

        await refreshCandidates()

        showCandidateCreatedResumeFailedState({
          candidateId: candidate.id,
          candidateName: candidate.name,
          file: selectedResume,
        })

        return
      }
    }

    await refreshCandidates()

    toast.success(
      selectedResume
        ? "Candidate and resume created successfully."
        : "Candidate created successfully."
    )

    closeDialog()
  } finally {
    setIsSubmitting(false)
  }
}
```

### Critical partial-success rule

If candidate creation succeeds but resume upload fails:

- do not recreate the candidate;
- do not delete the candidate;
- do not report total failure;
- display:

```text
Candidate created successfully, but the resume could not be uploaded.
```

Provide:

```text
Retry Resume Upload
Close
```

---

## 12. Retry Resume Upload

Keep retry state:

```ts
interface PendingResumeRetry {
  candidateId: number
  candidateName: string
  file: File
}
```

Retry only:

```ts
uploadCandidateResume({
  candidateId,
  file,
})
```

Do not call Create Candidate again.

A `File` cannot be reliably persisted in localStorage. If the dialog closes or the page reloads, ask the user to select the file again.

---

## 13. Resume Replacement in Edit Candidate

If the Edit Candidate dialog contains a resume field, support replacement with the same upload orchestrator.

Recommended flow:

```text
Save candidate field edits
→ Upload replacement resume
→ Confirm replacement
→ Refresh candidate
```

If resume replacement fails after candidate edits save, show:

```text
Candidate updated, but the new resume could not be uploaded.
```

Do not remove the currently attached resume from UI until the new upload is confirmed.

The backend deletes the previous S3 object only after confirmation succeeds.

---

## 14. Candidate Table Resume Column

Add a compact column when not already present.

Header:

```text
Resume
```

```tsx
{candidate.hasResume ? (
  <ResumeOpenButton
    candidateId={candidate.id}
    fileName={candidate.resumeFileName}
    contentType={candidate.resumeContentType}
  />
) : (
  <span className="text-muted-foreground">
    —
  </span>
)}
```

Use a compact icon button to avoid widening the table.

Recommended icon:

```text
FileText
```

Tooltip:

```text
Open resume
```

Accessible label:

```text
Open {resumeFileName}
```

Do not display the S3 URL or object key.

---

## 15. Candidate Details Modal

Display resume information when `hasResume` is true.

Recommended UI:

```text
Resume
resume.pdf
[Open Resume]
```

Optional metadata:

```text
824 KB
Uploaded Jun 17, 2026
```

If no resume exists:

```text
No resume attached
```

Reuse `ResumeOpenButton`.

---

## 16. Open Resume Behavior

```ts
interface ResumeOpenButtonProps {
  candidateId: number
  fileName?: string | null
  contentType?: string | null
  variant?: "icon" | "button"
}
```

Request a fresh URL on every click.

A popup-safe pattern:

```ts
const handleOpenResume = async () => {
  if (isOpening) {
    return
  }

  const previewWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer"
  )

  try {
    setIsOpening(true)

    const response =
      await getCandidateResumeOpenUrl(
        candidateId
      )

    if (previewWindow) {
      previewWindow.location.href = response.url
    } else {
      window.location.assign(response.url)
    }
  } catch (error) {
    previewWindow?.close()
    toast.error(
      getErrorMessage(error) ??
        "Unable to open the resume."
    )
  } finally {
    setIsOpening(false)
  }
}
```

Expected behavior:

- PDF usually opens inline in a new tab.
- DOCX usually downloads.

Do not cache or persist the URL.

---

## 17. Upload Progress

Native `fetch` does not provide reliable upload-percentage callbacks.

For the initial version, show stage-based progress:

```text
Preparing upload…
Uploading resume…
Confirming resume…
```

Do not show a fake percentage.

Real percentage progress can be added later with `XMLHttpRequest` if required.

---

## 18. Loading and Disabled States

While candidate creation or resume upload is active:

- prevent duplicate submission;
- disable file changes/removal;
- show the current stage;
- avoid accidental dialog closure where it creates confusion;
- allow the user to close after a partial-success upload failure;
- abort in-flight requests on unmount when safe.

Suggested status text:

```text
Creating candidate…
Preparing resume upload…
Uploading resume…
Confirming resume…
```

---

## 19. Error Handling

### Local validation

```text
Only PDF and DOCX resumes are supported.

Resume size cannot exceed 10 MB.

The selected file type does not match its extension.

The selected resume file is empty.
```

### Upload URL failure

```text
Unable to prepare the resume upload.
```

### S3 PUT failure

```text
The resume could not be uploaded to storage.
```

### Confirmation failure

```text
The resume was uploaded, but it could not be attached to the candidate.
```

### Open URL failure

```text
Unable to open the resume.
```

Use existing ProblemDetails/toast conventions.

Do not expose AWS error details, object keys, or presigned URLs in user-facing errors.

---

## 20. S3 Request Rules

Use exactly:

```ts
await fetch(uploadUrl, {
  method: "PUT",
  headers: requiredHeaders,
  body: file,
})
```

Do not:

- add bearer authentication;
- add cookies manually;
- use `FormData`;
- set JSON content headers;
- append query parameters;
- change `Content-Type`;
- alter the URL;
- send Base64.

Presigned uploads can fail when request headers differ from the signed headers.

---

## 21. Query Refresh and Cache Invalidation

After successful confirmation:

- refetch/invalidate candidate list;
- refetch/invalidate candidate details;
- refresh an open Candidate Details Modal;
- ensure `hasResume`, filename, type, size, and upload date are updated.

Example with TanStack Query:

```ts
await queryClient.invalidateQueries({
  queryKey: ["candidates"],
})

await queryClient.invalidateQueries({
  queryKey: ["candidate", candidateId],
})
```

Use actual project query keys.

Prefer centralized refetching to manual patching of every screen.

---

## 22. Candidate Create Success Semantics

There are three valid outcomes.

### Candidate only

```text
Candidate created successfully.
```

### Candidate and resume

```text
Candidate and resume created successfully.
```

### Candidate created, resume failed

```text
Candidate created successfully, but the resume could not be uploaded.
```

The third outcome is partial success, not total failure.

Do not reopen the form as though candidate creation failed.

---

## 23. Data Progress

The current Data Progress scoring excludes the resume.

Therefore:

- resume upload should not alter Data Progress;
- do not calculate resume contribution in the frontend;
- simply refetch candidate data after confirmation.

---

## 24. Security Rules

- Never expose AWS credentials.
- Never expose the bucket name unnecessarily.
- Never display `objectKey`.
- Treat presigned URLs as temporary secrets.
- Do not log presigned URLs.
- Do not log raw file content.
- Do not convert the file to Base64.
- Do not persist the selected `File` in browser storage.
- Do not place URLs in localStorage/sessionStorage.
- Render filenames as text, never raw HTML.
- Use the existing ASP.NET API client for backend calls.
- Use plain `fetch` for S3 upload to avoid automatic auth headers.

The backend integration guide notes that endpoint authentication is currently TODO. Do not rely on the endpoints remaining open. Use the existing authenticated client so frontend behavior remains correct when backend authorization is enabled.

---

## 25. Accessibility

- File input has a visible label.
- Errors are associated with the input.
- Resume icon has an accessible name.
- Loading status uses `aria-live`.
- Remove-file action is keyboard accessible.
- Tooltip is not the only accessible label.
- Focus moves to the retry/error state after partial failure.

---

## 26. Responsive UX

### Create/Edit dialog

- long filename truncates or wraps safely;
- size is shown below filename;
- action buttons do not overflow;
- status text remains readable.

### Candidate table

- use an icon, not a full filename;
- filename belongs in tooltip/title;
- avoid increasing horizontal scroll.

### Candidate Details

- filename may wrap;
- Open Resume action stays visible.

---

## 27. Suggested Zod Schemas

If Zod is used:

```ts
export const createResumeUploadUrlResponseSchema =
  z.object({
    uploadUrl: z.string().url(),
    objectKey: z.string().min(1),
    expiresAt: z.string().datetime(),
    requiredHeaders: z.record(z.string()),
  })

export const candidateResumeMetadataSchema =
  z.object({
    candidateId: z.number(),
    hasResume: z.literal(true),
    resumeFileName: z.string(),
    resumeContentType: z.string(),
    resumeFileSizeBytes: z.number().positive(),
    uploadedAt: z.string().datetime(),
  })

export const candidateResumeOpenUrlResponseSchema =
  z.object({
    url: z.string().url(),
    fileName: z.string(),
    contentType: z.string(),
    expiresAt: z.string().datetime(),
  })
```

Adjust numeric IDs and date formats to the actual API serialization.

---

## 28. Testing Requirements

### Validation tests

- valid PDF;
- valid DOCX;
- uppercase `.PDF`;
- unsupported extension;
- zero-byte file;
- file over 10 MB;
- MIME mismatch;
- missing MIME type.

### API service tests

- upload URL request sends correct metadata;
- S3 PUT uses exact returned headers;
- S3 PUT sends raw `File`;
- confirmation uses returned object key;
- open URL is requested fresh;
- errors are parsed safely.

### Create flow tests

- candidate created without resume;
- candidate created with resume;
- candidate creation fails before upload;
- upload URL fails after candidate creation;
- S3 PUT fails after candidate creation;
- confirmation fails after S3 upload;
- retry does not recreate candidate;
- duplicate submission prevented.

### Edit/replacement tests

- replacement succeeds;
- existing resume remains visible until new confirmation;
- replacement failure preserves current resume;
- candidate edits remain saved if resume upload fails.

### Table/details tests

- icon shown when `hasResume=true`;
- dash/empty state when false;
- clicking requests a fresh open URL;
- PDF opens;
- DOCX downloads;
- open failure shows feedback;
- long filename does not cause horizontal overflow.

### Manual S3/CORS test

From both localhost and the Amplify production origin:

1. Create candidate.
2. Upload PDF.
3. Confirm icon appears.
4. Open PDF.
5. Upload DOCX.
6. Confirm download behavior.
7. Replace resume.
8. Refresh page.
9. Confirm metadata persists.

---

## 29. Implementation Order

1. Inspect current candidate components and API patterns.
2. Update candidate TypeScript DTOs.
3. Add resume contracts.
4. Add file validation utilities.
5. Add resume API service.
6. Add combined upload orchestrator.
7. Update Create Candidate resume input.
8. Implement post-create upload flow.
9. Implement partial-success and retry UI.
10. Add replacement flow to Edit Candidate if required.
11. Add resume icon to Candidates table.
12. Add resume action to Candidate Details Modal.
13. Implement open URL behavior.
14. Add cache invalidation/refetching.
15. Add tests.
16. Test against the backend locally.
17. Test from Amplify production.
18. Report backend contract mismatches.

---

## 30. Acceptance Criteria

### File selection

- [ ] PDF and DOCX accepted.
- [ ] Other formats rejected.
- [ ] 10 MB limit enforced.
- [ ] Filename and size displayed.
- [ ] File removable before submission.
- [ ] No Base64 conversion.

### Create Candidate

- [ ] Candidate created first.
- [ ] Resume upload begins only after candidate ID exists.
- [ ] Upload URL requested.
- [ ] File uploads directly to S3.
- [ ] Upload confirmed through backend.
- [ ] Candidate data refreshed.
- [ ] Upload failure does not recreate/delete candidate.
- [ ] Retry works.

### Replacement

- [ ] New resume can replace current resume if Edit flow includes it.
- [ ] Existing resume remains until confirmation succeeds.
- [ ] Replacement failure preserves current resume.

### Candidate display

- [ ] Candidate DTO resume fields consumed.
- [ ] Resume icon appears only when `hasResume=true`.
- [ ] Table remains compact.
- [ ] Candidate Details shows metadata/action.

### Open/download

- [ ] Fresh open URL requested on every click.
- [ ] PDF opens in a new tab.
- [ ] DOCX downloads.
- [ ] Expired URLs are not reused.
- [ ] Errors show user-friendly feedback.

### Security

- [ ] No AWS credentials in frontend.
- [ ] No object key shown.
- [ ] No presigned URL logged or persisted.
- [ ] Exact S3 headers used.
- [ ] Resume bytes do not pass through ASP.NET.
- [ ] No Base64.

### Tests

- [ ] Unit tests pass.
- [ ] API service tests pass.
- [ ] Create-flow tests pass.
- [ ] Resume icon/open tests pass.
- [ ] Localhost S3 upload works.
- [ ] Amplify-origin S3 upload works.

---

## 31. Definition of Done

The frontend feature is complete when:

1. A user can select a PDF or DOCX in Create Candidate.
2. Candidate creation succeeds before resume upload.
3. The browser uploads the raw `File` directly to S3.
4. ASP.NET confirmation succeeds.
5. Candidate list/detail reports the resume.
6. A file icon appears for candidates with resumes.
7. Clicking the icon opens PDF or downloads DOCX.
8. Resume upload failures are retryable without duplicate candidates.
9. Candidate data refreshes after confirmation.
10. No Base64, public URLs, AWS credentials, or persisted presigned URLs are used.

---

## 32. Final Agent Instructions

Implement this feature using the existing frontend architecture and conventions.

Do not:

- rewrite unrelated candidate forms;
- create alternate backend endpoints;
- send files through ASP.NET;
- use Base64;
- store presigned URLs;
- expose S3 keys;
- recreate a candidate after a resume-only failure;
- add fake percentage progress.

After implementation, report:

- files created/modified;
- final API service functions;
- candidate type changes;
- validation rules;
- Create Candidate flow changes;
- retry behavior;
- table/details UI changes;
- tests run and results;
- localhost and Amplify manual test results;
- backend contract deviations.
