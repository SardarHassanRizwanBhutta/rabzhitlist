/**
 * Layoff Reason display helper — same labels as EmployerDetailsDialog /
 * `LAYOFF_REASON_DB_LABELS`.
 */

import {
  LAYOFF_REASON_DB_LABELS,
  LAYOFF_REASON_DISPLAY_TO_DB,
  type LayoffReason,
  type LayoffReasonDb,
} from "@/lib/types/employer"

/** Select-style label (`Restructuring`, …); `N/A` when empty/unmapped. */
export function layoffReasonDisplayLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return "N/A"
  const trimmed = raw.trim()

  if (trimmed in LAYOFF_REASON_DB_LABELS) {
    return LAYOFF_REASON_DB_LABELS[trimmed as LayoffReasonDb]
  }

  if (trimmed in LAYOFF_REASON_DISPLAY_TO_DB) {
    return LAYOFF_REASON_DB_LABELS[LAYOFF_REASON_DISPLAY_TO_DB[trimmed as LayoffReason]]
  }

  const byLabel = Object.values(LAYOFF_REASON_DB_LABELS).find(
    (label) => label.toLowerCase() === trimmed.toLowerCase(),
  )
  return byLabel ?? "N/A"
}
