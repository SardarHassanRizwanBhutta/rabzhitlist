"use client"

import * as React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { CandidateStatus, CANDIDATE_STATUS_LABELS } from "@/lib/types/candidate"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { PROJECT_STATUS_LABELS, ProjectStatus } from "@/lib/types/project"
import { EmployerStatus, SalaryPolicy, EmployerRanking, EmployerType, EMPLOYER_STATUS_LABELS, SALARY_POLICY_LABELS, EMPLOYER_RANKING_LABELS, EMPLOYER_TYPE_LABELS } from "@/lib/types/employer"
import { UniversityRanking, UNIVERSITY_RANKING_LABELS } from "@/lib/types/university"

// Filter interfaces
export interface CandidateFilters {
  // Global search for basic info fields (name, email, phone, CNIC, etc.)
  basicInfoSearch: string
  // Dedicated posting title filter
  postingTitle: string
  cities: string[]
  excludeCities: string[]  // Exclude candidates from major cities (for remote cities filter)
  status: string[]  // Filter by candidate status (active, pending, interviewed, shortlisted, hired, rejected, withdrawn)
  currentSalaryMin: string
  currentSalaryMax: string
  expectedSalaryMin: string
  expectedSalaryMax: string
  employers: string[]
  projects: string[]
  // Project-related filters
  projectStatus: string[]
  projectTypes: string[]
  techStacks: string[]
  clientLocations: string[]  // Filter by client's location in projects (e.g., "San Francisco", "Silicon Valley", "United States")
  minClientLocationCount: string  // Minimum number of unique client locations/countries (e.g., "2" for multi-country projects)
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  // Start Date Range - filters by project startDate only
  startDateStart: Date | null
  startDateEnd: Date | null
  // Candidate work experience tech stacks
  candidateTechStacks: string[]
  candidateTechStacksRequireAll: boolean  // false = OR logic (any), true = AND logic (all)
  candidateTechStacksRequireInBoth: boolean  // false = work experience only, true = require in both work experience AND projects
  // Tech stack minimum years of experience
  techStackMinYears: {
    techStacks: string[]
    minYears: string
  }
  // Candidate work experience domains
  candidateDomains: string[]
  // Candidate work experience shift types
  shiftTypes: string[]
  // Candidate work experience work modes
  workModes: string[]
  // Work mode minimum years of experience
  workModeMinYears: {
    workModes: string[]
    minYears: string
  }
  // Candidate work experience time support zones
  timeSupportZones: string[]
  // Currently Working filter
  isCurrentlyWorking: boolean | null  // null = no filter, true = only currently working, false = only not currently working
  // Worked with Top Developer filter
  workedWithTopDeveloper: boolean | null
  workedWithTopDeveloperUseTolerance: boolean  // true = apply tolerance, false = ignore dates
  // Top Developer filter
  isTopDeveloper: boolean | null  // null = no filter, true = only top developers
  // Job title filter
  jobTitle: string
  // Years of experience filters
  yearsOfExperienceMin: string
  yearsOfExperienceMax: string
  // Average job tenure filters (across all employers)
  avgJobTenureMin: string
  avgJobTenureMax: string
  // Maximum job changes in last N years filter
  maxJobChangesInLastYears: {
    maxChanges: string  // e.g., "1", "2", "3" - empty string means no filter
    years: string       // e.g., "3", "5" - empty string means no filter
  }
  // Promotions in last N years filter (independent, works across all companies)
  minPromotionsInLastYears: {
    minPromotions: string  // e.g., "3" - empty string means no filter
    years: string          // e.g., "5" - empty string means no filter
  }
  // Joined Project From Start filter
  joinedProjectFromStart: boolean | null  // null = no filter, true = joined from start
  joinedProjectFromStartToleranceDays: number  // Tolerance window in days (default: 30)
  // Mutual Connections with DPL filter
  hasMutualConnectionWithDPL: boolean | null  // null = no filter, true = has mutual connection
  mutualConnectionToleranceMonths: number  // Tolerance for date gaps in months (default: 0)
  mutualConnectionType: 'education' | 'work' | 'both' | null  // Filter by connection type
  // Project team size filters
  projectTeamSizeMin: string
  projectTeamSizeMax: string
  // Published project filters
  hasPublishedProject: boolean | null  // null = no filter, true = has published app/project
  publishPlatforms: string[]  // ["App Store", "Play Store"] - filter by specific platforms
  minProjectDownloadCount: string  // Minimum download count for projects candidate worked on (e.g., "100000" for 100K+)
  // Employer-related filters
  employerStatus: string[]
  employerCountries: string[]
  employerCities: string[]
  employerTypes: string[]  // Filter by employer type (Services Based, Product Based, SAAS, Startup, Integrator, Resource Augmentation)
  // Career Transition filter - Find candidates who moved from one employer type to another
  careerTransitionFromType: string[]  // Previous employer types (e.g., "Services Based")
  careerTransitionToType: string[]  // Current/new employer types (e.g., "Product Based")
  careerTransitionRequireCurrent: boolean  // If true, "to" type must be current/most recent employer
  employerSalaryPolicies: string[]
  employerSizeMin: string
  employerSizeMax: string
  employerRankings: string[]  // Filter candidates by employer ranking
  // University-related filters
  universities: string[]
  universityCountries: string[]
  universityRankings: string[]
  universityCities: string[]
  // Education detail filters
  degreeNames: string[]
  majorNames: string[]
  isTopper: boolean | null  // null = no filter, true = only toppers, false = only non-toppers
  isCheetah: boolean | null // null = no filter, true = only cheetah, false = only non-cheetah
  // Graduation Date Range - filters by endMonth only
  educationEndDateStart: Date | null
  educationEndDateEnd: Date | null
  // Certification-related filters
  certificationNames: string[]
  certificationIssuingBodies: string[]
  certificationLevels: string[]
  // Personality type filter
  personalityTypes: string[]  // Filter by personality types (e.g., ["ESTJ", "INTJ"])
  // Source filter
  source: string[]  // Filter by candidate source (e.g., ["Referral", "DPL Employee"])
  // Achievement-related filters (renamed from competition-related)
  achievementTypes: string[]  // Filter by achievement type (e.g., ["Competition", "Open Source", "Award"])
  achievementPlatforms: string[]  // Filter by achievement platform/name (e.g., ["HackerOne", "Kaggle", "React"])
  internationalBugBountyOnly: boolean  // When true, only shows candidates with international bug bounty platforms
  // Legacy filters (kept for backward compatibility)
  competitionPlatforms: string[]  // DEPRECATED: Use achievementPlatforms instead
}

interface CandidatesFilterDialogProps {
  children?: React.ReactNode
  filters: CandidateFilters
  onFiltersChange: (filters: CandidateFilters) => void
  onClearFilters: () => void
}

// Mock data for filter options (removed unused statusOptions)

// Mock data for filter options
const extractUniqueCities = () => {
  const cities = new Set<string>()
  sampleCandidates.forEach(candidate => {
    if (candidate.city) {
      cities.add(candidate.city)
    }
  })
  return Array.from(cities).sort()
}

const extractUniqueEmployers = () => {
  const employers = new Set<string>()
  sampleEmployers.forEach(employer => {
    employers.add(employer.name)
  })
  return Array.from(employers).sort()
}

const extractUniqueProjects = () => {
  const projects = new Set<string>()
  sampleProjects.forEach(project => {
    projects.add(project.projectName)
  })
  return Array.from(projects).sort()
}

// Extract unique project-related data for filters
const extractUniqueProjectStatuses = () => {
  const statuses = new Set<string>()
  sampleProjects.forEach(project => {
    statuses.add(project.status)
  })
  return Array.from(statuses).sort()
}

const extractUniqueProjectTypes = () => {
  const types = new Set<string>()
  sampleProjects.forEach(project => {
    types.add(project.projectType)
  })
  return Array.from(types).sort()
}

// Extract tech stacks from projects (for Project Expertise filter)
const extractUniqueProjectTechStacks = () => {
  const techStacks = new Set<string>()
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  return Array.from(techStacks).sort()
}

// Extract tech stacks from candidate work experiences (for Candidate Tech Stacks filter)
const extractUniqueCandidateTechStacks = () => {
  const techStacksMap = new Map<string, string>() // Map<lowercase, original>
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.techStacks.forEach(tech => {
        const lowerTech = tech.toLowerCase().trim()
        if (lowerTech && !techStacksMap.has(lowerTech)) {
          // Store the first occurrence (preserving original casing)
          techStacksMap.set(lowerTech, tech.trim())
        }
      })
    })
  })
  return Array.from(techStacksMap.values()).sort()
}

// Extract domains from candidate work experiences (for Candidate Domains filter)
const extractUniqueCandidateDomains = () => {
  const domains = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.domains.forEach(domain => {
        if (domain) {
          domains.add(domain)
        }
      })
    })
  })
  return Array.from(domains).sort()
}

const extractUniqueVerticalDomains = () => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.verticalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

const extractUniqueHorizontalDomains = () => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.horizontalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

// Extract unique client locations from projects
const extractUniqueClientLocations = () => {
  const locations = new Set<string>()
  sampleProjects.forEach(project => {
    if (project.clientLocation) {
      locations.add(project.clientLocation)
    }
  })
  return Array.from(locations).sort()
}

const extractUniqueTechnicalAspects = () => {
  const aspects = new Set<string>()
  sampleProjects.forEach(project => {
    project.technicalAspects.forEach(aspect => aspects.add(aspect))
  })
  return Array.from(aspects).sort()
}

// Extract unique employer-related data for filters
const extractUniqueEmployerStatuses = () => {
  const statuses = new Set<string>()
  sampleEmployers.forEach(employer => {
    statuses.add(employer.status)
  })
  return Array.from(statuses).sort()
}

const extractUniqueEmployerCountries = () => {
  const countries = new Set<string>()
  sampleEmployers.forEach(employer => {
    employer.locations.forEach(location => {
      if (location.country !== null) {
        countries.add(location.country)
      }
    })
  })
  return Array.from(countries).sort()
}

const extractUniqueEmployerCities = () => {
  const cities = new Set<string>()
  sampleEmployers.forEach(employer => {
    employer.locations.forEach(location => {
      if (location.city !== null) {
        cities.add(location.city)
      }
    })
  })
  return Array.from(cities).sort()
}

