"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  changePassword as changePasswordApi,
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
} from "@/lib/services/auth-api"
import {
  clearAuthSession,
  getStoredUser,
  hasAuthSession,
  saveAuthSession,
} from "@/lib/auth/auth-storage"
import type { AuthUser, CurrentUser } from "@/lib/types/auth"

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const refreshUser = React.useCallback(async () => {
    if (!hasAuthSession()) {
      clearAuthSession()
      setUser(null)
      return
    }
    try {
      const me = await getCurrentUser()
      setUser({ id: me.id, fullName: me.fullName, email: me.email })
    } catch {
      clearAuthSession()
      setUser(null)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = getStoredUser()
      if (!hasAuthSession()) {
        clearAuthSession()
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }
      if (stored && !cancelled) setUser(stored)
      try {
        const me = await getCurrentUser()
        if (!cancelled) {
          setUser({ id: me.id, fullName: me.fullName, email: me.email })
        }
      } catch {
        if (!cancelled) {
          clearAuthSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password)
    saveAuthSession(res.accessToken, res.expiresAt, res.user)
    setUser(res.user)
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      /* offline — still clear client */
    }
    clearAuthSession()
    setUser(null)
  }, [])

  const changePassword = React.useCallback(
    async (currentPassword: string, newPassword: string) => {
      await changePasswordApi(currentPassword, newPassword)
    },
    [],
  )

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user != null && hasAuthSession(),
    login,
    logout,
    changePassword,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/** Redirect to login when there is no valid session (dashboard shell). */
export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()

  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
