import { Suspense } from "react"
import { UniversitiesPageClient } from "@/components/universities-page-client"

export default function UniversitiesPage() {
  return (
    <Suspense fallback={<div>Loading universities...</div>}>
      <UniversitiesPageClient />
    </Suspense>
  )
}
