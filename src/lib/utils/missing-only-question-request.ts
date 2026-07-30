import type {
  AchievementForService,
  CandidateDataForQuestionService,
  CertificationForService,
  WorkExperienceForService,
  WorkExperienceLayoffForService,
  WorkExperienceOfficeForService,
  WorkExperienceProjectForService,
} from "@/types/question-generation"
import {
  coldCallerQgProjectFieldDefs,
  isProjectCatalogFieldMissing,
} from "@/lib/utils/project-catalog-fields"
import { isQgValueMissing } from "@/lib/utils/qg-value"
import {
  ACHIEVEMENT_FIELD_ORDER,
  CERTIFICATION_FIELD_ORDER,
  LAYOFF_FIELD_ORDER,
  OFFICE_FIELD_ORDER,
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
  WORK_EXPERIENCE_ROLE_FIELD_ORDER,
} from "@/lib/utils/qg-field-weights"
import { isWorkExperienceEmployerPresent } from "@/lib/utils/work-experience-questions"

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
  "types",
  "publishPlatforms",
  "technicalAspects",
  "technicalDomains",
  "horizontalDomains",
  "verticalDomains",
  "clientLocations",
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
  includeProjectEmployerFields: boolean,
): WorkExperienceProjectForService {
  const source = (project ?? {}) as Record<string, unknown>
  const sparse: SparseRecord = {}

  for (const field of coldCallerQgProjectFieldDefs(includeProjectEmployerFields)) {
    const apiFieldName = `work_experience_${workExperienceIndex}_project_${projectIndex}_${field.apiSuffix}`
    const value = source[field.payloadKey]

    // Contribution: always request Advanced generation (even when populated).
    // Populated value is omitted from sparse candidate_data (LLM context not required).
    if (field.payloadKey === "contributionNotes") {
      fieldsToGenerate.push(apiFieldName)
      if (isProjectCatalogFieldMissing(field.payloadKey, value)) {
        sparse[field.payloadKey] = sparseMissingValue(field.payloadKey, value)
      }
      continue
    }

    if (!isProjectCatalogFieldMissing(field.payloadKey, value)) continue
    pushMissing(fieldsToGenerate, apiFieldName, sparse, field.payloadKey, value)
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
  const includeProjectEmployerFields = !isWorkExperienceEmployerPresent(source)
  sparse.projects = projectRows.map((project, projectIndex) =>
    projectSparse(
      project,
      workExperienceIndex,
      projectIndex,
      fieldsToGenerate,
      includeProjectEmployerFields,
    ),
  )

  return sparse as WorkExperienceForService
}

function certificationSparse(
  certification: CertificationForService | undefined,
  certificationIndex: number,
  fieldsToGenerate: string[],
): CertificationForService {
  const source = certification ?? {}
  const sparse: SparseRecord = {}

  for (const key of CERTIFICATION_FIELD_ORDER) {
    if (key === "name") {
      if (!isQgValueMissing(source.certificationName)) continue
      pushMissing(
        fieldsToGenerate,
        `certification_${certificationIndex}_name`,
        sparse,
        "certificationName",
        source.certificationName,
      )
      continue
    }

    const value = source[key]
    if (!isQgValueMissing(value)) continue
    pushMissing(
      fieldsToGenerate,
      `certification_${certificationIndex}_${key}`,
      sparse,
      key,
      value,
    )
  }

  return sparse as CertificationForService
}

function achievementSparse(
  achievement: AchievementForService | undefined,
  achievementIndex: number,
  fieldsToGenerate: string[],
): AchievementForService {
  const source = achievement ?? {}
  const sparse: SparseRecord = {}

  for (const key of ACHIEVEMENT_FIELD_ORDER) {
    const value = source[key]
    if (!isQgValueMissing(value)) continue
    pushMissing(
      fieldsToGenerate,
      `achievement_${achievementIndex}_${key}`,
      sparse,
      key,
      value,
    )
  }

  return sparse as AchievementForService
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

  if (isQgValueMissing(candidateData.resume)) {
    sparse.resume = candidateData.resume ?? null
    fieldsToGenerate.push("resume")
  }
  if (isQgValueMissing(candidateData.linkedinUrl)) {
    sparse.linkedinUrl = candidateData.linkedinUrl ?? null
    fieldsToGenerate.push("linkedinUrl")
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

  const certifications = candidateData.certifications ?? []
  const certificationRows =
    certifications.length > 0 ? certifications : [undefined]
  sparse.certifications = certificationRows.map((row, index) =>
    certificationSparse(row, index, fieldsToGenerate),
  )

  const achievements = candidateData.achievements ?? []
  const achievementRows = achievements.length > 0 ? achievements : [undefined]
  sparse.achievements = achievementRows.map((row, index) =>
    achievementSparse(row, index, fieldsToGenerate),
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
