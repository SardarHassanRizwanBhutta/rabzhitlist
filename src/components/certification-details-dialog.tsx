"use client"

import { useEffect, useState } from "react"
import { Award, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { EntityAuditFields } from "@/components/entity-audit-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fetchCertificationDetail } from "@/lib/services/certifications-api"
import type { Certification, CertificationDetail } from "@/lib/types/certification"

export type CertificationDetailsDialogProps = {
  certification: Certification
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (certification: Certification) => void
}

function ReadOnlyDetailField({ label, value }: { label: string; value: string | null | undefined }) {
  const text = value?.trim() ?? ""
  const empty = text.length === 0
  return (
    <div className="py-2 px-3">
      <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
      <span className={empty ? "text-sm text-muted-foreground italic block" : "text-sm block"}>
        {empty ? "N/A" : text}
      </span>
    </div>
  )
}

export function CertificationDetailsDialog({
  certification,
  open,
  onOpenChange,
  onEdit,
}: CertificationDetailsDialogProps) {
  const [detail, setDetail] = useState<CertificationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setDetailLoading(false)
      return
    }

    let cancelled = false
    setDetail(null)
    setDetailLoading(true)

    fetchCertificationDetail(certification.id)
      .then((full) => {
        if (!cancelled) setDetail(full)
      })
      .catch((error) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Failed to load certification."
        toast.error(message === "Not found" ? "Certification not found." : message)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, certification.id])

  const shown = detail ?? certification

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] lg:max-w-[550px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Award className="h-5 w-5 text-amber-600" />
              {shown.name}
            </DialogTitle>
            {onEdit ? (
              <div className="flex gap-2 mr-8">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => {
                    onEdit(shown)
                    onOpenChange(false)
                  }}
                >
                  Edit
                </Button>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading certification details…
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="size-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  <ReadOnlyDetailField label="Name" value={shown.name} />
                  <ReadOnlyDetailField label="Issuing Body" value={shown.issuer?.name} />
                  <EntityAuditFields
                    createdBy={detail?.createdBy}
                    updatedBy={detail?.updatedBy}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
