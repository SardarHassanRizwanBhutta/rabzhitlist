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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { Filter } from "lucide-react"
import { ACHIEVEMENT_TYPE_DB, ACHIEVEMENT_TYPE_LABELS } from "@/lib/constants/candidate-enums"

export interface AchievementFilters {
  name: string
  /** AchievementType ints 0–7. */
  types: number[]
}

interface AchievementsFilterDialogProps {
  filters: AchievementFilters
  onFiltersChange: (filters: AchievementFilters) => void
  onClearFilters: () => void
}

const initialFilters: AchievementFilters = {
  name: "",
  types: [],
}

const TYPE_OPTIONS: MultiSelectOption[] = ACHIEVEMENT_TYPE_DB.map((key, index) => ({
  value: String(index),
  label: ACHIEVEMENT_TYPE_LABELS[key],
}))

export function AchievementsFilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
}: AchievementsFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<AchievementFilters>(filters)

  const activeFilterCount =
    (filters.name.trim() ? 1 : 0) + filters.types.length

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const hasAnyTempFilters = tempFilters.name.trim().length > 0 || tempFilters.types.length > 0

  const handleApplyFilters = () => {
    onFiltersChange({
      name: tempFilters.name,
      types: tempFilters.types.filter((t) => Number.isInteger(t) && t >= 0 && t <= 7),
    })
    setOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters(initialFilters)
    onClearFilters()
    setOpen(false)
  }

  const handleCancel = () => {
    setTempFilters(filters)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Achievements
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <Label htmlFor="achievementNameFilter" className="text-sm font-semibold">
                Name
              </Label>
              <Input
                id="achievementNameFilter"
                type="text"
                placeholder="Filter by name..."
                value={tempFilters.name}
                onChange={(e) => setTempFilters((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="min-w-0">
              <MultiSelect
                items={TYPE_OPTIONS}
                selected={tempFilters.types.map(String)}
                onChange={(values) =>
                  setTempFilters((prev) => ({
                    ...prev,
                    types: values
                      .map((v) => Number.parseInt(v, 10))
                      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 7),
                  }))
                }
                placeholder="Filter by type..."
                label="Type"
                searchPlaceholder="Search types..."
                maxDisplay={3}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <div className="flex gap-2 w-full">
            <Button type="button" variant="outline" onClick={handleCancel} className="cursor-pointer">
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
            <Button onClick={handleApplyFilters} className="ml-auto cursor-pointer">
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
