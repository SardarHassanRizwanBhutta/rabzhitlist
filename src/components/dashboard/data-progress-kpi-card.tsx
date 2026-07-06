"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeltaPill } from "@/components/dashboard/delta-pill"
import { Sparkline } from "@/components/dashboard/sparkline"

interface DataProgressKpiCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
  /** Formatted hero value, e.g. "245,300 pts". */
  mainValue: string
  /** Muted context line under the hero, e.g. "58% of max". */
  subValue?: string
  /** % change vs previous period; null hides the pill. */
  deltaPct: number | null
  series: number[]
  /** Tailwind text color class for the sparkline stroke. */
  sparkClassName?: string
}

export function DataProgressKpiCard({
  title,
  icon: Icon,
  loading,
  mainValue,
  subValue,
  deltaPct,
  series,
  sparkClassName,
}: DataProgressKpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </CardTitle>
        {!loading && deltaPct != null && (
          <DeltaPill value={deltaPct} suffix="%" title="vs previous period" />
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-28 rounded bg-muted animate-pulse" />
            <div className="h-8 w-full rounded bg-muted/40 animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums leading-tight">{mainValue}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
            )}
            <div className="mt-3">
              <Sparkline values={series} className={sparkClassName} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
