"use client"

import * as React from "react"
import { useState } from "react"
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
import { Filter } from "lucide-react"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { PROJECT_STATUS_LABELS, ProjectStatus } from "@/lib/types/project"
import { EmployerStatus, SalaryPolicy, EMPLOYER_STATUS_LABELS, SALARY_POLICY_LABELS } from "@/lib/types/employer"
import { UniversityRanking, UNIVERSITY_RANKING_LABELS } from "@/lib/types/university"

// Filter interfaces
export interface CandidateFilters {
  cities: string[]
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
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  // Employer-related filters
  employerStatus: string[]
  employerCountries: string[]
  employerCities: string[]
  employerSalaryPolicies: string[]
  employerSizeMin: string
  employerSizeMax: string
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
  // Certification-related filters
  certificationNames: string[]
  certificationIssuingBodies: string[]
  certificationLevels: string[]
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

const extractUniqueTechStacks = () => {
  const techStacks = new Set<string>()
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  return Array.from(techStacks).sort()
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
  // Using comprehensive degree list from candidate creation dialog
  return [
    "Bachelor of Science (B.S.)",
    "Bachelor of Arts (B.A.)",
    "Bachelor of Engineering (B.Eng.)",
    "Bachelor of Technology (B.Tech.)",
    "Bachelor of Business Administration (BBA)",
    "Bachelor of Computer Science (B.C.S.)",
    "Master of Science (M.S.)",
    "Master of Arts (M.A.)",
    "Master of Engineering (M.Eng.)",
    "Master of Technology (M.Tech.)",
    "Master of Business Administration (MBA)",
    "Master of Computer Science (M.C.S.)",
    "Doctor of Philosophy (Ph.D.)",
    "Doctor of Engineering (D.Eng.)",
    "Doctor of Business Administration (DBA)",
  ].sort()
}

const extractUniqueMajorNames = () => {
  // Using comprehensive major list from candidate creation dialog
  return [
    "Computer Science",
    "Software Engineering", 
    "Information Technology",
    "Data Science",
    "Artificial Intelligence",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Business Administration",
    "Finance",
    "Marketing",
    "Economics",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Psychology",
    "English Literature",
    "History",
  ].sort()
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

export function CandidatesFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
}: CandidatesFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<CandidateFilters>(filters)

  // Calculate active filter count
  const activeFilterCount = 
    filters.cities.length +
    (filters.currentSalaryMin ? 1 : 0) +
    (filters.currentSalaryMax ? 1 : 0) +
    (filters.expectedSalaryMin ? 1 : 0) +
    (filters.expectedSalaryMax ? 1 : 0) +
    filters.employers.length +
    filters.projects.length +
    filters.projectStatus.length +
    filters.projectTypes.length +
    filters.techStacks.length +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalAspects.length +
    filters.employerStatus.length +
    filters.employerCountries.length +
    filters.employerCities.length +
    filters.employerSalaryPolicies.length +
    (filters.employerSizeMin ? 1 : 0) +
    (filters.employerSizeMax ? 1 : 0) +
    filters.universities.length +
    filters.universityCountries.length +
    filters.universityRankings.length +
    filters.universityCities.length +
    filters.degreeNames.length +
    filters.majorNames.length +
    (filters.isTopper !== null ? 1 : 0) +
    (filters.isCheetah !== null ? 1 : 0) +
    filters.certificationNames.length +
    filters.certificationIssuingBodies.length +
    filters.certificationLevels.length

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof CandidateFilters, value: string[] | string | boolean | null) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
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
    tempFilters.cities.length > 0 ||
    tempFilters.currentSalaryMin ||
    tempFilters.currentSalaryMax ||
    tempFilters.expectedSalaryMin ||
    tempFilters.expectedSalaryMax ||
    tempFilters.employers.length > 0 ||
    tempFilters.projects.length > 0 ||
    tempFilters.projectStatus.length > 0 ||
    tempFilters.projectTypes.length > 0 ||
    tempFilters.techStacks.length > 0 ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.employerStatus.length > 0 ||
    tempFilters.employerCountries.length > 0 ||
    tempFilters.employerCities.length > 0 ||
    tempFilters.employerSalaryPolicies.length > 0 ||
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
    tempFilters.certificationNames.length > 0 ||
    tempFilters.certificationIssuingBodies.length > 0 ||
    tempFilters.certificationLevels.length > 0

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

      <DialogContent className="sm:max-w-[550px] lg:max-w-[600px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Candidates
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
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
            {/* Project-Based Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Project Expertise</h3>
              
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
            </div>

            {/* Employer-Based Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Employer Characteristics</h3>
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
              </div>

              <MultiSelect
                items={employerSalaryPolicyOptions}
                selected={tempFilters.employerSalaryPolicies}
                onChange={(values) => handleFilterChange("employerSalaryPolicies", values)}
                placeholder="Filter by salary policy..."
                label="Salary Policies"
                maxDisplay={3}
              />
            </div>

            {/* University-Based Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Education Background</h3>
              
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
              </div>
            {/* Certification-Based Filters */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Professional Certifications</h3>
              
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
            </div>
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
