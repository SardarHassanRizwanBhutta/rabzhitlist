import { Suspense } from "react"
import { AchievementsPageClient } from "@/components/achievements-page-client"

export default function AchievementsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading achievements…</div>}>
      <AchievementsPageClient />
    </Suspense>
  )
}
