"use client"

import * as React from "react"
import { MoreHorizontal, Eye, Edit, ChevronUp, ChevronDown, User, Trash2, Target, Check, FileText, FolderOpen, Building2, GraduationCap, Award, Info } from "lucide-react"
import { toast } from "sonner"

import { Candidate, CANDIDATE_STATUS_COLORS, CANDIDATE_STATUS_LABELS } from "@/lib/types/candidate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { CandidateDetailsModal } from "@/components/candidate-details-modal"
import { CandidateCreationDialog, CandidateFormData } from "@/components/candidate-creation-dialog"
import { CandidateFilters } from "@/components/candidates-filter-dialog"
import { 
  getCandidateMatchContext, 
  hasActiveFilters,
} from "@/lib/utils/candidate-matches"

import { calculateDataCompletion } from "@/lib/utils/data-completion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CandidatesTableProps {
  candidates: Candidate[]
  filters?: CandidateFilters
}

type SortDirection = "asc" | "desc" | null
type SortableColumn = "name" | "jobTitle" | "expectedSalary" | "city" | "status" | "yearsOfExperience" | "avgTenure"

// Helper function to get job title from first work experience
const getJobTitle = (candidate: Candidate): string => {
  return candidate.workExperiences?.[0]?.jobTitle || "N/A"
}

// Helper function to calculate total years of experience from work experiences
const calculateYearsOfExperience = (candidate: Candidate): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  const today = new Date()
  let totalMonths = 0

  candidate.workExperiences.forEach(we => {
    if (!we.startDate) return

    const startDate = new Date(we.startDate)
    const endDate = we.endDate ? new Date(we.endDate) : today

    // Calculate months between start and end
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthsDiff = endDate.getMonth() - startDate.getMonth()
    const totalMonthsForThisJob = yearsDiff * 12 + monthsDiff

    // Add days for more precision (approximate)
    const daysDiff = endDate.getDate() - startDate.getDate()
    const approximateMonths = totalMonthsForThisJob + (daysDiff / 30)

    if (approximateMonths > 0) {
      totalMonths += approximateMonths
    }
  })

  // Convert to years (with 1 decimal place precision)
  const totalYears = totalMonths / 12
  return Math.round(totalYears * 10) / 10 // Round to 1 decimal place
}

// Helper function to calculate average job tenure across all employers
const calculateCandidateAverageTenure = (candidate: Candidate): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  const today = new Date()
  const employerTenures: number[] = []

  // Group work experiences by employer to calculate tenure per employer
  const employerMap = new Map<string, { startDate: Date | null, endDate: Date | null }>()

  candidate.workExperiences.forEach(we => {
    const employerName = we.employerName.toLowerCase().trim()
    const startDate = we.startDate ? new Date(we.startDate) : null
    const endDate = we.endDate ? new Date(we.endDate) : null

    if (!employerMap.has(employerName)) {
      employerMap.set(employerName, { startDate: null, endDate: null })
    }

    const existing = employerMap.get(employerName)!

    // Update start date (earliest)
    if (startDate && (!existing.startDate || startDate < existing.startDate)) {
      existing.startDate = startDate
    }

    // Update end date (latest)
    if (endDate && (!existing.endDate || endDate > existing.endDate)) {
      existing.endDate = endDate
    } else if (!endDate && !existing.endDate) {
      // Current job
      existing.endDate = today
    }
  })

  // Calculate tenure for each employer
  employerMap.forEach(({ startDate, endDate }) => {
    if (startDate && endDate) {
      // Calculate tenure in years
      const tenureMs = endDate.getTime() - startDate.getTime()
      const tenureYears = tenureMs / (1000 * 60 * 60 * 24 * 365.25)

      if (tenureYears > 0) {
        employerTenures.push(tenureYears)
      }
    }
  })

  // Calculate average across all employers
  if (employerTenures.length === 0) {
    return 0
  }

  const totalTenure = employerTenures.reduce((sum, tenure) => sum + tenure, 0)
  return Math.round((totalTenure / employerTenures.length) * 10) / 10 // Round to 1 decimal place
}

