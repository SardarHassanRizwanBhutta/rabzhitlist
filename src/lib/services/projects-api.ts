import type { Project, ProjectStatus, ProjectType } from "@/lib/types/project"
import type { PublishPlatform } from "@/lib/types/project"

import { API_BASE_URL } from "@/lib/config/api"

// --- API types (from Projects API Reference) ---

export interface ProjectListItemDto {
  id: number
  name: string
  employerId?: number | null
  employerName?: string | null
  employer?: { id: number; name: string } | null
  /** API uses number (0=Employer, 1=Academic, ...). */
  type?: number | null
  /** API uses number (0=Development, 1=Maintenance, 2=Closed). */
  status?: number | null
  link?: string | null
  description?: string | null
  notes?: string | null
  startDate?: string | null
  endDate?: string | null
  isPublished?: boolean
  downloadCount?: number | null
  minTeamSize?: number | null
  maxTeamSize?: number | null
  techStacks?: string[]
  verticalDomains?: string[]
  horizontalDomains?: string[]
  technicalAspects?: string[]
  publishPlatforms?: number[]
  clientLocations?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface ProjectDto {
  id: number
  employerId: number | null
  employerName: string | null
  name: string
  type: number | null
  status: number | null
  link: string | null
  description: string | null
  notes: string | null
  startDate: string | null
  endDate: string | null
  isPublished: boolean
  downloadCount: number | null
  minTeamSize: number | null
  maxTeamSize: number | null
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  publishPlatforms: number[]
  clientLocations: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateProjectDto {
  name: string
  employerId?: number | null
  type?: number | null
  status?: number | null
  link?: string | null
  description?: string | null
  notes?: string | null
  startDate?: string | null
  endDate?: string | null
  isPublished?: boolean
  downloadCount?: number | null
  minTeamSize?: number | null
  maxTeamSize?: number | null
  techStackIds?: number[] | null
  verticalDomainIds?: number[] | null
  horizontalDomainIds?: number[] | null
  technicalAspectIds?: number[] | null
  publishPlatforms?: number[] | null
  clientLocationIds?: number[] | null
}

export interface UpdateProjectDto {
  name: string
  employerId?: number | null
  type?: number | null
  status?: number | null
  link?: string | null
  description?: string | null
  notes?: string | null
  startDate?: string | null
  endDate?: string | null
  isPublished: boolean
  downloadCount?: number | null
  minTeamSize?: number | null
  maxTeamSize?: number | null
  techStackIds?: number[] | null
  verticalDomainIds?: number[] | null
  horizontalDomainIds?: number[] | null
  technicalAspectIds?: number[] | null
  publishPlatforms?: number[] | null
  clientLocationIds?: number[] | null
}

// --- Enum value maps (API uses numbers) ---

/** Maps backend project_type_enum (employer | academic | personal | freelance | open_source) to UI ProjectType. */
const PROJECT_TYPE_API_TO_UI: Record<string, ProjectType> = {
  employer: "Employer",
  academic: "Academic",
  personal: "Personal",
  freelance: "Freelance",
  openSource: "Open Source",
  open_source: "Open Source", // backend enum literal
}

const PROJECT_TYPE_UI_TO_NUM: Record<ProjectType, number> = {
  Employer: 0,
  Academic: 1,
  Personal: 2,
  Freelance: 3,
  "Open Source": 4,
}

const PROJECT_STATUS_API_TO_UI: Record<string, ProjectStatus> = {
  development: "Development",
  maintenance: "Maintenance",
  closed: "Closed",
}

const PROJECT_STATUS_UI_TO_NUM: Record<ProjectStatus, number> = {
  Development: 0,
  Maintenance: 1,
  Closed: 2,
}

const PUBLISH_PLATFORM_UI_TO_NUM: Record<PublishPlatform, number> = {
  "App Store": 0,
  "Play Store": 1,
  Web: 2,
  Desktop: 3,
}

const PUBLISH_PLATFORM_NUM_TO_UI: Record<number, PublishPlatform> = {
  0: "App Store",
  1: "Play Store",
  2: "Web",
  3: "Desktop",
}

// --- List params (query string) ---

export interface FetchProjectsParams {
  pageNumber: number
  pageSize: number
  employerId?: number
  employerTypes?: number[]
  clientLocationIds?: number[]
  techStackIds?: number[]
  verticalDomainIds?: number[]
  horizontalDomainIds?: number[]
  technicalAspectIds?: number[]
  minDownloadCount?: number
  minTeamSize?: number
  maxTeamSize?: number
  startDate?: string
  endDate?: string
}

/** Filters shape used to build list params (dates, team size, download count). ID-based filters require separate lookup. */
export interface ProjectsListFiltersLike {
  startDateStart: Date | null
  completionDateEnd: Date | null
  teamSizeMin: string
  teamSizeMax: string
  minDownloadCount: string
}

function toDateString(d: Date | null | undefined): string | undefined {
  if (!d) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function buildFetchProjectsParams(
  filters: ProjectsListFiltersLike,
  pageNumber: number,
  pageSize: number,
  options: {
    employerId?: number
    employerTypes?: number[]
    clientLocationIds?: number[]
    techStackIds?: number[]
    verticalDomainIds?: number[]
    horizontalDomainIds?: number[]
    technicalAspectIds?: number[]
  } = {}
): FetchProjectsParams {
  const minTeamSize = filters.teamSizeMin?.trim() ? parseInt(filters.teamSizeMin, 10) : undefined
  const maxTeamSize = filters.teamSizeMax?.trim() ? parseInt(filters.teamSizeMax, 10) : undefined
  const minDownloadCount = filters.minDownloadCount?.trim() ? parseInt(filters.minDownloadCount, 10) : undefined
  return {
    pageNumber,
    pageSize,
    startDate: toDateString(filters.startDateStart) ?? undefined,
    endDate: toDateString(filters.completionDateEnd) ?? undefined,
    minTeamSize: minTeamSize !== undefined && !isNaN(minTeamSize) ? minTeamSize : undefined,
    maxTeamSize: maxTeamSize !== undefined && !isNaN(maxTeamSize) ? maxTeamSize : undefined,
    minDownloadCount: minDownloadCount !== undefined && !isNaN(minDownloadCount) ? minDownloadCount : undefined,
    ...options,
  }
}

// --- Mappers: API -> Frontend Project ---

function formatTeamSize(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null && min === max) return String(min)
  if (min != null && max != null) return `${min}-${max}`
  if (min != null) return String(min)
  if (max != null) return String(max)
  return null
}

export function projectListItemDtoToProject(dto: ProjectListItemDto): Project {
  const typeNum = dto.type ?? 0
  const statusNum = dto.status ?? 0
  const statusStr = (["Development", "Maintenance", "Closed"] as const)[statusNum] ?? "Development"
  const typeStr = (["Employer", "Academic", "Personal", "Freelance", "Open Source"] as const)[typeNum] ?? "Employer"
  const clientLocations = dto.clientLocations ?? []
  const employerName = dto.employerName ?? dto.employer?.name ?? null
  return {
    id: String(dto.id),
    projectName: dto.name,
    employerName,
    employerId: dto.employerId ?? dto.employer?.id ?? undefined,
    clientLocation: clientLocations[0] ?? null,
    clientLocations,
    techStacks: dto.techStacks ?? [],
    verticalDomains: dto.verticalDomains ?? [],
    horizontalDomains: dto.horizontalDomains ?? [],
    technicalAspects: dto.technicalAspects ?? [],
    teamSize: formatTeamSize(dto.minTeamSize ?? null, dto.maxTeamSize ?? null),
    minTeamSize: dto.minTeamSize ?? undefined,
    maxTeamSize: dto.maxTeamSize ?? undefined,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    status: statusStr,
    description: dto.description ?? null,
    notes: dto.notes ?? null,
    projectLink: dto.link ?? null,
    projectType: typeStr,
    isPublished: dto.isPublished ?? false,
    publishPlatforms: (dto.publishPlatforms ?? []).map((n) => PUBLISH_PLATFORM_NUM_TO_UI[n] ?? "App Store"),
    downloadCount: dto.downloadCount ?? undefined,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
  }
}

export function projectDtoToProject(dto: ProjectDto): Project {
  const statusNum = dto.status ?? 0
  const typeNum = dto.type ?? 0
  const statusStr = (["Development", "Maintenance", "Closed"] as const)[statusNum] ?? "Development"
  const typeStr = (["Employer", "Academic", "Personal", "Freelance", "Open Source"] as const)[typeNum] ?? "Employer"
  const clientLocations = dto.clientLocations ?? []
  return {
    id: String(dto.id),
    projectName: dto.name,
    employerName: dto.employerName ?? null,
    clientLocation: clientLocations[0] ?? null,
    clientLocations,
    techStacks: dto.techStacks ?? [],
    verticalDomains: dto.verticalDomains ?? [],
    horizontalDomains: dto.horizontalDomains ?? [],
    technicalAspects: dto.technicalAspects ?? [],
    teamSize: formatTeamSize(dto.minTeamSize, dto.maxTeamSize),
    minTeamSize: dto.minTeamSize ?? undefined,
    maxTeamSize: dto.maxTeamSize ?? undefined,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    status: statusStr,
    description: dto.description ?? null,
    notes: dto.notes ?? null,
    projectLink: dto.link ?? null,
    projectType: typeStr,
    isPublished: dto.isPublished ?? false,
    publishPlatforms: (dto.publishPlatforms ?? []).map((n) => PUBLISH_PLATFORM_NUM_TO_UI[n] ?? "App Store"),
    downloadCount: dto.downloadCount ?? undefined,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    employerId: dto.employerId ?? undefined,
  }
}

// --- Build query string for list ---

function buildListQuery(params: FetchProjectsParams): string {
  const search = new URLSearchParams()
  search.set("pageNumber", String(params.pageNumber))
  search.set("pageSize", String(params.pageSize))
  if (params.employerId != null) search.set("employerId", String(params.employerId))
  if (params.minDownloadCount != null) search.set("minDownloadCount", String(params.minDownloadCount))
  if (params.minTeamSize != null) search.set("minTeamSize", String(params.minTeamSize))
  if (params.maxTeamSize != null) search.set("maxTeamSize", String(params.maxTeamSize))
  if (params.startDate) search.set("startDate", params.startDate)
  if (params.endDate) search.set("endDate", params.endDate)
  params.employerTypes?.forEach((id) => search.append("employerTypes", String(id)))
  params.clientLocationIds?.forEach((id) => search.append("clientLocationIds", String(id)))
  params.techStackIds?.forEach((id) => search.append("techStackIds", String(id)))
  params.verticalDomainIds?.forEach((id) => search.append("verticalDomainIds", String(id)))
  params.horizontalDomainIds?.forEach((id) => search.append("horizontalDomainIds", String(id)))
  params.technicalAspectIds?.forEach((id) => search.append("technicalAspectIds", String(id)))
  return search.toString()
}

// --- API calls ---

export async function fetchProjectsFiltered(
  params: FetchProjectsParams
): Promise<PagedResult<ProjectListItemDto>> {
  const query = buildListQuery(params)
  const url = `${API_BASE_URL}/api/projects?${query}`
  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch projects: ${response.status} — ${text}`)
  }
  return response.json()
}

export async function fetchProjectById(id: number): Promise<ProjectDto> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`)
  if (response.status === 404) throw new Error("Not found")
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch project: ${response.status} — ${text}`)
  }
  return response.json()
}

export async function createProject(body: CreateProjectDto): Promise<ProjectDto> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create project: ${response.status} — ${text}`)
  }
  return response.json()
}