const extractUniqueEmployerSalaryPolicies = () => {
  const policies = new Set<string>()
  sampleEmployers.forEach(employer => {
    employer.locations.forEach(location => {
      policies.add(location.salaryPolicy)
    })
  })
  return Array.from(policies).sort()
}

// Extract unique university data for filters
const extractUniqueUniversities = () => {
  const universities = new Set<string>()
  sampleUniversities.forEach(university => {
    universities.add(university.name)
  })
  return Array.from(universities).sort()
}

const extractUniqueUniversityCountries = () => {
  const countries = new Set<string>()
  sampleUniversities.forEach(university => {
    countries.add(university.country)
  })
  return Array.from(countries).sort()
}

const extractUniqueUniversityCities = () => {
  const cities = new Set<string>()
  sampleUniversities.forEach(university => {
    university.locations.forEach(location => {
      cities.add(location.city)
    })
  })
  return Array.from(cities).sort()
}

// Extract unique education detail data for filters
const extractUniqueDegreeNames = () => {
  const degrees = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.educations?.forEach(education => {
      if (education.degreeName) {
        degrees.add(education.degreeName)
      }
    })
  })
  return Array.from(degrees).sort()
}

const extractUniqueMajorNames = () => {
  const majors = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.educations?.forEach(education => {
      if (education.majorName) {
        majors.add(education.majorName)
      }
    })
  })
  return Array.from(majors).sort()
}

// Extract unique certification data for filters
const extractUniqueCertificationNames = () => {
  const names = new Set<string>()
  sampleCertifications.forEach(certification => {
    names.add(certification.certificationName)
  })
  return Array.from(names).sort()
}

const extractUniqueCertificationIssuingBodies = () => {
  const issuingBodies = new Set<string>()
  sampleCertifications.forEach(certification => {
    if (certification.issuingBody !== null) {
      issuingBodies.add(certification.issuingBody)
    }
  })
  return Array.from(issuingBodies).sort()
}

const extractUniqueCertificationLevels = () => {
  const levels = new Set<string>()
  sampleCertifications.forEach(certification => {
    levels.add(certification.certificationLevel)
  })
  return Array.from(levels).sort()
}

// International bug bounty platforms list
const INTERNATIONAL_BUG_BOUNTY_PLATFORMS = [
  "HackerOne",
  "Bugcrowd",
  "Synack",
  "Cobalt",
  "Intigriti",
  "YesWeHack",
  "CVE",
  "Immunefi",
  "HackenProof",
]

// Extract unique achievement platforms/names from candidates
const extractUniqueAchievementPlatforms = () => {
  const platforms = new Set<string>()
  sampleCandidates.forEach(candidate => {
    // Extract from achievements (new structure)
    candidate.achievements?.forEach(achievement => {
      if (achievement.name) {
        platforms.add(achievement.name)
      }
    })
    // Extract from competitions (legacy structure)
    candidate.competitions?.forEach(competition => {
      if (competition.competitionName) {
        platforms.add(competition.competitionName)
      }
    })
  })
  return Array.from(platforms).sort()
}

// Extract unique competition platforms from candidates (legacy - kept for backward compatibility)
const extractUniqueCompetitionPlatforms = () => {
  return extractUniqueAchievementPlatforms()
}

const cityOptions: MultiSelectOption[] = extractUniqueCities().map(city => ({
  value: city,
  label: city
}))

const employerOptions: MultiSelectOption[] = extractUniqueEmployers().map(employer => ({
  value: employer,
  label: employer
}))

const projectOptions: MultiSelectOption[] = extractUniqueProjects().map(project => ({
  value: project,
  label: project
}))

// Project-related filter options
const projectStatusOptions: MultiSelectOption[] = extractUniqueProjectStatuses().map(status => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status as ProjectStatus] || status
}))

const projectTypeOptions: MultiSelectOption[] = extractUniqueProjectTypes().map(type => ({
  value: type,
  label: type
}))

// Project tech stacks (for Project Expertise section)
const techStackOptions: MultiSelectOption[] = extractUniqueProjectTechStacks().map(tech => ({
  value: tech,
  label: tech
}))

// Candidate work experience tech stacks (for separate filter)
const candidateTechStackOptions: MultiSelectOption[] = extractUniqueCandidateTechStacks().map(tech => ({
  value: tech,
  label: tech
}))

// Candidate work experience domains (for separate filter)
const candidateDomainOptions: MultiSelectOption[] = extractUniqueCandidateDomains().map(domain => ({
  value: domain,
  label: domain
}))

// Candidate work experience shift types
const shiftTypeOptions: MultiSelectOption[] = [
  { value: "Morning", label: "Morning" },
  { value: "Evening", label: "Evening" },
  { value: "Night", label: "Night" },
  { value: "Rotational", label: "Rotational" },
  { value: "24x7", label: "24x7" },
]

// Candidate work experience work modes
const workModeOptions: MultiSelectOption[] = [
  { value: "Remote", label: "Remote" },
  { value: "Onsite", label: "Onsite" },
  { value: "Hybrid", label: "Hybrid" },
]

// Candidate work experience time support zones
const timeSupportZoneOptions: MultiSelectOption[] = [
  { value: "US", label: "US" },
  { value: "UK", label: "UK" },
  { value: "EU", label: "EU" },
  { value: "APAC", label: "APAC" },
  { value: "MEA", label: "MEA" },
]

// Publish platform options
const publishPlatformOptions: MultiSelectOption[] = [
  { value: "App Store", label: "App Store (iOS)" },
  { value: "Play Store", label: "Play Store (Android)" },
  { value: "Web", label: "Web" },
  { value: "Desktop", label: "Desktop" },
]

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

const clientLocationOptions: MultiSelectOption[] = extractUniqueClientLocations().map(location => ({
  value: location,
  label: location
}))

// Employer-related filter options
const employerStatusOptions: MultiSelectOption[] = extractUniqueEmployerStatuses().map(status => ({
  value: status,
  label: EMPLOYER_STATUS_LABELS[status as EmployerStatus] || status
}))

const employerCountryOptions: MultiSelectOption[] = extractUniqueEmployerCountries().map(country => ({
  value: country,
  label: country
}))

const employerCityOptions: MultiSelectOption[] = extractUniqueEmployerCities().map(city => ({
  value: city,
  label: city
}))

const employerSalaryPolicyOptions: MultiSelectOption[] = extractUniqueEmployerSalaryPolicies().map(policy => ({
  value: policy,
  label: SALARY_POLICY_LABELS[policy as SalaryPolicy] || policy
}))

// University-related filter options
const universityOptions: MultiSelectOption[] = extractUniqueUniversities().map(university => ({
  value: university,
  label: university
}))

const universityCountryOptions: MultiSelectOption[] = extractUniqueUniversityCountries().map(country => ({
  value: country,
  label: country
}))

// Mock data for filter options
const rankingOptions: MultiSelectOption[] = Object.entries(UNIVERSITY_RANKING_LABELS).map(([value, label]) => ({
  value: value as UniversityRanking,
  label
}))

const employerRankingOptions: MultiSelectOption[] = Object.entries(EMPLOYER_RANKING_LABELS).map(([value, label]) => ({
  value: value as EmployerRanking,
  label
}))

const universityCityOptions: MultiSelectOption[] = extractUniqueUniversityCities().map(city => ({
  value: city,
  label: city
}))

// Education detail filter options
const degreeNameOptions: MultiSelectOption[] = extractUniqueDegreeNames().map(degree => ({
  value: degree,
  label: degree
}))

const majorNameOptions: MultiSelectOption[] = extractUniqueMajorNames().map(major => ({
  value: major,
  label: major
}))

// Certification-related filter options
const certificationNameOptions: MultiSelectOption[] = extractUniqueCertificationNames().map(name => ({
  value: name,
  label: name
}))

const certificationIssuingBodyOptions: MultiSelectOption[] = extractUniqueCertificationIssuingBodies().map(body => ({
  value: body,
  label: body
}))

const certificationLevelOptions: MultiSelectOption[] = extractUniqueCertificationLevels().map(level => ({
  value: level,
  label: level
}))

// Achievement-related filter options
const achievementTypeOptions: MultiSelectOption[] = [
  { value: "Competition", label: "Competition" },
  { value: "Open Source", label: "Open Source" },
  { value: "Award", label: "Award" },
  { value: "Medal", label: "Medal" },
  { value: "Publication", label: "Publication" },
  { value: "Certification", label: "Certification" },
  { value: "Recognition", label: "Recognition" },
  { value: "Other", label: "Other" },
]

const achievementPlatformOptions: MultiSelectOption[] = extractUniqueAchievementPlatforms().map(platform => ({
  value: platform,
  label: platform
}))

// Competition-related filter options (legacy - kept for backward compatibility)
// Note: Uses same data as achievementPlatformOptions for backward compatibility
const competitionPlatformOptions: MultiSelectOption[] = achievementPlatformOptions

// Personality type options (MBTI types)
const personalityTypeOptions: MultiSelectOption[] = [
  { value: "ESTJ", label: "ESTJ - Executive" },
  { value: "ENTJ", label: "ENTJ - Commander" },
  { value: "ESFJ", label: "ESFJ - Consul" },
  { value: "ENFJ", label: "ENFJ - Protagonist" },
  { value: "ISTJ", label: "ISTJ - Logistician" },
  { value: "ISFJ", label: "ISFJ - Defender" },
  { value: "INTJ", label: "INTJ - Architect" },
  { value: "INFJ", label: "INFJ - Advocate" },
  { value: "ESTP", label: "ESTP - Entrepreneur" },
  { value: "ESFP", label: "ESFP - Entertainer" },
  { value: "ENTP", label: "ENTP - Debater" },
  { value: "ENFP", label: "ENFP - Campaigner" },
  { value: "ISTP", label: "ISTP - Virtuoso" },
  { value: "ISFP", label: "ISFP - Adventurer" },
  { value: "INTP", label: "INTP - Thinker" },
  { value: "INFP", label: "INFP - Mediator" },
]

