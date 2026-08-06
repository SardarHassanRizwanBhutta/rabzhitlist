/**
 * Browser client for Call Notes Extract (same-origin proxy only).
 * @see docs/CALL_NOTES_EXTRACT_API_CONTRACT.md
 */

import type {
  CallNotesExtractRequest,
  CallNotesExtractResponse,
} from "@/types/call-notes-extraction"
import { callNotesExtractResponseSchema } from "@/types/call-notes-extraction"
import { extractApiErrorMessage } from "@/lib/utils/api-error-message"

const EXTRACT_PROXY_PATH = "/api/call-notes/extract"

export async function extractCallNotes(
  request: CallNotesExtractRequest,
  signal?: AbortSignal,
): Promise<CallNotesExtractResponse> {
  const response = await fetch(EXTRACT_PROXY_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(extractApiErrorMessage(text, response.status))
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    throw new Error("Call notes extract returned invalid JSON.")
  }

  const result = callNotesExtractResponseSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error("Call notes extract returned an unexpected response shape.")
  }

  return result.data
}
