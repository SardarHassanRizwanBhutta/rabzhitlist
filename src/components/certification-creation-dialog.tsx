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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import { CertificationLevel, CERTIFICATION_LEVEL_LABELS } from "@/lib/types/certification"

// Form data interface
export interface CertificationFormData {
  certificationName: string
  issuingBody: string
  certificationLevel: CertificationLevel | ""
}

interface CertificationCreationDialogProps {
  children?: React.ReactNode
  onSubmit?: (data: CertificationFormData) => Promise<void> | void
}

const initialFormData: CertificationFormData = {
  certificationName: "",
  issuingBody: "",
  certificationLevel: "",
}

// Level options
const levelOptions = Object.entries(CERTIFICATION_LEVEL_LABELS).map(([value, label]) => ({
  value: value as CertificationLevel,
  label
}))

export function CertificationCreationDialog({
  children,
  onSubmit,
}: CertificationCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CertificationFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof CertificationFormData, string>>>({})

  const handleInputChange = (field: keyof CertificationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CertificationFormData, string>> = {}

    // Required field validation
    if (!formData.certificationName.trim()) {
      newErrors.certificationName = "Certification name is required"
    }

    if (!formData.issuingBody.trim()) {
      newErrors.issuingBody = "Issuing body is required"
    }

    if (!formData.certificationLevel) {
      newErrors.certificationLevel = "Certification level is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSubmit?.(formData)
      setFormData(initialFormData)
      setErrors({})
      setOpen(false)
    } catch (error) {
      console.error("Error creating certification:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setErrors({})
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer">
            <Plus className="h-4 w-4" />
            Create Certification
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] lg:max-w-[550px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Create New Certification</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6" id="certification-form">
            {/* Certification Name */}
            <div className="space-y-2">
              <Label htmlFor="certificationName">Certification Name *</Label>
              <Input
                id="certificationName"
                type="text"
                placeholder="AWS Certified Solutions Architect"
                value={formData.certificationName}
                onChange={(e) => handleInputChange("certificationName", e.target.value)}
                className={errors.certificationName ? "border-red-500" : ""}
              />
              {errors.certificationName && <p className="text-sm text-red-500">{errors.certificationName}</p>}
            </div>

            {/* Issuing Body */}
            <div className="space-y-2">
              <Label htmlFor="issuingBody">Issuing Body *</Label>
              <Input
                id="issuingBody"
                type="text"
                placeholder="Amazon Web Services"
                value={formData.issuingBody}
                onChange={(e) => handleInputChange("issuingBody", e.target.value)}
                className={errors.issuingBody ? "border-red-500" : ""}
              />
              {errors.issuingBody && <p className="text-sm text-red-500">{errors.issuingBody}</p>}
              <p className="text-xs text-muted-foreground">
                Organization that issues this certification
              </p>
            </div>

            {/* Certification Level */}
            <div className="space-y-2">
              <Label htmlFor="level">Certification Level *</Label>
              <Select
                value={formData.certificationLevel}
                onValueChange={(value: CertificationLevel) => handleInputChange("certificationLevel", value)}
              >
                <SelectTrigger className={errors.certificationLevel ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select certification level" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.certificationLevel && <p className="text-sm text-red-500">{errors.certificationLevel}</p>}
              <p className="text-xs text-muted-foreground">
                Foundation → Associate → Professional → Expert → Master
              </p>
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="certification-form"
            disabled={isLoading}
            className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Create Certification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
