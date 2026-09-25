import { Suspense } from "react"
import { notFound } from "next/navigation"
import { UserProfilePageClient } from "@/components/users/user-profile-page-client"

type PageProps = {
  params: Promise<{ id: string }>
}

function parseUserId(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return null
  return n
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params
  const userId = parseUserId(id)
  if (userId == null) notFound()

  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading profile…</div>}>
      <UserProfilePageClient userId={userId} />
    </Suspense>
  )
}
