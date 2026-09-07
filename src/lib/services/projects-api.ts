import type { Project, ProjectStatus, ProjectType } from "@/lib/types/project"
import type { PublishPlatform } from "@/lib/types/project"
import { PROJECT_TYPES } from "@/lib/types/project"
import type { ProjectDataProgressResponse } from "@/lib/types/project-data-progress"

import { API_BASE_URL } from "@/lib/config/api"
import {
  ensureDomainCatalogsLoaded,
  fetchTechnicalDomains as fetchTechnicalDomainsLookup,
  type LookupItem,
} from "@/lib/services/lookups-api"
import { catalogToSelectOptions } from "@/lib/utils/domain-catalog"

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
  latestUpdate?: string | null
  startDate?: string | null
  endDate?: string | null
  isPublished?: boolean
  downloadCount?: number | null
  averageTeamSize?: number | null
  techStacks?: string[]
  verticalDomains?: number[]
  horizontalDomains?: number[]
  technicalDomains?: number[]
  /** Catalog ids from GET /api/TechnicalAspects. */
  technicalAspects?: number[]
  /**
   * Server-derived distinct `TechnicalAspectType.DisplayName` values from the
   * project's tech stacks. Read-only on the wire (no corresponding write field).
   */
  aspectTypeLabels?: string[]
  publishPlatforms?: number[]
  clientLocations?: string[]
  dataProgressPercentage?: number | null
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
  latestUpdate: string | null
  startDate: string | null
  endDate: string | null
  isPublished: boolean
  downloadCount: number | null
  averageTeamSize: number | null
  techStacks: string[]
  verticalDomains: number[]
  horizontalDomains: number[]
  technicalDomains: number[]
  /** Catalog ids from GET /api/TechnicalAspects. */
  technicalAspects: number[]
  /**
   * Server-derived distinct `TechnicalAspectType.DisplayName` values from the
   * project's tech stacks. Read-only on the wire (no corresponding write field).
   */
  aspectTypeLabels?: string[]
  publishPlatforms: number[]
  clientLocations: string[]
  dataProgressPercentage?: number | null
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
  latestUpdate?: string | null
  startDate?: string | null
  endDate?: string | null
  isPublished?: boolean
  downloadCount?: number | null
  averageTeamSize?: number | null
  techStackIds?: number[] | null
  verticalDomains?: number[] | null
  horizontalDomains?: number[] | null
  technicalDomains?: number[] | null
  /** Catalog ids from GET /api/TechnicalAspects. */
  technicalAspects?: number[] | null
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
  latestUpdate?: string | null
  startDate?: string | null
  endDate?: string | null
  isPublished: boolean
  downloadCount?: number | null
  averageTeamSize?: number | null
  techStackIds?: number[] | null
  verticalDomains?: number[] | null
  horizontalDomains?: number[] | null
  technicalDomains?: number[] | null
  /** Catalog ids from GET /api/TechnicalAspects. */
  technicalAspects?: number[] | null
  publishPlatforms?: number[] | null
  clientLocationIds?: number[] | null
}

// --- Enum value maps (API uses numbers) ---

/** Maps UI ProjectType → backend project_type enum int (0..2). */
const PROJECT_TYPE_UI_TO_NUM: Record<ProjectType, number> = {
  Employer: 0,
  Freelance: 1,
  Independent: 2,
}

const PROJECT_STATUS_API_TO_UI: Record<string, ProjectStatus> = {
  development: "Development",
  maintenance: "Maintenance",
  closed: "Closed",
}

export const PROJECT_STATUS_UI_TO_NUM: Record<ProjectStatus, number> = {
  Development: 0,
  Maintenance: 1,
  Closed: 2,
}

export const PUBLISH_PLATFORM_UI_TO_NUM: Record<PublishPlatform, number> = {
  "App Store": 0,
  "Play Store": 1,
  Web: 2,
  Desktop: 3,
  Cloud: 4,
  IoT: 5,
  Embedded: 6,
}

const PUBLISH_PLATFORM_NUM_TO_UI: Record<number, PublishPlatform> = {
  0: "App Store",
  1: "Play Store",
  2: "Web",
  3: "Desktop",
  4: "Cloud",
  5: "IoT",
  6: "Embedded",
}

