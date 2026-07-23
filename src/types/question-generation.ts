/** Types for the Python Question Generation Service — see docs/FRONTEND_INTEGRATION_CONTRACT.md */

export type QuestionSectionId =
  | "basic_information"
  | "work_experience"
  | "independent_tech_stacks"
  | "education"
  | "certifications"

export interface GenerateQuestionsRequest {
  candidate_id: string
  candidate_data: CandidateDataForQuestionService
  /** Authoritative missing allowlisted apiFieldName keys for every section. */
  fields_to_generate: string[]
  conversation_context?: "cold_call" | string
}

/** Python emits `basic` | `advanced`; `enrichment` is compatibility-only and FE drops it. */
export type PromptType = "basic" | "advanced" | "enrichment"

export interface ApiGeneratedQuestion {
  question: string
  field: string
  section: QuestionSectionId
  priority: number
  context: string
  prompt_type?: PromptType
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
  techStacks?: string[]
  technicalAspects?: string[]
  technicalDomains?: string[]
  horizontalDomains?: string[]
  verticalDomains?: string[]
  description?: string | null
  latestUpdate?: string | null
  startDate?: string | null
  endDate?: string | null
  link?: string | null
  publishPlatforms?: string[]
  downloadCount?: number | null
}

export type WorkExperienceProjectForService = LinkedProjectForService

export interface WorkExperienceOfficeForService {
  country?: string | null
  city?: string | null
  address?: string | null
}

export interface WorkExperienceLayoffForService {
  layoffDate?: string | null
  affectedEmployees?: number | null
  reason?: string | null
}

export interface WorkExperienceForService {
  employerName?: string | null
  jobTitle?: string | null
  techStacks?: string[]
  shiftType?: string | null
  workMode?: string | null
  timeSupportZones?: string[]
  benefits?: BenefitForService[]
  projects?: WorkExperienceProjectForService[]
  status?: string | null
  headcount?: number | null
  awards?: string[]
  salaryPolicy?: string | null
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
  isTopper?: boolean | null
}

export interface CertificationForService {
  certificationName?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  issuingBody?: string | null
}

export interface CandidateDataForQuestionService {
  cnic?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  personalityType?: string | null
  techStacks?: string[]
  workExperiences?: WorkExperienceForService[]
  educations?: EducationForService[]
  certifications?: CertificationForService[]
}