const defaultFilters: CandidateFilters = {
  basicInfoSearch: "",
  postingTitle: "",
  cities: [],
  excludeCities: [],
  status: [],
  currentSalaryMin: "",
  currentSalaryMax: "",
  expectedSalaryMin: "",
  expectedSalaryMax: "",
  employers: [],
  projects: [],
  projectStatus: [],
  projectTypes: [],
  techStacks: [],
  clientLocations: [],
  minClientLocationCount: "",
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  candidateTechStacks: [],
  candidateTechStacksRequireAll: false,
  candidateTechStacksRequireInBoth: false,
  techStackMinYears: {
    techStacks: [],
    minYears: ""
  },
  candidateDomains: [],
  shiftTypes: [],
  workModes: [],
  workModeMinYears: {
    workModes: [],
    minYears: ""
  },
  timeSupportZones: [],
  isCurrentlyWorking: null,
  workedWithTopDeveloper: null,
  workedWithTopDeveloperUseTolerance: true,  // Default: apply tolerance
  isTopDeveloper: null,
  jobTitle: "",
  yearsOfExperienceMin: "",
  yearsOfExperienceMax: "",
  avgJobTenureMin: "",
  avgJobTenureMax: "",
  joinedProjectFromStart: null,
  joinedProjectFromStartToleranceDays: 30,
  hasMutualConnectionWithDPL: null,
  mutualConnectionToleranceMonths: 0,
  mutualConnectionType: null,
  projectTeamSizeMin: "",
  projectTeamSizeMax: "",
  hasPublishedProject: null,
  publishPlatforms: [],
  minProjectDownloadCount: "",
  employerStatus: [],
  employerCountries: [],
  employerCities: [],
  employerTypes: [],
  careerTransitionFromType: [],
  careerTransitionToType: [],
  careerTransitionRequireCurrent: false,
  employerSalaryPolicies: [],
  employerSizeMin: "",
  employerSizeMax: "",
  employerRankings: [],
  universities: [],
  universityCountries: [],
  universityRankings: [],
  universityCities: [],
  degreeNames: [],
  majorNames: [],
  isTopper: null,
  isCheetah: null,
  educationEndDateStart: null,
  educationEndDateEnd: null,
  certificationNames: [],
  certificationIssuingBodies: [],
  certificationLevels: [],
  competitionPlatforms: [],
  internationalBugBountyOnly: false,
  personalityTypes: [],
  achievementTypes: [],
  achievementPlatforms: [],
  source: [],
  startDateStart: null,
  startDateEnd: null,
  verificationPercentageMin: "",
  verificationPercentageMax: "",
  dataProgressMin: "",
  dataProgressMax: "",
}

