import type { EmptyField, FieldSection, FieldType } from "@/types/cold-caller"
import type { GeneratedQuestion } from "@/types/cold-caller"
import type { LinkedProjectFields } from "@/lib/types/candidate"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPES,
  PUBLISH_PLATFORM_FILTER_OPTIONS,
  type ProjectStatus,
} from "@/lib/types/project"

function getProjectOptions(): { value: string; label: string }[] {
  return sampleProjects.map((project) => ({
    label: project.projectName,
    value: project.projectName,
  }))
}

function getEmployerOptions(): { value: string; label: string }[] {
  return sampleEmployers.map((employer) => ({
    label: employer.name,
    value: employer.name,
  }))
}

/** Payload property → apiFieldName suffix (when they differ). */
export const PROJECT_PAYLOAD_TO_API_SUFFIX: Record<string, string> = {
  link: "projectLink",
}

/** apiFieldName suffix → payload property on candidate / service payload. */
export const PROJECT_API_SUFFIX_TO_PAYLOAD: Record<string, string> = {
  projectLink: "link",
}

export const PROJECT_LINK_FIELD_SUFFIXES = ["projectName", "contributionNotes"] as const

export const PROJECT_CATALOG_FIELD_SUFFIXES = [
  "employerName",
  "projectType",
  "status",
  "teamSize",
  "techStacks",
  "technicalAspects",
  "technicalDomains",
  "horizontalDomains",
  "verticalDomains",
  "description",
  "latestUpdate",
  "startDate",
  "endDate",
  "projectLink",
  "publishPlatforms",
  "downloadCount",
] as const

export type ProjectCatalogApiSuffix = (typeof PROJECT_CATALOG_FIELD_SUFFIXES)[number]
export type ProjectLinkApiSuffix = (typeof PROJECT_LINK_FIELD_SUFFIXES)[number]

export const PROJECT_CATALOG_FIELD_LABELS: Record<
  ProjectLinkApiSuffix | ProjectCatalogApiSuffix,
  string
> = {
  projectName: "Name",
  contributionNotes: "Contribution",
  employerName: "Employer",
  projectType: "Project Type",
  status: "Status",
  teamSize: "Team Size",
  techStacks: "Tech Stacks",
  technicalAspects: "Technical Aspects",
  technicalDomains: "Technical Domains",
  horizontalDomains: "Horizontal Domains",
  verticalDomains: "Vertical Domains",
  description: "Description",
  latestUpdate: "Latest Update",
  startDate: "Start Date",
  endDate: "End Date",
  projectLink: "Project Link",
  publishPlatforms: "Publish Platforms",
  downloadCount: "Download Count",
}

/** Locked QG weights used by populated Project value cards. */
export const PROJECT_FIELD_PRIORITIES: Record<
  ProjectLinkApiSuffix | ProjectCatalogApiSuffix,
  number
> = {
  projectName: 4,
  contributionNotes: 1,
  employerName: 7.5,
  projectType: 1,
  status: 2.5,
  teamSize: 5,
  techStacks: 10,
  technicalAspects: 10,
  technicalDomains: 10,
  horizontalDomains: 10,
  verticalDomains: 10,
  description: 10,
  latestUpdate: 1,
  startDate: 2.5,
  endDate: 2.5,
  projectLink: 5,
  publishPlatforms: 1,
  downloadCount: 1,
}

const PROJECT_TYPE_OPTIONS = PROJECT_TYPES.map((t) => ({ value: t, label: t }))
const PROJECT_STATUS_OPTIONS = (Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map(
  (s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }),
)
const PUBLISH_PLATFORM_OPTIONS = PUBLISH_PLATFORM_FILTER_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}))

export type ProjectFieldDef = {
  payloadKey: string
  apiSuffix: ProjectLinkApiSuffix | ProjectCatalogApiSuffix
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
  onCreateEntity?: EmptyField["onCreateEntity"]
}

