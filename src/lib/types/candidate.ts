export interface Candidate {
  id: string
  name: string
  currentJobTitle: string
  postingTitle: string
  email: string
  mobileNo: string
  cnic: string
  currentSalary: number
  expectedSalary: number
  city: string
  githubUrl?: string
  linkedinUrl?: string
  source: string
  status: CandidateStatus
  resume?: string
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


