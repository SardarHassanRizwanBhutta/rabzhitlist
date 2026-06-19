import type { Candidate, Competition, WorkExperience } from "@/lib/types/candidate"
import type { EmployerBenefit } from "@/lib/types/benefits"
import type {
  AchievementForService,
  BenefitForService,
  CandidateDataForQuestionService,
  CertificationForService,
  EducationForService,
  StandaloneProjectForService,
  WorkExperienceForService,
  WorkExperienceProjectForService,
} from "@/types/question-generation"

function toIsoDate(value: Date | undefined | null): string | null {
  if (value == null) return null
  try {
    return value.toISOString()
  } catch {
    return null
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function mapResume(hasResume: boolean | undefined): string | null {
  if (hasResume) return "attached"
  return null
}

function mapBenefit(benefit: EmployerBenefit): BenefitForService {
  if (!benefit.hasValue) {
    return { name: benefit.name, amount: null, unit: null }
  }
  return {
    name: benefit.name,
    amount: benefit.amount ?? null,
    unit: benefit.unit ?? null,
  }
}

function mapWorkExperienceProject(
  project: WorkExperience["projects"][number],
): WorkExperienceProjectForService {
  return {
    projectName: emptyToNull(project.projectName) ?? project.projectName,
    contributionNotes: emptyToNull(project.contributionNotes),
  }
}

function mapWorkExperience(we: WorkExperience): WorkExperienceForService {
  return {
    employerName: emptyToNull(we.employerName) ?? we.employerName,
    jobTitle: emptyToNull(we.jobTitle) ?? we.jobTitle,
    startDate: toIsoDate(we.startDate),
    endDate: toIsoDate(we.endDate),
    techStacks: we.techStacks ?? [],
    shiftType: emptyToNull(we.shiftType as string | null),
    workMode: emptyToNull(we.workMode as string | null),
    timeSupportZones: we.timeSupportZones ?? [],
    benefits: (we.benefits ?? []).map(mapBenefit),
    projects: (we.projects ?? []).map(mapWorkExperienceProject),
  }
}

function mapStandaloneProject(
  project: NonNullable<Candidate["projects"]>[number],
): StandaloneProjectForService {
  return {
    projectName: emptyToNull(project.projectName) ?? project.projectName,
    contributionNotes: emptyToNull(project.contributionNotes),
  }
}

function mapEducation(
  edu: NonNullable<Candidate["educations"]>[number],
): EducationForService {
  return {
    universityLocationName: emptyToNull(edu.universityLocationName) ?? edu.universityLocationName,
    degreeName: emptyToNull(edu.degreeName) ?? edu.degreeName,
    majorName: emptyToNull(edu.majorName) ?? edu.majorName,
    startMonth: toIsoDate(edu.startMonth),
    endMonth: toIsoDate(edu.endMonth),
    grades: emptyToNull(edu.grades),
    isTopper: edu.isTopper ?? null,
    isCheetah: edu.isCheetah ?? null,
  }
}

function mapCertification(
  cert: NonNullable<Candidate["certifications"]>[number],
): CertificationForService {
  return {
    certificationName: emptyToNull(cert.certificationName) ?? cert.certificationName,
    certificationLevel: emptyToNull(cert.certificationLevel as string | null),
    issueDate: toIsoDate(cert.issueDate),
    expiryDate: toIsoDate(cert.expiryDate),
    certificationUrl: emptyToNull(cert.certificationUrl),
  }
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
    projects: (candidate.projects ?? []).map(mapStandaloneProject),
    workExperiences: (candidate.workExperiences ?? []).map(mapWorkExperience),
    educations: (candidate.educations ?? []).map(mapEducation),
    certifications: (candidate.certifications ?? []).map(mapCertification),
    achievements: mapAchievements(candidate),
  }
}
