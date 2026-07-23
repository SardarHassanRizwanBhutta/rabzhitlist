import type { CandidateEducation } from "@/lib/types/candidate"
import type { University } from "@/lib/types/university"
import { RANKING_DISPLAY_TO_DB } from "@/lib/types/employer"
import {
  RANKING_TO_LABEL,
  parseUniversityRankingFromList,
} from "@/lib/types/university"
import type { UniversityListItem } from "@/lib/services/universities-api"
import { fetchUniversityById } from "@/lib/services/universities-api"
import type { EducationForService, EducationLocationForService } from "@/types/question-generation"

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

const SERVICE_RANKING_SUFFIXES = new Set(["tier_1", "tier_2", "tier_3", "dpl_favourite"])

/** Map UI / API ranking to question-service payload (`tier_1`, …). */
export function rankingToEducationServicePayload(raw: unknown): string | null {
  if (raw == null) return null
  if (typeof raw === "string") {
    const lower = raw.trim().toLowerCase()
    if (SERVICE_RANKING_SUFFIXES.has(lower)) return lower
  }
  const parsed = parseUniversityRankingFromList(raw)
  if (parsed == null) return emptyToNull(typeof raw === "string" ? raw : null)
  const label = RANKING_TO_LABEL[parsed]
  return RANKING_DISPLAY_TO_DB[label]
}

function mapLocationFromApi(raw: unknown): EducationLocationForService | null {
  const row = asRecord(raw)
  if (!row) return null
  return {
    city: emptyToNull(row.city != null ? String(row.city) : null),
    address: emptyToNull(row.address != null ? String(row.address) : null),
    isMainCampus:
      typeof row.isMainCampus === "boolean"
        ? row.isMainCampus
        : row.isMainCampus != null
          ? Boolean(row.isMainCampus)
          : null,
  }
}

export interface UniversityCatalogFromApi {
  country: string | null
  ranking: string | null
  websiteUrl: string | null
  linkedinUrl: string | null
  locations: EducationLocationForService[]
}

/**
 * Optional flat catalog fields on CandidateEducationDto (if ASP.NET denormalizes them later).
 * GET /api/candidates/{id} today has link fields only — no nested `university`.
 */
export function parseUniversityCatalogFromEducationRow(
  raw: Record<string, unknown>,
): UniversityCatalogFromApi {
  const countryObj = asRecord(raw.country)
  const country =
    countryObj?.name != null
      ? String(countryObj.name)
      : raw.country != null && typeof raw.country === "string"
        ? String(raw.country)
        : null

  const ranking = rankingToEducationServicePayload(raw.ranking)

  const websiteUrl =
    raw.websiteUrl != null
      ? String(raw.websiteUrl)
      : raw.website_url != null
        ? String(raw.website_url)
        : null

  const linkedinUrl =
    raw.linkedInUrl != null
      ? String(raw.linkedInUrl)
      : raw.linkedinUrl != null
        ? String(raw.linkedinUrl)
        : null

  const locRaw = raw.locations
  const locations = Array.isArray(locRaw)
    ? locRaw.map(mapLocationFromApi).filter((loc): loc is EducationLocationForService => loc != null)
    : []

  return {
    country: emptyToNull(country),
    ranking,
    websiteUrl: emptyToNull(websiteUrl),
    linkedinUrl: emptyToNull(linkedinUrl),
    locations,
  }
}

/** Catalog from GET /api/universities/{id} or list item — used before question-service POST. */
export function universityEntityToCatalog(
  uni: University | UniversityListItem,
): UniversityCatalogFromApi {
  const country =
    uni.country?.name != null ? String(uni.country.name) : null

  const ranking = rankingToEducationServicePayload(uni.ranking)

  const websiteUrl = uni.websiteUrl != null ? String(uni.websiteUrl) : null
  const linkedinUrl = uni.linkedInUrl != null ? String(uni.linkedInUrl) : null

  let locations: EducationLocationForService[] = []
  if ("locations" in uni && Array.isArray(uni.locations) && uni.locations.length > 0) {
    locations = uni.locations
      .map(mapLocationFromApi)
      .filter((loc): loc is EducationLocationForService => loc != null)
  } else if ("cities" in uni && Array.isArray(uni.cities)) {
    locations = uni.cities
      .map((city) => ({ city: String(city), address: null, isMainCampus: null }))
      .filter((loc) => loc.city.trim() !== "")
  }

  return {
    country: emptyToNull(country),
    ranking,
    websiteUrl: emptyToNull(websiteUrl),
    linkedinUrl: emptyToNull(linkedinUrl),
    locations,
  }
}

export function resolveEducationUniversityId(edu: CandidateEducation): number | null {
  if (edu.universityId != null && Number.isFinite(edu.universityId) && edu.universityId > 0) {
    return edu.universityId
  }
  const parsed = Number(edu.universityLocationId)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function mergeUniversityCatalogIntoEducation(
  edu: CandidateEducation,
  catalog: UniversityCatalogFromApi,
): CandidateEducation {
  const hasLocations = (edu.locations?.length ?? 0) > 0
  return {
    ...edu,
    country: edu.country ?? catalog.country,
    ranking: edu.ranking ?? catalog.ranking,
    websiteUrl: edu.websiteUrl ?? catalog.websiteUrl,
    linkedinUrl: edu.linkedinUrl ?? catalog.linkedinUrl,
    locations: hasLocations ? edu.locations : catalog.locations,
  }
}

/**
 * Fetch university catalog by `universityId` and merge into each education row
 * before POST to the question-generation service (§ 4.12.1).
 */
export async function enrichEducationsWithUniversityCatalog(
  educations: CandidateEducation[] | undefined,
): Promise<CandidateEducation[]> {
  if (!educations?.length) return educations ?? []

  const ids = new Set<number>()
  for (const edu of educations) {
    const id = resolveEducationUniversityId(edu)
    if (id != null) ids.add(id)
  }

  if (ids.size === 0) return educations

  const catalogById = new Map<number, UniversityCatalogFromApi>()
  await Promise.all(
    [...ids].map(async (id) => {
      try {
        const uni = await fetchUniversityById(id)
        catalogById.set(id, universityEntityToCatalog(uni))
      } catch {
        // Leave catalog empty for this row — question service will treat fields as missing.
      }
    }),
  )

  return educations.map((edu) => {
    const id = resolveEducationUniversityId(edu)
    if (id == null) return edu
    const catalog = catalogById.get(id)
    if (!catalog) return edu
    return mergeUniversityCatalogIntoEducation(edu, catalog)
  })
}

export function mapEducationToServicePayload(edu: CandidateEducation): EducationForService {
  const universityName =
    emptyToNull(edu.universityName) ??
    emptyToNull(edu.universityLocationName) ??
    edu.universityLocationName

  return {
    universityName,
    isTopper: edu.isTopper ?? null,
  }
}
