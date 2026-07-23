import type { Candidate, WorkExperience } from "@/lib/types/candidate"
import type {
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

/**
 * Maps the main-app Candidate to the Python Question Generation Service shape.
 * @see docs/CANDIDATE_DATA_MAPPING.md
 */
export function mapMainAppCandidateToQuestionService(
  candidate: Candidate,
): CandidateDataForQuestionService {
  return {
    cnic: emptyToNull(candidate.cnic),
    currentSalary: candidate.currentSalary ?? null,
    expectedSalary: candidate.expectedSalary ?? null,
    personalityType: emptyToNull(candidate.personalityType),
    techStacks: candidate.techStacks ?? [],
    workExperiences: (candidate.workExperiences ?? []).map(mapWorkExperience),
    educations: (candidate.educations ?? []).map(mapEducation),
    certifications: (candidate.certifications ?? []).map(mapCertification),
  }
}
