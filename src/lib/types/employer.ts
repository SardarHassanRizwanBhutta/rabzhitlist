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
  status: EmployerStatus
  foundedYear: number | null
  ranking: EmployerRanking
  employerType: EmployerType
  locations: EmployerLocation[]
  techStacks?: string[]
  benefits?: EmployerBenefit[]
  tags?: string[]  // e.g., ["DPL Competitive", "Enterprise", "Startup"]
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

export type SalaryPolicy = 
  | "Standard"
  | "Tax Free"
  | "Remittance"

export type EmployerRanking =
  | "Top"
  | "Standard"
  | "DPL Favourite"

export type EmployerType =
  | "Product Based"
  | "Client Based"
  | "Resource Augmentation"

export const EMPLOYER_TYPE_LABELS: Record<EmployerType, string> = {
  "Product Based": "Product Based",
  "Client Based": "Client Based",
  "Resource Augmentation": "Resource Augmentation",
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
  Standard: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  "Tax Free": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Remittance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
}

export const EMPLOYER_STATUS_LABELS: Record<EmployerStatus, string> = {
  Active: "Active",
  Flagged: "Flagged", 
  Closed: "Closed"
}

export const SALARY_POLICY_LABELS: Record<SalaryPolicy, string> = {
  Standard: "Standard",
  "Tax Free": "Tax Free",
  Remittance: "Remittance"
}

export const EMPLOYER_RANKING_COLORS: Record<EmployerRanking, string> = {
  Top: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Standard: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  "DPL Favourite": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
}

export const EMPLOYER_RANKING_LABELS: Record<EmployerRanking, string> = {
  Top: "Top",
  Standard: "Standard",
  "DPL Favourite": "DPL Favourite"
}

// Size calculation utilities
export const calculateEmployerSize = (locations: EmployerLocation[]): { totalMinSize: number; totalMaxSize: number } => {
  const totalMinSize = locations.reduce((sum, location) => sum + (location.minSize ?? 0), 0)
  const totalMaxSize = locations.reduce((sum, location) => sum + (location.maxSize ?? 0), 0)
  return { totalMinSize, totalMaxSize}
}

// Get display label for calculated size
export const getEmployerSizeDisplay = (locations: EmployerLocation[]): string => {
  const { totalMinSize, totalMaxSize } = calculateEmployerSize(locations)
  
  if (totalMinSize === totalMaxSize) {
    return `${totalMinSize}`
  } else {
    return `${totalMinSize}-${totalMaxSize}`
  }
}
