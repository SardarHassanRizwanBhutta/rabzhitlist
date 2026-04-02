import type { BenefitUnit } from "@/lib/types/benefits"

/** Unit display labels for benefit amounts */
export const UNIT_LABELS: Record<BenefitUnit, string> = {
  PKR: "PKR",
  days: "days",
  count: "",
  percent: "%",
}

/** Generate a unique ID for a benefit (e.g. before API integration). */
export function generateBenefitId(): string {
  return `benefit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Format amount with unit for display */
export function formatBenefitAmount(
  amount: number | null,
  unit: BenefitUnit | null
): string {
  if (amount === null) return ""

  const formattedAmount = new Intl.NumberFormat("en-PK").format(amount)

  if (!unit) return formattedAmount

  switch (unit) {
    case "PKR":
      return `${formattedAmount} PKR`
    case "days":
      return `${amount} ${amount === 1 ? "day" : "days"}`
    case "percent":
      return `${amount}%`
    case "count":
      return formattedAmount
    default:
      return formattedAmount
  }
}
