import type { AuthUser } from "@/lib/types/auth"

const TOKEN_KEY = "rabzhitlist.accessToken"
const EXPIRES_KEY = "rabzhitlist.expiresAt"
const USER_KEY = "rabzhitlist.user"

function canUseStorage(): boolean {
  return typeof window !== "undefined"
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getExpiresAt(): string | null {
  if (!canUseStorage()) return null
  return localStorage.getItem(EXPIRES_KEY)
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage()) return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function isAccessTokenExpired(): boolean {
  const expiresAt = getExpiresAt()
  if (!expiresAt) return true
  const ms = Date.parse(expiresAt)
  if (Number.isNaN(ms)) return true
  return Date.now() >= ms
}

export function saveAuthSession(accessToken: string, expiresAt: string, user: AuthUser): void {
  if (!canUseStorage()) return
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(EXPIRES_KEY, expiresAt)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession(): void {
  if (!canUseStorage()) return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_KEY)
  localStorage.removeItem(USER_KEY)
}

export function hasAuthSession(): boolean {
  const token = getAccessToken()
  if (!token) return false
  return !isAccessTokenExpired()
}
