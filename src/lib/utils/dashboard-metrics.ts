import { format, subDays } from "date-fns"
import type {
  DashboardDailyMetrics,
  DashboardDateSelection,
  DashboardMetricsResponse,
  DashboardPeriodSummary,
  DashboardProgressPeriodSummary,
  DashboardRange,
} from "@/types/dashboard"
export const DEFAULT_DASHBOARD_TIMEZONE = "Asia/Karachi"
export const MAX_DASHBOARD_CUSTOM_RANGE_DAYS = 90

export function dashboardRangeLabel(range: DashboardRange): string {
  switch (range) {
    case "today":
      return "Today"
    case "7d":
      return "Last 7 days"
    case "30d":
      return "Last 30 days"
  }
}

export function rangeToDayCount(range: DashboardRange): number {
  switch (range) {
    case "today":
      return 1
    case "7d":
      return 7
    case "30d":
      return 30
  }
}

export function getRangeDateBounds(
  range: DashboardRange,
  referenceDate: Date = new Date(),
): { from: string; to: string } {
  const to = format(referenceDate, "yyyy-MM-dd")
  const days = rangeToDayCount(range)
  const from = format(subDays(referenceDate, days - 1), "yyyy-MM-dd")
  return { from, to }
}

export function getTodayIso(referenceDate: Date = new Date()): string {
  return format(referenceDate, "yyyy-MM-dd")
}

export function isoToLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function emptyDailyRow(date: string): DashboardDailyMetrics {
  return {
    date,
    newCandidates: 0,
    newEmployers: 0,
    newProjects: 0,
    totalDataProgress: 0,
    avgDataProgress: 0,
    candidateCount: 0,
    progressPointsGained: 0,
    candidatesImproved: 0,
  }
}

export function dailyIntakeTotal(row: DashboardDailyMetrics): number {
  return row.newCandidates + row.newEmployers + row.newProjects
}

export function countInclusiveCalendarDays(from: string, to: string): number {
  const start = isoToLocalDate(from)
  const end = isoToLocalDate(to)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1
}

export function getSelectionBounds(
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): { from: string; to: string } {
  if (selection.mode === "range") {
    const orderedFrom = selection.from <= selection.to ? selection.from : selection.to
    const orderedTo = selection.from <= selection.to ? selection.to : selection.from
    return { from: orderedFrom, to: orderedTo }
  }
  return getRangeDateBounds(selection.range, referenceDate)
}

export function formatSelectionRangeButtonLabel(
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): string {
  const { from, to } = getSelectionBounds(selection, referenceDate)
  if (from === to) {
    return formatDashboardDateLabel(from)
  }
  const fromDate = isoToLocalDate(from)
  const toDate = isoToLocalDate(to)
  const sameYear = fromDate.getFullYear() === toDate.getFullYear()
  const fromText = format(fromDate, sameYear ? "MMM d" : "MMM d, yyyy")
  const toText = format(toDate, sameYear ? "MMM d" : "MMM d, yyyy")
  return `${fromText} to ${toText}`
}

export function filterDailyBySelection(
  daily: DashboardDailyMetrics[],
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): DashboardDailyMetrics[] {
  const { from, to } = getSelectionBounds(selection, referenceDate)
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date))
  const inWindow = sorted.filter((row) => row.date >= from && row.date <= to)

  if (from === to) {
    const row = inWindow.find((r) => r.date === from)
    return [row ?? emptyDailyRow(from)]
  }

  return inWindow
}

export function selectionLabel(selection: DashboardDateSelection, referenceDate: Date = new Date()): string {
  if (selection.mode === "preset") {
    return dashboardRangeLabel(selection.range)
  }
  return formatSelectionRangeButtonLabel(selection, referenceDate)
}

export function resolveSelectionSummary(
  response: DashboardMetricsResponse,
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): DashboardPeriodSummary {
  if (selection.mode === "preset" && selection.range === "today") {
    const t = response.summary.today
    return {
      newCandidates: t.newCandidates,
      newEmployers: t.newEmployers,
      newProjects: t.newProjects,
      progressPointsGained: t.progressPointsGained,
      candidatesImproved: t.candidatesImproved,
      dayCount: 1,
    }
  }

  return aggregatePeriodSummary(
    filterDailyBySelection(response.daily, selection, referenceDate),
  )
}

export function isDateInSelectionWindow(
  date: Date,
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): boolean {
  const iso = format(date, "yyyy-MM-dd")
  const { from, to } = getSelectionBounds(selection, referenceDate)
  return iso >= from && iso <= to
}