// --- Domain catalogs (GET /api/VerticalDomains, HorizontalDomains, TechnicalDomains) ---

export type TechnicalDomainOption = LookupItem

export function technicalDomainCatalogToSelectOptions(
  items: LookupItem[],
): Array<{ value: string; label: string }> {
  return catalogToSelectOptions(items)
}

/** Fetch the four domain/aspect catalogs once per session. */
export async function ensureTechnicalDomainsCatalogLoaded(): Promise<LookupItem[]> {
  const catalogs = await ensureDomainCatalogsLoaded()
  return catalogs.technicalDomains
}

export async function fetchTechnicalDomains(): Promise<LookupItem[]> {
  return fetchTechnicalDomainsLookup()
}

function catalogIdsToFormValues(raw: number[] | undefined): string[] {
  return (raw ?? []).map((id) => String(id))
}

// --- List params (query string) — see ProjectFilterChanges.md / ProjectFilterRequest ---

/** Filter dialog state mirrored for GET /api/projects (camelCase query keys). */
export interface ProjectsListFilterInput {
  status: ProjectStatus[]
  projectTypes: string[]
  /** Employer API ids as strings. */
  employers: string[]
  clientLocations: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalDomains: string[]
  /** Catalog id strings from GET /api/TechnicalAspects. */
  technicalAspects: string[]
  /** Catalog type id strings (client-side aspect label filter until API supports type ids). */
  technicalAspectTypeIds: string[]
  /** Per aspect-type id: selected stack names for scoped pickers (union → `techStacks` on apply). */
  techStacksByAspectType: Record<string, string[]>
  /** Flat stack names: legacy mode, or derived union when aspect types are selected. */
  techStacks: string[]
  completionDateStart: Date | null
  completionDateEnd: Date | null
  startEndDateStart: Date | null
  startEndDateEnd: Date | null
  startDateStart: Date | null
  startDateEnd: Date | null
  averageTeamSizeMin: string
  averageTeamSizeMax: string
  projectName: string
  projectLink: string
  isPublished: boolean | null
  publishPlatforms: string[]
  minDownloadCount: string
  /** Stored completion filter 0–100 (`dataProgressMin` / `dataProgressMax` in UI). */
  dataProgressMin: string
  dataProgressMax: string
}

export interface FetchProjectsParams {
  pageNumber: number
  pageSize: number
  name?: string
  link?: string
  projectTypes?: number[]
  projectStatuses?: number[]
  employerIds?: number[]
  clientLocationIds?: number[]
  techStackIds?: number[]
  verticalDomains?: number[]
  horizontalDomains?: number[]
  technicalDomains?: number[]
  /** Catalog ids for query key `technicalAspects`. */
  technicalAspects?: number[]
  isPublished?: boolean
  publishPlatforms?: number[]
  minDownloadCount?: number
  maxDownloadCount?: number
  averageTeamSizeMin?: number
  averageTeamSizeMax?: number
  /** Inclusive lower bound on `EndDate` (requires non-null EndDate). */
  completionFrom?: string
  /** Inclusive upper bound on `EndDate` (requires non-null EndDate). */
  completionTo?: string
  /** Inclusive lower bound on `StartDate` (requires non-null StartDate). */
  projectStartFrom?: string
  /** Inclusive upper bound on `StartDate` (requires non-null StartDate). */
  projectStartTo?: string
  /** Active-window overlap: lower bound (see ProjectFilterChanges.md). */
  activeWindowFrom?: string
  /** Active-window overlap: upper bound. */
  activeWindowTo?: string
  minDataProgressPercentage?: number
  maxDataProgressPercentage?: number
}

function parseDataProgressPercentage(value: unknown): number | null {
  if (typeof value === "number") return value
  if (value != null) {
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }
  return null
}

