/**
 * Browser client for Call Notes Extract.
 * Calls the QG service directly (same path as generate-questions) so hosted
 * deployments (e.g. Amplify) are not blocked by server-side outbound fetch.
 * @see docs/CALL_NOTES_EXTRACT_API_CONTRACT.md
 */

import type {
  CallNotesExtractRequest,
  CallNotesExtractResponse,
} from "@/types/call-notes-extraction"
import { callNotesExtractResponseSchema } from "@/types/call-notes-extraction"
import { extractApiErrorMessage } from "@/lib/utils/api-error-message"
import { getQuestionsApiBaseUrl } from "@/lib/services/questions-api"

export async function extractCallNotes(
  request: CallNotesExtractRequest,
  signal?: AbortSignal,
): Promise<CallNotesExtractResponse> {
  const response = await fetch(`${getQuestionsApiBaseUrl()}/api/call-notes/extract`, {
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
