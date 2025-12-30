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
  ShieldCheck,
  Pencil,
  Check,
  Save,
  X,
  Loader2,
  ChevronsUpDown,
  CalendarIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { FieldHistoryPopover } from "@/components/ui/field-history-popover"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
  Project,
  PROJECT_STATUS_LABELS,
  ProjectStatus,
} from "@/lib/types/project"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { sampleProjects } from "@/lib/sample-data/projects"
import { 
  getVerificationsForProject,
  calculateProjectVerificationSummary,
  getProjectAuditLogsForVerification,
  sampleVerificationUsers 
} from "@/lib/sample-data/verification"

// Utility functions
const formatDate = (date: Date | undefined) => {
  if (!date) return "Ongoing"
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Validation functions
const validateURL = (url: string): string | null => {
  if (!url) return null // Optional field
  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL format'
  }
}

const validateTeamSize = (size: string): string | null => {
  if (!size) return null // Optional
  
  // Check if single number
  if (/^\d+$/.test(size)) {
    const num = parseInt(size)
    if (num < 1) return 'Team size must be at least 1'
    if (num > 1000) return 'Team size seems too large'
    return null
  }
  
  // Check if range (e.g., "20-30")
  const rangeMatch = size.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const [, min, max] = rangeMatch
    const minNum = parseInt(min)
    const maxNum = parseInt(max)
    
    if (minNum >= maxNum) {
      return 'Maximum must be greater than minimum'
    }
    if (minNum < 1) {
      return 'Team size must be at least 1'
    }
    if (maxNum > 1000) {
      return 'Team size seems too large'
    }
    return null
  }
  
  return 'Invalid format. Use "5" or "20-30"'
}

const validateNotes = (notes: string): string | null => {
  if (notes.length > 500) {
    return 'Notes must be less than 500 characters'
  }
  return null
}

// Extract unique project types
const extractUniqueProjectTypes = (): string[] => {
  const types = new Set<string>()
  sampleProjects.forEach(project => {
    types.add(project.projectType)
  })
  return Array.from(types).sort()
}

// Extract unique employers from sample projects
const extractUniqueEmployers = (): string[] => {
  const employers = new Set<string>()
  sampleProjects.forEach(project => {
    if (project.employerName) {
      employers.add(project.employerName)
    }
  })
  return Array.from(employers).sort()
}

// Project type options
const projectTypeOptions = extractUniqueProjectTypes().map(type => ({
  label: type,
  value: type
}))

// Employer options
const employerOptions = extractUniqueEmployers().map(employer => ({
  label: employer,
  value: employer
}))

// Extract unique tech stacks
const extractUniqueTechStacks = (): string[] => {
  const techStacks = new Set<string>()
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  return Array.from(techStacks).sort()
}

// Extract unique vertical domains
const extractUniqueVerticalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.verticalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

// Extract unique horizontal domains
const extractUniqueHorizontalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.horizontalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

// Extract unique technical aspects
const extractUniqueTechnicalAspects = (): string[] => {
  const aspects = new Set<string>()
  sampleProjects.forEach(project => {
    project.technicalAspects.forEach(aspect => aspects.add(aspect))
  })
  return Array.from(aspects).sort()
}

// Multi-select options
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

// Status options
const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  label,
  value: value as ProjectStatus
}))

interface ProjectsTableProps {
  projects: Project[]
  isLoading?: boolean
  onAdd?: () => void
  onView?: (project: Project) => void
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onVerify?: (project: Project) => void
}

type SortKey = keyof Project
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

// Helper function to calculate team size for a project
const calculateTeamSize = (projectName: string): number => {
  return sampleCandidates.filter(candidate => {
    // Check work experience projects
    const workExperienceProjects = candidate.workExperiences?.flatMap(we => 
      we.projects.map(p => p.projectName)
    ) || []
    // Check standalone projects
    const standaloneProjects = candidate.projects?.map(p => p.projectName) || []
    // Combine both
    const candidateProjects = [...workExperienceProjects, ...standaloneProjects]
    // Check if this candidate has the project
    return candidateProjects.some(proj => 
      proj.toLowerCase() === projectName.toLowerCase()
    )
  }).length
}

