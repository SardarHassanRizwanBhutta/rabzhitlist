"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"
import { CertificationsTable } from "@/components/certifications-table"
import { CertificationCreationDialog, CertificationFormData } from "@/components/certification-creation-dialog"
import { CertificationsFilterDialog, CertificationFilters } from "@/components/certifications-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Certification } from "@/lib/types/certification"

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

  const handleCertificationSubmit = async (data: CertificationFormData) => {
    // Here you would typically send the data to your API
    console.log("New certification data:", data)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // You could add the certification to your state/cache here
    alert("Certification created successfully!")
  }

  const handleViewCertification = (certification: Certification) => {
    // TODO: Implement view certification functionality
    alert(`View certification: ${certification.certificationName}`)
  }

  const handleEditCertification = (certification: Certification) => {
    // TODO: Implement edit certification functionality
    alert(`Edit certification: ${certification.certificationName}`)
  }

  const handleDeleteCertification = (certification: Certification) => {
    // TODO: Implement delete certification functionality
    const confirmDelete = confirm(`Are you sure you want to delete "${certification.certificationName}"?`)
    if (confirmDelete) {
      alert(`Delete certification: ${certification.certificationName}`)
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Certifications</h2>
          <p className="text-muted-foreground">
            Manage professional certifications and achievements
          </p>
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
        onView={handleViewCertification}
        onEdit={handleEditCertification}
        onDelete={handleDeleteCertification}
      />
    </div>
  )
}
