import { API_BASE_URL } from "@/lib/config/api"
import { extractApiErrorMessage } from "@/lib/utils/api-error-message"
import type { PagedResult } from "@/lib/services/candidates-api"
import { ACHIEVEMENT_TYPE_DB, ACHIEVEMENT_TYPE_LABELS } from "@/lib/constants/candidate-enums"

/** One `candidate_achievements` row from GET /api/achievements. */
export interface CandidateAchievementListItem {
  id: number
  candidateId: number
  candidateName: string
  name: string
  type: number | null
  ranking: string | null
  year: number | null
  url: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface FetchAchievementsPageParams {
  pageNumber?: number
  pageSize?: number
  name?: string
  /** AchievementType ints 0–7. Invalid values are omitted (API 400s on out-of-range). */
  types?: number[]
  candidateId?: number
}

export function achievementTypeLabel(type: number | null): string {
  if (type == null || !Number.isInteger(type) || type < 0 || type > 7) return "—"
  const key = ACHIEVEMENT_TYPE_DB[type]
  return ACHIEVEMENT_TYPE_LABELS[key]
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value
  return null
}

function mapAchievementListItem(raw: Record<string, unknown>): CandidateAchievementListItem {
  const id = asNumber(raw.id)
  const candidateId = asNumber(raw.candidateId)
  const name = asString(raw.name)
  const candidateName = asString(raw.candidateName)
  if (id == null || candidateId == null || !name || !candidateName) {
    throw new Error("Achievement list item is missing required fields.")
  }
  const typeRaw = raw.type
  let type: number | null = null
  if (typeRaw != null) {
    const n = asNumber(typeRaw)
    type = n != null && Number.isInteger(n) && n >= 0 && n <= 7 ? n : null
  }
  return {
    id,
    candidateId,
    candidateName,
    name,
    type,
    ranking: asString(raw.ranking),
    year: asNumber(raw.year),
    url: asString(raw.url),
    description: asString(raw.description),
    createdAt: asString(raw.createdAt) ?? "",
    updatedAt: asString(raw.updatedAt) ?? "",
  }
}

export async function fetchAchievementsPage(
  params: FetchAchievementsPageParams = {},
  signal?: AbortSignal,
): Promise<PagedResult<CandidateAchievementListItem>> {
  const search = new URLSearchParams()
  search.set("pageNumber", String(Math.max(1, params.pageNumber ?? 1)))
  search.set("pageSize", String(Math.min(100, Math.max(1, params.pageSize ?? 20))))
  if (params.name?.trim()) search.set("name", params.name.trim())
  const types = (params.types ?? []).filter((t) => Number.isInteger(t) && t >= 0 && t <= 7)
  types.forEach((t) => search.append("types", String(t)))
  if (params.candidateId != null && Number.isFinite(params.candidateId) && params.candidateId > 0) {
    search.set("candidateId", String(Math.floor(params.candidateId)))
  }

  const path = `/api/achievements?${search.toString()}`
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(extractApiErrorMessage(text, res.status))
  }
  const data = (await res.json()) as PagedResult<Record<string, unknown>>
  return {
    ...data,
    items: (data.items ?? []).map((item) => mapAchievementListItem(item)),
  }
}
