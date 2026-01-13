export type PublishPlatform = "App Store" | "Play Store" | "Web" | "Desktop"

export interface Project {
  id: string
  projectName: string
  employerName: string | null
  clientLocation?: string | null  // Where the client is located (e.g., "San Francisco", "Silicon Valley", "United States")
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
  isPublished: boolean  // Is this project/app published on any platform?
  publishPlatforms: PublishPlatform[]  // Where is it published? (App Store, Play Store, Web, Desktop)
  downloadCount?: number  // Download count (e.g., 150000 for 150K downloads)
  createdAt: Date
  updatedAt: Date
}

export type ProjectType = 
  | "Academic"
  | "Freelance"
  | "Employer"
  | "Personal"
  | "Open Source"

export type ProjectStatus = 
  | "Development"
  | "Maintenance" 
  | "Closed"

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
  Development: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Maintenance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Development: "Development",
  Maintenance: "Maintenance",
  Closed: "Closed",
}
