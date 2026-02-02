"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useRef, Fragment } from "react"
import { useRouter } from "next/navigation"
import { 
  ExternalLink, 
  Download, 
  Mail, 
  Phone, 
  Github, 
  Linkedin, 
  User, 
  Briefcase, 
  GraduationCap,
  Award,
  Building2,
  ChevronDown,
  ChevronRight,
  Code,
  FolderOpen,
  Globe,
  ShieldCheck,
  CheckCircle,
  Users,
  Pencil,
  Check,
  Save,
  X,
  Loader2,
  CalendarIcon,
  ChevronsUpDown,
  Headphones
} from "lucide-react"

import { Candidate, Competition, Achievement, AchievementType, CANDIDATE_STATUS_COLORS, CANDIDATE_STATUS_LABELS } from "@/lib/types/candidate"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { FieldHistoryPopover } from "@/components/ui/field-history-popover"
import { CandidateCreationDialog, CandidateFormData, VerificationState } from "@/components/candidate-creation-dialog"
import { 
  getVerificationsForCandidate,
  calculateVerificationSummary,
  getAuditLogsForVerification,
  sampleVerificationUsers,
} from "@/lib/sample-data/verification"
import { toast } from "sonner"
import { EmployerCreationDialog, EmployerFormData } from "@/components/employer-creation-dialog"
import { ProjectCreationDialog, ProjectFormData } from "@/components/project-creation-dialog"
import { UniversityCreationDialog, UniversityFormData } from "@/components/university-creation-dialog"
import { CertificationCreationDialog, CertificationFormData } from "@/components/certification-creation-dialog"
import { ColdCallerDialog } from "@/components/cold-caller"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { formatBenefitAmount } from "@/lib/sample-data/benefits"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { BenefitsSelector } from "@/components/ui/benefits-selector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmployerBenefit } from "@/lib/types/benefits"

// Option interfaces and data for comboboxes
interface ComboboxOption {
  value: string
  label: string
}

// Shift type options
const shiftTypeOptions: ComboboxOption[] = [
  { label: "Morning", value: "Morning" },
  { label: "Evening", value: "Evening" },
  { label: "Night", value: "Night" },
  { label: "Rotational", value: "Rotational" },
  { label: "24x7", value: "24x7" },
]

// Work mode options
const workModeOptions: ComboboxOption[] = [
  { label: "Remote", value: "Remote" },
  { label: "Onsite", value: "Onsite" },
  { label: "Hybrid", value: "Hybrid" },
]

// Personality type options (MBTI types)
const personalityTypeOptions: ComboboxOption[] = [
  { value: "ESTJ", label: "ESTJ - Executive" },
  { value: "ENTJ", label: "ENTJ - Commander" },
  { value: "ESFJ", label: "ESFJ - Consul" },
  { value: "ENFJ", label: "ENFJ - Protagonist" },
  { value: "ISTJ", label: "ISTJ - Logistician" },
  { value: "ISFJ", label: "ISFJ - Defender" },
  { value: "INTJ", label: "INTJ - Architect" },
  { value: "INFJ", label: "INFJ - Advocate" },
  { value: "ESTP", label: "ESTP - Entrepreneur" },
  { value: "ESFP", label: "ESFP - Entertainer" },
  { value: "ENTP", label: "ENTP - Debater" },
  { value: "ENFP", label: "ENFP - Campaigner" },
  { value: "ISTP", label: "ISTP - Virtuoso" },
  { value: "ISFP", label: "ISFP - Adventurer" },
  { value: "INTP", label: "INTP - Thinker" },
  { value: "INFP", label: "INFP - Mediator" },
]

// Time support zone options
const timeSupportZoneOptions: MultiSelectOption[] = [
  { label: "US", value: "US" },
  { label: "UK", value: "UK" },
  { label: "EU", value: "EU" },
  { label: "APAC", value: "APAC" },
  { label: "MEA", value: "MEA" },
]

// Extract unique degree names from sample candidates
const extractUniqueDegreeNames = (): ComboboxOption[] => {
  const degrees = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.educations?.forEach(education => {
      if (education.degreeName) {
        degrees.add(education.degreeName)
      }
    })
  })
  return Array.from(degrees).sort().map(degree => ({
    label: degree,
    value: degree
  }))
}

// Extract unique major names from sample candidates
const extractUniqueMajorNames = (): ComboboxOption[] => {
  const majors = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.educations?.forEach(education => {
      if (education.majorName) {
        majors.add(education.majorName)
      }
    })
  })
  return Array.from(majors).sort().map(major => ({
    label: major,
    value: major
  }))
}

// Base options (extracted from sample data)
const baseDegreeOptions: ComboboxOption[] = extractUniqueDegreeNames()
const baseMajorOptions: ComboboxOption[] = extractUniqueMajorNames()

// Base employer options
const baseEmployerOptions: ComboboxOption[] = sampleEmployers.map(employer => ({
  label: employer.name,
  value: employer.name
}))

// Base project options
const baseProjectOptions: ComboboxOption[] = sampleProjects.map(project => ({
  label: project.projectName,
  value: project.projectName
}))

// Base university location options
const baseUniversityLocationOptions: ComboboxOption[] = sampleUniversities.flatMap(university =>
  university.locations.map(location => ({
    label: `${university.name} - ${location.city}`,
    value: location.id
  }))
)

// Base certification options
const baseCertificationOptions: ComboboxOption[] = sampleCertifications.map(cert => ({
  label: cert.certificationName,
  value: cert.id
}))

// Extract unique tech stacks from sample projects and candidates
const extractUniqueTechStacks = (): MultiSelectOption[] => {
  const techStacks = new Set<string>()
  // From projects
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  // From candidates
  sampleCandidates.forEach(candidate => {
    candidate.techStacks?.forEach(tech => techStacks.add(tech))
    candidate.workExperiences?.forEach(exp => {
      exp.techStacks.forEach(tech => techStacks.add(tech))
    })
  })
  return Array.from(techStacks).sort().map(tech => ({
    value: tech,
    label: tech
  }))
}

// Extract unique horizontal domains from sample projects
const extractUniqueHorizontalDomains = (): MultiSelectOption[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.horizontalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort().map(domain => ({
    label: domain,
    value: domain
  }))
}

// Base tech stack options
const baseTechStackOptions: MultiSelectOption[] = extractUniqueTechStacks()
// Base horizontal domain options
const baseHorizontalDomainOptions: MultiSelectOption[] = extractUniqueHorizontalDomains()

interface CandidateDetailsModalProps {
  candidate: Candidate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const normalizeKey = (value: string) => value.trim().toLowerCase()

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
        ? "bg-teal-100 text-teal-700 border border-teal-300 dark:bg-teal-950/30 dark:text-teal-200 dark:border-teal-800"
        : "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-800"

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
        <span className="text-xs px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-800 flex items-center gap-1">
          <Users className="size-3" />
          {teamSize}
        </span>
      )}
    </div>
  )
}



// InlineEditableTextarea component for long text fields (like contribution notes)
interface InlineEditableTextareaProps {
  label?: string
  value: string | null | undefined
  fieldName: string
  onSave: (fieldName: string, newValue: string, shouldVerify: boolean) => Promise<void>
  maxLength?: number
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
}

