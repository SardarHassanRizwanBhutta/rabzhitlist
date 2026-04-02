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
    filters.issuerIds.length

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleCertificationNameChange = (value: string) => {
    setTempFilters(prev => ({ ...prev, certificationNameSearch: value }))
  }

  const handleIssuerIdsChange = (values: string[]) => {
    setTempFilters(prev => ({ ...prev, issuerIds: values.map(Number) }))
  }

  const handleApplyFilters = () => {
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
    tempFilters.issuerIds.length > 0

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
