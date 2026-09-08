/**
 * Locked Cold Caller QG field weights for FE value cards
 * (@see docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md §4).
 * Orders are weight-descending.
 */

/** Basic Information totals 100: Resume 80 + LinkedIn URL 20. */
export const BASIC_FIELD_PRIORITIES: Record<string, number> = {
  resume: 80,
  linkedinUrl: 20,
}

/** Preferences totals 100: Current 85 + Expected 15. */
export const PREFERENCES_FIELD_PRIORITIES: Record<string, number> = {
  currentSalary: 85,
  expectedSalary: 15,
}

export const INDEPENDENT_TECH_STACKS_PRIORITY = 5

/** Role Details totals 100. */
export const WORK_EXPERIENCE_ROLE_PRIORITIES: Record<string, number> = {
  jobTitle: 19,
  startDate: 17,
  shiftType: 16,
  workMode: 14,
  techStacks: 13,
  timeSupportZones: 11,
  benefits: 10,
}

/** Employer Details scalar fields (office/layoff weights are separate). Totals 100 with nested. */
export const WORK_EXPERIENCE_EMPLOYER_PRIORITIES: Record<string, number> = {
  employerName: 18,
  headcount: 11.5,
  types: 10.5,
  foundedYear: 8.5,
  salaryPolicy: 7.5,
  status: 6,
  linkedinUrl: 5,
}

export const OFFICE_FIELD_PRIORITIES: Record<string, number> = {
  country: 14,
  city: 12.5,
  address: 2.5,
  isHeadquarters: 1.5,
}

export const LAYOFF_FIELD_PRIORITIES: Record<string, number> = {
  layoffDate: 1,
  affectedEmployees: 0.8,
  reason: 0.7,
}

/** Certifications section totals 100; display order follows weight descending. */
export const CERTIFICATION_FIELD_PRIORITIES: Record<string, number> = {
  name: 35,
  issuingBody: 30,
  issueDate: 20,
  expiryDate: 15,
}

export const CERTIFICATION_FIELD_ORDER = [
  "name",
  "issuingBody",
  "issueDate",
  "expiryDate",
] as const

/** Achievements section totals 100; display order follows weight descending. */
export const ACHIEVEMENT_FIELD_PRIORITIES: Record<string, number> = {
  name: 20,
  year: 18,
  description: 17,
  achievementType: 16,
  ranking: 15,
  url: 14,
}

export const WORK_EXPERIENCE_ROLE_FIELD_ORDER = [
  "jobTitle",
  "startDate",
  "shiftType",
  "workMode",
  "techStacks",
  "timeSupportZones",
  "benefits",
] as const

export const WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER = [
  "employerName",
  "headcount",
  "types",
  "foundedYear",
  "salaryPolicy",
  "status",
  "linkedinUrl",
] as const

export const OFFICE_FIELD_ORDER = [
  "country",
  "city",
  "address",
  "isHeadquarters",
] as const

/**
 * Max employer-catalog office rows whitelisted for Call Notes extract Analyze.
 * @see docs/CALL_NOTES_EXTRACT_MULTI_OFFICE_PYTHON_PROMPT_LOCK.md
 */
export const CALL_NOTES_EXTRACT_EMPLOYER_OFFICE_SLOT_CAP = 5

export type EmployerOfficeSlotPurpose = "generate-questions" | "call-notes-extract"

function normalizedEmployerOfficeCount(existingCount: number): number {
  return typeof existingCount === "number" &&
    Number.isFinite(existingCount) &&
    existingCount > 0
    ? Math.floor(existingCount)
    : 0
}

/**
 * Generate Questions: empty `locations` → synthetic `office_0` only
 * (@see COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md §2).
 */
export function generateQuestionsEmployerOfficeSlotCount(existingCount: number): number {
  const n = normalizedEmployerOfficeCount(existingCount)
  return n === 0 ? 1 : n
}

/**
 * Call Notes extract whitelist: pad empty/partial lists up to five slots so
 * multi-office notes can map to `office_0` … `office_4`. Rows above the cap are kept.
 */
export function callNotesExtractEmployerOfficeSlotCount(existingCount: number): number {
  const n = normalizedEmployerOfficeCount(existingCount)
  return Math.max(n, CALL_NOTES_EXTRACT_EMPLOYER_OFFICE_SLOT_CAP)
}

export function employerOfficeSlotCountForPurpose(
  existingCount: number,
  purpose: EmployerOfficeSlotPurpose,
): number {
  return purpose === "call-notes-extract"
    ? callNotesExtractEmployerOfficeSlotCount(existingCount)
    : generateQuestionsEmployerOfficeSlotCount(existingCount)
}

/** @deprecated Prefer `generateQuestionsEmployerOfficeSlotCount`. */
export function paddedEmployerOfficeSlotCount(existingCount: number): number {
  return generateQuestionsEmployerOfficeSlotCount(existingCount)
}

export function paddedEmployerOfficeRowsForPurpose<T>(
  rows: readonly T[] | undefined,
  purpose: EmployerOfficeSlotPurpose,
): Array<T | undefined> {
  const source = rows ?? []
  const count = employerOfficeSlotCountForPurpose(source.length, purpose)
  return Array.from({ length: count }, (_, i) => source[i])
}

/** Generate Questions sparse payload / empty-field detection (single synthetic office when empty). */
export function paddedEmployerOfficeRowsForGenerateQuestions<T>(
  rows: readonly T[] | undefined,
): Array<T | undefined> {
  return paddedEmployerOfficeRowsForPurpose(rows, "generate-questions")
}

/** Call Notes extract allowedEmptyFields builder (up to five office slots when empty). */
export function paddedEmployerOfficeRowsForCallNotesExtract<T>(
  rows: readonly T[] | undefined,
): Array<T | undefined> {
  return paddedEmployerOfficeRowsForPurpose(rows, "call-notes-extract")
}

/** @deprecated Prefer `paddedEmployerOfficeRowsForGenerateQuestions`. */
export function paddedEmployerOfficeRows<T>(
  rows: readonly T[] | undefined,
): Array<T | undefined> {
  return paddedEmployerOfficeRowsForGenerateQuestions(rows)
}

export const LAYOFF_FIELD_ORDER = [
  "layoffDate",
  "affectedEmployees",
  "reason",
] as const

export const BASIC_FIELD_ORDER = ["resume", "linkedinUrl"] as const

export const PREFERENCES_FIELD_ORDER = ["currentSalary", "expectedSalary"] as const

export const ACHIEVEMENT_FIELD_ORDER = [
  "name",
  "year",
  "description",
  "achievementType",
  "ranking",
  "url",
] as const

/** Cold Caller QG label for Preferences expectedSalary (profile UI unchanged). */
export const COLD_CALLER_EXPECTED_SALARY_LABEL = "Expected Salary - Net"
