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

// --- Tech Stacks ---

export async function fetchTechStacks(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/techstacks")
}

export async function createTechStack(name: string): Promise<LookupItem> {
  return createItem("/api/techstacks", name)
}

// --- Vertical Domains ---

export async function fetchVerticalDomains(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/verticaldomains")
}

export async function createVerticalDomain(name: string): Promise<LookupItem> {
  return createItem("/api/verticaldomains", name)
}

// --- Horizontal Domains ---

export async function fetchHorizontalDomains(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/horizontaldomains")
}

export async function createHorizontalDomain(name: string): Promise<LookupItem> {
  return createItem("/api/horizontaldomains", name)
}

// --- Technical Aspects ---

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
  verticalDomains: LookupItem[]
  horizontalDomains: LookupItem[]
  technicalAspects: LookupItem[]
  clientLocations: LookupItem[]
}> {
  const [techStacks, verticalDomains, horizontalDomains, technicalAspects, clientLocations] = await Promise.all([
    fetchTechStacks(),
    fetchVerticalDomains(),
    fetchHorizontalDomains(),
    fetchTechnicalAspects(),
    fetchClientLocations(),
  ])
  return { techStacks, verticalDomains, horizontalDomains, technicalAspects, clientLocations }
}