// Extract unique source values from candidates
const extractUniqueSources = (): string[] => {
  const sources = new Set<string>()
  sampleCandidates.forEach(candidate => {
    if (candidate.source && candidate.source.trim()) {
      sources.add(candidate.source.trim())
    }
  })
  // Add common source options that might not be in sample data yet
  const commonSources = ["Referral", "DPL Employee", "Job Portal", "LinkedIn", "Direct Application", "University", "Career Fair"]
  commonSources.forEach(source => sources.add(source))
  return Array.from(sources).sort()
}

const sourceOptions: MultiSelectOption[] = extractUniqueSources().map(source => ({
  value: source,
  label: source
}))

const initialFilters: CandidateFilters = {
  // Global search for basic info fields
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
  // Project-related filters
  projectStatus: [],
  projectTypes: [],
  techStacks: [],
  clientLocations: [],
  minClientLocationCount: "",
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
  // Years of experience filters
  yearsOfExperienceMin: "",
  yearsOfExperienceMax: "",
  // Average job tenure filters
  avgJobTenureMin: "",
  avgJobTenureMax: "",
  // Maximum job changes in last N years filter
  maxJobChangesInLastYears: {
    maxChanges: "",
    years: ""
  },
  // Promotions in last N years filter
  minPromotionsInLastYears: {
    minPromotions: "",
    years: ""
  },
  // Joined Project From Start filter
  joinedProjectFromStart: null,
  joinedProjectFromStartToleranceDays: 30,
  // Mutual Connections with DPL filter
  hasMutualConnectionWithDPL: null,
  mutualConnectionToleranceMonths: 0,  // Default: 0 = exact overlap required
  mutualConnectionType: null,  // null = both education and work
  // Project team size filters
  projectTeamSizeMin: "",
  projectTeamSizeMax: "",
  // Published project filters
  hasPublishedProject: null,
  publishPlatforms: [],
  minProjectDownloadCount: "",
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
  source: [],
  // Achievement-related filters
  achievementTypes: [],
  achievementPlatforms: [],
  internationalBugBountyOnly: false,
  // Legacy filters (kept for backward compatibility during migration)
  competitionPlatforms: [],
}

