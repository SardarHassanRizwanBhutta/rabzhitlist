/**
 * Candidate call-notes API — dedicated GET/PATCH (not on main candidate DTO).
 * @see docs/CALL_NOTES_PERSISTENCE_FRONTEND_INTEGRATION.md
 */

import { API_BASE_URL } from "@/lib/config/api"
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
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_notes }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  return res.json() as Promise<CandidateCallNotesDto>
}
