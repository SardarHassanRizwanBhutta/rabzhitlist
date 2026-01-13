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
  employerCities: [],
  employerCountries: [],
  employerTypes: [],
  clientLocations: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  techStacks: [],
  completionDateStart: null,
  completionDateEnd: null,
  startEndDateStart: null,
  startEndDateEnd: null,
  startDateStart: null,
  startDateEnd: null,
  teamSizeMin: "",
  teamSizeMax: "",
  projectName: "",
  projectLink: "",
  isPublished: null,
  publishPlatforms: [],
  minDownloadCount: "",
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

      // Employer Cities filter
      if (filters.employerCities.length > 0) {
        if (project.employerName === null) {
          return false
        }
        // Find the employer for this project (case-insensitive match)
        const employer = sampleEmployers.find(emp => 
          emp.name.trim().toLowerCase() === project.employerName?.trim().toLowerCase()
        )
        if (!employer) {
          return false
        }
        // Check if employer has any location in the selected cities
        const hasMatchingCity = employer.locations.some(location => 
          location.city !== null && filters.employerCities.includes(location.city)
        )
        if (!hasMatchingCity) return false
      }

      // Employer Countries filter
      if (filters.employerCountries.length > 0) {
        if (project.employerName === null) {
          return false
        }
        // Find the employer for this project (case-insensitive match)
        const employer = sampleEmployers.find(emp => 
          emp.name.trim().toLowerCase() === project.employerName?.trim().toLowerCase()
        )
        if (!employer) {
          return false
        }
        // Check if employer has any location in the selected countries
        const hasMatchingCountry = employer.locations.some(location => 
          location.country !== null && filters.employerCountries.includes(location.country)
        )
        if (!hasMatchingCountry) return false
      }

      // Client Locations filter
      if (filters.clientLocations.length > 0) {
        if (!project.clientLocation) {
          return false
        }
        if (!filters.clientLocations.includes(project.clientLocation)) {
          return false
        }
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
      const projectStartDate = project.startDate ? new Date(project.startDate) : null
      const projectEndDate = project.endDate ? new Date(project.endDate) : null

      // 1. Completion Date Range Filter - filters by endDate only
      if (filters.completionDateStart && filters.completionDateEnd) {
        const filterStartDate = new Date(filters.completionDateStart)
        const filterEndDate = new Date(filters.completionDateEnd)
        filterStartDate.setHours(0, 0, 0, 0)
        filterEndDate.setHours(23, 59, 59, 999)
        
        // Only check project end date (completion date)
        if (!projectEndDate) {
          return false  // Exclude ongoing projects
        }
        
        projectEndDate.setHours(23, 59, 59, 999)
        if (projectEndDate < filterStartDate || projectEndDate > filterEndDate) {
          return false
        }
      } else if (filters.completionDateStart && !filters.completionDateEnd) {
        // Only completion start date - project must have completed on or after this date
        const filterStartDate = new Date(filters.completionDateStart)
        filterStartDate.setHours(0, 0, 0, 0)
        if (!projectEndDate) return false
        projectEndDate.setHours(23, 59, 59, 999)
        if (projectEndDate < filterStartDate) return false
      } else if (filters.completionDateEnd && !filters.completionDateStart) {
        // Only completion end date - project must have completed on or before this date
        const filterEndDate = new Date(filters.completionDateEnd)
        filterEndDate.setHours(23, 59, 59, 999)
        if (!projectEndDate) return false
        projectEndDate.setHours(23, 59, 59, 999)
        if (projectEndDate > filterEndDate) return false
      }

      // 2. Start & End Date Range Filter - filters projects that started AND completed within range
      if (filters.startEndDateStart && filters.startEndDateEnd) {
        const filterStartDate = new Date(filters.startEndDateStart)
        const filterEndDate = new Date(filters.startEndDateEnd)
        filterStartDate.setHours(0, 0, 0, 0)
        filterEndDate.setHours(23, 59, 59, 999)
        
        // Project must have started within range
        if (!projectStartDate) {
          return false
        }
        projectStartDate.setHours(0, 0, 0, 0)
        if (projectStartDate < filterStartDate || projectStartDate > filterEndDate) {
          return false
        }
        
        // Project must have completed within range
        if (!projectEndDate) {
          return false  // Exclude ongoing projects
        }
        projectEndDate.setHours(23, 59, 59, 999)
        if (projectEndDate < filterStartDate || projectEndDate > filterEndDate) {
          return false
        }
      } else if (filters.startEndDateStart && !filters.startEndDateEnd) {
        // Only start & end start date - project must have started on or after this date AND completed
        const filterStartDate = new Date(filters.startEndDateStart)
        filterStartDate.setHours(0, 0, 0, 0)
        if (!projectStartDate) return false
        projectStartDate.setHours(0, 0, 0, 0)
        if (projectStartDate < filterStartDate) return false
        if (!projectEndDate) return false  // Must be completed
      } else if (filters.startEndDateEnd && !filters.startEndDateStart) {
        // Only start & end end date - project must have started AND completed on or before this date
        const filterEndDate = new Date(filters.startEndDateEnd)
        filterEndDate.setHours(23, 59, 59, 999)
        if (!projectStartDate || !projectEndDate) return false
        projectStartDate.setHours(0, 0, 0, 0)
        projectEndDate.setHours(23, 59, 59, 999)
        if (projectStartDate > filterEndDate || projectEndDate > filterEndDate) return false
      }

      // 3. Start Date Range Filter - filters by startDate only
      if (filters.startDateStart && filters.startDateEnd) {
        const filterStartDate = new Date(filters.startDateStart)
        const filterEndDate = new Date(filters.startDateEnd)
        filterStartDate.setHours(0, 0, 0, 0)
        filterEndDate.setHours(23, 59, 59, 999)
        
        // Only check project start date
        if (!projectStartDate) {
          return false
        }
        
        projectStartDate.setHours(0, 0, 0, 0)
        if (projectStartDate < filterStartDate || projectStartDate > filterEndDate) {
          return false
        }
      } else if (filters.startDateStart && !filters.startDateEnd) {
        // Only start date start - project must have started on or after this date
        const filterStartDate = new Date(filters.startDateStart)
        filterStartDate.setHours(0, 0, 0, 0)
        if (!projectStartDate) return false
        projectStartDate.setHours(0, 0, 0, 0)
        if (projectStartDate < filterStartDate) return false
      } else if (filters.startDateEnd && !filters.startDateStart) {
        // Only start date end - project must have started on or before this date
        const filterEndDate = new Date(filters.startDateEnd)
        filterEndDate.setHours(23, 59, 59, 999)
        if (!projectStartDate) return false
        projectStartDate.setHours(0, 0, 0, 0)
        if (projectStartDate > filterEndDate) return false
      }

      // Employer Types filter
      if (filters.employerTypes.length > 0) {
        if (project.employerName === null) {
          return false
        }
        // Find the employer for this project (case-insensitive match)
        const employer = sampleEmployers.find(emp =>
          emp.name.toLowerCase() === project.employerName!.toLowerCase()
        )
        if (!employer) return false
        
        if (!filters.employerTypes.includes(employer.employerType)) return false
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

      // Published App filter
      if (filters.isPublished !== null) {
        if (filters.isPublished === true && !project.isPublished) {
          return false // Filter requires published, but project is not published
        }
        if (filters.isPublished === false && project.isPublished) {
          return false // Filter requires unpublished, but project is published
        }
        
        // If platform filter is also applied, further filter by platforms
        if (filters.publishPlatforms.length > 0 && project.isPublished) {
          const hasPlatformMatch = project.publishPlatforms?.some(platform =>
            filters.publishPlatforms.includes(platform)
          )
          if (!hasPlatformMatch) return false
        }
      }
      
      // Filter by platforms only (independent of isPublished)
      // If platforms are selected but isPublished is not checked,
      // we still filter for published projects (platforms imply published status)
      if (filters.publishPlatforms.length > 0 && filters.isPublished !== true) {
        // Find published projects with matching platforms
        if (!project.isPublished) {
          return false // Platforms imply published status
        }
        const hasPlatformMatch = project.publishPlatforms?.some(platform =>
          filters.publishPlatforms.includes(platform)
        )
        if (!hasPlatformMatch) return false
      }

      // Download Count filter
      if (filters.minDownloadCount) {
        const minCount = parseInt(filters.minDownloadCount)
        if (!isNaN(minCount) && minCount > 0) {
          if (!project.downloadCount || project.downloadCount < minCount) {
            return false
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
