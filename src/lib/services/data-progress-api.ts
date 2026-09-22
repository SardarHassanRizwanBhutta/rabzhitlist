import { apiFetch } from "@/lib/api-client"
import { DEFAULT_DASHBOARD_TIMEZONE } from "@/lib/utils/dashboard-metrics"
import type {
  DataProgressResponse,
  FetchDataProgressParams,
} from "@/types/data-progress"

export interface FetchDataProgressOptions extends FetchDataProgressParams {
  signal?: AbortSignal
}

function dataProgressPath(params: FetchDataProgressParams): string {
  const timezone = params.timezone ?? DEFAULT_DASHBOARD_TIMEZONE
  const q = new URLSearchParams({
    module: params.module,
    from: params.from,
    to: params.to,
    timezone,
  })
  return `/api/dashboard/data-progress?${q.toString()}`
}

/**
 * Data Progress for a module (KPIs + daily series) plus an avg-completion
 * summary for every module (`summary.modules`) that drives the overview cards.
 * @see docs/DASHBOARD_DATA_PROGRESS_BACKEND_IMPLEMENTATION.md §2
 */
export async function fetchDataProgress(
  params: FetchDataProgressOptions,
): Promise<DataProgressResponse> {
  const { signal, ...query } = params

  const response = await apiFetch(dataProgressPath(query), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Data progress failed (${response.status}): ${text}`)
  }

  return response.json() as Promise<DataProgressResponse>
}
