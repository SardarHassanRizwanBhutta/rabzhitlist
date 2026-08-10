/**
 * Apply Call Notes extractions into CandidateFormData (empty fields only).
 * @see docs/CALL_NOTES_EXTRACT_FRONTEND_HANDOFF.md §7
 */

import type { CandidateFormData } from "@/components/candidate-creation-dialog"
import type { AllowedEmptyField, CallNotesExtraction } from "@/types/call-notes-extraction"
import type { EmployerBenefit } from "@/lib/types/benefits"
import type { CallNotesCatalogResolution } from "@/lib/utils/call-notes-extract-lookup"
import { isQgValueMissing } from "@/lib/utils/qg-value"
import {
  shiftTypeToSelectValue,
  workModeToSelectValue,
} from "@/lib/utils/shift-work-mode-display"

export interface ApplyCallNotesExtractionsResult {
  formData: CandidateFormData
  applied: string[]
  skipped: Array<{ fieldPath: string; reason: string }>
}

/** Form keys we can write today via CandidateCreationDialog (edit/create). */
const ROOT_KEYS = new Set(["currentSalary", "expectedSalary", "linkedinUrl"])

const WE_KEYS = new Set([
  "jobTitle",
  "startDate",
  "endDate",
  "techStacks",
  "shiftType",
  "workMode",
  "timeSupportZones",
  "benefits",
  "employerName",
  "salaryPolicy",
])

const PROJECT_KEYS = new Set(["projectName", "contributionNotes"])

const CERT_KEYS = new Set([
  "certificationName",
  "issuingBody",
  "issueDate",
  "expiryDate",
  "certificationUrl",
])

const ACH_KEYS = new Set(["name", "year", "description", "achievementType", "ranking", "url"])

const CERT_PROP_ALIASES: Record<string, keyof CandidateFormData["certifications"][number]> = {
  issuingBody: "certificationIssuerName",
}

function cloneFormData(base: CandidateFormData): CandidateFormData {
  return structuredClone(base)
}

function parseIsoDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? undefined : d
  }
  return undefined
}

function coerceScalarForForm(
  fieldType: AllowedEmptyField["fieldType"],
  value: unknown,
): string | number | boolean | Date | undefined {
  switch (fieldType) {
    case "number":
      if (typeof value === "number" && Number.isFinite(value)) return value
      if (typeof value === "string") {
        const n = Number(value.replace(/,/g, "").trim())
        return Number.isFinite(n) ? n : undefined
      }
      return undefined
    case "date":
      return parseIsoDate(value)
    case "boolean":
      if (typeof value === "boolean") return value
      if (value === "true") return true
      if (value === "false") return false
      return undefined
    case "text":
    case "textarea":
    case "select":
    case "combobox":
      if (typeof value === "string") return value.trim()
      if (typeof value === "number") return String(value)
      return undefined
    default:
      return undefined
  }
}

function coerceBenefits(value: unknown): EmployerBenefit[] | undefined {
  if (!Array.isArray(value)) return undefined
  const rows: EmployerBenefit[] = []
  for (const item of value) {
    if (item == null || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const name = typeof row.name === "string" ? row.name.trim() : ""
    if (!name) continue
    rows.push({
      id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
      name,
      hasValue: row.amount != null || row.unit != null,
      amount: typeof row.amount === "number" ? row.amount : null,
      unit:
        row.unit === "PKR" || row.unit === "percent"
          ? row.unit
          : typeof row.unit === "string"
            ? (row.unit as EmployerBenefit["unit"])
            : null,
    })
  }
  return rows.length > 0 ? rows : undefined
}

function coerceStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) return [value.trim()]
    return undefined
  }
  const items = value
    .map((v) => (typeof v === "string" ? v.trim() : String(v).trim()))
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

type FieldOption = NonNullable<AllowedEmptyField["options"]>[number]

/** Map extract label/value → form option value (case-insensitive). */
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

