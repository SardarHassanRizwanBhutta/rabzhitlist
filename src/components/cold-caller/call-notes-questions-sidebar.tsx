"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react"
import { ACHIEVEMENT_TYPE_LABELS } from "@/lib/constants/candidate-enums"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { EmptyField, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import type { Achievement, CandidateCertification, WorkExperience } from "@/lib/types/candidate"
import { SECTION_LABELS } from "@/types/cold-caller"
import { ProjectCatalogCollapsible } from "@/components/cold-caller/project-catalog-collapsible"
import {
  buildQuestionFieldLabelMap,
  resolveQuestionFieldMeta,
} from "@/lib/utils/question-api-field-labels"
import {
  groupQuestionsForDisplay,
  type ProjectQuestionAccordion,
  type QuestionDisplayBlock,
} from "@/lib/utils/question-accordion-layout"
import {
  coldCallerQgProjectFieldDefs,
  COLD_CALLER_QG_PROJECT_PRIORITIES,
  isProjectCatalogFieldMissing,
  readLinkedProjectPayloadValue,
} from "@/lib/utils/project-catalog-fields"
import {
  formatQgDisplayValue,
  formatSalaryDisplayValue,
  isQgValueMissing,
} from "@/lib/utils/qg-value"
import {
  formatQgQuestionCopyText,
  QG_ENUM_OPTIONS_COLLAPSE_THRESHOLD,
} from "@/lib/utils/qg-enum-options"
import { mergeValueAndQuestionCards } from "@/lib/utils/merge-value-question-cards"
import {
  QG_LIST_VALUE_BADGE_MAX_DISPLAY,
  qgListValueBadgeClass,
  qgListValueBadgeVariant,
  toQgListValueItems,
  type QgListValueBadgeVariant,
} from "@/lib/utils/qg-list-value-badges"
import {
  shiftTypeDisplayLabel,
  workModeDisplayLabel,
} from "@/lib/utils/shift-work-mode-display"
import { salaryPolicyDisplayLabel } from "@/lib/utils/salary-policy-display"
import { layoffReasonDisplayLabel } from "@/lib/utils/layoff-reason-display"
import {
  ACHIEVEMENT_FIELD_ORDER,
  ACHIEVEMENT_FIELD_PRIORITIES,
  BASIC_FIELD_ORDER,
  BASIC_FIELD_PRIORITIES,
  CERTIFICATION_FIELD_ORDER,
  CERTIFICATION_FIELD_PRIORITIES,
  COLD_CALLER_EXPECTED_SALARY_LABEL,
  INDEPENDENT_TECH_STACKS_PRIORITY,
  LAYOFF_FIELD_ORDER,
  LAYOFF_FIELD_PRIORITIES,
  OFFICE_FIELD_ORDER,
  OFFICE_FIELD_PRIORITIES,
  PREFERENCES_FIELD_ORDER,
  PREFERENCES_FIELD_PRIORITIES,
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
  WORK_EXPERIENCE_EMPLOYER_PRIORITIES,
  WORK_EXPERIENCE_ROLE_FIELD_ORDER,
  WORK_EXPERIENCE_ROLE_PRIORITIES,
} from "@/lib/utils/qg-field-weights"
import {
  countMissingFieldsForAchievementCard,
  formatAchievementCardSubtitle,
} from "@/lib/utils/achievement-questions"
import {
  countMissingFieldsForCertificationCard,
  formatCertificationCardSubtitle,
} from "@/lib/utils/certification-questions"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"
import {
  buildQuestionEntryNavItems,
  defaultQuestionEntryNavId,
  filterBlocksForEntryNav,
  isOverviewContentEmpty,
  resolveQuestionEntryNavChrome,
  splitAccordionBlocks,
  type QuestionEntryNavId,
  type QuestionEntryNavSection,
} from "@/lib/utils/question-entry-nav"
import {
  countMissingFieldsForWorkExperienceCard,
  formatWorkExperienceCardSubtitle,
  isWorkExperienceEmployerPresent,
  WORK_EXPERIENCE_FIELD_LABELS,
  workExperienceLayoffGroupLabel,
  workExperienceOfficeGroupLabel,
} from "@/lib/utils/work-experience-questions"

interface CallNotesQuestionsSidebarProps {
  questions: GeneratedQuestion[]
  sectionMissingFields?: string[]
  sectionComplete?: boolean
  isLoading: boolean
  error: string | null
  emptyFields: EmptyField[]
  workExperiences?: WorkExperience[]
  certifications?: CandidateCertification[]
  achievements?: Achievement[]
  linkedinUrl?: string | null
  hasResume?: boolean
  currentSalary?: number | null
  expectedSalary?: number | null
  techStacks?: string[]
  section?: FieldSection
  activeQuestionField?: string | null
  onQuestionSelect?: (apiFieldName: string) => void
  onRetry?: () => void
  sessionAchievementIndices?: number[]
  pendingAchievementNavId?: `entry-${number}` | null
  onPendingAchievementNavHandled?: () => void
  onAddSessionAchievement?: () => void
  sessionCertificationIndices?: number[]
  pendingCertificationNavId?: `entry-${number}` | null
  onPendingCertificationNavHandled?: () => void
  onAddSessionCertification?: () => void
  sessionWorkExperienceIndices?: number[]
  pendingWorkExperienceNavId?: `entry-${number}` | null
  onPendingWorkExperienceNavHandled?: () => void
  sessionProjectsByRole?: Record<number, number[]>
  onAddSessionWorkExperience?: () => void
  onAddSessionProject?: (roleIndex: number) => void
  sessionQgLoadingKey?: string | null
  sessionQgFailedKeys?: string[]
  sessionQgErrorsByKey?: Record<string, string>
  onRetrySessionQgEntry?: (scopeKey: string) => void
  isCatalogEnriching?: boolean
  className?: string
}

type WorkExperienceRoleBlock = Extract<QuestionDisplayBlock, { type: "role-block" }>

type WorkExperienceSectionUnit =
  | {
      type: "role"
      id: string
      priority: number
      order: number
      questions: GeneratedQuestion[]
    }
  | {
      type: "employer"
      id: string
      priority: number
      order: number
    }
  | {
      type: "project"
      id: string
      priority: number
      order: number
      accordion: Extract<QuestionDisplayBlock, { type: "project-accordion" }>
    }

function readWorkExperienceField(
  workExperience: WorkExperience | undefined,
  key: string,
): unknown {
  if (!workExperience) return null
  return (workExperience as unknown as Record<string, unknown>)[key]
}

/** Full local missing count for a session-only WE scaffold (Role + Employer + projects). */
function countSessionWorkExperienceMissing(
  roleIndex: number,
  sessionProjectIndices: number[],
  workExperience?: WorkExperience,
): number {
  const roleMissing = WORK_EXPERIENCE_ROLE_FIELD_ORDER.length
  const employerMissing =
    WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.length +
    OFFICE_FIELD_ORDER.length +
    LAYOFF_FIELD_ORDER.length
  const includeProjectEmployerFields = !isWorkExperienceEmployerPresent(workExperience)
  const projectFieldCount = coldCallerQgProjectFieldDefs(includeProjectEmployerFields).length
  const projectIndices =
    sessionProjectIndices.length > 0 ? sessionProjectIndices : [0]
  return roleMissing + employerMissing + projectIndices.length * projectFieldCount
}

function countSessionAchievementMissing(): number {
  return ACHIEVEMENT_FIELD_ORDER.length
}

function countSessionCertificationMissing(): number {
  return CERTIFICATION_FIELD_ORDER.length
}

function buildWorkExperienceSectionUnits(
  block: WorkExperienceRoleBlock,
  workExperiences?: WorkExperience[],
  options?: { forceRoleAndEmployer?: boolean },
): WorkExperienceSectionUnit[] {
  let order = 0
  const units: WorkExperienceSectionUnit[] = []
  const we = workExperiences?.[block.roleIndex]
  const forceRoleAndEmployer = options?.forceRoleAndEmployer === true

  const roleQuestions = block.linkQuestions
  const roleHasPopulated = WORK_EXPERIENCE_ROLE_FIELD_ORDER.some((key) => {
    return !isQgValueMissing(readWorkExperienceField(we, key))
  })
  if (forceRoleAndEmployer || roleQuestions.length > 0 || roleHasPopulated) {
    units.push({
      type: "role",
      id: `role-${block.roleIndex}`,
      priority: Math.max(
        ...roleQuestions.map((question) => question.priority),
        ...WORK_EXPERIENCE_ROLE_FIELD_ORDER.map((key) => {
          const value = readWorkExperienceField(we, key)
          return !isQgValueMissing(value) ? WORK_EXPERIENCE_ROLE_PRIORITIES[key] : 0
        }),
        0,
      ),
      order: order++,
      questions: roleQuestions,
    })
  }

  const employerQuestions = [
    ...block.catalogQuestions,
    ...block.officeGroups.flatMap((group) => group.questions),
    ...block.layoffGroups.flatMap((group) => group.questions),
  ]
  const employerHasPopulated =
    WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.some((key) => {
      return !isQgValueMissing(readWorkExperienceField(we, key))
    }) ||
    (we?.locations ?? []).some((office) =>
      OFFICE_FIELD_ORDER.some((key) => !isQgValueMissing(office[key])),
    ) ||
    (we?.layoffs ?? []).some((layoff) =>
      LAYOFF_FIELD_ORDER.some((key) => !isQgValueMissing(layoff[key])),
    )
  if (forceRoleAndEmployer || employerQuestions.length > 0 || employerHasPopulated) {
    units.push({
      type: "employer",
      id: `employer-${block.roleIndex}`,
      priority: Math.max(
        ...employerQuestions.map((question) => question.priority),
        ...WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.map((key) => {
          const value = readWorkExperienceField(we, key)
          return !isQgValueMissing(value) ? WORK_EXPERIENCE_EMPLOYER_PRIORITIES[key] : 0
        }),
        0,
      ),
      order: order++,
    })
  }

  for (const accordion of block.projectAccordions) {
    const projectIndexMatch = /_project_(\d+)$/.exec(accordion.apiPrefix)
    const projectIndex = projectIndexMatch ? Number(projectIndexMatch[1]) : 0
    const weRow = workExperiences?.[block.roleIndex]
    const project = weRow?.projects?.[projectIndex]
    const includeProjectEmployerFields = !isWorkExperienceEmployerPresent(weRow)
    const populatedPriorities = project
      ? coldCallerQgProjectFieldDefs(includeProjectEmployerFields)
          .filter((field) => {
            const value = readLinkedProjectPayloadValue(project, field.payloadKey)
            return !isProjectCatalogFieldMissing(field.payloadKey, value)
          })
          .map((field) => COLD_CALLER_QG_PROJECT_PRIORITIES[field.apiSuffix] ?? 0)
      : []
    units.push({
      type: "project",
      id: accordion.apiPrefix,
      priority: Math.max(
        ...accordion.accordionQuestions.map((question) => question.priority),
        ...populatedPriorities,
        0,
      ),
      order: order++,
      accordion,
    })
  }

  // Structural Call Notes order: Role → Employer → Projects (by push order).
  return units
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority <= 0) return null
  return (
    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 tabular-nums shrink-0">
      {priority}
    </Badge>
  )
}

