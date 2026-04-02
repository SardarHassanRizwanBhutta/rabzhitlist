/**
 * Benefits API for employer/candidate benefit dropdowns.
 * List all / create new when user clicks "Add Benefit".
 * @see Benefits-API-Reference.md
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface BenefitDto {
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

async function createItem(path: string, name: string): Promise<BenefitDto> {
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

export async function fetchBenefits(): Promise<BenefitDto[]> {
  return getList<BenefitDto>("/api/benefits")
}

export async function createBenefit(name: string): Promise<BenefitDto> {
  return createItem("/api/benefits", name)
}