export function CandidatesFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
}: CandidatesFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<CandidateFilters>(filters)
  const [activeTab, setActiveTab] = useState("basic")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  
  // Define sections for navigation
  const sections = [
    { id: "basic", sectionId: "filter-basic", label: "Basic" },
    { id: "experience", sectionId: "filter-experience", label: "Experience" },
    { id: "projects", sectionId: "filter-projects", label: "Projects" },
    { id: "employers", sectionId: "filter-employers", label: "Employers" },
    { id: "education", sectionId: "filter-education", label: "Education" },
    { id: "certifications", sectionId: "filter-certifications", label: "Certifications" },
    { id: "competitions", sectionId: "filter-competitions", label: "Competitions" },
  ]
  
  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (!element || !scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const yOffset = 80 // Account for sticky tabs
    
    // Set flag to prevent IntersectionObserver from interfering
    isScrollingRef.current = true
    
    // Update active tab immediately
    const section = sections.find(s => s.sectionId === sectionId)
    if (section) {
      setActiveTab(section.id)
    }
    
    // Use requestAnimationFrame to ensure layout is calculated
    requestAnimationFrame(() => {
      const currentScrollTop = container.scrollTop
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const elementTopInContainer = elementRect.top - containerRect.top + currentScrollTop
      const targetScrollTop = elementTopInContainer - yOffset
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      })
      
      // Reset flag after scroll completes
      setTimeout(() => {
        isScrollingRef.current = false
      }, 600)
    })
  }
  
  // Handle tab change with scroll
  const handleTabChange = (value: string) => {
    const section = sections.find(s => s.id === value)
    if (section) {
      scrollToSection(section.sectionId)
    }
  }

  // Clear filters for a specific section
  const clearSectionFilters = (sectionId: string) => {
    setTempFilters(prev => {
      const updated = { ...prev }
      switch (sectionId) {
        case "basic":
          updated.basicInfoSearch = ""
          updated.cities = []
          updated.excludeCities = []
          updated.status = []
          updated.personalityTypes = []
          updated.source = []
          updated.currentSalaryMin = ""
          updated.currentSalaryMax = ""
          updated.expectedSalaryMin = ""
          updated.expectedSalaryMax = ""
          updated.postingTitle = ""
          break
        case "experience":
          updated.candidateTechStacks = []
          updated.candidateTechStacksRequireAll = false
          updated.candidateTechStacksRequireInBoth = false
          updated.techStackMinYears = {
            techStacks: [],
            minYears: ""
          }
          updated.candidateDomains = []
          updated.shiftTypes = []
          updated.workModes = []
          updated.workModeMinYears = {
            workModes: [],
            minYears: ""
          }
          updated.timeSupportZones = []
            updated.isCurrentlyWorking = null
            updated.workedWithTopDeveloper = null
            updated.workedWithTopDeveloperUseTolerance = true
          updated.isTopDeveloper = null
          updated.jobTitle = ""
            updated.yearsOfExperienceMin = ""
            updated.yearsOfExperienceMax = ""
            updated.avgJobTenureMin = ""
            updated.avgJobTenureMax = ""
            updated.maxJobChangesInLastYears = {
              maxChanges: "",
              years: ""
            }
            updated.minPromotionsInLastYears = {
              minPromotions: "",
              years: ""
            }
            updated.hasMutualConnectionWithDPL = null
            updated.mutualConnectionToleranceMonths = 0
            updated.mutualConnectionType = null
          break
        case "projects":
          updated.projects = []
          updated.projectStatus = []
          updated.projectTypes = []
          updated.techStacks = []
          updated.clientLocations = []
          updated.minClientLocationCount = ""
          updated.verticalDomains = []
          updated.horizontalDomains = []
          updated.technicalAspects = []
          updated.startDateStart = null
          updated.startDateEnd = null
          updated.projectTeamSizeMin = ""
          updated.projectTeamSizeMax = ""
          updated.hasPublishedProject = null
          updated.publishPlatforms = []
          updated.minProjectDownloadCount = ""
          break
        case "employers":
          updated.employers = []
          updated.employerStatus = []
          updated.employerCountries = []
          updated.employerCities = []
          updated.employerTypes = []
          updated.careerTransitionFromType = []
          updated.careerTransitionToType = []
          updated.careerTransitionRequireCurrent = false
          updated.employerSalaryPolicies = []
          updated.employerSizeMin = ""
          updated.employerSizeMax = ""
          updated.employerRankings = []
          break
        case "education":
          updated.universities = []
          updated.universityCountries = []
          updated.universityRankings = []
          updated.universityCities = []
          updated.degreeNames = []
          updated.majorNames = []
          updated.isTopper = null
          updated.isCheetah = null
          updated.educationEndDateStart = null
          updated.educationEndDateEnd = null
          break
        case "certifications":
          updated.certificationNames = []
          updated.certificationIssuingBodies = []
          updated.certificationLevels = []
          break
        case "competitions":
          updated.achievementTypes = []
          updated.achievementPlatforms = []
          updated.internationalBugBountyOnly = false
          updated.competitionPlatforms = []
          break
      }
      return updated
    })
  }
  
  // IntersectionObserver to detect active section
  useEffect(() => {
    if (!open || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const sectionIds = sections.map(s => s.sectionId)
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update if we're manually scrolling
        if (isScrollingRef.current) return
        
        // Find the entry with the highest intersection ratio
        let maxRatio = 0
        let activeId = sectionIds[0] || "filter-basic"
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            activeId = entry.target.id
          }
        })
        
        if (maxRatio > 0.2) {
          const section = sections.find(s => s.sectionId === activeId)
          if (section) {
            setActiveTab(section.id)
          }
        }
      },
      {
        threshold: [0.2, 0.5, 0.8],
        root: container,
        rootMargin: '-80px 0px -60% 0px'
      }
    )

    // Observe all sections
    const sectionElements: (Element | null)[] = []
    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
        sectionElements.push(element)
      }
    })

    return () => {
      sectionElements.forEach((element) => {
        if (element) observer.unobserve(element)
      })
      observer.disconnect()
    }
  }, [open])

  // Calculate active filter count for each section
  const getSectionFilterCount = (sectionId: string): number => {
    switch (sectionId) {
      case "basic":
        return (
          (tempFilters.basicInfoSearch ? 1 : 0) +
          tempFilters.cities.length +
          tempFilters.excludeCities.length +
          tempFilters.status.length +
          tempFilters.personalityTypes.length +
          tempFilters.source.length +
          (tempFilters.currentSalaryMin ? 1 : 0) +
          (tempFilters.currentSalaryMax ? 1 : 0) +
          (tempFilters.expectedSalaryMin ? 1 : 0) +
          (tempFilters.expectedSalaryMax ? 1 : 0) +
          (tempFilters.postingTitle ? 1 : 0)
        )
      case "experience":
        return (
          tempFilters.candidateTechStacks.length +
          ((tempFilters.techStackMinYears?.techStacks.length || 0) > 0 && tempFilters.techStackMinYears?.minYears ? 1 : 0) +
          tempFilters.candidateDomains.length +
          tempFilters.shiftTypes.length +
          tempFilters.workModes.length +
          ((tempFilters.workModeMinYears?.workModes.length || 0) > 0 && tempFilters.workModeMinYears?.minYears ? 1 : 0) +
          tempFilters.timeSupportZones.length +
          (tempFilters.isCurrentlyWorking !== null ? 1 : 0) +
          (tempFilters.workedWithTopDeveloper !== null ? 1 : 0) +
          (tempFilters.isTopDeveloper !== null ? 1 : 0) +
          (tempFilters.jobTitle ? 1 : 0) +
          (tempFilters.yearsOfExperienceMin ? 1 : 0) +
          (tempFilters.yearsOfExperienceMax ? 1 : 0) +
          (tempFilters.avgJobTenureMin ? 1 : 0) +
          (tempFilters.avgJobTenureMax ? 1 : 0) +
          (tempFilters.maxJobChangesInLastYears?.maxChanges && tempFilters.maxJobChangesInLastYears?.years ? 1 : 0) +
          (tempFilters.minPromotionsInLastYears?.minPromotions && tempFilters.minPromotionsInLastYears?.years ? 1 : 0) +
          (tempFilters.hasMutualConnectionWithDPL !== null ? 1 : 0)
        )
      case "projects":
        return (
          tempFilters.projects.length +
          tempFilters.projectStatus.length +
          tempFilters.projectTypes.length +
          tempFilters.techStacks.length +
          tempFilters.clientLocations.length +
          (tempFilters.minClientLocationCount ? 1 : 0) +
          tempFilters.verticalDomains.length +
          tempFilters.horizontalDomains.length +
          tempFilters.technicalAspects.length +
          (tempFilters.startDateStart ? 1 : 0) +
          (tempFilters.startDateEnd ? 1 : 0) +
          (tempFilters.projectTeamSizeMin ? 1 : 0) +
          (tempFilters.projectTeamSizeMax ? 1 : 0) +
          (tempFilters.hasPublishedProject ? 1 : 0) +
          tempFilters.publishPlatforms.length +
          (tempFilters.minProjectDownloadCount ? 1 : 0)
        )
      case "employers":
        return (
          tempFilters.employers.length +
          tempFilters.employerStatus.length +
          tempFilters.employerCountries.length +
          tempFilters.employerCities.length +
          tempFilters.employerTypes.length +
          tempFilters.careerTransitionFromType.length +
          tempFilters.careerTransitionToType.length +
          (tempFilters.careerTransitionRequireCurrent ? 1 : 0) +
          tempFilters.employerSalaryPolicies.length +
          tempFilters.employerRankings.length +
          (tempFilters.employerSizeMin ? 1 : 0) +
          (tempFilters.employerSizeMax ? 1 : 0)
        )
      case "education":
        return (
          tempFilters.universities.length +
          tempFilters.universityCountries.length +
          tempFilters.universityRankings.length +
          tempFilters.universityCities.length +
          tempFilters.degreeNames.length +
          tempFilters.majorNames.length +
          (tempFilters.isTopper !== null ? 1 : 0) +
          (tempFilters.isCheetah !== null ? 1 : 0) +
          (tempFilters.educationEndDateStart ? 1 : 0) +
          (tempFilters.educationEndDateEnd ? 1 : 0)
        )
      case "certifications":
        return (
          tempFilters.certificationNames.length +
          tempFilters.certificationIssuingBodies.length +
          tempFilters.certificationLevels.length
        )
      case "competitions":
        return (
          tempFilters.achievementTypes.length +
          tempFilters.achievementPlatforms.length +
          (tempFilters.internationalBugBountyOnly ? 1 : 0) +
          (tempFilters.competitionPlatforms.length > 0 ? tempFilters.competitionPlatforms.length : 0)
        )
      default:
        return 0
    }
  }

  // Calculate total active filter count (for the Filter button)
  const activeFilterCount = useMemo(() => 
    sections.reduce((total, section) => total + getSectionFilterCount(section.id), 0),
    [tempFilters]
  )

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof CandidateFilters, value: string[] | string | boolean | Date | null | number | { techStacks: string[], minYears: string } | { workModes: string[], minYears: string } | { maxChanges: string, years: string } | { minPromotions: string, years: string }) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  // Validate date ranges
  const validateDateRanges = (): string | null => {
    // Validate graduation date range
    if (tempFilters.educationEndDateStart && tempFilters.educationEndDateEnd && 
        tempFilters.educationEndDateStart > tempFilters.educationEndDateEnd) {
      return 'Graduation date start must be before graduation date end'
    }
    return null
  }

  const dateRangeError = validateDateRanges()

  const handleApplyFilters = () => {
    // Validate before applying
    if (dateRangeError) {
      return // Don't apply if there are validation errors
    }
    onFiltersChange(tempFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters(initialFilters)
    onClearFilters()
    // Keep dialog open for user to see cleared state
  }

  const handleCancel = () => {
    setTempFilters(filters) // Reset to current filters
    setOpen(false)
  }

  const hasAnyTempFilters = 
    tempFilters.basicInfoSearch ||
    tempFilters.cities.length > 0 ||
    tempFilters.excludeCities.length > 0 ||
    tempFilters.status.length > 0 ||
    tempFilters.personalityTypes.length > 0 ||
    tempFilters.source.length > 0 ||
    tempFilters.currentSalaryMin ||
    tempFilters.currentSalaryMax ||
    tempFilters.expectedSalaryMin ||
    tempFilters.expectedSalaryMax ||
    tempFilters.postingTitle ||
    tempFilters.employers.length > 0 ||
    tempFilters.projects.length > 0 ||
    tempFilters.projectStatus.length > 0 ||
    tempFilters.projectTypes.length > 0 ||
    tempFilters.techStacks.length > 0 ||
    tempFilters.clientLocations.length > 0 ||
    tempFilters.minClientLocationCount ||
    tempFilters.candidateTechStacks.length > 0 ||
    (tempFilters.techStackMinYears && tempFilters.techStackMinYears.techStacks.length > 0 && tempFilters.techStackMinYears.minYears) ||
    tempFilters.candidateDomains.length > 0 ||
    tempFilters.shiftTypes.length > 0 ||
    tempFilters.workModes.length > 0 ||
    (tempFilters.workModeMinYears && tempFilters.workModeMinYears.workModes.length > 0 && tempFilters.workModeMinYears.minYears) ||
    tempFilters.timeSupportZones.length > 0 ||
    tempFilters.isCurrentlyWorking !== null ||
    tempFilters.workedWithTopDeveloper !== null ||
    tempFilters.jobTitle ||
    tempFilters.yearsOfExperienceMin ||
    tempFilters.yearsOfExperienceMax ||
    tempFilters.avgJobTenureMin ||
    tempFilters.avgJobTenureMax ||
    (tempFilters.maxJobChangesInLastYears?.maxChanges && tempFilters.maxJobChangesInLastYears?.years) ||
    (tempFilters.minPromotionsInLastYears?.minPromotions && tempFilters.minPromotionsInLastYears?.years) ||
    tempFilters.hasMutualConnectionWithDPL !== null ||
    tempFilters.joinedProjectFromStart !== null ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.startDateStart !== null ||
    tempFilters.startDateEnd !== null ||
    tempFilters.projectTeamSizeMin ||
    tempFilters.projectTeamSizeMax ||
    tempFilters.hasPublishedProject !== null ||
    tempFilters.publishPlatforms.length > 0 ||
    tempFilters.minProjectDownloadCount ||
    tempFilters.employerStatus.length > 0 ||
    tempFilters.employerCountries.length > 0 ||
    tempFilters.employerCities.length > 0 ||
    tempFilters.employerTypes.length > 0 ||
    tempFilters.employerSalaryPolicies.length > 0 ||
    tempFilters.employerRankings.length > 0 ||
    tempFilters.employerSizeMin ||
    tempFilters.employerSizeMax ||
    tempFilters.universities.length > 0 ||
    tempFilters.universityCountries.length > 0 ||
    tempFilters.universityRankings.length > 0 ||
    tempFilters.universityCities.length > 0 ||
    tempFilters.degreeNames.length > 0 ||
    tempFilters.majorNames.length > 0 ||
    tempFilters.isTopper !== null ||
    tempFilters.isCheetah !== null ||
    tempFilters.educationEndDateStart !== null ||
    tempFilters.educationEndDateEnd !== null ||
    tempFilters.certificationNames.length > 0 ||
    tempFilters.certificationIssuingBodies.length > 0 ||
    tempFilters.certificationLevels.length > 0 ||
    tempFilters.achievementTypes.length > 0 ||
    tempFilters.achievementPlatforms.length > 0 ||
    tempFilters.internationalBugBountyOnly ||
    tempFilters.competitionPlatforms.length > 0

  // Validation for salary inputs
  const validateSalaryInput = (value: string): boolean => {
    if (!value) return true // Empty is valid
    const num = parseFloat(value)
    return !isNaN(num) && num >= 0
  }

  const formatSalaryInput = (value: string): string => {
    if (!value) return ""
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, "")
    // Ensure only one decimal point
    const parts = cleaned.split(".")
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("")
    }
    return cleaned
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 min-w-[1.25rem] h-5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[850px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Candidates
          </DialogTitle>
        </DialogHeader>

        {/* Sticky Tabs Navigation */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 h-12 rounded-none border-0 bg-transparent p-0">
              {sections.map((section) => {
                const sectionFilterCount = getSectionFilterCount(section.id)
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="text-xs px-3 md:px-4 py-2 rounded-t transition-colors whitespace-nowrap h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground border-b-2 border-transparent flex items-center justify-center gap-1.5"
                  >
                    <span>{section.label}</span>
                    {sectionFilterCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="h-4 min-w-[1.25rem] px-1 text-[10px] font-semibold bg-background/80 text-foreground"
                      >
                        {sectionFilterCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6" ref={scrollContainerRef}>
          <div className="space-y-6">
            {/* Basic Info Section */}
            <section id="filter-basic" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>
                {getSectionFilterCount("basic") > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearSectionFilters("basic")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Global Search for Basic Info Fields */}
              <div className="space-y-3">
                <Label htmlFor="basicInfoSearch" className="text-sm font-semibold">Search Basic Info</Label>
                <Input
                  id="basicInfoSearch"
                  type="text"
                  placeholder="Search by name, email, phone, CNIC, source, status, LinkedIn, GitHub..."
                  value={tempFilters.basicInfoSearch}
                  onChange={(e) => handleFilterChange("basicInfoSearch", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Searches across: Full Name, Email, Mobile, CNIC, Source, Status, LinkedIn URL, GitHub URL
                </p>
              </div>

              {/* Posting Title Filter */}
              <div className="space-y-3">
                <Label htmlFor="postingTitle" className="text-sm font-semibold">Posting Title</Label>
                <Input
                  id="postingTitle"
                  type="text"
                  placeholder="e.g., Technical Lead .NET, Senior Developer..."
                  value={tempFilters.postingTitle}
                  onChange={(e) => handleFilterChange("postingTitle", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Filter by the job posting title the candidate applied for
                </p>
              </div>

              {/* Location Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Location</Label>
                <MultiSelect
                  items={cityOptions}
                  selected={tempFilters.cities}
                  onChange={(values) => handleFilterChange("cities", values)}
                  placeholder="Filter by city..."
                  searchPlaceholder="Search cities..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={cityOptions}
                  selected={tempFilters.excludeCities}
                  onChange={(values) => handleFilterChange("excludeCities", values)}
                  placeholder="Exclude major cities..."
                  searchPlaceholder="Search cities to exclude..."
                  maxDisplay={3}
                />
                <p className="text-xs text-muted-foreground">
                  Exclude candidates from major cities to find talent from smaller/remote areas
                </p>
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Status</Label>
                <MultiSelect
                  items={Object.entries(CANDIDATE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                  selected={tempFilters.status}
                  onChange={(values) => handleFilterChange("status", values)}
                  placeholder="Filter by status..."
                  searchPlaceholder="Search statuses..."
                  maxDisplay={3}
                />
                <p className="text-xs text-muted-foreground">
                  Filter candidates by their application status
                </p>
              </div>

              {/* Personality Type Filter */}
              <div className="space-y-3">
                <MultiSelect
                  items={personalityTypeOptions}
                  selected={tempFilters.personalityTypes}
                  onChange={(values) => handleFilterChange("personalityTypes", values)}
                  placeholder="Filter by personality type..."
                  label="Personality Type"
                  searchPlaceholder="Search personality types..."
                  maxDisplay={3}
                />
                <p className="text-xs text-muted-foreground">
                  Filter candidates by their MBTI personality type (e.g., ESTJ, INTJ, ENFP)
                </p>
              </div>

              {/* Source Filter */}
              <div className="space-y-3">
                <MultiSelect
                  items={sourceOptions}
                  selected={tempFilters.source}
                  onChange={(values) => handleFilterChange("source", values)}
                  placeholder="Filter by source..."
                  label="Source"
                  searchPlaceholder="Search sources..."
                  maxDisplay={3}
                />
                <p className="text-xs text-muted-foreground">
                  Filter candidates by their source (e.g., Referral, DPL Employee, Job Portal)
                </p>
              </div>

              {/* Current Salary Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Current Salary Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="currentSalaryMin" className="text-xs text-muted-foreground">
                    Minimum
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="currentSalaryMin"
                      type="text"
                      placeholder="0"
                      value={tempFilters.currentSalaryMin}
                      onChange={(e) => {
                        const formatted = formatSalaryInput(e.target.value)
                        if (validateSalaryInput(formatted)) {
                          handleFilterChange("currentSalaryMin", formatted)
                        }
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSalaryMax" className="text-xs text-muted-foreground">
                    Maximum
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="currentSalaryMax"
                      type="text"
                      placeholder="200000"
                      value={tempFilters.currentSalaryMax}
                      onChange={(e) => {
                        const formatted = formatSalaryInput(e.target.value)
                        if (validateSalaryInput(formatted)) {
                          handleFilterChange("currentSalaryMax", formatted)
                        }
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter salary amounts in USD (e.g., 75000 for $75,000)
              </p>
            </div>

            {/* Expected Salary Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Expected Salary Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expectedSalaryMin" className="text-xs text-muted-foreground">
                    Minimum
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="expectedSalaryMin"
                      type="text"
                      placeholder="0"
                      value={tempFilters.expectedSalaryMin}
                      onChange={(e) => {
                        const formatted = formatSalaryInput(e.target.value)
                        if (validateSalaryInput(formatted)) {
                          handleFilterChange("expectedSalaryMin", formatted)
                        }
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedSalaryMax" className="text-xs text-muted-foreground">
                    Maximum
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="expectedSalaryMax"
                      type="text"
                      placeholder="250000"
                      value={tempFilters.expectedSalaryMax}
                      onChange={(e) => {
                        const formatted = formatSalaryInput(e.target.value)
                        if (validateSalaryInput(formatted)) {
                          handleFilterChange("expectedSalaryMax", formatted)
                        }
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter salary amounts in USD (e.g., 85000 for $85,000)
              </p>
            </div>
            </section>

            {/* Experience Section */}
            <section id="filter-experience" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Work Experience</h3>
                {getSectionFilterCount("experience") > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearSectionFilters("experience")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              {/* Candidate Work Experience Tech Stacks */}
              <div className="space-y-2">
                <MultiSelect
                  items={candidateTechStackOptions}
                  selected={tempFilters.candidateTechStacks}
                  onChange={(values) => handleFilterChange("candidateTechStacks", values)}
                  placeholder="Filter by technology stack..."
                  label="Technology Stack"
                  searchPlaceholder="Search technologies..."
                  maxDisplay={4}
                />
                {tempFilters.candidateTechStacks.length > 0 && (
                  <div className="space-y-2 pl-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="candidateTechStacksRequireAll"
                        checked={tempFilters.candidateTechStacksRequireAll}
                        onCheckedChange={(checked) =>
                          handleFilterChange("candidateTechStacksRequireAll", checked === true)
                        }
                      />
                      <Label htmlFor="candidateTechStacksRequireAll" className="text-xs text-muted-foreground cursor-pointer">
                        Require all selected technologies (AND logic)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="candidateTechStacksRequireInBoth"
                        checked={tempFilters.candidateTechStacksRequireInBoth}
                        onCheckedChange={(checked) =>
                          handleFilterChange("candidateTechStacksRequireInBoth", checked === true)
                        }
                      />
                      <Label htmlFor="candidateTechStacksRequireInBoth" className="text-xs text-muted-foreground cursor-pointer">
                        Require in both work experience AND projects (hands-on experience)
                      </Label>
                    </div>
                  </div>
                )}
                {tempFilters.candidateTechStacks.length > 0 && (
                  <p className="text-xs text-muted-foreground pl-1">
                    {tempFilters.candidateTechStacksRequireInBoth
                      ? tempFilters.candidateTechStacksRequireAll
                        ? "Candidate must have all selected technologies in both work experience AND projects"
                        : "Candidate must have selected technologies in both work experience AND projects"
                      : tempFilters.candidateTechStacksRequireAll
                        ? "Candidate must have all selected technologies"
                        : "Candidate must have at least one selected technology"}
                  </p>
                )}
              </div>

              {/* Tech Stack Minimum Years Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Tech Stack Experience (Years)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Column 1: Tech Stacks MultiSelect */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Technologies</Label>
                    <MultiSelect
                      items={candidateTechStackOptions}
                      selected={tempFilters.techStackMinYears?.techStacks || []}
                      onChange={(values) => {
                        handleFilterChange("techStackMinYears", {
                          techStacks: values,
                          minYears: tempFilters.techStackMinYears?.minYears || ""
                        })
                      }}
                      placeholder="Select technologies..."
                      searchPlaceholder="Search technologies..."
                      maxDisplay={3}
                    />
                  </div>
                  
                  {/* Column 2: Years Input */}
                  <div className="space-y-1">
                    <Label htmlFor="techStackMinYears" className="text-xs text-muted-foreground">
                      Minimum Years
                    </Label>
                    <Input
                      id="techStackMinYears"
                      type="number"
                      placeholder="e.g., 2"
                      value={tempFilters.techStackMinYears?.minYears || ""}
                      onChange={(e) => {
                        handleFilterChange("techStackMinYears", {
                          techStacks: tempFilters.techStackMinYears?.techStacks || [],
                          minYears: e.target.value
                        })
                      }}
                      min="0"
                      step="0.1"
                      disabled={!tempFilters.techStackMinYears?.techStacks || tempFilters.techStackMinYears.techStacks.length === 0}
                    />
                  </div>
                </div>
                
                {tempFilters.techStackMinYears && tempFilters.techStackMinYears.techStacks.length > 0 && tempFilters.techStackMinYears.minYears && (
                  <p className="text-xs text-muted-foreground">
                    Candidates must have {tempFilters.techStackMinYears.techStacks.length > 1 ? 'all' : ''} selected technology{tempFilters.techStackMinYears.techStacks.length > 1 ? 's' : ''} with at least {tempFilters.techStackMinYears.minYears} years of cumulative experience.
                  </p>
                )}
              </div>
              
              <MultiSelect
                items={candidateDomainOptions}
                selected={tempFilters.candidateDomains}
                onChange={(values) => handleFilterChange("candidateDomains", values)}
                placeholder="Filter by domain..."
                label="Domains"
                searchPlaceholder="Search domains..."
                maxDisplay={4}
              />
              
              <MultiSelect
                items={shiftTypeOptions}
                selected={tempFilters.shiftTypes}
                onChange={(values) => handleFilterChange("shiftTypes", values)}
                placeholder="Filter by shift type..."
                label="Shift Type"
                searchPlaceholder="Search shift types..."
                maxDisplay={3}
              />

              <MultiSelect
                items={workModeOptions}
                selected={tempFilters.workModes}
                onChange={(values) => handleFilterChange("workModes", values)}
                placeholder="Filter by work mode..."
                label="Work Mode"
                searchPlaceholder="Search work modes..."
                maxDisplay={3}
              />

              {/* Work Mode Minimum Years Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Work Mode Experience (Years)</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Column 1: Work Modes MultiSelect */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Work Modes</Label>
                    <MultiSelect
                      items={workModeOptions}
                      selected={tempFilters.workModeMinYears?.workModes || []}
                      onChange={(values) => {
                        handleFilterChange("workModeMinYears", {
                          workModes: values,
                          minYears: tempFilters.workModeMinYears?.minYears || ""
                        })
                      }}
                      placeholder="Select work modes..."
                      searchPlaceholder="Search work modes..."
                      maxDisplay={3}
                    />
                  </div>
                  
                  {/* Column 2: Years Input */}
                  <div className="space-y-1">
                    <Label htmlFor="workModeMinYears" className="text-xs text-muted-foreground">
                      Minimum Years
                    </Label>
                    <Input
                      id="workModeMinYears"
                      type="number"
                      placeholder="e.g., 3"
                      value={tempFilters.workModeMinYears?.minYears || ""}
                      onChange={(e) => {
                        handleFilterChange("workModeMinYears", {
                          workModes: tempFilters.workModeMinYears?.workModes || [],
                          minYears: e.target.value
                        })
                      }}
                      min="0"
                      step="0.1"
                      disabled={!tempFilters.workModeMinYears?.workModes || tempFilters.workModeMinYears.workModes.length === 0}
                    />
                  </div>
                </div>
                
                {tempFilters.workModeMinYears && tempFilters.workModeMinYears.workModes.length > 0 && tempFilters.workModeMinYears.minYears && (
                  <p className="text-xs text-muted-foreground">
                    Candidates must have {tempFilters.workModeMinYears.workModes.length > 1 ? 'all' : ''} selected work mode{tempFilters.workModeMinYears.workModes.length > 1 ? 's' : ''} with at least {tempFilters.workModeMinYears.minYears} years of cumulative experience.
                  </p>
                )}
              </div>

              <MultiSelect
                items={timeSupportZoneOptions}
                selected={tempFilters.timeSupportZones}
                onChange={(values) => handleFilterChange("timeSupportZones", values)}
                placeholder="Filter by time support zone..."
                label="Time Support Zones"
                searchPlaceholder="Search time zones..."
                maxDisplay={3}
              />

              {/* Currently Working Filter */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCurrentlyWorking"
                    checked={tempFilters.isCurrentlyWorking === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange("isCurrentlyWorking", checked ? true : null)
                    }
                  />
                  <Label htmlFor="isCurrentlyWorking" className="text-sm font-medium cursor-pointer">
                    Currently Working
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Filter candidates who have at least one ongoing work experience (no end date).
                  Combine with Shift Type, Work Mode, or Time Support Zones to filter by current job details.
                </p>
              </div>

              {/* Worked with Top Developer Filter */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workedWithTopDeveloper"
                    checked={tempFilters.workedWithTopDeveloper === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange("workedWithTopDeveloper", checked ? true : null)
                    }
                  />
                  <Label htmlFor="workedWithTopDeveloper" className="text-sm font-medium cursor-pointer">
                    Worked with Top Developer
                  </Label>
                </div>
                
                {/* Tolerance Window Options - appears when checkbox is checked */}
                {tempFilters.workedWithTopDeveloper === true && (
                  <div className="space-y-3 pl-6">
                    {/* Checkbox to enable/disable tolerance window */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="workedWithTopDeveloperUseTolerance"
                        checked={tempFilters.workedWithTopDeveloperUseTolerance ?? true}
                        onCheckedChange={(checked) => 
                          handleFilterChange("workedWithTopDeveloperUseTolerance", checked)
                        }
                      />
                      <Label htmlFor="workedWithTopDeveloperUseTolerance" className="text-xs text-muted-foreground cursor-pointer">
                        Apply Tolerance Window
                      </Label>
                    </div>
                    
                    {/* Tolerance Window Input - only shown when tolerance is enabled */}
                    {tempFilters.workedWithTopDeveloperUseTolerance && (
                      <div className="space-y-2 pl-6">
                        <Label htmlFor="workedWithTopDeveloperToleranceDays" className="text-xs text-muted-foreground">
                          Tolerance Window (days)
                        </Label>
                        <Input
                          id="workedWithTopDeveloperToleranceDays"
                          type="number"
                          placeholder="e.g., 30"
                          value={tempFilters.joinedProjectFromStartToleranceDays?.toString() || "30"}
                          onChange={(e) => {
                            const value = e.target.value
                            const numValue = value === "" ? 30 : parseInt(value) || 30
                            handleFilterChange("joinedProjectFromStartToleranceDays", numValue)
                          }}
                          min="0"
                          max="365"
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum days difference between candidate and top developer work experience start dates (default: 30 days). 
                          Only matches candidates who started working on the same project within this window.
                        </p>
                      </div>
                    )}
                    
                    {!tempFilters.workedWithTopDeveloperUseTolerance && (
                      <p className="text-xs text-muted-foreground pl-6">
                        Matching by project name only - no date restriction applied.
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground pl-6">
                  Find candidates who worked on the same projects as top developers. 
                  Combine with Employers filter to narrow by company (e.g., DPL).
                </p>
              </div>

              {/* Top Developer Filter */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTopDeveloper"
                    checked={tempFilters.isTopDeveloper === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange("isTopDeveloper", checked ? true : null)
                    }
                  />
                  <Label htmlFor="isTopDeveloper" className="text-sm font-medium cursor-pointer">
                    Top Developer
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Filter for candidates who are marked as top developers.
                </p>
              </div>

              {/* Job Title Filter */}
              <div className="space-y-3">
                <Label htmlFor="jobTitle" className="text-sm font-semibold">Job Title</Label>
                <Input
                  id="jobTitle"
                  type="text"
                  placeholder="e.g., React Developer, Software Engineer..."
                  value={tempFilters.jobTitle}
                  onChange={(e) => {
                    handleFilterChange("jobTitle", e.target.value)
                  }}
                />
                  <p className="text-xs text-muted-foreground">
                    Search by job title (partial matching supported)
                  </p>
              </div>

              {/* Years of Experience Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Years of Experience</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperienceMin" className="text-xs text-muted-foreground">
                      Minimum Years
                    </Label>
                    <Input
                      id="yearsOfExperienceMin"
                      type="number"
                      placeholder="e.g., 2"
                      value={tempFilters.yearsOfExperienceMin}
                      onChange={(e) => handleFilterChange("yearsOfExperienceMin", e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperienceMax" className="text-xs text-muted-foreground">
                      Maximum Years
                    </Label>
                    <Input
                      id="yearsOfExperienceMax"
                      type="number"
                      placeholder="e.g., 10"
                      value={tempFilters.yearsOfExperienceMax}
                      onChange={(e) => handleFilterChange("yearsOfExperienceMax", e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Filter by total years of experience calculated from work history
                </p>
              </div>

              {/* Average Job Tenure Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Average Job Tenure (Years)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="avgJobTenureMin" className="text-xs text-muted-foreground">
                      Minimum Tenure
                    </Label>
                    <Input
                      id="avgJobTenureMin"
                      type="number"
                      placeholder="e.g., 1.5"
                      value={tempFilters.avgJobTenureMin}
                      onChange={(e) => handleFilterChange("avgJobTenureMin", e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgJobTenureMax" className="text-xs text-muted-foreground">
                      Maximum Tenure
                    </Label>
                    <Input
                      id="avgJobTenureMax"
                      type="number"
                      placeholder="e.g., 3.0"
                      value={tempFilters.avgJobTenureMax}
                      onChange={(e) => handleFilterChange("avgJobTenureMax", e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Filter by average time spent at each employer. Shows career stability patterns.
                </p>
              </div>

              {/* Maximum Job Changes in Last N Years Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Job Stability</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Column 1: Maximum Job Changes */}
                  <div className="space-y-1">
                    <Label htmlFor="maxJobChanges" className="text-xs text-muted-foreground">
                      Maximum Job Changes
                    </Label>
                    <Input
                      id="maxJobChanges"
                      type="number"
                      placeholder="e.g., 1"
                      value={tempFilters.maxJobChangesInLastYears?.maxChanges || ""}
                      onChange={(e) => {
                        handleFilterChange("maxJobChangesInLastYears", {
                          maxChanges: e.target.value,
                          years: tempFilters.maxJobChangesInLastYears?.years || ""
                        })
                      }}
                      min="0"
                      step="1"
                    />
                  </div>
                  
                  {/* Column 2: Years */}
                  <div className="space-y-1">
                    <Label htmlFor="jobChangesYears" className="text-xs text-muted-foreground">
                      In Last (Years)
                    </Label>
                    <Input
                      id="jobChangesYears"
                      type="number"
                      placeholder="e.g., 3"
                      value={tempFilters.maxJobChangesInLastYears?.years || ""}
                      onChange={(e) => {
                        handleFilterChange("maxJobChangesInLastYears", {
                          maxChanges: tempFilters.maxJobChangesInLastYears?.maxChanges || "",
                          years: e.target.value
                        })
                      }}
                      min="1"
                      step="1"
                      disabled={!tempFilters.maxJobChangesInLastYears?.maxChanges}
                    />
                  </div>
                </div>
                
                {tempFilters.maxJobChangesInLastYears?.maxChanges && tempFilters.maxJobChangesInLastYears?.years && (
                  <p className="text-xs text-muted-foreground">
                    Candidates who changed jobs no more than {tempFilters.maxJobChangesInLastYears.maxChanges} time{tempFilters.maxJobChangesInLastYears.maxChanges !== "1" ? "s" : ""} in the last {tempFilters.maxJobChangesInLastYears.years} year{tempFilters.maxJobChangesInLastYears.years !== "1" ? "s" : ""}.
                  </p>
                )}
              </div>

              {/* Promotions in Last N Years Filter */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium">Promotions in Last N Years</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPromotionsInLastYears" className="text-xs text-muted-foreground">
                      Minimum Promotions
                    </Label>
                    <Input
                      id="minPromotionsInLastYears"
                      type="number"
                      placeholder="e.g., 3"
                      value={tempFilters.minPromotionsInLastYears?.minPromotions || ""}
                      onChange={(e) => {
                        handleFilterChange("minPromotionsInLastYears", {
                          minPromotions: e.target.value,
                          years: tempFilters.minPromotionsInLastYears?.years || ""
                        })
                      }}
                      min="1"
                      step="1"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promotionsInLastYears" className="text-xs text-muted-foreground">
                      In Last (Years)
                    </Label>
                    <Input
                      id="promotionsInLastYears"
                      type="number"
                      placeholder="e.g., 5"
                      value={tempFilters.minPromotionsInLastYears?.years || ""}
                      onChange={(e) => {
                        handleFilterChange("minPromotionsInLastYears", {
                          minPromotions: tempFilters.minPromotionsInLastYears?.minPromotions || "",
                          years: e.target.value
                        })
                      }}
                      min="1"
                      step="1"
                      className="w-full"
                      disabled={!tempFilters.minPromotionsInLastYears?.minPromotions || tempFilters.minPromotionsInLastYears.minPromotions === ""}
                    />
                  </div>
                </div>
                {(tempFilters.minPromotionsInLastYears?.minPromotions && tempFilters.minPromotionsInLastYears?.years) && (
                  <p className="text-xs text-muted-foreground">
                    Candidates must have at least {tempFilters.minPromotionsInLastYears.minPromotions} promotion{tempFilters.minPromotionsInLastYears.minPromotions !== "1" ? "s" : ""} in the last {tempFilters.minPromotionsInLastYears.years} year{tempFilters.minPromotionsInLastYears.years !== "1" ? "s" : ""}.
                    A promotion is detected when job title changes (can be across different companies).
                  </p>
                )}
              </div>

              {/* Joined Project From Start Filter */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="joinedProjectFromStart"
                    checked={tempFilters.joinedProjectFromStart === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange("joinedProjectFromStart", checked ? true : null)
                    }
                  />
                  <Label htmlFor="joinedProjectFromStart" className="text-sm font-medium cursor-pointer">
                    Joined Project From Start
                  </Label>
                </div>
                
                {/* Tolerance Window - appears when checkbox is checked */}
                {tempFilters.joinedProjectFromStart === true && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="toleranceDays" className="text-xs text-muted-foreground">
                      Tolerance Window (days)
                    </Label>
                    <Input
                      id="toleranceDays"
                      type="number"
                      placeholder="e.g., 30"
                      value={tempFilters.joinedProjectFromStartToleranceDays?.toString() || "30"}
                      onChange={(e) => {
                        const value = e.target.value
                        const numValue = value === "" ? 30 : parseInt(value) || 30
                        handleFilterChange("joinedProjectFromStartToleranceDays", numValue)
                      }}
                      min="0"
                      max="365"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum days difference between project start and work experience start date (default: 30 days). 
                      Candidates who started before the project are also included.
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground pl-6">
                  Filter for candidates whose work experience start date matches or is close to project start date
                </p>
              </div>

              {/* Mutual Connections with DPL Filter */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasMutualConnectionWithDPL"
                    checked={tempFilters.hasMutualConnectionWithDPL === true}
                    onCheckedChange={(checked) => 
                      handleFilterChange("hasMutualConnectionWithDPL", checked ? true : null)
                    }
                  />
                  <Label htmlFor="hasMutualConnectionWithDPL" className="text-sm font-medium cursor-pointer">
                    Mutual Connection with DPL Employee
                  </Label>
                </div>
                
                {/* Tolerance and Connection Type - appears when checkbox is checked */}
                {tempFilters.hasMutualConnectionWithDPL === true && (
                  <div className="space-y-3 pl-6">
                    {/* Tolerance Window */}
                    <div className="space-y-2">
                      <Label htmlFor="mutualConnectionToleranceMonths" className="text-xs text-muted-foreground">
                        Date Gap Tolerance (months)
                      </Label>
                      <Input
                        id="mutualConnectionToleranceMonths"
                        type="number"
                        placeholder="e.g., 6"
                        value={tempFilters.mutualConnectionToleranceMonths?.toString() || "0"}
                        onChange={(e) => {
                          const value = e.target.value
                          const numValue = value === "" ? 0 : parseInt(value) || 0
                          handleFilterChange("mutualConnectionToleranceMonths", numValue)
                        }}
                        min="0"
                        max="24"
                        step="1"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum gap in months between education/work periods to still count as overlap (default: 0 = exact overlap required).
                      </p>
                    </div>
                    
                    {/* Connection Type Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Connection Type</Label>
                      <RadioGroup
                        value={tempFilters.mutualConnectionType || 'both'}
                        onValueChange={(value) => 
                          handleFilterChange("mutualConnectionType", value === 'both' ? null : value as 'education' | 'work')
                        }
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="both" id="mutual-both" />
                          <Label htmlFor="mutual-both" className="text-xs cursor-pointer">Both Education & Work</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="education" id="mutual-education" />
                          <Label htmlFor="mutual-education" className="text-xs cursor-pointer">Education Only</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="work" id="mutual-work" />
                          <Label htmlFor="mutual-work" className="text-xs cursor-pointer">Work Experience Only</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground pl-6">
                  Find candidates who have overlapping education or work experience with any DPL employee.
                  This indicates potential mutual connections (batchmates, classmates, or colleagues).
                </p>
              </div>
            </section>

            {/* Project-Based Filters Section */}
            <section id="filter-projects" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Project Expertise</h3>
                {getSectionFilterCount("projects") > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearSectionFilters("projects")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <MultiSelect
                items={projectOptions}
                selected={tempFilters.projects}
                onChange={(values) => handleFilterChange("projects", values)}
                placeholder="Filter by project..."
                label="Projects"
                searchPlaceholder="Search projects..."
                maxDisplay={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={projectStatusOptions}
                  selected={tempFilters.projectStatus}
                  onChange={(values) => handleFilterChange("projectStatus", values)}
                  placeholder="Filter by project status..."
                  label="Project Status"
                  maxDisplay={3}
                />

                <MultiSelect
                  items={projectTypeOptions}
                  selected={tempFilters.projectTypes}
                  onChange={(values) => handleFilterChange("projectTypes", values)}
                  placeholder="Filter by project type..."
                  label="Project Type"
                  maxDisplay={3}
                />
              </div>

              <MultiSelect
                items={techStackOptions}
                selected={tempFilters.techStacks}
                onChange={(values) => handleFilterChange("techStacks", values)}
                placeholder="Filter by technology..."
                label="Technology Stack"
                searchPlaceholder="Search technologies..."
                maxDisplay={4}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={verticalDomainOptions}
                  selected={tempFilters.verticalDomains}
                  onChange={(values) => handleFilterChange("verticalDomains", values)}
                  placeholder="Filter by industry..."
                  label="Vertical Domains"
                  searchPlaceholder="Search industries..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={horizontalDomainOptions}
                  selected={tempFilters.horizontalDomains}
                  onChange={(values) => handleFilterChange("horizontalDomains", values)}
                  placeholder="Filter by solution type..."
                  label="Horizontal Domains"
                  searchPlaceholder="Search solutions..."
                  maxDisplay={3}
                />
              </div>

              <MultiSelect
                items={technicalAspectOptions}
                selected={tempFilters.technicalAspects}
                onChange={(values) => handleFilterChange("technicalAspects", values)}
                placeholder="Filter by technical aspects..."
                label="Technical Aspects"
                searchPlaceholder="Search aspects..."
                maxDisplay={3}
              />

              <MultiSelect
                items={clientLocationOptions}
                selected={tempFilters.clientLocations}
                onChange={(values) => handleFilterChange("clientLocations", values)}
                placeholder="Filter by client location..."
                label="Client Location"
                searchPlaceholder="Search locations..."
                maxDisplay={3}
              />

              {/* Minimum Client Location Count Filter */}
              <div className="space-y-3">
                <Label htmlFor="minClientLocationCount" className="text-sm font-semibold">
                  Minimum Client Locations/Countries
                </Label>
                <Input
                  id="minClientLocationCount"
                  type="number"
                  placeholder="e.g., 2 (for multi-country projects)"
                  min="1"
                  value={tempFilters.minClientLocationCount}
                  onChange={(e) => handleFilterChange("minClientLocationCount", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Filter candidates who have worked on projects in at least this many different client locations/countries (e.g., 2 for multi-country projects)
                </p>
              </div>

              {/* Start Date Range Filter */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Start Date Range
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Filter candidates who have worked on at least one project that started within this date range.
                    Use case: &quot;Find candidates who have worked on at least one project that started within the last 6 months&quot;
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDateStart" className="text-xs text-muted-foreground">
                        From Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.startDateStart && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.startDateStart ? (
                              tempFilters.startDateStart.toLocaleDateString()
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.startDateStart || undefined}
                            onSelect={(date) => handleFilterChange("startDateStart", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDateEnd" className="text-xs text-muted-foreground">
                        To Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.startDateEnd && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.startDateEnd ? (
                              tempFilters.startDateEnd.toLocaleDateString()
                            ) : (
                              <span>Select end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.startDateEnd || undefined}
                            onSelect={(date) => handleFilterChange("startDateEnd", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Team Size Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Project Team Size</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="projectTeamSizeMin" className="text-xs text-muted-foreground">
                      Minimum Team Size
                    </Label>
                    <Input
                      id="projectTeamSizeMin"
                      type="number"
                      placeholder="e.g., 5"
                      value={tempFilters.projectTeamSizeMin}
                      onChange={(e) => handleFilterChange("projectTeamSizeMin", e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectTeamSizeMax" className="text-xs text-muted-foreground">
                      Maximum Team Size
                    </Label>
                    <Input
                      id="projectTeamSizeMax"
                      type="number"
                      placeholder="e.g., 30"
                      value={tempFilters.projectTeamSizeMax}
                      onChange={(e) => handleFilterChange("projectTeamSizeMax", e.target.value)}
                      min="1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Filter by team size of projects the candidate worked on
                </p>
              </div>

              {/* Published App */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPublishedProject"
                    checked={tempFilters.hasPublishedProject === true}
                    onCheckedChange={(checked) => {
                      handleFilterChange("hasPublishedProject", checked ? true : null)
                    }}
                  />
                  <Label htmlFor="hasPublishedProject" className="text-sm cursor-pointer">
                    Published App
                  </Label>
                </div>
              </div>

              {/* Publish Platforms */}
              <div className="space-y-2">
                <MultiSelect
                  items={publishPlatformOptions}
                  selected={tempFilters.publishPlatforms}
                  onChange={(values) => handleFilterChange("publishPlatforms", values)}
                  placeholder="Select platforms"
                  label="Publish Platforms"
                  searchPlaceholder="Search platforms..."
                />
                <p className="text-xs text-muted-foreground">
                  {tempFilters.publishPlatforms.length === 0 
                    ? "Select platforms to filter by specific app stores (e.g., App Store, Play Store). Leave empty to match any platform."
                    : "Filtering for apps published on selected platforms. Combine with 'Published App' checkbox and mobile tech stacks for mobile developers."}
                </p>
              </div>

              {/* Minimum Project Download Count Filter */}
              <div className="space-y-3">
                <Label htmlFor="minProjectDownloadCount" className="text-sm font-semibold">
                  Minimum Project Download Count
                </Label>
                <Input
                  id="minProjectDownloadCount"
                  type="number"
                  placeholder="e.g., 100000 (for 100K+)"
                  min="0"
                  value={tempFilters.minProjectDownloadCount}
                  onChange={(e) => handleFilterChange("minProjectDownloadCount", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Filter candidates who have worked on at least one project/app with this many downloads (e.g., 100000 for 100K+)
                </p>
              </div>
            </section>

            {/* Employer-Based Filters Section */}
            <section id="filter-employers" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Employer Characteristics</h3>
                {getSectionFilterCount("employers") > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearSectionFilters("employers")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={employerOptions}
                  selected={tempFilters.employers}
                  onChange={(values) => handleFilterChange("employers", values)}
                  placeholder="Filter by employer..."
                  label="Employers"
                  searchPlaceholder="Search employers..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={employerStatusOptions}
                  selected={tempFilters.employerStatus}
                  onChange={(values) => handleFilterChange("employerStatus", values)}
                  placeholder="Filter by employer status..."
                  label="Employer Status"
                  maxDisplay={3}
                />

                <MultiSelect
                  items={employerRankingOptions}
                  selected={tempFilters.employerRankings}
                  onChange={(values) => handleFilterChange("employerRankings", values)}
                  placeholder="Filter by company ranking..."
                  label="Company Ranking"
                  maxDisplay={3}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Employer Size Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="employerSizeMin" className="text-xs text-muted-foreground">
                      Minimum Employees
                    </Label>
                    <Input
                      id="employerSizeMin"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={tempFilters.employerSizeMin}
                      onChange={(e) => handleFilterChange("employerSizeMin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employerSizeMax" className="text-xs text-muted-foreground">
                      Maximum Employees
                    </Label>
                    <Input
                      id="employerSizeMax"
                      type="number"
                      placeholder="1000"
                      min="0"
                      value={tempFilters.employerSizeMax}
                      onChange={(e) => handleFilterChange("employerSizeMax", e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Filter by total company size across all locations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={employerCountryOptions}
                  selected={tempFilters.employerCountries}
                  onChange={(values) => handleFilterChange("employerCountries", values)}
                  placeholder="Filter by country..."
                  label="Employer Countries"
                  searchPlaceholder="Search countries..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={employerCityOptions}
                  selected={tempFilters.employerCities}
                  onChange={(values) => handleFilterChange("employerCities", values)}
                  placeholder="Filter by city..."
                  label="Employer Cities"
                  searchPlaceholder="Search cities..."
                  maxDisplay={3}
                />
                
                <MultiSelect
                  items={Object.values(EMPLOYER_TYPE_LABELS).map(type => ({ value: type, label: type }))}
                  selected={tempFilters.employerTypes}
                  onChange={(values) => handleFilterChange("employerTypes", values)}
                  placeholder="Filter by employer type..."
                  label="Employer Type"
                  searchPlaceholder="Search types..."
                  maxDisplay={3}
                />
              </div>

              {/* Career Transition Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Career Transition</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Previous Employer Type</Label>
                    <MultiSelect
                      items={Object.values(EMPLOYER_TYPE_LABELS).map(type => ({ value: type, label: type }))}
                      selected={tempFilters.careerTransitionFromType}
                      onChange={(values) => handleFilterChange("careerTransitionFromType", values)}
                      placeholder="Select previous type..."
                      searchPlaceholder="Search types..."
                      maxDisplay={3}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Current/New Employer Type</Label>
                    <MultiSelect
                      items={Object.values(EMPLOYER_TYPE_LABELS).map(type => ({ value: type, label: type }))}
                      selected={tempFilters.careerTransitionToType}
                      onChange={(values) => handleFilterChange("careerTransitionToType", values)}
                      placeholder="Select new type..."
                      searchPlaceholder="Search types..."
                      maxDisplay={3}
                    />
                  </div>
                </div>
                
                {(tempFilters.careerTransitionFromType.length > 0 || tempFilters.careerTransitionToType.length > 0) && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="careerTransitionRequireCurrent"
                      checked={tempFilters.careerTransitionRequireCurrent}
                      onCheckedChange={(checked) => {
                        handleFilterChange("careerTransitionRequireCurrent", checked === true)
                      }}
                    />
                    <Label
                      htmlFor="careerTransitionRequireCurrent"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Require current/most recent employer
                    </Label>
                  </div>
                )}
                
                {tempFilters.careerTransitionFromType.length > 0 && tempFilters.careerTransitionToType.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Find candidates who worked at {tempFilters.careerTransitionFromType.join(", ")} before {tempFilters.careerTransitionToType.join(", ")}.
                    {tempFilters.careerTransitionRequireCurrent && " The new employer type must be current/most recent."}
                  </p>
                )}
              </div>

              <MultiSelect
                items={employerSalaryPolicyOptions}
                selected={tempFilters.employerSalaryPolicies}
                onChange={(values) => handleFilterChange("employerSalaryPolicies", values)}
                placeholder="Filter by salary policy..."
                label="Salary Policies"
                maxDisplay={3}
              />
            </section>

            {/* University-Based Filters Section */}
            <section id="filter-education" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Education Background</h3>
                {getSectionFilterCount("education") > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearSectionFilters("education")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <MultiSelect
                items={universityOptions}
                selected={tempFilters.universities}
                onChange={(values) => handleFilterChange("universities", values)}
                placeholder="Filter by university..."
                label="Universities"
                searchPlaceholder="Search universities..."
                maxDisplay={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={universityCountryOptions}
                  selected={tempFilters.universityCountries}
                  onChange={(values) => handleFilterChange("universityCountries", values)}
                  placeholder="Filter by country..."
                  label="University Countries"
                  searchPlaceholder="Search countries..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={rankingOptions}
                  selected={tempFilters.universityRankings}
                  onChange={(values) => handleFilterChange("universityRankings", values)}
                  placeholder="Filter by ranking..."
                  label="University Ranking"
                  maxDisplay={3}
                />
              </div>

              <MultiSelect
                items={universityCityOptions}
                selected={tempFilters.universityCities}
                onChange={(values) => handleFilterChange("universityCities", values)}
                placeholder="Filter by campus city..."
                label="Campus Cities"
                searchPlaceholder="Search cities..."
                maxDisplay={4}
              />     
              <MultiSelect
                items={degreeNameOptions}
                selected={tempFilters.degreeNames}
                onChange={(values) => handleFilterChange("degreeNames", values)}
                placeholder="Filter by degree..."
                label="Degree"
                searchPlaceholder="Search degrees..."
                maxDisplay={3}
                />           
              <div className="grid grid-cols-2 gap-4">
                <MultiSelect
                  items={majorNameOptions}
                  selected={tempFilters.majorNames}
                  onChange={(values) => handleFilterChange("majorNames", values)}
                  placeholder="Filter by major..."
                  label="Major"
                  searchPlaceholder="Search majors..."
                  maxDisplay={3}
                />
              </div>

              {/* Graduation Date Range Filter */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Graduation Date Range
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Filter candidates who graduated (completed education) within this date range. 
                    Use case: &quot;Find all candidates who graduated in 2025&quot;
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="educationEndDateStart" className="text-xs text-muted-foreground">
                        From Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.educationEndDateStart && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.educationEndDateStart ? (
                              tempFilters.educationEndDateStart.toLocaleDateString()
                            ) : (
                              <span>Select start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.educationEndDateStart || undefined}
                            onSelect={(date) => handleFilterChange("educationEndDateStart", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="educationEndDateEnd" className="text-xs text-muted-foreground">
                        To Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !tempFilters.educationEndDateEnd && "text-muted-foreground",
                              dateRangeError && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {tempFilters.educationEndDateEnd ? (
                              tempFilters.educationEndDateEnd.toLocaleDateString()
                            ) : (
                              <span>Select end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={tempFilters.educationEndDateEnd || undefined}
                            onSelect={(date) => handleFilterChange("educationEndDateEnd", date || null)}
                            captionLayout="dropdown"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {dateRangeError && (
                    <p className="text-xs text-red-500">{dateRangeError}</p>
                  )}
                </div>
              </div>

                {/* Achievement Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isTopper"
                      checked={tempFilters.isTopper === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange("isTopper", checked ? true : null)
                      }
                    />
                    <Label htmlFor="isTopper" className="text-sm font-normal cursor-pointer">
                      Topper
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isCheetah"
                      checked={tempFilters.isCheetah === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange("isCheetah", checked ? true : null)
                      }
                    />
                    <Label htmlFor="isCheetah" className="text-sm font-normal cursor-pointer">
                      Cheetah
                    </Label>
                  </div>
                </div>
            </section>

            {/* Certification-Based Filters Section */}
            <section id="filter-certifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Professional Certifications</h3>
                {getSectionFilterCount("certifications") > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearSectionFilters("certifications")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <MultiSelect
                items={certificationNameOptions}
                selected={tempFilters.certificationNames}
                onChange={(values) => handleFilterChange("certificationNames", values)}
                placeholder="Filter by certification..."
                label="Certification Name"
                searchPlaceholder="Search certifications..."
                maxDisplay={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={certificationIssuingBodyOptions}
                  selected={tempFilters.certificationIssuingBodies}
                  onChange={(values) => handleFilterChange("certificationIssuingBodies", values)}
                  placeholder="Filter by issuing body..."
                  label="Issuing Body"
                  searchPlaceholder="Search issuing bodies..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={certificationLevelOptions}
                  selected={tempFilters.certificationLevels}
                  onChange={(values) => handleFilterChange("certificationLevels", values)}
                  placeholder="Filter by level..."
                  label="Certification Level"
                  maxDisplay={3}
                />
              </div>
            </section>

            {/* Achievements Filter Section */}
            <section id="filter-competitions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Achievements</h3>
                {getSectionFilterCount("competitions") > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearSectionFilters("competitions")}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              <MultiSelect
                items={achievementTypeOptions}
                selected={tempFilters.achievementTypes}
                onChange={(values) => handleFilterChange("achievementTypes", values)}
                placeholder="Filter by achievement type..."
                label="Achievement Type"
                searchPlaceholder="Search types..."
                maxDisplay={3}
              />

              <MultiSelect
                items={achievementPlatformOptions}
                selected={tempFilters.achievementPlatforms}
                onChange={(values) => handleFilterChange("achievementPlatforms", values)}
                placeholder="Filter by achievement/platform name..."
                label="Achievement/Platform Name"
                searchPlaceholder="Search achievements/platforms..."
                maxDisplay={3}
              />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internationalBugBountyOnly"
                  checked={tempFilters.internationalBugBountyOnly}
                  onCheckedChange={(checked) => handleFilterChange("internationalBugBountyOnly", !!checked)}
                />
                <Label htmlFor="internationalBugBountyOnly" className="text-sm font-normal cursor-pointer">
                  International Bug Bounty Platforms Only
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, only shows candidates with achievements from international bug bounty platforms (HackerOne, Bugcrowd, Synack, etc.)
              </p>
            </section>

          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Cancel
            </Button>

            {hasAnyTempFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear All
              </Button>
            )}

            <Button 
              onClick={handleApplyFilters}
              className="ml-auto transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