function resolveMultiselectOptionValues(
  value: unknown,
  options?: FieldOption[],
): string[] | undefined {
  const arr = coerceStringArray(value)
  if (!arr) return undefined
  const resolved = arr
    .map((item) => resolveOptionValue(item, options))
    .filter((v): v is string => Boolean(v))
  return resolved.length > 0 ? resolved : undefined
}

function findWorkExperienceIndex(form: CandidateFormData, id: string): number {
  const exact = form.workExperiences.findIndex((we) => we.id === id)
  if (exact >= 0) return exact
  if (id === "0" && form.workExperiences.length === 1) return 0
  return -1
}

function ensureWorkExperience(form: CandidateFormData, id: string): number {
  const idx = findWorkExperienceIndex(form, id)
  if (idx >= 0) return idx
  form.workExperiences.push({
    id: id === "0" ? `session-we-${crypto.randomUUID()}` : id,
    employerId: null,
    employerName: "",
    jobTitle: "",
    projects: [],
    startDate: undefined,
    endDate: undefined,
    techStacks: [],
    shiftType: "",
    workMode: "",
    salaryPolicy: "",
    timeSupportZones: [],
    benefits: [],
  })
  return form.workExperiences.length - 1
}

function findProjectIndex(
  we: CandidateFormData["workExperiences"][number],
  id: string,
): number {
  const exact = we.projects.findIndex((p) => p.id === id)
  if (exact >= 0) return exact
  if (id === "0" && we.projects.length === 1) return 0
  return -1
}

function ensureProject(
  we: CandidateFormData["workExperiences"][number],
  id: string,
): number {
  const idx = findProjectIndex(we, id)
  if (idx >= 0) return idx
  we.projects.push({
    id: id === "0" ? `session-project-${crypto.randomUUID()}` : id,
    projectId: null,
    projectName: "",
    contributionNotes: "",
  })
  return we.projects.length - 1
}

function findCertIndex(form: CandidateFormData, id: string): number {
  const exact = form.certifications.findIndex((c) => c.id === id)
  if (exact >= 0) return exact
  if (id === "0" && form.certifications.length === 1) return 0
  return -1
}

function ensureCertification(form: CandidateFormData, id: string): number {
  const idx = findCertIndex(form, id)
  if (idx >= 0) return idx
  form.certifications.push({
    id: id === "0" ? `session-cert-${crypto.randomUUID()}` : id,
    certificationId: null,
    certificationName: "",
    certificationIssuerName: null,
    issueDate: undefined,
    expiryDate: undefined,
    certificationUrl: "",
    certificationLevel: "",
  })
  return form.certifications.length - 1
}

function findAchievementIndex(form: CandidateFormData, id: string): number {
  const exact = form.achievements.findIndex((a) => a.id === id)
  if (exact >= 0) return exact
  if (id === "0" && form.achievements.length === 1) return 0
  return -1
}

function ensureAchievement(form: CandidateFormData, id: string): number {
  const idx = findAchievementIndex(form, id)
  if (idx >= 0) return idx
  form.achievements.push({
    id: id === "0" ? `session-ach-${crypto.randomUUID()}` : id,
    name: "",
    achievementType: "competition",
    ranking: "",
    year: undefined,
    url: "",
    description: "",
  })
  return form.achievements.length - 1
}

function isEmptyFormValue(value: unknown): boolean {
  return isQgValueMissing(value)
}

function writeRootField(
  form: CandidateFormData,
  key: string,
  fieldType: AllowedEmptyField["fieldType"],
  value: unknown,
): boolean {
  if (!ROOT_KEYS.has(key)) return false
  const current = form[key as keyof CandidateFormData]
  if (!isEmptyFormValue(current)) return false

  if (key === "currentSalary" || key === "expectedSalary") {
    const n = coerceScalarForForm("number", value)
    if (n == null) return false
    form[key] = String(n)
    return true
  }

  const coerced = coerceScalarForForm(fieldType, value)
  if (coerced == null || typeof coerced !== "string") return false
  if (key === "linkedinUrl") {
    form.linkedinUrl = coerced
    return true
  }
  return false
}

