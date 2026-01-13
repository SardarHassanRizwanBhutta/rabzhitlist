"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"

import { Filter } from "lucide-react"
import { EmployerStatus, SalaryPolicy, EmployerRanking, EmployerType, EMPLOYER_STATUS_LABELS, SALARY_POLICY_LABELS, EMPLOYER_RANKING_LABELS, EMPLOYER_TYPE_LABELS } from "@/lib/types/employer"
import { ProjectStatus, PROJECT_STATUS_LABELS, PublishPlatform } from "@/lib/types/project"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"

// Filter interfaces
export interface EmployerFilters {
  status: EmployerStatus[]
  foundedYears: string[]
  countries: string[]
  cities: string[]
  employerTypes: EmployerType[]  // Filter by employer type (Product Based, Client Based)
  salaryPolicies: SalaryPolicy[]
  sizeMin: string
  sizeMax: string
  minLocationsCount: string  // Minimum total number of offices/locations
  minCitiesCount: string  // Minimum number of unique cities (optionally within selected country)
  minApplicants: string  // Minimum number of applicants/employees (candidates with work experience at this employer)
  // Employee location filters - filter employers by where their employees/candidates are located
  employeeCities: string[]  // Filter employers by their employees' cities (e.g., ["Karachi", "Lahore", "Islamabad"])
  employeeCountries: string[]  // Filter employers by their employees' countries (e.g., ["Pakistan"])
  // Employer-based filters
  employerTechStacks: string[]
  benefits: string[]
  shiftTypes: string[]
  shiftTypesStrict: boolean  // When true, requires ALL employees work in selected shift types only
  workModes: string[]
  workModesStrict: boolean  // When true, requires ALL employees work in selected work modes only
  timeSupportZones: string[]
  techStackMinCount: string  // Minimum count of developers with selected tech stacks (used with employerTechStacks)
  rankings: EmployerRanking[]  // Employer ranking filter
  tags: string[]  // Filter by tags like "DPL Competitive", "Enterprise"
  // Employees with organizational roles filter
  employeesWithOrganizationalRole: {
    organizationName: string  // e.g., "PASHA"
    roles?: string[]          // Optional: specific roles (e.g., ["CEO", "Board Member"])
  }

  // Project-based filters
  techStacks: string[]
  // Project tech stack minimum years of experience
  projectTechStackMinYears: {
    techStacks: string[]
    minYears: string
  }
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  clientLocations: string[]  // Filter by client's location in projects (e.g., "San Francisco", "Silicon Valley", "United States")
  projectStatus: string[]
  projectTeamSizeMin: string  // Minimum project team size
  projectTeamSizeMax: string  // Maximum project team size (optional)
  // Published App filters
  hasPublishedProject: boolean | null  // null = no filter, true = has published app/project
  publishPlatforms: string[]  // ["App Store", "Play Store", "Web", "Desktop"] - filter by specific platforms
  minDownloadCount: string  // Minimum download count (e.g., "100000" for 100K+) - filter employers by their projects' download count
}

interface EmployersFilterDialogProps {
  children?: React.ReactNode
  filters: EmployerFilters
  onFiltersChange: (filters: EmployerFilters) => void
  onClearFilters: () => void
}

// Extract unique values from employer data
const extractUniqueCountries = (): string[] => {
  const countries = new Set<string>()
  sampleEmployers.forEach(employer => {
    employer.locations.forEach(location => {
      if (location.country !== null) {
        countries.add(location.country)
      }
    })
  })
  return Array.from(countries).sort()
}

const extractUniqueCities = (): string[] => {
  const cities = new Set<string>()
  sampleEmployers.forEach(employer => {
    employer.locations.forEach(location => {
      if (location.city !== null) {
        cities.add(location.city)
      }
    })
  })
  return Array.from(cities).sort()
}

const extractUniqueFoundedYears = (): number[] => {
  const years = new Set<number>()
  sampleEmployers.forEach(employer => {
    if (employer.foundedYear !== null) {
      years.add(employer.foundedYear)
    }
  })
  return Array.from(years).sort((a, b) => b - a) // Newest first
}

