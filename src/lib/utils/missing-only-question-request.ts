import type {
  CandidateDataForQuestionService,
  CertificationForService,
  EducationForService,
  WorkExperienceForService,
  WorkExperienceLayoffForService,
  WorkExperienceOfficeForService,
  WorkExperienceProjectForService,
} from "@/types/question-generation"
import {
  isProjectCatalogFieldMissing,
  PROJECT_FIELD_DEFS,
} from "@/lib/utils/project-catalog-fields"
import { isQgValueMissing } from "@/lib/utils/qg-value"
import {
  LAYOFF_FIELD_ORDER,
  OFFICE_FIELD_ORDER,
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
  WORK_EXPERIENCE_ROLE_FIELD_ORDER,
} from "@/lib/utils/qg-field-weights"

export interface MissingOnlyQuestionRequest {
  candidateData: CandidateDataForQuestionService
  fieldsToGenerate: string[]
}

type SparseRecord = Record<string, unknown>

/** Payload keys typed as lists on the Python QG request model — never send null. */
const LIST_PAYLOAD_KEYS = new Set([
  "techStacks",
  "timeSupportZones",
  "benefits",
  "awards",
  "publishPlatforms",
  "technicalAspects",
  "technicalDomains",
  "horizontalDomains",
  "verticalDomains",
])

function sparseMissingValue(payloadKey: string, value: unknown): unknown {
  if (LIST_PAYLOAD_KEYS.has(payloadKey)) {
    return Array.isArray(value) ? value : []
  }
  return value ?? null
}

function pushMissing(
  fieldsToGenerate: string[],
  apiFieldName: string,
  sparse: SparseRecord,
  payloadKey: string,
  value: unknown,
): void {
  sparse[payloadKey] = sparseMissingValue(payloadKey, value)
  fieldsToGenerate.push(apiFieldName)
}

function projectSparse(
  project: WorkExperienceProjectForService | undefined,
  workExperienceIndex: number,
  projectIndex: number,
  fieldsToGenerate: string[],
): WorkExperienceProjectForService {
  const source = (project ?? {}) as Record<string, unknown>
  const sparse: SparseRecord = {}

  for (const field of PROJECT_FIELD_DEFS) {
    const value = source[field.payloadKey]
    if (!isProjectCatalogFieldMissing(field.payloadKey, value)) continue
    pushMissing(
      fieldsToGenerate,
      `work_experience_${workExperienceIndex}_project_${projectIndex}_${field.apiSuffix}`,
      sparse,
      field.payloadKey,
      value,
    )
  }

  return sparse as WorkExperienceProjectForService
}

function officeSparse(
  office: WorkExperienceOfficeForService | undefined,
  workExperienceIndex: number,
  officeIndex: number,
  fieldsToGenerate: string[],
): WorkExperienceOfficeForService {
  const source = office ?? {}
  const sparse: SparseRecord = {}

  for (const key of OFFICE_FIELD_ORDER) {
    const value = source[key]
    if (!isQgValueMissing(value)) continue
    pushMissing(
      fieldsToGenerate,
      `work_experience_${workExperienceIndex}_office_${officeIndex}_${key}`,
      sparse,
      key,
      value,
    )
  }

  return sparse as WorkExperienceOfficeForService
}

function layoffSparse(
  layoff: WorkExperienceLayoffForService | undefined,
  workExperienceIndex: number,
  layoffIndex: number,
  fieldsToGenerate: string[],
): WorkExperienceLayoffForService {
  const source = layoff ?? {}
  const sparse: SparseRecord = {}

  for (const key of LAYOFF_FIELD_ORDER) {
    const value = source[key]
    if (!isQgValueMissing(value)) continue
    pushMissing(
      fieldsToGenerate,
      `work_experience_${workExperienceIndex}_layoff_${layoffIndex}_${key}`,
      sparse,
      key,
      value,
    )
  }

  return sparse as WorkExperienceLayoffForService
}

function workExperienceSparse(
  workExperience: WorkExperienceForService | undefined,
  workExperienceIndex: number,
  fieldsToGenerate: string[],
): WorkExperienceForService {
  const source = workExperience ?? {}
  const sparse: SparseRecord = {}

  for (const key of WORK_EXPERIENCE_ROLE_FIELD_ORDER) {
    const value = source[key]
    if (!isQgValueMissing(value)) continue
    pushMissing(
      fieldsToGenerate,
      `work_experience_${workExperienceIndex}_${key}`,
      sparse,
      key,
      value,
    )
  }

  for (const key of WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER) {
    const value = source[key]
    if (!isQgValueMissing(value)) continue
    pushMissing(
      fieldsToGenerate,
      `work_experience_${workExperienceIndex}_${key}`,
      sparse,
      key,
      value,
    )
  }

  const locationsSource = source.locations ?? []
  const locationRows =
    locationsSource.length > 0 ? locationsSource : [undefined]
  sparse.locations = locationRows.map((office, officeIndex) =>
    officeSparse(office, workExperienceIndex, officeIndex, fieldsToGenerate),
  )

  const layoffsSource = source.layoffs ?? []
  const layoffRows = layoffsSource.length > 0 ? layoffsSource : [undefined]
  sparse.layoffs = layoffRows.map((layoff, layoffIndex) =>
    layoffSparse(layoff, workExperienceIndex, layoffIndex, fieldsToGenerate),
  )

  const projectsSource = source.projects ?? []
  const projectRows = projectsSource.length > 0 ? projectsSource : [undefined]
  sparse.projects = projectRows.map((project, projectIndex) =>
    projectSparse(project, workExperienceIndex, projectIndex, fieldsToGenerate),
  )

  return sparse as WorkExperienceForService
}

