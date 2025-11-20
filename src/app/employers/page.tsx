import { EmployersPageClient } from "@/components/employers-page-client"
import { sampleEmployers } from "@/lib/sample-data/employers"

export default function EmployersPage() {
  // Server Component: handle data fetching and static rendering
  // In a real app, this would be: const employers = await fetchEmployers()
  
  return <EmployersPageClient employers={sampleEmployers} />
}
