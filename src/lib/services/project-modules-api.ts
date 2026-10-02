import { apiDelete, apiFetch, apiGet, apiPost, apiPut } from "@/lib/api-client"
import type {
  CandidateWorkModule,
  ProjectModule,
  ProjectModuleContributor,
  ProjectModuleListItem,
  ProjectModuleSearchHit,
} from "@/lib/types/project-module"

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

function techStackNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim()
      const row = asRecord(item)
      return String(row?.name ?? row?.techStackName ?? "").trim()
    })
    .filter((name) => name.length > 0)
}

function mapContributor(raw: unknown): ProjectModuleContributor | null {
  const row = asRecord(raw)
  if (!row) return null
  const linkId = positiveInt(row.linkId ?? row.id)
  const candidateId = positiveInt(row.candidateId)
  if (linkId == null || candidateId == null) return null
  return {
    linkId,
    candidateId,
    candidateName: String(row.candidateName ?? row.name ?? "").trim(),
    contribution: textOrNull(row.contribution),
  }
}

export function mapProjectModule(raw: unknown): ProjectModule | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = positiveInt(row.id)
  if (id == null) return null
  const contributorsRaw = row.contributors ?? row.candidates
  const contributors = Array.isArray(contributorsRaw)
    ? contributorsRaw
        .map(mapContributor)
        .filter((item): item is ProjectModuleContributor => item != null)
    : []
  return {
    id,
    name: String(row.name ?? "").trim(),
    description: textOrNull(row.description),
    techStacks: techStackNames(row.techStacks),
    contributors,
  }
}

export function mapProjectModules(raw: unknown): ProjectModule[] {
  if (!Array.isArray(raw)) return []
  return raw.map(mapProjectModule).filter((item): item is ProjectModule => item != null)
}

export function mapCandidateWorkModule(raw: unknown, index: number): CandidateWorkModule | null {
  const row = asRecord(raw)
  if (!row) return null
  const moduleId = positiveInt(row.moduleId)
  const projectId = positiveInt(row.projectId)
  if (moduleId == null || projectId == null) return null
  const linkId = positiveInt(row.id) ?? positiveInt(row.linkId)
  return {
    id: linkId != null ? String(linkId) : `module-link-${index}`,
    moduleId,
    projectId,
    projectName: String(row.projectName ?? "").trim(),
    name: String(row.name ?? row.moduleName ?? "").trim(),
    description: textOrNull(row.description),
    techStacks: techStackNames(row.techStacks),
    contribution: textOrNull(row.contribution),
  }
}

export function mapProjectModuleSearchHit(raw: unknown): ProjectModuleSearchHit | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = positiveInt(row.id)
  const projectId = positiveInt(row.projectId)
  if (id == null || projectId == null) return null
  return {
    id,
    projectId,
    name: String(row.name ?? "").trim(),
    description: textOrNull(row.description),
    techStacks: techStackNames(row.techStacks),
  }
}

