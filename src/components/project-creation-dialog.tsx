"use client"

import * as React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Plus, Check, ChevronsUpDown, ShieldCheck, ChevronDown, ChevronRight, X } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { Project, ProjectStatus, ProjectType, PROJECT_STATUS_LABELS, PROJECT_TYPES } from "@/lib/types/project"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import type { LookupItem } from "@/lib/services/lookups-api"
import { sampleProjects } from "@/lib/sample-data/projects"
import { searchEmployers, fetchEmployerById, createEmployer, buildCreateEmployerDto } from "@/lib/services/employers-api"
import type { EmployerLookupDto } from "@/lib/services/employers-api"
import { EmployerCreationDialog } from "@/components/employer-creation-dialog"
import { 
  getVerificationsForProject,
} from "@/lib/sample-data/verification"

/** Selected employer for project (server-driven combobox; submit sends only employerId). */
export type SelectedEmployer = { id: number; name: string } | null

// Form data interface
export interface ProjectFormData {
  projectName: string
  selectedEmployer: SelectedEmployer
  projectType: string
  minTeamSize: string
  maxTeamSize: string
  startDate: Date | undefined
  endDate: Date | undefined
  status: ProjectStatus | ""
  description: string
  notes: string
  projectLink: string
  isPublished: boolean
  publishPlatforms: string[]
  downloadCount: string
  techStacks: string[]
  clientLocations: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
}

// Verification state export
export interface ProjectVerificationState {
  verifiedFields: Set<string>
  modifiedFields: Set<string>
}

type DialogMode = "create" | "edit"

export interface ProjectLookups {
  techStacks: LookupItem[]
  verticalDomains: LookupItem[]
  horizontalDomains: LookupItem[]
  technicalAspects: LookupItem[]
  clientLocations: LookupItem[]
}

interface ProjectCreationDialogProps {
  children?: React.ReactNode
  mode?: DialogMode
  projectData?: Project
  showVerification?: boolean
  onSubmit?: (data: ProjectFormData, verificationState?: ProjectVerificationState) => Promise<void> | void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  initialName?: string
  /** When provided, Technologies, Domains, and Client Location dropdowns use these; "+ Add" calls the create handlers. */
  lookups?: ProjectLookups
  onCreateTechStack?: (name: string) => Promise<void>
  onCreateVerticalDomain?: (name: string) => Promise<void>
  onCreateHorizontalDomain?: (name: string) => Promise<void>
  onCreateTechnicalAspect?: (name: string) => Promise<void>
  onCreateClientLocation?: (name: string) => Promise<void>
}

const initialFormData: ProjectFormData = {
  projectName: "",
  selectedEmployer: null,
  projectType: "",
  minTeamSize: "",
  maxTeamSize: "",
  startDate: undefined,
  endDate: undefined,
  status: "",
  description: "",
  notes: "",
  projectLink: "",
  isPublished: false,
  publishPlatforms: [],
  downloadCount: "",
  techStacks: [],
  clientLocations: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
}

const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  value: value as ProjectStatus,
  label
}))

// Publish platform options
const publishPlatformOptions: MultiSelectOption[] = [
  { value: "App Store", label: "App Store (iOS)" },
  { value: "Play Store", label: "Play Store (Android)" },
  { value: "Web", label: "Web" },
  { value: "Desktop", label: "Desktop" },
]

// Extract unique values from project data (same as filter dialog)
const extractUniqueTechStacks = (): string[] => {
  const techStacks = new Set<string>()
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  return Array.from(techStacks).sort()
}

// Extract unique client locations from projects (for MultiSelect options)
const extractUniqueClientLocations = (): string[] => {
  const locations = new Set<string>()
  sampleProjects.forEach(project => {
    if (project.clientLocation) {
      locations.add(project.clientLocation)
    }
  })
  return Array.from(locations).sort()
}

const extractUniqueVerticalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.verticalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

const extractUniqueHorizontalDomains = (): string[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.horizontalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
}

