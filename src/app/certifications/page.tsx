import { CertificationsPageClient } from "@/components/certifications-page-client"
import { sampleCertifications } from "@/lib/sample-data/certifications"

export default function CertificationsPage() {
  // Server Component: handle data fetching and static rendering
  // In a real app, this would be: const certifications = await fetchCertifications()
  
  return <CertificationsPageClient certifications={sampleCertifications} />
}