export async function searchProjectModules(
  projectId: number,
  search: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<ProjectModuleSearchHit[]> {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  params.set("limit", String(Math.min(20, Math.max(1, limit))))
  const response = await apiFetch(
    `/api/projects/${projectId}/modules/search?${params.toString()}`,
    { signal },
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Failed to search modules (${response.status})`)
  }
  const data = (await response.json()) as unknown
  const rows = Array.isArray(data) ? data : []
  return rows
    .map(mapProjectModuleSearchHit)
    .filter((item): item is ProjectModuleSearchHit => item != null)
}

export async function createProjectModule(
  projectId: number,
  body: { name: string; description: string | null; techStackIds: number[] },
): Promise<ProjectModule> {
  const created = await apiPost<unknown>(`/api/projects/${projectId}/modules`, body)
  const module = mapProjectModule(created)
  if (!module) throw new Error("Create module did not return an id.")
  return module
}

export async function updateProjectModule(
  projectId: number,
  moduleId: number,
  body: { name: string; description: string | null; techStackIds: number[] },
): Promise<ProjectModule> {
  const updated = await apiPut<unknown>(`/api/projects/${projectId}/modules/${moduleId}`, body)
  const module = mapProjectModule(updated)
  if (!module) {
    return {
      id: moduleId,
      name: body.name,
      description: body.description,
      techStacks: [],
      contributors: [],
    }
  }
  return module
}

export async function deleteProjectModule(projectId: number, moduleId: number): Promise<void> {
  await apiDelete(`/api/projects/${projectId}/modules/${moduleId}`)
}

export async function createWorkExperienceModuleLink(
  candidateId: number,
  workExperienceId: number,
  body: { moduleId: number; contribution: string | null },
): Promise<CandidateWorkModule> {
  const created = await apiPost<unknown>(
    `/api/candidates/${candidateId}/work-experiences/${workExperienceId}/modules`,
    body,
  )
  const link = mapCandidateWorkModule(created, 0)
  if (!link || !/^\d+$/.test(link.id)) {
    throw new Error("Create module link did not return a link id.")
  }
  return link
}

export async function updateWorkExperienceModuleLink(
  candidateId: number,
  workExperienceId: number,
  linkId: number,
  body: { contribution: string | null },
): Promise<CandidateWorkModule> {
  const updated = await apiPut<unknown>(
    `/api/candidates/${candidateId}/work-experiences/${workExperienceId}/modules/${linkId}`,
    body,
  )
  const link = mapCandidateWorkModule(updated, 0)
  if (!link || !/^\d+$/.test(link.id)) {
    throw new Error("Update module link did not return a link id.")
  }
  return link
}

function nonNegativeInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

export interface ProjectModulesPage {
  items: ProjectModuleListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

function mapModuleListItem(raw: unknown): ProjectModuleListItem | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = positiveInt(row.id)
  const projectId = positiveInt(row.projectId)
  if (id == null || projectId == null) return null
  return {
    id,
    projectId,
    projectName: String(row.projectName ?? "").trim(),
    name: String(row.name ?? "").trim(),
    techStacks: techStackNames(row.techStacks),
    candidateCount: nonNegativeInt(row.candidateCount),
  }
}

/** GET /api/modules. Name, main project, and tech stack filters combine with AND. */
export async function fetchProjectModulesPage(params: {
  name?: string
  projectIds?: number[]
  techStackIds?: number[]
  pageNumber?: number
  pageSize?: number
}): Promise<ProjectModulesPage> {
  const search = new URLSearchParams()
  if (params.name?.trim()) search.set("name", params.name.trim())
  for (const projectId of params.projectIds ?? []) {
    if (Number.isInteger(projectId) && projectId > 0) search.append("projectIds", String(projectId))
  }
  for (const techStackId of params.techStackIds ?? []) {
    if (Number.isInteger(techStackId) && techStackId > 0) {
      search.append("techStackIds", String(techStackId))
    }
  }
  const pageNumber = params.pageNumber ?? 1
  const pageSize = params.pageSize ?? 20
  search.set("pageNumber", String(pageNumber))
  search.set("pageSize", String(pageSize))
  const data = await apiGet<Record<string, unknown>>(`/api/modules?${search.toString()}`)
  const itemsRaw = Array.isArray(data.items) ? data.items : []
  const totalCount = nonNegativeInt(data.totalCount)
  const resolvedPageSize = nonNegativeInt(data.pageSize) || pageSize
  const totalPages =
    nonNegativeInt(data.totalPages) ||
    (totalCount === 0 ? 0 : Math.ceil(totalCount / resolvedPageSize))
  return {
    items: itemsRaw
      .map(mapModuleListItem)
      .filter((item): item is ProjectModuleListItem => item != null),
    pageNumber: nonNegativeInt(data.pageNumber) || pageNumber,
    pageSize: resolvedPageSize,
    totalCount,
    totalPages,
    hasPrevious: typeof data.hasPrevious === "boolean" ? data.hasPrevious : pageNumber > 1,
    hasNext: typeof data.hasNext === "boolean" ? data.hasNext : pageNumber < totalPages,
  }
}

export async function deleteWorkExperienceModuleLink(
  candidateId: number,
  workExperienceId: number,
  linkId: number,
): Promise<void> {
  await apiDelete(
    `/api/candidates/${candidateId}/work-experiences/${workExperienceId}/modules/${linkId}`,
  )
}
