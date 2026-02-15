"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { 
  Phone, 
  User, 
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
  Code,
  CheckCircle,
  Sparkles,
  Check,
  Loader2,
  Circle,
  ChevronRight,
  FolderOpen,
  Plus,
  MessageSquare,
  MessageCircle,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { getVerificationsForCandidate } from "@/lib/sample-data/verification"
import type { VerificationStatus } from "@/lib/types/verification"

import type { Candidate } from "@/lib/types/candidate"
import type { 
  EmptyField, 
  GeneratedQuestion, 
  FieldSection, 
  FieldStatus,
  FieldState,
  InteractionMode
} from "@/types/cold-caller"
import { SECTION_LABELS, MODE_CONFIG } from "@/types/cold-caller"
import { 
  getEmptyFields, 
  groupEmptyFieldsBySection, 
  getApiFieldNames,
  createEntryFields,
  createProjectFields,
} from "@/lib/utils/empty-field-detection"
import { generateQuestions } from "@/lib/services/questions-api"
import { QuestionFieldCard } from "./question-field-card"
import { ProjectCreationDialog, ProjectFormData } from "@/components/project-creation-dialog"
import { EmployerCreationDialog, EmployerFormData } from "@/components/employer-creation-dialog"
import { UniversityCreationDialog, UniversityFormData } from "@/components/university-creation-dialog"
import { CertificationCreationDialog, CertificationFormData } from "@/components/certification-creation-dialog"

// Section icons mapping
const SECTION_ICONS: Record<FieldSection, React.ElementType> = {
  basic: User,
  workExperience: Briefcase,
  education: GraduationCap,
  certifications: Award,
  achievements: Trophy,
  techStacks: Code,
  projects: FolderOpen,
}

interface ColdCallerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: Candidate
  onSaveField: (fieldPath: string, value: unknown, verified?: boolean) => Promise<void>
  mode?: InteractionMode
}

// Mode icon mapping
const MODE_ICONS: Record<InteractionMode, React.ElementType> = {
  coldCaller: Phone,
  interviewer: MessageSquare,
  l1: MessageCircle,
  l2: Users,
}

