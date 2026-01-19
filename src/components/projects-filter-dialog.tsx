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
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, CalendarIcon } from "lucide-react"
import { ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/types/project"
import { EmployerType, EMPLOYER_TYPE_LABELS } from "@/lib/types/employer"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

// Filter interfaces
export interface ProjectFilters {
  status: ProjectStatus[]
  projectTypes: string[]
  employers: string[]
  employerCities: string[]  // Filter by employer's city
  employerCountries: string[]  // Filter by employer's country
  employerTypes: string[]  // Filter by employer type (Services Based, Product Based, SAAS, Startup, Integrator, Resource Augmentation)
  clientLocations: string[]  // Filter by client's location (e.g., "San Francisco", "Silicon Valley", "United States")
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  techStacks: string[]
  // Completion Date Range - filters by endDate only
  completionDateStart: Date | null
  completionDateEnd: Date | null
  // Start & End Date Range - filters projects that started AND completed within range
  startEndDateStart: Date | null
  startEndDateEnd: Date | null
  // Start Date Range - filters by startDate only
  startDateStart: Date | null
  startDateEnd: Date | null
  teamSizeMin: string
  teamSizeMax: string
  projectName: string
  projectLink: string
  isPublished: boolean | null  // null = no filter, true = only published, false = only unpublished
  publishPlatforms: string[]  // ["App Store", "Play Store", "Web", "Desktop"]
  minDownloadCount: string  // Minimum download count (e.g., "100000" for 100K+)
}

interface ProjectsFilterDialogProps {
  children?: React.ReactNode
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  onClearFilters: () => void
}

// Extract unique values from project data
const extractUniqueTechStacks = (): string[] => {
  const techStacks = new Set<string>()
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  return Array.from(techStacks).sort()
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

const extractUniqueTechnicalAspects = (): string[] => {
  const aspects = new Set<string>()
  sampleProjects.forEach(project => {
    project.technicalAspects.forEach(aspect => aspects.add(aspect))
  })
  return Array.from(aspects).sort()
}

const extractUniqueProjectTypes = (): string[] => {
  const types = new Set<string>()
  sampleProjects.forEach(project => {
    types.add(project.projectType)
  })
  return Array.from(types).sort()
}

// Extract unique cities from employers that have projects
const extractUniqueEmployerCities = (): string[] => {
  const cities = new Set<string>()
  const employersWithProjects = new Set<string>()
  
  // First, collect all employer names that have projects
  sampleProjects.forEach(project => {
    if (project.employerName) {
      employersWithProjects.add(project.employerName.trim())
    }
  })
  
  // Then, extract cities from those employers
  sampleEmployers.forEach(employer => {
    if (employersWithProjects.has(employer.name.trim())) {
      employer.locations.forEach(location => {
        if (location.city !== null) {
          cities.add(location.city)
        }
      })
    }
  })
  
  return Array.from(cities).sort()
}

// Extract unique countries from employers that have projects
const extractUniqueEmployerCountries = (): string[] => {
  const countries = new Set<string>()
  const employersWithProjects = new Set<string>()
  
  // First, collect all employer names that have projects
  sampleProjects.forEach(project => {
    if (project.employerName) {
      employersWithProjects.add(project.employerName.trim())
    }
  })
  
  // Then, extract countries from those employers
  sampleEmployers.forEach(employer => {
    if (employersWithProjects.has(employer.name.trim())) {
      employer.locations.forEach(location => {
        if (location.country !== null) {
          countries.add(location.country)
        }
      })
    }
  })
  
  return Array.from(countries).sort()
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

// Filter options
const statusOptions: MultiSelectOption[] = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  value: value as ProjectStatus,
  label
}))

const projectTypeOptions: MultiSelectOption[] = extractUniqueProjectTypes().map(type => ({
  value: type,
  label: type
}))

const employerOptions: MultiSelectOption[] = sampleEmployers.map(employer => ({
  value: employer.id,
  label: employer.name
}))

const employerCityOptions: MultiSelectOption[] = extractUniqueEmployerCities().map(city => ({
  value: city,
  label: city
}))

const employerCountryOptions: MultiSelectOption[] = extractUniqueEmployerCountries().map(country => ({
  value: country,
  label: country
}))

