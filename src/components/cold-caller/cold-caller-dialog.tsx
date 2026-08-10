"use client"

import * as React from "react"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  Phone,
  Sparkles,
  Loader2,
  MessageSquare,
  MessageCircle,
  Users,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import type { Candidate, WorkExperience } from "@/lib/types/candidate"
import { enrichWorkExperiencesForColdCaller } from "@/lib/utils/map-work-experience-for-service"
import type {
  EmptyField,
  GeneratedQuestion,
  FieldSection,
  InteractionMode,
} from "@/types/cold-caller"
import { SECTION_LABELS, MODE_CONFIG } from "@/types/cold-caller"
import {
  getEmptyFields,
  groupEmptyFieldsBySection,
  createEntryFields,
} from "@/lib/utils/empty-field-detection"
import { generateQuestions } from "@/lib/services/questions-api"
import {
  flattenSectionQuestions,
  mapGenerateQuestionsResponse,
  totalMissingFieldsCount,
} from "@/lib/utils/question-generation-response"
import {
  applySessionQgScaffolds,
  filterFieldsToGenerateForScope,
  mergeIncrementalQuestionState,
  sessionQgScopeKey,
  type SessionQgScope,
  type SessionQgScaffolds,
} from "@/lib/utils/session-qg-scaffolds"
import type { ColdCallerSectionQuestions } from "@/types/cold-caller"
import { ColdCallerCallNotesView } from "./cold-caller-call-notes-view"
import { useCallNotesDraft } from "@/hooks/useCallNotesDraft"
import {
  fetchCandidateCallNotes,
  patchCandidateCallNotes,
} from "@/lib/services/candidate-call-notes-api"
import { extractCallNotes } from "@/lib/services/call-notes-extract-api"
import {
  buildCallNotesAllowedEmptyFields,
  getCallNotesExtractAnalyzeDisabledReason,
} from "@/lib/utils/call-notes-allowed-empty-fields"
import { buildCallNotesExtractCandidateSnapshot } from "@/lib/utils/call-notes-extract-snapshot"
import {
  CallNotesExtractReviewDialog,
  buildReviewRows,
  type CallNotesExtractReviewRow,
} from "./call-notes-extract-review-dialog"
import {
  candidateToFormData,
  type CandidateFormData,
} from "@/components/candidate-creation-dialog"
import type { CallNotesExtraction } from "@/types/call-notes-extraction"
import {
  applyCallNotesExtractionsToFormData,
  formatCallNotesApplyToast,
  type ApplyCallNotesExtractionsResult,
} from "@/lib/utils/call-notes-apply-extractions"
import { getCandidateResumeOpenUrl } from "@/lib/services/candidate-resume-api"
import { openUrlInNewTabAfterFetch } from "@/lib/utils/open-url-in-new-tab"

