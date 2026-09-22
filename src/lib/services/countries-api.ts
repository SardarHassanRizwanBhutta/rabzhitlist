import type { Country } from "@/lib/types/country"

import { apiGet, apiPost } from "@/lib/api-client"

export async function fetchCountries(): Promise<Country[]> {
  return apiGet<Country[]>("/api/countries")
}

export async function createCountry(name: string): Promise<Country> {
  return apiPost<Country>("/api/countries", { name: name.trim() })
}
