import { NextRequest, NextResponse } from "next/server"
import {
  CALL_NOTES_EXTRACT_MAX_NOTES_LENGTH,
  CALL_NOTES_EXTRACT_TIMEOUT_MS,
  questionsApiBaseUrl,
} from "@/lib/config/call-notes-extract"
import { isCallNotesExtractApiFieldAllowed } from "@/lib/utils/question-field-allowlist"
import { callNotesExtractRequestSchema } from "@/types/call-notes-extraction"

function validateBusinessRules(body: {
  rawNotes: string
  allowedEmptyFields: Array<{ fieldPath: string; apiFieldName: string }>
}): string | null {
  if (!body.rawNotes.trim()) {
    return "rawNotes must not be empty or whitespace-only."
  }
  if (body.rawNotes.length > CALL_NOTES_EXTRACT_MAX_NOTES_LENGTH) {
    return `rawNotes exceeds maximum length (${CALL_NOTES_EXTRACT_MAX_NOTES_LENGTH}).`
  }

  const paths = new Set<string>()
  for (const field of body.allowedEmptyFields) {
    if (paths.has(field.fieldPath)) {
      return `Duplicate fieldPath: ${field.fieldPath}`
    }
    paths.add(field.fieldPath)
    if (!isCallNotesExtractApiFieldAllowed(field.apiFieldName)) {
      return `apiFieldName not allowed for extract: ${field.apiFieldName}`
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const json: unknown = await request.json()
    const parsed = callNotesExtractRequestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", detail: parsed.error.message },
        { status: 400 },
      )
    }

    const businessError = validateBusinessRules(parsed.data)
    if (businessError) {
      return NextResponse.json({ error: businessError }, { status: 400 })
    }

    const base = questionsApiBaseUrl()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), CALL_NOTES_EXTRACT_TIMEOUT_MS)

    let upstream: Response
    try {
      upstream = await fetch(`${base}/api/call-notes/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      })
    } catch (err) {
      const cause =
        err instanceof Error && "cause" in err && err.cause instanceof Error
          ? err.cause.message
          : null
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Call notes extract timed out."
          : err instanceof Error
            ? cause
              ? `${err.message} (${cause})`
              : err.message
            : "Failed to reach call notes extract service."
      console.error("call-notes/extract upstream fetch failed:", base, err)
      return NextResponse.json({ error: message }, { status: 502 })
    } finally {
      clearTimeout(timeout)
    }

    const text = await upstream.text()
    if (!upstream.ok) {
      const status = upstream.status >= 500 ? 502 : upstream.status
      try {
        const errBody = JSON.parse(text) as Record<string, unknown>
        return NextResponse.json(errBody, { status })
      } catch {
        return NextResponse.json(
          {
            error: `Call notes extract service returned ${upstream.status}`,
            detail: text.slice(0, 2000),
          },
          { status },
        )
      }
    }

    try {
      const data = JSON.parse(text) as unknown
      return NextResponse.json(data)
    } catch {
      return NextResponse.json(
        { error: "Call notes extract service did not return valid JSON." },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error("call-notes/extract proxy:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process call notes extract request.",
      },
      { status: 500 },
    )
  }
}