export function ProjectsTable({
  projects,
  isLoading = false,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onVerify,
}: ProjectsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("projectName")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      // Call onDelete if provided, otherwise just show toast
      onDelete?.(projectToDelete)
      
      // Show success toast
      toast.success(`Project "${projectToDelete.projectName}" has been deleted successfully.`)
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  // Filtering (including all project data)
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects

    return projects.filter(
      (project) =>
        project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.employerName !== null && project.employerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
              <TableRow 
                key={project.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
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
                    {calculateTeamSize(project.projectName) || project.teamSize || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewTeam(project)
                    }}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProject(project)
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
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
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit?.(project)
                          }}
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(project)
                          }}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
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
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProject(null)
            }
          }}
          onVerify={onVerify ? (project) => {
            setSelectedProject(null) // Close detail dialog
            onVerify(project)
          } : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{projectToDelete?.projectName}</strong>. This action cannot be undone.
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
    </>
  )
}

// Inline Edit Field Component
interface InlineEditFieldProps {
  label: string
  value: string | number | null | undefined
  fieldName: string
  fieldType: 'text' | 'number' | 'url' | 'select'
  options?: { label: string; value: string }[]
  validation?: (value: string) => string | null
  onSave: (fieldName: string, newValue: string | number, verify: boolean) => Promise<void>
  placeholder?: string
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  label,
  value,
  fieldName,
  fieldType,
  options,
  validation,
  onSave,
  placeholder,
  getFieldVerification,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value !== null && value !== undefined ? String(value) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(true)
  
  const verificationStatus = getFieldVerification?.(fieldName)
  
  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(true)
    setError(null)
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(true)
    setError(null)
  }
  
  const handleSave = async () => {
    // Validate
    if (validation) {
      const validationError = validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    
    // No change
    if (editValue === (value !== null && value !== undefined ? String(value) : '')) {
      setIsEditing(false)
      return
    }
    
    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }
  
  const displayValue = (() => {
    // Check if value is null, undefined, or empty string
    const isEmpty = value === null || value === undefined || String(value).trim() === ''
    
    if (isEmpty) {
      // Special case: show "Not Linked" for employer field
      if (fieldName === 'employerName') {
        return 'Not Linked'
      }
      // Default: show "N/A" for other fields
      return 'N/A'
    }
    
    return String(value)
  })()
  
  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verification = getFieldVerification?.(fName)
    const status = verification || 'unverified'
    
    return (
      <div className="flex items-center gap-1 shrink-0">
        <VerificationBadge 
          status={status}
          size="sm"
        />
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-1 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <VerificationIndicator fieldName={fieldName} />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              type="button"
              title="Edit field"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              {fieldType === 'select' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between", error && "border-red-500")}
                      disabled={isSaving}
                    >
                      {editValue
                        ? options?.find((option) => option.value === editValue)?.label
                        : placeholder || "Select option..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />
                      <CommandList>
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup>
                          {options?.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={(currentValue) => {
                                setEditValue(currentValue === editValue ? "" : currentValue)
                              }}
                              className="cursor-pointer"
                            >
                              {option.label}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  editValue === option.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  type={fieldType}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={cn("text-sm", error && "border-red-500")}
                  autoFocus
                  disabled={isSaving}
                />
              )}
              
              {/* Mark as verified checkbox */}
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id={`verify-${fieldName}`}
                  checked={willVerify}
                  onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`verify-${fieldName}`}
                  className={cn(
                    "text-xs cursor-pointer",
                    willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                  )}
                >
                  {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
                </Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`text-sm ${
            (value === null || value === undefined || String(value).trim() === '') 
              ? 'text-muted-foreground italic' 
              : ''
          }`}>
            {displayValue}
          </span>
        </div>
      )}
    </div>
  )
}

// Inline Edit Date Field Component
interface InlineEditDateFieldProps {
  label: string
  value: Date | null | undefined
  fieldName: string
  onSave: (fieldName: string, newValue: Date | null | undefined, verify: boolean) => Promise<void>
  placeholder?: string
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
  otherDate?: Date | null | undefined // For date range validation (e.g., endDate for startDate validation)
  otherDateFieldName?: string // Name of the other date field for error messages
  validateDateRange?: (date: Date | null | undefined, otherDate: Date | null | undefined, fieldName: string) => string | null
}

