"use client"

import { useMemo, useState } from "react"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { EmptyField, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import type { CandidateCertification, CandidateEducation, CandidateStandaloneProject, WorkExperience } from "@/lib/types/candidate"
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
import { catalogDetailsLabel } from "@/lib/utils/project-catalog-fields"
import { certificationCatalogDetailsLabel, countMissingFieldsForCertificationCard, formatCertificationCardSubtitle, summarizeCertificationsMissingFields } from "@/lib/utils/certification-questions"
import {
  countMissingFieldsForEducationCard,
  educationCampusGroupLabel,
  educationUniversityDetailsLabel,
  formatEducationCardSubtitle,
  summarizeEducationsMissingFields,
} from "@/lib/utils/education-questions"
import {
  countMissingFieldsForIndependentProjectCard,
  formatIndependentProjectCardSubtitle,
  summarizeIndependentProjectsMissingFields,
} from "@/lib/utils/independent-project-questions"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"
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
  standaloneProjects?: CandidateStandaloneProject[]
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
  standaloneProjects,
  section,
  activeQuestionField,
  onQuestionSelect,
  onRetry,
  className,
}: CallNotesQuestionsSidebarProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
    section === "projects" ||
    section === "workExperience" ||
    section === "certifications" ||
    section === "education"

  const displayBlocks = useMemo(() => {
    if (!useAccordionLayout || !section) return null
    return groupQuestionsForDisplay(section, sortedQuestions)
  }, [section, sortedQuestions, useAccordionLayout])

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

  const renderBlocks = (blocks: QuestionDisplayBlock[]) => {
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
          <div key={`role-${block.roleIndex}`} className="space-y-2 rounded-md border border-border/60 p-2">
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

      if (block.type === "independent-project-block") {
        const cardMissingCount =
          section === "projects" && uniqueMissingFields
            ? countMissingFieldsForIndependentProjectCard(uniqueMissingFields, block.projectIndex)
            : 0
        const cardSubtitle =
          section === "projects"
            ? formatIndependentProjectCardSubtitle(
                standaloneProjects?.[block.projectIndex]?.projectName,
              )
            : null

        const linkRendered = renderQuestionList(block.linkQuestions, globalIndex)
        globalIndex = linkRendered.nextIndex
        const catalogRendered = renderQuestionList(block.catalogQuestions, globalIndex)
        globalIndex = catalogRendered.nextIndex

        sections.push(
          <div
            key={`project-${block.projectIndex}`}
            className="space-y-2 rounded-md border border-border/60 p-2"
          >
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
            {linkRendered.nodes.length > 0 && (
              <ul className="space-y-1" role="list">
                {linkRendered.nodes}
              </ul>
            )}
            {block.catalogQuestions.length > 0 && (
              <ProjectCatalogCollapsible
                label={catalogDetailsLabel(block.catalogQuestions.length)}
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
            className="space-y-2 rounded-md border border-border/60 p-2"
          >
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
            className="space-y-2 rounded-md border border-border/60 p-2"
          >
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
            ) : section === "projects" ? (
              <p className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50">
                {summarizeIndependentProjectsMissingFields(uniqueMissingFields)}
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
            {uniqueMissingFields && uniqueMissingFields.length > 0 && (
              <div className="px-2 pb-1 min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Missing fields
                </p>
                {section === "workExperience" ? (
                  <p className="text-[10px] text-muted-foreground">
                    {summarizeWorkExperienceMissingFields(uniqueMissingFields)}
                  </p>
                ) : section === "projects" ? (
                  <p className="text-[10px] text-muted-foreground">
                    {summarizeIndependentProjectsMissingFields(uniqueMissingFields)}
                  </p>
                ) : section === "certifications" ? (
                  <p className="text-[10px] text-muted-foreground">
                    {summarizeCertificationsMissingFields(uniqueMissingFields)}
                  </p>
                ) : section === "education" ? (
                  <p className="text-[10px] text-muted-foreground">
                    {summarizeEducationsMissingFields(uniqueMissingFields)}
                  </p>
                ) : (
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
                )}
              </div>
            )}

            {useAccordionLayout && displayBlocks ? (
              <div className="space-y-2">{renderBlocks(displayBlocks)}</div>
            ) : (
              <ul className="space-y-1" role="list">
                {renderQuestionList(sortedQuestions, 0).nodes}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
