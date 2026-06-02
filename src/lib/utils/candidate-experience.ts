import type { Candidate } from "@/lib/types/candidate"

/** Numeric years from API (`totalExperienceYears` or `totalExperienceMonths / 12`). */
export function getTotalExperienceYears(candidate: {
  totalExperienceYears?: number | null
  totalExperienceMonths?: number | null
}): number | null {
  if (
    candidate.totalExperienceYears != null &&
    Number.isFinite(candidate.totalExperienceYears)
  ) {
    return candidate.totalExperienceYears
  }
  if (
    candidate.totalExperienceMonths != null &&
    Number.isFinite(candidate.totalExperienceMonths)
  ) {
    return candidate.totalExperienceMonths / 12
  }
  return null
}

/** Display total experience for list/table cells (backend values only). */
export function formatYearsOfExperience(candidate: {
  totalExperienceYears?: number | null
  totalExperienceMonths?: number | null
}): string {
  const years = getTotalExperienceYears(candidate)

  if (years == null) {
    return "—"
  }

  if (years === 0) {
    return "0 years"
  }

  const rounded = Math.round(years * 10) / 10
  return `${rounded} ${rounded === 1 ? "year" : "years"}`
}
