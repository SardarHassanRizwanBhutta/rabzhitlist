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
} from "lucide-react"
import { CandidatesTable } from "@/components/candidates-table"
import { CandidatesCardsView } from "@/components/candidates-cards-view"
import { CandidateCreationDialog, CandidateFormData, type CandidateLookups } from "@/components/candidate-creation-dialog"
import { fetchTechStacks, createTechStack } from "@/lib/services/lookups-api"
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
import { toast } from "sonner"
import { CandidatesFilterDialog, CandidateFilters } from "@/components/candidates-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import { hasActiveFilters } from "@/lib/utils/candidate-matches"
import type { Candidate } from "@/lib/types/candidate"

const DEFAULT_PAGE_SIZE = 20

const initialFilters: CandidateFilters = {
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
  candidateTechStacks: [],
  candidateTechStacksRequireAll: false,
  candidateTechStacksRequireInBoth: false,
  techStackMinYears: {
    techStacks: [],
    minYears: "",
  },
  candidateDomains: [],
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
  employerCities: [],
  employerTypes: [],
  careerTransitionFromType: [],
  careerTransitionToType: [],
  careerTransitionRequireCurrent: false,
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
  achievementPlatforms: [],
  internationalBugBountyOnly: false,
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
  const [lookupsLoading, setLookupsLoading] = useState(true)

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
    ])
      .then(([techStacks, timeSupportZones, benefits, degrees, majors]) => {
        if (!cancelled) {
          setTechStacksLookup(techStacks)
          setTimeSupportZonesLookup(timeSupportZones)
          setBenefitsLookup(benefits)
          setDegreesLookup(degrees)
          setMajorsLookup(majors)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTechStacksLookup([])
          setTimeSupportZonesLookup([])
          setBenefitsLookup([])
          setDegreesLookup([])
          setMajorsLookup([])
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

  useEffect(() => {
    const ac = new AbortController()
    let ignore = false

    ;(async () => {
      setListLoading(true)
      setListError(null)
      try {
        const listOpts =
          certificationIdFromUrl != null || universityIdFromUrl != null
            ? {
                ...(certificationIdFromUrl != null && {
                  certificationId: certificationIdFromUrl,
                }),
                ...(universityIdFromUrl != null && { universityId: universityIdFromUrl }),
              }
            : undefined
        const res = await fetchCandidatesPage(pageNumber, pageSize, ac.signal, listOpts)
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
  }, [pageNumber, pageSize, reloadToken, certificationIdFromUrl, universityIdFromUrl])

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

  const listFilterKey = `${certificationIdFromUrl ?? ""}|${universityIdFromUrl ?? ""}`
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
        ? filters.projects.includes(projectFilter.name)
          ? filters.projects
          : [...filters.projects, projectFilter.name]
        : filters.projects,
      certificationNames: certificationFilter
        ? filters.certificationNames.includes(certificationFilter.name)
          ? filters.certificationNames
          : [...filters.certificationNames, certificationFilter.name]
        : filters.certificationNames,
      employers: employerFilter
        ? filters.employers.some((e) => e.toLowerCase() === employerFilter.name.toLowerCase())
          ? filters.employers
          : [...filters.employers, employerFilter.name]
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
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
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
          />
          <CandidateCreationDialog
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
