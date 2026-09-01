"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Globe } from "lucide-react"
import { AchievementsTable } from "@/components/achievements-table"
import {
  AchievementsFilterDialog,
  type AchievementFilters,
} from "@/components/achievements-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import {
  fetchAchievementsPage,
  type CandidateAchievementListItem,
} from "@/lib/services/achievements-api"
import { toast } from "sonner"

const DEFAULT_PAGE_SIZE = 20

const initialFilters: AchievementFilters = {
  name: "",
  types: [],
}

export function AchievementsPageClient() {
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<AchievementFilters>(initialFilters)
  const [items, setItems] = useState<CandidateAchievementListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)

  const listFilterKey = `${filters.name}|${filters.types.slice().sort((a, b) => a - b).join(",")}`
  const prevListFilterKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevListFilterKeyRef.current === listFilterKey) return
    const isFilterChange = prevListFilterKeyRef.current !== null
    prevListFilterKeyRef.current = listFilterKey
    setPageNumber(1)
    if (isFilterChange) {
      setItems([])
      setLoading(true)
    }
  }, [listFilterKey])

  const load = useCallback(
    async (page: number, size: number) => {
      try {
        setLoading(true)
        const data = await fetchAchievementsPage({
          name: filters.name.trim() || undefined,
          types: filters.types.length > 0 ? filters.types : undefined,
          pageNumber: page,
          pageSize: size,
        })
        setItems(data.items)
        setTotalCount(data.totalCount)
        setPageNumber(data.pageNumber)
        setPageSize(data.pageSize)
        setTotalPages(data.totalPages)
        setHasPrevious(data.hasPrevious)
        setHasNext(data.hasNext)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load achievements."
        toast.error(message)
        setItems([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    },
    [filters.name, filters.types],
  )

  useEffect(() => {
    void load(pageNumber, pageSize)
  }, [load, pageNumber, pageSize])

  const handleFiltersChange = (newFilters: AchievementFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Achievements</h2>
        </div>
        <AchievementsFilterDialog
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}

      <AchievementsTable
        achievements={items}
        isLoading={loading}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalPages={totalPages}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={setPageNumber}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPageNumber(1)
        }}
      />
    </div>
  )
}