function toDateString(d: Date | null | undefined): string | undefined {
  if (!d) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function buildFetchProjectsParams(
  filters: ProjectsListFilterInput,
  pageNumber: number,
  pageSize: number,
  options: {
    clientLocationIds?: number[]
    techStackIds?: number[]
    verticalDomains?: number[]
    horizontalDomains?: number[]
    technicalDomains?: number[]
    /** Catalog ids from GET /api/TechnicalAspects. */
    technicalAspectEnumValues?: number[]
  } = {}
): FetchProjectsParams {
  const averageTeamSizeMin = filters.averageTeamSizeMin?.trim()
    ? parseInt(filters.averageTeamSizeMin, 10)
    : undefined
  const averageTeamSizeMax = filters.averageTeamSizeMax?.trim()
    ? parseInt(filters.averageTeamSizeMax, 10)
    : undefined
  const minDownloadCount = filters.minDownloadCount?.trim() ? parseInt(filters.minDownloadCount, 10) : undefined
  const minDataProgress = filters.dataProgressMin?.trim()
    ? parseFloat(filters.dataProgressMin)
    : undefined
  const maxDataProgress = filters.dataProgressMax?.trim()
    ? parseFloat(filters.dataProgressMax)
    : undefined

  const name = filters.projectName?.trim() ? filters.projectName.trim() : undefined
  const link = filters.projectLink?.trim() ? filters.projectLink.trim() : undefined

  const projectTypes = filters.projectTypes
    .map((t) => PROJECT_TYPE_UI_TO_NUM[t as ProjectType])
    .filter((n): n is number => n !== undefined)

  const projectStatuses = filters.status
    .map((s) => PROJECT_STATUS_UI_TO_NUM[s])
    .filter((n): n is number => n !== undefined)

  const employerIds = filters.employers
    .map((e) => parseInt(e, 10))
    .filter((n) => !Number.isNaN(n))

  const publishPlatforms = filters.publishPlatforms
    .map((p) => PUBLISH_PLATFORM_UI_TO_NUM[p as PublishPlatform])
    .filter((n): n is number => n !== undefined)

  const completionFrom = toDateString(filters.completionDateStart)
  const completionTo = toDateString(filters.completionDateEnd)
  const projectStartFrom = toDateString(filters.startDateStart)
  const projectStartTo = toDateString(filters.startDateEnd)
  const activeWindowFrom = toDateString(filters.startEndDateStart)
  const activeWindowTo = toDateString(filters.startEndDateEnd)

  return {
    pageNumber,
    pageSize,
    name,
    link,
    projectTypes: projectTypes.length ? projectTypes : undefined,
    projectStatuses: projectStatuses.length ? projectStatuses : undefined,
    employerIds: employerIds.length ? employerIds : undefined,
    clientLocationIds: options.clientLocationIds?.length ? options.clientLocationIds : undefined,
    techStackIds: options.techStackIds?.length ? options.techStackIds : undefined,
    verticalDomains: options.verticalDomains?.length ? options.verticalDomains : undefined,
    horizontalDomains: options.horizontalDomains?.length ? options.horizontalDomains : undefined,
    technicalDomains: options.technicalDomains?.length ? options.technicalDomains : undefined,
    technicalAspects: options.technicalAspectEnumValues?.length ? options.technicalAspectEnumValues : undefined,
    isPublished: filters.isPublished === null ? undefined : filters.isPublished,
    publishPlatforms: publishPlatforms.length ? publishPlatforms : undefined,
    minDownloadCount: minDownloadCount !== undefined && !Number.isNaN(minDownloadCount) ? minDownloadCount : undefined,
    averageTeamSizeMin:
      averageTeamSizeMin !== undefined && !Number.isNaN(averageTeamSizeMin)
        ? averageTeamSizeMin
        : undefined,
    averageTeamSizeMax:
      averageTeamSizeMax !== undefined && !Number.isNaN(averageTeamSizeMax)
        ? averageTeamSizeMax
        : undefined,
    completionFrom,
    completionTo,
    projectStartFrom,
    projectStartTo,
    activeWindowFrom,
    activeWindowTo,
    minDataProgressPercentage:
      minDataProgress !== undefined && !Number.isNaN(minDataProgress)
        ? minDataProgress
        : undefined,
    maxDataProgressPercentage:
      maxDataProgress !== undefined && !Number.isNaN(maxDataProgress)
        ? maxDataProgress
        : undefined,
  }
}

// --- Mappers: API -> Frontend Project ---

function formatTeamSize(averageTeamSize: number | null | undefined): string | null {
  if (averageTeamSize == null) return null
  return String(averageTeamSize)
}

const PROJECT_STATUS_BY_NUM: readonly ProjectStatus[] = ["Development", "Maintenance", "Closed"]

/** API status enum int → UI label. Unset (`null`) stays unset; unknown ints are dropped. */
function projectStatusFromApiNum(value: number | null | undefined): ProjectStatus | null {
  if (value == null) return null
  return PROJECT_STATUS_BY_NUM[value] ?? null
}

/** API type enum int → UI label. Unset (`null`) stays unset; unknown ints are dropped. */
function projectTypeFromApiNum(value: number | null | undefined): ProjectType | null {
  if (value == null) return null
  return PROJECT_TYPES[value] ?? null
}

export function projectListItemDtoToProject(dto: ProjectListItemDto): Project {
  const statusStr = projectStatusFromApiNum(dto.status)
  const typeStr = projectTypeFromApiNum(dto.type)
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
    verticalDomains: catalogIdsToFormValues(dto.verticalDomains),
    horizontalDomains: catalogIdsToFormValues(dto.horizontalDomains),
    technicalDomains: catalogIdsToFormValues(dto.technicalDomains),
    technicalAspects: catalogIdsToFormValues(dto.technicalAspects),
    aspectTypeLabels: dto.aspectTypeLabels ?? [],
    teamSize: formatTeamSize(dto.averageTeamSize ?? null),
    averageTeamSize: dto.averageTeamSize ?? undefined,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    status: statusStr,
    description: dto.description ?? null,
    latestUpdate: dto.latestUpdate ?? null,
    projectLink: dto.link ?? null,
    projectType: typeStr,
    isPublished: dto.isPublished ?? false,
    publishPlatforms: (dto.publishPlatforms ?? []).map((n) => PUBLISH_PLATFORM_NUM_TO_UI[n] ?? "App Store"),
    downloadCount: dto.downloadCount ?? undefined,
    dataProgressPercentage: parseDataProgressPercentage(dto.dataProgressPercentage),
    createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
  }
}

