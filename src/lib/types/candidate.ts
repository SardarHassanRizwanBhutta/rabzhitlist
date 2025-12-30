import { EmployerBenefit } from "./benefits"

export type ShiftType = "Morning" | "Evening" | "Night" | "Rotational" | "24x7"
export type WorkMode = "Remote" | "Onsite" | "Hybrid"
export type TimeSupportZone = "US" | "UK" | "EU" | "APAC" | "MEA"

export interface ProjectExperience {
  id: string
  projectName: string
  contributionNotes: string | null
}

export interface WorkExperience {
  id: string
  employerName: string
  jobTitle: string
  projects: ProjectExperience[]
  startDate: Date | undefined
  endDate: Date | undefined
  techStacks: string[]
  domains: string[]
  shiftType: ShiftType | "" | null
  workMode: WorkMode | "" | null
  timeSupportZones: string[]
  benefits: EmployerBenefit[]
}

export interface CandidateCertification {
  id: string
  certificationId: string
  certificationName: string
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
  projectName: string
  contributionNotes: string | null
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
  createdAt: Date
  updatedAt: Date
}

export type CandidateStatus = 
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
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", 
  interviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shortlisted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  hired: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
}

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  active: "Active",
  pending: "Pending Review",
  interviewed: "Interviewed", 
  shortlisted: "Shortlisted",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn"
}
