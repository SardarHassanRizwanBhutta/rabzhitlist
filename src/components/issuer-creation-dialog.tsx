"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface IssuerFormData {
  name: string
  websiteUrl: string
}

interface IssuerCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: IssuerFormData) => Promise<void> | void
  initialName?: string
}

const initialFormData: IssuerFormData = {
  name: "",
  websiteUrl: "",
}

export function IssuerCreationDialog({
  open,
  onOpenChange,
  onSubmit,
  initialName,
}: IssuerCreationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<IssuerFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof IssuerFormData, string>>>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const data = initialName
        ? { ...initialFormData, name: initialName }
        : initialFormData
      setFormData(data)
      setErrors({})
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [open, initialName])

  const handleInputChange = (field: keyof IssuerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof IssuerFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Issuer name is required"
    }

    if (formData.websiteUrl.trim()) {
      try {
        new URL(formData.websiteUrl.trim())
      } catch {
        newErrors.websiteUrl = "Please enter a valid URL (e.g., https://example.com)"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      await onSubmit(formData)
      setFormData(initialFormData)
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating issuer:", error)
      toast.error("Failed to create issuer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Create New Issuer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" id="issuer-form">
          <div className="space-y-2">
            <Label htmlFor="issuerName">Issuer Name *</Label>
            <Input
              ref={nameInputRef}
              id="issuerName"
              type="text"
              placeholder="e.g., Amazon Web Services, Coursera"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuerWebsite">Website URL</Label>
            <Input
              id="issuerWebsite"
              type="url"
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
              className={errors.websiteUrl ? "border-red-500" : ""}
            />
            {errors.websiteUrl && (
              <p className="text-sm text-red-500">{errors.websiteUrl}</p>
            )}
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="issuer-form"
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Create Issuer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
