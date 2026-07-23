import type { GeneratedQuestion, ColdCallerSectionQuestions } from "@/types/cold-caller"
import type {
  ApiGeneratedQuestion,
  GenerateQuestionsResponse,
  SectionQuestionResult,
} from "@/types/question-generation"
import { questionSectionIdToFieldSection } from "@/lib/utils/question-section-map"
import {
  COLD_CALLER_QG_SECTION_ORDER,
  isQuestionFieldAllowed,
  isQuestionSectionAllowed,
} from "@/lib/utils/question-field-allowlist"

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

function mapPromptType(
  value: ApiGeneratedQuestion["prompt_type"],
): GeneratedQuestion["promptType"] {
  if (value === "basic" || value === "advanced" || value === "enrichment") {
    return value
  }
  // Legacy `"missing"` (pre-sync) → treat as basic.
  return "basic"
}

export function mapApiQuestionToColdCaller(q: ApiGeneratedQuestion): GeneratedQuestion {
  return {
    question: q.question,
    field: q.field,
    section: questionSectionIdToFieldSection(q.section),
    priority: q.priority,
    context: q.context,
    promptType: mapPromptType(q.prompt_type),
  }
}

export function mapSectionResultToColdCaller(
  section: SectionQuestionResult,
): ColdCallerSectionQuestions {
  const allowedMissingFields = section.missing_fields.filter((field) =>
    isQuestionFieldAllowed(section.section, field),
  )
  const allowedQuestions = section.questions.filter(
    (question) =>
      question.section === section.section &&
      isQuestionFieldAllowed(section.section, question.field) &&
      question.prompt_type !== "enrichment",
  )

  return {
    section: questionSectionIdToFieldSection(section.section),
    label: section.label,
    missingFields: dedupeApiFieldNames(allowedMissingFields),
    questions: allowedQuestions.map(mapApiQuestionToColdCaller),
  }
}

export function mapGenerateQuestionsResponse(
  response: GenerateQuestionsResponse,
): ColdCallerSectionQuestions[] {
  const sectionsById = new Map(
    response.sections
      .filter((section) => isQuestionSectionAllowed((section as { section?: unknown }).section))
      .map((section) => [section.section, section]),
  )

  return COLD_CALLER_QG_SECTION_ORDER.flatMap((sectionId) => {
    const section = sectionsById.get(sectionId)
    return section ? [mapSectionResultToColdCaller(section)] : []
  })
}

export function flattenSectionQuestions(
  sections: ColdCallerSectionQuestions[],
): GeneratedQuestion[] {
  return sections.flatMap((s) => s.questions)
}

export function totalMissingFieldsCount(sections: ColdCallerSectionQuestions[]): number {
  return sections.reduce((sum, s) => sum + s.missingFields.length, 0)
}

/** Section complete when no missing allowlisted fields remain. */
export function isSectionComplete(section: ColdCallerSectionQuestions): boolean {
  return section.missingFields.length === 0
}
