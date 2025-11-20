import { Suspense } from "react"
import { CandidatesPageClient } from "@/components/candidates-page-client"
import { sampleCandidates } from "@/lib/sample-data/candidates"

export default function CandidatesPage() {
  // Server Component: handle data fetching and static rendering
  // In a real app, this would be: const candidates = await fetchCandidates()
  
  return (
    <Suspense fallback={<div>Loading candidates...</div>}>
      <CandidatesPageClient candidates={sampleCandidates} />
    </Suspense>
  )
}
