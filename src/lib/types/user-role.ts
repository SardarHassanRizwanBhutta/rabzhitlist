export const UserRole = {
  SuperAdmin: 0,
  Admin: 1,
  Recruiter: 2,
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export function parseUserRole(value: unknown): UserRole | null {
  if (value === UserRole.SuperAdmin || value === UserRole.Admin || value === UserRole.Recruiter) {
    return value
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 2) {
    return value as UserRole
  }
  if (typeof value === "string") {
    const n = Number(value)
    if (Number.isInteger(n) && n >= 0 && n <= 2) return n as UserRole
  }
  return null
}

export function userRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.SuperAdmin:
      return "Super Admin"
    case UserRole.Admin:
      return "Admin"
    case UserRole.Recruiter:
      return "Recruiter"
    default:
      return "Unknown"
  }
}
