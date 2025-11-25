export interface UniversityLocation {
  id: string
  universityId: string
  city: string
  address: string | null
  isMainCampus: boolean
  createdAt: Date
  updatedAt: Date
}

export interface University {
  id: string
  name: string
  country: string
  ranking: UniversityRanking
  websiteUrl: string | null
  linkedinUrl: string | null
  locations: UniversityLocation[]
  createdAt: Date
  updatedAt: Date
}

export type UniversityRanking = 
  | "Top"
  | "Standard"
  | "DPL Favourite"

export interface UniversityTableColumn {
  id: keyof University | 'actions'
  label: string
  sortable?: boolean
  priority: 'high' | 'medium' | 'low'
  responsive: {
    desktop: boolean
    tablet: boolean
    mobile: boolean
  }
}

export const UNIVERSITY_RANKING_COLORS: Record<UniversityRanking, string> = {
  Top: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Standard: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  "DPL Favourite": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
}

export const UNIVERSITY_RANKING_LABELS: Record<UniversityRanking, string> = {
  Top: "Top",
  Standard: "Standard", 
  "DPL Favourite": "DPL Favourite"
}
