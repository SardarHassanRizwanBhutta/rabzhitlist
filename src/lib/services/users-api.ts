import { apiFetch } from "@/lib/api-client"
import { apiHttpErrorFromResponse } from "@/lib/utils/api-error-message"
import type { AppUser } from "@/lib/types/app-user"
import { parseUserRole, type UserRole } from "@/lib/types/user-role"

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

export function mapAppUserDto(raw: Record<string, unknown>): AppUser {
  const id = asNumber(raw.id)
  const fullName = asString(raw.fullName) ?? ""
  const email = asString(raw.email) ?? ""
  const createdAt = asString(raw.createdAt) ?? ""
  const role = parseUserRole(raw.role)
  if (id == null) {
    throw new Error("Invalid user payload: missing id")
  }
  if (role == null) {
    throw new Error("Invalid user payload: missing role")
  }
  return { id, fullName, email, createdAt, role }
}

export interface UsersPageResponse {
  items: AppUser[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface FetchUsersParams {
  fullName?: string
  email?: string
  pageNumber?: number
  pageSize?: number
}

export async function fetchUsersPage(params: FetchUsersParams = {}): Promise<UsersPageResponse> {
  const { fullName = "", email = "", pageNumber = 1, pageSize = 20 } = params
  const search = new URLSearchParams()
  if (fullName.trim()) search.set("fullName", fullName.trim())
  if (email.trim()) search.set("email", email.trim())
  search.set("pageNumber", String(pageNumber))
  search.set("pageSize", String(pageSize))
  const query = search.toString()
  const url = `/api/users${query ? `?${query}` : ""}`

  const response = await apiFetch(url)
  if (!response.ok) {
    const text = await response.text()
    throw apiHttpErrorFromResponse(text, response.status)
  }

  const data = (await response.json()) as UsersPageResponse
  return {
    ...data,
    items: (data.items ?? []).map((item) =>
      mapAppUserDto(item as unknown as Record<string, unknown>),
    ),
  }
}

export interface CreateUserRequest {
  fullName: string
  email: string
  password: string
  role: UserRole
}

export async function createUser(body: CreateUserRequest): Promise<AppUser> {
  const response = await apiFetch(`/api/users`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw apiHttpErrorFromResponse(text, response.status)
  }
  const payload = (await response.json()) as Record<string, unknown>
  return mapAppUserDto(payload)
}

export interface UpdateUserRequest {
  fullName: string
  email: string
  role: UserRole
  /** Omit or empty to leave password unchanged. */
  password?: string
}

export async function updateUser(id: number, body: UpdateUserRequest): Promise<AppUser> {
  const response = await apiFetch(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    const text = await response.text()
    throw apiHttpErrorFromResponse(text, response.status)
  }
  const payload = (await response.json()) as Record<string, unknown>
  return mapAppUserDto(payload)
}

export async function deleteUser(id: number): Promise<void> {
  const response = await apiFetch(`/api/users/${id}`, {
    method: "DELETE",
  })
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    const text = await response.text()
    throw apiHttpErrorFromResponse(text, response.status)
  }
}
