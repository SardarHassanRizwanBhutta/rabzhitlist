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
  SALARY_POLICY_COLORS,
  EMPLOYER_STATUS_LABELS,
  SALARY_POLICY_LABELS,
  getEmployerSizeDisplay,
  calculateEmployerSize,
} from "@/lib/types/employer"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { EmployerBenefit } from "@/lib/types/benefits"
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

type SortKey = keyof Employer | 'size' | 'applicants'
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

// Utility function to extract tech stacks with candidate counts from work experiences for an employer
const getEmployerTechStacksWithCount = (employer: Employer): TechStackWithCount[] => {
  // If employer has explicit tech stacks, return them with count = 0 (manual entry)
  if (employer.techStacks && employer.techStacks.length > 0) {
    return employer.techStacks.map(tech => ({ tech, count: 0 }))
  }
  
  // Extract from candidates' work experiences with counts
  const techStackCounts = new Map<string, number>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (we.employerName?.toLowerCase().trim() === employer.name.toLowerCase().trim()) {
        we.techStacks.forEach(tech => {
          const normalizedTech = tech.trim()
          techStackCounts.set(
            normalizedTech,
            (techStackCounts.get(normalizedTech) || 0) + 1
          )
        })
      }
    })
  })
  
  // Convert to array and sort by count (descending), then alphabetically
  return Array.from(techStackCounts.entries())
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count // Higher count first
      return a.tech.localeCompare(b.tech) // Alphabetical as tiebreaker
    })
}

// Backward-compatible function that returns just tech stack strings
const getEmployerTechStacks = (employer: Employer): string[] => {
  return getEmployerTechStacksWithCount(employer).map(item => item.tech)
}

// Helper function to match employer names (handles variations and partial matches)
const matchesEmployerName = (weEmployerName: string | null | undefined, employerName: string): boolean => {
  if (!weEmployerName) return false
  
  // Normalize names (case-insensitive, handle whitespace variations)
  const normalizedWe = weEmployerName.toLowerCase().trim().replace(/\s+/g, ' ')
  const normalizedEmp = employerName.toLowerCase().trim().replace(/\s+/g, ' ')
  
  // Check for exact match
  if (normalizedWe === normalizedEmp) return true
  
  // Check if one name contains the other (for cases like "Interactive Group" vs "Interactive Group of Companies")
  if (normalizedWe.includes(normalizedEmp) || normalizedEmp.includes(normalizedWe)) return true
  
  // Also check if normalized versions match (remove common suffixes/prefixes)
  const normalizedWeClean = normalizedWe.replace(/\s+(of|group|companies|inc|llc|ltd|corp|corporation)\s*$/i, '').trim()
  const normalizedEmpClean = normalizedEmp.replace(/\s+(of|group|companies|inc|llc|ltd|corp|corporation)\s*$/i, '').trim()
  if (normalizedWeClean === normalizedEmpClean) return true
  if (normalizedWeClean.includes(normalizedEmpClean) || normalizedEmpClean.includes(normalizedWeClean)) return true
  
  return false
}

// Utility function to extract benefits from candidates' work experiences for an employer
const getEmployerBenefits = (employer: Employer): EmployerBenefit[] => {
  const benefitsMap = new Map<string, EmployerBenefit>()
  
  // First, add benefits from employer if they exist
  if (employer.benefits && employer.benefits.length > 0) {
    employer.benefits.forEach(benefit => {
      const key = benefit.name.toLowerCase().trim()
      if (!benefitsMap.has(key)) {
        benefitsMap.set(key, { ...benefit })
      }
    })
  }
  
  // Also extract from candidates' work experiences and merge
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (matchesEmployerName(we.employerName, employer.name)) {
        we.benefits.forEach(benefit => {
          // Use benefit name as key to deduplicate
          const key = benefit.name.toLowerCase().trim()
          if (!benefitsMap.has(key)) {
            benefitsMap.set(key, { ...benefit })
          }
        })
      }
    })
  })
  return Array.from(benefitsMap.values())
}

// Utility function to extract shift types from candidates' work experiences for an employer
const getEmployerShiftTypes = (employer: Employer): string[] => {
  const shiftTypesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (matchesEmployerName(we.employerName, employer.name) && we.shiftType && we.shiftType.trim()) {
        shiftTypesSet.add(we.shiftType.trim())
      }
    })
  })
  
  return Array.from(shiftTypesSet).sort()
}

// Get unique work modes for an employer from candidates' work experiences
const getEmployerWorkModes = (employer: Employer): string[] => {
  const workModesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (matchesEmployerName(we.employerName, employer.name) && we.workMode && we.workMode.trim()) {
        workModesSet.add(we.workMode.trim())
      }
    })
  })
  
  return Array.from(workModesSet).sort()
}

