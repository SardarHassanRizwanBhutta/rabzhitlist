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
  AlertTriangle,
  Plus,
  Trash2,
  CalendarIcon,
} from "lucide-react"

import { Employer, EmployerStatus, SalaryPolicy, SALARY_POLICY_COLORS, SALARY_POLICY_LABELS, EMPLOYER_STATUS_LABELS, TechStackWithCount, Layoff, LayoffReason, LAYOFF_REASON_LABELS } from "@/lib/types/employer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { EmployerBenefit } from "@/lib/types/benefits"
import { BenefitsSelector } from "@/components/ui/benefits-selector"
import { formatBenefitAmount } from "@/lib/sample-data/benefits"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

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
                  {willVerify ? '✓ Verified' : 'Mark as verified'}
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

// Helper to get intensity class based on count for visual emphasis
const getCountIntensityClass = (count: number): string => {
  if (count === 0) return "opacity-70" // Manual entry, no candidates
  if (count >= 5) return "ring-2 ring-blue-500/30 font-medium"
  if (count >= 3) return "font-medium"
  return ""
}

// Inline Editable Multi-Select With Count Component
interface InlineEditableMultiSelectWithCountProps {
  label: string
  displayValue: TechStackWithCount[] // For display with counts
  editValue: string[] // For editing (just the tech names)
  fieldName: string
  options: MultiSelectOption[]
  onSave: (fieldName: string, newValue: string[], shouldVerify: boolean) => Promise<void>
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
  placeholder?: string
  searchPlaceholder?: string
  badgeColorClass?: string
  maxDisplay?: number
}

