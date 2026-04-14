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
  verticalDomains?: number[]
  horizontalDomains?: number[]
  technicalDomains?: number[]
  /** `TechnicalAspect` enum values (numbers per PROJECT-API-REFERENCE.md). */
  technicalAspects?: number[]
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
  verticalDomains: number[]
  horizontalDomains: number[]
  technicalDomains: number[]
  /** `TechnicalAspect` enum values from API (numbers). */
  technicalAspects: number[]
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
  verticalDomains?: number[] | null
  horizontalDomains?: number[] | null
  technicalDomains?: number[] | null
  /** `TechnicalAspect` enum values — API property name is `technicalAspects`, not `technicalAspectIds`. */
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
  notes?: string | null
  startDate?: string | null
  endDate?: string | null
  isPublished: boolean
  downloadCount?: number | null
  minTeamSize?: number | null
  maxTeamSize?: number | null
  techStackIds?: number[] | null
  verticalDomains?: number[] | null
  horizontalDomains?: number[] | null
  technicalDomains?: number[] | null
  /** `TechnicalAspect` enum values — API property name is `technicalAspects`, not `technicalAspectIds`. */
  technicalAspects?: number[] | null
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

// --- Domain enum constants (backend serializes as integers) ---

export const VERTICAL_DOMAIN_LABELS: Record<number, string> = {
  0: "Banking", 1: "Financial Services", 2: "Insurance", 3: "Healthcare",
  4: "Retail", 5: "E-commerce", 6: "Telecommunications", 7: "Manufacturing",
  8: "Automotive", 9: "Real Estate / Property Management",
  10: "Travel & Hospitality", 11: "Logistics & Supply Chain",
  12: "Energy & Utilities", 13: "Education / EdTech",
  14: "Government / Public Sector", 15: "Media & Entertainment",
  16: "Agriculture / AgriTech", 17: "Aviation",
  18: "Pharma / Life Sciences", 19: "Gaming",
}

export const HORIZONTAL_DOMAIN_LABELS: Record<number, string> = {
  0: "CRM (Customer Relationship Management)",
  1: "ERP (Enterprise Resource Planning)",
  2: "HR / HRMS", 3: "Finance & Accounting",
  4: "Identity & Access Management", 5: "Document Management",
  6: "Payment Processing", 7: "Analytics & Business Intelligence",
  8: "Marketing Automation", 9: "Customer Support / Helpdesk",
  10: "Notification Systems", 11: "Workflow / BPM",
  12: "Cloud Computing", 13: "AI & Machine Learning",
  14: "Internet of Things", 15: "Data Science & Big Data",
  16: "Cybersecurity", 17: "Blockchain", 18: "DevOps",
}

export const VERTICAL_DOMAINS: Array<{ value: number; label: string }> =
  Object.entries(VERTICAL_DOMAIN_LABELS).map(([k, v]) => ({ value: Number(k), label: v }))

export const HORIZONTAL_DOMAINS: Array<{ value: number; label: string }> =
  Object.entries(HORIZONTAL_DOMAIN_LABELS).map(([k, v]) => ({ value: Number(k), label: v }))

/** Authoritative list from GET /api/TechnicalDomains (value = enum ordinal, label = API display, often PascalCase). */
export type TechnicalDomainOption = { value: number; label: string }

/**
 * Human-readable labels; index matches backend TechnicalDomain enum (0–23).
 * API may send PascalCase names; UI uses these strings for display and form values.
 */
export const TECHNICAL_DOMAIN_HUMAN_LABELS: readonly string[] = [
  "Cloud Computing",
  "Artificial Intelligence (AI)",
  "Machine Learning (ML)",
  "Data Science & Analytics",
  "Big Data",
  "Cybersecurity",
  "DevOps",
  "Internet of Things (IoT)",
  "Blockchain",
  "Robotic Process Automation (RPA)",
  "API Management & Integration",
  "Microservices Architecture",
  "Containerization & Orchestration",
  "Edge Computing",
  "Augmented Reality (AR)",
  "Virtual Reality (VR)",
  "Mixed Reality (MR)",
  "Digital Transformation",
  "Low-Code / No-Code Platforms",
  "Enterprise Integration Platforms",
  "Identity & Access Management (IAM)",
  "Data Governance & Compliance",
  "Quantum Computing (Emerging)",
  "5G & Advanced Networking",
]