// Get unique time support zones for an employer from candidates' work experiences
const getEmployerTimeSupportZones = (employer: Employer): string[] => {
  const timeZonesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (matchesEmployerName(we.employerName, employer.name)) {
        we.timeSupportZones?.forEach(zone => {
          if (zone && zone.trim()) {
            timeZonesSet.add(zone.trim())
          }
        })
      }
    })
  })
  
  return Array.from(timeZonesSet).sort()
}

// Count total unique candidates/employees for an employer
const getApplicantCount = (employer: Employer): number => {
  const uniqueCandidates = new Set<string>() // Use Set to count unique candidates
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      // Match employer names using improved matching logic
      if (matchesEmployerName(we.employerName, employer.name)) {
        uniqueCandidates.add(candidate.id) // Add candidate ID to set (unique)
      }
    })
  })
  
  return uniqueCandidates.size
}

// Count unique developers with specific tech stacks for an employer
// Optionally filters by shift type if provided
const getDeveloperCountForTechStack = (
  employer: Employer,
  techStacks: string[],
  shiftTypes?: string[]
): number => {
  if (techStacks.length === 0) return 0
  
  const matchingCandidates = new Set<string>() // Use Set to count unique candidates
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      // Match employer names using improved matching logic
      if (!matchesEmployerName(we.employerName, employer.name)) return
      
      // If shift type filter is provided, check if work experience matches
      if (shiftTypes && shiftTypes.length > 0) {
        if (!we.shiftType || !shiftTypes.includes(we.shiftType)) {
          return // Skip if shift type doesn't match
        }
      }
      
      // Check if candidate has any of the required tech stacks in this work experience
      const hasMatchingTechStack = techStacks.some(filterTech =>
        we.techStacks.some(tech =>
          tech.toLowerCase().trim() === filterTech.toLowerCase().trim()
        )
      )
      
      if (hasMatchingTechStack) {
        matchingCandidates.add(candidate.id) // Add candidate ID to set (unique)
      }
    })
  })
  
  return matchingCandidates.size
}


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

  // Apply filters
  const filteredEmployers = useMemo(() => {
    if (!filters) return employers

    return employers.filter(employer => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(employer.status)) {
        return false
      }

      // Ranking filter
      if (filters.rankings.length > 0 && !filters.rankings.includes(employer.ranking)) {
        return false
      }

      // Founded year filter
      if (filters.foundedYears.length > 0) {
        if (employer.foundedYear === null || !filters.foundedYears.includes(employer.foundedYear.toString())) {
          return false
        }
      }

      // Country filter
      if (filters.countries.length > 0) {
        const hasMatchingCountry = employer.locations.some(location => 
          location.country !== null && filters.countries.includes(location.country)
        )
        if (!hasMatchingCountry) return false
      }

      // City filter
      if (filters.cities.length > 0) {
        const hasMatchingCity = employer.locations.some(location => 
          location.city !== null && filters.cities.includes(location.city)
        )
        if (!hasMatchingCity) return false
      }

      // Employer type filter
      if (filters.employerTypes.length > 0) {
        if (!filters.employerTypes.includes(employer.employerType)) {
          return false
        }
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

      // Minimum Locations Count filter - filter by total number of offices
      if (filters.minLocationsCount) {
        const minCount = parseInt(filters.minLocationsCount)
        if (!isNaN(minCount) && minCount > 0) {
          if (employer.locations.length < minCount) {
            return false
          }
        }
      }

      // Minimum Cities Count filter - filter by number of unique cities
      if (filters.minCitiesCount) {
        const minCount = parseInt(filters.minCitiesCount)
        if (!isNaN(minCount) && minCount > 0) {
          // If country filter is applied, count cities only within those countries
          // Otherwise, count all unique cities
          let locationsToCheck = employer.locations
          
          if (filters.countries.length > 0) {
            locationsToCheck = employer.locations.filter(location =>
              location.country !== null && filters.countries.includes(location.country)
            )
          }
          
          // Count unique cities
          const uniqueCities = new Set(
            locationsToCheck
              .map(location => location.city)
              .filter(city => city !== null)
          )
          
          if (uniqueCities.size < minCount) {
            return false
          }
        }
      }

      // Minimum Applicants filter - filter by number of candidates/employees
      if (filters.minApplicants) {
        const minCount = parseInt(filters.minApplicants)
        if (!isNaN(minCount) && minCount > 0) {
          const applicantCount = getApplicantCount(employer)
          if (applicantCount < minCount) {
            return false
          }
        }
      }

      // Benefits filter
      if (filters.benefits.length > 0) {
        const employerBenefits = getEmployerBenefits(employer)
        
        // Normalize filter benefit names
        const normalizedFilterBenefits = filters.benefits.map(b => b.toLowerCase().trim())
        
        // Check if any employer benefit matches any filter benefit
        const hasMatchingBenefit = employerBenefits.some(benefit => {
          const normalizedBenefitName = benefit.name.toLowerCase().trim()
          return normalizedFilterBenefits.some(filterBenefit =>
            normalizedBenefitName === filterBenefit
          )
        })
        
        if (!hasMatchingBenefit) return false
      }

      // Shift Type filter
      if (filters.shiftTypes.length > 0) {
        const employerShiftTypes = getEmployerShiftTypes(employer)
        
        if (filters.shiftTypesStrict) {
          // Strict mode: ALL employees must work in selected shift types ONLY
          // Employer's shift types must exactly match the selected shift types (no extra types)
          const normalizedSelectedTypes = filters.shiftTypes.map(type => type.trim().toLowerCase()).sort()
          const normalizedEmployerTypes = employerShiftTypes.map(type => type.trim().toLowerCase()).sort()
          
          // Check if arrays are equal (same length and same elements)
          if (normalizedSelectedTypes.length !== normalizedEmployerTypes.length) {
            return false
          }
          
          const hasExactMatch = normalizedSelectedTypes.every((type, index) => 
            type === normalizedEmployerTypes[index]
          )
          
          if (!hasExactMatch) return false
        } else {
          // Non-strict mode: check if employer has candidates working in any of the selected shift types
          const hasMatchingShiftType = filters.shiftTypes.some(filterShiftType =>
            employerShiftTypes.includes(filterShiftType)
          )
          if (!hasMatchingShiftType) return false
        }
      }

      // Work Mode filter - check if employer has candidates working in any of the selected work modes
      if (filters.workModes.length > 0) {
        const employerWorkModes = getEmployerWorkModes(employer)
        
        if (filters.workModesStrict) {
          // Strict mode: ALL employees must work in selected work modes ONLY
          // Employer's work modes must exactly match the selected work modes (no extra modes)
          const normalizedSelectedModes = filters.workModes.map(mode => mode.trim().toLowerCase()).sort()
          const normalizedEmployerModes = employerWorkModes.map(mode => mode.trim().toLowerCase()).sort()
          
          // Check if arrays are equal (same length and same elements)
          if (normalizedSelectedModes.length !== normalizedEmployerModes.length) {
            return false
          }
          
          const hasExactMatch = normalizedSelectedModes.every((mode, index) => 
            mode === normalizedEmployerModes[index]
          )
          
          if (!hasExactMatch) return false
        } else {
          // Non-strict mode: check if employer has candidates working in any of the selected work modes
          const hasMatchingWorkMode = filters.workModes.some(filterWorkMode =>
            employerWorkModes.includes(filterWorkMode.trim())
          )
          if (!hasMatchingWorkMode) return false
        }
      }

      // Time Support Zones filter - check if employer has candidates working in any of the selected time zones
      if (filters.timeSupportZones.length > 0) {
        const employerTimeZones = getEmployerTimeSupportZones(employer)
        const hasMatchingTimeZone = filters.timeSupportZones.some(filterTimeZone =>
          employerTimeZones.includes(filterTimeZone.trim())
        )
        if (!hasMatchingTimeZone) return false
      }

      // Count-based Tech Stack filter (uses employerTechStacks)
      // Filter employers by minimum number of developers with specific tech stacks
      if (filters.employerTechStacks.length > 0 && filters.techStackMinCount) {
        const minCount = parseInt(filters.techStackMinCount)
        if (!isNaN(minCount) && minCount > 0) {
          // Count developers with selected tech stacks, optionally filtered by shift type
          const developerCount = getDeveloperCountForTechStack(
            employer,
            filters.employerTechStacks,
            filters.shiftTypes.length > 0 ? filters.shiftTypes : undefined
          )
          
          // Only include employer if they have at least the minimum count
          if (developerCount < minCount) {
            return false
          }
        }
      }
      
      // Regular Tech Stack filter (only applies if count filter is not active)
      // If count filter is active, we've already filtered above, so skip this
      if (filters.employerTechStacks.length > 0 && !filters.techStackMinCount) {
        const employerTechStacks = getEmployerTechStacks(employer)
        const hasMatchingTechStack = filters.employerTechStacks.some(filterTech =>
          employerTechStacks.some(tech =>
            tech.toLowerCase().trim() === filterTech.toLowerCase().trim()
          )
        )
        if (!hasMatchingTechStack) return false
      }
      
      // Project-based filters
      // Filter projects that belong to this employer (case-insensitive, handle null)
      const employerProjects = sampleProjects.filter(project => {
        if (project.employerName === null) return false
        return project.employerName.trim().toLowerCase() === employer.name.trim().toLowerCase()
      })
      
      // Helper function for case-insensitive array comparison
      const arraysMatch = (arr1: string[], arr2: string[]) => {
        return arr1.some(item1 => 
          arr2.some(item2 => 
            item1.toLowerCase().trim() === item2.toLowerCase().trim()
          )
        )
      }
      
      // If any project-based filter is active, check if employer has matching projects
      const hasProjectFilters = 
        filters.techStacks.length > 0 ||
        filters.verticalDomains.length > 0 ||
        filters.horizontalDomains.length > 0 ||
        filters.technicalAspects.length > 0 ||
        filters.projectStatus.length > 0 ||
        filters.projectTeamSizeMin ||
        filters.projectTeamSizeMax

      // If no projects found and project filters are active, exclude this employer
      if (hasProjectFilters && employerProjects.length === 0) {
        return false
      }
      
      // Technology stack filter
      if (filters.techStacks.length > 0) {
        const hasMatchingTechStack = employerProjects.some(project =>
          arraysMatch(project.techStacks, filters.techStacks)
        )
        if (!hasMatchingTechStack) return false
      }

      // Vertical domains filter
      if (filters.verticalDomains.length > 0) {
        const hasMatchingVerticalDomain = employerProjects.some(project =>
          arraysMatch(project.verticalDomains, filters.verticalDomains)
        )
        if (!hasMatchingVerticalDomain) return false
      }

      // Horizontal domains filter
      if (filters.horizontalDomains.length > 0) {
        const hasMatchingHorizontalDomain = employerProjects.some(project =>
          arraysMatch(project.horizontalDomains, filters.horizontalDomains)
        )
        if (!hasMatchingHorizontalDomain) return false
      }

      // Technical aspects filter
      if (filters.technicalAspects.length > 0) {
        const hasMatchingTechnicalAspect = employerProjects.some(project =>
          arraysMatch(project.technicalAspects, filters.technicalAspects)
        )
        if (!hasMatchingTechnicalAspect) return false
      }

      // Project status filter
      if (filters.projectStatus.length > 0) {
        const hasMatchingProjectStatus = employerProjects.some(project =>
          filters.projectStatus.some(filterStatus => 
            project.status.toLowerCase().trim() === filterStatus.toLowerCase().trim()
          )
        )
        if (!hasMatchingProjectStatus) return false
      }

      // Project Team Size filter
      if (filters.projectTeamSizeMin || filters.projectTeamSizeMax) {
        // Helper function to parse team size - can be "5" or "20-30"
        const parseTeamSize = (teamSize: string | null): { min: number; max: number } | null => {
          if (!teamSize) return null
          
          const rangeMatch = teamSize.match(/^(\d+)-(\d+)$/)
          if (rangeMatch) {
            const [, min, max] = rangeMatch
            return { min: parseInt(min), max: parseInt(max) }
          }
          // Single number
          const num = parseInt(teamSize)
          if (isNaN(num)) return null
          return { min: num, max: num }
        }

        const hasMatchingTeamSize = employerProjects.some(project => {
          if (!project.teamSize) return false
          
          const projectTeamSize = parseTeamSize(project.teamSize)
          if (!projectTeamSize) return false
          
          // Check minimum filter
          if (filters.projectTeamSizeMin) {
            const filterMin = parseInt(filters.projectTeamSizeMin)
            if (!isNaN(filterMin) && projectTeamSize.max < filterMin) {
              return false // Project's max team size is below filter minimum
            }
          }
          
          // Check maximum filter
          if (filters.projectTeamSizeMax) {
            const filterMax = parseInt(filters.projectTeamSizeMax)
            if (!isNaN(filterMax) && projectTeamSize.min > filterMax) {
              return false // Project's min team size is above filter maximum
            }
          }
          
          return true
        })
        
        if (!hasMatchingTeamSize) return false
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
      } else if (sortKey === 'applicants') {
        // Handle applicants count sorting
        aValue = getApplicantCount(a)
        bValue = getApplicantCount(b)
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
            {paginatedEmployers.map((employer) => {
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
                    <TableCell>
                      {employer.foundedYear ? employer.foundedYear : <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1 font-medium">
                        <UsersIcon className="h-3 w-3" />
                        {getApplicantCount(employer)}
                      </Badge>
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
