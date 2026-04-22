export interface EmployerLocation {
  id: string
  employerId: string
  country: string | null
  city: string | null
  address: string | null
  isHeadquarters: boolean
  salaryPolicy: SalaryPolicy
  minSize: number | null
  maxSize: number | null
  createdAt: Date
  updatedAt: Date
}

export type LayoffReason = 
  | "Cost reduction"
  | "Restructuring"
  | "Economic downturn"
  | "Funding issues"
  | "Other"

/** DB enum layoff_reason_enum (layoffs.reason). */
export type LayoffReasonDb =
  | "cost_reduction"
  | "restructuring"
  | "economic_downturn"
  | "funding_issues"
  | "other"

export const LAYOFF_REASON_DB_LABELS: Record<LayoffReasonDb, string> = {
  cost_reduction: "Cost reduction",
  restructuring: "Restructuring",
  economic_downturn: "Economic downturn",
  funding_issues: "Funding issues",
  other: "Other",
}

/** Map display (LayoffReason) to DB value for API. */
export const LAYOFF_REASON_DISPLAY_TO_DB: Record<LayoffReason, LayoffReasonDb> = {
  "Cost reduction": "cost_reduction",
  "Restructuring": "restructuring",
  "Economic downturn": "economic_downturn",
  "Funding issues": "funding_issues",
  "Other": "other",
}

export interface Layoff {
  id: string
  employerId: string
  layoffDate: Date
  numberOfEmployeesLaidOff: number
  reason: LayoffReason
  reasonOther?: string  // Required when reason is "Other"
  source: string
  createdAt: Date
  updatedAt: Date
}

export const LAYOFF_REASON_LABELS: Record<LayoffReason, string> = {
  "Cost reduction": "Cost reduction",
  "Restructuring": "Restructuring",
  "Economic downturn": "Economic downturn",
  "Funding issues": "Funding issues",
  "Other": "Other"
}

import { EmployerBenefit } from "./benefits"

// Tech stack with candidate count for displaying frequency
export interface TechStackWithCount {
  tech: string
  count: number
}

export interface Employer {
  id: string
  name: string
  websiteUrl: string | null
  linkedinUrl: string | null
  /** @deprecated Use statuses (employer_statuses junction). */
  status?: EmployerStatus
  /** Multiple statuses from employer_statuses (DB enum values). */
  statuses?: EmployerStatusDb[]
  foundedYear: number | null
  ranking: EmployerRanking
  /** DB enum value (employers.work_mode). */
  workMode?: WorkModeDb
  /** DB enum value (employers.shift_type). */
  shiftType?: ShiftTypeDb
  employerType: EmployerType
  /** Multiple types from employer_employer_types (DB enum values). */
  employerTypes?: EmployerTypeDb[]
  locations: EmployerLocation[]
  /** Company-wide salary policy (not per office). */
  salaryPolicy?: SalaryPolicy | null
  timeSupportZones?: string[]
  benefits?: EmployerBenefit[]
  isDPLCompetitive?: boolean  // Separate field for DPL Competitive status
  /** Company-wide headcount range (not tied to a single office). */
  minEmployees?: number | null
  maxEmployees?: number | null
  avgJobTenure?: number  // Manually set average job tenure in years (calculated from work experience data)
  tags?: string[]  // e.g., ["Enterprise", "Startup"] (DPL Competitive is now a separate field)
  layoffs?: Layoff[]  // One-to-many relationship with Layoffs
  createdAt: Date
  updatedAt: Date
}

export type EmployerSize = 
  | "Startup (1-10)"
  | "Small (11-50)"
  | "Medium (51-200)"
  | "Large (201-500)"
  | "Enterprise (500+)"

export type EmployerStatus = 
  | "Active"
  | "Flagged"
  | "Closed"

/** DB enum employer_status_enum (employer_statuses junction). */
export type EmployerStatusDb = "open" | "closed" | "flagged"

export const EMPLOYER_STATUS_DB_LABELS: Record<EmployerStatusDb, string> = {
  open: "Open",
  closed: "Closed",
  flagged: "Flagged",
}

/** Map display (EmployerStatus) to DB value for API/edit. */
export const EMPLOYER_STATUS_DISPLAY_TO_DB: Record<EmployerStatus, EmployerStatusDb> = {
  Active: "open",
  Flagged: "flagged",
  Closed: "closed",
}

