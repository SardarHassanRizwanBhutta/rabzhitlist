import type { GeneratedQuestion } from "@/types/cold-caller"

/**
 * Call Notes: when `options.length` is greater than this, chips start collapsed
 * behind Show/Hide; when expanded, all chips show (no inner scroll). At or below
 * this count, all chips show with no toggle.
 */
export const QG_ENUM_OPTIONS_COLLAPSE_THRESHOLD = 8

/** Normalize API `options` to a non-empty list of trimmed labels, or undefined. */
export function normalizeQgEnumOptions(
  options: unknown,
): string[] | undefined {
  if (!Array.isArray(options)) return undefined
  const labels = options
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return labels.length > 0 ? labels : undefined
}

/** Copy payload: stem only, or stem + bulleted options when present. */
export function formatQgQuestionCopyText(question: GeneratedQuestion): string {
  const stem = question.question ?? ""
  const options = question.options ?? []
  if (options.length === 0) return stem
  return [stem, ...options.map((label) => `- ${label}`)].join("\n")
}
