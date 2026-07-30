import type { GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import {
  dedupeQuestionsByField,
  sortQuestionsByPriority,
} from "@/lib/utils/work-experience-questions"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"
import { CERTIFICATION_FIELD_ORDER } from "@/lib/utils/qg-field-weights"

/** Weight-descending display order: Name → Issuing Body → Issue Date → Expiry Date. */
export const CERTIFICATION_LINK_ORDER = CERTIFICATION_FIELD_ORDER

/** Catalog accordion removed — Issuing Body is a main-list field. */
export const CERTIFICATION_CATALOG_SUFFIXES = new Set<string>()

const CERTIFICATION_FIELD_RE = /^certification_(\d+)_(.+)$/

const CERTIFICATION_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  issuingBody: "Issuing Body",
  issueDate: "Issue Date",
  expiryDate: "Expiry Date",
}

export interface CertificationQuestionCard {
  index: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
}

export function formatCertificationFieldLabel(field: string): string {
  if (field === "certifications") return `${SECTION_LABELS.certifications} (overview)`

  const m = CERTIFICATION_FIELD_RE.exec(field)
  if (!m) return field

  return CERTIFICATION_FIELD_LABELS[m[2]] ?? m[2]
}

export function countCertificationIndices(missingFields: string[]): number {
  const indices = new Set<number>()
  for (const key of missingFields) {
    const match = key.match(/^certification_(\d+)_/)
    if (match) indices.add(Number(match[1]))
  }
  return indices.size
}

/** Compact tab summary — enrichment fields are excluded from missing_fields by the API. */
export function summarizeCertificationsMissingFields(missingFields: string[]): string {
  const deduped = dedupeApiFieldNames(missingFields)
  const count = deduped.length
  if (count === 0) return `${SECTION_LABELS.certifications} — section complete`

  const certCount = countCertificationIndices(deduped)
  const fieldWord = count === 1 ? "field" : "fields"

  if (certCount === 0) {
    return `${SECTION_LABELS.certifications} — ${count} ${fieldWord} missing`
  }

  const certWord = certCount === 1 ? "certification" : "certifications"
  return `${SECTION_LABELS.certifications} — ${count} ${fieldWord} missing across ${certCount} ${certWord}`
}

export function countMissingFieldsForCertificationCard(
  missingFields: string[],
  certIndex: number,
): number {
  const prefix = `certification_${certIndex}_`
  return dedupeApiFieldNames(missingFields).filter((key) => key.startsWith(prefix)).length
}

export function formatCertificationCardSubtitle(
  certificationName?: string | null,
): string | null {
  const trimmed = certificationName?.trim()
  return trimmed || null
}

function sortCertificationQuestions(items: GeneratedQuestion[]): GeneratedQuestion[] {
  return [...items].sort((a, b) => {
    const sa = a.field.split("_").pop() ?? ""
    const sb = b.field.split("_").pop() ?? ""
    const ia = CERTIFICATION_LINK_ORDER.indexOf(sa as (typeof CERTIFICATION_LINK_ORDER)[number])
    const ib = CERTIFICATION_LINK_ORDER.indexOf(sb as (typeof CERTIFICATION_LINK_ORDER)[number])
    const safeIa = ia === -1 ? CERTIFICATION_LINK_ORDER.length : ia
    const safeIb = ib === -1 ? CERTIFICATION_LINK_ORDER.length : ib
    return safeIa - safeIb || sortQuestionsByPriority(a, b)
  })
}

/** Group certification questions into per-entry cards (no catalog accordion). */
export function groupCertificationQuestions(questions: GeneratedQuestion[]): {
  sectionOpener: GeneratedQuestion | null
  cards: CertificationQuestionCard[]
} {
  const deduped = dedupeQuestionsByField(questions)

  let sectionOpener: GeneratedQuestion | null = null
  const cards = new Map<number, GeneratedQuestion[]>()

  for (const q of deduped) {
    if (q.field === "certifications") {
      sectionOpener = q
      continue
    }

    const m = CERTIFICATION_FIELD_RE.exec(q.field)
    if (!m) continue

    const index = Number(m[1])
    if (!cards.has(index)) cards.set(index, [])
    cards.get(index)!.push(q)
  }

  const result = [...cards.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, cardQuestions]) => ({
      index,
      title: `Certification ${index + 1}`,
      linkQuestions: sortCertificationQuestions(cardQuestions),
      catalogQuestions: [] as GeneratedQuestion[],
    }))

  return { sectionOpener, cards: result }
}