const extractUniqueTechnicalAspects = (): string[] => {
  const aspects = new Set<string>()
  sampleProjects.forEach(project => {
    project.technicalAspects.forEach(aspect => aspects.add(aspect))
  })
  return Array.from(aspects).sort()
}

// Type options: fixed list matching backend project_type_enum (employer, academic, personal, freelance, open_source)
const projectTypeOptions: MultiSelectOption[] = PROJECT_TYPES.map((type) => ({
  value: type,
  label: type,
}))



// Parse project.teamSize ("5" or "10-20") into min/max for form
function parseTeamSizeToForm(teamSize: string | null): { min: string; max: string } {
  if (!teamSize?.trim()) return { min: "", max: "" }
  const t = teamSize.trim()
  const rangeMatch = t.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    return { min: rangeMatch[1], max: rangeMatch[2] }
  }
  const num = parseInt(t, 10)
  if (!isNaN(num)) return { min: String(num), max: String(num) }
  return { min: "", max: "" }
}

// Helper function to convert Project to ProjectFormData
const projectToFormData = (project: Project): ProjectFormData => {
  const { min: minTeamSize, max: maxTeamSize } = parseTeamSizeToForm(project.teamSize ?? "")
  const selectedEmployer: SelectedEmployer =
    project.employerId != null && project.employerName
      ? { id: project.employerId, name: project.employerName }
      : null
  return {
    projectName: project.projectName || "",
    selectedEmployer,
    projectType: project.projectType || "",
    minTeamSize,
    maxTeamSize,
    startDate: project.startDate ? new Date(project.startDate) : undefined,
    endDate: project.endDate ? new Date(project.endDate) : undefined,
    status: project.status || "",
    description: project.description || "",
    notes: project.notes || "",
    projectLink: project.projectLink || "",
    isPublished: project.isPublished || false,
    publishPlatforms: project.publishPlatforms ? [...project.publishPlatforms] : [],
    downloadCount: project.downloadCount ? project.downloadCount.toString() : "",
    techStacks: project.techStacks ? [...project.techStacks] : [],
    clientLocations: project.clientLocations?.length ? [...project.clientLocations] : (project.clientLocation ? [project.clientLocation] : []),
    verticalDomains: project.verticalDomains ? [...project.verticalDomains] : [],
    horizontalDomains: project.horizontalDomains ? [...project.horizontalDomains] : [],
    technicalAspects: project.technicalAspects ? [...project.technicalAspects] : [],
  }
}

// All verifiable fields for projects
const PROJECT_VERIFICATION_FIELDS = [
  'projectName', 'selectedEmployer', 'projectType', 'minTeamSize', 'maxTeamSize', 'status',
  'startDate', 'endDate', 'description', 'notes', 'projectLink',
  'isPublished', 'publishPlatforms', 'downloadCount',
  'techStacks', 'clientLocations', 'verticalDomains', 'horizontalDomains', 'technicalAspects'
]

