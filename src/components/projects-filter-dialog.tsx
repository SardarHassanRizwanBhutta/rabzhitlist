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
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import { cn } from "@/lib/utils"

// Filter interfaces
export interface ProjectFilters {
  status: ProjectStatus[]
  projectTypes: string[]
  employers: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  techStacks: string[]
  startDate: Date | null
  endDate: Date | null
  teamSizeMin: string
  teamSizeMax: string
  projectName: string
  projectLink: string
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
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalAspects.length +
    filters.techStacks.length +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.teamSizeMin ? 1 : 0) +
    (filters.teamSizeMax ? 1 : 0) +
    (filters.projectName.trim() ? 1 : 0) +
    (filters.projectLink.trim() ? 1 : 0)

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof ProjectFilters, value: string[] | Date | null | string) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  // Validate date range
  const validateDateRange = (): string | null => {
    if (tempFilters.startDate && tempFilters.endDate && tempFilters.startDate > tempFilters.endDate) {
      return 'Start date must be before end date'
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

  const dateRangeError = validateDateRange()
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
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.techStacks.length > 0 ||
    tempFilters.startDate !== null ||
    tempFilters.endDate !== null ||
    tempFilters.teamSizeMin !== "" ||
    tempFilters.teamSizeMax !== "" ||
    tempFilters.projectName.trim() !== "" ||
    tempFilters.projectLink.trim() !== ""

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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                      Start Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempFilters.startDate && "text-muted-foreground",
                            dateRangeError && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.startDate ? (
                            tempFilters.startDate.toLocaleDateString()
                          ) : (
                            <span>Select start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={tempFilters.startDate || undefined}
                          onSelect={(date) => handleFilterChange("startDate", date || null)}
                          captionLayout="dropdown"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                      End Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempFilters.endDate && "text-muted-foreground",
                            dateRangeError && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.endDate ? (
                            tempFilters.endDate.toLocaleDateString()
                          ) : (
                            <span>Select end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={tempFilters.endDate || undefined}
                          onSelect={(date) => handleFilterChange("endDate", date || null)}
                          captionLayout="dropdown"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {dateRangeError && (
                  <p className="text-xs text-red-500">{dateRangeError}</p>
                )}
              </div>
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
