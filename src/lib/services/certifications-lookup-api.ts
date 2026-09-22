/**
 * Certification lookup API: search and fetch-by-id for comboboxes.
 * Separate from {@link certifications-api.ts} (management CRUD / table).
 */

import { apiFetch, apiGet } from "@/lib/api-client"

export interface CertificationLookupDto {
  id: number
  name: string
  issuerName: string | null
}

/** GET /api/certifications/search — server caps limit at 20. */
export async function searchCertifications(
  search: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<CertificationLookupDto[]> {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  params.set("limit", String(Math.min(20, Math.max(1, limit))))
  const path = `/api/certifications/search?${params.toString()}`
  const res = await apiFetch(path, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Certifications lookup ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

/** GET /api/certifications/{id} — full row; combobox needs id, name, issuerName. */
export async function fetchCertificationById(
  id: number,
): Promise<{ id: number; name: string; issuerName: string | null }> {
  const path = `/api/certifications/${id}`
  const data = await apiGet<{
    id?: number
    name?: string
    issuerName?: string | null
  }>(path)
  if (data.id == null || typeof data.name !== "string") {
    throw new Error(`Certifications lookup ${path}: invalid response shape`)
  }
  return {
    id: data.id,
    name: data.name,
    issuerName: data.issuerName ?? null,
  }
}
