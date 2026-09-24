import { isRecruiter } from "@/lib/auth/roles"
import type { CreateCandidateDto } from "@/lib/services/candidates-api"
import type { UserRole } from "@/lib/types/user-role"

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
