"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  SearchIcon,
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
  GraduationCapIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  University,
  UniversityLocation,
  UNIVERSITY_RANKING_COLORS,
  UNIVERSITY_RANKING_LABELS,
} from "@/lib/types/university"
import { UniversityDetailsModal } from "@/components/university-details-modal"
import { toast } from "sonner"
import { calculateUniversityJobSuccessRatio } from "@/lib/utils/university-stats"

interface UniversitiesTableProps {
  universities: University[]
  isLoading?: boolean
  onAdd?: () => void
  onView?: (university: University) => void
  onEdit?: (university: University) => void
  onDelete?: (university: University) => void
  onAddLocation?: (university: University) => void
  onEditLocation?: (location: UniversityLocation) => void
  onDeleteLocation?: (location: UniversityLocation) => void
}

type SortKey = keyof University | "jobSuccessRatio"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

export function UniversitiesTable({
  universities,
  isLoading = false,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
}: UniversitiesTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [expandedUniversities, setExpandedUniversities] = useState<Set<string>>(new Set())
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [universityToDelete, setUniversityToDelete] = useState<University | null>(null)

  const toggleUniversityExpanded = (universityId: string) => {
    setExpandedUniversities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(universityId)) {
        newSet.delete(universityId)
      } else {
        newSet.add(universityId)
      }
      return newSet
    })
  }

  const handleDeleteClick = (university: University) => {
    setUniversityToDelete(university)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (universityToDelete) {
      // Call onDelete if provided, otherwise just show toast
      onDelete?.(universityToDelete)
      
      // Show success toast
      toast.success(`University "${universityToDelete.name}" has been deleted successfully.`)
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setUniversityToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setUniversityToDelete(null)
  }

  // Filtering (including location data)
  const filteredUniversities = useMemo(() => {
    if (!searchQuery) return universities

      return universities.filter(
        (uni) =>
          uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          uni.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          uni.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          uni.ranking.toLowerCase().includes(searchQuery.toLowerCase()) ||
          uni.locations.some(loc => 
            loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (loc.address !== null && loc.address.toLowerCase().includes(searchQuery.toLowerCase()))
          )
      )
  }, [universities, searchQuery])

  // Sorting
  const sortedUniversities = useMemo(() => {
    return [...filteredUniversities].sort((a, b) => {
      // Handle job success ratio sorting (calculated field)
      if (sortKey === "jobSuccessRatio") {
        const aStats = calculateUniversityJobSuccessRatio(a)
        const bStats = calculateUniversityJobSuccessRatio(b)
        const comparison = aStats.successRatio - bStats.successRatio
        return sortDirection === "asc" ? comparison : -comparison
      }

      // Handle regular university fields
      const aValue = a[sortKey as keyof University]
      const bValue = b[sortKey as keyof University]

      if (aValue === bValue) return 0

      let comparison = 0
      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        comparison = aValue === bValue ? 0 : aValue ? -1 : 1
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredUniversities, sortKey, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedUniversities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUniversities = sortedUniversities.slice(startIndex, endIndex)

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

  const handleViewGraduates = (university: University) => {
    // Navigate to candidates page with university filter
    const params = new URLSearchParams({
      universityFilter: university.name,
      universityId: university.id
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

  if (universities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search universities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          {onAdd && (
            <Button onClick={onAdd}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add University
            </Button>
          )}
        </div>
        <div className="rounded-md border">
          <div className="flex items-center justify-center h-[400px] text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold">No universities found</p>
              <p className="text-muted-foreground">Get started by adding your first university.</p>
              {onAdd && (
                <Button 
                  onClick={onAdd} 
                  className="mt-4 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create University
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
      {/* Header with Search and Add Button */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search universities..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-8 w-[300px]"
          />
        </div>
        {onAdd && (
          <Button 
            onClick={onAdd}
            className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create University
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead> {/* Expand column */}
              <TableHead className="w-[80px]">
                <SortButton column="id">ID</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="name">University Name</SortButton>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortButton column="country">Country</SortButton>
              </TableHead>
              <TableHead className="w-[100px]">Locations</TableHead>
              <TableHead className="w-[140px]">
                <SortButton column="ranking">Ranking</SortButton>
              </TableHead>
              <TableHead className="w-[160px]">
                <SortButton column="jobSuccessRatio">Placement Rate</SortButton>
              </TableHead>
              <TableHead className="w-[120px]">Website</TableHead>
              <TableHead className="w-[120px]">LinkedIn</TableHead>
              <TableHead className="w-[60px]" title="View University Graduates">Graduates</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUniversities.map((university) => {
              const isExpanded = expandedUniversities.has(university.id)
              return (
                <React.Fragment key={university.id}>
                  {/* University Master Row */}
                  <TableRow 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedUniversity(university)}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleUniversityExpanded(university.id)
                        }}
                      >
                        <ChevronRightIcon 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "transform rotate-90" : ""
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {university.id.split('-')[1]}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                        {university.name}
                      </div>
                    </TableCell>
                    <TableCell>{university.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        {university.locations.length} location{university.locations.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={UNIVERSITY_RANKING_COLORS[university.ranking]}
                      >
                        {UNIVERSITY_RANKING_LABELS[university.ranking]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const stats = calculateUniversityJobSuccessRatio(university)
                        if (stats.totalGraduates === 0) {
                          return <span className="text-muted-foreground text-sm">N/A</span>
                        }
                        return (
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">
                              {stats.successRatio.toFixed(1)}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {stats.successfulPlacements}/{stats.totalGraduates} graduates
                            </span>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      {university.websiteUrl ? (
                        <LinkButton href={university.websiteUrl}>
                          Website
                        </LinkButton>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {university.linkedinUrl ? (
                        <LinkButton href={university.linkedinUrl}>
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
                        className="h-8 w-8 p-0 transition-colors hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950 dark:hover:text-purple-400 cursor-pointer"
                        onClick={() => handleViewGraduates(university)}
                        title={`View graduates from ${university.name}`}
                      >
                        <GraduationCapIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUniversity(university)
                          }}
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onAddLocation && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAddLocation(university)
                                }}
                                className="cursor-pointer"
                              >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Location
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit?.(university)
                              }}
                              className="cursor-pointer"
                            >
                              <EditIcon className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(university)
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
                  {isExpanded && university.locations.map((location) => (
                    <TableRow key={location.id} className="bg-muted/30">
                      <TableCell></TableCell> {/* Empty expand column */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {location.id.split('-')[2]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 pl-6">
                          <MapPinIcon className="h-4 w-4 text-blue-500" />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{location.city}</span>
                            <span className="text-xs text-muted-foreground">{location.address}</span>
                          </div>
                          {location.isMainCampus && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Main Campus
                            </Badge>
                          )}
                        </div>
                      </TableCell>
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
                            <DropdownMenuLabel>Location Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onEditLocation && (
                              <DropdownMenuItem onClick={() => onEditLocation(location)}>
                                <EditIcon className="mr-2 h-4 w-4" />
                                Edit Location
                              </DropdownMenuItem>
                            )}
                            {onDeleteLocation && (
                              <DropdownMenuItem
                                onClick={() => onDeleteLocation(location)}
                                className="text-red-600"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Delete Location
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
                      <TableCell></TableCell> {/* Empty ID column */}
                      <TableCell>
                        <div className="flex items-center gap-2 pl-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddLocation(university)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Add location to {university.name}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell colSpan={7} className="text-muted-foreground text-sm"></TableCell>
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
        Showing {startIndex + 1} to {Math.min(endIndex, sortedUniversities.length)} of{" "}
        {sortedUniversities.length} entries
        {searchQuery && ` (filtered from ${universities.length} total entries)`}
      </div>

      {/* University Detail Modal */}
      {selectedUniversity && (
        <UniversityDetailsModal
          university={selectedUniversity}
          open={!!selectedUniversity}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUniversity(null)
            }
          }}
          onEdit={onEdit ? (university) => {
            setSelectedUniversity(null) // Close detail modal
            onEdit(university)
          } : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{universityToDelete?.name}</strong> and all its campus locations. This action cannot be undone.
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
