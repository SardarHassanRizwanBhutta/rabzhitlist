/**
 * Lookup APIs for tech stacks, vertical domains, horizontal domains, and technical aspects.
 * Used to populate dropdowns and to create new values when user clicks "+ Add [value]".
 * @see Lookup-APIs-Reference.md
 */

import { API_BASE_URL } from "@/lib/config/api"
import { parseIdNameList } from "@/lib/utils/domain-catalog"
import {
  normalizeTechStackLookupList,
  sortTechStackLookupItems,
  type TechStackLookupItem,
} from "@/lib/utils/tech-stack-lookup"

export type { TechStackLookupItem }

export interface LookupItem {
  id: number
  name: string
}

/** GET /api/TechnicalAspectTypes — `{ id, name }` (same integer previously sent as `value`). */
export type TechnicalAspectTypeCatalogItem = LookupItem

export interface DomainCatalogSnapshot {
  verticalDomains: LookupItem[]
  horizontalDomains: LookupItem[]
  technicalDomains: LookupItem[]
  technicalAspects: LookupItem[]
}

const EMPTY_DOMAIN_CATALOGS: DomainCatalogSnapshot = {
  verticalDomains: [],
  horizontalDomains: [],
  technicalDomains: [],
  technicalAspects: [],
}

let cachedDomainCatalogs: DomainCatalogSnapshot = EMPTY_DOMAIN_CATALOGS
let domainCatalogsLoaded = false
let domainCatalogsInflight: Promise<DomainCatalogSnapshot> | null = null

const TECH_STACKS_PATH = "/api/TechStacks"

async function getList<T>(path: string): Promise<T[]> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch ${path}: ${response.status} — ${text}`)
  }
  return response.json()
}

async function createItem(path: string, name: string): Promise<LookupItem> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create ${path}: ${response.status} — ${text}`)
  }
  return response.json()
}

async function fetchIdNameCatalog(path: string): Promise<LookupItem[]> {
  const data = await getList<unknown>(path)
  return parseIdNameList(data)
}

export function getCachedDomainCatalogs(): DomainCatalogSnapshot {
  return cachedDomainCatalogs
}

/**
 * Session cache for the four GET-only domain/aspect catalogs.
 * No POST/PUT/DELETE for these lists.
 */
export async function ensureDomainCatalogsLoaded(): Promise<DomainCatalogSnapshot> {
  if (domainCatalogsLoaded) return cachedDomainCatalogs
  if (!domainCatalogsInflight) {
    domainCatalogsInflight = Promise.all([
      fetchVerticalDomains(),
      fetchHorizontalDomains(),
      fetchTechnicalDomains(),
      fetchTechnicalAspects(),
    ])
      .then(([verticalDomains, horizontalDomains, technicalDomains, technicalAspects]) => {
        cachedDomainCatalogs = {
          verticalDomains,
          horizontalDomains,
          technicalDomains,
          technicalAspects,
        }
        domainCatalogsLoaded = true
        return cachedDomainCatalogs
      })
      .finally(() => {
        domainCatalogsInflight = null
      })
  }
  return domainCatalogsInflight
}

// --- Technical aspect types (tech-stack grouping; not GET /api/TechnicalAspects) ---

/** GET /api/TechnicalAspectTypes — `{ id, name }`. Distinct from GET /api/TechnicalAspects. */
export async function fetchTechnicalAspectTypes(): Promise<TechnicalAspectTypeCatalogItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/TechnicalAspectTypes`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TechnicalAspectTypes: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as unknown
  return parseIdNameList(data)
}

// --- Tech Stacks ---

/**
 * GET /api/TechStacks — no filter returns all stacks (backward compatible).
 * With `technicalAspectTypeId`, returns stacks linked to that aspect type (M:N). Invalid/inactive id → 400 from API.
 */
export async function fetchTechStacks(
  technicalAspectTypeId?: number,
): Promise<TechStackLookupItem[]> {
  const hasFilter =
    technicalAspectTypeId != null && typeof technicalAspectTypeId === "number" && !Number.isNaN(technicalAspectTypeId)
  const qs = hasFilter ? `?technicalAspectTypeId=${technicalAspectTypeId}` : ""
  const raw = await getList<unknown>(`${TECH_STACKS_PATH}${qs}`)
  return sortTechStackLookupItems(normalizeTechStackLookupList(raw))
}

/** POST /api/TechStacks — optional technicalAspectTypeIds merges join links (idempotent if name exists). */
export async function createTechStack(name: string, technicalAspectTypeIds?: number[]): Promise<LookupItem> {
  const body: { name: string; technicalAspectTypeIds?: number[] } = { name: name.trim() }
  if (technicalAspectTypeIds?.length) {
    body.technicalAspectTypeIds = technicalAspectTypeIds
  }
  const response = await fetch(`${API_BASE_URL}${TECH_STACKS_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create tech stack: ${response.status} — ${text}`)
  }
  return response.json()
}

// --- Domain catalogs (GET-only; `{ id, name }`) ---

export async function fetchVerticalDomains(): Promise<LookupItem[]> {
  return fetchIdNameCatalog("/api/VerticalDomains")
}

export async function fetchHorizontalDomains(): Promise<LookupItem[]> {
  return fetchIdNameCatalog("/api/HorizontalDomains")
}

export async function fetchTechnicalDomains(): Promise<LookupItem[]> {
  return fetchIdNameCatalog("/api/TechnicalDomains")
}

/** GET /api/TechnicalAspects — project Technical Aspects catalog (not aspect types). */
export async function fetchTechnicalAspects(): Promise<LookupItem[]> {
  return fetchIdNameCatalog("/api/TechnicalAspects")
}

// --- Client Locations ---

export async function fetchClientLocations(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/clientlocations")
}

export async function createClientLocation(name: string): Promise<LookupItem> {
  return createItem("/api/clientlocations", name)
}

// --- Fetch all lookups in parallel (for page prefetch) ---

export async function fetchAllLookups(): Promise<{
  techStacks: LookupItem[]
  technicalAspects: LookupItem[]
  clientLocations: LookupItem[]
}> {
  const [techStacks, technicalAspects, clientLocations] = await Promise.all([
    fetchTechStacks(),
    fetchTechnicalAspects(),
    fetchClientLocations(),
  ])
  return { techStacks, technicalAspects, clientLocations }
}