export async function updateProject(id: number, body: UpdateProjectDto): Promise<ProjectDto> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (response.status === 404) throw new Error("Not found")
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to update project: ${response.status} — ${text}`)
  }
  return response.json()
}

export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, { method: "DELETE" })
  if (response.status === 404) throw new Error("Not found")
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to delete project: ${response.status} — ${text}`)
  }
}

// --- Build Create/Update DTOs from form data (for use by page/dialog) ---

export interface ProjectFormDataLike {
  projectName: string
  selectedEmployer: { id: number; name: string } | null
  projectType: string
  minTeamSize: string
  maxTeamSize: string
  startDate: Date | undefined
  endDate: Date | undefined
  status: string
  description: string
  notes: string
  projectLink: string
  isPublished: boolean
  publishPlatforms: string[]
  downloadCount: string
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
}

export interface CreateProjectOptions {
  employerId?: number | null
  techStackIds?: number[] | null
  verticalDomainIds?: number[] | null
  horizontalDomainIds?: number[] | null
  technicalAspectIds?: number[] | null
  clientLocationIds?: number[] | null
}

function parseOptionalInt(value: string): number | null {
  const t = value?.trim()
  if (!t) return null
  const num = parseInt(t, 10)
  return isNaN(num) ? null : num
}

export function buildCreateProjectDto(
  form: ProjectFormDataLike,
  options: CreateProjectOptions = {}
): CreateProjectDto {
  const min = parseOptionalInt(form.minTeamSize)
  const max = parseOptionalInt(form.maxTeamSize)
  const typeNum = form.projectType ? PROJECT_TYPE_UI_TO_NUM[form.projectType as ProjectType] ?? null : null
  const statusNum = form.status ? PROJECT_STATUS_UI_TO_NUM[form.status as ProjectStatus] ?? null : null
  const publishPlatforms = (form.publishPlatforms ?? [])
    .map((p) => PUBLISH_PLATFORM_UI_TO_NUM[p as PublishPlatform])
    .filter((n) => n !== undefined) as number[]

  return {
    name: form.projectName.trim(),
    employerId: options.employerId ?? null,
    type: typeNum,
    status: statusNum,
    link: form.projectLink?.trim() || null,
    description: form.description?.trim() || null,
    notes: form.notes?.trim() || null,
    startDate: toDateString(form.startDate),
    endDate: toDateString(form.endDate),
    isPublished: form.isPublished ?? false,
    downloadCount: form.downloadCount ? parseInt(form.downloadCount, 10) : null,
    minTeamSize: min !== null ? min : null,
    maxTeamSize: max !== null ? max : null,
    techStackIds: options.techStackIds ?? null,
    verticalDomainIds: options.verticalDomainIds ?? null,
    horizontalDomainIds: options.horizontalDomainIds ?? null,
    technicalAspectIds: options.technicalAspectIds ?? null,
    publishPlatforms: publishPlatforms.length ? publishPlatforms : null,
    clientLocationIds: options.clientLocationIds ?? null,
  }
}

export function buildUpdateProjectDto(
  form: ProjectFormDataLike,
  options: CreateProjectOptions & { isPublished: boolean } = { isPublished: false }
): UpdateProjectDto {
  const create = buildCreateProjectDto(form, options)
  return {
    ...create,
    isPublished: options.isPublished ?? form.isPublished ?? false,
  }
}