function writeWeField(
  form: CandidateFormData,
  weId: string,
  key: string,
  fieldType: AllowedEmptyField["fieldType"],
  value: unknown,
  meta: AllowedEmptyField,
  lookupResolution?: CallNotesCatalogResolution,
): boolean {
  if (!WE_KEYS.has(key)) return false
  const weIdx = ensureWorkExperience(form, weId)
  const we = form.workExperiences[weIdx]
  const current = we[key as keyof typeof we]
  if (!isEmptyFormValue(current)) return false

  if (key === "techStacks") {
    const arr = coerceStringArray(value)
    if (!arr) return false
    we.techStacks = arr
    return true
  }
  if (key === "timeSupportZones") {
    const resolved = resolveMultiselectOptionValues(value, meta.options)
    if (!resolved) return false
    we.timeSupportZones = resolved
    return true
  }
  if (key === "benefits") {
    const benefits = coerceBenefits(value)
    if (!benefits) return false
    we.benefits = benefits.map((b) => ({
      id: b.id,
      name: b.name,
      hasValue: b.hasValue ?? false,
      amount: b.amount ?? null,
      unit: b.unit ?? null,
    }))
    return true
  }
  if (key === "startDate" || key === "endDate") {
    const d = parseIsoDate(value)
    if (!d) return false
    we[key] = d
    return true
  }

  if (key === "shiftType") {
    const raw =
      typeof value === "string"
        ? value
        : coerceScalarForForm(fieldType, value) != null
          ? String(coerceScalarForForm(fieldType, value))
          : ""
    const normalized = shiftTypeToSelectValue(raw)
    if (!normalized) return false
    we.shiftType = normalized
    return true
  }

  if (key === "workMode") {
    const raw =
      typeof value === "string"
        ? value
        : coerceScalarForForm(fieldType, value) != null
          ? String(coerceScalarForForm(fieldType, value))
          : ""
    const normalized = workModeToSelectValue(raw)
    if (!normalized) return false
    we.workMode = normalized
    return true
  }

  const coerced = coerceScalarForForm(fieldType, value)
  if (coerced == null) return false
  if (typeof coerced === "string" || typeof coerced === "number" || typeof coerced === "boolean") {
    if (key === "jobTitle") we.jobTitle = String(coerced)
    else if (key === "employerName") {
      if (meta.requiresLookupResolution) {
        if (!lookupResolution || lookupResolution.kind !== "employer") return false
        we.employerId = lookupResolution.catalogId
        we.employerName = lookupResolution.catalogName
      } else {
        we.employerName = String(coerced)
      }
    } else if (key === "salaryPolicy") we.salaryPolicy = String(coerced)
    else return false
    return true
  }
  return false
}

function writeProjectField(
  form: CandidateFormData,
  weId: string,
  projectId: string,
  key: string,
  fieldType: AllowedEmptyField["fieldType"],
  value: unknown,
  meta: AllowedEmptyField,
  lookupResolution?: CallNotesCatalogResolution,
): boolean {
  if (!PROJECT_KEYS.has(key)) return false
  const weIdx = ensureWorkExperience(form, weId)
  const we = form.workExperiences[weIdx]
  const projIdx = ensureProject(we, projectId)
  const project = we.projects[projIdx]
  const current = project[key as keyof typeof project]
  if (!isEmptyFormValue(current)) return false

  const coerced = coerceScalarForForm(fieldType, value)
  if (coerced == null || typeof coerced !== "string") return false
  if (key === "projectName") {
    if (meta.requiresLookupResolution) {
      if (!lookupResolution || lookupResolution.kind !== "project") return false
      project.projectId = lookupResolution.catalogId
      project.projectName = lookupResolution.catalogName
    } else {
      project.projectName = coerced
    }
  } else if (key === "contributionNotes") project.contributionNotes = coerced
  else return false
  return true
}

