/** First + last word initials, matching sidebar user menu. */
export function userInitials(fullName: string, email: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase()
  }
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function userProfilePreviewStorageKey(userId: number): string {
  return `users-profile-preview:${userId}`
}

import type { UserRole } from "@/lib/types/user-role"
import { parseUserRole } from "@/lib/types/user-role"

export type UserProfilePreview = {
  fullName: string
  email: string
  role: UserRole
}

export function readUserProfilePreview(userId: number): UserProfilePreview | null {
  if (typeof sessionStorage === "undefined") return null
  try {
    const raw = sessionStorage.getItem(userProfilePreviewStorageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserProfilePreview
    if (typeof parsed.fullName !== "string" || typeof parsed.email !== "string") return null
    const role = parseUserRole(parsed.role)
    if (role == null) return null
    return { fullName: parsed.fullName, email: parsed.email, role }
  } catch {
    return null
  }
}

export function writeUserProfilePreview(userId: number, preview: UserProfilePreview): void {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.setItem(userProfilePreviewStorageKey(userId), JSON.stringify(preview))
}
