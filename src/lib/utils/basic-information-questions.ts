/** Allowlisted basic/preferences API fields (missing-only). */
export const BASIC_ALWAYS_ASK_API_FIELDS = new Set([
  "cnic",
  "personalityType",
  "currentSalary",
  "expectedSalary",
])

/** Salaries shown on the Call Notes Preferences tab. */
export const PREFERENCES_TAB_API_FIELDS = new Set(["currentSalary", "expectedSalary"])

export function isBasicAlwaysAskField(field: string): boolean {
  return BASIC_ALWAYS_ASK_API_FIELDS.has(field)
}

export function isPreferencesTabField(field: string): boolean {
  return PREFERENCES_TAB_API_FIELDS.has(field)
}