export function projectDtoToProject(dto: ProjectDto): Project {
  const statusStr = projectStatusFromApiNum(dto.status)
  const typeStr = projectTypeFromApiNum(dto.type)
  const clientLocations = dto.clientLocations ?? []
  return {
    id: String(dto.id),
    projectName: dto.name,
    employerName: dto.employerName ?? null,
    clientLocation: clientLocations[0] ?? null,
    clientLocations,
    techStacks: dto.techStacks ?? [],
    verticalDomains: catalogIdsToFormValues(dto.verticalDomains),
    horizontalDomains: catalogIdsToFormValues(dto.horizontalDomains),
    technicalDomains: catalogIdsToFormValues(dto.technicalDomains),
    technicalAspects: catalogIdsToFormValues(dto.technicalAspects),
    aspectTypeLabels: dto.aspectTypeLabels ?? [],
    teamSize: formatTeamSize(dto.averageTeamSize),
    averageTeamSize: dto.averageTeamSize ?? undefined,
    startDate: dto.startDate ? new Date(dto.startDate) : null,
    endDate: dto.endDate ? new Date(dto.endDate) : null,
    status: statusStr,
    description: dto.description ?? null,
    latestUpdate: dto.latestUpdate ?? null,
    projectLink: dto.link ?? null,
    projectType: typeStr,
    isPublished: dto.isPublished ?? false,
    publishPlatforms: (dto.publishPlatforms ?? []).map((n) => PUBLISH_PLATFORM_NUM_TO_UI[n] ?? "App Store"),
    downloadCount: dto.downloadCount ?? undefined,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    employerId: dto.employerId ?? undefined,
    dataProgressPercentage: parseDataProgressPercentage(dto.dataProgressPercentage),
  }
}

// --- Build query string for list ---

