import type {
  LinkedProjectFields,
  ProjectExperience,
  WorkExperience,
} from "@/lib/types/candidate"
import type {
  WorkExperienceProjectForService,
} from "@/types/question-generation"
import { PROJECT_TYPES, PUBLISH_PLATFORM_FILTER_OPTIONS } from "@/lib/types/project"
import {
  HORIZONTAL_DOMAINS,
  TECHNICAL_DOMAIN_HUMAN_LABELS,
  VERTICAL_DOMAINS,
  fetchProjectById,
  type ProjectDto,
} from "@/lib/services/projects-api"
import { fetchTechnicalAspects } from "@/lib/services/lookups-api"
import { normalizeProjectType } from "@/lib/utils/project-type-badge"
import { formatTeamSizeForService, readLinkedProjectPayloadValue } from "@/lib/utils/project-catalog-fields"
import { isQgValueMissing } from "@/lib/utils/qg-value"

const PROJECT_STATUS_FROM_API = ["Development", "Maintenance", "Closed"] as const
const PUBLISH_PLATFORM_FROM_NUM = PUBLISH_PLATFORM_FILTER_OPTIONS.map((o) => o.value)

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function parseIsoDate(v: unknown): Date | undefined {
  if (v == null) return undefined
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v
  if (typeof v !== "string") return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === "string") return item
      const r = asRecord(item)
      if (!r) return ""
      return String(
        r.name ?? r.label ?? r.techStackName ?? r.domainName ?? r.aspectName ?? item,
      )
    })
    .filter((s) => s.trim() !== "")
}

/** Resolve technical domain ints / labels from Candidate/Project API shapes. */
function parseTechnicalDomains(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === "number") {
        return TECHNICAL_DOMAIN_HUMAN_LABELS[item] ?? String(item)
      }
      if (typeof item === "string") {
        const trimmed = item.trim()
        if (trimmed === "") return ""
        const asInt = Number(trimmed)
        if (Number.isInteger(asInt) && String(asInt) === trimmed) {
          return TECHNICAL_DOMAIN_HUMAN_LABELS[asInt] ?? trimmed
        }
        return trimmed
      }
      const r = asRecord(item)
      if (!r) return ""
      if (typeof r.value === "number") {
        return (
          TECHNICAL_DOMAIN_HUMAN_LABELS[r.value] ??
          String(r.label ?? r.name ?? r.domainName ?? r.value)
        )
      }
      return String(r.name ?? r.label ?? r.domainName ?? "")
    })
    .filter((s) => s.trim() !== "")
}

function enumLabel(
  value: unknown,
  labels: readonly string[],
): string | null {
  if (typeof value === "number" && value >= 0 && value < labels.length) {
    return labels[value] ?? null
  }
  if (value == null) return null
  const s = String(value).trim()
  return s === "" ? null : s
}

