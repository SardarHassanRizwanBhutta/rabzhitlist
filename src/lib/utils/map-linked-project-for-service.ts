import type { LinkedProjectFields } from "@/lib/types/candidate"
import type {
  WorkExperienceProjectForService,
} from "@/types/question-generation"
import { PUBLISH_PLATFORM_FILTER_OPTIONS } from "@/lib/types/project"
import { TECHNICAL_DOMAIN_HUMAN_LABELS } from "@/lib/services/projects-api"
import { normalizeProjectType } from "@/lib/utils/project-type-badge"
import { formatTeamSizeForService, readLinkedProjectPayloadValue } from "@/lib/utils/project-catalog-fields"

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
