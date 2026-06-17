/** Extract display filename from a resume URL or path. */
export function getResumeFileName(resumeUrl: string | null | undefined): string | null {
  if (!resumeUrl?.trim()) return null
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
