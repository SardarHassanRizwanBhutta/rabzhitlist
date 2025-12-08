"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Users, GraduationCap, Award, Building2, Globe } from "lucide-react"
import { CandidatesTable } from "@/components/candidates-table"
import { CandidateCreationDialog, CandidateFormData } from "@/components/candidate-creation-dialog"
import { CandidatesFilterDialog, CandidateFilters } from "@/components/candidates-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Candidate } from "@/lib/types/candidate"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"

interface CandidatesPageClientProps {
  candidates: Candidate[]
}

const initialFilters: CandidateFilters = {
  cities: [],
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
  // Candidate work experience tech stacks
  candidateTechStacks: [],
  // Employer-related filters
  employerStatus: [],
  employerCountries: [],
  employerCities: [],
  employerSalaryPolicies: [],
  employerSizeMin: "",
  employerSizeMax: "",
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
  // Certification-related filters
  certificationNames: [],
  certificationIssuingBodies: [],
  certificationLevels: [],
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
      // City filter
      if (appliedFilters.cities.length > 0 && !appliedFilters.cities.includes(candidate.city)) {
        return false
      }

      // Current salary range filter
      if (appliedFilters.currentSalaryMin) {
        const minSalary = parseFloat(appliedFilters.currentSalaryMin)
        if (!isNaN(minSalary) && candidate.currentSalary !== null && candidate.currentSalary < minSalary) {
          return false
        }
      }
      if (appliedFilters.currentSalaryMax) {
        const maxSalary = parseFloat(appliedFilters.currentSalaryMax)
        if (!isNaN(maxSalary) && candidate.currentSalary !== null && candidate.currentSalary > maxSalary) {
          return false
        }
      }

      // Expected salary range filter
      if (appliedFilters.expectedSalaryMin) {
        const minSalary = parseFloat(appliedFilters.expectedSalaryMin)
        if (!isNaN(minSalary) && candidate.expectedSalary !== null && candidate.expectedSalary < minSalary) {
          return false
        }
      }
      if (appliedFilters.expectedSalaryMax) {
        const maxSalary = parseFloat(appliedFilters.expectedSalaryMax)
        if (!isNaN(maxSalary) && candidate.expectedSalary !== null && candidate.expectedSalary > maxSalary) {
          return false
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

      // Candidate Tech Stacks filter (Work Experience) - Check only work experience tech stacks
      if (appliedFilters.candidateTechStacks.length > 0) {
        const workExperienceTechStacks = new Set<string>()
        // Add tech stacks from work experiences only
        candidate.workExperiences?.forEach(we => {
          we.techStacks.forEach(tech => workExperienceTechStacks.add(tech.toLowerCase()))
        })
        
        const hasMatchingTech = appliedFilters.candidateTechStacks.some(filterTech => 
          workExperienceTechStacks.has(filterTech.toLowerCase())
        )
        if (!hasMatchingTech) return false
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

    return candidateList
  }, [candidates, projectFilter, universityFilter, certificationFilter, employerFilter, filters, applyGlobalFilters])

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
      
      <CandidatesTable candidates={filteredCandidates} />
    </div>
  )
}
