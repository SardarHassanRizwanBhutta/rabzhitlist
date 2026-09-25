"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchMyContributions } from "@/lib/services/auth-api"
import type { UserContributions } from "@/lib/types/user-contributions"
import { userContributionsErrorMessage } from "@/lib/utils/user-contributions-errors"

export type UseMyContributionsOptions = {
  enabled?: boolean
}

export function useMyContributions(options?: UseMyContributionsOptions) {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const enabled =
    options?.enabled !== false && !authLoading && isAuthenticated

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

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchMyContributions()
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
  }, [enabled, refreshKey])

  return { data, loading, error, refetch }
}
