import { Suspense } from "react"
import { MyProfilePageClient } from "@/components/users/my-profile-page-client"

export default function MyProfilePage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading profile…</div>}>
      <MyProfilePageClient />
    </Suspense>
  )
}
