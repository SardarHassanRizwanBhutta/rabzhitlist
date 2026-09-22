import { API_BASE_URL } from "@/lib/config/api"
import { getAccessToken } from "@/lib/auth/auth-storage"
import { redirectToLogin } from "@/lib/auth/auth-session"
import { extractApiErrorMessage } from "@/lib/utils/api-error-message"

export type ApiFetchOptions = {
  /** Do not attach Bearer token (login, health). */
  skipAuth?: boolean
  /** Do not clear session / redirect on 401 (login, change-password validation, bootstrap /me). */
  skipUnauthorizedHandler?: boolean
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`
  const headers = new Headers(init.headers)

  if (!options.skipAuth) {
    const token = getAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  const hasBody = init.body != null && init.body !== ""
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(url, { ...init, headers })

  if (
    res.status === 401 &&
    !options.skipAuth &&
    !options.skipUnauthorizedHandler &&
    getAccessToken()
  ) {
    redirectToLogin("session_expired")
  }

  return res
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<T> {
  const res = await apiFetch(path, { ...init, method: "GET" }, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  return res.json() as Promise<T>
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<T> {
  const res = await apiFetch(
    path,
    {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : init?.body,
    },
    options,
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<T> {
  const res = await apiFetch(
    path,
    {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : init?.body,
    },
    options,
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<T> {
  const res = await apiFetch(
    path,
    {
      ...init,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : init?.body,
    },
    options,
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function apiDelete(path: string, options?: ApiFetchOptions): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" }, options)
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
}