function educationSparse(
  education: EducationForService | undefined,
  educationIndex: number,
  fieldsToGenerate: string[],
): EducationForService {
  const source = education ?? {}
  const sparse: SparseRecord = {}

  if (isQgValueMissing(source.universityName)) {
    pushMissing(
      fieldsToGenerate,
      `education_${educationIndex}_universityName`,
      sparse,
      "universityName",
      source.universityName,
    )
  }

  if (isQgValueMissing(source.isTopper)) {
    pushMissing(
      fieldsToGenerate,
      `education_${educationIndex}_isTopper`,
      sparse,
      "isTopper",
      source.isTopper,
    )
  }

  return sparse as EducationForService
}

function certificationSparse(
  certification: CertificationForService | undefined,
  certificationIndex: number,
  fieldsToGenerate: string[],
): CertificationForService {
  const source = certification ?? {}
  const sparse: SparseRecord = {}

  if (isQgValueMissing(source.certificationName)) {
    pushMissing(
      fieldsToGenerate,
      `certification_${certificationIndex}_name`,
      sparse,
      "certificationName",
      source.certificationName,
    )
  }

  if (isQgValueMissing(source.issueDate)) {
    pushMissing(
      fieldsToGenerate,
      `certification_${certificationIndex}_issueDate`,
      sparse,
      "issueDate",
      source.issueDate,
    )
  }

  if (isQgValueMissing(source.expiryDate)) {
    pushMissing(
      fieldsToGenerate,
      `certification_${certificationIndex}_expiryDate`,
      sparse,
      "expiryDate",
      source.expiryDate,
    )
  }

  if (isQgValueMissing(source.issuingBody)) {
    pushMissing(
      fieldsToGenerate,
      `certification_${certificationIndex}_issuingBody`,
      sparse,
      "issuingBody",
      source.issuingBody,
    )
  }

  return sparse as CertificationForService
}

/**
 * Builds a sparse QG payload and the authoritative `fields_to_generate` list for
 * every missing allowlisted key. Populated values are omitted. Empty collections
 * and empty nested projects/locations/layoffs use synthetic index 0.
 */
export function buildMissingOnlyQuestionRequest(
  candidateData: CandidateDataForQuestionService,
): MissingOnlyQuestionRequest {
  const fieldsToGenerate: string[] = []
  const sparse: CandidateDataForQuestionService = {}

  if (isQgValueMissing(candidateData.cnic)) {
    sparse.cnic = candidateData.cnic ?? null
    fieldsToGenerate.push("cnic")
  }
  if (isQgValueMissing(candidateData.personalityType)) {
    sparse.personalityType = candidateData.personalityType ?? null
    fieldsToGenerate.push("personalityType")
  }
  if (isQgValueMissing(candidateData.currentSalary)) {
    sparse.currentSalary = candidateData.currentSalary ?? null
    fieldsToGenerate.push("currentSalary")
  }
  if (isQgValueMissing(candidateData.expectedSalary)) {
    sparse.expectedSalary = candidateData.expectedSalary ?? null
    fieldsToGenerate.push("expectedSalary")
  }
  if (isQgValueMissing(candidateData.techStacks)) {
    sparse.techStacks = candidateData.techStacks ?? []
    fieldsToGenerate.push("techStacks")
  }

  const workExperiences = candidateData.workExperiences ?? []
  const workExperienceRows =
    workExperiences.length > 0 ? workExperiences : [undefined]
  sparse.workExperiences = workExperienceRows.map((row, index) =>
    workExperienceSparse(row, index, fieldsToGenerate),
  )

  const educations = candidateData.educations ?? []
  const educationRows = educations.length > 0 ? educations : [undefined]
  sparse.educations = educationRows.map((row, index) =>
    educationSparse(row, index, fieldsToGenerate),
  )

  const certifications = candidateData.certifications ?? []
  const certificationRows =
    certifications.length > 0 ? certifications : [undefined]
  sparse.certifications = certificationRows.map((row, index) =>
    certificationSparse(row, index, fieldsToGenerate),
  )

  return {
    candidateData: sparse,
    fieldsToGenerate,
  }
}

/** @deprecated Use buildMissingOnlyQuestionRequest */
export function buildProjectMissingOnlyQuestionRequest(
  candidateData: CandidateDataForQuestionService,
): MissingOnlyQuestionRequest {
  return buildMissingOnlyQuestionRequest(candidateData)
}