const PROGRESS_CHART_TRAILING_DAYS = 7

/** End date of the active selection window. */
export function getSelectionEndDate(
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): string {
  return getSelectionBounds(selection, referenceDate).to
}

function isSingleDaySelection(
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): boolean {
  const { from, to } = getSelectionBounds(selection, referenceDate)
  return from === to
}

/** Chart window: multi-day selections use full range; single-day uses 7-day trailing window. */
export function getProgressChartBounds(
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): { from: string; to: string } {
  const { from, to } = getSelectionBounds(selection, referenceDate)

  if (!isSingleDaySelection(selection, referenceDate)) {
    return { from, to }
  }

  const end = isoToLocalDate(to)
  return {
    from: format(subDays(end, PROGRESS_CHART_TRAILING_DAYS - 1), "yyyy-MM-dd"),
    to,
  }
}

export function filterDailyByDateBounds(
  daily: DashboardDailyMetrics[],
  from: string,
  to: string,
): DashboardDailyMetrics[] {
  return [...daily]
    .filter((row) => row.date >= from && row.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function filterDailyForProgressChart(
  daily: DashboardDailyMetrics[],
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): DashboardDailyMetrics[] {
  const { from, to } = getProgressChartBounds(selection, referenceDate)
  const rows = filterDailyByDateBounds(daily, from, to)

  if (rows.length > 0) return rows

  return [emptyDailyRow(to)]
}

export function resolveProgressPeriodSummary(
  response: DashboardMetricsResponse,
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): DashboardProgressPeriodSummary {
  if (selection.mode === "preset" && selection.range === "today") {
    const t = response.summary.today
    return {
      totalDataProgress: t.totalDataProgress,
      progressPointsGained: t.progressPointsGained,
      avgDataProgress: t.avgDataProgress,
      candidateCount: t.candidateCount,
      dayCount: 1,
    }
  }

  const rows = filterDailyBySelection(response.daily, selection, referenceDate)
  const endRow = rows[rows.length - 1] ?? emptyDailyRow(getSelectionEndDate(selection, referenceDate))

  return {
    totalDataProgress: endRow.totalDataProgress,
    progressPointsGained: rows.reduce((sum, row) => sum + row.progressPointsGained, 0),
    avgDataProgress: endRow.avgDataProgress,
    candidateCount: endRow.candidateCount,
    dayCount: rows.length,
  }
}

export function formatProgressPointsLabel(value: number): string {
  return `${formatMetricInteger(Math.round(value))} pts`
}

export function filterDailyByRange(
  daily: DashboardDailyMetrics[],
  range: DashboardRange,
): DashboardDailyMetrics[] {
  if (daily.length === 0) return []
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date))
  const count = rangeToDayCount(range)
  return sorted.slice(-count)
}

export function aggregatePeriodSummary(
  rows: DashboardDailyMetrics[],
): DashboardPeriodSummary {
  return rows.reduce(
    (acc, row) => ({
      newCandidates: acc.newCandidates + row.newCandidates,
      newEmployers: acc.newEmployers + row.newEmployers,
      newProjects: acc.newProjects + row.newProjects,
      progressPointsGained: acc.progressPointsGained + row.progressPointsGained,
      candidatesImproved: acc.candidatesImproved + row.candidatesImproved,
      dayCount: acc.dayCount + 1,
    }),
    {
      newCandidates: 0,
      newEmployers: 0,
      newProjects: 0,
      progressPointsGained: 0,
      candidatesImproved: 0,
      dayCount: 0,
    },
  )
}

export function formatMetricInteger(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

/** Intake card footer — e.g. "8,241 total". */
export function formatFleetTotalHint(count: number): string {
  return `${formatMetricInteger(count)} total`
}

export function formatProgressPoints(value: number): string {
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${formatMetricInteger(value)}`
}

export function formatPercentOneDecimal(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDashboardDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return format(date, "MMM d, yyyy")
}

export function isDashboardMockEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_USE_MOCK?.trim().toLowerCase()
  return raw !== "false"
}

export function resolvePeriodSummary(
  response: DashboardMetricsResponse,
  range: DashboardRange,
): DashboardPeriodSummary {
  if (range === "today") {
    const t = response.summary.today
    return {
      newCandidates: t.newCandidates,
      newEmployers: t.newEmployers,
      newProjects: t.newProjects,
      progressPointsGained: t.progressPointsGained,
      candidatesImproved: t.candidatesImproved,
      dayCount: 1,
    }
  }
  return aggregatePeriodSummary(filterDailyByRange(response.daily, range))
}
