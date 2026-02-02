import { Suspense } from "react"
import { UniversitiesPageClient } from "@/components/universities-page-client"
import { sampleUniversities } from "@/lib/sample-data/universities"

export default function UniversitiesPage() {
  // Server Component: handle data fetching and static rendering
  // In a real app, this would be: const universities = await fetchUniversities()
  
  return (
    <Suspense fallback={<div>Loading universities...</div>}>
      <UniversitiesPageClient universities={sampleUniversities} />
    </Suspense>
  )
}


