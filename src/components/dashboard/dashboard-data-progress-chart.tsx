"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"
import {
  formatDashboardDateLabel,
  formatMetricInteger,
  formatProgressPoints,
  isoToLocalDate,
} from "@/lib/utils/dashboard-metrics"

const GAINED_LINE_COLOR = "hsl(142 76% 36%)"

/** Minimal row shape the chart needs (works for intake fleet + data-progress rows). */
export interface ProgressChartRow {
  date: string
  totalDataProgress: number
  progressPointsGained: number
}

interface DashboardDataProgressChartProps {
  rows: ProgressChartRow[]
  highlightDate?: string
}

interface ChartPoint {
  date: string
  label: string
  totalDataProgress: number
  progressPointsGained: number
}

function chartXLabel(
  date: string,
  index: number,
  rows: ProgressChartRow[],
): string {
  if (rows.length <= 14) {
    return formatDashboardDateLabel(date).replace(/, \d{4}$/, "")
  }

  const current = isoToLocalDate(date)
  if (index === 0) {
    return format(current, "MMM")
  }

  const previous = isoToLocalDate(rows[index - 1].date)
  if (current.getMonth() !== previous.getMonth()) {
    return format(current, "MMM")
  }

  return ""
}

export function DashboardDataProgressChart({
  rows,
  highlightDate,
}: DashboardDataProgressChartProps) {
  const chartData = useMemo<ChartPoint[]>(
    () =>
      rows.map((row, index) => ({
        date: row.date,
        label: chartXLabel(row.date, index, rows),
        totalDataProgress: row.totalDataProgress,
        progressPointsGained: row.progressPointsGained,
      })),
    [rows],
  )

  const xInterval = rows.length <= 14 ? 0 : "preserveStartEnd"

  return (
    <div>
      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground py-16 text-center">
          No data progress for this period.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={xInterval}
              />
              <YAxis
                yAxisId="total"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                width={44}
              />
              <YAxis
                yAxisId="gained"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatMetricInteger(v)}
                width={40}
              />
              <Tooltip content={<ProgressTooltip />} />
              <Line
                yAxisId="total"
                type="monotone"
                dataKey="totalDataProgress"
                name="Total progress"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={(props) => (
                  <HighlightDot
                    {...props}
                    highlightDate={highlightDate}
                    fill="var(--color-primary)"
                  />
                )}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="gained"
                type="monotone"
                dataKey="progressPointsGained"
                name="Progress gained"
                stroke={GAINED_LINE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: GAINED_LINE_COLOR }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ProgressTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint; color?: string; name?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  const dateLabel = point.date
    ? formatDashboardDateLabel(point.date)
    : label

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1.5">
      <p className="font-medium">{dateLabel}</p>
      <p className="flex items-center gap-2">
        <span
          className="size-2 rounded-full shrink-0 bg-primary"
          aria-hidden
        />
        Total progress: {formatMetricInteger(point.totalDataProgress)} pts
      </p>
      <p className="flex items-center gap-2">
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: GAINED_LINE_COLOR }}
          aria-hidden
        />
        Progress gained: {formatProgressPoints(point.progressPointsGained)} pts
      </p>
    </div>
  )
}

function HighlightDot(props: {
  cx?: number
  cy?: number
  payload?: ChartPoint
  highlightDate?: string
  fill?: string
}) {
  const { cx, cy, payload, highlightDate, fill } = props
  if (cx == null || cy == null || !payload) return null

  const isHighlight = payload.date === highlightDate
  const radius = isHighlight ? 5 : 3

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke={isHighlight ? "var(--color-background)" : undefined}
      strokeWidth={isHighlight ? 2 : 0}
    />
  )
}