export function CandidatesTable({ candidates, filters = defaultFilters }: CandidatesTableProps) {
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null)
  const [sortColumn, setSortColumn] = React.useState<SortableColumn | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [candidateToDelete, setCandidateToDelete] = React.useState<Candidate | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [candidateToEdit, setCandidateToEdit] = React.useState<Candidate | null>(null)
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = React.useState<Map<string, Set<string>>>(new Map())

  const activeFilters = hasActiveFilters(filters)
  const hasAvgTenureFilter = !!(filters?.avgJobTenureMin || filters?.avgJobTenureMax)

  const handleEdit = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation()
    setCandidateToEdit(candidate)
    setEditDialogOpen(true)
  }

  const handleUpdateCandidate = async (formData: CandidateFormData) => {
    // TODO: Implement actual update API call
    console.log("Update candidate:", candidateToEdit?.id, formData)
    // For now, just close the dialog
    setEditDialogOpen(false)
    setCandidateToEdit(null)
  }

  const handleDeleteClick = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation()
    setCandidateToDelete(candidate)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (candidateToDelete) {
      // TODO: Implement actual delete API call
      console.log("Delete candidate:", candidateToDelete)
      
      // Show success toast
      toast.success(`Candidate ${candidateToDelete.name} has been deleted successfully.`)
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setCandidateToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setCandidateToDelete(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedCandidates = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return candidates

    return [...candidates].sort((a, b) => {
      let aValue: string | number | null
      let bValue: string | number | null

      // Handle jobTitle, yearsOfExperience, and avgTenure separately since they're not direct properties
      if (sortColumn === "jobTitle") {
        aValue = getJobTitle(a)
        bValue = getJobTitle(b)
      } else if (sortColumn === "yearsOfExperience") {
        aValue = calculateYearsOfExperience(a)
        bValue = calculateYearsOfExperience(b)
      } else if (sortColumn === "avgTenure") {
        aValue = calculateCandidateAverageTenure(a)
        bValue = calculateCandidateAverageTenure(b)
      } else {
        const sortKey = sortColumn as "name" | "expectedSalary" | "city" | "status"
        aValue = a[sortKey]
        bValue = b[sortKey]
      }

      // Handle null values - nulls should be sorted last
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      // At this point, both values are non-null
      let aCompare: string | number = aValue
      let bCompare: string | number = bValue

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aCompare = aValue.toLowerCase()
        bCompare = bValue.toLowerCase()
      }

      if (aCompare < bCompare) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (aCompare > bCompare) {
        return sortDirection === "asc" ? 1 : -1
      }
      return 0
    })
  }, [candidates, sortColumn, sortDirection])

  const SortIcon = ({ column }: { column: SortableColumn }) => {
    if (sortColumn !== column) return null
    if (sortDirection === "asc") return <ChevronUp className="size-4" />
    if (sortDirection === "desc") return <ChevronDown className="size-4" />
    return null
  }

  const SortableHeader = ({ 
    column, 
    children, 
    className 
  }: { 
    column: SortableColumn
    children: React.ReactNode
    className?: string 
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => handleSort(column)}
      >
        {children}
        <SortIcon column={column} />
      </Button>
    </TableHead>
  )

  const toggleRowExpansion = (candidateId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId)
        // Also collapse all categories for this row
        setExpandedCategories(prevCats => {
          const newCats = new Map(prevCats)
          newCats.delete(candidateId)
          return newCats
        })
      } else {
        newSet.add(candidateId)
      }
      return newSet
    })
  }

  const toggleCategoryExpansion = (candidateId: string, categoryType: string) => {
    setExpandedCategories(prev => {
      const newMap = new Map(prev)
      const categories = newMap.get(candidateId) || new Set<string>()
      const newCategories = new Set(categories)
      
      if (newCategories.has(categoryType)) {
        newCategories.delete(categoryType)
      } else {
        newCategories.add(categoryType)
      }
      
      newMap.set(candidateId, newCategories)
      return newMap
    })
  }

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'projects':
        return FolderOpen
      case 'employers':
        return Building2
      case 'education':
        return GraduationCap
      case 'certifications':
        return Award
      default:
        return Info
    }
  }

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-200',
      purple: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-200',
      green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800 dark:text-green-200',
      orange: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-200',
      gray: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950/20 dark:border-gray-800 dark:text-gray-200',
    }
    return colorMap[color] || colorMap.gray
  }

  // Data Progress Badge Component
