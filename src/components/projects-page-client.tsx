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
import { sampleEmployers } from "@/lib/sample-data/employers"
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
  const [projectFilter, setProjectFilter] = useState<{ name: string; id: string } | null>(null)

  // Check for employer filter from URL params
  useEffect(() => {
    const employerFilterName = searchParams.get('employerFilter')
    const employerId = searchParams.get('employerId')
    
    if (employerFilterName && employerId) {
      setEmployerFilter({ name: employerFilterName, id: employerId })
    }
  }, [searchParams])

  // Check for project filter from URL params
  useEffect(() => {
    const projectFilterName = searchParams.get('projectFilter')
    const projectId = searchParams.get('projectId')
    
    if (projectFilterName && projectId) {
      setProjectFilter({ name: projectFilterName, id: projectId })
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
        if (project.employerName === null) return false
        if (!globalFilters.employers.includes(project.employerName)) return false
      }

      // Global Status filter
      if (globalFilters.status.length > 0) {
        if (!globalFilters.status.includes(project.status)) return false
      }

      return true
    })
  }

  // Filter projects by employer, project, and filters
  const filteredProjects = useMemo(() => {
    let projectList = projects

    // Apply global filters first
    projectList = applyGlobalFilters(projectList)

    // Apply project filter from URL (highest priority)
    if (projectFilter) {
      projectList = projectList.filter(project => 
        project.id === projectFilter.id || 
        project.projectName.trim().toLowerCase() === projectFilter.name.trim().toLowerCase()
      )
    }

    // Apply employer filter from URL
    if (employerFilter) {
      projectList = projectList.filter(project => {
        return project.employerName !== null && 
               project.employerName.toLowerCase() === employerFilter.name.toLowerCase()
      })
    }

    // Apply filter dialog filters
    return projectList.filter(project => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(project.status)) {
        return false
      }

      // Project Type filter
      if (filters.projectTypes.length > 0 && !filters.projectTypes.includes(project.projectType)) {
        return false
      }

      // Employers filter
      if (filters.employers.length > 0) {
        if (project.employerName === null) {
          return false
        }
        // Check if any selected employer matches the project's employer
        const hasMatchingEmployer = filters.employers.some(employerId => {
          // Find employer by ID and compare name
          const employer = sampleEmployers.find(emp => emp.id === employerId)
          return employer && employer.name === project.employerName
        })
        if (!hasMatchingEmployer) return false
      }

      // Tech Stacks filter
      if (filters.techStacks.length > 0) {
        const hasMatchingTech = project.techStacks.some(tech =>
          filters.techStacks.includes(tech)
        )
        if (!hasMatchingTech) return false
      }

      // Vertical Domains filter
      if (filters.verticalDomains.length > 0) {
        const hasMatchingVertical = project.verticalDomains.some(domain =>
          filters.verticalDomains.includes(domain)
        )
        if (!hasMatchingVertical) return false
      }

      // Horizontal Domains filter
      if (filters.horizontalDomains.length > 0) {
        const hasMatchingHorizontal = project.horizontalDomains.some(domain =>
          filters.horizontalDomains.includes(domain)
        )
        if (!hasMatchingHorizontal) return false
      }

      // Technical Aspects filter
      if (filters.technicalAspects.length > 0) {
        const hasMatchingAspect = project.technicalAspects.some(aspect =>
          filters.technicalAspects.includes(aspect)
        )
        if (!hasMatchingAspect) return false
      }

      return true
    })
  }, [projects, employerFilter, projectFilter, globalFilters, hasGlobalFilters, filters])

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