const InlineEditableMultiSelectWithCount: React.FC<InlineEditableMultiSelectWithCountProps> = ({
  label,
  displayValue,
  editValue: initialEditValue,
  fieldName,
  options,
  onSave,
  getFieldVerification,
  className = "",
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  badgeColorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  maxDisplay = 4
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string[]>(initialEditValue || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verificationStatus = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verificationStatus === 'verified'

  // Update editValue when prop changes (but not when editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(initialEditValue || [])
    }
  }, [initialEditValue, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(initialEditValue || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(initialEditValue || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const currentValue = initialEditValue || []
    const verificationChanged = willVerify !== isCurrentlyVerified
    const arraysEqual = currentValue.length === editValue.length && 
      currentValue.every((val, idx) => val === editValue[idx])
    
    if (arraysEqual && !verificationChanged) {
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

  const displayItems = displayValue || []
  const shouldTruncate = displayItems.length > maxDisplay
  const displayItemsToShow = shouldTruncate && !isExpanded 
    ? displayItems.slice(0, maxDisplay)
    : displayItems
  const remainingCount = shouldTruncate && !isExpanded 
    ? displayItems.length - maxDisplay
    : 0

  if (isEditing) {
    return (
      <div className={cn("space-y-3 py-3 px-3 rounded-md bg-muted/30 border", className)}>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        </div>
        <div className="space-y-3">
          <div className="w-full">
            <MultiSelect
              items={options}
              selected={editValue}
              onChange={(values) => setEditValue(values)}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              maxDisplay={maxDisplay}
            />
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
              {willVerify ? '✓ Verified' : 'Mark as verified'}
            </Label>
          </div>
          
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
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
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
      </div>
      
      {displayItems.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">N/A</div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {displayItemsToShow.map((item, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className={`text-xs cursor-default ${badgeColorClass} ${getCountIntensityClass(item.count)}`}
                  >
                    {item.tech}
                    {item.count > 0 && (
                      <span className="ml-1 opacity-75">({item.count})</span>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {item.count === 0 
                    ? "Manually added" 
                    : `${item.count} candidate${item.count > 1 ? 's' : ''} use this technology`
                  }
                </TooltipContent>
              </Tooltip>
            ))}
            {remainingCount > 0 && !isExpanded && (
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsExpanded(!isExpanded)
                  }
                }}
              >
                Show {remainingCount} more
              </Badge>
            )}
          </div>
          {shouldTruncate && isExpanded && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsExpanded(!isExpanded)
                }
              }}
            >
              Show less
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Inline Editable Benefits Component
interface InlineEditableBenefitsProps {
  label: string
  value: EmployerBenefit[]
  fieldName: string
  onSave: (fieldName: string, newValue: EmployerBenefit[], shouldVerify: boolean) => Promise<void>
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
  maxDisplay?: number
}

const InlineEditableBenefits: React.FC<InlineEditableBenefitsProps> = ({
  label,
  value,
  fieldName,
  onSave,
  getFieldVerification,
  className = "",
  maxDisplay = 4
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<EmployerBenefit[]>(value || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verificationStatus = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verificationStatus === 'verified'

  // Update editValue when value prop changes (but not when editing)
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value || [])
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || []
    const verificationChanged = willVerify !== isCurrentlyVerified
    const arraysEqual = currentValue.length === editValue.length && 
      currentValue.every((val, idx) => 
        val.id === editValue[idx]?.id && 
        val.name === editValue[idx]?.name &&
        val.amount === editValue[idx]?.amount &&
        val.unit === editValue[idx]?.unit
      )
    
    if (arraysEqual && !verificationChanged) {
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

  const displayItems = value || []
  const shouldTruncate = displayItems.length > maxDisplay
  const displayItemsToShow = shouldTruncate && !isExpanded 
    ? displayItems.slice(0, maxDisplay)
    : displayItems
  const remainingCount = shouldTruncate && !isExpanded 
    ? displayItems.length - maxDisplay
    : 0

  if (isEditing) {
    return (
      <div className={cn("space-y-3 py-3 px-3 rounded-md bg-muted/30 border", className)}>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        </div>
        <div className="space-y-3">
          <div className="w-full">
            <BenefitsSelector
              benefits={editValue}
              onChange={(benefits) => setEditValue(benefits)}
            />
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
              {willVerify ? '✓ Verified' : 'Mark as verified'}
            </Label>
          </div>
          
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
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className={cn("py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1 shrink-0">
          <VerificationIndicator fieldName={fieldName} />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {displayItems.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {displayItemsToShow.map((benefit, index) => (
              <Badge 
                key={benefit.id || index} 
                variant="outline" 
                className="text-xs bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800"
              >
                {benefit.name}
                {benefit.amount !== null && benefit.unit && (
                  <span className="ml-1 font-semibold">
                    : {formatBenefitAmount(benefit.amount, benefit.unit)}
                  </span>
                )}
              </Badge>
            ))}
            {remainingCount > 0 && !isExpanded && (
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setIsExpanded(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsExpanded(true)
                  }
                }}
              >
                Show {remainingCount} more
              </Badge>
            )}
            {isExpanded && shouldTruncate && (
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setIsExpanded(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsExpanded(false)
                  }
                }}
              >
                Show less
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No benefits selected</p>
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
                  {willVerify ? '✓ Verified' : 'Mark as verified'}
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

// Inline Editable Switch Component
interface InlineEditableSwitchProps {
  label: string
  value: boolean
  fieldName: string
  onSave: (fieldName: string, newValue: boolean, verify: boolean) => Promise<void>
  getFieldVerification?: (fieldName: string) => 'verified' | 'unverified' | undefined
  className?: string
  description?: string
}

const InlineEditableSwitch: React.FC<InlineEditableSwitchProps> = ({
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
              {/* Switch */}
              <div className="flex items-center gap-2 pl-1">
                <Switch
                  id={`switch-${fieldName}`}
                  checked={editValue}
                  onCheckedChange={(checked) => setEditValue(checked)}
                  disabled={isSaving}
                />
                <Label 
                  htmlFor={`switch-${fieldName}`}
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
                  {willVerify ? '✓ Verified' : 'Mark as verified'}
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
            <Switch
              checked={value}
              disabled
              className="opacity-50"
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

// Extract unique tech stacks from candidates and projects
const extractUniqueTechStacks = (): MultiSelectOption[] => {
  const techStacksMap = new Map<string, string>() // Map<lowercase, original>
  
  // From candidates' work experiences
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.techStacks.forEach(tech => {
        const lowerTech = tech.toLowerCase().trim()
        if (lowerTech && !techStacksMap.has(lowerTech)) {
          techStacksMap.set(lowerTech, tech.trim())
        }
      })
    })
    // Also include standalone tech stacks from candidate level
    candidate.techStacks?.forEach(tech => {
      const lowerTech = tech.toLowerCase().trim()
      if (lowerTech && !techStacksMap.has(lowerTech)) {
        techStacksMap.set(lowerTech, tech.trim())
      }
    })
  })
  
  // From projects
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => {
      const lowerTech = tech.toLowerCase().trim()
      if (lowerTech && !techStacksMap.has(lowerTech)) {
        techStacksMap.set(lowerTech, tech.trim())
      }
    })
  })
  
  return Array.from(techStacksMap.values()).sort().map(tech => ({
    label: tech,
    value: tech
  }))
}

// Get tech stacks with counts for an employer (from employer data or candidates)
const getEmployerTechStacksWithCount = (employer: Employer): TechStackWithCount[] => {
  // Extract from candidates' work experiences with counts
  const techStackCounts = new Map<string, number>()
  const explicitTechStacks = new Set<string>()
  
  // If employer has explicit tech stacks, mark them (they'll have count = 0)
  if (employer.techStacks && employer.techStacks.length > 0) {
    employer.techStacks.forEach(tech => {
      const normalized = tech.trim()
      explicitTechStacks.add(normalized)
      techStackCounts.set(normalized, 0) // Manual entry, count = 0
    })
  }
  
  // Extract from candidates' work experiences with counts
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      // Match employer names (exact match after normalization)
      const weEmployerName = we.employerName?.toLowerCase().trim() || ""
      const employerName = employer.name.toLowerCase().trim()
      // Use exact match for precision, but also handle common variations
      const isMatch = weEmployerName === employerName || 
                     (weEmployerName && employerName && 
                      (weEmployerName.replace(/\s+/g, ' ') === employerName.replace(/\s+/g, ' ')))
      if (isMatch) {
        we.techStacks.forEach(tech => {
          const normalizedTech = tech.trim()
          if (normalizedTech) {
            // Only increment count if not already explicitly set (explicit ones stay at 0)
            if (!explicitTechStacks.has(normalizedTech)) {
              techStackCounts.set(
                normalizedTech,
                (techStackCounts.get(normalizedTech) || 0) + 1
              )
            }
          }
        })
      }
    })
  })
  
  // Convert to array and sort by count (descending), then alphabetically
  return Array.from(techStackCounts.entries())
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count // Higher count first
      return a.tech.localeCompare(b.tech) // Alphabetical as tiebreaker
    })
}

