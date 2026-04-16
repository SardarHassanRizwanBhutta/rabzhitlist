import { EmployerBenefit } from "./benefits"
import { CertificationLevel } from "./certification"

export type ShiftType = "Morning" | "Evening" | "Night" | "Rotational" | "24x7"
export type WorkMode = "Remote" | "Onsite" | "Hybrid"
export type TimeSupportZone = "US" | "UK" | "EU" | "APAC" | "MEA"

export interface ProjectExperience {
  id: string
  /** Linked project id for API payloads; null when not selected. */
  projectId: number | null
  /** Cached display name (from API or combobox). */
  projectName: string
  contributionNotes: string | null
}

export interface WorkExperience {
  id: string
  /** Linked employer (API); submit payloads should use this ID, not the name alone. */
  employerId?: number | null
  employerName: string
  jobTitle: string
  projects: ProjectExperience[]
  startDate: Date | undefined
  endDate: Date | undefined
  techStacks: string[]
  shiftType: ShiftType | "" | null
  workMode: WorkMode | "" | null
  timeSupportZones: string[]
  benefits: EmployerBenefit[]
}

export interface CandidateCertification {
  id: string
  /** Catalog certification id for API payloads; null when none selected. */
  certificationId: number | null
  certificationName: string
  /** Issuer display name from catalog (optional). */
  certificationIssuerName?: string | null
  certificationLevel?: CertificationLevel | "" | null
  issueDate: Date | undefined
  expiryDate: Date | undefined
  certificationUrl: string | null
}

export interface CandidateEducation {
  id: string
  universityLocationId: string
  universityLocationName: string
  degreeName: string
  majorName: string
  startMonth: Date | undefined
  endMonth: Date | undefined
  grades: string | null
  isTopper: boolean | null 
  isCheetah: boolean | null
}

export interface CandidateStandaloneProject {
  id: string
  /** Linked project id for API payloads; null when not selected. */
  projectId: number | null
  /** Cached display name (from API or combobox). */
  projectName: string
  contributionNotes: string | null
}

export interface OrganizationalRole {
  id: string
  organizationName: string  // e.g., "PASHA"
  role: string              // e.g., "CEO", "Board Member", "Advisor"
  startDate?: Date
  endDate?: Date
}

/** Backend enum AchievementType (camelCase). */
export type AchievementType =
  | "competition"
  | "openSource"
  | "award"
  | "medal"
  | "publication"
  | "certification"
  | "recognition"
  | "other"

export interface Achievement {
  id: string
  name: string  // e.g., "HackerOne", "Gold Medal in Math Olympiad", "React Contributor"
  achievementType: AchievementType  // Categorizes the achievement
  ranking?: string  // e.g., "Hall of Fame", "Top 1%", "Gold Medal", "Rank 50"
  year?: number
  url?: string
  description?: string  // Optional description for additional context
}

// Keep Competition interface for backward compatibility during migration
export interface Competition {
  id: string
  competitionName: string  // e.g., "HackerOne", "Bugcrowd", "Kaggle", "CVE"
  ranking?: string         // e.g., "Hall of Fame", "Top 1%", "Gold Medal", "Rank 50"
  year?: number
  url?: string
}

export interface Candidate {
  id: string
  name: string
  postingTitle: string | null
  email: string
  mobileNo: string
  cnic: string | null
  currentSalary: number | null
  expectedSalary: number | null
  city: string
  githubUrl?: string | null
  linkedinUrl?: string | null
  source: string
  status: CandidateStatus
  resume?: string | null
  workExperiences?: WorkExperience[] 
  projects?: CandidateStandaloneProject[] // Standalone projects not associated with work experience
  certifications?: CandidateCertification[] | null
  educations?: CandidateEducation[] 
  techStacks?: string[] // Standalone tech stacks (overall technical skills, not tied to specific employer)
  /** Top developer screening flag from API (`isTopDeveloper`). */
  isTopDeveloper?: boolean
  personalityType?: string | null // Personality type (e.g., "ESTJ", "INTJ", "ENFP", etc.)
  organizationalRoles?: OrganizationalRole[] // Organizational roles/affiliations (e.g., CEO, Board Member)
  achievements?: Achievement[] // Competitions and achievements (e.g., Kaggle, Bug Bounty platforms, Open Source contributions, Awards, Medals)
  competitions?: Competition[] // DEPRECATED: Use achievements instead. Kept for backward compatibility during migration
  createdAt: Date
  updatedAt: Date
  /** From API list/detail (`totalExperienceYears`). */
  totalExperienceYears?: number | null
}

export type CandidateStatus =
  | "sourced"
  | "active"
  | "pending"
  | "interviewed"
  | "shortlisted"
  | "hired"
  | "rejected"
  | "withdrawn"

export interface CandidateTableColumn {
  id: keyof Candidate | 'actions'
  label: string
  sortable?: boolean
  priority: 'high' | 'medium' | 'low'
  responsive: {
    desktop: boolean
    tablet: boolean
    mobile: boolean
  }
}

export const CANDIDATE_STATUS_COLORS: Record<CandidateStatus, string> = {
  sourced: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shortlisted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  sourced: "Sourced",
  active: "Active",
  pending: "Pending Review",
  interviewed: "Interviewed",
  shortlisted: "Shortlisted",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
}
