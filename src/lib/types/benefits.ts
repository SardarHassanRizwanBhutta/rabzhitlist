// Unit type for benefit amounts
export type BenefitUnit = "PKR" | "days" | "count" | "percent"

// Employer benefit stored in work experience
export interface EmployerBenefit {
  id: string
  name: string
  amount: number | null  // null for simple benefits (Gym Passport), number for amount-based (IPD: 50000)
  unit: BenefitUnit | null  // null for simple benefits, otherwise the unit for the amount
}

// Template for predefined benefits (used in dropdown)
export interface BenefitTemplate {
  name: string
  hasAmount: boolean  // true = requires amount input, false = simple benefit
  defaultUnit: BenefitUnit | null  // default unit for this benefit type
}
