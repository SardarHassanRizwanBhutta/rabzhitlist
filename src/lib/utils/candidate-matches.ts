import type { Candidate } from "@/lib/types/candidate"
import type { CandidateFilters } from "@/components/candidates-filter-dialog"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { sampleCandidates } from "@/lib/sample-data/candidates"

export interface MatchCriterion {
  type: string
  label: string
  values: string[]
}

export interface MatchItem {
  name: string
  matchedCriteria: MatchCriterion[]
  context: Record<string, unknown>
}

export interface MatchCategory {
  type: 'projects' | 'employers' | 'education' | 'certifications' | 'basic' | 'collaboration' | 'published'
  label: string
  icon: string
  color: string
  count: number
  items: MatchItem[]
}

export interface CandidateMatchContext {
  candidateId: string
  totalMatches: number
  categories: MatchCategory[]
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: CandidateFilters): boolean {
  return !!(
    filters.basicInfoSearch ||
    filters.postingTitle ||
    filters.cities.length > 0 ||
    filters.status.length > 0 ||
    filters.currentSalaryMin ||
    filters.currentSalaryMax ||
    filters.expectedSalaryMin ||
    filters.expectedSalaryMax ||
    filters.employers.length > 0 ||
    filters.projects.length > 0 ||
    filters.projectStatus.length > 0 ||
    filters.projectTypes.length > 0 ||
    filters.techStacks.length > 0 ||
    filters.verticalDomains.length > 0 ||
    filters.horizontalDomains.length > 0 ||
    filters.technicalAspects.length > 0 ||
    filters.startDateStart !== null ||
    filters.startDateEnd !== null ||
    filters.candidateTechStacks.length > 0 ||
    filters.candidateTechStacksRequireAll ||
    filters.candidateTechStacksRequireInBoth ||
    (filters.techStackMinYears && filters.techStackMinYears.techStacks.length > 0 && filters.techStackMinYears.minYears) ||
    (filters.workModeMinYears && filters.workModeMinYears.workModes.length > 0 && filters.workModeMinYears.minYears) ||
    filters.candidateDomains.length > 0 ||
    filters.shiftTypes.length > 0 ||
    filters.workModes.length > 0 ||
    filters.timeSupportZones.length > 0 ||
    filters.isCurrentlyWorking !== null ||
    filters.workedWithTopDeveloper === true ||
    filters.isTopDeveloper !== null ||
    filters.jobTitle ||
    (filters.jobTitle && filters.jobTitleWorkedWith === true) ||
    (filters.jobTitle && filters.jobTitleStartedCareer === true) ||
    filters.yearsOfExperienceMin ||
    filters.yearsOfExperienceMax ||
    (filters.maxJobChangesInLastYears?.maxChanges && filters.maxJobChangesInLastYears?.years) ||
    (filters.minPromotionsInLastYears?.minPromotions && filters.minPromotionsInLastYears?.years) ||
    filters.continuousEmployment === true ||
    filters.minPromotionsSameCompany ||
    filters.joinedProjectFromStart !== null ||
    filters.projectTeamSizeMin ||
    filters.projectTeamSizeMax ||
    filters.hasPublishedProject === true ||
    filters.publishPlatforms.length > 0 ||
    filters.employerStatus.length > 0 ||
    filters.employerCountries.length > 0 ||
    filters.employerCities.length > 0 ||
    filters.employerTypes.length > 0 ||
    filters.careerTransitionFromType.length > 0 ||
    filters.careerTransitionToType.length > 0 ||
    filters.careerTransitionRequireCurrent ||
    filters.employerSalaryPolicies.length > 0 ||
    filters.employerSizeMin ||
    filters.employerSizeMax ||
    filters.employerRankings.length > 0 ||
    filters.universities.length > 0 ||
    filters.universityCountries.length > 0 ||
    filters.universityRankings.length > 0 ||
    filters.universityCities.length > 0 ||
    filters.degreeNames.length > 0 ||
    filters.majorNames.length > 0 ||
    filters.isTopper !== null ||
    filters.isCheetah !== null ||
    filters.educationEndDateStart !== null ||
    filters.educationEndDateEnd !== null ||
    filters.certificationNames.length > 0 ||
    filters.certificationIssuingBodies.length > 0 ||
    filters.certificationLevels.length > 0 ||
    filters.personalityTypes.length > 0
  )
}

/**
 * Calculate years of experience with a specific technology
 */
