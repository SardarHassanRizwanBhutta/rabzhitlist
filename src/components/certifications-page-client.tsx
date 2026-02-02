"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"
import { CertificationsTable } from "@/components/certifications-table"
import { CertificationCreationDialog, CertificationFormData, CertificationVerificationState } from "@/components/certification-creation-dialog"
import { CertificationsFilterDialog, CertificationFilters } from "@/components/certifications-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Certification } from "@/lib/types/certification"
import { toast } from "sonner"

interface CertificationsPageClientProps {
  certifications: Certification[]
}

export function CertificationsPageClient({ certifications }: CertificationsPageClientProps) {
  const searchParams = useSearchParams()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<CertificationFilters>({
    certificationNames: [],
    issuingBodies: [],
    certificationLevels: [],
  })

  // Check for URL filters
  useEffect(() => {
    const certificationFilterName = searchParams.get('certificationFilter')
    const certificationId = searchParams.get('certificationId')
    
    if (certificationFilterName && certificationId) {
      // Apply certification filter
      setFilters(prev => ({
        ...prev,
        certificationNames: [certificationFilterName]
      }))
    }
  }, [searchParams])

  // Apply global filters and local filters to certifications
  const filteredCertifications = useMemo(() => {
    let filtered = certifications

    // Apply global filters (limited filtering for certifications)
    if (hasGlobalFilters) {
      // Note: Certifications have limited global filter applicability
      // Only status filter would apply if certifications had status field
    }

    // Apply local filters
    if (filters.certificationNames.length > 0) {
      filtered = filtered.filter(cert =>
        filters.certificationNames.includes(cert.certificationName)
      )
    }

    if (filters.issuingBodies.length > 0) {
      filtered = filtered.filter(cert =>
        cert.issuingBody !== null && filters.issuingBodies.includes(cert.issuingBody)
      )
    }

    if (filters.certificationLevels.length > 0) {
      filtered = filtered.filter(cert =>
        filters.certificationLevels.includes(cert.certificationLevel)
      )
    }

    return filtered
  }, [certifications, globalFilters, hasGlobalFilters, filters])

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [certificationToEdit, setCertificationToEdit] = useState<Certification | null>(null)

  const handleCertificationSubmit = async (data: CertificationFormData, verificationState?: CertificationVerificationState) => {
    // Here you would typically send the data to your API
    console.log("Certification data:", data)
    if (verificationState) {
      console.log("Verification state:", {
        verifiedFields: Array.from(verificationState.verifiedFields),
        modifiedFields: Array.from(verificationState.modifiedFields)
      })
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // You could add/update the certification to your state/cache here
    if (certificationToEdit) {
      toast.success(`Certification "${data.certificationName}" has been updated${verificationState ? ' and verified' : ''} successfully.`)
      setEditDialogOpen(false)
      setCertificationToEdit(null)
    } else {
      toast.success(`Certification "${data.certificationName}" has been created successfully.`)
    }
  }

  const handleEditCertification = (certification: Certification) => {
    setCertificationToEdit(certification)
    setEditDialogOpen(true)
  }

  const handleDeleteCertification = async (certification: Certification) => {
    // Here you would typically send the delete request to your API
    console.log("Delete certification:", certification.id)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast.success(`Certification "${certification.certificationName}" has been deleted successfully.`)
  }

  const handleClearFilters = () => {
    setFilters({
      certificationNames: [],
      issuingBodies: [],
      certificationLevels: [],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Certifications</h2>
        </div>
        <div className="flex items-center gap-2">
          <CertificationsFilterDialog
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
          />
          <CertificationCreationDialog onSubmit={handleCertificationSubmit} />
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
      
      <CertificationsTable
        certifications={filteredCertifications}
        onEdit={handleEditCertification}
        onDelete={handleDeleteCertification}
      />

      {/* Edit Certification Dialog */}
      {certificationToEdit && (
        <CertificationCreationDialog
          mode="edit"
          certificationData={certificationToEdit}
          showVerification={true}
          onSubmit={handleCertificationSubmit}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setCertificationToEdit(null)
            }
          }}
        />
      )}
    </div>
  )
}
