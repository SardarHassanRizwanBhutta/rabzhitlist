/**
 * Majors and Degrees APIs for candidate education comboboxes.
 * @see Majors-and-degrees-API-Reference.md
 */

import { apiGet, apiPost } from "@/lib/api-client"

export interface MajorDto {
  id: number
  name: string
}

export interface DegreeDto {
  id: number
  name: string
}

async function getList<T>(path: string): Promise<T[]> {
  return apiGet<T[]>(path)
}

async function createItem<T extends { id: number; name: string }>(
  path: string,
  name: string,
): Promise<T> {
  return apiPost<T>(path, { name: name.trim() })
}

export async function fetchMajors(): Promise<MajorDto[]> {
  return getList<MajorDto>("/api/majors")
}

export async function createMajor(name: string): Promise<MajorDto> {
  return createItem<MajorDto>("/api/majors", name)
}

export async function fetchDegrees(): Promise<DegreeDto[]> {
  return getList<DegreeDto>("/api/degrees")
}

export async function createDegree(name: string): Promise<DegreeDto> {
  return createItem<DegreeDto>("/api/degrees", name)
}
