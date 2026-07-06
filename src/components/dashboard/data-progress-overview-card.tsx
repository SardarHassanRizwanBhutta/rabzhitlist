"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DeltaPill } from "@/components/dashboard/delta-pill"
import { cn } from "@/lib/utils"
import {
  formatMetricInteger,
  formatPercentOneDecimal,
} from "@/lib/utils/dashboard-metrics"

interface DataProgressOverviewCardProps {
  label: string
  icon: React.ComponentType<{ className?: string }>
  recordNoun: string
  /** Average completeness now (0–100). */
  avg?: number
  /** Avg completion change (percentage points); null → hidden. */
  delta?: number | null
  /** Tooltip for the delta pill (contextual to filter length). */
  deltaTitle?: string
  /** Active records (current). */
  total?: number
  /** New records added within the selected window. */
  newInPeriod?: number
  selected: boolean
  loading: boolean
  onSelect: () => void
}

export function DataProgressOverviewCard({
  label,
  icon: Icon,
  recordNoun,
  avg,
  delta,
  deltaTitle = "Change vs prior period",
  total,
  newInPeriod,
  selected,
  loading,
  onSelect,
}: DataProgressOverviewCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
        selected ? "ring-2 ring-primary" : "hover:bg-muted/30",
      )}
    >
      <Card className={cn("h-full", selected && "border-primary/50")}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              {label}
            </span>
            {delta != null && !loading && (
              <DeltaPill value={delta} title={deltaTitle} />
            )}
          </div>

          {loading ? (
            <div className="h-7 w-20 rounded bg-muted animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold tabular-nums leading-none">
                {avg != null ? formatPercentOneDecimal(avg) : "—"}
              </p>
              <span className="text-xs text-muted-foreground">avg completion</span>
            </div>
          )}

          <CompletionBar value={loading ? 0 : avg ?? 0} muted={loading} />

          {loading ? (
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {total != null ? `${formatMetricInteger(total)} ${recordNoun}` : "—"}
              {newInPeriod != null && (
                <>
                  {" · "}
                  <span className="font-medium text-foreground">
                    +{formatMetricInteger(newInPeriod)}
                  </span>{" "}
                  new
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  )
}

function CompletionBar({ value, muted }: { value: number; muted: boolean }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", muted ? "bg-muted-foreground/20" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
