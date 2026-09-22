/** Application user row (admin Users page — not session `AuthUser`). */
export type AppUser = {
  id: number
  fullName: string
  email: string
  /** ISO 8601 UTC from API */
  createdAt: string
}
