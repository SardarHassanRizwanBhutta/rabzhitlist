/**
 * Employer catalog empty-field rows for Cold Caller / Call Notes Extract.
 */

import type { WorkExperience } from "@/lib/types/candidate"
import type { EmptyField, FieldType } from "@/types/cold-caller"
import {
  EMPLOYER_STATUS_DB_LABELS,
  EMPLOYER_TYPE_DB_LABELS,
  type EmployerStatusDb,
  type EmployerTypeDb,
} from "@/lib/types/employer"
import {
  LAYOFF_FIELD_ORDER,
  OFFICE_FIELD_ORDER,
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
} from "@/lib/utils/qg-field-weights"
import { isQgValueMissing } from "@/lib/utils/qg-value"

const EMPLOYER_STATUS_OPTIONS = (
  Object.entries(EMPLOYER_STATUS_DB_LABELS) as [EmployerStatusDb, string][]
).map(([, label]) => ({ value: label, label }))

const EMPLOYER_TYPE_OPTIONS = (
  Object.entries(EMPLOYER_TYPE_DB_LABELS) as [EmployerTypeDb, string][]
).map(([, label]) => ({ value: label, label }))

const EMPLOYER_SCALAR_DEFS: Array<{
  key: string
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
}> = [
  { key: "headcount", label: "Headcount", type: "number" },
  { key: "types", label: "Type", type: "multiselect", options: EMPLOYER_TYPE_OPTIONS },
  { key: "foundedYear", label: "Founded Year", type: "number" },
  { key: "status", label: "Status", type: "select", options: EMPLOYER_STATUS_OPTIONS },
  { key: "linkedinUrl", label: "LinkedIn URL", type: "text" },
]

const OFFICE_DEFS: Array<{
  key: (typeof OFFICE_FIELD_ORDER)[number]
  label: string
  type: FieldType
  options?: { value: string; label: string }[]
}> = [
  { key: "country", label: "Country", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "isHeadquarters", label: "Headquarters", type: "boolean", options: [
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ] },
]

const LAYOFF_DEFS: Array<{
  key: (typeof LAYOFF_FIELD_ORDER)[number]
  label: string
  type: FieldType
}> = [
  { key: "layoffDate", label: "Layoff Date", type: "date" },
  { key: "affectedEmployees", label: "No. of Affected Employees", type: "number" },
  { key: "reason", label: "Reason", type: "text" },
]

function isEmptyEmployerScalar(key: string, value: unknown): boolean {
  if (key === "types") {
    return !Array.isArray(value) || value.length === 0
  }
  return isQgValueMissing(value)
}

export function buildWorkExperienceEmployerCatalogPlaceholderFields(
  index: number,
  context?: string,
): EmptyField[] {
  const fields: EmptyField[] = []

  for (const key of WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER) {
    if (key === "employerName" || key === "salaryPolicy") continue
    const def = EMPLOYER_SCALAR_DEFS.find((d) => d.key === key)
    if (!def) continue
    fields.push({
      fieldPath: `workExperiences[${index}].${key}`,
      apiFieldName: `work_experience_${index}_${key}`,
      fieldLabel: def.label,
      fieldType: def.type,
      section: "workExperience",
      currentValue: null,
      parentIndex: index,
      context,
      options: def.options,
    })
  }

  for (const def of OFFICE_DEFS) {
    fields.push({
      fieldPath: `workExperiences[${index}].locations[0].${def.key}`,
      apiFieldName: `work_experience_${index}_office_0_${def.key}`,
      fieldLabel: def.label,
      fieldType: def.type,
      section: "workExperience",
      currentValue: null,
      parentIndex: index,
      context,
      options: def.options,
    })
  }

  for (const def of LAYOFF_DEFS) {
    fields.push({
      fieldPath: `workExperiences[${index}].layoffs[0].${def.key}`,
      apiFieldName: `work_experience_${index}_layoff_0_${def.key}`,
      fieldLabel: def.label,
      fieldType: def.type,
      section: "workExperience",
      currentValue: null,
      parentIndex: index,
      context,
    })
  }

  return fields
}

export function collectMissingWorkExperienceEmployerCatalogFields(
  we: WorkExperience,
  index: number,
  context?: string,
): EmptyField[] {
  const fields: EmptyField[] = []
  const weRecord = we as unknown as Record<string, unknown>

  for (const def of EMPLOYER_SCALAR_DEFS) {
    const value = weRecord[def.key]
    if (!isEmptyEmployerScalar(def.key, value)) continue
    fields.push({
      fieldPath: `workExperiences[${index}].${def.key}`,
      apiFieldName: `work_experience_${index}_${def.key}`,
      fieldLabel: def.label,
      fieldType: def.type,
      section: "workExperience",
      context,
      currentValue: value,
      parentIndex: index,
      options: def.options,
    })
  }

  const locationRows =
    we.locations && we.locations.length > 0 ? we.locations : [undefined]
  locationRows.forEach((office, officeIndex) => {
    for (const def of OFFICE_DEFS) {
      const value = office?.[def.key as keyof typeof office]
      if (!isQgValueMissing(value)) continue
      fields.push({
        fieldPath: `workExperiences[${index}].locations[${officeIndex}].${def.key}`,
        apiFieldName: `work_experience_${index}_office_${officeIndex}_${def.key}`,
        fieldLabel: def.label,
        fieldType: def.type,
        section: "workExperience",
        context,
        currentValue: value,
        parentIndex: index,
        options: def.options,
      })
    }
  })

  const layoffRows = we.layoffs && we.layoffs.length > 0 ? we.layoffs : [undefined]
  layoffRows.forEach((layoff, layoffIndex) => {
    for (const def of LAYOFF_DEFS) {
      const value = layoff?.[def.key as keyof typeof layoff]
      if (!isQgValueMissing(value)) continue
      fields.push({
        fieldPath: `workExperiences[${index}].layoffs[${layoffIndex}].${def.key}`,
        apiFieldName: `work_experience_${index}_layoff_${layoffIndex}_${def.key}`,
        fieldLabel: def.label,
        fieldType: def.type,
        section: "workExperience",
        context,
        currentValue: value,
        parentIndex: index,
      })
    }
  })

  return fields
}
