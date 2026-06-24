"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Building2,
  FolderOpen,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardDataProgressChart } from "@/components/dashboard/dashboard-data-progress-chart"
import { DashboardDatePicker } from "@/components/dashboard/dashboard-date-picker"
import { fetchDashboardMetrics } from "@/lib/services/dashboard-api"
import {
  dashboardRangeLabel,
  filterDailyForProgressChart,
  formatMetricInteger,
  formatPercentOneDecimal,
  formatProgressPoints,
  formatProgressPointsLabel,
  formatSelectionRangeButtonLabel,
  getSelectionBounds,
  getSelectionEndDate,
  resolveProgressPeriodSummary,
  resolveSelectionSummary,
} from "@/lib/utils/dashboard-metrics"
import type {
  DashboardDateSelection,
  DashboardMetricsResponse,
  DashboardRange,
} from "@/types/dashboard"

const RANGE_OPTIONS: DashboardRange[] = ["today", "7d", "30d"]

const DEFAULT_SELECTION: DashboardDateSelection = { mode: "preset", range: "7d" }

export function DashboardPageClient() {
  const [selection, setSelection] =
    useState<DashboardDateSelection>(DEFAULT_SELECTION)
  const [data, setData] = useState<DashboardMetricsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchDashboardMetrics({ range: "30d" })
      setData(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard metrics")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const period = useMemo(
    () => (data ? resolveSelectionSummary(data, selection) : null),
    [data, selection],
  )

  const progressPeriod = useMemo(
    () => (data ? resolveProgressPeriodSummary(data, selection) : null),
    [data, selection],
  )

  const progressChartRows = useMemo(
    () => (data ? filterDailyForProgressChart(data.daily, selection) : []),
    [data, selection],
  )

  const periodLabel = formatSelectionRangeButtonLabel(selection)
  const tabValue = selection.mode === "preset" ? selection.range : ""
  const highlightDate = data ? getSelectionEndDate(selection) : undefined
  const selectionBounds = useMemo(() => getSelectionBounds(selection), [selection])
  const isSingleDayWindow = selectionBounds.from === selectionBounds.to

  const handlePresetChange = (range: DashboardRange) => {
    setSelection({ mode: "preset", range })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Tabs
          value={tabValue}
          onValueChange={(v) => handlePresetChange(v as DashboardRange)}
        >
          <TabsList>
            {RANGE_OPTIONS.map((r) => (
              <TabsTrigger key={r} value={r}>
                {dashboardRangeLabel(r)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 sm:ml-auto">
          <DashboardDatePicker
            selection={selection}
            onSelectionChange={setSelection}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium">Could not load dashboard metrics</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="intake-kpis">
        <h3 id="intake-kpis" className="text-sm font-semibold text-muted-foreground mb-3">
          Intake · {periodLabel}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="New candidates"
            icon={Users}
            value={period?.newCandidates}
            loading={loading}
            href="/candidates"
          />
          <KpiCard
            title="New employers"
            icon={Building2}
            value={period?.newEmployers}
            loading={loading}
            href="/employers"
          />
          <KpiCard
            title="New projects"
            icon={FolderOpen}
            value={period?.newProjects}
            loading={loading}
            href="/projects"
          />
        </div>
      </section>

      <section aria-labelledby="progress-kpis">
        <h3 id="progress-kpis" className="text-sm font-semibold text-muted-foreground mb-3">
          Data progress · {periodLabel}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Total data progress"
            icon={TrendingUp}
            value={progressPeriod?.totalDataProgress}
            loading={loading}
            formatValue={formatProgressPointsLabel}
            hint={
              progressPeriod
                ? `${formatMetricInteger(progressPeriod.candidateCount)} candidates`
                : undefined
            }
          />
          <KpiCard
            title="Progress gained"
            icon={TrendingUp}
            value={progressPeriod?.progressPointsGained}
            loading={loading}
            formatValue={(v) => formatProgressPoints(v)}
            hint="Sum of daily gains in period"
          />
          <KpiCard
            title="Avg completion"
            icon={Users}
            value={progressPeriod?.avgDataProgress}
            loading={loading}
            formatValue={(v) => formatPercentOneDecimal(v)}
            hint="Per candidate at end of period"
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Data progress trend</CardTitle>
          <CardDescription>
            Fleet total (left axis) and daily progress gained (right axis) — {periodLabel}.
            {isSingleDayWindow && " Showing 7-day window ending on selected day."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 rounded bg-muted/40 animate-pulse" />
          ) : (
            <DashboardDataProgressChart
              rows={progressChartRows}
              highlightDate={highlightDate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  title,
  icon: Icon,
  value,
  loading,
  href,
  hint,
  formatValue = formatMetricInteger,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  value?: number
  loading: boolean
  href?: string
  hint?: string
  formatValue?: (n: number) => string
}) {
  const content = (
    <Card className={href ? "transition-colors hover:bg-muted/30" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">
            {value != null ? formatValue(value) : "—"}
          </p>
        )}
        {hint && !loading && (
          <p className="text-xs text-muted-foreground mt-2">{hint}</p>
        )}
        {href && !loading && (
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            View all
            <ArrowRight className="size-3" />
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
