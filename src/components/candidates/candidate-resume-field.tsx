"use client"

import { format } from "date-fns"
import type { Candidate } from "@/lib/types/candidate"
import { formatResumeFileSize } from "@/lib/utils/candidate-resume"
import { ResumeOpenButton } from "@/components/candidates/resume-open-button"

interface CandidateResumeFieldProps {
  candidate: Pick<
    Candidate,
    | "id"
    | "hasResume"
    | "resumeFileName"
    | "resumeContentType"
    | "resumeFileSizeBytes"
    | "resumeUploadedAt"
  >
  className?: string
}

export function CandidateResumeField({ candidate, className }: CandidateResumeFieldProps) {
  const candidateId = Number(candidate.id)

  if (!candidate.hasResume) {
    return (
      <div className={className}>
        <span className="text-sm font-medium text-muted-foreground block mb-0.5">Resume</span>
        <span className="text-sm text-muted-foreground italic">No resume attached</span>
      </div>
    )
  }

  const uploadedLabel =
    candidate.resumeUploadedAt &&
    !Number.isNaN(new Date(candidate.resumeUploadedAt).getTime())
      ? format(new Date(candidate.resumeUploadedAt), "MMM d, yyyy")
      : null

  return (
    <div className={className}>
      <span className="text-sm font-medium text-muted-foreground block mb-0.5">Resume</span>
      <p className="text-sm font-medium truncate" title={candidate.resumeFileName ?? undefined}>
        {candidate.resumeFileName ?? "Resume on file"}
      </p>
      {(candidate.resumeFileSizeBytes != null || uploadedLabel) && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {candidate.resumeFileSizeBytes != null
            ? formatResumeFileSize(candidate.resumeFileSizeBytes)
            : null}
          {candidate.resumeFileSizeBytes != null && uploadedLabel ? " · " : null}
          {uploadedLabel ? `Uploaded ${uploadedLabel}` : null}
        </p>
      )}
      {Number.isFinite(candidateId) && (
        <div className="mt-2">
          <ResumeOpenButton
            candidateId={candidateId}
            fileName={candidate.resumeFileName}
            contentType={candidate.resumeContentType}
            variant="button"
          />
        </div>
      )}
    </div>
  )
}