/** Display strings match backend list / API descriptions. */
export type SalaryPolicy =
  | "Gross Salary"
  | "Remittance Salary"
  | "Net Salary"
  | "Fixed Salary + Commission/ Monthly Bonus"

/** DB-style keys for forms and mapping to API integers (see SALARY_POLICY_TO_API). */
export type SalaryPolicyDb =
  | "gross_salary"
  | "remittance_salary"
  | "net_salary"
  | "fixed_salary_plus_commission_or_monthly_bonus"

export const SALARY_POLICY_DB_LABELS: Record<SalaryPolicyDb, string> = {
  gross_salary: "Gross Salary",
  remittance_salary: "Remittance Salary",
  net_salary: "Net Salary",
  fixed_salary_plus_commission_or_monthly_bonus: "Fixed Salary + Commission/ Monthly Bonus",
}

/** Map display (SalaryPolicy) to DB value for API/edit. */
export const SALARY_POLICY_DISPLAY_TO_DB: Record<SalaryPolicy, SalaryPolicyDb> = {
  "Gross Salary": "gross_salary",
  "Remittance Salary": "remittance_salary",
  "Net Salary": "net_salary",
  "Fixed Salary + Commission/ Monthly Bonus": "fixed_salary_plus_commission_or_monthly_bonus",
}

/** Pre-migration API labels → current display (edge cases / cached data). */
const LEGACY_SALARY_POLICY_DISPLAY: Record<string, SalaryPolicy> = {
  Standard: "Gross Salary",
  "Tax Free": "Net Salary",
  Remittance: "Remittance Salary",
}

/** Matches backend list/detail display strings (ranking enum). */
export type EmployerRanking = "Tier 1" | "Tier 2" | "Tier 3" | "DPL Favourite"

export type EmployerType =
  | "Services Based"
  | "Product Based"
  | "SAAS"
  | "Startup"
  | "Integrator"
  | "Resource Augmentation"

export const EMPLOYER_TYPE_LABELS: Record<EmployerType, string> = {
  "Services Based": "Services Based",
  "Product Based": "Product Based",
  "SAAS": "SAAS",
  "Startup": "Startup",
  "Integrator": "Integrator",
  "Resource Augmentation": "Resource Augmentation",
}

/** DB enum employer_type_enum (employer_employer_types junction). */
export type EmployerTypeDb =
  | "services_based"
  | "product_based"
  | "saas"
  | "startup"
  | "integrator"
  | "resource_augmentation"

export const EMPLOYER_TYPE_DB_LABELS: Record<EmployerTypeDb, string> = {
  services_based: "Services Based",
  product_based: "Product Based",
  saas: "SaaS",
  startup: "Startup",
  integrator: "Integrator",
  resource_augmentation: "Resource Augmentation",
}

/** Map display (EmployerType) to DB value for API/edit. */
export const EMPLOYER_TYPE_DISPLAY_TO_DB: Record<EmployerType, EmployerTypeDb> = {
  "Services Based": "services_based",
  "Product Based": "product_based",
  "SAAS": "saas",
  "Startup": "startup",
  "Integrator": "integrator",
  "Resource Augmentation": "resource_augmentation",
}

/** Tailwind classes for type badges (tables, filters). */
export const EMPLOYER_TYPE_BADGE_COLORS: Record<EmployerTypeDb, string> = {
  services_based:
    "bg-slate-100 text-slate-800 border-slate-200/80 dark:bg-slate-900/80 dark:text-slate-200 dark:border-slate-700",
  product_based:
    "bg-blue-100 text-blue-900 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800",
  saas: "bg-violet-100 text-violet-900 border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800",
  startup:
    "bg-amber-100 text-amber-950 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-100 dark:border-amber-800",
  integrator:
    "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800",
  resource_augmentation:
    "bg-rose-100 text-rose-900 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800",
}

/** DB-style keys for forms and mapping to API integers (see RANKING_TO_API in employers-api). */
export type RankingDb = "tier_1" | "tier_2" | "tier_3" | "dpl_favourite"

export const RANKING_DB_LABELS: Record<RankingDb, EmployerRanking> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
  dpl_favourite: "DPL Favourite",
}

/** Map display (EmployerRanking) to DB value for API/edit. */
export const RANKING_DISPLAY_TO_DB: Record<EmployerRanking, RankingDb> = {
  "Tier 1": "tier_1",
  "Tier 2": "tier_2",
  "Tier 3": "tier_3",
  "DPL Favourite": "dpl_favourite",
}

