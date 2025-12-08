"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2, Plus, User, Briefcase, Trash2, ChevronDown, Award, GraduationCap, Check, ChevronsUpDown, X, FolderOpen } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Candidate } from "@/lib/types/candidate"

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

export interface WorkExperience {
  id: string
  employerName: string
  jobTitle: string
  projects: ProjectExperience[]
  startDate: Date | undefined
  endDate: Date | undefined
  techStacks: string[]
  shiftType: ShiftType | ""
  workMode: WorkMode | ""
  timeSupportZones: string[]
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

// Sample data for dropdowns
const employerOptions: ComboboxOption[] = extractUniqueEmployers()

// Convert sample projects to combobox options
const projectOptions: ComboboxOption[] = sampleProjects.map(project => ({
  label: project.projectName,
  value: project.projectName
}))

// Extract unique tech stacks from sample candidates (case-insensitive deduplication)
const extractUniqueTechStacks = (): MultiSelectOption[] => {
  const techStacksMap = new Map<string, string>() // Map<lowercase, original>
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.techStacks.forEach(tech => {
        const lowerTech = tech.toLowerCase().trim()
        if (lowerTech && !techStacksMap.has(lowerTech)) {
          // Store the first occurrence (preserving original casing)
          techStacksMap.set(lowerTech, tech.trim())
        }
      })
    })
  })
  return Array.from(techStacksMap.values()).sort().map(tech => ({
    label: tech,
    value: tech
  }))
}

const techStackOptions: MultiSelectOption[] = extractUniqueTechStacks()

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
/*
const timeSupportZoneOptions: ComboboxOption[] = [
  { label: "US", value: "US" },
  { label: "UK", value: "UK" },
  { label: "EU", value: "EU" },
  { label: "APAC", value: "APAC" },
  { label: "MEA", value: "MEA" },
]
*/
// Convert sample certifications to combobox options
const certificationOptions: ComboboxOption[] = sampleCertifications.map(cert => ({
  label: cert.certificationName,
  value: cert.id
}))

// Convert university locations to combobox options
const universityLocationOptions: ComboboxOption[] = sampleUniversities.flatMap(university =>
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

const degreeOptions: ComboboxOption[] = extractUniqueDegreeNames()

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

const majorOptions: ComboboxOption[] = extractUniqueMajorNames()

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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Handle wheel and touch events to enable scrolling
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
  }, [])
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type DialogMode = "create" | "edit"

interface CandidateCreationDialogProps {
  children?: React.ReactNode
  mode?: DialogMode
  candidateData?: Candidate
  onSubmit?: (data: CandidateFormData) => Promise<void> | void
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
  shiftType: "",
  workMode: "",
  timeSupportZones: [],
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
}

// Convert Candidate to CandidateFormData for edit mode
const candidateToFormData = (candidate: Candidate): CandidateFormData => {
  return {
    name: candidate.name || "",
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
      shiftType: (we.shiftType || "") as ShiftType | "",
      workMode: (we.workMode || "") as WorkMode | "",
      timeSupportZones: we.timeSupportZones || [],
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
  }
}

export function CandidateCreationDialog({
  children,
  mode = "create",
  candidateData,
  onSubmit,
  onOpenChange,
  open: controlledOpen,
}: CandidateCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CandidateFormData>(() => {
    if (mode === "edit" && candidateData) {
      return candidateToFormData(candidateData)
    }
    return initialFormData
  })
  const [workExperienceOpen, setWorkExperienceOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [certificationsOpen, setCertificationsOpen] = useState(false)
  const [educationOpen, setEducationOpen] = useState(false)
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
  }>({})

  const handleInputChange = (field: keyof Omit<CandidateFormData, 'workExperiences' | 'certifications' | 'educations'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors.basic?.[field]) {
      setErrors(prev => ({ 
        ...prev, 
        basic: { ...prev.basic, [field]: undefined }
      }))
    }
  }

  const handleWorkExperienceChange = (
    index: number, 
    field: keyof Omit<WorkExperience, 'projects'>, 
    value: string | string[] | Date | undefined
  ) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
    
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
      await onSubmit?.(formData)
      resetForm()
      setOpen(false)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setErrors({})
    setWorkExperienceOpen(false)
    setProjectsOpen(false)
    setCertificationsOpen(false)
    setEducationOpen(false)
    setOpen(false)
  }

  // Update form data when candidateData changes (for edit mode)
  React.useEffect(() => {
    if (mode === "edit" && candidateData && open) {
      setFormData(candidateToFormData(candidateData))
      setErrors({})
    } else if (mode === "create" && open) {
      setFormData(initialFormData)
      setErrors({})
    }
  }, [mode, candidateData, open])

  const resetForm = () => {
    if (mode === "edit" && candidateData) {
      setFormData(candidateToFormData(candidateData))
    } else {
      setFormData(initialFormData)
    }
    setErrors({})
    setWorkExperienceOpen(false)
    setProjectsOpen(false)
    setCertificationsOpen(false)
    setEducationOpen(false)
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
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-border">
          <DialogTitle>{mode === "edit" ? "Update Candidate" : "Create New Candidate"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Basic Information
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
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Work Experience (Collapsible) */}
          <Collapsible open={workExperienceOpen} onOpenChange={setWorkExperienceOpen}>
            <CollapsibleTrigger asChild>
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
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    workExperienceOpen ? "transform rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
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
                      />
                      {errors.workExperiences?.[index]?.employerName && (
                        <p className="text-sm text-red-500">{errors.workExperiences[index].employerName}</p>
                      )}
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
                      />
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
                    </div>
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
                                />
                                {errors.workExperiences?.[index]?.projects?.[projectIndex]?.projectName && (
                                  <p className="text-sm text-red-500">{errors.workExperiences[index].projects![projectIndex].projectName}</p>
                                )}
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

          {/* Section 3: Standalone Projects (Collapsible) */}
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <CollapsibleTrigger asChild>
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
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    projectsOpen ? "transform rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
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
                      />
                      {errors.projects?.[index]?.projectName && (
                        <p className="text-sm text-red-500">{errors.projects[index].projectName}</p>
                      )}
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

          {/* Section 4: Education (Collapsible) */}
          <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
            <CollapsibleTrigger asChild>
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
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    educationOpen ? "transform rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
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
                          />
                          {errors.educations?.[index]?.universityLocationId && (
                            <p className="text-sm text-red-500">{errors.educations[index].universityLocationId}</p>
                          )}
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
                          />
                          {errors.educations?.[index]?.degreeName && (
                            <p className="text-sm text-red-500">{errors.educations[index].degreeName}</p>
                          )}
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
                          />
                          {errors.educations?.[index]?.majorName && (
                            <p className="text-sm text-red-500">{errors.educations[index].majorName}</p>
                          )}
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

          {/* Section 5: Certifications (Collapsible) */}
          <Collapsible open={certificationsOpen} onOpenChange={setCertificationsOpen}>
            <CollapsibleTrigger asChild>
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
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    certificationsOpen ? "transform rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
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
                          />
                          {errors.certifications?.[index]?.certificationId && (
                            <p className="text-sm text-red-500">{errors.certifications[index].certificationId}</p>
                          )}
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
              {isLoading 
                ? (mode === "edit" ? "Updating..." : "Creating...") 
                : (mode === "edit" ? "Update Candidate" : "Create Candidate")}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