function writeCertField(
  form: CandidateFormData,
  certId: string,
  key: string,
  fieldType: AllowedEmptyField["fieldType"],
  value: unknown,
  meta: AllowedEmptyField,
  lookupResolution?: CallNotesCatalogResolution,
): boolean {
  if (!CERT_KEYS.has(key)) return false
  const certIdx = ensureCertification(form, certId)
  const cert = form.certifications[certIdx]
  const formKey = CERT_PROP_ALIASES[key] ?? (key as keyof typeof cert)
  const current = cert[formKey]
  if (!isEmptyFormValue(current)) return false

  if (key === "issueDate" || key === "expiryDate") {
    const d = parseIsoDate(value)
    if (!d) return false
    cert[key] = d
    return true
  }

  const coerced = coerceScalarForForm(fieldType, value)
  if (coerced == null || typeof coerced !== "string") return false
  if (formKey === "certificationIssuerName") {
    cert.certificationIssuerName = coerced
    return true
  }
  if (formKey === "certificationName") {
    if (meta.requiresLookupResolution) {
      if (!lookupResolution || lookupResolution.kind !== "certification") return false
      cert.certificationId = lookupResolution.catalogId
      cert.certificationName = lookupResolution.catalogName
      if (lookupResolution.issuerName?.trim()) {
        cert.certificationIssuerName = lookupResolution.issuerName.trim()
      }
    } else {
      cert.certificationName = coerced
    }
    return true
  }
  if (formKey === "certificationUrl") {
    cert.certificationUrl = coerced
    return true
  }
  return false
}

function writeAchievementField(
  form: CandidateFormData,
  achId: string,
  key: string,
  fieldType: AllowedEmptyField["fieldType"],
  value: unknown,
): boolean {
  if (!ACH_KEYS.has(key)) return false
  const achIdx = ensureAchievement(form, achId)
  const ach = form.achievements[achIdx]
  const current = ach[key as keyof typeof ach]
  if (!isEmptyFormValue(current)) return false

  if (key === "year") {
    const n = coerceScalarForForm("number", value)
    if (n == null || typeof n !== "number") return false
    ach.year = n
    return true
  }

  const coerced = coerceScalarForForm(fieldType, value)
  if (coerced == null) return false
  if (key === "achievementType") {
    ach.achievementType = String(coerced) as typeof ach.achievementType
    return true
  }
  if (typeof coerced === "string") {
    ach[key as "name" | "description" | "ranking" | "url"] = coerced
    return true
  }
  return false
}

function writeProjectEmployerToWorkExperience(
  form: CandidateFormData,
  weId: string,
  lookupResolution: CallNotesCatalogResolution | undefined,
): boolean {
  const weIdx = ensureWorkExperience(form, weId)
  const we = form.workExperiences[weIdx]
  if (!isEmptyFormValue(we.employerName) || we.employerId != null) return false
  if (!lookupResolution || lookupResolution.kind !== "employer") return false
  we.employerId = lookupResolution.catalogId
  we.employerName = lookupResolution.catalogName
  return true
}