// City to Country mapping (used for employee location filtering)
const CITY_TO_COUNTRY_MAP: Record<string, string> = {
  // Pakistan cities
  "Karachi": "Pakistan",
  "Lahore": "Pakistan",
  "Islamabad": "Pakistan",
  "Rawalpindi": "Pakistan",
  "Faisalabad": "Pakistan",
  "Multan": "Pakistan",
  "Peshawar": "Pakistan",
  "Quetta": "Pakistan",
  "Sialkot": "Pakistan",
  "Hyderabad": "Pakistan",
  "Gujranwala": "Pakistan",
  "Sargodha": "Pakistan",
  "Bahawalpur": "Pakistan",
  "Sukkur": "Pakistan",
  "Larkana": "Pakistan",
  "Sheikhupura": "Pakistan",
  "Rahim Yar Khan": "Pakistan",
  "Gujrat": "Pakistan",
  "Kasur": "Pakistan",
  "Mardan": "Pakistan",
  // US cities (common ones)
  "New York": "United States",
  "Los Angeles": "United States",
  "Chicago": "United States",
  "Houston": "United States",
  "Phoenix": "United States",
  "Philadelphia": "United States",
  "San Antonio": "United States",
  "San Diego": "United States",
  "Dallas": "United States",
  "San Jose": "United States",
  "Austin": "United States",
  "Jacksonville": "United States",
  "San Francisco": "United States",
  "Columbus": "United States",
  "Fort Worth": "United States",
  "Charlotte": "United States",
  "Seattle": "United States",
  "Denver": "United States",
  "Washington": "United States",
  "Boston": "United States",
  "El Paso": "United States",
  "Detroit": "United States",
  "Nashville": "United States",
  "Portland": "United States",
  "Oklahoma City": "United States",
  "Las Vegas": "United States",
  "Memphis": "United States",
  "Louisville": "United States",
  "Baltimore": "United States",
  "Milwaukee": "United States",
  // Add more mappings as needed
}

// Extract unique cities from candidates (employee locations)
const extractUniqueEmployeeCities = (): string[] => {
  const cities = new Set<string>()
  sampleCandidates.forEach(candidate => {
    if (candidate.city) {
      cities.add(candidate.city)
    }
  })
  return Array.from(cities).sort()
}

// Extract unique countries from candidates using city-to-country mapping
const extractUniqueEmployeeCountries = (): string[] => {
  const countries = new Set<string>()
  sampleCandidates.forEach(candidate => {
    if (candidate.city && CITY_TO_COUNTRY_MAP[candidate.city]) {
      countries.add(CITY_TO_COUNTRY_MAP[candidate.city])
    }
  })
  return Array.from(countries).sort()
}

// Extract unique tech stacks from employers (from employer data or candidates)
const extractUniqueEmployerTechStacks = (): string[] => {
  const techStacksMap = new Map<string, string>() // Map<lowercase, original>
  
  // From employer tech stacks
  sampleEmployers.forEach(employer => {
    if (employer.techStacks) {
      employer.techStacks.forEach(tech => {
        const lowerTech = tech.toLowerCase().trim()
        if (lowerTech && !techStacksMap.has(lowerTech)) {
          techStacksMap.set(lowerTech, tech.trim())
        }
      })
    }
  })
  
  // From candidates' work experiences
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.techStacks.forEach(tech => {
        const lowerTech = tech.toLowerCase().trim()
        if (lowerTech && !techStacksMap.has(lowerTech)) {
          techStacksMap.set(lowerTech, tech.trim())
        }
      })
    })
  })
  
  return Array.from(techStacksMap.values()).sort()
}

// Extract unique benefits from candidates' work experiences
const extractUniqueBenefits = (): string[] => {
  const benefitsMap = new Map<string, string>() // Map<lowercase, original>
  
  // Extract from employers' explicit benefits
  sampleEmployers.forEach(employer => {
    if (employer.benefits && employer.benefits.length > 0) {
      employer.benefits.forEach(benefit => {
        const lowerBenefit = benefit.name.toLowerCase().trim()
        if (lowerBenefit && !benefitsMap.has(lowerBenefit)) {
          benefitsMap.set(lowerBenefit, benefit.name.trim())
        }
      })
    }
  })
  
  // Also extract from candidates' work experiences
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.benefits.forEach(benefit => {
        const lowerBenefit = benefit.name.toLowerCase().trim()
        if (lowerBenefit && !benefitsMap.has(lowerBenefit)) {
          benefitsMap.set(lowerBenefit, benefit.name.trim())
        }
      })
    })
  })
  
  return Array.from(benefitsMap.values()).sort()
}

// Extract unique shift types from candidates' work experiences
const extractUniqueShiftTypes = (): string[] => {
  const shiftTypesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (we.shiftType && we.shiftType.trim()) {
        shiftTypesSet.add(we.shiftType.trim())
      }
    })
  })
  
  return Array.from(shiftTypesSet).sort()
}

// Extract unique work modes from candidates' work experiences
const extractUniqueWorkModes = (): string[] => {
  const workModesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (we.workMode && we.workMode.trim()) {
        workModesSet.add(we.workMode.trim())
      }
    })
  })
  
  return Array.from(workModesSet).sort()
}

