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
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Filter, Globe } from "lucide-react"
import { GlobalFilters, getGlobalFilterCount } from "@/lib/types/global-filters"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCandidates } from "@/lib/sample-data/candidates"

interface GlobalFilterDialogProps {
  children?: React.ReactNode
}

// Extract unique values from all data sources for global filters
const extractGlobalCountries = (): string[] => {
  const countries = new Set<string>()
  
  // From candidates
  sampleCandidates.forEach(candidate => {
    if (candidate.city) {
      // Mock: extract country from city (in real app, candidates would have country field)
      countries.add("USA") // Mock data
    }
  })
  
  // From employers
  sampleEmployers.forEach(employer => {
    employer.locations.forEach(location => {
      if (location.country !== null) {
        countries.add(location.country)
      }
    })
  })
  
  // From universities
  sampleUniversities.forEach(university => {
    countries.add(university.country)
  })
  
  return Array.from(countries).sort()
}

const extractGlobalCities = (): string[] => {
  const cities = new Set<string>()
  
  // From candidates
  sampleCandidates.forEach(candidate => {
    if (candidate.city) {
      cities.add(candidate.city)
    }
  })
  
  // From employers
  sampleEmployers.forEach(employer => {
    employer.locations.forEach(location => {
      if (location.city !== null) {
        cities.add(location.city)
      }
    })
  })
  
  // From universities
  sampleUniversities.forEach(university => {
    university.locations.forEach(location => {
      cities.add(location.city)
    })
  })
  
  return Array.from(cities).sort()
}

const extractGlobalTechStacks = (): string[] => {
  const techStacks = new Set<string>()
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  return Array.from(techStacks).sort()
}

const extractGlobalVerticalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.verticalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

const extractGlobalHorizontalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.horizontalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

const extractGlobalTechnicalAspects = (): string[] => {
  const aspects = new Set<string>()
  sampleProjects.forEach(project => {
    project.technicalAspects.forEach(aspect => aspects.add(aspect))
  })
  return Array.from(aspects).sort()
}

const extractGlobalEmployers = (): string[] => {
  const employers = new Set<string>()
  sampleEmployers.forEach(employer => {
    employers.add(employer.name)
  })
  return Array.from(employers).sort()
}

const extractGlobalStatuses = (): string[] => {
  const statuses = new Set<string>()
  
  // From candidates
  sampleCandidates.forEach(candidate => {
    statuses.add(candidate.status)
  })
  
  // From projects
  sampleProjects.forEach(project => {
    statuses.add(project.status)
  })
  
  // From employers
  sampleEmployers.forEach(employer => {
    statuses.add(employer.status)
  })
  
  return Array.from(statuses).sort()
}

// Filter options
const countryOptions: MultiSelectOption[] = extractGlobalCountries().map(country => ({
  value: country,
  label: country
}))

const cityOptions: MultiSelectOption[] = extractGlobalCities().map(city => ({
  value: city,
  label: city
}))

const techStackOptions: MultiSelectOption[] = extractGlobalTechStacks().map(tech => ({
  value: tech,
  label: tech
}))

const verticalDomainOptions: MultiSelectOption[] = extractGlobalVerticalDomains().map(domain => ({
  value: domain,
  label: domain
}))

const horizontalDomainOptions: MultiSelectOption[] = extractGlobalHorizontalDomains().map(domain => ({
  value: domain,
  label: domain
}))

const technicalAspectOptions: MultiSelectOption[] = extractGlobalTechnicalAspects().map(aspect => ({
  value: aspect,
  label: aspect
}))

const employerOptions: MultiSelectOption[] = extractGlobalEmployers().map(employer => ({
  value: employer,
  label: employer
}))

const statusOptions: MultiSelectOption[] = extractGlobalStatuses().map(status => ({
  value: status,
  label: status
}))

export function GlobalFilterDialog({ children }: GlobalFilterDialogProps) {
  const { filters, setFilters, clearFilters } = useGlobalFilters()
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<GlobalFilters>(filters)

  const activeFilterCount = getGlobalFilterCount(filters)

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof GlobalFilters, value: string[]) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
    setFilters(tempFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters({
      countries: [],
      cities: [],
      techStacks: [],
      verticalDomains: [],
      horizontalDomains: [],
      technicalAspects: [],
      employers: [],
      status: [],
    })
    clearFilters()
    // Keep dialog open for user to see cleared state
  }

  const handleCancel = () => {
    setTempFilters(filters) // Reset to current filters
    setOpen(false)
  }

  const hasAnyTempFilters = 
    tempFilters.countries.length > 0 ||
    tempFilters.cities.length > 0 ||
    tempFilters.techStacks.length > 0 ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.employers.length > 0 ||
    tempFilters.status.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Globe className="h-4 w-4" />
            Global Filters
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
            <Globe className="h-5 w-5" />
            Global Filters
            <Badge variant="outline" className="ml-2 text-xs">
              Applies to all tables
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Geographic Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Geographic Filters</h3>
              
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
            </div>

            {/* Technology Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Technology & Expertise</h3>
              
              <MultiSelect
                items={techStackOptions}
                selected={tempFilters.techStacks}
                onChange={(values) => handleFilterChange("techStacks", values)}
                placeholder="Filter by technology..."
                label="Technology Stack"
                searchPlaceholder="Search technologies..."
                maxDisplay={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Entity Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Entity Filters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={employerOptions}
                  selected={tempFilters.employers}
                  onChange={(values) => handleFilterChange("employers", values)}
                  placeholder="Filter by employer..."
                  label="Employers"
                  searchPlaceholder="Search employers..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={statusOptions}
                  selected={tempFilters.status}
                  onChange={(values) => handleFilterChange("status", values)}
                  placeholder="Filter by status..."
                  label="Status"
                  searchPlaceholder="Search statuses..."
                  maxDisplay={3}
                />
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
              Apply Global Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