/** Merge junction row + nested `project` graph from GET candidate APIs. */
export function parseLinkedProjectCatalogFromApi(
  raw: Record<string, unknown>,
): LinkedProjectFields {
  const nested = asRecord(raw.project) ?? raw
  const employer = asRecord(nested.employer)
  const minTeam =
    typeof nested.minTeamSize === "number"
      ? nested.minTeamSize
      : nested.minTeamSize != null
        ? Number(nested.minTeamSize)
        : null
  const maxTeam =
    typeof nested.maxTeamSize === "number"
      ? nested.maxTeamSize
      : nested.maxTeamSize != null
        ? Number(nested.maxTeamSize)
        : null

  const publishRaw = nested.publishPlatforms
  const publishPlatforms = Array.isArray(publishRaw)
    ? publishRaw.map((p) => {
        if (typeof p === "number") return PUBLISH_PLATFORM_FROM_NUM[p] ?? String(p)
        return String(p)
      })
    : []

  const downloadCountRaw = nested.downloadCount
  const downloadCount =
    typeof downloadCountRaw === "number"
      ? downloadCountRaw
      : downloadCountRaw != null
        ? Number(downloadCountRaw)
        : null

  return {
    employerName:
      nested.employerName != null
        ? String(nested.employerName)
        : employer?.name != null
          ? String(employer.name)
          : null,
    projectType: normalizeProjectType(nested.type ?? nested.projectType),
    status: enumLabel(nested.status, PROJECT_STATUS_FROM_API),
    teamSize: nested.teamSize != null ? String(nested.teamSize) : null,
    minTeamSize: Number.isFinite(minTeam as number) ? (minTeam as number) : null,
    maxTeamSize: Number.isFinite(maxTeam as number) ? (maxTeam as number) : null,
    techStacks: parseStringArray(nested.techStacks ?? nested.techStackNames),
    technicalAspects: parseStringArray(
      nested.technicalAspects ?? nested.aspectTypeLabels,
    ),
    technicalDomains: parseTechnicalDomains(nested.technicalDomains),
    horizontalDomains: parseStringArray(nested.horizontalDomains),
    verticalDomains: parseStringArray(nested.verticalDomains),
    description: nested.description != null ? String(nested.description) : null,
    latestUpdate:
      nested.latestUpdate != null
        ? String(nested.latestUpdate)
        : nested.notes != null
          ? String(nested.notes)
          : null,
    startDate: parseIsoDate(nested.startDate),
    endDate: parseIsoDate(nested.endDate),
    link:
      nested.link != null
        ? String(nested.link)
        : nested.projectLink != null
          ? String(nested.projectLink)
          : null,
    isPublished: typeof nested.isPublished === "boolean" ? nested.isPublished : null,
    publishPlatforms,
    downloadCount: Number.isFinite(downloadCount as number) ? (downloadCount as number) : null,
    clientLocations: parseStringArray(nested.clientLocations),
  }
}

