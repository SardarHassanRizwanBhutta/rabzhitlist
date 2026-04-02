import { Suspense } from "react"
import { EmployersPageClient } from "@/components/employers-page-client"

export default function EmployersPage() {
  return (
    <Suspense fallback={<div>Loading employers...</div>}>
      <EmployersPageClient />
    </Suspense>
  )
}
