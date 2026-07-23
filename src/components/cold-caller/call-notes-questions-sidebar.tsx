"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react"
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
import type { CandidateCertification, CandidateEducation, WorkExperience } from "@/lib/types/candidate"
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
  isProjectCatalogFieldMissing,
  PROJECT_FIELD_DEFS,
  PROJECT_FIELD_PRIORITIES,
  readLinkedProjectPayloadValue,
} from "@/lib/utils/project-catalog-fields"
import {
  formatQgDisplayValue,
  formatSalaryDisplayValue,
  isQgValueMissing,
} from "@/lib/utils/qg-value"
import { mergeValueAndQuestionCards } from "@/lib/utils/merge-value-question-cards"
import {
  BASIC_FIELD_ORDER,
  BASIC_FIELD_PRIORITIES,
  CERTIFICATION_FIELD_PRIORITIES,
  EDUCATION_FIELD_PRIORITIES,
  INDEPENDENT_TECH_STACKS_PRIORITY,
  LAYOFF_FIELD_ORDER,
  LAYOFF_FIELD_PRIORITIES,
  OFFICE_FIELD_ORDER,
  OFFICE_FIELD_PRIORITIES,
  PREFERENCES_FIELD_ORDER,
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
  WORK_EXPERIENCE_EMPLOYER_PRIORITIES,
  WORK_EXPERIENCE_ROLE_FIELD_ORDER,
  WORK_EXPERIENCE_ROLE_PRIORITIES,
} from "@/lib/utils/qg-field-weights"
import {
  certificationCatalogDetailsLabel,
  countMissingFieldsForCertificationCard,
  formatCertificationCardSubtitle,
} from "@/lib/utils/certification-questions"
import {
  countMissingFieldsForEducationCard,
  formatEducationCardSubtitle,
} from "@/lib/utils/education-questions"
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
  educations?: CandidateEducation[]
  certifications?: CandidateCertification[]
  cnic?: string | null
  personalityType?: string | null
  currentSalary?: number | null
  expectedSalary?: number | null
  techStacks?: string[]
  section?: FieldSection
  activeQuestionField?: string | null
  onQuestionSelect?: (apiFieldName: string) => void
  onRetry?: () => void
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

