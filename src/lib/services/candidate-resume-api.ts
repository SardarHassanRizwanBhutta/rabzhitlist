import type {
  CandidateResumeMetadata,
  CandidateResumeOpenUrlResponse,
  ConfirmCandidateResumeRequest,
  CreateResumeUploadUrlRequest,
  CreateResumeUploadUrlResponse,
  ResumeUploadStage,
} from "@/lib/contracts/candidate-resume"
import { API_BASE_URL } from "@/lib/config/api"
import { extractApiErrorMessage } from "@/lib/utils/api-error-message"
import { validateResumeFile } from "@/lib/utils/candidate-resume"

async function resumeApiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  return res.json() as Promise<T>
}

async function resumeApiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  return res.json() as Promise<T>
}

export async function createCandidateResumeUploadUrl(
  candidateId: number,
  request: CreateResumeUploadUrlRequest,
  signal?: AbortSignal,
): Promise<CreateResumeUploadUrlResponse> {
  try {
    return await resumeApiPost<CreateResumeUploadUrlResponse>(
      `/api/candidates/${candidateId}/resume/upload-url`,
      request,
      signal,
    )
  } catch {
    throw new Error("Unable to prepare the resume upload.")
  }
}

export async function uploadResumeToS3(
  uploadUrl: string,
  requiredHeaders: Record<string, string>,
  file: File,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: requiredHeaders,
    body: file,
    signal,
  })

  if (!response.ok) {
    throw new Error("The resume could not be uploaded to storage.")
  }
}

export async function confirmCandidateResumeUpload(
  candidateId: number,
  request: ConfirmCandidateResumeRequest,
  signal?: AbortSignal,
): Promise<CandidateResumeMetadata> {
  try {
    return await resumeApiPost<CandidateResumeMetadata>(
      `/api/candidates/${candidateId}/resume/confirm`,
      request,
      signal,
    )
  } catch {
    throw new Error(
      "The resume was uploaded, but it could not be attached to the candidate.",
    )
  }
}

export async function getCandidateResumeOpenUrl(
  candidateId: number,
  signal?: AbortSignal,
): Promise<CandidateResumeOpenUrlResponse> {
  try {
    return await resumeApiGet<CandidateResumeOpenUrlResponse>(
      `/api/candidates/${candidateId}/resume/open-url`,
      signal,
    )
  } catch {
    throw new Error("Unable to open the resume.")
  }
}

export async function uploadCandidateResume({
  candidateId,
  file,
  signal,
  onStageChange,
}: {
  candidateId: number
  file: File
  signal?: AbortSignal
  onStageChange?: (stage: ResumeUploadStage) => void
}): Promise<CandidateResumeMetadata> {
  const validation = validateResumeFile(file)

  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  onStageChange?.("requestingUploadUrl")

  const authorization = await createCandidateResumeUploadUrl(
    candidateId,
    {
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
    },
    signal,
  )

  onStageChange?.("uploadingToS3")

  await uploadResumeToS3(
    authorization.uploadUrl,
    authorization.requiredHeaders,
    file,
    signal,
  )

  onStageChange?.("confirmingUpload")

  const metadata = await confirmCandidateResumeUpload(
    candidateId,
    {
      objectKey: authorization.objectKey,
      originalFileName: file.name,
      contentType: file.type,
      expectedFileSizeBytes: file.size,
    },
    signal,
  )

  onStageChange?.("completed")

  return metadata
}
