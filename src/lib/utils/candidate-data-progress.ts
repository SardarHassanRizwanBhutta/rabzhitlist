/** Backend-owned candidate data progress helpers (no field scoring on the client). */

export function normalizeProgress(value?: number | null): number {
  if (value == null || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export type DataProgressTier = "incomplete" | "needsData" | "good" | "complete"

export function getDataProgressTier(value: number): DataProgressTier {
  const v = normalizeProgress(value)
  if (v >= 90) return "complete"
  if (v >= 70) return "good"
  if (v >= 40) return "needsData"
  return "incomplete"
}

export function getDataProgressStatus(value: number): string {
  const tier = getDataProgressTier(value)
  if (tier === "complete") return "Complete"
  if (tier === "good") return "Good"
  if (tier === "needsData") return "Needs Data"
  return "Incomplete"
}

/** Tailwind classes for the candidates table Data Progress pill by tier. */
export function getDataProgressBadgeClasses(value: number): {
  text: string
  bg: string
  border: string
} {
  switch (getDataProgressTier(value)) {
    case "complete":
      return {
        text: "text-green-700 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
      }
    case "good":
      return {
        text: "text-yellow-700 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-950/30",
        border: "border-yellow-200 dark:border-yellow-800",
      }
    case "needsData":
      return {
        text: "text-orange-700 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-950/30",
        border: "border-orange-200 dark:border-orange-800",
      }
    case "incomplete":
      return {
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
      }
  }
}

export const DATA_PROGRESS_SECTION_ORDER = [
  "basicInformation",
  "workExperience",
  "technicalSkills",
  "education",
  "certifications",
  "achievements",
] as const

export function sortDataProgressSections<T extends { sectionKey: string }>(sections: T[]): T[] {
  const order = new Map(DATA_PROGRESS_SECTION_ORDER.map((key, index) => [key, index]))
  return [...sections].sort((a, b) => {
    const ai = order.get(a.sectionKey as (typeof DATA_PROGRESS_SECTION_ORDER)[number]) ?? 999
    const bi = order.get(b.sectionKey as (typeof DATA_PROGRESS_SECTION_ORDER)[number]) ?? 999
    return ai - bi
  })
}
