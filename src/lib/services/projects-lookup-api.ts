/**
 * Project lookup API: search and fetch-by-id for comboboxes.
 * Does not replace {@link projects-api.ts} (management CRUD / table).
 */

import { API_BASE_URL } from "@/lib/config/api"

export interface ProjectLookupDto {
  id: number
  name: string
}

/** GET /api/projects/search — server caps limit at 20. */
export async function searchProjects(
  search: string,
  limit = 10,
  signal?: AbortSignal
): Promise<ProjectLookupDto[]> {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  params.set("limit", String(Math.min(20, Math.max(1, limit))))
  const path = `/api/projects/search?${params.toString()}`
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Projects lookup ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

/** GET /api/projects/{id} — returns full project; we only need id + name for the combobox. */
export async function fetchProjectById(id: number): Promise<{ id: number; name: string }> {
  const path = `/api/projects/${id}`
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Projects lookup ${path}: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as { id?: number; name?: string }
  if (data.id == null || typeof data.name !== "string") {
    throw new Error(`Projects lookup ${path}: invalid response shape`)
  }
  return { id: data.id, name: data.name }
}
