/**
 * Tags and Time Support Zones APIs for employer (and candidate) dropdowns.
 * List all / create new when user clicks "+ Add Tag" or "+ Add Time Zone".
 * @see Tags-and-TimeSupportZones-API-Reference.md
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface TagDto {
  id: number
  name: string
}

export interface TimeSupportZoneDto {
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

// --- Tags ---

export async function fetchTags(): Promise<TagDto[]> {
  return getList<TagDto>("/api/tags")
}

export async function createTag(name: string): Promise<TagDto> {
  return createItem<TagDto>("/api/tags", name)
}

// --- Time Support Zones ---

export async function fetchTimeSupportZones(): Promise<TimeSupportZoneDto[]> {
  return getList<TimeSupportZoneDto>("/api/timesupportzones")
}

export async function createTimeSupportZone(name: string): Promise<TimeSupportZoneDto> {
  return createItem<TimeSupportZoneDto>("/api/timesupportzones", name)
}
