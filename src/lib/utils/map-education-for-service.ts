import { RANKING_DISPLAY_TO_DB } from "@/lib/types/employer"
import {
  RANKING_TO_LABEL,
  parseUniversityRankingFromList,
} from "@/lib/types/university"

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

export interface EducationLocationFromApi {
  city?: string | null
  address?: string | null
  isMainCampus?: boolean | null
}

function mapLocationFromApi(raw: unknown): EducationLocationFromApi | null {
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
  locations: EducationLocationFromApi[]
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
    ? locRaw.map(mapLocationFromApi).filter((loc): loc is EducationLocationFromApi => loc != null)
    : []

  return {
    country: emptyToNull(country),
    ranking,
    websiteUrl: emptyToNull(websiteUrl),
    linkedinUrl: emptyToNull(linkedinUrl),
    locations,
  }
}
