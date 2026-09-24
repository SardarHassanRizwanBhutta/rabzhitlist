import { UserRole, type UserRole as UserRoleType } from "@/lib/types/user-role"

export function isSuperAdmin(role: UserRoleType | undefined | null): boolean {
  return role === UserRole.SuperAdmin
}

export function isAdmin(role: UserRoleType | undefined | null): boolean {
  return role === UserRole.Admin
}

export function isRecruiter(role: UserRoleType | undefined | null): boolean {
  return role === UserRole.Recruiter
}

export function isAdminOrAbove(role: UserRoleType | undefined | null): boolean {
  return role === UserRole.SuperAdmin || role === UserRole.Admin
}

export function canAccessUsersAdmin(role: UserRoleType | undefined | null): boolean {
  return isAdminOrAbove(role)
}

export function canAccessDashboard(role: UserRoleType | undefined | null): boolean {
  return isAdminOrAbove(role)
}

export function canMutateCandidate(role: UserRoleType | undefined | null): boolean {
  return isAdminOrAbove(role)
}

/** Salary / WE compensation fields in candidate UI and list filters. */
export function canUseCandidateSalaryUi(role: UserRoleType | undefined | null): boolean {
  return isAdminOrAbove(role)
}

export function assignableRolesForActor(actor: UserRoleType | undefined | null): UserRoleType[] {
  if (actor === UserRole.SuperAdmin) return [UserRole.Admin, UserRole.Recruiter]
  if (actor === UserRole.Admin) return [UserRole.Recruiter]
  return []
}

export function defaultHomePathForRole(role: UserRoleType | undefined | null): string {
  return isRecruiter(role) ? "/candidates" : "/"
}
