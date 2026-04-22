import type { University, UniversityLocation } from "@/lib/types/university"
import type { Ranking } from "@/lib/types/university"

import { API_BASE_URL } from "@/lib/config/api"

/** Search/combobox result: id + name only. @see GET /api/universities/search */
export interface UniversityLookupDto {
  id: number
  name: string
}

/** Campus row on GET /api/universities list items. */
export interface UniversityListLocationDto {
  id: number
  universityId: number
  city: string
  address: string | null
  isMainCampus: boolean
  createdAt: string
}

/** GET /api/universities list item (locations, ranking, URLs). */
export interface UniversityListItem {
  id: number
  name: string
  country: { id: number; name: string }
  /** Display string (e.g. "Tier 1"), numeric 0–3, or null. */
  ranking: string | number | null
  locations?: UniversityListLocationDto[]
  /** @deprecated Old list shape; used when `locations` is missing or empty. */
  cities?: string[]
  websiteUrl?: string | null
  linkedInUrl?: string | null
}

export interface UniversitiesListResponse {
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages?: number
  hasPrevious?: boolean
  hasNext?: boolean
  items: UniversityListItem[]
}

export interface FetchUniversitiesParams {
  name?: string
  countryIds?: number[]
  city?: string
  /** Filter by ranking enum value 0–3 (Tier1 … DplFavourite). */
  ranking?: Ranking
  pageNumber: number
  pageSize: number
}

export interface CreateUniversityDto {
  name: string
  countryId: number
  websiteUrl?: string | null
  linkedInUrl?: string | null
  ranking?: Ranking | null
}

export type UpdateUniversityDto = CreateUniversityDto

/** Body for POST /api/universities/{universityId}/locations (universityId from URL) */
export interface CreateUniversityLocationBody {
  city: string
  address?: string | null
  isMainCampus?: boolean
}

/** Body for PUT /api/universities/{universityId}/locations/{locationId} */
export type UpdateUniversityLocationBody = CreateUniversityLocationBody

export async function createUniversityLocation(
  universityId: number,
  body: CreateUniversityLocationBody
): Promise<UniversityLocation> {
  const response = await fetch(
    `${API_BASE_URL}/api/universities/${universityId}/locations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: body.city.trim(),
        address: body.address?.trim() || null,
        isMainCampus: body.isMainCampus ?? false,
      }),
    }
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to create location: ${response.status} — ${text}`
    )
  }
  return response.json()
}

export async function updateUniversityLocation(
  universityId: number,
  locationId: number,
  body: UpdateUniversityLocationBody
): Promise<UniversityLocation> {
  const response = await fetch(
    `${API_BASE_URL}/api/universities/${universityId}/locations/${locationId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: body.city.trim(),
        address: body.address?.trim() || null,
        isMainCampus: body.isMainCampus ?? false,
      }),
    }
  )
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to update location: ${response.status} — ${text}`
    )
  }
  return response.json()
}

/** Search universities by name (e.g. for combobox). GET /api/universities/search */
export async function searchUniversities(
  search: string,
  limit = 10,
  signal?: AbortSignal
): Promise<UniversityLookupDto[]> {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  params.set("limit", String(Math.min(20, Math.max(1, limit))))
  const path = `/api/universities/search?${params.toString()}`
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Universities API ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

export async function fetchUniversities(): Promise<University[]> {
  const response = await fetch(`${API_BASE_URL}/api/universities`)
  if (!response.ok) {
    throw new Error(`Failed to fetch universities: ${response.status}`)
  }
  const data = await response.json()
  return data as University[]
}

export async function fetchUniversitiesFiltered(
  params: FetchUniversitiesParams
): Promise<UniversitiesListResponse> {
  const search = new URLSearchParams()
  if (params.name?.trim()) search.set("name", params.name.trim())
  if (params.city?.trim()) search.set("city", params.city.trim())
  if (params.ranking != null) search.set("ranking", String(params.ranking))
  search.set("pageNumber", String(params.pageNumber))
  search.set("pageSize", String(params.pageSize))
  if (params.countryIds?.length) {
    params.countryIds.forEach((id) => search.append("countryIds", String(id)))
  }
  const url = `${API_BASE_URL}/api/universities?${search.toString()}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch universities: ${response.status}`)
  }
  return response.json()
}

export async function fetchUniversityById(id: number): Promise<University> {
  const response = await fetch(`${API_BASE_URL}/api/universities/${id}`)
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch university: ${response.status}`)
  }
  return response.json()
}

export async function deleteUniversityLocation(
  universityId: number,
  locationId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/universities/${universityId}/locations/${locationId}`,
    { method: "DELETE" }
  )
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to delete location: ${response.status} — ${text}`
    )
  }
}

export async function createUniversity(body: CreateUniversityDto): Promise<University> {
  const response = await fetch(`${API_BASE_URL}/api/universities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create university: ${response.status} — ${text}`)
  }
  return response.json()
}

export async function updateUniversity(
  id: number,
  body: UpdateUniversityDto
): Promise<University> {
  const response = await fetch(`${API_BASE_URL}/api/universities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to update university: ${response.status} — ${text}`)
  }
  return response.json()
}

export async function deleteUniversity(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/universities/${id}`, {
    method: "DELETE",
  })
  if (response.status === 404) {
    throw new Error("Not found")
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to delete university: ${response.status} — ${text}`)
  }
}
