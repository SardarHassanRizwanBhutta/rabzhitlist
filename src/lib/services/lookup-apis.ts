/**
 * Lookup APIs: Vertical Domains, Horizontal Domains, Technical Aspects, Tech Stacks.
 * GET to load options; POST to create a new value (returns { id, name }).
 * @see Lookup-APIs-Reference.md
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface LookupItem {
  id: number
  name: string
}

export interface CreateLookupItemDto {
  name: string
}

async function getList<T>(path: string): Promise<T[]> {
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

async function createOne<T>(path: string, body: CreateLookupItemDto): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

// --- Vertical Domains ---

export async function getVerticalDomains(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/verticaldomains")
}

export async function createVerticalDomain(name: string): Promise<LookupItem> {
  return createOne<LookupItem>("/api/verticaldomains", { name })
}

// --- Horizontal Domains ---

export async function getHorizontalDomains(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/horizontaldomains")
}

export async function createHorizontalDomain(name: string): Promise<LookupItem> {
  return createOne<LookupItem>("/api/horizontaldomains", { name })
}

// --- Technical Aspects ---

export async function getTechnicalAspects(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/technicalaspects")
}

export async function createTechnicalAspect(name: string): Promise<LookupItem> {
  return createOne<LookupItem>("/api/technicalaspects", { name })
}

// --- Tech Stacks ---

export async function getTechStacks(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/techstacks")
}

export async function createTechStack(name: string): Promise<LookupItem> {
  return createOne<LookupItem>("/api/techstacks", { name })
}
