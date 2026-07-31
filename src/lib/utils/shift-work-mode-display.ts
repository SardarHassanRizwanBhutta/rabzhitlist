/**
 * Shift Type / Work Mode display helpers — same mapping as CandidateDetailsDialog Select.
 */

import {
  SHIFT_TYPE_DB,
  SHIFT_TYPE_LABELS,
  WORK_MODE_DB,
  WORK_MODE_LABELS,
  type ShiftTypeDb,
  type WorkModeDb,
} from "@/lib/constants/candidate-enums"

/** Normalize stored/legacy wire value → ShiftTypeDb select value (or ""). */
export function shiftTypeToSelectValue(raw: string | null | undefined): string {
  if (!raw?.trim()) return ""
  const normalized = raw.trim().toLowerCase().replace(/[\s_-]/g, "")
  for (const t of SHIFT_TYPE_DB) {
    if (t.toLowerCase() === normalized) return t
  }
  const legacy: Record<string, ShiftTypeDb> = {
    morning: "day",
    day: "day",
    evening: "evening",
    night: "night",
    rotational: "rotational",
    "24x7": "flexible",
    flexible: "flexible",
    oncall: "onCall",
  }
  if (normalized in legacy) return legacy[normalized]
  for (const [value, label] of Object.entries(SHIFT_TYPE_LABELS) as [ShiftTypeDb, string][]) {
    if (label.toLowerCase().replace(/\s/g, "") === normalized) return value
  }
  return ""
}

/** Select-style label for Shift Type (`Day`, `On Call`, …); `N/A` when unmapped/empty. */
export function shiftTypeDisplayLabel(raw: string | null | undefined): string {
  const value = shiftTypeToSelectValue(raw)
  return value ? SHIFT_TYPE_LABELS[value as ShiftTypeDb] : "N/A"
}

/** Normalize stored wire value → WorkModeDb select value (or ""). */
export function workModeToSelectValue(raw: string | null | undefined): string {
  if (!raw?.trim()) return ""
  const normalized = raw.trim().toLowerCase().replace(/[\s_-]/g, "")
  for (const t of WORK_MODE_DB) {
    if (t.toLowerCase() === normalized) return t
  }
  for (const [value, label] of Object.entries(WORK_MODE_LABELS) as [WorkModeDb, string][]) {
    if (label.toLowerCase() === normalized) return value
  }
  return ""
}

/** Select-style label for Work Mode (`Onsite`, `Remote`, …); `N/A` when unmapped/empty. */
export function workModeDisplayLabel(raw: string | null | undefined): string {
  const value = workModeToSelectValue(raw)
  return value ? WORK_MODE_LABELS[value as WorkModeDb] : "N/A"
}
