import type { Candidate } from "@/lib/types/candidate"
import type { CandidateFilters } from "@/components/candidates-filter-dialog"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"

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
  type: 'projects' | 'employers' | 'education' | 'certifications' | 'basic'
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
    filters.cities.length > 0 ||
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
    filters.candidateTechStacks.length > 0 ||
    filters.candidateDomains.length > 0 ||
    filters.employerStatus.length > 0 ||
    filters.employerCountries.length > 0 ||
    filters.employerCities.length > 0 ||
    filters.employerSalaryPolicies.length > 0 ||
    filters.employerSizeMin ||
    filters.employerSizeMax ||
    filters.universities.length > 0 ||
    filters.universityCountries.length > 0 ||
    filters.universityRankings.length > 0 ||
    filters.universityCities.length > 0 ||
    filters.degreeNames.length > 0 ||
    filters.majorNames.length > 0 ||
    filters.isTopper !== null ||
    filters.isCheetah !== null ||
    filters.educationStartMonth !== null ||
    filters.educationEndMonth !== null ||
    filters.certificationNames.length > 0 ||
    filters.certificationIssuingBodies.length > 0 ||
    filters.certificationLevels.length > 0
  )
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
    filters.candidateDomains.length > 0
  )

  if (hasProjectFilters) {
    const candidateProjects = getCandidateProjects(candidate)
    const projectItems: MatchItem[] = []

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

      // Check tech stacks
      if (filters.candidateTechStacks.length > 0) {
        const matchingTechStacks = we.techStacks.filter(tech =>
          filters.candidateTechStacks.some(filterTech => 
            filterTech.toLowerCase() === tech.toLowerCase()
          )
        )
        if (matchingTechStacks.length > 0) {
          matchedCriteria.push({
            type: 'candidateTechStack',
            label: 'Tech Stack',
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
        projectItems.push({
          name: `${we.employerName} - ${we.jobTitle}`,
          matchedCriteria,
          context: {
            employerName: we.employerName,
            jobTitle: we.jobTitle
          }
        })
      }
    })

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
  }

  // Employer Characteristics Matches
  const hasEmployerFilters = !!(
    filters.employers.length > 0 ||
    filters.employerStatus.length > 0 ||
    filters.employerCountries.length > 0 ||
    filters.employerCities.length > 0 ||
    filters.employerSalaryPolicies.length > 0 ||
    filters.employerSizeMin ||
    filters.employerSizeMax
  )

  if (hasEmployerFilters) {
    const employerItems: MatchItem[] = []

    candidate.workExperiences?.forEach(we => {
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
    filters.educationStartMonth !== null ||
    filters.educationEndMonth !== null
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

      // Education Start Month match
      if (filters.educationStartMonth) {
        if (edu.startMonth) {
          const filterYear = filters.educationStartMonth.getFullYear()
          const filterMonth = filters.educationStartMonth.getMonth()
          const eduYear = edu.startMonth.getFullYear()
          const eduMonth = edu.startMonth.getMonth()
          if (eduYear === filterYear && eduMonth === filterMonth) {
            matchedCriteria.push({
              type: 'startMonth',
              label: 'Start Month',
              values: [edu.startMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })]
            })
            hasMatch = true
          }
        }
      }

      // Education End Month match (Graduation)
      if (filters.educationEndMonth) {
        if (edu.endMonth) {
          const filterYear = filters.educationEndMonth.getFullYear()
          const filterMonth = filters.educationEndMonth.getMonth()
          const eduYear = edu.endMonth.getFullYear()
          const eduMonth = edu.endMonth.getMonth()
          if (eduYear === filterYear && eduMonth === filterMonth) {
            matchedCriteria.push({
              type: 'endMonth',
              label: 'Graduation Month',
              values: [edu.endMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })]
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
            isCheetah: edu.isCheetah
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

  const totalMatches = categories.reduce((sum, cat) => sum + cat.count, 0)

  return {
    candidateId: candidate.id,
    totalMatches,
    categories
  }
}

