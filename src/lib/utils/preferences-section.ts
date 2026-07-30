import type { ColdCallerSectionQuestions, FieldSection } from "@/types/cold-caller"
import { ALL_FIELD_SECTIONS } from "@/lib/utils/question-section-map"
import { isPreferencesTabField } from "@/lib/utils/basic-information-questions"

export { isPreferencesTabField as isPreferencesApiFieldName }

/**
 * Call Notes tab order — API-mapped sections (Independent Tech Stacks hidden).
 * Preferences is a real Python section; UI keeps it after Achievements.
 */
export const CALL_NOTES_DISPLAY_SECTIONS: FieldSection[] = [
  ...ALL_FIELD_SECTIONS.filter((section) => section !== "techStacks"),
]

const EMPTY_PREFERENCES_SECTION: ColdCallerSectionQuestions = {
  section: "preferences",
  label: "Preferences",
  missingFields: [],
  questions: [],
}

/**
 * Maps QG section results for Call Notes tabs.
 * Preferences comes from Python `preferences` (no FE salary partition from Basic).
 */
export function buildCallNotesSectionResults(
  questionSections: ColdCallerSectionQuestions[],
): Map<FieldSection, ColdCallerSectionQuestions> {
  const map = new Map<FieldSection, ColdCallerSectionQuestions>()

  for (const section of questionSections) {
    map.set(section.section, section)
  }

  if (!map.has("preferences")) {
    map.set("preferences", EMPTY_PREFERENCES_SECTION)
  }

  return map
}
