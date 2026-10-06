import { apiPost } from "@/lib/api-client"
import type {
  TechStackMergeImpact,
  TechStackMergePreviewResponse,
  TechStackMergeRequest,
  TechStackMergeResponse,
} from "@/lib/types/tech-stack-merge"

const PREVIEW_PATH = "/api/TechStacks/merge/preview"
const MERGE_PATH = "/api/TechStacks/merge"

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function pickNumber(obj: Record<string, unknown>, camel: string, pascal: string): number | null {
  const raw = obj[camel] ?? obj[pascal]
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return null
}

function pickString(obj: Record<string, unknown>, camel: string, pascal: string): string {
  const raw = obj[camel] ?? obj[pascal]
  return typeof raw === "string" ? raw : ""
}

function mapDuplicateLinksRemoved(raw: unknown): TechStackMergeImpact["duplicateLinksRemoved"] {
  const obj = asRecord(raw) ?? {}
  return {
    candidateTechStacks: pickNumber(obj, "candidateTechStacks", "CandidateTechStacks") ?? 0,
    workExperienceTechStacks:
      pickNumber(obj, "workExperienceTechStacks", "WorkExperienceTechStacks") ?? 0,
    projectTechStacks: pickNumber(obj, "projectTechStacks", "ProjectTechStacks") ?? 0,
    projectModuleTechStacks: pickNumber(obj, "projectModuleTechStacks", "ProjectModuleTechStacks") ?? 0,
  }
}

function mapImpact(raw: unknown): TechStackMergeImpact {
  const obj = asRecord(raw) ?? {}
  return {
    distinctCandidatesAffected:
      pickNumber(obj, "distinctCandidatesAffected", "DistinctCandidatesAffected") ?? 0,
    distinctProjectsAffected:
      pickNumber(obj, "distinctProjectsAffected", "DistinctProjectsAffected") ?? 0,
    distinctModulesAffected:
      pickNumber(obj, "distinctModulesAffected", "DistinctModulesAffected") ?? 0,
    duplicateLinksRemoved: mapDuplicateLinksRemoved(obj.duplicateLinksRemoved ?? obj.DuplicateLinksRemoved),
  }
}

function mapSourcePreview(raw: unknown): TechStackMergePreviewResponse["sources"][number] | null {
  const obj = asRecord(raw)
  if (!obj) return null
  const techStackId = pickNumber(obj, "techStackId", "TechStackId")
  const name = pickString(obj, "name", "Name").trim()
  if (techStackId == null || techStackId <= 0 || !name) return null
  return {
    techStackId,
    name,
    usageCountBefore: pickNumber(obj, "usageCountBefore", "UsageCountBefore") ?? 0,
  }
}

function mapPreviewResponse(raw: unknown): TechStackMergePreviewResponse {
  const root = asRecord(raw)
  if (!root) throw new Error("Invalid preview response.")
  const targetObj = asRecord(root.target ?? root.Target)
  if (!targetObj) throw new Error("Invalid preview response: missing target.")
  const techStackId = pickNumber(targetObj, "techStackId", "TechStackId")
  const name = pickString(targetObj, "name", "Name").trim()
  if (techStackId == null || techStackId <= 0 || !name) {
    throw new Error("Invalid preview response: target id or name.")
  }
  const sourcesRaw = root.sources ?? root.Sources
  const sources = Array.isArray(sourcesRaw)
    ? sourcesRaw
        .map(mapSourcePreview)
        .filter((row): row is NonNullable<typeof row> => row != null)
    : []

  return {
    target: {
      techStackId,
      name,
      usageCountAfter:
        pickNumber(targetObj, "usageCountAfter", "UsageCountAfter") ??
        pickNumber(targetObj, "usageCount", "UsageCount") ??
        0,
    },
    sources,
    impact: mapImpact(root.impact ?? root.Impact),
  }
}

function mapMergeResponse(raw: unknown): TechStackMergeResponse {
  const root = asRecord(raw)
  if (!root) throw new Error("Invalid merge response.")
  const targetObj = asRecord(root.target ?? root.Target)
  if (!targetObj) throw new Error("Invalid merge response: missing target.")
  const techStackId = pickNumber(targetObj, "techStackId", "TechStackId")
  const name = pickString(targetObj, "name", "Name").trim()
  if (techStackId == null || techStackId <= 0 || !name) {
    throw new Error("Invalid merge response: target id or name.")
  }
  const mergedRaw = root.mergedSourceIds ?? root.MergedSourceIds
  const mergedSourceIds = Array.isArray(mergedRaw)
    ? mergedRaw
        .map((id) => (typeof id === "number" ? id : Number(id)))
        .filter((id) => Number.isInteger(id) && id > 0)
    : []

  return {
    target: {
      techStackId,
      name,
      usageCount: pickNumber(targetObj, "usageCount", "UsageCount") ?? 0,
    },
    mergedSourceIds,
    impact: mapImpact(root.impact ?? root.Impact),
  }
}

export async function previewTechStackMerge(
  body: TechStackMergeRequest,
): Promise<TechStackMergePreviewResponse> {
  const raw = await apiPost<unknown>(PREVIEW_PATH, body)
  return mapPreviewResponse(raw)
}

export async function executeTechStackMerge(body: TechStackMergeRequest): Promise<TechStackMergeResponse> {
  const raw = await apiPost<unknown>(MERGE_PATH, body)
  return mapMergeResponse(raw)
}
