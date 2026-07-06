"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
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

const GAINED_COLOR = "hsl(142 76% 36%)"
const GAINED_COLOR_MUTED = "hsl(142 76% 36% / 0.45)"
const GAINED_COLOR_HIGHLIGHT = "hsl(142 76% 32%)"

export interface ProgressGainedChartRow {
  date: string
  progressPointsGained: number
}

interface ProgressGainedChartProps {
  rows: ProgressGainedChartRow[]
  highlightDate?: string
}

interface ChartPoint {
  date: string
  label: string
  progressPointsGained: number
}

function chartXLabel(
  date: string,
  index: number,
  rows: ProgressGainedChartRow[],
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

export function ProgressGainedChart({ rows, highlightDate }: ProgressGainedChartProps) {
  const chartData = useMemo<ChartPoint[]>(
    () =>
      rows.map((row, index) => ({
        date: row.date,
        label: chartXLabel(row.date, index, rows),
        progressPointsGained: row.progressPointsGained,
      })),
    [rows],
  )

  const periodTotal = useMemo(
    () => rows.reduce((sum, row) => sum + row.progressPointsGained, 0),
    [rows],
  )

  const dailyAverage = rows.length > 0 ? periodTotal / rows.length : 0
  const xInterval = rows.length <= 14 ? 0 : "preserveStartEnd"
  const maxBarSize = rows.length > 30 ? 12 : rows.length > 14 ? 18 : 40

  return (
    <div>
      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground py-16 text-center">
          No progress gained for this period.
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
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
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatMetricInteger(v)}
                width={44}
              />
              <Tooltip
                content={<GainedTooltip highlightDate={highlightDate} />}
                cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
              />
              {dailyAverage > 0 && (
                <ReferenceLine
                  y={dailyAverage}
                  stroke="hsl(var(--muted-foreground) / 0.45)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Avg",
                    position: "insideTopRight",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
              )}
              <Bar
                dataKey="progressPointsGained"
                name="Progress gained"
                radius={[3, 3, 0, 0]}
                maxBarSize={maxBarSize}
              >
                {chartData.map((point) => (
                  <Cell
                    key={point.date}
                    fill={
                      point.date === highlightDate
                        ? GAINED_COLOR_HIGHLIGHT
                        : GAINED_COLOR_MUTED
                    }
                    stroke={point.date === highlightDate ? GAINED_COLOR : undefined}
                    strokeWidth={point.date === highlightDate ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function GainedTooltip({
  active,
  payload,
  highlightDate,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
  highlightDate?: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  const gained = point.progressPointsGained

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1">
      <p className="font-medium">
        {formatDashboardDateLabel(point.date)}
        {point.date === highlightDate && (
          <span className="text-muted-foreground font-normal"> · selected</span>
        )}
      </p>
      <p className="flex items-center gap-2">
        <span
          className="size-2 rounded-sm shrink-0"
          style={{ backgroundColor: GAINED_COLOR }}
          aria-hidden
        />
        {formatProgressPoints(gained)} pts gained
      </p>
    </div>
  )
}
