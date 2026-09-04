/**
 * Map Call Notes Extract rows → Employer / Project creation dialog prefill.
 * Used when "+ Add New Employer/Project" is opened from the extract review lookup UI.
 */

import type { EmployerFormData, LayoffFormData, EmployerLocationFormData } from "@/components/employer-creation-dialog"
import type { ProjectFormData } from "@/components/project-creation-dialog"
import type { ProjectExperience, WorkExperience } from "@/components/candidate-creation-dialog"
import type { AllowedEmptyField, CallNotesExtraction } from "@/types/call-notes-extraction"
import { extractedNameFromValue } from "@/lib/utils/call-notes-extract-lookup"
import { parseCatalogFieldPath } from "@/lib/utils/call-notes-extract-catalog"
import {
  EMPLOYER_STATUS_DB_LABELS,
  EMPLOYER_STATUS_DISPLAY_TO_DB,
  EMPLOYER_TYPE_DISPLAY_TO_DB,
  LAYOFF_REASON_DB_LABELS,
  LAYOFF_REASON_DISPLAY_TO_DB,
  type EmployerStatus,
  type EmployerStatusDb,
  type EmployerType,
  type EmployerTypeDb,
  type LayoffReason,
  type LayoffReasonDb,
} from "@/lib/types/employer"
import { PROJECT_STATUS_LABELS, PROJECT_TYPES, type ProjectStatus } from "@/lib/types/project"

type FieldOption = NonNullable<AllowedEmptyField["options"]>[number]

function parseIsoDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

function resolveOptionValue(raw: string, options?: FieldOption[]): string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const lower = trimmed.toLowerCase()
  if (options?.length) {
    for (const opt of options) {
      if (opt.value.toLowerCase() === lower || opt.label.toLowerCase() === lower) {
        return opt.value
      }
    }
  }
  return trimmed
}

function resolveMultiselectValues(value: unknown, options?: FieldOption[]): string[] {
  const arr = Array.isArray(value)
    ? value.map((v) => String(v).trim()).filter(Boolean)
    : typeof value === "string" && value.trim()
      ? [value.trim()]
      : []
  return arr
    .map((item) => resolveOptionValue(item, options))
    .filter((v): v is string => Boolean(v))
}

function displayToEmployerStatusDb(label: string): EmployerStatusDb | null {
  const trimmed = label.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  for (const [db, display] of Object.entries(EMPLOYER_STATUS_DB_LABELS) as [
    EmployerStatusDb,
    string,
  ][]) {
    if (display.toLowerCase() === lower) return db
  }
  if (trimmed in EMPLOYER_STATUS_DISPLAY_TO_DB) {
    return EMPLOYER_STATUS_DISPLAY_TO_DB[trimmed as EmployerStatus]
  }
  return null
}

function displayToEmployerTypeDb(label: string): EmployerTypeDb | null {
  const trimmed = label.trim()
  if (!trimmed) return null
  if (trimmed in EMPLOYER_TYPE_DISPLAY_TO_DB) {
    return EMPLOYER_TYPE_DISPLAY_TO_DB[trimmed as EmployerType]
  }
  const lower = trimmed.toLowerCase()
  for (const [display, db] of Object.entries(EMPLOYER_TYPE_DISPLAY_TO_DB) as [
    EmployerType,
    EmployerTypeDb,
  ][]) {
    if (display.toLowerCase() === lower) return db
  }
  return null
}

function displayToLayoffReasonDb(label: string): LayoffReasonDb | null {
  const trimmed = label.trim()
  if (!trimmed) return null
  if (trimmed in LAYOFF_REASON_DISPLAY_TO_DB) {
    return LAYOFF_REASON_DISPLAY_TO_DB[trimmed as LayoffReason]
  }
  const lower = trimmed.toLowerCase()
  for (const [db, display] of Object.entries(LAYOFF_REASON_DB_LABELS) as [
    LayoffReasonDb,
    string,
  ][]) {
    if (display.toLowerCase() === lower) return db
  }
  return null
}

function displayToProjectStatus(label: string): ProjectStatus | null {
  const trimmed = label.trim()
  if (!trimmed) return null
  if (trimmed in PROJECT_STATUS_LABELS) return trimmed as ProjectStatus
  const lower = trimmed.toLowerCase()
  for (const [key, display] of Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]) {
    if (display.toLowerCase() === lower || key.toLowerCase() === lower) return key
  }
  return null
}

function displayToProjectType(label: string): string | null {
  const trimmed = label.trim()
  if (!trimmed) return null
  if (PROJECT_TYPES.includes(trimmed as (typeof PROJECT_TYPES)[number])) return trimmed
  const lower = trimmed.toLowerCase()
  const match = PROJECT_TYPES.find((t) => t.toLowerCase() === lower)
  return match ?? null
}