const clientLocationOptions: MultiSelectOption[] = extractUniqueClientLocations().map(location => ({
  value: location,
  label: location
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

const techStackOptions: MultiSelectOption[] = extractUniqueTechStacks().map(tech => ({
  value: tech,
  label: tech
}))

// Publish platform options
const publishPlatformOptions: MultiSelectOption[] = [
  { value: "App Store", label: "App Store (iOS)" },
  { value: "Play Store", label: "Play Store (Android)" },
  { value: "Web", label: "Web" },
  { value: "Desktop", label: "Desktop" },
]

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

export function ProjectsFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
}: ProjectsFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<ProjectFilters>(filters)

  // Calculate active filter count
  const activeFilterCount = 
    filters.status.length +
    filters.projectTypes.length +
    filters.employers.length +
    filters.employerCities.length +
    filters.employerCountries.length +
    filters.employerTypes.length +
    filters.clientLocations.length +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalAspects.length +
    filters.techStacks.length +
    (filters.completionDateStart ? 1 : 0) +
    (filters.completionDateEnd ? 1 : 0) +
    (filters.startEndDateStart ? 1 : 0) +
    (filters.startEndDateEnd ? 1 : 0) +
    (filters.startDateStart ? 1 : 0) +
    (filters.startDateEnd ? 1 : 0) +
    (filters.teamSizeMin ? 1 : 0) +
    (filters.teamSizeMax ? 1 : 0) +
    (filters.projectName.trim() ? 1 : 0) +
    (filters.projectLink.trim() ? 1 : 0) +
    (filters.isPublished !== null ? 1 : 0) +
    filters.publishPlatforms.length +
    (filters.minDownloadCount ? 1 : 0)

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof ProjectFilters, value: string[] | Date | null | string | boolean) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  // Validate date ranges
  const validateDateRanges = (): string | null => {
    // Validate completion date range
    if (tempFilters.completionDateStart && tempFilters.completionDateEnd && 
        tempFilters.completionDateStart > tempFilters.completionDateEnd) {
      return 'Completion date start must be before completion date end'
    }
    // Validate start & end date range
    if (tempFilters.startEndDateStart && tempFilters.startEndDateEnd && 
        tempFilters.startEndDateStart > tempFilters.startEndDateEnd) {
      return 'Start & End date start must be before start & end date end'
    }
    // Validate start date range
    if (tempFilters.startDateStart && tempFilters.startDateEnd && 
        tempFilters.startDateStart > tempFilters.startDateEnd) {
      return 'Start date start must be before start date end'
    }
    return null
  }

  // Validate team size range
  const validateTeamSizeRange = (): string | null => {
    if (tempFilters.teamSizeMin && tempFilters.teamSizeMax) {
      const min = parseInt(tempFilters.teamSizeMin)
      const max = parseInt(tempFilters.teamSizeMax)
      if (!isNaN(min) && !isNaN(max) && min > max) {
        return 'Minimum team size must be less than or equal to maximum'
      }
    }
    return null
  }

  const dateRangeError = validateDateRanges()
  const teamSizeError = validateTeamSizeRange()

  const handleApplyFilters = () => {
    // Validate before applying
    if (dateRangeError || teamSizeError) {
      return // Don't apply if there are validation errors
    }
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
    tempFilters.projectTypes.length > 0 ||
    tempFilters.employers.length > 0 ||
    tempFilters.employerCities.length > 0 ||
    tempFilters.employerCountries.length > 0 ||
    tempFilters.employerTypes.length > 0 ||
    tempFilters.clientLocations.length > 0 ||
    tempFilters.completionDateStart !== null ||
    tempFilters.completionDateEnd !== null ||
    tempFilters.startEndDateStart !== null ||
    tempFilters.startEndDateEnd !== null ||
    tempFilters.startDateStart !== null ||
    tempFilters.startDateEnd !== null ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.techStacks.length > 0 ||
    tempFilters.completionDateStart !== null ||
    tempFilters.completionDateEnd !== null ||
    tempFilters.startEndDateStart !== null ||
    tempFilters.startEndDateEnd !== null ||
    tempFilters.startDateStart !== null ||
    tempFilters.startDateEnd !== null ||
    tempFilters.teamSizeMin !== "" ||
    tempFilters.teamSizeMax !== "" ||
    tempFilters.projectName.trim() !== "" ||
    tempFilters.projectLink.trim() !== "" ||
    tempFilters.isPublished !== null ||
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
            Filter Projects
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Project Name and Link Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-sm font-medium">
                    Project Name
                  </Label>
                  <Input
                    id="projectName"
                    type="text"
                    placeholder="e.g., iApartments"
                    value={tempFilters.projectName}
                    onChange={(e) => handleFilterChange("projectName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectLink" className="text-sm font-medium">
                    Project Link
                  </Label>
                  <Input
                    id="projectLink"
                    type="text"
                    placeholder="e.g., https://example.com"
                    value={tempFilters.projectLink}
                    onChange={(e) => handleFilterChange("projectLink", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={statusOptions}
                  selected={tempFilters.status}
                  onChange={(values) => handleFilterChange("status", values)}
                  placeholder="Filter by status..."
                  label="Project Status"
                  maxDisplay={3}
                />

                <MultiSelect
                  items={projectTypeOptions}
                  selected={tempFilters.projectTypes}
                  onChange={(values) => handleFilterChange("projectTypes", values)}
                  placeholder="Filter by project type..."
                  label="Project Type"
                  maxDisplay={3}
                />
              </div>

              <MultiSelect
                items={employerOptions}
                selected={tempFilters.employers}
                onChange={(values) => handleFilterChange("employers", values)}
                placeholder="Filter by employer..."
                label="Employer"
                searchPlaceholder="Search employers..."
                maxDisplay={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={employerCityOptions}
                  selected={tempFilters.employerCities}
                  onChange={(values) => handleFilterChange("employerCities", values)}
                  placeholder="Filter by city..."
                  label="Employer City"
                  searchPlaceholder="Search cities..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={employerCountryOptions}
                  selected={tempFilters.employerCountries}
                  onChange={(values) => handleFilterChange("employerCountries", values)}
                  placeholder="Filter by country..."
                  label="Employer Country"
                  searchPlaceholder="Search countries..."
                  maxDisplay={3}
                />
                
                <MultiSelect
                  items={Object.values(EMPLOYER_TYPE_LABELS).map(type => ({ value: type, label: type }))}
                  selected={tempFilters.employerTypes}
                  onChange={(values) => handleFilterChange("employerTypes", values)}
                  placeholder="Filter by employer type..."
                  label="Employer Type"
                  searchPlaceholder="Search types..."
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
            </div>

            <div className="space-y-4">
              <MultiSelect
                items={techStackOptions}
                selected={tempFilters.techStacks}
                onChange={(values) => handleFilterChange("techStacks", values)}
                placeholder="Filter by technology..."
                label="Technology Stack"
                searchPlaceholder="Search technologies..."
                maxDisplay={4}
              />

              <div className="space-y-4">
                <MultiSelect
                  items={verticalDomainOptions}
                  selected={tempFilters.verticalDomains}
                  onChange={(values) => handleFilterChange("verticalDomains", values)}
                  placeholder="Filter by vertical domain..."
                  label="Vertical Domains"
                  searchPlaceholder="Search vertical domains..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={horizontalDomainOptions}
                  selected={tempFilters.horizontalDomains}
                  onChange={(values) => handleFilterChange("horizontalDomains", values)}
                  placeholder="Filter by horizontal domain..."
                  label="Horizontal Domains"
                  searchPlaceholder="Search horizontal domains..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={technicalAspectOptions}
                  selected={tempFilters.technicalAspects}
                  onChange={(values) => handleFilterChange("technicalAspects", values)}
                  placeholder="Filter by technical aspect..."
                  label="Technical Aspects"
                  searchPlaceholder="Search technical aspects..."
                  maxDisplay={3}
                />
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-6">
              {/* Section 1: Completion Date Range */}
              <div className="space-y-3 border-b pb-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Completion Date Range
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Filter projects that completed (ended) within this date range. 
                    Use case: &quot;List all projects completed between Jan–Mar 2025&quot;
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="completionDateStart" className="text-xs text-muted-foreground">
                        From Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.completionDateStart && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.completionDateStart ? (
                              tempFilters.completionDateStart.toLocaleDateString()
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.completionDateStart || undefined}
                            onSelect={(date) => handleFilterChange("completionDateStart", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="completionDateEnd" className="text-xs text-muted-foreground">
                        To Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.completionDateEnd && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.completionDateEnd ? (
                              tempFilters.completionDateEnd.toLocaleDateString()
                            ) : (
                              <span>Select end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.completionDateEnd || undefined}
                            onSelect={(date) => handleFilterChange("completionDateEnd", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Start & End Date Range */}
              <div className="space-y-3 border-b pb-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Start & End Date Range
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Filter projects that both started AND completed within this date range.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startEndDateStart" className="text-xs text-muted-foreground">
                        From Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.startEndDateStart && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.startEndDateStart ? (
                              tempFilters.startEndDateStart.toLocaleDateString()
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.startEndDateStart || undefined}
                            onSelect={(date) => handleFilterChange("startEndDateStart", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startEndDateEnd" className="text-xs text-muted-foreground">
                        To Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.startEndDateEnd && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.startEndDateEnd ? (
                              tempFilters.startEndDateEnd.toLocaleDateString()
                            ) : (
                              <span>Select end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.startEndDateEnd || undefined}
                            onSelect={(date) => handleFilterChange("startEndDateEnd", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Start Date Range */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Start Date Range
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Filter projects that started within this date range.
                    Use case: &quot;List all projects started between Jan–Mar 2025&quot;
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDateStart" className="text-xs text-muted-foreground">
                        From Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.startDateStart && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.startDateStart ? (
                              tempFilters.startDateStart.toLocaleDateString()
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.startDateStart || undefined}
                            onSelect={(date) => handleFilterChange("startDateStart", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDateEnd" className="text-xs text-muted-foreground">
                        To Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.startDateEnd && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.startDateEnd ? (
                              tempFilters.startDateEnd.toLocaleDateString()
                            ) : (
                              <span>Select end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.startDateEnd || undefined}
                            onSelect={(date) => handleFilterChange("startDateEnd", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
              
              {dateRangeError && (
                <p className="text-xs text-red-500">{dateRangeError}</p>
              )}
            </div>

            {/* Team Size Range Filter */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team Size</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamSizeMin" className="text-xs text-muted-foreground">
                      Minimum Team Size
                    </Label>
                    <Input
                      id="teamSizeMin"
                      type="number"
                      placeholder="e.g., 5"
                      value={tempFilters.teamSizeMin}
                      onChange={(e) => handleFilterChange("teamSizeMin", e.target.value)}
                      className={teamSizeError ? "border-red-500" : ""}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamSizeMax" className="text-xs text-muted-foreground">
                      Maximum Team Size
                    </Label>
                    <Input
                      id="teamSizeMax"
                      type="number"
                      placeholder="e.g., 30"
                      value={tempFilters.teamSizeMax}
                      onChange={(e) => handleFilterChange("teamSizeMax", e.target.value)}
                      className={teamSizeError ? "border-red-500" : ""}
                      min="1"
                    />
                  </div>
                </div>
                {teamSizeError && (
                  <p className="text-xs text-red-500">{teamSizeError}</p>
                )}
              </div>
            </div>

            {/* Published App Filter */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublished"
                  checked={tempFilters.isPublished === true}
                  onCheckedChange={(checked) => {
                    handleFilterChange("isPublished", checked ? true : null)
                  }}
                />
                <Label htmlFor="isPublished" className="text-sm cursor-pointer">
                  Published App
                </Label>
              </div>
            </div>

            {/* Publish Platforms Filter */}
            <div className="space-y-2 mt-4">
              <MultiSelect
                items={publishPlatformOptions}
                selected={tempFilters.publishPlatforms}
                onChange={(values) => handleFilterChange("publishPlatforms", values)}
                placeholder="Select platforms"
                label="Publish Platforms"
                searchPlaceholder="Search platforms..."
              />
              <p className="text-xs text-muted-foreground">
                {tempFilters.publishPlatforms.length === 0 
                  ? "Select platforms to filter by specific app stores (e.g., App Store, Play Store). Leave empty to match any platform."
                  : "Filtering for projects published on selected platforms. Combine with 'Published App' checkbox for published projects only."}
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
                Filter projects with at least this many downloads (e.g., 100000 for 100K+)
              </p>
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
              disabled={!!(dateRangeError || teamSizeError)}
              className="ml-auto transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
