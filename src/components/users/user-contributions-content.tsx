"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  CONTRIBUTION_COUNT_KEYS,
  type UserContributions,
} from "@/lib/types/user-contributions"
import { userRoleLabel } from "@/lib/types/user-role"

export type UserContributionsContentProps = {
  data: UserContributions | null
  loading: boolean
  error: string | null
  /** When true, show identity from list row while the contributions request is in flight. */
  pendingIdentity?: { fullName: string; email: string } | null
}

function formatCount(value: number): string {
  return value.toLocaleString()
}

export function UserContributionsContent({
  data,
  loading,
  error,
  pendingIdentity,
}: UserContributionsContentProps) {
  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    )
  }

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading contributions">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONTRIBUTION_COUNT_KEYS.map(({ key }) => (
            <Skeleton key={key} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const fullName = data?.fullName ?? pendingIdentity?.fullName ?? ""
  const email = data?.email ?? pendingIdentity?.email ?? ""
  const roleLabel = data ? userRoleLabel(data.role) : null

  return (
    <div className="space-y-4">
      {(fullName || email) && (
        <div>
          {fullName ? <p className="font-medium leading-none">{fullName}</p> : null}
          {email ? (
            <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          ) : null}
          {roleLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">{roleLabel}</p>
          ) : null}
        </div>
      )}

      {data ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          {CONTRIBUTION_COUNT_KEYS.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-md border bg-muted/30 px-3 py-2"
            >
              <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatCount(data.counts[key])}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {loading && data ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Refreshing…
        </p>
      ) : null}
    </div>
  )
}
