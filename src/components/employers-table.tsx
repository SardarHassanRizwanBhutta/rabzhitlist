"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ExternalLinkIcon,
  MapPinIcon,
  BuildingIcon,
  Building2Icon,
  FolderIcon,
  UsersIcon,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EmployerDetailsModal } from "@/components/employer-details-modal"
import { toast } from "sonner"

import {
  Employer,
  EmployerLocation,
  TechStackWithCount,
  EMPLOYER_STATUS_COLORS,
  EMPLOYER_STATUS_LABELS,
  SALARY_POLICY_COLORS,
  SALARY_POLICY_LABELS,
  WORK_MODE_DB_LABELS,
  SHIFT_TYPE_DB_LABELS,
} from "@/lib/types/employer"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EmployerBenefit } from "@/lib/types/benefits"
import type { EmployerFilters } from "./employers-filter-dialog"

/** Display employer size from locations (min/max sum). No calculation logic—display only. */
function formatEmployerSize(locations: EmployerLocation[]): string {
  if (!locations?.length) return "—"
  const totalMin = locations.reduce((sum, loc) => sum + (loc.minSize ?? 0), 0)
  const totalMax = locations.reduce((sum, loc) => sum + (loc.maxSize ?? 0), 0)
  if (totalMin === 0 && totalMax === 0) return "—"
  if (totalMin === totalMax) return String(totalMin)
  return `${totalMin}-${totalMax}`
}

interface EmployersTableProps {
  employers: Employer[]
  filters?: EmployerFilters
  isLoading?: boolean
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onAdd?: () => void
  onView?: (employer: Employer) => void
  onEdit?: (employer: Employer) => void
  onDelete?: (employer: Employer) => void
  onAddLocation?: (employer: Employer) => void
  onEditLocation?: (location: EmployerLocation) => void
  onDeleteLocation?: (location: EmployerLocation) => void
}

type SortKey = keyof Employer | 'size' | 'applicants'
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

// Use only employer's own tech stacks (no candidate-derived data).
const getEmployerTechStacksWithCount = (employer: Employer): TechStackWithCount[] => {
  if (employer.techStacks && employer.techStacks.length > 0) {
    return employer.techStacks.map(tech => ({ tech, count: 0 }))
  }
  return []
}

const getEmployerTechStacks = (employer: Employer): string[] => {
  return getEmployerTechStacksWithCount(employer).map(item => item.tech)
}

// Use only employer's own benefits (no candidate-derived data).
const getEmployerBenefits = (employer: Employer): EmployerBenefit[] => {
  return employer.benefits && employer.benefits.length > 0 ? [...employer.benefits] : []
}

// From employer list/detail API: single work mode and shift type, arrays for time zones.
const getEmployerShiftTypes = (employer: Employer): string[] =>
  employer.shiftType && employer.shiftType in SHIFT_TYPE_DB_LABELS
    ? [SHIFT_TYPE_DB_LABELS[employer.shiftType]]
    : []
const getEmployerWorkModes = (employer: Employer): string[] =>
  employer.workMode && employer.workMode in WORK_MODE_DB_LABELS
    ? [WORK_MODE_DB_LABELS[employer.workMode]]
    : []
const getEmployerTimeSupportZones = (employer: Employer): string[] =>
  employer.timeSupportZones ?? []

// Helper to get intensity class based on count for visual emphasis
const getCountIntensityClass = (count: number): string => {
  if (count === 0) return "opacity-70" // Manual entry, no candidates
  if (count >= 5) return "ring-2 ring-blue-500/30 font-medium"
  if (count >= 3) return "font-medium"
  return ""
}