/** API / JSON ranking enum order: Tier1=0 … DplFavourite=3. */
export const EMPLOYER_RANKING_API_ORDER: readonly EmployerRanking[] = [
  "Tier 1",
  "Tier 2",
  "Tier 3",
  "DPL Favourite",
] as const

/** Normalize list/detail strings (including removed Standard/Top) to current {@link EmployerRanking}. */
export function normalizeEmployerRankingFromApi(
  raw: string | number | null | undefined
): EmployerRanking {
  if (raw === null || raw === undefined) return "Tier 1"
  if (typeof raw === "number" && raw >= 0 && raw <= 3) {
    return EMPLOYER_RANKING_API_ORDER[raw] ?? "Tier 1"
  }
  const t = String(raw).trim()
  const pascal: Record<string, EmployerRanking> = {
    Tier1: "Tier 1",
    Tier2: "Tier 2",
    Tier3: "Tier 3",
    DplFavourite: "DPL Favourite",
  }
  if (t in pascal) return pascal[t]
  if (t in RANKING_DISPLAY_TO_DB) return t as EmployerRanking
  if (t === "Standard") return "Tier 1"
  if (t === "Top") return "Tier 2"
  const n = parseInt(t, 10)
  if (!Number.isNaN(n) && n >= 0 && n <= 3) return EMPLOYER_RANKING_API_ORDER[n] ?? "Tier 1"
  return "Tier 1"
}

/** DB enum work_mode_enum (employers.work_mode). */
export type WorkModeDb = "onsite" | "remote" | "hybrid"

export const WORK_MODE_DB_LABELS: Record<WorkModeDb, string> = {
  onsite: "Onsite",
  remote: "Remote",
  hybrid: "Hybrid",
}

/** DB enum shift_type_enum (employers.shift_type). */
export type ShiftTypeDb = "day" | "night" | "evening" | "rotational" | "flexible" | "on_call"

export const SHIFT_TYPE_DB_LABELS: Record<ShiftTypeDb, string> = {
  day: "Day",
  night: "Night",
  evening: "Evening",
  rotational: "Rotational",
  flexible: "Flexible",
  on_call: "On Call",
}

export interface EmployerTableColumn {
  id: keyof Employer | 'actions'
  label: string
  sortable?: boolean
  priority: 'high' | 'medium' | 'low'
  responsive: {
    desktop: boolean
    tablet: boolean
    mobile: boolean
  }
}

export const EMPLOYER_STATUS_COLORS: Record<EmployerStatus, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Flagged: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
}

export const SALARY_POLICY_COLORS: Record<SalaryPolicy, string> = {
  "Gross Salary": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  "Remittance Salary": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Net Salary": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Fixed Salary + Commission/ Monthly Bonus":
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
}

export const EMPLOYER_STATUS_LABELS: Record<EmployerStatus, string> = {
  Active: "Active",
  Flagged: "Flagged", 
  Closed: "Closed"
}

export const SALARY_POLICY_LABELS: Record<SalaryPolicy, string> = {
  "Gross Salary": "Gross Salary",
  "Remittance Salary": "Remittance Salary",
  "Net Salary": "Net Salary",
  "Fixed Salary + Commission/ Monthly Bonus": "Fixed Salary + Commission/ Monthly Bonus",
}

/** Normalize list/detail or legacy strings to a current {@link SalaryPolicy}. */
export function normalizeSalaryPolicy(policy: string | null | undefined): SalaryPolicy {
  if (!policy) return "Gross Salary"
  if (policy in SALARY_POLICY_DISPLAY_TO_DB) return policy as SalaryPolicy
  const legacy = LEGACY_SALARY_POLICY_DISPLAY[policy]
  if (legacy) return legacy
  return "Gross Salary"
}

export const EMPLOYER_RANKING_COLORS: Record<EmployerRanking, string> = {
  "Tier 1": "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  "Tier 2": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  "Tier 3": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "DPL Favourite": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

export const EMPLOYER_RANKING_LABELS: Record<EmployerRanking, string> = {
  "Tier 1": "Tier 1",
  "Tier 2": "Tier 2",
  "Tier 3": "Tier 3",
  "DPL Favourite": "DPL Favourite",
}

