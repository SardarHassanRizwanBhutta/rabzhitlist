import { NextRequest, NextResponse } from "next/server"

/**
 * Same URL rules as the browser client: prefer `NEXT_PUBLIC_PARSER_API_URL`, then legacy
 * `RESUME_PARSER_URL`. Base may include a path prefix (e.g. `https://host/parser`).
 * The proxy POSTs multipart field `resume` per API_DOCUMENTATION.md.
 */
function resumeParserParseUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_PARSER_API_URL ?? process.env.RESUME_PARSER_URL)?.trim()
  if (!raw) return null
  const base = raw.replace(/\/$/, "")
  if (base.includes("/api/parse-resume")) return base
  return `${base}/api/parse-resume`
}

export async function POST(request: NextRequest) {
  const upstream = resumeParserParseUrl()
  if (!upstream) {
    return NextResponse.json(
      {
        error:
          "Resume parser URL is not configured. Set NEXT_PUBLIC_PARSER_API_URL (or legacy RESUME_PARSER_URL) on the server.",
      },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("resume") ?? formData.get("file")
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Expected multipart field `resume` (or legacy `file`) with a resume upload." },
        { status: 400 }
      )
    }

    const outgoing = new FormData()
    outgoing.append("resume", file, file instanceof File ? file.name : "resume.pdf")

    const response = await fetch(upstream, {
      method: "POST",
      body: outgoing,
    })

    const text = await response.text()
    if (!response.ok) {
      const status = response.status >= 500 ? 502 : response.status
      try {
        const errBody = JSON.parse(text) as Record<string, unknown>
        return NextResponse.json(errBody, { status })
      } catch {
        return NextResponse.json(
          { success: false, error: `Resume parser returned ${response.status}`, detail: text.slice(0, 2000) },
          { status }
        )
      }
    }

    try {
      const data = JSON.parse(text) as unknown
      return NextResponse.json(data)
    } catch {
      return NextResponse.json(
        { error: "Resume parser did not return valid JSON.", detail: text.slice(0, 500) },
        { status: 502 }
      )
    }
  } catch (e) {
    console.error("resume-parse proxy:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to reach resume parser" },
      { status: 502 }
    )
  }
}
