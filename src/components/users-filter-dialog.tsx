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
import { Filter } from "lucide-react"

export interface UserFilters {
  fullNameSearch: string
  emailSearch: string
}

interface UsersFilterDialogProps {
  filters: UserFilters
  onFiltersChange: (filters: UserFilters) => void
  onClearFilters: () => void
}

const emptyFilters: UserFilters = {
  fullNameSearch: "",
  emailSearch: "",
}

export function UsersFilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
}: UsersFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<UserFilters>(filters)

  const activeFilterCount =
    (filters.fullNameSearch.trim() ? 1 : 0) + (filters.emailSearch.trim() ? 1 : 0)

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
    setOpen(false)
  }

  const handleClear = () => {
    setTempFilters(emptyFilters)
    onClearFilters()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative cursor-pointer">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Filter users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="userFullNameFilter">Name</Label>
            <Input
              id="userFullNameFilter"
              placeholder="Filter by name..."
              value={tempFilters.fullNameSearch}
              onChange={(e) =>
                setTempFilters((prev) => ({ ...prev, fullNameSearch: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userEmailFilter">Email</Label>
            <Input
              id="userEmailFilter"
              type="email"
              placeholder="Filter by email..."
              value={tempFilters.emailSearch}
              onChange={(e) =>
                setTempFilters((prev) => ({ ...prev, emailSearch: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleClear} className="cursor-pointer">
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="button" onClick={handleApplyFilters} className="cursor-pointer">
              Apply filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
