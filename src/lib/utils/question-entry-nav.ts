import type { CandidateCertification, CandidateEducation, WorkExperience } from "@/lib/types/candidate"
import { formatCertificationCardSubtitle } from "@/lib/utils/certification-questions"
import { formatEducationCardSubtitle } from "@/lib/utils/education-questions"
import type { QuestionDisplayBlock } from "@/lib/utils/question-accordion-layout"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"
import { formatWorkExperienceCardSubtitle } from "@/lib/utils/work-experience-questions"

export type QuestionEntryNavSection = "workExperience" | "education" | "certifications"

export type QuestionEntryNavId = "overview" | `entry-${number}`

export type QuestionEntryNavChrome = "hidden" | "tabs" | "select"

export interface QuestionEntryNavItem {
  id: QuestionEntryNavId
  /** Short label without missing count. */
  label: string
  missingCount: number
  /** Select option label including missing count. */
  optionLabel: string
}

const OVERVIEW_OPENER_FIELD: Record<QuestionEntryNavSection, string> = {
  workExperience: "work_experiences",
  education: "educations",
  certifications: "certifications",
}

const ENTRY_FALLBACK_LABEL: Record<QuestionEntryNavSection, (index: number) => string> = {
  workExperience: (index) => `Work Experience ${index + 1}`,
  education: (index) => `Education ${index + 1}`,
  certifications: (index) => `Certification ${index + 1}`,
}

/** Max entry sub-tabs before switching to Select (Overview not counted). */
export const QUESTION_ENTRY_TABS_MAX_ENTRIES = 3

export function getOverviewOpenerField(section: QuestionEntryNavSection): string {
  return OVERVIEW_OPENER_FIELD[section]
}

export function countOverviewMissingFields(
  section: QuestionEntryNavSection,
  missingFields: string[] | undefined,
): number {
  if (!missingFields?.length) return 0
  const opener = OVERVIEW_OPENER_FIELD[section]
  return dedupeApiFieldNames(missingFields).filter((key) => key === opener).length
}

export function splitAccordionBlocks(blocks: QuestionDisplayBlock[]): {
  overviewBlocks: QuestionDisplayBlock[]
  entryBlocks: QuestionDisplayBlock[]
  hasOverviewQuestions: boolean
  entryCount: number
} {
  const overviewBlocks: QuestionDisplayBlock[] = []
  const entryBlocks: QuestionDisplayBlock[] = []

  for (const block of blocks) {
    if (block.type === "flat") {
      overviewBlocks.push(block)
    } else if (
      block.type === "role-block" ||
      block.type === "education-block" ||
      block.type === "certification-block"
    ) {
      entryBlocks.push(block)
    }
  }

  const hasOverviewQuestions = overviewBlocks.some(
    (block) => block.type === "flat" && block.questions.length > 0,
  )

  return {
    overviewBlocks,
    entryBlocks,
    hasOverviewQuestions,
    entryCount: entryBlocks.length,
  }
}

/**
 * Nested chrome when overview questions exist with ≥1 entry, or when ≥2 entries.
 * Overview-only or single entry alone → direct content (no nested chrome).
 * When nested: always include Overview slot (may be empty). Tabs if ≤3 entries; Select if more.
 */
export function resolveQuestionEntryNavChrome(
  entryCount: number,
  hasOverviewQuestions: boolean,
): QuestionEntryNavChrome {
  const showNested = entryCount >= 2 || (hasOverviewQuestions && entryCount >= 1)
  if (!showNested) return "hidden"
  return entryCount > QUESTION_ENTRY_TABS_MAX_ENTRIES ? "select" : "tabs"
}

export function defaultQuestionEntryNavId(
  chrome: QuestionEntryNavChrome,
  entryBlocks: QuestionDisplayBlock[],
): QuestionEntryNavId {
  if (chrome === "hidden") {
    if (entryBlocks.length === 1) {
      return entryNavIdFromBlock(entryBlocks[0]!)
    }
    return "overview"
  }
  return "overview"
}