const DataProgressBadge = ({ candidate }: { candidate: Candidate }) => {
  const summary = React.useMemo(() => 
    calculateDataCompletion(candidate), 
    [candidate]
  )
  
  const percentage = summary.completionPercentage
  
  // Color based on percentage
  const getProgressColor = () => {
    if (percentage === 100) return 'text-green-600 dark:text-green-400'
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-500 dark:text-red-400'
  }
  
  const getBgColor = () => {
    if (percentage === 100) return 'bg-green-100 dark:bg-green-950/30'
    if (percentage >= 70) return 'bg-yellow-100 dark:bg-yellow-950/30'
    return 'bg-red-100 dark:bg-red-950/30'
  }
  
  const getBorderColor = () => {
    if (percentage === 100) return 'border-green-200 dark:border-green-800'
    if (percentage >= 70) return 'border-yellow-200 dark:border-yellow-800'
    return 'border-red-200 dark:border-red-800'
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center justify-center",
              "h-7 min-w-[44px] px-2 rounded-full",
              "text-xs font-semibold border",
              "cursor-default transition-colors",
              getBgColor(),
              getBorderColor(),
              getProgressColor()
            )}
          >
            {percentage}%
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold text-sm text-background">
              Data Progress
            </p>
            <p className="text-background/70">
              Filled: <span className="text-background font-medium">{summary.filledFields}/{summary.totalFields} fields</span>
            </p>
            <div className="space-y-1 pt-1 border-t border-background/20">
              {summary.sectionBreakdown.map((section) => (
                <div key={section.section} className="flex items-center justify-between">
                  <span className="text-background/70">{section.label}:</span>
                  <span className="text-background font-medium">
                    {section.filled}/{section.total} ({section.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Name - Always visible */}
              <SortableHeader column="name">
                Name
              </SortableHeader>
              
              {/* Job Title - Hidden on mobile */}
              <SortableHeader column="jobTitle" className="hidden sm:table-cell">
                Job Title
              </SortableHeader>
              
              {/* Years of Experience - Hidden on mobile */}
              <SortableHeader column="yearsOfExperience" className="hidden md:table-cell">
                Years of Experience
              </SortableHeader>
              
              {/* Avg Tenure - Only visible when filter is active */}
              {hasAvgTenureFilter && (
                <SortableHeader column="avgTenure" className="hidden md:table-cell">
                  Avg Tenure
                </SortableHeader>
              )}
              
              {/* Expected Salary - Always visible */}
              <SortableHeader column="expectedSalary">
                Expected Salary
              </SortableHeader>
              
              {/* Status - Always visible */}
              <SortableHeader column="status">
                Status
              </SortableHeader>
              
              {/* City - Hidden on mobile */}
              <SortableHeader column="city" className="hidden md:table-cell">
                City
              </SortableHeader>

              {/* Data Progress - Hidden on mobile */}
              <TableHead className="hidden lg:table-cell w-[80px]">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Data Progress
                </div>
              </TableHead>
              
              {/* Match Summary - Only visible when filters are active */}
              {activeFilters && (
                <TableHead className="w-[200px]">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Match Summary
                  </div>
                </TableHead>
              )}
              
              {/* Actions - Always visible */}
              <TableHead className="w-[70px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={activeFilters ? (hasAvgTenureFilter ? 9 : 8) : (hasAvgTenureFilter ? 8 : 7)} 
                  className="h-32 text-center text-muted-foreground"
                >
                  No candidates found.
                </TableCell>
              </TableRow>
            ) : (
              sortedCandidates.map((candidate) => {
                const matchContext = activeFilters ? getCandidateMatchContext(candidate, filters) : null
                const isExpanded = expandedRows.has(candidate.id)
                const expandedCats = expandedCategories.get(candidate.id) || new Set<string>()

                return (
                  <React.Fragment key={candidate.id}>
                <TableRow 
                  className="hover:bg-muted/50 cursor-pointer"
                >
                  {/* Name with Avatar */}
                  <TableCell 
                    className="font-medium"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <User className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{candidate.name}</div>
                        <div className="text-sm text-muted-foreground truncate sm:hidden">
                          {getJobTitle(candidate)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Job Title - Hidden on mobile */}
                  <TableCell 
                    className="hidden sm:table-cell"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="max-w-[200px]">
                      <div className="truncate">{getJobTitle(candidate)}</div>
                    </div>
                  </TableCell>
                  
                  {/* Years of Experience - Hidden on mobile */}
                  <TableCell 
                    className="hidden md:table-cell"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="max-w-[150px]">
                      <div className="truncate">
                        {(() => {
                          const years = calculateYearsOfExperience(candidate)
                          return years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : 'N/A'
                        })()}
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Avg Tenure - Only visible when filter is active */}
                  {hasAvgTenureFilter && (
                    <TableCell 
                      className="hidden md:table-cell"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <div className="max-w-[120px]">
                        <div className="truncate">
                          {(() => {
                            const avgTenure = calculateCandidateAverageTenure(candidate)
                            return avgTenure > 0 ? `${avgTenure.toFixed(1)}y` : 'N/A'
                          })()}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  {/* Expected Salary */}
                  <TableCell 
                    className="font-medium"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    {candidate.expectedSalary !== null ? formatCurrency(candidate.expectedSalary) : "N/A"}
                  </TableCell>
                  
                  {/* Status */}
                  <TableCell onClick={() => setSelectedCandidate(candidate)}>
                    <Badge 
                      variant="outline"
                      className={CANDIDATE_STATUS_COLORS[candidate.status]}
                    >
                      {CANDIDATE_STATUS_LABELS[candidate.status]}
                    </Badge>
                  </TableCell>
                  
                  {/* City - Hidden on mobile */}
                  <TableCell 
                    className="hidden md:table-cell"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    {candidate.city}
                  </TableCell>

                  {/* Data Progress - Hidden on mobile */}
                  <TableCell 
                    className="hidden lg:table-cell"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <DataProgressBadge candidate={candidate} />
                  </TableCell>
                  
                  {/* Match Summary */}
                  {activeFilters && (
                    <TableCell>
                      {matchContext && matchContext.totalMatches > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRowExpansion(candidate.id)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleRowExpansion(candidate.id)
                            }
                          }}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} match details for ${candidate.name}. ${matchContext.totalMatches} match${matchContext.totalMatches !== 1 ? 'es' : ''} found.`}
                        >
                          <Badge 
                            variant="secondary" 
                            className="flex items-center gap-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
                          >
                            <Target className="h-3 w-3" />
                            {matchContext.totalMatches} Match{matchContext.totalMatches !== 1 ? 'es' : ''}
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3 ml-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No matches</span>
                      )}
                    </TableCell>
                  )}
                  
                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCandidate(candidate)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                            className="h-8 w-8 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(candidate, e)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                              handleDeleteClick(candidate, e)
                        }}
                      >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expandable Match Details Row */}
                {activeFilters && isExpanded && matchContext && matchContext.totalMatches > 0 && (
                  <TableRow>
                    <TableCell colSpan={activeFilters ? (hasAvgTenureFilter ? 9 : 8) : (hasAvgTenureFilter ? 8 : 7)} className="p-0">
                      <div className="bg-gray-50 dark:bg-gray-950/50 border-t border-border">
                        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                          {matchContext.categories.map((category) => {
                            const CategoryIcon = getCategoryIcon(category.type)
                            const isCategoryExpanded = expandedCats.has(category.type)
                            const shouldAutoExpand = matchContext.categories.length === 1

                            return (
                              <Collapsible
                                key={category.type}
                                open={shouldAutoExpand || isCategoryExpanded}
                                onOpenChange={() => toggleCategoryExpansion(candidate.id, category.type)}
                                className="space-y-2"
                              >
                                <CollapsibleTrigger 
                                  className="w-full"
                                  aria-label={`${isCategoryExpanded || shouldAutoExpand ? 'Collapse' : 'Expand'} ${category.label} details`}
                                >
                                  <div className={`flex items-center justify-between p-3 rounded-lg border ${getCategoryColor(category.color)} transition-colors hover:opacity-90`}>
                                    <div className="flex items-center gap-3">
                                      <CategoryIcon className="h-5 w-5" />
                                      <div>
                                        <div className="font-semibold text-sm">{category.label}</div>
                                        <div className="text-xs opacity-75">{category.count} match{category.count !== 1 ? 'es' : ''}</div>
                                      </div>
                                    </div>
                                    {isCategoryExpanded || shouldAutoExpand ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3 pt-2">
                                  {category.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="ml-4 space-y-2">
                                      <div className="font-medium text-sm">{item.name}</div>
                                      <div className="space-y-1.5">
                                        {item.matchedCriteria.map((criterion, critIndex) => (
                                          <div key={critIndex} className="flex items-start gap-2 text-sm">
                                            <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                              <span className="font-medium text-muted-foreground">{criterion.label}:</span>{' '}
                                              <div className="inline-flex flex-wrap gap-1 mt-1">
                                                {criterion.values.map((value, valIndex) => (
                                                  <Badge key={valIndex} variant="outline" className="text-xs">
                                                    {value}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      {/* Additional context */}
                                      {Object.keys(item.context).length > 0 && (
                                        <div className="text-xs text-muted-foreground ml-6 mt-1">
                                          {typeof item.context.jobTitle === 'string' && item.context.jobTitle && (
                                            <span>Role: {item.context.jobTitle}</span>
                                          )}
                                          {typeof item.context.degreeName === 'string' && typeof item.context.majorName === 'string' && item.context.degreeName && item.context.majorName && (
                                            <span>{item.context.degreeName} in {item.context.majorName}</span>
                                          )}
                                          {typeof item.context.grades === 'string' && item.context.grades && (
                                            <span> • Grades: {item.context.grades}</span>
                                          )}
                                          {typeof item.context.isTopper === 'boolean' && item.context.isTopper && (
                                            <Badge variant="default" className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-xs">
                                              Topper
                                            </Badge>
                                          )}
                                          {typeof item.context.isCheetah === 'boolean' && item.context.isCheetah && (
                                            <Badge variant="default" className="ml-2 bg-orange-500 hover:bg-orange-600 text-xs">
                                              Cheetah
                                            </Badge>
                                          )}
                                          {typeof item.context.isTopDeveloper === 'boolean' && item.context.isTopDeveloper && (
                                            <Badge variant="default" className="ml-2 bg-blue-500 hover:bg-blue-600 text-xs">
                                              Top Developer
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                      {itemIndex < category.items.length - 1 && (
                                        <Separator className="my-3" />
                                      )}
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            )
                          })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CandidateDetailsModal
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCandidate(null)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{candidateToDelete?.name}</strong>. This action cannot be undone.
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

      {/* Edit Candidate Dialog */}
      <CandidateCreationDialog
        mode="edit"
        candidateData={candidateToEdit || undefined}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdateCandidate}
      />
    </>
  )
}
