"use client"

import { useMemo } from "react"
import { Globe } from "lucide-react"
import { CertificationsTable } from "@/components/certifications-table"
import { CertificationCreationDialog, CertificationFormData } from "@/components/certification-creation-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Certification } from "@/lib/types/certification"

interface CertificationsPageClientProps {
  certifications: Certification[]
}

export function CertificationsPageClient({ certifications }: CertificationsPageClientProps) {
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()

  // Apply global filters to certifications (limited filtering for certifications)
  const filteredCertifications = useMemo(() => {
    if (!hasGlobalFilters) return certifications

    // Note: Certifications have limited global filter applicability
    // Only status filter would apply if certifications had status field
    return certifications
  }, [certifications, globalFilters, hasGlobalFilters])

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Certifications</h2>
          <p className="text-muted-foreground">
            Manage professional certifications and achievements
          </p>
        </div>
        <CertificationCreationDialog onSubmit={handleCertificationSubmit} />
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