interface ColdCallerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: Candidate
  mode?: InteractionMode
  /** Unsaved Auto-Profiler session: local resume + Apply to Create (no Save Notes / no call-notes APIs). */
  draftMode?: boolean
  /** Blob URL (or object URL) for local resume preview in draft mode. */
  localResumeUrl?: string | null
  /** Called when user clicks Apply to Create Candidate in draft mode (receives current notes text). */
  onApplyToCreateCandidate?: (callNotes: string) => void
  /**
   * Form snapshot to merge Call Notes extractions into (draft: session formSnapshot;
   * saved: omit to derive from `candidate`).
   */
  applyFormBase?: CandidateFormData
  /** Called after Apply Selected merges extractions (parent opens Edit or updates draft session). */
  onApplyExtractComplete?: (result: ApplyCallNotesExtractionsResult) => void
}

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
  mode = "coldCaller",
  draftMode = false,
  localResumeUrl = null,
  onApplyToCreateCandidate,
  applyFormBase,
  onApplyExtractComplete,
}: ColdCallerDialogProps) {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [questionSections, setQuestionSections] = useState<ColdCallerSectionQuestions[] | null>(
    null,
  )
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [questionsError, setQuestionsError] = useState<string | null>(null)

  const [resumeVisible, setResumeVisible] = useState(true)

  const {
    draft: rawNotesDraft,
    setDraft: setRawNotesDraft,
    showDraftSavedHint,
    hydrate: hydrateCallNotesDraft,
    clearDraftStorage,
    readStoredDraft,
  } = useCallNotesDraft(candidate.id, open, { deferHydration: !draftMode })
  const [isSavingCallNotes, setIsSavingCallNotes] = useState(false)
  const [callNotesLoadState, setCallNotesLoadState] = useState<"idle" | "loading" | "ready">(
    "idle",
  )
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

  const [enrichedWorkExperiences, setEnrichedWorkExperiences] = useState<
    WorkExperience[] | undefined
  >(candidate.workExperiences)
  const [isCatalogEnriching, setIsCatalogEnriching] = useState(false)

  const [isAnalyzingCallNotes, setIsAnalyzingCallNotes] = useState(false)
  const [extractReviewOpen, setExtractReviewOpen] = useState(false)
  const [notesFocusSignal, setNotesFocusSignal] = useState(0)
  const prevExtractReviewOpenRef = useRef(false)
  const [extractReviewRows, setExtractReviewRows] = useState<CallNotesExtractReviewRow[]>([])
  const [extractReviewError, setExtractReviewError] = useState<string | null>(null)
  const [isApplyingExtract, setIsApplyingExtract] = useState(false)
  const extractAbortRef = useRef<AbortController | null>(null)

  const [manuallyAddedFields, setManuallyAddedFields] = useState<EmptyField[]>([])
  const [sessionAchievementIndices, setSessionAchievementIndices] = useState<number[]>([])
  const [pendingAchievementNavId, setPendingAchievementNavId] = useState<`entry-${number}` | null>(
    null,
  )
  const [sessionCertificationIndices, setSessionCertificationIndices] = useState<number[]>([])
  const [pendingCertificationNavId, setPendingCertificationNavId] = useState<
    `entry-${number}` | null
  >(null)
  const [sessionWorkExperienceIndices, setSessionWorkExperienceIndices] = useState<number[]>([])
  const [pendingWorkExperienceNavId, setPendingWorkExperienceNavId] = useState<
    `entry-${number}` | null
  >(null)
  const [sessionProjectsByRole, setSessionProjectsByRole] = useState<Record<number, number[]>>(
    {},
  )
  const [sessionQgLoadingKey, setSessionQgLoadingKey] = useState<string | null>(null)
  const [sessionQgFailedKeys, setSessionQgFailedKeys] = useState<string[]>([])
  const [sessionQgErrorsByKey, setSessionQgErrorsByKey] = useState<Record<string, string>>({})
  const [sessionQgScopesByKey, setSessionQgScopesByKey] = useState<
    Record<string, SessionQgScope>
  >({})

  const workExperiencesCatalogKey = useMemo(
    () =>
      JSON.stringify(
        (candidate.workExperiences ?? []).map((we) => ({
          employerId: we.employerId ?? null,
          projectIds: (we.projects ?? []).map((p) => p.projectId ?? null),
        })),
      ),
    [candidate.workExperiences],
  )

  useEffect(() => {
    if (!open) {
      setIsCatalogEnriching(false)
      return
    }
    let cancelled = false
    setIsCatalogEnriching(true)
    setEnrichedWorkExperiences(candidate.workExperiences)
    enrichWorkExperiencesForColdCaller(candidate.workExperiences)
      .then((enriched) => {
        if (cancelled) return
        setEnrichedWorkExperiences(enriched)
        setIsCatalogEnriching(false)
      })
      .catch(() => {
        if (cancelled) return
        setEnrichedWorkExperiences(candidate.workExperiences)
        setIsCatalogEnriching(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalog key is the intentional WE dependency
  }, [open, candidate.id, workExperiencesCatalogKey])

  const candidateWithCatalog = useMemo(
    (): Candidate => ({
      ...candidate,
      workExperiences: enrichedWorkExperiences ?? candidate.workExperiences,
    }),
    [candidate, enrichedWorkExperiences],
  )

  useEffect(() => {
    if (!open) {
      setCallNotesLoadState("idle")
      return
    }

    if (draftMode) {
      hydrateCallNotesDraft(readStoredDraft())
      setCallNotesLoadState("ready")
      return
    }

    const candidateIdNum = Number(candidate.id)
    if (!Number.isFinite(candidateIdNum)) {
      hydrateCallNotesDraft(readStoredDraft())
      setCallNotesLoadState("ready")
      return
    }

    let cancelled = false
    setCallNotesLoadState("loading")

    fetchCandidateCallNotes(candidateIdNum)
      .then((dto) => {
        if (cancelled) return
        if (dto.call_notes != null) {
          hydrateCallNotesDraft(dto.call_notes)
        } else {
          hydrateCallNotesDraft(readStoredDraft())
        }
        setCallNotesLoadState("ready")
      })
      .catch((e) => {
        if (cancelled) return
        toast.error(e instanceof Error ? e.message : "Failed to load call notes.")
        hydrateCallNotesDraft(readStoredDraft())
        setCallNotesLoadState("ready")
      })

    return () => {
      cancelled = true
    }
  }, [open, draftMode, candidate.id, hydrateCallNotesDraft, readStoredDraft])

  useEffect(() => {
    if (open && callNotesLoadState === "ready") {
      setNotesFocusSignal((n) => n + 1)
    }
  }, [open, callNotesLoadState])

  useEffect(() => {
    if (prevExtractReviewOpenRef.current && !extractReviewOpen && open) {
      setNotesFocusSignal((n) => n + 1)
    }
    prevExtractReviewOpenRef.current = extractReviewOpen
  }, [extractReviewOpen, open])

  const handleSaveCallNotes = useCallback(async () => {
    const candidateIdNum = Number(candidate.id)
    if (!Number.isFinite(candidateIdNum)) {
      toast.error("Invalid candidate id.")
      throw new Error("Invalid candidate id.")
    }
    if (!rawNotesDraft.trim()) {
      toast.error("Enter call notes before saving.")
      throw new Error("Empty call notes.")
    }

    setIsSavingCallNotes(true)
    try {
      await patchCandidateCallNotes(candidateIdNum, rawNotesDraft)
      clearDraftStorage()
      toast.success("Notes saved.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save call notes.")
      throw e
    } finally {
      setIsSavingCallNotes(false)
    }
  }, [candidate.id, rawNotesDraft, clearDraftStorage])

  const callNotesAllowedEmptyFields = useMemo(
    () =>
      buildCallNotesAllowedEmptyFields(candidateWithCatalog, {
        hasResume: candidate.hasResume === true,
      }),
    [candidateWithCatalog, candidate.hasResume],
  )

  const callNotesAnalyzeDisabledReason = useMemo(
    () =>
      getCallNotesExtractAnalyzeDisabledReason(rawNotesDraft, callNotesAllowedEmptyFields),
    [rawNotesDraft, callNotesAllowedEmptyFields],
  )

  const runCallNotesExtract = useCallback(async () => {
    const disabledReason = getCallNotesExtractAnalyzeDisabledReason(
      rawNotesDraft,
      callNotesAllowedEmptyFields,
    )
    if (disabledReason) {
      toast.error(disabledReason)
      return
    }

    extractAbortRef.current?.abort()
    const controller = new AbortController()
    extractAbortRef.current = controller

    setIsAnalyzingCallNotes(true)
    setExtractReviewError(null)
    try {
      const allowedEmptyFields = callNotesAllowedEmptyFields
      const response = await extractCallNotes(
        {
          rawNotes: rawNotesDraft,
          candidateSnapshot: buildCallNotesExtractCandidateSnapshot(candidateWithCatalog),
          allowedEmptyFields,
        },
        controller.signal,
      )
      setExtractReviewRows(buildReviewRows(response.extractions, allowedEmptyFields))
      setExtractReviewOpen(true)
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return
      const message = e instanceof Error ? e.message : "Call notes extract failed."
      setExtractReviewRows([])
      setExtractReviewError(message)
      setExtractReviewOpen(true)
      toast.error(message)
    } finally {
      setIsAnalyzingCallNotes(false)
    }
  }, [rawNotesDraft, callNotesAllowedEmptyFields, candidateWithCatalog])

  const handleAnalyzeCallNotes = useCallback(() => {
    void runCallNotesExtract()
  }, [runCallNotesExtract])

  const handleApplyExtractSelected = useCallback(
    (selected: CallNotesExtractReviewRow[]) => {
      if (selected.length === 0) return

      const baseForm = applyFormBase ?? candidateToFormData(candidate)
      const extractions: CallNotesExtraction[] = selected.map((row) => ({
        fieldPath: row.fieldPath,
        apiFieldName: row.apiFieldName,
        value: row.value,
        sourceText: row.sourceText,
        confidence: row.confidence,
      }))

      setIsApplyingExtract(true)
      try {
        const result = applyCallNotesExtractionsToFormData(
          baseForm,
          extractions,
          callNotesAllowedEmptyFields,
        )
        setExtractReviewOpen(false)

        const message = formatCallNotesApplyToast(result)
        if (result.applied.length === 0) {
          toast.warning(message)
        } else {
          toast.success(message)
        }

        onApplyExtractComplete?.(result)
      } finally {
        setIsApplyingExtract(false)
      }
    },
    [applyFormBase, candidate, callNotesAllowedEmptyFields, onApplyExtractComplete],
  )

  const baseEmptyFields = useMemo(
    () => getEmptyFields(candidateWithCatalog),
    [candidateWithCatalog],
  )
  const emptyFields = useMemo(() => {
    const allFields = [...baseEmptyFields, ...manuallyAddedFields].filter(
      (field) => field.section !== "techStacks" && field.section !== "education",
    )
    return Array.from(new Map(allFields.map((field) => [field.fieldPath, field])).values())
  }, [baseEmptyFields, manuallyAddedFields])
  const groupedFields = useMemo(() => groupEmptyFieldsBySection(emptyFields), [emptyFields])

  const sectionsWithFields = useMemo(() => {
    const dynamicSections: FieldSection[] = ["workExperience", "certifications", "achievements"]
    const sectionOrder: FieldSection[] = [
      "basic",
      "workExperience",
      "certifications",
      "achievements",
      "preferences",
    ]
    const sectionsWithEmptyFields = Array.from(groupedFields.keys()).filter((section) => {
      const fields = groupedFields.get(section)
      return fields && fields.length > 0
    })

    const sectionsWithData: FieldSection[] = []
    dynamicSections.forEach((section) => {
      if (section === "workExperience" && (candidate.workExperiences?.length || 0) > 0) {
        sectionsWithData.push(section)
      } else if (section === "certifications" && (candidate.certifications?.length || 0) > 0) {
        sectionsWithData.push(section)
      } else if (section === "achievements" && (candidate.achievements?.length || 0) > 0) {
        sectionsWithData.push(section)
      }
    })

    const allSections = new Set([...sectionsWithEmptyFields, ...sectionsWithData])
    allSections.delete("techStacks")
    allSections.delete("education")
    return Array.from(allSections).sort(
      (a, b) => sectionOrder.indexOf(a) - sectionOrder.indexOf(b),
    )
  }, [groupedFields, candidate])

  const prevCandidateIdRef = React.useRef<string | undefined>(undefined)
  const prevOpenRef = React.useRef<boolean>(false)

  useEffect(() => {
    const dialogJustOpened = open && !prevOpenRef.current
    const candidateChanged = prevCandidateIdRef.current !== candidate.id

    if (open) {
      if (dialogJustOpened || candidateChanged) {
        setManuallyAddedFields([])
        setSessionAchievementIndices([])
        setPendingAchievementNavId(null)
        setSessionCertificationIndices([])
        setPendingCertificationNavId(null)
        setSessionWorkExperienceIndices([])
        setPendingWorkExperienceNavId(null)
        setSessionProjectsByRole({})
        setSessionQgLoadingKey(null)
        setSessionQgFailedKeys([])
        setSessionQgErrorsByKey({})
        setSessionQgScopesByKey({})

        if (candidateChanged) {
          setQuestions([])
          setQuestionSections(null)
          setQuestionsError(null)
        }

        if (dialogJustOpened || candidateChanged) {
          setResumeVisible(true)
        }

        prevCandidateIdRef.current = candidate.id
        prevOpenRef.current = true
      }
    } else {
      prevOpenRef.current = false
    }
  }, [open, candidate.id])

  const modeConfig = MODE_CONFIG[mode]
  const ModeIcon = MODE_ICONS[mode]

  const sessionQgScaffolds = useMemo((): SessionQgScaffolds => {
    return {
      workExperienceIndices: sessionWorkExperienceIndices,
      projectsByRole: sessionProjectsByRole,
      certificationIndices: sessionCertificationIndices,
      achievementIndices: sessionAchievementIndices,
    }
  }, [
    sessionWorkExperienceIndices,
    sessionProjectsByRole,
    sessionCertificationIndices,
    sessionAchievementIndices,
  ])

  const questionSectionsRef = useRef(questionSections)
  const questionsRef = useRef(questions)
  useEffect(() => {
    questionSectionsRef.current = questionSections
  }, [questionSections])
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])

  const applyQuestionsFromResponse = useCallback(
    (sections: ColdCallerSectionQuestions[], flatQuestions: GeneratedQuestion[]) => {
      questionSectionsRef.current = sections
      questionsRef.current = flatQuestions
      setQuestionSections(sections)
      setQuestions(flatQuestions)
    },
    [],
  )

  const runSessionQg = useCallback(
    async (scope: SessionQgScope, scaffolds: SessionQgScaffolds) => {
      if (isCatalogEnriching) return
      const key = sessionQgScopeKey(scope)
      setSessionQgLoadingKey(key)
      setSessionQgFailedKeys((prev) => prev.filter((k) => k !== key))
      setSessionQgErrorsByKey((prev) => {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
      setSessionQgScopesByKey((prev) => ({ ...prev, [key]: scope }))

      try {
        const candidateForQg = applySessionQgScaffolds(candidateWithCatalog, scaffolds)
        const response = await generateQuestions(
          candidate.id,
          candidateForQg,
          mode === "coldCaller" ? "cold_call" : mode,
          {
            fieldsToGenerateFilter: (fields) => filterFieldsToGenerateForScope(fields, scope),
          },
        )
        const incomingSections = mapGenerateQuestionsResponse(response).filter(
          (section) => section.section !== "techStacks",
        )
        const { sections, flat } = mergeIncrementalQuestionState(
          questionSectionsRef.current,
          questionsRef.current,
          incomingSections,
        )
        applyQuestionsFromResponse(sections, flat)
        toast.success(
          `Generated ${flattenSectionQuestions(incomingSections).length} question${
            flattenSectionQuestions(incomingSections).length === 1 ? "" : "s"
          } for new entry`,
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to generate questions"
        setSessionQgFailedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
        setSessionQgErrorsByKey((prev) => ({ ...prev, [key]: message }))
        toast.error(message)
      } finally {
        setSessionQgLoadingKey(null)
      }
    },
    [applyQuestionsFromResponse, candidate.id, candidateWithCatalog, isCatalogEnriching, mode],
  )

  const handleGenerateQuestions = useCallback(async () => {
    if (isCatalogEnriching) return
    setIsLoadingQuestions(true)
    setQuestionsError(null)
    setSessionQgFailedKeys([])
    setSessionQgErrorsByKey({})
    setSessionQgScopesByKey({})
    setSessionQgLoadingKey(null)

    try {
      const candidateForQg = applySessionQgScaffolds(candidateWithCatalog, sessionQgScaffolds)
      const response = await generateQuestions(
        candidate.id,
        candidateForQg,
        mode === "coldCaller" ? "cold_call" : mode,
      )
      const sections = mapGenerateQuestionsResponse(response).filter(
        (section) => section.section !== "techStacks",
      )
      const flatQuestions = flattenSectionQuestions(sections)
      applyQuestionsFromResponse(sections, flatQuestions)

      const missingCount = totalMissingFieldsCount(sections)
      toast.success(
        `Generated ${flatQuestions.length} questions across ${missingCount} missing field${missingCount === 1 ? "" : "s"}`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate questions"
      setQuestionsError(message)
      toast.error(message)
    } finally {
      setIsLoadingQuestions(false)
    }
  }, [
    applyQuestionsFromResponse,
    candidate.id,
    candidateWithCatalog,
    isCatalogEnriching,
    mode,
    sessionQgScaffolds,
  ])

  const handleRetryQuestions = useCallback(() => {
    void handleGenerateQuestions()
  }, [handleGenerateQuestions])

  const handleRetrySessionQgEntry = useCallback(
    (scopeKey: string) => {
      const scope = sessionQgScopesByKey[scopeKey]
      if (!scope) return
      void runSessionQg(scope, sessionQgScaffolds)
    },
    [runSessionQg, sessionQgScaffolds, sessionQgScopesByKey],
  )

  const handleAddSessionWorkExperience = useCallback(() => {
    const resumeMax = (candidateWithCatalog.workExperiences?.length ?? 0) - 1
    const sessionMax =
      sessionWorkExperienceIndices.length > 0 ? Math.max(...sessionWorkExperienceIndices) : -1
    const questionRoleMax = questions.reduce((max, question) => {
      const match = /^work_experience_(\d+)_/.exec(question.field)
      if (!match) return max
      return Math.max(max, Number(match[1]))
    }, -1)
    const roleIndex = Math.max(resumeMax, sessionMax, questionRoleMax) + 1

    const nextWe = sessionWorkExperienceIndices.includes(roleIndex)
      ? sessionWorkExperienceIndices
      : [...sessionWorkExperienceIndices, roleIndex].sort((a, b) => a - b)
    const nextProjects: Record<number, number[]> = {
      ...sessionProjectsByRole,
      [roleIndex]: sessionProjectsByRole[roleIndex]?.includes(0)
        ? sessionProjectsByRole[roleIndex]!
        : [0],
    }
    setSessionWorkExperienceIndices(nextWe)
    setSessionProjectsByRole(nextProjects)
    setPendingWorkExperienceNavId(`entry-${roleIndex}`)
    const scaffolds: SessionQgScaffolds = {
      ...sessionQgScaffolds,
      workExperienceIndices: nextWe,
      projectsByRole: nextProjects,
    }
    void runSessionQg({ type: "workExperience", roleIndex }, scaffolds)
  }, [
    candidateWithCatalog.workExperiences?.length,
    questions,
    runSessionQg,
    sessionProjectsByRole,
    sessionQgScaffolds,
    sessionWorkExperienceIndices,
  ])

  const handleAddSessionProject = useCallback(
    (roleIndex: number) => {
      const resumeLen =
        candidateWithCatalog.workExperiences?.[roleIndex]?.projects?.length ?? 0
      const resumeMax = resumeLen - 1
      const isSessionWe = sessionWorkExperienceIndices.includes(roleIndex)
      const hasGenerated =
        questionSections != null || questions.some((q) => q.section === "workExperience")
      const syntheticMax = resumeLen === 0 && (hasGenerated || isSessionWe) ? 0 : -1
      const session = sessionProjectsByRole[roleIndex] ?? []
      const sessionMax = session.length > 0 ? Math.max(...session) : -1
      const projectIndex = Math.max(resumeMax, syntheticMax, sessionMax) + 1

      const nextForRole = session.includes(projectIndex)
        ? session
        : [...session, projectIndex].sort((a, b) => a - b)
      const nextProjects = { ...sessionProjectsByRole, [roleIndex]: nextForRole }
      setSessionProjectsByRole(nextProjects)
      const scaffolds: SessionQgScaffolds = {
        ...sessionQgScaffolds,
        projectsByRole: nextProjects,
      }
      void runSessionQg({ type: "project", roleIndex, projectIndex }, scaffolds)
    },
    [
      candidateWithCatalog.workExperiences,
      questionSections,
      questions,
      runSessionQg,
      sessionProjectsByRole,
      sessionQgScaffolds,
      sessionWorkExperienceIndices,
    ],
  )

  const handleAddEntry = useCallback(
    (section: FieldSection) => {
      if (section !== "achievements" && section !== "certifications") {
        toast.error(`Cannot add entries to ${SECTION_LABELS[section]}`)
        return
      }

      const currentFields = groupedFields.get(section) || []

      let maxIndex = -1
      currentFields.forEach((field) => {
        const match = field.fieldPath.match(/\[(\d+)\]/)
        if (match) {
          maxIndex = Math.max(maxIndex, parseInt(match[1], 10))
        }
      })

      const candidateMaxIndex =
        section === "certifications"
          ? (candidate.certifications?.length || 0) - 1
          : (candidate.achievements?.length || 0) - 1

      const newIndex = Math.max(maxIndex, candidateMaxIndex) + 1
      const newFields = createEntryFields(section, newIndex)

      if (section === "achievements") {
        const nextAchievements = sessionAchievementIndices.includes(newIndex)
          ? sessionAchievementIndices
          : [...sessionAchievementIndices, newIndex].sort((a, b) => a - b)
        setSessionAchievementIndices(nextAchievements)
        setPendingAchievementNavId(`entry-${newIndex}`)
        void runSessionQg(
          { type: "achievement", achievementIndex: newIndex },
          { ...sessionQgScaffolds, achievementIndices: nextAchievements },
        )
      }

      if (section === "certifications") {
        const nextCerts = sessionCertificationIndices.includes(newIndex)
          ? sessionCertificationIndices
          : [...sessionCertificationIndices, newIndex].sort((a, b) => a - b)
        setSessionCertificationIndices(nextCerts)
        setPendingCertificationNavId(`entry-${newIndex}`)
        void runSessionQg(
          { type: "certification", certIndex: newIndex },
          { ...sessionQgScaffolds, certificationIndices: nextCerts },
        )
      }

      setManuallyAddedFields((prev) => [...prev, ...newFields])
      toast.success(`Added new ${SECTION_LABELS[section]} entry`)
    },
    [
      groupedFields,
      candidate.certifications?.length,
      candidate.achievements?.length,
      runSessionQg,
      sessionAchievementIndices,
      sessionCertificationIndices,
      sessionQgScaffolds,
    ],
  )

  const handlePopOutResume = useCallback(async () => {
    if (draftMode && localResumeUrl) {
      window.open(localResumeUrl, "_blank", "noopener,noreferrer")
      return
    }

    const id = Number(candidate.id)
    if (!candidate.hasResume || !Number.isFinite(id)) {
      toast.error("No resume available to open.")
      return
    }

    try {
      await openUrlInNewTabAfterFetch(async () => {
        const response = await getCandidateResumeOpenUrl(id)
        return response.url
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open the resume.")
    }
  }, [candidate.hasResume, candidate.id, draftMode, localResumeUrl])

  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (!next && draftMode && open) {
        setDiscardConfirmOpen(true)
        return
      }
      onOpenChange(next)
    },
    [draftMode, open, onOpenChange],
  )

  const confirmDiscardDraft = useCallback(() => {
    setDiscardConfirmOpen(false)
    clearDraftStorage()
    onOpenChange(false)
  }, [clearDraftStorage, onOpenChange])

  const handleApplyFromDraft = useCallback(() => {
    onApplyToCreateCandidate?.(rawNotesDraft)
  }, [onApplyToCreateCandidate, rawNotesDraft])

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !max-h-[100dvh] rounded-none border-0 shadow-none overflow-hidden !flex !flex-col p-0 gap-0 sm:!max-w-none">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={cn(
                    "h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0",
                    modeConfig.color,
                  )}
                >
                  <ModeIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-semibold mb-1 flex items-center gap-2">
                    <span>{modeConfig.label} Mode</span>
                    {draftMode ? (
                      <Badge variant="secondary" className="text-xs font-medium">
                        Draft
                      </Badge>
                    ) : null}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground truncate">
                    {candidate.name} • {candidate.mobileNo || "No phone"}
                  </p>
                </div>
              </div>

              <div className="mr-8 shrink-0 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={resumeVisible ? "secondary" : "outline"}
                  onClick={() => setResumeVisible((v) => !v)}
                  className="gap-1.5"
                  aria-pressed={resumeVisible}
                >
                  {resumeVisible ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                  {resumeVisible ? "Hide Resume" : "Show Resume"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePopOutResume}
                  disabled={!candidate.hasResume && !localResumeUrl}
                  className="gap-1.5"
                  title="Open resume in a new window"
                >
                  <ExternalLink className="h-4 w-4" />
                  Pop Out
                </Button>
                <Button
                  size="sm"
                  onClick={handleGenerateQuestions}
                  disabled={isLoadingQuestions || isCatalogEnriching}
                  className="gap-1.5"
                  title={
                    isCatalogEnriching
                      ? "Loading employer and project catalogs…"
                      : undefined
                  }
                >
                  {isLoadingQuestions || isCatalogEnriching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate Questions
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ColdCallerCallNotesView
              candidateId={candidate.id}
              hasResume={candidate.hasResume}
              resumeFileName={candidate.resumeFileName}
              resumeContentType={candidate.resumeContentType}
              localResumeUrl={localResumeUrl}
              resumeVisible={resumeVisible}
              onResumeVisibleChange={setResumeVisible}
              emptyFields={emptyFields}
              workExperiences={candidateWithCatalog.workExperiences ?? undefined}
              certifications={candidate.certifications ?? undefined}
              achievements={candidate.achievements ?? undefined}
              linkedinUrl={candidate.linkedinUrl}
              currentSalary={candidate.currentSalary}
              expectedSalary={candidate.expectedSalary}
              techStacks={candidate.techStacks}
              groupedFields={groupedFields}
              sectionsWithFields={sectionsWithFields}
              rawNotesDraft={rawNotesDraft}
              onDraftChange={setRawNotesDraft}
              showDraftSavedHint={showDraftSavedHint}
              questions={questions}
              questionSections={questionSections}
              isLoadingQuestions={isLoadingQuestions}
              questionsError={questionsError}
              onRetryGenerateQuestions={handleRetryQuestions}
              onSaveNotes={handleSaveCallNotes}
              draftMode={draftMode}
              onApplyToCreateCandidate={handleApplyFromDraft}
              onAnalyzeNotes={handleAnalyzeCallNotes}
              isAnalyzingNotes={isAnalyzingCallNotes}
              analyzeDisabled={callNotesAnalyzeDisabledReason != null}
              analyzeDisabledReason={callNotesAnalyzeDisabledReason}
              isSaving={isSavingCallNotes}
              notesEditorDisabled={callNotesLoadState === "loading"}
              sessionAchievementIndices={sessionAchievementIndices}
              pendingAchievementNavId={pendingAchievementNavId}
              onPendingAchievementNavHandled={() => setPendingAchievementNavId(null)}
              onAddSessionAchievement={() => handleAddEntry("achievements")}
              sessionCertificationIndices={sessionCertificationIndices}
              pendingCertificationNavId={pendingCertificationNavId}
              onPendingCertificationNavHandled={() => setPendingCertificationNavId(null)}
              onAddSessionCertification={() => handleAddEntry("certifications")}
              sessionWorkExperienceIndices={sessionWorkExperienceIndices}
              pendingWorkExperienceNavId={pendingWorkExperienceNavId}
              onPendingWorkExperienceNavHandled={() => setPendingWorkExperienceNavId(null)}
              sessionProjectsByRole={sessionProjectsByRole}
              onAddSessionWorkExperience={handleAddSessionWorkExperience}
              onAddSessionProject={handleAddSessionProject}
              sessionQgLoadingKey={sessionQgLoadingKey}
              sessionQgFailedKeys={sessionQgFailedKeys}
              sessionQgErrorsByKey={sessionQgErrorsByKey}
              onRetrySessionQgEntry={handleRetrySessionQgEntry}
              isCatalogEnriching={isCatalogEnriching}
              notesFocusSignal={notesFocusSignal}
            />
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
            <div className="text-sm text-muted-foreground">
              {rawNotesDraft.trim() ? (
                <span className="text-muted-foreground">Call notes draft in progress</span>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              This draft has not been saved to the database. Closing will discard the parsed
              profile, resume file, and call notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardDraft}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CallNotesExtractReviewDialog
        open={extractReviewOpen}
        onOpenChange={setExtractReviewOpen}
        rows={extractReviewRows}
        isApplying={isApplyingExtract}
        isReAnalyzing={isAnalyzingCallNotes}
        extractError={extractReviewError}
        onApplySelected={handleApplyExtractSelected}
        onAnalyzeAgain={handleAnalyzeCallNotes}
      />
    </>
  )
}
