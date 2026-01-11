"use client"

import * as React from "react"
import { useState } from "react"
import {
  GraduationCap,
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
  BuildingIcon,
} from "lucide-react"

import { University, UniversityRanking, UNIVERSITY_RANKING_COLORS, UNIVERSITY_RANKING_LABELS } from "@/lib/types/university"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { calculateUniversityJobSuccessRatio } from "@/lib/utils/university-stats"
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

const validateName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'Name is required'
  if (name.length < 2) return 'Name must be at least 2 characters'
  if (name.length > 100) return 'Name is too long'
  return null
}

// Ranking options
const rankingOptions = Object.entries(UNIVERSITY_RANKING_LABELS).map(([value, label]) => ({
  label,
  value: value as UniversityRanking
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
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`edit-${fieldName}`}
                  checked={editValue}
                  onCheckedChange={(checked) => setEditValue(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`edit-${fieldName}`}
                  className="text-sm cursor-pointer"
                >
                  {description || label}
                </Label>
              </div>
              
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`display-${fieldName}`}
              checked={value}
              disabled
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`display-${fieldName}`}
              className="text-sm cursor-default"
            >
              {description || label}
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}

export interface UniversityDetailsModalProps {
  university: University
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (university: University) => void
}

export function UniversityDetailsModal({ university, open, onOpenChange, onEdit }: UniversityDetailsModalProps) {
  // Local state for university data (for optimistic updates)
  const [localUniversity, setLocalUniversity] = useState<University>(university)
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "locations", "statistics"]))
  
  // Update local university when prop changes
  React.useEffect(() => {
    setLocalUniversity(university)
  }, [university])
  
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
  
  // Helper to get verification status for a field (placeholder for now)
  const getFieldVerification = (fieldName: string): 'verified' | 'unverified' | undefined => {
    // TODO: Implement verification system for universities
    return undefined
  }
  
  // Handle field save
  const handleFieldSave = async (fieldName: string, newValue: string | number | null, verify: boolean) => {
    try {
      // Optimistic update
      setLocalUniversity(prev => ({
        ...prev,
        [fieldName]: newValue === "" ? null : newValue
      }))
      
      // TODO: API call to save field
      // await updateUniversityField(university.id, fieldName, newValue, verify)
      
      toast.success(`${fieldName} updated${verify ? ' and verified' : ''}`)
    } catch (error) {
      // Revert on error
      setLocalUniversity(university)
      toast.error('Failed to save field')
      throw error
    }
  }
  
  // Handle location field save
  const handleLocationFieldSave = async (locationId: string, fieldName: string, newValue: string | boolean | null, verify: boolean) => {
    try {
      // Optimistic update
      setLocalUniversity(prev => ({
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
      setLocalUniversity(university)
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
              <GraduationCap className="h-5 w-5 text-purple-600" />
              {localUniversity.name}
            </DialogTitle>
            <div className="flex gap-2 mr-8">
              {onEdit && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => {
                    onEdit(localUniversity)
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
                      <BuildingIcon className="size-5" />
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
                      label="University Name"
                      value={localUniversity.name}
                      fieldName="name"
                      fieldType="text"
                      validation={validateName}
                      onSave={handleFieldSave}
                      placeholder="Enter university name"
                      getFieldVerification={getFieldVerification}
                    />
                    
                    <InlineEditField
                      label="Country"
                      value={localUniversity.country}
                      fieldName="country"
                      fieldType="text"
                      onSave={handleFieldSave}
                      placeholder="Enter country"
                      getFieldVerification={getFieldVerification}
                    />
                    
                    <InlineEditField
                      label="Ranking"
                      value={localUniversity.ranking}
                      fieldName="ranking"
                      fieldType="select"
                      options={rankingOptions}
                      onSave={handleFieldSave}
                      getFieldVerification={getFieldVerification}
                    />
                    
                    <div className="space-y-2">
                      <InlineEditField
                        label="Website"
                        value={localUniversity.websiteUrl || ""}
                        fieldName="websiteUrl"
                        fieldType="url"
                        validation={validateURL}
                        onSave={handleFieldSave}
                        placeholder="https://example.com"
                        getFieldVerification={getFieldVerification}
                      />
                      {localUniversity.websiteUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(localUniversity.websiteUrl!, '_blank')}
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
                        value={localUniversity.linkedinUrl || ""}
                        fieldName="linkedinUrl"
                        fieldType="url"
                        validation={validateURL}
                        onSave={handleFieldSave}
                        placeholder="https://linkedin.com/school/example"
                        getFieldVerification={getFieldVerification}
                      />
                      {localUniversity.linkedinUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(localUniversity.linkedinUrl!, '_blank')}
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
                      Campus Locations
                      {localUniversity.locations.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {localUniversity.locations.length}
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
                  {localUniversity.locations.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No campus locations recorded</p>
                  ) : (
                    localUniversity.locations
                      .sort((a, b) => b.isMainCampus ? 1 : a.isMainCampus ? -1 : 0)
                      .map((location, idx) => (
                        <div key={location.id}>
                          {idx > 0 && <Separator className="my-6" />}
                          <div className="space-y-4">
                            {/* Location Header */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {location.isMainCampus ? (
                                    <BuildingIcon className="size-5 text-amber-600" />
                                  ) : (
                                    <MapPinIcon className="size-5 text-muted-foreground" />
                                  )}
                                  <span className="font-semibold text-lg">
                                    {location.city || 'N/A'}
                                  </span>
                                  {location.isMainCampus && (
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                      Main Campus
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
                                  await handleLocationFieldSave(location.id, 'city', String(newValue), verify)
                                }}
                                placeholder="Enter city"
                                getFieldVerification={getFieldVerification}
                              />
                              
                              <div className="sm:col-span-2">
                                <InlineEditField
                                  label="Address"
                                  value={location.address || ""}
                                  fieldName={`locations[${idx}].address`}
                                  fieldType="text"
                                  onSave={async (fieldName, newValue, verify) => {
                                    await handleLocationFieldSave(location.id, 'address', String(newValue), verify)
                                  }}
                                  placeholder="Enter full address"
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                              
                              <div className="sm:col-span-2">
                                <InlineEditableCheckbox
                                  label="Main Campus"
                                  value={location.isMainCampus}
                                  fieldName={`locations[${idx}].isMainCampus`}
                                  onSave={async (fieldName, newValue, verify) => {
                                    await handleLocationFieldSave(location.id, 'isMainCampus', newValue, verify)
                                  }}
                                  getFieldVerification={getFieldVerification}
                                  description="This is the main campus"
                                />
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

          {/* Job Success Statistics Section */}
          <Collapsible 
            open={expandedSections.has("statistics")} 
            onOpenChange={() => toggleSection("statistics")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="size-5" />
                      Job Success Statistics
                    </CardTitle>
                    {expandedSections.has("statistics") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {(() => {
                    const stats = calculateUniversityJobSuccessRatio(localUniversity)
                    if (stats.totalGraduates === 0) {
                      return (
                        <p className="text-base text-muted-foreground text-center py-6">
                          No graduates found from this university
                        </p>
                      )
                    }
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="text-sm text-muted-foreground mb-1">Total Graduates</div>
                            <div className="text-2xl font-bold">{stats.totalGraduates}</div>
                          </div>
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="text-sm text-muted-foreground mb-1">Successful Placements</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {stats.successfulPlacements}
                            </div>
                          </div>
                          <div className="p-4 rounded-lg border bg-muted/30">
                            <div className="text-sm text-muted-foreground mb-1">Success Ratio</div>
                            <div className="text-2xl font-bold text-primary">
                              {stats.successRatio.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* University Metadata */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>Created: {university.createdAt.toLocaleDateString()}</div>
              <div>Updated: {university.updatedAt.toLocaleDateString()}</div>
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