// Backward-compatible function that returns just tech stack strings
// Note: This function should be used with the normalizeTechStack helper when called from component
const getEmployerTechStacks = (employer: Employer): string[] => {
  return getEmployerTechStacksWithCount(employer).map(item => item.tech)
}

// Get benefits for an employer (from employer data or candidates)
const getEmployerBenefits = (employer: Employer): EmployerBenefit[] => {
  const benefitsMap = new Map<string, EmployerBenefit>()
  
  // First, use benefits from employer if they exist
  if (employer.benefits && employer.benefits.length > 0) {
    employer.benefits.forEach(benefit => {
      const key = benefit.name.toLowerCase().trim()
      benefitsMap.set(key, { ...benefit })
    })
  }
  
  // Also extract from candidates' work experiences
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      // Match employer names (exact match after normalization)
      const weEmployerName = we.employerName?.toLowerCase().trim() || ""
      const employerName = employer.name.toLowerCase().trim()
      // Use exact match for precision, but also handle common variations
      const isMatch = weEmployerName === employerName || 
                     (weEmployerName && employerName && 
                      (weEmployerName.replace(/\s+/g, ' ') === employerName.replace(/\s+/g, ' ')))
      if (isMatch) {
        we.benefits.forEach(benefit => {
          // Use benefit name as key to deduplicate
          const key = benefit.name.toLowerCase().trim()
          // Only add if not already present (employer's explicit benefits take precedence)
          if (!benefitsMap.has(key)) {
            benefitsMap.set(key, { ...benefit })
          }
        })
      }
    })
  })
  return Array.from(benefitsMap.values())
}

