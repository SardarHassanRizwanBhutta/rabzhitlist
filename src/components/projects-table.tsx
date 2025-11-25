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
  UsersIcon,
  TagIcon,
  ExternalLinkIcon,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import {
  Project,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
} from "@/lib/types/project"

// Utility functions
const formatDate = (date: Date | undefined) => {
  if (!date) return "Ongoing"
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface ProjectsTableProps {
  projects: Project[]
  isLoading?: boolean
  onAdd?: () => void
  onView?: (project: Project) => void
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
}

type SortKey = keyof Project
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

export function ProjectsTable({
  projects,
  isLoading = false,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: ProjectsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("projectName")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Filtering (including all project data)
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects

    return projects.filter(
      (project) =>
        project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.employerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.teamSize !== null && project.teamSize.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.description !== null && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.techStacks.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.verticalDomains.some(domain => domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.horizontalDomains.some(domain => domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.technicalAspects.some(aspect => aspect.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [projects, searchQuery])

  // Sorting
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue === bValue) return 0

      let comparison = 0
      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredProjects, sortKey, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProjects = sortedProjects.slice(startIndex, endIndex)

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

  const handleViewTeam = (project: Project) => {
    // Navigate to candidates page with project filter
    const params = new URLSearchParams({
      projectFilter: project.projectName,
      projectId: project.id
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


  const renderTags = (tags: string[], maxDisplay: number = 2, colorClass?: string) => {
    const displayTags = tags.slice(0, maxDisplay)
    const remainingCount = tags.length - maxDisplay

    return (
      <div className="flex flex-wrap gap-1">
        {displayTags.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className={`text-xs ${colorClass || ""}`}
          >
            {tag}
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount} more
          </Badge>
        )}
      </div>
    )
  }

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

  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          {onAdd && (
            <Button onClick={onAdd}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          )}
        </div>
        <div className="rounded-md border">
          <div className="flex items-center justify-center h-[400px] text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold">No projects found</p>
              <p className="text-muted-foreground">Get started by adding your first project.</p>
              {onAdd && (
                <Button 
                  onClick={onAdd} 
                  className="mt-4 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton column="projectName">Project Name</SortButton>
              </TableHead>
              <TableHead className="w-[140px]">
                <SortButton column="employerName">Employer</SortButton>
              </TableHead>
              <TableHead className="w-[180px]">Tech Stacks</TableHead>
              <TableHead className="w-[160px]">Horizontal Domains</TableHead>
              <TableHead className="w-[160px]">Vertical Domains</TableHead>
              <TableHead className="w-[180px]">Technical Aspects</TableHead>
              <TableHead className="w-[100px]">
                <SortButton column="teamSize">Team Size</SortButton>
              </TableHead>
              <TableHead className="w-[60px]" title="View Team Members">Team</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.projectName}</TableCell>
                <TableCell>{project.employerName}</TableCell>
                <TableCell>
                  {renderTags(project.techStacks, 2, "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200")}
                </TableCell>
                <TableCell>
                  {renderTags(project.horizontalDomains, 2, "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200")}
                </TableCell>
                <TableCell>
                  {renderTags(project.verticalDomains, 2, "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200")}
                </TableCell>
                <TableCell>
                  {renderTags(project.technicalAspects, 2, "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-3 w-3 text-muted-foreground" />
                    {project.teamSize}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 cursor-pointer"
                    onClick={() => handleViewTeam(project)}
                    title={`View team members for ${project.projectName}`}
                  >
                    <UsersIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedProject(project)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(project)}>
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(project)}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            Edit Project
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(project)}
                            className="text-red-600"
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
        Showing {startIndex + 1} to {Math.min(endIndex, sortedProjects.length)} of{" "}
        {sortedProjects.length} entries
        {searchQuery && ` (filtered from ${projects.length} total entries)`}
      </div>

      {/* Project Detail Dialog */}
      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  )
}

// Project Detail Dialog Component
interface ProjectDetailDialogProps {
  project: Project
  open: boolean
  onClose: () => void
}

function ProjectDetailDialog({ project, open, onClose }: ProjectDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TagIcon className="h-5 w-5 text-blue-600" />
            {project.projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Project Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Employer</Label>
                <p className="text-base font-medium">{project.employerName}</p>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Project Type</Label>
                <Badge variant="outline" className="mt-1">
                  {project.projectType}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Team Size</Label>
                <div className="flex items-center gap-2 mt-1">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base">{project.teamSize} members</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge
                    variant="secondary"
                    className={PROJECT_STATUS_COLORS[project.status]}
                  >
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Timeline</Label>
                <div className="space-y-1 mt-1">
                  <p className="text-sm">Started: {formatDate(project.startDate ?? undefined)}</p>
                  <p className="text-sm">
                    {project.endDate ? `Ended: ${formatDate(project.endDate)}` : "Ongoing"}
                  </p>
                </div>
              </div>

              {project.projectLink && (
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Project Link</Label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => project.projectLink && window.open(project.projectLink, '_blank')}
                      className="h-8"
                    >
                      <ExternalLinkIcon className="h-3 w-3 mr-2" />
                      Visit Project
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tech Stacks & Domains */}
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
                Technology Stack
              </Label>
              <div className="flex flex-wrap gap-2">
                {project.techStacks.map((tech, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
                  Vertical Domains
                </Label>
                <div className="flex flex-wrap gap-2">
                  {project.verticalDomains.map((domain, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
                  Horizontal Domains
                </Label>
                <div className="flex flex-wrap gap-2">
                  {project.horizontalDomains.map((domain, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    >
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
                  Technical Aspects
                </Label>
                <div className="flex flex-wrap gap-2">
                  {project.technicalAspects.map((aspect, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    >
                      {aspect}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
              Description
            </Label>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed">{project.description}</p>
            </div>
          </div>

          {/* Notes */}
          {project.notes && (
            <div>
              <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
                Notes
              </Label>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm leading-relaxed">{project.notes}</p>
              </div>
            </div>
          )}

          {/* Project Metadata */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>Created: {project.createdAt.toLocaleDateString()}</div>
              <div>Updated: {project.updatedAt.toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
