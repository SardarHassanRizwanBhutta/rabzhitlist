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
