/** Dashboard productivity metrics — @see docs/DASHBOARD_METRICS_API_CONTRACT.md */

export type DashboardRange = "today" | "7d" | "30d"

/** Active date window — preset tabs or explicit from/to (single day when equal). */
export type DashboardDateSelection =
  | { mode: "preset"; range: DashboardRange }
  | { mode: "range"; from: string; to: string }

export interface DashboardDailyMetrics {
  /** Calendar date in `timezone` (YYYY-MM-DD). */
  date: string
  newCandidates: number
  newEmployers: number
  newProjects: number
  /** Sum of all candidates' `dataProgressPercentage` (fleet progress points). */
  totalDataProgress: number
  /** Fleet average `dataProgressPercentage` (0–100). */
  avgDataProgress: number
  /** Active candidates included in the snapshot. */
  candidateCount: number
  /** Sum of positive `dataProgressPercentage` deltas vs prior snapshot (points). */
  progressPointsGained: number
  /** Candidates with progress delta &gt; 0. */
  candidatesImproved: number
}

export interface DashboardSummaryToday {
  newCandidates: number
  newEmployers: number
  newProjects: number
  totalDataProgress: number
  avgDataProgress: number
  candidateCount: number
  progressPointsGained: number
  candidatesImproved: number
}

export interface DashboardTotals {
  candidates: number
  employers: number
  projects: number
  /** Fleet-wide average `dataProgressPercentage` (0–100). */
  avgDataProgress: number
  /** Change in fleet average vs previous calendar day (optional). */
  avgDataProgressDelta?: number | null
}

export interface DashboardMetricsResponse {
  generatedAt: string
  timezone: string
  range: {
    from: string
    to: string
  }
  summary: {
    today: DashboardSummaryToday
    totals: DashboardTotals
  }
  daily: DashboardDailyMetrics[]
}

export interface FetchDashboardMetricsParams {
  range: DashboardRange
  /** IANA timezone; default `Asia/Karachi`. */
  timezone?: string
}

export interface DashboardProgressPeriodSummary {
  /** Fleet total progress points at end of the selected period. */
  totalDataProgress: number
  /** Sum of daily `progressPointsGained` over the selected period. */
  progressPointsGained: number
  /** Fleet average completion at end of the selected period. */
  avgDataProgress: number
  candidateCount: number
  dayCount: number
}

export interface DashboardPeriodSummary {
  newCandidates: number
  newEmployers: number
  newProjects: number
  progressPointsGained: number
  candidatesImproved: number
  dayCount: number
}
