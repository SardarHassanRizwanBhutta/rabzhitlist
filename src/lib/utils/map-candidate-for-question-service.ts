import type { Candidate, WorkExperience } from "@/lib/types/candidate"
import type {
  AchievementForService,
  CandidateDataForQuestionService,
  CertificationForService,
  WorkExperienceForService,
} from "@/types/question-generation"
import { mapAchievementToServicePayload } from "@/lib/utils/map-achievement-for-service"
import { mapCertificationToServicePayload } from "@/lib/utils/map-certification-for-service"
import { mapWorkExperienceToServicePayload } from "@/lib/utils/map-work-experience-for-service"

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function mapWorkExperience(we: WorkExperience): WorkExperienceForService {
  return mapWorkExperienceToServicePayload(we)
}

function mapCertification(
  cert: NonNullable<Candidate["certifications"]>[number],
): CertificationForService {
  return mapCertificationToServicePayload(cert)
}

function mapAchievement(
  achievement: NonNullable<Candidate["achievements"]>[number],
): AchievementForService {
  return mapAchievementToServicePayload(achievement)
}

/**
 * Maps the main-app Candidate to the Python Question Generation Service shape.
 * @see docs/CANDIDATE_DATA_MAPPING.md
 */
export function mapMainAppCandidateToQuestionService(
  candidate: Candidate,
): CandidateDataForQuestionService {
  return {
    resume: candidate.hasResume === true ? "attached" : null,
    linkedinUrl: emptyToNull(candidate.linkedinUrl),
    currentSalary: candidate.currentSalary ?? null,
    expectedSalary: candidate.expectedSalary ?? null,
    techStacks: candidate.techStacks ?? [],
    workExperiences: (candidate.workExperiences ?? []).map(mapWorkExperience),
    certifications: (candidate.certifications ?? []).map(mapCertification),
    achievements: (candidate.achievements ?? []).map(mapAchievement),
  }
}
