/**
 * Build `allowedEmptyFields` for Call Notes Extract from catalog-enriched candidate.
 * @see docs/CALL_NOTES_EXTRACT_FRONTEND_HANDOFF.md §6
 */

import type { Candidate, ProjectExperience } from "@/lib/types/candidate"
import type { EmptyField } from "@/types/cold-caller"
import type { AllowedEmptyField } from "@/types/call-notes-extraction"
import { getEmptyFields } from "@/lib/utils/empty-field-detection"
import { mapMainAppCandidateToQuestionService } from "@/lib/utils/map-candidate-for-question-service"
import { buildMissingOnlyQuestionRequest } from "@/lib/utils/missing-only-question-request"
import {
  enrichAllowedEmptyFieldWithCatalogGating,
  isWeTechStacksApiField,
} from "@/lib/utils/call-notes-extract-catalog"
import { isCallNotesExtractApiFieldAllowed } from "@/lib/utils/question-field-allowlist"
import { isQgValueMissing } from "@/lib/utils/qg-value"

export interface BuildCallNotesAllowedEmptyFieldsOptions {
  hasResume?: boolean
}

function stableCollectionId(
  rowId: string | undefined,
  index: number,
): string {
  const trimmed = rowId?.trim()
  if (trimmed) return trimmed
  return String(index)
}

/**
 * Replace numeric array indexes in `fieldPath` with stable row ids from the candidate.
 */
export function toStableExtractFieldPath(
  fieldPath: string,
  candidate: Candidate,
): string {
  let result = fieldPath

  const weMatch = /^workExperiences\[(\d+)\]/.exec(result)
  if (weMatch) {
    const weIndex = Number.parseInt(weMatch[1], 10)
    const we = candidate.workExperiences?.[weIndex]
    const weId = stableCollectionId(we?.id, weIndex)
    result = result.replace(`workExperiences[${weMatch[1]}]`, `workExperiences[${weId}]`)

    const projMatch = /\.projects\[(\d+)\]/.exec(result)
    if (projMatch && we?.projects) {
      const projIndex = Number.parseInt(projMatch[1], 10)
      const project = we.projects[projIndex]
      const projectId = stableCollectionId(project?.id, projIndex)
      result = result.replace(
        `.projects[${projMatch[1]}]`,
        `.projects[${projectId}]`,
      )
    }
  }

  const certMatch = /^certifications\[(\d+)\]/.exec(result)
  if (certMatch) {
    const certIndex = Number.parseInt(certMatch[1], 10)
    const cert = candidate.certifications?.[certIndex]
    const certId = stableCollectionId(cert?.id, certIndex)
    result = result.replace(`certifications[${certMatch[1]}]`, `certifications[${certId}]`)
  }

  const achMatch = /^achievements\[(\d+)\]/.exec(result)
  if (achMatch) {
    const achIndex = Number.parseInt(achMatch[1], 10)
    const ach = candidate.achievements?.[achIndex]
    const achId = stableCollectionId(ach?.id, achIndex)
    result = result.replace(`achievements[${achMatch[1]}]`, `achievements[${achId}]`)
  }

  return result
}

function emptyFieldToAllowedEmptyField(
  field: EmptyField,
  candidate: Candidate,
): AllowedEmptyField {
  const isSpokenProjectDomain = /_project_\d+_(verticalDomains|horizontalDomains|technicalDomains)$/.test(
    field.apiFieldName,
  )
  return {
    fieldPath: toStableExtractFieldPath(field.fieldPath, candidate),
    apiFieldName: field.apiFieldName,
    fieldLabel: field.fieldLabel,
    fieldType: field.fieldType,
    context: field.context,
    options: isSpokenProjectDomain ? undefined : field.options,
    requiresLookupResolution: field.onCreateEntity != null,
  }
}

function isExtractEligibleEmptyField(
  field: EmptyField,
  allowedApiNames: Set<string>,
  options: BuildCallNotesAllowedEmptyFieldsOptions,
): boolean {
  if (field.section === "education") return false
  if (!isCallNotesExtractApiFieldAllowed(field.apiFieldName)) return false
  if (!allowedApiNames.has(field.apiFieldName)) return false
  if (!isQgValueMissing(field.currentValue)) return false
  if (field.apiFieldName === "resume" && options.hasResume === true) return false
  if (field.section === "techStacks" || field.apiFieldName === "techStacks") {
    return false
  }
  if (isWeTechStacksApiField(field.apiFieldName)) {
    return false
  }
  return true
}

const EXTRACT_BOOLEAN_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
]

function workExperienceExtractContext(we: {
  employerName?: string | null
  jobTitle?: string | null
}): string | undefined {
  const employer = we.employerName?.trim()
  const title = we.jobTitle?.trim()
  if (employer && title) return `${employer} - ${title}`
  return employer || title || undefined
}

