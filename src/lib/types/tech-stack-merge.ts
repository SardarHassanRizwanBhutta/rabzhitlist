/** Aligns with docs/TECH_STACK_MERGE_BACKEND_CONTRACT.md */

export type TechStackMergeTargetExisting = {
  mode: "existing"
  techStackId: number
}

export type TechStackMergeTargetNew = {
  mode: "new"
  name: string
  technicalAspectTypeIds?: number[]
}

export type TechStackMergeTarget = TechStackMergeTargetExisting | TechStackMergeTargetNew

export type TechStackMergeRequest = {
  sourceTechStackIds: number[]
  target: TechStackMergeTarget
}

export type TechStackMergeDuplicateLinksRemoved = {
  candidateTechStacks: number
  workExperienceTechStacks: number
  projectTechStacks: number
  projectModuleTechStacks: number
}

export type TechStackMergeImpact = {
  distinctCandidatesAffected: number
  distinctProjectsAffected: number
  distinctModulesAffected: number
  duplicateLinksRemoved: TechStackMergeDuplicateLinksRemoved
}

export type TechStackMergeSourcePreview = {
  techStackId: number
  name: string
  usageCountBefore: number
}

export type TechStackMergePreviewResponse = {
  target: {
    techStackId: number
    name: string
    usageCountAfter: number
  }
  sources: TechStackMergeSourcePreview[]
  impact: TechStackMergeImpact
}

export type TechStackMergeResponse = {
  target: {
    techStackId: number
    name: string
    usageCount: number
  }
  mergedSourceIds: number[]
  impact: TechStackMergeImpact
}
