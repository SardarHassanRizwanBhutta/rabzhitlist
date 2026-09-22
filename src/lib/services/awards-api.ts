/**
 * Awards catalog API for employer dropdowns.
 * List all / create new when user clicks "+ Add Award".
 * @see docs/EMPLOYER_AWARDS_FRONTEND_INTEGRATION.md
 */

import { apiGet, apiPost } from "@/lib/api-client"

export interface AwardDto {
  id: number
  name: string
}

async function getList<T>(path: string): Promise<T[]> {
  return apiGet<T[]>(path)
}

export async function fetchAwards(): Promise<AwardDto[]> {
  return getList<AwardDto>("/api/awards")
}

export async function createAward(name: string): Promise<AwardDto> {
  return apiPost<AwardDto>("/api/awards", { name: name.trim() })
}
