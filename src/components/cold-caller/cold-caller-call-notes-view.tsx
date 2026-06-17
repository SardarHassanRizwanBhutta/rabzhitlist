"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { EmptyField, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import { COLD_CALLER_SECTION_ICONS } from "./cold-caller-section-icons"
import { CallNotesWorkspace } from "./call-notes-workspace"

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
  groupedFields: Map<FieldSection, EmptyField[]>
  sectionsWithFields: FieldSection[]
  rawNotesDraft: string
  onDraftChange: (draft: string) => void
  showDraftSavedHint: boolean
  questions: GeneratedQuestion[]
  isLoadingQuestions: boolean
  questionsError: string | null
  onRetryGenerateQuestions?: () => void
  /** Phase 2+: wired to create cold-call session API */
  onAnalyzeNotes?: (rawNotes: string) => void | Promise<void>
  isAnalyzing?: boolean
}

function getSectionQuestionCount(
  section: FieldSection,
  questions: GeneratedQuestion[],
  emptyFields: EmptyField[],
): number {
  const apiNames = new Set(
    emptyFields.filter((f) => f.section === section).map((f) => f.apiFieldName),
  )
  return questions.filter((q) => apiNames.has(q.field)).length
}

export function ColdCallerCallNotesView({
  candidateId,
  hasResume,
  resumeFileName,
  resumeContentType,
  resumeVisible,
  onResumeVisibleChange,
  emptyFields,
  groupedFields,
  sectionsWithFields,
  rawNotesDraft,
  onDraftChange,
  showDraftSavedHint,
  questions,
  isLoadingQuestions,
  questionsError,
  onRetryGenerateQuestions,
  onAnalyzeNotes,
  isAnalyzing = false,
}: ColdCallerCallNotesViewProps) {
  const [activeTab, setActiveTab] = useState<FieldSection | null>(null)
  const [activeQuestionField, setActiveQuestionField] = useState<string | null>(null)

  useEffect(() => {
    if (sectionsWithFields.length === 0) {
      setActiveTab(null)
      return
    }
    if (!activeTab || !sectionsWithFields.includes(activeTab)) {
      setActiveTab(sectionsWithFields[0])
    }
  }, [sectionsWithFields, activeTab])

  const handleQuestionSelect = useCallback((apiFieldName: string) => {
    setActiveQuestionField(apiFieldName)
  }, [])

  const handleAnalyze = useCallback(async () => {
    const trimmed = rawNotesDraft.trim()
    if (!trimmed) {
      toast.error("Enter call notes before analyzing.")
      return
    }

    if (onAnalyzeNotes) {
      try {
        await onAnalyzeNotes(trimmed)
      } catch {
        toast.error("Failed to submit notes for analysis.")
      }
      return
    }

    toast.info("Note analysis will be available once the backend session API is connected.")
  }, [rawNotesDraft, onAnalyzeNotes])

  const tabBadges = useMemo(() => {
    const map = new Map<FieldSection, { questionCount: number; fieldCount: number }>()
    sectionsWithFields.forEach((section) => {
      const fields = groupedFields.get(section) ?? []
      map.set(section, {
        fieldCount: fields.length,
        questionCount: getSectionQuestionCount(section, questions, emptyFields),
      })
    })
    return map
  }, [sectionsWithFields, groupedFields, questions, emptyFields])

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
    onAnalyze: handleAnalyze,
    isAnalyzing,
    questions,
    isLoadingQuestions,
    questionsError,
    emptyFields,
    activeQuestionField,
    onQuestionSelect: handleQuestionSelect,
    onRetryGenerateQuestions,
  }

  if (sectionsWithFields.length === 0) {
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
          {sectionsWithFields.map((section) => {
            const SectionIcon = COLD_CALLER_SECTION_ICONS[section]
            const badge = tabBadges.get(section)
            const fieldCount = badge?.fieldCount ?? 0
            const questionCount = badge?.questionCount ?? 0
            const hasQuestions = questionCount > 0

            return (
              <TabsTrigger key={section} value={section} className={TAB_TRIGGER_CLASS}>
                <SectionIcon className="h-4 w-4" />
                <span>{SECTION_LABELS[section]}</span>
                {fieldCount > 0 && (
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
                )}
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
