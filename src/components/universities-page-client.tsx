"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"
import { UniversitiesTable } from "@/components/universities-table"
import { UniversityCreationDialog, UniversityFormData, UniversityVerificationState } from "@/components/university-creation-dialog"
import { UniversitiesFilterDialog, UniversityFilters } from "@/components/universities-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { University } from "@/lib/types/university"
import type { Country } from "@/lib/types/country"
import { fetchCountries, createCountry } from "@/lib/services/countries-api"
import {
  fetchUniversitiesFiltered,
  fetchUniversityById,
  createUniversity,
  createUniversityLocation,
  updateUniversityLocation,
  updateUniversity,
  deleteUniversity,
  deleteUniversityLocation,
} from "@/lib/services/universities-api"
import type { UniversityListItem } from "@/lib/services/universities-api"
import type { UniversityLocation } from "@/lib/types/university"
import { LABEL_TO_RANKING, parseUniversityRankingFromList } from "@/lib/types/university"

/** True when the location row was added in the form (id is UUID). False when it came from the server (id is numeric). */
function isNewLocationFormRow(id: string): boolean {
  const n = parseInt(id, 10)
  return Number.isNaN(n) || String(n) !== id
}

function listItemLinkedInUrl(item: UniversityListItem): string | null {
  const a = item.linkedInUrl?.trim()
  if (a) return a
  const b = (item as { linkedinUrl?: string | null }).linkedinUrl?.trim()
  return b || null
}

function mapListItemLocations(item: UniversityListItem): UniversityLocation[] {
  if (item.locations?.length) {
    return item.locations.map((loc) => ({
      id: loc.id,
      universityId: loc.universityId,
      city: loc.city,
      address: loc.address ?? null,
      isMainCampus: loc.isMainCampus,
      createdAt: loc.createdAt,
    }))
  }
  const legacy = item.cities
  if (legacy?.length) {
    return legacy.map((city, index) => ({
      id: 0,
      universityId: item.id,
      city,
      address: null,
      isMainCampus: index === 0,
      createdAt: "",
    }))
  }
  return []
}

function mapListItemToUniversity(item: UniversityListItem): University {
  const website = item.websiteUrl?.trim() || null
  const linkedIn = listItemLinkedInUrl(item)
  return {
    id: item.id,
    name: item.name,
    websiteUrl: website,
    linkedInUrl: linkedIn,
    country: item.country,
    ranking: parseUniversityRankingFromList(item.ranking),
    locations: mapListItemLocations(item),
    createdAt: "",
    updatedAt: "",
  }
}
import { toast } from "sonner"

const initialFilters: UniversityFilters = {
  name: "",
  countries: [],
  rankings: [],
  city: "",
  minJobSuccessRatio: "",
}