const HUMAN_TECHNICAL_DOMAIN_TO_INT = new Map<string, number>(
  TECHNICAL_DOMAIN_HUMAN_LABELS.map((label, i) => [label, i])
)

/** Dropdown options: value and label are the human string (stable for filters and POST body mapping). */
export function technicalDomainCatalogToSelectOptions(
  items: TechnicalDomainOption[]
): Array<{ value: string; label: string }> {
  return items.map((d) => {
    const human = TECHNICAL_DOMAIN_HUMAN_LABELS[d.value] ?? d.label
    return { value: human, label: human }
  })
}

let technicalDomainByValue = new Map<number, string>()
let technicalDomainByLabel = new Map<string, number>()

/** Replace in-memory technical domain maps (call after fetchTechnicalDomains). */
export function applyTechnicalDomainsCatalog(items: TechnicalDomainOption[]): void {
  technicalDomainByValue = new Map(items.map((i) => [i.value, i.label]))
  technicalDomainByLabel = new Map(items.map((i) => [i.label, i.value]))
}

let technicalDomainsCatalogFetched = false
let cachedTechnicalDomainList: TechnicalDomainOption[] = []

/** Fetch catalog once per session so mappers and label→int resolve correctly. */
export async function ensureTechnicalDomainsCatalogLoaded(): Promise<TechnicalDomainOption[]> {
  if (technicalDomainsCatalogFetched) return cachedTechnicalDomainList
  const items = await fetchTechnicalDomains().catch(() => [])
  applyTechnicalDomainsCatalog(items)
  cachedTechnicalDomainList = items
  technicalDomainsCatalogFetched = true
  return items
}

/** GET /api/TechnicalDomains — same shape as vertical/horizontal domain list endpoints. */
export async function fetchTechnicalDomains(): Promise<TechnicalDomainOption[]> {
  const res = await fetch(`${API_BASE_URL}/api/TechnicalDomains`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TechnicalDomains API: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as TechnicalDomainOption[]
  if (!Array.isArray(data)) return []
  return data
    .filter((row) => row && typeof row.value === "number" && typeof row.label === "string")
    .map((row) => ({ value: row.value, label: row.label }))
}

function resolveVerticalDomain(raw: number): string {
  return VERTICAL_DOMAIN_LABELS[raw] ?? String(raw)
}

function resolveHorizontalDomain(raw: number): string {
  return HORIZONTAL_DOMAIN_LABELS[raw] ?? String(raw)
}

function resolveTechnicalDomain(raw: number): string {
  const human = TECHNICAL_DOMAIN_HUMAN_LABELS[raw]
  if (human !== undefined) return human
  return technicalDomainByValue.get(raw) ?? String(raw)
}

/** Reverse lookup: display label → enum integer. */
const VERTICAL_LABEL_TO_INT = new Map(VERTICAL_DOMAINS.map((d) => [d.label, d.value]))
const HORIZONTAL_LABEL_TO_INT = new Map(HORIZONTAL_DOMAINS.map((d) => [d.label, d.value]))

export function verticalDomainLabelToInt(label: string): number | undefined {
  return VERTICAL_LABEL_TO_INT.get(label)
}
export function horizontalDomainLabelToInt(label: string): number | undefined {
  return HORIZONTAL_LABEL_TO_INT.get(label)
}
/**
 * Human label (preferred) or API PascalCase label → enum int.
 * Uses catalog from applyTechnicalDomainsCatalog for API names after GET /api/TechnicalDomains.
 */
export function technicalDomainLabelToInt(label: string): number | undefined {
  const fromHuman = HUMAN_TECHNICAL_DOMAIN_TO_INT.get(label)
  if (fromHuman !== undefined) return fromHuman
  return technicalDomainByLabel.get(label)
}

// --- List params (query string) — see PROJECT-FILTERS-API.md / ProjectFilterRequest ---

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
  /** Legacy lookup names → resolved to enum ints in page client. */
  technicalAspects: string[]
  /** Catalog type id strings → merged into `technicalAspects` query. */
  technicalAspectTypeIds: string[]
  techStacks: string[]
  completionDateStart: Date | null
  completionDateEnd: Date | null
  startEndDateStart: Date | null
  startEndDateEnd: Date | null
  startDateStart: Date | null
  startDateEnd: Date | null
  teamSizeMin: string
  teamSizeMax: string
  projectName: string
  projectLink: string
  isPublished: boolean | null
  publishPlatforms: string[]
  minDownloadCount: string
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
  /** Backend query key `technicalAspects` (enum ints, repeated). */
  technicalAspects?: number[]
  isPublished?: boolean
  publishPlatforms?: number[]
  minDownloadCount?: number
  maxDownloadCount?: number
  minTeamSize?: number
  maxTeamSize?: number
  startDate?: string
  endDate?: string
}