/** Stable field order shared by QG request projection and project UI rows. */
export const PROJECT_FIELD_DEFS: ProjectFieldDef[] = [
  {
    payloadKey: "projectName",
    apiSuffix: "projectName",
    label: PROJECT_CATALOG_FIELD_LABELS.projectName,
    type: "combobox",
    options: getProjectOptions(),
    onCreateEntity: "project",
  },
  {
    payloadKey: "contributionNotes",
    apiSuffix: "contributionNotes",
    label: PROJECT_CATALOG_FIELD_LABELS.contributionNotes,
    type: "textarea",
  },
  {
    payloadKey: "employerName",
    apiSuffix: "employerName",
    label: PROJECT_CATALOG_FIELD_LABELS.employerName,
    type: "combobox",
    options: getEmployerOptions(),
    onCreateEntity: "employer",
  },
  {
    payloadKey: "projectType",
    apiSuffix: "projectType",
    label: PROJECT_CATALOG_FIELD_LABELS.projectType,
    type: "select",
    options: PROJECT_TYPE_OPTIONS,
  },
  {
    payloadKey: "status",
    apiSuffix: "status",
    label: PROJECT_CATALOG_FIELD_LABELS.status,
    type: "select",
    options: PROJECT_STATUS_OPTIONS,
  },
  {
    payloadKey: "teamSize",
    apiSuffix: "teamSize",
    label: PROJECT_CATALOG_FIELD_LABELS.teamSize,
    type: "text",
  },
  {
    payloadKey: "techStacks",
    apiSuffix: "techStacks",
    label: PROJECT_CATALOG_FIELD_LABELS.techStacks,
    type: "multiselect",
  },
  {
    payloadKey: "technicalAspects",
    apiSuffix: "technicalAspects",
    label: PROJECT_CATALOG_FIELD_LABELS.technicalAspects,
    type: "multiselect",
  },
  {
    payloadKey: "technicalDomains",
    apiSuffix: "technicalDomains",
    label: PROJECT_CATALOG_FIELD_LABELS.technicalDomains,
    type: "multiselect",
  },
  {
    payloadKey: "horizontalDomains",
    apiSuffix: "horizontalDomains",
    label: PROJECT_CATALOG_FIELD_LABELS.horizontalDomains,
    type: "multiselect",
  },
  {
    payloadKey: "verticalDomains",
    apiSuffix: "verticalDomains",
    label: PROJECT_CATALOG_FIELD_LABELS.verticalDomains,
    type: "multiselect",
  },
  {
    payloadKey: "description",
    apiSuffix: "description",
    label: PROJECT_CATALOG_FIELD_LABELS.description,
    type: "textarea",
  },
  {
    payloadKey: "latestUpdate",
    apiSuffix: "latestUpdate",
    label: PROJECT_CATALOG_FIELD_LABELS.latestUpdate,
    type: "textarea",
  },
  {
    payloadKey: "startDate",
    apiSuffix: "startDate",
    label: PROJECT_CATALOG_FIELD_LABELS.startDate,
    type: "date",
  },
  {
    payloadKey: "endDate",
    apiSuffix: "endDate",
    label: PROJECT_CATALOG_FIELD_LABELS.endDate,
    type: "date",
  },
  {
    payloadKey: "link",
    apiSuffix: "projectLink",
    label: PROJECT_CATALOG_FIELD_LABELS.projectLink,
    type: "text",
  },
  {
    payloadKey: "publishPlatforms",
    apiSuffix: "publishPlatforms",
    label: PROJECT_CATALOG_FIELD_LABELS.publishPlatforms,
    type: "multiselect",
    options: PUBLISH_PLATFORM_OPTIONS,
  },
  {
    payloadKey: "downloadCount",
    apiSuffix: "downloadCount",
    label: PROJECT_CATALOG_FIELD_LABELS.downloadCount,
    type: "number",
  },
]

export function isProjectCatalogFieldMissing(
  payloadKey: string,
  value: unknown,
): boolean {
  if (payloadKey === "downloadCount") {
    return value === null || value === undefined
  }
  if (Array.isArray(value)) return value.length === 0
  if (value === null || value === undefined) return true
  if (typeof value === "string" && value.trim() === "") return true
  return false
}

export function readLinkedProjectPayloadValue(
  project: LinkedProjectFields,
  payloadKey: string,
): unknown {
  if (payloadKey === "teamSize") {
    if (project.teamSize != null && String(project.teamSize).trim() !== "") {
      return project.teamSize
    }
    if (project.minTeamSize != null || project.maxTeamSize != null) {
      return project.teamSize ?? `${project.minTeamSize ?? ""}-${project.maxTeamSize ?? ""}`
    }
    return null
  }
  return (project as Record<string, unknown>)[payloadKey]
}

export interface ProjectFieldPathContext {
  section: FieldSection
  /** e.g. projects[0] or workExperiences[1].projects[2] */
  fieldPathPrefix: string
  /** e.g. project_0 or work_experience_1_project_2 */
  apiPrefix: string
  parentIndex: number
  context?: string
}

