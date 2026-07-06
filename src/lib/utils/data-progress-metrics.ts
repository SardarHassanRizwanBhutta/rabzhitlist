import { format, subDays } from "date-fns"
import {
  countInclusiveCalendarDays,
  getProgressChartBounds,
  getSelectionBounds,
  isoToLocalDate,
} from "@/lib/utils/dashboard-metrics"
import type { DashboardDateSelection } from "@/types/dashboard"
import type { DataProgressDailyRow, DataProgressResponse } from "@/types/data-progress"

function emptyRow(date: string): DataProgressDailyRow {
  return {
    date,
    newRecords: 0,
    totalDataProgress: 0,
    progressPointsGained: 0,
    avgDataProgress: 0,
    recordCount: 0,
  }
}

function filterByBounds(
  daily: DataProgressDailyRow[],
  from: string,
  to: string,
): DataProgressDailyRow[] {
  return [...daily]
    .filter((row) => row.date >= from && row.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function findDailyRow(daily: DataProgressDailyRow[], date: string): DataProgressDailyRow | null {
  return daily.find((row) => row.date === date) ?? null
}

/** Percentage change vs a previous value; null when there's no comparable base. */
function pctChange(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** Chart rows: multi-day uses the full window; single-day uses a 7-day trailing window. */
export function filterDataProgressForChart(
  daily: DataProgressDailyRow[],
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): DataProgressDailyRow[] {
  const { from, to } = getProgressChartBounds(selection, referenceDate)
  const rows = filterByBounds(daily, from, to)
  return rows.length > 0 ? rows : [emptyRow(to)]
}

/** Tooltip for overview avg delta pill (contextual to filter length). */
export function avgDataProgressDeltaTooltip(
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): string {
  if (selection.mode === "preset" && selection.range === "today") {
    return "Change vs yesterday"
  }
  const { from, to } = getSelectionBounds(selection, referenceDate)
  const lenDays = countInclusiveCalendarDays(from, to)
  return lenDays === 1
    ? "Change vs yesterday"
    : `Change vs prior ${lenDays} days`
}

export interface DataProgressKpiMetric {
  value: number
  /** % change vs the immediately preceding equal-length window. */
  deltaPct: number | null
  /** Windowed series for the sparkline. */
  series: number[]
}

export interface DataProgressKpis {
  recordCount: number
  total: DataProgressKpiMetric
  gained: DataProgressKpiMetric & { previous: number | null }
}

/**
 * Resolves detail KPIs for the selected module: total data progress (stock) and
 * progress gained (flow), with deltas vs the immediately preceding equal-length
 * window and sparkline series.
 */
export function resolveDataProgressKpis(
  response: DataProgressResponse,
  selection: DashboardDateSelection,
  referenceDate: Date = new Date(),
): DataProgressKpis {
  const { from, to } = getSelectionBounds(selection, referenceDate)
  const lenDays = countInclusiveCalendarDays(from, to)
  const prevTo = format(subDays(isoToLocalDate(from), 1), "yyyy-MM-dd")
  const prevFrom = format(subDays(isoToLocalDate(prevTo), lenDays - 1), "yyyy-MM-dd")

  const current = filterByBounds(response.daily, from, to)
  const previous = filterByBounds(response.daily, prevFrom, prevTo)

  const toRow = findDailyRow(response.daily, to) ?? current[current.length - 1] ?? emptyRow(to)
  const prevToRow = findDailyRow(response.daily, prevTo)

  const sumGained = (rows: DataProgressDailyRow[]) =>
    rows.reduce((s, r) => s + r.progressPointsGained, 0)

  const gainedValue = sumGained(current)
  const gainedPrev = previous.length > 0 ? sumGained(previous) : null

  const chartRows = filterDataProgressForChart(response.daily, selection, referenceDate)

  return {
    recordCount: response.summary.current.recordCount,
    total: {
      value: response.summary.current.totalDataProgress,
      deltaPct: pctChange(toRow.totalDataProgress, prevToRow?.totalDataProgress ?? null),
      series: chartRows.map((r) => r.totalDataProgress),
    },
    gained: {
      value: gainedValue,
      previous: gainedPrev,
      deltaPct: pctChange(gainedValue, gainedPrev),
      series: chartRows.map((r) => r.progressPointsGained),
    },
  }
}
