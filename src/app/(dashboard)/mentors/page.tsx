import { Suspense } from "react"
import { MentorsPageClient } from "@/components/mentors-page-client"

export default function MentorsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading mentors...</div>}>
      <MentorsPageClient />
    </Suspense>
  )
}
