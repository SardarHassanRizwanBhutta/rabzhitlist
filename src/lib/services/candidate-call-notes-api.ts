/**
 * Candidate call-notes API — dedicated GET/PATCH (not on main candidate DTO).
 * @see docs/CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md
 */

import { apiFetch } from "@/lib/api-client"
import { extractApiErrorMessage } from "@/lib/utils/api-error-message"

export interface CandidateCallNotesDto {
  call_notes: string | null
}

function callNotesPath(candidateId: number): string {
  return `/api/candidates/${candidateId}/call-notes`
}

export async function fetchCandidateCallNotes(
  candidateId: number,
  signal?: AbortSignal,
): Promise<CandidateCallNotesDto> {
  const path = callNotesPath(candidateId)
  const res = await apiFetch(path, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  return res.json() as Promise<CandidateCallNotesDto>
}

export async function patchCandidateCallNotes(
  candidateId: number,
  call_notes: string,
): Promise<CandidateCallNotesDto> {
  const path = callNotesPath(candidateId)
  const res = await apiFetch(path, {
    method: "PATCH",
    body: JSON.stringify({ call_notes }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  return res.json() as Promise<CandidateCallNotesDto>
}