export function entryNavIdFromBlock(block: QuestionDisplayBlock): QuestionEntryNavId {
  if (block.type === "role-block") return `entry-${block.roleIndex}`
  if (block.type === "education-block") return `entry-${block.eduIndex}`
  if (block.type === "certification-block") return `entry-${block.certIndex}`
  return "overview"
}

export function entryIndexFromNavId(id: QuestionEntryNavId): number | null {
  if (id === "overview") return null
  const match = /^entry-(\d+)$/.exec(id)
  return match ? Number(match[1]) : null
}

export function filterBlocksForEntryNav(
  blocks: QuestionDisplayBlock[],
  activeId: QuestionEntryNavId,
): QuestionDisplayBlock[] {
  if (activeId === "overview") {
    return blocks.filter((block) => block.type === "flat")
  }
  const index = entryIndexFromNavId(activeId)
  if (index == null) return []
  return blocks.filter((block) => {
    if (block.type === "role-block") return block.roleIndex === index
    if (block.type === "education-block") return block.eduIndex === index
    if (block.type === "certification-block") return block.certIndex === index
    return false
  })
}

function entryLabelForBlock(
  section: QuestionEntryNavSection,
  block: QuestionDisplayBlock,
  workExperiences?: WorkExperience[],
  educations?: CandidateEducation[],
  certifications?: CandidateCertification[],
): string {
  if (block.type === "role-block") {
    return (
      formatWorkExperienceCardSubtitle(workExperiences?.[block.roleIndex]) ??
      ENTRY_FALLBACK_LABEL.workExperience(block.roleIndex)
    )
  }
  if (block.type === "education-block") {
    const edu = educations?.[block.eduIndex]
    return (
      formatEducationCardSubtitle(
        edu?.universityLocationName ?? edu?.universityName,
        edu?.degreeName,
      ) ?? ENTRY_FALLBACK_LABEL.education(block.eduIndex)
    )
  }
  if (block.type === "certification-block") {
    return (
      formatCertificationCardSubtitle(certifications?.[block.certIndex]?.certificationName) ??
      ENTRY_FALLBACK_LABEL.certifications(block.certIndex)
    )
  }
  return ENTRY_FALLBACK_LABEL[section](0)
}

function withCountLabel(label: string, missingCount: number): string {
  return `${label} (${missingCount})`
}

export function buildQuestionEntryNavItems(params: {
  section: QuestionEntryNavSection
  entryBlocks: QuestionDisplayBlock[]
  /** When nested chrome is shown, Overview is always included (may be empty). */
  includeOverview: boolean
  missingFields: string[] | undefined
  countEntryMissing: (index: number) => number
  workExperiences?: WorkExperience[]
  educations?: CandidateEducation[]
  certifications?: CandidateCertification[]
}): QuestionEntryNavItem[] {
  const items: QuestionEntryNavItem[] = []

  if (params.includeOverview) {
    const missingCount = countOverviewMissingFields(params.section, params.missingFields)
    const label = "Overview"
    items.push({
      id: "overview",
      label,
      missingCount,
      optionLabel: withCountLabel(label, missingCount),
    })
  }

  for (const block of params.entryBlocks) {
    const id = entryNavIdFromBlock(block)
    const label = entryLabelForBlock(
      params.section,
      block,
      params.workExperiences,
      params.educations,
      params.certifications,
    )
    const index = entryIndexFromNavId(id)
    const missingCount = index == null ? 0 : params.countEntryMissing(index)
    items.push({
      id,
      label,
      missingCount,
      optionLabel: withCountLabel(label, missingCount),
    })
  }

  return items
}

/** True when the overview slot has no questions to render. */
export function isOverviewContentEmpty(overviewBlocks: QuestionDisplayBlock[]): boolean {
  if (overviewBlocks.length === 0) return true
  return overviewBlocks.every(
    (block) => block.type !== "flat" || block.questions.length === 0,
  )
}
