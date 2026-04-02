"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"
import { CertificationsTable } from "@/components/certifications-table"
import { CertificationCreationDialog, CertificationFormData, CertificationVerificationState } from "@/components/certification-creation-dialog"
import { CertificationsFilterDialog, CertificationFilters } from "@/components/certifications-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Certification, CertificationIssuer } from "@/lib/types/certification"
import { fetchCertificationsPage, fetchCertificationIssuers, createCertification, updateCertification, deleteCertification } from "@/lib/services/certifications-api"
import { toast } from "sonner"

const DEFAULT_PAGE_SIZE = 20

export function CertificationsPageClient() {
  const searchParams = useSearchParams()
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<CertificationFilters>({
    certificationNameSearch: "",
    issuerIds: [],
  })

  const [items, setItems] = useState<Certification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [certificationsLoading, setCertificationsLoading] = useState(true)

  const [issuers, setIssuers] = useState<CertificationIssuer[]>([])
  const [issuersLoading, setIssuersLoading] = useState(true)

  const loadCertifications = useCallback(async (page: number, size: number) => {
    try {
      setCertificationsLoading(true)
      const data = await fetchCertificationsPage({
        name: filters.certificationNameSearch.trim() || undefined,
        issuerIds: filters.issuerIds.length > 0 ? filters.issuerIds : undefined,
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
      console.error("Failed to fetch certifications:", error)
      toast.error("Failed to load certifications.")
    } finally {
      setCertificationsLoading(false)
    }
  }, [filters.certificationNameSearch, filters.issuerIds])

  useEffect(() => {
    loadCertifications(pageNumber, pageSize)
  }, [loadCertifications, pageNumber, pageSize])

  useEffect(() => {
    let cancelled = false
    async function loadIssuers() {
      try {
        const data = await fetchCertificationIssuers()
        if (!cancelled) setIssuers(data)
      } catch (error) {
        console.error("Failed to fetch certification issuers:", error)
        if (!cancelled) toast.error("Failed to load certification issuers.")
      } finally {
        if (!cancelled) setIssuersLoading(false)
      }
    }
    loadIssuers()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const certificationFilterName = searchParams.get('certificationFilter')
    const certificationId = searchParams.get('certificationId')
    if (certificationFilterName && certificationId) {
      setFilters(prev => ({
        ...prev,
        certificationNameSearch: certificationFilterName,
      }))
    }
  }, [searchParams])

  const handleFiltersChange = (newFilters: CertificationFilters) => {
    setFilters(newFilters)
    setPageNumber(1)
  }

  const handlePageChange = (page: number) => {
    setPageNumber(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPageNumber(1)
  }

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [certificationToEdit, setCertificationToEdit] = useState<Certification | null>(null)

  const handleCertificationSubmit = async (data: CertificationFormData, verificationState?: CertificationVerificationState) => {
    if (certificationToEdit) {
      try {
        await updateCertification(certificationToEdit.id, {
          name: data.certificationName,
          issuerId: data.issuerId ?? null,
        })
        toast.success(`Certification "${data.certificationName}" has been updated${verificationState ? ' and verified' : ''} successfully.`)
        setEditDialogOpen(false)
        setCertificationToEdit(null)
        await loadCertifications(pageNumber, pageSize)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Not found') {
          toast.error('Certification not found.')
          setEditDialogOpen(false)
          setCertificationToEdit(null)
        } else {
          toast.error(message || 'Failed to update certification.')
        }
      }
    } else {
      await createCertification({
        name: data.certificationName,
        issuerId: data.issuerId!,
      })
      toast.success(`Certification "${data.certificationName}" has been created successfully.`)
      loadCertifications(pageNumber, pageSize)
    }
  }

  const handleEditCertification = (certification: Certification) => {
    setCertificationToEdit(certification)
    setEditDialogOpen(true)
  }

  const handleDeleteCertification = async (certification: Certification) => {
    try {
      await deleteCertification(certification.id)
      toast.success(`Certification "${certification.name}" has been deleted successfully.`)
      await loadCertifications(pageNumber, pageSize)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message === 'Not found') {
        toast.error('Certification not found.')
      } else {
        toast.error(message || 'Failed to delete certification.')
      }
      throw err
    }
  }

  const handleClearFilters = () => {
    setFilters({
      certificationNameSearch: "",
      issuerIds: [],
    })
    setPageNumber(1)
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
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            issuers={issuers}
          />
          <CertificationCreationDialog
            onSubmit={handleCertificationSubmit}
            issuers={issuers}
            issuersLoading={issuersLoading}
          />
        </div>
      </div>

      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}

      <CertificationsTable
        certifications={items}
        isLoading={certificationsLoading}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalPages={totalPages}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEditCertification}
        onDelete={handleDeleteCertification}
      />

      {certificationToEdit && (
        <CertificationCreationDialog
          mode="edit"
          certificationData={certificationToEdit}
          showVerification={true}
          onSubmit={handleCertificationSubmit}
          issuers={issuers}
          issuersLoading={issuersLoading}
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
