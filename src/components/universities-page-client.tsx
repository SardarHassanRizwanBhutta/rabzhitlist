"use client"

import { useState, useMemo } from "react"
import { Globe } from "lucide-react"
import { UniversitiesTable } from "@/components/universities-table"
import { UniversityCreationDialog, UniversityFormData } from "@/components/university-creation-dialog"
import { UniversitiesFilterDialog, UniversityFilters } from "@/components/universities-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { University } from "@/lib/types/university"

interface UniversitiesPageClientProps {
  universities: University[]
}

const initialFilters: UniversityFilters = {
  countries: [],
  rankings: [],
  cities: [],
}

export function UniversitiesPageClient({ universities }: UniversitiesPageClientProps) {
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<UniversityFilters>(initialFilters)

  const handleUniversitySubmit = async (data: UniversityFormData) => {
    // Here you would typically send the data to your API
    console.log("New university data:", data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // You could add the university to your state/cache here
    alert("University created successfully!")
  }

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
        if (!globalFilters.countries.includes(university.country)) return false
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

  // Apply global filters to universities
  const filteredUniversities = useMemo(() => {
    return applyGlobalFilters(universities)
  }, [universities, globalFilters, hasGlobalFilters])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Universities</h2>
          <p className="text-muted-foreground">
            Manage university database and institutional information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UniversitiesFilterDialog 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          <UniversityCreationDialog onSubmit={handleUniversitySubmit} />
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
      
      <UniversitiesTable universities={filteredUniversities} />
    </div>
  )
}