// Extract unique time support zones from candidates' work experiences
const extractUniqueTimeSupportZones = (): string[] => {
  const timeZonesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.timeSupportZones?.forEach(zone => {
        if (zone && zone.trim()) {
          timeZonesSet.add(zone.trim())
        }
      })
    })
  })
  
  return Array.from(timeZonesSet).sort()
}

// Extract unique project-based data for employers
const extractUniqueTechStacks = (): string[] => {
  const techStacks = new Set<string>()
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  return Array.from(techStacks).sort()
}

// Extract unique roles from candidates' organizational roles
const extractUniqueRoles = (): string[] => {
  const roles = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.organizationalRoles?.forEach(orgRole => {
      if (orgRole.role && orgRole.role.trim()) {
        roles.add(orgRole.role.trim())
      }
    })
  })
  return Array.from(roles).sort()
}

const roleOptions: MultiSelectOption[] = extractUniqueRoles().map(role => ({
  value: role,
  label: role
}))

const extractUniqueVerticalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.verticalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

const extractUniqueHorizontalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.horizontalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

const extractUniqueTechnicalAspects = (): string[] => {
  const aspects = new Set<string>()
  sampleProjects.forEach(project => {
    project.technicalAspects.forEach(aspect => aspects.add(aspect))
  })
  return Array.from(aspects).sort()
}

// Extract unique client locations from projects
const extractUniqueClientLocations = (): string[] => {
  const locations = new Set<string>()
  sampleProjects.forEach(project => {
    if (project.clientLocation) {
      locations.add(project.clientLocation)
    }
  })
  return Array.from(locations).sort()
}

const extractUniqueProjectStatuses = (): ProjectStatus[] => {
  const statuses = new Set<ProjectStatus>()
  sampleProjects.forEach(project => {
    statuses.add(project.status)
  })
  return Array.from(statuses).sort()
}

// Mock data for filter options
const statusOptions: MultiSelectOption[] = Object.entries(EMPLOYER_STATUS_LABELS).map(([value, label]) => ({
  value: value as EmployerStatus,
  label
}))

const salaryPolicyOptions: MultiSelectOption[] = Object.entries(SALARY_POLICY_LABELS).map(([value, label]) => ({
  value: value as SalaryPolicy,
  label
}))

const rankingOptions: MultiSelectOption[] = Object.entries(EMPLOYER_RANKING_LABELS).map(([value, label]) => ({
  value: value as EmployerRanking,
  label
}))

// Extract unique tags from employers
const extractUniqueTags = (): string[] => {
  const tags = new Set<string>()
  sampleEmployers.forEach(employer => {
    employer.tags?.forEach(tag => {
      if (tag && tag.trim()) {
        tags.add(tag.trim())
      }
    })
  })
  return Array.from(tags).sort()
}

const tagOptions: MultiSelectOption[] = extractUniqueTags().map(tag => ({
  value: tag,
  label: tag
}))

const countryOptions: MultiSelectOption[] = extractUniqueCountries().map(country => ({
  value: country,
  label: country
}))

const cityOptions: MultiSelectOption[] = extractUniqueCities().map(city => ({
  value: city,
  label: city
}))

const foundedYearOptions: MultiSelectOption[] = extractUniqueFoundedYears().map(year => ({
  value: year.toString(),
  label: year.toString()
}))

// Employee location filter options
const employeeCityOptions: MultiSelectOption[] = extractUniqueEmployeeCities().map(city => ({
  value: city,
  label: city
}))

const employeeCountryOptions: MultiSelectOption[] = extractUniqueEmployeeCountries().map(country => ({
  value: country,
  label: country
}))

// Employer-based filter options
const employerTechStackOptions: MultiSelectOption[] = extractUniqueEmployerTechStacks().map(tech => ({
  value: tech,
  label: tech
}))

const benefitOptions: MultiSelectOption[] = extractUniqueBenefits().map(benefit => ({
  value: benefit,
  label: benefit
}))

const shiftTypeOptions: MultiSelectOption[] = extractUniqueShiftTypes().map(shiftType => ({
  value: shiftType,
  label: shiftType
}))

const workModeOptions: MultiSelectOption[] = extractUniqueWorkModes().map(workMode => ({
  value: workMode,
  label: workMode
}))

const timeSupportZoneOptions: MultiSelectOption[] = extractUniqueTimeSupportZones().map(timeZone => ({
  value: timeZone,
  label: timeZone
}))

// Project-based filter options
const techStackOptions: MultiSelectOption[] = extractUniqueTechStacks().map(tech => ({
  value: tech,
  label: tech
}))