export function ColdCallerDialog({
  open,
  onOpenChange,
  candidate,
  onSaveField,
  mode = 'coldCaller',
}: ColdCallerDialogProps) {
  // Field states
  const [fieldStates, setFieldStates] = useState<Map<string, FieldState>>(new Map())
  // const [editedValues, setEditedValues] = useState<Map<string, any>>(new Map())
  
  // Verification state - track which fields are verified
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set())
  
  // Questions state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [questionsMap, setQuestionsMap] = useState<Map<string, GeneratedQuestion>>(new Map())
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState<FieldSection | null>(null)
  const [activeFieldPath, setActiveFieldPath] = useState<string | null>(null)
  
  // Track manually added entries for dynamic sections
  const [manuallyAddedFields, setManuallyAddedFields] = useState<EmptyField[]>([])
  
  // Creation dialog state
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false)
  const [createEmployerDialogOpen, setCreateEmployerDialogOpen] = useState(false)
  const [createUniversityDialogOpen, setCreateUniversityDialogOpen] = useState(false)
  const [createCertificationDialogOpen, setCreateCertificationDialogOpen] = useState(false)
  
  // Pending entity creation state
  const [pendingEntity, setPendingEntity] = useState<{
    type: 'project' | 'employer' | 'university' | 'certification'
    field: EmptyField
    searchValue: string
  } | null>(null)
  
  // Refs for field cards (for scroll navigation)
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Get empty fields - combine initial empty fields with manually added ones
  const baseEmptyFields = useMemo(() => getEmptyFields(candidate), [candidate])
  const emptyFields = useMemo(() => {
    // Combine base fields with manually added fields
    const allFields = [...baseEmptyFields, ...manuallyAddedFields]
    // Remove duplicates based on fieldPath
    const uniqueFields = Array.from(
      new Map(allFields.map(field => [field.fieldPath, field])).values()
    )
    return uniqueFields
  }, [baseEmptyFields, manuallyAddedFields])
  const groupedFields = useMemo(() => groupEmptyFieldsBySection(emptyFields), [emptyFields])
  
  // Get sections that have empty fields OR have data (for dynamic sections to allow adding entries)
  const sectionsWithFields = useMemo(() => {
    const dynamicSections: FieldSection[] = ['workExperience', 'education', 'certifications', 'achievements', 'projects']
    const sectionsWithEmptyFields = Array.from(groupedFields.keys()).filter(section => {
      const fields = groupedFields.get(section)
      return fields && fields.length > 0
    })
    
    // Also include dynamic sections that have data but no empty fields (to allow adding new entries)
    const sectionsWithData: FieldSection[] = []
    dynamicSections.forEach(section => {
      if (section === 'workExperience' && (candidate.workExperiences?.length || 0) > 0) {
        sectionsWithData.push(section)
      } else if (section === 'education' && (candidate.educations?.length || 0) > 0) {
        sectionsWithData.push(section)
      } else if (section === 'certifications' && (candidate.certifications?.length || 0) > 0) {
        sectionsWithData.push(section)
      } else if (section === 'achievements' && (candidate.achievements?.length || 0) > 0) {
        sectionsWithData.push(section)
      } else if (section === 'projects' && (candidate.projects?.length || 0) > 0) {
        sectionsWithData.push(section)
      }
    })
    
    // Combine and remove duplicates
    const allSections = new Set([...sectionsWithEmptyFields, ...sectionsWithData])
    return Array.from(allSections)
  }, [groupedFields, candidate])
  
  // Calculate progress stats
  const stats = useMemo(() => {
    let answered = 0
    let pending = 0

    emptyFields.forEach(field => {
      const state = fieldStates.get(field.fieldPath)
      switch (state?.status) {
        case 'answered': answered++; break
        default: pending++
      }
    })

    return { answered, pending, total: emptyFields.length }
  }, [emptyFields, fieldStates])

  const progressPercentage = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 100

  // Track previous candidate ID and dialog open state to detect changes
  const prevCandidateIdRef = React.useRef<string | undefined>(undefined)
  const prevOpenRef = React.useRef<boolean>(false)
  
  // Initialize state when dialog opens or candidate changes
  useEffect(() => {
    const dialogJustOpened = open && !prevOpenRef.current
    const candidateChanged = prevCandidateIdRef.current !== candidate.id
    
    if (open) {
      // Only reset state if dialog just opened or candidate changed
      if (dialogJustOpened || candidateChanged) {
        // Reset manually added fields when dialog opens or candidate changes
        setManuallyAddedFields([])
        
        // Initialize field states using baseEmptyFields (before manually added fields)
        const initialStates = new Map<string, FieldState>()
        baseEmptyFields.forEach(field => {
          initialStates.set(field.fieldPath, {
            field,
            status: 'pending',
            value: field.currentValue,
            question: undefined,
          })
        })
        setFieldStates(initialStates)
        // setEditedValues(new Map())
        
        // Initialize verification state from existing verifications
        if (candidateChanged) {
          const verifications = getVerificationsForCandidate(candidate.id)
          const verifiedSet = new Set<string>()
          verifications.forEach(verif => {
            if (verif.status === 'verified' && verif.fieldPath) {
              verifiedSet.add(verif.fieldPath)
            }
          })
          setVerifiedFields(verifiedSet)
        }
        
        // Only reset questions if candidate changed
        if (candidateChanged) {
          setQuestions([])
          setQuestionsMap(new Map())
          setQuestionsError(null)
        }
        
        // Update references
        prevCandidateIdRef.current = candidate.id
        prevOpenRef.current = true
        
        // Auto-select first section with fields
        if (sectionsWithFields.length > 0 && !activeTab) {
          setActiveTab(sectionsWithFields[0])
        }
      }
      // When dialog is already open and candidate hasn't changed, preserve all state
      // No need to do anything - state is already preserved
    } else {
      // Dialog closed - reset references
      prevOpenRef.current = false
      // Don't reset candidate ID ref here - keep it to detect candidate changes
    }
  }, [open, candidate.id, baseEmptyFields, sectionsWithFields, activeTab]) // Use baseEmptyFields instead of emptyFields to avoid circular dependency
  
  // Separate effect to initialize field states for newly added manual fields
  useEffect(() => {
    if (open && manuallyAddedFields.length > 0) {
      setFieldStates(prev => {
        const next = new Map(prev)
        manuallyAddedFields.forEach(field => {
          // Only add if not already present
          if (!next.has(field.fieldPath)) {
            next.set(field.fieldPath, {
              field,
              status: 'pending',
              value: field.currentValue,
              question: undefined,
            })
          }
        })
        return next
      })
    }
  }, [open, manuallyAddedFields])
  
  // Separate effect to update questions in field states when questions are generated
  useEffect(() => {
    if (open && questionsMap.size > 0) {
      setFieldStates(prev => {
        const next = new Map(prev)
        emptyFields.forEach(field => {
          const existing = next.get(field.fieldPath)
          if (existing) {
            const question = questionsMap.get(field.apiFieldName)
            if (question && !existing.question) {
              next.set(field.fieldPath, { ...existing, question })
            }
          }
        })
        return next
      })
    }
  }, [open, questionsMap, emptyFields])
  
  // Handle active tab selection and validation
  useEffect(() => {
    if (open && sectionsWithFields.length > 0) {
      if (!activeTab) {
        // No active tab, select first available
        setActiveTab(sectionsWithFields[0])
      } else {
        // Check if current tab still has fields
        const hasFields = sectionsWithFields.includes(activeTab)
        if (!hasFields) {
          // Current tab has no fields, switch to first available
          setActiveTab(sectionsWithFields[0])
        }
      }
    }
  }, [open, activeTab, sectionsWithFields])

  // Handle field value change
  const handleFieldChange = useCallback((fieldPath: string, value: unknown) => {
    
    // Update field state value
    setFieldStates(prev => {
      const next = new Map(prev)
      const existing = next.get(fieldPath)
      if (existing) {
        next.set(fieldPath, { ...existing, value })
      }
      return next
    })
  }, [])

  // Handle field save
  const handleFieldSave = useCallback(async (fieldPath: string, value: unknown, verified?: boolean) => {
    await onSaveField(fieldPath, value, verified)

    setFieldStates(prev => {
      const next = new Map(prev)
      const existing = next.get(fieldPath)
      if (existing) {
        next.set(fieldPath, {
          ...existing,
          value,
          status: 'answered',
        })
      }
      return next
    })
    
    // Update verification state
    if (verified !== undefined) {
      setVerifiedFields(prev => {
        const next = new Set(prev)
        if (verified) {
          next.add(fieldPath)
        } else {
          next.delete(fieldPath)
        }
        return next
      })
    }
  },
  [onSaveField])

  // Handle status change
  const handleStatusChange = useCallback((fieldPath: string, status: FieldStatus, note?: string) => {
    setFieldStates(prev => {
      const next = new Map(prev)
      const existing = next.get(fieldPath)
      if (existing) {
        next.set(fieldPath, { ...existing, status, note })
      }
      return next
    })
  }, [])

  // Handle verification toggle
  const handleVerificationToggle = useCallback((fieldPath: string, verified: boolean) => {
    setVerifiedFields(prev => {
      const next = new Set(prev)
      if (verified) {
        next.add(fieldPath)
      } else {
        next.delete(fieldPath)
      }
      return next
    })
  }, [])

  // Get field verification status
  const getFieldVerification = useCallback((fieldPath: string): VerificationStatus => {
    return verifiedFields.has(fieldPath) ? 'verified' : 'unverified'
  }, [verifiedFields])

  // Scroll to field and focus input
  const scrollToField = useCallback((fieldPath: string) => {
    setActiveFieldPath(fieldPath)
    const element = fieldRefs.current.get(fieldPath)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Focus the input after scroll animation
      setTimeout(() => {
        const input = element.querySelector('input, textarea, select, [role="combobox"]')
        if (input instanceof HTMLElement) {
          input.focus()
        }
      }, 300)
    }
  }, [])

  // Get mode configuration
  const modeConfig = MODE_CONFIG[mode]
  const ModeIcon = MODE_ICONS[mode]

  // Generate questions
  const handleGenerateQuestions = useCallback(async () => {
    setIsLoadingQuestions(true)
    setQuestionsError(null)
    
    try {
      const apiFieldNames = getApiFieldNames(emptyFields)
      const response = await generateQuestions(candidate.id, apiFieldNames, candidate)
      setQuestions(response.questions)
      
      // Build questions map for O(1) lookup
      const qMap = new Map<string, GeneratedQuestion>()
      response.questions.forEach(q => {
        qMap.set(q.field, q)
      })
      setQuestionsMap(qMap)
      
      // Update field states with linked questions
      setFieldStates(prev => {
        const next = new Map(prev)
        emptyFields.forEach(field => {
          const existing = next.get(field.fieldPath)
          const question = qMap.get(field.apiFieldName)
          if (existing) {
            next.set(field.fieldPath, { ...existing, question })
          }
        })
        return next
      })
      
      toast.success(`Generated ${response.total_questions} questions`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate questions'
      setQuestionsError(message)
      toast.error(message)
    } finally {
      setIsLoadingQuestions(false)
    }
  }, [candidate, emptyFields, mode])

  // Check if all fields are complete
  const allFieldsComplete = emptyFields.length === 0

  // Helper to group fields by entry index within a section
  // For work experience, also separates work experience fields from project fields
  const groupFieldsByEntry = useCallback((fields: EmptyField[], section: FieldSection): Map<number, EmptyField[] | {
    workExperienceFields: EmptyField[]
    projects: Map<number, EmptyField[]>
  }> => {
    const grouped = new Map<number, EmptyField[] | {
      workExperienceFields: EmptyField[]
      projects: Map<number, EmptyField[]>
    }>()
    
    // Special handling for work experience with nested projects
    if (section === 'workExperience') {
      fields.forEach(field => {
        // Check if it's a project field: workExperiences[X].projects[Y].fieldName
        const projectMatch = field.fieldPath.match(/workExperiences\[(\d+)\]\.projects\[(\d+)\]/)
        
        if (projectMatch) {
          const workExpIndex = parseInt(projectMatch[1], 10)
          const projectIndex = parseInt(projectMatch[2], 10)
          
          if (!grouped.has(workExpIndex)) {
            grouped.set(workExpIndex, {
              workExperienceFields: [],
              projects: new Map()
            })
          }
          
          const entry = grouped.get(workExpIndex) as {
            workExperienceFields: EmptyField[]
            projects: Map<number, EmptyField[]>
          }
          if (!entry.projects.has(projectIndex)) {
            entry.projects.set(projectIndex, [])
          }
          entry.projects.get(projectIndex)!.push(field)
        } else {
          // Regular work experience field: workExperiences[X].fieldName
          const match = field.fieldPath.match(/workExperiences\[(\d+)\]/)
          if (match) {
            const index = parseInt(match[1], 10)
            if (!grouped.has(index)) {
              grouped.set(index, {
                workExperienceFields: [],
                projects: new Map()
              })
            }
            const entry = grouped.get(index) as {
              workExperienceFields: EmptyField[]
              projects: Map<number, EmptyField[]>
            }
            entry.workExperienceFields.push(field)
          } else {
            // Fields without index go to index -1
            if (!grouped.has(-1)) {
              grouped.set(-1, {
                workExperienceFields: [],
                projects: new Map()
              })
            }
            const entry = grouped.get(-1) as {
              workExperienceFields: EmptyField[]
              projects: Map<number, EmptyField[]>
            }
            entry.workExperienceFields.push(field)
          }
        }
      })
    } else {
      // For other sections, use simple grouping
      fields.forEach(field => {
        const match = field.fieldPath.match(/\[(\d+)\]/)
        if (match) {
          const index = parseInt(match[1], 10)
          const existing = (grouped.get(index) as EmptyField[]) || []
          existing.push(field)
          grouped.set(index, existing)
        } else {
          const existing = (grouped.get(-1) as EmptyField[]) || []
          existing.push(field)
          grouped.set(-1, existing)
        }
      })
    }
    
    return grouped
  }, [])

  // Handle adding a new entry to a dynamic section
  const handleAddEntry = useCallback((section: FieldSection) => {
    // Only allow adding entries to dynamic sections
    const dynamicSections: ('workExperience' | 'education' | 'certifications' | 'achievements' | 'projects')[] = 
      ['workExperience', 'education', 'certifications', 'achievements', 'projects']
    if (!dynamicSections.includes(section as typeof dynamicSections[number])) {
      toast.error(`Cannot add entries to ${SECTION_LABELS[section]}`)
      return
    }

    // Type assertion: section is guaranteed to be one of the valid types after the check above
    const validSection = section as 'workExperience' | 'education' | 'certifications' | 'achievements' | 'projects'

    // Get current fields for this section
    const currentFields = groupedFields.get(section) || []
    
    // Find the maximum index in current fields
    let maxIndex = -1
    currentFields.forEach(field => {
      const match = field.fieldPath.match(/\[(\d+)\]/)
      if (match) {
        const idx = parseInt(match[1], 10)
        maxIndex = Math.max(maxIndex, idx)
      }
    })
    
    // Also check candidate data to find the actual max index
    let candidateMaxIndex = -1
    switch (section) {
      case 'workExperience':
        candidateMaxIndex = (candidate.workExperiences?.length || 0) - 1
        break
      case 'education':
        candidateMaxIndex = (candidate.educations?.length || 0) - 1
        break
      case 'certifications':
        candidateMaxIndex = (candidate.certifications?.length || 0) - 1
        break
      case 'achievements':
        candidateMaxIndex = (candidate.achievements?.length || 0) - 1
        break
      case 'projects':
        candidateMaxIndex = (candidate.projects?.length || 0) - 1
        break
    }
    
    // Use the maximum of both
    const newIndex = Math.max(maxIndex, candidateMaxIndex) + 1
    
    // Create new fields for this entry
    const newFields = createEntryFields(validSection, newIndex)
    
    // Add to manually added fields
    setManuallyAddedFields(prev => [...prev, ...newFields])
    
    // Initialize field states for new fields
    setFieldStates(prev => {
      const next = new Map(prev)
      newFields.forEach(field => {
        next.set(field.fieldPath, {
          field,
          status: 'pending',
          value: field.currentValue,
          question: undefined,
        })
      })
      return next
    })
    
    // Scroll to the first new field after a short delay
    setTimeout(() => {
      if (newFields.length > 0) {
        scrollToField(newFields[0].fieldPath)
      }
    }, 100)
    
    toast.success(`Added new ${SECTION_LABELS[section]} entry`)
  }, [groupedFields, candidate, scrollToField])

  // Handle adding a new project to a work experience entry
  const handleAddProject = useCallback((workExperienceIndex: number) => {
    // Get current fields for work experience section
    const currentFields = groupedFields.get('workExperience') || []
    
    // Find the maximum project index for this work experience
    let maxProjectIndex = -1
    currentFields.forEach(field => {
      const match = field.fieldPath.match(/workExperiences\[(\d+)\]\.projects\[(\d+)\]/)
      if (match) {
        const weIndex = parseInt(match[1], 10)
        const projIndex = parseInt(match[2], 10)
        if (weIndex === workExperienceIndex) {
          maxProjectIndex = Math.max(maxProjectIndex, projIndex)
        }
      }
    })
    
    // Also check candidate data
    const workExp = candidate.workExperiences?.[workExperienceIndex]
    const candidateMaxProjectIndex = (workExp?.projects?.length || 0) - 1
    
    const newProjectIndex = Math.max(maxProjectIndex, candidateMaxProjectIndex) + 1
    
    // Create new project fields
    const newFields = createProjectFields(workExperienceIndex, newProjectIndex)
    
    // Add to manually added fields
    setManuallyAddedFields(prev => [...prev, ...newFields])
    
    // Initialize field states
    setFieldStates(prev => {
      const next = new Map(prev)
      newFields.forEach(field => {
        next.set(field.fieldPath, {
          field,
          status: 'pending',
          value: field.currentValue,
          question: undefined,
        })
      })
      return next
    })
    
    // Scroll to the first new field
    setTimeout(() => {
      if (newFields.length > 0) {
        scrollToField(newFields[0].fieldPath)
      }
    }, 100)
    
    toast.success(`Added new project to ${SECTION_LABELS['workExperience']} ${workExperienceIndex + 1}`)
  }, [groupedFields, candidate, scrollToField])

  // Handle entity creation request from combobox
  const handleCreateEntity = useCallback((field: EmptyField, searchValue: string) => {
    setPendingEntity({
      type: field.onCreateEntity!,
      field,
      searchValue,
    })
    
    switch (field.onCreateEntity) {
      case 'project':
        setCreateProjectDialogOpen(true)
        break
      case 'employer':
        setCreateEmployerDialogOpen(true)
        break
      case 'university':
        setCreateUniversityDialogOpen(true)
        break
      case 'certification':
        setCreateCertificationDialogOpen(true)
        break
    }
  }, [])

  // Handle project creation success
  const handleProjectCreated = useCallback(async (projectData: ProjectFormData) => {
    if (!pendingEntity || pendingEntity.type !== 'project') return
    
    const newProjectName = projectData.projectName.trim()
    
    // Update the field value
    await handleFieldSave(pendingEntity.field.fieldPath, newProjectName, false)
    
    // Update field state
    setFieldStates(prev => {
      const next = new Map(prev)
      const existing = next.get(pendingEntity.field.fieldPath)
      if (existing) {
        next.set(pendingEntity.field.fieldPath, {
          ...existing,
          value: newProjectName,
        })
      }
      return next
    })
    
    toast.success(`Project "${newProjectName}" created successfully`)
    setCreateProjectDialogOpen(false)
    setPendingEntity(null)
  }, [pendingEntity, handleFieldSave])

  // Handle employer creation success
  const handleEmployerCreated = useCallback(async (employerData: EmployerFormData) => {
    if (!pendingEntity || pendingEntity.type !== 'employer') return
    
    const newEmployerName = employerData.name.trim()
    
    // Update the field value
    await handleFieldSave(pendingEntity.field.fieldPath, newEmployerName, false)
    
    // Update field state
    setFieldStates(prev => {
      const next = new Map(prev)
      const existing = next.get(pendingEntity.field.fieldPath)
      if (existing) {
        next.set(pendingEntity.field.fieldPath, {
          ...existing,
          value: newEmployerName,
        })
      }
      return next
    })
    
    toast.success(`Employer "${newEmployerName}" created successfully`)
    setCreateEmployerDialogOpen(false)
    setPendingEntity(null)
  }, [pendingEntity, handleFieldSave])

  // Handle university creation success
  const handleUniversityCreated = useCallback(async (universityData: UniversityFormData) => {
    if (!pendingEntity || pendingEntity.type !== 'university') return
    
    const universityName = universityData.name.trim()
    
    // For universities, we need to construct the location name
    // Format: "University Name - City"
    const mainCampus = universityData.locations.find(loc => loc.isMainCampus)
    const locationToUse = mainCampus || universityData.locations[0]
    const newUniversityName = locationToUse 
      ? `${universityName} - ${locationToUse.city}`
      : universityName
    
    // Update the field value
    await handleFieldSave(pendingEntity.field.fieldPath, newUniversityName, false)
    
    // Update field state
    setFieldStates(prev => {
      const next = new Map(prev)
      const existing = next.get(pendingEntity.field.fieldPath)
      if (existing) {
        next.set(pendingEntity.field.fieldPath, {
          ...existing,
          value: newUniversityName,
        })
      }
      return next
    })
    
    toast.success(`University location "${newUniversityName}" created successfully`)
    setCreateUniversityDialogOpen(false)
    setPendingEntity(null)
  }, [pendingEntity, handleFieldSave])

  // Handle certification creation success
  const handleCertificationCreated = useCallback(async (certificationData: CertificationFormData) => {
    if (!pendingEntity || pendingEntity.type !== 'certification') return
    
    const newCertificationName = certificationData.certificationName.trim()
    
    // Update the field value
    await handleFieldSave(pendingEntity.field.fieldPath, newCertificationName, false)
    
    // Update field state
    setFieldStates(prev => {
      const next = new Map(prev)
      const existing = next.get(pendingEntity.field.fieldPath)
      if (existing) {
        next.set(pendingEntity.field.fieldPath, {
          ...existing,
          value: newCertificationName,
        })
      }
      return next
    })
    
    toast.success(`Certification "${newCertificationName}" created successfully`)
    setCreateCertificationDialogOpen(false)
    setPendingEntity(null)
  }, [pendingEntity, handleFieldSave])

  // Get section stats
  const getSectionStats = (fields: EmptyField[]) => {
    let answered = 0
    
    fields.forEach(field => {
      const state = fieldStates.get(field.fieldPath)
      if (state?.status === 'answered') answered++
    })
    
    return { answered, pending: fields.length - answered }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      // In cold-caller-dialog.tsx, line 832
      <DialogContent className="!max-w-[95vw] lg:!max-w-6xl xl:!max-w-7xl h-[95vh] overflow-hidden !flex !flex-col p-0">        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center", modeConfig.color)}>
                <ModeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold mb-1">
                  {modeConfig.label} Mode
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {candidate.name} • {candidate.mobileNo || 'No phone'}
                </p>
              </div>
            </div>
            
            <div className="mr-8">
              <Button
                size="sm"
                onClick={handleGenerateQuestions}
                disabled={isLoadingQuestions || emptyFields.length === 0}
                className="gap-1.5"
              >
                {isLoadingQuestions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Questions
              </Button>
            </div>
          </div>
          
          {/* Progress and Stats */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-green-600">
                  <Check className="h-4 w-4" />
                  {stats.answered} answered
                </span>
                <span className="text-muted-foreground">
                  {stats.pending} pending
                </span>
              </div>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </DialogHeader>

        {/* Main Content - Tabs Navigation */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {allFieldsComplete ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All Fields Complete!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                This candidate&apos;s profile is fully filled out. Great job! 🎉
              </p>
            </div>
          ) : sectionsWithFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Empty Fields</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                All fields are complete for this candidate.
              </p>
            </div>
          ) : (
            <Tabs 
              value={activeTab || undefined} 
              onValueChange={(value) => setActiveTab(value as FieldSection)}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Tabs List */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm shrink-0">
                <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {sectionsWithFields.map((section) => {
                    const SectionIcon = SECTION_ICONS[section]
                    const fields = groupedFields.get(section) || []
                    const sectionStats = getSectionStats(fields)
                    
                    return (
                      <TabsTrigger
                        key={section}
                        value={section}
                        className={cn(
                          "px-4 py-2 text-sm font-medium rounded-t transition-colors whitespace-nowrap h-12",
                          "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                          "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground",
                          "border-b-2 border-transparent",
                          "cursor-pointer flex items-center gap-2"
                        )}
                      >
                        <SectionIcon className="h-4 w-4" />
                        <span>{SECTION_LABELS[section]}</span>
                        {sectionStats.answered + sectionStats.pending > 0 && (
                          <Badge 
                            variant="default"
                            className={cn(
                              "ml-1 text-xs px-1.5 py-0.5 font-medium shrink-0",
                              sectionStats.pending === 0
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            )}
                          >
                            {sectionStats.pending === 0 ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-0.5" />
                                {sectionStats.answered}
                              </>
                            ) : (
                              `${sectionStats.answered}/${sectionStats.answered + sectionStats.pending}`
                            )}
                          </Badge>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {/* Tabs Content with Sidebar */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {sectionsWithFields.map((section) => {
                  const fields = groupedFields.get(section) || []
                  const isActive = activeTab === section
                  const sectionStats = getSectionStats(fields)
                  
                  return (
                    <TabsContent
                      key={section}
                      value={section}
                      forceMount
                      className={cn(
                        "h-full mt-0",
                        !isActive && "hidden"
                      )}
                    >
                      <div className="flex h-full">
                        {/* Sidebar - Field Navigation */}
                        <div className="w-56 shrink-0 border-r border-border bg-muted/30 overflow-y-auto">
                          {/* Sidebar Header */}
                          <div className="p-3 border-b border-border sticky top-0 bg-muted/50 backdrop-blur z-10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Fields
                              </span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  sectionStats.pending === 0 && "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                )}
                              >
                                {sectionStats.answered}/{sectionStats.answered + sectionStats.pending}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Field List */}
                          <div className="p-2 space-y-1">
                            {fields.map((field) => {
                              const state = fieldStates.get(field.fieldPath)
                              const isFieldActive = activeFieldPath === field.fieldPath
                              const isAnswered = state?.status === 'answered'
                              
                              return (
                                <button
                                  key={field.fieldPath}
                                  onClick={() => scrollToField(field.fieldPath)}
                                  className={cn(
                                    "w-full flex items-start gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors",
                                    isFieldActive && "bg-primary text-primary-foreground",
                                    !isFieldActive && isAnswered && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                    !isFieldActive && !isAnswered && "hover:bg-muted text-foreground"
                                  )}
                                >
                                  {/* Status Icon */}
                                  <span className="shrink-0 mt-0.5">
                                    {isAnswered ? (
                                      <Check className="h-4 w-4" />
                                    ) : isFieldActive ? (
                                      <ChevronRight className="h-4 w-4" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground/50" />
                                    )}
                                  </span>
                                  {/* Field Label with Context */}
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-medium">{field.fieldLabel}</span>
                                      {verifiedFields.has(field.fieldPath) && (
                                        <VerificationBadge 
                                          status="verified" 
                                          size="sm" 
                                          showTooltip={false}
                                          className="shrink-0"
                                        />
                                      )}
                                    </div>
                                    {field.context && (
                                      <span className={cn(
                                        "text-xs truncate",
                                        isFieldActive ? "text-primary-foreground/70" : "text-muted-foreground"
                                      )}>
                                        {field.context}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        
                        {/* Main Content - Field Cards */}
                        <div className="flex-1 overflow-y-auto overscroll-contain p-6">
                          {(() => {
                            // Group fields by entry index for dynamic sections
                            const dynamicSections: FieldSection[] = ['workExperience', 'education', 'certifications', 'achievements', 'projects']
                            const isDynamicSection = dynamicSections.includes(section)
                            
                            if (isDynamicSection) {
                              // Group fields by entry index
                              const entryGroups = groupFieldsByEntry(fields, section)
                              const entryIndices = Array.from(entryGroups.keys()).sort((a, b) => a - b)
                              
                              // Special handling for work experience with nested projects
                              if (section === 'workExperience') {
                                return (
                                  <div className="space-y-6">
                                    {entryIndices.map((entryIndex) => {
                                      const entry = entryGroups.get(entryIndex)
                                      if (!entry || entryIndex < 0) return null
                                      
                                      const workExpEntry = entry as {
                                        workExperienceFields: EmptyField[]
                                        projects: Map<number, EmptyField[]>
                                      }
                                      const workExpFields = workExpEntry.workExperienceFields
                                      const projects = workExpEntry.projects
                                      const projectIndices = Array.from(projects.keys()).sort((a, b) => a - b)
                                      const workExpStats = getSectionStats(workExpFields)
                                      
                                      return (
                                        <div key={entryIndex} className="space-y-4">
                                          {/* Work Experience Header */}
                                          <div className="flex items-center justify-between pb-2 border-b border-border">
                                            <div className="flex items-center gap-3">
                                              <h4 className="text-sm font-semibold text-foreground">
                                                {SECTION_LABELS[section]} {entryIndex + 1}
                                              </h4>
                                              <Badge variant="outline" className="text-xs">
                                                {workExpStats.answered}/{workExpFields.length} fields
                                              </Badge>
                                            </div>
                                          </div>
                                          
                                          {/* Work Experience Fields */}
                                          <div className="space-y-4">
                                            {workExpFields.map((field) => {
                                              const state = fieldStates.get(field.fieldPath)
                                              const question = questionsMap.get(field.apiFieldName)
                                              const isFieldVerified = verifiedFields.has(field.fieldPath)
                                              
                                              return (
                                                <div
                                                  key={field.fieldPath}
                                                  ref={(el) => {
                                                    if (el) {
                                                      fieldRefs.current.set(field.fieldPath, el)
                                                    }
                                                  }}
                                                >
                                                  <QuestionFieldCard
                                                    field={field}
                                                    question={question}
                                                    status={state?.status || 'pending'}
                                                    value={state?.value ?? field.currentValue}
                                                    onValueChange={handleFieldChange}
                                                    onSave={handleFieldSave}
                                                    onStatusChange={handleStatusChange}
                                                    isVerified={isFieldVerified}
                                                    onVerificationToggle={handleVerificationToggle}
                                                    showPriority={true}
                                                    onCreateEntity={handleCreateEntity}
                                                  />
                                                </div>
                                              )
                                            })}
                                          </div>
                                          
                                          {/* Projects Section */}
                                          {projectIndices.length > 0 && (
                                            <div className="space-y-4 pl-4 border-l-2 border-muted">
                                              <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-semibold text-muted-foreground uppercase">
                                                  Projects
                                                </h5>
                                                <Badge variant="outline" className="text-xs">
                                                  {projectIndices.length} project{projectIndices.length !== 1 ? 's' : ''}
                                                </Badge>
                                              </div>
                                              
                                              {projectIndices.map((projectIndex) => {
                                                const projectFields = projects.get(projectIndex) || []
                                                return (
                                                  <div key={projectIndex} className="space-y-4">
                                                    {/* Project Header */}
                                                    <div className="flex items-center justify-between pb-1 border-b border-border/50">
                                                      <h6 className="text-xs font-medium text-muted-foreground">
                                                        Project {projectIndex + 1}
                                                      </h6>
                                                    </div>
                                                    
                                                    {/* Project Fields */}
                                                    <div className="space-y-4">
                                                      {projectFields.map((field) => {
                                                        const state = fieldStates.get(field.fieldPath)
                                                        const question = questionsMap.get(field.apiFieldName)
                                                        const isFieldVerified = verifiedFields.has(field.fieldPath)
                                                        
                                                        return (
                                                          <div
                                                            key={field.fieldPath}
                                                            ref={(el) => {
                                                              if (el) {
                                                                fieldRefs.current.set(field.fieldPath, el)
                                                              }
                                                            }}
                                                          >
                                                            <QuestionFieldCard
                                                              field={field}
                                                              question={question}
                                                              status={state?.status || 'pending'}
                                                              value={state?.value ?? field.currentValue}
                                                              onValueChange={handleFieldChange}
                                                              onSave={handleFieldSave}
                                                              onStatusChange={handleStatusChange}
                                                              isVerified={isFieldVerified}
                                                              onVerificationToggle={handleVerificationToggle}
                                                              showPriority={true}
                                                              onCreateEntity={handleCreateEntity}
                                                            />
                                                          </div>
                                                        )
                                                      })}
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                              
                                              {/* Add Project Button */}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddProject(entryIndex)}
                                                className="w-full border-dashed hover:border-solid"
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Another Project
                                              </Button>
                                            </div>
                                          )}
                                          
                                          {/* If no projects yet, show Add Project button */}
                                          {projectIndices.length === 0 && (
                                            <div className="pl-4 border-l-2 border-muted">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddProject(entryIndex)}
                                                className="w-full border-dashed hover:border-solid"
                                              >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Your First Project
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                    
                                    {/* Add Work Experience Entry Button */}
                                    <div className="pt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddEntry(section)}
                                        className="w-full border-dashed hover:border-solid"
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Another {SECTION_LABELS[section]} Entry
                                      </Button>
                                    </div>
                                  </div>
                                )
                              }
                              
                              // For other dynamic sections (education, certifications, achievements, projects)
                              return (
                                <div className="space-y-6">
                                  {entryIndices.map((entryIndex) => {
                                    const entryFields = entryGroups.get(entryIndex) as EmptyField[] || []
                                    const entryStats = getSectionStats(entryFields)
                                    
                                    return (
                                      <div key={entryIndex} className="space-y-4">
                                        {/* Entry Header - only show for actual entries (index >= 0) */}
                                        {entryIndex >= 0 && (
                                          <div className="flex items-center justify-between pb-2 border-b border-border">
                                            <div className="flex items-center gap-3">
                                              <h4 className="text-sm font-semibold text-foreground">
                                                {SECTION_LABELS[section]} {entryIndex + 1}
                                              </h4>
                                              <Badge variant="outline" className="text-xs">
                                                {entryStats.answered}/{entryFields.length} fields
                                              </Badge>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Entry Fields */}
                                        <div className="space-y-4">
                                          {entryFields.map((field) => {
                                            const state = fieldStates.get(field.fieldPath)
                                            const question = questionsMap.get(field.apiFieldName)
                                            const isFieldVerified = verifiedFields.has(field.fieldPath)
                                            
                                            return (
                                              <div
                                                key={field.fieldPath}
                                                ref={(el) => {
                                                  if (el) {
                                                    fieldRefs.current.set(field.fieldPath, el)
                                                  }
                                                }}
                                              >
                                                <QuestionFieldCard
                                                  field={field}
                                                  question={question}
                                                  status={state?.status || 'pending'}
                                                  value={state?.value ?? field.currentValue}
                                                  onValueChange={handleFieldChange}
                                                  onSave={handleFieldSave}
                                                  onStatusChange={handleStatusChange}
                                                  isVerified={isFieldVerified}
                                                  onVerificationToggle={handleVerificationToggle}
                                                  showPriority={true}
                                                  onCreateEntity={handleCreateEntity}
                                                />
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  })}
                                  
                                  {/* Add Entry Button - only for dynamic sections */}
                                  <div className="pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddEntry(section)}
                                      className="w-full border-dashed hover:border-solid"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Another {SECTION_LABELS[section]} Entry
                                    </Button>
                                  </div>
                                </div>
                              )
                            } else {
                              // Non-dynamic sections (basic, techStacks) - render fields normally
                              return (
                                <div className="space-y-4">
                                  {fields.map((field) => {
                                    const state = fieldStates.get(field.fieldPath)
                                    const question = questionsMap.get(field.apiFieldName)
                                    const isFieldVerified = verifiedFields.has(field.fieldPath)
                                    
                                    return (
                                      <div
                                        key={field.fieldPath}
                                        ref={(el) => {
                                          if (el) {
                                            fieldRefs.current.set(field.fieldPath, el)
                                          }
                                        }}
                                      >
                                        <QuestionFieldCard
                                          field={field}
                                          question={question}
                                          status={state?.status || 'pending'}
                                          value={state?.value ?? field.currentValue}
                                          onValueChange={handleFieldChange}
                                          onSave={handleFieldSave}
                                          onStatusChange={handleStatusChange}
                                          isVerified={isFieldVerified}
                                          onVerificationToggle={handleVerificationToggle}
                                          showPriority={true}
                                          onCreateEntity={handleCreateEntity}
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            }
                          })()}
                        </div>
                      </div>
                    </TabsContent>
                  )
                })}
              </div>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div className="text-sm text-muted-foreground">
            {stats.answered > 0 && (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ {stats.answered} field{stats.answered !== 1 ? 's' : ''} answered
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Creation Dialogs - Must be outside the main Dialog to work properly */}
    <ProjectCreationDialog
      mode="create"
      open={createProjectDialogOpen}
      onOpenChange={(isOpen) => {
        setCreateProjectDialogOpen(isOpen)
        if (!isOpen) {
          setPendingEntity(null)
        }
      }}
      onSubmit={handleProjectCreated}
      initialName={pendingEntity?.type === 'project' ? pendingEntity.searchValue : undefined}
    />

    <EmployerCreationDialog
      mode="create"
      open={createEmployerDialogOpen}
      onOpenChange={(isOpen) => {
        setCreateEmployerDialogOpen(isOpen)
        if (!isOpen) {
          setPendingEntity(null)
        }
      }}
      onSubmit={handleEmployerCreated}
      initialName={pendingEntity?.type === 'employer' ? pendingEntity.searchValue : undefined}
    />

    <UniversityCreationDialog
      mode="create"
      open={createUniversityDialogOpen}
      onOpenChange={(isOpen) => {
        setCreateUniversityDialogOpen(isOpen)
        if (!isOpen) {
          setPendingEntity(null)
        }
      }}
      onSubmit={handleUniversityCreated}
      initialName={pendingEntity?.type === 'university' ? pendingEntity.searchValue : undefined}
    />

    <CertificationCreationDialog
      mode="create"
      open={createCertificationDialogOpen}
      onOpenChange={(isOpen) => {
        setCreateCertificationDialogOpen(isOpen)
        if (!isOpen) {
          setPendingEntity(null)
        }
      }}
      onSubmit={handleCertificationCreated}
      initialName={pendingEntity?.type === 'certification' ? pendingEntity.searchValue : undefined}
    />
    </>
  )
}
