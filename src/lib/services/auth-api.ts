import { apiFetch, apiGet, apiPost } from "@/lib/api-client"
import { apiHttpErrorFromResponse, extractApiErrorMessage } from "@/lib/utils/api-error-message"
import { mapUserContributionsDto } from "@/lib/services/users-api"
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CurrentUser,
  LoginRequest,
  LoginResponse,
} from "@/lib/types/auth"
import type { UserContributions } from "@/lib/types/user-contributions"

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

export async function fetchMyContributions(): Promise<UserContributions> {
  const response = await apiFetch("/api/auth/me/contributions")
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    const text = await response.text()
    throw apiHttpErrorFromResponse(text, response.status)
  }
  const payload = (await response.json()) as Record<string, unknown>
  return mapUserContributionsDto(payload)
}
