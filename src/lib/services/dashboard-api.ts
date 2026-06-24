import { API_BASE_URL } from "@/lib/config/api"
import { buildMockDashboardMetrics } from "@/lib/mock-data/dashboard-metrics"
import {
  DEFAULT_DASHBOARD_TIMEZONE,
  getRangeDateBounds,
  isDashboardMockEnabled,
} from "@/lib/utils/dashboard-metrics"
import type {
  DashboardMetricsResponse,
  FetchDashboardMetricsParams,
} from "@/types/dashboard"

function dashboardMetricsUrl(params: FetchDashboardMetricsParams): string {
  const timezone = params.timezone ?? DEFAULT_DASHBOARD_TIMEZONE
  const { from, to } = getRangeDateBounds(params.range)
  const q = new URLSearchParams({
    from,
    to,
    timezone,
  })
  return `${API_BASE_URL}/api/dashboard/metrics?${q.toString()}`
}

/**
 * Dashboard productivity metrics.
 * Uses mock data when `NEXT_PUBLIC_DASHBOARD_USE_MOCK` is not `"false"`.
 */
export async function fetchDashboardMetrics(
  params: FetchDashboardMetricsParams,
): Promise<DashboardMetricsResponse> {
  if (isDashboardMockEnabled()) {
    await new Promise((r) => setTimeout(r, 280))
    return buildMockDashboardMetrics()
  }

  const response = await fetch(dashboardMetricsUrl(params), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Dashboard metrics failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<DashboardMetricsResponse>
}
