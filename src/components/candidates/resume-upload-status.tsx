"use client"

import type { ResumeUploadStage } from "@/lib/contracts/candidate-resume"
import {
  RESUME_UPLOAD_STAGE_LABELS,
} from "@/lib/utils/candidate-resume"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ResumeUploadStatusProps {
  stage: ResumeUploadStage | null
  creatingCandidate?: boolean
  className?: string
}

export function ResumeUploadStatus({
  stage,
  creatingCandidate = false,
  className,
}: ResumeUploadStatusProps) {
  const message = creatingCandidate
    ? "Creating candidate…"
    : stage
      ? RESUME_UPLOAD_STAGE_LABELS[stage]
      : null

  if (!message) return null

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  )
}
