"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type {
  ColdCallerSectionQuestions,
  EmptyField,
  FieldSection,
  GeneratedQuestion,
} from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import {
  buildCallNotesSectionResults,
  CALL_NOTES_DISPLAY_SECTIONS,
  isPreferencesApiFieldName,
} from "@/lib/utils/preferences-section"
import { COLD_CALLER_SECTION_ICONS } from "./cold-caller-section-icons"
import { CallNotesWorkspace } from "./call-notes-workspace"
import { isSectionComplete } from "@/lib/utils/question-generation-response"
import type { CandidateCertification, CandidateEducation, WorkExperience } from "@/lib/types/candidate"

const TAB_TRIGGER_CLASS = cn(
  "px-4 py-2 text-sm font-medium rounded-t transition-colors whitespace-nowrap h-12",
  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground",
  "border-b-2 border-transparent",
  "cursor-pointer flex items-center gap-2",
)

interface ColdCallerCallNotesViewProps {
  candidateId: string
  hasResume?: boolean
  resumeFileName?: string | null
  resumeContentType?: string | null
  resumeVisible: boolean
  onResumeVisibleChange: (visible: boolean) => void
  emptyFields: EmptyField[]
  workExperiences?: WorkExperience[]
  educations?: CandidateEducation[]
  certifications?: CandidateCertification[]
  groupedFields: Map<FieldSection, EmptyField[]>
  sectionsWithFields: FieldSection[]
  rawNotesDraft: string
  onDraftChange: (draft: string) => void
  showDraftSavedHint: boolean
  questions: GeneratedQuestion[]
  questionSections: ColdCallerSectionQuestions[] | null
  isLoadingQuestions: boolean
  questionsError: string | null
  onRetryGenerateQuestions?: () => void
  onSaveNotes: () => void | Promise<void>
  isSaving?: boolean
  notesEditorDisabled?: boolean
}

function getSectionQuestionCount(
  section: FieldSection,
  questions: GeneratedQuestion[],
): number {
  if (section === "preferences") {
    return questions.filter((q) => isPreferencesApiFieldName(q.field)).length
  }
  if (section === "basic") {
    return questions.filter((q) => q.section === "basic" && !isPreferencesApiFieldName(q.field)).length
  }
  return questions.filter((q) => q.section === section).length
}

export function ColdCallerCallNotesView({
  candidateId,
  hasResume,
  resumeFileName,
  resumeContentType,
  resumeVisible,
  onResumeVisibleChange,
  emptyFields,
  workExperiences,
  educations,
  certifications,
  groupedFields,
  sectionsWithFields,
  rawNotesDraft,
  onDraftChange,
  showDraftSavedHint,
  questions,
  questionSections,
  isLoadingQuestions,
  questionsError,
  onRetryGenerateQuestions,
  onSaveNotes,
  isSaving = false,
  notesEditorDisabled = false,
}: ColdCallerCallNotesViewProps) {
  const [activeTab, setActiveTab] = useState<FieldSection | null>(null)
  const [activeQuestionField, setActiveQuestionField] = useState<string | null>(null)

  const displaySections = questionSections != null ? CALL_NOTES_DISPLAY_SECTIONS : sectionsWithFields

  const sectionResultsByField = useMemo(() => {
    if (!questionSections) return new Map<FieldSection, ColdCallerSectionQuestions>()
    return buildCallNotesSectionResults(questionSections)
  }, [questionSections])

  useEffect(() => {
    if (displaySections.length === 0) {
      setActiveTab(null)
      return
    }
    if (!activeTab || !displaySections.includes(activeTab)) {
      setActiveTab(displaySections[0])
    }
  }, [displaySections, activeTab])

  const handleQuestionSelect = useCallback((apiFieldName: string) => {
    setActiveQuestionField(apiFieldName)
  }, [])

  const handleSave = useCallback(async () => {
    const trimmed = rawNotesDraft.trim()
    if (!trimmed) {
      toast.error("Enter call notes before saving.")
      return
    }

    try {
      await onSaveNotes()
    } catch {
      // Parent shows toast with API message
    }
  }, [rawNotesDraft, onSaveNotes])

  const activeSectionResult = activeTab ? sectionResultsByField.get(activeTab) : undefined
  const activeSectionQuestions =
    questionSections != null && activeTab
      ? (activeSectionResult?.questions ?? [])
      : questions.filter((q) => {
          if (!activeTab) return true
          return q.section === activeTab
        })

  const tabBadges = useMemo(() => {
    const map = new Map<FieldSection, { questionCount: number; missingCount: number; fieldCount: number }>()
    displaySections.forEach((section) => {
      const apiResult = sectionResultsByField.get(section)
      const fields = groupedFields.get(section) ?? []
      map.set(section, {
        fieldCount: fields.length,
        questionCount: apiResult?.questions.length ?? getSectionQuestionCount(section, questions),
        missingCount: apiResult?.missingFields.length ?? fields.length,
      })
    })
    return map
  }, [displaySections, groupedFields, questions, sectionResultsByField])

  const workspaceProps = {
    candidateId,
    hasResume,
    resumeFileName,
    resumeContentType,
    resumeVisible,
    onResumeVisibleChange,
    rawNotesDraft,
    onDraftChange,
    showDraftSavedHint,
    onSave: handleSave,
    isSaving,
    notesEditorDisabled,
    questions: activeSectionQuestions,
    sectionMissingFields: activeSectionResult?.missingFields,
    sectionComplete: activeSectionResult != null && isSectionComplete(activeSectionResult),
    isLoadingQuestions,
    questionsError,
    emptyFields,
    workExperiences,
    educations,
    certifications,
    activeQuestionField,
    onQuestionSelect: handleQuestionSelect,
    onRetryGenerateQuestions,
  }

  if (displaySections.length === 0) {
    return <CallNotesWorkspace {...workspaceProps} />
  }

  return (
    <Tabs
      value={activeTab || undefined}
      onValueChange={(value) => setActiveTab(value as FieldSection)}
      className="flex-1 flex flex-col min-h-0"
    >
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm shrink-0">
        <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {displaySections.map((section) => {
            const SectionIcon = COLD_CALLER_SECTION_ICONS[section]
            const badge = tabBadges.get(section)
            const fieldCount = badge?.fieldCount ?? 0
            const questionCount = badge?.questionCount ?? 0
            const missingCount = badge?.missingCount ?? 0
            const hasQuestions = questionCount > 0
            const showApiBadge = questionSections != null

            return (
              <TabsTrigger key={section} value={section} className={TAB_TRIGGER_CLASS}>
                <SectionIcon className="h-4 w-4" />
                <span>{SECTION_LABELS[section]}</span>
                {showApiBadge ? (
                  missingCount > 0 ? (
                    <Badge variant="default" className="ml-1 text-xs px-1.5 py-0.5 font-medium shrink-0">
                      {missingCount}
                    </Badge>
                  ) : null
                ) : fieldCount > 0 ? (
                  <Badge
                    variant="default"
                    className={cn(
                      "ml-1 text-xs px-1.5 py-0.5 font-medium shrink-0",
                      hasQuestions
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white",
                    )}
                  >
                    {hasQuestions ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-0.5" />
                        {questionCount}
                      </>
                    ) : (
                      fieldCount
                    )}
                  </Badge>
                ) : null}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <CallNotesWorkspace
          {...workspaceProps}
          section={activeTab ?? undefined}
        />
      </div>
    </Tabs>
  )
}
