import type { GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import { RANKING_DISPLAY_TO_DB, type RankingDb } from "@/lib/types/employer"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"
import {
  dedupeQuestionsByField,
  sortQuestionsByPriority,
} from "@/lib/utils/work-experience-questions"

export const EDUCATION_LINK_ORDER = [
  "universityName",
  "degreeName",
  "majorName",
  "startMonth",
  "endMonth",
  "grades",
  "isTopper",
  "isCheetah",
] as const

export const EDUCATION_CATALOG_SUFFIXES = new Set([
  "country",
  "ranking",
  "websiteUrl",
  "linkedinUrl",
])

export const EDUCATION_CAMPUS_SUFFIXES = new Set(["city", "isMainCampus", "address"])

const EDUCATION_FIELD_LABELS: Record<string, string> = {
  universityName: "University Name",
  degreeName: "Degree Name",
  majorName: "Major Name",
  startMonth: "Start Month",
  endMonth: "End Month",
  grades: "Grades",
  isTopper: "Topper",
  isCheetah: "Cheetah",
  country: "Country",
  ranking: "Ranking",
  websiteUrl: "Website URL",
  linkedinUrl: "LinkedIn URL",
  city: "City",
  isMainCampus: "Main Campus",
  address: "Office Location",
}

const RANKING_PAYLOAD_TO_LABEL: Record<string, string> = Object.fromEntries(
  (Object.entries(RANKING_DISPLAY_TO_DB) as [RankingDb, string][]).map(([db, label]) => [
    db,
    label,
  ]),
)

export interface EducationCampusQuestionGroup {
  campusIndex: number
  questions: GeneratedQuestion[]
}

export interface EducationQuestionCard {
  index: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
  campusGroups: EducationCampusQuestionGroup[]
}

export function educationUniversityDetailsLabel(count: number): string {
  const noun = count === 1 ? "question" : "questions"
  return `Complete university details — ${count} ${noun}`
}

export function educationCampusGroupLabel(campusIndex: number): string {
  return `Campus ${campusIndex + 1}`
}

export function formatEducationFieldLabel(field: string): string {
  if (field === "educations") return `${SECTION_LABELS.education} (overview)`

  const campusMatch = /^education_\d+_campus_\d+_(.+)$/.exec(field)
  if (campusMatch) {
    return EDUCATION_FIELD_LABELS[campusMatch[1]] ?? campusMatch[1]
  }

  const match = /^education_\d+_(.+)$/.exec(field)
  if (!match) {
    if (field.endsWith("_universityLocationName")) return "University Name"
    return field
  }

  const suffix = match[1]
  if (suffix === "ranking") return EDUCATION_FIELD_LABELS.ranking
  return EDUCATION_FIELD_LABELS[suffix] ?? suffix
}

/** Format ranking values for enrichment chips (tier_1 → Tier 1). */
export function formatEducationRankingDisplay(value: string): string {
  const lower = value.trim().toLowerCase()
  return RANKING_PAYLOAD_TO_LABEL[lower] ?? value
}

export function formatEducationCardSubtitle(
  universityName?: string | null,
  degreeName?: string | null,
): string | null {
  const uni = universityName?.trim()
  const degree = degreeName?.trim()
  if (uni && degree) return `${uni} — ${degree}`
  return uni || degree || null
}

function sortEducationLinkQuestions(items: GeneratedQuestion[]): GeneratedQuestion[] {
  return [...items].sort((a, b) => {
    const sa = a.field.split("_").pop() ?? ""
    const sb = b.field.split("_").pop() ?? ""
    const normalize = (s: string) => (s === "universityLocationName" ? "universityName" : s)
    const ia = EDUCATION_LINK_ORDER.indexOf(
      normalize(sa) as (typeof EDUCATION_LINK_ORDER)[number],
    )
    const ib = EDUCATION_LINK_ORDER.indexOf(
      normalize(sb) as (typeof EDUCATION_LINK_ORDER)[number],
    )
    const safeIa = ia === -1 ? EDUCATION_LINK_ORDER.length : ia
    const safeIb = ib === -1 ? EDUCATION_LINK_ORDER.length : ib
    return safeIa - safeIb || a.field.localeCompare(b.field)
  })
}

export function countEducationIndices(missingFields: string[]): number {
  const indices = new Set<number>()
  for (const key of missingFields) {
    const match = key.match(/^education_(\d+)_/)
    if (match) indices.add(Number(match[1]))
  }
  return indices.size
}

export function summarizeEducationsMissingFields(missingFields: string[]): string {
  const deduped = dedupeApiFieldNames(missingFields)
  const count = deduped.length
  if (count === 0) return `${SECTION_LABELS.education} — section complete`

  const eduCount = countEducationIndices(deduped)
  const fieldWord = count === 1 ? "field" : "fields"

  if (eduCount === 0) {
    return `${SECTION_LABELS.education} — ${count} ${fieldWord} missing`
  }

  const eduWord = eduCount === 1 ? "education" : "educations"
  return `${SECTION_LABELS.education} — ${count} ${fieldWord} missing across ${eduCount} ${eduWord}`
}

export function countMissingFieldsForEducationCard(
  missingFields: string[],
  eduIndex: number,
): number {
  const prefix = `education_${eduIndex}_`
  return dedupeApiFieldNames(missingFields).filter((key) => key.startsWith(prefix)).length
}

/** Reference grouping per FRONTEND_INTEGRATION_CONTRACT § 4.12.5 */
export function groupEducationQuestions(questions: GeneratedQuestion[]): {
  sectionOpener: GeneratedQuestion | null
  cards: EducationQuestionCard[]
} {
  const deduped = dedupeQuestionsByField(questions)

  let sectionOpener: GeneratedQuestion | null = null
  const cards = new Map<
    number,
    {
      link: GeneratedQuestion[]
      catalog: GeneratedQuestion[]
      campuses: Map<number, GeneratedQuestion[]>
    }
  >()

  for (const q of deduped) {
    if (q.field === "educations") {
      sectionOpener = q
      continue
    }

    const campusMatch = /^education_(\d+)_campus_(\d+)_(.+)$/.exec(q.field)
    if (campusMatch) {
      const index = Number(campusMatch[1])
      const campusIndex = Number(campusMatch[2])
      if (!cards.has(index)) cards.set(index, { link: [], catalog: [], campuses: new Map() })
      const card = cards.get(index)!
      if (!card.campuses.has(campusIndex)) card.campuses.set(campusIndex, [])
      card.campuses.get(campusIndex)!.push(q)
      continue
    }

    const match = /^education_(\d+)_(.+)$/.exec(q.field)
    if (!match) continue

    const index = Number(match[1])
    const suffix = match[2]
    if (!cards.has(index)) cards.set(index, { link: [], catalog: [], campuses: new Map() })
    const card = cards.get(index)!
    const normalizedSuffix = suffix === "universityLocationName" ? "universityName" : suffix
    if (EDUCATION_CATALOG_SUFFIXES.has(normalizedSuffix)) {
      card.catalog.push(q)
    } else {
      card.link.push(q)
    }
  }

  const result = [...cards.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, card]) => ({
      index,
      title: `Education ${index + 1}`,
      linkQuestions: sortEducationLinkQuestions(card.link),
      catalogQuestions: [...card.catalog].sort(sortQuestionsByPriority),
      campusGroups: [...card.campuses.entries()]
        .sort(([a], [b]) => a - b)
        .map(([campusIndex, campusQuestions]) => ({
          campusIndex,
          questions: [...campusQuestions].sort(sortQuestionsByPriority),
        })),
    }))

  return { sectionOpener, cards: result }
}
