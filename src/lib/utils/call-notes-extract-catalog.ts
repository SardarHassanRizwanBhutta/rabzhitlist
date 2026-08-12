/**
 * Call Notes Extract v2 — employer / project catalog field paths and apply gating.
 */

import type { CandidateFormData } from "@/components/candidate-creation-dialog"
import type { AllowedEmptyField } from "@/types/call-notes-extraction"
import type { CallNotesCatalogResolution } from "@/lib/utils/call-notes-extract-lookup"
import {
  OFFICE_FIELD_ORDER,
  LAYOFF_FIELD_ORDER,
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
} from "@/lib/utils/qg-field-weights"
import { COLD_CALLER_QG_PROJECT_FIELD_ORDER } from "@/lib/utils/project-catalog-fields"

/** Employer catalog scalars on WE (excludes role-owned salaryPolicy and lookup employerName). */
export const WE_EMPLOYER_CATALOG_SCALAR_KEYS = new Set(
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.filter(
    (key) => key !== "employerName" && key !== "salaryPolicy",
  ),
)

export const WE_OFFICE_KEYS = new Set(OFFICE_FIELD_ORDER)
export const WE_LAYOFF_KEYS = new Set(LAYOFF_FIELD_ORDER)

/** Project catalog keys eligible for extract v2 (tech stacks deferred). */
export const PROJECT_CATALOG_EXTRACT_KEYS = new Set(
  COLD_CALLER_QG_PROJECT_FIELD_ORDER.filter((key) => key !== "techStacks"),
)

const WE_EMPLOYER_NAME_PATH = /^workExperiences\[([^\]]+)\]\.employerName$/
const WE_SCALAR_PATH = /^workExperiences\[([^\]]+)\]\.([a-zA-Z]+)$/
const WE_OFFICE_PATH =
  /^workExperiences\[([^\]]+)\]\.locations\[([^\]]+)\]\.([a-zA-Z]+)$/
const WE_LAYOFF_PATH =
  /^workExperiences\[([^\]]+)\]\.layoffs\[([^\]]+)\]\.([a-zA-Z]+)$/
const PROJECT_SCALAR_PATH =
  /^workExperiences\[([^\]]+)\]\.projects\[([^\]]+)\]\.([a-zA-Z]+)$/

export type LinkedCatalogKind = "employer" | "project"

export interface ParsedCatalogFieldPath {
  workExperienceId: string
  projectId?: string
  officeIndex?: string
  layoffIndex?: string
  property: string
  kind: LinkedCatalogKind | "employer_scalar" | "office" | "layoff" | "project_link" | "role"
}

export function isWeTechStacksApiField(apiFieldName: string): boolean {
  return (
    /_techStacks$/.test(apiFieldName) &&
    /^work_experience_\d+_(?:project_\d+_)?techStacks$/.test(apiFieldName)
  )
}

export function parseCatalogFieldPath(fieldPath: string): ParsedCatalogFieldPath | null {
  const officeMatch = WE_OFFICE_PATH.exec(fieldPath)
  if (officeMatch) {
    return {
      workExperienceId: officeMatch[1],
      officeIndex: officeMatch[2],
      property: officeMatch[3],
      kind: "office",
    }
  }

  const layoffMatch = WE_LAYOFF_PATH.exec(fieldPath)
  if (layoffMatch) {
    return {
      workExperienceId: layoffMatch[1],
      layoffIndex: layoffMatch[2],
      property: layoffMatch[3],
      kind: "layoff",
    }
  }

  const projectMatch = PROJECT_SCALAR_PATH.exec(fieldPath)
  if (projectMatch) {
    const property = projectMatch[3]
    const isLink = property === "projectName" || property === "contributionNotes"
    return {
      workExperienceId: projectMatch[1],
      projectId: projectMatch[2],
      property,
      kind: isLink ? "project_link" : "project",
    }
  }

  const weMatch = WE_SCALAR_PATH.exec(fieldPath)
  if (weMatch) {
    const property = weMatch[2]
    if ((WE_EMPLOYER_CATALOG_SCALAR_KEYS as Set<string>).has(property)) {
      return {
        workExperienceId: weMatch[1],
        property,
        kind: "employer_scalar",
      }
    }
    return {
      workExperienceId: weMatch[1],
      property,
      kind: "role",
    }
  }

  if (WE_EMPLOYER_NAME_PATH.test(fieldPath)) {
    const id = WE_EMPLOYER_NAME_PATH.exec(fieldPath)![1]
    return {
      workExperienceId: id,
      property: "employerName",
      kind: "employer_scalar",
    }
  }

  return null
}

