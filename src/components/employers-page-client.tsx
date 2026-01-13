"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"
import { EmployersTable } from "@/components/employers-table"
import { EmployerCreationDialog, EmployerFormData, EmployerVerificationState } from "@/components/employer-creation-dialog"
import { EmployersFilterDialog, EmployerFilters } from "@/components/employers-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import { sampleProjects } from "@/lib/sample-data/projects"
import type { Employer, EmployerLocation } from "@/lib/types/employer"

interface EmployersPageClientProps {
  employers: Employer[]
}

const initialFilters: EmployerFilters = {
  status: [],
  foundedYears: [],
  countries: [],
  cities: [],
  employerTypes: [],
  salaryPolicies: [],
  sizeMin: "",
  sizeMax: "",
  minLocationsCount: "",
  minCitiesCount: "",
  minApplicants: "",
  // Employer-based filters
  employerTechStacks: [],
  benefits: [],
  shiftTypes: [],
  shiftTypesStrict: false,
  workModes: [],
  workModesStrict: false,
  timeSupportZones: [],
  rankings: [],
  tags: [],
  techStackMinCount: "",
  employeesWithOrganizationalRole: {
    organizationName: "",
    roles: []
  },
  employeeCities: [],
  employeeCountries: [],
  // Project-based filters
  techStacks: [],
  projectTechStackMinYears: {
    techStacks: [],
    minYears: ""
  },
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  clientLocations: [],
  projectStatus: [],
  projectTeamSizeMin: "",
  projectTeamSizeMax: "",
  // Published App filters
  hasPublishedProject: null,
  publishPlatforms: [],
  minDownloadCount: "",
}

