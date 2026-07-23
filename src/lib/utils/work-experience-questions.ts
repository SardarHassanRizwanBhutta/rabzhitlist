import type { GeneratedQuestion } from "@/types/cold-caller"
import {
  PROJECT_CATALOG_FIELD_LABELS,
  sortProjectAccordionQuestions,
} from "@/lib/utils/project-catalog-fields"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"

const WORK_EXP_OPENER = "work_experiences"
const ROLE_SUFFIX_RE = /^work_experience_(\d+)_(.+)$/
const PROJECTS_OPENER_RE = /^work_experience_(\d+)_projects$/
const NESTED_PROJECT_RE = /^work_experience_(\d+)_project_(\d+)_(.+)$/
const OFFICE_RE = /^work_experience_(\d+)_office_(\d+)_(.+)$/
const LAYOFF_RE = /^work_experience_(\d+)_layoff_(\d+)_(.+)$/

export const WORK_EXPERIENCE_LINK_SUFFIXES = new Set([
  "jobTitle",
  "employerName",
  "techStacks",
  "shiftType",
  "workMode",
  "timeSupportZones",
  "benefits",
])

export const WORK_EXPERIENCE_CATALOG_SUFFIXES = new Set([
  "status",
  "headcount",
  "awards",
  "salaryPolicy",
])

const ROLE_FIELD_LABELS: Record<string, string> = {
  jobTitle: "Job title",
  employerName: "Employer",
  techStacks: "Tech stacks",
  shiftType: "Shift type",
  workMode: "Work mode",
  timeSupportZones: "Time support zones",
  benefits: "Benefits",
  projects: "Projects",
  status: "Status",
  headcount: "Headcount",
  awards: "Awards",
  salaryPolicy: "Salary policy",
  country: "Country",
  city: "City",
  address: "Address",
  layoffDate: "Layoff date",
  affectedEmployees: "Affected employees",
  reason: "Reason",
}

/** Nested project suffix overrides per § 4.7.7 (differs from role-level labels). */
const NESTED_PROJECT_FIELD_LABELS: Record<string, string> = {
  projectName: "Name",
  contributionNotes: "Contribution",
  employerName: "Project employer",
  projectType: "Project type",
  status: "Status",
  minTeamSize: "Min team size",
  maxTeamSize: "Max team size",
  teamSize: "Team size",
  verticalDomains: "Vertical domains",
  horizontalDomains: "Horizontal domains",
  technicalDomains: "Technical domains",
  description: "Description",
  latestUpdate: "Latest Update",
  projectLink: "Project link",
  isPublished: "Published",
  publishPlatforms: "Publish platforms",
  downloadCount: "Download count",
  technicalAspects: "Technical aspects",
  techStacks: "Tech stacks",
  startDate: "Start date",
  endDate: "End date",
}

export interface WorkExperienceOfficeQuestionGroup {
  officeIndex: number
  questions: GeneratedQuestion[]
}

export interface WorkExperienceLayoffQuestionGroup {
  layoffIndex: number
  questions: GeneratedQuestion[]
}

export interface WorkExperienceQuestionGroup {
  index: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
  officeGroups: WorkExperienceOfficeQuestionGroup[]
  layoffGroups: WorkExperienceLayoffQuestionGroup[]
  projectsOpener: GeneratedQuestion | null
  projectGroups: Map<number, GeneratedQuestion[]>
}

export function dedupeQuestionsByField(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  const seen = new Set<string>()
  return questions.filter((q) => {
    if (!q.field || seen.has(q.field)) return false
    seen.add(q.field)
    return true
  })
}

export function sortQuestionsByPriority(a: GeneratedQuestion, b: GeneratedQuestion): number {
  return b.priority - a.priority || a.field.localeCompare(b.field)
}

export function sortNestedProjectAccordionQuestions(
  items: GeneratedQuestion[],
): GeneratedQuestion[] {
  return sortProjectAccordionQuestions(items, sortQuestionsByPriority)
}

export function workExperienceEmployerDetailsLabel(count: number): string {
  const noun = count === 1 ? "question" : "questions"
  return `Complete employer details — ${count} ${noun}`
}

export function workExperienceOfficeGroupLabel(officeIndex: number): string {
  return `Office ${officeIndex + 1}`
}

export function workExperienceLayoffGroupLabel(layoffIndex: number): string {
  return `Layoff ${layoffIndex + 1}`
}

