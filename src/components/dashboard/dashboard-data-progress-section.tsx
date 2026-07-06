"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Award,
  Building2,
  Database,
  FolderOpen,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataProgressKpiCard } from "@/components/dashboard/data-progress-kpi-card"
import { DataProgressOverviewCard } from "@/components/dashboard/data-progress-overview-card"
import { ProgressGainedChart } from "@/components/dashboard/progress-gained-chart"
import { fetchDataProgress } from "@/lib/services/data-progress-api"
import {
  DEFAULT_DASHBOARD_TIMEZONE,
  formatMetricInteger,
  formatProgressPoints,
  formatProgressPointsLabel,
  getSelectionBounds,
  getSelectionEndDate,
} from "@/lib/utils/dashboard-metrics"
import {
  avgDataProgressDeltaTooltip,
  filterDataProgressForChart,
  resolveDataProgressKpis,
} from "@/lib/utils/data-progress-metrics"
import {
  DATA_PROGRESS_MODULES,
  type DataProgressModule,
  type DataProgressResponse,
} from "@/types/data-progress"
import type { DashboardDateSelection } from "@/types/dashboard"

interface ModuleDisplay {
  label: string
  icon: React.ComponentType<{ className?: string }>
  recordNoun: string
}

const MODULE_DISPLAY: Record<DataProgressModule, ModuleDisplay> = {
  candidates: { label: "Candidates", icon: Users, recordNoun: "candidates" },
  employers: { label: "Employers", icon: Building2, recordNoun: "employers" },
  projects: { label: "Projects", icon: FolderOpen, recordNoun: "projects" },
  universities: { label: "Universities", icon: GraduationCap, recordNoun: "universities" },
  certifications: { label: "Certifications", icon: Award, recordNoun: "certifications" },
}

interface DashboardDataProgressSectionProps {
  selection: DashboardDateSelection
  periodLabel: string
  /** Bump to force a refetch (toolbar refresh). */
  refreshKey: number
}

export function DashboardDataProgressSection({
  selection,
  periodLabel,
  refreshKey,
}: DashboardDataProgressSectionProps) {
  const [module, setModule] = useState<DataProgressModule>("candidates")
  const [data, setData] = useState<DataProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  const bounds = useMemo(() => getSelectionBounds(selection), [selection])
  const avgDeltaTooltip = useMemo(
    () => avgDataProgressDeltaTooltip(selection),
    [selection],
  )

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchDataProgress({
          module,
          from: bounds.from,
          to: bounds.to,
          timezone: DEFAULT_DASHBOARD_TIMEZONE,
          signal: controller.signal,
        })
        if (!active) return
        setData(response)
      } catch (err) {
        if (!active || controller.signal.aborted) return
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Failed to load data progress")
        setData(null)
      } finally {
        if (active && !controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
      controller.abort()
    }
  }, [module, bounds.from, bounds.to, refreshKey, retryTick])

  const kpis = useMemo(
    () => (data ? resolveDataProgressKpis(data, selection) : null),
    [data, selection],
  )

  const chartRows = useMemo(
    () => (data ? filterDataProgressForChart(data.daily, selection) : []),
    [data, selection],
  )

  const highlightDate = getSelectionEndDate(selection)
  const isSingleDayWindow = bounds.from === bounds.to
  const display = MODULE_DISPLAY[module]
  const overview = data?.summary.modules

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {DATA_PROGRESS_MODULES.map((m) => {
          const summary = overview?.find((row) => row.module === m)
          const avg =
            summary?.available === false ? 0 : summary?.avgDataProgress
          return (
            <DataProgressOverviewCard
              key={m}
              label={MODULE_DISPLAY[m].label}
              icon={MODULE_DISPLAY[m].icon}
              recordNoun={MODULE_DISPLAY[m].recordNoun}
              avg={avg}
              delta={summary?.avgDataProgressDelta}
              deltaTitle={avgDeltaTooltip}
              total={summary?.recordCount}
              newInPeriod={summary?.newInPeriod}
              selected={m === module}
              loading={loading && overview == null}
              onSelect={() => setModule(m)}
            />
          )
        })}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium">Could not load {display.label} data progress</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setRetryTick((t) => t + 1)}
              >
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <DataProgressKpiCard
          title="Total data progress"
          icon={Database}
          loading={loading || kpis == null}
          mainValue={formatProgressPointsLabel(kpis?.total.value ?? 0)}
          subValue={
            kpis != null
              ? `Across ${formatMetricInteger(kpis.recordCount)} ${display.recordNoun}`
              : undefined
          }
          deltaPct={kpis?.total.deltaPct ?? null}
          series={kpis?.total.series ?? []}
          sparkClassName="text-primary"
        />
        <DataProgressKpiCard
          title="Progress gained"
          icon={TrendingUp}
          loading={loading || kpis == null}
          mainValue={formatProgressPoints(kpis?.gained.value ?? 0)}
          subValue={
            kpis?.gained.previous != null
              ? `vs ${formatMetricInteger(kpis.gained.previous)} pts last period`
              : "No prior period to compare"
          }
          deltaPct={kpis?.gained.deltaPct ?? null}
          series={kpis?.gained.series ?? []}
          sparkClassName="text-emerald-500"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base">
              Progress gained · {periodLabel}
            </CardTitle>
            <CardDescription>
              Daily points added across the selected period.
              {isSingleDayWindow && " Showing 7-day window ending on selected day."}
            </CardDescription>
          </div>
          {!loading && kpis != null && (
            <p className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
              {formatProgressPoints(kpis.gained.value)} total
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 rounded bg-muted/40 animate-pulse" />
          ) : (
            <ProgressGainedChart
              rows={chartRows}
              highlightDate={isSingleDayWindow ? highlightDate : undefined}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