function buildListQuery(params: FetchProjectsParams): string {
  const search = new URLSearchParams()
  search.set("pageNumber", String(params.pageNumber))
  search.set("pageSize", String(params.pageSize))
  if (params.name) search.set("name", params.name)
  if (params.link) search.set("link", params.link)
  if (params.isPublished !== undefined) search.set("isPublished", String(params.isPublished))
  if (params.minDownloadCount != null) search.set("minDownloadCount", String(params.minDownloadCount))
  if (params.maxDownloadCount != null) search.set("maxDownloadCount", String(params.maxDownloadCount))
  if (params.averageTeamSizeMin != null) {
    search.set("averageTeamSizeMin", String(params.averageTeamSizeMin))
  }
  if (params.averageTeamSizeMax != null) {
    search.set("averageTeamSizeMax", String(params.averageTeamSizeMax))
  }
  if (params.completionFrom) search.set("completionFrom", params.completionFrom)
  if (params.completionTo) search.set("completionTo", params.completionTo)
  if (params.projectStartFrom) search.set("projectStartFrom", params.projectStartFrom)
  if (params.projectStartTo) search.set("projectStartTo", params.projectStartTo)
  if (params.activeWindowFrom) search.set("activeWindowFrom", params.activeWindowFrom)
  if (params.activeWindowTo) search.set("activeWindowTo", params.activeWindowTo)
  params.employerIds?.forEach((id) => search.append("employerIds", String(id)))
  params.projectTypes?.forEach((v) => search.append("projectTypes", String(v)))
  params.projectStatuses?.forEach((v) => search.append("projectStatuses", String(v)))
  params.publishPlatforms?.forEach((v) => search.append("publishPlatforms", String(v)))
  params.clientLocationIds?.forEach((id) => search.append("clientLocationIds", String(id)))
  params.techStackIds?.forEach((id) => search.append("techStackIds", String(id)))
  params.verticalDomains?.forEach((v) => search.append("verticalDomains", String(v)))
  params.horizontalDomains?.forEach((v) => search.append("horizontalDomains", String(v)))
  params.technicalDomains?.forEach((v) => search.append("technicalDomains", String(v)))
  params.technicalAspects?.forEach((id) => search.append("technicalAspects", String(id)))
  if (params.minDataProgressPercentage != null) {
    search.set("minDataProgressPercentage", String(params.minDataProgressPercentage))
  }
  if (params.maxDataProgressPercentage != null) {
    search.set("maxDataProgressPercentage", String(params.maxDataProgressPercentage))
  }
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

export async function fetchProjectDataProgress(
  projectId: number,
  signal?: AbortSignal,
): Promise<ProjectDataProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/data-progress`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  })
  if (response.status === 404) throw new Error("Not found")
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Project data progress failed (${response.status}): ${text}`)
  }
  return response.json() as Promise<ProjectDataProgressResponse>
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
  averageTeamSize: string
  startDate: Date | undefined
  endDate: Date | undefined
  status: string
  description: string
  latestUpdate: string
  projectLink: string
  isPublished: boolean
  publishPlatforms: string[]
  downloadCount: string
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalDomains: string[]
  technicalAspects: string[]
  /** Prototype / future API: fixed aspect type ids as strings; optional on submit. */
  technicalAspectTypeIds?: string[]
  techStacksByAspectType?: Record<string, string[]>
}

export interface CreateProjectOptions {
  employerId?: number | null
  techStackIds?: number[] | null
  verticalDomains?: number[] | null
  horizontalDomains?: number[] | null
  technicalDomains?: number[] | null
  /** Catalog ids from GET /api/TechnicalAspects. */
  technicalAspects?: number[] | null
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
  const averageTeamSize = parseOptionalInt(form.averageTeamSize)
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
    latestUpdate: form.latestUpdate?.trim() || null,
    startDate: toDateString(form.startDate),
    endDate: toDateString(form.endDate),
    isPublished: form.isPublished ?? false,
    downloadCount: form.downloadCount ? parseInt(form.downloadCount, 10) : null,
    averageTeamSize: averageTeamSize !== null ? averageTeamSize : null,
    techStackIds: options.techStackIds ?? null,
    verticalDomains: options.verticalDomains ?? null,
    horizontalDomains: options.horizontalDomains ?? null,
    technicalDomains: options.technicalDomains ?? null,
    technicalAspects: options.technicalAspects ?? null,
    publishPlatforms: publishPlatforms.length ? publishPlatforms : null,
    clientLocationIds: options.clientLocationIds ?? null,
  }
}

export function buildUpdateProjectDto(
  form: ProjectFormDataLike,
  options: CreateProjectOptions = {}
): UpdateProjectDto {
  const create = buildCreateProjectDto(form, options)
  return {
    ...create,
    /** Always from form — do not pass a stale snapshot from when the dialog opened (breaks Published App toggle). */
    isPublished: form.isPublished ?? false,
  }
}
