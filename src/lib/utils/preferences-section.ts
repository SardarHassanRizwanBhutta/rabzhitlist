import type { ColdCallerSectionQuestions, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import { ALL_FIELD_SECTIONS } from "@/lib/utils/question-section-map"
import { isPreferencesTabField } from "@/lib/utils/basic-information-questions"

export { isPreferencesTabField as isPreferencesApiFieldName }

/** Call Notes tab order — five API sections plus frontend-only Preferences. */
export const CALL_NOTES_DISPLAY_SECTIONS: FieldSection[] = [
  ...ALL_FIELD_SECTIONS,
  "preferences",
]

const EMPTY_PREFERENCES_SECTION: ColdCallerSectionQuestions = {
  section: "preferences",
  label: "Preferences",
  missingFields: [],
  questions: [],
}

export function partitionBasicIntoPreferences(section: ColdCallerSectionQuestions): {
  basic: ColdCallerSectionQuestions
  preferences: ColdCallerSectionQuestions
} {
  const prefMissing = section.missingFields.filter(isPreferencesTabField)
  const basicMissing = section.missingFields.filter((f) => !isPreferencesTabField(f))
  const prefQuestions = section.questions
    .filter((q) => isPreferencesTabField(q.field))
    .map(remapQuestionToPreferences)
  const basicQuestions = section.questions.filter((q) => !isPreferencesTabField(q.field))

  return {
    basic: {
      ...section,
      missingFields: basicMissing,
      questions: basicQuestions,
    },
    preferences: {
      section: "preferences",
      label: "Preferences",
      missingFields: prefMissing,
      questions: prefQuestions,
    },
  }
}

function remapQuestionToPreferences(question: GeneratedQuestion): GeneratedQuestion {
  return { ...question, section: "preferences" }
}

/**
 * Splits salary fields from `basic_information` into a frontend-only Preferences tab.
 * CNIC and Personality Type stay on Basic Information.
 * Missing-only keys are routed by `field`; populated salaries render as FE value cards.
 */
export function buildCallNotesSectionResults(
  questionSections: ColdCallerSectionQuestions[],
): Map<FieldSection, ColdCallerSectionQuestions> {
  const map = new Map<FieldSection, ColdCallerSectionQuestions>()

  for (const section of questionSections) {
    if (section.section === "basic") {
      const { basic, preferences } = partitionBasicIntoPreferences(section)
      map.set("basic", basic)
      map.set("preferences", preferences)
    } else {
      map.set(section.section, section)
    }
  }

  if (!map.has("preferences")) {
    map.set("preferences", EMPTY_PREFERENCES_SECTION)
  }

  return map
}