export function ProjectCreationDialog({
  children,
  mode = "create",
  projectData,
  showVerification = true,
  onSubmit,
  onOpenChange,
  open: controlledOpen,
  initialName,
  lookups,
  onCreateTechStack,
  onCreateVerticalDomain,
  onCreateHorizontalDomain,
  onCreateTechnicalAspect,
  onCreateClientLocation,
}: ProjectCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const techStackOptions: MultiSelectOption[] = useMemo(
    () => lookups?.techStacks?.map((l) => ({ value: l.name, label: l.name })) ?? extractUniqueTechStacks().map((t) => ({ value: t, label: t })),
    [lookups?.techStacks]
  )
  const verticalDomainOptions: MultiSelectOption[] = useMemo(
    () => lookups?.verticalDomains?.map((l) => ({ value: l.name, label: l.name })) ?? extractUniqueVerticalDomains().map((d) => ({ value: d, label: d })),
    [lookups?.verticalDomains]
  )
  const horizontalDomainOptions: MultiSelectOption[] = useMemo(
    () => lookups?.horizontalDomains?.map((l) => ({ value: l.name, label: l.name })) ?? extractUniqueHorizontalDomains().map((d) => ({ value: d, label: d })),
    [lookups?.horizontalDomains]
  )
  const technicalAspectOptions: MultiSelectOption[] = useMemo(
    () => lookups?.technicalAspects?.map((l) => ({ value: l.name, label: l.name })) ?? extractUniqueTechnicalAspects().map((a) => ({ value: a, label: a })),
    [lookups?.technicalAspects]
  )
  const clientLocationOptions: MultiSelectOption[] = useMemo(
    () => lookups?.clientLocations?.map((l) => ({ value: l.name, label: l.name })) ?? extractUniqueClientLocations().map((loc) => ({ value: loc, label: loc })),
    [lookups?.clientLocations]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})
  const initialFormDataRef = useRef<ProjectFormData | null>(null)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  
  // Verification state
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set())
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic-info", "dates", "tech-stack", "domains", "content"])
  )

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  // Load existing verification status if in edit mode with verification
  const existingVerifications = useMemo(() => {
    if (mode === "edit" && projectData && showVerification) {
      return getVerificationsForProject(projectData.id)
    }
    return []
  }, [mode, projectData, showVerification])

  // Initialize verified fields from existing verifications
  useEffect(() => {
    if (showVerification && existingVerifications.length > 0) {
      const verifiedFromDB = new Set<string>()
      existingVerifications.forEach(v => {
        if (v.status === 'verified') {
          verifiedFromDB.add(v.fieldName)
        }
      })
      setVerifiedFields(verifiedFromDB)
    }
  }, [showVerification, existingVerifications])

  // Reset form when dialog opens/closes or mode/projectData changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && projectData) {
        const formDataFromProject = projectToFormData(projectData)
        setFormData(formDataFromProject)
        initialFormDataRef.current = formDataFromProject
      } else {
        // In create mode, check for initialName prop
        const formDataToUse = initialName 
          ? { ...initialFormData, projectName: initialName }
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
  }, [open, mode, projectData, showVerification])

  // Employer combobox: server-driven search (no prefetch)
  const [employerComboboxOpen, setEmployerComboboxOpen] = useState(false)
  const [employerSearchQuery, setEmployerSearchQuery] = useState("")
  const [employerSearchResults, setEmployerSearchResults] = useState<EmployerLookupDto[]>([])
  const [employerSearchLoading, setEmployerSearchLoading] = useState(false)
  const [addEmployerDialogOpen, setAddEmployerDialogOpen] = useState(false)
  const employerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const employerAbortRef = useRef<AbortController | null>(null)

  // Edit mode: preload employer by ID when dialog opens (no search call)
  useEffect(() => {
    if (!open || mode !== "edit" || !projectData?.employerId) return
    const id = projectData.employerId
    fetchEmployerById(id)
      .then((emp) => {
        setFormData((prev) => ({ ...prev, selectedEmployer: emp }))
      })
      .catch(() => {
        // Keep form as-is if fetch fails
      })
  }, [open, mode, projectData?.employerId])

  // Debounced employer search: min 2 chars, 300ms debounce, abort stale
  useEffect(() => {
    if (employerDebounceRef.current) {
      clearTimeout(employerDebounceRef.current)
      employerDebounceRef.current = null
    }
    if (employerSearchQuery.trim().length < 2) {
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
        employerAbortRef.current = null
      }
      setEmployerSearchResults([])
      setEmployerSearchLoading(false)
      return
    }
    employerDebounceRef.current = setTimeout(() => {
      employerDebounceRef.current = null
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
      }
      const controller = new AbortController()
      employerAbortRef.current = controller
      setEmployerSearchLoading(true)
      const query = employerSearchQuery.trim()
      searchEmployers(query, 10, controller.signal)
        .then((list) => {
          if (employerAbortRef.current !== controller) return
          setEmployerSearchResults(list)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return
          setEmployerSearchResults([])
        })
        .finally(() => {
          if (employerAbortRef.current === controller) {
            setEmployerSearchLoading(false)
          }
        })
    }, 300)
    return () => {
      if (employerDebounceRef.current) {
        clearTimeout(employerDebounceRef.current)
      }
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
      }
    }
  }, [employerSearchQuery])

  // Abort in-flight employer search on unmount
  useEffect(() => {
    return () => {
      if (employerAbortRef.current) {
        employerAbortRef.current.abort()
      }
    }
  }, [])

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

  const handleInputChange = (field: keyof ProjectFormData, value: string | Date | undefined | string[] | boolean | SelectedEmployer) => {
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
    calculateSectionProgress(['projectName', 'selectedEmployer', 'clientLocations', 'projectType', 'minTeamSize', 'maxTeamSize', 'status']),
    [verifiedFields]
  )

  const datesProgress = useMemo(() => 
    calculateSectionProgress(['startDate', 'endDate']),
    [verifiedFields]
  )

  const techStackProgress = useMemo(() => 
    calculateSectionProgress(['techStacks']),
    [verifiedFields]
  )

  const domainsProgress = useMemo(() => 
    calculateSectionProgress(['verticalDomains', 'horizontalDomains', 'technicalAspects']),
    [verifiedFields]
  )

  const contentProgress = useMemo(() => 
    calculateSectionProgress(['description', 'notes', 'projectLink', 'isPublished', 'publishPlatforms', 'downloadCount']),
    [verifiedFields]
  )

  // Overall verification progress
  const verificationProgress = useMemo(() => {
    const totalFields = PROJECT_VERIFICATION_FIELDS.length
    const verifiedCount = verifiedFields.size
    return Math.round((verifiedCount / totalFields) * 100)
  }, [verifiedFields])

  // Helper to get field names for a section
  const getSectionFieldNames = (sectionId: string): string[] => {
    const fieldMap: Record<string, string[]> = {
      'basic-info': ['projectName', 'selectedEmployer', 'clientLocations', 'projectType', 'minTeamSize', 'maxTeamSize', 'status'],
      'dates': ['startDate', 'endDate'],
      'tech-stack': ['techStacks'],
      'domains': ['verticalDomains', 'horizontalDomains', 'technicalAspects'],
      'content': ['description', 'notes', 'projectLink', 'isPublished', 'publishPlatforms', 'downloadCount']
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
      <div className="flex items-center gap-2 mt-1">
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
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {}

    // Required field validation
    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required"
    }

    const minTeamSizeNum = formData.minTeamSize.trim() ? parseInt(formData.minTeamSize, 10) : null
    const maxTeamSizeNum = formData.maxTeamSize.trim() ? parseInt(formData.maxTeamSize, 10) : null
    if (minTeamSizeNum === null && maxTeamSizeNum === null) {
      newErrors.minTeamSize = "Minimum or maximum team size is required"
    } else {
      if (formData.minTeamSize.trim() && (isNaN(minTeamSizeNum!) || minTeamSizeNum! < 0)) {
        newErrors.minTeamSize = "Must be 0 or greater"
      }
      if (formData.maxTeamSize.trim() && (isNaN(maxTeamSizeNum!) || maxTeamSizeNum! < 0)) {
        newErrors.maxTeamSize = "Must be 0 or greater"
      }
      if (minTeamSizeNum !== null && maxTeamSizeNum !== null && minTeamSizeNum > maxTeamSizeNum) {
        newErrors.maxTeamSize = "Maximum team size must be greater than or equal to minimum"
      }
    }

    if (!formData.status) {
      newErrors.status = "Project status is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Project description is required"
    }

    // Optional URL validation
    if (formData.projectLink && !formData.projectLink.startsWith('http')) {
      newErrors.projectLink = "Project link must be a valid URL starting with http:// or https://"
    }

    // Date validation
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = "End date must be after start date"
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
      const verificationState: ProjectVerificationState | undefined = showVerification 
        ? { verifiedFields, modifiedFields }
        : undefined
        
      await onSubmit?.(formData, verificationState)
      setFormData(initialFormData)
      setErrors({})
      setVerifiedFields(new Set())
      setModifiedFields(new Set())
      setOpen(false)
    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} project:`, error)
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
      return "Verify Project"
    }
    return mode === "edit" ? "Edit Project" : "Create New Project"
  }

  // Get submit button text based on mode and verification
  const getSubmitButtonText = () => {
    if (isLoading) {
      if (showVerification) return "Saving & Verifying..."
      return mode === "edit" ? "Updating..." : "Creating..."
    }
    if (showVerification) return "Update & Verify"
    return mode === "edit" ? "Update Project" : "Create Project"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        {mode === "create" && controlledOpen === undefined && (
          <DialogTrigger asChild>
            {children || (
              <Button className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            )}
          </DialogTrigger>
        )}
        
        <DialogContent className="sm:max-w-[700px] lg:max-w-[800px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
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
                    {verificationProgress}% Complete ({verifiedFields.size}/{PROJECT_VERIFICATION_FIELDS.length} fields)
                  </Badge>
                </div>
                <Progress value={verificationProgress} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{verifiedFields.size} verified</span>
                  <span>{PROJECT_VERIFICATION_FIELDS.length - verifiedFields.size} remaining</span>
                  {modifiedFields.size > 0 && (
                    <span className="text-blue-600">{modifiedFields.size} modified</span>
                  )}
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4" id="project-form">
              
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
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="projectName">Name *</Label>
                        <Input
                          id="projectName"
                          type="text"
                          placeholder="E-Commerce Platform Redesign"
                          value={formData.projectName}
                          onChange={(e) => handleInputChange("projectName", e.target.value)}
                          className={errors.projectName ? "border-red-500" : ""}
                        />
                        {errors.projectName && <p className="text-sm text-red-500">{errors.projectName}</p>}
                        <VerificationCheckbox fieldName="projectName" />
                      </div>

                      {/* Employer & Client Location — same row on large screens */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employer-combobox">Employer</Label>
                          {formData.selectedEmployer ? (
                            <div
                              className={`flex items-center gap-1 border rounded-md bg-background px-3 py-2 min-h-9 ${errors.selectedEmployer ? "border-red-500" : ""}`}
                            >
                              <span className="flex-1 truncate">{formData.selectedEmployer.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => {
                                  handleInputChange("selectedEmployer", null)
                                  setEmployerSearchQuery("")
                                  setEmployerSearchResults([])
                                }}
                                aria-label="Clear employer"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Popover
                              open={employerComboboxOpen}
                              onOpenChange={(open) => {
                                setEmployerComboboxOpen(open)
                                if (!open) {
                                  setEmployerSearchQuery("")
                                  setEmployerSearchResults([])
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={`w-full justify-between font-normal ${errors.selectedEmployer ? "border-red-500" : ""}`}
                                >
                                  <span className={employerSearchQuery ? "text-foreground" : "text-muted-foreground"}>
                                    {employerSearchQuery || "Search employers..."}
                                  </span>
                                  <ChevronsUpDown className="opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Search employers..."
                                    value={employerSearchQuery}
                                    onValueChange={setEmployerSearchQuery}
                                    className="h-9"
                                  />
                                  <CommandList>
                                    {employerSearchLoading && (
                                      <div className="py-6 text-center text-sm text-muted-foreground">
                                        Searching...
                                      </div>
                                    )}
                                    {!employerSearchLoading && employerSearchQuery.trim().length < 2 && (
                                      <div className="py-6 text-center text-sm text-muted-foreground">
                                        Type to search
                                      </div>
                                    )}
                                    {!employerSearchLoading &&
                                      employerSearchQuery.trim().length >= 2 &&
                                      employerSearchResults.length === 0 && (
                                        <CommandGroup>
                                          <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                                            No employers found
                                          </div>
                                          <CommandItem
                                            value="__add_new_employer__"
                                            onSelect={() => {
                                              setEmployerComboboxOpen(false)
                                              setAddEmployerDialogOpen(true)
                                            }}
                                            className="cursor-pointer font-medium text-primary"
                                          >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add New Employer
                                          </CommandItem>
                                        </CommandGroup>
                                      )}
                                    {!employerSearchLoading && employerSearchResults.length > 0 && (
                                      <CommandGroup>
                                        {employerSearchResults.map((emp) => (
                                          <CommandItem
                                            key={emp.id}
                                            value={String(emp.id)}
                                            onSelect={() => {
                                              handleInputChange("selectedEmployer", { id: emp.id, name: emp.name })
                                              setEmployerComboboxOpen(false)
                                              setEmployerSearchQuery("")
                                              setEmployerSearchResults([])
                                            }}
                                            className="cursor-pointer"
                                          >
                                            {emp.name}
                                            <Check className="ml-auto opacity-100" />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                          {errors.selectedEmployer && (
                            <p className="text-sm text-red-500">{errors.selectedEmployer}</p>
                          )}
                          <VerificationCheckbox fieldName="selectedEmployer" />
                        </div>

                        <div className="space-y-2">
                          <Label>Client Location</Label>
                          <MultiSelect
                            items={clientLocationOptions}
                            selected={formData.clientLocations}
                            onChange={(values) => handleInputChange("clientLocations", values)}
                            placeholder="Select client locations..."
                            searchPlaceholder="Search locations..."
                            maxDisplay={3}
                            creatable={true}
                            createLabel="Add Client Location"
                            onCreateNew={onCreateClientLocation ? (name) => onCreateClientLocation(name) : undefined}
                          />
                          <VerificationCheckbox fieldName="clientLocations" />
                        </div>
                      </div>

                      {/* Type & Status — same row on large screens */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="projectType">Type</Label>
                          <Select
                            value={formData.projectType || ""}
                            onValueChange={(value) => handleInputChange("projectType", value)}
                          >
                            <SelectTrigger
                              id="projectType"
                              className={`w-full ${errors.projectType ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                            <SelectContent>
                              {projectTypeOptions.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.projectType && <p className="text-sm text-red-500">{errors.projectType}</p>}
                          <VerificationCheckbox fieldName="projectType" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status">Status *</Label>
                          <Select
                            value={formData.status || ""}
                            onValueChange={(value) => handleInputChange("status", value as ProjectStatus)}
                          >
                            <SelectTrigger
                              id="status"
                              className={`w-full ${errors.status ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Select project status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                          <VerificationCheckbox fieldName="status" />
                        </div>
                      </div>

                      {/* Team Size — own row */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Team Size *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="minTeamSize" className="text-xs text-muted-foreground">
                              Minimum
                            </Label>
                            <Input
                              id="minTeamSize"
                              type="number"
                              placeholder="e.g., 5"
                              min={0}
                              value={formData.minTeamSize}
                              onChange={(e) => handleInputChange("minTeamSize", e.target.value)}
                              className={errors.minTeamSize ? "border-red-500" : ""}
                            />
                            {errors.minTeamSize && <p className="text-xs text-red-500">{errors.minTeamSize}</p>}
                            <VerificationCheckbox fieldName="minTeamSize" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="maxTeamSize" className="text-xs text-muted-foreground">
                              Maximum
                            </Label>
                            <Input
                              id="maxTeamSize"
                              type="number"
                              placeholder="e.g., 30"
                              min={0}
                              value={formData.maxTeamSize}
                              onChange={(e) => handleInputChange("maxTeamSize", e.target.value)}
                              className={errors.maxTeamSize ? "border-red-500" : ""}
                            />
                            {errors.maxTeamSize && <p className="text-xs text-red-500">{errors.maxTeamSize}</p>}
                            <VerificationCheckbox fieldName="maxTeamSize" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Dates Section */}
              <Collapsible 
                open={expandedSections.has("dates")} 
                onOpenChange={() => toggleSection("dates")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Project Dates
                          {showVerification && (
                            <SectionProgressBadge 
                              percentage={datesProgress.percentage}
                              verified={datesProgress.verified}
                              total={datesProgress.total}
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
                                id="verify-all-dates"
                                checked={isSectionFullyVerified("dates")}
                                onCheckedChange={(checked) => handleVerifyAllSection("dates", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label 
                                htmlFor="verify-all-dates" 
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("dates") ? (
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
                          <Label htmlFor="startDate">Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                id="startDate"
                                className="w-full justify-between font-normal"
                              >
                                {formData.startDate 
                                  ? formData.startDate.toLocaleDateString() 
                                  : "Select start date"}
                                <CalendarIcon />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.startDate}
                                captionLayout="dropdown"
                                onSelect={(date) => handleInputChange("startDate", date)}
                              />
                            </PopoverContent>
                          </Popover>
                          <VerificationCheckbox fieldName="startDate" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                id="endDate"
                                className={`w-full justify-between font-normal ${errors.endDate ? "border-red-500" : ""}`}
                              >
                                {formData.endDate 
                                  ? formData.endDate.toLocaleDateString() 
                                  : "Select end date"}
                                <CalendarIcon />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.endDate}
                                captionLayout="dropdown"
                                onSelect={(date) => handleInputChange("endDate", date)}
                              />
                            </PopoverContent>
                          </Popover>
                          {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                          <VerificationCheckbox fieldName="endDate" />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Technology Stack Section */}
              <Collapsible 
                open={expandedSections.has("tech-stack")} 
                onOpenChange={() => toggleSection("tech-stack")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Technology Stack
                          {showVerification && (
                            <SectionProgressBadge 
                              percentage={techStackProgress.percentage}
                              verified={techStackProgress.verified}
                              total={techStackProgress.total}
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
                                id="verify-all-tech-stack"
                                checked={isSectionFullyVerified("tech-stack")}
                                onCheckedChange={(checked) => handleVerifyAllSection("tech-stack", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label 
                                htmlFor="verify-all-tech-stack" 
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("tech-stack") ? (
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
                      <div className="space-y-2">
                        <Label>Technologies</Label>
                        <MultiSelect
                          items={techStackOptions}
                          selected={formData.techStacks}
                          onChange={(values) => handleInputChange("techStacks", values)}
                          placeholder="Select technologies..."
                          searchPlaceholder="Search technologies..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Technology"
                          onCreateNew={onCreateTechStack ? (name) => onCreateTechStack(name) : undefined}
                        />
                        <VerificationCheckbox fieldName="techStacks" />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Domains Section */}
              <Collapsible 
                open={expandedSections.has("domains")} 
                onOpenChange={() => toggleSection("domains")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Domains & Technical Aspects
                          {showVerification && (
                            <SectionProgressBadge 
                              percentage={domainsProgress.percentage}
                              verified={domainsProgress.verified}
                              total={domainsProgress.total}
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
                                id="verify-all-domains"
                                checked={isSectionFullyVerified("domains")}
                                onCheckedChange={(checked) => handleVerifyAllSection("domains", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label 
                                htmlFor="verify-all-domains" 
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("domains") ? (
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
                      <div className="space-y-2">
                        <Label>Vertical Domains</Label>
                        <MultiSelect
                          items={verticalDomainOptions}
                          selected={formData.verticalDomains}
                          onChange={(values) => handleInputChange("verticalDomains", values)}
                          placeholder="Select vertical domains..."
                          searchPlaceholder="Search vertical domains..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Vertical Domain"
                          onCreateNew={onCreateVerticalDomain ? (name) => onCreateVerticalDomain(name) : undefined}
                        />
                        <VerificationCheckbox fieldName="verticalDomains" />
                      </div>

                      <div className="space-y-2">
                        <Label>Horizontal Domains</Label>
                        <MultiSelect
                          items={horizontalDomainOptions}
                          selected={formData.horizontalDomains}
                          onChange={(values) => handleInputChange("horizontalDomains", values)}
                          placeholder="Select horizontal domains..."
                          searchPlaceholder="Search horizontal domains..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Horizontal Domain"
                          onCreateNew={onCreateHorizontalDomain ? (name) => onCreateHorizontalDomain(name) : undefined}
                        />
                        <VerificationCheckbox fieldName="horizontalDomains" />
                      </div>

                      <div className="space-y-2">
                        <Label>Technical Aspects</Label>
                        <MultiSelect
                          items={technicalAspectOptions}
                          selected={formData.technicalAspects}
                          onChange={(values) => handleInputChange("technicalAspects", values)}
                          placeholder="Select technical aspects..."
                          searchPlaceholder="Search technical aspects..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Technical Aspect"
                          onCreateNew={onCreateTechnicalAspect ? (name) => onCreateTechnicalAspect(name) : undefined}
                        />
                        <VerificationCheckbox fieldName="technicalAspects" />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Content Section */}
              <Collapsible 
                open={expandedSections.has("content")} 
                onOpenChange={() => toggleSection("content")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Description & Links
                          {showVerification && (
                            <SectionProgressBadge 
                              percentage={contentProgress.percentage}
                              verified={contentProgress.verified}
                              total={contentProgress.total}
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
                                id="verify-all-content"
                                checked={isSectionFullyVerified("content")}
                                onCheckedChange={(checked) => handleVerifyAllSection("content", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label 
                                htmlFor="verify-all-content" 
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("content") ? (
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
                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Provide a detailed description of the project, its goals, and key features..."
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                        <VerificationCheckbox fieldName="description" />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                          id="notes"
                          type="text"
                          placeholder="Additional notes, requirements, or comments..."
                          value={formData.notes}
                          onChange={(e) => handleInputChange("notes", e.target.value)}
                        />
                        <VerificationCheckbox fieldName="notes" />
                      </div>

                      {/* Link */}
                      <div className="space-y-2">
                        <Label htmlFor="projectLink">Link</Label>
                        <Input
                          id="projectLink"
                          type="url"
                          placeholder="https://project.example.com"
                          value={formData.projectLink}
                          onChange={(e) => handleInputChange("projectLink", e.target.value)}
                          className={errors.projectLink ? "border-red-500" : ""}
                        />
                        {errors.projectLink && <p className="text-sm text-red-500">{errors.projectLink}</p>}
                        <VerificationCheckbox fieldName="projectLink" />
                      </div>

                      {/* Published Status */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isPublished"
                            checked={formData.isPublished}
                            onCheckedChange={(checked) => {
                              handleInputChange("isPublished", checked === true)
                            }}
                          />
                          <Label htmlFor="isPublished" className="cursor-pointer">
                            Published App
                          </Label>
                        </div>
                        <VerificationCheckbox fieldName="isPublished" />
                      </div>

                      {/* Platforms & Download Count — same row on large screens */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Platforms</Label>
                          <MultiSelect
                            items={publishPlatformOptions}
                            selected={formData.publishPlatforms}
                            onChange={(values) => handleInputChange("publishPlatforms", values)}
                            placeholder="Select platforms"
                            searchPlaceholder="Search platforms..."
                          />
                          <VerificationCheckbox fieldName="publishPlatforms" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="downloadCount">Download Count</Label>
                          <Input
                            id="downloadCount"
                            type="number"
                            placeholder="e.g., 100000"
                            min="0"
                            value={formData.downloadCount}
                            onChange={(e) => handleInputChange("downloadCount", e.target.value)}
                          />
                          <VerificationCheckbox fieldName="downloadCount" />
                        </div>
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
              form="project-form"
              disabled={isLoading}
              className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmployerCreationDialog
        mode="create"
        open={addEmployerDialogOpen}
        onOpenChange={setAddEmployerDialogOpen}
        initialName={employerSearchQuery}
        onSubmit={async (formData) => {
          const dto = buildCreateEmployerDto(formData, {
            techStacksLookup: lookups?.techStacks ?? [],
            tagsLookup: [],
            timeSupportZonesLookup: [],
          })
          const created = await createEmployer(dto)
          return created ? { id: created.id, name: created.name } : undefined
        }}
        onSuccess={(employer) => {
          handleInputChange("selectedEmployer", employer)
          setAddEmployerDialogOpen(false)
          setEmployerSearchQuery("")
          setEmployerSearchResults([])
          setEmployerComboboxOpen(false)
        }}
      />

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
