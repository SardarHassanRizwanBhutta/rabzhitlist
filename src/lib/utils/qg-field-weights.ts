/**
 * Locked Cold Caller QG field weights for FE value cards
 * (@see docs/COLD_CALLER_QG_FIELD_ALLOWLIST_CONTRACT.md §4).
 */

export const BASIC_FIELD_PRIORITIES: Record<string, number> = {
  cnic: 0.5,
  personalityType: 0.5,
  currentSalary: 1,
  expectedSalary: 1,
}

export const INDEPENDENT_TECH_STACKS_PRIORITY = 5

export const WORK_EXPERIENCE_ROLE_PRIORITIES: Record<string, number> = {
  employerName: 5,
  jobTitle: 2,
  shiftType: 2,
  timeSupportZones: 1,
  workMode: 1,
  techStacks: 10,
  benefits: 7,
}

export const WORK_EXPERIENCE_EMPLOYER_PRIORITIES: Record<string, number> = {
  status: 2.5,
  headcount: 2.5,
  salaryPolicy: 20,
  awards: 0,
}

export const OFFICE_FIELD_PRIORITIES: Record<string, number> = {
  country: 2.5,
  city: 2.5,
  address: 2.5,
}

export const LAYOFF_FIELD_PRIORITIES: Record<string, number> = {
  layoffDate: 2.5,
  affectedEmployees: 2.5,
  reason: 5,
}

export const EDUCATION_FIELD_PRIORITIES: Record<string, number> = {
  universityName: 2,
  isTopper: 1,
}

export const CERTIFICATION_FIELD_PRIORITIES: Record<string, number> = {
  name: 1,
  issueDate: 1,
  expiryDate: 1,
  issuingBody: 7.5,
}

export const WORK_EXPERIENCE_ROLE_FIELD_ORDER = [
  "employerName",
  "jobTitle",
  "shiftType",
  "timeSupportZones",
  "workMode",
  "techStacks",
  "benefits",
] as const

export const WORK_EXPERIENCE_EMPLOYER_FIELD_ORDER = [
  "status",
  "headcount",
  "salaryPolicy",
  "awards",
] as const

export const OFFICE_FIELD_ORDER = ["country", "city", "address"] as const

export const LAYOFF_FIELD_ORDER = [
  "layoffDate",
  "affectedEmployees",
  "reason",
] as const

export const BASIC_FIELD_ORDER = ["cnic", "personalityType"] as const

export const PREFERENCES_FIELD_ORDER = ["currentSalary", "expectedSalary"] as const
