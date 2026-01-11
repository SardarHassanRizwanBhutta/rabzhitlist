"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Users, GraduationCap, Award, Building2, Globe, Table2, Grid3x3 } from "lucide-react"
import { CandidatesTable } from "@/components/candidates-table"
import { CandidatesCardsView } from "@/components/candidates-cards-view"
import { CandidateCreationDialog, CandidateFormData } from "@/components/candidate-creation-dialog"
import { CandidatesFilterDialog, CandidateFilters } from "@/components/candidates-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import { hasActiveFilters, getCandidateMatchContext } from "@/lib/utils/candidate-matches"
import type { Candidate, WorkExperience } from "@/lib/types/candidate"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { sampleCandidates } from "@/lib/sample-data/candidates"

// Helper function to calculate years of experience with a specific technology
const calculateTechStackYears = (candidate: Candidate, techStack: string): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  const today = new Date()
  const lowerTechStack = techStack.toLowerCase()
  let totalMonths = 0

  candidate.workExperiences.forEach(we => {
    // Check if this work experience includes the tech stack
    const hasTechStack = we.techStacks.some(
      tech => tech.toLowerCase() === lowerTechStack
    )
    
    if (!hasTechStack || !we.startDate) return

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
  return Math.round(totalYears * 10) / 10
}

// Helper function to calculate years of experience in a specific work mode
const calculateWorkModeYears = (candidate: Candidate, workMode: string): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  const today = new Date()
  const lowerWorkMode = workMode.toLowerCase().trim()
  let totalMonths = 0

  candidate.workExperiences.forEach(we => {
    // Check if this work experience has the work mode
    if (!we.workMode || !we.workMode.trim() || we.workMode.trim().toLowerCase() !== lowerWorkMode) {
      return
    }
    
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
  return Math.round(totalYears * 10) / 10
}

/**
 * Count job changes (transitions) in the last N years
 * A job change occurs when:
 * - A work experience ended within the time period, AND
 * - There's a subsequent work experience that started after that end date
 */
const countJobChangesInLastYears = (
  candidate: Candidate, 
  years: number
): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0 // No work experiences = no job changes
  }

  if (candidate.workExperiences.length === 1) {
    return 0 // Only one job = no job changes
  }

  const today = new Date()
  const cutoffDate = new Date(today)
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years)
  // Normalize to start of day for accurate date comparison
  cutoffDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0) // Also normalize today for consistency

  // Sort work experiences by start date (oldest first)
  const sortedExperiences = [...candidate.workExperiences]
    .filter(we => we.startDate) // Only include experiences with start dates
    .sort((a, b) => {
      const dateA = new Date(a.startDate!)
      const dateB = new Date(b.startDate!)
      return dateA.getTime() - dateB.getTime()
    })

  if (sortedExperiences.length < 2) {
    return 0
  }

  let jobChanges = 0

  // Check each work experience (except the last one)
  for (let i = 0; i < sortedExperiences.length - 1; i++) {
    const currentJob = sortedExperiences[i]
    const nextJob = sortedExperiences[i + 1]

    // Only count if current job ended (has endDate)
    if (currentJob.endDate) {
      const endDate = new Date(currentJob.endDate)
      endDate.setHours(0, 0, 0, 0) // Normalize to start of day
      
      // Check if this job ended within the last N years
      if (endDate >= cutoffDate) {
        // Check if next job started after this job ended (indicating a transition)
        const nextStartDate = new Date(nextJob.startDate!)
        nextStartDate.setHours(0, 0, 0, 0) // Normalize to start of day
        
        // If next job started on or after current job ended, it's a job change
        // (Same day transitions count as a job change)
        if (nextStartDate >= endDate) {
          jobChanges++
        }
      }
    }
  }

  return jobChanges
}

/**
 * Calculate gap between two dates in months
 */
const calculateGapInMonths = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  // Normalize to start of day
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  
  // If dates overlap or are same day, gap is 0
  if (d2 <= d1) {
    return 0
  }
  
  const yearsDiff = d2.getFullYear() - d1.getFullYear()
  const monthsDiff = d2.getMonth() - d1.getMonth()
  const daysDiff = d2.getDate() - d1.getDate()
  
  // Calculate total months (approximate)
  let totalMonths = yearsDiff * 12 + monthsDiff
  
  // Add fractional month based on days
  if (daysDiff > 0) {
    totalMonths += daysDiff / 30 // Approximate month = 30 days
  }
  
  return totalMonths
}

/**
 * Check if candidate has continuous employment (no gaps exceeding tolerance)
 */
const hasContinuousEmployment = (
  candidate: Candidate,
  toleranceMonths: number
): boolean => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return false
  }

  if (candidate.workExperiences.length === 1) {
    return true // Single job = continuous
  }

  // Sort work experiences by start date (oldest first)
  const sortedExperiences = [...candidate.workExperiences]
    .filter(we => we.startDate) // Only include experiences with start dates
    .sort((a, b) => {
      const dateA = new Date(a.startDate!)
      const dateB = new Date(b.startDate!)
      return dateA.getTime() - dateB.getTime()
    })

  if (sortedExperiences.length < 2) {
    return true
  }

  // Check for gaps between consecutive jobs
  for (let i = 0; i < sortedExperiences.length - 1; i++) {
    const currentJob = sortedExperiences[i]
    const nextJob = sortedExperiences[i + 1]

    // If current job has no end date (ongoing), use start date as reference
    // For ongoing jobs, we check if next job started after current job started
    // If next job started before current job, it's overlapping (which is fine for continuous)
    if (!currentJob.endDate) {
      const currentStart = new Date(currentJob.startDate!)
      const nextStart = new Date(nextJob.startDate!)
      
      // If next job started before or on current job's start date, it's overlapping (continuous)
      if (nextStart <= currentStart) {
        continue // Overlapping = continuous
      }
      
      // If next job started after current job started, calculate gap from current start
      // This handles the case where current job is ongoing but next job already started
      const gapMonths = calculateGapInMonths(currentJob.startDate!, nextJob.startDate!)
      if (gapMonths > toleranceMonths) {
        return false
      }
      continue
    }

    const endDate = new Date(currentJob.endDate)
    const nextStartDate = new Date(nextJob.startDate!)

    // Calculate gap in months between end of current job and start of next job
    const gapMonths = calculateGapInMonths(endDate, nextStartDate)

    // If gap exceeds tolerance, employment is not continuous
    if (gapMonths > toleranceMonths) {
      return false
    }
  }

  return true
}

/**
 * Count promotions (job title changes) within the same company
 */
const countPromotionsSameCompany = (candidate: Candidate): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length < 2) {
    return 0
  }

  // Group work experiences by employer
  const experiencesByEmployer = new Map<string, WorkExperience[]>()
  
  candidate.workExperiences.forEach(we => {
    if (!we.employerName || !we.startDate) return
    
    const employerName = we.employerName.toLowerCase().trim()
    if (!experiencesByEmployer.has(employerName)) {
      experiencesByEmployer.set(employerName, [])
    }
    experiencesByEmployer.get(employerName)!.push(we)
  })

  let totalPromotions = 0

  // For each employer, count promotions
  experiencesByEmployer.forEach((experiences, employerName) => {
    if (experiences.length < 2) return // Need at least 2 roles for a promotion

    // Sort by start date (oldest first)
    const sorted = [...experiences].sort((a, b) => {
      const dateA = new Date(a.startDate!)
      const dateB = new Date(b.startDate!)
      return dateA.getTime() - dateB.getTime()
    })

    // Count job title changes (promotions)
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      // Check if job title changed (normalize for comparison)
      const currentTitle = current.jobTitle?.toLowerCase().trim() || ""
      const nextTitle = next.jobTitle?.toLowerCase().trim() || ""

      if (currentTitle !== nextTitle && currentTitle && nextTitle) {
        totalPromotions++
      }
    }
  })

  return totalPromotions
}

/**
 * Count promotions (job title changes) in the last N years
 * Counts promotions across all companies, checking if the promotion occurred within the time window
 */
const countPromotionsInLastYears = (
  candidate: Candidate,
  years: number
): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length < 2) {
    return 0
  }

  const today = new Date()
  const cutoffDate = new Date(today)
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years)
  // Normalize to start of day for accurate date comparison
  cutoffDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  // Sort all work experiences by start date (oldest first)
  const sortedExperiences = [...candidate.workExperiences]
    .filter(we => we.startDate) // Only include experiences with start dates
    .sort((a, b) => {
      const dateA = new Date(a.startDate!)
      const dateB = new Date(b.startDate!)
      return dateA.getTime() - dateB.getTime()
    })

  if (sortedExperiences.length < 2) {
    return 0
  }

  let promotions = 0

  // Count job title changes (promotions) that occurred within the time window
  for (let i = 0; i < sortedExperiences.length - 1; i++) {
    const current = sortedExperiences[i]
    const next = sortedExperiences[i + 1]

    // Check if job title changed (normalize for comparison)
    const currentTitle = current.jobTitle?.toLowerCase().trim() || ""
    const nextTitle = next.jobTitle?.toLowerCase().trim() || ""

    if (currentTitle !== nextTitle && currentTitle && nextTitle) {
      // A promotion occurred when transitioning from current to next
      // Check if the next role started within the time window (last N years)
      const nextStartDate = new Date(next.startDate!)
      nextStartDate.setHours(0, 0, 0, 0)

      // If the next role started within the time window, count this promotion
      if (nextStartDate >= cutoffDate && nextStartDate <= today) {
        promotions++
      }
    }
  }

  return promotions
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

interface CandidatesPageClientProps {
  candidates: Candidate[]
}

