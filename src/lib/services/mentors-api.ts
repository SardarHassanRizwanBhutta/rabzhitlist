import { apiDelete, apiFetch, apiPost, apiPut } from "@/lib/api-client"
import type {
  CandidateMentorFormRow,
  CandidateMentorLink,
  Mentor,
  MentorLinkedCandidate,
  MentorSearchHit,
} from "@/lib/types/mentor"

export interface MentorsPageResponse {
  items: Mentor[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface SaveMentorBody {
  name: string
  designation: string | null
  employerId: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function positiveInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function mapLinkedCandidate(raw: unknown): MentorLinkedCandidate | null {
  const row = asRecord(raw)
  if (!row) return null
  const candidateId = positiveInt(row.candidateId)
  if (candidateId == null) return null
  return {
    candidateId,
    candidateName: String(row.candidateName ?? row.name ?? ""),
    relationship: textOrNull(row.relationship),
    reasoning: textOrNull(row.reasoning),
  }
}

export function mapMentor(raw: unknown): Mentor | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = positiveInt(row.id)
  const employerId = positiveInt(row.employerId)
  if (id == null || employerId == null) return null
  const linksRaw = row.linkedCandidates ?? row.candidates
  const linkedCandidates = Array.isArray(linksRaw)
    ? linksRaw.map(mapLinkedCandidate).filter((item): item is MentorLinkedCandidate => item != null)
    : []
  return {
    id,
    name: String(row.name ?? "").trim(),
    designation: textOrNull(row.designation),
    employerId,
    employerName: String(row.employerName ?? ""),
    linkedCandidates,
  }
}

export function mapCandidateMentorLink(raw: unknown, index: number): CandidateMentorLink | null {
  const row = asRecord(raw)
  if (!row) return null
  const mentorId = positiveInt(row.mentorId)
  const employerId = positiveInt(row.employerId)
  if (mentorId == null || employerId == null) return null
  const linkId = positiveInt(row.id) ?? positiveInt(row.linkId)
  return {
    id: linkId != null ? String(linkId) : `mentor-link-${index}`,
    mentorId,
    name: String(row.name ?? row.mentorName ?? "").trim(),
    designation: textOrNull(row.designation),
    employerId,
    employerName: String(row.employerName ?? ""),
    relationship: textOrNull(row.relationship),
    reasoning: textOrNull(row.reasoning),
  }
}

export function mapMentorSearchHit(raw: unknown): MentorSearchHit | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = positiveInt(row.id)
  const employerId = positiveInt(row.employerId)
  if (id == null || employerId == null) return null
  return {
    id,
    name: String(row.name ?? "").trim(),
    designation: textOrNull(row.designation),
    employerId,
    employerName: String(row.employerName ?? ""),
  }
}

export async function fetchMentorsPage(params: {
  /** Page search box. Query `name`. */
  name?: string
  /** Filters dialog Name. Query `filterName`. AND with `name` when both are set. */
  filterName?: string
  /** Filters dialog Organization. Repeated query `employerIds`. OR within the list. */
  employerIds?: number[]
  /** Filters dialog Designation. Query `designation`. */
  designation?: string
  pageNumber?: number
  pageSize?: number
}): Promise<MentorsPageResponse> {
  const search = new URLSearchParams()
  if (params.name?.trim()) search.set("name", params.name.trim())
  if (params.filterName?.trim()) search.set("filterName", params.filterName.trim())
  if (params.designation?.trim()) search.set("designation", params.designation.trim())
  for (const employerId of params.employerIds ?? []) {
    if (Number.isInteger(employerId) && employerId > 0) {
      search.append("employerIds", String(employerId))
    }
  }
  search.set("pageNumber", String(params.pageNumber ?? 1))
  search.set("pageSize", String(params.pageSize ?? 20))
  const response = await apiFetch(`/api/mentors?${search.toString()}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Failed to load mentors (${response.status})`)
  }
  const data = (await response.json()) as Record<string, unknown>
  const itemsRaw = Array.isArray(data.items) ? data.items : []
  return {
    items: itemsRaw.map(mapMentor).filter((item): item is Mentor => item != null),
    pageNumber: Number(data.pageNumber ?? 1),
    pageSize: Number(data.pageSize ?? 20),
    totalCount: Number(data.totalCount ?? 0),
    totalPages: Number(data.totalPages ?? 0),
    hasPrevious: data.hasPrevious === true,
    hasNext: data.hasNext === true,
  }
}

