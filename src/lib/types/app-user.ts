/** Application user row (admin Users page — not session `AuthUser`). */
import type { UserRole } from "@/lib/types/user-role"

export type AppUser = {
  id: number
  fullName: string
  email: string
  role: UserRole
  /** ISO 8601 UTC from API */
  createdAt: string
}
