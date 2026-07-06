"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardDataProgressSection } from "@/components/dashboard/dashboard-data-progress-section"
import { DashboardDatePicker } from "@/components/dashboard/dashboard-date-picker"
import {
  dashboardRangeLabel,
  formatSelectionRangeButtonLabel,
} from "@/lib/utils/dashboard-metrics"
import type { DashboardDateSelection, DashboardRange } from "@/types/dashboard"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const RANGE_OPTIONS: DashboardRange[] = ["today", "7d", "30d"]

const DEFAULT_SELECTION: DashboardDateSelection = { mode: "preset", range: "7d" }

export function DashboardPageClient() {
  const [selection, setSelection] =
    useState<DashboardDateSelection>(DEFAULT_SELECTION)
  const [refreshKey, setRefreshKey] = useState(0)

  const periodLabel = formatSelectionRangeButtonLabel(selection)
  const tabValue = selection.mode === "preset" ? selection.range : ""

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
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="size-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <DashboardDataProgressSection
        selection={selection}
        periodLabel={periodLabel}
        refreshKey={refreshKey}
      />
    </div>
  )
}
