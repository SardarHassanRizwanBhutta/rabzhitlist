"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"
import { UniversitiesTable } from "@/components/universities-table"
import { UniversityCreationDialog, UniversityFormData, UniversityVerificationState } from "@/components/university-creation-dialog"
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
  const searchParams = useSearchParams()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<UniversityFilters>(initialFilters)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [universityToEdit, setUniversityToEdit] = useState<University | null>(null)

  // Check for URL filters
  useEffect(() => {
    const universityFilterName = searchParams.get('universityFilter')
    const universityId = searchParams.get('universityId')
    
    if (universityFilterName && universityId) {
      // Apply university filter - add to countries filter if needed
      // The table will show the filtered university
    }
  }, [searchParams])

  const handleUniversitySubmit = async (data: UniversityFormData, verificationState?: UniversityVerificationState) => {
    // Here you would typically send the data to your API
    if (verificationState) {
      console.log("University data with verification:", data, verificationState)
    } else {
      console.log("New university data:", data)
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // You could add the university to your state/cache here
    if (verificationState) {
      alert("University updated and verified successfully!")
    } else {
      alert("University created successfully!")
    }
    
    // Close edit dialog if open
    if (editDialogOpen) {
      setEditDialogOpen(false)
      setUniversityToEdit(null)
    }
  }

  const handleViewUniversity = (university: University) => {
    // Handled by UniversitiesTable - opens detail modal
  }

  const handleEditUniversity = (university: University) => {
    setUniversityToEdit(university)
    setEditDialogOpen(true)
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

  // Apply global filters and filter dialog filters to universities
  const filteredUniversities = useMemo(() => {
    let universityList = universities

    // Apply global filters first
    universityList = applyGlobalFilters(universityList)

    // Apply URL filter if present
    const universityFilterName = searchParams.get('universityFilter')
    const universityId = searchParams.get('universityId')
    
    if (universityFilterName && universityId) {
      universityList = universityList.filter(uni => 
        uni.id === universityId || uni.name.trim().toLowerCase() === universityFilterName.trim().toLowerCase()
      )
    }

    // Apply filter dialog filters
    return universityList.filter(university => {
      // Countries filter
      if (filters.countries.length > 0 && !filters.countries.includes(university.country)) {
        return false
      }

      // Rankings filter
      if (filters.rankings.length > 0 && !filters.rankings.includes(university.ranking)) {
        return false
      }

      // Cities filter
      if (filters.cities.length > 0) {
        const hasMatchingCity = university.locations.some(location =>
          filters.cities.includes(location.city)
        )
        if (!hasMatchingCity) return false
      }

      return true
    })
  }, [universities, globalFilters, hasGlobalFilters, filters, searchParams])

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
      
      <UniversitiesTable 
        universities={filteredUniversities}
        onEdit={handleEditUniversity}
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
        />
      )}
    </div>
  )
}
