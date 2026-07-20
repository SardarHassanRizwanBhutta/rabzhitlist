import type { GeneratedQuestion, ColdCallerSectionQuestions } from "@/types/cold-caller"
import type {
  ApiGeneratedQuestion,
  GenerateQuestionsResponse,
  SectionQuestionResult,
} from "@/types/question-generation"
import { questionSectionIdToFieldSection } from "@/lib/utils/question-section-map"

export type { ColdCallerSectionQuestions }

/** Preserves first-occurrence order; API may repeat keys (e.g. work_experience_0_projects). */
export function dedupeApiFieldNames(fieldNames: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const name of fieldNames) {
    if (seen.has(name)) continue
    seen.add(name)
    result.push(name)
  }
  return result
}

export function mapApiQuestionToColdCaller(q: ApiGeneratedQuestion): GeneratedQuestion {
  const promptType: GeneratedQuestion["promptType"] =
    q.prompt_type === "enrichment" ? "enrichment" : "missing"

  return {
    question: q.question,
    field: q.field,
    section: questionSectionIdToFieldSection(q.section),
    priority: q.priority,
    context: q.context,
    promptType,
    existingValues: q.existing_values?.map((v) => String(v)) ?? null,
  }
}

export function mapSectionResultToColdCaller(
  section: SectionQuestionResult,
): ColdCallerSectionQuestions {
  return {
    section: questionSectionIdToFieldSection(section.section),
    label: section.label,
    missingFields: dedupeApiFieldNames(section.missing_fields),
    questions: section.questions.map(mapApiQuestionToColdCaller),
  }
}

export function mapGenerateQuestionsResponse(
  response: GenerateQuestionsResponse,
): ColdCallerSectionQuestions[] {
  return response.sections.map(mapSectionResultToColdCaller)
}

export function flattenSectionQuestions(
  sections: ColdCallerSectionQuestions[],
): GeneratedQuestion[] {
  return sections.flatMap((s) => s.questions)
}

export function totalMissingFieldsCount(sections: ColdCallerSectionQuestions[]): number {
  return sections.reduce((sum, s) => sum + s.missingFields.length, 0)
}

/** Section complete only when no missing fields and no questions (enrichment-only → not complete). § 4.14 */
export function isSectionComplete(section: ColdCallerSectionQuestions): boolean {
  return section.missingFields.length === 0 && section.questions.length === 0
}
