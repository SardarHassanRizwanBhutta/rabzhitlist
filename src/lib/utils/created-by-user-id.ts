/** Query key for contribution drill-down on the five paged list APIs. */
export const CREATED_BY_USER_ID_QUERY = "createdByUserId"

const MODULE_LIST_PATHS = {
  candidates: "/candidates",
  employers: "/employers",
  projects: "/projects",
  universities: "/universities",
  certifications: "/certifications",
} as const

export type ContributionListModule = keyof typeof MODULE_LIST_PATHS

export function parseCreatedByUserIdParam(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (!/^[1-9]\d*$/.test(trimmed)) return null
  const n = Number(trimmed)
  return Number.isSafeInteger(n) ? n : null
}

export function contributionListHref(module: ContributionListModule, userId: number): string {
  return `${MODULE_LIST_PATHS[module]}?${CREATED_BY_USER_ID_QUERY}=${userId}`
}

export function deleteCreatedByUserIdParam(params: URLSearchParams): void {
  params.delete(CREATED_BY_USER_ID_QUERY)
}

/** List APIs return 404 when `createdByUserId` is unknown or soft-deleted. */
export function throwIfCreatedByUserNotFound(
  status: number,
  createdByUserId: number | null | undefined,
): void {
  if (status === 404 && createdByUserId != null && createdByUserId > 0) {
    throw new Error("User not found.")
  }
}