function ensureOfficeRow(): EmployerLocationFormData {
  return {
    id: crypto.randomUUID(),
    country: "",
    city: "",
    address: "",
    isHeadquarters: false,
  }
}

function ensureLayoffRow(): LayoffFormData {
  return {
    id: crypto.randomUUID(),
    layoffDate: undefined,
    numberOfEmployeesLaidOff: "",
    reason: "cost_reduction",
    reasonOther: "",
  }
}

export function buildEmployerCreatePrefillFromExtractRows(
  rows: CallNotesExtraction[],
  selectedPaths: ReadonlySet<string>,
  workExperienceId: string,
  metaByPath: ReadonlyMap<string, AllowedEmptyField>,
): Partial<EmployerFormData> {
  const prefill: Partial<EmployerFormData> = {}
  const officeRows = new Map<number, EmployerLocationFormData>()
  let layoffRow: LayoffFormData | null = null

  const officeAt = (indexRaw: string | undefined): EmployerLocationFormData => {
    const parsed = Number.parseInt(indexRaw ?? "0", 10)
    const index = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
    let row = officeRows.get(index)
    if (!row) {
      row = ensureOfficeRow()
      officeRows.set(index, row)
    }
    return row
  }

  for (const row of rows) {
    if (!selectedPaths.has(row.fieldPath)) continue

    const parsed = parseCatalogFieldPath(row.fieldPath)
    if (!parsed || parsed.workExperienceId !== workExperienceId || parsed.projectId) {
      continue
    }

    const meta = metaByPath.get(row.fieldPath)

    if (parsed.property === "employerName") {
      const name = extractedNameFromValue(row.value)
      if (name) prefill.name = name
      continue
    }

    if (parsed.kind === "employer_scalar") {
      switch (parsed.property) {
        case "headcount": {
          const n =
            typeof row.value === "number"
              ? row.value
              : Number(String(row.value).replace(/,/g, "").trim())
          if (Number.isFinite(n)) prefill.headcount = String(n)
          break
        }
        case "foundedYear": {
          const n =
            typeof row.value === "number"
              ? row.value
              : Number(String(row.value).trim())
          if (Number.isFinite(n)) prefill.foundedYear = String(n)
          break
        }
        case "linkedinUrl": {
          const url = extractedNameFromValue(row.value)
          if (url) prefill.linkedinUrl = url
          break
        }
        case "status": {
          const raw = extractedNameFromValue(row.value)
          const db = raw ? displayToEmployerStatusDb(raw) : null
          if (db) prefill.status = db
          break
        }
        case "types": {
          const labels = resolveMultiselectValues(row.value, meta?.options)
          const types = labels
            .map((label) => displayToEmployerTypeDb(label))
            .filter((t): t is EmployerTypeDb => t != null)
          if (types.length) prefill.employerTypes = types
          break
        }
        default:
          break
      }
      continue
    }

    if (parsed.kind === "office") {
      const officeRow = officeAt(parsed.officeIndex)
      switch (parsed.property) {
        case "country":
          officeRow.country = extractedNameFromValue(row.value)
          break
        case "city":
          officeRow.city = extractedNameFromValue(row.value)
          break
        case "address":
          officeRow.address = extractedNameFromValue(row.value)
          break
        case "isHeadquarters": {
          if (typeof row.value === "boolean") {
            officeRow.isHeadquarters = row.value
          } else if (row.value === "true") officeRow.isHeadquarters = true
          else if (row.value === "false") officeRow.isHeadquarters = false
          break
        }
        default:
          break
      }
      continue
    }

    if (parsed.kind === "layoff") {
      layoffRow ??= ensureLayoffRow()
      switch (parsed.property) {
        case "layoffDate": {
          const d = parseIsoDate(row.value)
          if (d) layoffRow.layoffDate = d
          break
        }
        case "affectedEmployees": {
          const n =
            typeof row.value === "number"
              ? row.value
              : Number(String(row.value).replace(/,/g, "").trim())
          if (Number.isFinite(n)) layoffRow.numberOfEmployeesLaidOff = String(n)
          break
        }
        case "reason": {
          const raw = extractedNameFromValue(row.value)
          const db = raw ? displayToLayoffReasonDb(raw) : null
          if (db) {
            layoffRow.reason = db
            layoffRow.reasonOther = ""
          } else if (raw) {
            layoffRow.reasonOther = raw
          }
          break
        }
        default:
          break
      }
    }
  }

  const filledOffices = [...officeRows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => row.country.trim() || row.city.trim() || row.address.trim())
  if (filledOffices.length) {
    prefill.locations = filledOffices
  }
  if (
    layoffRow &&
    (layoffRow.layoffDate ||
      layoffRow.numberOfEmployeesLaidOff.trim() ||
      layoffRow.reasonOther.trim())
  ) {
    prefill.layoffs = [layoffRow]
  }

  return prefill
}