const verticalDomainOptions: MultiSelectOption[] = extractUniqueVerticalDomains().map(domain => ({
  value: domain,
  label: domain
}))

const horizontalDomainOptions: MultiSelectOption[] = extractUniqueHorizontalDomains().map(domain => ({
  value: domain,
  label: domain
}))

const technicalAspectOptions: MultiSelectOption[] = extractUniqueTechnicalAspects().map(aspect => ({
  value: aspect,
  label: aspect
}))

const clientLocationOptions: MultiSelectOption[] = extractUniqueClientLocations().map(location => ({
  value: location,
  label: location
}))

const projectStatusOptions: MultiSelectOption[] = extractUniqueProjectStatuses().map(status => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status]
}))

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
  employeeCities: [],
  employeeCountries: [],
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

export function EmployersFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
}: EmployersFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<EmployerFilters>(filters)

  // Calculate active filter count
  const activeFilterCount = 
    filters.status.length +
    filters.foundedYears.length +
    filters.countries.length +
    filters.cities.length +
    filters.employerTypes.length +
    filters.salaryPolicies.length +
    (filters.sizeMin ? 1 : 0) +
    (filters.sizeMax ? 1 : 0) +
    (filters.minLocationsCount ? 1 : 0) +
    (filters.minCitiesCount ? 1 : 0) +
    filters.employerTechStacks.length +
    filters.benefits.length +
    filters.shiftTypes.length +
    (filters.shiftTypesStrict ? 1 : 0) +
    filters.workModes.length +
    (filters.workModesStrict ? 1 : 0) +
    filters.timeSupportZones.length +
    filters.rankings.length +
    filters.tags.length +
    (filters.techStackMinCount ? 1 : 0) +
    (filters.minApplicants ? 1 : 0) +
    (filters.employeesWithOrganizationalRole?.organizationName ? 1 : 0) +
    filters.employeeCities.length +
    filters.employeeCountries.length +
    filters.techStacks.length +
    ((filters.projectTechStackMinYears?.techStacks.length || 0) > 0 && filters.projectTechStackMinYears?.minYears ? 1 : 0) +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalAspects.length +
    filters.clientLocations.length +
    filters.projectStatus.length +
    (filters.projectTeamSizeMin ? 1 : 0) +
    (filters.projectTeamSizeMax ? 1 : 0) +
    (filters.hasPublishedProject !== null ? 1 : 0) +
    filters.publishPlatforms.length +
    (filters.minDownloadCount ? 1 : 0)

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof EmployerFilters, value: string[] | string | boolean | null | { techStacks: string[], minYears: string } | { organizationName: string, roles?: string[] }) => {
    setTempFilters(prev => {
      const updated = { ...prev, [field]: value }
      return updated
    })
  }

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters(initialFilters)
    onClearFilters()
    // Keep dialog open for user to see cleared state
  }

  const handleCancel = () => {
    setTempFilters(filters) // Reset to current filters
    setOpen(false)
  }

  const hasAnyTempFilters = 
    tempFilters.status.length > 0 ||
    tempFilters.foundedYears.length > 0 ||
    tempFilters.countries.length > 0 ||
    tempFilters.cities.length > 0 ||
    tempFilters.employerTypes.length > 0 ||
    tempFilters.salaryPolicies.length > 0 ||
    tempFilters.sizeMin ||
    tempFilters.sizeMax ||
    tempFilters.minLocationsCount ||
    tempFilters.minCitiesCount ||
    tempFilters.employerTechStacks.length > 0 ||
    tempFilters.benefits.length > 0 ||
    tempFilters.shiftTypes.length > 0 ||
    tempFilters.shiftTypesStrict ||
    tempFilters.workModes.length > 0 ||
    tempFilters.workModesStrict ||
    tempFilters.timeSupportZones.length > 0 ||
    tempFilters.rankings.length > 0 ||
    tempFilters.tags.length > 0 ||
    tempFilters.techStackMinCount ||
    tempFilters.minApplicants ||
    (tempFilters.employeesWithOrganizationalRole?.organizationName) ||
    tempFilters.employeeCities.length > 0 ||
    tempFilters.employeeCountries.length > 0 ||
    tempFilters.techStacks.length > 0 ||
    (tempFilters.projectTechStackMinYears && tempFilters.projectTechStackMinYears.techStacks.length > 0 && tempFilters.projectTechStackMinYears.minYears) ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.clientLocations.length > 0 ||
    tempFilters.projectStatus.length > 0 ||
    tempFilters.projectTeamSizeMin ||
    tempFilters.projectTeamSizeMax ||
    tempFilters.hasPublishedProject !== null ||
    tempFilters.publishPlatforms.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 min-w-[1.25rem] h-5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Employers
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={statusOptions}
                  selected={tempFilters.status}
                  onChange={(values) => handleFilterChange("status", values)}
                  placeholder="Filter by status..."
                  label="Company Status"
                  maxDisplay={3}
                />

                <MultiSelect
                  items={foundedYearOptions}
                  selected={tempFilters.foundedYears}
                  onChange={(values) => handleFilterChange("foundedYears", values)}
                  placeholder="Filter by founded year..."
                  label="Founded Year"
                  searchPlaceholder="Search years..."
                  maxDisplay={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="sizeMin" className="text-sm font-semibold">
                    Minimum Employees
                  </Label>
                  <Input
                    id="sizeMin"
                    type="number"
                    placeholder="0"
                    min="0"
                    value={tempFilters.sizeMin}
                    onChange={(e) => handleFilterChange("sizeMin", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sizeMax" className="text-sm font-semibold">
                    Maximum Employees
                  </Label>
                  <Input
                    id="sizeMax"
                    type="number"
                    placeholder="1000"
                    min="0"
                    value={tempFilters.sizeMax}
                    onChange={(e) => handleFilterChange("sizeMax", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLocationsCount" className="text-sm font-semibold">
                    Minimum Offices
                  </Label>
                  <Input
                    id="minLocationsCount"
                    type="number"
                    placeholder="e.g., 2"
                    min="1"
                    value={tempFilters.minLocationsCount}
                    onChange={(e) => handleFilterChange("minLocationsCount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minCitiesCount" className="text-sm font-semibold">
                    Minimum Cities
                  </Label>
                  <Input
                    id="minCitiesCount"
                    type="number"
                    placeholder="e.g., 2"
                    min="1"
                    value={tempFilters.minCitiesCount}
                    onChange={(e) => handleFilterChange("minCitiesCount", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minApplicants" className="text-sm font-semibold">
                  Minimum Applicants
                </Label>
                <Input
                  id="minApplicants"
                  type="number"
                  placeholder="e.g., 50"
                  min="1"
                  value={tempFilters.minApplicants}
                  onChange={(e) => handleFilterChange("minApplicants", e.target.value)}
                />
                {tempFilters.minApplicants && (
                  <p className="text-xs text-muted-foreground">
                    Filters employers with at least {tempFilters.minApplicants} applicants (candidates with work experience at this employer).
                  </p>
                )}
              </div>

              {/* Employee Locations Filter */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">Employee Locations</Label>
                <p className="text-xs text-muted-foreground">
                  Filter employers based on where their employees/candidates are located
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MultiSelect
                    items={employeeCityOptions}
                    selected={tempFilters.employeeCities}
                    onChange={(values) => handleFilterChange("employeeCities", values)}
                    placeholder="Filter by employee cities..."
                    label="Employee Cities"
                    searchPlaceholder="Search cities..."
                    maxDisplay={3}
                  />
                  
                  <MultiSelect
                    items={employeeCountryOptions}
                    selected={tempFilters.employeeCountries}
                    onChange={(values) => handleFilterChange("employeeCountries", values)}
                    placeholder="Filter by employee countries..."
                    label="Employee Countries"
                    searchPlaceholder="Search countries..."
                    maxDisplay={3}
                  />
                </div>
                
                {(tempFilters.employeeCities.length > 0 || tempFilters.employeeCountries.length > 0) && (
                  <p className="text-xs text-muted-foreground">
                    Filters employers with at least one employee/candidate from the selected {tempFilters.employeeCities.length > 0 && "cities"}{tempFilters.employeeCities.length > 0 && tempFilters.employeeCountries.length > 0 && " or "}{tempFilters.employeeCountries.length > 0 && "countries"}
                  </p>
                )}
              </div>

              {/* Employees with Organizational Role Filter */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">Employees with Organizational Role</Label>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="orgRoleOrganization" className="text-xs text-muted-foreground">
                      Organization Name
                    </Label>
                    <Input
                      id="orgRoleOrganization"
                      type="text"
                      placeholder="e.g., PASHA"
                      value={tempFilters.employeesWithOrganizationalRole?.organizationName || ""}
                      onChange={(e) => {
                        handleFilterChange("employeesWithOrganizationalRole", {
                          organizationName: e.target.value,
                          roles: tempFilters.employeesWithOrganizationalRole?.roles || []
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="orgRoleRoles" className="text-xs text-muted-foreground">
                      Roles (Optional)
                    </Label>
                    <MultiSelect
                      items={roleOptions}
                      selected={tempFilters.employeesWithOrganizationalRole?.roles || []}
                      onChange={(values) => {
                        handleFilterChange("employeesWithOrganizationalRole", {
                          organizationName: tempFilters.employeesWithOrganizationalRole?.organizationName || "",
                          roles: values
                        })
                      }}
                      placeholder="Select roles (optional)..."
                      searchPlaceholder="Search roles..."
                      maxDisplay={3}
                    />
                  </div>
                </div>
                {tempFilters.employeesWithOrganizationalRole?.organizationName && (
                  <p className="text-xs text-muted-foreground">
                    Filters employers with employees who have organizational roles at {tempFilters.employeesWithOrganizationalRole.organizationName}
                    {tempFilters.employeesWithOrganizationalRole.roles && tempFilters.employeesWithOrganizationalRole.roles.length > 0 && ` (roles: ${tempFilters.employeesWithOrganizationalRole.roles.join(", ")})`}.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={countryOptions}
                  selected={tempFilters.countries}
                  onChange={(values) => handleFilterChange("countries", values)}
                  placeholder="Filter by country..."
                  label="Countries"
                  searchPlaceholder="Search countries..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={cityOptions}
                  selected={tempFilters.cities}
                  onChange={(values) => handleFilterChange("cities", values)}
                  placeholder="Filter by city..."
                  label="Cities"
                  searchPlaceholder="Search cities..."
                  maxDisplay={3}
                />
              </div>

              <MultiSelect
                items={Object.values(EMPLOYER_TYPE_LABELS).map(type => ({ value: type, label: type }))}
                selected={tempFilters.employerTypes}
                onChange={(values) => handleFilterChange("employerTypes", values)}
                placeholder="Filter by employer type..."
                label="Employer Type"
                searchPlaceholder="Search types..."
                maxDisplay={3}
              />

              <MultiSelect
                items={salaryPolicyOptions}
                selected={tempFilters.salaryPolicies}
                onChange={(values) => handleFilterChange("salaryPolicies", values)}
                placeholder="Filter by salary policy..."
                label="Salary Policies"
                maxDisplay={3}
              />
            </div>

            {/* Employer-Based Filters */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Employer Characteristics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <MultiSelect
                      items={employerTechStackOptions}
                      selected={tempFilters.employerTechStacks}
                      onChange={(values) => handleFilterChange("employerTechStacks", values)}
                      placeholder="Filter by tech stacks..."
                      label="Tech Stacks"
                      searchPlaceholder="Search tech stacks..."
                      maxDisplay={3}
                    />
                    
                    {/* Minimum Developer Count Input */}
                    <div className="space-y-1">
                      <Label htmlFor="techStackMinCount" className="text-xs text-muted-foreground">
                        Minimum Developer Count (optional)
                      </Label>
                      <Input
                        id="techStackMinCount"
                        type="number"
                        placeholder="e.g., 15"
                        value={tempFilters.techStackMinCount}
                        onChange={(e) => handleFilterChange("techStackMinCount", e.target.value)}
                        min="1"
                        disabled={tempFilters.employerTechStacks.length === 0}
                      />
                      {tempFilters.techStackMinCount && (
                        <p className="text-xs text-muted-foreground">
                          {tempFilters.employerTechStacks.length === 0 
                            ? "Select tech stacks first"
                            : `Filters employers with at least ${tempFilters.techStackMinCount} developers${tempFilters.shiftTypes.length > 0 ? ` working in ${tempFilters.shiftTypes.join(", ")}` : ""} with selected tech stacks`}
                        </p>
                      )}
                    </div>
                  </div>

                  <MultiSelect
                    items={benefitOptions}
                    selected={tempFilters.benefits}
                    onChange={(values) => handleFilterChange("benefits", values)}
                    placeholder="Filter by benefits..."
                    label="Benefits"
                    searchPlaceholder="Search benefits..."
                    maxDisplay={3}
                  />

                  <div className="space-y-2">
                    <MultiSelect
                      items={shiftTypeOptions}
                      selected={tempFilters.shiftTypes}
                      onChange={(values) => handleFilterChange("shiftTypes", values)}
                      placeholder="Filter by shift type..."
                      label="Shift Type"
                      searchPlaceholder="Search shift types..."
                      maxDisplay={3}
                    />
                    
                    {tempFilters.shiftTypes.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="shiftTypesStrict"
                          checked={tempFilters.shiftTypesStrict}
                          onCheckedChange={(checked) => {
                            handleFilterChange("shiftTypesStrict", checked === true)
                          }}
                        />
                        <Label
                          htmlFor="shiftTypesStrict"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Strictly (all employees must work in selected shift type(s) only)
                        </Label>
                      </div>
                    )}
                    
                    {tempFilters.shiftTypesStrict && tempFilters.shiftTypes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Only employers where ALL employees work in {tempFilters.shiftTypes.join(", ")}. Employers with any other shift types will be excluded.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <MultiSelect
                      items={workModeOptions}
                      selected={tempFilters.workModes}
                      onChange={(values) => handleFilterChange("workModes", values)}
                      placeholder="Filter by work mode..."
                      label="Work Mode"
                      searchPlaceholder="Search work modes..."
                      maxDisplay={3}
                    />
                    
                    {tempFilters.workModes.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="workModesStrict"
                          checked={tempFilters.workModesStrict}
                          onCheckedChange={(checked) => {
                            handleFilterChange("workModesStrict", checked === true)
                          }}
                        />
                        <Label
                          htmlFor="workModesStrict"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Strictly (all employees must work in selected mode(s) only)
                        </Label>
                      </div>
                    )}
                    
                    {tempFilters.workModesStrict && tempFilters.workModes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Only employers where ALL employees work in {tempFilters.workModes.join(", ")}. Employers with any other work modes will be excluded.
                      </p>
                    )}
                  </div>

                  <MultiSelect
                    items={timeSupportZoneOptions}
                    selected={tempFilters.timeSupportZones}
                    onChange={(values) => handleFilterChange("timeSupportZones", values)}
                    placeholder="Filter by time zone..."
                    label="Time Support Zones"
                    searchPlaceholder="Search time zones..."
                    maxDisplay={5}
                  />

                  <MultiSelect
                    items={rankingOptions}
                    selected={tempFilters.rankings}
                    onChange={(values) => handleFilterChange("rankings", values)}
                    placeholder="Filter by ranking..."
                    label="Company Ranking"
                    maxDisplay={3}
                  />

                  <MultiSelect
                    items={tagOptions}
                    selected={tempFilters.tags}
                    onChange={(values) => handleFilterChange("tags", values)}
                    placeholder="Filter by tags..."
                    label="Tags"
                    searchPlaceholder="Search tags..."
                    maxDisplay={3}
                  />
                </div>

              </div>
            </div>

            {/* Project-Based Filters */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Project Expertise</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MultiSelect
                    items={techStackOptions}
                    selected={tempFilters.techStacks}
                    onChange={(values) => handleFilterChange("techStacks", values)}
                    placeholder="Filter by technology..."
                    label="Technology Stack"
                    searchPlaceholder="Search technologies..."
                    maxDisplay={3}
                  />

                  <MultiSelect
                    items={technicalAspectOptions}
                    selected={tempFilters.technicalAspects}
                    onChange={(values) => handleFilterChange("technicalAspects", values)}
                    placeholder="Filter by technical aspects..."
                    label="Technical Aspects"
                    searchPlaceholder="Search aspects..."
                    maxDisplay={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <MultiSelect
                    items={clientLocationOptions}
                    selected={tempFilters.clientLocations}
                    onChange={(values) => handleFilterChange("clientLocations", values)}
                    placeholder="Filter by client location..."
                    label="Client Location"
                    searchPlaceholder="Search locations..."
                    maxDisplay={3}
                  />
                </div>

                {/* Project Tech Stack Minimum Years Filter */}
                <div className="space-y-2 mt-4">
                  <Label className="text-sm font-semibold">Project Tech Stack Experience (Years)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Column 1: Tech Stacks MultiSelect */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Technologies</Label>
                      <MultiSelect
                        items={techStackOptions}
                        selected={tempFilters.projectTechStackMinYears?.techStacks || []}
                        onChange={(values) => {
                          handleFilterChange("projectTechStackMinYears", {
                            techStacks: values,
                            minYears: tempFilters.projectTechStackMinYears?.minYears || ""
                          })
                        }}
                        placeholder="Select technologies..."
                        searchPlaceholder="Search technologies..."
                        maxDisplay={3}
                      />
                    </div>
                    
                    {/* Column 2: Years Input */}
                    <div className="space-y-1">
                      <Label htmlFor="projectTechStackMinYears" className="text-xs text-muted-foreground">
                        Minimum Years
                      </Label>
                      <Input
                        id="projectTechStackMinYears"
                        type="number"
                        placeholder="e.g., 3"
                        value={tempFilters.projectTechStackMinYears?.minYears || ""}
                        onChange={(e) => {
                          handleFilterChange("projectTechStackMinYears", {
                            techStacks: tempFilters.projectTechStackMinYears?.techStacks || [],
                            minYears: e.target.value
                          })
                        }}
                        min="0"
                        step="0.1"
                        disabled={!tempFilters.projectTechStackMinYears?.techStacks || tempFilters.projectTechStackMinYears.techStacks.length === 0}
                      />
                    </div>
                  </div>
                  
                  {tempFilters.projectTechStackMinYears && tempFilters.projectTechStackMinYears.techStacks.length > 0 && tempFilters.projectTechStackMinYears.minYears && (
                    <p className="text-xs text-muted-foreground">
                      Employers must have {tempFilters.projectTechStackMinYears.techStacks.length > 1 ? 'all' : ''} selected technology{tempFilters.projectTechStackMinYears.techStacks.length > 1 ? 's' : ''} in projects with at least {tempFilters.projectTechStackMinYears.minYears} years of cumulative experience (overlapping periods are merged).
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <MultiSelect
                    items={verticalDomainOptions}
                    selected={tempFilters.verticalDomains}
                    onChange={(values) => handleFilterChange("verticalDomains", values)}
                    placeholder="Filter by industry..."
                    label="Vertical Domains"
                    searchPlaceholder="Search industries..."
                    maxDisplay={3}
                  />

                  <MultiSelect
                    items={horizontalDomainOptions}
                    selected={tempFilters.horizontalDomains}
                    onChange={(values) => handleFilterChange("horizontalDomains", values)}
                    placeholder="Filter by solution type..."
                    label="Horizontal Domains"
                    searchPlaceholder="Search solutions..."
                    maxDisplay={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <MultiSelect
                    items={projectStatusOptions}
                    selected={tempFilters.projectStatus}
                    onChange={(values) => handleFilterChange("projectStatus", values)}
                    placeholder="Filter by project status..."
                    label="Project Status"
                    maxDisplay={3}
                  />
                </div>

                {/* Project Team Size Range Filter */}
                <div className="space-y-3 mt-4">
                  <Label className="text-sm font-semibold">Project Team Size</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectTeamSizeMin" className="text-xs text-muted-foreground">
                        Minimum Team Size
                      </Label>
                      <Input
                        id="projectTeamSizeMin"
                        type="number"
                        placeholder="e.g., 10"
                        value={tempFilters.projectTeamSizeMin}
                        onChange={(e) => handleFilterChange("projectTeamSizeMin", e.target.value)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectTeamSizeMax" className="text-xs text-muted-foreground">
                        Maximum Team Size (optional)
                      </Label>
                      <Input
                        id="projectTeamSizeMax"
                        type="number"
                        placeholder="e.g., 50"
                        value={tempFilters.projectTeamSizeMax}
                        onChange={(e) => handleFilterChange("projectTeamSizeMax", e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Filter employers by the team size of their projects. Projects can have single numbers (e.g., &quot;5&quot;) or ranges (e.g., &quot;20-30&quot;).
                  </p>
                </div>

                {/* Published App Filter */}
                <div className="space-y-3 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasPublishedProject"
                      checked={tempFilters.hasPublishedProject === true}
                      onCheckedChange={(checked) => {
                        handleFilterChange("hasPublishedProject", checked ? true : null)
                      }}
                    />
                    <Label htmlFor="hasPublishedProject" className="text-sm cursor-pointer">
                      Published App
                    </Label>
                  </div>
                </div>

                {/* Publish Platforms Filter */}
                <div className="space-y-2 mt-4">
                  <MultiSelect
                    items={[
                      { value: "App Store", label: "App Store" },
                      { value: "Play Store", label: "Play Store" },
                      { value: "Web", label: "Web" },
                      { value: "Desktop", label: "Desktop" }
                    ]}
                    selected={tempFilters.publishPlatforms}
                    onChange={(values) => handleFilterChange("publishPlatforms", values)}
                    placeholder="Select platforms"
                    label="Publish Platforms"
                    searchPlaceholder="Search platforms..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {tempFilters.publishPlatforms.length === 0 
                      ? "Select platforms to filter by specific app stores (e.g., App Store, Play Store). Leave empty to match any platform."
                      : "Filtering for employers with projects published on selected platforms. Combine with 'Published App' checkbox for published projects only."}
                  </p>
                </div>

                {/* Download Count Filter */}
                <div className="space-y-3 mt-4">
                  <Label htmlFor="minDownloadCount" className="text-sm font-semibold">
                    Minimum Download Count
                  </Label>
                  <Input
                    id="minDownloadCount"
                    type="number"
                    placeholder="e.g., 100000 (for 100K+)"
                    min="0"
                    value={tempFilters.minDownloadCount}
                    onChange={(e) => handleFilterChange("minDownloadCount", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Filter employers with at least one project/app with this many downloads
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            
            {hasAnyTempFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear All
              </Button>
            )}
            
            <Button 
              onClick={handleApplyFilters}
              className="ml-auto transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
