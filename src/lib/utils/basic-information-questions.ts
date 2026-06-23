/** Always-ask basic fields — § 4.14 / CANDIDATE_DATA_MAPPING.md */
export const BASIC_ALWAYS_ASK_API_FIELDS = new Set([
  "currentSalary",
  "expectedSalary",
  "linkedinUrl",
])

/** Salaries shown on the Call Notes Preferences tab (LinkedIn stays on Basic). */
export const PREFERENCES_TAB_API_FIELDS = new Set(["currentSalary", "expectedSalary"])

export function isBasicAlwaysAskField(field: string): boolean {
  return BASIC_ALWAYS_ASK_API_FIELDS.has(field)
}

export function isPreferencesTabField(field: string): boolean {
  return PREFERENCES_TAB_API_FIELDS.has(field)
}

/** Format on-file values for enrichment chips (salary → currency). */
export function formatAlwaysAskExistingValue(field: string, raw: string): string {
  if (field === "currentSalary" || field === "expectedSalary") {
    const num = Number(String(raw).replace(/[^\d.-]/g, ""))
    if (Number.isFinite(num)) {
      return new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }).format(num)
    }
  }
  return raw
}
