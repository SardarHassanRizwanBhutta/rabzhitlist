"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  X,
  Users,
  Award,
  Building2,
  Globe,
  Table2,
  Grid3x3,
  Loader2,
  GraduationCap,
  Plus,
} from "lucide-react"
import { CandidatesTable } from "@/components/candidates-table"
import { CandidatesCardsView } from "@/components/candidates-cards-view"
import {
  CandidateCreationDialog,
  CandidateFormData,
  type CandidateLookups,
} from "@/components/candidate-creation-dialog"
import { ResumeParserDialog } from "@/components/resume-parser-dialog"
import {
  fetchTechStacks,
  fetchClientLocations,
  createTechStack,
  type LookupItem,
} from "@/lib/services/lookups-api"
import { fetchCountries } from "@/lib/services/countries-api"
import { fetchTimeSupportZones, createTimeSupportZone } from "@/lib/services/tags-timesupportzones-api"
import { fetchBenefits, createBenefit } from "@/lib/services/benefits-api"
import { fetchDegrees, createDegree, fetchMajors, createMajor } from "@/lib/services/majors-degrees-api"
import {
  fetchCandidatesPage,
  createCandidate,
  candidateFormDataToCreateDto,
  candidateListItemDtoToCandidate,
} from "@/lib/services/candidates-api"
import type { EmployerBenefit } from "@/lib/types/benefits"
import type { CertificationIssuer } from "@/lib/types/certification"
import { fetchCertificationIssuers } from "@/lib/services/certifications-api"
import { toast } from "sonner"
import { CandidatesFilterDialog, CandidateFilters } from "@/components/candidates-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import { hasActiveFilters } from "@/lib/utils/candidate-matches"
import type { Candidate } from "@/lib/types/candidate"
import {
  ACHIEVEMENT_TYPE_DB,
  CANDIDATE_SOURCE_DB,
  CERTIFICATION_LEVEL_DB,
} from "@/lib/constants/candidate-enums"
import {
  EMPLOYER_STATUS_DISPLAY_TO_DB,
  EMPLOYER_TYPE_DISPLAY_TO_DB,
  RANKING_DISPLAY_TO_DB,
  SALARY_POLICY_DISPLAY_TO_DB,
} from "@/lib/types/employer"
import {
  EMPLOYER_STATUS_TO_API,
  EMPLOYER_TYPE_TO_API,
  RANKING_TO_API,
  SALARY_POLICY_TO_API,
} from "@/lib/services/employers-api"
import {
  horizontalDomainLabelToInt,
  PROJECT_STATUS_UI_TO_NUM,
  PUBLISH_PLATFORM_UI_TO_NUM,
  technicalDomainLabelToInt,
  verticalDomainLabelToInt,
} from "@/lib/services/projects-api"

const DEFAULT_PAGE_SIZE = 20

const initialFilters: CandidateFilters = {
  postingTitle: "",
  city: "",
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
  verticalDomains: [],
  horizontalDomains: [],
  technicalDomains: [],
  technicalAspects: [],
  startDateStart: null,
  startDateEnd: null,
  candidateTechStacks: [],
  candidateTechStacksRequireAll: false,
  candidateTechStacksRequireInBoth: false,
  techStackMinYears: {
    techStacks: [],
    minYears: "",
  },
  shiftTypes: [],
  workModes: [],
  workModeMinYears: {
    workModes: [],
    minYears: "",
  },
  timeSupportZones: [],
  isCurrentlyWorking: null,
  workedWithTopDeveloper: null,
  workedWithTopDeveloperUseTolerance: true,
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
  employerCity: "",
  employerTypes: [],
  employerSalaryPolicies: [],
  employerSizeMin: "",
  employerSizeMax: "",
  employerRankings: [],
  degreeNames: [],
  majorNames: [],
  isTopper: null,
  isCheetah: null,
  educationEndDateStart: null,
  educationEndDateEnd: null,
  certificationNames: [],
  certificationIssuingBodies: [],
  certificationLevels: [],
  achievementTypes: [],
  achievementName: "",
  competitionPlatforms: [],
  personalityTypes: [],
  source: [],
  verificationPercentageMin: "",
  verificationPercentageMax: "",
  dataProgressMin: "",
  dataProgressMax: "",
}

