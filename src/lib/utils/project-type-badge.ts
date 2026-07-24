import type { ProjectType } from "@/lib/types/project"
import { PROJECT_TYPES } from "@/lib/types/project"

/** Locked Candidate Details WE project type badge colors (2026-07-24 remap). */
export const PROJECT_TYPE_BADGE_CLASS: Record<ProjectType, string> = {
  Employer:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Freelance:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Independent:
    "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
}

/** Backend / wire labels → UI (current three-value enum only; no legacy remap). */
const PROJECT_TYPE_WIRE_TO_UI: Record<string, ProjectType> = {
  employer: "Employer",
  freelance: "Freelance",
  independent: "Independent",
  Employer: "Employer",
  Freelance: "Freelance",
  Independent: "Independent",
}

/** Map ProjectType enum int 0..2 → UI label; invalid → null. */
export function projectTypeFromApiInt(value: unknown): ProjectType | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null
  if (value < 0 || value >= PROJECT_TYPES.length) return null
  return PROJECT_TYPES[value] ?? null
}

/** Normalize API int or known wire string → UI ProjectType; unknown → null. */
export function normalizeProjectType(value: unknown): ProjectType | null {
  const fromInt = projectTypeFromApiInt(value)
  if (fromInt) return fromInt
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (PROJECT_TYPE_WIRE_TO_UI[trimmed]) return PROJECT_TYPE_WIRE_TO_UI[trimmed]
  const key = trimmed.toLowerCase().replace(/\s+/g, "_")
  return PROJECT_TYPE_WIRE_TO_UI[key] ?? null
}

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === "string" && PROJECT_TYPES.includes(value as ProjectType)
}
