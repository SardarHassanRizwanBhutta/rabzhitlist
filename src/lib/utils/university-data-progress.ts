/** Backend-owned university data progress display helpers (no field scoring on the client). */

export {
  normalizeProgress,
  getDataProgressBadgeClasses,
  getDataProgressStatus,
  getDataProgressTier,
  formatDataProgressPercentage,
} from "@/lib/utils/data-progress"

import { formatDataProgressPercentage } from "@/lib/utils/data-progress"
import type { UniversityDataProgressSection } from "@/lib/types/university-data-progress"
import {
  UNIVERSITY_DATA_PROGRESS_SECTION_ORDER,
  type UniversityDataProgressSectionKey,
} from "@/lib/types/university-data-progress"

export function formatUniversityDataProgress(value?: number | null): string {
  return formatDataProgressPercentage(value)
}

export function sortUniversityDataProgressSections<
  T extends { sectionKey: UniversityDataProgressSectionKey },
>(sections: T[]): T[] {
  const order = new Map(UNIVERSITY_DATA_PROGRESS_SECTION_ORDER.map((k, i) => [k, i]))
  return [...sections].sort(
    (a, b) => (order.get(a.sectionKey) ?? 999) - (order.get(b.sectionKey) ?? 999),
  )
}

export type { UniversityDataProgressSection }
