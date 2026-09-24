"use client"

import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/lib/types/user-role"

export function useCurrentUser() {
  return useAuth().user
}

export function useUserRole(): UserRole | undefined {
  return useAuth().user?.role
}
