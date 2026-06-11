import type { Candidate } from "@/lib/types/candidate"
import type { CandidateFilters } from "@/components/candidates-filter-dialog"
import type { Project } from "@/lib/types/project"
import {
  CANDIDATE_SOURCE_LABELS,
  parseCandidateSource,
} from "@/lib/constants/candidate-enums"
import { normalizeSalaryPolicy } from "@/lib/types/employer"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { findMutualConnectionsWithDPL } from "@/lib/utils/mutual-connections"
import { getTotalExperienceYears } from "@/lib/utils/candidate-experience"
import { normalizeProgress } from "@/lib/utils/candidate-data-progress"
import {
  HORIZONTAL_DOMAIN_LABELS,
  PROJECT_STATUS_UI_TO_NUM,
  PUBLISH_PLATFORM_UI_TO_NUM,
  TECHNICAL_DOMAIN_HUMAN_LABELS,
  VERTICAL_DOMAIN_LABELS,
} from "@/lib/services/projects-api"
import type { ProjectStatus, ProjectType, PublishPlatform } from "@/lib/types/project"
import type {
  MatchedDomainDto,
  MatchedAchievementDto,
  MatchedCertificationDto,
  MatchedEducationDto,
  MatchedEmployerDto,
  MatchedEmployerSizeDto,
  MatchedProjectDto,
  MatchedTeamSizeDto,
  MatchedWorkExperienceDto,
} from "@/lib/types/candidate"
import {
  EMPLOYER_TYPE_DB_LABELS,
  RANKING_DB_LABELS,
  SALARY_POLICY_DB_LABELS,
  type EmployerTypeDb,
  type RankingDb,
  type SalaryPolicyDb,
} from "@/lib/types/employer"
import {
  EMPLOYER_STATUS_TO_API,
  EMPLOYER_TYPE_TO_API,
  RANKING_TO_API,
  SALARY_POLICY_TO_API,
} from "@/lib/services/employers-api"

/** Project filter: API id strings (preferred) or legacy project name (case-insensitive vs `project.projectName`). */
function projectMatchesFilterEntry(project: Project, entry: string): boolean {
  const t = entry.trim()
  if (/^\d+$/.test(t)) {
    return String(project.id) === t
  }
  return t.toLowerCase() === project.projectName.trim().toLowerCase()
}

/** Employer filter values: numeric id strings from API search (preferred) or legacy employer name. */
function workExperienceMatchesEmployerFilter(
  we: { employerId?: number | null; employerName: string },
  selectedEmployers: string[]
): boolean {
  if (selectedEmployers.length === 0) return false
  const nameNorm = we.employerName.trim().toLowerCase()
  return selectedEmployers.some((entry) => {
    const t = entry.trim()
    if (/^\d+$/.test(t) && we.employerId != null && Number.parseInt(t, 10) === we.employerId) {
      return true
    }
    return t.toLowerCase() === nameNorm
  })
}

/** True when candidate.city contains the filter text (case-insensitive). */
function candidateCityContainsNeedle(candidate: Candidate, cityNeedle: string): boolean {
  const needle = cityNeedle.trim().toLowerCase()
  if (!needle) return false
  const cand = (candidate.city ?? "").trim().toLowerCase()
  return cand.includes(needle)
}

/** Stored profile completion (`dataProgressPercentage`, 0–100) within filter bounds. */
function candidateMatchesDataProgressFilter(candidate: Candidate, filters: CandidateFilters): boolean {
  if (!filters.dataProgressMin.trim() && !filters.dataProgressMax.trim()) return false
  if (candidate.dataProgressPercentage == null || Number.isNaN(candidate.dataProgressPercentage)) {
    return false
  }
  const min = filters.dataProgressMin.trim() ? parseFloat(filters.dataProgressMin) : 0
  const max = filters.dataProgressMax.trim() ? parseFloat(filters.dataProgressMax) : 100
  if (Number.isNaN(min) || Number.isNaN(max)) return false
  const pct = candidate.dataProgressPercentage
  return pct >= min && pct <= max
}

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
  type: 'projects' | 'employers' | 'workExperience' | 'education' | 'certifications' | 'competitions' | 'basic' | 'collaboration' | 'published'
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
    filters.postingTitle ||
    filters.city.trim() ||
    filters.currentSalaryMin ||
    filters.currentSalaryMax ||
    filters.expectedSalaryMin ||
    filters.expectedSalaryMax ||
    filters.employers.length > 0 ||
    filters.projects.length > 0 ||
    filters.projectStatus.length > 0 ||
    filters.projectTypes.length > 0 ||
    filters.techStacks.length > 0 ||
    filters.clientLocations.length > 0 ||
    filters.verticalDomains.length > 0 ||
    filters.horizontalDomains.length > 0 ||
    filters.technicalDomains.length > 0 ||
    filters.technicalAspectTypeIds.length > 0 ||
    filters.startDateStart !== null ||
    filters.startDateEnd !== null ||
    filters.candidateTechStacks.length > 0 ||
    (filters.techStackMinYears && filters.techStackMinYears.techStacks.length > 0 && filters.techStackMinYears.minYears) ||
    (filters.workModeMinYears && filters.workModeMinYears.workModes.length > 0 && filters.workModeMinYears.minYears) ||
    filters.shiftTypes.length > 0 ||
    filters.workModes.length > 0 ||
    filters.timeSupportZones.length > 0 ||
    filters.workedWithTopDeveloper === true ||
    filters.isTopDeveloper !== null ||
    filters.jobTitle ||
    filters.yearsOfExperienceMin ||
    filters.yearsOfExperienceMax ||
    filters.hasMutualConnectionWithDPL !== null ||
    filters.joinedProjectFromStart !== null ||
    filters.projectTeamSizeMin ||
    filters.projectTeamSizeMax ||
    filters.hasPublishedProject === true ||
    filters.publishPlatforms.length > 0 ||
    filters.minProjectDownloadCount ||
    filters.employerStatus.length > 0 ||
    filters.employerCountries.length > 0 ||
    !!filters.employerCity.trim() ||
    filters.employerTypes.length > 0 ||
    filters.employerSalaryPolicies.length > 0 ||
    filters.employerSizeMin ||
    filters.employerSizeMax ||
    filters.employerRankings.length > 0 ||
    filters.universities.length > 0 ||
    filters.degreeNames.length > 0 ||
    filters.majorNames.length > 0 ||
    filters.isTopper !== null ||
    filters.isCheetah !== null ||
    filters.educationEndDateStart !== null ||
    filters.educationEndDateEnd !== null ||
    filters.certificationNames.length > 0 ||
    filters.certificationIssuingBodies.length > 0 ||
    filters.certificationLevels.length > 0 ||
    (filters.achievementTypes && filters.achievementTypes.length > 0) ||
    !!filters.achievementName.trim() ||
    filters.personalityTypes.length > 0 ||
    filters.source.length > 0 ||
    filters.dataProgressMin ||
    filters.dataProgressMax
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

