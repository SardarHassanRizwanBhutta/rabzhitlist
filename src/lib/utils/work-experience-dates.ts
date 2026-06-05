/** Calendar-day key for local date-only comparison (YYYY-MM-DD). */
export function toLocalDateOnlyKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Format a Date as ISO DateOnly using local calendar (not UTC). */
export function formatLocalDateForApi(d: Date | undefined): string | null {
  if (!d || Number.isNaN(d.getTime())) return null
  return toLocalDateOnlyKey(d)
}

/** Parse API DateOnly (`yyyy-MM-dd`) as local calendar midnight (not UTC). */
export function parseLocalDateFromApi(value: string): Date | undefined {
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined
  }

  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return undefined
  }
  return d
}

function formatDateForMessage(d: Date): string {
  return toLocalDateOnlyKey(d)
}

export type WorkExperienceDateFieldErrors = {
  startDate?: string
  endDate?: string
}

/**
 * Validates work experience dates against backend / DB rule:
 * `end_date IS NULL OR start_date <= end_date`, and end requires start.
 */
export function getWorkExperienceDateFieldErrors(
  experienceIndex: number,
  startDate: Date | undefined,
  endDate: Date | undefined,
): WorkExperienceDateFieldErrors {
  if (!endDate) return {}

  if (!startDate) {
    return {
      startDate: `Work experience ${experienceIndex}: start date is required when end date is set.`,
    }
  }

  const startKey = toLocalDateOnlyKey(startDate)
  const endKey = toLocalDateOnlyKey(endDate)
  if (startKey > endKey) {
    return {
      endDate: `Work experience ${experienceIndex}: end date (${formatDateForMessage(endDate)}) must be on or after start date (${formatDateForMessage(startDate)}).`,
    }
  }

  return {}
}

/** Human-readable label for suggest-and-apply actions (e.g. "Mar 2025"). */
export function formatWorkExperienceDateLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}

/**
 * When end is before start, suggest the most likely fix (resume month+year ambiguity):
 * same end month/day in start year, or start year + 1 if still before start.
 */
export function getWorkExperienceEndDateSuggestion(
  startDate: Date | undefined,
  endDate: Date | undefined,
): Date | null {
  if (!startDate || !endDate) return null
  if (toLocalDateOnlyKey(startDate) <= toLocalDateOnlyKey(endDate)) return null

  const startYear = startDate.getFullYear()
  const candidates = [
    new Date(startYear, endDate.getMonth(), endDate.getDate()),
    new Date(startYear + 1, endDate.getMonth(), endDate.getDate()),
  ]

  for (const candidate of candidates) {
    if (Number.isNaN(candidate.getTime())) continue
    if (toLocalDateOnlyKey(candidate) >= toLocalDateOnlyKey(startDate)) {
      return candidate
    }
  }

  return null
}

/** Full validation message for warnings (includes resume-review hint). */
export function getWorkExperienceDateWarningMessage(
  experienceIndex: number,
  startDate: Date | undefined,
  endDate: Date | undefined,
  options?: { hasSuggestion?: boolean },
): string | null {
  const fieldErrors = getWorkExperienceDateFieldErrors(experienceIndex, startDate, endDate)
  const core = fieldErrors.endDate ?? fieldErrors.startDate
  if (!core) return null
  if (options?.hasSuggestion) {
    return `${core} Apply the suggested end date below, or clear end date if still employed.`
  }
  return `${core} Check whether the end year should be later or leave end date empty if still employed.`
}

export type WorkExperienceDateSuggestion = {
  suggestedEndDate: Date
  label: string
}

export function getWorkExperienceDateSuggestion(
  startDate: Date | undefined,
  endDate: Date | undefined,
): WorkExperienceDateSuggestion | null {
  const suggestedEndDate = getWorkExperienceEndDateSuggestion(startDate, endDate)
  if (!suggestedEndDate) return null
  return {
    suggestedEndDate,
    label: formatWorkExperienceDateLabel(suggestedEndDate),
  }
}
