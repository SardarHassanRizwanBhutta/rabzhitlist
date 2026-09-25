"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  canAccessDashboard,
  canAccessUsersAdmin,
  defaultHomePathForRole,
  isRecruiter,
} from "@/lib/auth/roles"

const RECRUITER_BLOCKED_PATHS = new Set(["/"])

function isRecruiterBlockedPath(pathname: string): boolean {
  if (RECRUITER_BLOCKED_PATHS.has(pathname)) return true
  if (pathname === "/users" || pathname.startsWith("/users/")) return true
  return false
}

/** Redirect Recruiter away from dashboard and users admin. */
export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated } = useAuth()

  React.useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return
    if (!isRecruiter(user.role)) return
    if (isRecruiterBlockedPath(pathname)) {
      router.replace(defaultHomePathForRole(user.role))
    }
  }, [isLoading, isAuthenticated, user, pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (user && isRecruiter(user.role) && isRecruiterBlockedPath(pathname)) {
    return null
  }

  return <>{children}</>
}

export function useNavigationAccess() {
  const { user } = useAuth()
  const role = user?.role

  function canShowNavItem(url: string): boolean {
    if (url === "/users") return canAccessUsersAdmin(role)
    if (url === "/") return canAccessDashboard(role)
    return true
  }

  return { canShowNavItem, role }
}