function toIsoDate(value: Date | undefined | null): string | null {
  if (value == null) return null
  try {
    return value.toISOString()
  } catch {
    return null
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function stringArray(value: string[] | undefined): string[] {
  return value ?? []
}

export function mapLinkedProjectToServicePayload(
  project: LinkedProjectFields & {
    projectName: string
    contributionNotes: string | null
  },
): WorkExperienceProjectForService {
  return {
    projectName: emptyToNull(project.projectName) ?? project.projectName,
    contributionNotes: emptyToNull(project.contributionNotes),
    employerName: emptyToNull(project.employerName),
    projectType: emptyToNull(project.projectType),
    status: emptyToNull(project.status),
    teamSize: formatTeamSizeForService(
      project.teamSize,
      project.minTeamSize,
      project.maxTeamSize,
    ),
    minTeamSize: project.minTeamSize ?? null,
    maxTeamSize: project.maxTeamSize ?? null,
    techStacks: stringArray(project.techStacks),
    technicalAspects: stringArray(project.technicalAspects),
    technicalDomains: stringArray(project.technicalDomains),
    horizontalDomains: stringArray(project.horizontalDomains),
    verticalDomains: stringArray(project.verticalDomains),
    description: emptyToNull(project.description),
    latestUpdate: emptyToNull(project.latestUpdate),
    startDate: toIsoDate(project.startDate),
    endDate: toIsoDate(project.endDate),
    link: emptyToNull(project.link),
    publishPlatforms: stringArray(project.publishPlatforms),
    downloadCount: project.downloadCount ?? null,
    clientLocations: stringArray(project.clientLocations),
  }
}

/** For tests / debugging — read mapped payload value by api suffix. */
export function servicePayloadValueForApiSuffix(
  payload: WorkExperienceProjectForService,
  apiSuffix: string,
): unknown {
  const payloadKey = apiSuffix === "projectLink" ? "link" : apiSuffix
  return readLinkedProjectPayloadValue(
    {
      ...payload,
      teamSize: payload.teamSize != null ? String(payload.teamSize) : null,
      link: payload.link,
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
    },
    payloadKey,
  )
}

const PROJECT_STATUS_LABELS = ["Development", "Maintenance", "Closed"] as const
const VERTICAL_LABEL_BY_VALUE = new Map(VERTICAL_DOMAINS.map((d) => [d.value, d.label]))
const HORIZONTAL_LABEL_BY_VALUE = new Map(HORIZONTAL_DOMAINS.map((d) => [d.value, d.label]))

function formatTeamSizeDisplay(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null && min === max) return String(min)
  if (min != null && max != null) return `${min}-${max}`
  if (min != null) return String(min)
  if (max != null) return String(max)
  return null
}

function resolveDomainLabels(
  raw: number[] | undefined,
  labelByValue: Map<number, string> | readonly string[],
): string[] {
  if (!raw?.length) return []
  return raw
    .map((n) => {
      if (labelByValue instanceof Map) {
        return labelByValue.get(n) ?? String(n)
      }
      return labelByValue[n] ?? String(n)
    })
    .filter((s) => s.trim() !== "")
}

/**
 * Map GET /api/projects/{id} → linked-project catalog fields for Cold Caller / QG.
 * `technicalAspects`: prefer `aspectTypeLabels`; else resolve enum ints via lookup map.
 */
export function projectDtoToLinkedCatalogFields(
  dto: ProjectDto,
  technicalAspectLabelById?: Map<number, string>,
): LinkedProjectFields {
  const aspectTypeLabels = (dto.aspectTypeLabels ?? [])
    .map((s) => String(s).trim())
    .filter((s) => s !== "")

  let technicalAspects = aspectTypeLabels
  if (technicalAspects.length === 0 && (dto.technicalAspects?.length ?? 0) > 0) {
    technicalAspects = (dto.technicalAspects ?? [])
      .map((n) => {
        const label = technicalAspectLabelById?.get(n)
        return label != null && label.trim() !== "" ? label.trim() : ""
      })
      .filter((s) => s !== "")
  }

  const typeNum = dto.type ?? 0
  const statusNum = dto.status ?? 0
  const publishPlatforms = (dto.publishPlatforms ?? []).map(
    (n) => PUBLISH_PLATFORM_FROM_NUM[n] ?? String(n),
  )

  return {
    employerName: dto.employerName != null ? String(dto.employerName) : null,
    projectType: PROJECT_TYPES[typeNum] ?? normalizeProjectType(dto.type) ?? null,
    status: PROJECT_STATUS_LABELS[statusNum] ?? null,
    teamSize: formatTeamSizeDisplay(dto.minTeamSize, dto.maxTeamSize),
    minTeamSize: dto.minTeamSize ?? null,
    maxTeamSize: dto.maxTeamSize ?? null,
    techStacks: Array.isArray(dto.techStacks) ? dto.techStacks.map(String).filter((s) => s.trim() !== "") : [],
    technicalAspects,
    technicalDomains: resolveDomainLabels(dto.technicalDomains, TECHNICAL_DOMAIN_HUMAN_LABELS),
    horizontalDomains: resolveDomainLabels(dto.horizontalDomains, HORIZONTAL_LABEL_BY_VALUE),
    verticalDomains: resolveDomainLabels(dto.verticalDomains, VERTICAL_LABEL_BY_VALUE),
    description: dto.description != null ? String(dto.description) : null,
    latestUpdate: dto.latestUpdate != null ? String(dto.latestUpdate) : null,
    startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    link: dto.link != null ? String(dto.link) : null,
    isPublished: typeof dto.isPublished === "boolean" ? dto.isPublished : null,
    publishPlatforms,
    downloadCount: dto.downloadCount ?? null,
    clientLocations: Array.isArray(dto.clientLocations)
      ? dto.clientLocations.map(String).filter((s) => s.trim() !== "")
      : [],
  }
}

function pickScalar<T>(current: T | null | undefined, catalog: T | null | undefined): T | null | undefined {
  return isQgValueMissing(current) ? catalog : current
}

function pickStringArray(
  current: string[] | undefined,
  catalog: string[] | undefined,
): string[] | undefined {
  if ((current?.length ?? 0) > 0) return current
  return catalog
}

/** Fill missing linked-project catalog fields from GET project; keep junction / existing values. */
export function mergeProjectCatalogIntoProjectExperience(
  project: ProjectExperience,
  catalog: LinkedProjectFields,
  catalogProjectName?: string | null,
): ProjectExperience {
  const projectName =
    project.projectName?.trim() !== ""
      ? project.projectName
      : catalogProjectName?.trim()
        ? catalogProjectName
        : project.projectName

  return {
    ...project,
    projectName,
    employerName: pickScalar(project.employerName, catalog.employerName) ?? null,
    projectType: pickScalar(project.projectType, catalog.projectType) ?? null,
    status: pickScalar(project.status, catalog.status) ?? null,
    teamSize: pickScalar(project.teamSize, catalog.teamSize) ?? null,
    minTeamSize: pickScalar(project.minTeamSize, catalog.minTeamSize) ?? null,
    maxTeamSize: pickScalar(project.maxTeamSize, catalog.maxTeamSize) ?? null,
    techStacks: pickStringArray(project.techStacks, catalog.techStacks) ?? [],
    technicalAspects: pickStringArray(project.technicalAspects, catalog.technicalAspects) ?? [],
    technicalDomains: pickStringArray(project.technicalDomains, catalog.technicalDomains) ?? [],
    horizontalDomains: pickStringArray(project.horizontalDomains, catalog.horizontalDomains) ?? [],
    verticalDomains: pickStringArray(project.verticalDomains, catalog.verticalDomains) ?? [],
    description: pickScalar(project.description, catalog.description) ?? null,
    latestUpdate: pickScalar(project.latestUpdate, catalog.latestUpdate) ?? null,
    startDate:
      project.startDate == null || Number.isNaN(project.startDate.getTime())
        ? catalog.startDate
        : project.startDate,
    endDate:
      project.endDate == null || Number.isNaN(project.endDate.getTime())
        ? catalog.endDate
        : project.endDate,
    link: pickScalar(project.link, catalog.link) ?? null,
    isPublished: pickScalar(project.isPublished, catalog.isPublished) ?? null,
    publishPlatforms: pickStringArray(project.publishPlatforms, catalog.publishPlatforms) ?? [],
    downloadCount: pickScalar(project.downloadCount, catalog.downloadCount) ?? null,
    clientLocations: pickStringArray(project.clientLocations, catalog.clientLocations) ?? [],
  }
}

export function resolveLinkedProjectId(project: ProjectExperience): number | null {
  if (project.projectId != null && Number.isFinite(project.projectId) && project.projectId > 0) {
    return project.projectId
  }
  return null
}

/**
 * Fetch project catalog by `projectId` and merge into each WE project row
 * for Cold Caller value cards and QG sparse payload.
 */
export async function enrichWorkExperiencesWithProjectCatalog(
  workExperiences: WorkExperience[] | undefined,
): Promise<WorkExperience[]> {
  if (!workExperiences?.length) return workExperiences ?? []

  const ids = new Set<number>()
  for (const we of workExperiences) {
    for (const project of we.projects ?? []) {
      const id = resolveLinkedProjectId(project)
      if (id != null) ids.add(id)
    }
  }

  if (ids.size === 0) return workExperiences

  const dtoById = new Map<number, ProjectDto>()
  await Promise.all(
    [...ids].map(async (id) => {
      try {
        dtoById.set(id, await fetchProjectById(id))
      } catch {
        // Leave row unenriched — QG / UI treat catalog fields as missing.
      }
    }),
  )

  const needsAspectLookup = [...dtoById.values()].some((dto) => {
    const labels = (dto.aspectTypeLabels ?? []).filter((s) => String(s).trim() !== "")
    return labels.length === 0 && (dto.technicalAspects?.length ?? 0) > 0
  })

  let technicalAspectLabelById: Map<number, string> | undefined
  if (needsAspectLookup) {
    try {
      const items = await fetchTechnicalAspects()
      technicalAspectLabelById = new Map(items.map((item) => [item.id, item.name]))
    } catch {
      technicalAspectLabelById = undefined
    }
  }

  return workExperiences.map((we) => ({
    ...we,
    projects: (we.projects ?? []).map((project) => {
      const id = resolveLinkedProjectId(project)
      if (id == null) return project
      const dto = dtoById.get(id)
      if (!dto) return project
      return mergeProjectCatalogIntoProjectExperience(
        project,
        projectDtoToLinkedCatalogFields(dto, technicalAspectLabelById),
        dto.name,
      )
    }),
  }))
}
