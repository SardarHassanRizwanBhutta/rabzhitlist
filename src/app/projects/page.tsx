import { ProjectsPageClient } from "@/components/projects-page-client"
import { sampleProjects } from "@/lib/sample-data/projects"

export default function ProjectsPage() {
  // Server Component: handle data fetching and static rendering
  // In a real app, this would be: const projects = await fetchProjects()
  
  return <ProjectsPageClient projects={sampleProjects} />
}
