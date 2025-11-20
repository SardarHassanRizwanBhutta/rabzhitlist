"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { GlobalFilters, GlobalFilterContextType, initialGlobalFilters, hasActiveGlobalFilters } from "@/lib/types/global-filters"

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined)

interface GlobalFilterProviderProps {
  children: React.ReactNode
}

export function GlobalFilterProvider({ children }: GlobalFilterProviderProps) {
  const [filters, setFilters] = useState<GlobalFilters>(initialGlobalFilters)

  // Persist filters in localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('globalFilters')
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters)
        setFilters(parsedFilters)
      } catch (error) {
        console.error('Error parsing saved global filters:', error)
      }
    }
  }, [])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('globalFilters', JSON.stringify(filters))
  }, [filters])

  const clearFilters = () => {
    setFilters(initialGlobalFilters)
  }

  const isActive = hasActiveGlobalFilters(filters)

  const contextValue: GlobalFilterContextType = {
    filters,
    setFilters,
    clearFilters,
    isActive,
  }

  return (
    <GlobalFilterContext.Provider value={contextValue}>
      {children}
    </GlobalFilterContext.Provider>
  )
}

export function useGlobalFilters() {
  const context = useContext(GlobalFilterContext)
  if (context === undefined) {
    throw new Error('useGlobalFilters must be used within a GlobalFilterProvider')
  }
  return context
}
