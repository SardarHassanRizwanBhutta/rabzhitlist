/**
 * Browser posts to same-origin `/api/resume-parse`; the Next route proxies to
 * `NEXT_PUBLIC_PARSER_API_URL` (or `RESUME_PARSER_URL`) server-side so CORS is not required on the parser.
 * Multipart field name is `resume` (see API_DOCUMENTATION.md / Flask API).
 */

const RESUME_PARSE_PROXY_PATH = "/api/resume-parse"

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Throws if the Flask parser returned a JSON error body (including HTTP 200 + success: false). */
export function assertFlaskResumeParseResponse(data: unknown): void {
  const r = asRecord(data)
  if (!r) return
  if (r.success === false) {
    const msg =
      typeof r.error === "string"
        ? r.error
        : typeof r.message === "string"
          ? r.message
          : "Resume parse failed"
    throw new Error(msg)
  }
  if (r.openai_error != null && String(r.openai_error).trim() !== "") {
    throw new Error(String(r.openai_error))
  }
}

export async function parseResume(file: File): Promise<unknown> {
  const formData = new FormData()
  formData.append("resume", file)

  const res = await fetch(RESUME_PARSE_PROXY_PATH, {
    method: "POST",
    body: formData,
  })

  const text = await res.text()
  if (!res.ok) {
    let message = text
    try {
      const j = JSON.parse(text) as { error?: string; detail?: string; message?: string; max_size_bytes?: number }
      message = [j.error, j.message, j.detail].filter(Boolean).join(" — ") || text
      if (res.status === 413 && j.max_size_bytes != null) {
        message = `${message} (max ${j.max_size_bytes} bytes)`
      }
    } catch {
      // use raw text
    }
    if (!message.trim()) {
      message = "Failed to parse resume"
    }
    throw new Error(message)
  }

  let data: unknown
  try {
    data = JSON.parse(text) as unknown
  } catch {
    throw new Error("Resume parser did not return valid JSON.")
  }
  assertFlaskResumeParseResponse(data)
  return data
}
