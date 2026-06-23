import type { Candidate, Competition, WorkExperience } from "@/lib/types/candidate"
import type {
  AchievementForService,
  CandidateDataForQuestionService,
  CertificationForService,
  EducationForService,
  WorkExperienceForService,
} from "@/types/question-generation"
import { mapLinkedProjectToServicePayload } from "@/lib/utils/map-linked-project-for-service"
import { mapCertificationToServicePayload } from "@/lib/utils/map-certification-for-service"
import { mapEducationToServicePayload } from "@/lib/utils/map-education-for-service"
import { mapWorkExperienceToServicePayload } from "@/lib/utils/map-work-experience-for-service"

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function mapResume(hasResume: boolean | undefined): string | null {
  if (hasResume) return "attached"
  return null
}

function mapWorkExperience(we: WorkExperience): WorkExperienceForService {
  return mapWorkExperienceToServicePayload(we)
}

function mapEducation(
  edu: NonNullable<Candidate["educations"]>[number],
): EducationForService {
  return mapEducationToServicePayload(edu)
}

function mapCertification(
  cert: NonNullable<Candidate["certifications"]>[number],
): CertificationForService {
  return mapCertificationToServicePayload(cert)
}

function mapAchievements(candidate: Candidate): AchievementForService[] {
  if (candidate.achievements?.length) {
    return candidate.achievements.map((ach) => ({
      name: emptyToNull(ach.name) ?? ach.name,
      achievementType: ach.achievementType,
      ranking: emptyToNull(ach.ranking),
      year: ach.year ?? null,
      url: emptyToNull(ach.url),
      description: emptyToNull(ach.description),
    }))
  }

  const legacy = candidate.competitions ?? []
  return legacy.map((comp: Competition) => ({
    name: emptyToNull(comp.competitionName) ?? comp.competitionName,
    achievementType: "competition" as const,
    ranking: emptyToNull(comp.ranking),
    year: comp.year ?? null,
    url: emptyToNull(comp.url),
    description: null,
  }))
}

/**
 * Maps the main-app Candidate to the Python Question Generation Service shape.
 * @see docs/CANDIDATE_DATA_MAPPING.md
 */
export function mapMainAppCandidateToQuestionService(
  candidate: Candidate,
): CandidateDataForQuestionService {
  return {
    name: emptyToNull(candidate.name) ?? candidate.name,
    postingTitle: emptyToNull(candidate.postingTitle),
    email: emptyToNull(candidate.email) ?? candidate.email,
    mobileNo: emptyToNull(candidate.mobileNo) ?? candidate.mobileNo,
    cnic: emptyToNull(candidate.cnic),
    city: emptyToNull(candidate.city) ?? candidate.city,
    githubUrl: emptyToNull(candidate.githubUrl),
    linkedinUrl: emptyToNull(candidate.linkedinUrl),
    resume: mapResume(candidate.hasResume),
    currentSalary: candidate.currentSalary ?? null,
    expectedSalary: candidate.expectedSalary ?? null,
    source: emptyToNull(candidate.source) ?? candidate.source,
    personalityType: emptyToNull(candidate.personalityType),
    isTopDeveloper: candidate.isTopDeveloper ?? false,
    techStacks: candidate.techStacks ?? [],
    projects: (candidate.projects ?? []).map(mapLinkedProjectToServicePayload),
    workExperiences: (candidate.workExperiences ?? []).map(mapWorkExperience),
    educations: (candidate.educations ?? []).map(mapEducation),
    certifications: (candidate.certifications ?? []).map(mapCertification),
    achievements: mapAchievements(candidate),
  }
}