type ProjectExtractSlot = {
  prefix: string
  apiPrefix: string
  context?: string
  project?: ProjectExperience
}

function collectProjectExtractSlots(
  candidate: Candidate,
  rows: AllowedEmptyField[],
): ProjectExtractSlot[] {
  const slots = new Map<string, ProjectExtractSlot>()

  ;(candidate.workExperiences ?? []).forEach((we, weIndex) => {
    const weId = stableCollectionId(we.id, weIndex)
    const context = workExperienceExtractContext(we)
    const projects = we.projects?.length ? we.projects : [undefined]
    projects.forEach((project, projectIndex) => {
      const projectId = stableCollectionId(project?.id, projectIndex)
      const prefix = `workExperiences[${weId}].projects[${projectId}]`
      slots.set(prefix, {
        prefix,
        apiPrefix: `work_experience_${weIndex}_project_${projectIndex}`,
        context,
        project,
      })
    })
  })

  for (const row of rows) {
    const pathMatch =
      /^(workExperiences\[([^\]]+)\]\.projects\[([^\]]+)\])/.exec(row.fieldPath)
    const apiMatch = /^(work_experience_\d+_project_\d+)_/.exec(row.apiFieldName)
    if (!pathMatch || !apiMatch) continue
    const prefix = pathMatch[1]
    if (slots.has(prefix)) continue
    const weId = pathMatch[2]
    const projectId = pathMatch[3]
    const we = (candidate.workExperiences ?? []).find(
      (rowWe, index) => stableCollectionId(rowWe.id, index) === weId,
    )
    const project = we?.projects?.find(
      (rowProject, index) => stableCollectionId(rowProject.id, index) === projectId,
    )
    slots.set(prefix, {
      prefix,
      apiPrefix: apiMatch[1],
      context: row.context,
      project,
    })
  }

  return [...slots.values()]
}

/**
 * Main Contributor defaults to false, so QG empty checks never emit it.
 * Inject extract-only when the switch is not already true.
 */
function appendExtractOnlyProjectFields(
  candidate: Candidate,
  rows: AllowedEmptyField[],
): AllowedEmptyField[] {
  const seen = new Set(rows.map((row) => row.fieldPath))
  const extra: AllowedEmptyField[] = []

  for (const slot of collectProjectExtractSlots(candidate, rows)) {
    if (slot.project?.isMainContribution === true) continue
    const fieldPath = `${slot.prefix}.isMainContribution`
    if (seen.has(fieldPath)) continue
    seen.add(fieldPath)
    extra.push(
      enrichAllowedEmptyFieldWithCatalogGating({
        fieldPath,
        apiFieldName: `${slot.apiPrefix}_isMainContribution`,
        fieldLabel: "Main Contributor",
        fieldType: "boolean",
        context: slot.context,
        options: [...EXTRACT_BOOLEAN_OPTIONS],
        requiresLookupResolution: false,
      }),
    )
  }

  return extra.length === 0 ? rows : [...rows, ...extra]
}

export function buildCallNotesAllowedEmptyFields(
  candidate: Candidate,
  options: BuildCallNotesAllowedEmptyFieldsOptions = {},
): AllowedEmptyField[] {
  const hasResume = options.hasResume ?? candidate.hasResume === true
  const mapped = mapMainAppCandidateToQuestionService(candidate)
  const extractOfficeOptions = { employerOfficeSlots: "call-notes-extract" as const }
  const { fieldsToGenerate } = buildMissingOnlyQuestionRequest(mapped, extractOfficeOptions)
  const allowedApiNames = new Set(
    fieldsToGenerate.filter((name) => isCallNotesExtractApiFieldAllowed(name)),
  )

  const emptyFields = getEmptyFields(candidate, extractOfficeOptions)
  const seenPaths = new Set<string>()
  const result: AllowedEmptyField[] = []

  for (const field of emptyFields) {
    if (!isExtractEligibleEmptyField(field, allowedApiNames, { hasResume })) {
      continue
    }
    const allowed = enrichAllowedEmptyFieldWithCatalogGating(
      emptyFieldToAllowedEmptyField(field, candidate),
    )
    if (seenPaths.has(allowed.fieldPath)) continue
    seenPaths.add(allowed.fieldPath)
    result.push(allowed)
  }

  return appendExtractOnlyProjectFields(candidate, result)
}

export function getCallNotesExtractAnalyzeDisabledReason(
  rawNotes: string,
  allowedEmptyFields: AllowedEmptyField[],
): string | null {
  if (!rawNotes.trim()) return "Add call notes before analyzing."
  if (allowedEmptyFields.length === 0) {
    return "No empty Cold Caller fields to fill."
  }
  return null
}
