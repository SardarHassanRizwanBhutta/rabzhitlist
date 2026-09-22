import { clearAuthSession } from "@/lib/auth/auth-storage"

let redirecting = false

/** Full navigation to login (clears in-memory state). */
export function redirectToLogin(reason?: "session_expired"): void {
  if (typeof window === "undefined") return
  if (window.location.pathname.startsWith("/login")) return
  if (redirecting) return
  redirecting = true
  clearAuthSession()
  const q = reason ? `?reason=${encodeURIComponent(reason)}` : ""
  window.location.href = `/login${q}`
}
