"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/user-avatar"
import { UserEditProfilePasswordDialog } from "@/components/users/user-edit-profile-password-dialog"
import { UserProfileContributionsSection } from "@/components/users/user-profile-contributions-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SetPageHeader } from "@/contexts/page-header-context"
import { useAuth } from "@/contexts/auth-context"
import { userRoleLabel } from "@/lib/types/user-role"
import { useMyContributions } from "@/hooks/useMyContributions"

const PAGE_TITLE = "My Profile"

export function MyProfilePageClient() {
  const router = useRouter()
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth()
  const { data, loading, error } = useMyContributions({
    enabled: !authLoading && isAuthenticated,
  })
  const [editOpen, setEditOpen] = useState(false)

  const displayName = data?.fullName ?? authUser?.fullName ?? ""
  const displayEmail = data?.email ?? authUser?.email ?? ""
  const roleLabel = data ? userRoleLabel(data.role) : authUser?.role != null ? userRoleLabel(authUser.role) : null

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
    }
  }, [authLoading, isAuthenticated, router])

  const counts = useMemo(() => data?.counts ?? null, [data])

  if (authLoading || !isAuthenticated || !authUser) {
    return null
  }

  return (
    <>
      <SetPageHeader title={PAGE_TITLE} />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground" aria-current="page">
          {PAGE_TITLE}
        </span>
      </nav>

      <Card className="mt-4 overflow-hidden">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {loading && !displayName ? (
              <Skeleton className="size-20 shrink-0 rounded-full" />
            ) : (
              <UserAvatar
                variant="profile"
                name={displayName || " "}
                email={displayEmail || " "}
              />
            )}
            <div className="space-y-2">
              {loading && !displayName ? (
                <>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-56" />
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
                    {roleLabel ? <Badge variant="secondary">{roleLabel}</Badge> : null}
                  </div>
                  {displayEmail ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0" aria-hidden />
                      <span>{displayEmail}</span>
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <Button
            type="button"
            className="shrink-0 cursor-pointer"
            onClick={() => setEditOpen(true)}
          >
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      <UserEditProfilePasswordDialog open={editOpen} onOpenChange={setEditOpen} />

      <UserProfileContributionsSection loading={loading} error={error} counts={counts} />
    </>
  )
}
