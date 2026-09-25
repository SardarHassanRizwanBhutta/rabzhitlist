"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchUserContributions } from "@/lib/services/users-api"
import type { UserContributions } from "@/lib/types/user-contributions"
import { userContributionsErrorMessage } from "@/lib/utils/user-contributions-errors"

export type UseUserContributionsOptions = {
  /** When false, clears state and skips fetch (e.g. dialog closed). Default: true when userId is valid. */
  enabled?: boolean
}

export function useUserContributions(
  userId: number | null | undefined,
  options?: UseUserContributionsOptions,
) {
  const enabled =
    options?.enabled !== false && userId != null && Number.isFinite(userId) && userId > 0

  const [data, setData] = useState<UserContributions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const id = userId as number
    let cancelled = false

    setLoading(true)
    setError(null)

    void fetchUserContributions(id)
      .then((result) => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setData(null)
        setError(userContributionsErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, userId, refreshKey])

  return { data, loading, error, refetch }
}
