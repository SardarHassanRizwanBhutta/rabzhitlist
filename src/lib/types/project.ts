export type PublishPlatform = "App Store" | "Play Store" | "Web" | "Desktop"

/**
 * Filter and form multiselect options. `value` must match backend publish platform enum / `PUBLISH_PLATFORM_UI_TO_NUM` keys.
 */
export const PUBLISH_PLATFORM_FILTER_OPTIONS: ReadonlyArray<{
  value: PublishPlatform
  label: string
}> = [
  { value: "App Store", label: "App Store (iOS)" },
  { value: "Play Store", label: "Play Store (Android)" },
  { value: "Web", label: "Web" },
  { value: "Desktop", label: "Desktop" },
]

export interface Project {
  id: string
  projectName: string
  employerName: string | null
  /** Set when loaded from API; used for update payloads. */
  employerId?: number
  /** Single location (legacy/display); when loaded from API use clientLocations for full list. */
  clientLocation?: string | null
  /** Multiple client locations (many-to-many); set when loaded from API. */
  clientLocations?: string[]
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalDomains: string[]
  technicalAspects: string[]
  teamSize: string | null  // "5" or "20-30" (derived from min/max for display)
  /** Min team size (from API); used for inline edit in detail dialog. */
  minTeamSize?: number | null
  /** Max team size (from API); used for inline edit in detail dialog. */
  maxTeamSize?: number | null
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

/** UI type; aligns with backend project_type_enum (employer, academic, personal, freelance, open_source). */
export type ProjectType =
  | "Employer"
  | "Academic"
  | "Personal"
  | "Freelance"
  | "Open Source"

/** All project types in backend enum order (for dropdowns). */
export const PROJECT_TYPES: ProjectType[] = [
  "Employer",
  "Academic",
  "Personal",
  "Freelance",
  "Open Source",
]

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

/** Tailwind classes for status badges (tables, filters). */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  Development:
    "bg-green-100 text-green-900 border-green-200/80 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800",
  Maintenance:
    "bg-blue-100 text-blue-900 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800",
  Closed:
    "bg-red-100 text-red-900 border-red-200/80 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800",
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  Development: "Development",
  Maintenance: "Maintenance",
  Closed: "Closed",
}
