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
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Filter } from "lucide-react"
import { UniversityRanking, UNIVERSITY_RANKING_LABELS } from "@/lib/types/university"
import { sampleUniversities } from "@/lib/sample-data/universities"

// Filter interfaces
export interface UniversityFilters {
  countries: string[]
  rankings: UniversityRanking[]
  cities: string[]
}

interface UniversitiesFilterDialogProps {
  children?: React.ReactNode
  filters: UniversityFilters
  onFiltersChange: (filters: UniversityFilters) => void
  onClearFilters: () => void
}

// Extract unique values from university data
const extractUniqueCountries = (): string[] => {
  const countries = new Set<string>()
  sampleUniversities.forEach(university => {
    countries.add(university.country)
  })
  return Array.from(countries).sort()
}

const extractUniqueCities = (): string[] => {
  const cities = new Set<string>()
  sampleUniversities.forEach(university => {
    university.locations.forEach(location => {
      cities.add(location.city)
    })
  })
  return Array.from(cities).sort()
}

// Mock data for filter options
const rankingOptions: MultiSelectOption[] = Object.entries(UNIVERSITY_RANKING_LABELS).map(([value, label]) => ({
  value: value as UniversityRanking,
  label
}))

const countryOptions: MultiSelectOption[] = extractUniqueCountries().map(country => ({
  value: country,
  label: country
}))

const cityOptions: MultiSelectOption[] = extractUniqueCities().map(city => ({
  value: city,
  label: city
}))

const initialFilters: UniversityFilters = {
  countries: [],
  rankings: [],
  cities: [],
}

export function UniversitiesFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
}: UniversitiesFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<UniversityFilters>(filters)

  // Calculate active filter count
  const activeFilterCount = 
    filters.countries.length +
    filters.rankings.length +
    filters.cities.length

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof UniversityFilters, value: string[]) => {
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
    tempFilters.countries.length > 0 ||
    tempFilters.rankings.length > 0 ||
    tempFilters.cities.length > 0

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
            Filter Universities
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* University Filters */}
            <div className="space-y-4">
              <MultiSelect
                items={countryOptions}
                selected={tempFilters.countries}
                onChange={(values) => handleFilterChange("countries", values)}
                placeholder="Filter by country..."
                label="Country"
                searchPlaceholder="Search countries..."
                maxDisplay={3}
              />

              <MultiSelect
                items={rankingOptions}
                selected={tempFilters.rankings}
                onChange={(values) => handleFilterChange("rankings", values)}
                placeholder="Filter by ranking..."
                label="University Ranking"
                maxDisplay={3}
              />

              <MultiSelect
                items={cityOptions}
                selected={tempFilters.cities}
                onChange={(values) => handleFilterChange("cities", values)}
                placeholder="Filter by city..."
                label="Campus Cities"
                searchPlaceholder="Search cities..."
                maxDisplay={4}
              />
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
