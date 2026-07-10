/**
 * Shared entity data-progress display helpers (no scoring on the client).
 * @see docs/university_certification_data_progress_frontend_integration.md §8
 */

export {
  normalizeProgress,
  getDataProgressBadgeClasses,
  getDataProgressStatus,
  getDataProgressTier,
  sortDataProgressSections,
} from "@/lib/utils/candidate-data-progress"

import { normalizeProgress } from "@/lib/utils/candidate-data-progress"

/** Format stored completion for table display (one decimal). */
export function formatDataProgressPercentage(value?: number | null): string {
  return `${normalizeProgress(value).toFixed(1)}%`
}
