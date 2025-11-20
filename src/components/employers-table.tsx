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
  Employer,
  EmployerLocation,
  EMPLOYER_STATUS_COLORS,
  SALARY_POLICY_COLORS,
  EMPLOYER_STATUS_LABELS,
  SALARY_POLICY_LABELS,
  getEmployerSizeDisplay,
  calculateEmployerSize,
} from "@/lib/types/employer"
import { sampleProjects } from "@/lib/sample-data/projects"
import type { EmployerFilters } from "./employers-filter-dialog"

interface EmployersTableProps {
  employers: Employer[]
  filters?: EmployerFilters
  isLoading?: boolean
  onAdd?: () => void
  onView?: (employer: Employer) => void
  onEdit?: (employer: Employer) => void
  onDelete?: (employer: Employer) => void
  onAddLocation?: (employer: Employer) => void
  onEditLocation?: (location: EmployerLocation) => void
  onDeleteLocation?: (location: EmployerLocation) => void
}

type SortKey = keyof Employer | 'size'
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

export function EmployersTable({
  employers,
  filters,
  isLoading = false,
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [expandedEmployers, setExpandedEmployers] = useState<Set<string>>(new Set())

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

  // Apply filters
  const filteredEmployers = useMemo(() => {
    if (!filters) return employers

    return employers.filter(employer => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(employer.status)) {
        return false
      }

      // Founded year filter
      if (filters.foundedYears.length > 0 && !filters.foundedYears.includes(employer.foundedYear.toString())) {
        return false
      }

      // Country filter
      if (filters.countries.length > 0) {
        const hasMatchingCountry = employer.locations.some(location => 
          filters.countries.includes(location.country)
        )
        if (!hasMatchingCountry) return false
      }

      // City filter
      if (filters.cities.length > 0) {
        const hasMatchingCity = employer.locations.some(location => 
          filters.cities.includes(location.city)
        )
        if (!hasMatchingCity) return false
      }

      // Salary policy filter
      if (filters.salaryPolicies.length > 0) {
        const hasMatchingSalaryPolicy = employer.locations.some(location => 
          filters.salaryPolicies.includes(location.salaryPolicy)
        )
        if (!hasMatchingSalaryPolicy) return false
      }

      // Size filter
      if (filters.sizeMin || filters.sizeMax) {
        const { totalMinSize, totalMaxSize } = calculateEmployerSize(employer.locations)
        
        if (filters.sizeMin) {
          const filterMin = parseInt(filters.sizeMin)
          if (!isNaN(filterMin) && totalMaxSize < filterMin) {
            return false // Employer's max size is below filter minimum
          }
        }
        
        if (filters.sizeMax) {
          const filterMax = parseInt(filters.sizeMax)
          if (!isNaN(filterMax) && totalMinSize > filterMax) {
            return false // Employer's min size is above filter maximum
          }
        }
      }

      // Project-based filters
      const employerProjects = sampleProjects.filter(project => project.employerName === employer.name)
      
      // Technology stack filter
      if (filters.techStacks.length > 0) {
        const hasMatchingTechStack = employerProjects.some(project =>
          project.techStacks.some(tech => filters.techStacks.includes(tech))
        )
        if (!hasMatchingTechStack) return false
      }

      // Vertical domains filter
      if (filters.verticalDomains.length > 0) {
        const hasMatchingVerticalDomain = employerProjects.some(project =>
          project.verticalDomains.some(domain => filters.verticalDomains.includes(domain))
        )
        if (!hasMatchingVerticalDomain) return false
      }

      // Horizontal domains filter
      if (filters.horizontalDomains.length > 0) {
        const hasMatchingHorizontalDomain = employerProjects.some(project =>
          project.horizontalDomains.some(domain => filters.horizontalDomains.includes(domain))
        )
        if (!hasMatchingHorizontalDomain) return false
      }

      // Technical aspects filter
      if (filters.technicalAspects.length > 0) {
        const hasMatchingTechnicalAspect = employerProjects.some(project =>
          project.technicalAspects.some(aspect => filters.technicalAspects.includes(aspect))
        )
        if (!hasMatchingTechnicalAspect) return false
      }

      // Project status filter
      if (filters.projectStatus.length > 0) {
        const hasMatchingProjectStatus = employerProjects.some(project =>
          filters.projectStatus.includes(project.status)
        )
        if (!hasMatchingProjectStatus) return false
      }

      return true
    })
  }, [employers, filters])

  // Sorting
  const sortedEmployers = useMemo(() => {
    return [...filteredEmployers].sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      if (sortKey === 'size') {
        // Handle calculated size sorting by average total employees
        const aSize = calculateEmployerSize(a.locations)
        const bSize = calculateEmployerSize(b.locations)
        aValue = (aSize.totalMinSize + aSize.totalMaxSize) / 2
        bValue = (bSize.totalMinSize + bSize.totalMaxSize) / 2
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

  // Pagination
  const totalPages = Math.ceil(sortedEmployers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedEmployers = sortedEmployers.slice(startIndex, endIndex)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
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
              <TableHead className="w-[50px]"></TableHead> {/* Expand column */}
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
              <TableHead className="w-[100px]">Offices</TableHead>
              <TableHead className="w-[120px]">Website</TableHead>
              <TableHead className="w-[120px]">LinkedIn</TableHead>
              <TableHead className="w-[60px]" title="View Employer Projects">Projects</TableHead>
              <TableHead className="w-[80px]" title="View Employer Candidates">Candidates</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployers.map((employer) => {
              const isExpanded = expandedEmployers.has(employer.id)
              return (
                <React.Fragment key={employer.id}>
                  {/* Employer Master Row */}
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleEmployerExpanded(employer.id)}
                      >
                        <ChevronRightIcon 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "transform rotate-90" : ""
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2Icon className="h-4 w-4 text-muted-foreground" />
                        {employer.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getEmployerSizeDisplay(employer.locations)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={EMPLOYER_STATUS_COLORS[employer.status]}
                      >
                        {EMPLOYER_STATUS_LABELS[employer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{employer.foundedYear}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {employer.locations.length} office{employer.locations.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <LinkButton href={employer.websiteUrl}>
                        Website
                      </LinkButton>
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
                        onClick={() => handleViewProjects(employer)}
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
                        onClick={() => handleViewCandidates(employer)}
                        title={`View candidates for ${employer.name}`}
                      >
                        <UsersIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Employer Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onAddLocation && (
                            <DropdownMenuItem onClick={() => onAddLocation(employer)}>
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Add Office
                            </DropdownMenuItem>
                          )}
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(employer)}>
                              <EyeIcon className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(employer)}>
                              <EditIcon className="mr-2 h-4 w-4" />
                              Edit Employer
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(employer)}
                              className="text-red-600"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete Employer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Location Rows */}
                  {isExpanded && employer.locations
                    .sort((a, b) => b.isHeadquarters ? 1 : a.isHeadquarters ? -1 : 0) // HQ first
                    .map((location) => (
                    <TableRow key={location.id} className="bg-muted/30">
                      <TableCell></TableCell> {/* Empty expand column */}
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
                      <TableCell></TableCell> {/* Empty expand column */}
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
                      <TableCell colSpan={8} className="text-muted-foreground text-sm"></TableCell>
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
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-xs text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(endIndex, sortedEmployers.length)} of{" "}
        {sortedEmployers.length} entries
      </div>
    </div>
  )
}
