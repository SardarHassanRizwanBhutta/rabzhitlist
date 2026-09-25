import { canAccessUsersAdmin } from "@/lib/auth/roles"
import { UserRole, type UserRole as UserRoleType } from "@/lib/types/user-role"

/**
 * Whether the signed-in viewer may call GET /api/users/{id}/contributions for a target
 * that appears in GET /api/users list scope (Option A).
 */
export function canViewContributionsForTarget(
  viewerRole: UserRoleType | null | undefined,
  targetRole: UserRoleType,
): boolean {
  if (!canAccessUsersAdmin(viewerRole)) return false
  if (targetRole === UserRole.SuperAdmin) return false
  if (viewerRole === UserRole.Admin) return targetRole === UserRole.Recruiter
  if (viewerRole === UserRole.SuperAdmin) {
    return targetRole === UserRole.Admin || targetRole === UserRole.Recruiter
  }
  return false
}