// Render tech stacks with counts - displays badge with count in parentheses
const renderTagsWithCount = (
  techStacks: TechStackWithCount[],
  maxDisplay: number = 2,
  colorClass?: string
) => {
  if (!techStacks || techStacks.length === 0) {
    return <span className="text-muted-foreground text-sm">N/A</span>
  }
  
  const displayTags = techStacks.slice(0, maxDisplay)
  const remainingCount = techStacks.length - maxDisplay

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {displayTags.map((item, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={`text-xs cursor-default ${colorClass || ""} ${getCountIntensityClass(item.count)}`}
              >
                {item.tech}
                {item.count > 0 && (
                  <span className="ml-1 opacity-75">({item.count})</span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {item.count === 0 
                ? "Manually added" 
                : `${item.count} candidate${item.count > 1 ? 's' : ''} use this technology`
              }
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  )
}

export function EmployersTable({
  employers,
  filters,
  isLoading = false,
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
  onPageSizeChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
}: EmployersTableProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [expandedEmployers, setExpandedEmployers] = useState<Set<string>>(new Set())
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employerToDelete, setEmployerToDelete] = useState<Employer | null>(null)

  const toggleEmployerExpanded = (employerId: string) => {
    setExpandedEmployers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employerId)) {
        newSet.delete(employerId)
      } else {
        newSet.add(employerId)
      }
      return newSet
    })
  }

  const handleDeleteClick = (employer: Employer) => {
    setEmployerToDelete(employer)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (employerToDelete) {
      // Call onDelete if provided, otherwise just show toast
      onDelete?.(employerToDelete)
      
      // Show success toast
      toast.success(`Employer "${employerToDelete.name}" has been deleted successfully.`)
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setEmployerToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setEmployerToDelete(null)
  }

  // No client-side filtering; filtering will be done by API when integrated.
  const filteredEmployers = useMemo(() => employers, [employers])

  const getSizeSortValue = (locations: EmployerLocation[]): number => {
    if (!locations?.length) return 0
    const totalMin = locations.reduce((sum, loc) => sum + (loc.minSize ?? 0), 0)
    const totalMax = locations.reduce((sum, loc) => sum + (loc.maxSize ?? 0), 0)
    return (totalMin + totalMax) / 2
  }

  // Sorting
  const sortedEmployers = useMemo(() => {
    return [...filteredEmployers].sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      if (sortKey === 'size') {
        aValue = getSizeSortValue(a.locations)
        bValue = getSizeSortValue(b.locations)
      } else if (sortKey === 'applicants' || sortKey === 'avgJobTenure') {
        aValue = 0
        bValue = 0
      } else {
        aValue = a[sortKey as keyof Employer] as string | number | Date
        bValue = b[sortKey as keyof Employer] as string | number | Date
      }

      if (aValue === bValue) return 0

      let comparison = 0
      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredEmployers, sortKey, sortDirection])

  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = startIndex + employers.length

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    onPageSizeChange(parseInt(value))
  }

  const handleViewProjects = (employer: Employer) => {
    // Navigate to projects page with employer filter
    const params = new URLSearchParams({
      employerFilter: employer.name,
      employerId: employer.id
    })
    router.push(`/projects?${params.toString()}`)
  }

  const handleViewCandidates = (employer: Employer) => {
    // Navigate to candidates page with employer filter
    const params = new URLSearchParams({
      employerFilter: employer.name,
      employerId: employer.id
    })
    router.push(`/candidates?${params.toString()}`)
  }

  const SortButton = ({ column, children }: { column: SortKey; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-8 data-[state=open]:bg-accent flex items-center gap-2 hover:bg-accent/50"
    >
      {children}
      {sortKey === column &&
        (sortDirection === "asc" ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        ))}
    </Button>
  )

  const LinkButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 py-1"
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
    >
      {children}
      <ExternalLinkIcon className="ml-1 h-3 w-3" />
    </Button>
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-[300px] bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-[130px] bg-muted animate-pulse rounded"></div>
        </div>
        <div className="rounded-md border">
          <div className="h-[400px] bg-muted animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (employers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          {onAdd && (
            <Button 
              onClick={onAdd}
              className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Employer
            </Button>
          )}
        </div>
        <div className="rounded-md border">
          <div className="flex items-center justify-center h-[400px] text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold">No employers found</p>
              <p className="text-muted-foreground">Get started by adding your first employer.</p>
              {onAdd && (
                <Button 
                  onClick={onAdd} 
                  className="mt-4 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create Employer
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-end">
        {onAdd && (
          <Button 
            onClick={onAdd}
            className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Employer
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Expand column */}
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>
                <SortButton column="name">Company Name</SortButton>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortButton column="size">Size</SortButton>
              </TableHead>
              <TableHead className="w-[100px]">
                <SortButton column="status">Status</SortButton>
              </TableHead>
              <TableHead className="w-[100px]">
                <SortButton column="foundedYear">Founded</SortButton>
              </TableHead>
              <TableHead className="w-[100px]">
                <SortButton column="applicants">Applicants</SortButton>
              </TableHead>
              <TableHead className="w-[90px]">
                <SortButton column="avgJobTenure">Avg Tenure</SortButton>
              </TableHead>
              <TableHead className="w-[100px]">Offices</TableHead>
              <TableHead className="w-[180px]">Tech Stacks</TableHead>
              <TableHead className="w-[200px]">Benefits</TableHead>
              <TableHead className="w-[150px]">Shift Types</TableHead>
              <TableHead className="w-[150px]">Work Modes</TableHead>
              <TableHead className="w-[120px]">Website</TableHead>
              <TableHead className="w-[120px]">LinkedIn</TableHead>
              <TableHead className="w-[60px]" title="View Employer Projects">Projects</TableHead>
              <TableHead className="w-[80px]" title="View Employer Candidates">Candidates</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEmployers.map((employer) => {
              const isExpanded = expandedEmployers.has(employer.id)
              return (
                <React.Fragment key={employer.id}>
                  {/* Employer Master Row */}
                  <TableRow 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedEmployer(employer)}
                  >
                    <TableCell>
                      <Collapsible 
                        open={isExpanded} 
                        onOpenChange={() => toggleEmployerExpanded(employer.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2Icon className="h-4 w-4 text-muted-foreground" />
                        {employer.name}
                        {employer.layoffs && employer.layoffs.length > 0 && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {employer.layoffs.length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatEmployerSize(employer.locations)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={EMPLOYER_STATUS_COLORS[employer.status ?? "Active"]}
                      >
                        {EMPLOYER_STATUS_LABELS[employer.status ?? "Active"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employer.foundedYear ? employer.foundedYear : <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 font-medium">
                        <UsersIcon className="h-3 w-3" />
                        —
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {employer.locations.length} office{employer.locations.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {renderTagsWithCount(getEmployerTechStacksWithCount(employer), 2, "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200")}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const benefits = getEmployerBenefits(employer)
                        if (benefits.length === 0) {
                          return <span className="text-muted-foreground text-sm">N/A</span>
                        }
                        const displayBenefits = benefits.slice(0, 2)
                        const remainingCount = benefits.length - 2
                        return (
                          <div className="flex flex-wrap gap-1">
                            {displayBenefits.map((benefit, index) => (
                              <Badge
                                key={benefit.id || index}
                                variant="secondary"
                                className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                              >
                                {benefit.name}
                              </Badge>
                            ))}
                            {remainingCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                +{remainingCount}
                              </Badge>
                            )}
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const shiftTypes = getEmployerShiftTypes(employer)
                        if (shiftTypes.length === 0) {
                          return <span className="text-muted-foreground text-sm">N/A</span>
                        }
                        const displayShiftTypes = shiftTypes.slice(0, 2)
                        const remainingCount = shiftTypes.length - 2
                        return (
                          <div className="flex flex-wrap gap-1">
                            {displayShiftTypes.map((shiftType, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                              >
                                {shiftType}
                              </Badge>
                            ))}
                            {remainingCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                +{remainingCount}
                              </Badge>
                            )}
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const workModes = getEmployerWorkModes(employer)
                        if (workModes.length === 0) {
                          return <span className="text-muted-foreground text-sm">N/A</span>
                        }
                        const displayWorkModes = workModes.slice(0, 2)
                        const remainingCount = workModes.length - 2
                        return (
                          <div className="flex flex-wrap gap-1">
                            {displayWorkModes.map((workMode, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                              >
                                {workMode}
                              </Badge>
                            ))}
                            {remainingCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                +{remainingCount}
                              </Badge>
                            )}
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {employer.websiteUrl ? (
                        <LinkButton href={employer.websiteUrl}>
                          Website
                        </LinkButton>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {employer.linkedinUrl ? (
                        <LinkButton href={employer.linkedinUrl}>
                          LinkedIn
                        </LinkButton>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewProjects(employer)
                        }}
                        title={`View projects for ${employer.name}`}
                      >
                        <FolderIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 dark:hover:text-green-400 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewCandidates(employer)
                        }}
                        title={`View candidates for ${employer.name}`}
                      >
                        <UsersIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              onView(employer)
                            }}
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span className="sr-only">View details</span>
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit?.(employer)
                              }}
                              className="cursor-pointer"
                            >
                              <EditIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(employer)
                              }}
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Location Rows */}
                  {isExpanded && employer.locations
                    .sort((a, b) => b.isHeadquarters ? 1 : a.isHeadquarters ? -1 : 0) // HQ first
                    .map((location) => (
                    <TableRow key={location.id} className="bg-muted/30">
                      {/* Empty expand column */}
                      <TableCell></TableCell>
                      <TableCell>
                        <div className="flex items-start gap-3 pl-6">
                          {location.isHeadquarters ? (
                            <BuildingIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                          ) : (
                            <MapPinIcon className="h-4 w-4 text-blue-500 mt-1" />
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {location.city}, {location.country}
                              </span>
                              {location.isHeadquarters && (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                  Headquarters
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {location.minSize === location.maxSize ? `${location.minSize}` : `${location.minSize}-${location.maxSize}`} employees
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{location.address}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={SALARY_POLICY_COLORS[location.salaryPolicy]}
                        >
                          {SALARY_POLICY_LABELS[location.salaryPolicy]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell className="text-muted-foreground text-sm">—</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open location menu</span>
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Office Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onEditLocation && (
                              <DropdownMenuItem onClick={() => onEditLocation(location)}>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Edit Office
                              </DropdownMenuItem>
                            )}
                            {onDeleteLocation && (
                              <DropdownMenuItem
                                onClick={() => onDeleteLocation(location)}
                                className="text-red-600"
                                disabled={location.isHeadquarters}
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                {location.isHeadquarters ? "Cannot Delete HQ" : "Delete Office"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Add Location Row (when expanded and has addLocation handler) */}
                  {isExpanded && onAddLocation && (
                    <TableRow className="bg-muted/10 border-dashed">
                      {/* Empty expand column */}
                      <TableCell></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 pl-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddLocation(employer)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Add office to {employer.name}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell colSpan={9} className="text-muted-foreground text-sm"></TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={pageSize.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {pageNumber} of {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(1)}
              disabled={!hasPrevious}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pageNumber - 1)}
              disabled={!hasPrevious}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pageNumber + 1)}
              disabled={!hasNext}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNext}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-xs text-muted-foreground">
        Showing {totalCount === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalCount)} of{" "}
        {totalCount} entries
      </div>

      {/* Employer Detail Dialog */}
      {selectedEmployer && (
        <EmployerDetailsModal
          employer={selectedEmployer}
          open={!!selectedEmployer}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEmployer(null)
            }
          }}
          onEdit={onEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{employerToDelete?.name}</strong> and all its office locations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
