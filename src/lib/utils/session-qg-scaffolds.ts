/**
 * Session-only Call Notes scaffolds for QG: inject empty synthetic rows so
 * `fields_to_generate` can target new WE / project / cert / achievement indices.
 */

import type {
  Achievement,
  Candidate,
  CandidateCertification,
  ProjectExperience,
  WorkExperience,
} from "@/lib/types/candidate"
import type { ColdCallerSectionQuestions, GeneratedQuestion } from "@/types/cold-caller"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"

export interface SessionQgScaffolds {
  workExperienceIndices: number[]
  /** Role index → session-only project indices */
  projectsByRole: Record<number, number[]>
  certificationIndices: number[]
  achievementIndices: number[]
}

export type SessionQgScope =
  | { type: "workExperience"; roleIndex: number }
  | { type: "project"; roleIndex: number; projectIndex: number }
  | { type: "certification"; certIndex: number }
  | { type: "achievement"; achievementIndex: number }

export function emptySessionQgScaffolds(): SessionQgScaffolds {
  return {
    workExperienceIndices: [],
    projectsByRole: {},
    certificationIndices: [],
    achievementIndices: [],
  }
}

export function sessionQgScopeKey(scope: SessionQgScope): string {
  switch (scope.type) {
    case "workExperience":
      return `we:${scope.roleIndex}`
    case "project":
      return `we:${scope.roleIndex}:project:${scope.projectIndex}`
    case "certification":
      return `cert:${scope.certIndex}`
    case "achievement":
      return `achievement:${scope.achievementIndex}`
  }
}

function createEmptyProject(seed: string): ProjectExperience {
  return {
    id: `session-project-${seed}`,
    projectId: null,
    projectName: "",
    contributionNotes: null,
  }
}

function createEmptyWorkExperience(seed: string): WorkExperience {
  return {
    id: `session-we-${seed}`,
    employerName: "",
    jobTitle: "",
    projects: [],
    startDate: undefined,
    endDate: undefined,
    techStacks: [],
    shiftType: "",
    workMode: "",
    timeSupportZones: [],
    benefits: [],
  }
}

function createEmptyCertification(seed: string): CandidateCertification {
  return {
    id: `session-cert-${seed}`,
    certificationId: null,
    certificationName: "",
    issueDate: undefined,
    expiryDate: undefined,
    certificationUrl: null,
  }
}

function createEmptyAchievement(seed: string): Achievement {
  return {
    id: `session-achievement-${seed}`,
    name: "",
    // Empty so QG treats achievementType as missing (not a real enum value).
    achievementType: "" as Achievement["achievementType"],
  }
}

/** Ensure candidate arrays include empty rows for every session scaffold index. */
export function applySessionQgScaffolds(
  candidate: Candidate,
  scaffolds: SessionQgScaffolds,
): Candidate {
  const workExperiences = [...(candidate.workExperiences ?? [])]
  const roleIndices = new Set<number>([
    ...scaffolds.workExperienceIndices,
    ...Object.keys(scaffolds.projectsByRole).map(Number),
  ])
  const maxRole = Math.max(
    workExperiences.length - 1,
    ...roleIndices,
    -1,
  )
  for (let i = workExperiences.length; i <= maxRole; i++) {
    workExperiences.push(createEmptyWorkExperience(String(i)))
  }

  for (const roleIndex of roleIndices) {
    const we = workExperiences[roleIndex]
    if (!we) continue
    const projects = [...(we.projects ?? [])]
    const sessionProjects = scaffolds.projectsByRole[roleIndex] ?? []
    const ensureProject0 =
      scaffolds.workExperienceIndices.includes(roleIndex) && projects.length === 0
    const projectIndices = ensureProject0
      ? [...sessionProjects, 0]
      : sessionProjects
    const maxProject = Math.max(projects.length - 1, ...projectIndices, -1)
    for (let j = projects.length; j <= maxProject; j++) {
      projects.push(createEmptyProject(`${roleIndex}-${j}`))
    }
    workExperiences[roleIndex] = { ...we, projects }
  }

  const certifications = [...(candidate.certifications ?? [])]
  const maxCert = Math.max(
    certifications.length - 1,
    ...scaffolds.certificationIndices,
    -1,
  )
  for (let i = certifications.length; i <= maxCert; i++) {
    certifications.push(createEmptyCertification(String(i)))
  }

  const achievements = [...(candidate.achievements ?? [])]
  const maxAchievement = Math.max(
    achievements.length - 1,
    ...scaffolds.achievementIndices,
    -1,
  )
  for (let i = achievements.length; i <= maxAchievement; i++) {
    achievements.push(createEmptyAchievement(String(i)))
  }

  return {
    ...candidate,
    workExperiences,
    certifications,
    achievements,
  }
}

/** Keep only `fields_to_generate` keys that belong to the new session entry. */
export function filterFieldsToGenerateForScope(
  fields: string[],
  scope: SessionQgScope,
): string[] {
  switch (scope.type) {
    case "workExperience": {
      const prefix = `work_experience_${scope.roleIndex}_`
      return fields.filter((field) => field.startsWith(prefix))
    }
    case "project": {
      const prefix = `work_experience_${scope.roleIndex}_project_${scope.projectIndex}_`
      return fields.filter((field) => field.startsWith(prefix))
    }
    case "certification": {
      const prefix = `certification_${scope.certIndex}_`
      return fields.filter((field) => field.startsWith(prefix))
    }
    case "achievement": {
      const prefix = `achievement_${scope.achievementIndex}_`
      return fields.filter((field) => field.startsWith(prefix))
    }
  }
}

/** Upsert incremental QG results into existing Call Notes question state. */
export function mergeIncrementalQuestionState(
  prevSections: ColdCallerSectionQuestions[] | null,
  prevFlat: GeneratedQuestion[],
  incomingSections: ColdCallerSectionQuestions[],
): {
  sections: ColdCallerSectionQuestions[]
  flat: GeneratedQuestion[]
} {
  const flatMap = new Map(prevFlat.map((question) => [question.field, question]))
  for (const section of incomingSections) {
    for (const question of section.questions) {
      flatMap.set(question.field, question)
    }
  }

  const sectionMap = new Map<FieldSectionKey, ColdCallerSectionQuestions>()
  for (const section of prevSections ?? []) {
    sectionMap.set(section.section, {
      ...section,
      questions: [...section.questions],
      missingFields: [...section.missingFields],
    })
  }

  for (const incoming of incomingSections) {
    const existing = sectionMap.get(incoming.section)
    if (!existing) {
      sectionMap.set(incoming.section, {
        ...incoming,
        questions: [...incoming.questions],
        missingFields: [...incoming.missingFields],
      })
      continue
    }
    const questionMap = new Map(
      existing.questions.map((question) => [question.field, question]),
    )
    for (const question of incoming.questions) {
      questionMap.set(question.field, question)
    }
    existing.questions = Array.from(questionMap.values())
    existing.missingFields = dedupeApiFieldNames([
      ...existing.missingFields,
      ...incoming.missingFields,
    ])
  }

  return {
    sections: Array.from(sectionMap.values()),
    flat: Array.from(flatMap.values()),
  }
}

type FieldSectionKey = ColdCallerSectionQuestions["section"]
