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
import { Filter } from "lucide-react"
import { EmployerStatus, SalaryPolicy, EMPLOYER_STATUS_LABELS, SALARY_POLICY_LABELS } from "@/lib/types/employer"
import { ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/types/project"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"

// Filter interfaces
export interface EmployerFilters {
  status: EmployerStatus[]
  foundedYears: string[]
  countries: string[]
  cities: string[]
  salaryPolicies: SalaryPolicy[]
  sizeMin: string
  sizeMax: string
  // Project-based filters
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  projectStatus: string[]
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

// Extract unique project-based data for employers
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

const projectStatusOptions: MultiSelectOption[] = extractUniqueProjectStatuses().map(status => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status]
}))

const initialFilters: EmployerFilters = {
  status: [],
  foundedYears: [],
  countries: [],
  cities: [],
  salaryPolicies: [],
  sizeMin: "",
  sizeMax: "",
  // Project-based filters
  techStacks: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  projectStatus: [],
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
    filters.salaryPolicies.length +
    (filters.sizeMin ? 1 : 0) +
    (filters.sizeMax ? 1 : 0) +
    filters.techStacks.length +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalAspects.length +
    filters.projectStatus.length

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof EmployerFilters, value: string[] | string) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
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
    tempFilters.salaryPolicies.length > 0 ||
    tempFilters.sizeMin ||
    tempFilters.sizeMax ||
    tempFilters.techStacks.length > 0 ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.projectStatus.length > 0

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
                items={salaryPolicyOptions}
                selected={tempFilters.salaryPolicies}
                onChange={(values) => handleFilterChange("salaryPolicies", values)}
                placeholder="Filter by salary policy..."
                label="Salary Policies"
                maxDisplay={3}
              />
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
