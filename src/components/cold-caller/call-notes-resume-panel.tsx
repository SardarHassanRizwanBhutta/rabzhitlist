"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  Download,
  ExternalLink,
  FileText,
  FileWarning,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  buildPdfViewerUrl,
  getResumeFileName,
  isPdfResume,
  isPlaceholderResumeUrl,
} from "@/lib/utils/resume-url"

const ZOOM_OPTIONS = [
  { value: "fit", label: "Fit width" },
  { value: "0.75", label: "75%" },
  { value: "1", label: "100%" },
  { value: "1.25", label: "125%" },
  { value: "1.5", label: "150%" },
] as const

type ZoomValue = (typeof ZOOM_OPTIONS)[number]["value"]

interface ResumeViewerState {
  page: number
  zoom: ZoomValue
}

function resumeStateKey(candidateId: string): string {
  return `cold-caller-resume-viewer:${candidateId}`
}

function readViewerState(candidateId: string): ResumeViewerState {
  if (typeof window === "undefined") return { page: 1, zoom: "fit" }
  try {
    const raw = sessionStorage.getItem(resumeStateKey(candidateId))
    if (!raw) return { page: 1, zoom: "fit" }
    const parsed = JSON.parse(raw) as Partial<ResumeViewerState>
    const zoom = ZOOM_OPTIONS.some((z) => z.value === parsed.zoom) ? parsed.zoom! : "fit"
    const page = typeof parsed.page === "number" && parsed.page >= 1 ? parsed.page : 1
    return { page, zoom: zoom as ZoomValue }
  } catch {
    return { page: 1, zoom: "fit" }
  }
}

function persistViewerState(candidateId: string, state: ResumeViewerState) {
  try {
    sessionStorage.setItem(resumeStateKey(candidateId), JSON.stringify(state))
  } catch {
    // ignore
  }
}

interface CallNotesResumePanelProps {
  resumeUrl: string | null | undefined
  candidateId: string
  onCollapse?: () => void
  className?: string
}

export function CallNotesResumePanel({
  resumeUrl,
  candidateId,
  onCollapse,
  className,
}: CallNotesResumePanelProps) {
  const fileName = useMemo(() => getResumeFileName(resumeUrl), [resumeUrl])
  const isPdf = useMemo(() => isPdfResume(resumeUrl), [resumeUrl])
  const hasResume = !!resumeUrl?.trim()
  const isPlaceholder = isPlaceholderResumeUrl(resumeUrl)

  const [viewerState, setViewerState] = useState<ResumeViewerState>(() =>
    readViewerState(candidateId),
  )
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    setViewerState(readViewerState(candidateId))
    setIframeLoaded(false)
  }, [candidateId, resumeUrl])

  const updateViewerState = useCallback(
    (patch: Partial<ResumeViewerState>) => {
      setViewerState((prev) => {
        const next = { ...prev, ...patch }
        persistViewerState(candidateId, next)
        return next
      })
      if (patch.page != null) setIframeLoaded(false)
    },
    [candidateId],
  )

  const pdfSrc = useMemo(() => {
    if (!resumeUrl?.trim() || !isPdf) return null
    return buildPdfViewerUrl(resumeUrl.trim(), viewerState.page)
  }, [resumeUrl, isPdf, viewerState.page])

  const zoomScale = viewerState.zoom === "fit" ? 1 : Number.parseFloat(viewerState.zoom)

  const handleOpen = () => {
    if (!resumeUrl?.trim()) return
    window.open(resumeUrl.trim(), "_blank", "noopener,noreferrer")
  }

  const handleDownload = () => {
    if (!resumeUrl?.trim()) return
    const link = document.createElement("a")
    link.href = resumeUrl.trim()
    link.download = fileName ?? "resume"
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <aside
      className={cn(
        "flex flex-col min-h-0 h-full border-r border-border bg-muted/20",
        className,
      )}
      aria-label="Candidate resume"
    >
      <div className="shrink-0 border-b border-border bg-muted/40 px-2 py-2 space-y-2">
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

        {hasResume && (
          <div className="flex flex-wrap items-center gap-1">
            {isPdf && (
              <>
                <div className="flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateViewerState({ page: Math.max(1, viewerState.page - 1) })}
                    disabled={viewerState.page <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-1 tabular-nums min-w-[4.5rem] text-center">
                    Page {viewerState.page}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateViewerState({ page: viewerState.page + 1 })}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Select
                  value={viewerState.zoom}
                  onValueChange={(v) => updateViewerState({ zoom: v as ZoomValue })}
                >
                  <SelectTrigger className="h-7 w-[5.5rem] text-xs px-2" aria-label="Zoom level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZOOM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleOpen}
              title="Open in new tab"
              aria-label="Open resume in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleDownload}
              title="Download resume"
              aria-label="Download resume"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {fileName && (
          <p className="text-[11px] text-muted-foreground truncate px-0.5" title={fileName}>
            {fileName}
            {isPlaceholder && (
              <span className="block text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                Sample resume for testing until profile upload is available
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-muted/10">
        {!hasResume ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
            <FileWarning className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-medium">No resume on file</p>
              <p className="text-xs text-muted-foreground max-w-[14rem]">
                Upload a resume in the candidate profile to preview it here during the call.
              </p>
            </div>
          </div>
        ) : !isPdf ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
            <FileText className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground max-w-[14rem]">
                Inline preview is available for PDF files only. Open or download this file to
                review it.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleOpen} className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative min-h-full w-full">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                <span className="text-xs text-muted-foreground">Loading resume…</span>
              </div>
            )}
            <div
              className={cn(
                "min-h-full w-full origin-top",
                viewerState.zoom === "fit" ? "scale-100" : "",
              )}
              style={
                viewerState.zoom === "fit"
                  ? undefined
                  : {
                      transform: `scale(${zoomScale})`,
                      transformOrigin: "top center",
                      width: `${100 / zoomScale}%`,
                    }
              }
            >
              <iframe
                key={pdfSrc ?? "resume"}
                src={pdfSrc ?? undefined}
                title={fileName ? `Resume: ${fileName}` : "Candidate resume"}
                className="w-full border-0 bg-background"
                style={{ minHeight: "120vh" }}
                onLoad={() => setIframeLoaded(true)}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
