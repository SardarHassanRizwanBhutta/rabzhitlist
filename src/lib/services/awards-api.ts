/**
 * Awards catalog API for employer dropdowns.
 * List all / create new when user clicks "+ Add Award".
 * @see docs/EMPLOYER_AWARDS_FRONTEND_INTEGRATION.md
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface AwardDto {
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

export async function fetchAwards(): Promise<AwardDto[]> {
  return getList<AwardDto>("/api/awards")
}

export async function createAward(name: string): Promise<AwardDto> {
  const response = await fetch(`${API_BASE_URL}/api/awards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create /api/awards: ${response.status} — ${text}`)
  }
  return response.json()
}
