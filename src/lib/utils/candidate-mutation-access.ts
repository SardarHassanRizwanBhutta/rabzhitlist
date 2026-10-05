import { canMutateCandidate, isRecruiter } from "@/lib/auth/roles"
import type { Candidate } from "@/lib/types/candidate"
import type { UserRole } from "@/lib/types/user-role"

/** True when `candidate.createdBy.id` matches the signed-in user. */
export function isCandidateCreatedByUser(
  candidate: Pick<Candidate, "createdBy">,
  authUserId: number | undefined | null,
): boolean {
  if (authUserId == null || !Number.isInteger(authUserId) || authUserId <= 0) return false
  const ownerId = candidate.createdBy?.id
  return ownerId != null && ownerId === authUserId
}

/**
 * Admin/Super Admin may mutate any candidate. Recruiters may mutate only records they created.
 */
export function canMutateCandidateRecord(
  role: UserRole | undefined | null,
  candidate: Pick<Candidate, "createdBy">,
  authUserId: number | undefined | null,
): boolean {
  if (canMutateCandidate(role)) return true
  if (isRecruiter(role)) return isCandidateCreatedByUser(candidate, authUserId)
  return false
}
