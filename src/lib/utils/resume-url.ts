/**
 * Static placeholder resume for Cold Caller preview until candidate resume upload is implemented.
 * Served from `public/resumes/`.
 */
export const PLACEHOLDER_RESUME_URL = "/resumes/CV_Muhammad-Hassan-Qureshi.pdf"

/** Resolve resume URL for inline viewing: candidate profile URL, else placeholder. */
export function resolveResumeUrlForViewer(
  candidateResume: string | null | undefined,
): string {
  const trimmed = candidateResume?.trim()
  return trimmed || PLACEHOLDER_RESUME_URL
}

export function isPlaceholderResumeUrl(resumeUrl: string | null | undefined): boolean {
  if (!resumeUrl?.trim()) return true
  const normalized = resumeUrl.split("#")[0]?.split("?")[0] ?? resumeUrl
  return normalized === PLACEHOLDER_RESUME_URL || normalized.endsWith(PLACEHOLDER_RESUME_URL)
}

/** Extract display filename from a resume URL or path. */
export function getResumeFileName(resumeUrl: string | null | undefined): string | null {  if (!resumeUrl?.trim()) return null
  try {
    const pathname = new URL(resumeUrl, "https://placeholder.local").pathname
    const name = pathname.split("/").filter(Boolean).pop()
    return name ? decodeURIComponent(name) : resumeUrl.trim()
  } catch {
    const name = resumeUrl.split(/[/\\]/).filter(Boolean).pop()
    return name ? decodeURIComponent(name) : resumeUrl.trim()
  }
}

/** Whether the resume URL likely points to a PDF (inline preview supported). */
export function isPdfResume(resumeUrl: string | null | undefined): boolean {
  if (!resumeUrl?.trim()) return false
  const withoutQuery = resumeUrl.split("?")[0]?.split("#")[0] ?? resumeUrl
  return /\.pdf$/i.test(withoutQuery.trim())
}

export function buildPdfViewerUrl(resumeUrl: string, page: number): string {
  const base = resumeUrl.split("#")[0] ?? resumeUrl
  const safePage = Math.max(1, page)
  return `${base}#page=${safePage}`
}