const InlineEditDateField: React.FC<InlineEditDateFieldProps> = ({
  label,
  value,
  fieldName,
  onSave,
  placeholder,
  getFieldVerification,
  className,
  otherDate,
  otherDateFieldName,
  validateDateRange
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<Date | null | undefined>(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(true)
  const [open, setOpen] = useState(false)
  
  const verificationStatus = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verificationStatus === 'verified'
  
  // Update editValue when value prop changes (but not when editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])
  
  // Initialize willVerify based on current verification status when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])
  
  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
    setError(null)
    setOpen(false)
  }
  
  const handleSave = async () => {
    // Validate date range if validation function provided
    if (validateDateRange) {
      const validationError = validateDateRange(editValue, otherDate, fieldName)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    
    // No change check
    const verificationChanged = willVerify !== isCurrentlyVerified
    const dateChanged = editValue?.getTime() !== value?.getTime()
    if (!dateChanged && !verificationChanged) {
      setIsEditing(false)
      setOpen(false)
      return
    }
    
    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
      setOpen(false)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  
  const displayValue = value ? formatDate(value) : (fieldName === 'endDate' ? 'Ongoing' : 'N/A')
  
  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verification = getFieldVerification?.(fName)
    const status = verification || 'unverified'
    
    return (
      <div className="flex items-center gap-1 shrink-0">
        <VerificationBadge 
          status={status}
          size="sm"
        />
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-1 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <VerificationIndicator fieldName={fieldName} />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              type="button"
              title="Edit field"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-between font-normal", error && "border-red-500")}
                    disabled={isSaving}
                  >
                    {editValue 
                      ? editValue.toLocaleDateString()
                      : placeholder || `Select ${label.toLowerCase()}`}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editValue || undefined}
                    onSelect={(date) => {
                      setEditValue(date || null)
                      setOpen(false)
                    }}
                    captionLayout="dropdown"
                    disabled={isSaving}
                  />
                </PopoverContent>
              </Popover>
              
              {/* Mark as verified checkbox */}
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id={`verify-${fieldName}`}
                  checked={willVerify}
                  onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`verify-${fieldName}`}
                  className={cn(
                    "text-xs cursor-pointer",
                    willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                  )}
                >
                  {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
                </Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`text-sm ${
            (value === null || value === undefined || String(value).trim() === '') 
              ? 'text-muted-foreground italic' 
              : ''
          }`}>
            {displayValue}
          </span>
        </div>
      )}
    </div>
  )
}

// Inline Editable Multi-Select Component
interface InlineEditableMultiSelectProps {
  label: string
  value: string[]
  fieldName: string
  options: MultiSelectOption[]
  onSave: (fieldName: string, newValue: string[], shouldVerify: boolean) => Promise<void>
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
  placeholder?: string
  searchPlaceholder?: string
  badgeColorClass?: string
  maxDisplay?: number
}

const InlineEditableMultiSelect: React.FC<InlineEditableMultiSelectProps> = ({
  label,
  value,
  fieldName,
  options,
  onSave,
  getFieldVerification,
  className = "",
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  badgeColorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  maxDisplay = 4
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string[]>(value || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verificationStatus = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verificationStatus === 'verified'

  // Update editValue when value prop changes (but not when editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value || [])
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || []
    const verificationChanged = willVerify !== isCurrentlyVerified
    const arraysEqual = currentValue.length === editValue.length && 
      currentValue.every((val, idx) => val === editValue[idx])
    
    if (arraysEqual && !verificationChanged) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verification = getFieldVerification?.(fName)
    const status = verification || 'unverified'
    
    return (
      <div className="flex items-center gap-1 shrink-0">
        <VerificationBadge 
          status={status}
          size="sm"
        />
      </div>
    )
  }

  const displayItems = value || []
  const shouldTruncate = displayItems.length > maxDisplay
  const displayItemsToShow = shouldTruncate && !isExpanded 
    ? displayItems.slice(0, maxDisplay)
    : displayItems
  const remainingCount = shouldTruncate && !isExpanded 
    ? displayItems.length - maxDisplay
    : 0

  if (isEditing) {
    return (
      <div className={cn("space-y-3 py-3 px-3 rounded-md bg-muted/30 border", className)}>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        </div>
        <div className="space-y-3">
          <div className="w-full">
            <MultiSelect
              items={options}
              selected={editValue}
              onChange={(values) => setEditValue(values)}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              maxDisplay={maxDisplay}
            />
          </div>
          
          {/* Mark as verified checkbox */}
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
              )}
            >
              {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
            </Label>
          </div>
          
          <div className="flex gap-1 shrink-0">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1 shrink-0">
          <VerificationIndicator fieldName={fieldName} />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title="Edit field"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {displayItems.length > 0 ? (
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {displayItemsToShow.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className={cn(badgeColorClass, "text-xs")}
            >
              {item}
            </Badge>
          ))}
          {remainingCount > 0 && !isExpanded && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsExpanded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsExpanded(true)
                }
              }}
            >
              +{remainingCount} more
            </Badge>
          )}
          {isExpanded && shouldTruncate && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsExpanded(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsExpanded(false)
                }
              }}
            >
              Show less
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No items selected</p>
      )}
    </div>
  )
}

