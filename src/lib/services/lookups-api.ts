/**
 * Lookup APIs for tech stacks, vertical domains, horizontal domains, and technical aspects.
 * Used to populate dropdowns and to create new values when user clicks "+ Add [value]".
 * @see Lookup-APIs-Reference.md
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface LookupItem {
  id: number
  name: string
}

/** Same shape as TechnicalDomains catalog — GET /api/TechnicalAspectTypes (not legacy /api/TechnicalAspects). */
export type TechnicalAspectTypeCatalogItem = { value: number; label: string }

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

// --- Technical aspect types (fixed taxonomy; scoped tech stack pickers) ---

/** GET /api/TechnicalAspectTypes — distinct from legacy GET /api/TechnicalAspects (project technicalAspectIds). */
export async function fetchTechnicalAspectTypes(): Promise<TechnicalAspectTypeCatalogItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/TechnicalAspectTypes`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TechnicalAspectTypes: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as unknown
  if (!Array.isArray(data)) return []
  return data
    .filter(
      (row): row is TechnicalAspectTypeCatalogItem =>
        row != null &&
        typeof (row as TechnicalAspectTypeCatalogItem).value === "number" &&
        typeof (row as TechnicalAspectTypeCatalogItem).label === "string"
    )
    .map((row) => ({ value: row.value, label: row.label }))
}

// --- Tech Stacks ---

/**
 * GET /api/TechStacks — no filter returns all stacks (backward compatible).
 * With `technicalAspectTypeId`, returns stacks linked to that aspect type (M:N). Invalid/inactive id → 400 from API.
 */
export async function fetchTechStacks(technicalAspectTypeId?: number): Promise<LookupItem[]> {
  const hasFilter =
    technicalAspectTypeId != null && typeof technicalAspectTypeId === "number" && !Number.isNaN(technicalAspectTypeId)
  const qs = hasFilter ? `?technicalAspectTypeId=${technicalAspectTypeId}` : ""
  return getList<LookupItem>(`${TECH_STACKS_PATH}${qs}`)
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

// --- Vertical Domains & Horizontal Domains ---
// These are now fixed enums on the backend (no CRUD).
// Use VERTICAL_DOMAINS / HORIZONTAL_DOMAINS from projects-api.ts for dropdowns.

// --- Technical Aspects (legacy lookup for project technicalAspectIds) ---

export async function fetchTechnicalAspects(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/technicalaspects")
}

export async function createTechnicalAspect(name: string): Promise<LookupItem> {
  return createItem("/api/technicalaspects", name)
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