function ListValueBadges({
  items,
  badgeClassName,
  badgeVariant = "secondary",
}: {
  items: string[]
  badgeClassName: string
  badgeVariant?: QgListValueBadgeVariant
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = items.length > QG_LIST_VALUE_BADGE_MAX_DISPLAY
  const visible =
    shouldTruncate && !isExpanded
      ? items.slice(0, QG_LIST_VALUE_BADGE_MAX_DISPLAY)
      : items
  const remainingCount =
    shouldTruncate && !isExpanded ? items.length - QG_LIST_VALUE_BADGE_MAX_DISPLAY : 0

  return (
    <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
      {visible.map((item, index) => (
        <Badge
          key={`${item}-${index}`}
          variant={badgeVariant}
          className={cn(badgeClassName, "text-xs")}
        >
          {item}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              setIsExpanded(true)
            }
          }}
        >
          +{remainingCount} more
        </Badge>
      )}
      {isExpanded && shouldTruncate && (
        <Badge
          variant="outline"
          className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              setIsExpanded(false)
            }
          }}
        >
          Show less
        </Badge>
      )}
    </div>
  )
}

interface QuestionCardProps {
  question: GeneratedQuestion
  index: number
  label: string
  isSectionOpener: boolean
  isActive: boolean
  copiedField: string | null
  onSelect: (field: string) => void
  onCopy: (field: string, text: string, e: React.MouseEvent) => void
}

