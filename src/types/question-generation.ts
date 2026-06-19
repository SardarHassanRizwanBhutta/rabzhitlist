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

export interface ApiGeneratedQuestion {
  question: string
  field: string
  section: QuestionSectionId
  priority: number
  context: string
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

export interface WorkExperienceProjectForService {
  projectName?: string | null
  contributionNotes?: string | null
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
}

export interface StandaloneProjectForService {
  projectName?: string | null
  contributionNotes?: string | null
}

export interface EducationForService {
  universityLocationName?: string | null
  degreeName?: string | null
  majorName?: string | null
  startMonth?: string | null
  endMonth?: string | null
  grades?: string | null
  isTopper?: boolean | null
  isCheetah?: boolean | null
}

export interface CertificationForService {
  certificationName?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  certificationUrl?: string | null
  certificationLevel?: string | null
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
