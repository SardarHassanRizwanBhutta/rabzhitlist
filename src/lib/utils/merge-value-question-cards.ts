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

export interface MergeValueAndQuestionCardsOptions {
  /**
   * When value is missing and QG has no question, emit a local
   * `Ask about {label}` card (session-only Call Notes scaffolds).
   */
  fillAskCues?: boolean
}

/**
 * Stable-order mix of populated value cards and missing-field question cards.
 */
export function mergeValueAndQuestionCards(
  defs: MergeFieldCardDef[],
  questionsByField: Map<string, GeneratedQuestion>,
  section: FieldSection,
  options?: MergeValueAndQuestionCardsOptions,
): GeneratedQuestion[] {
  const rows: GeneratedQuestion[] = []
  const fillAskCues = options?.fillAskCues === true

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
    if (question) {
      rows.push(question)
      continue
    }

    if (fillAskCues) {
      rows.push({
        question: `Ask about ${def.label}`,
        field: def.apiFieldName,
        section,
        priority: def.priority,
        context: "",
        promptType: "basic",
      })
    }
  }

  return rows
}
