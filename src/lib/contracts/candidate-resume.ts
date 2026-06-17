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

export type ResumeUploadStage =
  | "requestingUploadUrl"
  | "uploadingToS3"
  | "confirmingUpload"
  | "completed"

export interface PendingResumeRetry {
  candidateId: number
  candidateName: string
  file: File
}

export type CandidateCreateSubmitResult =
  | { status: "success" }
  | {
      status: "resume-upload-failed"
      candidateId: number
      candidateName: string
      file: File
      error: string
    }

export interface CandidateSubmitOptions {
  verificationState?: {
    verifiedFields: Set<string>
    modifiedFields: Set<string>
  }
  resumeFile?: File | null
  onResumeStageChange?: (stage: ResumeUploadStage) => void
}
