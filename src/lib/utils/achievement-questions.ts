import type { Achievement } from "@/lib/types/candidate"
import type { GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"
import {
  dedupeQuestionsByField,
  sortQuestionsByPriority,
} from "@/lib/utils/work-experience-questions"
import { ACHIEVEMENT_FIELD_ORDER } from "@/lib/utils/qg-field-weights"

const ACHIEVEMENT_FIELD_RE = /^achievement_(\d+)_(.+)$/

const ACHIEVEMENT_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  year: "Year",
  description: "Description",
  achievementType: "Achievement Type",
  ranking: "Ranking",
  url: "URL",
}

export interface AchievementQuestionCard {
  index: number
  title: string
  questions: GeneratedQuestion[]
}

export function formatAchievementFieldLabel(field: string): string {
  if (field === "achievements") return `${SECTION_LABELS.achievements} (overview)`

  const m = ACHIEVEMENT_FIELD_RE.exec(field)
  if (!m) return field

  return ACHIEVEMENT_FIELD_LABELS[m[2]] ?? m[2]
}

export function countAchievementIndices(missingFields: string[]): number {
  const indices = new Set<number>()
  for (const key of missingFields) {
    const match = /^achievement_(\d+)_/.exec(key)
    if (match) indices.add(Number(match[1]))
  }
  return indices.size
}

export function summarizeAchievementsMissingFields(missingFields: string[]): string {
  const deduped = dedupeApiFieldNames(missingFields)
  const count = deduped.length
  if (count === 0) return `${SECTION_LABELS.achievements} — section complete`

  const achievementCount = countAchievementIndices(deduped)
  const fieldWord = count === 1 ? "field" : "fields"
  const achievementWord = achievementCount === 1 ? "achievement" : "achievements"

  return `${SECTION_LABELS.achievements} — ${count} ${fieldWord} missing across ${achievementCount} ${achievementWord}`
}

export function countMissingFieldsForAchievementCard(
  missingFields: string[],
  achievementIndex: number,
): number {
  const prefix = `achievement_${achievementIndex}_`
  return dedupeApiFieldNames(missingFields).filter((key) => key.startsWith(prefix)).length
}

export function formatAchievementCardSubtitle(
  achievement?: Achievement | null,
): string | null {
  const trimmed = achievement?.name?.trim()
  return trimmed || null
}

function sortAchievementQuestions(items: GeneratedQuestion[]): GeneratedQuestion[] {
  return [...items].sort((a, b) => {
    const sa = a.field.split("_").pop() ?? ""
    const sb = b.field.split("_").pop() ?? ""
    const ia = ACHIEVEMENT_FIELD_ORDER.indexOf(sa as (typeof ACHIEVEMENT_FIELD_ORDER)[number])
    const ib = ACHIEVEMENT_FIELD_ORDER.indexOf(sb as (typeof ACHIEVEMENT_FIELD_ORDER)[number])
    const safeIa = ia === -1 ? ACHIEVEMENT_FIELD_ORDER.length : ia
    const safeIb = ib === -1 ? ACHIEVEMENT_FIELD_ORDER.length : ib
    return safeIa - safeIb || sortQuestionsByPriority(a, b)
  })
}

export function groupAchievementQuestions(questions: GeneratedQuestion[]): {
  sectionOpener: GeneratedQuestion | null
  cards: AchievementQuestionCard[]
} {
  const deduped = dedupeQuestionsByField(questions)

  let sectionOpener: GeneratedQuestion | null = null
  const cards = new Map<number, GeneratedQuestion[]>()

  for (const q of deduped) {
    if (q.field === "achievements") {
      sectionOpener = q
      continue
    }

    const m = ACHIEVEMENT_FIELD_RE.exec(q.field)
    if (!m) continue

    const index = Number(m[1])
    if (!cards.has(index)) cards.set(index, [])
    cards.get(index)!.push(q)
  }

  const result = [...cards.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, cardQuestions]) => ({
      index,
      title: `Achievement ${index + 1}`,
      questions: sortAchievementQuestions(cardQuestions),
    }))

  return { sectionOpener, cards: result }
}
