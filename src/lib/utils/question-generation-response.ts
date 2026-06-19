import type { GeneratedQuestion, FieldSection, ColdCallerSectionQuestions } from "@/types/cold-caller"
import type {
  ApiGeneratedQuestion,
  GenerateQuestionsResponse,
  SectionQuestionResult,
} from "@/types/question-generation"
import { questionSectionIdToFieldSection } from "@/lib/utils/question-section-map"

export type { ColdCallerSectionQuestions }

export function mapApiQuestionToColdCaller(q: ApiGeneratedQuestion): GeneratedQuestion {
  return {
    question: q.question,
    field: q.field,
    section: questionSectionIdToFieldSection(q.section),
    priority: q.priority,
    context: q.context,
  }
}

export function mapSectionResultToColdCaller(
  section: SectionQuestionResult,
): ColdCallerSectionQuestions {
  return {
    section: questionSectionIdToFieldSection(section.section),
    label: section.label,
    missingFields: section.missing_fields,
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
