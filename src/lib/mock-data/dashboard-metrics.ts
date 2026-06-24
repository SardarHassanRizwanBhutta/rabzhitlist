import { format, subDays } from "date-fns"
import type { DashboardMetricsResponse } from "@/types/dashboard"
import { DEFAULT_DASHBOARD_TIMEZONE } from "@/lib/utils/dashboard-metrics"

/** Deterministic pseudo-random from date string (stable mock per day). */
function daySeed(isoDate: string, salt: number): number {
  let h = salt
  for (let i = 0; i < isoDate.length; i++) {
    h = (h * 31 + isoDate.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function mockCount(isoDate: string, salt: number, min: number, max: number): number {
  const span = max - min + 1
  return min + (daySeed(isoDate, salt) % span)
}

const NEW_CANDIDATE_STARTING_PROGRESS = 12

/**
 * 90 days of synthetic productivity metrics ending on `referenceDate`.
 * Replace with `GET /api/dashboard/metrics` when backend is ready.
 */
export function buildMockDashboardMetrics(
  referenceDate: Date = new Date(),
): DashboardMetricsResponse {
  let candidateCount = 4100
  let totalDataProgress = 241_200

  const daily = Array.from({ length: 90 }, (_, i) => {
    const dayDate = subDays(referenceDate, 89 - i)
    const date = format(dayDate, "yyyy-MM-dd")
    const isWeekend = [0, 6].includes(dayDate.getDay())
    const weekendScale = isWeekend ? 0.45 : 1

    const newCandidates = Math.round(mockCount(date, 1, 4, 18) * weekendScale)
    const newEmployers = Math.round(mockCount(date, 2, 0, 5) * weekendScale)
    const newProjects = Math.round(mockCount(date, 3, 1, 8) * weekendScale)
    const candidatesImproved = Math.round(
      mockCount(date, 4, 8, 45) * weekendScale,
    )
    const progressPointsGained = Math.round(
      mockCount(date, 5, 40, 220) * weekendScale,
    )

    candidateCount += newCandidates
    totalDataProgress +=
      progressPointsGained + newCandidates * NEW_CANDIDATE_STARTING_PROGRESS

    const avgDataProgress =
      candidateCount > 0
        ? Math.round((totalDataProgress / candidateCount) * 10) / 10
        : 0

    return {
      date,
      newCandidates,
      newEmployers,
      newProjects,
      totalDataProgress: Math.round(totalDataProgress),
      avgDataProgress,
      candidateCount,
      progressPointsGained,
      candidatesImproved,
    }
  })

  const todayRow = daily[daily.length - 1]
  const from = daily[0].date
  const to = todayRow.date

  return {
    generatedAt: referenceDate.toISOString(),
    timezone: DEFAULT_DASHBOARD_TIMEZONE,
    range: { from, to },
    summary: {
      today: {
        newCandidates: todayRow.newCandidates,
        newEmployers: todayRow.newEmployers,
        newProjects: todayRow.newProjects,
        totalDataProgress: todayRow.totalDataProgress,
        avgDataProgress: todayRow.avgDataProgress,
        candidateCount: todayRow.candidateCount,
        progressPointsGained: todayRow.progressPointsGained,
        candidatesImproved: todayRow.candidatesImproved,
      },
      totals: {
        candidates: todayRow.candidateCount,
        employers: 312,
        projects: 891,
        avgDataProgress: todayRow.avgDataProgress,
        avgDataProgressDelta: 0.8,
      },
    },
    daily,
  }
}
