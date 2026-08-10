/**
 * Call Notes Extract Step 4 — catalog lookup resolution helpers.
 * @see docs/CALL_NOTES_EXTRACT_FRONTEND_HANDOFF.md §7
 */

import type { CandidateFormData } from "@/components/candidate-creation-dialog"
import type { BuildCreateEmployerDtoOptions } from "@/lib/services/employers-api"
import type { CertificationIssuer } from "@/lib/types/certification"
import type { AllowedEmptyField } from "@/types/call-notes-extraction"
import type { EmployerComboboxNestedCreationProps } from "@/components/employer-combobox"
import type { ProjectLookups } from "@/components/project-creation-dialog"
import type { SelectedEmployer } from "@/components/project-creation-dialog"

export type CallNotesCatalogResolutionKind = "employer" | "project" | "certification"

export interface CallNotesCatalogResolution {
  kind: CallNotesCatalogResolutionKind
  catalogId: number
  catalogName: string
  issuerName?: string | null
}

export interface CallNotesExtractLookupContext {
  nestedEmployerCreation?: EmployerComboboxNestedCreationProps
  createEmployerLookups?: BuildCreateEmployerDtoOptions
  projectLookups?: ProjectLookups
  onCreateTechStack?: (name: string, context?: { aspectTypeId: number }) => Promise<void>
  onCreateTechnicalAspect?: (name: string) => Promise<void>
  onCreateClientLocation?: (name: string) => Promise<void>
  certificationIssuers?: CertificationIssuer[]
  certificationIssuersLoading?: boolean
  onCertificationIssuerCreated?: (issuer: CertificationIssuer) => void
}

export interface ParsedExtractFieldPath {
  workExperienceId?: string
  projectId?: string
  certificationId?: string
  property: string
}

const WE_EMPLOYER_PATH =
  /^workExperiences\[([^\]]+)\]\.employerName$/
const PROJECT_NAME_PATH =
  /^workExperiences\[([^\]]+)\]\.projects\[([^\]]+)\]\.projectName$/
const PROJECT_EMPLOYER_PATH =
  /^workExperiences\[([^\]]+)\]\.projects\[([^\]]+)\]\.employerName$/
const CERT_NAME_PATH = /^certifications\[([^\]]+)\]\.certificationName$/

export function inferExtractLookupKind(
  fieldPath: string,
): CallNotesCatalogResolutionKind | null {
  if (CERT_NAME_PATH.test(fieldPath)) return "certification"
  if (PROJECT_NAME_PATH.test(fieldPath)) return "project"
  if (WE_EMPLOYER_PATH.test(fieldPath) || PROJECT_EMPLOYER_PATH.test(fieldPath)) {
    return "employer"
  }
  return null
}

export function parseExtractFieldPath(fieldPath: string): ParsedExtractFieldPath | null {
  const certMatch = CERT_NAME_PATH.exec(fieldPath)
  if (certMatch) {
    return {
      certificationId: certMatch[1],
      property: "certificationName",
    }
  }

  const projectNameMatch = PROJECT_NAME_PATH.exec(fieldPath)
  if (projectNameMatch) {
    return {
      workExperienceId: projectNameMatch[1],
      projectId: projectNameMatch[2],
      property: "projectName",
    }
  }

  const projectEmployerMatch = PROJECT_EMPLOYER_PATH.exec(fieldPath)
  if (projectEmployerMatch) {
    return {
      workExperienceId: projectEmployerMatch[1],
      projectId: projectEmployerMatch[2],
      property: "employerName",
    }
  }

  const weEmployerMatch = WE_EMPLOYER_PATH.exec(fieldPath)
  if (weEmployerMatch) {
    return {
      workExperienceId: weEmployerMatch[1],
      property: "employerName",
    }
  }

  return null
}

export function rowRequiresLookupResolution(
  fieldPath: string,
  metaByPath: Map<string, AllowedEmptyField>,
): boolean {
  const meta = metaByPath.get(fieldPath)
  if (meta?.requiresLookupResolution === true) return true
  return inferExtractLookupKind(fieldPath) != null
}

export function hasUnresolvedCheckedLookupRows(
  selectedFieldPaths: Set<string>,
  rows: Array<{ fieldPath: string; requiresLookupResolution?: boolean }>,
  resolutions: ReadonlyMap<string, CallNotesCatalogResolution>,
): boolean {
  for (const row of rows) {
    if (!selectedFieldPaths.has(row.fieldPath)) continue
    if (!row.requiresLookupResolution) continue
    if (!resolutions.has(row.fieldPath)) return true
  }
  return false
}

function findWorkExperienceIndex(
  form: CandidateFormData,
  stableId: string,
): number {
  const exact = form.workExperiences.findIndex((we) => we.id === stableId)
  if (exact >= 0) return exact
  if (stableId === "0" && form.workExperiences.length === 1) return 0
  return -1
}

export function getProjectCreateEmployerHints(
  form: CandidateFormData,
  workExperienceId: string | undefined,
): {
  createProjectInitialEmployer?: SelectedEmployer
  createProjectEmployerNameHint?: string
} {
  if (!workExperienceId) return {}
  const weIdx = findWorkExperienceIndex(form, workExperienceId)
  if (weIdx < 0) return {}
  const we = form.workExperiences[weIdx]
  if (we.employerId != null) {
    return {
      createProjectInitialEmployer: {
        id: we.employerId,
        name: we.employerName?.trim() || `Employer #${we.employerId}`,
      },
    }
  }
  const name = we.employerName?.trim()
  if (name) {
    return { createProjectEmployerNameHint: name }
  }
  return {}
}

export function extractedNameFromValue(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return ""
}
