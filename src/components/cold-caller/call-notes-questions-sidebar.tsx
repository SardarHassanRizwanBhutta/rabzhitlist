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
import { EnrichmentQuestionChrome } from "@/components/cold-caller/enrichment-question-chrome"
import {
  buildQuestionFieldLabelMap,
  resolveQuestionFieldMeta,
} from "@/lib/utils/question-api-field-labels"
import {
  groupQuestionsForDisplay,
  type QuestionDisplayBlock,
} from "@/lib/utils/question-accordion-layout"
import {
  certificationCatalogDetailsLabel,
  countMissingFieldsForCertificationCard,
  formatCertificationCardSubtitle,
  summarizeCertificationsMissingFields,
} from "@/lib/utils/certification-questions"
import {
  countMissingFieldsForEducationCard,
  educationCampusGroupLabel,
  educationUniversityDetailsLabel,
  formatEducationCardSubtitle,
  summarizeEducationsMissingFields,
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
  summarizeWorkExperienceMissingFields,
  workExperienceEmployerDetailsLabel,
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
  section?: FieldSection
  activeQuestionField?: string | null
  onQuestionSelect?: (apiFieldName: string) => void
  onRetry?: () => void
  className?: string
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority <= 0) return null
  return (
    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 tabular-nums shrink-0">
      {priority}
    </Badge>
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
  return (
    <li>
      <div
        className={cn(
          "rounded-md border border-transparent flex items-stretch",
          isActive ? "bg-primary border-primary" : "bg-card/40 hover:bg-muted",
          isSectionOpener && !isActive && "border-dashed border-border/60",
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(question.field)}
          className={cn(
            "flex-1 min-w-0 text-left px-3 py-2.5 transition-colors",
            isActive && "text-primary-foreground",
          )}
        >
          <div className="mb-1.5 space-y-1">
            <div className="flex items-start gap-1.5 min-w-0">
              <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0 mt-0.5">
                {index + 1}.
              </span>
              <MessageSquare
                className={cn(
                  "h-3.5 w-3.5 shrink-0 mt-0.5",
                  isActive ? "text-primary-foreground" : "text-primary",
                )}
                aria-hidden
              />
              <span className="text-xs font-semibold min-w-0 break-words">{label}</span>
              {isSectionOpener && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1 py-0 h-4 shrink-0",
                    isActive && "border-primary-foreground/40 text-primary-foreground",
                  )}
                >
                  Section
                </Badge>
              )}
              <div className="ml-auto shrink-0">
                <PriorityBadge priority={question.priority} />
              </div>
            </div>
            <EnrichmentQuestionChrome
              question={question}
              isActive={isActive}
              className="pl-5"
            />
          </div>
          <p
            className={cn(
              "text-sm font-medium leading-snug break-words",
              isActive ? "text-primary-foreground/95" : "text-foreground",
            )}
          >
            &ldquo;{question.question}&rdquo;
          </p>
          {question.context && (
            <p
              className={cn(
                "text-[11px] mt-1.5 break-words",
                isActive ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {question.context}
            </p>
          )}
          <p
            className={cn(
              "text-[10px] mt-1 truncate",
              isActive ? "text-primary-foreground/60" : "text-muted-foreground/80",
            )}
            title={label}
          >
            {label}
          </p>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-auto w-9 shrink-0 rounded-none rounded-r-md",
            isActive && "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground",
          )}
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
  section,
  activeQuestionField,
  onQuestionSelect,
  onRetry,
  className,
}: CallNotesQuestionsSidebarProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [activeEntryNavId, setActiveEntryNavId] = useState<QuestionEntryNavId>("overview")

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
    return groupQuestionsForDisplay(section, sortedQuestions)
  }, [section, sortedQuestions, useAccordionLayout])

  const accordionSplit = useMemo(() => {
    if (!displayBlocks) return null
    return splitAccordionBlocks(displayBlocks)
  }, [displayBlocks])

  const entryNavChrome = useMemo(() => {
    if (!accordionSplit) return "hidden" as const
    return resolveQuestionEntryNavChrome(
      accordionSplit.entryCount,
      accordionSplit.hasOverviewQuestions,
    )
  }, [accordionSplit])

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
      includeOverview: true,
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
    setActiveEntryNavId(defaultQuestionEntryNavId(entryNavChrome, accordionSplit.entryBlocks))
  }, [section, entryNavChrome, accordionSplit])

  const visibleBlocks = useMemo(() => {
    if (!displayBlocks) return null
    if (entryNavChrome === "hidden") return displayBlocks
    return filterBlocksForEntryNav(displayBlocks, activeEntryNavId)
  }, [displayBlocks, entryNavChrome, activeEntryNavId])

  const handleCopy = (apiFieldName: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(apiFieldName)
      toast.success("Question copied")
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const hasGenerated = sectionMissingFields != null || sectionComplete || sortedQuestions.length > 0

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

        const linkRendered = renderQuestionList(block.linkQuestions, globalIndex)
        globalIndex = linkRendered.nextIndex

        const employerAccordionCount =
          block.catalogQuestions.length +
          block.officeGroups.reduce((sum, group) => sum + group.questions.length, 0) +
          block.layoffGroups.reduce((sum, group) => sum + group.questions.length, 0)

        const catalogRendered = renderQuestionList(block.catalogQuestions, globalIndex)
        globalIndex = catalogRendered.nextIndex

        const officeSections = block.officeGroups.map((office) => {
          const officeRendered = renderQuestionList(office.questions, globalIndex)
          globalIndex = officeRendered.nextIndex
          return (
            <div key={`office-${block.roleIndex}-${office.officeIndex}`} className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground px-1 pt-1">
                {workExperienceOfficeGroupLabel(office.officeIndex)}
              </p>
              <ul className="space-y-1" role="list">
                {officeRendered.nodes}
              </ul>
            </div>
          )
        })

        const layoffSections = block.layoffGroups.map((layoff) => {
          const layoffRendered = renderQuestionList(layoff.questions, globalIndex)
          globalIndex = layoffRendered.nextIndex
          return (
            <div key={`layoff-${block.roleIndex}-${layoff.layoffIndex}`} className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground px-1 pt-1">
                {workExperienceLayoffGroupLabel(layoff.layoffIndex)}
              </p>
              <ul className="space-y-1" role="list">
                {layoffRendered.nodes}
              </ul>
            </div>
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
            {linkRendered.nodes.length > 0 && (
              <ul className="space-y-1" role="list">
                {linkRendered.nodes}
              </ul>
            )}
            {employerAccordionCount > 0 && (
              <ProjectCatalogCollapsible
                label={workExperienceEmployerDetailsLabel(employerAccordionCount)}
              >
                <div className="space-y-2 w-full">
                  {catalogRendered.nodes.length > 0 && (
                    <ul className="space-y-1" role="list">
                      {catalogRendered.nodes}
                    </ul>
                  )}
                  {officeSections}
                  {layoffSections}
                </div>
              </ProjectCatalogCollapsible>
            )}
            {block.projectsOpener && (() => {
              const { nodes, nextIndex } = renderQuestionList([block.projectsOpener], globalIndex)
              globalIndex = nextIndex
              return (
                <ul className="space-y-1" role="list">
                  {nodes}
                </ul>
              )
            })()}
            {block.projectAccordions.map((accordion) => {
              const rendered = renderProjectAccordionBlock(accordion, globalIndex)
              globalIndex = rendered.nextIndex
              return rendered.section
            })}
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

        const linkRendered = renderQuestionList(block.linkQuestions, globalIndex)
        globalIndex = linkRendered.nextIndex
        const catalogRendered = renderQuestionList(block.catalogQuestions, globalIndex)
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
            {block.catalogQuestions.length > 0 && (
              <ProjectCatalogCollapsible
                label={certificationCatalogDetailsLabel(block.catalogQuestions.length)}
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

        const linkRendered = renderQuestionList(block.linkQuestions, globalIndex)
        globalIndex = linkRendered.nextIndex

        const accordionQuestionCount =
          block.catalogQuestions.length +
          block.campusGroups.reduce((sum, group) => sum + group.questions.length, 0)

        const catalogRendered = renderQuestionList(block.catalogQuestions, globalIndex)
        globalIndex = catalogRendered.nextIndex

        const campusSections = block.campusGroups.map((campus) => {
          const campusRendered = renderQuestionList(campus.questions, globalIndex)
          globalIndex = campusRendered.nextIndex
          return (
            <div key={`campus-${block.eduIndex}-${campus.campusIndex}`} className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground px-1 pt-1">
                {educationCampusGroupLabel(campus.campusIndex)}
              </p>
              <ul className="space-y-1" role="list">
                {campusRendered.nodes}
              </ul>
            </div>
          )
        })

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
            {accordionQuestionCount > 0 && (
              <ProjectCatalogCollapsible
                label={educationUniversityDetailsLabel(accordionQuestionCount)}
              >
                <div className="space-y-2 w-full">
                  {catalogRendered.nodes.length > 0 && (
                    <ul className="space-y-1" role="list">
                      {catalogRendered.nodes}
                    </ul>
                  )}
                  {campusSections}
                </div>
              </ProjectCatalogCollapsible>
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

    if (entryNavChrome === "select") {
      return (
        <div className="px-2 pb-1">
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
      <div className="px-2 pb-1">
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
        ) : sectionComplete && sortedQuestions.length === 0 ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-600 shrink-0" aria-hidden />
            <p className="text-sm font-medium">Section complete</p>
            <p className="text-xs text-muted-foreground">No missing fields in this section.</p>
          </div>
        ) : hasGenerated && uniqueMissingFields && uniqueMissingFields.length > 0 && sortedQuestions.length === 0 ? (
          <div className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Missing fields
            </p>
            {section === "workExperience" ? (
              <p className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
                {summarizeWorkExperienceMissingFields(uniqueMissingFields)}
              </p>
            ) : section === "certifications" ? (
              <p className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
                {summarizeCertificationsMissingFields(uniqueMissingFields)}
              </p>
            ) : section === "education" ? (
              <p className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
                {summarizeEducationsMissingFields(uniqueMissingFields)}
              </p>
            ) : (
            <ul className="space-y-1">
              {uniqueMissingFields.map((fieldKey) => {
                const meta = resolveQuestionFieldMeta(fieldKey, emptyFields)
                return (
                  <li
                    key={fieldKey}
                    className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50 truncate"
                    title={meta.label}
                  >
                    {meta.label}
                  </li>
                )
              })}
            </ul>
            )}
          </div>
        ) : sortedQuestions.length === 0 ? (
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
        ) : (
          <div className="p-2 space-y-2">
            {useAccordionLayout && displayBlocks ? (
              renderAccordionQuestions()
            ) : (
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
                  {renderQuestionList(sortedQuestions, 0).nodes}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
