/**
 * Call Notes Extract — catalog resolution types and shared helpers.
 * Catalog linking happens in CandidateCreationDialog after apply (defer-catalog flow).
 */

export type CallNotesCatalogResolutionKind = "employer" | "project" | "certification"

export interface CallNotesCatalogResolution {
  kind: CallNotesCatalogResolutionKind
  catalogId: number
  catalogName: string
  issuerName?: string | null
}

export function extractedNameFromValue(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return ""
}