// Date range validation function
const validateDateRange = (
  date: Date | null | undefined, 
  otherDate: Date | null | undefined, 
  fieldName: string
): string | null => {
  if (!date || !otherDate) return null // Allow empty dates
  
  if (fieldName === 'startDate' && otherDate && date > otherDate) {
    return 'Start date must be before end date'
  }
  
  if (fieldName === 'endDate' && otherDate && date < otherDate) {
    return 'End date must be after start date'
  }
  
  return null
}

// Inline Editable Textarea Component for long text fields
interface InlineEditableTextareaProps {
  label: string
  value: string | null | undefined
  fieldName: string
  onSave: (fieldName: string, newValue: string, shouldVerify: boolean) => Promise<void>
  maxLength?: number
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
  placeholder?: string
}

const InlineEditableTextarea: React.FC<InlineEditableTextareaProps> = ({
  label,
  value,
  fieldName,
  onSave,
  maxLength = 150,
  getFieldVerification,
  className = "",
  placeholder
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verificationStatus = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verificationStatus === 'verified'

  // Update editValue when value prop changes (but not when editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '')
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || ''
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Shift+Enter for new lines, but Ctrl/Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const displayText = value || ''
  const shouldTruncate = displayText.length > maxLength
  const truncatedText = shouldTruncate && !isExpanded 
    ? `${displayText.slice(0, maxLength)}...` 
    : displayText

  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verification = getFieldVerification?.(fName)
    const status = verification || 'unverified'
    
    return (
      <div className="flex items-center gap-1 shrink-0">
        <VerificationBadge 
          status={status}
          size="sm"
        />
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-2 py-2 px-3 rounded-md", className)}>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Textarea
                value={editValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn("min-h-[120px] resize-none text-sm", error && "border-red-500")}
                autoFocus
                disabled={isSaving}
                placeholder={placeholder}
              />
              
              {/* Mark as verified checkbox */}
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id={`verify-${fieldName}`}
                  checked={willVerify}
                  onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`verify-${fieldName}`}
                  className={cn(
                    "text-xs cursor-pointer",
                    willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                  )}
                >
                  {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
                </Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1 shrink-0">
          <VerificationIndicator fieldName={fieldName} />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title="Edit field"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {displayText ? (
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {truncatedText}
          </p>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 h-7 text-xs"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No description provided</p>
      )}
    </div>
  )
}

// Project Detail Dialog Component
interface ProjectDetailDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify?: (project: Project) => void
}

