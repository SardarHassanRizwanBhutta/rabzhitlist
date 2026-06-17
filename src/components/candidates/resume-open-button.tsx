"use client"

import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getCandidateResumeOpenUrl } from "@/lib/services/candidate-resume-api"
import { openUrlInNewTabAfterFetch } from "@/lib/utils/open-url-in-new-tab"
import { cn } from "@/lib/utils"

export interface ResumeOpenButtonProps {
  candidateId: number
  fileName?: string | null
  contentType?: string | null
  variant?: "icon" | "button"
  /** When false, renders a muted disabled icon (consistent table action slots). Default true. */
  hasResume?: boolean
  className?: string
}

export function ResumeOpenButton({
  candidateId,
  fileName,
  variant = "icon",
  hasResume = true,
  className,
}: ResumeOpenButtonProps) {
  const [isOpening, setIsOpening] = useState(false)
  const canOpen = hasResume && Number.isFinite(candidateId)
  const openLabel = fileName?.trim() ? `Open ${fileName}` : "Open resume"
  const disabledLabel = "No resume attached"
  const label = canOpen ? openLabel : disabledLabel

  const handleOpenResume = async () => {
    if (!canOpen || isOpening) return

    try {
      setIsOpening(true)
      await openUrlInNewTabAfterFetch(async () => {
        const response = await getCandidateResumeOpenUrl(candidateId)
        return response.url
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open the resume.",
      )
    } finally {
      setIsOpening(false)
    }
  }

  if (variant === "button") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn("gap-1.5", className)}
        onClick={handleOpenResume}
        disabled={!canOpen || isOpening}
        aria-label={label}
      >
        {isOpening ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileText className="h-4 w-4" aria-hidden />
        )}
        Open Resume
      </Button>
    )
  }

  const iconButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8",
        !canOpen &&
          "text-muted-foreground/40 bg-muted/40 cursor-not-allowed opacity-60 hover:bg-muted/40",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        void handleOpenResume()
      }}
      disabled={!canOpen || isOpening}
      aria-label={label}
    >
      {isOpening ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <FileText className="h-4 w-4" aria-hidden />
      )}
    </Button>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {canOpen ? (
            iconButton
          ) : (
            <span className="inline-flex shrink-0">{iconButton}</span>
          )}
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{canOpen ? openLabel : disabledLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
