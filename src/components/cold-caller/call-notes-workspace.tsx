"use client"

import { cn } from "@/lib/utils"
import { useResizableSplit } from "@/hooks/useResizableSplit"
import { CallNotesResumePanel } from "./call-notes-resume-panel"
import { CallNotesEditor } from "./call-notes-editor"
import { CallNotesQuestionsSidebar } from "./call-notes-questions-sidebar"
import type { EmptyField, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import type { Achievement, CandidateCertification, WorkExperience } from "@/lib/types/candidate"

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
  localResumeUrl?: string | null
  resumeVisible: boolean
  onResumeVisibleChange: (visible: boolean) => void
  rawNotesDraft: string
  onDraftChange: (draft: string) => void
  showDraftSavedHint: boolean
  onSave: () => void
  draftMode?: boolean
  onApplyToCreateCandidate?: () => void
  isSaving?: boolean
  notesEditorDisabled?: boolean
  questions: GeneratedQuestion[]
  sectionMissingFields?: string[]
  sectionComplete?: boolean
  isLoadingQuestions: boolean
  questionsError: string | null
  emptyFields: EmptyField[]
  workExperiences?: WorkExperience[]
  certifications?: CandidateCertification[]
  achievements?: Achievement[]
  linkedinUrl?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  techStacks?: string[]
  activeQuestionField?: string | null
  onQuestionSelect?: (apiFieldName: string) => void
  onRetryGenerateQuestions?: () => void
  section?: FieldSection
  className?: string
  sessionAchievementIndices?: number[]
  pendingAchievementNavId?: `entry-${number}` | null
  onPendingAchievementNavHandled?: () => void
  onAddSessionAchievement?: () => void
}

export function CallNotesWorkspace({
  candidateId,
  hasResume,
  resumeFileName,
  resumeContentType,
  localResumeUrl,
  resumeVisible,
  onResumeVisibleChange,
  rawNotesDraft,
  onDraftChange,
  showDraftSavedHint,
  onSave,
  draftMode = false,
  onApplyToCreateCandidate,
  isSaving = false,
  notesEditorDisabled = false,
  questions,
  sectionMissingFields,
  sectionComplete = false,
  isLoadingQuestions,
  questionsError,
  emptyFields,
  workExperiences,
  certifications,
  achievements,
  linkedinUrl,
  currentSalary,
  expectedSalary,
  techStacks,
  activeQuestionField,
  onQuestionSelect,
  onRetryGenerateQuestions,
  section,
  className,
  sessionAchievementIndices,
  pendingAchievementNavId,
  onPendingAchievementNavHandled,
  onAddSessionAchievement,
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
              localResumeUrl={localResumeUrl}
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
            onSave={onSave}
            draftMode={draftMode}
            onApplyToCreateCandidate={onApplyToCreateCandidate}
            isSaving={isSaving}
            disabled={notesEditorDisabled}
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
            certifications={certifications}
            achievements={achievements}
            linkedinUrl={linkedinUrl}
            hasResume={hasResume}
            currentSalary={currentSalary}
            expectedSalary={expectedSalary}
            techStacks={techStacks}
            activeQuestionField={activeQuestionField}
            onQuestionSelect={onQuestionSelect}
            onRetry={onRetryGenerateQuestions}
            sessionAchievementIndices={sessionAchievementIndices}
            pendingAchievementNavId={pendingAchievementNavId}
            onPendingAchievementNavHandled={onPendingAchievementNavHandled}
            onAddSessionAchievement={onAddSessionAchievement}
            className="h-full w-full min-w-0"
          />
        </div>
      </div>
    </div>
  )
}
