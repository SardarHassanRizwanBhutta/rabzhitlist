import type { FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import { formatQgDisplayValue, isQgValueMissing } from "@/lib/utils/qg-value"

export interface MergeFieldCardDef {
  apiFieldName: string
  label: string
  priority: number
  value: unknown
  formatValue?: (value: unknown) => string
}

function isTechStacksApiField(field: string): boolean {
  return field === "techStacks" || /(?:^|_)techStacks$/.test(field)
}

/**
 * Stable-order mix of populated value cards and missing-field question cards.
 */
export function mergeValueAndQuestionCards(
  defs: MergeFieldCardDef[],
  questionsByField: Map<string, GeneratedQuestion>,
  section: FieldSection,
): GeneratedQuestion[] {
  const rows: GeneratedQuestion[] = []

  for (const def of defs) {
    if (!isQgValueMissing(def.value)) {
      const formatted = def.formatValue
        ? def.formatValue(def.value)
        : formatQgDisplayValue(def.value)
      const valueItems =
        isTechStacksApiField(def.apiFieldName) && Array.isArray(def.value)
          ? def.value.map((item) => String(item)).filter((s) => s.trim() !== "")
          : undefined
      rows.push({
        question: formatted,
        field: def.apiFieldName,
        section,
        priority: def.priority,
        context: "",
        promptType: "enrichment",
        ...(valueItems && valueItems.length > 0 ? { valueItems } : {}),
      })
      continue
    }

    const question = questionsByField.get(def.apiFieldName)
    if (question) rows.push(question)
  }

  return rows
}
