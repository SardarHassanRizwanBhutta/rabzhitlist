import type { UserRole } from "@/lib/types/user-role"

export type AuthUser = {
  id: number
  fullName: string
  email: string
  role: UserRole
}

export type LoginResponse = {
  accessToken: string
  expiresAt: string
  user: AuthUser
}

export type CurrentUser = AuthUser & {
  createdAt: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordResponse = {
  message: string
}
