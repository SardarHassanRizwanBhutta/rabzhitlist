/**
 * Benefits API for employer/candidate benefit dropdowns.
 * List all / create new when user clicks "Add Benefit".
 * @see Benefits-API-Reference.md
 */

import { apiGet, apiPost } from "@/lib/api-client"

export interface BenefitDto {
  id: number
  name: string
}

async function getList<T>(path: string): Promise<T[]> {
  return apiGet<T[]>(path)
}

async function createItem(path: string, name: string): Promise<BenefitDto> {
  return apiPost<BenefitDto>(path, { name: name.trim() })
}

export async function fetchBenefits(): Promise<BenefitDto[]> {
  return getList<BenefitDto>("/api/benefits")
}

export async function createBenefit(name: string): Promise<BenefitDto> {
  return createItem("/api/benefits", name)
}
