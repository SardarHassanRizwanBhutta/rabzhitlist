"use client"

import * as React from "react"
import { useState } from "react"
import {
  Building2,
  BuildingIcon,
  MapPinIcon,
  ExternalLink,
  EditIcon,
  Pencil,
  Check,
  Save,
  X,
  Loader2,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  MapPin,
  ShieldCheck,
} from "lucide-react"

import { Employer, EmployerStatus, SalaryPolicy, SALARY_POLICY_COLORS, SALARY_POLICY_LABELS, EMPLOYER_STATUS_LABELS } from "@/lib/types/employer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Add to existing imports
import { useRouter } from "next/navigation"
import { FolderIcon, UsersIcon } from "lucide-react"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"

import { Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// DomainBadges component for displaying vertical and horizontal domains
const DomainBadges = ({
  projectName,
  verticalDomains,
  horizontalDomains,
  teamSize,
  maxDisplay = 3,
}: {
  projectName: string
  verticalDomains: string[]
  horizontalDomains: string[]
  teamSize?: string | null
  maxDisplay?: number
}) => {
  const hasVertical = verticalDomains.length > 0
  const hasHorizontal = horizontalDomains.length > 0
  const hasTeamSize = teamSize !== null && teamSize !== undefined

  if (!hasVertical && !hasHorizontal && !hasTeamSize) return null

  const renderGroup = (domains: string[], type: "vertical" | "horizontal") => {
    const visible = domains.slice(0, maxDisplay)
    const remaining = domains.slice(maxDisplay)
    const moreCount = remaining.length

    const baseClass =
      type === "vertical"
        ? "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-800"
        : "bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-800"

    return (
      <>
        {visible.map((d) => (
          <span
            key={`${type}-${d}`}
            className={`text-xs px-2 py-1 rounded-md ${baseClass}`}
          >
            {d}
          </span>
        ))}
        {moreCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700"
                aria-label={`Show ${moreCount} more ${type} domains for ${projectName}`}
              >
                +{moreCount} more
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6} className="max-w-xs">
              <div className="space-y-1">
                <div className="font-medium">
                  {type === "vertical" ? "Vertical Domains" : "Horizontal Domains"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {remaining.map((d) => (
                    <span key={`${type}-remaining-${d}`} className="px-1.5 py-0.5 rounded bg-background/20">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </>
    )
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 mt-2"
      aria-label={`Project domains and team size for ${projectName}`}
    >
      {hasVertical && renderGroup(verticalDomains, "vertical")}
      {hasVertical && hasHorizontal && (
        <span className="mx-2 text-muted-foreground" aria-hidden="true">
          •
        </span>
      )}
      {hasHorizontal && renderGroup(horizontalDomains, "horizontal")}
      {(hasVertical || hasHorizontal) && hasTeamSize && (
        <span className="mx-2 text-muted-foreground" aria-hidden="true">
          •
        </span>
      )}
      {hasTeamSize && (
        <span className="text-xs px-2 py-1 rounded-md bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-800 flex items-center gap-1">
          <Users className="size-3" />
          {teamSize}
        </span>
      )}
    </div>
  )
}

// Validation functions
const validateURL = (url: string): string | null => {
  if (!url) return null // Optional field
  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL format'
  }
}

const validateYear = (year: string): string | null => {
  if (!year) return null // Optional field
  const yearNum = parseInt(year)
  if (isNaN(yearNum)) return 'Must be a valid year'
  if (yearNum < 1800 || yearNum > new Date().getFullYear()) {
    return `Year must be between 1800 and ${new Date().getFullYear()}`
  }
  return null
}

const validateName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'Name is required'
  if (name.length < 2) return 'Name must be at least 2 characters'
  if (name.length > 100) return 'Name is too long'
  return null
}

// Status options
const statusOptions = Object.entries(EMPLOYER_STATUS_LABELS).map(([value, label]) => ({
  label,
  value: value as EmployerStatus
}))

// Salary policy options
const salaryPolicyOptions = Object.entries(SALARY_POLICY_LABELS).map(([value, label]) => ({
  label,
  value: value as SalaryPolicy
}))

// Inline Edit Field Component
interface InlineEditFieldProps {
  label: string
  value: string | number | null | undefined
  fieldName: string
  fieldType: 'text' | 'number' | 'url' | 'select'
  options?: { label: string; value: string }[]
  validation?: (value: string) => string | null
  onSave: (fieldName: string, newValue: string | number, verify: boolean) => Promise<void>
  placeholder?: string
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  label,
  value,
  fieldName,
  fieldType,
  options,
  validation,
  onSave,
  placeholder,
  getFieldVerification,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value !== null && value !== undefined ? String(value) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(true)
  
  const verificationStatus = getFieldVerification?.(fieldName)
  const isVerified = verificationStatus === 'verified'
  
  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(true)
    setError(null)
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(true)
    setError(null)
  }
  
  const handleSave = async () => {
    // Validate
    if (validation) {
      const validationError = validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    
    // No change
    if (editValue === (value !== null && value !== undefined ? String(value) : '')) {
      setIsEditing(false)
      return
    }
    
    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }
  
  const displayValue = (() => {
    const isEmpty = value === null || value === undefined || String(value).trim() === ''
    if (isEmpty) return 'N/A'
    return String(value)
  })()
  
  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verification = getFieldVerification?.(fName)
    const status = verification || 'unverified'
    
    return (
      <div className="flex items-center gap-1 shrink-0">
        <VerificationBadge 
          status={status}
          size="sm"
        />
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-1 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <VerificationIndicator fieldName={fieldName} />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              type="button"
              title="Edit field"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              {fieldType === 'select' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between", error && "border-red-500")}
                      disabled={isSaving}
                    >
                      {editValue
                        ? options?.find((option) => option.value === editValue)?.label
                        : placeholder || "Select option..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />
                      <CommandList>
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup>
                          {options?.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={(currentValue) => {
                                setEditValue(currentValue === editValue ? "" : currentValue)
                              }}
                              className="cursor-pointer"
                            >
                              {option.label}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  editValue === option.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  type={fieldType}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className={cn("text-sm", error && "border-red-500")}
                  autoFocus
                  disabled={isSaving}
                />
              )}
              
              {/* Mark as verified checkbox */}
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id={`verify-${fieldName}`}
                  checked={willVerify}
                  onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`verify-${fieldName}`}
                  className={cn(
                    "text-xs cursor-pointer",
                    willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                  )}
                >
                  {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
                </Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`text-sm ${
            (value === null || value === undefined || String(value).trim() === '') 
              ? 'text-muted-foreground italic' 
              : ''
          }`}>
            {displayValue}
          </span>
        </div>
      )}
    </div>
  )
}

// Inline Editable Checkbox Component
interface InlineEditableCheckboxProps {
  label: string
  value: boolean
  fieldName: string
  onSave: (fieldName: string, newValue: boolean, verify: boolean) => Promise<void>
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
  description?: string
}

const InlineEditableCheckbox: React.FC<InlineEditableCheckboxProps> = ({
  label,
  value,
  fieldName,
  onSave,
  getFieldVerification,
  className,
  description
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [willVerify, setWillVerify] = useState(true)
  
  const verificationStatus = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verificationStatus === 'verified'
  
  // Initialize willVerify based on current verification status when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])
  
  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
  }
  
  const handleSave = async () => {
    // No change check
    const verificationChanged = willVerify !== isCurrentlyVerified
    const valueChanged = editValue !== value
    
    if (!valueChanged && !verificationChanged) {
      setIsEditing(false)
      return
    }
    
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
    } catch (err) {
      // Error handling - revert on error
      setEditValue(value)
      setWillVerify(isCurrentlyVerified)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verification = getFieldVerification?.(fName)
    const status = verification || 'unverified'
    
    return (
      <div className="flex items-center gap-1 shrink-0">
        <VerificationBadge 
          status={status}
          size="sm"
        />
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-1 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <VerificationIndicator fieldName={fieldName} />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              type="button"
              title="Edit field"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-3">
              {/* Headquarters Checkbox */}
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id={`checkbox-${fieldName}`}
                  checked={editValue}
                  onCheckedChange={(checked) => setEditValue(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`checkbox-${fieldName}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {label}
                </Label>
              </div>
              
              {description && (
                <p className="text-xs text-muted-foreground pl-6 -mt-1">{description}</p>
              )}
              
              {/* Mark as verified checkbox */}
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id={`verify-${fieldName}`}
                  checked={willVerify}
                  onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`verify-${fieldName}`}
                  className={cn(
                    "text-xs cursor-pointer",
                    willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                  )}
                >
                  {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
                </Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value}
              disabled
              className="h-4 w-4 opacity-50"
            />
            <span className={cn(
              "text-sm",
              value ? "font-medium" : "text-muted-foreground"
            )}>
              {value ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Employer Detail Modal Component
export interface EmployerDetailsModalProps {
  employer: Employer
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (employer: Employer) => void
}

export function EmployerDetailsModal({ employer, open, onOpenChange, onEdit }: EmployerDetailsModalProps) {
  const router = useRouter()
  // Local state for employer data (for optimistic updates)
  const [localEmployer, setLocalEmployer] = useState<Employer>(employer)
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "locations", "projects", "candidates"]))

  // Get projects for this employer
  const employerProjects = React.useMemo(() => {
    return sampleProjects.filter(project => 
      project.employerName?.toLowerCase() === employer.name.toLowerCase()
    )
  }, [employer.name])

  // Get candidates for this employer
    const employerCandidates = React.useMemo(() => {
      return sampleCandidates.filter(candidate => {
        // Check work experiences
        const hasWorkExperience = candidate.workExperiences?.some(we => 
          we.employerName?.toLowerCase() === employer.name.toLowerCase()
        )
        return hasWorkExperience
      })
    }, [employer.name])

  // Update local employer when prop changes
  React.useEffect(() => {
    setLocalEmployer(employer)
  }, [employer])
  
  // Toggle section
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
  // Handle navigation to projects page
  const handleViewProjects = () => {
    const params = new URLSearchParams({
      employerFilter: employer.name,
      employerId: employer.id
    })
    router.push(`/projects?${params.toString()}`)
  }

  // Handle navigation to candidates page
  const handleViewCandidates = () => {
    const params = new URLSearchParams({
      employerFilter: employer.name,
      employerId: employer.id
    })
    router.push(`/candidates?${params.toString()}`)
  }

  // Helper to get verification status for a field (placeholder for now)
  const getFieldVerification = (fieldName: string): 'verified' | 'unverified' | undefined => {
    // TODO: Implement verification system for employers
    return undefined
  }
  
  // Handle field save
  const handleFieldSave = async (fieldName: string, newValue: string | number | null, verify: boolean) => {
    try {
      // Optimistic update
      setLocalEmployer(prev => ({
        ...prev,
        [fieldName]: newValue === "" ? null : newValue
      }))
      
      // TODO: API call to save field
      // await updateEmployerField(employer.id, fieldName, newValue, verify)
      
      toast.success(`${fieldName} updated${verify ? ' and verified' : ''}`)
    } catch (error) {
      // Revert on error
      setLocalEmployer(employer)
      toast.error('Failed to save field')
      throw error
    }
  }
  
  // Handle location field save
  const handleLocationFieldSave = async (locationId: string, fieldName: string, newValue: string | number | boolean | null, verify: boolean) => {
    try {
      // Optimistic update
      setLocalEmployer(prev => ({
        ...prev,
        locations: prev.locations.map(loc => 
          loc.id === locationId 
            ? { ...loc, [fieldName]: newValue === "" ? null : newValue }
            : loc
        )
      }))
      
      // TODO: API call to save location field
      // await updateLocationField(locationId, fieldName, newValue, verify)
      
      toast.success(`${fieldName} updated${verify ? ' and verified' : ''}`)
    } catch (error) {
      // Revert on error
      setLocalEmployer(employer)
      toast.error('Failed to save field')
      throw error
    }
  }
  
  // Handle location team size save (special handling for min/max)
  const handleLocationTeamSizeSave = async (locationId: string, minSize: number | null, maxSize: number | null, verify: boolean) => {
    try {
      setLocalEmployer(prev => ({
        ...prev,
        locations: prev.locations.map(loc => 
          loc.id === locationId 
            ? { ...loc, minSize, maxSize }
            : loc
        )
      }))
      
      toast.success(`Team size updated${verify ? ' and verified' : ''}`)
    } catch (error) {
      setLocalEmployer(employer)
      toast.error('Failed to save field')
      throw error
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-blue-600" />
              {localEmployer.name}
            </DialogTitle>
            <div className="flex gap-2 mr-8">
              {onEdit && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => {
                    onEdit(localEmployer)
                    onOpenChange(false)
                  }}
                  className="gap-1.5"
                >
                  <ShieldCheck className="size-4" />
                  Edit & Verify
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Basic Information Section */}
          <Collapsible 
            open={expandedSections.has("basic")} 
            onOpenChange={() => toggleSection("basic")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="size-5" />
                      Basic Information
                    </CardTitle>
                    {expandedSections.has("basic") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    <InlineEditField
                      label="Company Name"
                      value={localEmployer.name}
                      fieldName="name"
                      fieldType="text"
                      validation={validateName}
                      onSave={handleFieldSave}
                      placeholder="Enter company name"
                      getFieldVerification={getFieldVerification}
                    />
                    
                    <InlineEditField
                      label="Status"
                      value={localEmployer.status}
                      fieldName="status"
                      fieldType="select"
                      options={statusOptions}
                      onSave={handleFieldSave}
                      getFieldVerification={getFieldVerification}
                    />
                    
                    <div className="space-y-2">
                      <InlineEditField
                        label="Founded Year"
                        value={localEmployer.foundedYear || ""}
                        fieldName="foundedYear"
                        fieldType="number"
                        validation={validateYear}
                        onSave={async (fieldName, newValue, verify) => {
                          const yearValue = newValue && String(newValue).trim() ? parseInt(String(newValue)) : null
                          await handleFieldSave(fieldName, yearValue, verify)
                        }}
                        placeholder="e.g., 2019"
                        getFieldVerification={getFieldVerification}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <InlineEditField
                        label="Website"
                        value={localEmployer.websiteUrl || ""}
                        fieldName="websiteUrl"
                        fieldType="url"
                        validation={validateURL}
                        onSave={handleFieldSave}
                        placeholder="https://example.com"
                        getFieldVerification={getFieldVerification}
                      />
                      {localEmployer.websiteUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => localEmployer.websiteUrl && window.open(localEmployer.websiteUrl, '_blank')}
                          className="h-7 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit Website
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <InlineEditField
                        label="LinkedIn"
                        value={localEmployer.linkedinUrl || ""}
                        fieldName="linkedinUrl"
                        fieldType="url"
                        validation={validateURL}
                        onSave={handleFieldSave}
                        placeholder="https://linkedin.com/company/example"
                        getFieldVerification={getFieldVerification}
                      />
                      {localEmployer.linkedinUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => localEmployer.linkedinUrl && window.open(localEmployer.linkedinUrl, '_blank')}
                          className="h-7 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit LinkedIn
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Locations Section */}
          <Collapsible 
            open={expandedSections.has("locations")} 
            onOpenChange={() => toggleSection("locations")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="size-5" />
                      Office Locations
                      {localEmployer.locations.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {localEmployer.locations.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("locations") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {localEmployer.locations.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No office locations recorded</p>
                  ) : (
                    localEmployer.locations
                      .sort((a, b) => b.isHeadquarters ? 1 : a.isHeadquarters ? -1 : 0)
                      .map((location, idx) => (
                        <div key={location.id}>
                          {idx > 0 && <Separator className="my-6" />}
                          <div className="space-y-4">
                            {/* Location Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {location.isHeadquarters ? (
                                    <BuildingIcon className="size-5 text-amber-600" />
                                  ) : (
                                    <MapPinIcon className="size-5 text-muted-foreground" />
                                  )}
                                  <span className="font-semibold text-lg">
                                    {location.city || 'N/A'}, {location.country || 'N/A'}
                                  </span>
                                  {location.isHeadquarters && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                      Headquarters
                                    </Badge>
                                  )}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <VerificationBadge 
                                      status={getFieldVerification(`locations[${idx}].city`) || 'unverified'}
                                      size="sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Location Details Grid */}
                            <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <InlineEditField
                                label="City"
                                value={location.city || ""}
                                fieldName={`locations[${idx}].city`}
                                fieldType="text"
                                onSave={async (fieldName, newValue, verify) => {
                                  await handleLocationFieldSave(location.id, 'city', newValue, verify)
                                }}
                                placeholder="Enter city"
                                getFieldVerification={getFieldVerification}
                              />
                              
                              <InlineEditField
                                label="Country"
                                value={location.country || ""}
                                fieldName={`locations[${idx}].country`}
                                fieldType="text"
                                onSave={async (fieldName, newValue, verify) => {
                                  await handleLocationFieldSave(location.id, 'country', newValue, verify)
                                }}
                                placeholder="Enter country"
                                getFieldVerification={getFieldVerification}
                              />
                              
                              <div className="sm:col-span-2">
                                <InlineEditField
                                  label="Address"
                                  value={location.address || ""}
                                  fieldName={`locations[${idx}].address`}
                                  fieldType="text"
                                  onSave={async (fieldName, newValue, verify) => {
                                    await handleLocationFieldSave(location.id, 'address', newValue, verify)
                                  }}
                                  placeholder="Enter full address"
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                              
                              {/* Headquarters Checkbox - Full Width */}
                              <div className="sm:col-span-2">
                                <InlineEditableCheckbox
                                  label="Headquarters"
                                  value={location.isHeadquarters}
                                  fieldName={`locations[${idx}].isHeadquarters`}
                                  onSave={async (fieldName, newValue, verify) => {
                                    await handleLocationFieldSave(location.id, 'isHeadquarters', newValue, verify)
                                  }}
                                  getFieldVerification={getFieldVerification}
                                  description="Mark this location as the company headquarters"
                                />
                              </div>
                              
                              {/* Salary Policy - Full Width */}
                              <div className="sm:col-span-2">
                                <InlineEditField
                                  label="Salary Policy"
                                  value={location.salaryPolicy}
                                  fieldName={`locations[${idx}].salaryPolicy`}
                                  fieldType="select"
                                  options={salaryPolicyOptions}
                                  onSave={async (fieldName, newValue, verify) => {
                                    await handleLocationFieldSave(location.id, 'salaryPolicy', newValue, verify)
                                  }}
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                              
                              {/* Team Size - Two Column Grid */}
                              <div className="sm:col-span-2">
                                <Label className="text-sm font-medium text-muted-foreground mb-2 block">Team Size</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <InlineEditField
                                    label="Min Size"
                                    value={location.minSize || ""}
                                    fieldName={`locations[${idx}].minSize`}
                                    fieldType="number"
                                    validation={(val) => {
                                      if (!val) return null
                                      const num = parseInt(val)
                                      if (isNaN(num) || num < 1) return 'Must be at least 1'
                                      if (num > 1000) return 'Too large'
                                      if (location.maxSize && num > location.maxSize) return 'Must be less than max'
                                      return null
                                    }}
                                    onSave={async (fieldName, newValue, verify) => {
                                      const minSize = newValue && String(newValue).trim() ? parseInt(String(newValue)) : null
                                      await handleLocationTeamSizeSave(location.id, minSize, location.maxSize, verify)
                                    }}
                                    placeholder="Min"
                                    getFieldVerification={getFieldVerification}
                                  />
                                  <InlineEditField
                                    label="Max Size"
                                    value={location.maxSize || ""}
                                    fieldName={`locations[${idx}].maxSize`}
                                    fieldType="number"
                                    validation={(val) => {
                                      if (!val) return null
                                      const num = parseInt(val)
                                      if (isNaN(num) || num < 1) return 'Must be at least 1'
                                      if (num > 1000) return 'Too large'
                                      if (location.minSize && num < location.minSize) return 'Must be greater than min'
                                      return null
                                    }}
                                    onSave={async (fieldName, newValue, verify) => {
                                      const maxSize = newValue && String(newValue).trim() ? parseInt(String(newValue)) : null
                                      await handleLocationTeamSizeSave(location.id, location.minSize, maxSize, verify)
                                    }}
                                    placeholder="Max"
                                    getFieldVerification={getFieldVerification}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
         {/* Projects Section */}
          <Collapsible 
            open={expandedSections.has("projects")} 
            onOpenChange={() => toggleSection("projects")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FolderIcon className="size-5" />
                      Projects
                      {employerProjects.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {employerProjects.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("projects") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {employerProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects found for this employer</p>
                  ) : (
                    <>
                      {/* Show first 10 projects with names and domain badges */}
                      <div className="space-y-2">
                        {employerProjects.slice(0, 10).map((project) => (
                          <div 
                            key={project.id} 
                            className="flex items-start justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate mb-1">
                                {project.projectName}
                              </div>
                              <DomainBadges
                                projectName={project.projectName}
                                verticalDomains={project.verticalDomains || []}
                                horizontalDomains={project.horizontalDomains || []}
                                teamSize={project.teamSize}
                                maxDisplay={3}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {employerProjects.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          +{employerProjects.length - 10} more project{employerProjects.length - 10 !== 1 ? 's' : ''}
                        </p>
                      )}
                      <Separator />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewProjects()
                        }}
                      >
                        <FolderIcon className="mr-2 h-4 w-4" />
                        View All Projects ({employerProjects.length})
                      </Button>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Candidates Section */}
          <Collapsible 
            open={expandedSections.has("candidates")} 
            onOpenChange={() => toggleSection("candidates")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UsersIcon className="size-5" />
                      Candidates
                      {employerCandidates.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {employerCandidates.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("candidates") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {employerCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No candidates found for this employer</p>
                  ) : (
                    <>
                      {/* Show first 10 candidates with names and job titles */}
                      <div className="space-y-2">
                        {employerCandidates.slice(0, 10).map((candidate) => {
                          // Get job title from work experience with this employer
                          const workExp = candidate.workExperiences?.find(we => 
                            we.employerName?.toLowerCase() === employer.name.toLowerCase()
                          )
                          const jobTitle = workExp?.jobTitle || "N/A"
                          
                          return (
                            <div 
                              key={candidate.id} 
                              className="flex items-start justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate mb-1">
                                  {candidate.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {jobTitle}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {employerCandidates.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          +{employerCandidates.length - 10} more candidate{employerCandidates.length - 10 !== 1 ? 's' : ''}
                        </p>
                      )}
                      <Separator />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewCandidates()
                        }}
                      >
                        <UsersIcon className="mr-2 h-4 w-4" />
                        View All Candidates ({employerCandidates.length})
                      </Button>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Employer Metadata */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>Created: {employer.createdAt.toLocaleDateString()}</div>
              <div>Updated: {employer.updatedAt.toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
