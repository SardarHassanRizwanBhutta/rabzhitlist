/**
 * Certification lookup API: search and fetch-by-id for comboboxes.
 * Separate from {@link certifications-api.ts} (management CRUD / table).
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface CertificationLookupDto {
  id: number
  name: string
  issuerName: string | null
}

/** GET /api/certifications/search — server caps limit at 20. */
export async function searchCertifications(
  search: string,
  limit = 10,
  signal?: AbortSignal
): Promise<CertificationLookupDto[]> {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  params.set("limit", String(Math.min(20, Math.max(1, limit))))
  const path = `/api/certifications/search?${params.toString()}`
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Certifications lookup ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

/** GET /api/certifications/{id} — full row; combobox needs id, name, issuerName. */
export async function fetchCertificationById(
  id: number
): Promise<{ id: number; name: string; issuerName: string | null }> {
  const path = `/api/certifications/${id}`
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Certifications lookup ${path}: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as {
    id?: number
    name?: string
    issuerName?: string | null
  }
  if (data.id == null || typeof data.name !== "string") {
    throw new Error(`Certifications lookup ${path}: invalid response shape`)
  }
  return {
    id: data.id,
    name: data.name,
    issuerName: data.issuerName ?? null,
  }
}
