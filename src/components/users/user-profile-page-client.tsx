"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Mail } from "lucide-react"
import { toast } from "sonner"
import { UserFormDialog, type UserFormData } from "@/components/user-form-dialog"
import { UserAvatar } from "@/components/user-avatar"
import { UserProfileContributionsSection } from "@/components/users/user-profile-contributions-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SetPageHeader } from "@/contexts/page-header-context"
import { useAuth } from "@/contexts/auth-context"
import { canAccessUsersAdmin } from "@/lib/auth/roles"
import type { AppUser } from "@/lib/types/app-user"
import { userRoleLabel } from "@/lib/types/user-role"
import type { UserContributions } from "@/lib/types/user-contributions"
import { updateUser } from "@/lib/services/users-api"
import {
  readUserProfilePreview,
  writeUserProfilePreview,
  type UserProfilePreview,
} from "@/lib/utils/user-initials"
import { useUserContributions } from "@/hooks/useUserContributions"

export type UserProfilePageClientProps = {
  userId: number
}

function contributionsToAppUser(row: UserContributions): AppUser {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    createdAt: "",
  }
}

function previewToAppUser(userId: number, preview: UserProfilePreview): AppUser {
  return {
    id: userId,
    fullName: preview.fullName,
    email: preview.email,
    role: preview.role,
    createdAt: "",
  }
}

export function UserProfilePageClient({ userId }: UserProfilePageClientProps) {
  const router = useRouter()
  const { user: authUser, isLoading: authLoading } = useAuth()
  const canManageUsers = canAccessUsersAdmin(authUser?.role)

  const [preview] = useState<UserProfilePreview | null>(() =>
    readUserProfilePreview(userId),
  )

  const { data, loading, error, refetch } = useUserContributions(userId, {
    enabled: canManageUsers && !authLoading,
  })

  const [editOpen, setEditOpen] = useState(false)

  const userForEdit = useMemo((): AppUser | null => {
    if (data) return contributionsToAppUser(data)
    if (preview) return previewToAppUser(userId, preview)
    return null
  }, [data, preview, userId])

  const displayName = data?.fullName ?? preview?.fullName ?? ""
  const displayEmail = data?.email ?? preview?.email ?? ""
  const headerTitle = displayName.trim() || "User profile"

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    if (authLoading || !authUser) return
    if (userId === authUser.id) {
      router.replace("/profile")
      return
    }
    if (!canManageUsers) {
      router.replace("/candidates")
    }
  }, [authLoading, authUser, canManageUsers, router, userId])

  const counts = useMemo(() => data?.counts ?? null, [data])

  const handleEditSubmit = async (form: UserFormData, mode: "create" | "edit") => {
    if (mode !== "edit" || !userForEdit) return
    try {
      const roleChanged = form.role !== userForEdit.role
      await updateUser(userForEdit.id, {
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        ...(form.password.trim() ? { password: form.password } : {}),
      })
      toast.success(`User "${form.fullName}" has been updated.`)
      if (roleChanged) {
        toast.message("User must log in again for role changes to apply.")
      }
      writeUserProfilePreview(userId, {
        fullName: form.fullName,
        email: form.email,
        role: form.role,
      })
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed."
      if (message === "Not found") {
        toast.error("User not found.")
        router.replace("/users")
      } else {
        toast.error(message)
      }
      throw err
    }
  }

  if (authLoading || !canManageUsers || !authUser || userId === authUser.id) {
    return null
  }

  return (
    <>
      <SetPageHeader title={headerTitle} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/users" className="font-medium text-foreground hover:underline">
          Users
        </Link>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
        <span className="truncate font-medium text-foreground" aria-current="page">
          {loading && !displayName ? "Profile" : headerTitle}
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
                    {data ? (
                      <Badge variant="secondary">{userRoleLabel(data.role)}</Badge>
                    ) : null}
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
            disabled={!userForEdit}
            onClick={() => setEditOpen(true)}
          >
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {userForEdit ? (
        <UserFormDialog
          mode="edit"
          user={userForEdit}
          actorRole={authUser.role}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSubmit={handleEditSubmit}
        />
      ) : null}

      <UserProfileContributionsSection loading={loading} error={error} counts={counts} />
    </>
  )
}
