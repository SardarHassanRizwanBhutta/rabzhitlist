/** Types for the Python Question Generation Service — see docs/FRONTEND_INTEGRATION_CONTRACT.md */

export type QuestionSectionId =
  | "basic_information"
  | "preferences"
  | "work_experience"
  | "independent_tech_stacks"
  | "certifications"
  | "achievements"

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
  /**
   * Display labels for Basic/Advanced enum fields (stem-only `question`).
   * Omitted for open / non-enum fields. See COLD_CALLER_QG_LONG_ENUM_OPTIONS_CONTRACT.md.
   */
  options?: string[] | null
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
  averageTeamSize?: number | null
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
  clientLocations?: string[]
}

export type WorkExperienceProjectForService = LinkedProjectForService

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
}

export interface WorkExperienceForService {
  employerName?: string | null
  /** Present for FE employer-detection only; not a QG allowlisted field. */
  employerId?: number | null
  jobTitle?: string | null
  startDate?: string | null
  techStacks?: string[]
  shiftType?: string | null
  workMode?: string | null
  timeSupportZones?: string[]
  benefits?: BenefitForService[]
  projects?: WorkExperienceProjectForService[]
  status?: string | null
  headcount?: number | null
  types?: string[]
  foundedYear?: number | null
  linkedinUrl?: string | null
  awards?: string[]
  salaryPolicy?: string | null
  locations?: WorkExperienceOfficeForService[]
  layoffs?: WorkExperienceLayoffForService[]
}

export interface CertificationForService {
  certificationName?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  issuingBody?: string | null
}

export interface AchievementForService {
  name?: string | null
  year?: number | null
  description?: string | null
  achievementType?: string | null
  ranking?: string | null
  url?: string | null
}

export interface CandidateDataForQuestionService {
  /** `"attached"` when Candidate.hasResume; otherwise null/omitted when missing. */
  resume?: string | null
  linkedinUrl?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  techStacks?: string[]
  workExperiences?: WorkExperienceForService[]
  certifications?: CertificationForService[]
  achievements?: AchievementForService[]
}