export async function fetchMentorById(id: number): Promise<Mentor> {
  const response = await apiFetch(`/api/mentors/${id}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Failed to load mentor (${response.status})`)
  }
  const mentor = mapMentor(await response.json())
  if (!mentor) throw new Error("Mentor response was missing an id or organization.")
  return mentor
}

export async function searchMentors(
  search: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<MentorSearchHit[]> {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  params.set("limit", String(Math.min(20, Math.max(1, limit))))
  const response = await apiFetch(`/api/mentors/search?${params.toString()}`, { signal })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Failed to search mentors (${response.status})`)
  }
  const data = await response.json()
  const rows = Array.isArray(data) ? data : []
  return rows.map(mapMentorSearchHit).filter((item): item is MentorSearchHit => item != null)
}

export async function createMentor(body: SaveMentorBody): Promise<Mentor> {
  const created = await apiPost<unknown>("/api/mentors", body)
  const mentor = mapMentor(created)
  if (!mentor) throw new Error("Create mentor did not return an id.")
  return mentor
}

export async function updateMentor(id: number, body: SaveMentorBody): Promise<Mentor> {
  const updated = await apiPut<unknown>(`/api/mentors/${id}`, body)
  const mentor = mapMentor(updated)
  if (!mentor) {
    return {
      id,
      name: body.name,
      designation: body.designation,
      employerId: body.employerId,
      employerName: "",
      linkedCandidates: [],
    }
  }
  return mentor
}

export async function deleteMentor(id: number): Promise<void> {
  await apiDelete(`/api/mentors/${id}`)
}

function nullIfBlank(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function syncCandidateMentors(
  candidateId: number,
  rows: CandidateMentorFormRow[],
  existing: CandidateMentorLink[],
): Promise<void> {
  const existingById = new Map(existing.map((link) => [link.id, link]))
  const seenLinkIds = new Set<string>()

  for (const row of rows) {
    let mentorId = row.mentorId
    if (row.createNew) {
      const name = row.name.trim()
      if (!name || row.employerId == null) continue
      const created = await createMentor({
        name,
        designation: nullIfBlank(row.designation),
        employerId: row.employerId,
      })
      mentorId = created.id
    }
    if (mentorId == null) continue

    const body = {
      mentorId,
      relationship: nullIfBlank(row.relationship),
      reasoning: nullIfBlank(row.reasoning),
    }
    const persisted = /^\d+$/.test(row.id) && existingById.has(row.id)
    if (persisted) {
      seenLinkIds.add(row.id)
      const previous = existingById.get(row.id)!
      const relationshipChanged = (previous.relationship ?? "") !== row.relationship.trim()
      const reasoningChanged = (previous.reasoning ?? "") !== row.reasoning.trim()
      if (relationshipChanged || reasoningChanged) {
        await apiPut(`/api/candidates/${candidateId}/mentors/${row.id}`, {
          relationship: body.relationship,
          reasoning: body.reasoning,
        })
      }
    } else {
      await apiPost(`/api/candidates/${candidateId}/mentors`, body)
    }
  }

  for (const previous of existing) {
    if (!seenLinkIds.has(previous.id) && /^\d+$/.test(previous.id)) {
      await apiDelete(`/api/candidates/${candidateId}/mentors/${previous.id}`)
    }
  }
}
