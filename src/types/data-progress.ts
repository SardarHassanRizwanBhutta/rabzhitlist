/**
 * Multi-module Data Progress types.
 *
 * Backend: `GET /api/dashboard/data-progress?module=&from=&to=&timezone=`
 * @see docs/DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md §3
 */

export type DataProgressModule =
  | "candidates"
  | "employers"
  | "projects"
  | "universities"
  | "certifications"

export const DATA_PROGRESS_MODULES: DataProgressModule[] = [
  "candidates",
  "employers",
  "projects",
  "universities",
  "certifications",
]

export interface DataProgressDailyRow {
  /** Calendar date in `timezone` (YYYY-MM-DD). */
  date: string
  /** New records added that day (intake). */
  newRecords: number
  /** Sum of all records' completeness (progress points). */
  totalDataProgress: number
  /** Sum of positive completeness deltas vs prior snapshot (points). */
  progressPointsGained: number
  /** Average completeness across records (0–100). */
  avgDataProgress: number
  /** Records included in the snapshot. */
  recordCount: number
}

export interface DataProgressCurrentSummary {
  /** Fleet total progress points as of `generatedAt`. */
  totalDataProgress: number
  avgDataProgress: number
  recordCount: number
}

export interface DataProgressTodaySummary {
  /** Today's `progressPointsGained` in `timezone`. */
  progressPointsGained: number
}

/** One row per module for the overview cards. */
export interface DataProgressModuleSummary {
  module: DataProgressModule
  /** Average completeness now (0–100). */
  avgDataProgress: number
  /** Change vs prior equal-length window (pp); null when historical `to` or non-candidate. */
  avgDataProgressDelta: number | null
  /** Active records in the module (current). */
  recordCount: number
  /** New records added within the selected window (intake). */
  newInPeriod: number
  /** True when progress KPIs are meaningful (candidates, projects, universities, certifications). */
  available: boolean
}

export interface DataProgressResponse {
  module: DataProgressModule
  generatedAt: string
  timezone: string
  range: { from: string; to: string }
  summary: {
    current: DataProgressCurrentSummary
    today: DataProgressTodaySummary
    modules: DataProgressModuleSummary[]
  }
  daily: DataProgressDailyRow[]
}

export interface FetchDataProgressParams {
  module: DataProgressModule
  from: string
  to: string
  timezone?: string
}