function EnumOptionChips({ options }: { options: string[] }) {
  const collapsible = options.length > QG_ENUM_OPTIONS_COLLAPSE_THRESHOLD
  const optionsKey = options.join("\0")
  const [expanded, setExpanded] = useState(!collapsible)

  useEffect(() => {
    setExpanded(!collapsible)
  }, [collapsible, optionsKey])

  const showChips = !collapsible || expanded

  return (
    <div className="mt-2 space-y-2">
      {collapsible ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs font-medium text-primary hover:text-primary"
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((prev) => !prev)
          }}
        >
          {expanded ? "Hide options" : `Show ${options.length} options`}
        </Button>
      ) : null}
      {showChips ? (
        <ul
          className="flex list-none flex-wrap gap-1.5 p-0"
          aria-label="Answer options"
        >
          {options.map((optionLabel) => (
            <li key={optionLabel}>
              <Badge
                variant="secondary"
                className="max-w-full whitespace-normal border-transparent bg-primary/20 text-left text-[11px] font-medium leading-snug text-foreground dark:bg-primary/30 dark:text-foreground"
              >
                {optionLabel}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function QuestionCard({
  question,
  index,
  label,
  isSectionOpener,
  isActive,
  copiedField,
  onSelect,
  onCopy,
}: QuestionCardProps) {
  const showListValueBadges =
    question.promptType === "enrichment" && (question.valueItems?.length ?? 0) > 0
  const listValueBadgeClass = qgListValueBadgeClass(question.field)
  const listValueBadgeVariant = qgListValueBadgeVariant(question.field)
  const enumOptions = question.options ?? []
  const showEnumOptions = !showListValueBadges && enumOptions.length > 0
  const copyText = formatQgQuestionCopyText(question)

  return (
    <li>
      <div
        className={cn(
          "rounded-md border border-transparent bg-card/40 hover:bg-muted flex items-stretch",
          isSectionOpener && "border-dashed border-border/60",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <button
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(question.field)}
            className="min-w-0 flex-1 text-left px-3 py-2.5 transition-colors"
          >
            <div className="mb-1.5 space-y-1">
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0 mt-0.5">
                  {index + 1}.
                </span>
                <MessageSquare
                  className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary"
                  aria-hidden
                />
                <span className="min-w-0 break-words text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
                {isSectionOpener && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4 shrink-0"
                  >
                    Section
                  </Badge>
                )}
                <div className="ml-auto shrink-0">
                  <PriorityBadge priority={question.priority} />
                </div>
              </div>
            </div>
            {showListValueBadges ? (
              <ListValueBadges
                items={question.valueItems!}
                badgeClassName={listValueBadgeClass}
                badgeVariant={listValueBadgeVariant}
              />
            ) : (
              <p className="text-sm font-medium leading-snug break-words text-foreground">
                {question.question}
              </p>
            )}
          </button>
          {showEnumOptions ? (
            <div className="px-3 pb-2.5 pt-0">
              <EnumOptionChips options={enumOptions} />
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-auto w-9 shrink-0 rounded-none rounded-r-md"
          aria-label={`Copy question for ${label}`}
          onClick={(e) => onCopy(question.field, copyText, e)}
        >
          {copiedField === question.field ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </li>
  )
}

export function CallNotesQuestionsSidebar({
  questions,
  sectionMissingFields,
  sectionComplete = false,
  isLoading,
  error,
  emptyFields,
  workExperiences,
  certifications,
  achievements,
  linkedinUrl,
  hasResume,
  currentSalary,
  expectedSalary,
  techStacks,
  section,
  activeQuestionField,
  onQuestionSelect,
  onRetry,
  sessionAchievementIndices = [],
  pendingAchievementNavId,
  onPendingAchievementNavHandled,
  onAddSessionAchievement,
  sessionCertificationIndices = [],
  pendingCertificationNavId,
  onPendingCertificationNavHandled,
  onAddSessionCertification,
  sessionWorkExperienceIndices = [],
  pendingWorkExperienceNavId,
  onPendingWorkExperienceNavHandled,
  sessionProjectsByRole = {},
  onAddSessionWorkExperience,
  onAddSessionProject,
  sessionQgLoadingKey = null,
  sessionQgFailedKeys = [],
  sessionQgErrorsByKey = {},
  onRetrySessionQgEntry,
  isCatalogEnriching = false,
  className,
}: CallNotesQuestionsSidebarProps) {
  const sessionQgActionsDisabled =
    isCatalogEnriching || sessionQgLoadingKey != null
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeEntryNavId, setActiveEntryNavId] = useState<QuestionEntryNavId>("overview")
  const [openWorkExperienceSectionId, setOpenWorkExperienceSectionId] =
    useState<string | null>(null)
  const pendingEntryNavIdRef = useRef<QuestionEntryNavId | null>(null)

  const sessionQgFailedKeySet = useMemo(
    () => new Set(sessionQgFailedKeys),
    [sessionQgFailedKeys],
  )
  const isSessionQgLoading = useCallback(
    (key: string) => sessionQgLoadingKey === key,
    [sessionQgLoadingKey],
  )
  const isSessionQgFailed = useCallback(
    (key: string) => sessionQgFailedKeySet.has(key),
    [sessionQgFailedKeySet],
  )
  const canFillSessionAskCues = useCallback(
    (key: string) => !isSessionQgLoading(key) && !isSessionQgFailed(key),
    [isSessionQgFailed, isSessionQgLoading],
  )
  const renderSessionQgEntryFailure = useCallback(
    (key: string) => (
      <div className="flex flex-col items-start gap-2 px-1 py-3" role="alert">
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
          <p className="text-left">
            {sessionQgErrorsByKey[key] ?? "Failed to generate questions"}
          </p>
        </div>
        {onRetrySessionQgEntry && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onRetrySessionQgEntry(key)}
          >
            Try Again
          </Button>
        )}
      </div>
    ),
    [onRetrySessionQgEntry, sessionQgErrorsByKey],
  )

  const fieldMetaByApiName = useMemo(
    () => buildQuestionFieldLabelMap(emptyFields),
    [emptyFields],
  )

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return a.field.localeCompare(b.field)
    })
  }, [questions])

  const uniqueMissingFields = useMemo(
    () => (sectionMissingFields ? dedupeApiFieldNames(sectionMissingFields) : undefined),
    [sectionMissingFields],
  )

  const hasGenerated =
    sectionMissingFields != null || sectionComplete || sortedQuestions.length > 0

  const useAccordionLayout =
    section === "workExperience" || section === "certifications" || section === "achievements"

  const entryNavSection: QuestionEntryNavSection | null =
    section === "workExperience" || section === "certifications" || section === "achievements"
      ? section
      : null

  const displayBlocks = useMemo(() => {
    if (!useAccordionLayout || !section) return null
    const grouped = groupQuestionsForDisplay(section, sortedQuestions)

    if (section === "workExperience") {
      const byRole = new Map<number, Extract<QuestionDisplayBlock, { type: "role-block" }>>()
      for (const block of grouped) {
        if (block.type === "role-block") byRole.set(block.roleIndex, block)
      }

      const roleIndices = new Set<number>([
        ...byRole.keys(),
        ...Array.from({ length: workExperiences?.length ?? 0 }, (_, i) => i),
        ...sessionWorkExperienceIndices,
      ])
      if (roleIndices.size === 0 && hasGenerated) roleIndices.add(0)

      const roleBlocks: QuestionDisplayBlock[] = [...roleIndices]
        .sort((a, b) => a - b)
        .map((roleIndex) => {
          const existing = byRole.get(roleIndex)
          const projectAccordions: ProjectQuestionAccordion[] = [
            ...(existing?.projectAccordions ?? []),
          ]
          const existingPrefixes = new Set(
            projectAccordions.map((accordion) => accordion.apiPrefix),
          )
          const projects = workExperiences?.[roleIndex]?.projects ?? []
          const isSessionWorkExperience =
            sessionWorkExperienceIndices.includes(roleIndex)
          const projectIndices =
            projects.length > 0
              ? projects.map((_, projectIndex) => projectIndex)
              : hasGenerated || isSessionWorkExperience
                ? [0]
                : []

          for (const projectIndex of projectIndices) {
            const apiPrefix = `work_experience_${roleIndex}_project_${projectIndex}`
            if (existingPrefixes.has(apiPrefix)) continue
            projectAccordions.push({
              type: "project-accordion",
              title: projects[projectIndex]?.projectName || `Project ${projectIndex + 1}`,
              apiPrefix,
              layout: "nested-work-experience",
              linkQuestions: [],
              catalogQuestions: [],
              accordionQuestions: [],
            })
            existingPrefixes.add(apiPrefix)
          }

          // TEMP: append session-only projects after resume / synthetic project sections.
          // Local UI only — do not re-call Generate Questions / Candidate API.
          for (const projectIndex of sessionProjectsByRole[roleIndex] ?? []) {
            const apiPrefix = `work_experience_${roleIndex}_project_${projectIndex}`
            if (existingPrefixes.has(apiPrefix)) continue
            projectAccordions.push({
              type: "project-accordion",
              title: `Project ${projectIndex + 1}`,
              apiPrefix,
              layout: "nested-work-experience",
              linkQuestions: [],
              catalogQuestions: [],
              accordionQuestions: [],
            })
            existingPrefixes.add(apiPrefix)
          }

          projectAccordions.sort((a, b) => a.apiPrefix.localeCompare(b.apiPrefix))

          const we = workExperiences?.[roleIndex]
          const officeByIndex = new Map(
            (existing?.officeGroups ?? []).map((group) => [group.officeIndex, group]),
          )
          const officeIndices = new Set<number>([
            ...officeByIndex.keys(),
            ...Array.from({ length: we?.locations?.length ?? 0 }, (_, i) => i),
          ])
          if (officeIndices.size === 0 && (hasGenerated || isSessionWorkExperience)) {
            officeIndices.add(0)
          }

          const layoffByIndex = new Map(
            (existing?.layoffGroups ?? []).map((group) => [group.layoffIndex, group]),
          )
          const layoffIndices = new Set<number>([
            ...layoffByIndex.keys(),
            ...Array.from({ length: we?.layoffs?.length ?? 0 }, (_, i) => i),
          ])
          if (layoffIndices.size === 0 && (hasGenerated || isSessionWorkExperience)) {
            layoffIndices.add(0)
          }

          return {
            type: "role-block" as const,
            roleIndex,
            title: existing?.title ?? `Work Experience ${roleIndex + 1}`,
            linkQuestions: existing?.linkQuestions ?? [],
            catalogQuestions: existing?.catalogQuestions ?? [],
            officeGroups: [...officeIndices]
              .sort((a, b) => a - b)
              .map((officeIndex) => ({
                officeIndex,
                questions: officeByIndex.get(officeIndex)?.questions ?? [],
              })),
            layoffGroups: [...layoffIndices]
              .sort((a, b) => a - b)
              .map((layoffIndex) => ({
                layoffIndex,
                questions: layoffByIndex.get(layoffIndex)?.questions ?? [],
              })),
            projectsOpener: existing?.projectsOpener ?? null,
            projectAccordions,
          }
        })

      return roleBlocks
    }

    if (section === "certifications") {
      const byIndex = new Map<
        number,
        Extract<QuestionDisplayBlock, { type: "certification-block" }>
      >()
      for (const block of grouped) {
        if (block.type === "certification-block") byIndex.set(block.certIndex, block)
      }
      const indices = new Set<number>([
        ...byIndex.keys(),
        ...Array.from({ length: certifications?.length ?? 0 }, (_, i) => i),
        ...sessionCertificationIndices,
      ])
      if (indices.size === 0 && hasGenerated) indices.add(0)

      return [...indices]
        .sort((a, b) => a - b)
        .map((certIndex) => {
          const existing = byIndex.get(certIndex)
          return {
            type: "certification-block" as const,
            certIndex,
            title: existing?.title ?? `Certification ${certIndex + 1}`,
            linkQuestions: existing?.linkQuestions ?? [],
            catalogQuestions: existing?.catalogQuestions ?? [],
          }
        })
    }

    if (section === "achievements") {
      const byIndex = new Map<
        number,
        Extract<QuestionDisplayBlock, { type: "achievement-block" }>
      >()
      for (const block of grouped) {
        if (block.type === "achievement-block") byIndex.set(block.achievementIndex, block)
      }
      const indices = new Set<number>([
        ...byIndex.keys(),
        ...Array.from({ length: achievements?.length ?? 0 }, (_, i) => i),
        ...sessionAchievementIndices,
      ])
      if (indices.size === 0 && hasGenerated) indices.add(0)

      return [...indices]
        .sort((a, b) => a - b)
        .map((achievementIndex) => {
          const existing = byIndex.get(achievementIndex)
          return {
            type: "achievement-block" as const,
            achievementIndex,
            title: existing?.title ?? `Achievement ${achievementIndex + 1}`,
            questions: existing?.questions ?? [],
          }
        })
    }

    return grouped
  }, [
    section,
    sortedQuestions,
    useAccordionLayout,
    workExperiences,
    certifications,
    achievements,
    hasGenerated,
    sessionProjectsByRole,
    sessionWorkExperienceIndices,
    sessionAchievementIndices,
    sessionCertificationIndices,
  ])

  const accordionSplit = useMemo(() => {
    if (!displayBlocks) return null
    return splitAccordionBlocks(displayBlocks)
  }, [displayBlocks])

  const entryNavChrome = useMemo(() => {
    if (!accordionSplit) return "hidden" as const
    // Work Experience: Select whenever there are 2+ entries; no chrome for a single entry.
    if (entryNavSection === "workExperience") {
      return accordionSplit.entryCount > 1 ? ("select" as const) : ("hidden" as const)
    }
    if (entryNavSection === "achievements" || entryNavSection === "certifications") {
      return "select" as const
    }
    return resolveQuestionEntryNavChrome(
      accordionSplit.entryCount,
      accordionSplit.hasOverviewQuestions,
    )
  }, [accordionSplit, entryNavSection])

  const entryNavItems = useMemo(() => {
    if (!entryNavSection || !accordionSplit || entryNavChrome === "hidden") return []
    const missing = uniqueMissingFields ?? []
    const countEntryMissing = (index: number) => {
      if (entryNavSection === "workExperience") {
        if (sessionWorkExperienceIndices.includes(index)) {
          return countSessionWorkExperienceMissing(
            index,
            sessionProjectsByRole[index] ?? [],
            workExperiences?.[index],
          )
        }
        const sessionExtra = (sessionProjectsByRole[index] ?? []).reduce((sum) => {
          const we = workExperiences?.[index]
          const includeEmployer = !isWorkExperienceEmployerPresent(we)
          return sum + coldCallerQgProjectFieldDefs(includeEmployer).length
        }, 0)
        return countMissingFieldsForWorkExperienceCard(missing, index) + sessionExtra
      }
      if (entryNavSection === "achievements") {
        if (sessionAchievementIndices.includes(index)) {
          return countSessionAchievementMissing()
        }
        return countMissingFieldsForAchievementCard(missing, index)
      }
      if (sessionCertificationIndices.includes(index)) {
        return countSessionCertificationMissing()
      }
      return countMissingFieldsForCertificationCard(missing, index)
    }
    return buildQuestionEntryNavItems({
      section: entryNavSection,
      entryBlocks: accordionSplit.entryBlocks,
      includeOverview: false,
      missingFields: uniqueMissingFields,
      countEntryMissing,
      workExperiences,
      certifications,
      achievements,
    })
  }, [
    entryNavSection,
    accordionSplit,
    entryNavChrome,
    uniqueMissingFields,
    workExperiences,
    certifications,
    achievements,
    sessionProjectsByRole,
    sessionWorkExperienceIndices,
    sessionAchievementIndices,
    sessionCertificationIndices,
  ])

  useEffect(() => {
    if (pendingAchievementNavId) {
      pendingEntryNavIdRef.current = pendingAchievementNavId
      onPendingAchievementNavHandled?.()
    }
  }, [pendingAchievementNavId, onPendingAchievementNavHandled])

  useEffect(() => {
    if (pendingCertificationNavId) {
      pendingEntryNavIdRef.current = pendingCertificationNavId
      onPendingCertificationNavHandled?.()
    }
  }, [pendingCertificationNavId, onPendingCertificationNavHandled])

  useEffect(() => {
    if (pendingWorkExperienceNavId) {
      pendingEntryNavIdRef.current = pendingWorkExperienceNavId
      onPendingWorkExperienceNavHandled?.()
    }
  }, [pendingWorkExperienceNavId, onPendingWorkExperienceNavHandled])

  useEffect(() => {
    if (!accordionSplit) {
      pendingEntryNavIdRef.current = null
      setActiveEntryNavId("overview")
      return
    }
    if (pendingEntryNavIdRef.current) {
      setActiveEntryNavId(pendingEntryNavIdRef.current)
      pendingEntryNavIdRef.current = null
      return
    }
    setActiveEntryNavId(
      defaultQuestionEntryNavId(entryNavChrome, accordionSplit.entryBlocks, false),
    )
  }, [section, entryNavSection, entryNavChrome, accordionSplit])

  const visibleBlocks = useMemo(() => {
    if (!displayBlocks) return null
    if (entryNavChrome === "hidden") return displayBlocks
    return filterBlocksForEntryNav(displayBlocks, activeEntryNavId)
  }, [displayBlocks, entryNavChrome, activeEntryNavId])

  const activeWorkExperienceSections = useMemo(() => {
    if (section !== "workExperience" || !visibleBlocks) return []
    const roleBlock = visibleBlocks.find(
      (block): block is WorkExperienceRoleBlock => block.type === "role-block",
    )
    if (!roleBlock) return []
    return buildWorkExperienceSectionUnits(roleBlock, workExperiences, {
      forceRoleAndEmployer: sessionWorkExperienceIndices.includes(roleBlock.roleIndex),
    })
  }, [section, visibleBlocks, workExperiences, sessionWorkExperienceIndices])

  useEffect(() => {
    const sectionIds = activeWorkExperienceSections.map((unit) => unit.id)
    setOpenWorkExperienceSectionId((current) =>
      current && sectionIds.includes(current) ? current : (sectionIds[0] ?? null),
    )
  }, [activeWorkExperienceSections])

  // Project QG spinner lives inside the project collapsible — open that unit while
  // incremental generate is in flight so the status is visible in the panel.
  useEffect(() => {
    if (!sessionQgLoadingKey) return
    const match = /^we:(\d+):project:(\d+)$/.exec(sessionQgLoadingKey)
    if (!match) return
    const roleIndex = Number(match[1])
    const projectIndex = Number(match[2])
    setActiveEntryNavId(`entry-${roleIndex}`)
    setOpenWorkExperienceSectionId(
      `work_experience_${roleIndex}_project_${projectIndex}`,
    )
  }, [sessionQgLoadingKey])

  const handleCopy = (apiFieldName: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(apiFieldName)
      toast.success("Copied")
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const resolveMeta = (field: string) =>
    fieldMetaByApiName.get(field) ?? resolveQuestionFieldMeta(field, emptyFields)

  const renderProjectAccordionBlock = (
    accordion: Extract<QuestionDisplayBlock, { type: "project-accordion" }>,
    globalIndex: number,
  ): { section: React.ReactNode; nextIndex: number } => {
    const rendered = renderQuestionList(accordion.accordionQuestions, globalIndex)
    return {
      nextIndex: rendered.nextIndex,
      section: (
        <ProjectCatalogCollapsible key={accordion.apiPrefix} label={accordion.title}>
          <ul className="space-y-1 w-full" role="list">
            {rendered.nodes}
          </ul>
        </ProjectCatalogCollapsible>
      ),
    }
  }

  const renderQuestionList = (
    items: GeneratedQuestion[],
    startIndex: number,
  ): { nodes: React.ReactNode[]; nextIndex: number } => {
    let idx = startIndex
    const nodes = items.map((question) => {
      const meta = resolveMeta(question.field)
      const node = (
        <QuestionCard
          key={`${question.field}-${idx}`}
          question={question}
          index={idx}
          label={meta.label}
          isSectionOpener={meta.isSectionOpener}
          isActive={activeQuestionField === question.field}
          copiedField={copiedField}
          onSelect={(field) => onQuestionSelect?.(field)}
          onCopy={handleCopy}
        />
      )
      idx += 1
      return node
    })
    return { nodes, nextIndex: idx }
  }

  const renderBlocks = (
    blocks: QuestionDisplayBlock[],
    options?: { hideEntryCardChrome?: boolean },
  ) => {
    const hideEntryCardChrome = options?.hideEntryCardChrome ?? false
    let globalIndex = 0
    const sections: React.ReactNode[] = []

    for (const block of blocks) {
      if (block.type === "flat") {
        const { nodes, nextIndex } = renderQuestionList(block.questions, globalIndex)
        globalIndex = nextIndex
        sections.push(
          <ul key={`flat-${globalIndex}`} className="space-y-1" role="list">
            {nodes}
          </ul>,
        )
        continue
      }

      if (block.type === "role-block") {
        const sessionProjectIndices = new Set(sessionProjectsByRole[block.roleIndex] ?? [])
        const isSessionWorkExperience = sessionWorkExperienceIndices.includes(
          block.roleIndex,
        )
        const weSessionKey = `we:${block.roleIndex}`
        const weSessionLoading = isSessionQgLoading(weSessionKey)
        const weSessionFailed = isSessionQgFailed(weSessionKey)
        const weForRole = workExperiences?.[block.roleIndex]
        const includeProjectEmployerFieldsForRole = !isWorkExperienceEmployerPresent(weForRole)
        const sessionProjectMissingExtra = isSessionWorkExperience
          ? 0
          : [...sessionProjectIndices].reduce(
              (sum) =>
                sum +
                coldCallerQgProjectFieldDefs(includeProjectEmployerFieldsForRole).length,
              0,
            )
        const cardMissingCount = isSessionWorkExperience
          ? countSessionWorkExperienceMissing(
              block.roleIndex,
              sessionProjectsByRole[block.roleIndex] ?? [],
              weForRole,
            )
          : (section === "workExperience" && uniqueMissingFields
              ? countMissingFieldsForWorkExperienceCard(
                  uniqueMissingFields,
                  block.roleIndex,
                )
              : 0) + sessionProjectMissingExtra
        const cardSubtitle =
          section === "workExperience"
            ? formatWorkExperienceCardSubtitle(workExperiences?.[block.roleIndex])
            : null

        const roleUnits = buildWorkExperienceSectionUnits(block, workExperiences, {
          forceRoleAndEmployer: isSessionWorkExperience,
        })
        const missingFieldSet = new Set(uniqueMissingFields ?? [])
        const countUnitMissing = (unit: WorkExperienceSectionUnit): number => {
          if (unit.type === "role") {
            if (isSessionWorkExperience) {
              return WORK_EXPERIENCE_ROLE_FIELD_ORDER.length
            }
            return WORK_EXPERIENCE_ROLE_FIELD_ORDER.filter((key) =>
              missingFieldSet.has(`work_experience_${block.roleIndex}_${key}`),
            ).length
          }
          if (unit.type === "project") {
            const weForCount = workExperiences?.[block.roleIndex]
            const includeProjectEmployerFields = !isWorkExperienceEmployerPresent(weForCount)
            const projectIndexMatch = /_project_(\d+)$/.exec(unit.accordion.apiPrefix)
            const projectIndex = projectIndexMatch ? Number(projectIndexMatch[1]) : 0
            if (sessionProjectIndices.has(projectIndex)) {
              return coldCallerQgProjectFieldDefs(includeProjectEmployerFields).length
            }
            return coldCallerQgProjectFieldDefs(includeProjectEmployerFields).filter((field) =>
              missingFieldSet.has(`${unit.accordion.apiPrefix}_${field.apiSuffix}`),
            ).length
          }
          if (isSessionWorkExperience) {
            return (
              WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.length +
              block.officeGroups.length * OFFICE_FIELD_ORDER.length +
              block.layoffGroups.length * LAYOFF_FIELD_ORDER.length
            )
          }
          const employerScalarMissing = WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.filter((key) =>
            missingFieldSet.has(`work_experience_${block.roleIndex}_${key}`),
          ).length
          const officeMissing = block.officeGroups.reduce((sum, group) => {
            return (
              sum +
              OFFICE_FIELD_ORDER.filter((key) =>
                missingFieldSet.has(
                  `work_experience_${block.roleIndex}_office_${group.officeIndex}_${key}`,
                ),
              ).length
            )
          }, 0)
          const layoffMissing = block.layoffGroups.reduce((sum, group) => {
            return (
              sum +
              LAYOFF_FIELD_ORDER.filter((key) =>
                missingFieldSet.has(
                  `work_experience_${block.roleIndex}_layoff_${group.layoffIndex}_${key}`,
                ),
              ).length
            )
          }, 0)
          return employerScalarMissing + officeMissing + layoffMissing
        }

        const roleContent = (
          <>
            {roleUnits.map((unit) => {
          const isOpen = openWorkExperienceSectionId === unit.id
          const onOpenChange = (open: boolean) => {
            setOpenWorkExperienceSectionId(open ? unit.id : null)
          }
          const missingCount = countUnitMissing(unit)

          if (unit.type === "role") {
            const we = workExperiences?.[block.roleIndex]
            const questionByField = new Map(
              unit.questions.map((question) => [question.field, question]),
            )
            const roleCards = mergeValueAndQuestionCards(
              WORK_EXPERIENCE_ROLE_FIELD_ORDER.map((key) => {
                const value = readWorkExperienceField(we, key)
                const formatValue =
                  key === "shiftType"
                    ? (v: unknown) =>
                        shiftTypeDisplayLabel(
                          typeof v === "string" ? v : v == null ? null : String(v),
                        )
                    : key === "workMode"
                      ? (v: unknown) =>
                          workModeDisplayLabel(
                            typeof v === "string" ? v : v == null ? null : String(v),
                          )
                      : undefined
                return {
                  apiFieldName: `work_experience_${block.roleIndex}_${key}`,
                  label: WORK_EXPERIENCE_FIELD_LABELS[key] ?? key,
                  priority: WORK_EXPERIENCE_ROLE_PRIORITIES[key],
                  value,
                  ...(formatValue ? { formatValue } : {}),
                }
              }),
              questionByField,
              "workExperience",
              {
                fillAskCues:
                  isSessionWorkExperience &&
                  canFillSessionAskCues(`we:${block.roleIndex}`),
              },
            )
            const rendered = renderQuestionList(roleCards, globalIndex)
            globalIndex = rendered.nextIndex
            return (
              <ProjectCatalogCollapsible
                key={unit.id}
                label="Role Details"
                open={isOpen}
                onOpenChange={onOpenChange}
                missingCount={missingCount}
              >
                <ul className="space-y-1" role="list">
                  {rendered.nodes}
                </ul>
              </ProjectCatalogCollapsible>
            )
          }

          if (unit.type === "project") {
            const projectIndexMatch = /_project_(\d+)$/.exec(unit.accordion.apiPrefix)
            const projectIndex = projectIndexMatch ? Number(projectIndexMatch[1]) : 0
            const isSessionAdded = sessionProjectIndices.has(projectIndex)
            const weForProject = workExperiences?.[block.roleIndex]
            const project = weForProject?.projects?.[projectIndex]
            const includeProjectEmployerFields = !isWorkExperienceEmployerPresent(weForProject)
            const questionByField = new Map(
              unit.accordion.accordionQuestions.map((question) => [
                question.field,
                question,
              ]),
            )
            const projectRows = coldCallerQgProjectFieldDefs(includeProjectEmployerFields).flatMap(
              (field) => {
              const apiFieldName = `${unit.accordion.apiPrefix}_${field.apiSuffix}`
              const value = project
                ? readLinkedProjectPayloadValue(project, field.payloadKey)
                : null

              // Contribution: always show QG Advanced question when present; never a
              // populated value card. Session-only local ask cues only when no QG yet.
              if (field.apiSuffix === "contributionNotes") {
                const question = questionByField.get(apiFieldName)
                if (question) {
                  const rendered = renderQuestionList([question], globalIndex)
                  globalIndex = rendered.nextIndex
                  return [
                    <ul key={apiFieldName} className="space-y-1" role="list">
                      {rendered.nodes}
                    </ul>,
                  ]
                }
                if (
                  !isSessionAdded ||
                  !canFillSessionAskCues(
                    `we:${block.roleIndex}:project:${projectIndex}`,
                  )
                ) {
                  return []
                }
                const askCue: GeneratedQuestion = {
                  question: `Ask about ${field.label}`,
                  field: apiFieldName,
                  section: "workExperience",
                  priority: COLD_CALLER_QG_PROJECT_PRIORITIES[field.apiSuffix] ?? 0,
                  context: "",
                  promptType: "basic",
                }
                const rendered = renderQuestionList([askCue], globalIndex)
                globalIndex = rendered.nextIndex
                return [
                  <ul key={apiFieldName} className="space-y-1" role="list">
                    {rendered.nodes}
                  </ul>,
                ]
              }

              if (
                project &&
                !isProjectCatalogFieldMissing(field.payloadKey, value)
              ) {
                const valueItems = toQgListValueItems(apiFieldName, value)
                const valueCard: GeneratedQuestion = {
                  question: formatQgDisplayValue(value),
                  field: apiFieldName,
                  section: "workExperience",
                  priority: COLD_CALLER_QG_PROJECT_PRIORITIES[field.apiSuffix] ?? 0,
                  context: "",
                  promptType: "enrichment",
                  ...(valueItems ? { valueItems } : {}),
                }
                const rendered = renderQuestionList([valueCard], globalIndex)
                globalIndex = rendered.nextIndex
                return [
                  <ul key={apiFieldName} className="space-y-1" role="list">
                    {rendered.nodes}
                  </ul>,
                ]
              }

              const question = questionByField.get(apiFieldName)
              if (!question) {
                if (
                  !isSessionAdded ||
                  !canFillSessionAskCues(
                    `we:${block.roleIndex}:project:${projectIndex}`,
                  )
                ) {
                  return []
                }
                const askCue: GeneratedQuestion = {
                  question: `Ask about ${field.label}`,
                  field: apiFieldName,
                  section: "workExperience",
                  priority: COLD_CALLER_QG_PROJECT_PRIORITIES[field.apiSuffix] ?? 0,
                  context: "",
                  promptType: "basic",
                }
                const rendered = renderQuestionList([askCue], globalIndex)
                globalIndex = rendered.nextIndex
                return [
                  <ul key={apiFieldName} className="space-y-1" role="list">
                    {rendered.nodes}
                  </ul>,
                ]
              }
              const rendered = renderQuestionList([question], globalIndex)
              globalIndex = rendered.nextIndex
              return [
                <ul key={apiFieldName} className="space-y-1" role="list">
                  {rendered.nodes}
                </ul>,
              ]
            },
            )

            const projectName = project?.projectName?.trim()
            const projectSessionKey = `we:${block.roleIndex}:project:${projectIndex}`
            const projectSessionLoading = isSessionQgLoading(projectSessionKey)
            const projectSessionFailed = isSessionQgFailed(projectSessionKey)
            return (
              <ProjectCatalogCollapsible
                key={unit.id}
                label={projectName || `Project ${projectIndex + 1}`}
                open={isOpen || projectSessionLoading || projectSessionFailed}
                onOpenChange={onOpenChange}
                missingCount={missingCount}
              >
                {projectSessionLoading ? (
                  <div className="flex items-center gap-2 px-1 py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating questions…
                  </div>
                ) : projectSessionFailed ? (
                  renderSessionQgEntryFailure(projectSessionKey)
                ) : (
                  <div className="space-y-1">{projectRows}</div>
                )}
              </ProjectCatalogCollapsible>
            )
          }

          const we = workExperiences?.[block.roleIndex]
          const catalogByField = new Map(
            block.catalogQuestions.map((question) => [question.field, question]),
          )
          const employerScalarCards = mergeValueAndQuestionCards(
            WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.map((key) => {
              const value = readWorkExperienceField(we, key)
              const formatValue =
                key === "salaryPolicy"
                  ? (v: unknown) =>
                      salaryPolicyDisplayLabel(
                        typeof v === "string" ? v : v == null ? null : String(v),
                      )
                  : undefined
              return {
                apiFieldName: `work_experience_${block.roleIndex}_${key}`,
                label: WORK_EXPERIENCE_FIELD_LABELS[key] ?? key,
                priority: WORK_EXPERIENCE_EMPLOYER_PRIORITIES[key],
                value,
                ...(formatValue ? { formatValue } : {}),
              }
            }),
            catalogByField,
            "workExperience",
            {
              fillAskCues:
                isSessionWorkExperience &&
                canFillSessionAskCues(`we:${block.roleIndex}`),
            },
          )

          type EmployerCardChunk = {
            priority: number
            order: number
            nodes: ReactNode
          }
          const employerChunks: EmployerCardChunk[] = []
          let chunkOrder = 0

          for (const card of employerScalarCards) {
            const suffix = card.field.replace(/^work_experience_\d+_/, "")
            const rendered = renderQuestionList([card], globalIndex)
            globalIndex = rendered.nextIndex
            employerChunks.push({
              priority: WORK_EXPERIENCE_EMPLOYER_PRIORITIES[suffix] ?? card.priority,
              order: chunkOrder++,
              nodes: (
                <ul key={card.field} className="space-y-1" role="list">
                  {rendered.nodes}
                </ul>
              ),
            })
          }

          for (const officeGroup of block.officeGroups) {
            const officeRow = we?.locations?.[officeGroup.officeIndex]
            const questionByField = new Map(
              officeGroup.questions.map((question) => [question.field, question]),
            )
            const officeCards = mergeValueAndQuestionCards(
              OFFICE_FIELD_ORDER.map((key) => ({
                apiFieldName: `work_experience_${block.roleIndex}_office_${officeGroup.officeIndex}_${key}`,
                label: WORK_EXPERIENCE_FIELD_LABELS[key] ?? key,
                priority: OFFICE_FIELD_PRIORITIES[key],
                value: officeRow ? officeRow[key] : null,
              })),
              questionByField,
              "workExperience",
              {
                fillAskCues:
                  isSessionWorkExperience &&
                  canFillSessionAskCues(`we:${block.roleIndex}`),
              },
            )
            for (const card of officeCards) {
              const rendered = renderQuestionList([card], globalIndex)
              globalIndex = rendered.nextIndex
              const suffixMatch = /_office_\d+_([^_]+)$/.exec(card.field)
              const suffix = suffixMatch?.[1] ?? ""
              employerChunks.push({
                priority: OFFICE_FIELD_PRIORITIES[suffix] ?? card.priority,
                order: chunkOrder++,
                nodes: (
                  <div key={card.field} className="space-y-1">
                    {officeCards[0] === card && (
                      <p className="text-[10px] font-medium text-muted-foreground px-1 pt-1">
                        {workExperienceOfficeGroupLabel(officeGroup.officeIndex)}
                      </p>
                    )}
                    <ul className="space-y-1" role="list">
                      {rendered.nodes}
                    </ul>
                  </div>
                ),
              })
            }
          }

          for (const layoffGroup of block.layoffGroups) {
            const layoffRow = we?.layoffs?.[layoffGroup.layoffIndex]
            const questionByField = new Map(
              layoffGroup.questions.map((question) => [question.field, question]),
            )
            const layoffCards = mergeValueAndQuestionCards(
              LAYOFF_FIELD_ORDER.map((key) => {
                const value = layoffRow ? layoffRow[key] : null
                const formatValue =
                  key === "reason"
                    ? (v: unknown) =>
                        layoffReasonDisplayLabel(
                          typeof v === "string" ? v : v == null ? null : String(v),
                        )
                    : undefined
                return {
                  apiFieldName: `work_experience_${block.roleIndex}_layoff_${layoffGroup.layoffIndex}_${key}`,
                  label: WORK_EXPERIENCE_FIELD_LABELS[key] ?? key,
                  priority: LAYOFF_FIELD_PRIORITIES[key],
                  value,
                  ...(formatValue ? { formatValue } : {}),
                }
              }),
              questionByField,
              "workExperience",
              {
                fillAskCues:
                  isSessionWorkExperience &&
                  canFillSessionAskCues(`we:${block.roleIndex}`),
              },
            )
            for (const card of layoffCards) {
              const rendered = renderQuestionList([card], globalIndex)
              globalIndex = rendered.nextIndex
              const suffixMatch = /_layoff_\d+_([^_]+)$/.exec(card.field)
              const suffix = suffixMatch?.[1] ?? ""
              employerChunks.push({
                priority: LAYOFF_FIELD_PRIORITIES[suffix] ?? card.priority,
                order: chunkOrder++,
                nodes: (
                  <div key={card.field} className="space-y-1">
                    {layoffCards[0] === card && (
                      <p className="text-[10px] font-medium text-muted-foreground px-1 pt-1">
                        {workExperienceLayoffGroupLabel(layoffGroup.layoffIndex)}
                      </p>
                    )}
                    <ul className="space-y-1" role="list">
                      {rendered.nodes}
                    </ul>
                  </div>
                ),
              })
            }
          }

          employerChunks.sort(
            (a, b) => b.priority - a.priority || a.order - b.order,
          )

          return (
            <ProjectCatalogCollapsible
              key={unit.id}
              label="Employer Details"
              open={isOpen}
              onOpenChange={onOpenChange}
              missingCount={missingCount}
            >
              <div className="space-y-1 w-full">
                {employerChunks.map((chunk) => chunk.nodes)}
              </div>
            </ProjectCatalogCollapsible>
          )
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={() => onAddSessionProject?.(block.roleIndex)}
              disabled={isLoading || sessionQgActionsDisabled}
            >
              <Plus className="h-3.5 w-3.5" />
              Add project
            </Button>
          </>
        )

        sections.push(
          <div
            key={`role-${block.roleIndex}`}
            className={cn(
              "space-y-2",
              !hideEntryCardChrome && "rounded-md border border-border/60 p-2",
            )}
          >
            {!hideEntryCardChrome && (
              <div className="px-1">
                <p className="text-xs font-semibold text-foreground">{block.title}</p>
                {cardSubtitle && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={cardSubtitle}>
                    {cardSubtitle}
                  </p>
                )}
                {cardMissingCount > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {cardMissingCount} missing
                  </p>
                )}
              </div>
            )}
            {weSessionLoading ? (
              <div className="flex items-center gap-2 px-1 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating questions…
              </div>
            ) : weSessionFailed ? (
              renderSessionQgEntryFailure(weSessionKey)
            ) : (
              roleContent
            )}
          </div>,
        )
        continue
      }

      if (block.type === "certification-block") {
        const cardMissingCount =
          section === "certifications" && uniqueMissingFields
            ? countMissingFieldsForCertificationCard(uniqueMissingFields, block.certIndex)
            : 0
        const cardSubtitle =
          section === "certifications"
            ? formatCertificationCardSubtitle(certifications?.[block.certIndex]?.certificationName)
            : null

        const questionByField = new Map(
          [...block.linkQuestions, ...block.catalogQuestions].map((question) => [
            question.field,
            question,
          ]),
        )
        const cert = certifications?.[block.certIndex]
        const isSessionCertification = sessionCertificationIndices.includes(
          block.certIndex,
        )
        const certSessionKey = `cert:${block.certIndex}`
        const certSessionLoading = isSessionQgLoading(certSessionKey)
        const certSessionFailed = isSessionQgFailed(certSessionKey)
        // Weight-descending: Name → Issuing Body → Issue Date → Expiry Date
        const certCards = mergeValueAndQuestionCards(
          [
            {
              apiFieldName: `certification_${block.certIndex}_name`,
              label: "Name",
              priority: CERTIFICATION_FIELD_PRIORITIES.name,
              value: cert?.certificationName,
            },
            {
              apiFieldName: `certification_${block.certIndex}_issuingBody`,
              label: "Issuing Body",
              priority: CERTIFICATION_FIELD_PRIORITIES.issuingBody,
              value: cert?.issuingBody ?? cert?.certificationIssuerName,
            },
            {
              apiFieldName: `certification_${block.certIndex}_issueDate`,
              label: "Issue Date",
              priority: CERTIFICATION_FIELD_PRIORITIES.issueDate,
              value: cert?.issueDate,
            },
            {
              apiFieldName: `certification_${block.certIndex}_expiryDate`,
              label: "Expiry Date",
              priority: CERTIFICATION_FIELD_PRIORITIES.expiryDate,
              value: cert?.expiryDate,
            },
          ],
          questionByField,
          "certifications",
          {
            fillAskCues:
              isSessionCertification &&
              canFillSessionAskCues(`cert:${block.certIndex}`),
          },
        )
        const rendered = renderQuestionList(certCards, globalIndex)
        globalIndex = rendered.nextIndex

        sections.push(
          <div
            key={`cert-${block.certIndex}`}
            className={cn(
              "space-y-2",
              !hideEntryCardChrome && "rounded-md border border-border/60 p-2",
            )}
          >
            {!hideEntryCardChrome && (
              <div className="px-1">
                <p className="text-xs font-semibold text-foreground">{block.title}</p>
                {cardSubtitle && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={cardSubtitle}>
                    {cardSubtitle}
                  </p>
                )}
                {cardMissingCount > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {cardMissingCount} missing
                  </p>
                )}
              </div>
            )}
            {certSessionLoading ? (
              <div className="flex items-center gap-2 px-1 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating questions…
              </div>
            ) : certSessionFailed ? (
              renderSessionQgEntryFailure(certSessionKey)
            ) : (
              rendered.nodes.length > 0 && (
                <ul className="space-y-1" role="list">
                  {rendered.nodes}
                </ul>
              )
            )}
          </div>,
        )
        continue
      }

      if (block.type === "achievement-block") {
        const cardMissingCount =
          section === "achievements" && uniqueMissingFields
            ? countMissingFieldsForAchievementCard(
                uniqueMissingFields,
                block.achievementIndex,
              )
            : 0
        const achievement = achievements?.[block.achievementIndex]
        const isSessionAchievement = sessionAchievementIndices.includes(
          block.achievementIndex,
        )
        const achievementSessionKey = `achievement:${block.achievementIndex}`
        const achievementSessionLoading = isSessionQgLoading(achievementSessionKey)
        const achievementSessionFailed = isSessionQgFailed(achievementSessionKey)
        const achievementCards = mergeValueAndQuestionCards(
          [
            {
              apiFieldName: `achievement_${block.achievementIndex}_name`,
              label: "Name",
              priority: ACHIEVEMENT_FIELD_PRIORITIES.name,
              value: achievement?.name,
            },
            {
              apiFieldName: `achievement_${block.achievementIndex}_year`,
              label: "Year",
              priority: ACHIEVEMENT_FIELD_PRIORITIES.year,
              value: achievement?.year,
            },
            {
              apiFieldName: `achievement_${block.achievementIndex}_description`,
              label: "Description",
              priority: ACHIEVEMENT_FIELD_PRIORITIES.description,
              value: achievement?.description,
            },
            {
              apiFieldName: `achievement_${block.achievementIndex}_achievementType`,
              label: "Achievement Type",
              priority: ACHIEVEMENT_FIELD_PRIORITIES.achievementType,
              value: achievement?.achievementType
                ? ACHIEVEMENT_TYPE_LABELS[achievement.achievementType]
                : null,
            },
            {
              apiFieldName: `achievement_${block.achievementIndex}_ranking`,
              label: "Ranking",
              priority: ACHIEVEMENT_FIELD_PRIORITIES.ranking,
              value: achievement?.ranking,
            },
            {
              apiFieldName: `achievement_${block.achievementIndex}_url`,
              label: "URL",
              priority: ACHIEVEMENT_FIELD_PRIORITIES.url,
              value: achievement?.url,
            },
          ],
          new Map(block.questions.map((question) => [question.field, question])),
          "achievements",
          {
            fillAskCues:
              isSessionAchievement &&
              canFillSessionAskCues(`achievement:${block.achievementIndex}`),
          },
        )
        const rendered = renderQuestionList(achievementCards, globalIndex)
        globalIndex = rendered.nextIndex

        sections.push(
          <div
            key={`achievement-${block.achievementIndex}`}
            className={cn(
              "space-y-2",
              !hideEntryCardChrome && "rounded-md border border-border/60 p-2",
            )}
          >
            {!hideEntryCardChrome && (
              <div className="px-1">
                <p className="text-xs font-semibold text-foreground">{block.title}</p>
                {formatAchievementCardSubtitle(achievement) && (
                  <p
                    className="text-[10px] text-muted-foreground mt-0.5 truncate"
                    title={formatAchievementCardSubtitle(achievement) ?? undefined}
                  >
                    {formatAchievementCardSubtitle(achievement)}
                  </p>
                )}
                {cardMissingCount > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {cardMissingCount} missing
                  </p>
                )}
              </div>
            )}
            {achievementSessionLoading ? (
              <div className="flex items-center gap-2 px-1 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating questions…
              </div>
            ) : achievementSessionFailed ? (
              renderSessionQgEntryFailure(achievementSessionKey)
            ) : (
              rendered.nodes.length > 0 && (
                <ul className="space-y-1" role="list">
                  {rendered.nodes}
                </ul>
              )
            )}
          </div>,
        )
        continue
      }

      if (block.type === "project-accordion") {
        const rendered = renderProjectAccordionBlock(block, globalIndex)
        globalIndex = rendered.nextIndex
        sections.push(rendered.section)
      }
    }

    return sections
  }

  const renderEntryNavChrome = () => {
    const showWorkExperienceAdd =
      entryNavSection === "workExperience" && hasGenerated
    const showAchievementAdd = entryNavSection === "achievements"
    const showCertificationAdd = entryNavSection === "certifications"
    const showEntryNav = entryNavChrome !== "hidden" && entryNavItems.length > 0

    if (
      !showEntryNav &&
      !showWorkExperienceAdd &&
      !showAchievementAdd &&
      !showCertificationAdd
    ) {
      return null
    }

    const containerClassName = cn(
      "px-2 pb-1",
      entryNavSection === "workExperience" &&
        "sticky top-0 z-10 border-b border-border/60 bg-muted/95 pt-2 backdrop-blur",
    )

    // No entry list yet — full-width add for the active dynamic section
    if (!showEntryNav) {
      if (showWorkExperienceAdd) {
        return (
          <div className={containerClassName}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={() => onAddSessionWorkExperience?.()}
              disabled={sessionQgActionsDisabled}
            >
              <Plus className="h-3.5 w-3.5" />
              Add work experience
            </Button>
          </div>
        )
      }
      if (showAchievementAdd) {
        return (
          <div className={containerClassName}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={() => onAddSessionAchievement?.()}
              disabled={sessionQgActionsDisabled}
            >
              <Plus className="h-3.5 w-3.5" />
              Add achievement
            </Button>
          </div>
        )
      }
      if (showCertificationAdd) {
        return (
          <div className={containerClassName}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={() => onAddSessionCertification?.()}
              disabled={sessionQgActionsDisabled}
            >
              <Plus className="h-3.5 w-3.5" />
              Add certification
            </Button>
          </div>
        )
      }
      return null
    }

    // Select — trailing dropdown option adds a session entry
    if (entryNavChrome === "select") {
      const addWorkExperienceSelectValue = "__add_work_experience__"
      const addAchievementSelectValue = "__add_achievement__"
      const addCertificationSelectValue = "__add_certification__"
      return (
        <div className={containerClassName}>
          <Select
            value={activeEntryNavId}
            onValueChange={(value) => {
              if (value === addWorkExperienceSelectValue) {
                if (showWorkExperienceAdd && !sessionQgActionsDisabled) {
                  onAddSessionWorkExperience?.()
                }
                return
              }
              if (value === addAchievementSelectValue) {
                if (!sessionQgActionsDisabled) onAddSessionAchievement?.()
                return
              }
              if (value === addCertificationSelectValue) {
                if (!sessionQgActionsDisabled) onAddSessionCertification?.()
                return
              }
              setActiveEntryNavId(value as QuestionEntryNavId)
            }}
          >
            <SelectTrigger size="sm" className="w-full max-w-full">
              <SelectValue placeholder="Select entry" />
            </SelectTrigger>
            <SelectContent>
              {entryNavItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.optionLabel}
                </SelectItem>
              ))}
              {showWorkExperienceAdd ? (
                <SelectItem
                  value={addWorkExperienceSelectValue}
                  disabled={sessionQgActionsDisabled}
                >
                  + Add work experience
                </SelectItem>
              ) : null}
              {showAchievementAdd ? (
                <SelectItem
                  value={addAchievementSelectValue}
                  disabled={sessionQgActionsDisabled}
                >
                  + Add achievement
                </SelectItem>
              ) : null}
              {showCertificationAdd ? (
                <SelectItem
                  value={addCertificationSelectValue}
                  disabled={sessionQgActionsDisabled}
                >
                  + Add certification
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
      )
    }

    // Remaining tabs chrome (e.g. legacy) — no session add control here.
    return (
      <div className={containerClassName}>
        <Tabs
          value={activeEntryNavId}
          onValueChange={(value) => setActiveEntryNavId(value as QuestionEntryNavId)}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            {entryNavItems.map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="max-w-full text-[11px] px-2 py-1 h-auto whitespace-normal text-left"
                title={item.label}
              >
                <span className="truncate">{item.label}</span>
                {item.missingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-4 px-1 text-[9px] tabular-nums shrink-0"
                  >
                    {item.missingCount}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    )
  }

  const renderAccordionQuestions = () => {
    if (!visibleBlocks) return null

    const hideEntryCardChrome = entryNavChrome !== "hidden"
    const overviewEmpty =
      activeEntryNavId === "overview" &&
      entryNavChrome !== "hidden" &&
      accordionSplit != null &&
      isOverviewContentEmpty(accordionSplit.overviewBlocks)

    return (
      <div className="space-y-2">
        {renderEntryNavChrome()}
        {overviewEmpty ? (
          <div className="px-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">No overview questions.</p>
          </div>
        ) : (
          <div className="space-y-2">{renderBlocks(visibleBlocks, { hideEntryCardChrome })}</div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "flex flex-col min-h-0 min-w-0 overflow-hidden border-l border-border bg-muted/30",
        className,
      )}
      aria-label="Generated interview questions"
    >
      <div className="p-3 border-b border-border sticky top-0 bg-muted/50 backdrop-blur z-10 space-y-1 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {section ? `${SECTION_LABELS[section]} Questions` : "Questions"}
          </span>
          {!isLoading && !error && sortedQuestions.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {sortedQuestions.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3" aria-live="polite">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Generating questions…
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-md border border-border bg-card/50 p-3 space-y-2 animate-pulse"
              >
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 flex flex-col items-center text-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive shrink-0" aria-hidden />
            <p className="text-sm text-muted-foreground">{error}</p>
            {onRetry && (
              <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                Try Again
              </Button>
            )}
          </div>
        ) : hasGenerated ? (
          <div className="p-2 space-y-2">
            {sectionComplete && (
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" aria-hidden />
                No missing fields in this section.
              </div>
            )}
            {useAccordionLayout && displayBlocks ? (
              renderAccordionQuestions()
            ) : (
              (() => {
                const questionByField = new Map(
                  sortedQuestions.map((question) => [question.field, question]),
                )
                let flatCards = sortedQuestions
                if (section === "basic") {
                  const basicLabels: Record<(typeof BASIC_FIELD_ORDER)[number], string> = {
                    resume: "Resume",
                    linkedinUrl: "LinkedIn URL",
                  }
                  flatCards = mergeValueAndQuestionCards(
                    BASIC_FIELD_ORDER.map((key) => ({
                      apiFieldName: key,
                      label: basicLabels[key],
                      priority: BASIC_FIELD_PRIORITIES[key],
                      value:
                        key === "resume"
                          ? hasResume === true
                            ? "attached"
                            : null
                          : linkedinUrl,
                      formatValue:
                        key === "resume"
                          ? (value) =>
                              value === "attached" ? "Attached" : formatQgDisplayValue(value)
                          : undefined,
                    })),
                    questionByField,
                    "basic",
                  )
                } else if (section === "preferences") {
                  const preferenceLabels: Record<
                    (typeof PREFERENCES_FIELD_ORDER)[number],
                    string
                  > = {
                    currentSalary: "Current Salary",
                    expectedSalary: COLD_CALLER_EXPECTED_SALARY_LABEL,
                  }
                  flatCards = mergeValueAndQuestionCards(
                    PREFERENCES_FIELD_ORDER.map((key) => ({
                      apiFieldName: key,
                      label: preferenceLabels[key],
                      priority: PREFERENCES_FIELD_PRIORITIES[key],
                      value: key === "currentSalary" ? currentSalary : expectedSalary,
                      formatValue: (value) =>
                        typeof value === "number"
                          ? formatSalaryDisplayValue(value)
                          : formatQgDisplayValue(value),
                    })),
                    questionByField,
                    "preferences",
                  )
                } else if (section === "techStacks") {
                  flatCards = mergeValueAndQuestionCards(
                    [
                      {
                        apiFieldName: "techStacks",
                        label: "Tech stacks",
                        priority: INDEPENDENT_TECH_STACKS_PRIORITY,
                        value: techStacks,
                      },
                    ],
                    questionByField,
                    "techStacks",
                  )
                }

                return (
                  <>
                    {uniqueMissingFields && uniqueMissingFields.length > 0 && (
                      <div className="px-2 pb-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Missing fields
                        </p>
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {uniqueMissingFields.map((fieldKey) => {
                            const meta = resolveQuestionFieldMeta(fieldKey, emptyFields)
                            return (
                              <Badge
                                key={fieldKey}
                                variant="secondary"
                                className="text-[10px] max-w-full truncate"
                                title={meta.label}
                              >
                                {meta.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <ul className="space-y-1" role="list">
                      {renderQuestionList(flatCards, 0).nodes}
                    </ul>
                  </>
                )
              })()
            )}
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <p className="text-sm text-muted-foreground">
              {section ? (
                <>
                  Use <span className="font-medium text-foreground">Generate Questions</span> in the
                  header to create questions for {SECTION_LABELS[section].toLowerCase()} fields.
                </>
              ) : (
                <>
                  Use <span className="font-medium text-foreground">Generate Questions</span> in the
                  header to create AI-guided questions for missing fields.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
