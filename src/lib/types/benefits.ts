// Unit type for benefit amounts (maps to backend BenefitUnit: Pkr = 0, Percentage = 1)
export type BenefitUnit = "PKR" | "percent"

/** Employer benefit: name + optional measured value (matches EmployerBenefitDto / UpsertEmployerBenefitDto). */
export interface EmployerBenefit {
  id: string
  name: string
  /** When true, persist UnitType + Value to the API; when false, benefit is selected without a numeric value. */
  hasValue: boolean
  /** Maps to backend `Value` (decimal). */
  amount: number | null
  /** Maps to backend `UnitType`. */
  unit: BenefitUnit | null
}

// Template for predefined benefits (used in dropdown)
export interface BenefitTemplate {
  name: string
  hasAmount: boolean  // true = requires amount input, false = simple benefit
  defaultUnit: BenefitUnit | null  // default unit for this benefit type
}

/** API numeric enum for BenefitUnit (backend order). */
const BENEFIT_UNIT_API: Record<BenefitUnit, number> = {
  PKR: 0,
  percent: 1,
}

/** Coerce legacy or partial objects to a consistent `EmployerBenefit` (e.g. cached employer JSON). */
export function normalizeEmployerBenefit(b: EmployerBenefit): EmployerBenefit {
  const hasValue =
    typeof b.hasValue === "boolean"
      ? b.hasValue
      : b.amount != null || b.unit != null
  return {
    id: b.id,
    name: b.name,
    hasValue,
    amount: hasValue ? b.amount ?? null : null,
    unit: hasValue ? b.unit ?? null : null,
  }
}

/** Fields required to build API benefit upsert (employer or work experience). */
export type EmployerBenefitValueFields = Pick<EmployerBenefit, "hasValue" | "amount" | "unit">

/** Maps UI benefit value fields to employer / work-experience benefit upsert payload. */
export function employerBenefitToApiValueFields(b: EmployerBenefitValueFields): {
  hasValue: boolean
  unitType: number | null
  value: number | null
} {
  if (!b.hasValue) {
    return { hasValue: false, unitType: null, value: null }
  }
  const unit = b.unit
  const unitType = unit != null && unit in BENEFIT_UNIT_API ? BENEFIT_UNIT_API[unit] : null
  const value =
    b.amount != null && !Number.isNaN(Number(b.amount)) ? Number(b.amount) : null
  if (unitType == null || value == null) {
    return { hasValue: false, unitType: null, value: null }
  }
  return { hasValue: true, unitType, value }
}
