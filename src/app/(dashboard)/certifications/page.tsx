import { Suspense } from "react"
import { CertificationsPageClient } from "@/components/certifications-page-client"

export default function CertificationsPage() {
  return (
    <Suspense fallback={<div>Loading certifications...</div>}>
      <CertificationsPageClient />
    </Suspense>
  )
}
