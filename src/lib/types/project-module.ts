/** Shared module under one catalog project. */
export interface ProjectModuleContributor {
  linkId: number
  candidateId: number
  candidateName: string
  contribution: string | null
}

export interface ProjectModule {
  id: number
  name: string
  description: string | null
  techStacks: string[]
  contributors: ProjectModuleContributor[]
}

/** One row of GET /api/modules. No description and no contributor list. */
export interface ProjectModuleListItem {
  id: number
  projectId: number
  projectName: string
  name: string
  techStacks: string[]
  candidateCount: number
}

/** One candidate work-experience link to a shared module. */
export interface CandidateWorkModule {
  /** Link id. */
  id: string
  moduleId: number
  projectId: number
  projectName: string
  name: string
  description: string | null
  techStacks: string[]
  contribution: string | null
}

export interface ProjectModuleSearchHit {
  id: number
  projectId: number
  name: string
  description: string | null
  techStacks: string[]
}
