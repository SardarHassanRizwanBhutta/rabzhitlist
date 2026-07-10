/** Backend-owned certification data progress display helpers (no field scoring on the client). */

export {
  normalizeProgress,
  getDataProgressBadgeClasses,
  getDataProgressStatus,
  getDataProgressTier,
  formatDataProgressPercentage,
} from "@/lib/utils/data-progress"

import { formatDataProgressPercentage } from "@/lib/utils/data-progress"

export function formatCertificationDataProgress(value?: number | null): string {
  return formatDataProgressPercentage(value)
}
