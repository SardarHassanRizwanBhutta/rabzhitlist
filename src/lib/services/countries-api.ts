import type { Country } from "@/lib/types/country"

import { API_BASE_URL } from "@/lib/config/api"

export async function fetchCountries(): Promise<Country[]> {
  const response = await fetch(`${API_BASE_URL}/api/countries`)

  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.status}`)
  }

  return response.json()
}

export async function createCountry(name: string): Promise<Country> {
  const response = await fetch(`${API_BASE_URL}/api/countries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create country: ${response.status} — ${text}`)
  }
  return response.json()
}