export function groupWorkExperienceQuestions(questions: GeneratedQuestion[]): {
  sectionOpener: GeneratedQuestion | null
  cards: WorkExperienceQuestionGroup[]
} {
  const deduped = dedupeQuestionsByField(questions)

  let sectionOpener: GeneratedQuestion | null = null
  const cards = new Map<
    number,
    {
      link: GeneratedQuestion[]
      catalog: GeneratedQuestion[]
      offices: Map<number, GeneratedQuestion[]>
      layoffs: Map<number, GeneratedQuestion[]>
      projectsOpener: GeneratedQuestion | null
      projectGroups: Map<number, GeneratedQuestion[]>
    }
  >()

  const ensureCard = (i: number) => {
    if (!cards.has(i)) {
      cards.set(i, {
        link: [],
        catalog: [],
        offices: new Map(),
        layoffs: new Map(),
        projectsOpener: null,
        projectGroups: new Map(),
      })
    }
    return cards.get(i)!
  }

  for (const q of deduped) {
    if (q.field === WORK_EXP_OPENER) {
      sectionOpener = q
      continue
    }

    const nested = NESTED_PROJECT_RE.exec(q.field)
    if (nested) {
      const i = Number(nested[1])
      const j = Number(nested[2])
      const card = ensureCard(i)
      if (!card.projectGroups.has(j)) card.projectGroups.set(j, [])
      card.projectGroups.get(j)!.push(q)
      continue
    }

    const projOpener = PROJECTS_OPENER_RE.exec(q.field)
    if (projOpener) {
      ensureCard(Number(projOpener[1])).projectsOpener = q
      continue
    }

    const office = OFFICE_RE.exec(q.field)
    if (office) {
      const i = Number(office[1])
      const j = Number(office[2])
      const card = ensureCard(i)
      if (!card.offices.has(j)) card.offices.set(j, [])
      card.offices.get(j)!.push(q)
      continue
    }

    const layoff = LAYOFF_RE.exec(q.field)
    if (layoff) {
      const i = Number(layoff[1])
      const j = Number(layoff[2])
      const card = ensureCard(i)
      if (!card.layoffs.has(j)) card.layoffs.set(j, [])
      card.layoffs.get(j)!.push(q)
      continue
    }

    const role = ROLE_SUFFIX_RE.exec(q.field)
    if (!role || role[2] === "projects") continue

    const i = Number(role[1])
    const suffix = role[2]
    const card = ensureCard(i)

    if (WORK_EXPERIENCE_LINK_SUFFIXES.has(suffix)) {
      card.link.push(q)
    } else if (WORK_EXPERIENCE_CATALOG_SUFFIXES.has(suffix)) {
      card.catalog.push(q)
    }
  }

  const result: WorkExperienceQuestionGroup[] = [...cards.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, card]) => ({
      index,
      title: `Work Experience ${index + 1}`,
      linkQuestions: [...card.link].sort(sortQuestionsByPriority),
      catalogQuestions: [...card.catalog].sort(sortQuestionsByPriority),
      officeGroups: [...card.offices.entries()]
        .sort(([a], [b]) => a - b)
        .map(([officeIndex, officeQuestions]) => ({
          officeIndex,
          questions: [...officeQuestions].sort(sortQuestionsByPriority),
        })),
      layoffGroups: [...card.layoffs.entries()]
        .sort(([a], [b]) => a - b)
        .map(([layoffIndex, layoffQuestions]) => ({
          layoffIndex,
          questions: [...layoffQuestions].sort(sortQuestionsByPriority),
        })),
      projectsOpener: card.projectsOpener,
      projectGroups: card.projectGroups,
    }))

  for (const card of result) {
    for (const [j, list] of card.projectGroups) {
      card.projectGroups.set(j, sortNestedProjectAccordionQuestions(list))
    }
  }

  return { sectionOpener, cards: result }
}

export function nestedProjectAccordionTitle(projectIndex: number): string {
  return projectIndex === 0 ? "New project" : `Project ${projectIndex + 1}`
}

export function nestedProjectAccordionLabel(
  projectIndex: number,
  questionCount: number,
): string {
  const title = nestedProjectAccordionTitle(projectIndex)
  const noun = questionCount === 1 ? "question" : "questions"
  return `${title} — ${questionCount} ${noun}`
}

export function formatWorkExperienceFieldLabel(field: string): string {
  if (field === WORK_EXP_OPENER) return "Work experience (section)"

  const office = OFFICE_RE.exec(field)
  if (office) {
    return ROLE_FIELD_LABELS[office[3]] ?? office[3]
  }

  const layoff = LAYOFF_RE.exec(field)
  if (layoff) {
    return ROLE_FIELD_LABELS[layoff[3]] ?? layoff[3]
  }

  const nested = NESTED_PROJECT_RE.exec(field)
  if (nested) {
    const suffix = nested[3]
    return (
      NESTED_PROJECT_FIELD_LABELS[suffix] ??
      PROJECT_CATALOG_FIELD_LABELS[suffix as keyof typeof PROJECT_CATALOG_FIELD_LABELS] ??
      suffix
    )
  }

  if (PROJECTS_OPENER_RE.test(field)) return "Projects"

  const role = ROLE_SUFFIX_RE.exec(field)
  if (role) {
    const suffix = role[2]
    return ROLE_FIELD_LABELS[suffix] ?? suffix
  }

  return field
}

export function countWorkExperienceRoleIndices(missingFields: string[]): number {
  const indices = new Set<number>()
  for (const key of missingFields) {
    const m = key.match(/^work_experience_(\d+)_/)
    if (m) indices.add(Number(m[1]))
  }
  return indices.size
}

/** Compact missing-fields summary per § 4.7.6. */
export function summarizeWorkExperienceMissingFields(missingFields: string[]): string {
  const deduped = dedupeApiFieldNames(missingFields)
  const count = deduped.length
  if (count === 0) return "Work Experience — section complete"

  const roleCount = countWorkExperienceRoleIndices(deduped)
  const fieldWord = count === 1 ? "field" : "fields"

  if (roleCount === 0) {
    return `Work Experience — ${count} ${fieldWord} missing`
  }

  const expWord = roleCount === 1 ? "work experience" : "work experiences"
  return `Work Experience — ${count} ${fieldWord} missing across ${roleCount} ${expWord}`
}

export function countMissingFieldsForWorkExperienceCard(
  missingFields: string[],
  roleIndex: number,
): number {
  const prefix = `work_experience_${roleIndex}_`
  return dedupeApiFieldNames(missingFields).filter((key) => key.startsWith(prefix)).length
}

/** Display-only subtitle per § 4.7.5 — employer and/or job title from candidate payload. */
export function formatWorkExperienceCardSubtitle(workExperience?: {
  employerName?: string | null
  jobTitle?: string | null
} | null): string | null {
  if (!workExperience) return null

  const parts = [workExperience.employerName, workExperience.jobTitle]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  if (parts.length === 0) return null
  return parts.join(" · ")
}
