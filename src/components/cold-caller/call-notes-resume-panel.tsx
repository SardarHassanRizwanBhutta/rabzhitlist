"use client"

import { useEffect, useState } from "react"
import {
  ChevronsLeft,
  Download,
  ExternalLink,
  FileText,
  FileWarning,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buildPdfViewerUrl } from "@/lib/utils/resume-url"
import { getCandidateResumeOpenUrl } from "@/lib/services/candidate-resume-api"
import { openUrlInNewTabAfterFetch } from "@/lib/utils/open-url-in-new-tab"

function isPdfResume(contentType?: string | null, fileName?: string | null): boolean {
  if (contentType === "application/pdf") return true
  if (fileName?.trim()) return /\.pdf$/i.test(fileName.trim())
  return false
}

interface CallNotesResumePanelProps {
  candidateId: string
  hasResume?: boolean
  resumeFileName?: string | null
  resumeContentType?: string | null
  onCollapse?: () => void
  className?: string
}

export function CallNotesResumePanel({
  candidateId,
  hasResume = false,
  resumeFileName,
  resumeContentType,
  onCollapse,
  className,
}: CallNotesResumePanelProps) {
  const numericCandidateId = Number(candidateId)
  const isPdf = isPdfResume(resumeContentType, resumeFileName)

  const [openUrl, setOpenUrl] = useState<string | null>(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    setIframeLoaded(false)
  }, [candidateId])

  useEffect(() => {
    if (!hasResume || !Number.isFinite(numericCandidateId)) {
      setOpenUrl(null)
      setLoadError(null)
      return
    }

    let cancelled = false
    const controller = new AbortController()

    const loadUrl = async () => {
      setIsLoadingUrl(true)
      setLoadError(null)
      setOpenUrl(null)
      setIframeLoaded(false)

      try {
        const response = await getCandidateResumeOpenUrl(
          numericCandidateId,
          controller.signal,
        )
        if (!cancelled) {
          setOpenUrl(response.url)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load resume preview.",
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUrl(false)
        }
      }
    }

    void loadUrl()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [hasResume, numericCandidateId, candidateId])

  const pdfSrc = openUrl && isPdf ? buildPdfViewerUrl(openUrl, 1) : null

  const openResumeFresh = async () => {
    if (!Number.isFinite(numericCandidateId)) return
    try {
      await openUrlInNewTabAfterFetch(async () => {
        const response = await getCandidateResumeOpenUrl(numericCandidateId)
        return response.url
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open the resume.",
      )
    }
  }

  const downloadResumeFresh = async () => {
    if (!Number.isFinite(numericCandidateId)) return
    try {
      const response = await getCandidateResumeOpenUrl(numericCandidateId)
      const link = document.createElement("a")
      link.href = response.url
      link.download = response.fileName || resumeFileName || "resume"
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to download the resume.",
      )
    }
  }

  return (
    <aside
      className={cn(
        "flex flex-col min-h-0 h-full border-r border-border bg-muted/20",
        className,
      )}
      aria-label="Candidate resume"
    >
      <div className="shrink-0 border-b border-border bg-muted/40 px-2 py-2 space-y-1">
        <div className="flex items-center gap-1 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate flex-1">
            Resume
          </span>
          {onCollapse && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onCollapse}
              title="Hide resume panel"
              aria-label="Hide resume panel"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {resumeFileName && (
          <p className="text-[11px] text-muted-foreground truncate px-0.5" title={resumeFileName}>
            {resumeFileName}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-muted/10">
        {!hasResume ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <FileWarning className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-medium">No resume attached</p>
              <p className="text-xs text-muted-foreground max-w-[14rem]">
                Upload a resume in the candidate profile to preview it here during the call.
              </p>
            </div>
          </div>
        ) : isLoadingUrl ? (
          <div className="flex flex-col items-center justify-center h-full p-6 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
            <span className="text-xs text-muted-foreground">Loading resume…</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <FileWarning className="h-10 w-10 text-destructive/70" aria-hidden />
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void openResumeFresh()}>
              Open Resume
            </Button>
          </div>
        ) : !isPdf ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
            <FileText className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-medium">{resumeFileName ?? "Resume on file"}</p>
              <p className="text-xs text-muted-foreground max-w-[14rem]">
                Inline preview is available for PDF files only. Open or download this file to
                review it.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void openResumeFresh()} className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void downloadResumeFresh()} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                <span className="text-xs text-muted-foreground">Loading resume…</span>
              </div>
            )}
            <iframe
              key={pdfSrc ?? "resume"}
              src={pdfSrc ?? undefined}
              title={resumeFileName ? `Resume: ${resumeFileName}` : "Candidate resume"}
              className="h-full w-full border-0 bg-background"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