function applyExtractionToForm(
  form: CandidateFormData,
  extraction: CallNotesExtraction,
  meta: AllowedEmptyField,
  lookupResolutions?: ReadonlyMap<string, CallNotesCatalogResolution>,
): { ok: true } | { ok: false; reason: string } {
  const path = extraction.fieldPath
  const lookupResolution = lookupResolutions?.get(path)

  if (meta.requiresLookupResolution && !lookupResolution) {
    return { ok: false, reason: "Catalog lookup must be resolved before apply." }
  }

  const projectEmployerMatch =
    /^workExperiences\[([^\]]+)\]\.projects\[([^\]]+)\]\.employerName$/.exec(path)
  if (projectEmployerMatch) {
    const ok = writeProjectEmployerToWorkExperience(form, projectEmployerMatch[1], lookupResolution)
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason:
            "Work experience employer is no longer empty or employer catalog is unresolved.",
        }
  }

  const rootMatch = /^([a-zA-Z]+)$/.exec(path)
  if (rootMatch && ROOT_KEYS.has(rootMatch[1])) {
    return writeRootField(form, rootMatch[1], meta.fieldType, extraction.value)
      ? { ok: true }
      : { ok: false, reason: "Field is no longer empty or value invalid." }
  }

  const weMatch = /^workExperiences\[([^\]]+)\]\.([a-zA-Z]+)$/.exec(path)
  if (weMatch) {
    const ok = writeWeField(
      form,
      weMatch[1],
      weMatch[2],
      meta.fieldType,
      extraction.value,
      meta,
      lookupResolution,
    )
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: WE_KEYS.has(weMatch[2])
            ? "Field is no longer empty, unsupported value, or not in edit form."
            : "Employer/project catalog field not supported in edit/create form v1.",
        }
  }

  const projMatch =
    /^workExperiences\[([^\]]+)\]\.projects\[([^\]]+)\]\.([a-zA-Z]+)$/.exec(path)
  if (projMatch) {
    const ok = writeProjectField(
      form,
      projMatch[1],
      projMatch[2],
      projMatch[3],
      meta.fieldType,
      extraction.value,
      meta,
      lookupResolution,
    )
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: PROJECT_KEYS.has(projMatch[3])
            ? "Field is no longer empty or value invalid."
            : "Project catalog field not supported in edit/create form v1.",
        }
  }

  const certMatch = /^certifications\[([^\]]+)\]\.([a-zA-Z]+)$/.exec(path)
  if (certMatch) {
    const ok = writeCertField(
      form,
      certMatch[1],
      certMatch[2],
      meta.fieldType,
      extraction.value,
      meta,
      lookupResolution,
    )
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: CERT_KEYS.has(certMatch[2])
            ? "Field is no longer empty or value invalid."
            : "Certification field not supported in edit/create form v1.",
        }
  }

  const achMatch = /^achievements\[([^\]]+)\]\.([a-zA-Z]+)$/.exec(path)
  if (achMatch) {
    const ok = writeAchievementField(form, achMatch[1], achMatch[2], meta.fieldType, extraction.value)
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: ACH_KEYS.has(achMatch[2])
            ? "Field is no longer empty or value invalid."
            : "Achievement field not supported in edit/create form v1.",
        }
  }

  if (/^workExperiences\[/.test(path)) {
    return {
      ok: false,
      reason: "Employer office/layoff/catalog field not supported in edit/create form v1.",
    }
  }

  return { ok: false, reason: "Unsupported field path for apply." }
}

export function formatCallNotesApplyToast(result: ApplyCallNotesExtractionsResult): string {
  const { applied, skipped } = result
  if (applied.length === 0) {
    return skipped.length > 0
      ? `No fields applied (${skipped.length} skipped). Review and try again.`
      : "No fields were applied."
  }
  const appliedPart = `Applied ${applied.length} field${applied.length === 1 ? "" : "s"}`
  if (skipped.length === 0) {
    return `${appliedPart} — review and save.`
  }
  return `${appliedPart} (${skipped.length} skipped) — review and save.`
}

export function applyCallNotesExtractionsToFormData(
  baseForm: CandidateFormData,
  extractions: CallNotesExtraction[],
  allowedEmptyFields: AllowedEmptyField[],
  lookupResolutions?: ReadonlyMap<string, CallNotesCatalogResolution>,
): ApplyCallNotesExtractionsResult {
  const metaByPath = new Map(allowedEmptyFields.map((f) => [f.fieldPath, f]))
  const form = cloneFormData(baseForm)
  const applied: string[] = []
  const skipped: Array<{ fieldPath: string; reason: string }> = []

  for (const extraction of extractions) {
    const meta = metaByPath.get(extraction.fieldPath)
    if (!meta) {
      skipped.push({ fieldPath: extraction.fieldPath, reason: "Not in extract whitelist." })
      continue
    }
    const result = applyExtractionToForm(form, extraction, meta, lookupResolutions)
    if (result.ok) {
      applied.push(extraction.fieldPath)
    } else {
      skipped.push({ fieldPath: extraction.fieldPath, reason: result.reason })
    }
  }

  return { formData: form, applied, skipped }
}
