import { BenefitTemplate, BenefitUnit } from "@/lib/types/benefits"

// Predefined benefits for dropdown selection
export const PREDEFINED_BENEFITS: BenefitTemplate[] = [
  // Benefits WITH amounts (PKR - Currency)
  { name: "IPD", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "OPD", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Health Insurance", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Life Insurance", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Dental Coverage", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Vision Coverage", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Maternity Coverage", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Fuel Allowance", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Mobile Allowance", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Internet Allowance", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Transportation Allowance", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Provident Fund", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Annual Bonus", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  { name: "Performance Bonus", hasAmount: true, defaultUnit: "PKR" as BenefitUnit },
  
  // Benefits WITH amounts (Days - Leave types)
  { name: "Annual Leave", hasAmount: true, defaultUnit: "days" as BenefitUnit },
  { name: "Casual Leave", hasAmount: true, defaultUnit: "days" as BenefitUnit },
  { name: "Sick Leave", hasAmount: true, defaultUnit: "days" as BenefitUnit },
  { name: "Paternity Leave", hasAmount: true, defaultUnit: "days" as BenefitUnit },
  { name: "Maternity Leave", hasAmount: true, defaultUnit: "days" as BenefitUnit },
  { name: "Bereavement Leave", hasAmount: true, defaultUnit: "days" as BenefitUnit },
  { name: "Study Leave", hasAmount: true, defaultUnit: "days" as BenefitUnit },
  
  // Benefits WITH amounts (Count - Numeric quantity)
  { name: "Training Sessions", hasAmount: true, defaultUnit: "count" as BenefitUnit },
  { name: "Meal Vouchers", hasAmount: true, defaultUnit: "count" as BenefitUnit },
  { name: "Parking Spaces", hasAmount: true, defaultUnit: "count" as BenefitUnit },
  { name: "Company Shares", hasAmount: true, defaultUnit: "count" as BenefitUnit },
  { name: "Conference Passes", hasAmount: true, defaultUnit: "count" as BenefitUnit },
  { name: "Book Allowance", hasAmount: true, defaultUnit: "count" as BenefitUnit },
  
  // Benefits WITH amounts (Percent - Percentage-based)
  { name: "Performance Bonus Percentage", hasAmount: true, defaultUnit: "percent" as BenefitUnit },
  { name: "Provident Fund Matching", hasAmount: true, defaultUnit: "percent" as BenefitUnit },
  { name: "Profit Sharing", hasAmount: true, defaultUnit: "percent" as BenefitUnit },
  { name: "Commission Rate", hasAmount: true, defaultUnit: "percent" as BenefitUnit },
  { name: "Salary Increment", hasAmount: true, defaultUnit: "percent" as BenefitUnit },
  
  // Simple benefits (NO amounts)
  { name: "Gym Passport", hasAmount: false, defaultUnit: null },
  { name: "Mental Health Support", hasAmount: false, defaultUnit: null },
  { name: "Work from Home", hasAmount: false, defaultUnit: null },
  { name: "Flexible Hours", hasAmount: false, defaultUnit: null },
  { name: "Hybrid Work", hasAmount: false, defaultUnit: null },
  { name: "Stock Options", hasAmount: false, defaultUnit: null },
  { name: "EOBI", hasAmount: false, defaultUnit: null },
  { name: "Gratuity", hasAmount: false, defaultUnit: null },
  { name: "Training Budget", hasAmount: false, defaultUnit: null },
  { name: "Lunch Provided", hasAmount: false, defaultUnit: null },
].sort((a, b) => a.name.localeCompare(b.name))

// Helper to check if a benefit name requires amount
export const benefitRequiresAmount = (benefitName: string): boolean => {
  const template = PREDEFINED_BENEFITS.find(b => b.name === benefitName)
  return template?.hasAmount ?? false
}

// Helper to get the default unit for a benefit
export const getBenefitDefaultUnit = (benefitName: string): BenefitUnit | null => {
  const template = PREDEFINED_BENEFITS.find(b => b.name === benefitName)
  return template?.defaultUnit ?? null
}

// Helper to generate unique ID for benefits
export const generateBenefitId = (): string => {
  return `benefit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Unit display labels
export const UNIT_LABELS: Record<BenefitUnit, string> = {
  PKR: "PKR",
  days: "days",
  count: "",
  percent: "%"
}

// Format amount with unit for display
export const formatBenefitAmount = (amount: number | null, unit: BenefitUnit | null): string => {
  if (amount === null) return ""
  
  const formattedAmount = new Intl.NumberFormat('en-PK').format(amount)
  
  if (!unit) return formattedAmount
  
  switch (unit) {
    case "PKR":
      return `${formattedAmount} PKR`
    case "days":
      return `${amount} ${amount === 1 ? 'day' : 'days'}`
    case "percent":
      return `${amount}%`
    case "count":
      return formattedAmount
    default:
      return formattedAmount
  }
}