function resolveVerticalDomainLabel(domain: MatchedDomainDto): string {
  return VERTICAL_DOMAIN_LABELS[domain.id] ?? domain.label
}

function resolveHorizontalDomainLabel(domain: MatchedDomainDto): string {
  return HORIZONTAL_DOMAIN_LABELS[domain.id] ?? domain.label
}

function resolveTechnicalDomainLabel(domain: MatchedDomainDto): string {
  return TECHNICAL_DOMAIN_HUMAN_LABELS[domain.id] ?? domain.label
}

function resolveProjectStatusLabel(status: MatchedDomainDto): string {
  for (const [uiLabel, num] of Object.entries(PROJECT_STATUS_UI_TO_NUM) as [
    ProjectStatus,
    number,
  ][]) {
    if (num === status.id) return uiLabel
  }
  return status.label
}

function resolveTechStackLabel(stack: MatchedDomainDto): string {
  return stack.label.trim() || String(stack.id)
}

const PROJECT_TYPE_NUM_TO_UI: Record<number, ProjectType> = {
  0: "Employer",
  1: "Academic",
  2: "Personal",
  3: "Freelance",
  4: "Open Source",
}

function resolveProjectTypeLabel(projectType: MatchedDomainDto): string {
  return PROJECT_TYPE_NUM_TO_UI[projectType.id] ?? projectType.label
}

function resolvePublishPlatformLabel(platform: MatchedDomainDto): string {
  for (const [uiLabel, num] of Object.entries(PUBLISH_PLATFORM_UI_TO_NUM) as [
    PublishPlatform,
    number,
  ][]) {
    if (num === platform.id) return uiLabel
  }
  return platform.label
}

function formatTeamSizeBadge(teamSize: MatchedTeamSizeDto): string {
  const min = teamSize.minTeamSize
  const max = teamSize.maxTeamSize
  if (min != null && max != null) return `${min}-${max}`
  if (min != null) return String(min)
  if (max != null) return String(max)
  return ""
}

function formatEmployerSizeBadge(size: MatchedEmployerSizeDto): string {
  const min = size.minEmployees
  const max = size.maxEmployees
  if (min != null && max != null) {
    return min === max ? `${min} employees` : `${min}-${max} employees`
  }
  if (min != null) return `${min} employees`
  if (max != null) return `${max} employees`
  return ""
}

function invertApiEnumMap<T extends string>(map: Record<T, number>): Record<number, T> {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [value, key]),
  ) as Record<number, T>
}

const API_TO_EMPLOYER_TYPE = invertApiEnumMap(EMPLOYER_TYPE_TO_API)
const API_TO_SALARY_POLICY = invertApiEnumMap(SALARY_POLICY_TO_API)
const API_TO_RANKING = invertApiEnumMap(RANKING_TO_API)
const API_TO_EMPLOYER_STATUS = invertApiEnumMap(EMPLOYER_STATUS_TO_API)

const EMPLOYER_STATUS_DB_TO_UI: Record<string, string> = {
  open: "Active",
  closed: "Closed",
  flagged: "Flagged",
}

function resolveMatchedDomainLabel(domain: MatchedDomainDto): string {
  const trimmed = domain.label.trim()
  return trimmed || String(domain.id)
}

function resolveEmployerStatusLabel(domain: MatchedDomainDto): string {
  const trimmed = domain.label.trim()
  if (trimmed) return trimmed
  const db = API_TO_EMPLOYER_STATUS[domain.id]
  if (db) return EMPLOYER_STATUS_DB_TO_UI[db] ?? db
  return String(domain.id)
}

function resolveEmployerTypeLabel(domain: MatchedDomainDto): string {
  const trimmed = domain.label.trim()
  if (trimmed) return trimmed
  const db = API_TO_EMPLOYER_TYPE[domain.id] as EmployerTypeDb | undefined
  return db ? EMPLOYER_TYPE_DB_LABELS[db] : String(domain.id)
}

function resolveSalaryPolicyLabel(domain: MatchedDomainDto): string {
  const trimmed = domain.label.trim()
  if (trimmed) return trimmed
  const db = API_TO_SALARY_POLICY[domain.id] as SalaryPolicyDb | undefined
  return db ? SALARY_POLICY_DB_LABELS[db] : String(domain.id)
}

function resolveEmployerRankingLabel(domain: MatchedDomainDto): string {
  const trimmed = domain.label.trim()
  if (trimmed) return trimmed
  const db = API_TO_RANKING[domain.id] as RankingDb | undefined
  return db ? RANKING_DB_LABELS[db] : String(domain.id)
}

function formatDownloadCountThreshold(filterValue: string): string {
  const n = Number(filterValue.replace(/,/g, "").trim())
  if (!Number.isFinite(n) || n <= 0) return `≥ ${filterValue.trim()}`
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return `≥ ${Number.isInteger(m) ? m : m.toFixed(1)}M`
  }
  if (n >= 1_000) {
    const k = n / 1_000
    return `≥ ${Number.isInteger(k) ? k : k.toFixed(1)}K`
  }
  return `≥ ${n.toLocaleString()}`
}

