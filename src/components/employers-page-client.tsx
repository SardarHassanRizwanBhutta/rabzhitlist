"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Globe } from "lucide-react"
import { toast } from "sonner"
import { EmployersTable } from "@/components/employers-table"
import { EmployerCreationDialog, EmployerFormData, EmployerVerificationState } from "@/components/employer-creation-dialog"
import { EmployersFilterDialog, EmployerFilters } from "@/components/employers-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Employer, EmployerRanking, ShiftTypeDb, WorkModeDb } from "@/lib/types/employer"
import {
  EMPLOYER_STATUS_DISPLAY_TO_DB,
  EMPLOYER_TYPE_DISPLAY_TO_DB,
  RANKING_DISPLAY_TO_DB,
  SALARY_POLICY_DISPLAY_TO_DB,
} from "@/lib/types/employer"
import type { Country } from "@/lib/types/country"
import { fetchClientLocations, type LookupItem } from "@/lib/services/lookups-api"
import type { PublishPlatform, ProjectStatus } from "@/lib/types/project"
import { fetchCountries, createCountry } from "@/lib/services/countries-api"
import {
  fetchTags,
  createTag,
  fetchTimeSupportZones,
  createTimeSupportZone,
} from "@/lib/services/tags-timesupportzones-api"
import { fetchBenefits, createBenefit } from "@/lib/services/benefits-api"
import type { EmployerBenefit } from "@/lib/types/benefits"
import {
  fetchEmployers,
  type FetchEmployersParams,
  fetchEmployerById,
  createEmployer,
  updateEmployer,
  deleteEmployer,
  addEmployerLayoff,
  buildCreateEmployerDto,
  buildUpdateEmployerDto,
  buildAddEmployerLayoffDto,
  isNewLayoffFormRow,
  syncEmployerLocationsFromEditForm,
  employerDtoToEmployer,
  employerListItemToEmployer,
  RANKING_TO_API,
  EMPLOYER_STATUS_TO_API,
  EMPLOYER_TYPE_TO_API,
  SALARY_POLICY_TO_API,
  SHIFT_TYPE_TO_API,
  WORK_MODE_TO_API,
} from "@/lib/services/employers-api"
import {
  ensureTechnicalDomainsCatalogLoaded,
  technicalDomainCatalogToSelectOptions,
  technicalDomainLabelToInt,
  verticalDomainLabelToInt,
  horizontalDomainLabelToInt,
  PROJECT_STATUS_UI_TO_NUM,
  PUBLISH_PLATFORM_UI_TO_NUM,
} from "@/lib/services/projects-api"
import type { MultiSelectOption } from "@/components/ui/multi-select"

const DEFAULT_PAGE_SIZE = 20

function employerRankingsToApiInts(rankings: EmployerRanking[]): number[] {
  return rankings.map((r) => RANKING_TO_API[RANKING_DISPLAY_TO_DB[r]])
}

function labelsToTechnicalDomainInts(labels: string[]): number[] {
  return labels.map((l) => technicalDomainLabelToInt(l)).filter((v): v is number => v != null)
}

function countryNamesToIds(names: string[], list: Country[]): number[] {
  const ids: number[] = []
  for (const name of names) {
    const c = list.find((x) => x.name === name)
    if (c != null) ids.push(c.id)
  }
  return ids
}

function lookupNamesToIds(names: string[], lookup: LookupItem[]): number[] {
  const ids: number[] = []
  for (const name of names) {
    const item = lookup.find((x) => x.name === name)
    if (item != null) ids.push(item.id)
  }
  return ids
}

