/**
 * Time Support Zones API for employer (and candidate) dropdowns.
 * List all / create new when user clicks "+ Add Time Zone".
 * @see Tags-and-TimeSupportZones-API-Reference.md
 */

import { apiGet, apiPost } from "@/lib/api-client"

export interface TimeSupportZoneDto {
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

export async function fetchTimeSupportZones(): Promise<TimeSupportZoneDto[]> {
  return getList<TimeSupportZoneDto>("/api/timesupportzones")
}

export async function createTimeSupportZone(name: string): Promise<TimeSupportZoneDto> {
  return createItem<TimeSupportZoneDto>("/api/timesupportzones", name)
}