function buildWorkExperienceSectionUnits(
  block: WorkExperienceRoleBlock,
  workExperiences?: WorkExperience[],
): WorkExperienceSectionUnit[] {
  let order = 0
  const units: WorkExperienceSectionUnit[] = []
  const we = workExperiences?.[block.roleIndex]

  const roleHasPopulated = WORK_EXPERIENCE_ROLE_FIELD_ORDER.some((key) => {
    return !isQgValueMissing(readWorkExperienceField(we, key))
  })
  if (block.linkQuestions.length > 0 || roleHasPopulated) {
    units.push({
      type: "role",
      id: `role-${block.roleIndex}`,
      priority: Math.max(
        ...block.linkQuestions.map((question) => question.priority),
        ...WORK_EXPERIENCE_ROLE_FIELD_ORDER.map((key) => {
          const value = readWorkExperienceField(we, key)
          return !isQgValueMissing(value) ? WORK_EXPERIENCE_ROLE_PRIORITIES[key] : 0
        }),
        0,
      ),
      order: order++,
      questions: block.linkQuestions,
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
  if (employerQuestions.length > 0 || employerHasPopulated) {
    units.push({
      type: "employer",
      id: `employer-${block.roleIndex}`,
      priority: Math.max(
        ...employerQuestions.map((question) => question.priority),
        ...WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.map((key) => {
          const value = readWorkExperienceField(we, key)
          return !isQgValueMissing(value)
            ? WORK_EXPERIENCE_EMPLOYER_PRIORITIES[key]
            : 0
        }),
        0,
      ),
      order: order++,
    })
  }

  for (const accordion of block.projectAccordions) {
    const projectIndexMatch = /_project_(\d+)$/.exec(accordion.apiPrefix)
    const projectIndex = projectIndexMatch ? Number(projectIndexMatch[1]) : 0
    const project = workExperiences?.[block.roleIndex]?.projects?.[projectIndex]
    const populatedPriorities = project
      ? PROJECT_FIELD_DEFS.filter((field) => {
          const value = readLinkedProjectPayloadValue(project, field.payloadKey)
          return !isProjectCatalogFieldMissing(field.payloadKey, value)
        }).map((field) => PROJECT_FIELD_PRIORITIES[field.apiSuffix])
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

  return units.sort((a, b) => b.priority - a.priority || a.order - b.order)
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority <= 0) return null
  return (
    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 tabular-nums shrink-0">
      {priority}
    </Badge>
  )
}

const TECH_STACK_BADGE_CLASS =
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
const TECH_STACK_BADGE_MAX_DISPLAY = 6

function isTechStacksApiField(field: string): boolean {
  return field === "techStacks" || /(?:^|_)techStacks$/.test(field)
}

function TechStackValueBadges({ items }: { items: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = items.length > TECH_STACK_BADGE_MAX_DISPLAY
  const visible =
    shouldTruncate && !isExpanded
      ? items.slice(0, TECH_STACK_BADGE_MAX_DISPLAY)
      : items
  const remainingCount =
    shouldTruncate && !isExpanded ? items.length - TECH_STACK_BADGE_MAX_DISPLAY : 0

  return (
    <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
      {visible.map((item) => (
        <Badge
          key={item}
          variant="secondary"
          className={cn(TECH_STACK_BADGE_CLASS, "text-xs")}
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
  const showTechStackBadges =
    question.promptType === "enrichment" &&
    isTechStacksApiField(question.field) &&
    (question.valueItems?.length ?? 0) > 0

  return (
    <li>
      <div
        className={cn(
          "rounded-md border border-transparent bg-card/40 hover:bg-muted flex items-stretch",
          isSectionOpener && "border-dashed border-border/60",
        )}
      >
        <button
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(question.field)}
          className="flex-1 min-w-0 text-left px-3 py-2.5 transition-colors"
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
          {showTechStackBadges ? (
            <TechStackValueBadges items={question.valueItems!} />
          ) : (
            <p className="text-sm font-medium leading-snug break-words text-foreground">
              {question.question}
            </p>
          )}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-auto w-9 shrink-0 rounded-none rounded-r-md"
          aria-label={`Copy question for ${label}`}
          onClick={(e) => onCopy(question.field, question.question, e)}
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
  educations,
  certifications,
  cnic,
  personalityType,
  currentSalary,
  expectedSalary,
  techStacks,
  section,
  activeQuestionField,
  onQuestionSelect,
  onRetry,
  className,
}: CallNotesQuestionsSidebarProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeEntryNavId, setActiveEntryNavId] = useState<QuestionEntryNavId>("overview")
  const [openWorkExperienceSectionId, setOpenWorkExperienceSectionId] =
    useState<string | null>(null)

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
    section === "workExperience" ||
    section === "certifications" ||
    section === "education"

  const entryNavSection: QuestionEntryNavSection | null =
    section === "workExperience" || section === "education" || section === "certifications"
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
          const projectIndices =
            projects.length > 0
              ? projects.map((_, projectIndex) => projectIndex)
              : hasGenerated
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
          if (officeIndices.size === 0 && hasGenerated) officeIndices.add(0)

          const layoffByIndex = new Map(
            (existing?.layoffGroups ?? []).map((group) => [group.layoffIndex, group]),
          )
          const layoffIndices = new Set<number>([
            ...layoffByIndex.keys(),
            ...Array.from({ length: we?.layoffs?.length ?? 0 }, (_, i) => i),
          ])
          if (layoffIndices.size === 0 && hasGenerated) layoffIndices.add(0)

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

    if (section === "education") {
      const byIndex = new Map<
        number,
        Extract<QuestionDisplayBlock, { type: "education-block" }>
      >()
      for (const block of grouped) {
        if (block.type === "education-block") byIndex.set(block.eduIndex, block)
      }
      const indices = new Set<number>([
        ...byIndex.keys(),
        ...Array.from({ length: educations?.length ?? 0 }, (_, i) => i),
      ])
      if (indices.size === 0 && hasGenerated) indices.add(0)

      return [...indices]
        .sort((a, b) => a - b)
        .map((eduIndex) => {
          const existing = byIndex.get(eduIndex)
          return {
            type: "education-block" as const,
            eduIndex,
            title: existing?.title ?? `Education ${eduIndex + 1}`,
            linkQuestions: existing?.linkQuestions ?? [],
            catalogQuestions: existing?.catalogQuestions ?? [],
            campusGroups: existing?.campusGroups ?? [],
          }
        })
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

    return grouped
  }, [
    section,
    sortedQuestions,
    useAccordionLayout,
    workExperiences,
    educations,
    certifications,
    hasGenerated,
  ])

  const accordionSplit = useMemo(() => {
    if (!displayBlocks) return null
    return splitAccordionBlocks(displayBlocks)
  }, [displayBlocks])

  const entryNavChrome = useMemo(() => {
    if (!accordionSplit) return "hidden" as const
    // Education: Select whenever there are 2+ entries; no chrome for a single entry.
    if (entryNavSection === "education") {
      return accordionSplit.entryCount > 1 ? ("select" as const) : ("hidden" as const)
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
        return countMissingFieldsForWorkExperienceCard(missing, index)
      }
      if (entryNavSection === "education") {
        return countMissingFieldsForEducationCard(missing, index)
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
      educations,
      certifications,
    })
  }, [
    entryNavSection,
    accordionSplit,
    entryNavChrome,
    uniqueMissingFields,
    workExperiences,
    educations,
    certifications,
  ])

  useEffect(() => {
    if (!accordionSplit) {
      setActiveEntryNavId("overview")
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
    return roleBlock
      ? buildWorkExperienceSectionUnits(roleBlock, workExperiences)
      : []
  }, [section, visibleBlocks, workExperiences])

  useEffect(() => {
    const sectionIds = activeWorkExperienceSections.map((unit) => unit.id)
    setOpenWorkExperienceSectionId((current) =>
      current && sectionIds.includes(current) ? current : (sectionIds[0] ?? null),
    )
  }, [activeWorkExperienceSections])

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
        const cardMissingCount =
          section === "workExperience" && uniqueMissingFields
            ? countMissingFieldsForWorkExperienceCard(uniqueMissingFields, block.roleIndex)
            : 0
        const cardSubtitle =
          section === "workExperience"
            ? formatWorkExperienceCardSubtitle(workExperiences?.[block.roleIndex])
            : null

        const roleUnits = buildWorkExperienceSectionUnits(block, workExperiences)
        const missingFieldSet = new Set(uniqueMissingFields ?? [])
        const countUnitMissing = (unit: WorkExperienceSectionUnit): number => {
          if (unit.type === "role") {
            return WORK_EXPERIENCE_ROLE_FIELD_ORDER.filter((key) =>
              missingFieldSet.has(`work_experience_${block.roleIndex}_${key}`),
            ).length
          }
          if (unit.type === "project") {
            return PROJECT_FIELD_DEFS.filter((field) =>
              missingFieldSet.has(`${unit.accordion.apiPrefix}_${field.apiSuffix}`),
            ).length
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

        const roleContent = roleUnits.map((unit) => {
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
              WORK_EXPERIENCE_ROLE_FIELD_ORDER.map((key) => ({
                apiFieldName: `work_experience_${block.roleIndex}_${key}`,
                label: key,
                priority: WORK_EXPERIENCE_ROLE_PRIORITIES[key],
                value: readWorkExperienceField(we, key),
              })),
              questionByField,
              "workExperience",
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
            const project = workExperiences?.[block.roleIndex]?.projects?.[projectIndex]
            const questionByField = new Map(
              unit.accordion.accordionQuestions.map((question) => [
                question.field,
                question,
              ]),
            )
            const projectRows = PROJECT_FIELD_DEFS.flatMap((field) => {
              const apiFieldName = `${unit.accordion.apiPrefix}_${field.apiSuffix}`
              const value = project
                ? readLinkedProjectPayloadValue(project, field.payloadKey)
                : null

              if (
                project &&
                !isProjectCatalogFieldMissing(field.payloadKey, value)
              ) {
                const valueItems =
                  field.apiSuffix === "techStacks" && Array.isArray(value)
                    ? value.map((item) => String(item)).filter((s) => s.trim() !== "")
                    : undefined
                const valueCard: GeneratedQuestion = {
                  question: formatQgDisplayValue(value),
                  field: apiFieldName,
                  section: "workExperience",
                  priority: PROJECT_FIELD_PRIORITIES[field.apiSuffix],
                  context: "",
                  promptType: "enrichment",
                  ...(valueItems && valueItems.length > 0 ? { valueItems } : {}),
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
              if (!question) return []
              const rendered = renderQuestionList([question], globalIndex)
              globalIndex = rendered.nextIndex
              return [
                <ul key={apiFieldName} className="space-y-1" role="list">
                  {rendered.nodes}
                </ul>,
              ]
            })

            const projectName = project?.projectName?.trim()
            return (
              <ProjectCatalogCollapsible
                key={unit.id}
                label={projectName || `Project ${projectIndex + 1}`}
                open={isOpen}
                onOpenChange={onOpenChange}
                missingCount={missingCount}
              >
                <div className="space-y-1">{projectRows}</div>
              </ProjectCatalogCollapsible>
            )
          }

          const we = workExperiences?.[block.roleIndex]
          const catalogByField = new Map(
            block.catalogQuestions.map((question) => [question.field, question]),
          )
          const employerScalarCards = mergeValueAndQuestionCards(
            WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.map((key) => ({
              apiFieldName: `work_experience_${block.roleIndex}_${key}`,
              label: key,
              priority: WORK_EXPERIENCE_EMPLOYER_PRIORITIES[key],
              value: readWorkExperienceField(we, key),
            })),
            catalogByField,
            "workExperience",
          )
          const statusCards = employerScalarCards.filter((q) =>
            q.field.endsWith("_status"),
          )
          // Employer-level fields (same as Employer dialog Basic Information) —
          // must render outside Office Location groups.
          const employerBasicCards = employerScalarCards.filter(
            (q) =>
              q.field.endsWith("_headcount") || q.field.endsWith("_salaryPolicy"),
          )
          const postLayoffCards = employerScalarCards.filter((q) =>
            q.field.endsWith("_awards"),
          )

          const statusRendered = renderQuestionList(statusCards, globalIndex)
          globalIndex = statusRendered.nextIndex

          const employerBasicRendered = renderQuestionList(
            employerBasicCards,
            globalIndex,
          )
          globalIndex = employerBasicRendered.nextIndex

          const officeSections = block.officeGroups.map((officeGroup) => {
            const officeRow = we?.locations?.[officeGroup.officeIndex]
            const questionByField = new Map(
              officeGroup.questions.map((question) => [question.field, question]),
            )
            const officeCards = mergeValueAndQuestionCards(
              OFFICE_FIELD_ORDER.map((key) => ({
                apiFieldName: `work_experience_${block.roleIndex}_office_${officeGroup.officeIndex}_${key}`,
                label: key,
                priority: OFFICE_FIELD_PRIORITIES[key],
                value: officeRow ? officeRow[key] : null,
              })),
              questionByField,
              "workExperience",
            )
            const officeRendered = renderQuestionList(officeCards, globalIndex)
            globalIndex = officeRendered.nextIndex
            return (
              <div
                key={`office-${block.roleIndex}-${officeGroup.officeIndex}`}
                className="space-y-1"
              >
                <p className="text-[10px] font-medium text-muted-foreground px-1 pt-1">
                  {workExperienceOfficeGroupLabel(officeGroup.officeIndex)}
                </p>
                <ul className="space-y-1" role="list">
                  {officeRendered.nodes}
                </ul>
              </div>
            )
          })

          const layoffSections = block.layoffGroups.map((layoffGroup) => {
            const layoffRow = we?.layoffs?.[layoffGroup.layoffIndex]
            const questionByField = new Map(
              layoffGroup.questions.map((question) => [question.field, question]),
            )
            const layoffCards = mergeValueAndQuestionCards(
              LAYOFF_FIELD_ORDER.map((key) => ({
                apiFieldName: `work_experience_${block.roleIndex}_layoff_${layoffGroup.layoffIndex}_${key}`,
                label: key,
                priority: LAYOFF_FIELD_PRIORITIES[key],
                value: layoffRow ? layoffRow[key] : null,
              })),
              questionByField,
              "workExperience",
            )
            const layoffRendered = renderQuestionList(layoffCards, globalIndex)
            globalIndex = layoffRendered.nextIndex
            return (
              <div
                key={`layoff-${block.roleIndex}-${layoffGroup.layoffIndex}`}
                className="space-y-1"
              >
                <p className="text-[10px] font-medium text-muted-foreground px-1 pt-1">
                  {workExperienceLayoffGroupLabel(layoffGroup.layoffIndex)}
                </p>
                <ul className="space-y-1" role="list">
                  {layoffRendered.nodes}
                </ul>
              </div>
            )
          })

          const postLayoffRendered = renderQuestionList(postLayoffCards, globalIndex)
          globalIndex = postLayoffRendered.nextIndex

          return (
            <ProjectCatalogCollapsible
              key={unit.id}
              label="Employer Details"
              open={isOpen}
              onOpenChange={onOpenChange}
              missingCount={missingCount}
            >
              <div className="space-y-2 w-full">
                {statusRendered.nodes.length > 0 && (
                  <ul className="space-y-1" role="list">
                    {statusRendered.nodes}
                  </ul>
                )}
                {employerBasicRendered.nodes.length > 0 && (
                  <ul className="space-y-1" role="list">
                    {employerBasicRendered.nodes}
                  </ul>
                )}
                {officeSections}
                {layoffSections}
                {postLayoffRendered.nodes.length > 0 && (
                  <ul className="space-y-1" role="list">
                    {postLayoffRendered.nodes}
                  </ul>
                )}
              </div>
            </ProjectCatalogCollapsible>
          )
        })

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
            {roleContent}
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

        const linkQuestions = block.linkQuestions
        const catalogQuestions = block.catalogQuestions
        const questionByField = new Map(
          [...linkQuestions, ...catalogQuestions].map((question) => [
            question.field,
            question,
          ]),
        )
        const cert = certifications?.[block.certIndex]
        const certCards = mergeValueAndQuestionCards(
          [
            {
              apiFieldName: `certification_${block.certIndex}_name`,
              label: "Name",
              priority: CERTIFICATION_FIELD_PRIORITIES.name,
              value: cert?.certificationName,
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
            {
              apiFieldName: `certification_${block.certIndex}_issuingBody`,
              label: "Issuer body",
              priority: CERTIFICATION_FIELD_PRIORITIES.issuingBody,
              value: cert?.issuingBody ?? cert?.certificationIssuerName,
            },
          ],
          questionByField,
          "certifications",
        )
        const linkCards = certCards.filter(
          (q) => !q.field.endsWith("_issuingBody"),
        )
        const bodyCard = certCards.filter((q) => q.field.endsWith("_issuingBody"))
        const linkRendered = renderQuestionList(linkCards, globalIndex)
        globalIndex = linkRendered.nextIndex
        const catalogRendered = renderQuestionList(bodyCard, globalIndex)
        globalIndex = catalogRendered.nextIndex

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
            {linkRendered.nodes.length > 0 && (
              <ul className="space-y-1" role="list">
                {linkRendered.nodes}
              </ul>
            )}
            {bodyCard.length > 0 && (
              <ProjectCatalogCollapsible
                label={certificationCatalogDetailsLabel(bodyCard.length)}
              >
                <ul className="space-y-1 w-full" role="list">
                  {catalogRendered.nodes}
                </ul>
              </ProjectCatalogCollapsible>
            )}
          </div>,
        )
        continue
      }

      if (block.type === "education-block") {
        const cardMissingCount =
          section === "education" && uniqueMissingFields
            ? countMissingFieldsForEducationCard(uniqueMissingFields, block.eduIndex)
            : 0
        const edu = educations?.[block.eduIndex]
        const cardSubtitle = formatEducationCardSubtitle(
          edu?.universityLocationName ?? edu?.universityName,
          edu?.degreeName,
        )

        const questionByField = new Map(
          [...block.linkQuestions, ...block.catalogQuestions].map((question) => [
            question.field,
            question,
          ]),
        )
        const eduCards = mergeValueAndQuestionCards(
          [
            {
              apiFieldName: `education_${block.eduIndex}_universityName`,
              label: "University Name",
              priority: EDUCATION_FIELD_PRIORITIES.universityName,
              value: edu?.universityName ?? edu?.universityLocationName,
            },
            {
              apiFieldName: `education_${block.eduIndex}_isTopper`,
              label: "Topper",
              priority: EDUCATION_FIELD_PRIORITIES.isTopper,
              value: edu?.isTopper,
            },
          ],
          questionByField,
          "education",
        )
        const linkRendered = renderQuestionList(eduCards, globalIndex)
        globalIndex = linkRendered.nextIndex

        sections.push(
          <div
            key={`edu-${block.eduIndex}`}
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
            {linkRendered.nodes.length > 0 && (
              <ul className="space-y-1" role="list">
                {linkRendered.nodes}
              </ul>
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
    if (entryNavChrome === "hidden" || entryNavItems.length === 0) return null

    const containerClassName = cn(
      "px-2 pb-1",
      entryNavSection === "workExperience" &&
        "sticky top-0 z-10 border-b border-border/60 bg-muted/95 pt-2 backdrop-blur",
    )

    if (entryNavChrome === "select") {
      return (
        <div className={containerClassName}>
          <Select
            value={activeEntryNavId}
            onValueChange={(value) => setActiveEntryNavId(value as QuestionEntryNavId)}
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
            </SelectContent>
          </Select>
        </div>
      )
    }

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
                  flatCards = mergeValueAndQuestionCards(
                    BASIC_FIELD_ORDER.map((key) => ({
                      apiFieldName: key,
                      label: key,
                      priority: BASIC_FIELD_PRIORITIES[key],
                      value: key === "cnic" ? cnic : personalityType,
                    })),
                    questionByField,
                    "basic",
                  )
                } else if (section === "preferences") {
                  flatCards = mergeValueAndQuestionCards(
                    PREFERENCES_FIELD_ORDER.map((key) => ({
                      apiFieldName: key,
                      label: key,
                      priority: BASIC_FIELD_PRIORITIES[key],
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
