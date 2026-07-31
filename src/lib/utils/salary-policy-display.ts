/**
 * Salary Policy display helper — same labels as EmployerDetailsDialog Select
 * (`SALARY_POLICY_DB_LABELS`).
 */

import {
  SALARY_POLICY_DB_LABELS,
  SALARY_POLICY_DISPLAY_TO_DB,
  type SalaryPolicy,
  type SalaryPolicyDb,
} from "@/lib/types/employer"

const LEGACY_SALARY_POLICY_TO_DB: Record<string, SalaryPolicyDb> = {
  Standard: "gross_salary",
  "Tax Free": "net_salary",
  Remittance: "remittance_salary",
}

/** Select-style label (`Remittance Salary`, …); `N/A` when empty/unmapped. */
export function salaryPolicyDisplayLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return "N/A"
  const trimmed = raw.trim()

  if (trimmed in SALARY_POLICY_DB_LABELS) {
    return SALARY_POLICY_DB_LABELS[trimmed as SalaryPolicyDb]
  }

  if (trimmed in SALARY_POLICY_DISPLAY_TO_DB) {
    return SALARY_POLICY_DB_LABELS[SALARY_POLICY_DISPLAY_TO_DB[trimmed as SalaryPolicy]]
  }

  if (trimmed in LEGACY_SALARY_POLICY_TO_DB) {
    return SALARY_POLICY_DB_LABELS[LEGACY_SALARY_POLICY_TO_DB[trimmed]]
  }

  const byLabel = Object.values(SALARY_POLICY_DB_LABELS).find(
    (label) => label.toLowerCase() === trimmed.toLowerCase(),
  )
  return byLabel ?? "N/A"
}
