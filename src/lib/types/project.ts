export interface Project {
  id: string
  projectName: string
  employerName: string
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  teamSize: string | null  // "5" or "20-30"
  startDate: Date | null
  endDate: Date | null
  status: ProjectStatus
  description: string | null
  notes: string | null
  projectLink: string | null
  projectType: ProjectType
  createdAt: Date
  updatedAt: Date
}

export type ProjectType = 
  | "Academic"
  | "Freelance"
  | "Employer"
  | "Personal"

export type ProjectStatus = 
  | "Active"
  | "Completed" 
  | "On Hold"
  | "Cancelled"
  | "Planning"

export interface ProjectTableColumn {
  id: keyof Project | 'actions'
  label: string
  sortable?: boolean
  priority: 'high' | 'medium' | 'low'
  responsive: {
    desktop: boolean
    tablet: boolean
    mobile: boolean
  }
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "On Hold": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Planning: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Active: "Active",
  Completed: "Completed",
  "On Hold": "On Hold", 
  Cancelled: "Cancelled",
  Planning: "Planning"
}
