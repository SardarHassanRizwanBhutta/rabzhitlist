/**
 * Majors and Degrees APIs for candidate education comboboxes.
 * @see Majors-and-degrees-API-Reference.md
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface MajorDto {
  id: number
  name: string
}

export interface DegreeDto {
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

async function createItem<T extends { id: number; name: string }>(
  path: string,
  name: string
): Promise<T> {
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
