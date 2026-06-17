export const MAX_RESUME_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const ALLOWED_RESUME_FILES = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const

export interface ResumeFileValidationResult {
  isValid: boolean
  error?: string
}

export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index >= 0 ? fileName.slice(index).toLowerCase() : ""
}

export function formatResumeFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateResumeFile(file: File): ResumeFileValidationResult {
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
    ALLOWED_RESUME_FILES[extension as keyof typeof ALLOWED_RESUME_FILES]

  if (file.type !== expectedContentType) {
    return {
      isValid: false,
      error: "The selected file type does not match its extension.",
    }
  }

  return { isValid: true }
}

export const RESUME_UPLOAD_STAGE_LABELS = {
  requestingUploadUrl: "Preparing upload…",
  uploadingToS3: "Uploading resume…",
  confirmingUpload: "Confirming resume…",
  completed: "Resume uploaded.",
} as const