export function EmployersPageClient({ employers }: EmployersPageClientProps) {
  const searchParams = useSearchParams()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<EmployerFilters>(initialFilters)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [employerToEdit, setEmployerToEdit] = useState<Employer | null>(null)

  // Check for URL filters
  useEffect(() => {
    const employerFilterName = searchParams.get('employerFilter')
    const employerId = searchParams.get('employerId')
    
    if (employerFilterName && employerId) {
      // Apply employer filter by setting search in the table
      // Note: The table component handles search, so we could set a search state here
      // For now, we'll just ensure the employer is visible by filtering
    }
  }, [searchParams])

  const handleEmployerSubmit = async (data: EmployerFormData, verificationState?: EmployerVerificationState) => {
    // Here you would typically send the data to your API
    if (verificationState) {
      console.log("Employer data with verification:", data, verificationState)
    } else {
      console.log("New employer data:", data)
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // You could add the employer to your state/cache here
    if (verificationState) {
      alert("Employer updated and verified successfully!")
    } else {
      alert("Employer created successfully!")
    }
    
    // Close edit dialog if open
    if (editDialogOpen) {
      setEditDialogOpen(false)
      setEmployerToEdit(null)
    }
  }

  const handleFiltersChange = (newFilters: EmployerFilters) => {
    setFilters(newFilters)
    // TODO: Apply filters to employers table
    console.log("Employer filters applied:", newFilters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    // TODO: Clear filters from employers table
    console.log("Employer filters cleared")
  }

  const handleViewEmployer = (employer: Employer) => {
    // TODO: Implement view employer functionality
    alert(`View employer: ${employer.name}`)
  }

  const handleEditEmployer = (employer: Employer) => {
    setEmployerToEdit(employer)
    setEditDialogOpen(true)
  }

  const handleAddLocation = (employer: Employer) => {
    // TODO: Implement add location functionality
    alert(`Add office to ${employer.name}`)
  }


  // Apply global filters to employers
  const applyGlobalFilters = (employerList: Employer[]) => {
    if (!hasGlobalFilters) return employerList

    return employerList.filter(employer => {
      // Global Countries filter
      if (globalFilters.countries.length > 0) {
        const hasMatchingCountry = employer.locations.some(location =>
          location.country !== null && globalFilters.countries.includes(location.country)
        )
        if (!hasMatchingCountry) return false
      }

      // Global Cities filter
      if (globalFilters.cities.length > 0) {
        const hasMatchingCity = employer.locations.some(location =>
          location.city !== null && globalFilters.cities.includes(location.city)
        )
        if (!hasMatchingCity) return false
      }

      // Helper function to get employer's projects
      const getEmployerProjects = () => {
        return sampleProjects.filter(project => {
          if (project.employerName === null) return false
          return project.employerName.trim().toLowerCase() === employer.name.trim().toLowerCase()
        })
      }

      // Helper function for case-insensitive array comparison
      const arraysMatch = (arr1: string[], arr2: string[]) => {
        return arr1.some(item1 => 
          arr2.some(item2 => 
            item1.toLowerCase().trim() === item2.toLowerCase().trim()
          )
        )
      }

      // Global Tech Stacks filter (via projects)
      if (globalFilters.techStacks.length > 0) {
        const employerProjects = getEmployerProjects()
        const hasMatchingTech = employerProjects.some(project =>
          arraysMatch(project.techStacks, globalFilters.techStacks)
        )
        if (!hasMatchingTech) return false
      }

      // Global Vertical Domains filter (via projects)
      if (globalFilters.verticalDomains.length > 0) {
        const employerProjects = getEmployerProjects()
        const hasMatchingVertical = employerProjects.some(project =>
          arraysMatch(project.verticalDomains, globalFilters.verticalDomains)
        )
        if (!hasMatchingVertical) return false
      }

      // Global Horizontal Domains filter (via projects)
      if (globalFilters.horizontalDomains.length > 0) {
        const employerProjects = getEmployerProjects()
        const hasMatchingHorizontal = employerProjects.some(project =>
          arraysMatch(project.horizontalDomains, globalFilters.horizontalDomains)
        )
        if (!hasMatchingHorizontal) return false
      }

      // Global Technical Aspects filter (via projects)
      if (globalFilters.technicalAspects.length > 0) {
        const employerProjects = getEmployerProjects()
        const hasMatchingAspect = employerProjects.some(project =>
          arraysMatch(project.technicalAspects, globalFilters.technicalAspects)
        )
        if (!hasMatchingAspect) return false
      }

      // Global Employers filter
      if (globalFilters.employers.length > 0) {
        if (!globalFilters.employers.includes(employer.name)) return false
      }

      // Global Status filter
      if (globalFilters.status.length > 0) {
        if (!globalFilters.status.includes(employer.status)) return false
      }

      return true
    })
  }

  // Apply global filters and URL filters to employers
  const filteredEmployers = useMemo(() => {
    let filtered = applyGlobalFilters(employers)
    
    // Apply URL filter if present
    const employerFilterName = searchParams.get('employerFilter')
    const employerId = searchParams.get('employerId')
    
    if (employerFilterName && employerId) {
      filtered = filtered.filter(emp => 
        emp.id === employerId || emp.name.trim().toLowerCase() === employerFilterName.trim().toLowerCase()
      )
    }
    
    return filtered
  }, [employers, globalFilters, hasGlobalFilters, searchParams])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Employers</h2>
          <p className="text-muted-foreground">
            Manage company database and office locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EmployersFilterDialog 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          <EmployerCreationDialog onSubmit={handleEmployerSubmit} />
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
      
      <EmployersTable
        employers={filteredEmployers}
        filters={filters}
        onView={handleViewEmployer}
        onEdit={handleEditEmployer}
        onAddLocation={handleAddLocation}
      />

      {/* Edit Employer Dialog with Verification */}
      {employerToEdit && (
        <EmployerCreationDialog
          mode="edit"
          employerData={employerToEdit}
          showVerification={true}
          onSubmit={handleEmployerSubmit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setEmployerToEdit(null)
            }
          }}
        />
      )}
    </div>
  )
}
