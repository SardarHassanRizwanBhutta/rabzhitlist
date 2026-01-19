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
import { Progress } from "@/components/ui/progress"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Plus, Check, ChevronsUpDown, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { Project, ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/types/project"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleEmployers } from "@/lib/sample-data/employers"  // Add this import
import { 
  getVerificationsForProject,
  sampleVerificationUsers 
} from "@/lib/sample-data/verification"

// Form data interface
export interface ProjectFormData {
  projectName: string
  employerName: string  // Add this
  projectType: string
  teamSize: string
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

interface ProjectCreationDialogProps {
  children?: React.ReactNode
  mode?: DialogMode
  projectData?: Project
  showVerification?: boolean
  onSubmit?: (data: ProjectFormData, verificationState?: ProjectVerificationState) => Promise<void> | void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  initialName?: string
}

const initialFormData: ProjectFormData = {
  projectName: "",
  employerName: "",  // Add this
  projectType: "",
  teamSize: "",
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

const extractUniqueProjectTypes = (): string[] => {
  const types = new Set<string>()
  sampleProjects.forEach(project => {
    types.add(project.projectType)
  })
  return Array.from(types).sort()
}

// Project type options
const projectTypeOptions: MultiSelectOption[] = extractUniqueProjectTypes().map(type => ({
  value: type,
  label: type
}))

// Employer options - Add this
const employerOptions: MultiSelectOption[] = sampleEmployers.map(employer => ({
  value: employer.name,  // Use employer name as value to match Project.employerName
  label: employer.name
}))

// Multi-select options extracted from actual project data
const techStackOptions: MultiSelectOption[] = extractUniqueTechStacks().map(tech => ({
  value: tech,
  label: tech
}))

const verticalDomainOptions: MultiSelectOption[] = extractUniqueVerticalDomains().map(domain => ({
  value: domain,
  label: domain
}))

const horizontalDomainOptions: MultiSelectOption[] = extractUniqueHorizontalDomains().map(domain => ({
  value: domain,
  label: domain
}))

const technicalAspectOptions: MultiSelectOption[] = extractUniqueTechnicalAspects().map(aspect => ({
  value: aspect,
  label: aspect
}))

// Helper function to convert Project to ProjectFormData
const projectToFormData = (project: Project): ProjectFormData => {
  return {
    projectName: project.projectName || "",
    employerName: project.employerName || "",  // Add this
    projectType: project.projectType || "",
    teamSize: project.teamSize || "",
    startDate: project.startDate ? new Date(project.startDate) : undefined,
    endDate: project.endDate ? new Date(project.endDate) : undefined,
    status: project.status || "",
    description: project.description || "",
    notes: project.notes || "",
    projectLink: project.projectLink || "",
    isPublished: project.isPublished || false,
    publishPlatforms: project.publishPlatforms ? [...project.publishPlatforms] : [],
    downloadCount: project.downloadCount ? project.downloadCount.toString() : "",
    // Create new arrays to avoid reference issues
    techStacks: project.techStacks ? [...project.techStacks] : [],
    verticalDomains: project.verticalDomains ? [...project.verticalDomains] : [],
    horizontalDomains: project.horizontalDomains ? [...project.horizontalDomains] : [],
    technicalAspects: project.technicalAspects ? [...project.technicalAspects] : [],
  }
}

// All verifiable fields for projects
const PROJECT_VERIFICATION_FIELDS = [
  'projectName', 'employerName', 'projectType', 'teamSize', 'status',
  'startDate', 'endDate', 'description', 'notes', 'projectLink',
  'isPublished', 'publishPlatforms', 'downloadCount',
  'techStacks', 'verticalDomains', 'horizontalDomains', 'technicalAspects'
]

export function ProjectCreationDialog({
  children,
  mode = "create",
  projectData,
  showVerification = false,
  onSubmit,
  onOpenChange,
  open: controlledOpen,
  initialName,
}: ProjectCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
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

  const handleInputChange = (field: keyof ProjectFormData, value: string | Date | undefined | string[] | boolean) => {
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
    calculateSectionProgress(['projectName', 'employerName', 'projectType', 'teamSize', 'status']),
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
      'basic-info': ['projectName', 'employerName', 'projectType', 'teamSize', 'status'],
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
      <div className="flex items-center gap-1.5 ml-2">
        <Checkbox
          id={`verify-${fieldName}`}
          checked={isChecked}
          onCheckedChange={(checked) => handleVerificationToggle(fieldName, checked === true)}
          className="h-4 w-4"
        />
        <Label 
          htmlFor={`verify-${fieldName}`} 
          className={`text-xs cursor-pointer ${isChecked ? 'text-green-600' : 'text-muted-foreground'}`}
        >
          {label || (isModified ? 'Verified (modified)' : 'Verified')}
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

    if (!formData.teamSize.trim()) {
      newErrors.teamSize = "Team size is required"
    } else {
      // Validate team size format (single number or range)
      const teamSizePattern = /^\d+(-\d+)?$/
      if (!teamSizePattern.test(formData.teamSize.trim())) {
        newErrors.teamSize = "Team size must be a number (e.g., '5') or range (e.g., '5-10')"
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
        {mode === "create" && !showVerification && controlledOpen === undefined && (
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
                      {/* Project Name */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="projectName">Project Name *</Label>
                          <VerificationCheckbox fieldName="projectName" />
                        </div>
                        <Input
                          id="projectName"
                          type="text"
                          placeholder="E-Commerce Platform Redesign"
                          value={formData.projectName}
                          onChange={(e) => handleInputChange("projectName", e.target.value)}
                          className={errors.projectName ? "border-red-500" : ""}
                        />
                        {errors.projectName && <p className="text-sm text-red-500">{errors.projectName}</p>}
                      </div>

                      {/* Employer - Add this */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="employerName">Employer</Label>
                          <VerificationCheckbox fieldName="employerName" />
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between ${errors.employerName ? "border-red-500" : ""}`}
                            >
                              {formData.employerName
                                ? employerOptions.find((option) => option.value === formData.employerName)?.label
                                : "Select employer"}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search employer..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No employer found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value=""
                                    onSelect={() => {
                                      handleInputChange("employerName", "")
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`ml-auto ${formData.employerName === "" ? "opacity-100" : "opacity-0"}`}
                                    />
                                    Not Linked
                                  </CommandItem>
                                  {employerOptions.map((employer) => (
                                    <CommandItem
                                      key={employer.value}
                                      value={employer.value}
                                      onSelect={(currentValue) => {
                                        handleInputChange("employerName", currentValue)
                                      }}
                                      className="cursor-pointer"
                                    >
                                      {employer.label}
                                      <Check
                                        className={`ml-auto ${formData.employerName === employer.value ? "opacity-100" : "opacity-0"}`}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {errors.employerName && <p className="text-sm text-red-500">{errors.employerName}</p>}
                      </div>

                      {/* Project Type */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="projectType">Project Type</Label>
                          <VerificationCheckbox fieldName="projectType" />
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between ${errors.projectType ? "border-red-500" : ""}`}
                            >
                              {formData.projectType
                                ? projectTypeOptions.find((option) => option.value === formData.projectType)?.label
                                : "Select project type"}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search type..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No type found.</CommandEmpty>
                                <CommandGroup>
                                  {projectTypeOptions.map((type) => (
                                    <CommandItem
                                      key={type.value}
                                      value={type.value}
                                      onSelect={(currentValue) => {
                                        handleInputChange("projectType", currentValue)
                                      }}
                                      className="cursor-pointer"
                                    >
                                      {type.label}
                                      <Check
                                        className={`ml-auto ${formData.projectType === type.value ? "opacity-100" : "opacity-0"}`}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {errors.projectType && <p className="text-sm text-red-500">{errors.projectType}</p>}
                      </div>

                      {/* Team Size & Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="teamSize">Team Size *</Label>
                            <VerificationCheckbox fieldName="teamSize" />
                          </div>
                          <Input
                            id="teamSize"
                            type="text"
                            placeholder="12 or 10-15"
                            value={formData.teamSize}
                            onChange={(e) => handleInputChange("teamSize", e.target.value)}
                            className={errors.teamSize ? "border-red-500" : ""}
                          />
                          {errors.teamSize && <p className="text-sm text-red-500">{errors.teamSize}</p>}
                          <p className="text-xs text-muted-foreground">
                            Enter single number (e.g., &quot;12&quot;) or range (e.g., &quot;10-15&quot;)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="status">Status *</Label>
                            <VerificationCheckbox fieldName="status" />
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={`w-full justify-between ${errors.status ? "border-red-500" : ""}`}
                              >
                                {formData.status
                                  ? statusOptions.find((option) => option.value === formData.status)?.label
                                  : "Select project status"}
                                <ChevronsUpDown className="opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Search status..." className="h-9" />
                                <CommandList>
                                  <CommandEmpty>No status found.</CommandEmpty>
                                  <CommandGroup>
                                    {statusOptions.map((status) => (
                                      <CommandItem
                                        key={status.value}
                                        value={status.value}
                                        onSelect={(currentValue) => {
                                          handleInputChange("status", currentValue as ProjectStatus)
                                        }}
                                        className="cursor-pointer"
                                      >
                                        {status.label}
                                        <Check
                                          className={`ml-auto ${formData.status === status.value ? "opacity-100" : "opacity-0"}`}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
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
                          <div className="flex items-center justify-between">
                            <Label htmlFor="startDate">Start Date</Label>
                            <VerificationCheckbox fieldName="startDate" />
                          </div>
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
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="endDate">End Date</Label>
                            <VerificationCheckbox fieldName="endDate" />
                          </div>
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
                        <div className="flex items-center justify-between">
                          <Label>Technologies</Label>
                          <VerificationCheckbox fieldName="techStacks" />
                        </div>
                        <MultiSelect
                          items={techStackOptions}
                          selected={formData.techStacks}
                          onChange={(values) => handleInputChange("techStacks", values)}
                          placeholder="Select technologies..."
                          searchPlaceholder="Search technologies..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Technology"
                        />
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
                        <div className="flex items-center justify-between">
                          <Label>Vertical Domains</Label>
                          <VerificationCheckbox fieldName="verticalDomains" />
                        </div>
                        <MultiSelect
                          items={verticalDomainOptions}
                          selected={formData.verticalDomains}
                          onChange={(values) => handleInputChange("verticalDomains", values)}
                          placeholder="Select vertical domains..."
                          searchPlaceholder="Search vertical domains..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Vertical Domain"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Horizontal Domains</Label>
                          <VerificationCheckbox fieldName="horizontalDomains" />
                        </div>
                        <MultiSelect
                          items={horizontalDomainOptions}
                          selected={formData.horizontalDomains}
                          onChange={(values) => handleInputChange("horizontalDomains", values)}
                          placeholder="Select horizontal domains..."
                          searchPlaceholder="Search horizontal domains..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Horizontal Domain"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Technical Aspects</Label>
                          <VerificationCheckbox fieldName="technicalAspects" />
                        </div>
                        <MultiSelect
                          items={technicalAspectOptions}
                          selected={formData.technicalAspects}
                          onChange={(values) => handleInputChange("technicalAspects", values)}
                          placeholder="Select technical aspects..."
                          searchPlaceholder="Search technical aspects..."
                          maxDisplay={4}
                          creatable={true}
                          createLabel="Add Technical Aspect"
                        />
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor="description">Description *</Label>
                          <VerificationCheckbox fieldName="description" />
                        </div>
                        <Textarea
                          id="description"
                          placeholder="Provide a detailed description of the project, its goals, and key features..."
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="notes">Notes</Label>
                          <VerificationCheckbox fieldName="notes" />
                        </div>
                        <Input
                          id="notes"
                          type="text"
                          placeholder="Additional notes, requirements, or comments..."
                          value={formData.notes}
                          onChange={(e) => handleInputChange("notes", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Brief additional information or special requirements
                        </p>
                      </div>

                      {/* Project Link */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="projectLink">Project Link</Label>
                          <VerificationCheckbox fieldName="projectLink" />
                        </div>
                        <Input
                          id="projectLink"
                          type="url"
                          placeholder="https://project.example.com"
                          value={formData.projectLink}
                          onChange={(e) => handleInputChange("projectLink", e.target.value)}
                          className={errors.projectLink ? "border-red-500" : ""}
                        />
                        {errors.projectLink && <p className="text-sm text-red-500">{errors.projectLink}</p>}
                        <p className="text-xs text-muted-foreground">
                          Optional link to project demo, repository, or documentation
                        </p>
                      </div>

                      {/* Published Status */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
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
                      </div>

                      {/* Publish Platforms */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <VerificationCheckbox fieldName="publishPlatforms" />
                        </div>
                        <MultiSelect
                          items={publishPlatformOptions}
                          selected={formData.publishPlatforms}
                          onChange={(values) => handleInputChange("publishPlatforms", values)}
                          placeholder="Select platforms"
                          label="Platforms (optional)"
                          searchPlaceholder="Search platforms..."
                        />
                      </div>

                      {/* Download Count */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="downloadCount">Download Count</Label>
                          <VerificationCheckbox fieldName="downloadCount" />
                        </div>
                        <Input
                          id="downloadCount"
                          type="number"
                          placeholder="e.g., 100000"
                          min="0"
                          value={formData.downloadCount}
                          onChange={(e) => handleInputChange("downloadCount", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Total download count (e.g., 100000 for 100K downloads). Only applicable for published apps.
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
