import type { AuthUser, CurrentUser } from "@/lib/types/auth"
import { parseUserRole } from "@/lib/types/user-role"

export function mapApiUserToAuthUser(raw: {
  id: number
  fullName: string
  email: string
  role?: unknown
}): AuthUser | null {
  const role = parseUserRole(raw.role)
  if (role == null) return null
  return {
    id: raw.id,
    fullName: raw.fullName,
    email: raw.email,
    role,
  }
}

export function mapCurrentUserToAuthUser(me: CurrentUser): AuthUser | null {
  return mapApiUserToAuthUser(me)
}