export function CandidatesPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()

  /** Numeric certification id from URL for server-side list filtering (GET /api/candidates?certificationId=). */
  const certificationIdFromUrl = useMemo(() => {
    const raw = searchParams.get("certificationId")
    if (!raw || !/^\d+$/.test(raw.trim())) return null
    const n = Number.parseInt(raw.trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [searchParams])

  /** Numeric university id from URL (GET /api/candidates?universityId=). Can combine with certificationId (AND). */
  const universityIdFromUrl = useMemo(() => {
    const raw = searchParams.get("universityId")
    if (!raw || !/^\d+$/.test(raw.trim())) return null
    const n = Number.parseInt(raw.trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [searchParams])

  /** Numeric project id from URL (`projectId`) for server-side list filtering. */
  const projectIdFromUrl = useMemo(() => {
    const raw = searchParams.get("projectId")
    if (!raw || !/^\d+$/.test(raw.trim())) return null
    const n = Number.parseInt(raw.trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [searchParams])

  /** Numeric employer id from URL (`employerId`) for server-side list filtering. */
  const employerIdFromUrl = useMemo(() => {
    const raw = searchParams.get("employerId")
    if (!raw || !/^\d+$/.test(raw.trim())) return null
    const n = Number.parseInt(raw.trim(), 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [searchParams])

  const [filters, setFilters] = useState<CandidateFilters>(initialFilters)
  const [projectFilter, setProjectFilter] = useState<{ name: string; id: string } | null>(null)
  const [certificationFilter, setCertificationFilter] = useState<{ name: string; id: string } | null>(null)
  const [universityFilter, setUniversityFilter] = useState<{ name: string; id: string } | null>(null)
  const [employerFilter, setEmployerFilter] = useState<{ name: string; id: string } | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [techStacksLookup, setTechStacksLookup] = useState<CandidateLookups["techStacks"]>([])
  const [timeSupportZonesLookup, setTimeSupportZonesLookup] = useState<
    NonNullable<CandidateLookups["timeSupportZones"]>
  >([])
  const [benefitsLookup, setBenefitsLookup] = useState<NonNullable<CandidateLookups["benefits"]>>([])
  const [degreesLookup, setDegreesLookup] = useState<NonNullable<CandidateLookups["degrees"]>>([])
  const [majorsLookup, setMajorsLookup] = useState<NonNullable<CandidateLookups["majors"]>>([])
  const [clientLocationsLookup, setClientLocationsLookup] = useState<LookupItem[]>([])
  const [countriesLookup, setCountriesLookup] = useState<LookupItem[]>([])
  const [certificationIssuersLookup, setCertificationIssuersLookup] = useState<CertificationIssuer[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(true)

  const [createCandidateOpen, setCreateCandidateOpen] = useState(false)
  const [createCandidatePrefill, setCreateCandidatePrefill] = useState<Partial<CandidateFormData> | null>(null)

  const handleCreatePrefillConsumed = useCallback(() => {
    setCreateCandidatePrefill(null)
  }, [])

  const handleApplyResumeParse = useCallback((partial: Partial<CandidateFormData>) => {
    setCreateCandidatePrefill(partial)
    setCreateCandidateOpen(true)
  }, [])

  const refetchCandidates = useCallback(() => {
    setReloadToken((t) => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTechStacks(),
      fetchTimeSupportZones(),
      fetchBenefits(),
      fetchDegrees(),
      fetchMajors(),
      fetchClientLocations(),
      fetchCountries(),
      fetchCertificationIssuers(),
    ])
      .then(([techStacks, timeSupportZones, benefits, degrees, majors, clientLocs, countries, issuers]) => {
        if (!cancelled) {
          setTechStacksLookup(techStacks)
          setTimeSupportZonesLookup(timeSupportZones)
          setBenefitsLookup(benefits)
          setDegreesLookup(degrees)
          setMajorsLookup(majors)
          setClientLocationsLookup(clientLocs)
          setCountriesLookup(
            Array.isArray(countries) ? countries.map((c) => ({ id: c.id, name: c.name })) : [],
          )
          setCertificationIssuersLookup(Array.isArray(issuers) ? issuers : [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTechStacksLookup([])
          setTimeSupportZonesLookup([])
          setBenefitsLookup([])
          setDegreesLookup([])
          setMajorsLookup([])
          setClientLocationsLookup([])
          setCountriesLookup([])
          setCertificationIssuersLookup([])
          toast.error("Failed to load candidate form lookups.")
        }
      })
      .finally(() => {
        if (!cancelled) setLookupsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toDateOnly = (d: Date | null): string | undefined => {
    if (!d) return undefined
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const toOptionalNumber = (raw: string): number | undefined => {
    const t = raw.trim()
    if (!t) return undefined
    const n = Number(t)
    return Number.isFinite(n) ? n : undefined
  }

  const combinedFiltersForBackend = useMemo(() => {
    const withUrl = {
      ...filters,
      projects:
        projectIdFromUrl != null
          ? filters.projects.includes(String(projectIdFromUrl))
            ? filters.projects
            : [...filters.projects, String(projectIdFromUrl)]
          : filters.projects,
      employers:
        employerIdFromUrl != null
          ? filters.employers.includes(String(employerIdFromUrl))
            ? filters.employers
            : [...filters.employers, String(employerIdFromUrl)]
          : filters.employers,
      certificationNames:
        certificationIdFromUrl != null
          ? filters.certificationNames.includes(String(certificationIdFromUrl))
            ? filters.certificationNames
            : [...filters.certificationNames, String(certificationIdFromUrl)]
          : filters.certificationNames,
    }
    return withUrl
  }, [filters, projectIdFromUrl, employerIdFromUrl, certificationIdFromUrl])

  const backendListOptions = useMemo(() => {
    const projectTypeToApi: Record<string, number> = {
      Employer: 0,
      Academic: 1,
      Personal: 2,
      Freelance: 3,
      "Open Source": 4,
    }
    const achievementLabelToDb = new Map<string, string>(
      Object.entries({
        competition: "Competition",
        openSource: "Open Source",
        award: "Award",
        medal: "Medal",
        publication: "Publication",
        certification: "Certification",
        recognition: "Recognition",
        other: "Other",
      }).map(([db, label]) => [label, db]),
    )

    const employerIds = combinedFiltersForBackend.employers
      .map((e) => Number.parseInt(e, 10))
      .filter((n) => Number.isFinite(n) && n > 0)
    const projectIds = combinedFiltersForBackend.projects
      .map((p) => Number.parseInt(p, 10))
      .filter((n) => Number.isFinite(n) && n > 0)
    const certificationId =
      combinedFiltersForBackend.certificationNames
        .map((v) => Number.parseInt(v, 10))
        .find((n) => Number.isFinite(n) && n > 0) ?? undefined

    const issuingBodyIds = combinedFiltersForBackend.certificationIssuingBodies
      .map((name) => certificationIssuersLookup.find((i) => i.name === name)?.id)
      .filter((id): id is number => id != null)
    const degreeIds = combinedFiltersForBackend.degreeNames
      .map((name) => degreesLookup.find((d) => d.name === name)?.id)
      .filter((id): id is number => id != null)
    const majorIds = combinedFiltersForBackend.majorNames
      .map((name) => majorsLookup.find((m) => m.name === name)?.id)
      .filter((id): id is number => id != null)
    const employerCountryIds = combinedFiltersForBackend.employerCountries
      .map((name) => countriesLookup.find((c) => c.name === name)?.id)
      .filter((id): id is number => id != null)
    const clientLocationIds = combinedFiltersForBackend.clientLocations
      .map((name) => clientLocationsLookup.find((l) => l.name === name)?.id)
      .filter((id): id is number => id != null)

    const sourceRaw = combinedFiltersForBackend.source[0]
    const source =
      sourceRaw && CANDIDATE_SOURCE_DB.includes(sourceRaw as (typeof CANDIDATE_SOURCE_DB)[number])
        ? CANDIDATE_SOURCE_DB.indexOf(sourceRaw as (typeof CANDIDATE_SOURCE_DB)[number])
        : undefined

    const certificationLevels = combinedFiltersForBackend.certificationLevels
      .map((l) => CERTIFICATION_LEVEL_DB.indexOf(l as (typeof CERTIFICATION_LEVEL_DB)[number]))
      .filter((n) => n >= 0)
    const employerStatuses = combinedFiltersForBackend.employerStatus
      .map((s) => EMPLOYER_STATUS_DISPLAY_TO_DB[s as keyof typeof EMPLOYER_STATUS_DISPLAY_TO_DB])
      .map((db) => (db != null ? EMPLOYER_STATUS_TO_API[db] : undefined))
      .filter((n): n is number => n != null)
    const employerTypes = combinedFiltersForBackend.employerTypes
      .map((t) => EMPLOYER_TYPE_DISPLAY_TO_DB[t as keyof typeof EMPLOYER_TYPE_DISPLAY_TO_DB])
      .map((db) => (db != null ? EMPLOYER_TYPE_TO_API[db] : undefined))
      .filter((n): n is number => n != null)
    const employerSalaryPolicies = combinedFiltersForBackend.employerSalaryPolicies
      .map((p) => SALARY_POLICY_DISPLAY_TO_DB[p as keyof typeof SALARY_POLICY_DISPLAY_TO_DB])
      .map((db) => (db != null ? SALARY_POLICY_TO_API[db] : undefined))
      .filter((n): n is number => n != null)
    const employerRankings = combinedFiltersForBackend.employerRankings
      .map((r) => RANKING_DISPLAY_TO_DB[r as keyof typeof RANKING_DISPLAY_TO_DB])
      .map((db) => (db != null ? RANKING_TO_API[db] : undefined))
      .filter((n): n is number => n != null)
    const projectStatus = combinedFiltersForBackend.projectStatus
      .map((s) => PROJECT_STATUS_UI_TO_NUM[s as keyof typeof PROJECT_STATUS_UI_TO_NUM])
      .filter((n): n is number => n != null)
    const projectTypes = combinedFiltersForBackend.projectTypes
      .map((t) => projectTypeToApi[t])
      .filter((n): n is number => n != null)
    const publishPlatforms = combinedFiltersForBackend.publishPlatforms
      .map((p) => PUBLISH_PLATFORM_UI_TO_NUM[p as keyof typeof PUBLISH_PLATFORM_UI_TO_NUM])
      .filter((n): n is number => n != null)
    const verticalDomains = combinedFiltersForBackend.verticalDomains
      .map((v) => verticalDomainLabelToInt(v))
      .filter((n): n is number => n != null)
    const horizontalDomains = combinedFiltersForBackend.horizontalDomains
      .map((h) => horizontalDomainLabelToInt(h))
      .filter((n): n is number => n != null)
    const technicalDomains = combinedFiltersForBackend.technicalDomains
      .map((t) => technicalDomainLabelToInt(t))
      .filter((n): n is number => n != null)
    const achievementTypes = combinedFiltersForBackend.achievementTypes
      .map((label) => achievementLabelToDb.get(label))
      .filter((db): db is string => !!db)
      .map((db) => ACHIEVEMENT_TYPE_DB.indexOf(db as (typeof ACHIEVEMENT_TYPE_DB)[number]))
      .filter((n) => n >= 0)

    return {
      postingTitle: combinedFiltersForBackend.postingTitle.trim() || undefined,
      city: combinedFiltersForBackend.city.trim() || undefined,
      personalityTypes:
        combinedFiltersForBackend.personalityTypes.length > 0
          ? combinedFiltersForBackend.personalityTypes
          : undefined,
      source,
      isTopDeveloper: combinedFiltersForBackend.isTopDeveloper ?? undefined,
      currentSalaryMin: toOptionalNumber(combinedFiltersForBackend.currentSalaryMin),
      currentSalaryMax: toOptionalNumber(combinedFiltersForBackend.currentSalaryMax),
      expectedSalaryMin: toOptionalNumber(combinedFiltersForBackend.expectedSalaryMin),
      expectedSalaryMax: toOptionalNumber(combinedFiltersForBackend.expectedSalaryMax),
      certificationId,
      issuingBodyIds: issuingBodyIds.length > 0 ? issuingBodyIds : undefined,
      certificationLevels: certificationLevels.length > 0 ? certificationLevels : undefined,
      universityId: universityIdFromUrl ?? undefined,
      degreeIds: degreeIds.length > 0 ? degreeIds : undefined,
      majorIds: majorIds.length > 0 ? majorIds : undefined,
      isTopper: combinedFiltersForBackend.isTopper ?? undefined,
      isMainCheetah: combinedFiltersForBackend.isCheetah ?? undefined,
      graduateDateStart: toDateOnly(combinedFiltersForBackend.educationEndDateStart),
      graduateDateEnd: toDateOnly(combinedFiltersForBackend.educationEndDateEnd),
      employerIds: employerIds.length > 0 ? employerIds : undefined,
      employerSalaryPolicies:
        employerSalaryPolicies.length > 0 ? employerSalaryPolicies : undefined,
      employerTypes: employerTypes.length > 0 ? employerTypes : undefined,
      employerCountries: employerCountryIds.length > 0 ? employerCountryIds : undefined,
      employerCity: combinedFiltersForBackend.employerCity.trim() || undefined,
      employerStatuses: employerStatuses.length > 0 ? employerStatuses : undefined,
      employerRankings: employerRankings.length > 0 ? employerRankings : undefined,
      employerSizeMin: toOptionalNumber(combinedFiltersForBackend.employerSizeMin),
      employerSizeMax: toOptionalNumber(combinedFiltersForBackend.employerSizeMax),
      projectIds: projectIds.length > 0 ? projectIds : undefined,
      verticalDomains: verticalDomains.length > 0 ? verticalDomains : undefined,
      horizontalDomains: horizontalDomains.length > 0 ? horizontalDomains : undefined,
      technicalDomains: technicalDomains.length > 0 ? technicalDomains : undefined,
      clientLocations: clientLocationIds.length > 0 ? clientLocationIds : undefined,
      projectStatus: projectStatus.length > 0 ? projectStatus : undefined,
      projectTypes: projectTypes.length > 0 ? projectTypes : undefined,
      publishPlatforms: publishPlatforms.length > 0 ? publishPlatforms : undefined,
      isPublished: combinedFiltersForBackend.hasPublishedProject ?? undefined,
      minDownloadCount: toOptionalNumber(combinedFiltersForBackend.minProjectDownloadCount),
      minTeamSize: toOptionalNumber(combinedFiltersForBackend.projectTeamSizeMin),
      maxTeamSize: toOptionalNumber(combinedFiltersForBackend.projectTeamSizeMax),
      projectStartFrom: toDateOnly(combinedFiltersForBackend.startDateStart),
      projectStartTo: toDateOnly(combinedFiltersForBackend.startDateEnd),
      achievementTypes: achievementTypes.length > 0 ? achievementTypes : undefined,
      achievementName: combinedFiltersForBackend.achievementName.trim() || undefined,
    }
  }, [
    combinedFiltersForBackend,
    universityIdFromUrl,
    certificationIssuersLookup,
    degreesLookup,
    majorsLookup,
    countriesLookup,
    clientLocationsLookup,
  ])

  useEffect(() => {
    const ac = new AbortController()
    let ignore = false

    ;(async () => {
      setListLoading(true)
      setListError(null)
      try {
        const res = await fetchCandidatesPage(pageNumber, pageSize, ac.signal, backendListOptions)
        if (ignore) return
        setCandidates(res.items.map((row) => candidateListItemDtoToCandidate(row)))
        setTotalCount(res.totalCount)
        setTotalPages(res.totalPages)
        setHasNext(res.hasNext)
        setHasPrevious(res.hasPrevious)
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return
        if (!ignore) {
          setCandidates([])
          setListError(e instanceof Error ? e.message : "Failed to load candidates.")
          toast.error(e instanceof Error ? e.message : "Failed to load candidates.")
        }
      } finally {
        if (!ignore) setListLoading(false)
      }
    })()

    return () => {
      ignore = true
      ac.abort()
    }
  }, [pageNumber, pageSize, reloadToken, backendListOptions])

  const handleCreateTechStack = useCallback(async (name: string) => {
    try {
      const created = await createTechStack(name)
      setTechStacksLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add technology")
      throw e
    }
  }, [])

  const handleCreateTimeSupportZone = useCallback(async (name: string) => {
    try {
      const created = await createTimeSupportZone(name)
      setTimeSupportZonesLookup((prev) => [
        ...prev.filter((l) => l.id !== created.id && l.name !== created.name),
        created,
      ])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add time zone")
      throw e
    }
  }, [])

  const handleCreateBenefit = useCallback(async (name: string): Promise<EmployerBenefit | null> => {
    try {
      const created = await createBenefit(name)
      setBenefitsLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
      return {
        id: String(created.id),
        name: created.name,
        hasValue: false,
        amount: null,
        unit: null,
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add benefit")
      return null
    }
  }, [])

  const handleCreateDegree = useCallback(async (name: string) => {
    try {
      const created = await createDegree(name)
      setDegreesLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add degree")
      throw e
    }
  }, [])

  const handleCreateMajor = useCallback(async (name: string) => {
    try {
      const created = await createMajor(name)
      setMajorsLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add major")
      throw e
    }
  }, [])

  const candidateLookups: CandidateLookups = useMemo(
    () => ({
      techStacks: techStacksLookup,
      timeSupportZones: timeSupportZonesLookup,
      benefits: benefitsLookup,
      degrees: degreesLookup,
      majors: majorsLookup,
    }),
    [techStacksLookup, timeSupportZonesLookup, benefitsLookup, degreesLookup, majorsLookup]
  )

  useEffect(() => {
    const projectFilterName = searchParams.get("projectFilter")
    const projectId = searchParams.get("projectId")
    const certificationNameParam =
      searchParams.get("certificationName") ?? searchParams.get("certificationFilter")
    const certificationId = searchParams.get("certificationId")
    const universityNameParam =
      searchParams.get("universityName") ?? searchParams.get("universityFilter")
    const universityId = searchParams.get("universityId")
    const employerFilterName = searchParams.get("employerFilter")
    const employerId = searchParams.get("employerId")

    if (projectFilterName && projectId) {
      setProjectFilter({ name: projectFilterName, id: projectId })
      setCertificationFilter(null)
      setUniversityFilter(null)
      setEmployerFilter(null)
    } else if (employerFilterName && employerId) {
      setEmployerFilter({ name: employerFilterName, id: employerId })
      setProjectFilter(null)
      setCertificationFilter(null)
      setUniversityFilter(null)
    } else {
      setProjectFilter(null)
      setEmployerFilter(null)

      if (certificationId && /^\d+$/.test(certificationId.trim())) {
        setCertificationFilter({
          id: certificationId.trim(),
          name: certificationNameParam?.trim() || "Certification",
        })
      } else {
        setCertificationFilter(null)
      }

      if (universityId && /^\d+$/.test(universityId.trim())) {
        setUniversityFilter({
          id: universityId.trim(),
          name: universityNameParam?.trim() || "University",
        })
      } else {
        setUniversityFilter(null)
      }
    }
  }, [searchParams])

  const listFilterKey = `${projectIdFromUrl ?? ""}|${employerIdFromUrl ?? ""}|${certificationIdFromUrl ?? ""}|${universityIdFromUrl ?? ""}`
  const prevListFilterKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevListFilterKeyRef.current === listFilterKey) return
    prevListFilterKeyRef.current = listFilterKey
    setPageNumber(1)
  }, [listFilterKey])

  const getCombinedFilters = useCallback((): CandidateFilters => {
    return {
      ...filters,
      projects: projectFilter
        ? (() => {
            const idStr = projectFilter.id.trim()
            const entry = /^\d+$/.test(idStr) ? idStr : projectFilter.name
            const has = filters.projects.some(
              (e) => e === entry || e.toLowerCase() === projectFilter.name.toLowerCase()
            )
            return has ? filters.projects : [...filters.projects, entry]
          })()
        : filters.projects,
      certificationNames: certificationFilter
        ? (() => {
            const idStr = certificationFilter.id.trim()
            const entry = /^\d+$/.test(idStr) ? idStr : certificationFilter.name
            const has = filters.certificationNames.some(
              (e) => e === entry || e.toLowerCase() === certificationFilter.name.toLowerCase()
            )
            return has ? filters.certificationNames : [...filters.certificationNames, entry]
          })()
        : filters.certificationNames,
      employers: employerFilter
        ? (() => {
            const idStr = employerFilter.id.trim()
            const entry = /^\d+$/.test(idStr) ? idStr : employerFilter.name
            const has = filters.employers.some(
              (e) => e === entry || e.toLowerCase() === employerFilter.name.toLowerCase()
            )
            return has ? filters.employers : [...filters.employers, entry]
          })()
        : filters.employers,
    }
  }, [filters, projectFilter, certificationFilter, employerFilter])

  const handleCandidateSubmit = async (data: CandidateFormData) => {
    try {
      await createCandidate(candidateFormDataToCreateDto(data, candidateLookups))
      toast.success("Candidate created successfully.")
      setPageNumber(1)
      refetchCandidates()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create candidate.")
      throw e
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPageNumber(1)
  }

  const handleFiltersChange = (newFilters: CandidateFilters) => {
    setFilters(newFilters)
    setPageNumber(1)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setPageNumber(1)
    setViewMode("table")
  }

  const handleClearProjectFilter = () => {
    setProjectFilter(null)
    router.push("/candidates")
  }

  const handleClearCertificationFilter = () => {
    setCertificationFilter(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("certificationId")
    params.delete("certificationName")
    params.delete("certificationFilter")
    const q = params.toString()
    router.push(q ? `/candidates?${q}` : "/candidates")
  }

  const handleClearUniversityFilter = () => {
    setUniversityFilter(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("universityId")
    params.delete("universityName")
    params.delete("universityFilter")
    const q = params.toString()
    router.push(q ? `/candidates?${q}` : "/candidates")
  }

  const handleClearEmployerFilter = () => {
    setEmployerFilter(null)
    router.push("/candidates")
  }

  const getPageTitle = () => {
    if (projectFilter) return `Project Team: ${projectFilter.name}`
    if (certificationFilter && universityFilter) {
      return `${certificationFilter.name} · ${universityFilter.name}`
    }
    if (certificationFilter) return `Certified Professionals: ${certificationFilter.name}`
    if (universityFilter) return `University graduates: ${universityFilter.name}`
    if (employerFilter) return `Company Alumni: ${employerFilter.name}`
    return "All Candidates"
  }

  const getPageDescription = () => {
    if (projectFilter) return `Candidates who have worked on ${projectFilter.name}`
    if (certificationFilter && universityFilter) {
      return `Candidates with certification “${certificationFilter.name}” and education at ${universityFilter.name}`
    }
    if (certificationFilter) return `Professionals certified in ${certificationFilter.name}`
    if (universityFilter) return `Candidates with education at ${universityFilter.name}`
    if (employerFilter) return `Candidates who have worked at ${employerFilter.name}`
    return ""
  }

  useEffect(() => {
    const filtersActive =
      hasActiveFilters(filters) ||
      projectFilter !== null ||
      certificationFilter !== null ||
      universityFilter !== null ||
      employerFilter !== null ||
      hasGlobalFilters

    if (filtersActive && candidates.length > 0 && !listLoading) {
      setViewMode("cards")
    }
  }, [
    filters,
    projectFilter,
    certificationFilter,
    universityFilter,
    employerFilter,
    hasGlobalFilters,
    candidates.length,
    listLoading,
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h2>
          <p className="text-muted-foreground">{getPageDescription()}</p>
        </div>
        <div className="flex items-center gap-2">
          {(hasActiveFilters(filters) ||
            projectFilter ||
            certificationFilter ||
            universityFilter ||
            employerFilter ||
            hasGlobalFilters) && (
            <div className="flex items-center border rounded-lg p-1 bg-background">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3 cursor-pointer"
              >
                <Table2 className="h-4 w-4 mr-1.5" />
                Table
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
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
            timeSupportZones={timeSupportZonesLookup}
            clientLocations={clientLocationsLookup}
            countries={countriesLookup}
            certificationIssuers={certificationIssuersLookup}
            degrees={degreesLookup}
            majors={majorsLookup}
          />
          <ResumeParserDialog onApplyToCreateCandidate={handleApplyResumeParse} />
          <Button
            type="button"
            onClick={() => {
              setCreateCandidatePrefill(null)
              setCreateCandidateOpen(true)
            }}
            className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Candidate
          </Button>
          <CandidateCreationDialog
            open={createCandidateOpen}
            onOpenChange={(o) => {
              setCreateCandidateOpen(o)
              if (!o) setCreateCandidatePrefill(null)
            }}
            createPrefill={createCandidatePrefill}
            onCreatePrefillConsumed={handleCreatePrefillConsumed}
            onSubmit={handleCandidateSubmit}
            lookups={candidateLookups}
            onCreateTechStack={handleCreateTechStack}
            onCreateTimeSupportZone={handleCreateTimeSupportZone}
            onCreateBenefit={handleCreateBenefit}
            onCreateDegree={handleCreateDegree}
            onCreateMajor={handleCreateMajor}
            techStacksLoading={lookupsLoading}
            timeSupportZonesLoading={lookupsLoading}
            benefitsLoading={lookupsLoading}
            degreesMajorsLoading={lookupsLoading}
          />
        </div>
      </div>

      {(projectFilter || certificationFilter || universityFilter || employerFilter) && (
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

      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}

      {listLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading candidates…</span>
        </div>
      )}

      {!listLoading && listError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          {listError}
          <div className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => refetchCandidates()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!listLoading && !listError && (
        <>
          {viewMode === "cards" ? (
            <CandidatesCardsView
              candidates={candidates}
              filters={getCombinedFilters()}
              candidateLookups={candidateLookups}
              lookupsLoading={lookupsLoading}
              onCreateTechStack={handleCreateTechStack}
              onCreateTimeSupportZone={handleCreateTimeSupportZone}
              onCreateBenefit={handleCreateBenefit}
              onCreateDegree={handleCreateDegree}
              onCreateMajor={handleCreateMajor}
              onCandidatesListChanged={refetchCandidates}
            />
          ) : (
            <CandidatesTable
              candidates={candidates}
              filters={getCombinedFilters()}
              candidateLookups={candidateLookups}
              lookupsLoading={lookupsLoading}
              totalCount={totalCount}
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={totalPages}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPageChange={setPageNumber}
              onPageSizeChange={handlePageSizeChange}
              onCreateTechStack={handleCreateTechStack}
              onCreateTimeSupportZone={handleCreateTimeSupportZone}
              onCreateBenefit={handleCreateBenefit}
              onCreateDegree={handleCreateDegree}
              onCreateMajor={handleCreateMajor}
              onCandidatesListChanged={refetchCandidates}
            />
          )}

        </>
      )}

    </div>
  )
}
