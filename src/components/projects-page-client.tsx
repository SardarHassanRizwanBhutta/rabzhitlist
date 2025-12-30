"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Globe, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectsTable } from "@/components/projects-table"
import { ProjectCreationDialog, ProjectFormData, ProjectVerificationState } from "@/components/project-creation-dialog"
import { toast } from "sonner"
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
  startDate: null,
  endDate: null,
  teamSizeMin: "",
  teamSizeMax: "",
  projectName: "",
  projectLink: "",
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
      // Project Name filter
      if (filters.projectName && filters.projectName.trim()) {
        const searchTerm = filters.projectName.trim().toLowerCase()
        const projectName = project.projectName ? project.projectName.toLowerCase() : ""
        if (!projectName.includes(searchTerm)) {
          return false
        }
      }

      // Project Link filter
      if (filters.projectLink && filters.projectLink.trim()) {
        const searchTerm = filters.projectLink.trim().toLowerCase()
        if (!project.projectLink) {
          return false
        }
        const projectLink = project.projectLink.toLowerCase()
        if (!projectLink.includes(searchTerm)) {
          return false
        }
      }

      // Status filter
      if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        if (!filters.status.includes(project.status)) {
          return false
        }
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

      // Date Range filters
      // If both startDate and endDate are set, filter projects that have activity within the range
      // (project starts before/on filter end date AND project ends after/on filter start date, or is ongoing)
      // If only startDate is set, filter projects that start on or after that date
      // If only endDate is set, filter projects that end on or before that date (or started before if ongoing)
      if (filters.startDate || filters.endDate) {
        const projectStartDate = project.startDate ? new Date(project.startDate) : null
        const projectEndDate = project.endDate ? new Date(project.endDate) : null

        // If both dates are set, check if project has activity within the date range
        if (filters.startDate && filters.endDate) {
          const filterStartDate = new Date(filters.startDate)
          const filterEndDate = new Date(filters.endDate)
          
          // Set times for proper comparison
          filterStartDate.setHours(0, 0, 0, 0)
          filterEndDate.setHours(23, 59, 59, 999)
          
          // For date range filtering, include projects that:
          // 1. Have an end date within the range (completed projects)
          // 2. Are ongoing but started before/on filter end date (active during range)
          if (projectEndDate) {
            // Completed project - check if end date is within the range
            projectEndDate.setHours(23, 59, 59, 999)
            if (projectEndDate < filterStartDate || projectEndDate > filterEndDate) {
              return false
            }
          } else {
            // Ongoing project (endDate is null) - include if it started before/on filter end date
            if (!projectStartDate) return false
            projectStartDate.setHours(0, 0, 0, 0)
            if (projectStartDate > filterEndDate) {
              return false
            }
          }
        } else if (filters.startDate) {
          // Only start date filter - project should start on or after filter start date
          if (!projectStartDate) return false
          const filterStartDate = new Date(filters.startDate)
          filterStartDate.setHours(0, 0, 0, 0)
          projectStartDate.setHours(0, 0, 0, 0)
          if (projectStartDate < filterStartDate) return false
        } else if (filters.endDate) {
          // Only end date filter - project should end on or before filter end date
          // For ongoing projects (no end date), include them if they started before or on filter end date
          if (projectEndDate) {
            const filterEndDate = new Date(filters.endDate)
            filterEndDate.setHours(23, 59, 59, 999)
            projectEndDate.setHours(23, 59, 59, 999)
            if (projectEndDate > filterEndDate) return false
          } else if (projectStartDate) {
            // Ongoing project - include if it started before or on filter end date
            const filterEndDate = new Date(filters.endDate)
            filterEndDate.setHours(23, 59, 59, 999)
            projectStartDate.setHours(0, 0, 0, 0)
            if (projectStartDate > filterEndDate) return false
          } else {
            // No start or end date - exclude
            return false
          }
        }
      }

      // Team Size filter
      if (filters.teamSizeMin || filters.teamSizeMax) {
        if (!project.teamSize) return false
        
        // Parse team size - can be "5" or "20-30"
        const parseTeamSize = (teamSize: string): { min: number; max: number } => {
          const rangeMatch = teamSize.match(/^(\d+)-(\d+)$/)
          if (rangeMatch) {
            const [, min, max] = rangeMatch
            return { min: parseInt(min), max: parseInt(max) }
          }
          // Single number
          const num = parseInt(teamSize)
          return { min: num, max: num }
        }

        const projectTeamSize = parseTeamSize(project.teamSize)
        
        // Check minimum filter
        if (filters.teamSizeMin) {
          const filterMin = parseInt(filters.teamSizeMin)
          if (!isNaN(filterMin) && projectTeamSize.max < filterMin) {
            return false // Project's max team size is below filter minimum
          }
        }
        
        // Check maximum filter
        if (filters.teamSizeMax) {
          const filterMax = parseInt(filters.teamSizeMax)
          if (!isNaN(filterMax) && projectTeamSize.min > filterMax) {
            return false // Project's min team size is above filter maximum
          }
        }
      }

      return true
    })
  }, [projects, employerFilter, projectFilter, globalFilters, hasGlobalFilters, filters])

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  
  // Verification state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [projectToVerify, setProjectToVerify] = useState<Project | null>(null)

  const handleProjectSubmit = async (data: ProjectFormData, verificationState?: ProjectVerificationState) => {
    // Here you would typically send the data to your API
    console.log("Project data:", data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // You could add/update the project to your state/cache here
    if (projectToEdit) {
      toast.success("Project updated successfully!")
      setEditDialogOpen(false)
      setProjectToEdit(null)
    } else {
      toast.success("Project created successfully!")
      setCreateDialogOpen(false)
    }
  }

  // Handle verification submission
  const handleVerifySubmit = async (formData: ProjectFormData, verificationState?: ProjectVerificationState) => {
    // In real app, this would call API to update project and save verifications
    console.log("Updating project with verification:", { formData, verificationState })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Show success message
    const verifiedCount = verificationState?.verifiedFields.size || 0
    const modifiedCount = verificationState?.modifiedFields.size || 0
    
    toast.success(
      `Project updated! ${verifiedCount} field(s) verified${modifiedCount > 0 ? `, ${modifiedCount} field(s) modified` : ''}.`,
      { duration: 4000 }
    )
    
    setVerifyDialogOpen(false)
    setProjectToVerify(null)
  }

  const handleEdit = (project: Project) => {
    setProjectToEdit(project)
    setEditDialogOpen(true)
  }

  const handleVerify = (project: Project) => {
    setProjectToVerify(project)
    setVerifyDialogOpen(true)
  }

  const handleFiltersChange = (newFilters: ProjectFilters) => {
    console.log("Project filters applied:", newFilters)
    setFilters(newFilters)
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
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
          <ProjectCreationDialog 
            mode="create"
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSubmit={handleProjectSubmit} 
          />
          {projectToEdit && (
            <ProjectCreationDialog
              mode="edit"
              projectData={projectToEdit}
              open={editDialogOpen}
              onOpenChange={(open) => {
                setEditDialogOpen(open)
                if (!open) {
                  setProjectToEdit(null)
                }
              }}
              onSubmit={handleProjectSubmit}
            />
          )}
          {/* Verification Dialog */}
          {projectToVerify && (
            <ProjectCreationDialog
              mode="edit"
              projectData={projectToVerify}
              showVerification={true}
              open={verifyDialogOpen}
              onOpenChange={(open) => {
                setVerifyDialogOpen(open)
                if (!open) {
                  setProjectToVerify(null)
                }
              }}
              onSubmit={handleVerifySubmit}
            />
          )}
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
      
      <ProjectsTable 
        projects={filteredProjects}
        onEdit={handleEdit}
        onVerify={handleVerify}
      />
    </div>
  )
}
