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
  FieldState
} from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import { 
  getEmptyFields, 
  groupEmptyFieldsBySection, 
  getApiFieldNames,
} from "@/lib/utils/empty-field-detection"
import { generateQuestions } from "@/lib/services/questions-api"
import { QuestionFieldCard } from "./question-field-card"

// Section icons mapping
const SECTION_ICONS: Record<FieldSection, React.ElementType> = {
  basic: User,
  workExperience: Briefcase,
  education: GraduationCap,
  certifications: Award,
  achievements: Trophy,
  techStacks: Code,
}

interface ColdCallerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: Candidate
  onSaveField: (fieldPath: string, value: unknown, verified?: boolean) => Promise<void>
}

export function ColdCallerDialog({
  open,
  onOpenChange,
  candidate,
  onSaveField,
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
  
  // Refs for field cards (for scroll navigation)
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Get empty fields
  const emptyFields = useMemo(() => getEmptyFields(candidate), [candidate])
  const groupedFields = useMemo(() => groupEmptyFieldsBySection(emptyFields), [emptyFields])
  
  // Get sections that have empty fields
  const sectionsWithFields = useMemo(() => {
    return Array.from(groupedFields.keys()).filter(section => {
      const fields = groupedFields.get(section)
      return fields && fields.length > 0
    })
  }, [groupedFields])
  
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
        // Initialize field states
        const initialStates = new Map<string, FieldState>()
        emptyFields.forEach(field => {
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
  }, [open, candidate.id]) // Only depend on open state and candidate ID
  
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
  }, [candidate, emptyFields])

  // Check if all fields are complete
  const allFieldsComplete = emptyFields.length === 0

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] lg:!max-w-5xl h-[95vh] overflow-hidden !flex !flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold mb-1">
                  Cold Caller Mode
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
                        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
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
                                />
                              </div>
                            )
                          })}
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
  )
}
