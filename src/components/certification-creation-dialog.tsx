"use client"

import * as React from "react"
import { useState, useRef, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react"
import { Certification, CertificationLevel, CERTIFICATION_LEVEL_LABELS } from "@/lib/types/certification"

// Form data interface
export interface CertificationFormData {
  certificationName: string
  issuingBody: string
  issuingBodyWebsite: string
  certificationLevel: CertificationLevel | ""
}

// Verification state export
export interface CertificationVerificationState {
  verifiedFields: Set<string>
  modifiedFields: Set<string>
}

type DialogMode = "create" | "edit"

interface CertificationCreationDialogProps {
  children?: React.ReactNode
  mode?: DialogMode
  certificationData?: Certification
  showVerification?: boolean
  onSubmit?: (data: CertificationFormData, verificationState?: CertificationVerificationState) => Promise<void> | void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  initialName?: string
}

const initialFormData: CertificationFormData = {
  certificationName: "",
  issuingBody: "",
  issuingBodyWebsite: "",
  certificationLevel: "",
}

// Level options
const levelOptions = Object.entries(CERTIFICATION_LEVEL_LABELS).map(([value, label]) => ({
  value: value as CertificationLevel,
  label
}))

// Helper function to convert Certification to CertificationFormData
const certificationToFormData = (certification: Certification): CertificationFormData => {
  return {
    certificationName: certification.certificationName || "",
    issuingBody: certification.issuingBody || "",
    issuingBodyWebsite: (certification as unknown as { issuingBodyWebsite?: string }).issuingBodyWebsite || "",
    certificationLevel: certification.certificationLevel || "",
  }
}

// All verifiable fields for certifications
const CERTIFICATION_VERIFICATION_FIELDS = [
  'certificationName', 'issuingBody', 'issuingBodyWebsite', 'certificationLevel'
]

export function CertificationCreationDialog({
  children,
  mode = "create",
  certificationData,
  showVerification = false,
  onSubmit,
  onOpenChange,
  open: controlledOpen,
  initialName,
}: CertificationCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CertificationFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof CertificationFormData, string>>>({})
  const initialFormDataRef = useRef<CertificationFormData | null>(null)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  
  // Verification state
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set())
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic-info"])
  )

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  // Reset form when dialog opens/closes or mode/certificationData changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && certificationData) {
        const formDataFromCertification = certificationToFormData(certificationData)
        setFormData(formDataFromCertification)
        initialFormDataRef.current = formDataFromCertification
      } else {
        // In create mode, check for initialName prop
        const formDataToUse = initialName 
          ? { ...initialFormData, certificationName: initialName }
          : initialFormData
        setFormData(formDataToUse)
        initialFormDataRef.current = formDataToUse
      }
      setErrors({})
      setModifiedFields(new Set())
      
      // Reset verified fields if not in verification mode
      if (!showVerification) {
        setVerifiedFields(new Set())
      }
    } else {
      // Reset form when dialog closes
      setFormData(initialFormData)
      setErrors({})
      initialFormDataRef.current = null
      setModifiedFields(new Set())
      if (!showVerification) {
        setVerifiedFields(new Set())
      }
    }
  }, [open, mode, certificationData, showVerification, initialName])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!showVerification) return false
    return modifiedFields.size > 0 || verifiedFields.size > 0
  }, [showVerification, modifiedFields, verifiedFields])

  // Handle close with unsaved changes check
  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setOpen(newOpen)
  }

  const handleInputChange = (field: keyof CertificationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Track modifications and auto-verify in verification mode
    if (showVerification) {
      setModifiedFields(prev => new Set(prev).add(field))
      setVerifiedFields(prev => new Set(prev).add(field))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Toggle verification checkbox
  const handleVerificationToggle = (fieldName: string, checked: boolean) => {
    setVerifiedFields(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(fieldName)
      } else {
        newSet.delete(fieldName)
      }
      return newSet
    })
  }

  // Calculate section progress
  const calculateSectionProgress = (fieldNames: string[]): { percentage: number; verified: number; total: number } => {
    let verified = 0
    const total = fieldNames.length

    fieldNames.forEach(fieldName => {
      if (verifiedFields.has(fieldName)) {
        verified++
      }
    })

    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0
    return { percentage, verified, total }
  }

  // Get progress color
  const getProgressColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-500 hover:bg-green-600'
    if (percentage >= 70) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-red-500 hover:bg-red-600'
  }

  // Section progress badge component
  const SectionProgressBadge = ({ 
    percentage, 
    verified, 
    total 
  }: { 
    percentage: number
    verified: number
    total: number 
  }) => {
    if (total === 0) return null

    return (
      <Badge 
        variant="default" 
        className={`${getProgressColor(percentage)} text-white text-xs font-medium`}
      >
        {percentage}% verified ({verified}/{total})
      </Badge>
    )
  }

  // Section progress calculations
  const basicInfoProgress = useMemo(() => 
    calculateSectionProgress(['certificationName', 'issuingBody', 'issuingBodyWebsite', 'certificationLevel']),
    [verifiedFields]
  )

  // Overall verification progress
  const verificationProgress = useMemo(() => {
    const totalFields = CERTIFICATION_VERIFICATION_FIELDS.length
    const verifiedCount = verifiedFields.size
    return Math.round((verifiedCount / totalFields) * 100)
  }, [verifiedFields])

  // Helper to get field names for a section
  const getSectionFieldNames = (sectionId: string): string[] => {
    const fieldMap: Record<string, string[]> = {
      'basic-info': ['certificationName', 'issuingBody', 'issuingBodyWebsite', 'certificationLevel'],
    }
    return fieldMap[sectionId] || []
  }

  // Check if all fields in a section are verified
  const isSectionFullyVerified = (sectionId: string): boolean => {
    const sectionFields = getSectionFieldNames(sectionId)
    if (sectionFields.length === 0) return false
    return sectionFields.every(fieldName => verifiedFields.has(fieldName))
  }

  // Handle verify all for a section
  const handleVerifyAllSection = (sectionId: string, checked: boolean) => {
    const sectionFields = getSectionFieldNames(sectionId)
    setVerifiedFields(prev => {
      const newSet = new Set(prev)
      sectionFields.forEach(fieldName => {
        if (checked) {
          newSet.add(fieldName)
        } else {
          newSet.delete(fieldName)
        }
      })
      return newSet
    })
    // Also mark fields as modified when verifying
    if (checked) {
      setModifiedFields(prev => {
        const newSet = new Set(prev)
        sectionFields.forEach(fieldName => newSet.add(fieldName))
        return newSet
      })
    }
  }

  // Verification checkbox component
  const VerificationCheckbox = ({ 
    fieldName, 
    label 
  }: { 
    fieldName: string
    label?: string 
  }) => {
    if (!showVerification) return null
    
    const isChecked = verifiedFields.has(fieldName)
    const isModified = modifiedFields.has(fieldName)
    
    return (
      <div className="flex items-center gap-1.5">
        <Checkbox
          id={`verify-${fieldName}`}
          checked={isChecked}
          onCheckedChange={(checked) => handleVerificationToggle(fieldName, checked === true)}
          className="h-4 w-4"
        />
        <Label 
          htmlFor={`verify-${fieldName}`} 
          className={`text-xs cursor-pointer ${isChecked ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
        >
          {isChecked ? '✓ Mark as verified' : 'Mark as verified'}
        </Label>
      </div>
    )
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
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

    // URL validation for issuing body website
    if (formData.issuingBodyWebsite.trim()) {
      try {
        new URL(formData.issuingBodyWebsite.trim())
      } catch {
        newErrors.issuingBodyWebsite = "Please enter a valid URL (e.g., https://example.com)"
      }
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
      // Include verification state if in verification mode
      const verificationState: CertificationVerificationState | undefined = showVerification 
        ? { verifiedFields, modifiedFields }
        : undefined
        
      await onSubmit?.(formData, verificationState)
      setFormData(initialFormData)
      setErrors({})
      setVerifiedFields(new Set())
      setModifiedFields(new Set())
      setOpen(false)
    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} certification:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setFormData(initialFormData)
    setErrors({})
    setVerifiedFields(new Set())
    setModifiedFields(new Set())
    setOpen(false)
  }

  const handleDiscardChanges = () => {
    setShowUnsavedWarning(false)
    setFormData(initialFormData)
    setErrors({})
    setVerifiedFields(new Set())
    setModifiedFields(new Set())
    setOpen(false)
  }

  // Get dialog title based on mode and verification
  const getDialogTitle = () => {
    if (showVerification) {
      return "Verify Certification"
    }
    return mode === "edit" ? "Edit Certification" : "Create New Certification"
  }

  // Get submit button text based on mode and verification
  const getSubmitButtonText = () => {
    if (isLoading) {
      if (showVerification) return "Saving & Verifying..."
      return mode === "edit" ? "Updating..." : "Creating..."
    }
    if (showVerification) return "Update & Verify"
    return mode === "edit" ? "Update Certification" : "Create Certification"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        {mode === "create" && !showVerification && controlledOpen === undefined && (
          <DialogTrigger asChild>
            {children || (
              <Button className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Certification
              </Button>
            )}
          </DialogTrigger>
        )}
        
        <DialogContent className="sm:max-w-[500px] lg:max-w-[550px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {showVerification && <ShieldCheck className="size-5 text-primary" />}
                {getDialogTitle()}
              </DialogTitle>
            </div>
            
            {/* Verification Progress Bar */}
            {showVerification && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Verification Progress</span>
                  <Badge variant={verificationProgress === 100 ? 'default' : 'secondary'}>
                    {verificationProgress}% Complete ({verifiedFields.size}/{CERTIFICATION_VERIFICATION_FIELDS.length} fields)
                  </Badge>
                </div>
                <Progress value={verificationProgress} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{verifiedFields.size} verified</span>
                  <span>{CERTIFICATION_VERIFICATION_FIELDS.length - verifiedFields.size} remaining</span>
                  {modifiedFields.size > 0 && (
                    <span className="text-blue-600">{modifiedFields.size} modified</span>
                  )}
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4" id="certification-form">
              
              {/* Basic Information Section */}
              <Collapsible 
                open={expandedSections.has("basic-info")} 
                onOpenChange={() => toggleSection("basic-info")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Basic Information
                          {showVerification && (
                            <SectionProgressBadge 
                              percentage={basicInfoProgress.percentage}
                              verified={basicInfoProgress.verified}
                              total={basicInfoProgress.total}
                            />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {showVerification && (
                            <div 
                              className="flex items-center gap-2" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                id="verify-all-basic-info"
                                checked={isSectionFullyVerified("basic-info")}
                                onCheckedChange={(checked) => handleVerifyAllSection("basic-info", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label 
                                htmlFor="verify-all-basic-info" 
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("basic-info") ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
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
                        {errors.certificationName ? (
                          <p className="text-sm text-red-500">{errors.certificationName}</p>
                        ) : null}
                        {showVerification && (
                          <VerificationCheckbox fieldName="certificationName" />
                        )}
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
                        {errors.issuingBody ? (
                          <p className="text-sm text-red-500">{errors.issuingBody}</p>
                        ) : null}
                        {showVerification && (
                          <VerificationCheckbox fieldName="issuingBody" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          Organization that issues this certification
                        </p>
                      </div>

                      {/* Issuing Body Website */}
                      <div className="space-y-2">
                        <Label htmlFor="issuingBodyWebsite">Issuing Body Website</Label>
                        <Input
                          id="issuingBodyWebsite"
                          type="url"
                          placeholder="https://aws.amazon.com"
                          value={formData.issuingBodyWebsite}
                          onChange={(e) => handleInputChange("issuingBodyWebsite", e.target.value)}
                          className={errors.issuingBodyWebsite ? "border-red-500" : ""}
                        />
                        {errors.issuingBodyWebsite ? (
                          <p className="text-sm text-red-500">{errors.issuingBodyWebsite}</p>
                        ) : null}
                        {showVerification && (
                          <VerificationCheckbox fieldName="issuingBodyWebsite" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          Website URL of the issuing body for verification purposes
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
                        {errors.certificationLevel ? (
                          <p className="text-sm text-red-500">{errors.certificationLevel}</p>
                        ) : null}
                        {showVerification && (
                          <VerificationCheckbox fieldName="certificationLevel" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          Foundation → Associate → Professional → Expert → Master
                        </p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

            </form>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="transition-all duration-150 ease-in-out hover:bg-accent hover:text-accent-foreground hover:border-accent cursor-pointer"
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
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved verification changes. Are you sure you want to close without saving?
              {modifiedFields.size > 0 && (
                <span className="block mt-2 text-sm">
                  <strong>{modifiedFields.size}</strong> field(s) modified
                </span>
              )}
              {verifiedFields.size > 0 && (
                <span className="block mt-1 text-sm">
                  <strong>{verifiedFields.size}</strong> field(s) marked as verified
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Continue Editing</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscardChanges}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
