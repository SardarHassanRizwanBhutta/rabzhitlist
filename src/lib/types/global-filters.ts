export interface GlobalFilters {
  // Geographic filters
  countries: string[]
  cities: string[]
  excludeCities: string[]  // Exclude candidates from major cities (for remote cities filter)

  // Technology and project filters
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]

  // Entity filters
  employers: string[]

  // Status filters (applies to different entities differently)
  status: string[]
}

export interface GlobalFilterContextType {
  filters: GlobalFilters
  setFilters: (filters: GlobalFilters) => void
  clearFilters: () => void
  isActive: boolean
}

export const initialGlobalFilters: GlobalFilters = {
  countries: [],
  cities: [],
  excludeCities: [],
  techStacks: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  employers: [],
  status: [],
}

// Helper function to check if any global filters are active
export const hasActiveGlobalFilters = (filters: GlobalFilters): boolean => {
  return (
    filters.countries.length > 0 ||
    filters.cities.length > 0 ||
    filters.excludeCities.length > 0 ||
    filters.techStacks.length > 0 ||
    filters.verticalDomains.length > 0 ||
    filters.horizontalDomains.length > 0 ||
    filters.technicalAspects.length > 0 ||
    filters.employers.length > 0 ||
    filters.status.length > 0
  )
}

// Helper function to count active global filters
export const getGlobalFilterCount = (filters: GlobalFilters): number => {
  return (
    filters.countries.length +
    filters.cities.length +
    filters.excludeCities.length +
    filters.techStacks.length +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalAspects.length +
    filters.employers.length +
    filters.status.length
  )
}
