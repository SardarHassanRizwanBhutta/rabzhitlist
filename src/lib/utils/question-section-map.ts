import type { FieldSection } from "@/types/cold-caller"
import type { QuestionSectionId } from "@/types/question-generation"

/**
 * Call Notes UI section ids used when building display order helpers.
 * Independent Tech Stacks remains API-mapped but is filtered out of Cold Caller tabs.
 * Preferences is a real Python section (not FE-only).
 */
export const ALL_FIELD_SECTIONS: FieldSection[] = [
  "basic",
  "workExperience",
  "techStacks",
  "certifications",
  "achievements",
  "preferences",
]

const SECTION_ID_TO_FIELD: Record<QuestionSectionId, FieldSection> = {
  basic_information: "basic",
  preferences: "preferences",
  work_experience: "workExperience",
  independent_tech_stacks: "techStacks",
  certifications: "certifications",
  achievements: "achievements",
}

/** Sections mapped to Python `QuestionSectionId` (excludes Education). */
export type ApiMappedFieldSection = Exclude<FieldSection, "education">

const FIELD_TO_SECTION_ID: Record<ApiMappedFieldSection, QuestionSectionId> = {
  basic: "basic_information",
  preferences: "preferences",
  workExperience: "work_experience",
  techStacks: "independent_tech_stacks",
  certifications: "certifications",
  achievements: "achievements",
}

export function questionSectionIdToFieldSection(id: QuestionSectionId): FieldSection {
  return SECTION_ID_TO_FIELD[id]
}

export function fieldSectionToQuestionSectionId(section: FieldSection): QuestionSectionId | null {
  if (section === "education") return null
  return FIELD_TO_SECTION_ID[section]
}