export interface ProjectCreatePrefillResult {
  formPrefill: Partial<ProjectFormData>
  employerNameHint?: string
}

export function buildProjectCreatePrefillFromExtractRows(
  rows: CallNotesExtraction[],
  selectedPaths: ReadonlySet<string>,
  workExperienceId: string,
  projectStableId: string,
  metaByPath: ReadonlyMap<string, AllowedEmptyField>,
): ProjectCreatePrefillResult {
  const prefill: Partial<ProjectFormData> = {}
  let projectEmployerName: string | undefined

  for (const row of rows) {
    if (!selectedPaths.has(row.fieldPath)) continue

    const parsed = parseCatalogFieldPath(row.fieldPath)
    if (!parsed || parsed.workExperienceId !== workExperienceId) {
      continue
    }

    // WE-level employer name (hint for project create employer search)
    if (parsed.property === "employerName" && !parsed.projectId) {
      const name = extractedNameFromValue(row.value)
      if (name) projectEmployerName = name
      continue
    }

    if (parsed.projectId !== projectStableId) {
      continue
    }

    const meta = metaByPath.get(row.fieldPath)

    if (parsed.property === "projectName") {
      const name = extractedNameFromValue(row.value)
      if (name) prefill.projectName = name
      continue
    }

    if (parsed.kind !== "project") continue

    switch (parsed.property) {
      case "projectType": {
        const raw = extractedNameFromValue(row.value)
        const type = raw ? displayToProjectType(raw) ?? resolveOptionValue(raw, meta?.options) : null
        if (type) prefill.projectType = type
        break
      }
      case "status": {
        const raw = extractedNameFromValue(row.value)
        const status = raw ? displayToProjectStatus(raw) : null
        if (status) {
          prefill.status = status
        } else if (raw) {
          const resolved = resolveOptionValue(raw, meta?.options)
          if (resolved && resolved in PROJECT_STATUS_LABELS) {
            prefill.status = resolved as ProjectStatus
          }
        }
        break
      }
      case "description":
        prefill.description = extractedNameFromValue(row.value)
        break
      case "latestUpdate":
        prefill.latestUpdate = extractedNameFromValue(row.value)
        break
      case "link":
        prefill.projectLink = extractedNameFromValue(row.value)
        break
      case "averageTeamSize": {
        const n =
          typeof row.value === "number"
            ? row.value
            : Number(String(row.value).replace(/,/g, "").trim())
        if (Number.isFinite(n)) prefill.averageTeamSize = String(n)
        break
      }
      case "startDate": {
        const d = parseIsoDate(row.value)
        if (d) prefill.startDate = d
        break
      }
      case "endDate": {
        const d = parseIsoDate(row.value)
        if (d) prefill.endDate = d
        break
      }
      case "verticalDomains":
        prefill.verticalDomains = resolveMultiselectValues(row.value, meta?.options)
        break
      case "horizontalDomains":
        prefill.horizontalDomains = resolveMultiselectValues(row.value, meta?.options)
        break
      case "technicalDomains":
        prefill.technicalDomains = resolveMultiselectValues(row.value, meta?.options)
        break
      case "technicalAspects":
        prefill.technicalAspects = resolveMultiselectValues(row.value, meta?.options)
        break
      case "clientLocations":
        prefill.clientLocations = resolveMultiselectValues(row.value, meta?.options)
        break
      default:
        break
    }
  }

  return {
    formPrefill: prefill,
    employerNameHint: projectEmployerName,
  }
}

/** Merge create prefill into employer dialog defaults (create mode). */
export function mergeEmployerFormCreatePrefill(
  base: EmployerFormData,
  prefill: Partial<EmployerFormData> | undefined,
  initialName?: string,
): EmployerFormData {
  if (!prefill && !initialName?.trim()) return base

  const merged: EmployerFormData = {
    ...base,
    ...prefill,
    name: initialName?.trim() || prefill?.name?.trim() || base.name,
    status: prefill?.status || base.status,
    employerTypes: prefill?.employerTypes?.length ? prefill.employerTypes : base.employerTypes,
    locations: prefill?.locations?.length ? prefill.locations : base.locations,
    layoffs: prefill?.layoffs?.length ? prefill.layoffs : base.layoffs,
  }
  return merged
}

