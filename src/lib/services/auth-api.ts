import { apiFetch, apiGet, apiPost } from "@/lib/api-client"
import { extractApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CurrentUser,
  LoginRequest,
  LoginResponse,
} from "@/lib/types/auth"

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body: LoginRequest = { email: email.trim(), password }
  return apiPost<LoginResponse>("/api/auth/login", body, undefined, {
    skipAuth: true,
    skipUnauthorizedHandler: true,
  })
}

export async function logout(): Promise<void> {
  const res = await apiFetch("/api/auth/logout", { method: "POST" })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiGet<CurrentUser>("/api/auth/me", undefined, {
    skipUnauthorizedHandler: true,
  })
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  const body: ChangePasswordRequest = { currentPassword, newPassword }
  return apiPost<ChangePasswordResponse>("/api/auth/change-password", body, undefined, {
    skipUnauthorizedHandler: true,
  })
}