function toDateString(d: Date | null | undefined): string | undefined {
  if (!d) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function deriveListStartEndDates(filters: ProjectsListFilterInput): { startDate?: string; endDate?: string } {
  const startDate =
    toDateString(filters.startEndDateStart) ?? toDateString(filters.startDateStart) ?? undefined
  const endDate =
    toDateString(filters.startEndDateEnd) ?? toDateString(filters.completionDateEnd) ?? undefined
  return { startDate, endDate }
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
    /** Legacy aspect lookup ids + aspect type catalog ids → backend `technicalAspects` enum list. */
    technicalAspectEnumValues?: number[]
  } = {}
): FetchProjectsParams {
  const minTeamSize = filters.teamSizeMin?.trim() ? parseInt(filters.teamSizeMin, 10) : undefined
  const maxTeamSize = filters.teamSizeMax?.trim() ? parseInt(filters.teamSizeMax, 10) : undefined
  const minDownloadCount = filters.minDownloadCount?.trim() ? parseInt(filters.minDownloadCount, 10) : undefined

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

  const { startDate, endDate } = deriveListStartEndDates(filters)

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
    minTeamSize: minTeamSize !== undefined && !Number.isNaN(minTeamSize) ? minTeamSize : undefined,
    maxTeamSize: maxTeamSize !== undefined && !Number.isNaN(maxTeamSize) ? maxTeamSize : undefined,
    startDate,
    endDate,
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
    verticalDomains: (dto.verticalDomains ?? []).map(resolveVerticalDomain),
    horizontalDomains: (dto.horizontalDomains ?? []).map(resolveHorizontalDomain),
    technicalDomains: (dto.technicalDomains ?? []).map(resolveTechnicalDomain),
    technicalAspects: (dto.technicalAspects ?? []).map((v) => String(v)),
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
    verticalDomains: (dto.verticalDomains ?? []).map(resolveVerticalDomain),
    horizontalDomains: (dto.horizontalDomains ?? []).map(resolveHorizontalDomain),
    technicalDomains: (dto.technicalDomains ?? []).map(resolveTechnicalDomain),
    technicalAspects: (dto.technicalAspects ?? []).map((v) => String(v)),
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
  if (params.name) search.set("name", params.name)
  if (params.link) search.set("link", params.link)
  if (params.isPublished !== undefined) search.set("isPublished", String(params.isPublished))
  if (params.minDownloadCount != null) search.set("minDownloadCount", String(params.minDownloadCount))
  if (params.maxDownloadCount != null) search.set("maxDownloadCount", String(params.maxDownloadCount))
  if (params.minTeamSize != null) search.set("minTeamSize", String(params.minTeamSize))
  if (params.maxTeamSize != null) search.set("maxTeamSize", String(params.maxTeamSize))
  if (params.startDate) search.set("startDate", params.startDate)
  if (params.endDate) search.set("endDate", params.endDate)
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
  /** Merged `TechnicalAspect` enum ints (legacy lookup names + aspect type catalog ids). */
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