const InlineEditableTextarea: React.FC<InlineEditableTextareaProps> = ({
  label,
  value,
  fieldName,
  onSave,
  maxLength = 100,
  verificationIndicator,
  getFieldVerification,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '')
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || ''
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
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
    // Allow Shift+Enter for new lines, but Ctrl/Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const displayText = value || ''
  const shouldTruncate = displayText.length > maxLength
  const truncatedText = shouldTruncate && !isExpanded 
    ? `${displayText.slice(0, maxLength)}...` 
    : displayText

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        )}
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn("min-h-[80px] resize-none text-sm", error && "border-red-500")}
            autoFocus
            disabled={isSaving}
            placeholder="Describe your key contributions, achievements, and responsibilities in this project..."
          />
          <div className="flex items-center gap-2">
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
          {/* Mark as verified checkbox - only in edit mode */}
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
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  if (!displayText) {
    return null
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{truncatedText}</p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:underline mt-1 font-medium transition-colors cursor-pointer"
            type="button"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      {/* Three badges: Verification, History, Edit */}
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        {/* Edit Icon Badge - Always visible for quick access */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title="Edit contribution notes"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// InlineEditableCombobox component for dropdown/combobox fields
interface InlineEditableComboboxProps {
  label: string
  value: string
  fieldName: string
  options: ComboboxOption[]
  onSave: (fieldName: string, newValue: string, shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  renderDisplay?: (displayValue: string, value: string) => React.ReactNode
  creatable?: boolean
  createLabel?: string
  onCreateNew?: (searchValue: string) => void
  onCreateDialog?: (searchValue: string) => void
}

const InlineEditableCombobox: React.FC<InlineEditableComboboxProps> = ({
  label,
  value,
  fieldName,
  options,
  onSave,
  verificationIndicator,
  getFieldVerification,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className = "",
  renderDisplay,
  creatable = false,
  createLabel,
  onCreateNew,
  onCreateDialog
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '')
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
    setOpen(false)
    setSearchValue("")
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || ''
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
      setIsEditing(false)
      setOpen(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
      setOpen(false)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleValueChange = (newValue: string) => {
    setEditValue(newValue)
    setOpen(false)
    setSearchValue("")
  }

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) return options
    const searchLower = searchValue.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower)
    )
  }, [options, searchValue])

  // Check if search value already exists
  const searchValueExists = useMemo(() => {
    if (!searchValue.trim()) return false
    const searchLower = searchValue.trim().toLowerCase()
    return options.some(option => 
      option.value.toLowerCase() === searchLower ||
      option.label.toLowerCase() === searchLower
    ) || value.toLowerCase() === searchLower
  }, [options, value, searchValue])

  // Check if we should show "Create" option
  const shouldShowCreate = creatable && 
    searchValue.trim().length >= 2 && 
    !searchValueExists && 
    filteredOptions.length === 0

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(searchValue.trim())
      setSearchValue("")
      setOpen(false)
    } else if (onCreateDialog) {
      onCreateDialog(searchValue.trim())
      setSearchValue("")
      setOpen(false)
    }
  }

  const displayValue = value 
    ? (options.find(opt => opt.value === value)?.label || value)
    : 'N/A'

  // Display mode - check if custom renderer is provided
  if (!isEditing && renderDisplay) {
    return (
      <div className={cn("flex items-center justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
        <div className="flex-1 min-w-0">
          {label && (
            <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
          )}
          {renderDisplay(displayValue, value)}
        </div>
        {/* Three badges: Verification, History, Edit */}
        <div className="flex items-center gap-1 shrink-0">
          {verificationIndicator}
          {/* Edit Icon Badge - Always visible for quick access */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <div className="space-y-2">
          <Popover open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              setSearchValue("")
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isSaving}
              >
                {editValue
                  ? options.find((option) => option.value === editValue)?.label
                  : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder={searchPlaceholder} 
                  className="h-9"
                  value={searchValue}
                  onValueChange={setSearchValue}
                  onKeyDown={(e) => {
                    if (creatable && e.key === "Enter" && shouldShowCreate) {
                      e.preventDefault()
                      handleCreateNew()
                    }
                  }}
                />
                <CommandList>
                  {shouldShowCreate ? (
                    <>
                      <CommandEmpty>
                        <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                          {emptyMessage}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value={searchValue}
                          onSelect={handleCreateNew}
                          className="cursor-pointer font-medium text-primary border-t border-border"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {createLabel 
                            ? (searchValue.trim() ? `Create "${searchValue.trim()}"` : createLabel)
                            : `Add "${searchValue.trim()}"`}
                        </CommandItem>
                      </CommandGroup>
                    </>
                  ) : filteredOptions.length === 0 ? (
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => handleValueChange(option.value)}
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
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
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
          {/* Mark as verified checkbox - only in edit mode */}
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
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex-1 min-w-0">
        {label && (
          <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
        )}
        {renderDisplay ? (
          renderDisplay(displayValue, value)
        ) : (
          <span className={`text-sm block ${!value ? 'text-muted-foreground italic' : ''}`}>
            {displayValue}
          </span>
        )}
      </div>
      {/* Three badges: Verification, History, Edit */}
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        {/* Edit Icon Badge - Always visible for quick access */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title={`Edit ${label.toLowerCase()}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// InlineEditableDate component for date fields
interface InlineEditableDateProps {
  label: string
  value: Date | undefined
  fieldName: string
  onSave: (fieldName: string, newValue: Date | undefined, shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  formatDisplay: (date: Date | undefined) => string
  className?: string
  mode?: 'date' | 'month' // For education dates (month/year only)
}

const InlineEditableDate: React.FC<InlineEditableDateProps> = ({
  label,
  value,
  fieldName,
  onSave,
  verificationIndicator,
  getFieldVerification,
  formatDisplay,
  className = "",
  mode = 'date'
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<Date | undefined>(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [open, setOpen] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
    setError(null)
    setOpen(false)
  }

  const handleSave = async () => {
    // No change check
    const verificationChanged = willVerify !== isCurrentlyVerified
    const dateChanged = editValue?.getTime() !== value?.getTime()
    if (!dateChanged && !verificationChanged) {
      setIsEditing(false)
      setOpen(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
      setOpen(false)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayValue = formatDisplay(value)

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <div className="space-y-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal"
                disabled={isSaving}
              >
                {editValue ? (
                  mode === 'month' 
                    ? editValue.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : editValue.toLocaleDateString()
                ) : (
                  `Select ${label.toLowerCase()}`
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editValue}
                onSelect={(date) => {
                  setEditValue(date)
                  setOpen(false)
                }}
                captionLayout={mode === 'month' ? "dropdown" : "dropdown"}
                disabled={isSaving}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
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
          {/* Mark as verified checkbox - only in edit mode */}
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
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
        <span className={`text-sm block ${!value ? 'text-muted-foreground italic' : ''}`}>
          {displayValue}
        </span>
      </div>
      {/* Three badges: Verification, History, Edit */}
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        {/* Edit Icon Badge - Always visible for quick access */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title={`Edit ${label.toLowerCase()}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// InlineEditableMultiSelect component for tech stacks
interface InlineEditableMultiSelectProps {
  label: string
  value: string[]
  fieldName: string
  options: MultiSelectOption[]
  onSave: (fieldName: string, newValue: string[], shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
  placeholder?: string
  searchPlaceholder?: string
  badgeColorClass?: string
  maxDisplay?: number
  creatable?: boolean
  createLabel?: string
  onCreateNew?: (value: string) => void
}

const InlineEditableMultiSelect: React.FC<InlineEditableMultiSelectProps> = ({
  label,
  value,
  fieldName,
  options,
  onSave,
  verificationIndicator,
  getFieldVerification,
  className = "",
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  badgeColorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  maxDisplay = 5,
  creatable = false,
  createLabel,
  onCreateNew
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string[]>(value || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || [])
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
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
            <MultiSelect
              items={options}
              selected={editValue}
              onChange={(values) => setEditValue(values)}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              maxDisplay={maxDisplay}
              creatable={creatable}
              createLabel={createLabel}
              onCreateNew={onCreateNew}
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
              {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
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
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {verificationIndicator}
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
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {displayItemsToShow.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className={cn(badgeColorClass, "text-xs")}
            >
              {item}
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
              +{remainingCount} more
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
      ) : (
        <p className="text-sm text-muted-foreground italic">No items selected</p>
      )}
    </div>
  )
}

// InlineEditableBenefits component for benefits
interface InlineEditableBenefitsProps {
  label: string
  value: EmployerBenefit[]
  fieldName: string
  onSave: (fieldName: string, newValue: EmployerBenefit[], shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
  maxDisplay?: number
}

const InlineEditableBenefits: React.FC<InlineEditableBenefitsProps> = ({
  label,
  value,
  fieldName,
  onSave,
  verificationIndicator,
  getFieldVerification,
  className = "",
  maxDisplay = 4
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<EmployerBenefit[]>(value || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || [])
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
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
              {willVerify ? '✓ Mark as verified' : 'Mark as verified'}
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
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {verificationIndicator}
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
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {displayItemsToShow.map((benefit, index) => (
            <Badge 
              key={benefit.id || index} 
              variant="outline" 
              className="text-xs bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800"
            >
              {benefit.name}
              {benefit.amount !== null && (
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
              +{remainingCount} more
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
      ) : (
        <p className="text-sm text-muted-foreground italic">No benefits selected</p>
      )}
    </div>
  )
}

// Validation functions
const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Invalid email format'
  }
  return null
}

const validateURL = (url: string): string | null => {
  if (!url || url.trim() === '') return null // Optional field
  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL format'
  }
}

const validateLinkedInURL = (url: string): string | null => {
  if (!url || url.trim() === '') return null
  if (!url.includes('linkedin.com')) {
    return 'Must be a LinkedIn URL'
  }
  return validateURL(url)
}

const validateGitHubURL = (url: string): string | null => {
  if (!url || url.trim() === '') return null
  if (!url.includes('github.com')) {
    return 'Must be a GitHub URL'
  }
  return validateURL(url)
}

const validateCNIC = (cnic: string): string | null => {
  if (!cnic || cnic.trim() === '') return 'CNIC is required'
  const cnicRegex = /^\d{5}-\d{7}-\d$/
  if (!cnicRegex.test(cnic.trim())) {
    return 'CNIC format: 12345-1234567-1'
  }
  return null
}

const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') return 'Contact number is required'
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  if (!phoneRegex.test(phone)) {
    return 'Invalid phone number format'
  }
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 10) {
    return 'Phone number must be at least 10 digits'
  }
  return null
}

const validateSalary = (salary: string): string | null => {
  if (!salary || salary.trim() === '') return null // Optional field
  const num = Number(salary)
  if (isNaN(num)) return 'Must be a valid number'
  if (num < 0) return 'Salary cannot be negative'
  if (num > 10000000) return 'Salary seems too high'
  return null
}

const validateName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'Name is required'
  if (name.trim().length < 2) return 'Name must be at least 2 characters'
  if (name.trim().length > 100) return 'Name is too long'
  return null
}

// InlineEditableField component with edit + verification
interface InlineEditableFieldProps {
  label: string
  value: string | number | null | undefined
  fieldName: string
  fieldType?: 'text' | 'email' | 'url' | 'number'
  validation?: (value: string) => string | null
  onSave: (fieldName: string, newValue: string | number, shouldVerify: boolean) => Promise<void>
  formatDisplay?: (value: string | number | null | undefined) => string
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
}

const InlineEditableField: React.FC<InlineEditableFieldProps> = ({
  label,
  value,
  fieldName,
  fieldType = 'text',
  validation,
  onSave,
  formatDisplay,
  verificationIndicator,
  getFieldVerification,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value !== null && value !== undefined ? String(value) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value !== null && value !== undefined ? String(value) : '')
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(isCurrentlyVerified) // Initialize checkbox to current verification status
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(isCurrentlyVerified)
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

    // No change check
    const currentValue = value !== null && value !== undefined ? String(value) : ''
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      const newValue = fieldType === 'number' ? Number(editValue) : editValue
      await onSave(fieldName, newValue, willVerify)
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
      e.preventDefault()
      handleCancel()
    }
  }

  const displayValue = formatDisplay 
    ? formatDisplay(value) 
    : (value !== null && value !== undefined ? String(value) : 'N/A')

  return (
    <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
              <Input
                type={fieldType}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn("text-sm", error && "border-red-500")}
                autoFocus
                disabled={isSaving}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0 shrink-0"
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
                className="h-8 w-8 p-0 shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {/* Mark as verified checkbox - only in edit mode */}
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
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between group w-full">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
              <span className={`text-sm block ${value === null || value === undefined ? 'text-muted-foreground italic' : ''}`}>
                {displayValue}
              </span>
            </div>
            {/* Three badges: Verification, History, Edit */}
            <div className="flex items-center gap-1 shrink-0">
              {verificationIndicator}
              {/* Edit Icon Badge - Always visible for quick access */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                type="button"
                title="Edit field"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Inline Editable Checkbox Component
interface InlineEditableCheckboxProps {
  label: string
  value: boolean
  fieldName: string
  onSave: (fieldName: string, newValue: boolean, verify: boolean) => Promise<void>
  getFieldVerification?: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
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
  
  const verification = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'
  
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
    const verificationData = getFieldVerification?.(fName)
    const status = verificationData?.status || 'unverified'
    
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
              {/* Checkbox */}
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
            {value && (
              <Badge 
                variant="default" 
                className={cn(
                  "text-xs",
                  label === "Topper" && "bg-yellow-500 hover:bg-yellow-600",
                  label === "Cheetah" && "bg-orange-500 hover:bg-orange-600",
                  label === "Top Developer" && "bg-blue-500 hover:bg-blue-600"
                )}
              >
                {label}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get job title from first work experience
const getJobTitle = (candidate: Candidate): string => {
  return candidate.workExperiences?.[0]?.jobTitle || "N/A"
}

// Helper function to calculate candidate's average tenure across all employers
const calculateCandidateAverageTenure = (candidate: Candidate): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  const today = new Date()
  const employerTenures: number[] = []

  // Group work experiences by employer to calculate tenure per employer
  const employerMap = new Map<string, { startDate: Date | null, endDate: Date | null }>()

  candidate.workExperiences.forEach(we => {
    const employerName = we.employerName.toLowerCase().trim()
    const startDate = we.startDate ? new Date(we.startDate) : null
    const endDate = we.endDate ? new Date(we.endDate) : null

    if (!employerMap.has(employerName)) {
      employerMap.set(employerName, { startDate: null, endDate: null })
    }

    const existing = employerMap.get(employerName)!

    // Update start date (earliest)
    if (startDate && (!existing.startDate || startDate < existing.startDate)) {
      existing.startDate = startDate
    }

    // Update end date (latest)
    if (endDate && (!existing.endDate || endDate > existing.endDate)) {
      existing.endDate = endDate
    } else if (!endDate && !existing.endDate) {
      // Current job
      existing.endDate = today
    }
  })

  // Calculate tenure for each employer
  employerMap.forEach(({ startDate, endDate }) => {
    if (startDate && endDate) {
      // Calculate tenure in years
      const tenureMs = endDate.getTime() - startDate.getTime()
      const tenureYears = tenureMs / (1000 * 60 * 60 * 24 * 365.25)

      if (tenureYears > 0) {
        employerTenures.push(tenureYears)
      }
    }
  })

  // Calculate average across all employers
  if (employerTenures.length === 0) {
    return 0
  }

  const totalTenure = employerTenures.reduce((sum, tenure) => sum + tenure, 0)
  return Math.round((totalTenure / employerTenures.length) * 10) / 10 // Round to 1 decimal place
}

// Helper function to calculate promotions for a specific employer
const calculateEmployerPromotions = (candidate: Candidate, employerName: string): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  // Filter work experiences for this specific employer (case-insensitive)
  const employerExperiences = candidate.workExperiences
    .filter(we => we.employerName.toLowerCase().trim() === employerName.toLowerCase().trim())
    .filter(we => we.startDate) // Must have start date
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())

  if (employerExperiences.length < 2) {
    return 0 // Need at least 2 experiences to have a promotion
  }

  // Count unique job titles - each change represents a promotion
  const uniqueTitles = new Set<string>()

  employerExperiences.forEach((experience) => {
    if (experience.jobTitle) {
      const titleKey = experience.jobTitle.toLowerCase().trim()
      uniqueTitles.add(titleKey)
    }
  })

  // Number of promotions = number of unique titles - 1
  return uniqueTitles.size - 1
}

// Helper function to calculate total years of experience from work experiences
const calculateYearsOfExperience = (candidate: Candidate): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  const today = new Date()
  let totalMonths = 0

  candidate.workExperiences.forEach(we => {
    if (!we.startDate) return

    const startDate = new Date(we.startDate)
    const endDate = we.endDate ? new Date(we.endDate) : today

    // Calculate months between start and end
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthsDiff = endDate.getMonth() - startDate.getMonth()
    const totalMonthsForThisJob = yearsDiff * 12 + monthsDiff

    // Add days for more precision (approximate)
    const daysDiff = endDate.getDate() - startDate.getDate()
    const approximateMonths = totalMonthsForThisJob + (daysDiff / 30)

    if (approximateMonths > 0) {
      totalMonths += approximateMonths
    }
  })

  // Convert to years (with 1 decimal place precision)
  const totalYears = totalMonths / 12
  return Math.round(totalYears * 10) / 10 // Round to 1 decimal place
}

export function CandidateDetailsModal({ 
  candidate, 
  open, 
  onOpenChange 
}: CandidateDetailsModalProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "work-experience", "tech-stacks", "independent-projects", "education", "certifications", "verification"]))
  const [activeSection, setActiveSection] = useState<string>("basic-info")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  
  // Options state (for creatable functionality)
  const [employerOptions, setEmployerOptions] = useState<ComboboxOption[]>(baseEmployerOptions)
  const [projectOptions, setProjectOptions] = useState<ComboboxOption[]>(baseProjectOptions)
  const [universityLocationOptions, setUniversityLocationOptions] = useState<ComboboxOption[]>(baseUniversityLocationOptions)
  const [certificationOptions, setCertificationOptions] = useState<ComboboxOption[]>(baseCertificationOptions)
  const [degreeOptions, setDegreeOptions] = useState<ComboboxOption[]>(baseDegreeOptions)
  const [majorOptions, setMajorOptions] = useState<ComboboxOption[]>(baseMajorOptions)
  const [techStackOptions, setTechStackOptions] = useState<MultiSelectOption[]>(baseTechStackOptions)
  const [horizontalDomainOptions, setHorizontalDomainOptions] = useState<MultiSelectOption[]>(baseHorizontalDomainOptions)
  
  // Creation dialog state
  const [createEmployerDialogOpen, setCreateEmployerDialogOpen] = useState(false)
  const [pendingEmployerName, setPendingEmployerName] = useState<string>("")
  const [pendingEmployerFieldName, setPendingEmployerFieldName] = useState<string | null>(null)
  
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false)
  const [pendingProjectName, setPendingProjectName] = useState<string>("")
  const [pendingProjectFieldName, setPendingProjectFieldName] = useState<string | null>(null)
  
  const [createUniversityDialogOpen, setCreateUniversityDialogOpen] = useState(false)
  const [pendingUniversityName, setPendingUniversityName] = useState<string>("")
  const [pendingUniversityFieldName, setPendingUniversityFieldName] = useState<string | null>(null)
  
  const [createCertificationDialogOpen, setCreateCertificationDialogOpen] = useState(false)
  const [pendingCertificationName, setPendingCertificationName] = useState<string>("")
  const [pendingCertificationFieldName, setPendingCertificationFieldName] = useState<string | null>(null)
  
  // Define sections for navigation
  const sections = [
    { id: "basic", sectionId: "basic-info", label: "Basic Information", shortLabel: "Basic" },
    { id: "work-experience", sectionId: "work-experience", label: "Work Experience", shortLabel: "Experience" },
    { id: "tech-stacks", sectionId: "tech-stacks", label: "Tech Stacks", shortLabel: "Tech" },
    { id: "independent-projects", sectionId: "projects", label: "Projects", shortLabel: "Projects" },
    { id: "education", sectionId: "education", label: "Education", shortLabel: "Education" },
    { id: "certifications", sectionId: "certifications", label: "Certifications", shortLabel: "Certs" },
    { id: "competitions", sectionId: "competitions", label: "Achievements", shortLabel: "Achievements" },
  ]

  const projectsByName = useMemo(() => {
    const map = new Map<string, (typeof sampleProjects)[number]>()
    sampleProjects.forEach((p) => {
      map.set(normalizeKey(p.projectName), p)
    })
    return map
  }, [])

  const getProjectDetails = (projectName: string) => {
    const project = projectsByName.get(normalizeKey(projectName))
    return {
      verticalDomains: project?.verticalDomains ?? [],
      horizontalDomains: project?.horizontalDomains ?? [],
      teamSize: project?.teamSize ?? null,
    }
  }

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (!element || !scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const yOffset = 80 // Account for sticky header
    
    // Ensure section is expanded before scrolling
    const sectionKey = sections.find(s => s.sectionId === sectionId)?.id
    if (sectionKey && !expandedSections.has(sectionKey)) {
      toggleSection(sectionKey)
      // Wait for expansion animation before scrolling
      setTimeout(() => {
        scrollToElement(element, container, yOffset, sectionId)
      }, 300)
    } else {
      scrollToElement(element, container, yOffset, sectionId)
    }
  }

  // Helper function to scroll to element
  const scrollToElement = (element: HTMLElement, container: HTMLElement, yOffset: number, sectionId: string) => {
    // Set flag to prevent IntersectionObserver from interfering
    isScrollingRef.current = true
    
    // Update active section immediately
    setActiveSection(sectionId)
    
    // Use requestAnimationFrame to ensure layout is calculated
    requestAnimationFrame(() => {
      // Get current scroll position
      const currentScrollTop = container.scrollTop
      
      // Get bounding rects
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      
      // Calculate element's position relative to container's scrollable content
      // elementRect.top is relative to viewport
      // containerRect.top is container's position in viewport
      // currentScrollTop is how much we've scrolled
      const elementTopInContainer = elementRect.top - containerRect.top + currentScrollTop
      
      // Calculate target scroll position accounting for sticky header
      const targetScrollTop = elementTopInContainer - yOffset
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      })
      
      // Reset flag after scroll completes (smooth scroll takes ~500ms)
      setTimeout(() => {
        isScrollingRef.current = false
      }, 600)
    })
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    scrollToSection(value)
  }

  // IntersectionObserver to detect active section
  useEffect(() => {
    if (!candidate || !open || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const sectionIds = sections.map(s => s.sectionId)
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update if we're manually scrolling
        if (isScrollingRef.current) return
        
        // Find the entry with the highest intersection ratio
        let maxRatio = 0
        let activeId = sectionIds[0] || "basic-info"
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            activeId = entry.target.id
          }
        })
        
        if (maxRatio > 0.2) {
          setActiveSection(activeId)
        }
      },
      {
        threshold: [0.2, 0.5, 0.8],
        root: container,
        rootMargin: '-80px 0px -60% 0px'
      }
    )

    // Observe all sections
    const sectionElements: (Element | null)[] = []
    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
        sectionElements.push(element)
      }
    })

    return () => {
      sectionElements.forEach((element) => {
        if (element) observer.unobserve(element)
      })
      observer.disconnect()
    }
  }, [candidate, open])
  
  // State for Edit dialog (now includes verification by default)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  
  // State for Cold Caller dialog
  const [coldCallerDialogOpen, setColdCallerDialogOpen] = useState(false)
  
  // Handle inline field save with verification
  const handleFieldSave = async (fieldName: string, newValue: string | number | Date | undefined | string[] | EmployerBenefit[] | boolean, shouldVerify: boolean) => {
    if (!candidate) return
    
    try {
      // In real app, this would call API to update candidate field AND verification
      // await updateCandidateField(candidate.id, {
      //   fieldName,
      //   newValue,
      //   verify: shouldVerify,
      //   verifiedBy: currentUserId,
      //   verifiedAt: new Date(),
      //   source: 'manual'
      // })
      
      // For now, just show success message
      const message = shouldVerify 
        ? `${fieldName} updated and verified ✓` 
        : `${fieldName} updated`
      toast.success(message)
      
      // Note: In real implementation, you'd update local state or refetch candidate data
      // This would also update the verification status in the verification system
    } catch (error) {
      toast.error('Failed to save. Please try again.')
      throw error
    }
  }
  
  // Wrapper for multi-select field save
  const handleMultiSelectFieldSave = async (fieldName: string, newValue: string[], shouldVerify: boolean) => {
    await handleFieldSave(fieldName, newValue, shouldVerify)
  }
  
  // Wrapper for benefits field save
  const handleBenefitsFieldSave = async (fieldName: string, newValue: EmployerBenefit[], shouldVerify: boolean) => {
    await handleFieldSave(fieldName, newValue, shouldVerify)
  }

  // Handle employer creation
  const handleEmployerCreated = async (employerData: EmployerFormData) => {
    try {
      const newEmployerName = employerData.name.trim()
      
      if (!newEmployerName) {
        toast.error("Employer name is required")
        return
      }

      // Add new employer to options
      const newOption = { label: newEmployerName, value: newEmployerName }
      setEmployerOptions(prev => {
        const updated = [...prev, newOption]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the newly created employer if we have a pending field
      if (pendingEmployerFieldName) {
        await handleFieldSave(pendingEmployerFieldName, newEmployerName, false)
      }

      toast.success(`Employer "${newEmployerName}" has been created successfully.`)
      setCreateEmployerDialogOpen(false)
      setPendingEmployerName("")
      setPendingEmployerFieldName(null)
    } catch (error) {
      console.error("Error creating employer:", error)
      toast.error("Failed to create employer. Please try again.")
    }
  }

  // Handle project creation
  const handleProjectCreated = async (projectData: ProjectFormData) => {
    try {
      const newProjectName = projectData.projectName.trim()
      
      if (!newProjectName) {
        toast.error("Project name is required")
        return
      }

      // Add new project to options
      const newOption = { label: newProjectName, value: newProjectName }
      setProjectOptions(prev => {
        const updated = [...prev, newOption]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the newly created project if we have a pending field
      if (pendingProjectFieldName) {
        await handleFieldSave(pendingProjectFieldName, newProjectName, false)
      }

      toast.success(`Project "${newProjectName}" has been created successfully.`)
      setCreateProjectDialogOpen(false)
      setPendingProjectName("")
      setPendingProjectFieldName(null)
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project. Please try again.")
    }
  }

  // Handle university creation
  const handleUniversityCreated = async (universityData: UniversityFormData) => {
    try {
      const universityName = universityData.name.trim()
      
      if (!universityName) {
        toast.error("University name is required")
        return
      }

      // Create location options for the new university
      const newLocationOptions: ComboboxOption[] = universityData.locations.map(location => ({
        label: `${universityName} - ${location.city}`,
        value: location.id
      }))
      
      // Add new location options to universityLocationOptions
      setUniversityLocationOptions(prev => {
        const updated = [...prev, ...newLocationOptions]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the first location (or main campus if available) if we have a pending field
      if (pendingUniversityFieldName) {
        const mainCampus = universityData.locations.find(loc => loc.isMainCampus)
        const locationToSelect = mainCampus || universityData.locations[0]
        
        if (locationToSelect) {
          await handleFieldSave(pendingUniversityFieldName, locationToSelect.id, false)
          // Also update the name field if it exists
          const nameFieldName = pendingUniversityFieldName.replace('.universityLocationId', '.universityLocationName')
          await handleFieldSave(nameFieldName, `${universityName} - ${locationToSelect.city}`, false)
        }
      }

      toast.success(`University "${universityName}" has been created successfully.`)
      setCreateUniversityDialogOpen(false)
      setPendingUniversityName("")
      setPendingUniversityFieldName(null)
    } catch (error) {
      console.error("Error creating university:", error)
      toast.error("Failed to create university. Please try again.")
    }
  }

  // Handle certification creation
  const handleCertificationCreated = async (certificationData: CertificationFormData) => {
    try {
      const certificationName = certificationData.certificationName.trim()
      
      if (!certificationName) {
        toast.error("Certification name is required")
        return
      }

      // Generate a new ID for the certification (in a real app, this would come from the API)
      const newCertificationId = crypto.randomUUID()
      
      // Create new certification option
      const newOption = { label: certificationName, value: newCertificationId }
      setCertificationOptions(prev => {
        const updated = [...prev, newOption]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the newly created certification if we have a pending field
      if (pendingCertificationFieldName) {
        await handleFieldSave(pendingCertificationFieldName, newCertificationId, false)
        // Also update the name field if it exists
        const nameFieldName = pendingCertificationFieldName.replace('.certificationId', '.certificationName')
        await handleFieldSave(nameFieldName, certificationName, false)
      }

      toast.success(`Certification "${certificationName}" has been created successfully.`)
      setCreateCertificationDialogOpen(false)
      setPendingCertificationName("")
      setPendingCertificationFieldName(null)
    } catch (error) {
      console.error("Error creating certification:", error)
      toast.error("Failed to create certification. Please try again.")
    }
  }
  
  // Handle edit submission (verification is always included in edit mode)
  const handleEditSubmit = async (formData: CandidateFormData, verificationState?: VerificationState) => {
    // In real app, this would call API to update candidate and save verifications
    console.log("Updating candidate with verification:", { formData, verificationState })
    
    // Show success message
    const verifiedCount = verificationState?.verifiedFields.size || 0
    const modifiedCount = verificationState?.modifiedFields.size || 0
    
    toast.success(
      `Candidate updated! ${verifiedCount} field(s) verified${modifiedCount > 0 ? `, ${modifiedCount} field(s) modified` : ''}.`,
      { duration: 4000 }
    )
    
    setEditDialogOpen(false)
  }

  // Get verification data for this candidate
  const verifications = useMemo(() => 
    candidate ? getVerificationsForCandidate(candidate.id) : [],
    [candidate]
  )
  
  const verificationSummary = useMemo(() => 
    candidate ? calculateVerificationSummary(candidate.id) : null,
    [candidate]
  )
  
  // Helper to get verification status for a field
  const getFieldVerification = (fieldName: string) => {
    return verifications.find(v => v.fieldName === fieldName)
  }
  
  // Helper to get audit history for a field
  const getFieldHistory = (fieldName: string) => {
    const verification = getFieldVerification(fieldName)
    if (!verification) return []
    return getAuditLogsForVerification(verification.id)
  }
  
  // Get user name from ID
  const getVerifiedByName = (userId: string | undefined) => {
    if (!userId) return undefined
    const user = sampleVerificationUsers.find(u => u.id === userId)
    return user?.name
  }

  // Calculate section-specific verification progress
  const calculateSectionProgress = (fieldNames: string[]): { percentage: number; verified: number; total: number } => {
    let verified = 0
    let total = 0

    fieldNames.forEach(fieldName => {
      total++
      const verification = getFieldVerification(fieldName)
      if (verification && verification.status === 'verified') {
        verified++
      }
    })

    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0
    return { percentage, verified, total }
  }

  // Get progress color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-500 hover:bg-green-600'
    if (percentage >= 70) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-red-500 hover:bg-red-600'
  }

  // Section Progress Badge Component
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

  // Calculate progress for each section
  const basicInfoFields = [
    'name', 'city', 'email', 'mobileNo', 'cnic', 'postingTitle', 
    'currentSalary', 'expectedSalary', 'source', 'githubUrl', 'linkedinUrl', 'resume', 'personalityType'
  ]
  const basicInfoProgress = useMemo(() => 
    calculateSectionProgress(basicInfoFields),
    [verifications, candidate]
  )

  const workExperienceProgress = useMemo(() => {
    if (!candidate?.workExperiences || candidate.workExperiences.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    candidate.workExperiences.forEach((exp, idx) => {
      fields.push(`workExperiences[${idx}].employerName`)
      fields.push(`workExperiences[${idx}].jobTitle`)
      fields.push(`workExperiences[${idx}].dates`)
      fields.push(`workExperiences[${idx}].shiftType`)
      fields.push(`workExperiences[${idx}].workMode`)
      fields.push(`workExperiences[${idx}].timeSupportZones`)
      fields.push(`workExperiences[${idx}].techStacks`)
      fields.push(`workExperiences[${idx}].domains`)  // NEW FIELD
      exp.projects.forEach((proj, projIdx) => {
        fields.push(`workExperiences[${idx}].projects[${projIdx}].projectName`)
        fields.push(`workExperiences[${idx}].projects[${projIdx}].contributionNotes`)
      })
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, candidate])

  const techStacksProgress = useMemo(() => {
    if (!candidate?.techStacks || candidate.techStacks.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    return calculateSectionProgress(['techStacks'])
  }, [verifications, candidate])

  const independentProjectsProgress = useMemo(() => {
    if (!candidate?.projects || candidate.projects.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    candidate.projects.forEach((proj, idx) => {
      fields.push(`projects[${idx}].projectName`)
      fields.push(`projects[${idx}].contributionNotes`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, candidate])

  const educationProgress = useMemo(() => {
    if (!candidate?.educations || candidate.educations.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    candidate.educations.forEach((edu, idx) => {
      fields.push(`educations[${idx}].universityLocationName`)
      fields.push(`educations[${idx}].degreeName`)
      fields.push(`educations[${idx}].majorName`)
      fields.push(`educations[${idx}].dates`)
      fields.push(`educations[${idx}].grades`)
      fields.push(`educations[${idx}].isTopper`)
      fields.push(`educations[${idx}].isCheetah`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, candidate])

  const certificationsProgress = useMemo(() => {
    if (!candidate?.certifications || candidate.certifications.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    candidate.certifications.forEach((cert, idx) => {
      fields.push(`certifications[${idx}].certificationName`)
      fields.push(`certifications[${idx}].issueDate`)
      fields.push(`certifications[${idx}].expiryDate`)
      fields.push(`certifications[${idx}].certificationUrl`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, candidate])

  const achievementsProgress = useMemo(() => {
    const achievements = candidate?.achievements || candidate?.competitions?.map(comp => ({
      id: comp.id,
      name: comp.competitionName,
      achievementType: "Competition" as const,
      ranking: comp.ranking,
      year: comp.year,
      url: comp.url,
      description: "",
    })) || []
    
    if (achievements.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    achievements.forEach((ach, idx) => {
      fields.push(`achievements[${idx}].name`)
      fields.push(`achievements[${idx}].achievementType`)
      fields.push(`achievements[${idx}].ranking`)
      fields.push(`achievements[${idx}].year`)
      fields.push(`achievements[${idx}].url`)
      fields.push(`achievements[${idx}].description`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, candidate])


  // Helper function to get progress for a section by sectionId
  const getSectionProgress = (sectionId: string) => {
    switch (sectionId) {
      case 'basic-info':
        return basicInfoProgress
      case 'work-experience':
        return workExperienceProgress
      case 'tech-stacks':
        return techStacksProgress
      case 'projects':
        return independentProjectsProgress
      case 'education':
        return educationProgress
      case 'certifications':
        return certificationsProgress
      case 'competitions':
        return achievementsProgress
      default:
        return { percentage: 0, verified: 0, total: 0 }
    }
  }

  // Helper function to get verification badge color (matches section badge styling)
  const getVerificationBadgeColor = (percentage: number): string => {
    if (percentage === 100) {
      return 'bg-green-500 hover:bg-green-600 text-white'
    } else if (percentage >= 70) {
      return 'bg-yellow-500 hover:bg-yellow-600 text-white'
    } else {
      return 'bg-red-500 hover:bg-red-600 text-white'
    }
  }

  if (!candidate) return null
  
  // Verification indicator component - shows badge and history together
  const VerificationIndicator = ({ 
    fieldName, 
    className = "" 
  }: { 
    fieldName: string
    className?: string 
  }) => {
    const verification = getFieldVerification(fieldName)
    const history = getFieldHistory(fieldName)
    
    // If no verification data exists, show unverified badge
    const status = verification?.status || 'unverified'
    
    return (
      <div className={`flex items-center gap-1 shrink-0 ${className}`}>
        <VerificationBadge 
          status={status}
          source={verification?.source}
          verifiedBy={getVerifiedByName(verification?.verifiedBy)}
          verifiedAt={verification?.verifiedAt}
          size="sm"
        />
        {history.length > 0 && (
          <FieldHistoryPopover 
            fieldName={fieldName}
            history={history}
          />
        )}
      </div>
    )
  }

  // Display field component with verification badge and history (always visible)
  const DisplayField = ({ 
    label, 
    value, 
    fieldName 
  }: { 
    label: string
    value: string | number | null | undefined
    fieldName: string
  }) => {
    const displayValue = value !== null && value !== undefined ? String(value) : 'N/A'
    
    return (
      <div className="flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
          <span className={`text-sm block ${value === null || value === undefined ? 'text-muted-foreground italic' : ''}`}>
            {displayValue}
          </span>
        </div>
        <VerificationIndicator fieldName={fieldName} />
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Present"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    }).format(date)
  }

  const formatMonth = (date: Date | undefined) => {
    if (!date) return "Present"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short'
    }).format(date)
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

  const handleEmployerClick = (employerName: string) => {
    // Find employer by name
    const employer = sampleEmployers.find(emp => 
      emp.name.trim().toLowerCase() === employerName.trim().toLowerCase()
    )
    if (employer) {
      const params = new URLSearchParams({
        employerFilter: employer.name,
        employerId: employer.id
      })
      router.push(`/employers?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const handleUniversityClick = (universityLocationId: string) => {
    // Find university by location ID
    const university = sampleUniversities.find(uni =>
      uni.locations.some(loc => loc.id === universityLocationId)
    )
    if (university) {
      const params = new URLSearchParams({
        universityFilter: university.name,
        universityId: university.id
      })
      router.push(`/universities?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const handleCertificationClick = (certificationId: string, certificationName: string) => {
    // Find certification by ID or name
    const certification = sampleCertifications.find(cert =>
      cert.id === certificationId || 
      cert.certificationName.trim().toLowerCase() === certificationName.trim().toLowerCase()
    )
    if (certification) {
      const params = new URLSearchParams({
        certificationFilter: certification.certificationName,
        certificationId: certification.id
      })
      router.push(`/certifications?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const handleProjectClick = (projectName: string) => {
    // Find project by name
    const project = sampleProjects.find(proj => 
      proj.projectName.trim().toLowerCase() === projectName.trim().toLowerCase()
    )
    if (project) {
      const params = new URLSearchParams({
        projectFilter: project.projectName,
        projectId: project.id
      })
      router.push(`/projects?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const workExperiences = candidate.workExperiences || []
  const independentProjects = candidate.projects || []
  const educations = candidate.educations || []
  const certifications = candidate.certifications || []
  // Use achievements if available, otherwise fall back to competitions (legacy)
  const achievements = candidate?.achievements || candidate?.competitions?.map(comp => ({
    id: comp.id,
    name: comp.competitionName,
    achievementType: "Competition" as const,
    ranking: comp.ranking,
    year: comp.year,
    url: comp.url,
    description: "",
  })) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-6xl lg:!max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="size-7 text-primary" />
            </div>
            <div>
                <DialogTitle className="text-2xl font-semibold mb-1">
                  {candidate.name}
          </DialogTitle>
                <p className="text-sm text-muted-foreground mb-2">{getJobTitle(candidate)}</p>
            <Badge className={CANDIDATE_STATUS_COLORS[candidate.status]}>
              {CANDIDATE_STATUS_LABELS[candidate.status]}
            </Badge>
              </div>
            </div>
            <div className="flex gap-2 mr-12">
              {/* Edit & Verify Button (includes verification) */}
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setEditDialogOpen(true)}
                className="gap-1.5"
              >
                <ShieldCheck className="size-4" />
                Edit & Verify
              </Button>
              
              {/* Cold Caller Mode Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setColdCallerDialogOpen(true)}
                className="gap-1.5"
              >
                <Headphones className="size-4" />
                Cold Caller Mode
              </Button>
              
              {candidate.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${candidate.email}`}>
                  <Mail className="size-4" />
                </a>
              </Button>
              )}
              {candidate.mobileNo && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${candidate.mobileNo}`}>
                  <Phone className="size-4" />
                </a>
              </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Sticky Section Navigation */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
          <Tabs 
            value={activeSection} 
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {sections.map((section) => {
                const progress = getSectionProgress(section.sectionId)
                const isFullyVerified = progress.percentage === 100
                
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.sectionId}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-t transition-colors whitespace-nowrap h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                      "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground",
                      "border-b-2 border-transparent",
                      "cursor-pointer flex items-center gap-2"
                    )}
                    aria-label={`Jump to ${section.label} section - ${progress.percentage}% verified (${progress.verified}/${progress.total})`}
                  >
                    <span className="hidden lg:inline">{section.label}</span>
                    <span className="lg:hidden">{section.shortLabel}</span>
                    
                    {/* Verification Badge */}
                    {progress.total > 0 && (
                      <Badge 
                        variant="default"
                        className={cn(
                          "text-xs px-1.5 py-0.5 font-medium shrink-0",
                          getVerificationBadgeColor(progress.percentage)
                        )}
                      >
                        {isFullyVerified ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          `${progress.percentage}%`
                        )}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
              </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          {/* Verification Summary Bar */}
          {verificationSummary && verificationSummary.totalFields > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
              <ShieldCheck className="size-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">Data Verification</span>
                  <Badge variant={verificationSummary.verificationPercentage === 100 ? 'default' : 'secondary'}>
                    {verificationSummary.verificationPercentage}% Verified
                  </Badge>
              </div>
                <Progress value={verificationSummary.verificationPercentage} className="h-2" />
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{verificationSummary.verifiedFields} verified</span>
                  <span>{verificationSummary.unverifiedFields} unverified</span>
              </div>
              </div>
              </div>
          )}

          {/* Basic Information */}
          <section id="basic-info">
            <Collapsible 
              open={expandedSections.has("basic")} 
              onOpenChange={() => toggleSection("basic")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="size-5" />
                      Basic Information
                      <SectionProgressBadge 
                        percentage={basicInfoProgress.percentage}
                        verified={basicInfoProgress.verified}
                        total={basicInfoProgress.total}
                      />
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
                  {/* Inline Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    <InlineEditableField 
                      label="Full Name" 
                      value={candidate.name} 
                      fieldName="name"
                      fieldType="text"
                      validation={validateName}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="name" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="City" 
                      value={candidate.city} 
                      fieldName="city"
                      fieldType="text"
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="city" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Email Address" 
                      value={candidate.email} 
                      fieldName="email"
                      fieldType="email"
                      validation={validateEmail}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="email" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Mobile Number" 
                      value={candidate.mobileNo} 
                      fieldName="mobileNo"
                      fieldType="text"
                      validation={validatePhone}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="mobileNo" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="CNIC" 
                      value={candidate.cnic} 
                      fieldName="cnic"
                      fieldType="text"
                      validation={validateCNIC}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="cnic" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Posting Title" 
                      value={candidate.postingTitle} 
                      fieldName="postingTitle"
                      fieldType="text"
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="postingTitle" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Current Salary" 
                      value={candidate.currentSalary} 
                      fieldName="currentSalary"
                      fieldType="number"
                      validation={validateSalary}
                      onSave={handleFieldSave}
                      formatDisplay={(val) => val ? formatCurrency(Number(val)) : 'N/A'}
                      verificationIndicator={<VerificationIndicator fieldName="currentSalary" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Expected Salary" 
                      value={candidate.expectedSalary} 
                      fieldName="expectedSalary"
                      fieldType="number"
                      validation={validateSalary}
                      onSave={handleFieldSave}
                      formatDisplay={(val) => val ? formatCurrency(Number(val)) : 'N/A'}
                      verificationIndicator={<VerificationIndicator fieldName="expectedSalary" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField
                      label="Source"
                      value={candidate.source}
                      fieldName="source"
                      fieldType="text"
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="source" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableCheckbox
                      label="Top Developer"
                      value={candidate.isTopDeveloper === true}
                      fieldName="isTopDeveloper"
                      onSave={async (fieldName, newValue, verify) => {
                        await handleFieldSave(fieldName, newValue, verify)
                      }}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableCombobox
                      label="Personality Type"
                      value={candidate.personalityType || ''}
                      fieldName="personalityType"
                      options={personalityTypeOptions}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="personalityType" />}
                      getFieldVerification={getFieldVerification}
                      placeholder="Select personality type..."
                      searchPlaceholder="Search personality types..."
                      emptyMessage="No personality type found."
                      renderDisplay={(displayValue) => {
                        const option = personalityTypeOptions.find(opt => opt.value === displayValue)
                        return (
                          <span className={`text-sm block ${!displayValue ? 'text-muted-foreground italic' : ''}`}>
                            {option ? option.label : displayValue || 'N/A'}
                          </span>
                        )
                      }}
                    />
                    <DisplayField 
                      label="Years of Experience" 
                      value={(() => {
                        const years = calculateYearsOfExperience(candidate)
                        return years > 0 ? `${years} ${years === 1 ? 'year' : 'years'}` : 'N/A'
                      })()} 
                      fieldName="yearsOfExperience" 
                    />
          </div>

                  <Separator />
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Links & Resources</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {candidate.linkedinUrl && (
                        <InlineEditableField 
                          label="LinkedIn URL" 
                          value={candidate.linkedinUrl} 
                          fieldName="linkedinUrl"
                          fieldType="url"
                          validation={validateLinkedInURL}
                          onSave={handleFieldSave}
                          verificationIndicator={<VerificationIndicator fieldName="linkedinUrl" />}
                          getFieldVerification={getFieldVerification}
                        />
                      )}
                      {candidate.githubUrl && (
                        <InlineEditableField 
                          label="GitHub URL" 
                          value={candidate.githubUrl} 
                          fieldName="githubUrl"
                          fieldType="url"
                          validation={validateGitHubURL}
                          onSave={handleFieldSave}
                          verificationIndicator={<VerificationIndicator fieldName="githubUrl" />}
                          getFieldVerification={getFieldVerification}
                        />
                      )}
                      {candidate.resume && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30">
                          <Button variant="outline" size="sm" asChild className="h-8">
                            <a href={candidate.resume} target="_blank" rel="noopener noreferrer">
                              <Download className="size-4" />
                              Resume
                              <ExternalLink className="size-3" />
                            </a>
                          </Button>
                          <VerificationIndicator fieldName="resume" />
                        </div>
                      )}
                    </div>
                  </div>

          <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    <DisplayField label="Applied On" value={formatDate(candidate.createdAt)} fieldName="createdAt" />
                    <DisplayField label="Last Updated" value={formatDate(candidate.updatedAt)} fieldName="updatedAt" />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Work Experience */}
          <section id="work-experience">
            <Collapsible 
              open={expandedSections.has("work-experience")} 
              onOpenChange={() => toggleSection("work-experience")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="size-5" />
                      Work Experience
                      {workExperiences.length > 0 && (
                        <>
                          <Badge variant="secondary" className="ml-2">
                            {workExperiences.length}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="ml-1 h-5 px-1.5 text-xs font-medium border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          >
                            Avg {calculateCandidateAverageTenure(candidate).toFixed(1)}y tenure
                          </Badge>
                        </>
                      )}
                      <SectionProgressBadge
                        percentage={workExperienceProgress.percentage}
                        verified={workExperienceProgress.verified}
                        total={workExperienceProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("work-experience") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {workExperiences.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No work experience recorded</p>
                  ) : (
                    workExperiences.map((experience, idx) => (
                      <div key={experience.id}>
                        {idx > 0 && <Separator className="my-6" />}
          <div className="space-y-4">
                          {/* Employer and Job Title */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="size-5 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <InlineEditableCombobox
                                    label=""
                                    value={experience.employerName}
                                    fieldName={`workExperiences[${idx}].employerName`}
                                    options={employerOptions}
                                    onSave={handleFieldSave}
                                    placeholder="Select employer..."
                                    searchPlaceholder="Search employers..."
                                    verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].employerName`} />}
                                    getFieldVerification={getFieldVerification}
                                    creatable={true}
                                    createLabel="Add New Employer"
                                    onCreateDialog={(searchValue) => {
                                      setPendingEmployerName(searchValue)
                                      setPendingEmployerFieldName(`workExperiences[${idx}].employerName`)
                                      setCreateEmployerDialogOpen(true)
                                    }}
                                    renderDisplay={(displayValue, value) => (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleEmployerClick(experience.employerName)}
                                          className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer leading-tight"
                                          title={`View ${displayValue} details`}
                                        >
                                          {displayValue}
                                        </button>
                                        {(() => {
                                          const promotions = calculateEmployerPromotions(candidate, experience.employerName)
                                          return promotions > 0 ? (
                                            <Badge variant="secondary" className="shrink-0">
                                              {promotions} promotion{promotions !== 1 ? 's' : ''}
                                            </Badge>
                                          ) : null
                                        })()}
                                      </div>
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="ml-7">
                                <InlineEditableField 
                                  label="Job Title" 
                                  value={experience.jobTitle} 
                                  fieldName={`workExperiences[${idx}].jobTitle`}
                                  fieldType="text"
                                  onSave={handleFieldSave}
                                  verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].jobTitle`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <InlineEditableDate
                                label="Start Date"
                                value={experience.startDate}
                                fieldName={`workExperiences[${idx}].startDate`}
                                onSave={handleFieldSave}
                                formatDisplay={formatDate}
                                verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].startDate`} />}
                                getFieldVerification={getFieldVerification}
                              />
                              <InlineEditableDate
                                label="End Date"
                                value={experience.endDate}
                                fieldName={`workExperiences[${idx}].endDate`}
                                onSave={handleFieldSave}
                                formatDisplay={formatDate}
                                verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].endDate`} />}
                                getFieldVerification={getFieldVerification}
                              />
                            </div>
                          </div>

                          {/* Work Details Grid */}
                          <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {experience.shiftType && (
                              <InlineEditableCombobox
                                label="Shift Type"
                                value={experience.shiftType}
                                fieldName={`workExperiences[${idx}].shiftType`}
                                options={shiftTypeOptions}
                                onSave={handleFieldSave}
                                placeholder="Select shift type..."
                                searchPlaceholder="Search shift types..."
                                verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].shiftType`} />}
                                getFieldVerification={getFieldVerification}
                              />
                            )}
                            {experience.workMode && (
                              <InlineEditableCombobox
                                label="Work Mode"
                                value={experience.workMode}
                                fieldName={`workExperiences[${idx}].workMode`}
                                options={workModeOptions}
                                onSave={handleFieldSave}
                                placeholder="Select work mode..."
                                searchPlaceholder="Search work modes..."
                                verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].workMode`} />}
                                getFieldVerification={getFieldVerification}
                              />
                            )}
                          </div>

                          {/* Time Support Zones */}
                          <div className="ml-7">
                            <InlineEditableMultiSelect
                              label="Time Support Zones"
                              value={experience.timeSupportZones || []}
                              fieldName={`workExperiences[${idx}].timeSupportZones`}
                              options={timeSupportZoneOptions}
                              onSave={handleMultiSelectFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].timeSupportZones`} />}
                              getFieldVerification={getFieldVerification}
                              placeholder="Select time zones..."
                              searchPlaceholder="Search time zones..."
                              badgeColorClass="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              maxDisplay={5}
                            />
                          </div>

                          {/* Tech Stacks */}
                          <div className="ml-7">
                            <InlineEditableMultiSelect
                              label="Tech Stacks"
                              value={experience.techStacks || []}
                              fieldName={`workExperiences[${idx}].techStacks`}
                              options={techStackOptions}
                              onSave={handleMultiSelectFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].techStacks`} />}
                              getFieldVerification={getFieldVerification}
                              placeholder="Select technologies..."
                              searchPlaceholder="Search technologies..."
                              badgeColorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              maxDisplay={5}
                              creatable={true}
                              createLabel="Create Tech Stack"
                              onCreateNew={(newTechStack) => {
                                const newOption = { label: newTechStack, value: newTechStack }
                                setTechStackOptions(prev => {
                                  const updated = [...prev, newOption]
                                  return updated.sort((a, b) => a.label.localeCompare(b.label))
                                })
                                // Add to current selection
                                const currentValue = experience.techStacks || []
                                if (!currentValue.includes(newTechStack)) {
                                  handleMultiSelectFieldSave(`workExperiences[${idx}].techStacks`, [...currentValue, newTechStack], false)
                                }
                              }}
                            />
                          </div>
                          {/* NEW: Domains */}
                          <div className="ml-7">
                            <InlineEditableMultiSelect
                              label="Domains"
                              value={experience.domains || []}
                              fieldName={`workExperiences[${idx}].domains`}
                              options={horizontalDomainOptions}
                              onSave={handleMultiSelectFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].domains`} />}
                              getFieldVerification={getFieldVerification}
                              placeholder="Select domains..."
                              searchPlaceholder="Search domains..."
                              badgeColorClass="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
                              maxDisplay={5}
                              creatable={true}
                              createLabel="Create Domain"
                              onCreateNew={(newDomain) => {
                                const newOption = { label: newDomain, value: newDomain }
                                setHorizontalDomainOptions(prev => {
                                  const updated = [...prev, newOption]
                                  return updated.sort((a, b) => a.label.localeCompare(b.label))
                                })
                                // Add to current selection
                                const currentValue = experience.domains || []
                                if (!currentValue.includes(newDomain)) {
                                  handleMultiSelectFieldSave(`workExperiences[${idx}].domains`, [...currentValue, newDomain], false)
                                }
                              }}
                            />
                            </div>
                          {/* Benefits */}
                          <div className="ml-7">
                            <InlineEditableBenefits
                              label="Benefits"
                              value={experience.benefits || []}
                              fieldName={`workExperiences[${idx}].benefits`}
                              onSave={handleBenefitsFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].benefits`} />}
                              getFieldVerification={getFieldVerification}
                              maxDisplay={4}
                            />
                          </div>

                          {/* Projects within Work Experience */}
                          {experience.projects.length > 0 && (
                            <div className="ml-7 space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <FolderOpen className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Projects ({experience.projects.length})</span>
                              </div>
                              <div className="space-y-3">
                                {experience.projects.map((project, projIdx) => (
                                  <div key={project.id} className="border rounded-md p-4 bg-muted/30">
                                    <div className="flex items-center gap-2 mb-2">
                                      <InlineEditableCombobox
                                        label=""
                                        value={project.projectName || ""}
                                        fieldName={`workExperiences[${idx}].projects[${projIdx}].projectName`}
                                        options={projectOptions}
                                        onSave={handleFieldSave}
                                        placeholder="Select project..."
                                        searchPlaceholder="Search projects..."
                                        verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].projects[${projIdx}].projectName`} />}
                                        getFieldVerification={getFieldVerification}
                                        creatable={true}
                                        createLabel="Add New Project"
                                        onCreateDialog={(searchValue) => {
                                          setPendingProjectName(searchValue)
                                          setPendingProjectFieldName(`workExperiences[${idx}].projects[${projIdx}].projectName`)
                                          setCreateProjectDialogOpen(true)
                                        }}
                                        renderDisplay={(displayValue, value) => (
                                          <button
                                            onClick={() => handleProjectClick(project.projectName)}
                                            className="text-base font-medium hover:text-primary hover:underline transition-colors text-left cursor-pointer"
                                            title={`View ${displayValue || "Unnamed Project"} details`}
                                          >
                                            {displayValue || "Unnamed Project"}
                                          </button>
                                        )}
                                      />
                                    </div>
                                    {project.projectName && (
                                      <DomainBadges
                                        projectName={project.projectName}
                                        {...getProjectDetails(project.projectName)}
                                      />
                                    )}
                                    {project.contributionNotes && (
                                      <InlineEditableTextarea
                                        value={project.contributionNotes}
                                        fieldName={`workExperiences[${idx}].projects[${projIdx}].contributionNotes`}
                                        onSave={handleFieldSave}
                                        maxLength={100}
                                        verificationIndicator={
                                          <VerificationIndicator fieldName={`workExperiences[${idx}].projects[${projIdx}].contributionNotes`} />
                                        }
                                        getFieldVerification={getFieldVerification}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Tech Stacks */}
          <section id="tech-stacks">
            <Collapsible 
              open={expandedSections.has("tech-stacks")} 
              onOpenChange={() => toggleSection("tech-stacks")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="size-5" />
                      Tech Stacks
                      {candidate.techStacks && candidate.techStacks.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {candidate.techStacks.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={techStacksProgress.percentage}
                        verified={techStacksProgress.verified}
                        total={techStacksProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("tech-stacks") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {!candidate.techStacks || candidate.techStacks.length === 0 ? (
                    <div className="space-y-4">
                      <InlineEditableMultiSelect
                        label="Technical Skills"
                        value={[]}
                        fieldName="techStacks"
                        options={techStackOptions}
                        onSave={handleMultiSelectFieldSave}
                        verificationIndicator={<VerificationIndicator fieldName="techStacks" />}
                        getFieldVerification={getFieldVerification}
                        placeholder="Select technologies..."
                        searchPlaceholder="Search technologies..."
                        badgeColorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        maxDisplay={6}
                        creatable={true}
                        createLabel="Create Tech Stack"
                        onCreateNew={(newTechStack) => {
                          const newOption = { label: newTechStack, value: newTechStack }
                          setTechStackOptions(prev => {
                            const updated = [...prev, newOption]
                            return updated.sort((a, b) => a.label.localeCompare(b.label))
                          })
                          // Add to current selection
                          const currentValue: string[] = []
                          if (!currentValue.includes(newTechStack)) {
                            handleMultiSelectFieldSave("techStacks", [...currentValue, newTechStack], false)
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <InlineEditableMultiSelect
                        label="Technical Skills"
                        value={candidate.techStacks}
                        fieldName="techStacks"
                        options={techStackOptions}
                        onSave={handleMultiSelectFieldSave}
                        verificationIndicator={<VerificationIndicator fieldName="techStacks" />}
                        getFieldVerification={getFieldVerification}
                        placeholder="Select technologies..."
                        searchPlaceholder="Search technologies..."
                        badgeColorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        maxDisplay={6}
                        creatable={true}
                        createLabel="Create Tech Stack"
                        onCreateNew={(newTechStack) => {
                          const newOption = { label: newTechStack, value: newTechStack }
                          setTechStackOptions(prev => {
                            const updated = [...prev, newOption]
                            return updated.sort((a, b) => a.label.localeCompare(b.label))
                          })
                          // Add to current selection
                          const currentValue = candidate.techStacks || []
                          if (!currentValue.includes(newTechStack)) {
                            handleMultiSelectFieldSave("techStacks", [...currentValue, newTechStack], false)
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Independent Projects */}
          <section id="projects">
            <Collapsible 
              open={expandedSections.has("independent-projects")} 
              onOpenChange={() => toggleSection("independent-projects")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="size-5" />
                      Projects
                      {independentProjects.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {independentProjects.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={independentProjectsProgress.percentage}
                        verified={independentProjectsProgress.verified}
                        total={independentProjectsProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("independent-projects") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {independentProjects.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No projects recorded</p>
                  ) : (
                    independentProjects.map((project, idx) => (
                      <div key={project.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <InlineEditableCombobox
                                  label=""
                                  value={project.projectName || ""}
                                  fieldName={`projects[${idx}].projectName`}
                                  options={projectOptions}
                                  onSave={handleFieldSave}
                                  placeholder="Select project..."
                                  searchPlaceholder="Search projects..."
                                  verificationIndicator={<VerificationIndicator fieldName={`projects[${idx}].projectName`} />}
                                  getFieldVerification={getFieldVerification}
                                  creatable={true}
                                  createLabel="Add New Project"
                                  onCreateDialog={(searchValue) => {
                                    setPendingProjectName(searchValue)
                                    setPendingProjectFieldName(`projects[${idx}].projectName`)
                                    setCreateProjectDialogOpen(true)
                                  }}
                                  renderDisplay={(displayValue, value) => (
                                    <button
                                      onClick={() => handleProjectClick(project.projectName)}
                                      className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer"
                                      title={`View ${displayValue || "Unnamed Project"} details`}
                                    >
                                      {displayValue || "Unnamed Project"}
                                    </button>
                                  )}
                                />
                              </div>
                              {project.projectName && (
                                <DomainBadges
                                  projectName={project.projectName}
                                  {...getProjectDetails(project.projectName)}
                                />
                              )}
                              {project.contributionNotes && (
                                <InlineEditableTextarea
                                  value={project.contributionNotes}
                                  fieldName={`projects[${idx}].contributionNotes`}
                                  onSave={handleFieldSave}
                                  maxLength={100}
                                  className="mt-2"
                                  verificationIndicator={
                                    <VerificationIndicator fieldName={`projects[${idx}].contributionNotes`} />
                                  }
                                  getFieldVerification={getFieldVerification}
                                />
                              )}
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
          </section>

          {/* Education */}
          <section id="education">
            <Collapsible 
              open={expandedSections.has("education")} 
              onOpenChange={() => toggleSection("education")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="size-5" />
                      Education
                      {educations.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {educations.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={educationProgress.percentage}
                        verified={educationProgress.verified}
                        total={educationProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("education") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {educations.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No education records</p>
                  ) : (
                    educations.map((education, idx) => (
                      <div key={education.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          {/* University Name */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <InlineEditableCombobox
                                  label=""
                                  value={education.universityLocationId}
                                  fieldName={`educations[${idx}].universityLocationId`}
                                  options={universityLocationOptions}
                                  onSave={async (fieldName, newValue, shouldVerify) => {
                                    // When university location ID changes, we need to update both the ID and the name
                                    await handleFieldSave(fieldName, newValue, shouldVerify)
                                    // Find the university location name from the selected ID
                                    const selectedLocation = sampleUniversities
                                      .flatMap(uni => uni.locations)
                                      .find(loc => loc.id === newValue)
                                    const selectedUniversity = sampleUniversities.find(uni => 
                                      uni.locations.some(loc => loc.id === newValue)
                                    )
                                    if (selectedLocation && selectedUniversity) {
                                      await handleFieldSave(`educations[${idx}].universityLocationName`, `${selectedUniversity.name} - ${selectedLocation.city}`, shouldVerify)
                                    }
                                  }}
                                  placeholder="Select university location..."
                                  searchPlaceholder="Search universities..."
                                  verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].universityLocationName`} />}
                                  getFieldVerification={getFieldVerification}
                                  creatable={true}
                                  createLabel="Add New University"
                                  onCreateDialog={(searchValue) => {
                                    setPendingUniversityName(searchValue)
                                    setPendingUniversityFieldName(`educations[${idx}].universityLocationId`)
                                    setCreateUniversityDialogOpen(true)
                                  }}
                                  renderDisplay={(displayValue, value) => (
                                    <button
                                      onClick={() => handleUniversityClick(education.universityLocationId)}
                                      className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer"
                                      title={`View ${displayValue} details`}
                                    >
                                      {displayValue}
                                    </button>
                                  )}
                                />
                              </div>
                              {/* Degree and Major */}
                              <div className="space-y-2">
                                <InlineEditableCombobox
                                  label="Degree Name"
                                  value={education.degreeName}
                                  fieldName={`educations[${idx}].degreeName`}
                                  options={degreeOptions}
                                  onSave={handleFieldSave}
                                  placeholder="Select degree..."
                                  searchPlaceholder="Search degrees..."
                                  verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].degreeName`} />}
                                  getFieldVerification={getFieldVerification}
                                  creatable={true}
                                  createLabel="Add New Degree"
                                  onCreateNew={(newDegree) => {
                                    // Add the new degree to options
                                    const newOption = { label: newDegree, value: newDegree }
                                    setDegreeOptions(prev => {
                                      const updated = [...prev, newOption]
                                      return updated.sort((a, b) => a.label.localeCompare(b.label))
                                    })
                                    // Auto-select the newly added degree
                                    handleFieldSave(`educations[${idx}].degreeName`, newDegree, false)
                                  }}
                                />
                                {education.majorName && (
                                  <InlineEditableCombobox
                                    label="Major Name"
                                    value={education.majorName}
                                    fieldName={`educations[${idx}].majorName`}
                                    options={majorOptions}
                                    onSave={handleFieldSave}
                                    placeholder="Select major..."
                                    searchPlaceholder="Search majors..."
                                    verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].majorName`} />}
                                    getFieldVerification={getFieldVerification}
                                    creatable={true}
                                    createLabel="Add New Major"
                                    onCreateNew={(newMajor) => {
                                      // Add the new major to options
                                      const newOption = { label: newMajor, value: newMajor }
                                      setMajorOptions(prev => {
                                        const updated = [...prev, newOption]
                                        return updated.sort((a, b) => a.label.localeCompare(b.label))
                                      })
                                      // Auto-select the newly added major
                                      handleFieldSave(`educations[${idx}].majorName`, newMajor, false)
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <InlineEditableDate
                                label="Start Month"
                                value={education.startMonth}
                                fieldName={`educations[${idx}].startMonth`}
                                onSave={handleFieldSave}
                                formatDisplay={formatMonth}
                                mode="month"
                                verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].startMonth`} />}
                                getFieldVerification={getFieldVerification}
                              />
                              <InlineEditableDate
                                label="End Month"
                                value={education.endMonth}
                                fieldName={`educations[${idx}].endMonth`}
                                onSave={handleFieldSave}
                                formatDisplay={formatMonth}
                                mode="month"
                                verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].endMonth`} />}
                                getFieldVerification={getFieldVerification}
                              />
                            </div>
                          </div>

                          {/* Grades and Achievements */}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {education.grades && (
                              <InlineEditableField 
                                label="Grades" 
                                value={education.grades} 
                                fieldName={`educations[${idx}].grades`}
                                fieldType="text"
                                onSave={handleFieldSave}
                                verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].grades`} />}
                                getFieldVerification={getFieldVerification}
                                className="flex-1"
                              />
                            )}
                            <InlineEditableCheckbox
                              label="Topper"
                              value={education.isTopper === true}
                              fieldName={`educations[${idx}].isTopper`}
                              onSave={async (fieldName, newValue, verify) => {
                                await handleFieldSave(fieldName, newValue, verify)
                              }}
                              getFieldVerification={getFieldVerification}
                            />
                            <InlineEditableCheckbox
                              label="Cheetah"
                              value={education.isCheetah === true}
                              fieldName={`educations[${idx}].isCheetah`}
                              onSave={async (fieldName, newValue, verify) => {
                                await handleFieldSave(fieldName, newValue, verify)
                              }}
                              getFieldVerification={getFieldVerification}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Certifications */}
          <section id="certifications">
            <Collapsible 
              open={expandedSections.has("certifications")} 
              onOpenChange={() => toggleSection("certifications")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="size-5" />
                      Certifications
                      {certifications.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {certifications.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={certificationsProgress.percentage}
                        verified={certificationsProgress.verified}
                        total={certificationsProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("certifications") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {certifications.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No certifications recorded</p>
                  ) : (
                    certifications.map((cert, idx) => (
                      <div key={cert.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          {/* Certification Name */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <InlineEditableCombobox
                                  label=""
                                  value={cert.certificationId}
                                  fieldName={`certifications[${idx}].certificationId`}
                                  options={certificationOptions}
                                  onSave={async (fieldName, newValue, shouldVerify) => {
                                    await handleFieldSave(fieldName, newValue, shouldVerify)
                                    // Find the certification name from the selected ID
                                    const selectedCert = sampleCertifications.find(c => c.id === newValue)
                                    if (selectedCert) {
                                      await handleFieldSave(`certifications[${idx}].certificationName`, selectedCert.certificationName, shouldVerify)
                                    }
                                  }}
                                  placeholder="Select certification..."
                                  searchPlaceholder="Search certifications..."
                                  verificationIndicator={<VerificationIndicator fieldName={`certifications[${idx}].certificationName`} />}
                                  getFieldVerification={getFieldVerification}
                                  creatable={true}
                                  createLabel="Add New Certification"
                                  onCreateDialog={(searchValue) => {
                                    setPendingCertificationName(searchValue)
                                    setPendingCertificationFieldName(`certifications[${idx}].certificationId`)
                                    setCreateCertificationDialogOpen(true)
                                  }}
                                  renderDisplay={(displayValue, value) => (
                                    <button
                                      onClick={() => handleCertificationClick(cert.certificationId, cert.certificationName)}
                                      className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer"
                                      title={`View ${displayValue} details`}
                                    >
                                      {displayValue}
                                    </button>
                                  )}
                                />
                              </div>
                              {/* Dates */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {cert.issueDate && (
                                  <InlineEditableDate
                                    label="Issue Date"
                                    value={cert.issueDate}
                                    fieldName={`certifications[${idx}].issueDate`}
                                    onSave={handleFieldSave}
                                    formatDisplay={(date) => date ? formatDate(date) : 'N/A'}
                                    verificationIndicator={<VerificationIndicator fieldName={`certifications[${idx}].issueDate`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                                )}
                                {cert.expiryDate && (
                                  <InlineEditableDate
                                    label="Expiry Date"
                                    value={cert.expiryDate}
                                    fieldName={`certifications[${idx}].expiryDate`}
                                    onSave={handleFieldSave}
                                    formatDisplay={(date) => date ? formatDate(date) : 'N/A'}
                                    verificationIndicator={<VerificationIndicator fieldName={`certifications[${idx}].expiryDate`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Certificate Link */}
                          {cert.certificationUrl && (
                            <InlineEditableField 
                              label="Certification URL" 
                              value={cert.certificationUrl} 
                              fieldName={`certifications[${idx}].certificationUrl`}
                              fieldType="url"
                              validation={validateURL}
                              onSave={handleFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`certifications[${idx}].certificationUrl`} />}
                              getFieldVerification={getFieldVerification}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Competitions */}
          <section id="competitions">
            <Collapsible 
              open={expandedSections.has("competitions")} 
              onOpenChange={() => toggleSection("competitions")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="size-5" />
                      Achievements
                      {achievements.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {achievements.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={achievementsProgress.percentage}
                        verified={achievementsProgress.verified}
                        total={achievementsProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("competitions") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {achievements.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No achievements recorded</p>
                  ) : (
                    achievements.map((ach, idx) => (
                      <div key={ach.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          {/* Achievement Type and Name */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InlineEditableField
                                  label="Achievement Type"
                                  value={ach.achievementType}
                                  fieldName={`achievements[${idx}].achievementType`}
                                  fieldType="text"
                                  onSave={handleFieldSave}
                                  verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].achievementType`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                                <InlineEditableField
                                  label="Name"
                                  value={ach.name}
                                  fieldName={`achievements[${idx}].name`}
                                  fieldType="text"
                                  onSave={handleFieldSave}
                                  verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].name`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                              {/* Ranking and Year */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                {ach.ranking && (
                                  <InlineEditableField
                                    label="Ranking"
                                    value={ach.ranking}
                                    fieldName={`achievements[${idx}].ranking`}
                                    fieldType="text"
                                    onSave={handleFieldSave}
                                    verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].ranking`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                                )}
                                {ach.year && (
                                  <InlineEditableField
                                    label="Year"
                                    value={ach.year.toString()}
                                    fieldName={`achievements[${idx}].year`}
                                    fieldType="number"
                                    onSave={async (fieldName: string, newValue: string | number, shouldVerify: boolean) => {
                                      const yearValue: number | undefined = typeof newValue === 'string' ? (newValue ? parseInt(newValue, 10) : undefined) : newValue
                                      await handleFieldSave(fieldName, yearValue, shouldVerify)
                                    }}
                                    verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].year`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Achievement URL */}
                          {ach.url && (
                            <InlineEditableField 
                              label="URL" 
                              value={ach.url} 
                              fieldName={`achievements[${idx}].url`}
                              fieldType="url"
                              validation={validateURL}
                              onSave={handleFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].url`} />}
                              getFieldVerification={getFieldVerification}
                            />
                          )}
                          {/* Description */}
                          {ach.description && (
                            <InlineEditableField 
                              label="Description" 
                              value={ach.description} 
                              fieldName={`achievements[${idx}].description`}
                              fieldType="text"
                              onSave={handleFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].description`} />}
                              getFieldVerification={getFieldVerification}
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

        </div>
      </DialogContent>
      
      {/* Edit & Verify Dialog (verification is always enabled in edit mode) */}
      {candidate && (
        <CandidateCreationDialog
          mode="edit"
          candidateData={candidate}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* Cold Caller Dialog */}
      {candidate && (
        <ColdCallerDialog
          open={coldCallerDialogOpen}
          onOpenChange={setColdCallerDialogOpen}
          candidate={candidate}
          onSaveField={async (fieldPath, value, verified) => {
            // Handle field save - this will update the candidate data
            // In a real implementation, this would call an API
            console.log('Saving field:', fieldPath, value, 'verified:', verified)
            await handleFieldSave(
              fieldPath, 
              value as string | number | Date | undefined | string[] | EmployerBenefit[] | boolean, 
              verified ?? false
            )
          }}
        />
      )}

      {/* Create Employer Dialog */}
      <EmployerCreationDialog
        mode="create"
        open={createEmployerDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCreateEmployerDialogOpen(false)
            setPendingEmployerName("")
            setPendingEmployerFieldName(null)
          } else {
            setCreateEmployerDialogOpen(isOpen)
          }
        }}
        onSubmit={async (employerData: EmployerFormData) => {
          await handleEmployerCreated(employerData)
        }}
        initialName={pendingEmployerName}
      />

      {/* Create Project Dialog */}
      <ProjectCreationDialog
        mode="create"
        open={createProjectDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCreateProjectDialogOpen(false)
            setPendingProjectName("")
            setPendingProjectFieldName(null)
          } else {
            setCreateProjectDialogOpen(isOpen)
          }
        }}
        onSubmit={async (projectData: ProjectFormData) => {
          await handleProjectCreated(projectData)
        }}
        initialName={pendingProjectName}
      />

      {/* Create University Dialog */}
      <UniversityCreationDialog
        mode="create"
        open={createUniversityDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCreateUniversityDialogOpen(false)
            setPendingUniversityName("")
            setPendingUniversityFieldName(null)
          } else {
            setCreateUniversityDialogOpen(isOpen)
          }
        }}
        onSubmit={async (universityData: UniversityFormData) => {
          await handleUniversityCreated(universityData)
        }}
        initialName={pendingUniversityName}
      />

      {/* Create Certification Dialog */}
      <CertificationCreationDialog
        mode="create"
        open={createCertificationDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCreateCertificationDialogOpen(false)
            setPendingCertificationName("")
            setPendingCertificationFieldName(null)
          } else {
            setCreateCertificationDialogOpen(isOpen)
          }
        }}
        onSubmit={async (certificationData: CertificationFormData) => {
          await handleCertificationCreated(certificationData)
        }}
        initialName={pendingCertificationName}
      />
    </Dialog>
  )
}
