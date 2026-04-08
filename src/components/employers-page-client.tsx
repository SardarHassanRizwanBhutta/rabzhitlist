"use client"

import { useState, useEffect, useCallback } from "react"
import { Globe } from "lucide-react"
import { toast } from "sonner"
import { EmployersTable } from "@/components/employers-table"
import { EmployerCreationDialog, EmployerFormData, EmployerVerificationState } from "@/components/employer-creation-dialog"
import { EmployersFilterDialog, EmployerFilters } from "@/components/employers-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Employer } from "@/lib/types/employer"
import type { Country } from "@/lib/types/country"
import type { LookupItem } from "@/lib/services/lookups-api"
import { fetchCountries, createCountry } from "@/lib/services/countries-api"
import { fetchTechStacks, createTechStack } from "@/lib/services/lookups-api"
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
  fetchEmployerById,
  createEmployer,
  updateEmployer,
  deleteEmployer,
  addEmployerLayoff,
  buildCreateEmployerDto,
  buildUpdateEmployerDto,
  buildAddEmployerLayoffDto,
  isNewLayoffFormRow,
  employerDtoToEmployer,
  employerListItemToEmployer,
} from "@/lib/services/employers-api"

const DEFAULT_PAGE_SIZE = 20

interface EmployersPageClientProps {
  /** Optional initial employers (e.g. from server). If not provided, list is fetched client-side. */
  employers?: Employer[]
}

const initialFilters: EmployerFilters = {
  status: [],
  foundedYears: [],
  countries: [],
  cities: [],
  employerTypes: [],
  salaryPolicies: [],
  sizeMin: "",
  sizeMax: "",
  minLocationsCount: "",
  minCitiesCount: "",
  minApplicants: "",
  employerTechStacks: [],
  benefits: [],
  shiftTypes: [],
  shiftTypesStrict: false,
  workModes: [],
  workModesStrict: false,
  timeSupportZones: [],
  rankings: [],
  tags: [],
  techStackMinCount: "",
  isDPLCompetitive: null,
  employeeCities: [],
  employeeCountries: [],
  techStacks: [],
  projectTechStackMinYears: {
    techStacks: [],
    minYears: ""
  },
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
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
  const [techStacksLookup, setTechStacksLookup] = useState<LookupItem[]>([])
  const [tagsLookup, setTagsLookup] = useState<LookupItem[]>([])
  const [timeSupportZonesLookup, setTimeSupportZonesLookup] = useState<LookupItem[]>([])
  const [benefitsLookup, setBenefitsLookup] = useState<LookupItem[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTechStacks(),
      fetchTags(),
      fetchTimeSupportZones(),
      fetchBenefits(),
    ])
      .then(([techStacks, tags, timeSupportZones, benefits]) => {
        if (!cancelled) {
          setTechStacksLookup(techStacks)
          setTagsLookup(tags)
          setTimeSupportZonesLookup(timeSupportZones)
          setBenefitsLookup(benefits)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTechStacksLookup([])
          setTagsLookup([])
          setTimeSupportZonesLookup([])
          setBenefitsLookup([])
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

  const handleCreateTechStack = useCallback(async (name: string) => {
    try {
      const created = await createTechStack(name)
      setTechStacksLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add technology")
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
      const result = await fetchEmployers({
        pageNumber,
        pageSize,
        foundedYears: filters.foundedYears?.length ? filters.foundedYears : undefined,
        tags: filters.tags?.length ? filters.tags : undefined,
        isDPLCompetitive: filters.isDPLCompetitive ?? undefined,
      })
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
  }, [pageNumber, pageSize, filters.foundedYears, filters.tags, filters.isDPLCompetitive])

  useEffect(() => {
    refetchEmployers()
  }, [refetchEmployers])

  const handleEmployerSubmit = useCallback(
    async (data: EmployerFormData, _verificationState?: EmployerVerificationState) => {
      try {
        if (employerToEdit) {
          const id = Number(employerToEdit.id)
          const dto = buildUpdateEmployerDto(data)
          await updateEmployer(id, dto)
          const newLayoffs = (data.layoffs ?? []).filter((lay) => isNewLayoffFormRow(lay.id))
          for (const lay of newLayoffs) {
            const body = buildAddEmployerLayoffDto(lay)
            if (body) await addEmployerLayoff(id, body)
          }
          toast.success("Employer updated successfully.")
        } else {
          const dto = buildCreateEmployerDto(data, {
            techStacksLookup,
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
    [employerToEdit, techStacksLookup, tagsLookup, timeSupportZonesLookup, countries, refetchEmployers]
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
          />
          <EmployerCreationDialog
            onSubmit={handleEmployerSubmit}
            countries={countries}
            countriesLoading={countriesLoading}
            lookups={{
              techStacks: techStacksLookup,
              tags: tagsLookup,
              timeSupportZones: timeSupportZonesLookup,
              benefits: benefitsLookup,
            }}
            onCreateTechStack={handleCreateTechStack}
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
            techStacks: techStacksLookup,
            tags: tagsLookup,
            timeSupportZones: timeSupportZonesLookup,
            benefits: benefitsLookup,
          }}
          onCreateTechStack={handleCreateTechStack}
          onCreateTag={handleCreateTag}
          onCreateTimeSupportZone={handleCreateTimeSupportZone}
          onCreateBenefit={handleCreateBenefit}
          onCreateCountry={handleCreateCountry}
        />
      )}
    </div>
  )
}
