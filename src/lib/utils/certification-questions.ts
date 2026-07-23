import type { GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import {
  dedupeQuestionsByField,
  sortQuestionsByPriority,
} from "@/lib/utils/work-experience-questions"
import { dedupeApiFieldNames } from "@/lib/utils/question-generation-response"

export const CERTIFICATION_LINK_ORDER = [
  "name",
  "issueDate",
  "expiryDate",
] as const

export const CERTIFICATION_CATALOG_SUFFIXES = new Set(["issuingBody"])

const CERTIFICATION_FIELD_RE = /^certification_(\d+)_(.+)$/

const CERTIFICATION_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  issueDate: "Issue Date",
  expiryDate: "Expiry Date",
  issuingBody: "Issuer body",
}

export interface CertificationQuestionCard {
  index: number
  title: string
  linkQuestions: GeneratedQuestion[]
  catalogQuestions: GeneratedQuestion[]
}

export function certificationCatalogDetailsLabel(count: number): string {
  const noun = count === 1 ? "question" : "questions"
  return `Complete certification details — ${count} ${noun}`
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

function sortCertificationLinkQuestions(
  items: GeneratedQuestion[],
): GeneratedQuestion[] {
  return [...items].sort((a, b) => {
    const sa = a.field.split("_").pop() ?? ""
    const sb = b.field.split("_").pop() ?? ""
    const ia = CERTIFICATION_LINK_ORDER.indexOf(sa as (typeof CERTIFICATION_LINK_ORDER)[number])
    const ib = CERTIFICATION_LINK_ORDER.indexOf(sb as (typeof CERTIFICATION_LINK_ORDER)[number])
    const safeIa = ia === -1 ? CERTIFICATION_LINK_ORDER.length : ia
    const safeIb = ib === -1 ? CERTIFICATION_LINK_ORDER.length : ib
    return safeIa - safeIb || a.field.localeCompare(b.field)
  })
}

/** Reference grouping per FRONTEND_INTEGRATION_CONTRACT § 4.8.6 */
export function groupCertificationQuestions(questions: GeneratedQuestion[]): {
  sectionOpener: GeneratedQuestion | null
  cards: CertificationQuestionCard[]
} {
  const deduped = dedupeQuestionsByField(questions)

  let sectionOpener: GeneratedQuestion | null = null
  const cards = new Map<number, { link: GeneratedQuestion[]; catalog: GeneratedQuestion[] }>()

  for (const q of deduped) {
    if (q.field === "certifications") {
      sectionOpener = q
      continue
    }

    const m = CERTIFICATION_FIELD_RE.exec(q.field)
    if (!m) continue

    const index = Number(m[1])
    const suffix = m[2]
    if (!cards.has(index)) cards.set(index, { link: [], catalog: [] })
    const card = cards.get(index)!
    if (CERTIFICATION_CATALOG_SUFFIXES.has(suffix)) {
      card.catalog.push(q)
    } else {
      card.link.push(q)
    }
  }

  const result = [...cards.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, card]) => ({
      index,
      title: `Certification ${index + 1}`,
      linkQuestions: sortCertificationLinkQuestions(card.link),
      catalogQuestions: [...card.catalog].sort(sortQuestionsByPriority),
    }))

  return { sectionOpener, cards: result }
}
