import type { GeneratedQuestion } from "@/types/cold-caller"
import { groupAchievementQuestions } from "@/lib/utils/achievement-questions"
import {
  PROJECT_CATALOG_FIELD_LABELS,
  catalogDetailsLabel,
} from "@/lib/utils/project-catalog-fields"
import { groupCertificationQuestions } from "@/lib/utils/certification-questions"
import {
  groupWorkExperienceQuestions,
  nestedProjectAccordionLabel,
} from "@/lib/utils/work-experience-questions"

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

export interface AchievementQuestionBlock {
  type: "achievement-block"
  achievementIndex: number
  title: string
  questions: GeneratedQuestion[]
}

export type QuestionDisplayBlock =
  | FlatQuestionBlock
  | RoleQuestionBlock
  | ProjectQuestionAccordion
  | CertificationQuestionBlock
  | AchievementQuestionBlock

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

function groupAchievementDisplayBlocks(questions: GeneratedQuestion[]): QuestionDisplayBlock[] {
  const { sectionOpener, cards } = groupAchievementQuestions(questions)
  const blocks: QuestionDisplayBlock[] = []

  if (sectionOpener) {
    blocks.push({ type: "flat", questions: [sectionOpener] })
  }

  for (const card of cards) {
    blocks.push({
      type: "achievement-block",
      achievementIndex: card.index,
      title: card.title,
      questions: card.questions,
    })
  }

  return blocks
}

/** Group API questions for accordion UI — uses response only (no client mock merge). */
export function groupQuestionsForDisplay(
  section: "workExperience" | "certifications" | "achievements",
  questions: GeneratedQuestion[],
): QuestionDisplayBlock[] {
  if (section === "achievements") {
    return groupAchievementDisplayBlocks(questions)
  }
  if (section === "certifications") {
    return groupCertificationDisplayBlocks(questions)
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
