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

      // Expected salary range filter
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

      // Employer filter (mock implementation)
      if (appliedFilters.employers.length > 0) {
        // Mock: Check if candidate's profile suggests they worked at any of these employers
        // In real implementation, this would check candidate.workExperiences.employerName
        const hasMatchingEmployer = appliedFilters.employers.some(employer => {
          return candidate.currentJobTitle.toLowerCase().includes(employer.toLowerCase().split(' ')[0]) ||
                 candidate.email.toLowerCase().includes(employer.toLowerCase().replace(/\s+/g, ''))
        })
        if (!hasMatchingEmployer) return false
      }

      // Projects filter (mock implementation)
      if (appliedFilters.projects.length > 0) {
        // Mock: Check if candidate's profile suggests they worked on any of these projects
        // In real implementation, this would check candidate.workExperiences.projects.projectName
        const hasMatchingProject = appliedFilters.projects.some(project => {
          const projectKeywords = project.toLowerCase().split(/[\s-]+/)
          return projectKeywords.some(keyword => 
            candidate.currentJobTitle.toLowerCase().includes(keyword) ||
            (keyword.length > 3 && candidate.currentJobTitle.toLowerCase().includes(keyword))
          )
        })
        if (!hasMatchingProject) return false
      }

      // Project-related filters (mock implementation)
      // In real implementation, these would check candidate.workExperiences and their associated projects

      // Project Status filter
      if (appliedFilters.projectStatus.length > 0) {
        // Mock: Assume candidates with certain job titles worked on projects with specific statuses
        const hasMatchingStatus = appliedFilters.projectStatus.some(status => {
          if (status === "Active" && candidate.currentJobTitle.toLowerCase().includes('senior')) return true
          if (status === "Completed" && candidate.currentJobTitle.toLowerCase().includes('lead')) return true
          return candidate.currentJobTitle.toLowerCase().includes('developer')
        })
        if (!hasMatchingStatus) return false
      }

      // Project Type filter
      if (appliedFilters.projectTypes.length > 0) {
        // Mock: Map job titles to project types
        const hasMatchingType = appliedFilters.projectTypes.some(type => {
          if (type === "Employer" && candidate.currentJobTitle.toLowerCase().includes('senior')) return true
          if (type === "Academic" && candidate.currentJobTitle.toLowerCase().includes('research')) return true
          if (type === "Freelance" && candidate.currentJobTitle.toLowerCase().includes('consultant')) return true
          return candidate.currentJobTitle.toLowerCase().includes('developer')
        })
        if (!hasMatchingType) return false
      }

      // Tech Stacks filter
      if (appliedFilters.techStacks.length > 0) {
        // Mock: Check if job title suggests experience with tech stacks
        const hasMatchingTech = appliedFilters.techStacks.some(tech => {
          const techLower = tech.toLowerCase()
          return candidate.currentJobTitle.toLowerCase().includes(techLower) ||
                 (techLower.includes('react') && candidate.currentJobTitle.toLowerCase().includes('frontend')) ||
                 (techLower.includes('node') && candidate.currentJobTitle.toLowerCase().includes('backend')) ||
                 (techLower.includes('python') && candidate.currentJobTitle.toLowerCase().includes('data'))
        })
        if (!hasMatchingTech) return false
      }

      // Vertical Domains filter
      if (appliedFilters.verticalDomains.length > 0) {
        // Mock: Map job titles to industry domains
        const hasMatchingDomain = appliedFilters.verticalDomains.some(domain => {
          const domainLower = domain.toLowerCase()
          return candidate.email.toLowerCase().includes(domainLower) ||
                 (domainLower.includes('healthcare') && candidate.currentJobTitle.toLowerCase().includes('health')) ||
                 (domainLower.includes('finance') && candidate.currentJobTitle.toLowerCase().includes('financial'))
        })
        if (!hasMatchingDomain) return false
      }

      // Horizontal Domains filter
      if (appliedFilters.horizontalDomains.length > 0) {
        // Mock: Map job titles to solution types
        const hasMatchingHorizontal = appliedFilters.horizontalDomains.some(domain => {
          const domainLower = domain.toLowerCase()
          return (domainLower.includes('crm') && candidate.currentJobTitle.toLowerCase().includes('sales')) ||
                 (domainLower.includes('erp') && candidate.currentJobTitle.toLowerCase().includes('enterprise')) ||
                 (domainLower.includes('analytics') && candidate.currentJobTitle.toLowerCase().includes('data')) ||
                 candidate.currentJobTitle.toLowerCase().includes('developer')
        })
        if (!hasMatchingHorizontal) return false
      }

      // Technical Aspects filter
      if (appliedFilters.technicalAspects.length > 0) {
        // Mock: Map job titles to technical aspects
        const hasMatchingAspect = appliedFilters.technicalAspects.some(aspect => {
          const aspectLower = aspect.toLowerCase()
          return (aspectLower.includes('microservices') && candidate.currentJobTitle.toLowerCase().includes('architect')) ||
                 (aspectLower.includes('authorization') && candidate.currentJobTitle.toLowerCase().includes('security')) ||
                 (aspectLower.includes('real-time') && candidate.currentJobTitle.toLowerCase().includes('senior')) ||
                 candidate.currentJobTitle.toLowerCase().includes('developer')
        })
        if (!hasMatchingAspect) return false
      }

      // Employer-related filters (mock implementation)
      // In real implementation, these would check candidate.workExperiences and their associated employers

      // Employer Status filter
      if (appliedFilters.employerStatus.length > 0) {
        // Mock: Assume candidates with certain characteristics worked at companies with specific statuses
        const hasMatchingStatus = appliedFilters.employerStatus.some(status => {
          if (status === "Active" && candidate.currentJobTitle.toLowerCase().includes('senior')) return true
          if (status === "Flagged" && candidate.currentJobTitle.toLowerCase().includes('consultant')) return true
          return candidate.currentJobTitle.toLowerCase().includes('developer')
        })
        if (!hasMatchingStatus) return false
      }

      // Employer Countries filter
      if (appliedFilters.employerCountries.length > 0) {
        // Mock: Check if candidate profile suggests they worked in these countries
        const hasMatchingCountry = appliedFilters.employerCountries.some(country => {
          const countryLower = country.toLowerCase()
          return candidate.email.toLowerCase().includes(countryLower) ||
                 (countryLower.includes('usa') && candidate.currentJobTitle.toLowerCase().includes('senior')) ||
                 (countryLower.includes('canada') && candidate.currentJobTitle.toLowerCase().includes('remote'))
        })
        if (!hasMatchingCountry) return false
      }

      // Employer Cities filter
      if (appliedFilters.employerCities.length > 0) {
        // Mock: Check if candidate profile suggests they worked in these cities
        const hasMatchingCity = appliedFilters.employerCities.some(city => {
          const cityLower = city.toLowerCase()
          return candidate.city.toLowerCase().includes(cityLower) ||
                 candidate.email.toLowerCase().includes(cityLower) ||
                 (cityLower.includes('york') && candidate.currentJobTitle.toLowerCase().includes('financial')) ||
                 (cityLower.includes('francisco') && candidate.currentJobTitle.toLowerCase().includes('tech'))
        })
        if (!hasMatchingCity) return false
      }

      // Employer Salary Policies filter
      if (appliedFilters.employerSalaryPolicies.length > 0) {
        // Mock: Map job characteristics to salary policy preferences
        const hasMatchingPolicy = appliedFilters.employerSalaryPolicies.some(policy => {
          if (policy === "Tax Free" && candidate.expectedSalary > candidate.currentSalary * 1.2) return true
          if (policy === "Remittance" && candidate.currentJobTitle.toLowerCase().includes('remote')) return true
          return policy === "Standard"
        })
        if (!hasMatchingPolicy) return false
      }

      // Employer Size filter
      if (appliedFilters.employerSizeMin || appliedFilters.employerSizeMax) {
        // Mock: Map job titles to company size preferences
        const candidatePreferredSize = (() => {
          if (candidate.currentJobTitle.toLowerCase().includes('startup')) return 50
          if (candidate.currentJobTitle.toLowerCase().includes('enterprise')) return 1000
          if (candidate.currentJobTitle.toLowerCase().includes('senior')) return 500
          return 200 // Default mid-size
        })()

        if (appliedFilters.employerSizeMin) {
          const filterMin = parseInt(appliedFilters.employerSizeMin)
          if (!isNaN(filterMin) && candidatePreferredSize < filterMin) {
            return false
          }
        }

        if (appliedFilters.employerSizeMax) {
          const filterMax = parseInt(appliedFilters.employerSizeMax)
          if (!isNaN(filterMax) && candidatePreferredSize > filterMax) {
            return false
          }
        }
      }

      // University filter (mock implementation)
      if (appliedFilters.universities.length > 0) {
        // Mock: Check if candidate profile suggests they studied at any of these universities
        // In real implementation, this would check candidate.educations.universityName
        const hasMatchingUniversity = appliedFilters.universities.some(university => {
          const universityLower = university.toLowerCase()
          const universityKeywords = universityLower.split(/[\s-]+/)
          
          return universityKeywords.some(keyword => {
            if (keyword.length > 3) {
              // Mock matching logic based on university prestige and candidate profile
              if ((keyword.includes('mit') || keyword.includes('stanford') || keyword.includes('harvard')) && 
                  (candidate.currentJobTitle.toLowerCase().includes('senior') || 
                   candidate.currentJobTitle.toLowerCase().includes('lead') ||
                   candidate.currentJobTitle.toLowerCase().includes('architect'))) {
                return true
              }
              
              if (keyword.includes('tech') && candidate.currentJobTitle.toLowerCase().includes('engineer')) {
                return true
              }
              
              if (keyword.includes('university') && candidate.currentJobTitle.toLowerCase().includes('developer')) {
                return true
              }
              
              // General matching for other universities
              return candidate.email.toLowerCase().includes(keyword) ||
                     candidate.currentJobTitle.toLowerCase().includes('developer') ||
                     candidate.currentJobTitle.toLowerCase().includes('analyst')
            }
            return false
          })
        })
        if (!hasMatchingUniversity) return false
      }

      // University Countries filter (mock implementation)
      if (appliedFilters.universityCountries.length > 0) {
        // Mock: Check if candidate profile suggests they studied in these countries
        const hasMatchingCountry = appliedFilters.universityCountries.some(country => {
          const countryLower = country.toLowerCase()
          return candidate.email.toLowerCase().includes(countryLower) ||
                 (countryLower.includes('usa') && candidate.currentJobTitle.toLowerCase().includes('senior')) ||
                 (countryLower.includes('canada') && candidate.currentJobTitle.toLowerCase().includes('remote')) ||
                 (countryLower.includes('uk') && candidate.currentJobTitle.toLowerCase().includes('analyst'))
        })
        if (!hasMatchingCountry) return false
      }

      // University Rankings filter (mock implementation)
      if (appliedFilters.universityRankings.length > 0) {
        // Mock: Map candidate seniority to university ranking
        const hasMatchingRanking = appliedFilters.universityRankings.some(ranking => {
          if (ranking === "Top" && (candidate.currentJobTitle.toLowerCase().includes('senior') || 
                                   candidate.currentJobTitle.toLowerCase().includes('lead') ||
                                   candidate.currentJobTitle.toLowerCase().includes('architect'))) {
            return true
          }
          if (ranking === "DPL Favourite" && candidate.currentJobTitle.toLowerCase().includes('consultant')) {
            return true
          }
          if (ranking === "Standard") {
            return candidate.currentJobTitle.toLowerCase().includes('developer') ||
                   candidate.currentJobTitle.toLowerCase().includes('analyst')
          }
          return false
        })
        if (!hasMatchingRanking) return false
      }

      // University Cities filter (mock implementation)
      if (appliedFilters.universityCities.length > 0) {
        // Mock: Check if candidate profile suggests they studied in these cities
        const hasMatchingCity = appliedFilters.universityCities.some(city => {
          const cityLower = city.toLowerCase()
          return candidate.city.toLowerCase().includes(cityLower) ||
                 candidate.email.toLowerCase().includes(cityLower) ||
                 (cityLower.includes('cambridge') && candidate.currentJobTitle.toLowerCase().includes('research')) ||
                 (cityLower.includes('boston') && candidate.currentJobTitle.toLowerCase().includes('tech')) ||
                 (cityLower.includes('toronto') && candidate.currentJobTitle.toLowerCase().includes('engineer'))
        })
        if (!hasMatchingCity) return false
      }

      // Education detail filters (mock implementation)
      // In real implementation, these would check candidate.educations

      // Degree Names filter
      if (appliedFilters.degreeNames.length > 0) {
        // Mock: Map candidate seniority to degree types
        const hasMatchingDegree = appliedFilters.degreeNames.some(degree => {
          const degreeLower = degree.toLowerCase()
          
          if (degreeLower.includes('bachelor') && candidate.currentJobTitle.toLowerCase().includes('junior')) {
            return true
          }
          if (degreeLower.includes('master') && candidate.currentJobTitle.toLowerCase().includes('senior')) {
            return true
          }
          if (degreeLower.includes('phd') && candidate.currentJobTitle.toLowerCase().includes('research')) {
            return true
          }
          if (degreeLower.includes('mba') && candidate.currentJobTitle.toLowerCase().includes('manager')) {
            return true
          }
          
          // General matching for technical degrees
          if ((degreeLower.includes('computer') || degreeLower.includes('engineering')) && 
              (candidate.currentJobTitle.toLowerCase().includes('developer') ||
               candidate.currentJobTitle.toLowerCase().includes('engineer'))) {
            return true
          }
          
          return candidate.currentJobTitle.toLowerCase().includes('developer')
        })
        if (!hasMatchingDegree) return false
      }

      // Major Names filter
      if (appliedFilters.majorNames.length > 0) {
        // Mock: Map candidate job titles to majors
        const hasMatchingMajor = appliedFilters.majorNames.some(major => {
          const majorLower = major.toLowerCase()
          
          if (majorLower.includes('computer science') && 
              candidate.currentJobTitle.toLowerCase().includes('developer')) {
            return true
          }
          if (majorLower.includes('software engineering') && 
              candidate.currentJobTitle.toLowerCase().includes('engineer')) {
            return true
          }
          if (majorLower.includes('data science') && 
              candidate.currentJobTitle.toLowerCase().includes('data')) {
            return true
          }
          if (majorLower.includes('business') && 
              candidate.currentJobTitle.toLowerCase().includes('manager')) {
            return true
          }
          if (majorLower.includes('finance') && 
              candidate.currentJobTitle.toLowerCase().includes('financial')) {
            return true
          }
          
          // General matching
          return candidate.currentJobTitle.toLowerCase().includes('developer') ||
                 candidate.currentJobTitle.toLowerCase().includes('analyst')
        })
        if (!hasMatchingMajor) return false
      }

      // Is Topper filter
      if (appliedFilters.isTopper !== null) {
        // Mock: Map candidate seniority to topper status
        const candidateIsTopper = candidate.currentJobTitle.toLowerCase().includes('senior') ||
                                 candidate.currentJobTitle.toLowerCase().includes('lead') ||
                                 candidate.currentJobTitle.toLowerCase().includes('architect') ||
                                 candidate.currentJobTitle.toLowerCase().includes('principal')
        
        if (appliedFilters.isTopper && !candidateIsTopper) return false
        if (!appliedFilters.isTopper && candidateIsTopper) return false
      }

      // Is Cheetah filter
      if (appliedFilters.isCheetah !== null) {
        // Mock: Map candidate characteristics to cheetah status
        const candidateIsCheetah = candidate.currentJobTitle.toLowerCase().includes('consultant') ||
                                  candidate.currentJobTitle.toLowerCase().includes('freelance') ||
                                  candidate.currentJobTitle.toLowerCase().includes('contractor') ||
                                  candidate.expectedSalary > candidate.currentSalary * 1.3
        
        if (appliedFilters.isCheetah && !candidateIsCheetah) return false
        if (!appliedFilters.isCheetah && candidateIsCheetah) return false
      }

      // Certification-related filters (mock implementation)
      // In real implementation, these would check candidate.certifications

      // Certification Names filter
      if (appliedFilters.certificationNames.length > 0) {
        // Mock: Check if candidate profile suggests they have these certifications
        const hasMatchingCertification = appliedFilters.certificationNames.some(certName => {
          const certLower = certName.toLowerCase()
          const certKeywords = certLower.split(/[\s-]+/)
          
          return certKeywords.some(keyword => {
            if (keyword.length > 2) {
              // Mock matching logic based on certification type and candidate profile
              if ((keyword.includes('aws') || keyword.includes('cloud')) && 
                  (candidate.currentJobTitle.toLowerCase().includes('architect') ||
                   candidate.currentJobTitle.toLowerCase().includes('engineer') ||
                   candidate.currentJobTitle.toLowerCase().includes('developer'))) {
                return true
              }
              
              if (keyword.includes('azure') && candidate.currentJobTitle.toLowerCase().includes('microsoft')) {
                return true
              }
              
              if (keyword.includes('google') && candidate.currentJobTitle.toLowerCase().includes('cloud')) {
                return true
              }
              
              // General matching for other certifications
              return candidate.currentJobTitle.toLowerCase().includes(keyword) ||
                     candidate.email.toLowerCase().includes(keyword)
            }
            return false
          })
        })
        if (!hasMatchingCertification) return false
      }

      // Certification Issuing Bodies filter
      if (appliedFilters.certificationIssuingBodies.length > 0) {
        // Mock: Map candidate profiles to certification providers
        const hasMatchingIssuer = appliedFilters.certificationIssuingBodies.some(issuer => {
          const issuerLower = issuer.toLowerCase()
          
          if (issuerLower.includes('amazon') && candidate.currentJobTitle.toLowerCase().includes('cloud')) {
            return true
          }
          if (issuerLower.includes('microsoft') && candidate.currentJobTitle.toLowerCase().includes('azure')) {
            return true
          }
          if (issuerLower.includes('google') && candidate.currentJobTitle.toLowerCase().includes('gcp')) {
            return true
          }
          if (issuerLower.includes('oracle') && candidate.currentJobTitle.toLowerCase().includes('database')) {
            return true
          }
          
          // General matching
          return candidate.currentJobTitle.toLowerCase().includes('certified') ||
                 candidate.currentJobTitle.toLowerCase().includes('professional')
        })
        if (!hasMatchingIssuer) return false
      }

      // Certification Levels filter
      if (appliedFilters.certificationLevels.length > 0) {
        // Mock: Map candidate seniority to certification levels
        const hasMatchingLevel = appliedFilters.certificationLevels.some(level => {
          const levelLower = level.toLowerCase()
          
          if (levelLower.includes('expert') && 
              (candidate.currentJobTitle.toLowerCase().includes('senior') ||
               candidate.currentJobTitle.toLowerCase().includes('lead') ||
               candidate.currentJobTitle.toLowerCase().includes('architect'))) {
            return true
          }
          
          if (levelLower.includes('professional') && 
              candidate.currentJobTitle.toLowerCase().includes('senior')) {
            return true
          }
          
          if (levelLower.includes('associate') && 
              (candidate.currentJobTitle.toLowerCase().includes('junior') ||
               candidate.currentJobTitle.toLowerCase().includes('developer'))) {
            return true
          }
          
          // Default matching
          return candidate.currentJobTitle.toLowerCase().includes('developer') ||
                 candidate.currentJobTitle.toLowerCase().includes('engineer')
        })
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

      // Global Tech Stacks filter (mock implementation)
      if (globalFilters.techStacks.length > 0) {
        const hasMatchingTech = globalFilters.techStacks.some(tech => {
          const techLower = tech.toLowerCase()
          return candidate.currentJobTitle.toLowerCase().includes(techLower) ||
                 (techLower.includes('react') && candidate.currentJobTitle.toLowerCase().includes('frontend')) ||
                 (techLower.includes('node') && candidate.currentJobTitle.toLowerCase().includes('backend')) ||
                 (techLower.includes('python') && candidate.currentJobTitle.toLowerCase().includes('data'))
        })
        if (!hasMatchingTech) return false
      }

      // Global Vertical Domains filter (mock implementation)
      if (globalFilters.verticalDomains.length > 0) {
        const hasMatchingDomain = globalFilters.verticalDomains.some(domain => {
          const domainLower = domain.toLowerCase()
          return candidate.email.toLowerCase().includes(domainLower) ||
                 (domainLower.includes('healthcare') && candidate.currentJobTitle.toLowerCase().includes('health')) ||
                 (domainLower.includes('finance') && candidate.currentJobTitle.toLowerCase().includes('financial'))
        })
        if (!hasMatchingDomain) return false
      }

      // Global Horizontal Domains filter (mock implementation)
      if (globalFilters.horizontalDomains.length > 0) {
        const hasMatchingHorizontal = globalFilters.horizontalDomains.some(domain => {
          const domainLower = domain.toLowerCase()
          return (domainLower.includes('crm') && candidate.currentJobTitle.toLowerCase().includes('sales')) ||
                 (domainLower.includes('erp') && candidate.currentJobTitle.toLowerCase().includes('enterprise')) ||
                 (domainLower.includes('analytics') && candidate.currentJobTitle.toLowerCase().includes('data'))
        })
        if (!hasMatchingHorizontal) return false
      }

      // Global Technical Aspects filter (mock implementation)
      if (globalFilters.technicalAspects.length > 0) {
        const hasMatchingAspect = globalFilters.technicalAspects.some(aspect => {
          const aspectLower = aspect.toLowerCase()
          return (aspectLower.includes('microservices') && candidate.currentJobTitle.toLowerCase().includes('architect')) ||
                 (aspectLower.includes('authorization') && candidate.currentJobTitle.toLowerCase().includes('security')) ||
                 (aspectLower.includes('real-time') && candidate.currentJobTitle.toLowerCase().includes('senior'))
        })
        if (!hasMatchingAspect) return false
      }

      // Global Employers filter (mock implementation)
      if (globalFilters.employers.length > 0) {
        const hasMatchingEmployer = globalFilters.employers.some(employer => {
          return candidate.currentJobTitle.toLowerCase().includes(employer.toLowerCase().split(' ')[0]) ||
                 candidate.email.toLowerCase().includes(employer.toLowerCase().replace(/\s+/g, ''))
        })
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

    if (projectFilter) {
      // Mock logic: Find candidates who have this project in their work experience
      candidateList = candidateList.filter(candidate => {
        // Mock matching logic - check if candidate might have worked on this project
        return (
          candidate.currentJobTitle.toLowerCase().includes('developer') ||
          candidate.currentJobTitle.toLowerCase().includes('engineer') ||
          candidate.currentJobTitle.toLowerCase().includes('designer')
        )
      })
    }

    if (universityFilter) {
      // Mock logic: Find candidates who studied at this university
      candidateList = candidateList.filter(candidate => {
        const universityNameLower = universityFilter.name.toLowerCase()
        
        // Simple mock: assume candidates with certain characteristics studied at top universities
        if (universityNameLower.includes('mit') || universityNameLower.includes('stanford') || universityNameLower.includes('harvard')) {
          return (
            candidate.currentJobTitle.toLowerCase().includes('senior') ||
            candidate.currentJobTitle.toLowerCase().includes('lead') ||
            candidate.currentJobTitle.toLowerCase().includes('architect')
          )
        }
        
        // For other universities, return a broader match
        return (
          candidate.currentJobTitle.toLowerCase().includes('developer') ||
          candidate.currentJobTitle.toLowerCase().includes('engineer') ||
          candidate.currentJobTitle.toLowerCase().includes('designer') ||
          candidate.currentJobTitle.toLowerCase().includes('analyst')
        )
      })
    }

    if (certificationFilter) {
      // Mock logic: Find candidates who are certified with this certification
      candidateList = candidateList.filter(candidate => {
        const certificationNameLower = certificationFilter.name.toLowerCase()
        
        // Mock matching logic based on certification type
        if (certificationNameLower.includes('aws') || certificationNameLower.includes('cloud')) {
          return (
            candidate.currentJobTitle.toLowerCase().includes('architect') ||
            candidate.currentJobTitle.toLowerCase().includes('engineer') ||
            candidate.currentJobTitle.toLowerCase().includes('developer')
          )
        }
        
        // For other certifications, return a broader match
        return (
          candidate.currentJobTitle.toLowerCase().includes('developer') ||
          candidate.currentJobTitle.toLowerCase().includes('engineer') ||
          candidate.currentJobTitle.toLowerCase().includes('designer') ||
          candidate.currentJobTitle.toLowerCase().includes('analyst')
        )
      })
    }

    if (employerFilter) {
      // Mock logic: Find candidates who have worked at this employer
      candidateList = candidateList.filter(candidate => {
        const employerNameLower = employerFilter.name.toLowerCase()
        
        // Mock matching logic based on employer name
        // In real implementation, this would check candidate.workExperiences.employerName
        const employerKeywords = employerNameLower.split(/[\s-]+/)
        return employerKeywords.some(keyword => {
          if (keyword.length > 2) {
            return (
              candidate.currentJobTitle.toLowerCase().includes(keyword) ||
              candidate.email.toLowerCase().includes(keyword.replace(/\s+/g, '')) ||
              (keyword.includes('tech') && candidate.currentJobTitle.toLowerCase().includes('developer')) ||
              (keyword.includes('corp') && candidate.currentJobTitle.toLowerCase().includes('senior'))
            )
          }
          return false
        })
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
