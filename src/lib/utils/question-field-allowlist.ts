import type { QuestionSectionId } from "@/types/question-generation"

const BASIC_FIELDS = new Set(["resume", "linkedinUrl"])

const PREFERENCES_FIELDS = new Set(["currentSalary", "expectedSalary"])

/** Role + Employer scalar suffixes on `work_experience_{i}_*`. */
const WORK_EXPERIENCE_ROW_SUFFIXES = new Set([
  "jobTitle",
  "startDate",
  "shiftType",
  "workMode",
  "techStacks",
  "timeSupportZones",
  "benefits",
  "employerName",
  "headcount",
  "types",
  "foundedYear",
  "salaryPolicy",
  "status",
  "linkedinUrl",
])

const PROJECT_SUFFIXES = new Set([
  "projectName",
  "employerName",
  "projectType",
  "startDate",
  "status",
  "description",
  "contributionNotes",
  "techStacks",
  "verticalDomains",
  "horizontalDomains",
  "technicalDomains",
  "technicalAspects",
  "minTeamSize",
  "clientLocations",
  "latestUpdate",
  "maxTeamSize",
  "endDate",
])

const OFFICE_SUFFIXES = new Set([
  "country",
  "city",
  "address",
  "isHeadquarters",
])
const LAYOFF_SUFFIXES = new Set(["layoffDate", "affectedEmployees", "reason"])
const CERTIFICATION_SUFFIXES = new Set([
  "name",
  "issueDate",
  "expiryDate",
  "issuingBody",
])
const ACHIEVEMENT_SUFFIXES = new Set([
  "name",
  "year",
  "description",
  "achievementType",
  "ranking",
  "url",
])

export const COLD_CALLER_QG_SECTION_ORDER: QuestionSectionId[] = [
  "basic_information",
  "preferences",
  "work_experience",
  "independent_tech_stacks",
  "certifications",
  "achievements",
]

export function isQuestionSectionAllowed(value: unknown): value is QuestionSectionId {
  return (
    typeof value === "string" &&
    COLD_CALLER_QG_SECTION_ORDER.includes(value as QuestionSectionId)
  )
}

function isWorkExperienceFieldAllowed(field: string): boolean {
  const project = /^work_experience_\d+_project_\d+_(.+)$/.exec(field)
  if (project) return PROJECT_SUFFIXES.has(project[1])

  const office = /^work_experience_\d+_office_\d+_(.+)$/.exec(field)
  if (office) return OFFICE_SUFFIXES.has(office[1])

  const layoff = /^work_experience_\d+_layoff_\d+_(.+)$/.exec(field)
  if (layoff) return LAYOFF_SUFFIXES.has(layoff[1])

  const role = /^work_experience_\d+_(.+)$/.exec(field)
  return role ? WORK_EXPERIENCE_ROW_SUFFIXES.has(role[1]) : false
}

export function isQuestionFieldAllowed(
  section: QuestionSectionId,
  field: string,
): boolean {
  switch (section) {
    case "basic_information":
      return BASIC_FIELDS.has(field)
    case "preferences":
      return PREFERENCES_FIELDS.has(field)
    case "work_experience":
      return isWorkExperienceFieldAllowed(field)
    case "independent_tech_stacks":
      return field === "techStacks"
    case "certifications":
      return CERTIFICATION_SUFFIXES.has(
        /^certification_\d+_(.+)$/.exec(field)?.[1] ?? "",
      )
    case "achievements":
      return ACHIEVEMENT_SUFFIXES.has(
        /^achievement_\d+_(.+)$/.exec(field)?.[1] ?? "",
      )
  }
}
