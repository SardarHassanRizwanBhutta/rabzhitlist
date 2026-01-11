"use client"

import * as React from "react"
import { useState, useRef, useMemo, useCallback, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
// import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { Loader2, Plus, User, Briefcase, Trash2, ChevronDown, Award, GraduationCap, Check, ChevronsUpDown, X, FolderOpen, ShieldCheck, Code } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { BenefitsSelector } from "@/components/ui/benefits-selector"
import { Candidate } from "@/lib/types/candidate"
import { EmployerCreationDialog, EmployerFormData, EmployerVerificationState } from "@/components/employer-creation-dialog"
import { ProjectCreationDialog, ProjectFormData, ProjectVerificationState } from "@/components/project-creation-dialog"
import { UniversityCreationDialog, UniversityFormData, UniversityVerificationState } from "@/components/university-creation-dialog"
import { CertificationCreationDialog, CertificationFormData, CertificationVerificationState } from "@/components/certification-creation-dialog"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Types for form data
export type ShiftType = "Morning" | "Evening" | "Night" | "Rotational" | "24x7"
export type WorkMode = "Remote" | "Onsite" | "Hybrid"
export type TimeSupportZone = "US" | "UK" | "EU" | "APAC" | "MEA"

// Option interface for comboboxes
interface ComboboxOption {
  value: string
  label: string
}

export interface ProjectExperience {
  id: string
  projectName: string
  contributionNotes: string
}

export interface CandidateStandaloneProject {
  id: string
  projectName: string
  contributionNotes: string
}

export interface WorkExperienceBenefit {
  id: string
  name: string
  amount: number | null
  unit: "PKR" | "days" | "count" | "percent" | null
}

export interface WorkExperience {
  id: string
  employerName: string
  jobTitle: string
  projects: ProjectExperience[]
  startDate: Date | undefined
  endDate: Date | undefined
  techStacks: string[]
  domains: string[]  // NEW FIELD
  shiftType: ShiftType | ""
  workMode: WorkMode | ""
  timeSupportZones: string[]
  benefits: WorkExperienceBenefit[]
}

export interface CandidateCertification {
  id: string
  certificationId: string
  certificationName: string
  issueDate: Date | undefined
  expiryDate: Date | undefined
  certificationUrl: string
}

export interface CandidateEducation {
  id: string
  universityLocationId: string
  universityLocationName: string
  degreeName: string
  majorName: string
  startMonth: Date | undefined
  endMonth: Date | undefined
  grades: string
  isTopper: boolean
  isCheetah: boolean
}

export interface CandidateFormData {
  // Basic Information
  name: string
  postingTitle: string  // Add this
  city: string
  currentSalary: string
  expectedSalary: string
  cnic: string
  contactNumber: string
  email: string
  linkedinUrl: string
  githubUrl: string
  
  // Work Experience - dynamic array
  workExperiences: WorkExperience[]
  
  // Standalone Projects - dynamic array (projects not associated with work experience)
  projects: CandidateStandaloneProject[]
  
  // Certifications - dynamic array
  certifications: CandidateCertification[]
  
  // Education - dynamic array
  educations: CandidateEducation[]
  
  // Standalone Tech Stacks - overall technical skills (not tied to specific employer)
  techStacks: string[]
  // Top Developer flag
  isTopDeveloper: boolean
  // Personality Type
  personalityType: string
}

// Extract unique employers from sample candidates
const extractUniqueEmployers = (): ComboboxOption[] => {
  const employers = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      if (we.employerName) {
        employers.add(we.employerName)
      }
    })
  })
  return Array.from(employers).sort().map(emp => ({
    label: emp,
    value: emp
  }))
}

// Base employer options from sample data
const baseEmployerOptions: ComboboxOption[] = [
  ...extractUniqueEmployers(),
  ...sampleEmployers.map(emp => ({ label: emp.name, value: emp.name }))
].filter((emp, index, self) => 
  index === self.findIndex(e => e.value.toLowerCase() === emp.value.toLowerCase())
).sort((a, b) => a.label.localeCompare(b.label))

// Base project options from sample data
const baseProjectOptions: ComboboxOption[] = sampleProjects.map(project => ({
  label: project.projectName,
  value: project.projectName
})).sort((a, b) => a.label.localeCompare(b.label))

