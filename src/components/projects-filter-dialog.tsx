"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Filter, CalendarIcon, ChevronsUpDown, Check, X } from "lucide-react"
import { searchEmployers, fetchEmployerById } from "@/lib/services/employers-api"
import type { EmployerLookupDto } from "@/lib/services/employers-api"
import { ProjectStatus, PROJECT_STATUS_LABELS, PROJECT_TYPES } from "@/lib/types/project"
import { sampleProjects } from "@/lib/sample-data/projects"
import {
  VERTICAL_DOMAINS,
  HORIZONTAL_DOMAINS,
  type ProjectsListFilterInput,
} from "@/lib/services/projects-api"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export type ProjectFilters = ProjectsListFilterInput

export interface ProjectLookupOptions {
  techStacks: MultiSelectOption[]
  verticalDomains: MultiSelectOption[]
  horizontalDomains: MultiSelectOption[]
  technicalDomains: MultiSelectOption[]
  /** Legacy GET /api/TechnicalAspects — optional when empty. */
  technicalAspects?: MultiSelectOption[]
  /** GET /api/TechnicalAspectTypes — preferred for project filter when non-empty. */
  technicalAspectTypes?: MultiSelectOption[]
  clientLocations: MultiSelectOption[]
}

interface ProjectsFilterDialogProps {
  children?: React.ReactNode
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  onClearFilters: () => void
  /** When provided, filter dropdowns use these instead of sample data. */
  lookupOptions?: ProjectLookupOptions
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

const projectTypeOptions: MultiSelectOption[] = PROJECT_TYPES.map((type) => ({
  value: type,
  label: type,
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
  clientLocations: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalDomains: [],
  technicalAspects: [],
  technicalAspectTypeIds: [],
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
  lookupOptions,
}: ProjectsFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<ProjectFilters>(filters)

  // Employer combobox: server-driven search (same pattern as ProjectCreationDialog)
  const [employerComboboxOpen, setEmployerComboboxOpen] = useState(false)
  const [employerSearchQuery, setEmployerSearchQuery] = useState("")
  const [employerSearchResults, setEmployerSearchResults] = useState<EmployerLookupDto[]>([])
  const [employerSearchLoading, setEmployerSearchLoading] = useState(false)
  const [employerNameById, setEmployerNameById] = useState<Record<string, string>>({})
  const employerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const employerAbortRef = useRef<AbortController | null>(null)
  const employerNameByIdRef = useRef<Record<string, string>>({})
  employerNameByIdRef.current = employerNameById

  // Debounced employer search: min 2 chars, 300ms debounce, abort stale
  useEffect(() => {
    if (employerDebounceRef.current) {
      clearTimeout(employerDebounceRef.current)
      employerDebounceRef.current = null
    }
    if (employerSearchQuery.trim().length < 2) {
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
        employerAbortRef.current = null
      }
      setEmployerSearchResults([])
      setEmployerSearchLoading(false)
      return
    }
    employerDebounceRef.current = setTimeout(() => {
      employerDebounceRef.current = null
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
      }
      const controller = new AbortController()
      employerAbortRef.current = controller
      setEmployerSearchLoading(true)
      const query = employerSearchQuery.trim()
      searchEmployers(query, 10, controller.signal)
        .then((list) => {
          if (employerAbortRef.current !== controller) return
          setEmployerSearchResults(list)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return
          setEmployerSearchResults([])
        })
        .finally(() => {
          if (employerAbortRef.current === controller) {
            setEmployerSearchLoading(false)
          }
        })
    }, 300)
    return () => {
      if (employerDebounceRef.current) {
        clearTimeout(employerDebounceRef.current)
      }
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
      }
    }
  }, [employerSearchQuery])

  useEffect(() => {
    return () => {
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
      }
    }
  }, [])

  // Resolve labels for employer ids restored from applied filters (e.g. after reopen dialog)
  useEffect(() => {
    const missing = tempFilters.employers.filter((id) => !employerNameByIdRef.current[id])
    if (missing.length === 0) return
    let cancelled = false
    void Promise.all(
      missing.map((id) => {
        const n = parseInt(id, 10)
        if (Number.isNaN(n)) return Promise.resolve(null as { id: string; name: string } | null)
        return fetchEmployerById(n)
          .then((dto) => ({ id: String(dto.id), name: dto.name }))
          .catch(() => null)
      })
    ).then((results) => {
      if (cancelled) return
      setEmployerNameById((prev) => {
        const next = { ...prev }
        for (const r of results) {
          if (r) next[r.id] = r.name
        }
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [tempFilters.employers])

  const toggleEmployerFromSearch = (emp: EmployerLookupDto) => {
    const idStr = String(emp.id)
    setEmployerNameById((prev) => ({ ...prev, [idStr]: emp.name }))
    setTempFilters((prev) => {
      const has = prev.employers.includes(idStr)
      return {
        ...prev,
        employers: has ? prev.employers.filter((x) => x !== idStr) : [...prev.employers, idStr],
      }
    })
  }

  const removeEmployerId = (idStr: string) => {
    setTempFilters((prev) => ({
      ...prev,
      employers: prev.employers.filter((x) => x !== idStr),
    }))
  }

  const techStackOptions: MultiSelectOption[] = lookupOptions?.techStacks ?? extractUniqueTechStacks().map((tech) => ({ value: tech, label: tech }))
  const verticalDomainOptions: MultiSelectOption[] = lookupOptions?.verticalDomains ?? VERTICAL_DOMAINS.map((d) => ({ value: d.label, label: d.label }))
  const horizontalDomainOptions: MultiSelectOption[] = lookupOptions?.horizontalDomains ?? HORIZONTAL_DOMAINS.map((d) => ({ value: d.label, label: d.label }))
  const technicalDomainOptions: MultiSelectOption[] = lookupOptions?.technicalDomains ?? []
  const technicalAspectTypeFilterOptions: MultiSelectOption[] = lookupOptions?.technicalAspectTypes ?? []
  const legacyTechnicalAspectOptions: MultiSelectOption[] =
    lookupOptions?.technicalAspects?.length
      ? lookupOptions.technicalAspects
      : extractUniqueTechnicalAspects().map((a) => ({ value: a, label: a }))
  const useTechnicalAspectTypesFilter = technicalAspectTypeFilterOptions.length > 0
  const clientLocationOptions: MultiSelectOption[] = lookupOptions?.clientLocations ?? extractUniqueClientLocations().map((loc) => ({ value: loc, label: loc }))

  // Calculate active filter count
  const activeFilterCount = 
    filters.status.length +
    filters.projectTypes.length +
    filters.employers.length +
    filters.clientLocations.length +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalDomains.length +
    filters.technicalAspects.length +
    filters.technicalAspectTypeIds.length +
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
    setEmployerNameById({})
    setEmployerSearchQuery("")
    setEmployerSearchResults([])
    setEmployerComboboxOpen(false)
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
    tempFilters.clientLocations.length > 0 ||
    tempFilters.completionDateStart !== null ||
    tempFilters.completionDateEnd !== null ||
    tempFilters.startEndDateStart !== null ||
    tempFilters.startEndDateEnd !== null ||
    tempFilters.startDateStart !== null ||
    tempFilters.startDateEnd !== null ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.technicalAspectTypeIds.length > 0 ||
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

              <div className="space-y-2">
                <Label className="text-sm font-medium">Employer</Label>
                <Popover
                  open={employerComboboxOpen}
                  onOpenChange={(nextOpen) => {
                    setEmployerComboboxOpen(nextOpen)
                    if (!nextOpen) {
                      setEmployerSearchQuery("")
                      setEmployerSearchResults([])
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={employerComboboxOpen}
                      className={cn(
                        "w-full justify-between items-start gap-2 h-auto min-h-[2.5rem] px-3 py-2 font-normal text-left"
                      )}
                    >
                      <div className="flex flex-wrap gap-1 flex-1 mr-2 items-center min-w-0">
                        {tempFilters.employers.length === 0 && (
                          <span className="text-muted-foreground">Search employers to add…</span>
                        )}
                        {tempFilters.employers.slice(0, 3).map((id) => (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="max-w-full shrink gap-0 pr-0.5 font-normal hover:bg-secondary/80 flex items-center"
                          >
                            <span className="truncate pl-1.5 py-0.5 max-w-[min(12rem,100%)]">
                              {employerNameById[id] ?? `Employer #${id}`}
                            </span>
                            <span
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm outline-none ring-offset-background hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  removeEmployerId(id)
                                }
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                removeEmployerId(id)
                              }}
                              aria-label={`Remove ${employerNameById[id] ?? id}`}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </span>
                          </Badge>
                        ))}
                        {tempFilters.employers.length > 3 && (
                          <Badge variant="secondary" className="font-normal">
                            +{tempFilters.employers.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 mt-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search employers..."
                        value={employerSearchQuery}
                        onValueChange={setEmployerSearchQuery}
                        className="h-9"
                      />
                      <CommandList>
                        {employerSearchLoading && (
                          <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
                        )}
                        {!employerSearchLoading && employerSearchQuery.trim().length < 2 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
                        )}
                        {!employerSearchLoading &&
                          employerSearchQuery.trim().length >= 2 &&
                          employerSearchResults.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">No employers found</div>
                          )}
                        {!employerSearchLoading && employerSearchResults.length > 0 && (
                          <CommandGroup>
                            {employerSearchResults.map((emp) => {
                              const idStr = String(emp.id)
                              const selected = tempFilters.employers.includes(idStr)
                              return (
                                <CommandItem
                                  key={emp.id}
                                  value={idStr}
                                  onSelect={() => toggleEmployerFromSearch(emp)}
                                  className="cursor-pointer"
                                >
                                  {emp.name}
                                  {selected ? (
                                    <Check className="ml-auto h-4 w-4 opacity-100" />
                                  ) : null}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  items={technicalDomainOptions}
                  selected={tempFilters.technicalDomains}
                  onChange={(values) => handleFilterChange("technicalDomains", values)}
                  placeholder="Filter by technical domain..."
                  label="Technical Domains"
                  searchPlaceholder="Search technical domains..."
                  maxDisplay={3}
                />

                {useTechnicalAspectTypesFilter ? (
                  <MultiSelect
                    items={technicalAspectTypeFilterOptions}
                    selected={tempFilters.technicalAspectTypeIds}
                    onChange={(values) => handleFilterChange("technicalAspectTypeIds", values)}
                    placeholder="Filter by technical aspect..."
                    label="Technical Aspects"
                    searchPlaceholder="Search technical aspects..."
                    maxDisplay={3}
                  />
                ) : (
                  <MultiSelect
                    items={legacyTechnicalAspectOptions}
                    selected={tempFilters.technicalAspects}
                    onChange={(values) => handleFilterChange("technicalAspects", values)}
                    placeholder="Filter by technical aspect..."
                    label="Technical Aspects"
                    searchPlaceholder="Search technical aspects..."
                    maxDisplay={3}
                  />
                )}
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
                    Bounds on project end date (completion). Only projects with an end date are included when
                    you set a bound. Inclusive range on the calendar day (ISO date sent to the API).
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
                    Active window (timeline overlap)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Active window: projects whose timeline overlaps this range (standard interval overlap). Ongoing
                    projects (no end date) are treated as open-ended for overlap. Projects without a start date never
                    match this filter.
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
                    Bounds on project start date only. Only projects with a start date are included when you set a
                    bound. Inclusive range on the calendar day (ISO date sent to the API).
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