export function buildLinkedProjectEmptyFields(ctx: ProjectFieldPathContext): EmptyField[] {
  const fields: EmptyField[] = []

  for (const def of PROJECT_FIELD_DEFS) {
    fields.push({
      fieldPath: `${ctx.fieldPathPrefix}.${def.payloadKey}`,
      apiFieldName: `${ctx.apiPrefix}_${def.apiSuffix}`,
      fieldLabel: def.label,
      fieldType: def.type,
      section: ctx.section,
      currentValue: null,
      parentIndex: ctx.parentIndex,
      context: ctx.context,
      options: def.options,
      onCreateEntity: def.onCreateEntity,
    })
  }

  return fields
}

export function collectMissingLinkedProjectFields(
  project: LinkedProjectFields,
  ctx: ProjectFieldPathContext,
): EmptyField[] {
  const fields: EmptyField[] = []

  for (const def of PROJECT_FIELD_DEFS) {
    const value = readLinkedProjectPayloadValue(project, def.payloadKey)
    if (!isProjectCatalogFieldMissing(def.payloadKey, value)) continue

    fields.push({
      fieldPath: `${ctx.fieldPathPrefix}.${def.payloadKey}`,
      apiFieldName: `${ctx.apiPrefix}_${def.apiSuffix}`,
      fieldLabel: def.label,
      fieldType: def.type,
      section: ctx.section,
      context: ctx.context,
      currentValue: value,
      parentIndex: ctx.parentIndex,
      options: def.options,
      onCreateEntity: def.onCreateEntity,
    })
  }

  return fields
}

export function isProjectLinkApiField(apiFieldName: string): boolean {
  return /_(projectName|contributionNotes)$/.test(apiFieldName)
}

export function splitProjectFields(fields: EmptyField[]): {
  linkFields: EmptyField[]
  catalogFields: EmptyField[]
} {
  const linkFields: EmptyField[] = []
  const catalogFields: EmptyField[] = []

  for (const field of fields) {
    if (isProjectLinkApiField(field.apiFieldName)) {
      linkFields.push(field)
    } else if (
      /^project_\d+_/.test(field.apiFieldName) ||
      /_project_\d+_/.test(field.apiFieldName)
    ) {
      catalogFields.push(field)
    } else {
      linkFields.push(field)
    }
  }

  return { linkFields, catalogFields }
}

export function catalogDetailsLabel(count: number): string {
  const noun = count === 1 ? "question" : "questions"
  return `Complete project details — ${count} ${noun}`
}

/** Fixed UI order for link fields (§ 4.3 / § 4.10) — not weight-sorted. */
export function sortProjectLinkQuestions(items: GeneratedQuestion[]): GeneratedQuestion[] {
  const bySuffix = (suffix: string) =>
    items.filter((q) => q.field.endsWith(`_${suffix}`))
  return PROJECT_LINK_FIELD_SUFFIXES.flatMap((suffix) => bySuffix(suffix))
}

export function sortProjectCatalogQuestions(
  items: GeneratedQuestion[],
  sortByPriority: (a: GeneratedQuestion, b: GeneratedQuestion) => number,
): GeneratedQuestion[] {
  return [...items].sort(sortByPriority)
}

/** Name → Contribution → catalog by priority (nested WE accordion + sorting helper). */
export function sortProjectAccordionQuestions(
  items: GeneratedQuestion[],
  sortByPriority: (a: GeneratedQuestion, b: GeneratedQuestion) => number,
): GeneratedQuestion[] {
  const catalog = items.filter(
    (q) =>
      !PROJECT_LINK_FIELD_SUFFIXES.some((suffix) => q.field.endsWith(`_${suffix}`)),
  )
  return [
    ...sortProjectLinkQuestions(items),
    ...sortProjectCatalogQuestions(catalog, sortByPriority),
  ]
}

export function formatTeamSizeForService(
  teamSize: string | null | undefined,
  minTeamSize?: number | null,
  maxTeamSize?: number | null,
): string | null {
  const trimmed = teamSize?.trim()
  if (trimmed) return trimmed
  if (minTeamSize == null && maxTeamSize == null) return null
  if (minTeamSize != null && maxTeamSize != null && minTeamSize === maxTeamSize) {
    return String(minTeamSize)
  }
  if (minTeamSize != null && maxTeamSize != null) return `${minTeamSize}-${maxTeamSize}`
  if (minTeamSize != null) return String(minTeamSize)
  if (maxTeamSize != null) return String(maxTeamSize)
  return null
}