// Extract unique tech stacks from sample candidates (case-insensitive deduplication)
const extractUniqueTechStacks = (): MultiSelectOption[] => {
  const techStacksMap = new Map<string, string>() // Map<lowercase, original>
  sampleCandidates.forEach(candidate => {
    // Include tech stacks from work experiences
    candidate.workExperiences?.forEach(we => {
      we.techStacks.forEach(tech => {
        const lowerTech = tech.toLowerCase().trim()
        if (lowerTech && !techStacksMap.has(lowerTech)) {
          // Store the first occurrence (preserving original casing)
          techStacksMap.set(lowerTech, tech.trim())
        }
      })
    })
    // Also include standalone tech stacks from candidate level
    candidate.techStacks?.forEach(tech => {
      const lowerTech = tech.toLowerCase().trim()
      if (lowerTech && !techStacksMap.has(lowerTech)) {
        // Store the first occurrence (preserving original casing)
        techStacksMap.set(lowerTech, tech.trim())
      }
    })
  })
  return Array.from(techStacksMap.values()).sort().map(tech => ({
    label: tech,
    value: tech
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

// Base tech stack options (extracted from sample data)
const baseTechStackOptions: MultiSelectOption[] = extractUniqueTechStacks()
// Base horizontal domain options (extracted from sample data)
const baseHorizontalDomainOptions: MultiSelectOption[] = extractUniqueHorizontalDomains()
const shiftTypeOptions: ComboboxOption[] = [
  { label: "Morning", value: "Morning" },
  { label: "Evening", value: "Evening" },
  { label: "Night", value: "Night" },
  { label: "Rotational", value: "Rotational" },
  { label: "24x7", value: "24x7" },
]

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

const timeSupportZoneOptions: MultiSelectOption[] = [
  { label: "US", value: "US" },
  { label: "UK", value: "UK" },
  { label: "EU", value: "EU" },
  { label: "APAC", value: "APAC" },
  { label: "MEA", value: "MEA" },
]
// Base certification options (extracted from sample data)
const baseCertificationOptions: ComboboxOption[] = sampleCertifications.map(cert => ({
  label: cert.certificationName,
  value: cert.id
}))

// Base university location options (extracted from sample data)
const baseUniversityLocationOptions: ComboboxOption[] = sampleUniversities.flatMap(university =>
  university.locations.map(location => ({
    label: `${university.name} - ${location.city}`,
    value: location.id
  }))
)

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

// Base degree options (extracted from sample data)
const baseDegreeOptions: ComboboxOption[] = extractUniqueDegreeNames()

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

// Base major options (extracted from sample data)
const baseMajorOptions: ComboboxOption[] = extractUniqueMajorNames()

// Reusable Combobox component following Shadcn/ui pattern
interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  creatable?: boolean
  onCreateNew?: (value: string) => void
  createLabel?: string
}

function ReusableCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className,
  disabled = false,
  creatable = false,
  onCreateNew,
  createLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Handle wheel and touch events to enable scrolling
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
  }, [])

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) return options
    const searchLower = searchValue.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower)
    )
  }, [options, searchValue])

  // Check if search value already exists
  const searchValueExists = React.useMemo(() => {
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
    if (onCreateNew && searchValue.trim()) {
      onCreateNew(searchValue.trim())
      setSearchValue("")
      setOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (creatable && e.key === "Enter" && shouldShowCreate) {
      e.preventDefault()
      handleCreateNew()
    }
    if (e.key === "Escape") {
      setOpen(false)
      setSearchValue("")
    }
  }
  
  return (
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
          className={`w-full justify-between ${className || ""}`}
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0"
        onWheel={handleWheel}
        >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
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
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearchValue("")
                    }}
                    className="cursor-pointer"
                  >
                    {option.label}
                    <Check
                      className={`ml-auto ${value === option.value ? "opacity-100" : "opacity-0"}`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type DialogMode = "create" | "edit"

// Verification state for tracking which fields have been verified
export interface VerificationState {
  verifiedFields: Set<string>
  modifiedFields: Set<string>
}

interface CandidateCreationDialogProps {
  children?: React.ReactNode
  mode?: DialogMode
  candidateData?: Candidate
  showVerification?: boolean  // Enable verification UI mode (automatically true in edit mode, optional for create mode)
  onSubmit?: (data: CandidateFormData, verificationState?: VerificationState) => Promise<void> | void
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

const createEmptyProject = (): ProjectExperience => ({
  id: crypto.randomUUID(),
  projectName: "",
  contributionNotes: "",
})

const createEmptyWorkExperience = (): WorkExperience => ({
  id: crypto.randomUUID(),
  employerName: "",
  jobTitle: "",
  projects: [],
  startDate: undefined,
  endDate: undefined,
  techStacks: [],
  domains: [],  // NEW FIELD
  shiftType: "",
  workMode: "",
  timeSupportZones: [],
  benefits: [],
})

const createEmptyCertification = (): CandidateCertification => ({
  id: crypto.randomUUID(),
  certificationId: "",
  certificationName: "",
  issueDate: undefined,
  expiryDate: undefined,
  certificationUrl: "",
})

const createEmptyStandaloneProject = (): CandidateStandaloneProject => ({
  id: crypto.randomUUID(),
  projectName: "",
  contributionNotes: "",
})

const createEmptyEducation = (): CandidateEducation => ({
  id: crypto.randomUUID(),
  universityLocationId: "",
  universityLocationName: "",
  degreeName: "",
  majorName: "",
  startMonth: undefined,
  endMonth: undefined,
  grades: "",
  isTopper: false,
  isCheetah: false,
})

const initialFormData: CandidateFormData = {
  name: "",
  postingTitle: "",
  city: "",
  currentSalary: "",
  expectedSalary: "",
  cnic: "",
  contactNumber: "",
  email: "",
  linkedinUrl: "",
  githubUrl: "",
  workExperiences: [],
  projects: [],
  certifications: [],
  educations: [],
  techStacks: [],
  isTopDeveloper: false,
  personalityType: "",
}

// Convert Candidate to CandidateFormData for edit mode
const candidateToFormData = (candidate: Candidate): CandidateFormData => {
  return {
    name: candidate.name || "",
    postingTitle: candidate.postingTitle || "",  // Add this
    city: candidate.city || "",
    currentSalary: candidate.currentSalary?.toString() || "",
    expectedSalary: candidate.expectedSalary?.toString() || "",
    cnic: candidate.cnic || "",
    contactNumber: candidate.mobileNo || "",
    email: candidate.email || "",
    linkedinUrl: candidate.linkedinUrl || "",
    githubUrl: candidate.githubUrl || "",
    workExperiences: candidate.workExperiences?.map(we => ({
      id: we.id,
      employerName: we.employerName || "",
      jobTitle: we.jobTitle || "",
      projects: we.projects.map(proj => ({
        id: proj.id,
        projectName: proj.projectName || "",
        contributionNotes: proj.contributionNotes ?? "",
      })),
      startDate: we.startDate,
      endDate: we.endDate,
      techStacks: we.techStacks || [],
      domains: we.domains || [],  // NEW FIELD
      shiftType: (we.shiftType || "") as ShiftType | "",
      workMode: (we.workMode || "") as WorkMode | "",
      timeSupportZones: we.timeSupportZones || [],
      benefits: we.benefits?.map(b => ({
        id: b.id,
        name: b.name,
        amount: b.amount,
        unit: b.unit || null,
      })) || [],
    })) || [],
    projects: candidate.projects?.map(proj => ({
      id: proj.id,
      projectName: proj.projectName || "",
      contributionNotes: proj.contributionNotes ?? "",
    })) || [],
    certifications: candidate.certifications?.map(cert => ({
      id: cert.id,
      certificationId: cert.certificationId || "",
      certificationName: cert.certificationName || "",
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      certificationUrl: cert.certificationUrl || "",
    })) || [],
    educations: candidate.educations?.map(edu => ({
      id: edu.id,
      universityLocationId: edu.universityLocationId || "",
      universityLocationName: edu.universityLocationName || "",
      degreeName: edu.degreeName || "",
      majorName: edu.majorName || "",
      startMonth: edu.startMonth,
      endMonth: edu.endMonth,
      grades: edu.grades || "",
      isTopper: edu.isTopper ?? false,
      isCheetah: edu.isCheetah ?? false,
    })) || [],
    techStacks: candidate.techStacks || [],
    isTopDeveloper: candidate.isTopDeveloper ?? false,
    personalityType: candidate.personalityType || "",
  }
}

export function CandidateCreationDialog({
  children,
  mode = "create",
  candidateData,
  showVerification: showVerificationProp,
  onSubmit,
  onOpenChange,
  open: controlledOpen,
}: CandidateCreationDialogProps) {
  // Always show verification in edit mode, allow override via prop for create mode
  const showVerification = mode === "edit" ? true : (showVerificationProp ?? false)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  
  // Unsaved changes warning state
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const pendingCloseRef = useRef(false)
  
  // Track initial form data for change detection
  const initialFormDataRef = useRef<CandidateFormData | null>(null)
  
  // Verification state - track which fields have been verified this session
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set())
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CandidateFormData>(() => {
    if (mode === "edit" && candidateData) {
      return candidateToFormData(candidateData)
    }
    return initialFormData
  })

  // Sticky navigation tabs state
  const [activeTab, setActiveTab] = useState<string>("basic-info")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)

  // Define sections for navigation
  const sections = useMemo(() => [
    { id: "basic", sectionId: "basic-info", label: "Basic Information", shortLabel: "Basic" },
    { id: "work-experience", sectionId: "work-experience", label: "Work Experience", shortLabel: "Experience" },
    { id: "tech-stacks", sectionId: "tech-stacks", label: "Tech Stacks", shortLabel: "Tech" },
    { id: "projects", sectionId: "projects", label: "Projects", shortLabel: "Projects" },
    { id: "education", sectionId: "education", label: "Education", shortLabel: "Education" },
    { id: "certifications", sectionId: "certifications", label: "Certifications", shortLabel: "Certs" },
  ], [])

  const [workExperienceOpen, setWorkExperienceOpen] = useState(true)
  const [techStacksOpen, setTechStacksOpen] = useState(true)
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [certificationsOpen, setCertificationsOpen] = useState(true)
  const [educationOpen, setEducationOpen] = useState(true)
  
  // Employer creation state
  const [employerOptions, setEmployerOptions] = useState<ComboboxOption[]>(baseEmployerOptions)
  const [createEmployerDialogOpen, setCreateEmployerDialogOpen] = useState(false)
  const [pendingEmployerName, setPendingEmployerName] = useState<string>("")
  const [pendingWorkExperienceIndex, setPendingWorkExperienceIndex] = useState<number | null>(null)
  
  // Project creation state
  const [projectOptions, setProjectOptions] = useState<ComboboxOption[]>(baseProjectOptions)
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false)
  const [pendingProjectName, setPendingProjectName] = useState<string>("")
  const [pendingProjectContext, setPendingProjectContext] = useState<{
    type: 'workExperience' | 'independent'
    workExperienceIndex?: number
    projectIndex?: number
    independentProjectIndex?: number
  } | null>(null)
  
  // University creation state
  const [universityLocationOptions, setUniversityLocationOptions] = useState<ComboboxOption[]>(baseUniversityLocationOptions)
  const [createUniversityDialogOpen, setCreateUniversityDialogOpen] = useState(false)
  const [pendingUniversityName, setPendingUniversityName] = useState<string>("")
  const [pendingEducationIndex, setPendingEducationIndex] = useState<number | null>(null)
  
  // Certification creation state
  const [certificationOptions, setCertificationOptions] = useState<ComboboxOption[]>(baseCertificationOptions)
  const [createCertificationDialogOpen, setCreateCertificationDialogOpen] = useState(false)
  const [pendingCertificationName, setPendingCertificationName] = useState<string>("")
  const [pendingCertificationIndex, setPendingCertificationIndex] = useState<number | null>(null)
  
  // Degree and Major options state (for creatable functionality)
  const [degreeOptions, setDegreeOptions] = useState<ComboboxOption[]>(baseDegreeOptions)
  const [majorOptions, setMajorOptions] = useState<ComboboxOption[]>(baseMajorOptions)
  
  // Tech Stack and Domain options state (for creatable functionality)
  const [techStackOptions, setTechStackOptions] = useState<MultiSelectOption[]>(baseTechStackOptions)
  const [horizontalDomainOptions, setHorizontalDomainOptions] = useState<MultiSelectOption[]>(baseHorizontalDomainOptions)
  
  const [errors, setErrors] = useState<{
    basic?: Partial<Record<keyof Omit<CandidateFormData, 'workExperiences' | 'certifications' | 'educations'>, string>>
    workExperiences?: { 
      [index: number]: Partial<Record<keyof Omit<WorkExperience, 'projects'>, string>> & {
        projects?: { [projectIndex: number]: Partial<Record<keyof ProjectExperience, string>> }
      }
    }
    projects?: { [index: number]: Partial<Record<keyof CandidateStandaloneProject, string>> }
    certifications?: { [index: number]: Partial<Record<keyof CandidateCertification, string>> }
    educations?: { [index: number]: Partial<Record<keyof CandidateEducation, string>> }
    techStacks?: string
  }>({})
  

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!initialFormDataRef.current) return false
    return JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current) || 
           verifiedFields.size > 0
  }, [formData, verifiedFields])
  
  // Calculate verification progress
  const verificationProgress = useMemo(() => {
    if (!showVerification) return { total: 0, verified: 0, percentage: 0 }
    
    // Count all verifiable fields
    const basicFields = ['name', 'city', 'currentSalary', 'expectedSalary', 'cnic', 'contactNumber', 'email', 'linkedinUrl', 'githubUrl', 'personalityType']
    let total = basicFields.length
    let verified = basicFields.filter(f => verifiedFields.has(f)).length
    
    // Work experiences
    formData.workExperiences.forEach((_, idx) => {
      const weFields = ['employerName', 'jobTitle', 'startDate', 'endDate', 'techStacks', 'shiftType', 'workMode']
      weFields.forEach(f => {
        total++
        if (verifiedFields.has(`workExperiences.${idx}.${f}`)) verified++
      })
    })
    
    // Projects
    formData.projects.forEach((_, idx) => {
      total += 2 // projectName, contributionNotes
      if (verifiedFields.has(`projects.${idx}.projectName`)) verified++
      if (verifiedFields.has(`projects.${idx}.contributionNotes`)) verified++
    })
    
    // Certifications
    formData.certifications.forEach((_, idx) => {
      total += 4 // certificationName, issueDate, expiryDate, certificationUrl
      if (verifiedFields.has(`certifications.${idx}.certificationName`)) verified++
      if (verifiedFields.has(`certifications.${idx}.issueDate`)) verified++
      if (verifiedFields.has(`certifications.${idx}.expiryDate`)) verified++
      if (verifiedFields.has(`certifications.${idx}.certificationUrl`)) verified++
    })
    
    // Educations
    formData.educations.forEach((_, idx) => {
      total += 6 // universityLocationName, degreeName, majorName, startMonth, endMonth, grades
      if (verifiedFields.has(`educations.${idx}.universityLocationName`)) verified++
      if (verifiedFields.has(`educations.${idx}.degreeName`)) verified++
      if (verifiedFields.has(`educations.${idx}.majorName`)) verified++
      if (verifiedFields.has(`educations.${idx}.startMonth`)) verified++
      if (verifiedFields.has(`educations.${idx}.endMonth`)) verified++
      if (verifiedFields.has(`educations.${idx}.grades`)) verified++
    })
    
    // Tech Stacks
    total += 1 // techStacks
    if (verifiedFields.has('techStacks')) verified++
    
    return { 
      total, 
      verified, 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0 
    }
  }, [showVerification, verifiedFields, formData])
  
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
    if (!showVerification || total === 0) return null

    return (
      <Badge 
        variant="default" 
        className={`${getProgressColor(percentage)} text-white text-xs font-medium`}
      >
        {percentage}% verified ({verified}/{total})
      </Badge>
    )
  }

  // Calculate section-specific progress
  const basicInfoProgress = useMemo(() => {
    if (!showVerification) return { percentage: 0, verified: 0, total: 0 }
    const basicFields = ['name', 'city', 'currentSalary', 'expectedSalary', 'cnic', 'contactNumber', 'email', 'linkedinUrl', 'githubUrl', 'personalityType']
    const total = basicFields.length
    const verified = basicFields.filter(f => verifiedFields.has(f)).length
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [showVerification, verifiedFields])

  const workExperienceProgress = useMemo(() => {
    if (!showVerification) return { percentage: 0, verified: 0, total: 0 }
    let total = 0
    let verified = 0
    
    formData.workExperiences.forEach((_, idx) => {
      const weFields = ['employerName', 'jobTitle', 'startDate', 'endDate', 'techStacks', 'shiftType', 'workMode', 'timeSupportZones']
      weFields.forEach(f => {
        total++
        if (verifiedFields.has(`workExperiences.${idx}.${f}`)) verified++
      })
      // Projects within work experience
      formData.workExperiences[idx]?.projects?.forEach((_, projIdx) => {
        total += 2 // projectName, contributionNotes
        if (verifiedFields.has(`workExperiences.${idx}.projects.${projIdx}.projectName`)) verified++
        if (verifiedFields.has(`workExperiences.${idx}.projects.${projIdx}.contributionNotes`)) verified++
      })
    })
    
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [showVerification, verifiedFields, formData.workExperiences])

  const projectsProgress = useMemo(() => {
    if (!showVerification) return { percentage: 0, verified: 0, total: 0 }
    let total = 0
    let verified = 0
    
    formData.projects.forEach((_, idx) => {
      total += 2 // projectName, contributionNotes
      if (verifiedFields.has(`projects.${idx}.projectName`)) verified++
      if (verifiedFields.has(`projects.${idx}.contributionNotes`)) verified++
    })
    
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [showVerification, verifiedFields, formData.projects])

  const educationProgress = useMemo(() => {
    if (!showVerification) return { percentage: 0, verified: 0, total: 0 }
    let total = 0
    let verified = 0
    
    formData.educations.forEach((_, idx) => {
      const eduFields = ['universityLocationName', 'degreeName', 'majorName', 'startMonth', 'endMonth', 'grades', 'isTopper', 'isCheetah']
      eduFields.forEach(f => {
        total++
        if (verifiedFields.has(`educations.${idx}.${f}`)) verified++
      })
    })
    
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [showVerification, verifiedFields, formData.educations])

  const certificationsProgress = useMemo(() => {
    if (!showVerification) return { percentage: 0, verified: 0, total: 0 }
    let total = 0
    let verified = 0
    
    formData.certifications.forEach((_, idx) => {
      const certFields = ['certificationName', 'issueDate', 'expiryDate', 'certificationUrl']
      certFields.forEach(f => {
        total++
        if (verifiedFields.has(`certifications.${idx}.${f}`)) verified++
      })
    })
    
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [showVerification, verifiedFields, formData.certifications])

  const techStacksProgress = useMemo(() => {
    if (!showVerification) return { percentage: 0, verified: 0, total: 0 }
    const total = 1 // techStacks field
    const verified = verifiedFields.has('techStacks') ? 1 : 0
    return { 
      percentage: verified > 0 ? 100 : 0,
      verified,
      total
    }
  }, [showVerification, verifiedFields])

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
        return projectsProgress
      case 'education':
        return educationProgress
      case 'certifications':
        return certificationsProgress
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

  // Helper function to scroll to element
  const scrollToElement = useCallback((element: HTMLElement, container: HTMLElement, yOffset: number, sectionId: string) => {
    // Set flag to prevent IntersectionObserver from interfering
    isScrollingRef.current = true
    
    // Update active tab immediately
    setActiveTab(sectionId)
    
    // Use double requestAnimationFrame to ensure layout is fully calculated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Verify element is still within container (important for nested dialogs)
        if (!container.contains(element)) {
          isScrollingRef.current = false
          return
        }
        
        // Get current scroll position
        const currentScrollTop = container.scrollTop
        
        // Get bounding rects (relative to viewport)
        const containerRect = container.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        
        // Calculate element's position relative to container's scrollable content
        // For nested dialogs, we need to account for the container's position
        // elementRect.top is relative to viewport
        // containerRect.top is container's position in viewport
        // currentScrollTop is how much we've scrolled within the container
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
    })
  }, [])

  // Scroll to section function
  const scrollToSection = useCallback((sectionId: string) => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const yOffset = 80 // Account for sticky header
    
    // Find element within the container (for nested dialog support)
    const elementInContainer = container.querySelector(`#${sectionId}`) as HTMLElement
    const element = elementInContainer || (() => {
      const el = document.getElementById(sectionId)
      return el && container.contains(el) ? el : null
    })()
    
    if (!element) return
    
    // Ensure section is expanded before scrolling (for collapsible sections)
    const sectionKey = sections.find(s => s.sectionId === sectionId)?.id
    let needsExpansion = false
    
    if (sectionKey) {
      // Expand the section if it's collapsed
      if (sectionKey === "work-experience" && !workExperienceOpen) {
        setWorkExperienceOpen(true)
        needsExpansion = true
      } else if (sectionKey === "tech-stacks" && !techStacksOpen) {
        setTechStacksOpen(true)
        needsExpansion = true
      } else if (sectionKey === "projects" && !projectsOpen) {
        setProjectsOpen(true)
        needsExpansion = true
      } else if (sectionKey === "education" && !educationOpen) {
        setEducationOpen(true)
        needsExpansion = true
      } else if (sectionKey === "certifications" && !certificationsOpen) {
        setCertificationsOpen(true)
        needsExpansion = true
      }
    }
    
    // Wait for expansion animation if needed, otherwise use small delay for DOM rendering
    const delay = needsExpansion ? 350 : 100
    setTimeout(() => {
      scrollToElement(element, container, yOffset, sectionId)
    }, delay)
  }, [sections, workExperienceOpen, techStacksOpen, projectsOpen, educationOpen, certificationsOpen, scrollToElement])

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    scrollToSection(value)
  }, [scrollToSection])

  // IntersectionObserver to detect active section while scrolling
  useEffect(() => {
    if (!open || !scrollContainerRef.current) return

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
          setActiveTab(activeId)
        }
      },
      {
        threshold: [0.2, 0.5, 0.8],
        root: container,
        rootMargin: '-80px 0px -60% 0px'
      }
    )

    // Observe all sections (scoped to container for nested dialog support)
    const sectionElements: (Element | null)[] = []
    sectionIds.forEach((sectionId) => {
      // Find element within container first (for nested dialogs)
      const elementInContainer = container.querySelector(`#${sectionId}`) as HTMLElement
      const element = elementInContainer || (() => {
        const el = document.getElementById(sectionId)
        return el && container.contains(el) ? el : null
      })()
      
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
  }, [open, sections, formData.workExperiences.length, formData.projects.length, formData.educations.length, formData.certifications.length])
  
  // Toggle field verification
  const toggleFieldVerification = useCallback((fieldPath: string) => {
    setVerifiedFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldPath)) {
        newSet.delete(fieldPath)
      } else {
        newSet.add(fieldPath)
      }
      return newSet
    })
  }, [])

  // Helper function to get all field paths for a section
  const getSectionFieldPaths = useCallback((sectionId: string): string[] => {
    const fields: string[] = []
    
    switch (sectionId) {
      case 'basic-info':
        fields.push('name', 'city', 'currentSalary', 'expectedSalary', 'cnic', 'contactNumber', 'email', 'linkedinUrl', 'githubUrl')
        break
      
      case 'work-experience':
        formData.workExperiences.forEach((_, idx) => {
          fields.push(
            `workExperiences.${idx}.employerName`,
            `workExperiences.${idx}.jobTitle`,
            `workExperiences.${idx}.startDate`,
            `workExperiences.${idx}.endDate`,
            `workExperiences.${idx}.techStacks`,
            `workExperiences.${idx}.domains`,  // NEW FIELD
            `workExperiences.${idx}.shiftType`,
            `workExperiences.${idx}.workMode`,
            `workExperiences.${idx}.timeSupportZones`,
            `workExperiences.${idx}.benefits`
          )
          // Projects within work experience
          formData.workExperiences[idx]?.projects?.forEach((_, projIdx) => {
            fields.push(
              `workExperiences.${idx}.projects.${projIdx}.projectName`,
              `workExperiences.${idx}.projects.${projIdx}.contributionNotes`
            )
          })
        })
        break
      
      case 'tech-stacks':
        fields.push('techStacks')
        break
      
      case 'projects':
        formData.projects.forEach((_, idx) => {
          fields.push(
            `projects.${idx}.projectName`,
            `projects.${idx}.contributionNotes`
          )
        })
        break
      
      case 'education':
        formData.educations.forEach((_, idx) => {
          fields.push(
            `educations.${idx}.universityLocationName`,
            `educations.${idx}.degreeName`,
            `educations.${idx}.majorName`,
            `educations.${idx}.startMonth`,
            `educations.${idx}.endMonth`,
            `educations.${idx}.grades`,
            `educations.${idx}.isTopper`,
            `educations.${idx}.isCheetah`
          )
        })
        break
      
      case 'certifications':
        formData.certifications.forEach((_, idx) => {
          fields.push(
            `certifications.${idx}.certificationName`,
            `certifications.${idx}.issueDate`,
            `certifications.${idx}.expiryDate`,
            `certifications.${idx}.certificationUrl`
          )
        })
        break
    }
    
    return fields
  }, [formData])

  // Check if all fields in a section are verified
  const isSectionFullyVerified = useCallback((sectionId: string): boolean => {
    const sectionFields = getSectionFieldPaths(sectionId)
    if (sectionFields.length === 0) return false
    
    return sectionFields.every(field => verifiedFields.has(field))
  }, [getSectionFieldPaths, verifiedFields])

  // Handle verify all fields in a section
  const handleVerifyAllSection = useCallback((sectionId: string, checked: boolean) => {
    const sectionFields = getSectionFieldPaths(sectionId)
    
    setVerifiedFields(prev => {
      const newSet = new Set(prev)
      if (checked) {
        // Add all fields
        sectionFields.forEach(field => newSet.add(field))
      } else {
        // Remove all fields
        sectionFields.forEach(field => newSet.delete(field))
      }
      return newSet
    })
  }, [getSectionFieldPaths])
  
  // Mark field as modified (auto-verify on edit when showVerification is true)
  const markFieldModified = useCallback((fieldPath: string) => {
    setModifiedFields(prev => new Set(prev).add(fieldPath))
    if (showVerification) {
      setVerifiedFields(prev => new Set(prev).add(fieldPath))
    }
  }, [showVerification])
  
  // Handle dialog close with unsaved changes check
  const setOpen = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      // Show warning dialog
      pendingCloseRef.current = true
      setShowUnsavedWarning(true)
      return
    }
    
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }
  
  // Handle confirmed close (discard changes)
  const handleConfirmClose = () => {
    setShowUnsavedWarning(false)
    pendingCloseRef.current = false
    resetForm()
    if (controlledOpen === undefined) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }
  
  // Handle cancel close (keep editing)
  const handleCancelClose = () => {
    setShowUnsavedWarning(false)
    pendingCloseRef.current = false
  }
  
  // Get dialog title based on mode
  const getDialogTitle = () => {
    if (mode === 'create') return 'Create New Candidate'
    // In edit mode, always show "Edit Candidate" (verification is built-in)
    return 'Edit Candidate'
  }
  
  // Get submit button text based on mode
  const getSubmitButtonText = (loading: boolean) => {
    if (loading) {
      if (mode === 'create') return 'Creating...'
      return 'Saving...'
    }
    if (mode === 'create') return 'Create Candidate'
    // In edit mode, always show "Save & Verify" since verification is built-in
    return 'Save & Verify'
  }

  const handleInputChange = (field: keyof Omit<CandidateFormData, 'workExperiences' | 'certifications' | 'educations' | 'projects'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    markFieldModified(field)
    // Clear error when user starts typing
    if (errors.basic?.[field]) {
      setErrors(prev => ({ 
        ...prev, 
        basic: { ...prev.basic, [field]: undefined }
      }))
    }
  }

  // Handle create new employer from Work Experience
  const handleCreateEmployer = (employerName: string, workExperienceIndex: number) => {
    setPendingEmployerName(employerName)
    setPendingWorkExperienceIndex(workExperienceIndex)
    setCreateEmployerDialogOpen(true)
  }

  // Handle employer creation success
  const handleEmployerCreated = async (employerData: EmployerFormData) => {
    const newEmployerName = employerData.name.trim()
    
    if (!newEmployerName) {
      toast.error("Employer name is required")
      return
    }

    // Add new employer to options list
    const newEmployerOption: ComboboxOption = {
      label: newEmployerName,
      value: newEmployerName
    }
    
    setEmployerOptions(prev => {
      // Check if already exists (case-insensitive)
      const exists = prev.some(opt => 
        opt.value.toLowerCase() === newEmployerName.toLowerCase()
      )
      if (exists) return prev
      return [...prev, newEmployerOption].sort((a, b) => a.label.localeCompare(b.label))
    })

    // Auto-select the newly created employer
    if (pendingWorkExperienceIndex !== null) {
      handleWorkExperienceChange(pendingWorkExperienceIndex, "employerName", newEmployerName)
    }

    // Show success toast
    toast.success(`Employer "${newEmployerName}" has been created successfully.`)

    // Close dialog and reset state
    setCreateEmployerDialogOpen(false)
    setPendingEmployerName("")
    setPendingWorkExperienceIndex(null)
  }

  // Handle employer creation cancel
  const handleEmployerCreationCancel = () => {
    setCreateEmployerDialogOpen(false)
    setPendingEmployerName("")
    setPendingWorkExperienceIndex(null)
  }

  // Handle project creation
  const handleProjectCreated = async (projectData: ProjectFormData) => {
    try {
      // Add new project to projectOptions
      const newProjectOption: ComboboxOption = {
        label: projectData.projectName,
        value: projectData.projectName
      }
      
      setProjectOptions(prev => {
        const updated = [...prev, newProjectOption]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the newly created project in the relevant field
      if (pendingProjectContext) {
        if (pendingProjectContext.type === 'workExperience' && 
            pendingProjectContext.workExperienceIndex !== undefined && 
            pendingProjectContext.projectIndex !== undefined) {
          handleProjectChange(
            pendingProjectContext.workExperienceIndex,
            pendingProjectContext.projectIndex,
            "projectName",
            projectData.projectName
          )
        } else if (pendingProjectContext.type === 'independent' && 
                   pendingProjectContext.independentProjectIndex !== undefined) {
          handleStandaloneProjectChange(
            pendingProjectContext.independentProjectIndex,
            "projectName",
            projectData.projectName
          )
        }
      }

      // Show success toast
      toast.success(`Project "${projectData.projectName}" has been created successfully.`)

      // Close dialog and reset state
      setCreateProjectDialogOpen(false)
      setPendingProjectName("")
      setPendingProjectContext(null)
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project. Please try again.")
    }
  }

  // Handle project creation cancel
  const handleProjectCreationCancel = () => {
    setCreateProjectDialogOpen(false)
    setPendingProjectName("")
    setPendingProjectContext(null)
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

      // Auto-select the first location (or main campus if available) in the relevant education field
      if (pendingEducationIndex !== null) {
        // Find main campus first, otherwise use first location
        const mainCampus = universityData.locations.find(loc => loc.isMainCampus)
        const locationToSelect = mainCampus || universityData.locations[0]
        
        if (locationToSelect) {
          // Update the education field with the location ID and name
          setFormData(prev => ({
            ...prev,
            educations: prev.educations.map((edu, i) =>
              i === pendingEducationIndex ? {
                ...edu,
                universityLocationId: locationToSelect.id,
                universityLocationName: `${universityName} - ${locationToSelect.city}`
              } : edu
            )
          }))
        }
      }

      // Show success toast
      toast.success(`University "${universityName}" has been created successfully.`)

      // Close dialog and reset state
      setCreateUniversityDialogOpen(false)
      setPendingUniversityName("")
      setPendingEducationIndex(null)
    } catch (error) {
      console.error("Error creating university:", error)
      toast.error("Failed to create university. Please try again.")
    }
  }

  // Handle university creation cancel
  const handleUniversityCreationCancel = () => {
    setCreateUniversityDialogOpen(false)
    setPendingUniversityName("")
    setPendingEducationIndex(null)
  }

  // Handle certification creation success
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
      const newCertificationOption: ComboboxOption = {
        label: certificationName,
        value: newCertificationId
      }
      
      // Add new certification to options list
      setCertificationOptions(prev => {
        const updated = [...prev, newCertificationOption]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the newly created certification in the relevant certification field
      if (pendingCertificationIndex !== null) {
        setFormData(prev => ({
          ...prev,
          certifications: prev.certifications.map((cert, i) =>
            i === pendingCertificationIndex ? {
              ...cert,
              certificationId: newCertificationId,
              certificationName: certificationName
            } : cert
          )
        }))
      }

      // Show success toast
      toast.success(`Certification "${certificationName}" has been created successfully.`)

      // Close dialog and reset state
      setCreateCertificationDialogOpen(false)
      setPendingCertificationName("")
      setPendingCertificationIndex(null)
    } catch (error) {
      console.error("Error creating certification:", error)
      toast.error("Failed to create certification. Please try again.")
    }
  }

  // Handle certification creation cancel
  const handleCertificationCreationCancel = () => {
    setCreateCertificationDialogOpen(false)
    setPendingCertificationName("")
    setPendingCertificationIndex(null)
  }

  const handleWorkExperienceChange = (
    index: number, 
    field: keyof Omit<WorkExperience, 'projects'>, 
    value: string | string[] | Date | undefined | WorkExperienceBenefit[]
  ) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
    markFieldModified(`workExperiences.${index}.${field}`)
    
    // Clear error when user starts typing
    if (errors.workExperiences?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        workExperiences: {
          ...prev.workExperiences,
          [index]: {
            ...prev.workExperiences?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const handleProjectChange = (
    expIndex: number,
    projectIndex: number,
    field: keyof ProjectExperience,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map((exp, i) =>
        i === expIndex ? {
          ...exp,
          projects: exp.projects.map((project, j) =>
            j === projectIndex ? { ...project, [field]: value } : project
          )
        } : exp
      )
    }))
    
    // Clear error when user starts typing
    if (errors.workExperiences?.[expIndex]?.projects?.[projectIndex]?.[field]) {
      setErrors(prev => ({
        ...prev,
        workExperiences: {
          ...prev.workExperiences,
          [expIndex]: {
            ...prev.workExperiences?.[expIndex],
            projects: {
              ...prev.workExperiences?.[expIndex]?.projects,
              [projectIndex]: {
                ...prev.workExperiences?.[expIndex]?.projects?.[projectIndex],
                [field]: undefined
              }
            }
          }
        }
      }))
    }
  }

  const addProject = (expIndex: number) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map((exp, i) =>
        i === expIndex ? {
          ...exp,
          projects: [...exp.projects, createEmptyProject()]
        } : exp
      )
    }))
  }

  const removeProject = (expIndex: number, projectIndex: number) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map((exp, i) =>
        i === expIndex ? {
          ...exp,
          projects: exp.projects.filter((_, j) => j !== projectIndex)
        } : exp
      )
    }))
    
    // Clear errors for removed project
    if (errors.workExperiences?.[expIndex]?.projects?.[projectIndex]) {
      const newProjectErrors = { ...errors.workExperiences[expIndex].projects }
      delete newProjectErrors[projectIndex]
      setErrors(prev => ({
        ...prev,
        workExperiences: {
          ...prev.workExperiences,
          [expIndex]: {
            ...prev.workExperiences?.[expIndex],
            projects: newProjectErrors
          }
        }
      }))
    }
  }

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperiences: [...prev.workExperiences, createEmptyWorkExperience()]
    }))
  }

  const removeWorkExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index)
    }))
    
    // Clear errors for removed experience
    if (errors.workExperiences?.[index]) {
      const newWorkExperienceErrors = { ...errors.workExperiences }
      delete newWorkExperienceErrors[index]
      setErrors(prev => ({
        ...prev,
        workExperiences: newWorkExperienceErrors
      }))
    }
  }

  const handleCertificationChange = (
    index: number,
    field: keyof CandidateCertification,
    value: string | Date | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      )
    }))

    // If certification is selected, populate the certification name
    if (field === "certificationId" && value) {
      const selectedCert = sampleCertifications.find(cert => cert.id === value)
      if (selectedCert) {
        setFormData(prev => ({
          ...prev,
          certifications: prev.certifications.map((cert, i) =>
            i === index ? { ...cert, certificationName: selectedCert.certificationName } : cert
          )
        }))
      }
    }
    
    // Clear error when user starts typing
    if (errors.certifications?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        certifications: {
          ...prev.certifications,
          [index]: {
            ...prev.certifications?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, createEmptyCertification()]
    }))
  }

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }))
    
    // Clear errors for removed certification
    if (errors.certifications?.[index]) {
      const newCertificationErrors = { ...errors.certifications }
      delete newCertificationErrors[index]
      setErrors(prev => ({
        ...prev,
        certifications: newCertificationErrors
      }))
    }
  }

  const handleEducationChange = (
    index: number,
    field: keyof CandidateEducation,
    value: string | Date | undefined | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }))

    // If university location is selected, populate the location name
    if (field === "universityLocationId" && value) {
      const selectedLocation = sampleUniversities
        .flatMap(uni => uni.locations)
        .find(loc => loc.id === value)
      const selectedUniversity = sampleUniversities.find(uni => 
        uni.locations.some(loc => loc.id === value)
      )
      
      if (selectedLocation && selectedUniversity) {
        setFormData(prev => ({
          ...prev,
          educations: prev.educations.map((edu, i) =>
            i === index ? { 
              ...edu, 
              universityLocationName: `${selectedUniversity.name} - ${selectedLocation.city}`
            } : edu
          )
        }))
      }
    }
    
    // Clear error when user starts typing
    if (errors.educations?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        educations: {
          ...prev.educations,
          [index]: {
            ...prev.educations?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      educations: [...prev.educations, createEmptyEducation()]
    }))
  }

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index)
    }))
    
    // Clear errors for removed education
    if (errors.educations?.[index]) {
      const newEducationErrors = { ...errors.educations }
      delete newEducationErrors[index]
      setErrors(prev => ({
        ...prev,
        educations: newEducationErrors
      }))
    }
  }

  const handleStandaloneProjectChange = (
    index: number,
    field: keyof CandidateStandaloneProject,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((project, i) =>
        i === index ? { ...project, [field]: value } : project
      )
    }))
    
    // Clear error when user starts typing
    if (errors.projects?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        projects: {
          ...prev.projects,
          [index]: {
            ...prev.projects?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const addStandaloneProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, createEmptyStandaloneProject()]
    }))
  }

  const removeStandaloneProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }))
    
    // Clear errors for removed project
    if (errors.projects?.[index]) {
      const newProjectErrors = { ...errors.projects }
      delete newProjectErrors[index]
      setErrors(prev => ({
        ...prev,
        projects: newProjectErrors
      }))
    }
  }

  const validateForm = (): boolean => {
    const basicErrors: Partial<Record<keyof Omit<CandidateFormData, 'workExperiences' | 'certifications' | 'educations'>, string>> = {}
    const workExperienceErrors: { 
      [index: number]: Partial<Record<keyof Omit<WorkExperience, 'projects'>, string>> & {
        projects?: { [projectIndex: number]: Partial<Record<keyof ProjectExperience, string>> }
      }
    } = {}
    const certificationErrors: { [index: number]: Partial<Record<keyof CandidateCertification, string>> } = {}
    const educationErrors: { [index: number]: Partial<Record<keyof CandidateEducation, string>> } = {}

    // Basic validation
    if (!formData.name.trim()) basicErrors.name = "Name is required"
    if (!formData.city.trim()) basicErrors.city = "City is required"
    if (!formData.email.trim()) basicErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) basicErrors.email = "Invalid email format"
    if (!formData.contactNumber.trim()) basicErrors.contactNumber = "Contact number is required"
    if (!formData.cnic.trim()) basicErrors.cnic = "CNIC is required"
    
    // URL validation
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith('http')) {
      basicErrors.linkedinUrl = "LinkedIn URL must start with http:// or https://"
    }
    if (formData.githubUrl && !formData.githubUrl.startsWith('http')) {
      basicErrors.githubUrl = "GitHub URL must start with http:// or https://"
    }

    // Work experience validation (only validate if experiences exist)
    formData.workExperiences.forEach((exp, index) => {
      const expErrors: Partial<Record<keyof Omit<WorkExperience, 'projects'>, string>> = {}
      const projectErrors: { [projectIndex: number]: Partial<Record<keyof ProjectExperience, string>> } = {}
      
      // Only validate if at least one field is filled (user started entering data)
      const hasAnyData = exp.employerName || exp.jobTitle || exp.projects.length > 0 ||
                        exp.startDate || exp.endDate || exp.techStacks.length > 0 ||
                        exp.shiftType || exp.workMode || exp.timeSupportZones.length > 0
      
      if (hasAnyData) {
        if (!exp.employerName) expErrors.employerName = "Employer is required"
        if (!exp.jobTitle.trim()) expErrors.jobTitle = "Job title is required"
      }

      // Validate projects within each experience
      exp.projects.forEach((project, projectIndex) => {
        const projErrors: Partial<Record<keyof ProjectExperience, string>> = {}
        
        // Only validate if at least one project field is filled
        const hasProjectData = project.projectName || project.contributionNotes
        
        if (hasProjectData) {
          if (!project.projectName.trim()) projErrors.projectName = "Project name is required"
        }
        
        if (Object.keys(projErrors).length > 0) {
          projectErrors[projectIndex] = projErrors
        }
      })
      
      if (Object.keys(expErrors).length > 0 || Object.keys(projectErrors).length > 0) {
        workExperienceErrors[index] = {
          ...expErrors,
          ...(Object.keys(projectErrors).length > 0 ? { projects: projectErrors } : {})
        }
      }
    })

    // Standalone Projects validation (only validate if projects exist)
    const projectErrors: { [index: number]: Partial<Record<keyof CandidateStandaloneProject, string>> } = {}
    formData.projects.forEach((project, index) => {
      const projErrors: Partial<Record<keyof CandidateStandaloneProject, string>> = {}
      
      // Only validate if at least one field is filled (user started entering data)
      const hasAnyData = project.projectName || project.contributionNotes
      
      if (hasAnyData) {
        if (!project.projectName.trim()) projErrors.projectName = "Project name is required"
      }
      
      if (Object.keys(projErrors).length > 0) {
        projectErrors[index] = projErrors
      }
    })

    // Certification validation (only validate if certifications exist)
    formData.certifications.forEach((cert, index) => {
      const certErrors: Partial<Record<keyof CandidateCertification, string>> = {}
      
      // Only validate if at least one field is filled (user started entering data)
      const hasAnyData = cert.certificationId || cert.issueDate || cert.expiryDate || cert.certificationUrl
      
      if (hasAnyData) {
        if (!cert.certificationId) certErrors.certificationId = "Certification is required"
        if (cert.certificationUrl && !cert.certificationUrl.startsWith('http')) {
          certErrors.certificationUrl = "Certification URL must start with http:// or https://"
        }
      }
      
      if (Object.keys(certErrors).length > 0) {
        certificationErrors[index] = certErrors
      }
    })

    // Education validation (only validate if educations exist)
    formData.educations.forEach((edu, index) => {
      const eduErrors: Partial<Record<keyof CandidateEducation, string>> = {}
      
      // Only validate if at least one field is filled (user started entering data)
      const hasAnyData = edu.universityLocationId || edu.degreeName || edu.majorName || 
                        edu.startMonth || edu.endMonth || edu.grades ||
                        edu.isTopper || edu.isCheetah
      
      if (hasAnyData) {
        if (!edu.universityLocationId) eduErrors.universityLocationId = "University location is required"
        if (!edu.degreeName) eduErrors.degreeName = "Degree name is required"
        if (!edu.majorName) eduErrors.majorName = "Major name is required"
      }
      
      if (Object.keys(eduErrors).length > 0) {
        educationErrors[index] = eduErrors
      }
    })

    const newErrors = {
      basic: Object.keys(basicErrors).length > 0 ? basicErrors : undefined,
      workExperiences: Object.keys(workExperienceErrors).length > 0 ? workExperienceErrors : undefined,
      projects: Object.keys(projectErrors).length > 0 ? projectErrors : undefined,
      certifications: Object.keys(certificationErrors).length > 0 ? certificationErrors : undefined,
      educations: Object.keys(educationErrors).length > 0 ? educationErrors : undefined,
    }

    setErrors(newErrors)
    return !newErrors.basic && !newErrors.workExperiences && !newErrors.projects && !newErrors.certifications && !newErrors.educations
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const verificationState: VerificationState = {
        verifiedFields: new Set(verifiedFields),
        modifiedFields: new Set(modifiedFields),
      }
      await onSubmit?.(formData, showVerification ? verificationState : undefined)
      resetForm()
      // Force close without warning since we just saved
      if (controlledOpen === undefined) {
        setInternalOpen(false)
      }
      onOpenChange?.(false)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    resetForm()
    if (controlledOpen === undefined) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }

  // Update form data when candidateData changes (for edit mode)
  React.useEffect(() => {
    if (mode === "edit" && candidateData && open) {
      const newFormData = candidateToFormData(candidateData)
      setFormData(newFormData)
      initialFormDataRef.current = newFormData
      setErrors({})
      setVerifiedFields(new Set())
      setModifiedFields(new Set())
      // Expand all sections for optimal UX in edit/verify mode
      setWorkExperienceOpen(true)
      setTechStacksOpen(true)
      setProjectsOpen(true)
      setCertificationsOpen(true)
      setEducationOpen(true)
    } else if (mode === "create" && open) {
      setFormData(initialFormData)
      initialFormDataRef.current = initialFormData
      setErrors({})
      setVerifiedFields(new Set())
      setModifiedFields(new Set())
      // Expand all sections by default for better UX
      setWorkExperienceOpen(true)
      setTechStacksOpen(true)
      setProjectsOpen(true)
      setCertificationsOpen(true)
      setEducationOpen(true)
    }
  }, [mode, candidateData, open])

  const resetForm = () => {
    if (mode === "edit" && candidateData) {
      const newFormData = candidateToFormData(candidateData)
      setFormData(newFormData)
      initialFormDataRef.current = newFormData
    } else {
      setFormData(initialFormData)
      initialFormDataRef.current = initialFormData
    }
    setErrors({})
    setVerifiedFields(new Set())
    setModifiedFields(new Set())
    setWorkExperienceOpen(false)
    setTechStacksOpen(false)
    setProjectsOpen(false)
    setCertificationsOpen(false)
    setEducationOpen(false)
  }

  // Verification checkbox component
  const VerificationCheckbox = ({ fieldPath, label }: { fieldPath: string; label?: string }) => {
    if (!showVerification) return null
    
    const isVerified = verifiedFields.has(fieldPath)
    
    return (
      <div className="flex items-center gap-2 mt-1">
        <Checkbox
          id={`verify-${fieldPath}`}
          checked={isVerified}
          onCheckedChange={() => toggleFieldVerification(fieldPath)}
          className="cursor-pointer"
        />
        <Label 
          htmlFor={`verify-${fieldPath}`}
          className={`text-xs cursor-pointer ${isVerified ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
        >
          {isVerified ? '✓ Verified' : label || 'Mark as verified'}
        </Label>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" && (
        <DialogTrigger asChild>
          {children || (
            <Button className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer">
              <Plus className="h-4 w-4" />
              Create Candidate
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[750px] lg:max-w-[850px] xl:max-w-[950px] max-h-[95vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border space-y-3">
          <DialogTitle className="flex items-center gap-2">
            {mode === "edit" && <ShieldCheck className="h-5 w-5 text-primary" />}
            {getDialogTitle()}
            {candidateData && mode === "edit" && (
              <span className="text-muted-foreground font-normal">: {candidateData.name}</span>
            )}
          </DialogTitle>
          
          {/* Verification Progress Bar - Always shown in edit mode */}
          {showVerification && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Verification Progress</span>
                <Badge variant={verificationProgress.percentage === 100 ? 'default' : 'secondary'}>
                  {verificationProgress.percentage}% Complete ({verificationProgress.verified}/{verificationProgress.total} fields)
                </Badge>
              </div>
              <Progress value={verificationProgress.percentage} className="h-2" />
            </div>
          )}
        </DialogHeader>

        {/* Sticky Section Navigation Tabs */}
        {showVerification && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
            <Tabs 
              value={activeTab} 
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
        )}

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div id="basic-info">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Basic Information
                  <SectionProgressBadge 
                    percentage={basicInfoProgress.percentage}
                    verified={basicInfoProgress.verified}
                    total={basicInfoProgress.total}
                  />
                </div>
                {showVerification && (
                  <div 
                    className="flex items-center gap-2" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      id="verify-all-basic-info"
                      checked={isSectionFullyVerified('basic-info')}
                      onCheckedChange={(checked) => handleVerifyAllSection('basic-info', !!checked)}
                      aria-label="Verify all fields in Basic Information section"
                    />
                    <Label 
                      htmlFor="verify-all-basic-info"
                      className="text-sm text-muted-foreground cursor-pointer font-normal"
                    >
                      Verify All
                    </Label>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.basic?.name ? "border-red-500" : ""}
                />
                {errors.basic?.name && <p className="text-sm text-red-500">{errors.basic.name}</p>}
                <VerificationCheckbox fieldPath="name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className={errors.basic?.city ? "border-red-500" : ""}
                />
                {errors.basic?.city && <p className="text-sm text-red-500">{errors.basic.city}</p>}
                <VerificationCheckbox fieldPath="city" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSalary">Current Salary</Label>
                <Input
                  id="currentSalary"
                  type="number"
                  placeholder="75000"
                  value={formData.currentSalary}
                  onChange={(e) => handleInputChange("currentSalary", e.target.value)}
                />
                <VerificationCheckbox fieldPath="currentSalary" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedSalary">Expected Salary</Label>
                <Input
                  id="expectedSalary"
                  type="number"
                  placeholder="85000"
                  value={formData.expectedSalary}
                  onChange={(e) => handleInputChange("expectedSalary", e.target.value)}
                />
                <VerificationCheckbox fieldPath="expectedSalary" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnic">CNIC *</Label>
                <Input
                  id="cnic"
                  type="text"
                  placeholder="12345-6789012-3"
                  value={formData.cnic}
                  onChange={(e) => handleInputChange("cnic", e.target.value)}
                  className={errors.basic?.cnic ? "border-red-500" : ""}
                />
                {errors.basic?.cnic && <p className="text-sm text-red-500">{errors.basic.cnic}</p>}
                <VerificationCheckbox fieldPath="cnic" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postingTitle">Posting Title *</Label>
                <Input
                  id="postingTitle"
                  type="text"
                  placeholder="Technical Lead (.NET)"
                  value={formData.postingTitle}
                  onChange={(e) => handleInputChange("postingTitle", e.target.value)}
                  className={errors.basic?.postingTitle ? "border-red-500" : ""}
                />
                {errors.basic?.postingTitle && <p className="text-sm text-red-500">{errors.basic.postingTitle}</p>}
                <VerificationCheckbox fieldPath="postingTitle" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Number *</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="+1-555-0123"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  className={errors.basic?.contactNumber ? "border-red-500" : ""}
                />
                {errors.basic?.contactNumber && <p className="text-sm text-red-500">{errors.basic.contactNumber}</p>}
                <VerificationCheckbox fieldPath="contactNumber" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.basic?.email ? "border-red-500" : ""}
                />
                {errors.basic?.email && <p className="text-sm text-red-500">{errors.basic.email}</p>}
                <VerificationCheckbox fieldPath="email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/johndoe"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                  className={errors.basic?.linkedinUrl ? "border-red-500" : ""}
                />
                {errors.basic?.linkedinUrl && <p className="text-sm text-red-500">{errors.basic.linkedinUrl}</p>}
                <VerificationCheckbox fieldPath="linkedinUrl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/johndoe"
                  value={formData.githubUrl}
                  onChange={(e) => handleInputChange("githubUrl", e.target.value)}
                  className={errors.basic?.githubUrl ? "border-red-500" : ""}
                />
                {errors.basic?.githubUrl && <p className="text-sm text-red-500">{errors.basic.githubUrl}</p>}
                <VerificationCheckbox fieldPath="githubUrl" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTopDeveloper"
                    checked={formData.isTopDeveloper}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ ...prev, isTopDeveloper: !!checked }))
                      if (showVerification) {
                        setModifiedFields(prev => new Set(prev).add("isTopDeveloper"))
                        setVerifiedFields(prev => new Set(prev).add("isTopDeveloper"))
                      }
                    }}
                  />
                  <Label htmlFor="isTopDeveloper" className="text-sm font-normal cursor-pointer">
                    Top Developer
                  </Label>
                </div>
                <VerificationCheckbox fieldPath="isTopDeveloper" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="personalityType">Personality Type</Label>
                <ReusableCombobox
                  options={personalityTypeOptions}
                  value={formData.personalityType}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, personalityType: value }))
                    if (showVerification) {
                      setModifiedFields(prev => new Set(prev).add("personalityType"))
                      setVerifiedFields(prev => new Set(prev).add("personalityType"))
                    }
                  }}
                  placeholder="Select personality type..."
                  searchPlaceholder="Search personality types..."
                  className={errors.basic?.personalityType ? "border-red-500" : ""}
                />
                {errors.basic?.personalityType && (
                  <p className="text-sm text-red-500">{errors.basic.personalityType}</p>
                )}
                <VerificationCheckbox fieldPath="personalityType" />
              </div>
              </div>
            </CardContent>
          </Card>
          </div>
          {/* Section 2: Work Experience (Collapsible) */}
          <div id="work-experience">
          <Collapsible open={workExperienceOpen} onOpenChange={setWorkExperienceOpen}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-lg font-medium">Work Experience</span>
                    {formData.workExperiences.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.workExperiences.length}
                      </Badge>
                    )}
                    <SectionProgressBadge 
                      percentage={workExperienceProgress.percentage}
                      verified={workExperienceProgress.verified}
                      total={workExperienceProgress.total}
                    />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      workExperienceOpen ? "transform rotate-180" : ""
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
                    id="verify-all-work-experience"
                    checked={isSectionFullyVerified('work-experience')}
                    onCheckedChange={(checked) => handleVerifyAllSection('work-experience', !!checked)}
                    aria-label="Verify all fields in Work Experience section"
                  />
                  <Label 
                    htmlFor="verify-all-work-experience"
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
                  Add work experience and employment history
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWorkExperience}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Experience
                </Button>
              </div>

            {formData.workExperiences.map((experience, index) => (
              <Card key={experience.id} className="relative">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <span>Experience {index + 1}</span>
                      {experience.projects.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {experience.projects.length} project{experience.projects.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkExperience(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                  {/* Experience Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`employerName-${index}`}>Employer Name *</Label>
                      <ReusableCombobox
                        options={employerOptions}
                        value={experience.employerName}
                        onValueChange={(value) => handleWorkExperienceChange(index, "employerName", value)}
                        placeholder="Select employer..."
                        searchPlaceholder="Search employers..."
                        className={errors.workExperiences?.[index]?.employerName ? "border-red-500" : ""}
                        creatable={true}
                        onCreateNew={(value) => handleCreateEmployer(value, index)}
                        createLabel="Add New Employer"
                      />
                      {errors.workExperiences?.[index]?.employerName && (
                        <p className="text-sm text-red-500">{errors.workExperiences[index].employerName}</p>
                      )}
                      <VerificationCheckbox fieldPath={`workExperiences.${index}.employerName`} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`jobTitle-${index}`}>Job Title *</Label>
                      <Input
                        id={`jobTitle-${index}`}
                        type="text"
                        placeholder="Senior Frontend Developer"
                        value={experience.jobTitle}
                        onChange={(e) => handleWorkExperienceChange(index, "jobTitle", e.target.value)}
                        className={errors.workExperiences?.[index]?.jobTitle ? "border-red-500" : ""}
                      />
                      {errors.workExperiences?.[index]?.jobTitle && (
                        <p className="text-sm text-red-500">{errors.workExperiences[index].jobTitle}</p>
                      )}
                      <VerificationCheckbox fieldPath={`workExperiences.${index}.jobTitle`} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`startDate-${index}`}>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id={`startDate-${index}`}
                            className="w-full justify-between font-normal"
                          >
                            {experience.startDate ? experience.startDate.toLocaleDateString() : "Select start date"}
                            <CalendarIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={experience.startDate}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              handleWorkExperienceChange(index, "startDate", date)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <VerificationCheckbox fieldPath={`workExperiences.${index}.startDate`} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`endDate-${index}`}>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id={`endDate-${index}`}
                            className="w-full justify-between font-normal"
                          >
                            {experience.endDate ? experience.endDate.toLocaleDateString() : "Select end date"}
                            <CalendarIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={experience.endDate}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              handleWorkExperienceChange(index, "endDate", date)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <VerificationCheckbox fieldPath={`workExperiences.${index}.endDate`} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`techStacks-${index}`}>Tech Stacks</Label>
                      <MultiSelect
                        items={techStackOptions}
                        selected={experience.techStacks}
                        onChange={(values) => handleWorkExperienceChange(index, "techStacks", values)}
                        placeholder="Select technologies..."
                        searchPlaceholder="Search tech stacks..."
                        maxDisplay={4}
                        creatable={true}
                        createLabel="Create New Tech Stack"
                        onCreateNew={(newTechStack) => {
                          // Add the new tech stack to options
                          const newOption = { label: newTechStack, value: newTechStack }
                          setTechStackOptions(prev => {
                            const updated = [...prev, newOption]
                            return updated.sort((a, b) => a.label.localeCompare(b.label))
                          })
                          // Auto-select the newly added tech stack
                          handleWorkExperienceChange(index, "techStacks", [...experience.techStacks, newTechStack])
                        }}
                      />
                      <VerificationCheckbox fieldPath={`workExperiences.${index}.techStacks`} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`domains-${index}`}>Domains</Label>
                      <MultiSelect
                        items={horizontalDomainOptions}
                        selected={experience.domains}
                        onChange={(values) => handleWorkExperienceChange(index, "domains", values)}
                        placeholder="Select domains..."
                        searchPlaceholder="Search domains..."
                        maxDisplay={4}
                        creatable={true}
                        createLabel="Create New Domain"
                        onCreateNew={(newDomain) => {
                          // Add the new domain to options
                          const newOption = { label: newDomain, value: newDomain }
                          setHorizontalDomainOptions(prev => {
                            const updated = [...prev, newOption]
                            return updated.sort((a, b) => a.label.localeCompare(b.label))
                          })
                          // Auto-select the newly added domain
                          handleWorkExperienceChange(index, "domains", [...experience.domains, newDomain])
                        }}
                      />
                      <VerificationCheckbox fieldPath={`workExperiences.${index}.domains`} />
                    </div>

                      <div className="space-y-2">
                        <Label htmlFor={`shiftType-${index}`}>Shift Type</Label>
                        <ReusableCombobox
                          options={shiftTypeOptions}
                          value={experience.shiftType}
                          onValueChange={(value) => handleWorkExperienceChange(index, "shiftType", value)}
                          placeholder="Select shift type..."
                          searchPlaceholder="Search shift types..."
                        />
                        <VerificationCheckbox fieldPath={`workExperiences.${index}.shiftType`} />
                      </div>

                    <div className="space-y-2">
                      <Label htmlFor={`workMode-${index}`}>Work Mode</Label>
                      <ReusableCombobox
                        options={workModeOptions}
                        value={experience.workMode}
                        onValueChange={(value) => handleWorkExperienceChange(index, "workMode", value)}
                        placeholder="Select work mode..."
                        searchPlaceholder="Search work modes..."
                      />
                      <VerificationCheckbox fieldPath={`workExperiences.${index}.workMode`} />
                    </div>
                  </div>

                  {/* Time Support Zones */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`timeSupportZones-${index}`}>Time Support Zones</Label>
                    <MultiSelect
                      items={timeSupportZoneOptions}
                      selected={experience.timeSupportZones}
                      onChange={(values) => handleWorkExperienceChange(index, "timeSupportZones", values)}
                      placeholder="Select time zones..."
                      searchPlaceholder="Search time zones..."
                      maxDisplay={5}
                    />
                    <VerificationCheckbox fieldPath={`workExperiences.${index}.timeSupportZones`} />
                  </div>

                  {/* Benefits Section */}
                  <div className="space-y-2">
                    <BenefitsSelector
                      benefits={experience.benefits}
                      onChange={(benefits) => handleWorkExperienceChange(index, "benefits", benefits)}
                    />
                    <VerificationCheckbox fieldPath={`workExperiences.${index}.benefits`} />
                  </div>

                  {/* Projects Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-border flex-1"></div>
                        <Label className="text-sm font-semibold text-muted-foreground px-3">Projects</Label>
                        <div className="h-px bg-border flex-1"></div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addProject(index)}
                        className="flex items-center gap-1 cursor-pointer transition-all duration-150 ease-in-out hover:bg-accent/50 hover:border-accent"
                      >
                        <Plus className="h-3 w-3" />
                        Add Project
                      </Button>
                    </div>

                    {experience.projects.length > 0 ? (
                      <div className="space-y-3">
                        {experience.projects.map((project, projectIndex) => (
                          <div key={project.id} className="relative bg-muted/30 rounded-lg p-4 border border-dashed border-muted-foreground/20">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span className="text-sm font-medium text-muted-foreground">
                                  Project {projectIndex + 1}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProject(index, projectIndex)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor={`projectName-${index}-${projectIndex}`}>Project Name *</Label>
                                <ReusableCombobox
                                  options={projectOptions}
                                  value={project.projectName}
                                  onValueChange={(value) => handleProjectChange(index, projectIndex, "projectName", value)}
                                  placeholder="Select project..."
                                  searchPlaceholder="Search projects..."
                                  className={errors.workExperiences?.[index]?.projects?.[projectIndex]?.projectName ? "border-red-500" : ""}
                                  creatable={true}
                                  createLabel="Add New Project"
                                  onCreateNew={(searchValue) => {
                                    setPendingProjectName(searchValue)
                                    setPendingProjectContext({
                                      type: 'workExperience',
                                      workExperienceIndex: index,
                                      projectIndex: projectIndex
                                    })
                                    setCreateProjectDialogOpen(true)
                                  }}
                                />
                                {errors.workExperiences?.[index]?.projects?.[projectIndex]?.projectName && (
                                  <p className="text-sm text-red-500">{errors.workExperiences[index].projects![projectIndex].projectName}</p>
                                )}
                                <VerificationCheckbox fieldPath={`workExperiences.${index}.projects.${projectIndex}.projectName`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`contributionNotes-${index}-${projectIndex}`}>Contribution Notes</Label>
                                <Textarea
                                  id={`contributionNotes-${index}-${projectIndex}`}
                                  placeholder="Describe your key contributions, achievements, and responsibilities in this project..."
                                  value={project.contributionNotes}
                                  onChange={(e) => handleProjectChange(index, projectIndex, "contributionNotes", e.target.value)}
                                  className="min-h-[80px] resize-none"
                                />
                                <VerificationCheckbox fieldPath={`workExperiences.${index}.projects.${projectIndex}.contributionNotes`} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-center bg-muted/20">
                        <div className="mx-auto h-8 w-8 rounded-full bg-muted flex items-center justify-center mb-2">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">No projects added yet</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addProject(index)}
                          className="cursor-pointer transition-all duration-150 ease-in-out hover:bg-accent/50 hover:border-accent"
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Your First Project
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

              {formData.workExperiences.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No work experience added yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addWorkExperience}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Experience
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          </div>
          {/* Section 3: Tech Stacks (Collapsible) */}
          <div id="tech-stacks">
          <Collapsible open={techStacksOpen} onOpenChange={setTechStacksOpen}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-lg font-medium">Tech Stacks</span>
                    {formData.techStacks.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.techStacks.length}
                      </Badge>
                    )}
                    <SectionProgressBadge 
                      percentage={techStacksProgress.percentage}
                      verified={techStacksProgress.verified}
                      total={techStacksProgress.total}
                    />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      techStacksOpen ? "transform rotate-180" : ""
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
                    id="verify-all-tech-stacks"
                    checked={isSectionFullyVerified('tech-stacks')}
                    onCheckedChange={(checked) => handleVerifyAllSection('tech-stacks', !!checked)}
                    aria-label="Verify all fields in Tech Stacks section"
                  />
                  <Label 
                    htmlFor="verify-all-tech-stacks"
                    className="text-sm text-muted-foreground cursor-pointer font-normal whitespace-nowrap"
                  >
                    Verify All
                  </Label>
                </div>
              )}
            </div>
            <CollapsibleContent className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Technical Skills</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <MultiSelect
                      items={techStackOptions}
                      selected={formData.techStacks}
                      onChange={(values) => {
                        setFormData(prev => ({ ...prev, techStacks: values }))
                        markFieldModified('techStacks')
                      }}
                      placeholder="Select tech stacks..."
                      searchPlaceholder="Search technologies..."
                      maxDisplay={4}
                      creatable={true}
                      createLabel="Create New Tech Stack"
                      onCreateNew={(newTechStack) => {
                        // Add the new tech stack to options
                        const newOption = { label: newTechStack, value: newTechStack }
                        setTechStackOptions(prev => {
                          const updated = [...prev, newOption]
                          return updated.sort((a, b) => a.label.localeCompare(b.label))
                        })
                        // Auto-select the newly added tech stack
                        setFormData(prev => ({ ...prev, techStacks: [...prev.techStacks, newTechStack] }))
                        markFieldModified('techStacks')
                      }}
                    />
                    <VerificationCheckbox fieldPath="techStacks" />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
          </div>
          {/* Section 4: Standalone Projects (Collapsible) */}
          <div id="projects">
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-lg font-medium">Projects</span>
                    {formData.projects.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.projects.length}
                      </Badge>
                    )}
                    <SectionProgressBadge 
                      percentage={projectsProgress.percentage}
                      verified={projectsProgress.verified}
                      total={projectsProgress.total}
                    />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      projectsOpen ? "transform rotate-180" : ""
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
                    id="verify-all-projects"
                    checked={isSectionFullyVerified('projects')}
                    onCheckedChange={(checked) => handleVerifyAllSection('projects', !!checked)}
                    aria-label="Verify all fields in Projects section"
                  />
                  <Label 
                    htmlFor="verify-all-projects"
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
                  Add independent projects not associated with work experience
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addStandaloneProject}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </div>

              {formData.projects.map((project, index) => (
                <Card key={project.id} className="relative">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Project {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStandaloneProject(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`standalone-projectName-${index}`}>Project Name *</Label>
                      <ReusableCombobox
                        options={projectOptions}
                        value={project.projectName}
                        onValueChange={(value) => handleStandaloneProjectChange(index, "projectName", value)}
                        placeholder="Select project..."
                        searchPlaceholder="Search projects..."
                        className={errors.projects?.[index]?.projectName ? "border-red-500" : ""}
                        creatable={true}
                        createLabel="Add New Project"
                        onCreateNew={(searchValue) => {
                          setPendingProjectName(searchValue)
                          setPendingProjectContext({
                            type: 'independent',
                            independentProjectIndex: index
                          })
                          setCreateProjectDialogOpen(true)
                        }}
                      />
                      {errors.projects?.[index]?.projectName && (
                        <p className="text-sm text-red-500">{errors.projects[index].projectName}</p>
                      )}
                      <VerificationCheckbox fieldPath={`projects.${index}.projectName`} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`standalone-contributionNotes-${index}`}>Contribution Notes</Label>
                      <Textarea
                        id={`standalone-contributionNotes-${index}`}
                        placeholder="Describe your key contributions, achievements, and responsibilities in this project..."
                        value={project.contributionNotes}
                        onChange={(e) => handleStandaloneProjectChange(index, "contributionNotes", e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <VerificationCheckbox fieldPath={`projects.${index}.contributionNotes`} />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.projects.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No projects added yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStandaloneProject}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Project
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          </div>
          {/* Section 5: Education (Collapsible) */}
          <div id="education">
          <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-lg font-medium">Education</span>
                    {formData.educations.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.educations.length}
                      </Badge>
                    )}
                    <SectionProgressBadge 
                      percentage={educationProgress.percentage}
                      verified={educationProgress.verified}
                      total={educationProgress.total}
                    />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      educationOpen ? "transform rotate-180" : ""
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
                    id="verify-all-education"
                    checked={isSectionFullyVerified('education')}
                    onCheckedChange={(checked) => handleVerifyAllSection('education', !!checked)}
                    aria-label="Verify all fields in Education section"
                  />
                  <Label 
                    htmlFor="verify-all-education"
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
                  Add educational background and academic achievements
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEducation}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Education
                </Button>
              </div>

              {formData.educations.map((education, index) => (
                <Card key={education.id} className="relative">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Education {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`universityLocation-${index}`}>University Location *</Label>
                          <ReusableCombobox
                            options={universityLocationOptions}
                            value={education.universityLocationId}
                            onValueChange={(value) => handleEducationChange(index, "universityLocationId", value)}
                            placeholder="Select university location..."
                            searchPlaceholder="Search universities..."
                            className={errors.educations?.[index]?.universityLocationId ? "border-red-500" : ""}
                            creatable={true}
                            createLabel="Add New University"
                            onCreateNew={(searchValue) => {
                              setPendingUniversityName(searchValue)
                              setPendingEducationIndex(index)
                              setCreateUniversityDialogOpen(true)
                            }}
                          />
                          {errors.educations?.[index]?.universityLocationId && (
                            <p className="text-sm text-red-500">{errors.educations[index].universityLocationId}</p>
                          )}
                          <VerificationCheckbox fieldPath={`educations.${index}.universityLocationName`} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`degreeName-${index}`}>Degree Name *</Label>
                          <ReusableCombobox
                            options={degreeOptions}
                            value={education.degreeName}
                            onValueChange={(value) => handleEducationChange(index, "degreeName", value)}
                            placeholder="Select degree..."
                            searchPlaceholder="Search degrees..."
                            className={errors.educations?.[index]?.degreeName ? "border-red-500" : ""}
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
                              handleEducationChange(index, "degreeName", newDegree)
                            }}
                          />
                          {errors.educations?.[index]?.degreeName && (
                            <p className="text-sm text-red-500">{errors.educations[index].degreeName}</p>
                          )}
                          <VerificationCheckbox fieldPath={`educations.${index}.degreeName`} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`majorName-${index}`}>Major Name *</Label>
                          <ReusableCombobox
                            options={majorOptions}
                            value={education.majorName}
                            onValueChange={(value) => handleEducationChange(index, "majorName", value)}
                            placeholder="Select major..."
                            searchPlaceholder="Search majors..."
                            className={errors.educations?.[index]?.majorName ? "border-red-500" : ""}
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
                              handleEducationChange(index, "majorName", newMajor)
                            }}
                          />
                          {errors.educations?.[index]?.majorName && (
                            <p className="text-sm text-red-500">{errors.educations[index].majorName}</p>
                          )}
                          <VerificationCheckbox fieldPath={`educations.${index}.majorName`} />
                        </div>

                      <div className="space-y-2">
                        <Label htmlFor={`startMonth-${index}`}>Start Month</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id={`startMonth-${index}`}
                              className="w-full justify-between font-normal"
                            >
                              {education.startMonth ? education.startMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : "Select start month"}
                              <CalendarIcon />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={education.startMonth}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                handleEducationChange(index, "startMonth", date)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <VerificationCheckbox fieldPath={`educations.${index}.startMonth`} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`endMonth-${index}`}>End Month</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id={`endMonth-${index}`}
                              className="w-full justify-between font-normal"
                            >
                              {education.endMonth ? education.endMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : "Select end month"}
                              <CalendarIcon />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={education.endMonth}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                handleEducationChange(index, "endMonth", date)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <VerificationCheckbox fieldPath={`educations.${index}.endMonth`} />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`isTopper-${index}`}
                            checked={education.isTopper}
                            onCheckedChange={(checked) => handleEducationChange(index, "isTopper", !!checked)}
                          />
                          <Label htmlFor={`isTopper-${index}`} className="text-sm font-normal">
                            Topper
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`isCheetah-${index}`}
                            checked={education.isCheetah}
                            onCheckedChange={(checked) => handleEducationChange(index, "isCheetah", !!checked)}
                          />
                          <Label htmlFor={`isCheetah-${index}`} className="text-sm font-normal">
                            Cheetah
                          </Label>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor={`grades-${index}`}>Grades</Label>
                        <Input
                          id={`grades-${index}`}
                          type="text"
                          placeholder="GPA 3.8 / 4.0 or First Class"
                          value={education.grades}
                          onChange={(e) => handleEducationChange(index, "grades", e.target.value)}
                        />
                        <VerificationCheckbox fieldPath={`educations.${index}.grades`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.educations.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No education added yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEducation}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Education
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          </div>
          {/* Section 6: Certifications (Collapsible) */}
          <div id="certifications">
          <Collapsible open={certificationsOpen} onOpenChange={setCertificationsOpen}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-lg font-medium">Certifications</span>
                    {formData.certifications.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {formData.certifications.length}
                      </Badge>
                    )}
                    <SectionProgressBadge 
                      percentage={certificationsProgress.percentage}
                      verified={certificationsProgress.verified}
                      total={certificationsProgress.total}
                    />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      certificationsOpen ? "transform rotate-180" : ""
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
                    id="verify-all-certifications"
                    checked={isSectionFullyVerified('certifications')}
                    onCheckedChange={(checked) => handleVerifyAllSection('certifications', !!checked)}
                    aria-label="Verify all fields in Certifications section"
                  />
                  <Label 
                    htmlFor="verify-all-certifications"
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
                  Add professional certifications and achievements
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCertification}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Certification
                </Button>
              </div>

              {formData.certifications.map((certification, index) => (
                <Card key={certification.id} className="relative">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Certification {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertification(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`certification-${index}`}>Certification *</Label>
                          <ReusableCombobox
                            options={certificationOptions}
                            value={certification.certificationId}
                            onValueChange={(value) => handleCertificationChange(index, "certificationId", value)}
                            placeholder="Select certification..."
                            searchPlaceholder="Search certifications..."
                            className={errors.certifications?.[index]?.certificationId ? "border-red-500" : ""}
                            creatable={true}
                            createLabel="Add New Certification"
                            onCreateNew={(searchValue) => {
                              setPendingCertificationName(searchValue)
                              setPendingCertificationIndex(index)
                              setCreateCertificationDialogOpen(true)
                            }}
                          />
                          {errors.certifications?.[index]?.certificationId && (
                            <p className="text-sm text-red-500">{errors.certifications[index].certificationId}</p>
                          )}
                          <VerificationCheckbox fieldPath={`certifications.${index}.certificationName`} />
                        </div>

                      <div className="space-y-2">
                        <Label htmlFor={`issueDate-${index}`}>Issue Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id={`issueDate-${index}`}
                              className="w-full justify-between font-normal"
                            >
                              {certification.issueDate ? certification.issueDate.toLocaleDateString() : "Select issue date"}
                              <CalendarIcon />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={certification.issueDate}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                handleCertificationChange(index, "issueDate", date)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <VerificationCheckbox fieldPath={`certifications.${index}.issueDate`} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`expiryDate-${index}`}>Expiry Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id={`expiryDate-${index}`}
                              className="w-full justify-between font-normal"
                            >
                              {certification.expiryDate ? certification.expiryDate.toLocaleDateString() : "Select expiry date"}
                              <CalendarIcon />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={certification.expiryDate}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                handleCertificationChange(index, "expiryDate", date)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <VerificationCheckbox fieldPath={`certifications.${index}.expiryDate`} />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`certificationUrl-${index}`}>Certification URL</Label>
                        <Input
                          id={`certificationUrl-${index}`}
                          type="url"
                          placeholder="https://www.credly.com/badges/..."
                          value={certification.certificationUrl}
                          onChange={(e) => handleCertificationChange(index, "certificationUrl", e.target.value)}
                          className={errors.certifications?.[index]?.certificationUrl ? "border-red-500" : ""}
                        />
                        {errors.certifications?.[index]?.certificationUrl && (
                          <p className="text-sm text-red-500">{errors.certifications[index].certificationUrl}</p>
                        )}
                        <VerificationCheckbox fieldPath={`certifications.${index}.certificationUrl`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.certifications.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No certifications added yet</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCertification}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Certification
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
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
              disabled={isLoading}
              className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getSubmitButtonText(isLoading)}
            </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close? All changes will be lost.
              {showVerification && verifiedFields.size > 0 && (
                <span className="block mt-2 font-medium text-yellow-600 dark:text-yellow-400">
                  {verifiedFields.size} field(s) marked for verification will not be saved.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose} className="cursor-pointer">
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Employer Dialog */}
      <EmployerCreationDialog
        mode="create"
        open={createEmployerDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleEmployerCreationCancel()
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
            handleProjectCreationCancel()
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
            handleUniversityCreationCancel()
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
            handleCertificationCreationCancel()
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
