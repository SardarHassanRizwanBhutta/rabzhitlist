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
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { CertificationLevel, CERTIFICATION_LEVEL_LABELS } from "@/lib/types/certification"

// Filter interfaces
export interface CertificationFilters {
  certificationNames: string[]
  issuingBodies: string[]
  certificationLevels: CertificationLevel[]
}

interface CertificationsFilterDialogProps {
  children?: React.ReactNode
  filters: CertificationFilters
  onFiltersChange: (filters: CertificationFilters) => void
  onClearFilters: () => void
}

// Extract unique values from certification data
const extractUniqueCertificationNames = (): string[] => {
  const names = new Set<string>()
  sampleCertifications.forEach(certification => {
    names.add(certification.certificationName)
  })
  return Array.from(names).sort()
}

const extractUniqueIssuingBodies = (): string[] => {
  const bodies = new Set<string>()
  sampleCertifications.forEach(certification => {
    if (certification.issuingBody !== null) {
      bodies.add(certification.issuingBody)
    }
  })
  return Array.from(bodies).sort()
}

const extractUniqueCertificationLevels = (): CertificationLevel[] => {
  const levels = new Set<CertificationLevel>()
  sampleCertifications.forEach(certification => {
    levels.add(certification.certificationLevel)
  })
  return Array.from(levels).sort()
}

// Filter options
const certificationNameOptions: MultiSelectOption[] = extractUniqueCertificationNames().map(name => ({
  value: name,
  label: name
}))

const issuingBodyOptions: MultiSelectOption[] = extractUniqueIssuingBodies().map(body => ({
  value: body,
  label: body
}))

const certificationLevelOptions: MultiSelectOption[] = extractUniqueCertificationLevels().map(level => ({
  value: level,
  label: CERTIFICATION_LEVEL_LABELS[level]
}))

const initialFilters: CertificationFilters = {
  certificationNames: [],
  issuingBodies: [],
  certificationLevels: [],
}

export function CertificationsFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
}: CertificationsFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<CertificationFilters>(filters)

  // Calculate active filter count
  const activeFilterCount = 
    filters.certificationNames.length +
    filters.issuingBodies.length +
    filters.certificationLevels.length

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof CertificationFilters, value: string[]) => {
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
    tempFilters.certificationNames.length > 0 ||
    tempFilters.issuingBodies.length > 0 ||
    tempFilters.certificationLevels.length > 0

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
          <div className="space-y-6">
            <div className="space-y-4">
              <MultiSelect
                items={certificationNameOptions}
                selected={tempFilters.certificationNames}
                onChange={(values) => handleFilterChange("certificationNames", values)}
                placeholder="Filter by certification name..."
                label="Certification Name"
                searchPlaceholder="Search certifications..."
                maxDisplay={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={issuingBodyOptions}
                  selected={tempFilters.issuingBodies}
                  onChange={(values) => handleFilterChange("issuingBodies", values)}
                  placeholder="Filter by issuing body..."
                  label="Issuing Body"
                  searchPlaceholder="Search issuing bodies..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={certificationLevelOptions}
                  selected={tempFilters.certificationLevels}
                  onChange={(values) => handleFilterChange("certificationLevels", values)}
                  placeholder="Filter by level..."
                  label="Certification Level"
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

