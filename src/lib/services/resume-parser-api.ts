/**
 * Browser posts to same-origin `/api/resume-parse`; the Next route proxies to
 * `NEXT_PUBLIC_PARSER_API_URL` (or `RESUME_PARSER_URL`; dev default `http://127.0.0.1:5000`)
 * server-side so CORS is not required on the parser.
 * Multipart field name is `resume` (see API_DOCUMENTATION.md / Flask API).
 */

const RESUME_PARSE_PROXY_PATH = "/api/resume-parse"

/** One certification row inside `openai_parsed.certifications` (Flask / LLM schema). */
export interface ResumeParsedCertification {
  certification_name: string | null
  issue_date: string | null
  expiry_date: string | null
  certification_url: string | null
  issuing_body: string | null
  issuing_body_url: string | null
  certification_level: string | null
}

/** Top-level keys under `openai_parsed` (subset used by the app). */
export interface ResumeOpenAiParsed {
  basic_information?: Record<string, unknown>
  technical_skills?: string[]
  work_experience?: unknown[]
  standalone_projects?: unknown[]
  education?: unknown[]
  certifications?: ResumeParsedCertification[]
  achievements?: unknown[]
}

/** Successful Flask parse body (see docs/API_DOCUMENTATION.md). */
export interface ResumeParseSuccessBody {
  success?: boolean
  openai_parsed?: ResumeOpenAiParsed
  openai_error?: string | null
  error?: string
  message?: string
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Returns the structured resume object (`openai_parsed` when present). */
export function unwrapResumeParsedRoot(raw: unknown): Record<string, unknown> | null {
  const rootOuter = asRecord(raw)
  const unwrapped = rootOuter?.openai_parsed != null ? rootOuter.openai_parsed : raw
  return asRecord(unwrapped)
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