/** Merge create prefill into project dialog defaults (create mode). */
export function mergeProjectFormCreatePrefill(
  base: ProjectFormData,
  prefill: Partial<ProjectFormData> | undefined,
  initialName?: string,
  initialSelectedEmployer?: ProjectFormData["selectedEmployer"],
): ProjectFormData {
  if (!prefill && !initialName?.trim() && !initialSelectedEmployer) return base
  return {
    ...base,
    ...prefill,
    projectName: initialName?.trim() || prefill?.projectName?.trim() || base.projectName,
    selectedEmployer: initialSelectedEmployer ?? prefill?.selectedEmployer ?? base.selectedEmployer,
    verticalDomains: prefill?.verticalDomains ?? base.verticalDomains,
    horizontalDomains: prefill?.horizontalDomains ?? base.horizontalDomains,
    technicalDomains: prefill?.technicalDomains ?? base.technicalDomains,
    technicalAspects: prefill?.technicalAspects ?? base.technicalAspects,
    clientLocations: prefill?.clientLocations ?? base.clientLocations,
  }
}

/** Build employer create prefill from hidden catalog fields on a work experience row. */
export function buildEmployerCreatePrefillFromWorkExperience(
  we: WorkExperience,
): Partial<EmployerFormData> {
  const prefill: Partial<EmployerFormData> = {}

  if (we.headcount?.trim()) prefill.headcount = we.headcount.trim()
  if (we.foundedYear?.trim()) prefill.foundedYear = we.foundedYear.trim()
  if (we.linkedinUrl?.trim()) prefill.linkedinUrl = we.linkedinUrl.trim()

  if (we.status?.trim()) {
    const db = displayToEmployerStatusDb(we.status)
    if (db) prefill.status = db
  }

  if (we.types?.length) {
    const types = we.types
      .map((label) => displayToEmployerTypeDb(label))
      .filter((t): t is EmployerTypeDb => t != null)
    if (types.length) prefill.employerTypes = types
  }

  if (we.locations?.length) {
    const rows = we.locations
      .filter((loc) => loc.country?.trim() || loc.city?.trim() || loc.address?.trim())
      .map(
        (loc): EmployerLocationFormData => ({
          id: loc.id || crypto.randomUUID(),
          country: loc.country ?? "",
          city: loc.city ?? "",
          address: loc.address ?? "",
          isHeadquarters: loc.isHeadquarters ?? false,
        }),
      )
    if (rows.length) prefill.locations = rows
  }

  if (we.layoffs?.length) {
    const layoff = we.layoffs[0]
    if (
      layoff &&
      (layoff.layoffDate ||
        layoff.affectedEmployees?.trim() ||
        layoff.reason?.trim())
    ) {
      const reasonDb = layoff.reason?.trim()
        ? displayToLayoffReasonDb(layoff.reason)
        : null
      const layoffRow: LayoffFormData = {
        id: layoff.id || crypto.randomUUID(),
        layoffDate: layoff.layoffDate,
        numberOfEmployeesLaidOff: layoff.affectedEmployees ?? "",
        reason: reasonDb ?? "cost_reduction",
        reasonOther: reasonDb ? "" : (layoff.reason ?? ""),
      }
      prefill.layoffs = [layoffRow]
    }
  }

  return prefill
}

/** Build project create prefill from hidden catalog fields on a project row. */
export function buildProjectCreatePrefillFromProjectExperience(
  project: ProjectExperience,
): Partial<ProjectFormData> {
  const prefill: Partial<ProjectFormData> = {}

  if (project.projectType?.trim()) prefill.projectType = project.projectType.trim()
  if (project.description?.trim()) prefill.description = project.description.trim()
  if (project.latestUpdate?.trim()) prefill.latestUpdate = project.latestUpdate.trim()
  if (project.link?.trim()) prefill.projectLink = project.link.trim()
  if (project.averageTeamSize?.trim()) prefill.averageTeamSize = project.averageTeamSize.trim()
  if (project.downloadCount?.trim()) prefill.downloadCount = project.downloadCount.trim()
  if (project.startDate) prefill.startDate = project.startDate
  if (project.endDate) prefill.endDate = project.endDate

  if (project.status?.trim()) {
    const status = displayToProjectStatus(project.status)
    if (status) prefill.status = status
  }

  if (project.verticalDomains?.length) prefill.verticalDomains = [...project.verticalDomains]
  if (project.horizontalDomains?.length) prefill.horizontalDomains = [...project.horizontalDomains]
  if (project.technicalDomains?.length) prefill.technicalDomains = [...project.technicalDomains]
  if (project.technicalAspects?.length) prefill.technicalAspects = [...project.technicalAspects]
  if (project.clientLocations?.length) prefill.clientLocations = [...project.clientLocations]
  if (project.publishPlatforms?.length) prefill.publishPlatforms = [...project.publishPlatforms]

  return prefill
}
