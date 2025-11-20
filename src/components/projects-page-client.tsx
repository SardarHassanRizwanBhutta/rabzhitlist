"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Globe } from "lucide-react"
import { ProjectsTable } from "@/components/projects-table"
import { ProjectCreationDialog, ProjectFormData } from "@/components/project-creation-dialog"
import { ProjectsFilterDialog, ProjectFilters } from "@/components/projects-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Project } from "@/lib/types/project"

interface ProjectsPageClientProps {
  projects: Project[]
}

const initialFilters: ProjectFilters = {
  status: [],
  projectTypes: [],
  employers: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  techStacks: [],
}

export function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  const searchParams = useSearchParams()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters)
  const [employerFilter, setEmployerFilter] = useState<{ name: string; id: string } | null>(null)

  // Check for employer filter from URL params
  useEffect(() => {
    const employerFilterName = searchParams.get('employerFilter')
    const employerId = searchParams.get('employerId')
    
    if (employerFilterName && employerId) {
      setEmployerFilter({ name: employerFilterName, id: employerId })
    }
  }, [searchParams])

  // Apply global filters to projects
  const applyGlobalFilters = (projectList: Project[]) => {
    if (!hasGlobalFilters) return projectList

    return projectList.filter(project => {
      // Global Tech Stacks filter
      if (globalFilters.techStacks.length > 0) {
        const hasMatchingTech = project.techStacks.some(tech => 
          globalFilters.techStacks.includes(tech)
        )
        if (!hasMatchingTech) return false
      }

      // Global Vertical Domains filter
      if (globalFilters.verticalDomains.length > 0) {
        const hasMatchingVertical = project.verticalDomains.some(domain => 
          globalFilters.verticalDomains.includes(domain)
        )
        if (!hasMatchingVertical) return false
      }

      // Global Horizontal Domains filter
      if (globalFilters.horizontalDomains.length > 0) {
        const hasMatchingHorizontal = project.horizontalDomains.some(domain => 
          globalFilters.horizontalDomains.includes(domain)
        )
        if (!hasMatchingHorizontal) return false
      }

      // Global Technical Aspects filter
      if (globalFilters.technicalAspects.length > 0) {
        const hasMatchingAspect = project.technicalAspects.some(aspect => 
          globalFilters.technicalAspects.includes(aspect)
        )
        if (!hasMatchingAspect) return false
      }

      // Global Employers filter
      if (globalFilters.employers.length > 0) {
        if (!globalFilters.employers.includes(project.employerName)) return false
      }

      // Global Status filter
      if (globalFilters.status.length > 0) {
        if (!globalFilters.status.includes(project.status)) return false
      }

      return true
    })
  }

  // Filter projects by employer
  const filteredProjects = useMemo(() => {
    let projectList = projects

    // Apply global filters first
    projectList = applyGlobalFilters(projectList)

    if (employerFilter) {
      // Filter projects that belong to this employer
      projectList = projectList.filter(project => {
        return project.employerName.toLowerCase() === employerFilter.name.toLowerCase()
      })
    }

    return projectList
  }, [projects, employerFilter, globalFilters, hasGlobalFilters])

  const handleProjectSubmit = async (data: ProjectFormData) => {
    // Here you would typically send the data to your API
    console.log("New project data:", data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // You could add the project to your state/cache here
    alert("Project created successfully!")
  }

  const handleFiltersChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters)
    // TODO: Apply filters to projects table
    console.log("Project filters applied:", newFilters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    // TODO: Clear filters from projects table
    console.log("Project filters cleared")
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Projects</h2>
          <p className="text-muted-foreground">
            Manage project portfolio and development initiatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProjectsFilterDialog 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          <ProjectCreationDialog onSubmit={handleProjectSubmit} />
        </div>
      </div>

      {/* Global Filter Indicator */}
      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}
      
      <ProjectsTable projects={filteredProjects} />
    </div>
  )
}
