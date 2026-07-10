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
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Filter } from "lucide-react"
import type { CertificationIssuer } from "@/lib/types/certification"

export interface CertificationFilters {
  certificationNameSearch: string
  issuerIds: number[]
  dataProgressMin: string
  dataProgressMax: string
}

interface CertificationsFilterDialogProps {
  children?: React.ReactNode
  filters: CertificationFilters
  onFiltersChange: (filters: CertificationFilters) => void
  onClearFilters: () => void
  issuers: CertificationIssuer[]
}

const initialFilters: CertificationFilters = {
  certificationNameSearch: "",
  issuerIds: [],
  dataProgressMin: "",
  dataProgressMax: "",
}

export function CertificationsFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
  issuers,
}: CertificationsFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<CertificationFilters>(filters)

  const issuingBodyOptions: MultiSelectOption[] = issuers.map(issuer => ({
    value: String(issuer.id),
    label: issuer.name,
  }))

  const activeFilterCount =
    (filters.certificationNameSearch.trim() ? 1 : 0) +
    filters.issuerIds.length +
    (filters.dataProgressMin.trim() ? 1 : 0) +
    (filters.dataProgressMax.trim() ? 1 : 0)

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleCertificationNameChange = (value: string) => {
    setTempFilters(prev => ({ ...prev, certificationNameSearch: value }))
  }

  const handleIssuerIdsChange = (values: string[]) => {
    setTempFilters(prev => ({ ...prev, issuerIds: values.map(Number) }))
  }

  const validateDataProgressPercentage = (): string | null => {
    const minRaw = tempFilters.dataProgressMin.trim()
    const maxRaw = tempFilters.dataProgressMax.trim()
    if (!minRaw && !maxRaw) return null

    const min = minRaw ? parseFloat(minRaw) : null
    const max = maxRaw ? parseFloat(maxRaw) : null

    if (minRaw && (min == null || Number.isNaN(min) || min < 0 || min > 100)) {
      return "Data progress must be between 0 and 100."
    }
    if (maxRaw && (max == null || Number.isNaN(max) || max < 0 || max > 100)) {
      return "Data progress must be between 0 and 100."
    }
    if (min != null && max != null && !Number.isNaN(min) && !Number.isNaN(max) && max < min) {
      return "Maximum data progress cannot be less than minimum."
    }
    return null
  }

  const dataProgressError = validateDataProgressPercentage()

  const handleApplyFilters = () => {
    if (dataProgressError) return
    onFiltersChange(tempFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters(initialFilters)
    onClearFilters()
  }

  const handleCancel = () => {
    setTempFilters(filters)
    setOpen(false)
  }

  const hasAnyTempFilters =
    tempFilters.certificationNameSearch.trim() !== "" ||
    tempFilters.issuerIds.length > 0 ||
    tempFilters.dataProgressMin.trim() !== "" ||
    tempFilters.dataProgressMax.trim() !== ""

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

      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Certifications
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certification-name-search">Name</Label>
                <Input
                  id="certification-name-search"
                  type="text"
                  placeholder="Filter by certification name"
                  value={tempFilters.certificationNameSearch}
                  onChange={(e) => handleCertificationNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <MultiSelect
                  items={issuingBodyOptions}
                  selected={tempFilters.issuerIds.map(String)}
                  onChange={handleIssuerIdsChange}
                  placeholder="Filter by issuing body..."
                  label="Issuing Body"
                  searchPlaceholder="Search issuing bodies..."
                  maxDisplay={3}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Data Progress</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="certificationDataProgressMin" className="text-xs text-muted-foreground">
                    Minimum (%)
                  </Label>
                  <Input
                    id="certificationDataProgressMin"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    value={tempFilters.dataProgressMin}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setTempFilters((prev) => ({ ...prev, dataProgressMin: value }))
                        return
                      }
                      const n = parseFloat(value)
                      if (!Number.isNaN(n) && n >= 0 && n <= 100) {
                        setTempFilters((prev) => ({ ...prev, dataProgressMin: value }))
                      }
                    }}
                    className={dataProgressError ? "border-red-500" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificationDataProgressMax" className="text-xs text-muted-foreground">
                    Maximum (%)
                  </Label>
                  <Input
                    id="certificationDataProgressMax"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="100"
                    value={tempFilters.dataProgressMax}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setTempFilters((prev) => ({ ...prev, dataProgressMax: value }))
                        return
                      }
                      const n = parseFloat(value)
                      if (!Number.isNaN(n) && n >= 0 && n <= 100) {
                        setTempFilters((prev) => ({ ...prev, dataProgressMax: value }))
                      }
                    }}
                    className={dataProgressError ? "border-red-500" : ""}
                  />
                </div>
              </div>
              {dataProgressError && (
                <p className="text-xs text-red-500">{dataProgressError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Filter certifications by stored profile completion (`dataProgressPercentage`, 0–100%)
              </p>
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
