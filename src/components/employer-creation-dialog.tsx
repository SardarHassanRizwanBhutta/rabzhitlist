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
import { Loader2, Plus, Building2, MapPin, Trash2, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react"
import { Employer, EmployerStatus, SalaryPolicy, EMPLOYER_STATUS_LABELS, SALARY_POLICY_LABELS } from "@/lib/types/employer"

// Form data interfaces
export interface EmployerLocationFormData {
  id: string
  country: string
  city: string
  address: string
  isHeadquarters: boolean
  salaryPolicy: SalaryPolicy | ""
  minSize: string
  maxSize: string
}

export interface EmployerFormData {
  name: string
  websiteUrl: string
  linkedinUrl: string
  status: EmployerStatus | ""
  foundedYear: string
  locations: EmployerLocationFormData[]
}

// Verification state export
export interface EmployerVerificationState {
  verifiedFields: Set<string>
  modifiedFields: Set<string>
}

type DialogMode = "create" | "edit"

interface EmployerCreationDialogProps {
  children?: React.ReactNode
  mode?: DialogMode
  employerData?: Employer
  showVerification?: boolean
  onSubmit?: (data: EmployerFormData, verificationState?: EmployerVerificationState) => Promise<void> | void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  initialName?: string  // For pre-filling employer name in create mode
}

const createEmptyLocation = (): EmployerLocationFormData => ({
  id: crypto.randomUUID(),
  country: "",
  city: "",
  address: "",
  isHeadquarters: false,
  salaryPolicy: "",
  minSize: "",
  maxSize: "",
})

const initialFormData: EmployerFormData = {
  name: "",
  websiteUrl: "",
  linkedinUrl: "",
  status: "",
  foundedYear: "",
  locations: [createEmptyLocation()], // Start with one location
}

// Status options
const statusOptions = Object.entries(EMPLOYER_STATUS_LABELS).map(([value, label]) => ({
  value: value as EmployerStatus,
  label
}))

// Salary policy options
const salaryPolicyOptions = Object.entries(SALARY_POLICY_LABELS).map(([value, label]) => ({
  value: value as SalaryPolicy,
  label
}))

// Helper function to convert Employer to EmployerFormData
const employerToFormData = (employer: Employer): EmployerFormData => {
  return {
    name: employer.name || "",
    websiteUrl: employer.websiteUrl || "",
    linkedinUrl: employer.linkedinUrl || "",
    status: employer.status || "",
    foundedYear: employer.foundedYear?.toString() || "",
    locations: employer.locations.map(loc => ({
      id: loc.id,
      country: loc.country || "",
      city: loc.city || "",
      address: loc.address || "",
      isHeadquarters: loc.isHeadquarters,
      salaryPolicy: loc.salaryPolicy || "",
      minSize: loc.minSize?.toString() || "",
      maxSize: loc.maxSize?.toString() || "",
    }))
  }
}

// All verifiable fields for employers
const EMPLOYER_VERIFICATION_FIELDS = [
  'name', 'status', 'foundedYear', 'websiteUrl', 'linkedinUrl'
]

// Location fields (dynamic based on number of locations)
const getLocationFieldNames = (locationIndex: number): string[] => {
  return [
    `locations[${locationIndex}].country`,
    `locations[${locationIndex}].city`,
    `locations[${locationIndex}].address`,
    `locations[${locationIndex}].salaryPolicy`,
    `locations[${locationIndex}].minSize`,
    `locations[${locationIndex}].maxSize`,
    `locations[${locationIndex}].isHeadquarters`
  ]
}

export function EmployerCreationDialog({
  children,
  mode = "create",
  employerData,
  showVerification = false,
  onSubmit,
  onOpenChange,
  open: controlledOpen,
  initialName,
}: EmployerCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EmployerFormData>(initialFormData)
  const [errors, setErrors] = useState<{
    employer?: Partial<Record<keyof Omit<EmployerFormData, 'locations'>, string>>
    locations?: { [index: number]: Partial<Record<keyof EmployerLocationFormData, string>> }
  }>({})
  const initialFormDataRef = useRef<EmployerFormData | null>(null)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  
  // Verification state
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set())
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic-info", "locations"])
  )

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  // Reset form when dialog opens/closes or mode/employerData changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && employerData) {
        const formDataFromEmployer = employerToFormData(employerData)
        setFormData(formDataFromEmployer)
        initialFormDataRef.current = formDataFromEmployer
      } else {
        const initialData = initialName 
          ? { ...initialFormData, name: initialName }
          : initialFormData
        setFormData(initialData)
        initialFormDataRef.current = initialData
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
  }, [open, mode, employerData, showVerification, initialName])

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

  const handleInputChange = (field: keyof Omit<EmployerFormData, 'locations'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Track modifications and auto-verify in verification mode
    if (showVerification) {
      setModifiedFields(prev => new Set(prev).add(field))
      setVerifiedFields(prev => new Set(prev).add(field))
    }
    
    // Clear error when user starts typing
    if (errors.employer?.[field]) {
      setErrors(prev => ({ 
        ...prev, 
        employer: { ...prev.employer, [field]: undefined }
      }))
    }
  }

  const handleLocationChange = (
    index: number,
    field: keyof EmployerLocationFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, i) => {
        if (i === index) {
          // If setting this location as headquarters, unset others
          if (field === "isHeadquarters" && value === true) {
            return { ...location, [field]: value }
          }
          return { ...location, [field]: value }
        }
        // If setting headquarters, unset all other headquarters
        if (field === "isHeadquarters" && value === true) {
          return { ...location, isHeadquarters: false }
        }
        return location
      })
    }))
    
    // Track modifications and auto-verify in verification mode
    if (showVerification) {
      const fieldPath = `locations[${index}].${field}`
      setModifiedFields(prev => new Set(prev).add(fieldPath))
      setVerifiedFields(prev => new Set(prev).add(fieldPath))
    }
    
    // Clear error when user starts typing
    if (errors.locations?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        locations: {
          ...prev.locations,
          [index]: {
            ...prev.locations?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, createEmptyLocation()]
    }))
  }

  const removeLocation = (index: number) => {
    if (formData.locations.length > 1) {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter((_, i) => i !== index)
      }))
      
      // Clear errors for removed location
      if (errors.locations?.[index]) {
        const newLocationErrors = { ...errors.locations }
        delete newLocationErrors[index]
        setErrors(prev => ({
          ...prev,
          locations: newLocationErrors
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const employerErrors: Partial<Record<keyof Omit<EmployerFormData, 'locations'>, string>> = {}
    const locationErrors: { [index: number]: Partial<Record<keyof EmployerLocationFormData, string>> } = {}

    // Employer validation
    if (!formData.name.trim()) employerErrors.name = "Employer name is required"
    if (!formData.status) employerErrors.status = "Status is required"
    if (!formData.foundedYear.trim()) {
      employerErrors.foundedYear = "Founded year is required"
    } else if (!/^\d{4}$/.test(formData.foundedYear) || parseInt(formData.foundedYear) < 1800 || parseInt(formData.foundedYear) > new Date().getFullYear()) {
      employerErrors.foundedYear = "Please enter a valid year (e.g., 2019)"
    }
    
    // URL validations
    if (formData.websiteUrl && !formData.websiteUrl.startsWith('http')) {
      employerErrors.websiteUrl = "Website URL must start with http:// or https://"
    }
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith('http')) {
      employerErrors.linkedinUrl = "LinkedIn URL must start with http:// or https://"
    }

    // Location validation
    const hasHeadquarters = formData.locations.some(loc => loc.isHeadquarters)
    
    formData.locations.forEach((location, index) => {
      const locErrors: Partial<Record<keyof EmployerLocationFormData, string>> = {}
      
      if (!location.country.trim()) locErrors.country = "Country is required"
      if (!location.city.trim()) locErrors.city = "City is required"
      if (!location.address.trim()) locErrors.address = "Address is required"
      if (!location.salaryPolicy) locErrors.salaryPolicy = "Salary policy is required"
      
      // Employee count validation
      if (!location.minSize.trim()) {
        locErrors.minSize = "Minimum employees is required"
      } else {
        const minSizeNum = parseInt(location.minSize)
        if (isNaN(minSizeNum) || minSizeNum <= 0) {
          locErrors.minSize = "Minimum employees must be a positive number"
        }
      }
      
      if (!location.maxSize.trim()) {
        locErrors.maxSize = "Maximum employees is required"
      } else {
        const maxSizeNum = parseInt(location.maxSize)
        const minSizeNum = parseInt(location.minSize)
        if (isNaN(maxSizeNum) || maxSizeNum <= 0) {
          locErrors.maxSize = "Maximum employees must be a positive number"
        } else if (!isNaN(minSizeNum) && maxSizeNum < minSizeNum) {
          locErrors.maxSize = "Maximum employees must be greater than or equal to minimum employees"
        }
      }
      
      if (Object.keys(locErrors).length > 0) {
        locationErrors[index] = locErrors
      }
    })

    // Check for headquarters requirement
    if (!hasHeadquarters && formData.locations.length > 0) {
      if (!locationErrors[0]) locationErrors[0] = {}
      locationErrors[0].isHeadquarters = "At least one location must be designated as headquarters"
    }

    const newErrors = {
      employer: Object.keys(employerErrors).length > 0 ? employerErrors : undefined,
      locations: Object.keys(locationErrors).length > 0 ? locationErrors : undefined,
    }

    setErrors(newErrors)
    return !newErrors.employer && !newErrors.locations
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
    calculateSectionProgress(EMPLOYER_VERIFICATION_FIELDS),
    [verifiedFields]
  )

  const locationsProgress = useMemo(() => {
    let total = 0
    let verified = 0
    
    formData.locations.forEach((_, idx) => {
      const locationFields = getLocationFieldNames(idx)
      locationFields.forEach(fieldName => {
        total++
        if (verifiedFields.has(fieldName)) verified++
      })
    })
    
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [verifiedFields, formData.locations])

  // Overall verification progress
  const verificationProgress = useMemo(() => {
    let total = EMPLOYER_VERIFICATION_FIELDS.length
    let verified = 0
    
    // Count employer fields
    EMPLOYER_VERIFICATION_FIELDS.forEach(field => {
      if (verifiedFields.has(field)) verified++
    })
    
    // Count location fields
    formData.locations.forEach((_, idx) => {
      const locationFields = getLocationFieldNames(idx)
      total += locationFields.length
      locationFields.forEach(fieldName => {
        if (verifiedFields.has(fieldName)) verified++
      })
    })
    
    return total > 0 ? Math.round((verified / total) * 100) : 0
  }, [verifiedFields, formData.locations])

  // Helper to get field names for a section
  const getSectionFieldNames = (sectionId: string): string[] => {
    if (sectionId === 'basic-info') {
      return EMPLOYER_VERIFICATION_FIELDS
    }
    if (sectionId === 'locations') {
      const fields: string[] = []
      formData.locations.forEach((_, idx) => {
        fields.push(...getLocationFieldNames(idx))
      })
      return fields
    }
    return []
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
    label,
    inline = false
  }: { 
    fieldName: string
    label?: string
    inline?: boolean // If true, display alongside label (for special cases like Headquarters)
  }) => {
    if (!showVerification) return null
    
    const isChecked = verifiedFields.has(fieldName)
    
    if (inline) {
      return (
        <div className="flex items-center gap-1.5 ml-2">
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
            {isChecked ? '✓ Verified' : label || 'Mark as verified'}
          </Label>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 mt-1">
        <Checkbox
          id={`verify-${fieldName}`}
          checked={isChecked}
          onCheckedChange={(checked) => handleVerificationToggle(fieldName, checked === true)}
          className="cursor-pointer"
        />
        <Label 
          htmlFor={`verify-${fieldName}`}
          className={`text-xs cursor-pointer ${isChecked ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
        >
          {isChecked ? '✓ Verified' : label || 'Mark as verified'}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Include verification state if in verification mode
      const verificationState: EmployerVerificationState | undefined = showVerification 
        ? { verifiedFields, modifiedFields }
        : undefined
        
      await onSubmit?.(formData, verificationState)
      setFormData(initialFormData)
      setErrors({})
      setVerifiedFields(new Set())
      setModifiedFields(new Set())
      setOpen(false)
    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} employer:`, error)
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
      return "Verify Employer"
    }
    return mode === "edit" ? "Edit Employer" : "Create New Employer"
  }

  // Get submit button text based on mode and verification
  const getSubmitButtonText = () => {
    if (isLoading) {
      if (showVerification) return "Saving & Verifying..."
      return mode === "edit" ? "Updating..." : "Creating..."
    }
    if (showVerification) return "Update & Verify"
    return mode === "edit" ? "Update Employer" : "Create Employer"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        {mode === "create" && !showVerification && controlledOpen === undefined && (
          <DialogTrigger asChild>
            {children || (
              <Button className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Employer
              </Button>
            )}
          </DialogTrigger>
        )}
        
        <DialogContent className="sm:max-w-[750px] lg:max-w-[850px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
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
                    {verificationProgress}% Complete ({verifiedFields.size} fields)
                  </Badge>
                </div>
                <Progress value={verificationProgress} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{verifiedFields.size} verified</span>
                  <span>{getSectionFieldNames('basic-info').length + getSectionFieldNames('locations').length - verifiedFields.size} remaining</span>
                  {modifiedFields.size > 0 && (
                    <span className="text-blue-600">{modifiedFields.size} modified</span>
                  )}
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4" id="employer-form">
              
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
                          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Employer Name *</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="TechCorp Solutions"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className={errors.employer?.name ? "border-red-500" : ""}
                          />
                          {errors.employer?.name && <p className="text-sm text-red-500">{errors.employer.name}</p>}
                          <VerificationCheckbox fieldName="name" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="foundedYear">Founded Year *</Label>
                          <Input
                            id="foundedYear"
                            type="number"
                            placeholder="2019"
                            min="1800"
                            max={new Date().getFullYear()}
                            value={formData.foundedYear}
                            onChange={(e) => handleInputChange("foundedYear", e.target.value)}
                            className={errors.employer?.foundedYear ? "border-red-500" : ""}
                          />
                          {errors.employer?.foundedYear && <p className="text-sm text-red-500">{errors.employer.foundedYear}</p>}
                          <VerificationCheckbox fieldName="foundedYear" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status">Status *</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: EmployerStatus) => handleInputChange("status", value)}
                          >
                            <SelectTrigger className={errors.employer?.status ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.employer?.status && <p className="text-sm text-red-500">{errors.employer.status}</p>}
                          <VerificationCheckbox fieldName="status" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="websiteUrl">Website URL</Label>
                          <Input
                            id="websiteUrl"
                            type="url"
                            placeholder="https://www.company.com"
                            value={formData.websiteUrl}
                            onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                            className={errors.employer?.websiteUrl ? "border-red-500" : ""}
                          />
                          {errors.employer?.websiteUrl && <p className="text-sm text-red-500">{errors.employer.websiteUrl}</p>}
                          <VerificationCheckbox fieldName="websiteUrl" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                          <Input
                            id="linkedinUrl"
                            type="url"
                            placeholder="https://linkedin.com/company/..."
                            value={formData.linkedinUrl}
                            onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                            className={errors.employer?.linkedinUrl ? "border-red-500" : ""}
                          />
                          {errors.employer?.linkedinUrl && <p className="text-sm text-red-500">{errors.employer.linkedinUrl}</p>}
                          <VerificationCheckbox fieldName="linkedinUrl" />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Office Locations Section */}
              <Collapsible 
                open={expandedSections.has("locations")} 
                onOpenChange={() => toggleSection("locations")}
              >
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-lg font-medium">Office Locations</span>
                        {formData.locations.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {formData.locations.length}
                          </Badge>
                        )}
                        {showVerification && (
                          <SectionProgressBadge 
                            percentage={locationsProgress.percentage}
                            verified={locationsProgress.verified}
                            total={locationsProgress.total}
                          />
                        )}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          expandedSections.has("locations") ? "transform rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  {showVerification && (
                    <div 
                      className="flex items-center gap-2 px-2" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id="verify-all-locations"
                        checked={isSectionFullyVerified("locations")}
                        onCheckedChange={(checked) => handleVerifyAllSection("locations", checked === true)}
                        aria-label="Verify all fields in Office Locations section"
                      />
                      <Label 
                        htmlFor="verify-all-locations"
                        className="text-sm text-muted-foreground cursor-pointer font-normal whitespace-nowrap"
                      >
                        Verify All
                      </Label>
                    </div>
                  )}
                </div>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Add office locations and headquarters information
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLocation}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Button>
                  </div>
                  <Card>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {formData.locations.map((location, index) => (
                        <Card key={location.id} className="relative">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-base">
                              <span>Office Location {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLocation(index)}
                                disabled={formData.locations.length <= 1}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`country-${index}`}>Country *</Label>
                                <Input
                                  id={`country-${index}`}
                                  type="text"
                                  placeholder="United States"
                                  value={location.country}
                                  onChange={(e) => handleLocationChange(index, "country", e.target.value)}
                                  className={errors.locations?.[index]?.country ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.country && (
                                  <p className="text-sm text-red-500">{errors.locations[index].country}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].country`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`city-${index}`}>City *</Label>
                                <Input
                                  id={`city-${index}`}
                                  type="text"
                                  placeholder="New York"
                                  value={location.city}
                                  onChange={(e) => handleLocationChange(index, "city", e.target.value)}
                                  className={errors.locations?.[index]?.city ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.city && (
                                  <p className="text-sm text-red-500">{errors.locations[index].city}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].city`} />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`address-${index}`}>Address *</Label>
                                <Input
                                  id={`address-${index}`}
                                  type="text"
                                  placeholder="123 Broadway, Manhattan, NY 10001"
                                  value={location.address}
                                  onChange={(e) => handleLocationChange(index, "address", e.target.value)}
                                  className={errors.locations?.[index]?.address ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.address && (
                                  <p className="text-sm text-red-500">{errors.locations[index].address}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].address`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`minSize-${index}`}>Minimum Employees *</Label>
                                <Input
                                  id={`minSize-${index}`}
                                  type="number"
                                  placeholder="10"
                                  min="1"
                                  value={location.minSize}
                                  onChange={(e) => handleLocationChange(index, "minSize", e.target.value)}
                                  className={errors.locations?.[index]?.minSize ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.minSize && (
                                  <p className="text-sm text-red-500">{errors.locations[index].minSize}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].minSize`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`maxSize-${index}`}>Maximum Employees *</Label>
                                <Input
                                  id={`maxSize-${index}`}
                                  type="number"
                                  placeholder="50"
                                  min="1"
                                  value={location.maxSize}
                                  onChange={(e) => handleLocationChange(index, "maxSize", e.target.value)}
                                  className={errors.locations?.[index]?.maxSize ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.maxSize && (
                                  <p className="text-sm text-red-500">{errors.locations[index].maxSize}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].maxSize`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`salaryPolicy-${index}`}>Salary Policy *</Label>
                                <Select
                                  value={location.salaryPolicy}
                                  onValueChange={(value: SalaryPolicy) => handleLocationChange(index, "salaryPolicy", value)}
                                >
                                  <SelectTrigger className={errors.locations?.[index]?.salaryPolicy ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select policy" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {salaryPolicyOptions.map((policy) => (
                                      <SelectItem key={policy.value} value={policy.value}>
                                        {policy.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.locations?.[index]?.salaryPolicy && (
                                  <p className="text-sm text-red-500">{errors.locations[index].salaryPolicy}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].salaryPolicy`} />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between pt-6">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`isHeadquarters-${index}`}
                                      checked={location.isHeadquarters}
                                      onCheckedChange={(checked) => handleLocationChange(index, "isHeadquarters", !!checked)}
                                    />
                                    <Label htmlFor={`isHeadquarters-${index}`} className="text-sm font-normal">
                                      Headquarters
                                    </Label>
                                  </div>
                                  <VerificationCheckbox fieldName={`locations[${index}].isHeadquarters`} inline={true} />
                                </div>
                                {errors.locations?.[index]?.isHeadquarters && (
                                  <p className="text-sm text-red-500">{errors.locations[index].isHeadquarters}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </CollapsibleContent>
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
              form="employer-form"
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
