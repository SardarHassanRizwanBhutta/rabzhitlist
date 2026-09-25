import { isRecruiter } from "@/lib/auth/roles"
import type { CreateCandidateDto } from "@/lib/services/candidates-api"
import type { Candidate } from "@/lib/types/candidate"
import type { UserRole } from "@/lib/types/user-role"
import type { CandidateDataForQuestionService } from "@/types/question-generation"

export type CandidateListQueryOptions = {
  currentSalaryMin?: number
  currentSalaryMax?: number
  expectedSalaryMin?: number
  expectedSalaryMax?: number
  employerSalaryPolicies?: number[]
  workExperienceSalaryPolicies?: number[]
  workExperienceBenefitIds?: number[]
}

/** Query params Recruiter must not send (403). */
export function stripRecruiterForbiddenListQueryOptions<T extends CandidateListQueryOptions>(
  role: UserRole | null | undefined,
  options: T | undefined,
): T | undefined {
  if (!isRecruiter(role) || !options) return options
  const next = { ...options }
  delete next.currentSalaryMin
  delete next.currentSalaryMax
  delete next.expectedSalaryMin
  delete next.expectedSalaryMax
  delete next.employerSalaryPolicies
  delete next.workExperienceSalaryPolicies
  delete next.workExperienceBenefitIds
  return next
}

export function stripRecruiterCompensationFromCreateDto(
  dto: CreateCandidateDto,
  role: UserRole | null | undefined,
): CreateCandidateDto {
  if (!isRecruiter(role)) return dto
  const { currentSalary: _c, expectedSalary: _e, workExperiences, ...rest } = dto
  const trimmedWe = workExperiences?.map((we) => {
    const { salaryPolicy: _sp, benefits: _b, ...weRest } = we
    return weRest
  })
  return {
    ...rest,
    ...(trimmedWe?.length ? { workExperiences: trimmedWe } : {}),
  }
}

const RECRUITER_EXCLUDED_QG_ROOT_FIELDS = new Set(["currentSalary", "expectedSalary"])

/** Whether this QG `fields_to_generate` key must not be sent for Recruiter actors. */
export function isRecruiterExcludedQgApiField(apiFieldName: string): boolean {
  if (RECRUITER_EXCLUDED_QG_ROOT_FIELDS.has(apiFieldName)) return true
  if (/^work_experience_\d+_salaryPolicy$/.test(apiFieldName)) return true
  if (/^work_experience_\d+_benefits$/.test(apiFieldName)) return true
  return false
}

/** Remove compensation keys from generate-questions `fields_to_generate` for Recruiter. */
export function filterRecruiterQgFieldsToGenerate(
  role: UserRole | null | undefined,
  fields: string[],
): string[] {
  if (!isRecruiter(role)) return fields
  return fields.filter((field) => !isRecruiterExcludedQgApiField(field))
}

/** Omit compensation from sparse QG `candidate_data` for Recruiter (aligned with fields filter). */
export function stripRecruiterCompensationFromQgCandidateData(
  candidateData: CandidateDataForQuestionService,
): CandidateDataForQuestionService {
  const { currentSalary: _c, expectedSalary: _e, workExperiences, ...rest } = candidateData
  if (!workExperiences?.length) {
    return rest
  }
  const trimmedWe = workExperiences.map((we) => {
    const { salaryPolicy: _sp, benefits: _b, ...weRest } = we
    return weRest
  })
  return { ...rest, workExperiences: trimmedWe }
}

/** In-memory candidate for Call Notes / Cold Caller when compensation UI is hidden. */
export function stripRecruiterCompensationFromCandidate(candidate: Candidate): Candidate {
  const { currentSalary: _c, expectedSalary: _e, workExperiences, ...rest } = candidate
  const base = { ...rest, currentSalary: null, expectedSalary: null }
  if (!workExperiences?.length) {
    return base
  }
  const trimmedWe = workExperiences.map((we) => {
    const { salaryPolicy: _sp, benefits: _b, ...weRest } = we
    return { ...weRest, benefits: [], salaryPolicy: null }
  })
  return { ...base, workExperiences: trimmedWe }
}