function ProjectDetailDialog({ project, open, onOpenChange, onVerify }: ProjectDetailDialogProps) {
  // Local state for project data (for optimistic updates)
  const [localProject, setLocalProject] = useState<Project>(project)
  
  // Update local project when prop changes
  React.useEffect(() => {
    setLocalProject(project)
  }, [project])
  
  // Get verification data for this project
  const verifications = useMemo(() => 
    getVerificationsForProject(localProject.id),
    [localProject.id]
  )
  
  const verificationSummary = useMemo(() => 
    calculateProjectVerificationSummary(localProject.id),
    [localProject.id]
  )

  // Helper to get verification status for a field
  const getFieldVerification = (fieldName: string): 'verified' | 'unverified' | undefined => {
    const verification = verifications.find(v => v.fieldName === fieldName)
    return verification?.status as 'verified' | 'unverified' | undefined
  }
  
  // Helper to get audit history for a field
  const getFieldHistory = (fieldName: string) => {
    const verification = verifications.find(v => v.fieldName === fieldName)
    if (!verification) return []
    return getProjectAuditLogsForVerification(verification.id)
  }
  
  // Get user name from ID
  const getVerifiedByName = (userId: string | undefined) => {
    if (!userId) return undefined
    const user = sampleVerificationUsers.find(u => u.id === userId)
    return user?.name
  }

  // Handle field save
  const handleFieldSave = async (fieldName: string, newValue: string | number | Date | string[] | null | undefined, verify: boolean) => {
    try {
      // Optimistic update
      setLocalProject(prev => ({
        ...prev,
        [fieldName]: newValue
      }))
      
      // TODO: API call to save field
      // await updateProjectField(project.id, fieldName, newValue, verify)
      
      toast.success(`${fieldName} updated${verify ? ' and verified' : ''}`)
    } catch (error) {
      // Revert on error
      setLocalProject(project)
      toast.error('Failed to save field')
      throw error
    }
  }
  
  // Handle date field save (wrapper for type safety)
  const handleDateFieldSave = async (fieldName: string, newValue: Date | null | undefined, verify: boolean) => {
    await handleFieldSave(fieldName, newValue, verify)
  }
  
  // Handle multi-select field save (wrapper for type safety)
  const handleMultiSelectFieldSave = async (fieldName: string, newValue: string[], verify: boolean) => {
    await handleFieldSave(fieldName, newValue, verify)
  }

  // Verification indicator component - shows badge and history together
  const VerificationIndicator = ({ 
    fieldName: fName, 
    className = "",
    getFieldVerification: getVerification
  }: { 
    fieldName: string
    className?: string
    getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  }) => {
    const verification = verifications.find(v => v.fieldName === fName)
    const history = getFieldHistory(fName)
    
    // If no verification data exists, show unverified badge
    const status = verification?.status || 'unverified'
    
    return (
      <div className={`flex items-center gap-1 shrink-0 ${className}`}>
        <VerificationBadge 
          status={status}
          source={verification?.source}
          verifiedBy={getVerifiedByName(verification?.verifiedBy)}
          verifiedAt={verification?.verifiedAt}
          size="sm"
        />
        {history.length > 0 && (
          <FieldHistoryPopover 
            fieldName={fName}
            history={history}
          />
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <TagIcon className="h-5 w-5 text-blue-600" />
              {project.projectName}
            </DialogTitle>
            <div className="flex gap-2 mr-8">
              {onVerify && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => onVerify(project)}
                  className="gap-1.5"
                >
                  Edit & Verify
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Verification Summary Bar */}
          {verificationSummary && verificationSummary.totalFields > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
              <ShieldCheck className="size-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">Data Verification</span>
                  <Badge variant={verificationSummary.verificationPercentage === 100 ? 'default' : 'secondary'}>
                    {verificationSummary.verificationPercentage}% Verified
                  </Badge>
                </div>
                <Progress value={verificationSummary.verificationPercentage} className="h-2" />
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{verificationSummary.verifiedFields} verified</span>
                  <span>{verificationSummary.unverifiedFields} unverified</span>
                </div>
              </div>
            </div>
          )}

          {/* Project Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <InlineEditField
                label="Employer"
                value={localProject.employerName || ""}
                fieldName="employerName"
                fieldType="select"
                options={employerOptions}
                onSave={handleFieldSave}
                placeholder="Select employer..."
                getFieldVerification={getFieldVerification}
              />
              
              <InlineEditField
                label="Project Type"
                value={localProject.projectType}
                fieldName="projectType"
                fieldType="select"
                options={projectTypeOptions}
                onSave={handleFieldSave}
                getFieldVerification={getFieldVerification}
              />
              
              <InlineEditField
                label="Team Size"
                value={calculateTeamSize(localProject.projectName) || localProject.teamSize || ""}
                fieldName="teamSize"
                fieldType="text"
                validation={validateTeamSize}
                onSave={handleFieldSave}
                placeholder="e.g., 5 or 20-30"
                getFieldVerification={getFieldVerification}
              />
              
              <InlineEditField
                label="Status"
                value={localProject.status}
                fieldName="status"
                fieldType="select"
                options={statusOptions}
                onSave={handleFieldSave}
                getFieldVerification={getFieldVerification}
              />
            </div>

            <div className="space-y-1">
              <InlineEditDateField
                label="Start Date"
                value={localProject.startDate}
                fieldName="startDate"
                onSave={handleDateFieldSave}
                placeholder="Select start date"
                getFieldVerification={getFieldVerification}
                otherDate={localProject.endDate}
                otherDateFieldName="endDate"
                validateDateRange={validateDateRange}
              />
              
              <InlineEditDateField
                label="End Date"
                value={localProject.endDate}
                fieldName="endDate"
                onSave={handleDateFieldSave}
                placeholder="Select end date"
                getFieldVerification={getFieldVerification}
                otherDate={localProject.startDate}
                otherDateFieldName="startDate"
                validateDateRange={validateDateRange}
              />
              
              <div className="space-y-2">
                <InlineEditField
                  label="Project Link"
                  value={localProject.projectLink || ""}
                  fieldName="projectLink"
                  fieldType="url"
                  validation={validateURL}
                  onSave={handleFieldSave}
                  placeholder="https://example.com"
                  getFieldVerification={getFieldVerification}
                />
                {localProject.projectLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => localProject.projectLink && window.open(localProject.projectLink, '_blank')}
                    className="h-7 text-xs"
                  >
                    <ExternalLinkIcon className="h-3 w-3 mr-1" />
                    Visit Project
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tech Stacks & Domains */}
          <div className="space-y-6">
            <InlineEditableMultiSelect
              label="Technology Stack"
              value={localProject.techStacks || []}
              fieldName="techStacks"
              options={techStackOptions}
              onSave={handleMultiSelectFieldSave}
              getFieldVerification={getFieldVerification}
              placeholder="Select technologies..."
              searchPlaceholder="Search technologies..."
              badgeColorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              maxDisplay={4}
            />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InlineEditableMultiSelect
                  label="Vertical Domains"
                  value={localProject.verticalDomains || []}
                  fieldName="verticalDomains"
                  options={verticalDomainOptions}
                  onSave={handleMultiSelectFieldSave}
                  getFieldVerification={getFieldVerification}
                  placeholder="Select vertical domains..."
                  searchPlaceholder="Search vertical domains..."
                  badgeColorClass="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  maxDisplay={4}
                />

                <InlineEditableMultiSelect
                  label="Horizontal Domains"
                  value={localProject.horizontalDomains || []}
                  fieldName="horizontalDomains"
                  options={horizontalDomainOptions}
                  onSave={handleMultiSelectFieldSave}
                  getFieldVerification={getFieldVerification}
                  placeholder="Select horizontal domains..."
                  searchPlaceholder="Search horizontal domains..."
                  badgeColorClass="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  maxDisplay={4}
                />
              </div>

              <InlineEditableMultiSelect
                label="Technical Aspects"
                value={localProject.technicalAspects || []}
                fieldName="technicalAspects"
                options={technicalAspectOptions}
                onSave={handleMultiSelectFieldSave}
                getFieldVerification={getFieldVerification}
                placeholder="Select technical aspects..."
                searchPlaceholder="Search technical aspects..."
                badgeColorClass="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                maxDisplay={4}
              />
            </div>
          </div>

          {/* Description */}
          <InlineEditableTextarea
            label="Description"
            value={localProject.description || ""}
            fieldName="description"
            onSave={async (fieldName, newValue, verify) => {
              await handleFieldSave(fieldName, newValue, verify)
            }}
            maxLength={150}
            getFieldVerification={getFieldVerification}
            placeholder="Provide a detailed description of the project, its goals, and key features..."
          />

          {/* Notes */}
          <div className="py-2 px-3 rounded-md">
            <InlineEditField
              label="Notes"
              value={localProject.notes || ""}
              fieldName="notes"
              fieldType="text"
              validation={validateNotes}
              onSave={handleFieldSave}
              placeholder="Additional notes about the project"
              getFieldVerification={getFieldVerification}
            />
            {localProject.notes && (
              <div className="rounded-lg bg-muted/50 p-4 mt-2">
                <p className="text-sm leading-relaxed">{localProject.notes}</p>
              </div>
            )}
          </div>

          {/* Project Metadata */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>Created: {project.createdAt.toLocaleDateString()}</div>
              <div>Updated: {project.updatedAt.toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