export function UniversitiesPageClient() {
  const searchParams = useSearchParams()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<UniversityFilters>(initialFilters)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [universityToEdit, setUniversityToEdit] = useState<University | null>(null)

  const [universities, setUniversities] = useState<University[]>([])
  const [universitiesLoading, setUniversitiesLoading] = useState(true)
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesLoading, setCountriesLoading] = useState(true)

  const loadUniversities = useCallback(async () => {
    try {
      setUniversitiesLoading(true)
      const countryIds = filters.countries.length && countries.length
        ? filters.countries
            .map((name) => countries.find((c) => c.name === name)?.id)
            .filter((id): id is number => id != null)
        : undefined
      const rankingParam =
        filters.rankings.length > 0 && filters.rankings[0] in LABEL_TO_RANKING
          ? LABEL_TO_RANKING[filters.rankings[0]]
          : undefined
      const res = await fetchUniversitiesFiltered({
        name: filters.name.trim() || undefined,
        city: filters.city.trim() || undefined,
        countryIds,
        ranking: rankingParam,
        pageNumber: 1,
        pageSize: 100,
      })
      setUniversities(res.items.map(mapListItemToUniversity))
    } catch (error) {
      console.error("Failed to fetch universities:", error)
      toast.error("Failed to load universities.")
    } finally {
      setUniversitiesLoading(false)
    }
  }, [filters, countries])

  useEffect(() => {
    loadUniversities()
  }, [loadUniversities])

  useEffect(() => {
    let cancelled = false
    async function loadCountries() {
      try {
        const data = await fetchCountries()
        if (!cancelled) setCountries(data)
      } catch (error) {
        console.error("Failed to fetch countries:", error)
        if (!cancelled) toast.error("Failed to load countries.")
      } finally {
        if (!cancelled) setCountriesLoading(false)
      }
    }
    loadCountries()
    return () => { cancelled = true }
  }, [])

  const handleCreateCountry = useCallback(async (name: string): Promise<Country | null> => {
    try {
      const newCountry = await createCountry(name)
      setCountries((prev) => [...prev.filter((c) => c.id !== newCountry.id && c.name.toLowerCase() !== newCountry.name.toLowerCase()), newCountry])
      return newCountry
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add country.")
      return null
    }
  }, [])

  // Check for URL filters
  useEffect(() => {
    const universityFilterName = searchParams.get('universityFilter')
    const universityId = searchParams.get('universityId')
    
    if (universityFilterName && universityId) {
      // Apply university filter - add to countries filter if needed
      // The table will show the filtered university
    }
  }, [searchParams])

  const handleUniversitySubmit = async (
    data: UniversityFormData,
    _verificationState?: UniversityVerificationState
  ) => {
    try {
      if (universityToEdit) {
        await updateUniversity(universityToEdit.id, {
          name: data.name.trim(),
          countryId: data.countryId!,
          websiteUrl: data.websiteUrl?.trim() || null,
          linkedInUrl: data.linkedinUrl?.trim() || null,
          ranking:
            data.ranking && data.ranking in LABEL_TO_RANKING
              ? LABEL_TO_RANKING[data.ranking as keyof typeof LABEL_TO_RANKING]
              : null,
        })
        const locations = data.locations ?? []
        const existingLocationIdsInForm = new Set(
          locations.filter((loc) => !isNewLocationFormRow(loc.id)).map((loc) => Number(loc.id))
        )
        for (const loc of locations) {
          if (!isNewLocationFormRow(loc.id)) {
            await updateUniversityLocation(universityToEdit.id, Number(loc.id), {
              city: loc.city.trim(),
              address: loc.address?.trim() || null,
              isMainCampus: loc.isMainCampus ?? false,
            })
          }
        }
        for (const existingLoc of universityToEdit.locations ?? []) {
          if (!existingLocationIdsInForm.has(existingLoc.id)) {
            await deleteUniversityLocation(universityToEdit.id, existingLoc.id)
          }
        }
        const newLocations = locations.filter(
          (loc) => isNewLocationFormRow(loc.id) && loc.city?.trim()
        )
        for (const loc of newLocations) {
          await createUniversityLocation(universityToEdit.id, {
            city: loc.city.trim(),
            address: loc.address?.trim() || null,
            isMainCampus: loc.isMainCampus ?? false,
          })
        }
        toast.success(`University "${data.name}" updated successfully.`)
        setEditDialogOpen(false)
        setUniversityToEdit(null)
      } else {
        if (data.countryId == null) {
          toast.error("Country is required.")
          return
        }
        const locationsWithCity = data.locations.filter((loc) =>
          loc.city?.trim()
        )
        if (locationsWithCity.length === 0) {
          toast.error("At least one location with a city is required.")
          return
        }
        const university = await createUniversity({
          name: data.name.trim(),
          countryId: data.countryId,
          websiteUrl: data.websiteUrl?.trim() || null,
          linkedInUrl: data.linkedinUrl?.trim() || null,
          ranking:
            data.ranking && data.ranking in LABEL_TO_RANKING
              ? LABEL_TO_RANKING[data.ranking as keyof typeof LABEL_TO_RANKING]
              : null,
        })
        for (const loc of locationsWithCity) {
          await createUniversityLocation(university.id, {
            city: loc.city.trim(),
            address: loc.address?.trim() || null,
            isMainCampus: loc.isMainCampus ?? false,
          })
        }
        toast.success(`University "${data.name}" created successfully.`)
      }
      await loadUniversities()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message === "Not found") {
        toast.error("University not found.")
        setEditDialogOpen(false)
        setUniversityToEdit(null)
      } else {
        toast.error(message || "Failed to save university.")
      }
    }
  }

  const handleDeleteUniversity = async (university: University) => {
    try {
      await deleteUniversity(university.id)
      toast.success(`University "${university.name}" deleted successfully.`)
      await loadUniversities()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message === "Not found") toast.error("University not found.")
      else toast.error(message || "Failed to delete university.")
      throw err
    }
  }

  const handleViewUniversity = (university: University) => {
    // Handled by UniversitiesTable - opens detail modal
  }

  const handleEditUniversity = useCallback(async (university: University) => {
    try {
      const full = await fetchUniversityById(university.id)
      setUniversityToEdit(full)
      setEditDialogOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message === "Not found") toast.error("University not found.")
      else toast.error(message || "Failed to load university.")
    }
  }, [])

  const handleFiltersChange = (newFilters: UniversityFilters) => {
    setFilters(newFilters)
    // TODO: Apply filters to universities table
    console.log("University filters applied:", newFilters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    // TODO: Clear filters from universities table
    console.log("University filters cleared")
  }

  // Apply global filters to universities
  const applyGlobalFilters = (universityList: University[]) => {
    if (!hasGlobalFilters) return universityList

    return universityList.filter(university => {
      // Global Countries filter
      if (globalFilters.countries.length > 0) {
        const countryName = university.country?.name
        if (!countryName || !globalFilters.countries.includes(countryName)) return false
      }

      // Global Cities filter
      if (globalFilters.cities.length > 0) {
        const hasMatchingCity = university.locations.some(location =>
          globalFilters.cities.includes(location.city)
        )
        if (!hasMatchingCity) return false
      }

      return true
    })
  }

  // Apply global filters and URL filter (dialog filters are applied by the API)
  const filteredUniversities = useMemo(() => {
    let universityList = universities

    // Apply global filters first
    universityList = applyGlobalFilters(universityList)

    // Apply URL filter if present
    const universityFilterName = searchParams.get('universityFilter')
    const universityId = searchParams.get('universityId')

    if (universityFilterName && universityId) {
      const idNum = Number(universityId)
      universityList = universityList.filter(
        (uni) =>
          uni.id === idNum ||
          uni.name.trim().toLowerCase() === universityFilterName.trim().toLowerCase()
      )
    }

    return universityList
  }, [universities, globalFilters, hasGlobalFilters, searchParams])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Universities</h2>
        </div>
        <div className="flex items-center gap-2">
          <UniversitiesFilterDialog 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            countries={countries}
            countriesLoading={countriesLoading}
          />
          <UniversityCreationDialog
            onSubmit={handleUniversitySubmit}
            countries={countries}
            countriesLoading={countriesLoading}
            onCreateCountry={handleCreateCountry}
          />
        </div>
      </div>

      {/* Global Filter Indicator */}
      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}
      
      <UniversitiesTable
        universities={filteredUniversities}
        isLoading={universitiesLoading}
        onEdit={handleEditUniversity}
        onDelete={handleDeleteUniversity}
      />

      {/* Edit University Dialog with Verification */}
      {universityToEdit && (
        <UniversityCreationDialog
          mode="edit"
          universityData={universityToEdit}
          showVerification={true}
          onSubmit={handleUniversitySubmit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setUniversityToEdit(null)
            }
          }}
          countries={countries}
          countriesLoading={countriesLoading}
          onCreateCountry={handleCreateCountry}
        />
      )}
    </div>
  )
}
