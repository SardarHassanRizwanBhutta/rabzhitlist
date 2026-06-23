import type { GeneratedQuestion } from "@/types/cold-caller"
import {
  PROJECT_CATALOG_FIELD_SUFFIXES,
  PROJECT_CATALOG_FIELD_LABELS,
  catalogDetailsLabel,
} from "@/lib/utils/project-catalog-fields"
import { groupCertificationQuestions } from "@/lib/utils/certification-questions"
import { groupEducationQuestions } from "@/lib/utils/education-questions"
import {
  groupIndependentProjectQuestions,
  type IndependentProjectQuestionGroup,
} from "@/lib/utils/independent-project-questions"
import {
  groupWorkExperienceQuestions,
  nestedProjectAccordionLabel,
  sortQuestionsByPriority,
} from "@/lib/utils/work-experience-questions"

export type { IndependentProjectQuestionGroup }

export interface FlatQuestionBlock {
  type: "flat"
  questions: GeneratedQuestion[]
}

export type ProjectAccordionLayout = "nested-work-experience"

export interface ProjectQuestionAccordion {
  type: "project-accordion"
  title: string
  apiPrefix: string
  layout: ProjectAccordionLayout
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
  accordionQuestions: GeneratedQuestion[]
}

export interface IndependentProjectQuestionBlock {
  type: "independent-project-block"
  projectIndex: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
}

export interface RoleQuestionBlock {
  type: "role-block"
  roleIndex: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
  officeGroups: Array<{
    officeIndex: number
    questions: GeneratedQuestion[]
  }>
  layoffGroups: Array<{
    layoffIndex: number
    questions: GeneratedQuestion[]
  }>
  projectsOpener: GeneratedQuestion | null
  projectAccordions: ProjectQuestionAccordion[]
}

export interface CertificationQuestionBlock {
  type: "certification-block"
  certIndex: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
}

export interface EducationQuestionBlock {
  type: "education-block"
  eduIndex: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
  campusGroups: Array<{
    campusIndex: number
    questions: GeneratedQuestion[]
  }>
}

export type QuestionDisplayBlock =
  | FlatQuestionBlock
  | IndependentProjectQuestionBlock
  | RoleQuestionBlock
  | ProjectQuestionAccordion
  | CertificationQuestionBlock
  | EducationQuestionBlock

function sortByPriority(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  return [...questions].sort(sortQuestionsByPriority)
}

function buildNestedWorkExperienceProjectAccordion(
  roleIndex: number,
  projectIndex: number,
  questions: GeneratedQuestion[],
): ProjectQuestionAccordion {
  const apiPrefix = `work_experience_${roleIndex}_project_${projectIndex}`

  return {
    type: "project-accordion",
    title: nestedProjectAccordionLabel(projectIndex, questions.length),
    apiPrefix,
    layout: "nested-work-experience",
    linkQuestions: [],
    catalogQuestions: [],
    accordionQuestions: questions,
  }
}

function groupIndependentProjectDisplayBlocks(
  questions: GeneratedQuestion[],
): QuestionDisplayBlock[] {
  const { sectionOpener, cards } = groupIndependentProjectQuestions(questions)
  const blocks: QuestionDisplayBlock[] = []

  if (sectionOpener) {
    blocks.push({ type: "flat", questions: [sectionOpener] })
  }

  for (const card of cards) {
    blocks.push({
      type: "independent-project-block",
      projectIndex: card.index,
      title: card.title,
      linkQuestions: card.linkQuestions,
      catalogQuestions: card.catalogQuestions,
    })
  }

  return blocks
}

function groupWorkExperienceDisplayBlocks(questions: GeneratedQuestion[]): QuestionDisplayBlock[] {
  const { sectionOpener, cards } = groupWorkExperienceQuestions(questions)
  const blocks: QuestionDisplayBlock[] = []

  if (sectionOpener) {
    blocks.push({ type: "flat", questions: [sectionOpener] })
  }

  for (const card of cards) {
    const projectAccordions = [...card.projectGroups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([projectIndex, projectQuestions]) =>
        buildNestedWorkExperienceProjectAccordion(card.index, projectIndex, projectQuestions),
      )

    blocks.push({
      type: "role-block",
      roleIndex: card.index,
      title: card.title,
      linkQuestions: card.linkQuestions,
      catalogQuestions: card.catalogQuestions,
      officeGroups: card.officeGroups,
      layoffGroups: card.layoffGroups,
      projectsOpener: card.projectsOpener,
      projectAccordions,
    })
  }

  return blocks
}

function groupCertificationDisplayBlocks(questions: GeneratedQuestion[]): QuestionDisplayBlock[] {
  const { sectionOpener, cards } = groupCertificationQuestions(questions)
  const blocks: QuestionDisplayBlock[] = []

  if (sectionOpener) {
    blocks.push({ type: "flat", questions: [sectionOpener] })
  }

  for (const card of cards) {
    blocks.push({
      type: "certification-block",
      certIndex: card.index,
      title: card.title,
      linkQuestions: card.linkQuestions,
      catalogQuestions: card.catalogQuestions,
    })
  }

  return blocks
}

function groupEducationDisplayBlocks(questions: GeneratedQuestion[]): QuestionDisplayBlock[] {
  const { sectionOpener, cards } = groupEducationQuestions(questions)
  const blocks: QuestionDisplayBlock[] = []

  if (sectionOpener) {
    blocks.push({ type: "flat", questions: [sectionOpener] })
  }

  for (const card of cards) {
    blocks.push({
      type: "education-block",
      eduIndex: card.index,
      title: card.title,
      linkQuestions: card.linkQuestions,
      catalogQuestions: card.catalogQuestions,
      campusGroups: card.campusGroups,
    })
  }

  return blocks
}

/** Group API questions for accordion UI — uses response only (no client mock merge). */
export function groupQuestionsForDisplay(
  section: "projects" | "workExperience" | "certifications" | "education",
  questions: GeneratedQuestion[],
): QuestionDisplayBlock[] {
  if (section === "projects") {
    return groupIndependentProjectDisplayBlocks(questions)
  }
  if (section === "certifications") {
    return groupCertificationDisplayBlocks(questions)
  }
  if (section === "education") {
    return groupEducationDisplayBlocks(questions)
  }
  return groupWorkExperienceDisplayBlocks(questions)
}

export function catalogAccordionLabel(count: number): string {
  return catalogDetailsLabel(count)
}

export function catalogFieldLabelFromSuffix(suffix: string): string {
  return (
    PROJECT_CATALOG_FIELD_LABELS[suffix as keyof typeof PROJECT_CATALOG_FIELD_LABELS] ?? suffix
  )
}
