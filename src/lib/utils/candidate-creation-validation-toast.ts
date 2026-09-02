import { createElement } from "react"
import { toast } from "sonner"

/** Mirrors `CandidateCreationDialog` form validation error shape. */
export type CandidateCreationValidationErrors = {
  basic?: Partial<Record<string, string>>
  workExperiences?: {
    [index: number]: Partial<Record<string, string>> & {
      projects?: { [projectIndex: number]: Partial<Record<string, string>> }
    }
  }
  certifications?: { [index: number]: Partial<Record<string, string>> }
  educations?: { [index: number]: Partial<Record<string, string>> }
  achievements?: { [index: number]: Partial<Record<string, string>> }
}

const BASIC_FIELD_ORDER = [
  "name",
  "city",
  "email",
  "contactNumber",
  "source",
  "cnic",
  "postingTitle",
  "personalityType",
  "linkedinUrl",
  "githubUrl",
] as const

const BASIC_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  city: "City",
  email: "Email",
  contactNumber: "Contact Number",
  source: "Source",
  cnic: "CNIC",
  postingTitle: "Posting Title",
  personalityType: "Personality Type",
  linkedinUrl: "LinkedIn URL",
  githubUrl: "GitHub URL",
}

const WORK_EXPERIENCE_FIELD_ORDER = [
  "employerId",
  "employerName",
  "jobTitle",
  "startDate",
  "endDate",
] as const

const WORK_EXPERIENCE_FIELD_LABELS: Record<string, string> = {
  employerId: "Employer",
  employerName: "Employer",
  employerLocationId: "Office Location",
  jobTitle: "Job Title",
  startDate: "Start Date",
  endDate: "End Date",
}

const EDUCATION_FIELD_ORDER = [
  "universityLocationId",
  "degreeName",
  "majorName",
] as const

const EDUCATION_FIELD_LABELS: Record<string, string> = {
  universityLocationId: "University",
  campusLocationId: "Campus",
  degreeName: "Degree Name",
  majorName: "Major Name",
}

const CERTIFICATION_FIELD_ORDER = ["certificationId", "certificationUrl"] as const

const CERTIFICATION_FIELD_LABELS: Record<string, string> = {
  certificationId: "Certification",
  certificationUrl: "Certification URL",
}

const ACHIEVEMENT_FIELD_ORDER = ["name", "achievementType", "url"] as const

const ACHIEVEMENT_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  achievementType: "Achievement Type",
  url: "URL",
}

const PROJECT_FIELD_LABELS: Record<string, string> = {
  projectId: "Project",
  projectName: "Project",
  contributionNotes: "Contribution",
  isMainContribution: "Main Contributor",
}

function sortedNumericKeys(record: Record<number, unknown> | undefined): number[] {
  if (!record) return []
  return Object.keys(record)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
}

function formatFieldLine(sectionLabel: string, fieldLabel: string, message: string): string {
  const location = `${sectionLabel} — ${fieldLabel}`
  if (message.endsWith(" is required")) {
    return location
  }
  return `${location}: ${message}`
}

function collectBasicMessages(errors: CandidateCreationValidationErrors["basic"]): string[] {
  if (!errors) return []
  const messages: string[] = []
  const seen = new Set<string>()

  for (const key of BASIC_FIELD_ORDER) {
    const message = errors[key]
    if (message && !seen.has(key)) {
      messages.push(formatFieldLine("Basic Information", BASIC_FIELD_LABELS[key] ?? key, message))
      seen.add(key)
    }
  }

  for (const [key, message] of Object.entries(errors)) {
    if (!message || seen.has(key)) continue
    messages.push(
      formatFieldLine("Basic Information", BASIC_FIELD_LABELS[key] ?? key, message),
    )
  }

  return messages
}

function collectWorkExperienceMessages(
  errors: CandidateCreationValidationErrors["workExperiences"],
): string[] {
  if (!errors) return []
  const messages: string[] = []

  for (const index of sortedNumericKeys(errors)) {
    const row = errors[index]
    if (!row) continue
    const sectionLabel = `Work Experience ${index + 1}`

    for (const key of WORK_EXPERIENCE_FIELD_ORDER) {
      const message = row[key]
      if (message) {
        messages.push(
          formatFieldLine(sectionLabel, WORK_EXPERIENCE_FIELD_LABELS[key] ?? key, message),
        )
      }
    }

    for (const [key, message] of Object.entries(row)) {
      if (key === "projects" || typeof message !== "string" || !message) continue
      if (WORK_EXPERIENCE_FIELD_LABELS[key]) continue
      messages.push(formatFieldLine(sectionLabel, key, message))
    }

    for (const projectIndex of sortedNumericKeys(row.projects)) {
      const projectErrors = row.projects?.[projectIndex]
      if (!projectErrors) continue
      const projectSection = `${sectionLabel}, Project ${projectIndex + 1}`

      for (const [key, message] of Object.entries(projectErrors)) {
        if (!message) continue
        messages.push(
          formatFieldLine(projectSection, PROJECT_FIELD_LABELS[key] ?? key, message),
        )
      }
    }
  }

  return messages
}

function collectIndexedSectionMessages(
  sectionName: string,
  fieldOrder: readonly string[],
  fieldLabels: Record<string, string>,
  errors: Record<number, Partial<Record<string, string>>> | undefined,
): string[] {
  if (!errors) return []
  const messages: string[] = []

  for (const index of sortedNumericKeys(errors)) {
    const row = errors[index]
    if (!row) continue
    const sectionLabel = `${sectionName} ${index + 1}`

    for (const key of fieldOrder) {
      const message = row[key]
      if (message) {
        messages.push(formatFieldLine(sectionLabel, fieldLabels[key] ?? key, message))
      }
    }

    for (const [key, message] of Object.entries(row)) {
      if (!message || fieldLabels[key]) continue
      messages.push(formatFieldLine(sectionLabel, key, message))
    }
  }

  return messages
}

/** Flatten validation errors into ordered, human-readable lines for toast display. */
export function collectCandidateCreationValidationMessages(
  errors: CandidateCreationValidationErrors,
): string[] {
  return [
    ...collectBasicMessages(errors.basic),
    ...collectWorkExperienceMessages(errors.workExperiences),
    ...collectIndexedSectionMessages(
      "Education",
      EDUCATION_FIELD_ORDER,
      EDUCATION_FIELD_LABELS,
      errors.educations,
    ),
    ...collectIndexedSectionMessages(
      "Certification",
      CERTIFICATION_FIELD_ORDER,
      CERTIFICATION_FIELD_LABELS,
      errors.certifications,
    ),
    ...collectIndexedSectionMessages(
      "Achievement",
      ACHIEVEMENT_FIELD_ORDER,
      ACHIEVEMENT_FIELD_LABELS,
      errors.achievements,
    ),
  ]
}

export function showCandidateCreationValidationToast(
  errors: CandidateCreationValidationErrors,
): void {
  const messages = collectCandidateCreationValidationMessages(errors)
  if (messages.length === 0) return

  const count = messages.length
  toast.error(
    count === 1 ? "Complete 1 required field" : `Complete ${count} required fields`,
    {
      description: createElement(
        "ul",
        {
          className:
            "mt-1.5 max-h-48 space-y-1 overflow-y-auto p-0 text-sm leading-snug text-foreground list-none",
        },
        messages.map((line, index) =>
          createElement(
            "li",
            { key: `${index}-${line}`, className: "font-medium text-foreground" },
            `• ${line}`,
          ),
        ),
      ),
      duration: 12_000,
      classNames: {
        description: "!text-foreground !opacity-100",
      },
    },
  )
}
