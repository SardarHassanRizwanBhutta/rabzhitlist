"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { Filter, CalendarIcon } from "lucide-react"
import {
  EmployerStatus,
  SalaryPolicy,
  EmployerRanking,
  EmployerType,
  EMPLOYER_STATUS_LABELS,
  SALARY_POLICY_LABELS,
  EMPLOYER_RANKING_LABELS,
  EMPLOYER_TYPE_LABELS,
  WORK_MODE_DB_LABELS,
  SHIFT_TYPE_DB_LABELS,
  type WorkModeDb,
  type ShiftTypeDb,
} from "@/lib/types/employer"
import { ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/types/project"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { VERTICAL_DOMAINS, HORIZONTAL_DOMAINS } from "@/lib/services/projects-api"

// Filter interfaces
export interface EmployerFilters {
  /** Free-text filter on company name (trimmed when sent to the API). */
  employerName: string
  status: EmployerStatus[]
  /** Founded year filter (4-digit year string; empty = no filter). */
  foundedYear: string
  countries: string[]
  /** Office location city (free text; trimmed when sent to the API). */
  city: string
  employerTypes: EmployerType[]  // Filter by employer type (Services Based, Product Based, SAAS, Startup, Integrator, Resource Augmentation)
  salaryPolicies: SalaryPolicy[]
  sizeMin: string
  sizeMax: string
  minLocationsCount: string  // Minimum total number of offices/locations
  minCitiesCount: string  // Minimum number of unique cities (optionally within selected country)
  minApplicants: string  // Minimum number of applicants/employees (candidates with work experience at this employer)
  // Employee location filters - filter employers by where their employees/candidates are located
  /** Employee/candidate residence city (free text; trimmed when sent to the API). */
  employeeCity: string
  // Employer-based filters
  benefits: string[]
  shiftTypes: string[]
  workModes: string[]
  timeSupportZones: string[]
  rankings: EmployerRanking[]  // Employer ranking filter
  tags: string[]  // Filter by tags like "Enterprise", "Startup" (DPL Competitive is now a separate boolean field)
  isDPLCompetitive: boolean | null  // null = no filter, true = is DPL Competitive, false = is not DPL Competitive

  // Project-based filters
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalDomains: string[]
  clientLocations: string[]  // Filter by client's location in projects (e.g., "San Francisco", "Silicon Valley", "United States")
  projectStatus: string[]
  projectTeamSizeMin: string  // Minimum project team size
  projectTeamSizeMax: string  // Maximum project team size (optional)
  // Published App filters
  hasPublishedProject: boolean | null  // null = no filter, true = has published app/project
  publishPlatforms: string[]  // ["App Store", "Play Store", "Web", "Desktop"] - filter by specific platforms
  minDownloadCount: string  // Minimum download count (e.g., "100000" for 100K+) - filter employers by their projects' download count
  // Layoff filters
  layoffDateStart: Date | null  // Start date for layoff date range (null = no filter)
  layoffDateEnd: Date | null    // End date for layoff date range (null = up to today or no filter)
  minLayoffEmployees: string    // Minimum number of employees laid off (e.g., "20") - empty string means no filter

  // Average Job Tenure filters (in years)
  avgJobTenureMin: string  // Minimum average job tenure (e.g., "2" for 2+ years)
  avgJobTenureMax: string  // Maximum average job tenure (optional)
}

export interface EmployerFilterLookupOptions {
  technicalDomains: MultiSelectOption[]
  /** Time support zone names from the lookups API (preferred over sample data). */
  timeSupportZones?: MultiSelectOption[]
  /** Tag names from the tags API (preferred over sample employers). */
  tags?: MultiSelectOption[]
  /** Client location names from GET /api/clientlocations (preferred over sample projects). */
  clientLocations?: MultiSelectOption[]
  /** Country names from GET countries API (preferred over sample employers). */
  countries?: MultiSelectOption[]
}

interface EmployersFilterDialogProps {
  children?: React.ReactNode
  filters: EmployerFilters
  onFiltersChange: (filters: EmployerFilters) => void
  onClearFilters: () => void
  /** Technical domain dropdown options from GET /api/TechnicalDomains. */
  lookupOptions?: EmployerFilterLookupOptions
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

// Employer-based filter options
const benefitOptions: MultiSelectOption[] = extractUniqueBenefits().map(benefit => ({
  value: benefit,
  label: benefit
}))

/** Filter values are DB enum keys (employers.work_mode / employers.shift_type). */
const shiftTypeDbOptions: MultiSelectOption[] = (
  Object.entries(SHIFT_TYPE_DB_LABELS) as [ShiftTypeDb, string][]
).map(([value, label]) => ({ value, label }))

const workModeDbOptions: MultiSelectOption[] = (
  Object.entries(WORK_MODE_DB_LABELS) as [WorkModeDb, string][]
).map(([value, label]) => ({ value, label }))

// Project-based filter options
const verticalDomainOptions: MultiSelectOption[] = VERTICAL_DOMAINS.map((d) => ({
  value: d.label,
  label: d.label,
}))

const horizontalDomainOptions: MultiSelectOption[] = HORIZONTAL_DOMAINS.map((d) => ({
  value: d.label,
  label: d.label,
}))

const projectStatusFilterOptions: MultiSelectOption[] = (
  Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]
).map(([value, label]) => ({ value, label }))

const initialFilters: EmployerFilters = {
  employerName: "",
  status: [],
  foundedYear: "",
  countries: [],
  city: "",
  employerTypes: [],
  salaryPolicies: [],
  sizeMin: "",
  sizeMax: "",
  minLocationsCount: "",
  minCitiesCount: "",
  minApplicants: "",
  employeeCity: "",
  // Employer-based filters
  benefits: [],
  shiftTypes: [],
  workModes: [],
  timeSupportZones: [],
  rankings: [],
  tags: [],
  isDPLCompetitive: null,
  // Project-based filters
  verticalDomains: [],
  horizontalDomains: [],
  technicalDomains: [],
  clientLocations: [],
  projectStatus: [],
  projectTeamSizeMin: "",
  projectTeamSizeMax: "",
  // Published App filters
  hasPublishedProject: null,
  publishPlatforms: [],
  minDownloadCount: "",
  // Layoff filters
  layoffDateStart: null,
  layoffDateEnd: null,
  minLayoffEmployees: "",
  // Average Job Tenure filters
  avgJobTenureMin: "",
  avgJobTenureMax: "",
}

export function EmployersFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
  lookupOptions,
}: EmployersFilterDialogProps) {
  const technicalDomainOptions: MultiSelectOption[] = lookupOptions?.technicalDomains ?? []
  const timeSupportZoneSelectItems = useMemo(() => {
    if (lookupOptions?.timeSupportZones?.length) {
      return lookupOptions.timeSupportZones
    }
    return extractUniqueTimeSupportZones().map((zone) => ({
      value: zone,
      label: zone,
    }))
  }, [lookupOptions?.timeSupportZones])

  const tagSelectItems = useMemo(() => {
    if (lookupOptions?.tags?.length) return lookupOptions.tags
    return extractUniqueTags().map((tag) => ({ value: tag, label: tag }))
  }, [lookupOptions?.tags])

  const clientLocationSelectItems = useMemo(() => {
    if (lookupOptions?.clientLocations?.length) return lookupOptions.clientLocations
    return extractUniqueClientLocations().map((location) => ({
      value: location,
      label: location,
    }))
  }, [lookupOptions?.clientLocations])

  const countrySelectItems = useMemo(() => {
    if (lookupOptions?.countries?.length) return lookupOptions.countries
    return extractUniqueCountries().map((country) => ({
      value: country,
      label: country,
    }))
  }, [lookupOptions?.countries])

  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<EmployerFilters>(filters)

  // Calculate active filter count
  const activeFilterCount = 
    (filters.employerName.trim() ? 1 : 0) +
    filters.status.length +
    (filters.foundedYear.trim() ? 1 : 0) +
    filters.countries.length +
    (filters.city.trim() ? 1 : 0) +
    filters.employerTypes.length +
    filters.salaryPolicies.length +
    (filters.sizeMin ? 1 : 0) +
    (filters.sizeMax ? 1 : 0) +
    (filters.minLocationsCount ? 1 : 0) +
    (filters.minCitiesCount ? 1 : 0) +
    filters.benefits.length +
    filters.shiftTypes.length +
    filters.workModes.length +
    filters.timeSupportZones.length +
    filters.rankings.length +
    filters.tags.length +
    (filters.minApplicants ? 1 : 0) +
    (filters.isDPLCompetitive !== null ? 1 : 0) +
    (filters.employeeCity.trim() ? 1 : 0) +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalDomains.length +
    filters.clientLocations.length +
    filters.projectStatus.length +
    (filters.projectTeamSizeMin ? 1 : 0) +
    (filters.projectTeamSizeMax ? 1 : 0) +
    (filters.hasPublishedProject !== null ? 1 : 0) +
    filters.publishPlatforms.length +
    (filters.minDownloadCount ? 1 : 0) +
    (filters.layoffDateStart ? 1 : 0) +
    (filters.layoffDateEnd ? 1 : 0) +
    (filters.minLayoffEmployees ? 1 : 0) +
    (filters.avgJobTenureMin ? 1 : 0) +
    (filters.avgJobTenureMax ? 1 : 0)

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof EmployerFilters, value: string[] | string | boolean | null | Date) => {
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
    !!tempFilters.employerName.trim() ||
    tempFilters.status.length > 0 ||
    !!tempFilters.foundedYear.trim() ||
    tempFilters.countries.length > 0 ||
    !!tempFilters.city.trim() ||
    tempFilters.employerTypes.length > 0 ||
    tempFilters.salaryPolicies.length > 0 ||
    tempFilters.sizeMin ||
    tempFilters.sizeMax ||
    tempFilters.minLocationsCount ||
    tempFilters.minCitiesCount ||
    tempFilters.benefits.length > 0 ||
    tempFilters.shiftTypes.length > 0 ||
    tempFilters.workModes.length > 0 ||
    tempFilters.timeSupportZones.length > 0 ||
    tempFilters.rankings.length > 0 ||
    tempFilters.tags.length > 0 ||
    tempFilters.minApplicants ||
    tempFilters.isDPLCompetitive !== null ||
    !!tempFilters.employeeCity.trim() ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalDomains.length > 0 ||
    tempFilters.clientLocations.length > 0 ||
    tempFilters.projectStatus.length > 0 ||
    tempFilters.projectTeamSizeMin ||
    tempFilters.projectTeamSizeMax ||
    tempFilters.hasPublishedProject !== null ||
    tempFilters.publishPlatforms.length > 0 ||
    tempFilters.minDownloadCount ||
    tempFilters.layoffDateStart ||
    tempFilters.layoffDateEnd ||
    tempFilters.minLayoffEmployees ||
    tempFilters.avgJobTenureMin ||
    tempFilters.avgJobTenureMax

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
              <div className="space-y-2">
                <Label htmlFor="employerName" className="text-sm font-semibold">
                  Employer name
                </Label>
                <Input
                  id="employerName"
                  type="search"
                  placeholder="Filter by company name…"
                  value={tempFilters.employerName}
                  onChange={(e) => handleFilterChange("employerName", e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={statusOptions}
                  selected={tempFilters.status}
                  onChange={(values) => handleFilterChange("status", values)}
                  placeholder="Filter by status..."
                  label="Company Status"
                  maxDisplay={3}
                />

                <div className="space-y-2">
                  <Label htmlFor="foundedYear" className="text-sm font-semibold">
                    Founded Year
                  </Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    placeholder="2019"
                    min={1800}
                    max={new Date().getFullYear()}
                    value={tempFilters.foundedYear}
                    onChange={(e) => handleFilterChange("foundedYear", e.target.value)}
                  />
                </div>
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

                <div className="space-y-2">
                  <Label htmlFor="employeeCity" className="text-sm font-semibold">
                    City
                  </Label>
                  <Input
                    id="employeeCity"
                    type="text"
                    placeholder="e.g. Karachi"
                    value={tempFilters.employeeCity}
                    onChange={(e) => handleFilterChange("employeeCity", e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {!!tempFilters.employeeCity.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Filters employers with at least one employee/candidate in the given city (work experience).
                  </p>
                )}
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={countrySelectItems}
                  selected={tempFilters.countries}
                  onChange={(values) => handleFilterChange("countries", values)}
                  placeholder="Filter by country..."
                  label="Country"
                  searchPlaceholder="Search country..."
                  maxDisplay={3}
                />

                <div className="space-y-2">
                  <Label htmlFor="officeCity" className="text-sm font-semibold">
                    City
                  </Label>
                  <Input
                    id="officeCity"
                    type="text"
                    placeholder="e.g. Karachi"
                    value={tempFilters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    autoComplete="off"
                  />
                </div>
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
                  <MultiSelect
                    items={benefitOptions}
                    selected={tempFilters.benefits}
                    onChange={(values) => handleFilterChange("benefits", values)}
                    placeholder="Filter by benefits..."
                    label="Benefits"
                    searchPlaceholder="Search benefits..."
                    maxDisplay={3}
                  />

                  <MultiSelect
                    items={shiftTypeDbOptions}
                    selected={tempFilters.shiftTypes}
                    onChange={(values) => handleFilterChange("shiftTypes", values)}
                    placeholder="Filter by shift type..."
                    label="Shift Type"
                    searchPlaceholder="Search shift types..."
                    maxDisplay={3}
                  />

                  <MultiSelect
                    items={workModeDbOptions}
                    selected={tempFilters.workModes}
                    onChange={(values) => handleFilterChange("workModes", values)}
                    placeholder="Filter by work mode..."
                    label="Work Mode"
                    searchPlaceholder="Search work modes..."
                    maxDisplay={3}
                  />

                  <MultiSelect
                    items={timeSupportZoneSelectItems}
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
                    items={tagSelectItems}
                    selected={tempFilters.tags}
                    onChange={(values) => handleFilterChange("tags", values)}
                    placeholder="Filter by tags..."
                    label="Tags"
                    searchPlaceholder="Search tags..."
                    maxDisplay={3}
                  />
                </div>

                {/* DPL Competitive Filter */}
                <div className="space-y-3 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isDPLCompetitive"
                      checked={tempFilters.isDPLCompetitive === true}
                      onCheckedChange={(checked) => {
                        handleFilterChange("isDPLCompetitive", checked ? true : null)
                      }}
                    />
                    <Label htmlFor="isDPLCompetitive" className="text-sm cursor-pointer">
                      DPL Competitive
                    </Label>
                  </div>
                  {tempFilters.isDPLCompetitive !== null && (
                    <p className="text-xs text-muted-foreground pl-6">
                      {tempFilters.isDPLCompetitive 
                        ? "Showing only DPL Competitive employers"
                        : "Showing only non-DPL Competitive employers"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Project-Based Filters */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Project Expertise</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <MultiSelect
                    items={clientLocationSelectItems}
                    selected={tempFilters.clientLocations}
                    onChange={(values) => handleFilterChange("clientLocations", values)}
                    placeholder="Filter by client location..."
                    label="Client Location"
                    searchPlaceholder="Search locations..."
                    maxDisplay={3}
                  />
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

                <div className="mt-4">
                  <MultiSelect
                    items={technicalDomainOptions}
                    selected={tempFilters.technicalDomains}
                    onChange={(values) => handleFilterChange("technicalDomains", values)}
                    placeholder="Filter by technical domain..."
                    label="Technical Domains"
                    searchPlaceholder="Search technical domains..."
                    maxDisplay={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <MultiSelect
                    items={projectStatusFilterOptions}
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
                </div>

                {/* Layoff Filters */}
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Layoff Date Range
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="layoffDateStart" className="text-xs text-muted-foreground">
                          From Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !tempFilters.layoffDateStart && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {tempFilters.layoffDateStart ? (
                                tempFilters.layoffDateStart.toLocaleDateString()
                              ) : (
                                <span>Select start date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={tempFilters.layoffDateStart || undefined}
                              onSelect={(date) => handleFilterChange("layoffDateStart", date || null)}
                              captionLayout="dropdown"
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="layoffDateEnd" className="text-xs text-muted-foreground">
                          To Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !tempFilters.layoffDateEnd && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {tempFilters.layoffDateEnd ? (
                                tempFilters.layoffDateEnd.toLocaleDateString()
                              ) : (
                                <span>Select end date (optional)</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={tempFilters.layoffDateEnd || undefined}
                              onSelect={(date) => handleFilterChange("layoffDateEnd", date || null)}
                              captionLayout="dropdown"
                              disabled={(date) => {
                                if (tempFilters.layoffDateStart) {
                                  return date < tempFilters.layoffDateStart
                                }
                                return false
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    {(tempFilters.layoffDateStart || tempFilters.layoffDateEnd) && (
                      <p className="text-xs text-muted-foreground">
                        {tempFilters.layoffDateStart && tempFilters.layoffDateEnd
                          ? `Filtering layoffs from ${tempFilters.layoffDateStart.toLocaleDateString()} to ${tempFilters.layoffDateEnd.toLocaleDateString()}`
                          : tempFilters.layoffDateStart
                          ? `Filtering layoffs from ${tempFilters.layoffDateStart.toLocaleDateString()} onwards`
                          : `Filtering layoffs up to ${tempFilters.layoffDateEnd?.toLocaleDateString()}`
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minLayoffEmployees" className="text-sm font-semibold">
                      Minimum Employees Laid Off
                    </Label>
                    <Input
                      id="minLayoffEmployees"
                      type="number"
                      placeholder="e.g., 20"
                      min="1"
                      value={tempFilters.minLayoffEmployees}
                      onChange={(e) => handleFilterChange("minLayoffEmployees", e.target.value)}
                    />
                  </div>
                </div>

                {/* Average Job Tenure Filter */}
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Average Job Tenure
                    </Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="avgJobTenureMin" className="text-xs text-muted-foreground">
                          Minimum Average Tenure
                        </Label>
                        <Input
                          id="avgJobTenureMin"
                          type="number"
                          placeholder="e.g., 2"
                          min="0"
                          step="0.1"
                          value={tempFilters.avgJobTenureMin}
                          onChange={(e) => handleFilterChange("avgJobTenureMin", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avgJobTenureMax" className="text-xs text-muted-foreground">
                          Maximum Average Tenure (optional)
                        </Label>
                        <Input
                          id="avgJobTenureMax"
                          type="number"
                          placeholder="e.g., 5"
                          min="0"
                          step="0.1"
                          value={tempFilters.avgJobTenureMax}
                          onChange={(e) => handleFilterChange("avgJobTenureMax", e.target.value)}
                        />
                      </div>
                    </div>


                    {(tempFilters.avgJobTenureMin || tempFilters.avgJobTenureMax) && (
                      <p className="text-xs text-muted-foreground">
                        Filtering employers with average job tenure
                        {tempFilters.avgJobTenureMin && tempFilters.avgJobTenureMax
                          ? ` between ${tempFilters.avgJobTenureMin} and ${tempFilters.avgJobTenureMax}`
                          : tempFilters.avgJobTenureMin
                          ? ` of at least ${tempFilters.avgJobTenureMin}`
                          : ` of at most ${tempFilters.avgJobTenureMax}`
                        } years
                      </p>
                    )}
                  </div>
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
