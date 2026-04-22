/** API ranking enum (JSON): Tier1=0, Tier2=1, Tier3=2, DplFavourite=3 */
export type Ranking = 0 | 1 | 2 | 3

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

/** UI / list display strings from backend. */
export type UniversityRanking = "Tier 1" | "Tier 2" | "Tier 3" | "DPL Favourite"

export const RANKING_TO_LABEL: Record<Ranking, UniversityRanking> = {
  0: "Tier 1",
  1: "Tier 2",
  2: "Tier 3",
  3: "DPL Favourite",
}

export const LABEL_TO_RANKING: Record<UniversityRanking, Ranking> = {
  "Tier 1": 0,
  "Tier 2": 1,
  "Tier 3": 2,
  "DPL Favourite": 3,
}

export function getRankingLabel(ranking: Ranking | null): string {
  if (ranking === null) return "—"
  return RANKING_TO_LABEL[ranking] ?? "—"
}

/** Map list API `ranking` (display string, legacy label, or 0–3) to {@link Ranking}. */
export function parseUniversityRankingFromList(raw: unknown): Ranking | null {
  if (raw === null || raw === undefined) return null
  if (typeof raw === "number" && raw >= 0 && raw <= 3) return raw as Ranking
  const s = String(raw).trim()
  const pascal: Record<string, Ranking> = {
    Tier1: 0,
    Tier2: 1,
    Tier3: 2,
    DplFavourite: 3,
  }
  if (s in pascal) return pascal[s]
  if (s in LABEL_TO_RANKING) return LABEL_TO_RANKING[s as UniversityRanking]
  if (s === "Standard") return 0
  if (s === "Top") return 1
  const n = parseInt(s, 10)
  if (!Number.isNaN(n) && n >= 0 && n <= 3) return n as Ranking
  return null
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
  "Tier 1": "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  "Tier 2": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  "Tier 3": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "DPL Favourite": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

export const UNIVERSITY_RANKING_LABELS: Record<UniversityRanking, string> = {
  "Tier 1": "Tier 1",
  "Tier 2": "Tier 2",
  "Tier 3": "Tier 3",
  "DPL Favourite": "DPL Favourite",
}
