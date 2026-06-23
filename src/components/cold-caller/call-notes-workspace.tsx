"use client"

import { cn } from "@/lib/utils"
import { useResizableSplit } from "@/hooks/useResizableSplit"
import { CallNotesResumePanel } from "./call-notes-resume-panel"
import { CallNotesEditor } from "./call-notes-editor"
import { CallNotesQuestionsSidebar } from "./call-notes-questions-sidebar"
import type { EmptyField, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import type { CandidateCertification, CandidateEducation, CandidateStandaloneProject, WorkExperience } from "@/lib/types/candidate"

const RESIZE_HANDLE_CLASS = cn(
  "w-1.5 shrink-0 cursor-col-resize touch-none",
  "bg-border hover:bg-primary/40 active:bg-primary/60 transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
)

/** ~w-80 on a typical dialog; user can drag to resize (persisted per candidate). */
const QUESTIONS_PANEL_DEFAULT_PERCENT = 30
const QUESTIONS_PANEL_MIN_PERCENT = 22
const QUESTIONS_PANEL_MAX_PERCENT = 45

interface CallNotesWorkspaceProps {
  candidateId: string
  hasResume?: boolean
  resumeFileName?: string | null
  resumeContentType?: string | null
  resumeVisible: boolean
  onResumeVisibleChange: (visible: boolean) => void
  rawNotesDraft: string
  onDraftChange: (draft: string) => void
  showDraftSavedHint: boolean
  onAnalyze: () => void
  isAnalyzing?: boolean
  questions: GeneratedQuestion[]
  sectionMissingFields?: string[]
  sectionComplete?: boolean
  isLoadingQuestions: boolean
  questionsError: string | null
  emptyFields: EmptyField[]
  workExperiences?: WorkExperience[]
  educations?: CandidateEducation[]
  certifications?: CandidateCertification[]
  standaloneProjects?: CandidateStandaloneProject[]
  activeQuestionField?: string | null
  onQuestionSelect?: (apiFieldName: string) => void
  onRetryGenerateQuestions?: () => void
  section?: FieldSection
  className?: string
}

export function CallNotesWorkspace({
  candidateId,
  hasResume,
  resumeFileName,
  resumeContentType,
  resumeVisible,
  onResumeVisibleChange,
  rawNotesDraft,
  onDraftChange,
  showDraftSavedHint,
  onAnalyze,
  isAnalyzing = false,
  questions,
  sectionMissingFields,
  sectionComplete = false,
  isLoadingQuestions,
  questionsError,
  emptyFields,
  workExperiences,
  educations,
  certifications,
  standaloneProjects,
  activeQuestionField,
  onQuestionSelect,
  onRetryGenerateQuestions,
  section,
  className,
}: CallNotesWorkspaceProps) {
  const {
    containerRef: outerContainerRef,
    panelPercent: resumePercent,
    handleProps: resumeHandleProps,
  } = useResizableSplit({
    storageKey: `cold-caller-resume-width:${candidateId}`,
    side: "left",
    enabled: resumeVisible,
  })

  const {
    containerRef: editorRowRef,
    panelPercent: questionsPercent,
    handleProps: questionsHandleProps,
  } = useResizableSplit({
    storageKey: `cold-caller-questions-width:${candidateId}`,
    side: "right",
    defaultPercent: QUESTIONS_PANEL_DEFAULT_PERCENT,
    minPercent: QUESTIONS_PANEL_MIN_PERCENT,
    maxPercent: QUESTIONS_PANEL_MAX_PERCENT,
  })

  return (
    <div
      ref={outerContainerRef}
      className={cn("flex h-full min-h-0 overflow-hidden", className)}
    >
      {resumeVisible && (
        <>
          <div
            className="shrink-0 min-h-0 min-w-[200px] max-w-[55%] overflow-hidden"
            style={{ width: `${resumePercent}%` }}
          >
            <CallNotesResumePanel
              candidateId={candidateId}
              hasResume={hasResume}
              resumeFileName={resumeFileName}
              resumeContentType={resumeContentType}
              onCollapse={() => onResumeVisibleChange(false)}
              className="h-full"
            />
          </div>

          <div
            {...resumeHandleProps}
            className={RESIZE_HANDLE_CLASS}
            aria-label="Resize resume panel"
          />
        </>
      )}

      <div
        ref={editorRowRef}
        className="flex flex-1 min-w-0 min-h-0 overflow-hidden"
      >
        <div className="flex flex-1 flex-col min-w-[280px] min-h-0 overflow-hidden p-6">
          <CallNotesEditor
            value={rawNotesDraft}
            onChange={onDraftChange}
            onAnalyze={onAnalyze}
            isAnalyzing={isAnalyzing}
            showDraftSavedHint={showDraftSavedHint}
            className="h-full"
          />
        </div>

        <div
          {...questionsHandleProps}
          className={RESIZE_HANDLE_CLASS}
          aria-label="Resize questions panel"
        />

        <div
          className="shrink-0 min-h-0 min-w-[288px] max-w-[45%] overflow-hidden"
          style={{ width: `${questionsPercent}%` }}
        >
          <CallNotesQuestionsSidebar
            section={section}
            questions={questions}
            sectionMissingFields={sectionMissingFields}
            sectionComplete={sectionComplete}
            isLoading={isLoadingQuestions}
            error={questionsError}
            emptyFields={emptyFields}
            workExperiences={workExperiences}
            educations={educations}
            certifications={certifications}
            standaloneProjects={standaloneProjects}
            activeQuestionField={activeQuestionField}
            onQuestionSelect={onQuestionSelect}
            onRetry={onRetryGenerateQuestions}
            className="h-full w-full min-w-0"
          />
        </div>
      </div>
    </div>
  )
}
