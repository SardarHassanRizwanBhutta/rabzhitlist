import type { GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import {
  PROJECT_CATALOG_FIELD_LABELS,
  sortProjectCatalogQuestions,
  sortProjectLinkQuestions,
} from "@/lib/utils/project-catalog-fields"
import {
  dedupeQuestionsByField,
  sortQuestionsByPriority,
} from "@/lib/utils/work-experience-questions"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"

/** Tier B catalog suffixes per § 4.11.3 (+ teamSize for API variants). */
export const INDEPENDENT_PROJECT_CATALOG_SUFFIXES = new Set([
  "employerName",
  "clientLocations",
  "projectType",
  "status",
  "minTeamSize",
  "maxTeamSize",
  "teamSize",
  "startDate",
  "endDate",
  "verticalDomains",
  "horizontalDomains",
  "technicalDomains",
  "description",
  "notes",
  "projectLink",
  "isPublished",
  "publishPlatforms",
  "downloadCount",
  "technicalAspects",
  "techStacks",
])

/** Human labels per § 4.11.6 — never show raw apiFieldName. */
const INDEPENDENT_PROJECT_FIELD_LABELS: Record<string, string> = {
  projectName: "Name",
  contributionNotes: "Contribution",
  employerName: "Project employer",
  clientLocations: "Client locations",
  projectType: "Project type",
  status: "Status",
  minTeamSize: "Min team size",
  maxTeamSize: "Max team size",
  teamSize: "Team size",
  startDate: "Start date",
  endDate: "End date",
  verticalDomains: "Vertical domains",
  horizontalDomains: "Horizontal domains",
  technicalDomains: "Technical domains",
  description: "Description",
  notes: "Notes",
  projectLink: "Project link",
  isPublished: "Published",
  publishPlatforms: "Publish platforms",
  downloadCount: "Download count",
  technicalAspects: "Technical aspects",
  techStacks: "Tech stacks",
}

export interface IndependentProjectQuestionGroup {
  index: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
}

export function formatIndependentProjectFieldLabel(field: string): string {
  if (field === "projects") {
    return `${SECTION_LABELS.projects} (overview)`
  }

  const match = /^project_\d+_(.+)$/.exec(field)
  if (!match) return field

  const suffix = match[1]
  return (
    INDEPENDENT_PROJECT_FIELD_LABELS[suffix] ??
    PROJECT_CATALOG_FIELD_LABELS[suffix as keyof typeof PROJECT_CATALOG_FIELD_LABELS] ??
    suffix
  )
}

export function formatIndependentProjectCardSubtitle(
  projectName?: string | null,
): string | null {
  const trimmed = projectName?.trim()
  return trimmed || null
}

export function countIndependentProjectIndices(missingFields: string[]): number {
  const indices = new Set<number>()
  for (const key of missingFields) {
    const match = key.match(/^project_(\d+)_/)
    if (match) indices.add(Number(match[1]))
  }
  return indices.size
}

/** Compact tab summary per § 4.11.5 — no flat duplicate label dump. */
export function summarizeIndependentProjectsMissingFields(
  missingFields: string[],
): string {
  const deduped = dedupeApiFieldNames(missingFields)
  const count = deduped.length
  if (count === 0) return `${SECTION_LABELS.projects} — section complete`

  const projectCount = countIndependentProjectIndices(deduped)
  const fieldWord = count === 1 ? "field" : "fields"

  if (projectCount === 0) {
    return `${SECTION_LABELS.projects} — ${count} ${fieldWord} missing`
  }

  const projectWord = projectCount === 1 ? "project" : "projects"
  return `${SECTION_LABELS.projects} — ${count} ${fieldWord} missing across ${projectCount} ${projectWord}`
}

export function countMissingFieldsForIndependentProjectCard(
  missingFields: string[],
  projectIndex: number,
): number {
  const prefix = `project_${projectIndex}_`
  return dedupeApiFieldNames(missingFields).filter((key) => key.startsWith(prefix)).length
}

/** Reference grouping per § 4.11.7 */
export function groupIndependentProjectQuestions(questions: GeneratedQuestion[]): {
  sectionOpener: GeneratedQuestion | null
  cards: IndependentProjectQuestionGroup[]
} {
  const deduped = dedupeQuestionsByField(questions)

  let sectionOpener: GeneratedQuestion | null = null
  const cards = new Map<number, { link: GeneratedQuestion[]; catalog: GeneratedQuestion[] }>()

  for (const q of deduped) {
    if (q.field === "projects") {
      sectionOpener = q
      continue
    }

    const match = /^project_(\d+)_(.+)$/.exec(q.field)
    if (!match) continue

    const index = Number(match[1])
    const suffix = match[2]
    if (!cards.has(index)) cards.set(index, { link: [], catalog: [] })

    const bucket = INDEPENDENT_PROJECT_CATALOG_SUFFIXES.has(suffix) ? "catalog" : "link"
    cards.get(index)![bucket].push(q)
  }

  const result = [...cards.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, card]) => ({
      index,
      title: `Project ${index + 1}`,
      linkQuestions: sortProjectLinkQuestions(card.link),
      catalogQuestions: sortProjectCatalogQuestions(card.catalog, sortQuestionsByPriority),
    }))

  return { sectionOpener, cards: result }
}