const initialFilters: CandidateFilters = {
  // Global search for basic info fields
  basicInfoSearch: "",
  postingTitle: "",
  cities: [],
  status: [],
  currentSalaryMin: "",
  currentSalaryMax: "",
  expectedSalaryMin: "",
  expectedSalaryMax: "",
  employers: [],
  projects: [],
  // Project-related filters
  projectStatus: [],
  projectTypes: [],
  techStacks: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  startDateStart: null,
  startDateEnd: null,
  // Candidate work experience tech stacks
  candidateTechStacks: [],
  candidateTechStacksRequireAll: false,  // Default: OR logic (any match)
  candidateTechStacksRequireInBoth: false,  // Default: work experience only
  // Tech stack minimum years of experience
  techStackMinYears: {
    techStacks: [],
    minYears: ""
  },
  // Candidate work experience domains
  candidateDomains: [],
  // Candidate work experience shift types
  shiftTypes: [],
  // Candidate work experience work modes
  workModes: [],
  // Work mode minimum years of experience
  workModeMinYears: {
    workModes: [],
    minYears: ""
  },
  // Candidate work experience time support zones
  timeSupportZones: [],
  // Currently Working filter
  isCurrentlyWorking: null,
  // Worked with Top Developer filter
  workedWithTopDeveloper: null,
  workedWithTopDeveloperUseTolerance: true,  // Default: apply tolerance
  // Top Developer filter
  isTopDeveloper: null,
  // Job title filter
  jobTitle: "",
  jobTitleWorkedWith: false,
  jobTitleWorkedWithUseTolerance: true,  // Default: apply tolerance
  jobTitleStartedCareer: false,  // Default: check all jobs
  // Years of experience filters
  yearsOfExperienceMin: "",
  yearsOfExperienceMax: "",
  maxJobChangesInLastYears: {
    maxChanges: "",
    years: ""
  },
  minPromotionsInLastYears: {
    minPromotions: "",
    years: ""
  },
  // Continuous Employment & Promotions filter
  continuousEmployment: null,
  continuousEmploymentToleranceMonths: 3,  // Default: 3 months
  minPromotionsSameCompany: "",
  // Joined Project From Start filter
  joinedProjectFromStart: null,
  joinedProjectFromStartToleranceDays: 30,
  // Project team size filters
  projectTeamSizeMin: "",
  projectTeamSizeMax: "",
  // Published project filters
  hasPublishedProject: null,
  publishPlatforms: [],
  // Employer-related filters
  employerStatus: [],
  employerCountries: [],
  employerCities: [],
  employerTypes: [],
  // Career Transition filter
  careerTransitionFromType: [],
  careerTransitionToType: [],
  careerTransitionRequireCurrent: false,
  employerSalaryPolicies: [],
  employerSizeMin: "",
  employerSizeMax: "",
  employerRankings: [],
  // University-related filters
  universities: [],
  universityCountries: [],
  universityRankings: [],
  universityCities: [],
  // Education detail filters
  degreeNames: [],
  majorNames: [],
  isTopper: null,
  isCheetah: null,
  educationEndDateStart: null,
  educationEndDateEnd: null,
  // Certification-related filters
  certificationNames: [],
  certificationIssuingBodies: [],
  certificationLevels: [],
  // Personality type filter
  personalityTypes: [],
}

// Debug function - Remove after testing
// Usage: window.debugJobChanges("3", 3) or window.testAllJobChanges(3)
if (typeof window !== 'undefined') {
  (window as unknown as { debugJobChanges?: (candidateId: string, years: number) => number | undefined }).debugJobChanges = (candidateId: string, years: number = 3) => {
    const candidate = sampleCandidates.find(c => c.id === candidateId)
    if (!candidate) {
      console.log(`Candidate ${candidateId} not found`)
      return undefined
    }

    const today = new Date()
    const cutoffDate = new Date(today)
    cutoffDate.setFullYear(cutoffDate.getFullYear() - years)
    cutoffDate.setHours(0, 0, 0, 0)

    console.log(`\n=== ${candidate.name} (ID: ${candidateId}) ===`)
    console.log(`Today: ${today.toISOString().split('T')[0]}`)
    console.log(`Cutoff (${years} years ago): ${cutoffDate.toISOString().split('T')[0]}`)
    console.log(`\nWork Experiences (sorted by start date):`)

    const sorted = [...(candidate.workExperiences || [])]
      .filter(we => we.startDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())

    let jobChanges = 0
    sorted.forEach((we, idx) => {
      const start = we.startDate ? new Date(we.startDate).toISOString().split('T')[0] : 'N/A'
      const end = we.endDate ? new Date(we.endDate).toISOString().split('T')[0] : 'Ongoing'
      const endDate = we.endDate ? new Date(we.endDate) : null
      if (endDate) endDate.setHours(0, 0, 0, 0)
      const isWithinPeriod = endDate ? endDate >= cutoffDate : false
      
      console.log(`  ${idx + 1}. ${we.employerName}: ${start} → ${end} ${isWithinPeriod && endDate ? '✅ (ended in period)' : endDate ? '❌ (ended before period)' : ''}`)
      
      if (idx < sorted.length - 1 && we.endDate) {
        const nextWe = sorted[idx + 1]
        const nextStart = nextWe.startDate ? new Date(nextWe.startDate) : null
        if (nextStart) nextStart.setHours(0, 0, 0, 0)
        if (endDate && nextStart && endDate >= cutoffDate && nextStart > endDate) {
          jobChanges++
          console.log(`     ⚡ Job change #${jobChanges}: ${we.employerName} ended → ${nextWe.employerName} started`)
        } else if (endDate && nextStart && endDate >= cutoffDate) {
          console.log(`     ⚠️  No change: Next job started ${nextStart <= endDate ? 'on/before' : 'after'} end date`)
        }
      }
    })

    const calculatedChanges = countJobChangesInLastYears(candidate, years)
    console.log(`\n📊 Calculated Job Changes (last ${years} years): ${calculatedChanges}`)
    console.log(`✅ Passes filter (≤1)? ${calculatedChanges <= 1 ? 'YES' : 'NO'}`)
    return calculatedChanges
  }

  (window as unknown as { testAllJobChanges?: (years: number) => void }).testAllJobChanges = (years: number = 3) => {
    console.log(`\n=== Testing All Candidates (Last ${years} Years) ===`)
    const results = sampleCandidates.map(c => {
      const changes = countJobChangesInLastYears(c, years)
      return { name: c.name, id: c.id, changes, passes: changes <= 1 }
    })
    
    console.log(`\n✅ Candidates that PASS (≤1 change):`)
    results.filter(r => r.passes).forEach(r => {
      console.log(`  - ${r.name} (ID: ${r.id}): ${r.changes} change(s)`)
    })
    
    console.log(`\n❌ Candidates that FAIL (>1 change):`)
    results.filter(r => !r.passes).forEach(r => {
      console.log(`  - ${r.name} (ID: ${r.id}): ${r.changes} change(s)`)
    })
    
    return results
  }
}