function parseOptionalNonNegativeInt(s: string): number | undefined {
  const t = s.trim()
  if (!t) return undefined
  const n = parseInt(t, 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function parseOptionalNonNegativeLong(s: string): number | undefined {
  const t = s.trim()
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
}

function parseOptionalDouble(s: string): number | undefined {
  const t = s.trim()
  if (!t) return undefined
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : undefined
}

function foundedYearStringToInts(s: string): number[] | undefined {
  const t = s.trim()
  if (!t) return undefined
  const n = parseInt(t, 10)
  if (!Number.isFinite(n) || n < 1000 || n > 9999) return undefined
  return [n]
}

function formatDateOnlyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

interface EmployersPageClientProps {
  /** Optional initial employers (e.g. from server). If not provided, list is fetched client-side. */
  employers?: Employer[]
}

const initialFilters: EmployerFilters = {
  employerName: "",
  status: [],
  foundedYear: "",
  countries: [],
  city: "",
  employerTypes: [],
  salaryPolicies: [],
  sizeMin: "",
  sizeMax: "",
  minLocationsCount: "",
  minCitiesCount: "",
  minApplicants: "",
  benefits: [],
  shiftTypes: [],
  workModes: [],
  timeSupportZones: [],
  rankings: [],
  tags: [],
  isDPLCompetitive: null,
  employeeCity: "",
  verticalDomains: [],
  horizontalDomains: [],
  technicalDomains: [],
  clientLocations: [],
  projectStatus: [],
  projectTeamSizeMin: "",
  projectTeamSizeMax: "",
  hasPublishedProject: null,
  publishPlatforms: [],
  minDownloadCount: "",
  layoffDateStart: null,
  layoffDateEnd: null,
  minLayoffEmployees: "",
  avgJobTenureMin: "",
  avgJobTenureMax: "",
}

export function EmployersPageClient({ employers: initialEmployers = [] }: EmployersPageClientProps) {
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<EmployerFilters>(initialFilters)
  const [employers, setEmployers] = useState<Employer[]>(initialEmployers)
  const [loading, setLoading] = useState(initialEmployers.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [employerToEdit, setEmployerToEdit] = useState<Employer | null>(null)
  const [tagsLookup, setTagsLookup] = useState<LookupItem[]>([])
  const [timeSupportZonesLookup, setTimeSupportZonesLookup] = useState<LookupItem[]>([])
  const [benefitsLookup, setBenefitsLookup] = useState<LookupItem[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [technicalDomainSelectOptions, setTechnicalDomainSelectOptions] = useState<MultiSelectOption[]>([])
  const [clientLocationsLookup, setClientLocationsLookup] = useState<LookupItem[]>([])

  const employerListParams = useMemo((): FetchEmployersParams => {
    const foundedYears = foundedYearStringToInts(filters.foundedYear)
    const countryIds = countryNamesToIds(filters.countries, countries)
    const timeZoneIds = lookupNamesToIds(filters.timeSupportZones, timeSupportZonesLookup)
    const clientLocIds = lookupNamesToIds(filters.clientLocations, clientLocationsLookup)
    const technicalInts = labelsToTechnicalDomainInts(filters.technicalDomains)
    const verticalInts = filters.verticalDomains
      .map((l) => verticalDomainLabelToInt(l))
      .filter((v): v is number => v != null)
    const horizontalInts = filters.horizontalDomains
      .map((l) => horizontalDomainLabelToInt(l))
      .filter((v): v is number => v != null)

    const tags = filters.tags.map((t) => t.trim()).filter(Boolean)
    const benefits = filters.benefits.map((t) => t.trim()).filter(Boolean)

    const statusInts = filters.status.map((s) => EMPLOYER_STATUS_TO_API[EMPLOYER_STATUS_DISPLAY_TO_DB[s]])
    const employerTypeInts = filters.employerTypes.map(
      (t) => EMPLOYER_TYPE_TO_API[EMPLOYER_TYPE_DISPLAY_TO_DB[t]]
    )
    const salaryInts = filters.salaryPolicies.map(
      (p) => SALARY_POLICY_TO_API[SALARY_POLICY_DISPLAY_TO_DB[p]]
    )
    const rankingInts = filters.rankings.length ? employerRankingsToApiInts(filters.rankings) : []

    const shiftInts = filters.shiftTypes
      .map((k) => SHIFT_TYPE_TO_API[k as ShiftTypeDb])
      .filter((v): v is number => typeof v === "number")
    const workModeInts = filters.workModes
      .map((k) => WORK_MODE_TO_API[k as WorkModeDb])
      .filter((v): v is number => typeof v === "number")

    const projectStatusInts = filters.projectStatus
      .map((s) => PROJECT_STATUS_UI_TO_NUM[s as ProjectStatus])
      .filter((v): v is number => typeof v === "number")

    const publishInts = filters.publishPlatforms
      .map((p) => PUBLISH_PLATFORM_UI_TO_NUM[p as PublishPlatform])
      .filter((v): v is number => typeof v === "number")

    const sizeMin = parseOptionalNonNegativeInt(filters.sizeMin)
    const sizeMax = parseOptionalNonNegativeInt(filters.sizeMax)
    const minLocationsCount = parseOptionalNonNegativeInt(filters.minLocationsCount)
    const minCitiesCount = parseOptionalNonNegativeInt(filters.minCitiesCount)
    const projectTeamSizeMin = parseOptionalNonNegativeInt(filters.projectTeamSizeMin)
    const projectTeamSizeMax = parseOptionalNonNegativeInt(filters.projectTeamSizeMax)
    const minDownloadCount = parseOptionalNonNegativeLong(filters.minDownloadCount)
    const minLayoffEmployees = parseOptionalNonNegativeInt(filters.minLayoffEmployees)
    const avgJobTenureMin = parseOptionalDouble(filters.avgJobTenureMin)
    const avgJobTenureMax = parseOptionalDouble(filters.avgJobTenureMax)

    return {
      pageNumber,
      pageSize,
      ...(filters.employerName.trim() ? { name: filters.employerName.trim() } : {}),
      ...(statusInts.length ? { status: statusInts } : {}),
      ...(foundedYears?.length ? { foundedYears } : {}),
      ...(countryIds.length ? { countries: countryIds } : {}),
      ...(filters.city.trim() ? { city: filters.city.trim() } : {}),
      ...(employerTypeInts.length ? { employerTypes: employerTypeInts } : {}),
      ...(salaryInts.length ? { salaryPolicies: salaryInts } : {}),
      ...(rankingInts.length ? { rankings: rankingInts } : {}),
      ...(tags.length ? { tags } : {}),
      ...(filters.isDPLCompetitive !== null ? { isDPLCompetitive: filters.isDPLCompetitive } : {}),
      ...(sizeMin != null ? { sizeMin } : {}),
      ...(sizeMax != null ? { sizeMax } : {}),
      ...(minLocationsCount != null ? { minLocationsCount } : {}),
      ...(minCitiesCount != null ? { minCitiesCount } : {}),
      ...(filters.employeeCity.trim() ? { employeeCity: filters.employeeCity.trim() } : {}),
      ...(benefits.length ? { benefits } : {}),
      ...(shiftInts.length ? { shiftTypes: shiftInts } : {}),
      ...(workModeInts.length ? { workModes: workModeInts } : {}),
      ...(timeZoneIds.length ? { timeSupportZones: timeZoneIds } : {}),
      ...(avgJobTenureMin != null ? { avgJobTenureMin } : {}),
      ...(avgJobTenureMax != null ? { avgJobTenureMax } : {}),
      ...(verticalInts.length ? { verticalDomains: verticalInts } : {}),
      ...(horizontalInts.length ? { horizontalDomains: horizontalInts } : {}),
      ...(technicalInts.length ? { technicalDomains: technicalInts } : {}),
      ...(clientLocIds.length ? { clientLocations: clientLocIds } : {}),
      ...(projectStatusInts.length ? { projectStatus: projectStatusInts } : {}),
      ...(projectTeamSizeMin != null ? { projectTeamSizeMin } : {}),
      ...(projectTeamSizeMax != null ? { projectTeamSizeMax } : {}),
      ...(filters.hasPublishedProject !== null
        ? { hasPublishedProject: filters.hasPublishedProject }
        : {}),
      ...(publishInts.length ? { publishPlatforms: publishInts } : {}),
      ...(minDownloadCount != null ? { minDownloadCount } : {}),
      ...(filters.layoffDateStart
        ? { layoffDateStart: formatDateOnlyLocal(filters.layoffDateStart) }
        : {}),
      ...(filters.layoffDateEnd ? { layoffDateEnd: formatDateOnlyLocal(filters.layoffDateEnd) } : {}),
      ...(minLayoffEmployees != null ? { minLayoffEmployees } : {}),
    }
  }, [pageNumber, pageSize, filters, countries, timeSupportZonesLookup, clientLocationsLookup])

  const timeSupportZoneFilterOptions = useMemo(
    () => timeSupportZonesLookup.map((z) => ({ value: z.name, label: z.name })),
    [timeSupportZonesLookup]
  )

  const tagFilterOptions = useMemo(
    () => tagsLookup.map((t) => ({ value: t.name, label: t.name })),
    [tagsLookup]
  )

  const clientLocationFilterOptions = useMemo(
    () => clientLocationsLookup.map((l) => ({ value: l.name, label: l.name })),
    [clientLocationsLookup]
  )

  const countryFilterOptions = useMemo(
    () => countries.map((c) => ({ value: c.name, label: c.name })),
    [countries]
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTags(),
      fetchTimeSupportZones(),
      fetchBenefits(),
      ensureTechnicalDomainsCatalogLoaded(),
      fetchClientLocations(),
    ])
      .then(([tags, timeSupportZones, benefits, tdCatalog, clientLocations]) => {
        if (!cancelled) {
          setTagsLookup(tags)
          setTimeSupportZonesLookup(timeSupportZones)
          setBenefitsLookup(benefits)
          setTechnicalDomainSelectOptions(technicalDomainCatalogToSelectOptions(tdCatalog))
          setClientLocationsLookup(clientLocations)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTagsLookup([])
          setTimeSupportZonesLookup([])
          setBenefitsLookup([])
          setTechnicalDomainSelectOptions([])
          setClientLocationsLookup([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchCountries()
      .then((data) => {
        if (!cancelled) setCountries(data)
      })
      .catch(() => {
        if (!cancelled) {
          setCountries([])
          toast.error("Failed to load countries.")
        }
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreateTag = useCallback(async (name: string) => {
    try {
      const created = await createTag(name)
      setTagsLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add tag")
    }
  }, [])

  const handleCreateTimeSupportZone = useCallback(async (name: string) => {
    try {
      const created = await createTimeSupportZone(name)
      setTimeSupportZonesLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add time zone")
    }
  }, [])

  const handleCreateCountry = useCallback(async (name: string): Promise<Country | null> => {
    try {
      const newCountry = await createCountry(name)
      setCountries((prev) => [...prev.filter((c) => c.id !== newCountry.id && c.name.toLowerCase() !== newCountry.name.toLowerCase()), newCountry])
      return newCountry
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add country.")
      return null
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

  const refetchEmployers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await ensureTechnicalDomainsCatalogLoaded()
      const result = await fetchEmployers(employerListParams)
      setEmployers(result.items.map(employerListItemToEmployer))
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
      setHasPrevious(result.hasPrevious)
      setHasNext(result.hasNext)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load employers")
      setEmployers([])
    } finally {
      setLoading(false)
    }
  }, [employerListParams])

  useEffect(() => {
    refetchEmployers()
  }, [refetchEmployers])

  const handleEmployerSubmit = useCallback(
    async (data: EmployerFormData, _verificationState?: EmployerVerificationState) => {
      try {
        if (employerToEdit) {
          const id = Number(employerToEdit.id)
          const dto = buildUpdateEmployerDto(data, {
            tagsLookup,
            timeSupportZonesLookup,
          })
          await updateEmployer(id, dto)
          await syncEmployerLocationsFromEditForm(id, data, employerToEdit, (name) => {
            return countries.find((c) => c.name === name)?.id ?? 0
          })
          const newLayoffs = (data.layoffs ?? []).filter((lay) => isNewLayoffFormRow(lay.id))
          for (const lay of newLayoffs) {
            const body = buildAddEmployerLayoffDto(lay)
            if (body) await addEmployerLayoff(id, body)
          }
          toast.success("Employer updated successfully.")
        } else {
          const dto = buildCreateEmployerDto(data, {
            tagsLookup,
            timeSupportZonesLookup,
            getCountryId: (name) => countries.find((c) => c.name === name)?.id ?? 0,
          })
          await createEmployer(dto)
          toast.success("Employer created successfully.")
        }
        setEditDialogOpen(false)
        setEmployerToEdit(null)
        await refetchEmployers()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save employer")
        throw e
      }
    },
    [employerToEdit, tagsLookup, timeSupportZonesLookup, countries, refetchEmployers]
  )

  const handleFiltersChange = useCallback((newFilters: EmployerFilters) => {
    setFilters(newFilters)
    setPageNumber(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters)
    setPageNumber(1)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPageNumber(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setPageNumber(1)
  }, [])

  const handleViewEmployer = useCallback((_employer: Employer) => {
    // TODO: Open employer details modal or navigate to detail page
  }, [])

  const handleEditEmployer = useCallback(async (employer: Employer) => {
    try {
      const id = Number(employer.id)
      const dto = await fetchEmployerById(id)
      setEmployerToEdit(employerDtoToEmployer(dto))
      setEditDialogOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load employer")
    }
  }, [])

  const handleDeleteEmployer = useCallback(
    async (employer: Employer) => {
      try {
        await deleteEmployer(Number(employer.id))
        toast.success(`Employer "${employer.name}" deleted.`)
        await refetchEmployers()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete employer")
      }
    },
    [refetchEmployers]
  )

  const handleAddLocation = useCallback((_employer: Employer) => {
    // TODO: Implement add location via API (e.g. open modal or navigate)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Employers</h2>
        </div>
        <div className="flex items-center gap-2">
          <EmployersFilterDialog
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            lookupOptions={{
              technicalDomains: technicalDomainSelectOptions,
              timeSupportZones: timeSupportZoneFilterOptions,
              tags: tagFilterOptions,
              clientLocations: clientLocationFilterOptions,
              countries: countryFilterOptions,
            }}
          />
          <EmployerCreationDialog
            onSubmit={handleEmployerSubmit}
            countries={countries}
            countriesLoading={countriesLoading}
            lookups={{
              tags: tagsLookup,
              timeSupportZones: timeSupportZonesLookup,
              benefits: benefitsLookup,
            }}
            onCreateTag={handleCreateTag}
            onCreateTimeSupportZone={handleCreateTimeSupportZone}
            onCreateBenefit={handleCreateBenefit}
            onCreateCountry={handleCreateCountry}
          />
        </div>
      </div>

      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <EmployersTable
        employers={employers}
        filters={filters}
        isLoading={loading}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalPages={totalPages}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onView={handleViewEmployer}
        onEdit={handleEditEmployer}
        onDelete={handleDeleteEmployer}
        onAddLocation={handleAddLocation}
      />

      {employerToEdit && (
        <EmployerCreationDialog
          mode="edit"
          employerData={employerToEdit}
          showVerification={true}
          onSubmit={handleEmployerSubmit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) setEmployerToEdit(null)
          }}
          countries={countries}
          countriesLoading={countriesLoading}
          lookups={{
            tags: tagsLookup,
            timeSupportZones: timeSupportZonesLookup,
            benefits: benefitsLookup,
          }}
          onCreateTag={handleCreateTag}
          onCreateTimeSupportZone={handleCreateTimeSupportZone}
          onCreateBenefit={handleCreateBenefit}
          onCreateCountry={handleCreateCountry}
        />
      )}
    </div>
  )
}
