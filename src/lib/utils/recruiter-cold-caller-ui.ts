import type { Candidate } from "@/lib/types/candidate"
import type {
  ColdCallerSectionQuestions,
  EmptyField,
  FieldSection,
  GeneratedQuestion,
} from "@/types/cold-caller"
import type { AllowedEmptyField } from "@/types/call-notes-extraction"
import {
  WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
  WORK_EXPERIENCE_ROLE_FIELD_ORDER,
} from "@/lib/utils/qg-field-weights"
import { isRecruiterExcludedQgApiField } from "@/lib/utils/recruiter-candidate-access"

export type WeCompensationFieldOrders = {
  role: readonly (typeof WORK_EXPERIENCE_ROLE_FIELD_ORDER)[number][]
  employer: readonly (typeof WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER)[number][]
}

const DEFAULT_WE_FIELD_ORDERS: WeCompensationFieldOrders = {
  role: WORK_EXPERIENCE_ROLE_FIELD_ORDER,
  employer: WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER,
}

/** Work experience field lists for Call Notes sidebar (omits comp keys when hidden). */
export function workExperienceFieldOrdersForCompensationUi(
  hideCompensationUi: boolean,
): WeCompensationFieldOrders {
  if (!hideCompensationUi) return DEFAULT_WE_FIELD_ORDERS
  return {
    role: WORK_EXPERIENCE_ROLE_FIELD_ORDER.filter((key) => key !== "benefits"),
    employer: WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER.filter((key) => key !== "salaryPolicy"),
  }
}

export function filterRecruiterColdCallerEmptyFields(fields: EmptyField[]): EmptyField[] {
  return fields.filter((field) => !isRecruiterExcludedQgApiField(field.apiFieldName))
}

export function filterRecruiterAllowedExtractFields(
  fields: AllowedEmptyField[],
): AllowedEmptyField[] {
  return fields.filter((field) => !isRecruiterExcludedQgApiField(field.apiFieldName))
}

export function filterRecruiterGeneratedQuestions(
  questions: GeneratedQuestion[],
): GeneratedQuestion[] {
  return questions.filter((question) => !isRecruiterExcludedQgApiField(question.field))
}

export function filterRecruiterQuestionSections(
  sections: ColdCallerSectionQuestions[],
): ColdCallerSectionQuestions[] {
  return sections
    .filter((section) => section.section !== "preferences")
    .map((section) => ({
      ...section,
      questions: section.questions.filter(
        (question) => !isRecruiterExcludedQgApiField(question.field),
      ),
      missingFields: section.missingFields.filter(
        (name) => !isRecruiterExcludedQgApiField(name),
      ),
    }))
}

export function filterRecruiterCallNotesSections(sections: FieldSection[]): FieldSection[] {
  return sections.filter((section) => section !== "preferences")
}

export function applyRecruiterColdCallerQuestionState(
  sections: ColdCallerSectionQuestions[],
  flat: GeneratedQuestion[],
): { sections: ColdCallerSectionQuestions[]; flat: GeneratedQuestion[] } {
  return {
    sections: filterRecruiterQuestionSections(sections),
    flat: filterRecruiterGeneratedQuestions(flat),
  }
}
