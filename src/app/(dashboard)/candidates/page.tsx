import { Suspense } from "react"
import { CandidatesPageClient } from "@/components/candidates-page-client"

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading candidates…</div>}>
      <CandidatesPageClient />
    </Suspense>
  )
}
