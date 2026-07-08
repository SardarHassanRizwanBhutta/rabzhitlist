/** Backend-owned project data progress display helpers (no field scoring on the client). */

export {
  normalizeProgress,
  getDataProgressBadgeClasses,
  getDataProgressStatus,
  getDataProgressTier,
} from "@/lib/utils/candidate-data-progress"

import { normalizeProgress } from "@/lib/utils/candidate-data-progress"
import type { ProjectDataProgressSection } from "@/lib/types/project-data-progress"
import {
  PROJECT_DATA_PROGRESS_SECTION_ORDER,
  type ProjectDataProgressSectionKey,
} from "@/lib/types/project-data-progress"

/** Format stored completion for table display (one decimal). */
export function formatProjectDataProgress(value?: number | null): string {
  return `${normalizeProgress(value).toFixed(1)}%`
}

export function sortProjectDataProgressSections<T extends { sectionKey: ProjectDataProgressSectionKey }>(
  sections: T[],
): T[] {
  const order = new Map(PROJECT_DATA_PROGRESS_SECTION_ORDER.map((k, i) => [k, i]))
  return [...sections].sort(
    (a, b) => (order.get(a.sectionKey) ?? 999) - (order.get(b.sectionKey) ?? 999),
  )
}

export type { ProjectDataProgressSection }
