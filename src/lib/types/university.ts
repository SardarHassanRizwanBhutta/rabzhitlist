/** API ranking enum: 0 = Standard, 1 = Top, 2 = DplFavourite */
export type Ranking = 0 | 1 | 2

export interface UniversityLocation {
  id: number
  universityId: number
  city: string
  address: string | null
  isMainCampus: boolean
  createdAt: string
}

export interface University {
  id: number
  name: string
  websiteUrl: string | null
  linkedInUrl: string | null
  country: { id: number; name: string }
  ranking: Ranking | null
  locations: UniversityLocation[]
  createdAt: string
  updatedAt: string
}

/** UI-only label type for dropdowns and filters */
export type UniversityRanking = "Standard" | "Top" | "DPL Favourite"

export const RANKING_TO_LABEL: Record<Ranking, UniversityRanking> = {
  0: "Standard",
  1: "Top",
  2: "DPL Favourite",
}

export const LABEL_TO_RANKING: Record<UniversityRanking, Ranking> = {
  Standard: 0,
  Top: 1,
  "DPL Favourite": 2,
}

export function getRankingLabel(ranking: Ranking | null): string {
  if (ranking === null) return "—"
  return RANKING_TO_LABEL[ranking] ?? "—"
}

export interface UniversityTableColumn {
  id: keyof University | "actions"
  label: string
  sortable?: boolean
  priority: "high" | "medium" | "low"
  responsive: {
    desktop: boolean
    tablet: boolean
    mobile: boolean
  }
}

export const UNIVERSITY_RANKING_COLORS: Record<UniversityRanking, string> = {
  Top: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Standard: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  "DPL Favourite": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

export const UNIVERSITY_RANKING_LABELS: Record<UniversityRanking, string> = {
  Top: "Top",
  Standard: "Standard",
  "DPL Favourite": "DPL Favourite",
}
