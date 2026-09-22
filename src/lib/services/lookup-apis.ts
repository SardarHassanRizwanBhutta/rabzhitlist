/**
 * Lookup APIs: Vertical Domains, Horizontal Domains, Technical Aspects, Tech Stacks.
 * GET to load options; POST to create a new value (returns { id, name }).
 * @see Lookup-APIs-Reference.md
 */

import { apiGet, apiPost } from "@/lib/api-client"

export interface LookupItem {
  id: number
  name: string
}

export interface CreateLookupItemDto {
  name: string
}

async function getList<T>(path: string): Promise<T[]> {
  return apiGet<T[]>(path)
}

async function createOne<T>(path: string, body: CreateLookupItemDto): Promise<T> {
  return apiPost<T>(path, body)
}

export async function getTechnicalAspects(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/TechnicalAspects")
}

export async function getTechStacks(): Promise<LookupItem[]> {
  return getList<LookupItem>("/api/techstacks")
}

export async function createTechStack(name: string): Promise<LookupItem> {
  return createOne<LookupItem>("/api/techstacks", { name })
}
