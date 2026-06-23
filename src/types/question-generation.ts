/** Types for the Python Question Generation Service — see docs/FRONTEND_INTEGRATION_CONTRACT.md */

export type QuestionSectionId =
  | "basic_information"
  | "work_experience"
  | "independent_tech_stacks"
  | "independent_projects"
  | "education"
  | "certifications"
  | "achievements"

export interface GenerateQuestionsRequest {
  candidate_id: string
  candidate_data: CandidateDataForQuestionService
  conversation_context?: "cold_call" | string
}

export type PromptType = "missing" | "enrichment"

export interface ApiGeneratedQuestion {
  question: string
  field: string
  section: QuestionSectionId
  priority: number
  context: string
  prompt_type?: PromptType
  /** Populated for enrichment prompts (certification names, tech stacks, project names, opener lists). */
  existing_values?: string[] | null
}

export interface SectionQuestionResult {
  section: QuestionSectionId
  label: string
  missing_fields: string[]
  questions: ApiGeneratedQuestion[]
}

export interface GenerateQuestionsResponse {
  sections: SectionQuestionResult[]
  generated_at: string
  candidate_id: string
  total_questions: number
}

export interface QuestionsHealthResponse {
  status: string
  model?: string
}

export type AchievementTypeForService =
  | "competition"
  | "openSource"
  | "award"
  | "medal"
  | "publication"
  | "certification"
  | "recognition"
  | "other"

export interface BenefitForService {
  name?: string
  amount?: number | null
  unit?: string | null
}

export interface LinkedProjectForService {
  projectName?: string | null
  contributionNotes?: string | null
  employerName?: string | null
  projectType?: string | null
  status?: string | null
  teamSize?: string | number | null
  minTeamSize?: number | null
  maxTeamSize?: number | null
  techStacks?: string[]
  technicalAspects?: string[]
  horizontalDomains?: string[]
  verticalDomains?: string[]
  description?: string | null
  notes?: string | null
  startDate?: string | null
  endDate?: string | null
  link?: string | null
  isPublished?: boolean | null
  publishPlatforms?: string[]
  downloadCount?: number | null
}

export type WorkExperienceProjectForService = LinkedProjectForService

export type StandaloneProjectForService = LinkedProjectForService

export interface WorkExperienceOfficeForService {
  country?: string | null
  city?: string | null
  address?: string | null
  isHeadquarters?: boolean | null
}

export interface WorkExperienceLayoffForService {
  layoffDate?: string | null
  affectedEmployees?: number | null
  reason?: string | null
  source?: string | null
}

export interface WorkExperienceForService {
  employerName?: string | null
  jobTitle?: string | null
  startDate?: string | null
  endDate?: string | null
  techStacks?: string[]
  shiftType?: string | null
  workMode?: string | null
  timeSupportZones?: string[]
  benefits?: BenefitForService[]
  projects?: WorkExperienceProjectForService[]
  foundedYear?: number | null
  status?: string | null
  types?: string[]
  ranking?: string | null
  minEmployees?: number | null
  maxEmployees?: number | null
  websiteUrl?: string | null
  linkedInUrl?: string | null
  isDplCompetitor?: boolean | null
  salaryPolicy?: string | null
  tags?: string[]
  locations?: WorkExperienceOfficeForService[]
  layoffs?: WorkExperienceLayoffForService[]
}

export interface EducationLocationForService {
  city?: string | null
  address?: string | null
  isMainCampus?: boolean | null
}

export interface EducationForService {
  universityName?: string | null
  /** Legacy fallback — server reads as `universityName` when `universityName` absent. */
  universityLocationName?: string | null
  degreeName?: string | null
  majorName?: string | null
  startMonth?: string | null
  endMonth?: string | null
  grades?: string | null
  isTopper?: boolean | null
  isCheetah?: boolean | null
  country?: string | null
  ranking?: string | null
  websiteUrl?: string | null
  linkedinUrl?: string | null
  locations?: EducationLocationForService[]
}

export interface CertificationForService {
  certificationName?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  certificationUrl?: string | null
  certificationLevel?: string | null
  issuingBody?: string | null
  issuingBodyUrl?: string | null
}

export interface AchievementForService {
  name?: string | null
  achievementType?: AchievementTypeForService | null
  type?: number | null
  ranking?: string | null
  year?: number | null
  url?: string | null
  description?: string | null
}

export interface CandidateDataForQuestionService {
  name?: string | null
  postingTitle?: string | null
  email?: string | null
  mobileNo?: string | null
  cnic?: string | null
  city?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  resume?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  source?: string | null
  personalityType?: string | null
  isTopDeveloper?: boolean | null
  techStacks?: string[]
  projects?: StandaloneProjectForService[]
  workExperiences?: WorkExperienceForService[]
  educations?: EducationForService[]
  certifications?: CertificationForService[]
  achievements?: AchievementForService[]
}