function formatProjectStartDateBadge(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

function hasPublishRelatedFilter(filters: CandidateFilters): boolean {
  return filters.hasPublishedProject === true || filters.publishPlatforms.length > 0
}

/** Active list filters that drive backend `matchedProjects` (Phases 1–3). */
function hasBackendMatchedProjectFilterDrivers(filters: CandidateFilters): boolean {
  return (
    filters.verticalDomains.length > 0 ||
    filters.horizontalDomains.length > 0 ||
    filters.technicalDomains.length > 0 ||
    filters.projectStatus.length > 0 ||
    filters.techStacks.length > 0 ||
    filters.projectTypes.length > 0 ||
    filters.clientLocations.length > 0 ||
    filters.publishPlatforms.length > 0 ||
    filters.hasPublishedProject === true ||
    !!filters.minProjectDownloadCount.trim() ||
    !!filters.projectTeamSizeMin.trim() ||
    !!filters.projectTeamSizeMax.trim() ||
    filters.startDateStart !== null ||
    filters.startDateEnd !== null ||
    filters.technicalAspectTypeIds.length > 0
  )
}

/** Build Project Expertise match items from backend list `matchedProjects`. */
function appendBackendMatchedProjectItems(
  candidate: Candidate,
  filters: CandidateFilters,
  projectItems: MatchItem[],
): void {
  if (!hasBackendMatchedProjectFilterDrivers(filters)) return

  const matchedProjects = candidate.matchedProjects
  if (!matchedProjects?.length) return

  for (const mp of matchedProjects) {
    appendBackendMatchedProjectItem(mp, filters, projectItems)
  }
}

function appendBackendMatchedProjectItem(
  mp: MatchedProjectDto,
  filters: CandidateFilters,
  projectItems: MatchItem[],
): void {
  const matchedCriteria: MatchCriterion[] = []

  if (filters.verticalDomains.length > 0 && mp.verticalDomains.length > 0) {
    matchedCriteria.push({
      type: "verticalDomain",
      label: "Vertical Domain",
      values: mp.verticalDomains.map(resolveVerticalDomainLabel),
    })
  }

  if (filters.horizontalDomains.length > 0 && mp.horizontalDomains.length > 0) {
    matchedCriteria.push({
      type: "horizontalDomain",
      label: "Horizontal Domain",
      values: mp.horizontalDomains.map(resolveHorizontalDomainLabel),
    })
  }

  if (filters.technicalDomains.length > 0 && mp.technicalDomains.length > 0) {
    matchedCriteria.push({
      type: "technicalDomain",
      label: "Technical Domain",
      values: mp.technicalDomains.map(resolveTechnicalDomainLabel),
    })
  }

  if (filters.projectStatus.length > 0 && mp.status != null) {
    matchedCriteria.push({
      type: "status",
      label: "Project Status",
      values: [resolveProjectStatusLabel(mp.status)],
    })
  }

  if (filters.techStacks.length > 0 && mp.techStacks.length > 0) {
    matchedCriteria.push({
      type: "techStack",
      label: "Tech Stack",
      values: mp.techStacks.map(resolveTechStackLabel),
    })
  }

  if (filters.technicalAspectTypeIds.length > 0 && mp.technicalAspectTypes.length > 0) {
    matchedCriteria.push({
      type: "technicalAspect",
      label: "Technical Aspect",
      values: mp.technicalAspectTypes.map((aspect) => aspect.label.trim() || String(aspect.id)),
    })
  }

  if (filters.projectTypes.length > 0 && mp.projectType != null) {
    matchedCriteria.push({
      type: "type",
      label: "Project Type",
      values: [resolveProjectTypeLabel(mp.projectType)],
    })
  }

  if (filters.clientLocations.length > 0 && mp.clientLocations.length > 0) {
    matchedCriteria.push({
      type: "clientLocation",
      label: "Client Location",
      values: mp.clientLocations.map((loc) => loc.label.trim() || String(loc.id)),
    })
  }

  if (filters.publishPlatforms.length > 0 && mp.publishPlatforms.length > 0) {
    matchedCriteria.push({
      type: "publishedPlatform",
      label: "Published On",
      values: mp.publishPlatforms.map(resolvePublishPlatformLabel),
    })
  }

  if (hasPublishRelatedFilter(filters) && mp.storeLink) {
    matchedCriteria.push({
      type: "storeLink",
      label: "Store Link",
      values: [mp.storeLink],
    })
  }

  if (
    (filters.projectTeamSizeMin.trim() || filters.projectTeamSizeMax.trim()) &&
    mp.teamSize != null
  ) {
    const badge = formatTeamSizeBadge(mp.teamSize)
    if (badge) {
      matchedCriteria.push({
        type: "teamSize",
        label: "Team Size",
        values: [badge],
      })
    }
  }

  if (filters.minProjectDownloadCount.trim() && mp.downloadCount != null) {
    matchedCriteria.push({
      type: "downloadCount",
      label: "Downloads",
      values: [formatDownloadCountThreshold(filters.minProjectDownloadCount)],
    })
  }

  if (
    (filters.startDateStart !== null || filters.startDateEnd !== null) &&
    mp.startDate
  ) {
    matchedCriteria.push({
      type: "projectStartDate",
      label: "Start Date",
      values: [formatProjectStartDateBadge(mp.startDate)],
    })
  }

  if (matchedCriteria.length === 0) return

  projectItems.push({
    name: mp.projectName,
    matchedCriteria,
    context: {
      projectId: mp.projectId,
    },
  })
}

function formatEducationEndMonthBadge(isoDate: string): string {
  const trimmed = isoDate.trim()
  if (!trimmed) return trimmed
  const d = new Date(trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`)
  if (Number.isNaN(d.getTime())) return trimmed
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" })
}

function resolveMatchedEducationHeading(me: MatchedEducationDto): string {
  if (me.universityName?.trim()) return me.universityName.trim()
  if (me.universityId != null && Number.isFinite(me.universityId)) {
    return `University #${me.universityId}`
  }
  return `Education #${me.educationId}`
}

function resolveMatchedEducationUniversityLabel(me: MatchedEducationDto): string {
  if (me.universityName?.trim()) return me.universityName.trim()
  if (me.universityId != null && Number.isFinite(me.universityId)) {
    return `University #${me.universityId}`
  }
  return "University"
}

/** Active list filters that drive backend `matchedEducations`. */
function hasBackendMatchedEducationFilterDrivers(filters: CandidateFilters): boolean {
  return (
    filters.universities.length > 0 ||
    filters.degreeNames.length > 0 ||
    filters.majorNames.length > 0 ||
    filters.isTopper !== null ||
    filters.isCheetah !== null ||
    filters.educationEndDateStart !== null ||
    filters.educationEndDateEnd !== null
  )
}

/** Build Education Background match items from backend list `matchedEducations`. */
function appendBackendMatchedEducationItems(
  candidate: Candidate,
  filters: CandidateFilters,
  educationItems: MatchItem[],
): void {
  if (!hasBackendMatchedEducationFilterDrivers(filters)) return

  const matchedEducations = candidate.matchedEducations
  if (!matchedEducations?.length) return

  for (const me of matchedEducations) {
    appendBackendMatchedEducationItem(me, filters, educationItems)
  }
}

function appendBackendMatchedEducationItem(
  me: MatchedEducationDto,
  filters: CandidateFilters,
  educationItems: MatchItem[],
): void {
  const matchedCriteria: MatchCriterion[] = []

  if (filters.universities.length > 0 && me.matchedByUniversityId) {
    matchedCriteria.push({
      type: "university",
      label: "University",
      values: [resolveMatchedEducationUniversityLabel(me)],
    })
  }

  if (filters.degreeNames.length > 0 && me.degree != null) {
    matchedCriteria.push({
      type: "degree",
      label: "Degree",
      values: [resolveMatchedDomainLabel(me.degree)],
    })
  }

  if (filters.majorNames.length > 0 && me.major != null) {
    matchedCriteria.push({
      type: "major",
      label: "Major",
      values: [resolveMatchedDomainLabel(me.major)],
    })
  }

  if (filters.isTopper === true && me.isTopper === true) {
    matchedCriteria.push({
      type: "isTopper",
      label: "Topper",
      values: ["Yes"],
    })
  }

  if (filters.isCheetah === true && me.isMainCheetah === true) {
    matchedCriteria.push({
      type: "isCheetah",
      label: "Cheetah",
      values: ["Yes"],
    })
  }

  if (
    (filters.educationEndDateStart !== null || filters.educationEndDateEnd !== null) &&
    me.endMonth
  ) {
    matchedCriteria.push({
      type: "endMonth",
      label: "Graduation",
      values: [formatEducationEndMonthBadge(me.endMonth)],
    })
  }

  if (matchedCriteria.length === 0) return

  if (me.grades?.trim()) {
    matchedCriteria.push({
      type: "grades",
      label: "Grades",
      values: [me.grades.trim()],
    })
  }

  educationItems.push({
    name: resolveMatchedEducationHeading(me),
    matchedCriteria,
    context: {
      educationId: me.educationId,
      universityId: me.universityId ?? undefined,
      degreeName: me.degree ? resolveMatchedDomainLabel(me.degree) : undefined,
      majorName: me.major ? resolveMatchedDomainLabel(me.major) : undefined,
      grades: me.grades,
      isTopper: me.isTopper === true,
      isCheetah: me.isMainCheetah === true,
    },
  })
}

function resolveMatchedCertificationHeading(mc: MatchedCertificationDto): string {
  if (mc.certificationName?.trim()) return mc.certificationName.trim()
  return `Certification #${mc.certificationId}`
}

/** True when row catalog id or name matches any entry in `certificationNames` filter. */
function matchedCertificationMatchesNameFilter(
  mc: MatchedCertificationDto,
  certificationNames: string[],
): boolean {
  return certificationNames.some((entry) => {
    const t = entry.trim()
    if (!t) return false
    if (/^\d+$/.test(t)) return String(mc.certificationId) === t
    return mc.certificationName?.trim().toLowerCase() === t.toLowerCase()
  })
}

/** Active list filters that drive backend `matchedCertifications`. */
function hasBackendMatchedCertificationFilterDrivers(filters: CandidateFilters): boolean {
  return (
    filters.certificationNames.length > 0 ||
    filters.certificationIssuingBodies.length > 0 ||
    filters.certificationLevels.length > 0
  )
}

/** Build Certifications match items from backend list `matchedCertifications`. */
function appendBackendMatchedCertificationItems(
  candidate: Candidate,
  filters: CandidateFilters,
  certificationItems: MatchItem[],
): void {
  if (!hasBackendMatchedCertificationFilterDrivers(filters)) return

  const matchedCertifications = candidate.matchedCertifications
  if (!matchedCertifications?.length) return

  for (const mc of matchedCertifications) {
    appendBackendMatchedCertificationItem(mc, filters, certificationItems)
  }
}

function appendBackendMatchedCertificationItem(
  mc: MatchedCertificationDto,
  filters: CandidateFilters,
  certificationItems: MatchItem[],
): void {
  const matchedCriteria: MatchCriterion[] = []

  if (filters.certificationNames.length > 0) {
    const showCertBadge =
      mc.matchedByCertificationId ||
      matchedCertificationMatchesNameFilter(mc, filters.certificationNames)
    if (showCertBadge) {
      matchedCriteria.push({
        type: "certification",
        label: "Certification",
        values: [resolveMatchedCertificationHeading(mc)],
      })
    }
  }

  if (filters.certificationIssuingBodies.length > 0 && mc.issuingBody != null) {
    matchedCriteria.push({
      type: "issuingBody",
      label: "Issuing Body",
      values: [resolveMatchedDomainLabel(mc.issuingBody)],
    })
  }

  if (filters.certificationLevels.length > 0 && mc.level != null) {
    matchedCriteria.push({
      type: "level",
      label: "Certification Level",
      values: [resolveMatchedDomainLabel(mc.level)],
    })
  }

  if (matchedCriteria.length === 0) return

  certificationItems.push({
    name: resolveMatchedCertificationHeading(mc),
    matchedCriteria,
    context: {
      candidateCertificationId: mc.candidateCertificationId,
      certificationId: mc.certificationId,
    },
  })
}

function resolveMatchedAchievementHeading(ma: MatchedAchievementDto): string {
  if (ma.name?.trim()) return ma.name.trim()
  return `Achievement #${ma.achievementId}`
}

/** Active list filters that drive backend `matchedAchievements`. */
function hasBackendMatchedAchievementFilterDrivers(filters: CandidateFilters): boolean {
  return (
    (filters.achievementTypes?.length ?? 0) > 0 ||
    !!filters.achievementName.trim()
  )
}

/** Build Achievements match items from backend list `matchedAchievements`. */
function appendBackendMatchedAchievementItems(
  candidate: Candidate,
  filters: CandidateFilters,
  achievementItems: MatchItem[],
): void {
  if (!hasBackendMatchedAchievementFilterDrivers(filters)) return

  const matchedAchievements = candidate.matchedAchievements
  if (!matchedAchievements?.length) return

  for (const ma of matchedAchievements) {
    appendBackendMatchedAchievementItem(ma, filters, achievementItems)
  }
}

function appendBackendMatchedAchievementItem(
  ma: MatchedAchievementDto,
  filters: CandidateFilters,
  achievementItems: MatchItem[],
): void {
  const matchedCriteria: MatchCriterion[] = []

  if ((filters.achievementTypes?.length ?? 0) > 0 && ma.achievementType != null) {
    matchedCriteria.push({
      type: "achievementType",
      label: "Achievement Type",
      values: [resolveMatchedDomainLabel(ma.achievementType)],
    })
  }

  if (filters.achievementName.trim() && ma.matchedByAchievementName) {
    matchedCriteria.push({
      type: "achievementName",
      label: "Achievement Name",
      values: [resolveMatchedAchievementHeading(ma)],
    })
  }

  if (matchedCriteria.length === 0) return

  if (ma.url?.trim()) {
    matchedCriteria.push({
      type: "storeLink",
      label: "Achievement URL",
      values: [ma.url.trim()],
    })
  }

  achievementItems.push({
    name: resolveMatchedAchievementHeading(ma),
    matchedCriteria,
    context: {},
  })
}

/** Active list filters that drive backend `matchedEmployers`. */
function hasBackendMatchedEmployerFilterDrivers(filters: CandidateFilters): boolean {
  return (
    filters.employers.length > 0 ||
    filters.employerStatus.length > 0 ||
    filters.employerCountries.length > 0 ||
    !!filters.employerCity.trim() ||
    filters.employerTypes.length > 0 ||
    filters.employerSalaryPolicies.length > 0 ||
    filters.employerRankings.length > 0 ||
    !!filters.employerSizeMin.trim() ||
    !!filters.employerSizeMax.trim()
  )
}

/** Build Employer Experience match items from backend list `matchedEmployers`. */
function appendBackendMatchedEmployerItems(
  candidate: Candidate,
  filters: CandidateFilters,
  employerItems: MatchItem[],
): void {
  if (!hasBackendMatchedEmployerFilterDrivers(filters)) return

  const matchedEmployers = candidate.matchedEmployers
  if (!matchedEmployers?.length) return

  for (const me of matchedEmployers) {
    appendBackendMatchedEmployerItem(me, filters, employerItems)
  }
}

function appendBackendMatchedEmployerItem(
  me: MatchedEmployerDto,
  filters: CandidateFilters,
  employerItems: MatchItem[],
): void {
  const matchedCriteria: MatchCriterion[] = []

  if (filters.employers.length > 0 && me.matchedByEmployerId) {
    matchedCriteria.push({
      type: "employer",
      label: "Employer",
      values: [me.employerName],
    })
  }

  if (filters.employerStatus.length > 0 && me.statuses.length > 0) {
    matchedCriteria.push({
      type: "employerStatus",
      label: "Employer Status",
      values: me.statuses.map(resolveEmployerStatusLabel),
    })
  }

  if (filters.employerCountries.length > 0 && me.countries.length > 0) {
    matchedCriteria.push({
      type: "country",
      label: "Country",
      values: me.countries.map(resolveMatchedDomainLabel),
    })
  }

  if (filters.employerCity.trim() && me.cities.length > 0) {
    matchedCriteria.push({
      type: "city",
      label: "City",
      values: me.cities,
    })
  }

  if (filters.employerTypes.length > 0 && me.employerTypes.length > 0) {
    matchedCriteria.push({
      type: "employerType",
      label: "Employer Type",
      values: me.employerTypes.map(resolveEmployerTypeLabel),
    })
  }

  if (filters.employerSalaryPolicies.length > 0 && me.salaryPolicy != null) {
    matchedCriteria.push({
      type: "salaryPolicy",
      label: "Salary Policy",
      values: [resolveSalaryPolicyLabel(me.salaryPolicy)],
    })
  }

  if (filters.employerRankings.length > 0 && me.ranking != null) {
    matchedCriteria.push({
      type: "ranking",
      label: "Ranking",
      values: [resolveEmployerRankingLabel(me.ranking)],
    })
  }

  if (
    (filters.employerSizeMin.trim() || filters.employerSizeMax.trim()) &&
    me.size != null
  ) {
    const badge = formatEmployerSizeBadge(me.size)
    if (badge) {
      matchedCriteria.push({
        type: "size",
        label: "Company Size",
        values: [badge],
      })
    }
  }

  if (matchedCriteria.length === 0) return

  employerItems.push({
    name: me.employerName,
    matchedCriteria,
    context: {
      workExperienceId: me.workExperienceId,
      employerId: me.employerId,
      jobTitle: me.jobTitle,
      startDate: me.startDate,
      endDate: me.endDate,
    },
  })
}

/** Active list filters that drive backend `matchedWorkExperiences`. */
function hasBackendMatchedWorkExperienceFilterDrivers(filters: CandidateFilters): boolean {
  return (
    filters.shiftTypes.length > 0 ||
    filters.workModes.length > 0 ||
    filters.timeSupportZones.length > 0 ||
    filters.candidateTechStacks.length > 0
  )
}

/** Build Work Experience row match items from backend list `matchedWorkExperiences`. */
function appendBackendMatchedWorkExperienceItems(
  candidate: Candidate,
  filters: CandidateFilters,
  workExperienceItems: MatchItem[],
): void {
  if (!hasBackendMatchedWorkExperienceFilterDrivers(filters)) return

  const matchedWorkExperiences = candidate.matchedWorkExperiences
  if (!matchedWorkExperiences?.length) return

  for (const mwe of matchedWorkExperiences) {
    appendBackendMatchedWorkExperienceItem(mwe, filters, workExperienceItems)
  }
}

function appendBackendMatchedWorkExperienceItem(
  mwe: MatchedWorkExperienceDto,
  filters: CandidateFilters,
  workExperienceItems: MatchItem[],
): void {
  const matchedCriteria: MatchCriterion[] = []

  if (filters.shiftTypes.length > 0 && mwe.shiftType != null) {
    matchedCriteria.push({
      type: "shiftType",
      label: "Shift Type",
      values: [resolveMatchedDomainLabel(mwe.shiftType)],
    })
  }

  if (filters.workModes.length > 0 && mwe.workMode != null) {
    matchedCriteria.push({
      type: "workMode",
      label: "Work Mode",
      values: [resolveMatchedDomainLabel(mwe.workMode)],
    })
  }

  if (filters.timeSupportZones.length > 0 && mwe.timeSupportZones.length > 0) {
    matchedCriteria.push({
      type: "timeSupportZones",
      label: "Time Support Zones",
      values: mwe.timeSupportZones.map(resolveMatchedDomainLabel),
    })
  }

  if (filters.candidateTechStacks.length > 0 && mwe.techStacks.length > 0) {
    matchedCriteria.push({
      type: "candidateTechStack",
      label: "Tech Stack",
      values: mwe.techStacks.map(resolveMatchedDomainLabel),
    })
  }

  if (matchedCriteria.length === 0) return

  const jobTitleDisplay = mwe.jobTitle?.trim() || "N/A"
  workExperienceItems.push({
    name: `${mwe.employerName} - ${jobTitleDisplay}`,
    matchedCriteria,
    context: {
      workExperienceId: mwe.workExperienceId,
      employerId: mwe.employerId,
      jobTitle: mwe.jobTitle,
      startDate: mwe.startDate,
      endDate: mwe.endDate,
    },
  })
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
    filters.technicalDomains.length > 0 ||
    filters.technicalAspectTypeIds.length > 0 ||
    filters.clientLocations.length > 0 ||
    filters.startDateStart !== null ||
    filters.startDateEnd !== null ||
    filters.projectTeamSizeMin ||
    filters.projectTeamSizeMax ||
    filters.hasPublishedProject === true ||
    filters.publishPlatforms.length > 0 ||
    filters.minProjectDownloadCount
  )

  if (hasProjectFilters) {
    const candidateProjects = getCandidateProjects(candidate)
    const projectItems: MatchItem[] = []
    const useBackendMatchedProjects =
      hasBackendMatchedProjectFilterDrivers(filters) &&
      (candidate.matchedProjects?.length ?? 0) > 0

    appendBackendMatchedProjectItems(candidate, filters, projectItems)

    candidateProjects.forEach(project => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      // Project name / id match (debounced search stores ids)
      if (filters.projects.some((p) => projectMatchesFilterEntry(project, p))) {
        matchedCriteria.push({
          type: 'project',
          label: 'Project Name',
          values: [project.projectName]
        })
        hasMatch = true
      }

      // Project status, tech stacks, domains, type — skip mock path when backend matchedProjects is used
      if (!useBackendMatchedProjects) {
        if (filters.projectStatus.includes(project.status)) {
          matchedCriteria.push({
            type: 'status',
            label: 'Project Status',
            values: [project.status]
          })
          hasMatch = true
        }

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

        const matchingTechnicalDomains = project.technicalDomains.filter((d) =>
          filters.technicalDomains.includes(d)
        )
        if (matchingTechnicalDomains.length > 0) {
          matchedCriteria.push({
            type: 'technicalDomain',
            label: 'Technical Domain',
            values: matchingTechnicalDomains
          })
          hasMatch = true
        }

        if (filters.projectTypes.includes(project.projectType)) {
          matchedCriteria.push({
            type: 'type',
            label: 'Project Type',
            values: [project.projectType]
          })
          hasMatch = true
        }
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
  }

  // Employer Characteristics Matches
  const hasEmployerFilters = !!(
    filters.employers.length > 0 ||
    filters.employerStatus.length > 0 ||
    filters.employerCountries.length > 0 ||
    !!filters.employerCity.trim() ||
    filters.employerTypes.length > 0 ||
    filters.employerSalaryPolicies.length > 0 ||
    filters.employerSizeMin ||
    filters.employerSizeMax ||
    filters.employerRankings.length > 0
  )

  if (hasEmployerFilters) {
    const employerItems: MatchItem[] = []
    const useBackendMatchedEmployers =
      hasBackendMatchedEmployerFilterDrivers(filters) &&
      (candidate.matchedEmployers?.length ?? 0) > 0

    appendBackendMatchedEmployerItems(candidate, filters, employerItems)

    if (!useBackendMatchedEmployers) {
    candidate.workExperiences?.forEach(we => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      // Employer match (id from debounced search or legacy name)
      if (workExperienceMatchesEmployerFilter(we, filters.employers)) {
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
        if (
          employer.status != null &&
          filters.employerStatus.includes(employer.status)
        ) {
          matchedCriteria.push({
            type: 'status',
            label: 'Employer Status',
            values: [employer.status],
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

        // Employer city match (free-text substring on location.city)
        const cityNeedle = filters.employerCity.trim()
        if (cityNeedle) {
          const needleLower = cityNeedle.toLowerCase()
          const matchingCities = employer.locations
            .map((loc) => loc.city)
            .filter((city): city is string => city != null && String(city).trim() !== "")
            .filter((city) => city.toLowerCase().includes(needleLower))
          if (matchingCities.length > 0) {
            matchedCriteria.push({
              type: "city",
              label: "City",
              values: matchingCities,
            })
            hasMatch = true
          }
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

        // Salary policy match (employer-level; fall back to first office for legacy data)
        const rawPolicy =
          employer.salaryPolicy ?? employer.locations[0]?.salaryPolicy ?? null
        const employerPolicy =
          rawPolicy != null && String(rawPolicy).trim()
            ? normalizeSalaryPolicy(String(rawPolicy))
            : null
        const matchingPolicies =
          employerPolicy && filters.employerSalaryPolicies.includes(employerPolicy)
            ? [employerPolicy]
            : []
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
          let totalMinSize: number
          let totalMaxSize: number
          if (employer.minEmployees != null || employer.maxEmployees != null) {
            totalMinSize = employer.minEmployees ?? employer.maxEmployees ?? 0
            totalMaxSize = employer.maxEmployees ?? employer.minEmployees ?? 0
          } else {
            totalMinSize = employer.locations.reduce((sum, loc) => sum + (loc.minSize ?? 0), 0)
            totalMaxSize = employer.locations.reduce((sum, loc) => sum + (loc.maxSize ?? 0), 0)
          }

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
    filters.degreeNames.length > 0 ||
    filters.majorNames.length > 0 ||
    filters.isTopper !== null ||
    filters.isCheetah !== null ||
    filters.educationEndDateStart !== null ||
    filters.educationEndDateEnd !== null
  )

  if (hasEducationFilters) {
    const educationItems: MatchItem[] = []
    const useBackendMatchedEducations =
      hasBackendMatchedEducationFilterDrivers(filters) &&
      (candidate.matchedEducations?.length ?? 0) > 0

    appendBackendMatchedEducationItems(candidate, filters, educationItems)

    if (!useBackendMatchedEducations) {
    candidate.educations?.forEach(edu => {
      const matchedCriteria: MatchCriterion[] = []
      let hasMatch = false

      if (
        filters.universities.length > 0 &&
        filters.universities.some(
          (id) =>
            id === edu.universityLocationId ||
            id.trim() === edu.universityLocationId.trim()
        )
      ) {
        matchedCriteria.push({
          type: 'university',
          label: 'University',
          values: [edu.universityLocationName]
        })
        hasMatch = true
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

      // Topper match (badge only when filter is explicitly true)
      if (filters.isTopper === true && edu.isTopper === true) {
        matchedCriteria.push({
          type: 'isTopper',
          label: 'Topper',
          values: ['Yes']
        })
        hasMatch = true
      }

      // Cheetah match (badge only when filter is explicitly true)
      if (filters.isCheetah === true && edu.isCheetah === true) {
        matchedCriteria.push({
          type: 'isCheetah',
          label: 'Cheetah',
          values: ['Yes']
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
            const filterStartDate = new Date(filters.educationEndDateStart)
            const filterEndDate = new Date(filters.educationEndDateEnd)
            filterStartDate.setHours(0, 0, 0, 0)
            filterEndDate.setHours(23, 59, 59, 999)
            
            if (eduEndDate >= filterStartDate && eduEndDate <= filterEndDate) {
              matchesRange = true
            }
          } else if (filters.educationEndDateStart && !filters.educationEndDateEnd) {
            const filterStartDate = new Date(filters.educationEndDateStart)
            filterStartDate.setHours(0, 0, 0, 0)
            if (eduEndDate >= filterStartDate) {
              matchesRange = true
            }
          } else if (filters.educationEndDateEnd && !filters.educationEndDateStart) {
            const filterEndDate = new Date(filters.educationEndDateEnd)
            filterEndDate.setHours(23, 59, 59, 999)
            if (eduEndDate <= filterEndDate) {
              matchesRange = true
            }
          }
          
          if (matchesRange) {
            matchedCriteria.push({
              type: 'endMonth',
              label: 'Graduation',
              values: [formatEducationEndMonthBadge(edu.endMonth.toISOString())]
            })
            hasMatch = true
          }
        }
      }

      if (hasMatch) {
        if (edu.grades?.trim()) {
          matchedCriteria.push({
            type: 'grades',
            label: 'Grades',
            values: [edu.grades.trim()]
          })
        }

        educationItems.push({
          name: edu.universityLocationName,
          matchedCriteria,
          context: {
            degreeName: edu.degreeName,
            majorName: edu.majorName,
            grades: edu.grades,
            isTopper: edu.isTopper === true,
            isCheetah: edu.isCheetah === true,
          }
        })
      }
    })
    }

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

  // Certification Matches (backend `matchedCertifications` only)
  const hasCertificationFilters = hasBackendMatchedCertificationFilterDrivers(filters)

  if (hasCertificationFilters) {
    const certificationItems: MatchItem[] = []
    appendBackendMatchedCertificationItems(candidate, filters, certificationItems)

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

  // Achievement Matches (backend `matchedAchievements` only)
  const hasAchievementFilters = hasBackendMatchedAchievementFilterDrivers(filters)

  if (hasAchievementFilters) {
    const achievementItems: MatchItem[] = []
    appendBackendMatchedAchievementItems(candidate, filters, achievementItems)

    if (achievementItems.length > 0) {
      categories.push({
        type: 'competitions',
        label: 'Achievements',
        icon: '🏆',
        color: 'purple',
        count: achievementItems.length,
        items: achievementItems
      })
    }
  }

  // Basic Information Matches
  const hasBasicFilters = !!(
    filters.city.trim() ||
    filters.personalityTypes.length > 0 ||
    filters.source.length > 0 ||
    filters.currentSalaryMin ||
    filters.currentSalaryMax ||
    filters.expectedSalaryMin ||
    filters.expectedSalaryMax ||
    filters.dataProgressMin ||
    filters.dataProgressMax ||
    filters.isTopDeveloper !== null
  )

  if (hasBasicFilters) {
    const basicItems: MatchItem[] = []
    const matchedCriteria: MatchCriterion[] = []

    // City (free-text substring)
    if (filters.city.trim() && candidateCityContainsNeedle(candidate, filters.city)) {
      matchedCriteria.push({
        type: 'city',
        label: 'City',
        values: [candidate.city ?? ""],
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

    // Source (OR within selected filter values)
    if (filters.source.length > 0) {
      const sourceKey = parseCandidateSource(candidate.source)
      if (sourceKey && filters.source.includes(sourceKey)) {
        matchedCriteria.push({
          type: 'source',
          label: 'Source',
          values: [CANDIDATE_SOURCE_LABELS[sourceKey]],
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

    if (candidateMatchesDataProgressFilter(candidate, filters)) {
      const pct = Math.round(normalizeProgress(candidate.dataProgressPercentage))
      matchedCriteria.push({
        type: 'dataProgress',
        label: 'Data Progress',
        values: [`${pct}%`],
      })
    }

    if (filters.isTopDeveloper !== null) {
      const isTopDeveloper = candidate.isTopDeveloper === true
      if (filters.isTopDeveloper === isTopDeveloper) {
        matchedCriteria.push({
          type: 'topDeveloper',
          label: 'Top Developer',
          values: [isTopDeveloper ? 'Yes' : 'No'],
        })
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

  // Work Experience Matches (row filters + candidate-level job title / years)
  const hasBackendWeRowFilters = hasBackendMatchedWorkExperienceFilterDrivers(filters)
  const hasWorkExperienceSummaryFilters = !!(
    filters.jobTitle ||
    filters.yearsOfExperienceMin ||
    filters.yearsOfExperienceMax
  )

  if (hasBackendWeRowFilters || hasWorkExperienceSummaryFilters) {
    const workExperienceItems: MatchItem[] = []
    const useBackendMatchedWorkExperiences =
      hasBackendWeRowFilters &&
      (candidate.matchedWorkExperiences?.length ?? 0) > 0

    appendBackendMatchedWorkExperienceItems(candidate, filters, workExperienceItems)

    if (!useBackendMatchedWorkExperiences) {
      candidate.workExperiences?.forEach((we) => {
        const matchedCriteria: MatchCriterion[] = []
        let hasMatch = false

        if (hasBackendWeRowFilters) {
          if (filters.shiftTypes.length > 0 && we.shiftType) {
            if (filters.shiftTypes.includes(we.shiftType)) {
              matchedCriteria.push({
                type: "shiftType",
                label: "Shift Type",
                values: [we.shiftType],
              })
              hasMatch = true
            }
          }

          if (filters.workModes.length > 0 && we.workMode) {
            if (filters.workModes.includes(we.workMode)) {
              matchedCriteria.push({
                type: "workMode",
                label: "Work Mode",
                values: [we.workMode],
              })
              hasMatch = true
            }
          }

          if (
            filters.timeSupportZones.length > 0 &&
            we.timeSupportZones &&
            we.timeSupportZones.length > 0
          ) {
            const matchingZones = we.timeSupportZones.filter((zone) =>
              filters.timeSupportZones.includes(zone),
            )
            if (matchingZones.length > 0) {
              matchedCriteria.push({
                type: "timeSupportZones",
                label: "Time Support Zones",
                values: matchingZones,
              })
              hasMatch = true
            }
          }

          if (filters.candidateTechStacks.length > 0 && we.techStacks.length > 0) {
            const matchingTechStacks = we.techStacks.filter((tech) =>
              filters.candidateTechStacks.some(
                (filterTech) => filterTech.toLowerCase() === tech.toLowerCase(),
              ),
            )
            if (matchingTechStacks.length > 0) {
              matchedCriteria.push({
                type: "candidateTechStack",
                label: "Tech Stack",
                values: matchingTechStacks,
              })
              hasMatch = true
            }
          }
        }

        if (hasMatch) {
          workExperienceItems.push({
            name: `${we.employerName} - ${we.jobTitle || "N/A"}`,
            matchedCriteria,
            context: {
              employerName: we.employerName,
              jobTitle: we.jobTitle,
              startDate: we.startDate,
              endDate: we.endDate,
            },
          })
        }
      })
    }

    // Job Title match (candidate-level): backend matches only the latest job title,
    // so compare against the backend-derived `latestJobTitle`, not historical roles.
    if (filters.jobTitle && filters.jobTitle.trim()) {
      const filterJobTitle = filters.jobTitle.trim().toLowerCase()
      const latestJobTitle = candidate.latestJobTitle?.trim()
      if (latestJobTitle && latestJobTitle.toLowerCase().includes(filterJobTitle)) {
        workExperienceItems.push({
          name: 'Latest Job Title',
          matchedCriteria: [
            {
              type: 'jobTitle',
              label: 'Job Title',
              values: [latestJobTitle],
            },
          ],
          context: {
            jobTitle: latestJobTitle,
          },
        })
      }
    }


    // Years of Experience match (candidate-level, not per work experience)
    if (filters.yearsOfExperienceMin || filters.yearsOfExperienceMax) {
      const candidateYearsOfExperience = getTotalExperienceYears(candidate) ?? 0
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


    if (workExperienceItems.length > 0) {
      categories.push({
        type: "workExperience",
        label: "Work Experience",
        icon: "💼",
        color: "indigo",
        count: workExperienceItems.length,
        items: workExperienceItems,
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
          if (!workExperienceMatchesEmployerFilter(candidateWE, filters.employers)) return
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
              if (!workExperienceMatchesEmployerFilter(topDevWE, filters.employers)) return
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

  // Mutual Connections with DPL Match Context
  if (filters.hasMutualConnectionWithDPL === true) {
    const toleranceMonths = filters.mutualConnectionToleranceMonths || 0
    const connectionType = filters.mutualConnectionType || 'both'
    const mutualConnections = findMutualConnectionsWithDPL(
      candidate,
      sampleCandidates,
      toleranceMonths
    )
    
    if (mutualConnections.length > 0) {
      const connectionItems: MatchItem[] = []
      
      mutualConnections.forEach(conn => {
        // Filter by connection type - only process connections that match the filter
        if (connectionType !== 'both' && conn.connectionType !== connectionType) {
          return
        }
        
        const matchedCriteria: MatchCriterion[] = []
        
        // Only show education overlaps if filter allows it
        if (conn.educationOverlaps.length > 0 && 
            (connectionType === 'education' || connectionType === 'both')) {
          matchedCriteria.push({
            type: 'mutualEducation',
            label: 'Overlapping Education',
            values: conn.educationOverlaps.map(overlap => 
              `${overlap.universityLocationName} (${overlap.overlapStart.toLocaleDateString()} - ${overlap.overlapEnd.toLocaleDateString()})`
            )
          })
        }
        
        // Only show work overlaps if filter allows it
        if (conn.workOverlaps.length > 0 && 
            (connectionType === 'work' || connectionType === 'both')) {
          matchedCriteria.push({
            type: 'mutualWork',
            label: 'Overlapping Work Experience',
            values: conn.workOverlaps.map(overlap => 
              `${overlap.employerName} (${overlap.overlapStart.toLocaleDateString()} - ${overlap.overlapEnd.toLocaleDateString()})`
            )
          })
        }
        
        // Only add connection item if there are matching criteria to display
        if (matchedCriteria.length > 0) {
          connectionItems.push({
            name: `Mutual Connection: ${conn.dplEmployee.name}`,
            matchedCriteria,
            context: {
              dplEmployeeId: conn.dplEmployee.id,
              dplEmployeeName: conn.dplEmployee.name,
              connectionType: conn.connectionType,
              educationOverlaps: conn.educationOverlaps,
              workOverlaps: conn.workOverlaps
            }
          })
        }
      })
      
      if (connectionItems.length > 0) {
        categories.push({
          type: 'collaboration',
          label: 'Mutual Connections with DPL',
          icon: '🤝',
          color: 'blue',
          count: connectionItems.length,
          items: connectionItems
        })
      }
    }
  }

  // Published Projects Match Context (mock fallback when backend matchedProjects unavailable)
  const useBackendPublishMatches =
    hasPublishRelatedFilter(filters) && (candidate.matchedProjects?.length ?? 0) > 0

  if (filters.hasPublishedProject === true && !useBackendPublishMatches) {
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