// Get shift types for an employer (from candidates' work experiences)
const getEmployerShiftTypes = (employer: Employer): string[] => {
  const shiftTypesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      // Match employer names (case-insensitive)
      const weEmployerName = we.employerName?.toLowerCase().trim() || ""
      const employerName = employer.name.toLowerCase().trim()
      const isMatch = weEmployerName === employerName || 
                     (weEmployerName && employerName && 
                      (weEmployerName.replace(/\s+/g, ' ') === employerName.replace(/\s+/g, ' ')))
      if (isMatch && we.shiftType && we.shiftType.trim()) {
        shiftTypesSet.add(we.shiftType.trim())
      }
    })
  })
  
  return Array.from(shiftTypesSet).sort()
}

// Get work modes for an employer (from candidates' work experiences)
const getEmployerWorkModes = (employer: Employer): string[] => {
  const workModesSet = new Set<string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      // Match employer names (case-insensitive)
      const weEmployerName = we.employerName?.toLowerCase().trim() || ""
      const employerName = employer.name.toLowerCase().trim()
      const isMatch = weEmployerName === employerName || 
                     (weEmployerName && employerName && 
                      (weEmployerName.replace(/\s+/g, ' ') === employerName.replace(/\s+/g, ' ')))
      if (isMatch && we.workMode && we.workMode.trim()) {
        workModesSet.add(we.workMode.trim())
      }
    })
  })
  
  return Array.from(workModesSet).sort()
}

