import type { FieldSection } from "@/types/cold-caller"
import type { QuestionSectionId } from "@/types/question-generation"

/** Fixed display order — matches Python service contract. */
export const ALL_FIELD_SECTIONS: FieldSection[] = [
  "basic",
  "workExperience",
  "techStacks",
  "education",
  "certifications",
  "achievements",
]

const SECTION_ID_TO_FIELD: Record<QuestionSectionId, FieldSection> = {
  basic_information: "basic",
  work_experience: "workExperience",
  independent_tech_stacks: "techStacks",
  education: "education",
  certifications: "certifications",
  achievements: "achievements",
}

/** Sections mapped to Python `QuestionSectionId` (excludes frontend-only tabs). */
export type ApiMappedFieldSection = Exclude<FieldSection, "preferences">

const FIELD_TO_SECTION_ID: Record<ApiMappedFieldSection, QuestionSectionId> = {
  basic: "basic_information",
  workExperience: "work_experience",
  techStacks: "independent_tech_stacks",
  education: "education",
  certifications: "certifications",
  achievements: "achievements",
}

export function questionSectionIdToFieldSection(id: QuestionSectionId): FieldSection {
  return SECTION_ID_TO_FIELD[id]
}

export function fieldSectionToQuestionSectionId(section: FieldSection): QuestionSectionId | null {
  if (section === "preferences") return null
  return FIELD_TO_SECTION_ID[section]
}
