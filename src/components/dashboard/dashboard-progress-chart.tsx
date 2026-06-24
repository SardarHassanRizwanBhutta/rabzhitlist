"use client"

import { cn } from "@/lib/utils"
import type { DashboardDailyMetrics } from "@/types/dashboard"
import {
  formatDashboardDateLabel,
  formatMetricInteger,
  formatProgressPoints,
} from "@/lib/utils/dashboard-metrics"

interface ProgressTrendChartProps {
  rows: DashboardDailyMetrics[]
  className?: string
}

export function ProgressTrendChart({ rows, className }: ProgressTrendChartProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No progress data for this period.
      </p>
    )
  }

  const maxPoints = Math.max(...rows.map((r) => r.progressPointsGained), 1)

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs text-muted-foreground">
        Progress points gained per day (sum of positive candidate profile deltas).
      </p>

      <div
        className="flex items-end gap-1 sm:gap-1.5 h-40"
        role="img"
        aria-label="Daily progress points chart"
      >
        {rows.map((row) => {
          const heightPct = (row.progressPointsGained / maxPoints) * 100
          return (
            <div
              key={row.date}
              className="flex-1 min-w-0 flex flex-col items-center gap-1 group"
              title={`${formatDashboardDateLabel(row.date)}: ${formatProgressPoints(row.progressPointsGained)} pts, ${formatMetricInteger(row.candidatesImproved)} profiles improved`}
            >
              <div
                className="w-full rounded-t bg-emerald-500/90 transition-opacity group-hover:opacity-80"
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
              <span className="text-[9px] text-muted-foreground truncate w-full text-center hidden sm:block">
                {row.date.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