export function CandidatesPageClient({ candidates }: CandidatesPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<CandidateFilters>(initialFilters)
  const [projectFilter, setProjectFilter] = useState<{ name: string; id: string } | null>(null)
  const [universityFilter, setUniversityFilter] = useState<{ name: string; id: string } | null>(null)
  const [certificationFilter, setCertificationFilter] = useState<{ name: string; id: string }| null>(null)
  const [employerFilter, setEmployerFilter] = useState<{ name: string; id: string } | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  // Check for URL filters
  useEffect(() => {
    const projectFilterName = searchParams.get('projectFilter')
    const projectId = searchParams.get('projectId')
    const universityFilterName = searchParams.get('universityFilter')
    const universityId = searchParams.get('universityId')
    const certificationFilterName = searchParams.get('certificationFilter')
    const certificationId = searchParams.get('certificationId')
    const employerFilterName = searchParams.get('employerFilter')
    const employerId = searchParams.get('employerId')

    if (projectFilterName && projectId) {
      setProjectFilter({ name: projectFilterName, id: projectId })
    } else if (universityFilterName && universityId) {
      setUniversityFilter({ name: universityFilterName, id: universityId })
    } else if (certificationFilterName && certificationId) {
      setCertificationFilter({ name: certificationFilterName, id: certificationId })
    } else if (employerFilterName && employerId) {
      setEmployerFilter({ name: employerFilterName, id: employerId })
    }
  }, [searchParams])

  // Apply candidate filters (mock implementation for now)
  const applyFilters = (candidateList: Candidate[], appliedFilters: CandidateFilters) => {
    return candidateList.filter(candidate => {
      // Basic Info Search filter (searches across multiple fields, excluding posting title)
      if (appliedFilters.basicInfoSearch && appliedFilters.basicInfoSearch.trim()) {
        const searchTerm = appliedFilters.basicInfoSearch.trim().toLowerCase()
        
        const matchesBasicInfo = 
          candidate.name?.toLowerCase().includes(searchTerm) ||
          candidate.cnic?.toLowerCase().includes(searchTerm) ||
          candidate.email?.toLowerCase().includes(searchTerm) ||
          candidate.mobileNo?.toLowerCase().includes(searchTerm) ||
          candidate.source?.toLowerCase().includes(searchTerm) ||
          candidate.linkedinUrl?.toLowerCase().includes(searchTerm) ||
          candidate.githubUrl?.toLowerCase().includes(searchTerm) ||
          candidate.status?.toLowerCase().includes(searchTerm)  // ADD THIS LINE
        
        if (!matchesBasicInfo) return false
      }

      // Posting Title filter (dedicated field)
      if (appliedFilters.postingTitle && appliedFilters.postingTitle.trim()) {
        const filterPostingTitle = appliedFilters.postingTitle.trim().toLowerCase()
        if (!candidate.postingTitle || 
            !candidate.postingTitle.toLowerCase().includes(filterPostingTitle)) {
          return false
        }
      }

      // City filter
      if (appliedFilters.cities.length > 0 && !appliedFilters.cities.includes(candidate.city)) {
        return false
      }

      // Status filter
      if (appliedFilters.status.length > 0 && !appliedFilters.status.includes(candidate.status)) {
        return false
      }

      // Personality type filter
      if (appliedFilters.personalityTypes.length > 0) {
        if (!candidate.personalityType || !appliedFilters.personalityTypes.includes(candidate.personalityType)) {
          return false
        }
      }

      // Current salary range filter
      if (appliedFilters.currentSalaryMin || appliedFilters.currentSalaryMax) {
        // If any salary filter is set, exclude candidates with null salary
        if (candidate.currentSalary === null) {
          return false
        }
        
        if (appliedFilters.currentSalaryMin) {
          const minSalary = parseFloat(appliedFilters.currentSalaryMin)
          if (!isNaN(minSalary) && candidate.currentSalary < minSalary) {
            return false
          }
        }
        if (appliedFilters.currentSalaryMax) {
          const maxSalary = parseFloat(appliedFilters.currentSalaryMax)
          if (!isNaN(maxSalary) && candidate.currentSalary > maxSalary) {
            return false
          }
        }
      }

      // Expected salary range filter
      if (appliedFilters.expectedSalaryMin || appliedFilters.expectedSalaryMax) {
        // If any salary filter is set, exclude candidates with null salary
        if (candidate.expectedSalary === null) {
          return false
        }
        
        if (appliedFilters.expectedSalaryMin) {
          const minSalary = parseFloat(appliedFilters.expectedSalaryMin)
          if (!isNaN(minSalary) && candidate.expectedSalary < minSalary) {
            return false
          }
        }
        if (appliedFilters.expectedSalaryMax) {
          const maxSalary = parseFloat(appliedFilters.expectedSalaryMax)
          if (!isNaN(maxSalary) && candidate.expectedSalary > maxSalary) {
            return false
          }
        }
      }

      // Employer filter - Match candidates whose Work Experience includes selected employer(s)
      if (appliedFilters.employers.length > 0) {
        const candidateEmployers = candidate.workExperiences?.map(we => we.employerName) || []
        const hasMatchingEmployer = appliedFilters.employers.some(filterEmployer => 
          candidateEmployers.some(emp => emp.toLowerCase() === filterEmployer.toLowerCase())
        )
        if (!hasMatchingEmployer) return false
      }

      // Projects filter - Match candidates whose Work Experience → projects array OR standalone projects array includes selected project(s)
      if (appliedFilters.projects.length > 0) {
        // Get projects from work experience
        const workExperienceProjects = candidate.workExperiences?.flatMap(we => 
          we.projects.map(p => p.projectName)
        ) || []
        // Get standalone projects
        const standaloneProjects = candidate.projects?.map(p => p.projectName) || []
        // Combine both
        const candidateProjects = [...workExperienceProjects, ...standaloneProjects]
        const hasMatchingProject = appliedFilters.projects.some(filterProject => 
          candidateProjects.some(proj => proj.toLowerCase() === filterProject.toLowerCase())
        )
        if (!hasMatchingProject) return false
      }

      // Project-related filters - Check projects the candidate worked on
      // Get all project names from candidate's work experiences
      const workExperienceProjectNames = candidate.workExperiences?.flatMap(we => 
        we.projects.map(p => p.projectName)
      ) || []
      // Get standalone project names
      const standaloneProjectNames = candidate.projects?.map(p => p.projectName) || []
      // Combine both
      const candidateProjectNames = [...workExperienceProjectNames, ...standaloneProjectNames]
      
      // Find matching projects in sampleProjects
      const candidateProjects = sampleProjects.filter(project => 
        candidateProjectNames.some(name => name.toLowerCase() === project.projectName.toLowerCase())
      )

      // Project Status filter
      if (appliedFilters.projectStatus.length > 0) {
        const hasMatchingStatus = candidateProjects.some(project => 
          appliedFilters.projectStatus.includes(project.status)
        )
        if (!hasMatchingStatus) return false
      }

      // Project Type filter
      if (appliedFilters.projectTypes.length > 0) {
        const hasMatchingType = candidateProjects.some(project => 
          appliedFilters.projectTypes.includes(project.projectType)
        )
        if (!hasMatchingType) return false
      }

      // Tech Stacks filter (Project Expertise) - Check only project tech stacks
      if (appliedFilters.techStacks.length > 0) {
        const projectTechStacks = new Set<string>()
        // Add tech stacks from projects the candidate worked on
        candidateProjects.forEach(project => {
          project.techStacks.forEach(tech => projectTechStacks.add(tech.toLowerCase()))
        })
        
        const hasMatchingTech = appliedFilters.techStacks.some(filterTech => 
          projectTechStacks.has(filterTech.toLowerCase())
        )
        if (!hasMatchingTech) return false
      }

      // Candidate Tech Stacks filter (Work Experience) - Check work experience tech stacks, optionally also in projects
      if (appliedFilters.candidateTechStacks.length > 0) {
        const workExperienceTechStacks = new Set<string>()
        // Add tech stacks from work experiences only
        candidate.workExperiences?.forEach(we => {
          we.techStacks.forEach(tech => workExperienceTechStacks.add(tech.toLowerCase()))
        })
        
        // If "Require in Both" is enabled, also check project tech stacks
        if (appliedFilters.candidateTechStacksRequireInBoth) {
          const projectTechStacks = new Set<string>()
          // Add tech stacks from projects the candidate worked on
          candidateProjects.forEach(project => {
            project.techStacks.forEach(tech => projectTechStacks.add(tech.toLowerCase()))
          })
          
          // Check if tech stacks exist in BOTH work experience AND projects
          const checkTechStack = (filterTech: string) => {
            const lowerFilterTech = filterTech.toLowerCase()
            const inWorkExp = workExperienceTechStacks.has(lowerFilterTech)
            const inProjects = projectTechStacks.has(lowerFilterTech)
            return inWorkExp && inProjects
          }
          
          // Use AND logic (require all) or OR logic (require any) based on toggle
          const hasMatchingTech = appliedFilters.candidateTechStacksRequireAll
            ? appliedFilters.candidateTechStacks.every(checkTechStack)
            : appliedFilters.candidateTechStacks.some(checkTechStack)
          
          if (!hasMatchingTech) return false
        } else {
          // Only check work experience tech stacks
          const hasMatchingTech = appliedFilters.candidateTechStacksRequireAll
            ? appliedFilters.candidateTechStacks.every(filterTech => 
                workExperienceTechStacks.has(filterTech.toLowerCase())
              )
            : appliedFilters.candidateTechStacks.some(filterTech => 
                workExperienceTechStacks.has(filterTech.toLowerCase())
              )
          if (!hasMatchingTech) return false
        }
      }

      // Tech Stack Minimum Years filter - Check cumulative years of experience with specific technologies
      // Requires ALL selected tech stacks to have at least the specified years (AND logic)
      if (appliedFilters.techStackMinYears && 
          appliedFilters.techStackMinYears.techStacks.length > 0 &&
          appliedFilters.techStackMinYears.minYears) {
        
        const minYears = parseFloat(appliedFilters.techStackMinYears.minYears)
        
        if (!isNaN(minYears) && minYears >= 0) {
          // Check that candidate has ALL selected tech stacks, each with at least minYears
          const hasAllTechStacksWithYears = appliedFilters.techStackMinYears.techStacks.every(techStack => {
            const techStackYears = calculateTechStackYears(candidate, techStack)
            return techStackYears >= minYears
          })
          
          if (!hasAllTechStacksWithYears) return false
        }
      }

      // Candidate Domains filter (Work Experience) - Check only work experience domains
      if (appliedFilters.candidateDomains.length > 0) {
        const workExperienceDomains = new Set<string>()
        // Add domains from work experiences only
        candidate.workExperiences?.forEach(we => {
          we.domains.forEach(domain => workExperienceDomains.add(domain.toLowerCase()))
        })
        
        const hasMatchingDomain = appliedFilters.candidateDomains.some(filterDomain => 
          workExperienceDomains.has(filterDomain.toLowerCase())
        )
        if (!hasMatchingDomain) return false
      }

      // Currently Working filter - Check if candidate has any ongoing work experience
      // When combined with Shift Types/Work Mode/Time Support Zones/Employer Types, checks that CURRENT work experience matches
      if (appliedFilters.isCurrentlyWorking !== null) {
        const hasWorkExperienceFilters = 
          appliedFilters.shiftTypes.length > 0 ||
          appliedFilters.workModes.length > 0 ||
          appliedFilters.timeSupportZones.length > 0 ||
          appliedFilters.employerTypes.length > 0

        if (hasWorkExperienceFilters) {
          // Combined check: Current work experience must match all selected filters
          const hasCurrentMatchingWorkExperience = candidate.workExperiences?.some(we => {
            // Must be currently working - check for both undefined and null to handle all cases
            if (we.endDate !== undefined && we.endDate !== null) return false

            // Check shift type if filter is set
            if (appliedFilters.shiftTypes.length > 0) {
              if (!we.shiftType || !appliedFilters.shiftTypes.includes(we.shiftType)) {
                return false
              }
            }

            // Check work mode if filter is set
            if (appliedFilters.workModes.length > 0) {
              if (!we.workMode || !we.workMode.trim() || 
                  !appliedFilters.workModes.includes(we.workMode.trim())) {
                return false
              }
            }

            // Check time support zones if filter is set
            if (appliedFilters.timeSupportZones.length > 0) {
              const hasMatchingZone = we.timeSupportZones?.some(zone => 
                zone && zone.trim() && appliedFilters.timeSupportZones.includes(zone.trim())
              )
              if (!hasMatchingZone) return false
            }

            // Check employer type if filter is set
            if (appliedFilters.employerTypes.length > 0) {
              const employer = sampleEmployers.find(emp => 
                emp.name.toLowerCase() === we.employerName.toLowerCase()
              )
              if (!employer || !appliedFilters.employerTypes.includes(employer.employerType)) {
                return false
              }
            }

            return true
          }) || false

          if (appliedFilters.isCurrentlyWorking && !hasCurrentMatchingWorkExperience) {
            return false
          }
          if (!appliedFilters.isCurrentlyWorking && hasCurrentMatchingWorkExperience) {
            return false
          }
        } else {
          // No work experience filters - just check if currently working
          // Check for both undefined and null to handle all cases where endDate indicates ongoing employment
          const hasCurrentWorkExperience = candidate.workExperiences?.some(we => 
            we.endDate === undefined || we.endDate === null
          ) || false

          if (appliedFilters.isCurrentlyWorking && !hasCurrentWorkExperience) {
            return false
          }
          if (!appliedFilters.isCurrentlyWorking && hasCurrentWorkExperience) {
            return false
          }
        }
      }

      // Shift Type filter (Work Experience) - Check if candidate has worked in any of the selected shift types
      // Only applies if Currently Working filter is not active (to avoid double-checking)
      if (appliedFilters.shiftTypes.length > 0 && appliedFilters.isCurrentlyWorking === null) {
        const workExperienceShiftTypes = new Set<string>()
        candidate.workExperiences?.forEach(we => {
          if (we.shiftType) {
            workExperienceShiftTypes.add(we.shiftType)
          }
        })
        
        const hasMatchingShiftType = appliedFilters.shiftTypes.some(filterShiftType => 
          workExperienceShiftTypes.has(filterShiftType)
        )
        if (!hasMatchingShiftType) return false
      }

      // Work Mode filter (Work Experience) - Check if candidate has worked in any of the selected work modes
      // Only applies if Currently Working filter is not active (to avoid double-checking)
      if (appliedFilters.workModes.length > 0 && appliedFilters.isCurrentlyWorking === null) {
        const workExperienceWorkModes = new Set<string>()
        candidate.workExperiences?.forEach(we => {
          // Filter out empty strings and null, and trim whitespace
          if (we.workMode && we.workMode.trim()) {
            workExperienceWorkModes.add(we.workMode.trim())
          }
        })
        
        const hasMatchingWorkMode = appliedFilters.workModes.some(filterWorkMode => 
          workExperienceWorkModes.has(filterWorkMode.trim())
        )
        if (!hasMatchingWorkMode) return false
      }

      // Work Mode Minimum Years filter - Check cumulative years of experience in specific work modes
      // Requires ALL selected work modes to have at least the specified years (AND logic)
      if (appliedFilters.workModeMinYears && 
          appliedFilters.workModeMinYears.workModes.length > 0 &&
          appliedFilters.workModeMinYears.minYears) {
        
        const minYears = parseFloat(appliedFilters.workModeMinYears.minYears)
        
        if (!isNaN(minYears) && minYears >= 0) {
          // Check that candidate has ALL selected work modes, each with at least minYears
          const hasAllWorkModesWithYears = appliedFilters.workModeMinYears.workModes.every(workMode => {
            const workModeYears = calculateWorkModeYears(candidate, workMode)
            return workModeYears >= minYears
          })
          
          if (!hasAllWorkModesWithYears) return false
        }
      }

      // Time Support Zones filter (Work Experience) - Check if candidate has provided support to any of the selected time zones
      if (appliedFilters.timeSupportZones.length > 0) {
        const workExperienceTimeZones = new Set<string>()
        candidate.workExperiences?.forEach(we => {
          // If Currently Working filter is active, only check current work experiences
          if (appliedFilters.isCurrentlyWorking === true) {
            // Check for both undefined and null to handle all cases where endDate indicates ongoing employment
            if (we.endDate !== undefined && we.endDate !== null) return // Skip non-current work experiences
          }
          
          // Collect all time support zones from work experiences
          we.timeSupportZones?.forEach(zone => {
            if (zone && zone.trim()) {
              workExperienceTimeZones.add(zone.trim())
            }
          })
        })
        
        const hasMatchingTimeZone = appliedFilters.timeSupportZones.some(filterTimeZone => 
          workExperienceTimeZones.has(filterTimeZone.trim())
        )
        if (!hasMatchingTimeZone) return false
      }

      // Worked with Top Developer filter
      if (appliedFilters.workedWithTopDeveloper === true) {
        // Check if tolerance window should be applied
        const useTolerance = appliedFilters.workedWithTopDeveloperUseTolerance ?? true
        const toleranceDays = useTolerance 
          ? (appliedFilters.joinedProjectFromStartToleranceDays || 30)
          : Infinity  // No limit when tolerance is disabled
        
        // Get employer filter if set (from existing employers filter)
        const employerFilters = appliedFilters.employers.map(e => e.toLowerCase().trim())
        
        // Find top developers
        const topDevelopers = sampleCandidates.filter(c => c.isTopDeveloper === true)
        
        // Skip top developers themselves (we want collaborators, not top devs)
        if (candidate.isTopDeveloper === true) {
          return false
        }
        
        // Check if candidate worked with any top developer on the same project
        let hasWorkedWithTopDeveloper = false
        
        candidate.workExperiences?.forEach(candidateWE => {
          // If employer filter is set, only check projects at those employers
          const candidateEmployerMatch = employerFilters.length === 0 || 
            employerFilters.includes(candidateWE.employerName.toLowerCase().trim())
          
          if (!candidateEmployerMatch) return
          
          // If tolerance is enabled, require startDate; if disabled, startDate is optional
          if (useTolerance && !candidateWE.startDate) return
          
          // Check each project the candidate worked on
          candidateWE.projects.forEach(candidateProj => {
            if (!candidateProj.projectName) return
            
            const candidateProjName = candidateProj.projectName.toLowerCase().trim()
            
            // Check against each top developer
            topDevelopers.forEach(topDev => {
              topDev.workExperiences?.forEach(topDevWE => {
                // Check if same employer (if employer filter is set)
                const topDevEmployerMatch = employerFilters.length === 0 || 
                  employerFilters.includes(topDevWE.employerName.toLowerCase().trim())
                
                if (!topDevEmployerMatch) return
                
                // If tolerance is enabled, require startDate; if disabled, startDate is optional
                if (useTolerance && !topDevWE.startDate) return
                
                // Check if they worked on the same project
                topDevWE.projects.forEach(topDevProj => {
                  if (!topDevProj.projectName) return
                  
                  const topDevProjName = topDevProj.projectName.toLowerCase().trim()
                  
                  // Same project name and same employer
                  if (candidateProjName === topDevProjName &&
                      candidateWE.employerName.toLowerCase().trim() === 
                      topDevWE.employerName.toLowerCase().trim()) {
                    
                    // If tolerance is disabled, match immediately
                    if (!useTolerance) {
                hasWorkedWithTopDeveloper = true
                      return
                    }
                    
                    // If tolerance is enabled, compare both work experience start dates with project start date
                    // Find the project to get its start date
                    const project = sampleProjects.find(p => 
                      p.projectName.trim().toLowerCase() === candidateProjName
                    )
                    
                    if (project && project.startDate && candidateWE.startDate && topDevWE.startDate) {
                      const projectStart = new Date(project.startDate)
                      const candidateStart = new Date(candidateWE.startDate)
                      const topDevStart = new Date(topDevWE.startDate)
                      
                      // Normalize dates to start of day for accurate comparison
                      projectStart.setHours(0, 0, 0, 0)
                      candidateStart.setHours(0, 0, 0, 0)
                      topDevStart.setHours(0, 0, 0, 0)
                      
                      // Calculate absolute difference in days between each person's work start and project start
                      const candidateDiffTime = Math.abs(candidateStart.getTime() - projectStart.getTime())
                      const candidateDiffDays = Math.ceil(candidateDiffTime / (1000 * 60 * 60 * 24))
                      
                      const topDevDiffTime = Math.abs(topDevStart.getTime() - projectStart.getTime())
                      const topDevDiffDays = Math.ceil(topDevDiffTime / (1000 * 60 * 60 * 24))
                      
                      // They worked together if both are within tolerance window of project start date
                      if (candidateDiffDays <= toleranceDays && topDevDiffDays <= toleranceDays) {
                        hasWorkedWithTopDeveloper = true
                      }
                    }
                  }
                })
              })
            })
          })
        })
        
        // Check standalone projects only if no employer filter is set
        // Note: For standalone projects, we can't check work experience dates,
        // so we maintain backward compatibility by allowing matches without timeline check
        if (employerFilters.length === 0 && !hasWorkedWithTopDeveloper) {
          candidate.projects?.forEach(candidateProj => {
            if (!candidateProj.projectName) return
            
            const candidateProjName = candidateProj.projectName.toLowerCase().trim()
            
            topDevelopers.forEach(topDev => {
              topDev.projects?.forEach(topDevProj => {
                if (!topDevProj.projectName) return
                
                const topDevProjName = topDevProj.projectName.toLowerCase().trim()
                
                if (candidateProjName === topDevProjName) {
              hasWorkedWithTopDeveloper = true
            }
              })
            })
          })
        }
        
        if (!hasWorkedWithTopDeveloper) return false
      }

      // Top Developer filter
      if (appliedFilters.isTopDeveloper !== null) {
        if (appliedFilters.isTopDeveloper === true && candidate.isTopDeveloper !== true) {
          return false
        }
        if (appliedFilters.isTopDeveloper === false && candidate.isTopDeveloper === true) {
          return false
        }
      }

      // Job Title filter
      if (appliedFilters.jobTitle && appliedFilters.jobTitle.trim()) {
        const filterJobTitle = appliedFilters.jobTitle.trim().toLowerCase()
        
        // Check if "Worked with" mode is enabled
        if (appliedFilters.jobTitleWorkedWith === true) {
          // MODE: Find candidates who WORKED WITH people who have this job title
          
          // Check if tolerance window should be applied
          const useTolerance = appliedFilters.jobTitleWorkedWithUseTolerance ?? true
          const toleranceDays = useTolerance 
            ? (appliedFilters.joinedProjectFromStartToleranceDays || 30)
            : Infinity  // No limit when tolerance is disabled
          
          // Get employer filter if set (from existing employers filter)
          const employerFilters = appliedFilters.employers.map(e => e.toLowerCase().trim())
          
          // Find candidates who have the target job title in their work experiences
          const candidatesWithJobTitle = sampleCandidates.filter(c => {
            return c.workExperiences?.some(we => {
              if (!we.jobTitle) return false
              const jobTitleLower = we.jobTitle.toLowerCase().trim()
              return jobTitleLower.includes(filterJobTitle)
            })
          })
          
          // Skip candidates who themselves have the target job title (we want collaborators, not the leads themselves)
          const candidateHasTargetJobTitle = candidate.workExperiences?.some(we => {
            if (!we.jobTitle) return false
            const jobTitleLower = we.jobTitle.toLowerCase().trim()
            return jobTitleLower.includes(filterJobTitle)
          })
          
          if (candidateHasTargetJobTitle) {
            return false  // Exclude candidates who themselves have the target job title
          }
          
          // Check if candidate worked with any person who has the target job title on the same project
          let hasWorkedWithJobTitle = false
          
          candidate.workExperiences?.forEach(candidateWE => {
            // If employer filter is set, only check projects at those employers
            const candidateEmployerMatch = employerFilters.length === 0 || 
              employerFilters.includes(candidateWE.employerName.toLowerCase().trim())
            
            if (!candidateEmployerMatch) return
            
            // If tolerance is enabled, require startDate; if disabled, startDate is optional
            if (useTolerance && !candidateWE.startDate) return
            
            // Check each project the candidate worked on
            candidateWE.projects.forEach(candidateProj => {
              if (!candidateProj.projectName) return
              
              const candidateProjName = candidateProj.projectName.toLowerCase().trim()
              
              // Check against each candidate who has the target job title
              candidatesWithJobTitle.forEach(personWithJobTitle => {
                personWithJobTitle.workExperiences?.forEach(personWE => {
                  // Check if person has target job title in this work experience
                  if (!personWE.jobTitle) return
                  const personJobTitleLower = personWE.jobTitle.toLowerCase().trim()
                  const personHasTargetJobTitle = personJobTitleLower.includes(filterJobTitle)
                  
                  if (!personHasTargetJobTitle) return
                  
                  // Check if same employer (if employer filter is set)
                  const personEmployerMatch = employerFilters.length === 0 || 
                    employerFilters.includes(personWE.employerName.toLowerCase().trim())
                  
                  if (!personEmployerMatch) return
                  
                  // If tolerance is enabled, require startDate; if disabled, startDate is optional
                  if (useTolerance && !personWE.startDate) return
                  
                  // Check if they worked on the same project
                  personWE.projects.forEach(personProj => {
                    if (!personProj.projectName) return
                    
                    const personProjName = personProj.projectName.toLowerCase().trim()
                    
                    // Same project name and same employer
                    if (candidateProjName === personProjName &&
                        candidateWE.employerName.toLowerCase().trim() === 
                        personWE.employerName.toLowerCase().trim()) {
                      
                      // If tolerance is disabled, match immediately
                      if (!useTolerance) {
                        hasWorkedWithJobTitle = true
                        return
                      }
                      
                      // If tolerance is enabled, compare both work experience start dates with project start date
                      // Find the project to get its start date
                      const project = sampleProjects.find(p => 
                        p.projectName.trim().toLowerCase() === candidateProjName
                      )
                      
                      if (project && project.startDate && candidateWE.startDate && personWE.startDate) {
                        const projectStart = new Date(project.startDate)
                        const candidateStart = new Date(candidateWE.startDate)
                        const personStart = new Date(personWE.startDate)
                        
                        // Normalize dates to start of day for accurate comparison
                        projectStart.setHours(0, 0, 0, 0)
                        candidateStart.setHours(0, 0, 0, 0)
                        personStart.setHours(0, 0, 0, 0)
                        
                        // Calculate absolute difference in days between each person's work start and project start
                        const candidateDiffTime = Math.abs(candidateStart.getTime() - projectStart.getTime())
                        const candidateDiffDays = Math.ceil(candidateDiffTime / (1000 * 60 * 60 * 24))
                        
                        const personDiffTime = Math.abs(personStart.getTime() - projectStart.getTime())
                        const personDiffDays = Math.ceil(personDiffTime / (1000 * 60 * 60 * 24))
                        
                        // They worked together if both are within tolerance window of project start date
                        if (candidateDiffDays <= toleranceDays && personDiffDays <= toleranceDays) {
                          hasWorkedWithJobTitle = true
                        }
                      }
                    }
                  })
                })
              })
            })
          })
          
          // Check standalone projects only if no employer filter is set
          if (employerFilters.length === 0 && !hasWorkedWithJobTitle) {
            candidate.projects?.forEach(candidateProj => {
              if (!candidateProj.projectName) return
              
              const candidateProjName = candidateProj.projectName.toLowerCase().trim()
              
              candidatesWithJobTitle.forEach(personWithJobTitle => {
                personWithJobTitle.projects?.forEach(personProj => {
                  if (!personProj.projectName) return
                  
                  const personProjName = personProj.projectName.toLowerCase().trim()
                  
                  if (candidateProjName === personProjName) {
                    hasWorkedWithJobTitle = true
                  }
                })
              })
            })
          }
          
          if (!hasWorkedWithJobTitle) return false
          
        } else {
          // MODE: Find candidates who HAVE this job title
          if (appliedFilters.jobTitleStartedCareer) {
            // NEW: Check only the first (chronologically oldest) job title
            if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
              return false
            }
            
            // Sort work experiences by start date (oldest first)
            const sortedExperiences = [...candidate.workExperiences]
              .filter(we => we.startDate) // Only include experiences with start dates
              .sort((a, b) => {
                const dateA = new Date(a.startDate!)
                const dateB = new Date(b.startDate!)
                return dateA.getTime() - dateB.getTime()
              })
            
            if (sortedExperiences.length === 0) {
              return false
            }
            
            // Get the first job title
            const firstJobTitle = sortedExperiences[0].jobTitle?.toLowerCase().trim() || ""
            
            if (!firstJobTitle || !firstJobTitle.includes(filterJobTitle)) {
              return false
            }
          } else {
            // Existing behavior: Check all job titles
        const workExperienceJobTitles: string[] = []
        candidate.workExperiences?.forEach(we => {
          if (we.jobTitle && typeof we.jobTitle === 'string' && we.jobTitle.trim()) {
            workExperienceJobTitles.push(we.jobTitle.trim().toLowerCase())
          }
        })
        
        // If candidate has no job titles, exclude them
        if (workExperienceJobTitles.length === 0) {
          return false
        }
        
        // Check if any job title contains the filter text (partial matching)
        const hasMatchingJobTitle = workExperienceJobTitles.some(jobTitle => 
          jobTitle.includes(filterJobTitle)
        )
        
        if (!hasMatchingJobTitle) {
          return false
            }
          }
        }
      }

      // Years of Experience filter
      if (appliedFilters.yearsOfExperienceMin || appliedFilters.yearsOfExperienceMax) {
        // Calculate candidate's total years of experience
        const candidateYearsOfExperience = calculateYearsOfExperience(candidate)
        
        // Check against filter min
        if (appliedFilters.yearsOfExperienceMin) {
          const filterMin = parseFloat(appliedFilters.yearsOfExperienceMin)
          if (!isNaN(filterMin) && candidateYearsOfExperience < filterMin) {
            return false // Candidate's experience is below filter minimum
          }
        }
        
        // Check against filter max
        if (appliedFilters.yearsOfExperienceMax) {
          const filterMax = parseFloat(appliedFilters.yearsOfExperienceMax)
          if (!isNaN(filterMax) && candidateYearsOfExperience > filterMax) {
            return false // Candidate's experience is above filter maximum
          }
        }
      }

      // Maximum Job Changes in Last N Years filter
      const jobChangesFilter = appliedFilters.maxJobChangesInLastYears
      if (jobChangesFilter && 
          jobChangesFilter.maxChanges && 
          jobChangesFilter.maxChanges.trim() !== "" &&
          jobChangesFilter.years && 
          jobChangesFilter.years.trim() !== "") {
        
        const maxChanges = parseInt(jobChangesFilter.maxChanges)
        const years = parseInt(jobChangesFilter.years)
        
        if (!isNaN(maxChanges) && !isNaN(years) && maxChanges >= 0 && years > 0) {
          const jobChanges = countJobChangesInLastYears(candidate, years)
          
          if (jobChanges > maxChanges) {
            return false // Candidate changed jobs more than allowed
          }
        }
      }

      // Promotions in Last N Years filter (independent, works across all companies)
      const promotionsFilter = appliedFilters.minPromotionsInLastYears
      if (promotionsFilter && 
          promotionsFilter.minPromotions && 
          promotionsFilter.minPromotions.trim() !== "" &&
          promotionsFilter.years && 
          promotionsFilter.years.trim() !== "") {
        
        const minPromotions = parseInt(promotionsFilter.minPromotions)
        const years = parseInt(promotionsFilter.years)
        
        if (!isNaN(minPromotions) && !isNaN(years) && minPromotions > 0 && years > 0) {
          const promotionCount = countPromotionsInLastYears(candidate, years)
          
          if (promotionCount < minPromotions) {
            return false // Candidate has fewer promotions than required
          }
        }
      }

      // Continuous Employment filter
      if (appliedFilters.continuousEmployment === true) {
        const toleranceMonths = appliedFilters.continuousEmploymentToleranceMonths || 3
        
        if (!hasContinuousEmployment(candidate, toleranceMonths)) {
          return false
        }
        
        // If minimum promotions is also required
        if (appliedFilters.minPromotionsSameCompany) {
          const minPromotions = parseInt(appliedFilters.minPromotionsSameCompany)
          if (!isNaN(minPromotions) && minPromotions > 0) {
            const promotionCount = countPromotionsSameCompany(candidate)
            if (promotionCount < minPromotions) {
              return false
            }
          }
        }
      }

      // Joined Project From Start filter
      if (appliedFilters.joinedProjectFromStart === true) {
        const toleranceDays = appliedFilters.joinedProjectFromStartToleranceDays || 30
        
        // Get all projects candidate worked on with their work experience dates
        const candidateProjects: Array<{
          projectName: string
          workExperienceStartDate: Date | undefined
          projectStartDate: Date | null
        }> = []
        
        candidate.workExperiences?.forEach(we => {
          if (!we.startDate) return // Skip if no work experience start date
          
          we.projects.forEach(proj => {
            // Find matching project in sampleProjects
            const project = sampleProjects.find(p => 
              p.projectName.trim().toLowerCase() === proj.projectName.trim().toLowerCase()
            )
            
            if (project && project.startDate) {
              candidateProjects.push({
                projectName: project.projectName,
                workExperienceStartDate: we.startDate,
                projectStartDate: project.startDate
              })
            }
          })
        })
        
        // Check if candidate joined at least one project from the start
        const joinedFromStart = candidateProjects.some(cp => {
          if (!cp.projectStartDate || !cp.workExperienceStartDate) return false
          
          // Calculate difference in days
          const projectStart = new Date(cp.projectStartDate)
          const candidateStart = new Date(cp.workExperienceStartDate)
          
          // Normalize dates to start of day for accurate comparison
          projectStart.setHours(0, 0, 0, 0)
          candidateStart.setHours(0, 0, 0, 0)
          
          // Calculate absolute difference in days
          const diffTime = Math.abs(candidateStart.getTime() - projectStart.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          // Candidate joined within tolerance window of project start
          // Also allow if candidate started before project (they were there when project started)
          return diffDays <= toleranceDays || candidateStart <= projectStart
        })
        
        if (!joinedFromStart) return false
      }

      // Vertical Domains filter
      if (appliedFilters.verticalDomains.length > 0) {
        const candidateDomains = new Set<string>()
        candidateProjects.forEach(project => {
          project.verticalDomains.forEach(domain => candidateDomains.add(domain.toLowerCase()))
        })
        
        const hasMatchingDomain = appliedFilters.verticalDomains.some(filterDomain => 
          candidateDomains.has(filterDomain.toLowerCase())
        )
        if (!hasMatchingDomain) return false
      }

      // Horizontal Domains filter
      if (appliedFilters.horizontalDomains.length > 0) {
        const candidateDomains = new Set<string>()
        candidateProjects.forEach(project => {
          project.horizontalDomains.forEach(domain => candidateDomains.add(domain.toLowerCase()))
        })
        
        const hasMatchingHorizontal = appliedFilters.horizontalDomains.some(filterDomain => 
          candidateDomains.has(filterDomain.toLowerCase())
        )
        if (!hasMatchingHorizontal) return false
      }

      // Technical Aspects filter
      if (appliedFilters.technicalAspects.length > 0) {
        const candidateAspects = new Set<string>()
        candidateProjects.forEach(project => {
          project.technicalAspects.forEach(aspect => candidateAspects.add(aspect.toLowerCase()))
        })
        
        const hasMatchingAspect = appliedFilters.technicalAspects.some(filterAspect => 
          candidateAspects.has(filterAspect.toLowerCase())
        )
        if (!hasMatchingAspect) return false
      }

      // Project Date Range filters
      // Start Date Range Filter - filters candidates who worked on projects that started within the range
      if (appliedFilters.startDateStart || appliedFilters.startDateEnd) {
        const hasMatchingProjectStartDate = candidateProjects.some(project => {
          const projectStartDate = project.startDate ? new Date(project.startDate) : null
          
          // If both filter dates are set, check if project started within the range
          if (appliedFilters.startDateStart && appliedFilters.startDateEnd) {
            const filterStartDate = new Date(appliedFilters.startDateStart)
            const filterEndDate = new Date(appliedFilters.startDateEnd)
            filterStartDate.setHours(0, 0, 0, 0)
            filterEndDate.setHours(23, 59, 59, 999)
            
            // Only check project start date
            if (!projectStartDate) {
              return false
            }
            
            projectStartDate.setHours(0, 0, 0, 0)
            if (projectStartDate < filterStartDate || projectStartDate > filterEndDate) {
              return false
            }
            
            return true
          } else if (appliedFilters.startDateStart && !appliedFilters.startDateEnd) {
            // Only start date start - project must have started on or after this date
            const filterStartDate = new Date(appliedFilters.startDateStart)
            filterStartDate.setHours(0, 0, 0, 0)
            if (!projectStartDate) return false
            projectStartDate.setHours(0, 0, 0, 0)
            if (projectStartDate < filterStartDate) return false
            return true
          } else if (appliedFilters.startDateEnd && !appliedFilters.startDateStart) {
            // Only start date end - project must have started on or before this date
            const filterEndDate = new Date(appliedFilters.startDateEnd)
            filterEndDate.setHours(23, 59, 59, 999)
            if (!projectStartDate) return false
            projectStartDate.setHours(0, 0, 0, 0)
            if (projectStartDate > filterEndDate) return false
            return true
          }
          
          return false
        })
        
        if (!hasMatchingProjectStartDate) return false
      }

      // Project Team Size filter
      if (appliedFilters.projectTeamSizeMin || appliedFilters.projectTeamSizeMax) {
        const hasMatchingTeamSize = candidateProjects.some(project => {
          if (!project.teamSize) return false
          
          // Parse team size - can be "5" or "20-30"
          const teamSizeStr = project.teamSize.trim()
          const rangeMatch = teamSizeStr.match(/^(\d+)-(\d+)$/)
          
          let projectMin: number | null = null
          let projectMax: number | null = null
          
          if (rangeMatch) {
            // Range format: "20-30"
            projectMin = parseInt(rangeMatch[1])
            projectMax = parseInt(rangeMatch[2])
          } else {
            // Single number format: "5"
            const singleNum = parseInt(teamSizeStr)
            if (!isNaN(singleNum)) {
              projectMin = singleNum
              projectMax = singleNum
            }
          }
          
          if (projectMin === null || projectMax === null) return false
          
          // Check against filter min
          if (appliedFilters.projectTeamSizeMin) {
            const filterMin = parseInt(appliedFilters.projectTeamSizeMin)
            if (!isNaN(filterMin) && projectMax < filterMin) {
              return false // Project's max team size is below filter minimum
            }
          }
          
          // Check against filter max
          if (appliedFilters.projectTeamSizeMax) {
            const filterMax = parseInt(appliedFilters.projectTeamSizeMax)
            if (!isNaN(filterMax) && projectMin > filterMax) {
              return false // Project's min team size is above filter maximum
            }
          }
          
          return true
        })
        
        if (!hasMatchingTeamSize) return false
      }

      // Published Project filters (independent fields)
      // Filter by published status
      if (appliedFilters.hasPublishedProject === true) {
        // Find published projects that the candidate worked on
        const publishedProjects = candidateProjects.filter(project => project.isPublished === true)
        
        // Must have at least one published project
        if (publishedProjects.length === 0) return false
        
        // If platform filter is also applied, further filter by platforms
        if (appliedFilters.publishPlatforms.length > 0) {
          const hasPlatformMatch = publishedProjects.some(project =>
            project.publishPlatforms?.some(platform =>
              appliedFilters.publishPlatforms.includes(platform)
            )
          )
          if (!hasPlatformMatch) return false
        }
      }
      
      // Filter by platforms only (independent of hasPublishedProject)
      // If platforms are selected but hasPublishedProject is not checked,
      // we still filter for published projects (platforms imply published status)
      if (appliedFilters.publishPlatforms.length > 0 && appliedFilters.hasPublishedProject !== true) {
        // Find published projects with matching platforms
        const publishedProjects = candidateProjects.filter(project => 
          project.isPublished === true &&
          project.publishPlatforms?.some(platform =>
            appliedFilters.publishPlatforms.includes(platform)
          )
        )
        
        // Must have at least one published project on selected platforms
        if (publishedProjects.length === 0) return false
      }

      // Employer-related filters - Check employers the candidate worked for
      // Get all employer names from candidate's work experiences
      const candidateEmployerNames = candidate.workExperiences?.map(we => we.employerName) || []
      
      // Find matching employers in sampleEmployers
      const candidateEmployers = sampleEmployers.filter(employer => 
        candidateEmployerNames.some(name => name.toLowerCase() === employer.name.toLowerCase())
      )

      // Employer Status filter
      if (appliedFilters.employerStatus.length > 0) {
        const hasMatchingStatus = candidateEmployers.some(employer => 
          appliedFilters.employerStatus.includes(employer.status)
        )
        if (!hasMatchingStatus) return false
      }

      // Employer Countries filter
      if (appliedFilters.employerCountries.length > 0) {
        const employerCountries = new Set<string>()
        candidateEmployers.forEach(employer => {
          employer.locations.forEach(location => {
            if (location.country !== null) {
              employerCountries.add(location.country)
            }
          })
        })
        
        const hasMatchingCountry = appliedFilters.employerCountries.some(filterCountry => 
          employerCountries.has(filterCountry)
        )
        if (!hasMatchingCountry) return false
      }

      // Employer Types filter - Check if candidate has worked for any of the selected employer types
      // Only applies if Currently Working filter is not active (to avoid double-checking)
      if (appliedFilters.employerTypes.length > 0 && appliedFilters.isCurrentlyWorking === null) {
        const hasMatchingType = candidateEmployers.some(employer =>
          appliedFilters.employerTypes.includes(employer.employerType)
        )
        if (!hasMatchingType) return false
      }

      // Career Transition filter - Check if candidate moved from one employer type to another
      if (appliedFilters.careerTransitionFromType.length > 0 && appliedFilters.careerTransitionToType.length > 0) {
        if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
          return false // No work experiences = no transition possible
        }

        // Sort work experiences by start date (oldest first)
        const sortedExperiences = [...candidate.workExperiences]
          .filter(we => we.startDate) // Only include experiences with start dates
          .sort((a, b) => {
            const dateA = new Date(a.startDate!)
            const dateB = new Date(b.startDate!)
            return dateA.getTime() - dateB.getTime()
          })

        if (sortedExperiences.length < 2) {
          return false // Need at least 2 work experiences for a transition
        }

        // Find employers for each work experience
        const experiencesWithEmployerTypes: Array<{
          workExperience: typeof sortedExperiences[0]
          employerType: string | null
          startDate: Date
          endDate: Date | null
        }> = []

        sortedExperiences.forEach(we => {
          const employer = sampleEmployers.find(emp =>
            emp.name.toLowerCase() === we.employerName.toLowerCase()
          )
          if (employer) {
            experiencesWithEmployerTypes.push({
              workExperience: we,
              employerType: employer.employerType,
              startDate: new Date(we.startDate!),
              endDate: we.endDate ? new Date(we.endDate) : null
            })
          }
        })

        // Check if candidate worked at "from" type before "to" type
        let foundFromType = false
        let foundToType = false
        let toTypeIndex = -1

        for (let i = 0; i < experiencesWithEmployerTypes.length; i++) {
          const exp = experiencesWithEmployerTypes[i]
          
          // Check if this experience matches "from" type
          if (!foundFromType && exp.employerType && appliedFilters.careerTransitionFromType.includes(exp.employerType)) {
            foundFromType = true
          }
          
          // Check if this experience matches "to" type (must come after "from" type)
          if (foundFromType && exp.employerType && appliedFilters.careerTransitionToType.includes(exp.employerType)) {
            foundToType = true
            toTypeIndex = i
            break // Found the transition
          }
        }

        if (!foundFromType || !foundToType) {
          return false // No transition found
        }

        // If requireCurrent is true, check that "to" type is current/most recent
        if (appliedFilters.careerTransitionRequireCurrent) {
          // Check if the "to" type experience is the most recent one
          const mostRecentExp = experiencesWithEmployerTypes[experiencesWithEmployerTypes.length - 1]
          const toTypeExp = experiencesWithEmployerTypes[toTypeIndex]
          
          // Most recent experience must be the "to" type
          if (mostRecentExp.employerType !== toTypeExp.employerType) {
            return false
          }
          
          // Also check that it's currently ongoing (no endDate)
          if (toTypeExp.endDate !== null) {
            return false
          }
        }
      }

      // Employer Cities filter
      if (appliedFilters.employerCities.length > 0) {
        const employerCities = new Set<string>()
        candidateEmployers.forEach(employer => {
          employer.locations.forEach(location => {
            if (location.city !== null) {
              employerCities.add(location.city)
            }
          })
        })
        
        const hasMatchingCity = appliedFilters.employerCities.some(filterCity => 
          employerCities.has(filterCity)
        )
        if (!hasMatchingCity) return false
      }

      // Employer Salary Policies filter
      if (appliedFilters.employerSalaryPolicies.length > 0) {
        const employerPolicies = new Set<string>()
        candidateEmployers.forEach(employer => {
          employer.locations.forEach(location => {
            employerPolicies.add(location.salaryPolicy)
          })
        })
        
        const hasMatchingPolicy = appliedFilters.employerSalaryPolicies.some(filterPolicy => 
          employerPolicies.has(filterPolicy)
        )
        if (!hasMatchingPolicy) return false
      }

      // Employer Rankings filter
      if (appliedFilters.employerRankings.length > 0) {
        const hasMatchingRanking = appliedFilters.employerRankings.some(filterRanking => 
          candidateEmployers.some(employer => employer.ranking === filterRanking)
        )
        if (!hasMatchingRanking) return false
      }

      // Employer Size filter
      if (appliedFilters.employerSizeMin || appliedFilters.employerSizeMax) {
        // Get all size ranges from employer locations
        const employerSizes: number[] = []
        candidateEmployers.forEach(employer => {
          employer.locations.forEach(location => {
            if (location.minSize !== null) employerSizes.push(location.minSize)
            if (location.maxSize !== null) employerSizes.push(location.maxSize)
          })
        })
        
        // If no size data available, skip this filter (don't exclude candidate)
        if (employerSizes.length > 0) {
          const minSize = Math.min(...employerSizes)
          const maxSize = Math.max(...employerSizes)

          if (appliedFilters.employerSizeMin) {
            const filterMin = parseInt(appliedFilters.employerSizeMin)
            if (!isNaN(filterMin) && maxSize < filterMin) {
              return false
            }
          }

          if (appliedFilters.employerSizeMax) {
            const filterMax = parseInt(appliedFilters.employerSizeMax)
            if (!isNaN(filterMax) && minSize > filterMax) {
              return false
            }
          }
        }
      }

      // University-related filters - Check universities the candidate studied at
      // Get all university location IDs from candidate's educations
      const candidateUniversityLocationIds = candidate.educations?.map(edu => edu.universityLocationId) || []
      
      // Find matching university locations and their universities
      const candidateUniversities: typeof sampleUniversities = []
      sampleUniversities.forEach(university => {
        university.locations.forEach(location => {
          if (candidateUniversityLocationIds.includes(location.id)) {
            if (!candidateUniversities.find(u => u.id === university.id)) {
              candidateUniversities.push(university)
            }
          }
        })
      })

      // University filter - Match candidates whose Education → universityLocationId matches selected university location(s)
      if (appliedFilters.universities.length > 0) {
        const hasMatchingUniversity = appliedFilters.universities.some(filterUniversity => 
          candidateUniversities.some(uni => uni.name.toLowerCase() === filterUniversity.toLowerCase())
        )
        if (!hasMatchingUniversity) return false
      }

      // University Countries filter
      if (appliedFilters.universityCountries.length > 0) {
        const hasMatchingCountry = appliedFilters.universityCountries.some(filterCountry => 
          candidateUniversities.some(uni => uni.country.toLowerCase() === filterCountry.toLowerCase())
        )
        if (!hasMatchingCountry) return false
      }

      // University Rankings filter
      if (appliedFilters.universityRankings.length > 0) {
        const hasMatchingRanking = appliedFilters.universityRankings.some(filterRanking => 
          candidateUniversities.some(uni => uni.ranking === filterRanking)
        )
        if (!hasMatchingRanking) return false
      }

      // University Cities filter
      if (appliedFilters.universityCities.length > 0) {
        const universityCities = new Set<string>()
        candidateUniversities.forEach(university => {
          university.locations.forEach(location => {
            if (candidateUniversityLocationIds.includes(location.id)) {
              universityCities.add(location.city)
            }
          })
        })
        
        const hasMatchingCity = appliedFilters.universityCities.some(filterCity => 
          universityCities.has(filterCity)
        )
        if (!hasMatchingCity) return false
      }

      // Education detail filters - Check candidate.educations directly

      // Degree Names filter
      if (appliedFilters.degreeNames.length > 0) {
        const candidateDegrees = candidate.educations?.map(edu => edu.degreeName) || []
        const hasMatchingDegree = appliedFilters.degreeNames.some(filterDegree => 
          candidateDegrees.some(degree => degree.toLowerCase() === filterDegree.toLowerCase())
        )
        if (!hasMatchingDegree) return false
      }

      // Major Names filter
      if (appliedFilters.majorNames.length > 0) {
        const candidateMajors = candidate.educations?.map(edu => edu.majorName) || []
        const hasMatchingMajor = appliedFilters.majorNames.some(filterMajor => 
          candidateMajors.some(major => major.toLowerCase() === filterMajor.toLowerCase())
        )
        if (!hasMatchingMajor) return false
      }

      // Is Topper filter
      if (appliedFilters.isTopper !== null) {
        const candidateIsTopper = candidate.educations?.some(edu => edu.isTopper === true) || false
        if (appliedFilters.isTopper && !candidateIsTopper) return false
        if (!appliedFilters.isTopper && candidateIsTopper) return false
      }

      // Is Cheetah filter
      if (appliedFilters.isCheetah !== null) {
        const candidateIsCheetah = candidate.educations?.some(edu => edu.isCheetah === true) || false
        if (appliedFilters.isCheetah && !candidateIsCheetah) return false
        if (!appliedFilters.isCheetah && candidateIsCheetah) return false
      }

      // Graduation Date Range filter - filters by endMonth only
      if (appliedFilters.educationEndDateStart || appliedFilters.educationEndDateEnd) {
        const hasMatchingGraduationDate = candidate.educations?.some(edu => {
          if (!edu.endMonth) return false
          const eduEndDate = new Date(edu.endMonth)
          eduEndDate.setHours(0, 0, 0, 0)
          
          // If both filter dates are set, check if graduation date is within the range
          if (appliedFilters.educationEndDateStart && appliedFilters.educationEndDateEnd) {
            const filterStartDate = new Date(appliedFilters.educationEndDateStart)
            const filterEndDate = new Date(appliedFilters.educationEndDateEnd)
            filterStartDate.setHours(0, 0, 0, 0)
            filterEndDate.setHours(23, 59, 59, 999)
            
            if (eduEndDate < filterStartDate || eduEndDate > filterEndDate) {
              return false
            }
            
            return true
          } else if (appliedFilters.educationEndDateStart && !appliedFilters.educationEndDateEnd) {
            // Only start date - graduation must be on or after this date
            const filterStartDate = new Date(appliedFilters.educationEndDateStart)
            filterStartDate.setHours(0, 0, 0, 0)
            if (eduEndDate < filterStartDate) return false
            return true
          } else if (appliedFilters.educationEndDateEnd && !appliedFilters.educationEndDateStart) {
            // Only end date - graduation must be on or before this date
            const filterEndDate = new Date(appliedFilters.educationEndDateEnd)
            filterEndDate.setHours(23, 59, 59, 999)
            if (eduEndDate > filterEndDate) return false
            return true
          }
          
          return false
        })
        if (!hasMatchingGraduationDate) return false
      }

      // Certification-related filters - Check candidate.certifications directly
      // Get all certifications from candidate
      const candidateCerts = candidate.certifications || []
      
      // Find matching certifications in sampleCertifications
      const candidateCertifications = sampleCertifications.filter(cert => 
        candidateCerts.some(candCert => 
          candCert.certificationId === cert.id || 
          candCert.certificationName.toLowerCase() === cert.certificationName.toLowerCase()
        )
      )

      // Certification Names filter - Match candidates whose Certifications include selected certification(s)
      if (appliedFilters.certificationNames.length > 0) {
        const hasMatchingCertification = appliedFilters.certificationNames.some(filterCertName => 
          candidateCerts.some(cert => 
            cert.certificationName.toLowerCase() === filterCertName.toLowerCase()
          ) || candidateCertifications.some(cert => 
            cert.certificationName.toLowerCase() === filterCertName.toLowerCase()
          )
        )
        if (!hasMatchingCertification) return false
      }

      // Certification Issuing Bodies filter
      if (appliedFilters.certificationIssuingBodies.length > 0) {
        const hasMatchingIssuer = appliedFilters.certificationIssuingBodies.some(filterIssuer => 
          candidateCertifications.some(cert => 
            cert.issuingBody !== null && 
            cert.issuingBody.toLowerCase() === filterIssuer.toLowerCase()
          )
        )
        if (!hasMatchingIssuer) return false
      }

      // Certification Levels filter
      if (appliedFilters.certificationLevels.length > 0) {
        const hasMatchingLevel = appliedFilters.certificationLevels.some(filterLevel => 
          candidateCertifications.some(cert => cert.certificationLevel === filterLevel)
        )
        if (!hasMatchingLevel) return false
      }

      return true
    })
  }

  // Apply global filters to candidates
  const applyGlobalFilters = useCallback((candidateList: Candidate[]) => {
    if (!hasGlobalFilters) return candidateList

    return candidateList.filter(candidate => {
      // Global Country filter
      if (globalFilters.countries.length > 0) {
        // Mock: Check if candidate's location matches global countries
        const hasMatchingCountry = globalFilters.countries.some(country => {
          // Mock logic: assume candidates in certain cities are from certain countries
          if (country === "USA" && (candidate.city.includes("New York") || candidate.city.includes("San Francisco"))) return true
          if (country === "Canada" && candidate.city.includes("Toronto")) return true
          return candidate.city.toLowerCase().includes(country.toLowerCase())
        })
        if (!hasMatchingCountry) return false
      }

      // Global City filter
      if (globalFilters.cities.length > 0) {
        if (!globalFilters.cities.includes(candidate.city)) return false
      }

      // Global Tech Stacks filter - Check work experience tech stacks and project tech stacks
      if (globalFilters.techStacks.length > 0) {
        const candidateTechStacks = new Set<string>()
        // Add tech stacks from work experiences
        candidate.workExperiences?.forEach(we => {
          we.techStacks.forEach(tech => candidateTechStacks.add(tech.toLowerCase()))
        })
        // Add tech stacks from projects the candidate worked on
        const candidateProjectNames = candidate.workExperiences?.flatMap(we => 
          we.projects.map(p => p.projectName)
        ) || []
        sampleProjects.forEach(project => {
          if (candidateProjectNames.some(name => name.toLowerCase() === project.projectName.toLowerCase())) {
            project.techStacks.forEach(tech => candidateTechStacks.add(tech.toLowerCase()))
          }
        })
        
        const hasMatchingTech = globalFilters.techStacks.some(filterTech => 
          candidateTechStacks.has(filterTech.toLowerCase())
        )
        if (!hasMatchingTech) return false
      }

      // Global Vertical Domains filter - Check projects the candidate worked on
      if (globalFilters.verticalDomains.length > 0) {
        const candidateProjectNames = candidate.workExperiences?.flatMap(we => 
          we.projects.map(p => p.projectName)
        ) || []
        const candidateProjects = sampleProjects.filter(project => 
          candidateProjectNames.some(name => name.toLowerCase() === project.projectName.toLowerCase())
        )
        const candidateDomains = new Set<string>()
        candidateProjects.forEach(project => {
          project.verticalDomains.forEach(domain => candidateDomains.add(domain.toLowerCase()))
        })
        
        const hasMatchingDomain = globalFilters.verticalDomains.some(filterDomain => 
          candidateDomains.has(filterDomain.toLowerCase())
        )
        if (!hasMatchingDomain) return false
      }

      // Global Horizontal Domains filter - Check projects the candidate worked on
      if (globalFilters.horizontalDomains.length > 0) {
        const candidateProjectNames = candidate.workExperiences?.flatMap(we => 
          we.projects.map(p => p.projectName)
        ) || []
        const candidateProjects = sampleProjects.filter(project => 
          candidateProjectNames.some(name => name.toLowerCase() === project.projectName.toLowerCase())
        )
        const candidateDomains = new Set<string>()
        candidateProjects.forEach(project => {
          project.horizontalDomains.forEach(domain => candidateDomains.add(domain.toLowerCase()))
        })
        
        const hasMatchingHorizontal = globalFilters.horizontalDomains.some(filterDomain => 
          candidateDomains.has(filterDomain.toLowerCase())
        )
        if (!hasMatchingHorizontal) return false
      }

      // Global Technical Aspects filter - Check projects the candidate worked on
      if (globalFilters.technicalAspects.length > 0) {
        const candidateProjectNames = candidate.workExperiences?.flatMap(we => 
          we.projects.map(p => p.projectName)
        ) || []
        const candidateProjects = sampleProjects.filter(project => 
          candidateProjectNames.some(name => name.toLowerCase() === project.projectName.toLowerCase())
        )
        const candidateAspects = new Set<string>()
        candidateProjects.forEach(project => {
          project.technicalAspects.forEach(aspect => candidateAspects.add(aspect.toLowerCase()))
        })
        
        const hasMatchingAspect = globalFilters.technicalAspects.some(filterAspect => 
          candidateAspects.has(filterAspect.toLowerCase())
        )
        if (!hasMatchingAspect) return false
      }

      // Global Employers filter - Check work experience employers
      if (globalFilters.employers.length > 0) {
        const candidateEmployers = candidate.workExperiences?.map(we => we.employerName) || []
        const hasMatchingEmployer = globalFilters.employers.some(filterEmployer => 
          candidateEmployers.some(emp => emp.toLowerCase() === filterEmployer.toLowerCase())
        )
        if (!hasMatchingEmployer) return false
      }

      // Global Status filter
      if (globalFilters.status.length > 0) {
        if (!globalFilters.status.includes(candidate.status)) return false
      }

      return true
    })
  }, [globalFilters, hasGlobalFilters])

  // Helper function to combine URL filters with form filters for match context calculation
  const getCombinedFilters = useCallback((): CandidateFilters => {
    return {
      ...filters,
      // Merge URL-based filters into the filters object for match context calculation
      projects: projectFilter 
        ? (filters.projects.includes(projectFilter.name) 
            ? filters.projects 
            : [...filters.projects, projectFilter.name])
        : filters.projects,
      universities: universityFilter
        ? (filters.universities.some(u => universityFilter.name.toLowerCase().includes(u.toLowerCase()))
            ? filters.universities
            : [...filters.universities, universityFilter.name])
        : filters.universities,
      certificationNames: certificationFilter
        ? (filters.certificationNames.includes(certificationFilter.name)
            ? filters.certificationNames
            : [...filters.certificationNames, certificationFilter.name])
        : filters.certificationNames,
      employers: employerFilter
        ? (filters.employers.some(e => e.toLowerCase() === employerFilter.name.toLowerCase())
            ? filters.employers
            : [...filters.employers, employerFilter.name])
        : filters.employers,
    }
  }, [filters, projectFilter, universityFilter, certificationFilter, employerFilter])

  // Filter candidates by project or university (mock implementation)
  const filteredCandidates = useMemo(() => {
    let candidateList = candidates

    // Apply global filters first
    candidateList = applyGlobalFilters(candidateList)

    // Project filter from URL - Match candidates whose Work Experience → projects array OR standalone projects array includes this project
    if (projectFilter) {
      const projectName = projectFilter.name
      candidateList = candidateList.filter(candidate => {
        // Get projects from work experience
        const workExperienceProjects = candidate.workExperiences?.flatMap(we => 
          we.projects.map(p => p.projectName)
        ) || []
        // Get standalone projects
        const standaloneProjects = candidate.projects?.map(p => p.projectName) || []
        // Combine both
        const candidateProjects = [...workExperienceProjects, ...standaloneProjects]
        return candidateProjects.some(proj => proj.toLowerCase() === projectName.toLowerCase())
      })
    }

    // University filter from URL - Match candidates whose Education → universityLocationId matches this university
    if (universityFilter) {
      const universityId = universityFilter.id
      // Find the university and get all its location IDs
      const university = sampleUniversities.find(u => u.id === universityId)
      if (university) {
        const universityLocationIds = university.locations.map(loc => loc.id)
        candidateList = candidateList.filter(candidate => {
          const candidateUniversityLocationIds = candidate.educations?.map(edu => edu.universityLocationId) || []
          // Check if candidate studied at any location of this university
          return candidateUniversityLocationIds.some(locId => universityLocationIds.includes(locId))
        })
      } else {
        // If university not found, filter out all candidates
        candidateList = []
      }
    }

    // Certification filter from URL - Match candidates whose Certifications include this certification
    if (certificationFilter) {
      const certificationId = certificationFilter.id
      candidateList = candidateList.filter(candidate => {
        const candidateCerts = candidate.certifications || []
        return candidateCerts.some(cert => 
          cert.certificationId === certificationId ||
          cert.certificationName.toLowerCase() === certificationFilter.name.toLowerCase()
        )
      })
    }

    // Employer filter from URL - Match candidates whose Work Experience includes this employer
    if (employerFilter) {
      const employerName = employerFilter.name
      candidateList = candidateList.filter(candidate => {
        const candidateEmployers = candidate.workExperiences?.map(we => we.employerName) || []
        return candidateEmployers.some(emp => emp.toLowerCase() === employerName.toLowerCase())
      })
    }

    // Apply form filters to the result
    candidateList = applyFilters(candidateList, filters)

    // Sort by match count when filters are active
    const filtersActive = hasActiveFilters(filters) || 
                          projectFilter !== null || 
                          universityFilter !== null || 
                          certificationFilter !== null || 
                          employerFilter !== null ||
                          hasGlobalFilters

    if (filtersActive) {
      // Get combined filters that include URL-based filters for accurate match context
      const combinedFilters = getCombinedFilters()

      // Sort by match count (descending), then by name (ascending) for consistency
      candidateList = [...candidateList].sort((a, b) => {
        const matchContextA = getCandidateMatchContext(a, combinedFilters)
        const matchContextB = getCandidateMatchContext(b, combinedFilters)
        
        // Primary sort: Match count (descending) - candidates with most matches first
        if (matchContextA.totalMatches !== matchContextB.totalMatches) {
          return matchContextB.totalMatches - matchContextA.totalMatches
        }
        
        // Secondary sort: Candidate name (ascending) for consistent ordering when match counts are equal
        return a.name.localeCompare(b.name)
      })
    }

    return candidateList
  }, [candidates, projectFilter, universityFilter, certificationFilter, employerFilter, filters, applyGlobalFilters, hasGlobalFilters, getCombinedFilters])

  const handleCandidateSubmit = async (data: CandidateFormData) => {
    console.log("New candidate data:", data)
    await new Promise(resolve => setTimeout(resolve, 1500))
    alert("Candidate created successfully!")
  }

  const handleFiltersChange = (newFilters: CandidateFilters) => {
    setFilters(newFilters)
    console.log("Candidate filters applied:", newFilters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setViewMode('table') // Switch back to table view when filters are cleared
    console.log("Candidate filters cleared")
  }

  const handleClearProjectFilter = () => {
    setProjectFilter(null)
    router.push('/candidates')
  }

  const handleClearUniversityFilter = () => {
    setUniversityFilter(null)
    router.push('/candidates')
  }

  const handleClearCertificationFilter = () => {
    setCertificationFilter(null)
    router.push('/candidates')
  }

  const handleClearEmployerFilter = () => {
    setEmployerFilter(null)
    router.push('/candidates')
  }

  // Dynamic page title and description based on active filters
  const getPageTitle = () => {
    if (projectFilter) return `Project Team: ${projectFilter.name}`
    if (universityFilter) return `University Graduates: ${universityFilter.name}`
    if (certificationFilter) return `Certified Professionals: ${certificationFilter.name}`
    if (employerFilter) return `Company Alumni: ${employerFilter.name}`
    return "All Candidates"
  }

  const getPageDescription = () => {
    if (projectFilter) return `Candidates who have worked on ${projectFilter.name}`
    if (universityFilter) return `Graduates from ${universityFilter.name}`
    if (certificationFilter) return `Professionals certified in ${certificationFilter.name}`
    if (employerFilter) return `Candidates who have worked at ${employerFilter.name}`
    return "Manage candidate profiles and recruitment pipeline"
  }

  // Auto-switch to cards when filters are active
  useEffect(() => {
    const filtersActive = hasActiveFilters(filters) || 
                          projectFilter !== null || 
                          universityFilter !== null || 
                          certificationFilter !== null || 
                          employerFilter !== null ||
                          hasGlobalFilters

    if (filtersActive && filteredCandidates.length > 0) {
      setViewMode('cards')
    }
  }, [filters, projectFilter, universityFilter, certificationFilter, employerFilter, hasGlobalFilters, filteredCandidates.length])
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h2>
          <p className="text-muted-foreground">
            {getPageDescription()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle - Only show when filters are active */}
          {(hasActiveFilters(filters) || projectFilter || universityFilter || certificationFilter || employerFilter || hasGlobalFilters) && (
            <div className="flex items-center border rounded-lg p-1 bg-background">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3 cursor-pointer"
              >
                <Table2 className="h-4 w-4 mr-1.5" />
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3 cursor-pointer"
              >
                <Grid3x3 className="h-4 w-4 mr-1.5" />
                Cards
              </Button>
            </div>
          )}
          <CandidatesFilterDialog
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          <CandidateCreationDialog onSubmit={handleCandidateSubmit} />
        </div>
      </div>

      {/* Active URL Filter Badges */}
      {(projectFilter || universityFilter || certificationFilter || employerFilter) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
          
          {projectFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Project: {projectFilter.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleClearProjectFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {universityFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              University: {universityFilter.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleClearUniversityFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {certificationFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Certification: {certificationFilter.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleClearCertificationFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {employerFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Employer: {employerFilter.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleClearEmployerFilter}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Global Filter Indicator */}
      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}
      
      {/* Conditional rendering based on view mode */}
      {viewMode === 'cards' ? (
        <CandidatesCardsView candidates={filteredCandidates} filters={getCombinedFilters()} />
      ) : (
        <CandidatesTable candidates={filteredCandidates} filters={getCombinedFilters()} />
      )}
    </div>
  )
}