export function requiresLinkedCatalogId(
  fieldPath: string,
): LinkedCatalogKind | null {
  const parsed = parseCatalogFieldPath(fieldPath)
  if (!parsed) return null
  if (
    parsed.kind === "employer_scalar" ||
    parsed.kind === "office" ||
    parsed.kind === "layoff"
  ) {
    if (parsed.property === "employerName") return null
    return "employer"
  }
  if (parsed.kind === "project" && parsed.property !== "employerName") {
    return "project"
  }
  return null
}

function findWorkExperienceIndex(form: CandidateFormData, stableId: string): number {
  const exact = form.workExperiences.findIndex((we) => we.id === stableId)
  if (exact >= 0) return exact
  if (stableId === "0" && form.workExperiences.length === 1) return 0
  return -1
}

function findProjectIndex(
  we: CandidateFormData["workExperiences"][number],
  stableId: string,
): number {
  const exact = we.projects.findIndex((p) => p.id === stableId)
  if (exact >= 0) return exact
  if (stableId === "0" && we.projects.length === 1) return 0
  return -1
}

export function employerCatalogPathForWorkExperience(weId: string): string {
  return `workExperiences[${weId}].employerName`
}

export function projectCatalogPathForProject(weId: string, projectId: string): string {
  return `workExperiences[${weId}].projects[${projectId}].projectName`
}

export function hasLinkedEmployerForExtractApply(
  form: CandidateFormData,
  workExperienceId: string,
  lookupResolutions: ReadonlyMap<string, CallNotesCatalogResolution>,
): boolean {
  const weIdx = findWorkExperienceIndex(form, workExperienceId)
  if (weIdx < 0) return false
  const we = form.workExperiences[weIdx]
  if (we.employerId != null) return true
  const namePath = employerCatalogPathForWorkExperience(we.id)
  const resolution = lookupResolutions.get(namePath)
  return resolution?.kind === "employer"
}

export function hasLinkedProjectForExtractApply(
  form: CandidateFormData,
  workExperienceId: string,
  projectId: string,
  lookupResolutions: ReadonlyMap<string, CallNotesCatalogResolution>,
): boolean {
  const weIdx = findWorkExperienceIndex(form, workExperienceId)
  if (weIdx < 0) return false
  const we = form.workExperiences[weIdx]
  const projIdx = findProjectIndex(we, projectId)
  if (projIdx < 0) return false
  const project = we.projects[projIdx]
  if (project.projectId != null) return true
  const namePath = projectCatalogPathForProject(we.id, project.id)
  const resolution = lookupResolutions.get(namePath)
  return resolution?.kind === "project"
}

export function hasUnresolvedCheckedCatalogIdRows(
  selectedFieldPaths: Set<string>,
  rows: Array<{ fieldPath: string; requiresLinkedCatalogId?: LinkedCatalogKind | null }>,
  form: CandidateFormData,
  lookupResolutions: ReadonlyMap<string, CallNotesCatalogResolution>,
): boolean {
  for (const row of rows) {
    if (!selectedFieldPaths.has(row.fieldPath)) continue
    const linkedKind = row.requiresLinkedCatalogId ?? requiresLinkedCatalogId(row.fieldPath)
    if (!linkedKind) continue

    const parsed = parseCatalogFieldPath(row.fieldPath)
    if (!parsed) continue

    if (linkedKind === "employer") {
      if (
        !hasLinkedEmployerForExtractApply(
          form,
          parsed.workExperienceId,
          lookupResolutions,
        )
      ) {
        return true
      }
    } else if (linkedKind === "project" && parsed.projectId) {
      if (
        !hasLinkedProjectForExtractApply(
          form,
          parsed.workExperienceId,
          parsed.projectId,
          lookupResolutions,
        )
      ) {
        return true
      }
    }
  }
  return false
}

export function enrichAllowedEmptyFieldWithCatalogGating(
  field: AllowedEmptyField,
): AllowedEmptyField {
  const linked = requiresLinkedCatalogId(field.fieldPath)
  if (!linked) return field
  return { ...field, requiresLinkedCatalogId: linked }
}
