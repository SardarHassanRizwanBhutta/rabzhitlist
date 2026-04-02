import { Suspense } from "react"
import { ProjectsPageClient } from "@/components/projects-page-client"

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading projects...</div>}>
      <ProjectsPageClient />
    </Suspense>
  )
}