function calculateTechStackYears(candidate: Candidate, techStack: string): number {
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

/**
 * Calculate years of experience in a specific work mode
 */
function calculateWorkModeYears(candidate: Candidate, workMode: string): number {
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
 * Get candidate's projects (from work experience and standalone)
 */
function getCandidateProjects(candidate: Candidate) {
  const workExperienceProjectNames = candidate.workExperiences?.flatMap(we => 
    we.projects.map(p => p.projectName)
  ) || []
  const standaloneProjectNames = candidate.projects?.map(p => p.projectName) || []
  const candidateProjectNames = [...workExperienceProjectNames, ...standaloneProjectNames]
  
  return sampleProjects.filter(project => 
    candidateProjectNames.some(name => name.toLowerCase() === project.projectName.toLowerCase())
  )
}

/**
 * Count promotions (job title changes) in the last N years
 * Counts promotions across all companies, checking if the promotion occurred within the time window
 */
function countPromotionsInLastYears(
  candidate: Candidate,
  years: number
): number {
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

/**
 * Calculate match context for a candidate based on active filters
 */
export function getCandidateMatchContext(
  candidate: Candidate,
  filters: CandidateFilters
): CandidateMatchContext {
  const categories: MatchCategory[] = []

  // Project Expertise Matches
  const hasProjectFilters = !!(
    filters.projects.length > 0 ||
    filters.projectStatus.length > 0 ||
    filters.projectTypes.length > 0 ||
    filters.techStacks.length > 0 ||
    filters.verticalDomains.length > 0 ||
    filters.horizontalDomains.length > 0 ||
    filters.technicalAspects.length > 0 ||
    filters.candidateTechStacks.length > 0 ||
    filters.candidateTechStacksRequireAll ||
    filters.candidateTechStacksRequireInBoth ||
    filters.candidateDomains.length > 0
  )

  if (hasProjectFilters) {
    const candidateProjects = getCandidateProjects(candidate)
    const projectItems: MatchItem[] = []
    const workExperienceItems: MatchItem[] = []

    candidateProjects.forEach(project => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      // Project name match
      if (filters.projects.some(p => p.toLowerCase() === project.projectName.toLowerCase())) {
        matchedCriteria.push({
          type: 'project',
          label: 'Project Name',
          values: [project.projectName]
        })
        hasMatch = true
      }

      // Project status match
      if (filters.projectStatus.includes(project.status)) {
        matchedCriteria.push({
          type: 'status',
          label: 'Project Status',
          values: [project.status]
        })
        hasMatch = true
      }

      // Project type match
      if (filters.projectTypes.includes(project.projectType)) {
        matchedCriteria.push({
          type: 'type',
          label: 'Project Type',
          values: [project.projectType]
        })
        hasMatch = true
      }

      // Tech stacks match
      const matchingTechStacks = project.techStacks.filter(tech =>
        filters.techStacks.some(filterTech => filterTech.toLowerCase() === tech.toLowerCase())
      )
      if (matchingTechStacks.length > 0) {
        matchedCriteria.push({
          type: 'techStack',
          label: 'Tech Stack',
          values: matchingTechStacks
        })
        hasMatch = true
      }

      // Vertical domains match
      const matchingVerticalDomains = project.verticalDomains.filter(domain =>
        filters.verticalDomains.includes(domain)
      )
      if (matchingVerticalDomains.length > 0) {
        matchedCriteria.push({
          type: 'verticalDomain',
          label: 'Vertical Domain',
          values: matchingVerticalDomains
        })
        hasMatch = true
      }

      // Horizontal domains match
      const matchingHorizontalDomains = project.horizontalDomains.filter(domain =>
        filters.horizontalDomains.includes(domain)
      )
      if (matchingHorizontalDomains.length > 0) {
        matchedCriteria.push({
          type: 'horizontalDomain',
          label: 'Horizontal Domain',
          values: matchingHorizontalDomains
        })
        hasMatch = true
      }

      // Technical aspects match
      const matchingTechnicalAspects = project.technicalAspects.filter(aspect =>
        filters.technicalAspects.includes(aspect)
      )
      if (matchingTechnicalAspects.length > 0) {
        matchedCriteria.push({
          type: 'technicalAspect',
          label: 'Technical Aspect',
          values: matchingTechnicalAspects
        })
        hasMatch = true
      }

      if (hasMatch) {
        projectItems.push({
          name: project.projectName,
          matchedCriteria,
          context: {
            projectId: project.id,
            status: project.status,
            projectType: project.projectType
          }
        })
      }
    })

    // Candidate work experience tech stacks and domains
    // Process work experiences to combine tech stacks and domains from the same work experience
    candidate.workExperiences?.forEach(we => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false
      
      // Declare variables outside if blocks for use later
      let matchingTechStacks: string[] = []
      let matchingProjects: typeof candidateProjects = []

      // Check tech stacks
      if (filters.candidateTechStacks.length > 0) {
        // Get tech stacks from work experience
        const workExpTechStacks = we.techStacks.map(tech => tech.toLowerCase())
        
        // If "Require in Both" is enabled, also check project tech stacks
        let projectTechStacks: Set<string> | null = null
        if (filters.candidateTechStacksRequireInBoth) {
          projectTechStacks = new Set<string>()
          // Get projects for this work experience
          const weProjectNames = we.projects.map(p => p.projectName)
          matchingProjects = candidateProjects.filter(project =>
            weProjectNames.some(name => name.toLowerCase() === project.projectName.toLowerCase())
          )
          matchingProjects.forEach(project => {
            project.techStacks.forEach(tech => projectTechStacks!.add(tech.toLowerCase()))
          })
        }
        
        // Filter matching tech stacks based on requirements
        matchingTechStacks = we.techStacks.filter(tech => {
          const lowerTech = tech.toLowerCase()
          const matchesFilter = filters.candidateTechStacks.some(filterTech => 
            filterTech.toLowerCase() === lowerTech
          )
          
          if (!matchesFilter) return false
          
          // If "Require in Both" is enabled, check if tech exists in projects too
          if (filters.candidateTechStacksRequireInBoth && projectTechStacks) {
            return projectTechStacks.has(lowerTech)
          }
          
          return true
        })
        
        if (matchingTechStacks.length > 0) {
          let label = 'Tech Stack'
          if (filters.candidateTechStacksRequireInBoth && filters.candidateTechStacksRequireAll) {
            label = 'Tech Stack (All in Work Exp + Projects)'
          } else if (filters.candidateTechStacksRequireInBoth) {
            label = 'Tech Stack (Work Exp + Projects)'
          } else if (filters.candidateTechStacksRequireAll) {
            label = 'Tech Stack (All Required)'
          }
          matchedCriteria.push({
            type: 'candidateTechStack',
            label,
            values: matchingTechStacks
          })
          hasMatch = true
        }
      }

      // Check domains
      if (filters.candidateDomains.length > 0) {
        const matchingDomains = we.domains.filter(domain =>
          filters.candidateDomains.some(filterDomain => 
            filterDomain.toLowerCase() === domain.toLowerCase()
          )
        )
        if (matchingDomains.length > 0) {
          matchedCriteria.push({
            type: 'candidateDomain',
            label: 'Domain',
            values: matchingDomains
          })
          hasMatch = true
        }
      }

      // Add work experience item if it has any matches
      if (hasMatch) {
        workExperienceItems.push({
          name: `${we.employerName} - ${we.jobTitle}`,
          matchedCriteria,
          context: {
            employerName: we.employerName,
            jobTitle: we.jobTitle
          }
        })
        
        // If "Require in Both" is enabled, also add matching projects for this work experience
        if (filters.candidateTechStacksRequireInBoth && matchingTechStacks.length > 0 && matchingProjects.length > 0) {
          // Track projects already added to avoid duplicates
          const addedProjectIds = new Set<string>()
          
          matchingProjects.forEach(project => {
            // Skip if project already added
            if (addedProjectIds.has(project.id)) return
            
            // Find tech stacks that are in both work experience AND this project
            const projectMatchingTechStacks = project.techStacks.filter(tech => {
              const lowerTech = tech.toLowerCase()
              return matchingTechStacks.some(matchingTech => 
                matchingTech.toLowerCase() === lowerTech
              )
            })
            
            if (projectMatchingTechStacks.length > 0) {
              addedProjectIds.add(project.id)
              projectItems.push({
                name: project.projectName,
                matchedCriteria: [{
                  type: 'candidateTechStack',
                  label: 'Tech Stack (in both work exp & projects)',
                  values: projectMatchingTechStacks
                }],
                context: {
                  projectId: project.id,
                  status: project.status,
                  projectType: project.projectType,
                  employerName: we.employerName
                }
              })
            }
          })
        }
      }
    })

    // Add Project Expertise category if there are project items
    if (projectItems.length > 0) {
      categories.push({
        type: 'projects',
        label: 'Project Expertise',
        icon: '📊',
        color: 'blue',
        count: projectItems.length,
        items: projectItems
      })
    }
    
    // Add Employer Experience category if there are work experience items
    if (workExperienceItems.length > 0) {
      categories.push({
        type: 'employers',
        label: 'Employer Experience',
        icon: '🏢',
        color: 'purple',
        count: workExperienceItems.length,
        items: workExperienceItems
      })
    }
  }

  // Employer Characteristics Matches
  const hasEmployerFilters = !!(
    filters.employers.length > 0 ||
    filters.employerStatus.length > 0 ||
    filters.employerCountries.length > 0 ||
    filters.employerCities.length > 0 ||
    filters.employerTypes.length > 0 ||
    filters.careerTransitionFromType.length > 0 ||
    filters.careerTransitionToType.length > 0 ||
    filters.careerTransitionRequireCurrent ||
    filters.employerSalaryPolicies.length > 0 ||
    filters.employerSizeMin ||
    filters.employerSizeMax ||
    filters.employerRankings.length > 0
  )

  if (hasEmployerFilters) {
    const employerItems: MatchItem[] = []

    candidate.workExperiences?.forEach(we => {
      // If isCurrentlyWorking is true, only show matches for current work experiences
      // This ensures that when filtering for currently working candidates, we only highlight their current employer
      // Check for both undefined and null to handle all cases where endDate indicates ongoing employment
      if (filters.isCurrentlyWorking === true) {
        if (we.endDate !== undefined && we.endDate !== null) return // Skip non-current work experiences
      }

      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      // Employer name match
      if (filters.employers.some(emp => emp.toLowerCase() === we.employerName.toLowerCase())) {
        matchedCriteria.push({
          type: 'employer',
          label: 'Employer',
          values: [we.employerName]
        })
        hasMatch = true
      }

      // Find employer in sample data for additional checks
      const employer = sampleEmployers.find(emp => 
        emp.name.toLowerCase() === we.employerName.toLowerCase()
      )

      if (employer) {
        // Employer status match
        if (filters.employerStatus.includes(employer.status)) {
          matchedCriteria.push({
            type: 'status',
            label: 'Employer Status',
            values: [employer.status]
          })
          hasMatch = true
        }

        // Employer country match
        const matchingCountries = employer.locations
          .map(loc => loc.country)
          .filter((country): country is string => country !== null)
          .filter(country => filters.employerCountries.includes(country))
        if (matchingCountries.length > 0) {
          matchedCriteria.push({
            type: 'country',
            label: 'Country',
            values: matchingCountries
          })
          hasMatch = true
        }

        // Employer city match
        const matchingCities = employer.locations
          .map(loc => loc.city)
          .filter((city): city is string => city !== null)
          .filter(city => filters.employerCities.includes(city))
        if (matchingCities.length > 0) {
          matchedCriteria.push({
            type: 'city',
            label: 'City',
            values: matchingCities
          })
          hasMatch = true
        }

        // Employer type match
        if (filters.employerTypes.includes(employer.employerType)) {
          matchedCriteria.push({
            type: 'employerType',
            label: 'Employer Type',
            values: [employer.employerType]
          })
          hasMatch = true
        }

        // Salary policy match
        const matchingPolicies = employer.locations
          .map(loc => loc.salaryPolicy)
          .filter(policy => filters.employerSalaryPolicies.includes(policy))
        if (matchingPolicies.length > 0) {
          matchedCriteria.push({
            type: 'salaryPolicy',
            label: 'Salary Policy',
            values: matchingPolicies
          })
          hasMatch = true
        }

        // Employer size match
        if (filters.employerSizeMin || filters.employerSizeMax) {
          const totalMinSize = employer.locations.reduce((sum, loc) => sum + (loc.minSize ?? 0), 0)
          const totalMaxSize = employer.locations.reduce((sum, loc) => sum + (loc.maxSize ?? 0), 0)
          const avgSize = totalMinSize > 0 && totalMaxSize > 0 ? Math.floor((totalMinSize + totalMaxSize) / 2) : totalMinSize || totalMaxSize || 0
          
          const filterMinSize = filters.employerSizeMin ? parseInt(filters.employerSizeMin) : 0
          const filterMaxSize = filters.employerSizeMax ? parseInt(filters.employerSizeMax) : Infinity
          
          // Check if the employer's size range overlaps with the filter range
          if (totalMaxSize >= filterMinSize && totalMinSize <= filterMaxSize) {
            const sizeDisplay = totalMinSize === totalMaxSize 
              ? `${totalMinSize}` 
              : `${totalMinSize}-${totalMaxSize}`
            matchedCriteria.push({
              type: 'size',
              label: 'Company Size',
              values: [`${sizeDisplay} employees`]
            })
            hasMatch = true
          }
        }
      }

      if (hasMatch) {
        employerItems.push({
          name: we.employerName,
          matchedCriteria,
          context: {
            jobTitle: we.jobTitle,
            startDate: we.startDate,
            endDate: we.endDate
          }
        })
      }
    })

    // Career Transition Match
    if (filters.careerTransitionFromType.length > 0 && filters.careerTransitionToType.length > 0) {
      if (candidate.workExperiences && candidate.workExperiences.length >= 2) {
        // Sort work experiences by start date (oldest first)
        const sortedExperiences = [...candidate.workExperiences]
          .filter(we => we.startDate)
          .sort((a, b) => {
            const dateA = new Date(a.startDate!)
            const dateB = new Date(b.startDate!)
            return dateA.getTime() - dateB.getTime()
          })

        // Find employers for each work experience
        const experiencesWithEmployerTypes: Array<{
          workExperience: typeof sortedExperiences[0]
          employerType: string | null
          employerName: string
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
              employerName: we.employerName,
              startDate: new Date(we.startDate!),
              endDate: we.endDate ? new Date(we.endDate) : null
            })
          }
        })

        // Check if candidate worked at "from" type before "to" type
        let foundFromType = false
        let foundToType = false
        let fromTypeExp: typeof experiencesWithEmployerTypes[0] | null = null
        let toTypeExp: typeof experiencesWithEmployerTypes[0] | null = null

        for (let i = 0; i < experiencesWithEmployerTypes.length; i++) {
          const exp = experiencesWithEmployerTypes[i]
          
          // Check if this experience matches "from" type
          if (!foundFromType && exp.employerType && filters.careerTransitionFromType.includes(exp.employerType)) {
            foundFromType = true
            fromTypeExp = exp
          }
          
          // Check if this experience matches "to" type (must come after "from" type)
          if (foundFromType && exp.employerType && filters.careerTransitionToType.includes(exp.employerType)) {
            foundToType = true
            toTypeExp = exp
            break // Found the transition
          }
        }

        if (foundFromType && foundToType && fromTypeExp && toTypeExp) {
          // Create a career transition match item
          const transitionItem: MatchItem = {
            name: `Career Transition: ${fromTypeExp.employerType} → ${toTypeExp.employerType}`,
            matchedCriteria: [
              {
                type: 'careerTransition',
                label: 'Career Transition',
                values: [`${fromTypeExp.employerName} → ${toTypeExp.employerName}`]
              }
            ],
            context: {
              fromEmployer: fromTypeExp.employerName,
              fromType: fromTypeExp.employerType,
              toEmployer: toTypeExp.employerName,
              toType: toTypeExp.employerType,
              fromStartDate: fromTypeExp.startDate,
              fromEndDate: fromTypeExp.endDate,
              toStartDate: toTypeExp.startDate,
              toEndDate: toTypeExp.endDate,
              requireCurrent: filters.careerTransitionRequireCurrent
            }
          }

          // Add to employerItems or create a new category
          employerItems.push(transitionItem)
        }
      }
    }

    if (employerItems.length > 0) {
      categories.push({
        type: 'employers',
        label: 'Employer Experience',
        icon: '🏢',
        color: 'purple',
        count: employerItems.length,
        items: employerItems
      })
    }
  }

  // Education Background Matches
  const hasEducationFilters = !!(
    filters.universities.length > 0 ||
    filters.universityCountries.length > 0 ||
    filters.universityRankings.length > 0 ||
    filters.universityCities.length > 0 ||
    filters.degreeNames.length > 0 ||
    filters.majorNames.length > 0 ||
    filters.isTopper !== null ||
    filters.isCheetah !== null ||
    filters.educationEndDateStart !== null ||
    filters.educationEndDateEnd !== null
  )

  if (hasEducationFilters) {
    const educationItems: MatchItem[] = []

    candidate.educations?.forEach(edu => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      // University match
      if (filters.universities.some(uni => 
        edu.universityLocationName.toLowerCase().includes(uni.toLowerCase())
      )) {
        matchedCriteria.push({
          type: 'university',
          label: 'University',
          values: [edu.universityLocationName]
        })
        hasMatch = true
      }

      // Find university in sample data
      const university = sampleUniversities.find(uni =>
        uni.locations.some(loc => loc.id === edu.universityLocationId)
      )

      if (university) {
        // University country match
        if (filters.universityCountries.includes(university.country)) {
          matchedCriteria.push({
            type: 'country',
            label: 'Country',
            values: [university.country]
          })
          hasMatch = true
        }

        // University ranking match
        if (filters.universityRankings.includes(university.ranking)) {
          matchedCriteria.push({
            type: 'ranking',
            label: 'Ranking',
            values: [university.ranking]
          })
          hasMatch = true
        }

        // University city match
        const location = university.locations.find(loc => loc.id === edu.universityLocationId)
        if (location && filters.universityCities.includes(location.city)) {
          matchedCriteria.push({
            type: 'city',
            label: 'Campus City',
            values: [location.city]
          })
          hasMatch = true
        }
      }

      // Degree match
      if (filters.degreeNames.includes(edu.degreeName)) {
        matchedCriteria.push({
          type: 'degree',
          label: 'Degree',
          values: [edu.degreeName]
        })
        hasMatch = true
      }

      // Major match
      if (filters.majorNames.includes(edu.majorName)) {
        matchedCriteria.push({
          type: 'major',
          label: 'Major',
          values: [edu.majorName]
        })
        hasMatch = true
      }

      // Topper match
      if (filters.isTopper === true && edu.isTopper === true) {
        matchedCriteria.push({
          type: 'achievement',
          label: 'Achievement',
          values: ['Topper']
        })
        hasMatch = true
      }

      // Cheetah match
      if (filters.isCheetah === true && edu.isCheetah === true) {
        matchedCriteria.push({
          type: 'achievement',
          label: 'Achievement',
          values: ['Cheetah']
        })
        hasMatch = true
      }

      // Graduation Date Range match
      if (filters.educationEndDateStart || filters.educationEndDateEnd) {
        if (edu.endMonth) {
          const eduEndDate = new Date(edu.endMonth)
          eduEndDate.setHours(0, 0, 0, 0)
          let matchesRange = false
          
          if (filters.educationEndDateStart && filters.educationEndDateEnd) {
            // Both dates set - check if graduation date is within range
            const filterStartDate = new Date(filters.educationEndDateStart)
            const filterEndDate = new Date(filters.educationEndDateEnd)
            filterStartDate.setHours(0, 0, 0, 0)
            filterEndDate.setHours(23, 59, 59, 999)
            
            if (eduEndDate >= filterStartDate && eduEndDate <= filterEndDate) {
              matchesRange = true
            }
          } else if (filters.educationEndDateStart && !filters.educationEndDateEnd) {
            // Only start date - graduation must be on or after this date
            const filterStartDate = new Date(filters.educationEndDateStart)
            filterStartDate.setHours(0, 0, 0, 0)
            if (eduEndDate >= filterStartDate) {
              matchesRange = true
            }
          } else if (filters.educationEndDateEnd && !filters.educationEndDateStart) {
            // Only end date - graduation must be on or before this date
            const filterEndDate = new Date(filters.educationEndDateEnd)
            filterEndDate.setHours(23, 59, 59, 999)
            if (eduEndDate <= filterEndDate) {
              matchesRange = true
            }
          }
          
          if (matchesRange) {
            const rangeLabel = filters.educationEndDateStart && filters.educationEndDateEnd
              ? `${filters.educationEndDateStart.toLocaleDateString()} - ${filters.educationEndDateEnd.toLocaleDateString()}`
              : filters.educationEndDateStart
              ? `From ${filters.educationEndDateStart.toLocaleDateString()}`
              : `Until ${filters.educationEndDateEnd?.toLocaleDateString()}`
            
            matchedCriteria.push({
              type: 'endMonth',
              label: 'Graduation Date Range',
              values: [rangeLabel]
            })
            hasMatch = true
          }
        }
      }

      if (hasMatch) {
        educationItems.push({
          name: edu.universityLocationName,
          matchedCriteria,
          context: {
            degreeName: edu.degreeName,
            majorName: edu.majorName,
            grades: edu.grades,
            isTopper: edu.isTopper,
            isCheetah: edu.isCheetah,
            isTopDeveloper: candidate.isTopDeveloper
          }
        })
      }
    })

    if (educationItems.length > 0) {
      categories.push({
        type: 'education',
        label: 'Education Background',
        icon: '🎓',
        color: 'green',
        count: educationItems.length,
        items: educationItems
      })
    }
  }

  // Certification Matches
  const hasCertificationFilters = !!(
    filters.certificationNames.length > 0 ||
    filters.certificationIssuingBodies.length > 0 ||
    filters.certificationLevels.length > 0
  )

  if (hasCertificationFilters) {
    const certificationItems: MatchItem[] = []

    candidate.certifications?.forEach(cert => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      // Certification name match
      if (filters.certificationNames.some(name => 
        name.toLowerCase() === cert.certificationName.toLowerCase()
      )) {
        matchedCriteria.push({
          type: 'certification',
          label: 'Certification',
          values: [cert.certificationName]
        })
        hasMatch = true
      }

      // Find certification in sample data
      const certification = sampleCertifications.find(c =>
        c.id === cert.certificationId || 
        c.certificationName.toLowerCase() === cert.certificationName.toLowerCase()
      )

      if (certification) {
        // Issuing body match
        if (certification.issuingBody && 
            filters.certificationIssuingBodies.includes(certification.issuingBody)) {
          matchedCriteria.push({
            type: 'issuingBody',
            label: 'Issuing Body',
            values: [certification.issuingBody]
          })
          hasMatch = true
        }

        // Certification level match
        if (filters.certificationLevels.includes(certification.certificationLevel)) {
          matchedCriteria.push({
            type: 'level',
            label: 'Level',
            values: [certification.certificationLevel]
          })
          hasMatch = true
        }
      }

      if (hasMatch) {
        certificationItems.push({
          name: cert.certificationName,
          matchedCriteria,
          context: {
            issueDate: cert.issueDate,
            expiryDate: cert.expiryDate
          }
        })
      }
    })

    if (certificationItems.length > 0) {
      categories.push({
        type: 'certifications',
        label: 'Certifications',
        icon: '📜',
        color: 'orange',
        count: certificationItems.length,
        items: certificationItems
      })
    }
  }

  // Basic Information Matches
  const hasBasicFilters = !!(
    filters.cities.length > 0 ||
    filters.personalityTypes.length > 0 ||
    filters.currentSalaryMin ||
    filters.currentSalaryMax ||
    filters.expectedSalaryMin ||
    filters.expectedSalaryMax
  )

  if (hasBasicFilters) {
    const basicItems: MatchItem[] = []
    const matchedCriteria: MatchCriterion[] = []

    // City match
    if (filters.cities.includes(candidate.city)) {
      matchedCriteria.push({
        type: 'city',
        label: 'Location',
        values: [candidate.city]
      })
    }

    // Personality type match
    if (filters.personalityTypes.length > 0 && candidate.personalityType) {
      if (filters.personalityTypes.includes(candidate.personalityType)) {
        matchedCriteria.push({
          type: 'personalityType',
          label: 'Personality Type',
          values: [candidate.personalityType]
        })
      }
    }

    // Salary matches
    if (filters.currentSalaryMin || filters.currentSalaryMax) {
      if (candidate.currentSalary !== null) {
        const min = filters.currentSalaryMin ? parseFloat(filters.currentSalaryMin) : 0
        const max = filters.currentSalaryMax ? parseFloat(filters.currentSalaryMax) : Infinity
        if (candidate.currentSalary >= min && candidate.currentSalary <= max) {
          matchedCriteria.push({
            type: 'salary',
            label: 'Current Salary',
            values: [`$${candidate.currentSalary.toLocaleString()}`]
          })
        }
      }
    }

    if (filters.expectedSalaryMin || filters.expectedSalaryMax) {
      if (candidate.expectedSalary !== null) {
        const min = filters.expectedSalaryMin ? parseFloat(filters.expectedSalaryMin) : 0
        const max = filters.expectedSalaryMax ? parseFloat(filters.expectedSalaryMax) : Infinity
        if (candidate.expectedSalary >= min && candidate.expectedSalary <= max) {
          matchedCriteria.push({
            type: 'salary',
            label: 'Expected Salary',
            values: [`$${candidate.expectedSalary.toLocaleString()}`]
          })
        }
      }
    }

    if (matchedCriteria.length > 0) {
      basicItems.push({
        name: 'Basic Information',
        matchedCriteria,
        context: {}
      })

      categories.push({
        type: 'basic',
        label: 'Basic Information',
        icon: 'ℹ️',
        color: 'gray',
        count: basicItems.length,
        items: basicItems
      })
    }
  }

  // Work Experience Matches (Job Title, Shift Types, Work Modes, Years of Experience)
  const hasWorkExperienceFilters = !!(
    filters.jobTitle ||
    filters.shiftTypes.length > 0 ||
    filters.workModes.length > 0 ||
    filters.timeSupportZones.length > 0 ||
    filters.yearsOfExperienceMin ||
    filters.yearsOfExperienceMax
  )

  if (hasWorkExperienceFilters) {
    const workExperienceItems: MatchItem[] = []
    
    // Helper function to calculate years of experience
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

    candidate.workExperiences?.forEach(we => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      // If Currently Working filter is active, only process current work experiences
      // Check for both undefined and null to handle all cases where endDate indicates ongoing employment
      if (filters.isCurrentlyWorking === true && we.endDate !== undefined && we.endDate !== null) {
        return // Skip past work experiences
      }
      if (filters.isCurrentlyWorking === false && (we.endDate === undefined || we.endDate === null)) {
        return // Skip current work experiences
      }

      // Job Title match
      if (filters.jobTitle && filters.jobTitle.trim() && !filters.jobTitleStartedCareer) {
        // Only check all work experiences if "Started career" is not enabled
        const filterJobTitle = filters.jobTitle.trim().toLowerCase()
        if (we.jobTitle && typeof we.jobTitle === 'string' && we.jobTitle.trim()) {
          const jobTitleLower = we.jobTitle.trim().toLowerCase()
          if (jobTitleLower.includes(filterJobTitle)) {
            matchedCriteria.push({
              type: 'jobTitle',
              label: 'Job Title',
              values: [we.jobTitle]
            })
            hasMatch = true
          }
        }
      }

      // Shift Type match
      if (filters.shiftTypes.length > 0 && we.shiftType) {
        if (filters.shiftTypes.includes(we.shiftType)) {
          matchedCriteria.push({
            type: 'shiftType',
            label: 'Shift Type',
            values: [we.shiftType]
          })
          hasMatch = true
        }
      }

      // Work Mode match
      if (filters.workModes.length > 0 && we.workMode) {
        if (filters.workModes.includes(we.workMode)) {
          matchedCriteria.push({
            type: 'workMode',
            label: 'Work Mode',
            values: [we.workMode]
          })
          hasMatch = true
        }
      }

      // Time Support Zones match
      if (filters.timeSupportZones.length > 0 && we.timeSupportZones && we.timeSupportZones.length > 0) {
        const matchingZones = we.timeSupportZones.filter(zone => 
          filters.timeSupportZones.includes(zone)
        )
        if (matchingZones.length > 0) {
          matchedCriteria.push({
            type: 'timeSupportZones',
            label: 'Time Support Zones',
            values: matchingZones
          })
          hasMatch = true
        }
      }

      // Currently Working match
      if (filters.isCurrentlyWorking !== null) {
        // Check for both undefined and null to handle all cases where endDate indicates ongoing employment
        const isCurrentlyWorking = we.endDate === undefined || we.endDate === null
        
        // If Currently Working filter is active, only show matches for current work experiences
        // If combined with other filters, they should already be filtered above
        if (filters.isCurrentlyWorking === true && isCurrentlyWorking) {
          matchedCriteria.push({
            type: 'isCurrentlyWorking',
            label: 'Currently Working',
            values: ['Yes']
          })
          hasMatch = true
        } else if (filters.isCurrentlyWorking === false && !isCurrentlyWorking) {
          // For "not currently working" filter, we still want to show the match
          matchedCriteria.push({
            type: 'isCurrentlyWorking',
            label: 'Currently Working',
            values: ['No']
          })
          hasMatch = true
        }
      }

      // Add work experience item if it has any matches
      if (hasMatch) {
        workExperienceItems.push({
          name: `${we.employerName} - ${we.jobTitle || 'N/A'}`,
          matchedCriteria,
          context: {
            employerName: we.employerName,
            jobTitle: we.jobTitle,
            startDate: we.startDate,
            endDate: we.endDate
          }
        })
      }
    })

    // Job Title "Started Career" match (candidate-level, checks first job only)
    if (filters.jobTitle && filters.jobTitle.trim() && filters.jobTitleStartedCareer === true) {
      if (candidate.workExperiences && candidate.workExperiences.length > 0) {
        // Sort work experiences by start date (oldest first)
        const sortedExperiences = [...candidate.workExperiences]
          .filter(we => we.startDate)
          .sort((a, b) => {
            const dateA = new Date(a.startDate!)
            const dateB = new Date(b.startDate!)
            return dateA.getTime() - dateB.getTime()
          })
        
        if (sortedExperiences.length > 0) {
          const firstJobTitle = sortedExperiences[0].jobTitle?.toLowerCase().trim() || ""
          const filterJobTitle = filters.jobTitle.trim().toLowerCase()
          
          if (firstJobTitle && firstJobTitle.includes(filterJobTitle)) {
            const firstExperience = sortedExperiences[0]
            workExperienceItems.push({
              name: `${firstExperience.employerName} - ${firstExperience.jobTitle || 'N/A'}`,
              matchedCriteria: [{
                type: 'jobTitleStartedCareer',
                label: 'Started Career With Job Title',
                values: [firstExperience.jobTitle || 'N/A']
              }],
              context: {
                employerName: firstExperience.employerName,
                jobTitle: firstExperience.jobTitle,
                startDate: firstExperience.startDate,
                endDate: firstExperience.endDate,
                isFirstJob: true
              }
            })
          }
        }
      }
    }

    // Years of Experience match (candidate-level, not per work experience)
    if (filters.yearsOfExperienceMin || filters.yearsOfExperienceMax) {
      const candidateYearsOfExperience = calculateYearsOfExperience(candidate)
      let yearsMatch = false
      const matchedCriteria: MatchCriterion[] = []

      if (filters.yearsOfExperienceMin) {
        const filterMin = parseFloat(filters.yearsOfExperienceMin)
        if (!isNaN(filterMin) && candidateYearsOfExperience >= filterMin) {
          yearsMatch = true
          matchedCriteria.push({
            type: 'yearsOfExperience',
            label: 'Years of Experience',
            values: [`${candidateYearsOfExperience} years (min: ${filterMin})`]
          })
        }
      }

      if (filters.yearsOfExperienceMax) {
        const filterMax = parseFloat(filters.yearsOfExperienceMax)
        if (!isNaN(filterMax) && candidateYearsOfExperience <= filterMax) {
          yearsMatch = true
          if (!matchedCriteria.some(c => c.type === 'yearsOfExperience')) {
            matchedCriteria.push({
              type: 'yearsOfExperience',
              label: 'Years of Experience',
              values: [`${candidateYearsOfExperience} years (max: ${filterMax})`]
            })
          } else {
            // Update existing criterion
            const existing = matchedCriteria.find(c => c.type === 'yearsOfExperience')
            if (existing) {
              existing.values[0] = `${candidateYearsOfExperience} years (${filters.yearsOfExperienceMin || '0'}-${filterMax})`
            }
          }
        }
      }

      if (yearsMatch) {
        workExperienceItems.push({
          name: 'Total Experience',
          matchedCriteria,
          context: {
            yearsOfExperience: candidateYearsOfExperience
          }
        })
      }
    }

    // Promotions in Last N Years match (candidate-level)
    if (filters.minPromotionsInLastYears?.minPromotions && filters.minPromotionsInLastYears?.years) {
      const minPromotions = parseInt(filters.minPromotionsInLastYears.minPromotions)
      const years = parseInt(filters.minPromotionsInLastYears.years)
      
      if (!isNaN(minPromotions) && !isNaN(years) && minPromotions > 0 && years > 0) {
        const promotionCount = countPromotionsInLastYears(candidate, years)
        
        if (promotionCount >= minPromotions) {
          workExperienceItems.push({
            name: 'Promotions',
            matchedCriteria: [{
              type: 'promotionsInLastYears',
              label: 'Promotions in Last N Years',
              values: [`${promotionCount} promotion${promotionCount !== 1 ? 's' : ''} in last ${years} year${years !== 1 ? 's' : ''} (min: ${minPromotions})`]
            }],
            context: {
              promotionCount,
              years,
              minPromotions
            }
          })
        }
      }
    }

    if (workExperienceItems.length > 0) {
      categories.push({
        type: 'employers', // Reuse employers type for work experience
        label: 'Work Experience',
        icon: '💼',
        color: 'indigo',
        count: workExperienceItems.length,
        items: workExperienceItems
      })
    }
  }

  // Worked with Top Developer Match Context
  if (filters.workedWithTopDeveloper === true) {
    const collaborationItems: MatchItem[] = []
    
    // Check if tolerance window should be applied
    const useTolerance = filters.workedWithTopDeveloperUseTolerance ?? true
    const toleranceDays = useTolerance 
      ? (filters.joinedProjectFromStartToleranceDays || 30)
      : Infinity  // No limit when tolerance is disabled
    
    // Find all top developers
    const topDevelopers = sampleCandidates.filter(c => c.isTopDeveloper === true)
    
    // Find which top developers worked on the same projects
    topDevelopers.forEach(topDev => {
      if (topDev.id === candidate.id) return // Skip if the candidate is themselves a top developer
      
      // Track shared projects
      const sharedProjects: Array<{ projectName: string; employerName: string | null }> = []
      
      // Check candidate's work experiences
      candidate.workExperiences?.forEach(candidateWE => {
        // If employer filter is active, only check projects at matching employers
        if (filters.employers.length > 0) {
          const candidateEmployerMatch = filters.employers.some(
            emp => emp.toLowerCase().trim() === candidateWE.employerName.toLowerCase().trim()
          )
          if (!candidateEmployerMatch) return
          // If tolerance is enabled, require startDate; if disabled, startDate is optional
          if (useTolerance && !candidateWE.startDate) return
        } else {
          // If tolerance is enabled, require startDate; if disabled, startDate is optional
          if (useTolerance && !candidateWE.startDate) return
        }
        
        candidateWE.projects.forEach(candidateProj => {
          if (!candidateProj.projectName) return
          
          const candidateProjName = candidateProj.projectName.toLowerCase().trim()
          
          // Check against top developer's work experiences
          topDev.workExperiences?.forEach(topDevWE => {
            // If employer filter is active, only check projects at matching employers
            if (filters.employers.length > 0) {
              const topDevEmployerMatch = filters.employers.some(
                emp => emp.toLowerCase().trim() === topDevWE.employerName.toLowerCase().trim()
              )
              if (!topDevEmployerMatch) return
              // If tolerance is enabled, require startDate; if disabled, startDate is optional
              if (useTolerance && !topDevWE.startDate) return
            } else {
              // If tolerance is enabled, require startDate; if disabled, startDate is optional
              if (useTolerance && !topDevWE.startDate) return
            }
            
            // Check if same project and same employer
            topDevWE.projects.forEach(topDevProj => {
              if (!topDevProj.projectName) return
              
              const topDevProjName = topDevProj.projectName.toLowerCase().trim()
              
              if (candidateProjName === topDevProjName &&
                  candidateWE.employerName.toLowerCase().trim() === 
                  topDevWE.employerName.toLowerCase().trim()) {
                
                // If tolerance is disabled, match immediately
                if (!useTolerance) {
                  sharedProjects.push({
                    projectName: candidateProj.projectName,
                    employerName: candidateWE.employerName
                  })
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
                    sharedProjects.push({
                      projectName: candidateProj.projectName,
                      employerName: candidateWE.employerName
                    })
                  }
                }
              }
            })
          })
        })
      })
      
      // Check standalone projects only if no employer filter is set
      // Note: For standalone projects, we can't check work experience dates,
      // so we maintain backward compatibility by allowing matches without timeline check
      if (filters.employers.length === 0) {
        const candidateStandaloneProjects = new Set<string>()
        candidate.projects?.forEach(p => {
          if (p.projectName) {
            candidateStandaloneProjects.add(p.projectName.toLowerCase().trim())
          }
        })
        
        topDev.projects?.forEach(topDevProj => {
          if (!topDevProj.projectName) return
          
          const topDevProjName = topDevProj.projectName.toLowerCase().trim()
          
          if (candidateStandaloneProjects.has(topDevProjName)) {
            sharedProjects.push({
              projectName: topDevProj.projectName,
              employerName: null
            })
          }
        })
      }
      
      if (sharedProjects.length > 0) {
        // Collect all unique project names and employers
        const allProjectNames = Array.from(new Set(sharedProjects.map(sp => sp.projectName)))
        const uniqueEmployers = Array.from(new Set(
          sharedProjects
            .map(sp => sp.employerName)
            .filter((emp): emp is string => emp !== null)
        ))
        
        const matchedCriteria: MatchCriterion[] = [
          {
            type: 'sharedProject',
            label: 'Shared Project',
            values: allProjectNames
          }
        ]
        
        // Add employer context if any projects have employers
        if (uniqueEmployers.length > 0) {
          matchedCriteria.push({
            type: 'employer',
            label: 'At Employer',
            values: uniqueEmployers
          })
        }
        
        // Add tolerance window info if applicable
        if (useTolerance && toleranceDays !== 30) {
          matchedCriteria.push({
            type: 'toleranceWindow',
            label: 'Within Tolerance',
            values: [`${toleranceDays} days`]
          })
        } else if (!useTolerance) {
          matchedCriteria.push({
            type: 'toleranceWindow',
            label: 'Tolerance',
            values: ['Disabled (any date)']
          })
        }
        
        collaborationItems.push({
          name: `Collaborated with ${topDev.name}`,
          matchedCriteria,
          context: {
            topDeveloperId: topDev.id,
            topDeveloperName: topDev.name,
            employers: uniqueEmployers.length > 0 ? uniqueEmployers : undefined,
            sharedProjects: allProjectNames
          }
        })
      }
    })
    
    if (collaborationItems.length > 0) {
      categories.push({
        type: 'collaboration',
        label: 'Top Developer Collaboration',
        icon: '🌟',
        color: 'yellow',
        count: collaborationItems.length,
        items: collaborationItems
      })
    }
  }

  // Worked with Job Title Match Context
  if (filters.jobTitle && filters.jobTitle.trim() && filters.jobTitleWorkedWith === true) {
    const collaborationItems: MatchItem[] = []
    
    // Check if tolerance window should be applied
    const useTolerance = filters.jobTitleWorkedWithUseTolerance ?? true
    const toleranceDays = useTolerance 
      ? (filters.joinedProjectFromStartToleranceDays || 30)
      : Infinity  // No limit when tolerance is disabled
    
    const filterJobTitle = filters.jobTitle.trim().toLowerCase()
    
    // Find candidates who have the target job title in their work experiences
    const candidatesWithJobTitle = sampleCandidates.filter(c => {
      return c.workExperiences?.some(we => {
        if (!we.jobTitle) return false
        const jobTitleLower = we.jobTitle.toLowerCase().trim()
        return jobTitleLower.includes(filterJobTitle)
      })
    })
    
    // Find which people with job title worked on the same projects
    candidatesWithJobTitle.forEach(personWithJobTitle => {
      if (personWithJobTitle.id === candidate.id) return // Skip if the candidate is themselves
      
      // Track shared projects
      const sharedProjects: Array<{ projectName: string; employerName: string | null; personJobTitle: string }> = []
      
      // Check candidate's work experiences
      candidate.workExperiences?.forEach(candidateWE => {
        // If employer filter is active, only check projects at matching employers
        if (filters.employers.length > 0) {
          const candidateEmployerMatch = filters.employers.some(
            emp => emp.toLowerCase().trim() === candidateWE.employerName.toLowerCase().trim()
          )
          if (!candidateEmployerMatch) return
          // If tolerance is enabled, require startDate; if disabled, startDate is optional
          if (useTolerance && !candidateWE.startDate) return
        } else {
          // If tolerance is enabled, require startDate; if disabled, startDate is optional
          if (useTolerance && !candidateWE.startDate) return
        }
        
        candidateWE.projects.forEach(candidateProj => {
          if (!candidateProj.projectName) return
          
          const candidateProjName = candidateProj.projectName.toLowerCase().trim()
          
          // Check against person's work experiences
          personWithJobTitle.workExperiences?.forEach(personWE => {
            // Check if person has target job title in this work experience
            if (!personWE.jobTitle) return
            const personJobTitleLower = personWE.jobTitle.toLowerCase().trim()
            const personHasTargetJobTitle = personJobTitleLower.includes(filterJobTitle)
            
            if (!personHasTargetJobTitle) return
            
            // If employer filter is active, only check projects at matching employers
            if (filters.employers.length > 0) {
              const personEmployerMatch = filters.employers.some(
                emp => emp.toLowerCase().trim() === personWE.employerName.toLowerCase().trim()
              )
              if (!personEmployerMatch) return
              // If tolerance is enabled, require startDate; if disabled, startDate is optional
              if (useTolerance && !personWE.startDate) return
            } else {
              // If tolerance is enabled, require startDate; if disabled, startDate is optional
              if (useTolerance && !personWE.startDate) return
            }
            
            // Check if same project and same employer
            personWE.projects.forEach(personProj => {
              if (!personProj.projectName) return
              
              const personProjName = personProj.projectName.toLowerCase().trim()
              
              if (candidateProjName === personProjName &&
                  candidateWE.employerName.toLowerCase().trim() === 
                  personWE.employerName.toLowerCase().trim()) {
                
                // If tolerance is disabled, match immediately
                if (!useTolerance) {
                  sharedProjects.push({
                    projectName: candidateProj.projectName,
                    employerName: candidateWE.employerName,
                    personJobTitle: personWE.jobTitle
                  })
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
                    sharedProjects.push({
                      projectName: candidateProj.projectName,
                      employerName: candidateWE.employerName,
                      personJobTitle: personWE.jobTitle
                    })
                  }
                }
              }
            })
          })
        })
      })
      
      // Check standalone projects only if no employer filter is set
      if (filters.employers.length === 0) {
        const candidateStandaloneProjects = new Set<string>()
        candidate.projects?.forEach(p => {
          if (p.projectName) {
            candidateStandaloneProjects.add(p.projectName.toLowerCase().trim())
          }
        })
        
        personWithJobTitle.projects?.forEach(personProj => {
          if (!personProj.projectName) return
          
          const personProjName = personProj.projectName.toLowerCase().trim()
          
          if (candidateStandaloneProjects.has(personProjName)) {
            sharedProjects.push({
              projectName: personProj.projectName,
              employerName: null,
              personJobTitle: filterJobTitle
            })
          }
        })
      }
      
      if (sharedProjects.length > 0) {
        // Collect all unique project names, employers, and job titles
        const allProjectNames = Array.from(new Set(sharedProjects.map(sp => sp.projectName)))
        const uniqueEmployers = Array.from(new Set(
          sharedProjects
            .map(sp => sp.employerName)
            .filter((emp): emp is string => emp !== null)
        ))
        const uniqueJobTitles = Array.from(new Set(sharedProjects.map(sp => sp.personJobTitle)))
        
        const matchedCriteria: MatchCriterion[] = [
          {
            type: 'sharedProject',
            label: 'Shared Project',
            values: allProjectNames
          },
          {
            type: 'jobTitle',
            label: 'Job Title',
            values: uniqueJobTitles
          }
        ]
        
        // Add employer context if any projects have employers
        if (uniqueEmployers.length > 0) {
          matchedCriteria.push({
            type: 'employer',
            label: 'At Employer',
            values: uniqueEmployers
          })
        }
        
        // Add tolerance window info if applicable
        if (useTolerance && toleranceDays !== 30) {
          matchedCriteria.push({
            type: 'toleranceWindow',
            label: 'Within Tolerance',
            values: [`${toleranceDays} days`]
          })
        } else if (!useTolerance) {
          matchedCriteria.push({
            type: 'toleranceWindow',
            label: 'Tolerance',
            values: ['Disabled (any date)']
          })
        }
        
        collaborationItems.push({
          name: `Collaborated with ${personWithJobTitle.name} (${uniqueJobTitles.join(', ')})`,
          matchedCriteria,
          context: {
            personId: personWithJobTitle.id,
            personName: personWithJobTitle.name,
            employers: uniqueEmployers.length > 0 ? uniqueEmployers : undefined,
            sharedProjects: allProjectNames,
            jobTitles: uniqueJobTitles
          }
        })
      }
    })
    
    if (collaborationItems.length > 0) {
      categories.push({
        type: 'collaboration',
        label: 'Job Title Collaboration',
        icon: '👥',
        color: 'blue',
        count: collaborationItems.length,
        items: collaborationItems
      })
    }
  }

  // Published Projects Match Context
  if (filters.hasPublishedProject === true) {
    const publishedItems: MatchItem[] = []
    
    // Get candidate's projects
    const candidateProjects = getCandidateProjects(candidate)
    
    // Filter to published projects
    const publishedProjects = candidateProjects.filter(project => project.isPublished === true)
    
    publishedProjects.forEach(project => {
      // Check if platform filter matches (if set)
      const platforms = project.publishPlatforms || []
      
      if (filters.publishPlatforms.length > 0) {
        const hasPlatformMatch = platforms.some(platform =>
          filters.publishPlatforms.includes(platform)
        )
        if (!hasPlatformMatch) return
      }
      
      const matchedCriteria: MatchCriterion[] = [{
        type: 'publishedPlatform',
        label: 'Published On',
        values: platforms
      }]
      
      // Add store link if available
      if (project.projectLink) {
        matchedCriteria.push({
          type: 'storeLink',
          label: 'Store Link',
          values: [project.projectLink]
        })
      }
      
      publishedItems.push({
        name: project.projectName,
        matchedCriteria,
        context: {
          projectId: project.id,
          projectLink: project.projectLink,
          publishPlatforms: platforms
        }
      })
    })
    
    if (publishedItems.length > 0) {
      categories.push({
        type: 'published',
        label: 'Published Apps',
        icon: '📱',
        color: 'green',
        count: publishedItems.length,
        items: publishedItems
      })
    }
  }

  // Tech Stack Minimum Years Match Context
  if (filters.techStackMinYears && 
      filters.techStackMinYears.techStacks.length > 0 &&
      filters.techStackMinYears.minYears) {
    
    const minYears = parseFloat(filters.techStackMinYears.minYears)
    
    if (!isNaN(minYears) && minYears >= 0) {
      const techStackYearsItems: MatchItem[] = []
      
      filters.techStackMinYears.techStacks.forEach(techStack => {
        const techStackYears = calculateTechStackYears(candidate, techStack)
        
        if (techStackYears >= minYears) {
          techStackYearsItems.push({
            name: techStack,
            matchedCriteria: [{
              type: 'techStackYears',
              label: 'Tech Stack Experience',
              values: [`${techStackYears} years (min: ${minYears})`]
            }],
            context: {
              techStack: techStack,
              years: techStackYears,
              minRequired: minYears
            }
          })
        }
      })
      
      // Only show match if ALL selected tech stacks meet the requirement
      if (techStackYearsItems.length === filters.techStackMinYears.techStacks.length) {
        categories.push({
          type: 'employers', // Reuse type
          label: 'Tech Stack Experience',
          icon: '⚡',
          color: 'blue',
          count: techStackYearsItems.length,
          items: techStackYearsItems
        })
      }
    }
  }

  // Work Mode Minimum Years Match Context
  if (filters.workModeMinYears && 
      filters.workModeMinYears.workModes.length > 0 &&
      filters.workModeMinYears.minYears) {
    
    const minYears = parseFloat(filters.workModeMinYears.minYears)
    
    if (!isNaN(minYears) && minYears >= 0) {
      const workModeYearsItems: MatchItem[] = []
      
      filters.workModeMinYears.workModes.forEach(workMode => {
        const workModeYears = calculateWorkModeYears(candidate, workMode)
        
        if (workModeYears >= minYears) {
          workModeYearsItems.push({
            name: workMode,
            matchedCriteria: [{
              type: 'workModeYears',
              label: 'Work Mode Experience',
              values: [`${workModeYears} years (min: ${minYears})`]
            }],
            context: {
              workMode: workMode,
              years: workModeYears,
              minRequired: minYears
            }
          })
        }
      })
      
      // Only show match if ALL selected work modes meet the requirement
      if (workModeYearsItems.length === filters.workModeMinYears.workModes.length) {
        categories.push({
          type: 'employers', // Reuse type
          label: 'Work Mode Experience',
          icon: '🏠',
          color: 'purple',
          count: workModeYearsItems.length,
          items: workModeYearsItems
        })
      }
    }
  }

  const totalMatches = categories.reduce((sum, cat) => sum + cat.count, 0)

  return {
    candidateId: candidate.id,
    totalMatches,
    categories
  }
}
