/**
 * Call Notes populated list value cards — badge colors aligned with
 * ProjectDetailDialog / CandidateDetailsDialog / EmployerDetailsDialog.
 */

import { formatBenefitAmount } from "@/lib/utils/benefits"
import type { BenefitUnit } from "@/lib/types/benefits"
import {
  EMPLOYER_TYPE_DB_LABELS,
  EMPLOYER_TYPE_DISPLAY_TO_DB,
  type EmployerType,
  type EmployerTypeDb,
} from "@/lib/types/employer"

export const QG_LIST_VALUE_BADGE_MAX_DISPLAY = 6

/** API field suffixes that render as multi-value badges on enrichment cards. */
export const QG_LIST_VALUE_BADGE_SUFFIXES = [
  "techStacks",
  "clientLocations",
  "verticalDomains",
  "horizontalDomains",
  "technicalDomains",
  "technicalAspects",
  "timeSupportZones",
  "benefits",
  "types",
] as const

export type QgListValueBadgeSuffix = (typeof QG_LIST_VALUE_BADGE_SUFFIXES)[number]

/** Field-type colors from ProjectDetailDialog / CandidateDetailsDialog. */
export const QG_LIST_VALUE_BADGE_CLASS: Record<QgListValueBadgeSuffix, string> = {
  techStacks: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  clientLocations: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  verticalDomains: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  horizontalDomains: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  technicalDomains: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  technicalAspects: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  /** CandidateDetailsDialog — Time Support Zones */
  timeSupportZones: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  /** CandidateDetailsDialog — Benefits (outline + slate) */
  benefits:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
  /** EmployerDetailsDialog Type — plain secondary (no extra color classes) */
  types: "",
}

export type QgListValueBadgeVariant = "secondary" | "outline"

const SUFFIX_SET = new Set<string>(QG_LIST_VALUE_BADGE_SUFFIXES)

/** Resolve list-badge suffix from a QG/api field name (`techStacks` or `work_experience_0_benefits`). */
export function resolveQgListValueBadgeSuffix(
  apiFieldName: string,
): QgListValueBadgeSuffix | null {
  if (SUFFIX_SET.has(apiFieldName)) {
    return apiFieldName as QgListValueBadgeSuffix
  }
  for (const suffix of QG_LIST_VALUE_BADGE_SUFFIXES) {
    if (apiFieldName.endsWith(`_${suffix}`) || apiFieldName.endsWith(`.${suffix}`)) {
      return suffix
    }
  }
  return null
}

export function isQgListValueBadgeField(apiFieldName: string): boolean {
  return resolveQgListValueBadgeSuffix(apiFieldName) != null
}

export function qgListValueBadgeClass(apiFieldName: string): string {
  const suffix = resolveQgListValueBadgeSuffix(apiFieldName)
  if (!suffix) {
    return QG_LIST_VALUE_BADGE_CLASS.techStacks
  }
  return QG_LIST_VALUE_BADGE_CLASS[suffix]
}

/** Benefits match CandidateDetailsDialog (`outline`); others use `secondary`. */
export function qgListValueBadgeVariant(
  apiFieldName: string,
): QgListValueBadgeVariant {
  return resolveQgListValueBadgeSuffix(apiFieldName) === "benefits"
    ? "outline"
    : "secondary"
}

/** CandidateDetailsDialog benefit badge label: `Name` or `Name: {amount}`. */
export function formatBenefitListBadgeLabel(benefit: unknown): string {
  if (benefit == null || typeof benefit !== "object" || !("name" in benefit)) {
    return benefit == null ? "" : String(benefit)
  }
  const row = benefit as {
    name?: unknown
    hasValue?: unknown
    amount?: unknown
    unit?: unknown
  }
  const name = row.name != null ? String(row.name).trim() : ""
  if (!name) return ""
  const hasValue = row.hasValue === true
  const amount =
    typeof row.amount === "number"
      ? row.amount
      : row.amount != null
        ? Number(row.amount)
        : null
  const unit =
    row.unit === "PKR" || row.unit === "percent" ? (row.unit as BenefitUnit) : null
  if (hasValue && amount != null && Number.isFinite(amount) && unit) {
    return `${name}: ${formatBenefitAmount(amount, unit)}`
  }
  return name
}

/** EmployerDetailsDialog Type labels via EMPLOYER_TYPE_DB_LABELS. */
export function formatEmployerTypeListBadgeLabel(item: unknown): string {
  const raw = item == null ? "" : String(item).trim()
  if (!raw) return ""
  if (raw in EMPLOYER_TYPE_DB_LABELS) {
    return EMPLOYER_TYPE_DB_LABELS[raw as EmployerTypeDb]
  }
  if (raw in EMPLOYER_TYPE_DISPLAY_TO_DB) {
    return EMPLOYER_TYPE_DB_LABELS[EMPLOYER_TYPE_DISPLAY_TO_DB[raw as EmployerType]]
  }
  const matchedLabel = Object.values(EMPLOYER_TYPE_DB_LABELS).find(
    (label) => label.toLowerCase() === raw.toLowerCase(),
  )
  return matchedLabel ?? raw
}

function formatListBadgeItem(
  suffix: QgListValueBadgeSuffix,
  item: unknown,
): string {
  if (suffix === "benefits") return formatBenefitListBadgeLabel(item)
  if (suffix === "types") return formatEmployerTypeListBadgeLabel(item)
  if (item == null) return ""
  return String(item).trim()
}

/** Build `valueItems` for enrichment cards when the field is a known list badge field. */
export function toQgListValueItems(
  apiFieldName: string,
  value: unknown,
): string[] | undefined {
  const suffix = resolveQgListValueBadgeSuffix(apiFieldName)
  if (!suffix || !Array.isArray(value)) return undefined
  const items = value
    .map((item) => formatListBadgeItem(suffix, item))
    .filter((s) => s.trim() !== "")
  return items.length > 0 ? items : undefined
}