export function EmployerDetailsModal({ employer, open, onOpenChange, onEdit }: EmployerDetailsModalProps) {
  const router = useRouter()
  // Local state for employer data (for optimistic updates)
  const [localEmployer, setLocalEmployer] = useState<Employer>(employer)
  
  // Sync local employer when prop changes
  React.useEffect(() => {
    setLocalEmployer(employer)
    setLayoffs(employer.layoffs || [])
  }, [employer])
  
  // Tech stack options
  const techStackOptions = React.useMemo(() => extractUniqueTechStacks(), [])
  
  // Create a map for case-insensitive lookup of tech stack options
  const techStackOptionsMap = React.useMemo(() => {
    const map = new Map<string, string>() // Map<lowercase, original>
    techStackOptions.forEach(option => {
      const lower = option.value.toLowerCase().trim()
      if (!map.has(lower)) {
        map.set(lower, option.value)
      }
    })
    return map
  }, [techStackOptions])
  
  // Helper to normalize tech stack to match options (case-insensitive)
  const normalizeTechStack = React.useCallback((tech: string): string => {
    const normalized = tech.trim()
    const lower = normalized.toLowerCase()
    // Return the original case from options if found, otherwise return trimmed original
    return techStackOptionsMap.get(lower) || normalized
  }, [techStackOptionsMap])
  
  // Get normalized tech stacks for editing (ensures they match options)
  const getNormalizedEmployerTechStacks = React.useCallback((employer: Employer): string[] => {
    const extracted = getEmployerTechStacks(employer)
    // Normalize tech stacks to match options (case-insensitive)
    return extracted.map(tech => normalizeTechStack(tech))
  }, [normalizeTechStack])
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "locations", "projects", "candidates", "layoffs"]))
  
  // Layoffs state
  const [layoffs, setLayoffs] = useState<Layoff[]>(localEmployer.layoffs || [])
  const [isLayoffFormOpen, setIsLayoffFormOpen] = useState(false)
  const [editingLayoff, setEditingLayoff] = useState<Layoff | null>(null)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<{
    locationId: string
    locationName: string
  } | null>(null)

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
  
  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verification = getFieldVerification(fName)
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
  
  // Handle field save
  const handleFieldSave = async (fieldName: string, newValue: string | number | boolean | null, verify: boolean) => {
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
  
  // Handle multi-select field save
  const handleMultiSelectFieldSave = async (fieldName: string, newValue: string[], verify: boolean) => {
    try {
      // Optimistic update
      setLocalEmployer(prev => ({
        ...prev,
        [fieldName]: newValue
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
  
  // Handle benefits field save
  const handleBenefitsFieldSave = async (fieldName: string, newValue: EmployerBenefit[], verify: boolean) => {
    try {
      // Optimistic update
      setLocalEmployer(prev => ({
        ...prev,
        [fieldName]: newValue
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
  
  // Handle layoff save (add or update)
  const handleLayoffSave = async (layoffData: Omit<Layoff, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingLayoff) {
        // Update existing layoff
        const updatedLayoff: Layoff = {
          ...editingLayoff,
          ...layoffData,
          updatedAt: new Date()
        }
        const updatedLayoffs = layoffs.map(l => l.id === editingLayoff.id ? updatedLayoff : l)
        setLayoffs(updatedLayoffs)
        setLocalEmployer(prev => ({
          ...prev,
          layoffs: updatedLayoffs
        }))
        toast.success('Layoff updated')
      } else {
        // Add new layoff
        const newLayoff: Layoff = {
          id: `layoff-${Date.now()}`,
          ...layoffData,
          employerId: localEmployer.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const updatedLayoffs = [...layoffs, newLayoff]
        setLayoffs(updatedLayoffs)
        setLocalEmployer(prev => ({
          ...prev,
          layoffs: updatedLayoffs
        }))
        toast.success('Layoff added')
      }
      
      // TODO: API call to save layoff
      // await saveLayoff(localEmployer.id, layoffData)
      
      setIsLayoffFormOpen(false)
      setEditingLayoff(null)
    } catch (error) {
      toast.error('Failed to save layoff')
      throw error
    }
  }
  
  // Handle layoff delete
  const handleDeleteLayoff = async (layoffId: string) => {
    try {
      const updatedLayoffs = layoffs.filter(l => l.id !== layoffId)
      setLayoffs(updatedLayoffs)
      setLocalEmployer(prev => ({
        ...prev,
        layoffs: updatedLayoffs
      }))
      
      // TODO: API call to delete layoff
      // await deleteLayoff(localEmployer.id, layoffId)
      
      toast.success('Layoff deleted')
    } catch (error) {
      toast.error('Failed to delete layoff')
    }
  }

  // Handle location deletion - show confirmation dialog
  const handleDeleteLocation = (locationId: string) => {
    const location = localEmployer.locations.find(loc => loc.id === locationId)
    if (!location) return
    
    // Create a descriptive name for the location
    const locationName = location.city && location.country
      ? `${location.city}, ${location.country}`
      : location.city || location.country || 'Location'
    
    setLocationToDelete({
      locationId,
      locationName
    })
    setDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return
    
    try {
      // Optimistic update
      const updatedLocations = localEmployer.locations.filter(
        loc => loc.id !== locationToDelete.locationId
      )
      setLocalEmployer(prev => ({
        ...prev,
        locations: updatedLocations
      }))
      
      // TODO: API call to delete location
      // await deleteLocation(localEmployer.id, locationToDelete.locationId)
      
      toast.success(`Location "${locationToDelete.locationName}" deleted successfully`)
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setLocationToDelete(null)
    } catch (error) {
      toast.error('Failed to delete location. Please try again.')
      console.error('Error deleting location:', error)
      setDeleteDialogOpen(false)
      setLocationToDelete(null)
    }
  }

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setLocationToDelete(null)
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
                    
                    {/* Tech Stacks - Full Width */}
                    <div className="md:col-span-2">
                      <InlineEditableMultiSelectWithCount
                        label="Tech Stacks"
                        displayValue={getEmployerTechStacksWithCount(localEmployer)}
                        editValue={getNormalizedEmployerTechStacks(localEmployer)}
                        fieldName="techStacks"
                        options={techStackOptions}
                        onSave={handleMultiSelectFieldSave}
                        getFieldVerification={getFieldVerification}
                        placeholder="Select technologies..."
                        searchPlaceholder="Search technologies..."
                        badgeColorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        maxDisplay={4}
                      />
                    </div>
                    
                    {/* Benefits - Full Width */}
                    <div className="md:col-span-2">
                      <InlineEditableBenefits
                        label="Benefits"
                        value={getEmployerBenefits(localEmployer)}
                        fieldName="benefits"
                        onSave={handleBenefitsFieldSave}
                        getFieldVerification={getFieldVerification}
                        maxDisplay={4}
                      />
                    </div>
                    
                    {/* DPL Competitive */}
                    <div className="md:col-span-2">
                      <InlineEditableSwitch
                        label="DPL Competitive"
                        value={localEmployer.isDPLCompetitive || false}
                        fieldName="isDPLCompetitive"
                        onSave={handleFieldSave}
                        getFieldVerification={getFieldVerification}
                      />
                    </div>
                    
                    {/* Shift Types */}
                    <div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Shift Types</Label>
                        <div className="flex flex-wrap gap-2 min-h-[2rem]">
                          {(() => {
                            const shiftTypes = getEmployerShiftTypes(localEmployer)
                            if (shiftTypes.length === 0) {
                              return <span className="text-muted-foreground text-sm">N/A</span>
                            }
                            return shiftTypes.map((shiftType, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                              >
                                {shiftType}
                              </Badge>
                            ))
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Work Modes */}
                    <div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Work Modes</Label>
                        <div className="flex flex-wrap gap-2 min-h-[2rem]">
                          {(() => {
                            const workModes = getEmployerWorkModes(localEmployer)
                            if (workModes.length === 0) {
                              return <span className="text-muted-foreground text-sm">N/A</span>
                            }
                            return workModes.map((workMode, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200"
                              >
                                {workMode}
                              </Badge>
                            ))
                          })()}
                        </div>
                      </div>
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
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLocation(location.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex-shrink-0"
                                title="Delete location"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                                <InlineEditableSwitch
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

          {/* Layoffs Section */}
          <Collapsible 
            open={expandedSections.has("layoffs")} 
            onOpenChange={() => toggleSection("layoffs")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="size-5 text-orange-600" />
                      Layoffs
                      {layoffs.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {layoffs.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("layoffs") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {layoffs.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No layoffs recorded</p>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Track layoff events for this employer
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingLayoff(null)
                            setIsLayoffFormOpen(true)
                          }}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Layoff
                        </Button>
                      </div>
                    <div className="space-y-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2 font-medium">Date</th>
                              <th className="text-left p-2 font-medium">Employees</th>
                              <th className="text-left p-2 font-medium">Reason</th>
                              <th className="text-left p-2 font-medium">Source</th>
                              <th className="text-right p-2 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {layoffs
                              .sort((a, b) => new Date(b.layoffDate).getTime() - new Date(a.layoffDate).getTime())
                              .map((layoff) => (
                                <tr key={layoff.id} className="border-b hover:bg-muted/50">
                                  <td className="p-2">
                                    {format(new Date(layoff.layoffDate), "MMM dd, yyyy")}
                                  </td>
                                  <td className="p-2">{layoff.numberOfEmployeesLaidOff.toLocaleString()}</td>
                                  <td className="p-2">
                                    {layoff.reason === "Other" && layoff.reasonOther
                                      ? `${LAYOFF_REASON_LABELS[layoff.reason]}: ${layoff.reasonOther}`
                                      : LAYOFF_REASON_LABELS[layoff.reason]}
                                  </td>
                                  <td className="p-2">{layoff.source}</td>
                                  <td className="p-2">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingLayoff(layoff)
                                          setIsLayoffFormOpen(true)
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteLayoff(layoff.id)
                                        }}
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

      {/* Layoff Form Dialog */}
      <LayoffFormDialog
        open={isLayoffFormOpen}
        onOpenChange={setIsLayoffFormOpen}
        layoff={editingLayoff}
        onSave={handleLayoffSave}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {locationToDelete ? (
                <>
                  This will permanently delete the location <strong>{locationToDelete.locationName}</strong>. This action cannot be undone.
                </>
              ) : (
                'This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

// Layoff Form Dialog Component
interface LayoffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  layoff: Layoff | null
  onSave: (layoffData: Omit<Layoff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

function LayoffFormDialog({ open, onOpenChange, layoff, onSave }: LayoffFormDialogProps) {
  const [layoffDate, setLayoffDate] = useState<Date | undefined>(
    layoff ? new Date(layoff.layoffDate) : undefined
  )
  const [numberOfEmployeesLaidOff, setNumberOfEmployeesLaidOff] = useState<string>(
    layoff ? layoff.numberOfEmployeesLaidOff.toString() : ""
  )
  const [reason, setReason] = useState<LayoffReason>(layoff?.reason || "Cost reduction")
  const [reasonOther, setReasonOther] = useState<string>(layoff?.reasonOther || "")
  const [source, setSource] = useState<string>(layoff?.source || "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  React.useEffect(() => {
    if (layoff) {
      setLayoffDate(new Date(layoff.layoffDate))
      setNumberOfEmployeesLaidOff(layoff.numberOfEmployeesLaidOff.toString())
      setReason(layoff.reason)
      setReasonOther(layoff.reasonOther || "")
      setSource(layoff.source)
    } else {
      // Reset form for new layoff
      setLayoffDate(undefined)
      setNumberOfEmployeesLaidOff("")
      setReason("Cost reduction")
      setReasonOther("")
      setSource("")
    }
    setErrors({})
  }, [layoff, open])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!layoffDate) {
      newErrors.layoffDate = "Layoff date is required"
    } else {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (layoffDate > today) {
        newErrors.layoffDate = "Layoff date cannot be in the future"
      }
    }

    if (!numberOfEmployeesLaidOff || numberOfEmployeesLaidOff.trim() === "") {
      newErrors.numberOfEmployeesLaidOff = "Number of employees is required"
    } else {
      const num = parseInt(numberOfEmployeesLaidOff)
      if (isNaN(num) || num <= 0) {
        newErrors.numberOfEmployeesLaidOff = "Number must be a positive integer"
      }
    }

    if (!source || source.trim() === "") {
      newErrors.source = "Source is required"
    }

    if (reason === "Other" && (!reasonOther || reasonOther.trim() === "")) {
      newErrors.reasonOther = "Please specify the reason"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        employerId: "", // Will be set by parent
        layoffDate: layoffDate!,
        numberOfEmployeesLaidOff: parseInt(numberOfEmployeesLaidOff),
        reason,
        reasonOther: reason === "Other" ? reasonOther : undefined,
        source: source.trim()
      })
      onOpenChange(false)
    } catch (error) {
      // Error already handled in parent
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{layoff ? "Edit Layoff" : "Add Layoff"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Layoff Date */}
          <div className="space-y-2">
            <Label htmlFor="layoffDate">Layoff Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !layoffDate && "text-muted-foreground",
                    errors.layoffDate && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {layoffDate ? format(layoffDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={layoffDate}
                  onSelect={setLayoffDate}
                  disabled={(date) => date > new Date()}
                  captionLayout="dropdown"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.layoffDate && (
              <p className="text-sm text-destructive">{errors.layoffDate}</p>
            )}
          </div>

          {/* Number of Employees */}
          <div className="space-y-2">
            <Label htmlFor="numberOfEmployeesLaidOff">Number of Employees Laid Off *</Label>
            <Input
              id="numberOfEmployeesLaidOff"
              type="number"
              min="1"
              value={numberOfEmployeesLaidOff}
              onChange={(e) => setNumberOfEmployeesLaidOff(e.target.value)}
              placeholder="e.g., 50"
              className={errors.numberOfEmployeesLaidOff ? "border-destructive" : ""}
            />
            {errors.numberOfEmployeesLaidOff && (
              <p className="text-sm text-destructive">{errors.numberOfEmployeesLaidOff}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as LayoffReason)}>
              <SelectTrigger className={errors.reason ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LAYOFF_REASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === "Other" && (
              <div className="mt-2">
                <Input
                  placeholder="Specify reason"
                  value={reasonOther}
                  onChange={(e) => setReasonOther(e.target.value)}
                  className={errors.reasonOther ? "border-destructive" : ""}
                />
                {errors.reasonOther && (
                  <p className="text-sm text-destructive mt-1">{errors.reasonOther}</p>
                )}
              </div>
            )}
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Company announcement, News article"
              className={errors.source ? "border-destructive" : ""}
            />
            {errors.source && (
              <p className="text-sm text-destructive">{errors.source}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
