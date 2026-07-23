import type { QuestionSectionId } from "@/types/question-generation"

const BASIC_FIELDS = new Set([
  "cnic",
  "personalityType",
  "currentSalary",
  "expectedSalary",
])

const WORK_EXPERIENCE_ROLE_SUFFIXES = new Set([
  "employerName",
  "jobTitle",
  "shiftType",
  "timeSupportZones",
  "workMode",
  "techStacks",
  "benefits",
  "status",
  "headcount",
  "salaryPolicy",
  "awards",
])

const PROJECT_SUFFIXES = new Set([
  "projectName",
  "contributionNotes",
  "employerName",
  "downloadCount",
  "publishPlatforms",
  "projectType",
  "status",
  "teamSize",
  "techStacks",
  "technicalAspects",
  "technicalDomains",
  "horizontalDomains",
  "verticalDomains",
  "description",
  "latestUpdate",
  "startDate",
  "endDate",
  "projectLink",
])

const OFFICE_SUFFIXES = new Set(["country", "city", "address"])
const LAYOFF_SUFFIXES = new Set(["layoffDate", "affectedEmployees", "reason"])
const EDUCATION_SUFFIXES = new Set(["universityName", "isTopper"])
const CERTIFICATION_SUFFIXES = new Set([
  "name",
  "issueDate",
  "expiryDate",
  "issuingBody",
])

export const COLD_CALLER_QG_SECTION_ORDER: QuestionSectionId[] = [
  "basic_information",
  "work_experience",
  "independent_tech_stacks",
  "education",
  "certifications",
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
  return role ? WORK_EXPERIENCE_ROLE_SUFFIXES.has(role[1]) : false
}

export function isQuestionFieldAllowed(
  section: QuestionSectionId,
  field: string,
): boolean {
  switch (section) {
    case "basic_information":
      return BASIC_FIELDS.has(field)
    case "work_experience":
      return isWorkExperienceFieldAllowed(field)
    case "independent_tech_stacks":
      return field === "techStacks"
    case "education":
      return EDUCATION_SUFFIXES.has(/^education_\d+_(.+)$/.exec(field)?.[1] ?? "")
    case "certifications":
      return CERTIFICATION_SUFFIXES.has(
        /^certification_\d+_(.+)$/.exec(field)?.[1] ?? "",
      )
  }
}
