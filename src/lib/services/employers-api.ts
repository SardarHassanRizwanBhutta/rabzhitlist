/**
 * Employer API client: list (filtered, paginated), get by id, create, update, delete.
 * @see Employer-API-Reference.md
 */

import type { Employer, EmployerLocation, Layoff } from "@/lib/types/employer"
import type { EmployerBenefit } from "@/lib/types/benefits"
import type { EmployerFormData, EmployerLocationFormData, LayoffFormData } from "@/components/employer-creation-dialog"
import {
  EMPLOYER_TYPE_DB_LABELS,
  SALARY_POLICY_DB_LABELS,
  type WorkModeDb,
  type ShiftTypeDb,
  type RankingDb,
  type EmployerTypeDb,
  type SalaryPolicyDb,
  type LayoffReasonDb,
  type EmployerRanking,
  type EmployerStatusDb,
} from "@/lib/types/employer"
import type { BenefitUnit } from "@/lib/types/benefits"
import type { LookupItem } from "@/lib/services/lookups-api"
import { API_BASE_URL } from "@/lib/config/api"

// --- API enum values (backend uses 0-based integers) ---
export const WORK_MODE_TO_API: Record<WorkModeDb, number> = {
  onsite: 0,
  remote: 1,
  hybrid: 2,
}
export const SHIFT_TYPE_TO_API: Record<ShiftTypeDb, number> = {
  day: 0,
  night: 1,
  evening: 2,
  rotational: 3,
  flexible: 4,
  on_call: 5,
}
export const RANKING_TO_API: Record<RankingDb, number> = {
  standard: 0,
  top: 1,
  dpl_favourite: 2,
}
export const EMPLOYER_TYPE_TO_API: Record<EmployerTypeDb, number> = {
  services_based: 0,
  product_based: 1,
  saas: 2,
  startup: 3,
  integrator: 4,
  resource_augmentation: 5,
}
export const SALARY_POLICY_TO_API: Record<SalaryPolicyDb, number> = {
  standard: 0,
  tax_free: 1,
  remittance: 2,
}
export const LAYOFF_REASON_TO_API: Record<LayoffReasonDb, number> = {
  cost_reduction: 0,
  restructuring: 1,
  economic_downturn: 2,
  funding_issues: 3,
  other: 4,
}
export const BENEFIT_UNIT_TO_API: Record<BenefitUnit, number> = {
  PKR: 0,
  days: 1,
  count: 2,
  percent: 3,
}
/** EmployerStatus: Open = 0, Closed = 1, Flagged = 2 (employer_statuses). */
export const EMPLOYER_STATUS_TO_API: Record<EmployerStatusDb, number> = {
  open: 0,
  closed: 1,
  flagged: 2,
}

const API_TO_WORK_MODE: Record<number, WorkModeDb> = { 0: "onsite", 1: "remote", 2: "hybrid" }
const API_TO_SHIFT_TYPE: Record<number, ShiftTypeDb> = {
  0: "day",
  1: "night",
  2: "evening",
  3: "rotational",
  4: "flexible",
  5: "on_call",
}
const API_TO_RANKING: Record<number, RankingDb> = { 0: "standard", 1: "top", 2: "dpl_favourite" }
const API_TO_EMPLOYER_TYPE: Record<number, EmployerTypeDb> = {
  0: "services_based",
  1: "product_based",
  2: "saas",
  3: "startup",
  4: "integrator",
  5: "resource_augmentation",
}
const API_TO_SALARY_POLICY: Record<number, SalaryPolicyDb> = {
  0: "standard",
  1: "tax_free",
  2: "remittance",
}
const API_TO_LAYOFF_REASON: Record<number, LayoffReasonDb> = {
  0: "cost_reduction",
  1: "restructuring",
  2: "economic_downturn",
  3: "funding_issues",
  4: "other",
}
const API_TO_BENEFIT_UNIT: Record<number, BenefitUnit> = {
  0: "PKR",
  1: "days",
  2: "count",
  3: "percent",
}

/** List API returns display strings; map to DB for Employer type. */
const WORK_MODE_DISPLAY_TO_DB: Record<string, WorkModeDb> = {
  Onsite: "onsite",
  Remote: "remote",
  Hybrid: "hybrid",
}
const SHIFT_TYPE_DISPLAY_TO_DB: Record<string, ShiftTypeDb> = {
  Day: "day",
  Night: "night",
  Evening: "evening",
  Rotational: "rotational",
  Flexible: "flexible",
  "On Call": "on_call",
}

/** List/detail API may return "Open"; UI uses "Active". Map to EmployerStatus for table/detail. */
function normalizeEmployerStatus(apiStatus: string | null | undefined): "Active" | "Flagged" | "Closed" {
  if (!apiStatus) return "Active"
  const s = apiStatus.trim()
  if (s === "Open" || s === "Active") return "Active"
  if (s === "Flagged") return "Flagged"
  if (s === "Closed") return "Closed"
  return "Active"
}

// --- API DTOs (from reference) ---
export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/** Search/combobox result: id + name only. @see GET /api/employers/search */
export interface EmployerLookupDto {
  id: number
  name: string
}

export interface EmployerListItemDto {
  id: number
  name: string
  status: string | null
  websiteUrl?: string | null
  linkedInUrl?: string | null
  foundedYear: number | null
  ranking: string | null
  employerType: string | null
  /** Employer-level work mode display: "Onsite", "Remote", "Hybrid". */
  workMode?: string | null
  /** Employer-level shift type display: "Day", "Night", "Evening", "Rotational", "Flexible", "On Call". */
  shiftType?: string | null
  /** Benefit names (e.g. "Health Insurance"). */
  benefits?: string[]
  /** Time support zone names (e.g. "PST", "EST"). */
  timeSupportZones?: string[]
  locations: EmployerListItemLocationDto[]
  techStacks: string[]
  tags: string[]
  isDPLCompetitive: boolean
}

export interface EmployerListItemLocationDto {
  id: number
  country: string
  city: string
  minSize: number | null
  maxSize: number | null
  salaryPolicy: string | null
}

export interface EmployerDto {
  id: number
  name: string
  websiteUrl: string | null
  linkedInUrl: string | null
  foundedYear: number | null
  workMode: number | null
  shiftType: number | null
  isDplCompetitor: boolean
  ranking: number | null
  types: number[]
  locations: EmployerLocationDto[]
  layoffs: EmployerLayoffDto[]
  benefits: EmployerBenefitDto[]
  timeSupportZones: { id: number; name: string }[]
  tags: { id: number; name: string }[]
  techStacks: { id: number; name: string }[]
  createdAt: string
  updatedAt: string
}

export interface EmployerLocationDto {
  id: number
  employerId: number
  country: { id: number; name: string }
  city: string
  address: string | null
  salaryPolicy: number | null
  minEmployees: number | null
  maxEmployees: number | null
  isHeadquarters: boolean
  createdAt: string
}

export interface EmployerLayoffDto {
  id: number
  employerId: number
  layoffDate: string | null
  affectedEmployees: number | null
  reason: number | null
  source: string | null
  createdAt: string
}

export interface EmployerBenefitDto {
  benefitId: number
  benefitName: string
  hasValue: boolean
  unitType: number | null
  value: number | null
}

export interface CreateEmployerDto {
  name: string
  websiteUrl?: string | null
  linkedInUrl?: string | null
  foundedYear?: number | null
  workMode?: number | null
  shiftType?: number | null
  isDplCompetitor: boolean
  ranking?: number | null
  /** Optional. EmployerStatus enum values (Open=0, Closed=1, Flagged=2). Stored in employer_statuses. */
  status?: number[] | null
  employerTypes?: number[] | null
  tagIds?: number[] | null
  techStackIds?: number[] | null
  timeSupportZoneIds?: number[] | null
  benefits?: CreateEmployerBenefitDto[] | null
  locations?: CreateEmployerLocationDto[] | null
  layoffs?: CreateEmployerLayoffDto[] | null
}

export interface CreateEmployerBenefitDto {
  benefitId: number
  hasValue: boolean
  unitType?: number | null
  value?: number | null
}

export interface CreateEmployerLocationDto {
  countryId: number
  city: string
  address?: string | null
  salaryPolicy?: number | null
  minEmployees?: number | null
  maxEmployees?: number | null
  isHeadquarters: boolean
}

export interface CreateEmployerLayoffDto {
  layoffDate: string
  affectedEmployees: number
  reason: number
  source?: string | null
}

/** Body for POST /api/employers/{employerId}/layoffs — do not send employerId; employer is from URL. */
export interface AddEmployerLayoffDto {
  layoffDate: string
  affectedEmployees: number
  reason: number
  source?: string | null
}

export interface UpdateEmployerDto {
  name: string
  websiteUrl?: string | null
  linkedInUrl?: string | null
  foundedYear?: number | null
  workMode?: number | null
  shiftType?: number | null
  isDplCompetitor: boolean
  ranking?: number | null
  /** Optional. EmployerStatus enum values (Open=0, Closed=1, Flagged=2). */
  status?: number[] | null
  types?: number[] | null
}

// --- List params (pagination + optional filters) ---
export interface FetchEmployersParams {
  pageNumber: number
  pageSize: number
  status?: number[] | string[]
  foundedYears?: string[]
  employerTypes?: number[]
  tags?: string[]
  rankings?: number[]
  isDPLCompetitive?: boolean
  // Add more filter keys as needed per Employer-Filters-Reference.md
}

function buildQueryString(params: FetchEmployersParams): string {
  const search = new URLSearchParams()
  search.set("pageNumber", String(params.pageNumber))
  search.set("pageSize", String(Math.min(100, params.pageSize)))
  if (params.foundedYears?.length) params.foundedYears.forEach((y) => search.append("foundedYears", y))
  if (params.tags?.length) params.tags.forEach((t) => search.append("tags", t))
  if (params.isDPLCompetitive != null) search.set("isDPLCompetitive", String(params.isDPLCompetitive))
  return search.toString()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Employers API ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Employers API ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Employers API ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    throw new Error(`Employers API ${path}: ${res.status} — ${text}`)
  }
}

// --- API calls ---
export async function fetchEmployers(params: FetchEmployersParams): Promise<PagedResult<EmployerListItemDto>> {
  const qs = buildQueryString(params)
  return get<PagedResult<EmployerListItemDto>>(`/api/employers?${qs}`)
}

export async function fetchEmployerById(id: number): Promise<EmployerDto> {
  return get<EmployerDto>(`/api/employers/${id}`)
}

export async function createEmployer(dto: CreateEmployerDto): Promise<EmployerDto> {
  return post<EmployerDto>("/api/employers", dto)
}

export async function updateEmployer(id: number, dto: UpdateEmployerDto): Promise<EmployerDto> {
  return put<EmployerDto>(`/api/employers/${id}`, dto)
}

export async function deleteEmployer(id: number): Promise<void> {
  return del(`/api/employers/${id}`)
}

/** Add a layoff to an existing employer. Body must not include employerId. layoffDate and affectedEmployees required. */
export async function addEmployerLayoff(
  employerId: number,
  body: AddEmployerLayoffDto
): Promise<EmployerLayoffDto> {
  if (body.layoffDate == null || body.affectedEmployees == null) {
    throw new Error("layoffDate and affectedEmployees are required.")
  }
  return post<EmployerLayoffDto>(`/api/employers/${employerId}/layoffs`, body)
}

/** True when the layoff row was added in the form (id is UUID). False when it came from the server (id is numeric). */
export function isNewLayoffFormRow(id: string): boolean {
  const n = parseInt(id, 10)
  return Number.isNaN(n) || String(n) !== id
}

/** Build body for POST /api/employers/{id}/layoffs from a form row. Returns null if date or count invalid. */
export function buildAddEmployerLayoffDto(lay: LayoffFormData): AddEmployerLayoffDto | null {
  if (!lay.layoffDate) return null
  const n = parseInt(String(lay.numberOfEmployeesLaidOff), 10)
  if (Number.isNaN(n) || n < 0) return null
  return {
    layoffDate: lay.layoffDate.toISOString().slice(0, 10),
    affectedEmployees: n,
    reason: lay.reason in LAYOFF_REASON_TO_API ? LAYOFF_REASON_TO_API[lay.reason] : 0,
    source: lay.source?.trim() || null,
  }
}

/** Search employers by name (e.g. for combobox). GET /api/employers/search */
export async function searchEmployers(
  search: string,
  limit = 10,
  signal?: AbortSignal
): Promise<EmployerLookupDto[]> {
  const params = new URLSearchParams()
  if (search.trim()) params.set("search", search.trim())
  params.set("limit", String(Math.min(20, Math.max(1, limit))))
  const path = `/api/employers/search?${params.toString()}`
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Employers API ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

// --- Map API list item -> Employer (for table) ---
export function employerListItemToEmployer(item: EmployerListItemDto): Employer {
  const workModeDb =
    item.workMode && item.workMode in WORK_MODE_DISPLAY_TO_DB
      ? WORK_MODE_DISPLAY_TO_DB[item.workMode]
      : undefined
  const shiftTypeDb =
    item.shiftType && item.shiftType in SHIFT_TYPE_DISPLAY_TO_DB
      ? SHIFT_TYPE_DISPLAY_TO_DB[item.shiftType]
      : undefined
  const benefitsList: Employer["benefits"] = (item.benefits ?? []).map((name) => ({
    id: "",
    name,
    amount: null,
    unit: null,
  }))
  return {
    id: String(item.id),
    name: item.name,
    websiteUrl: item.websiteUrl ?? null,
    linkedinUrl: item.linkedInUrl ?? null,
    status: normalizeEmployerStatus(item.status),
    foundedYear: item.foundedYear,
    ranking: (item.ranking as "Top" | "Standard" | "DPL Favourite") || "Standard",
    employerType: (item.employerType as "Services Based" | "Product Based" | "SAAS" | "Startup" | "Integrator" | "Resource Augmentation") || "Product Based",
    workMode: workModeDb,
    shiftType: shiftTypeDb,
    locations: item.locations.map((loc) => ({
      id: String(loc.id),
      employerId: String(item.id),
      country: loc.country,
      city: loc.city,
      address: null,
      isHeadquarters: false,
      salaryPolicy: (loc.salaryPolicy as "Standard" | "Tax Free" | "Remittance") || "Standard",
      minSize: loc.minSize,
      maxSize: loc.maxSize,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    techStacks: item.techStacks ?? [],
    tags: item.tags ?? [],
    benefits: benefitsList.length ? benefitsList : undefined,
    timeSupportZones: item.timeSupportZones?.length ? item.timeSupportZones : undefined,
    isDPLCompetitive: item.isDPLCompetitive ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// --- Map API full DTO -> Employer (for edit/detail) ---
export function employerDtoToEmployer(dto: EmployerDto): Employer {
  const locations: EmployerLocation[] = dto.locations.map((loc) => {
    const policyNum = loc.salaryPolicy
    const policyDb: SalaryPolicyDb | null = policyNum != null && policyNum in API_TO_SALARY_POLICY ? (API_TO_SALARY_POLICY as Record<number, SalaryPolicyDb>)[policyNum] : null
    const salaryPolicyDisplay = policyDb ? (SALARY_POLICY_DB_LABELS[policyDb] as "Standard" | "Tax Free" | "Remittance") : "Standard"
    return {
      id: String(loc.id),
      employerId: String(dto.id),
      country: loc.country?.name ?? null,
      city: loc.city ?? null,
      address: loc.address ?? null,
      isHeadquarters: loc.isHeadquarters,
      salaryPolicy: salaryPolicyDisplay,
      minSize: loc.minEmployees ?? null,
      maxSize: loc.maxEmployees ?? null,
      createdAt: new Date(loc.createdAt),
      updatedAt: new Date(loc.createdAt),
    }
  })

  const layoffs: Layoff[] = (dto.layoffs ?? []).map((lay) => {
    const reasonNum = lay.reason ?? 0
    const reasonDb = API_TO_LAYOFF_REASON[reasonNum] ?? "cost_reduction"
    const labels: Record<LayoffReasonDb, "Cost reduction" | "Restructuring" | "Economic downturn" | "Funding issues" | "Other"> = {
      cost_reduction: "Cost reduction",
      restructuring: "Restructuring",
      economic_downturn: "Economic downturn",
      funding_issues: "Funding issues",
      other: "Other",
    }
    return {
      id: String(lay.id),
      employerId: String(dto.id),
      layoffDate: lay.layoffDate ? new Date(lay.layoffDate) : new Date(0),
      numberOfEmployeesLaidOff: lay.affectedEmployees ?? 0,
      reason: labels[reasonDb],
      source: lay.source ?? "",
      createdAt: new Date(lay.createdAt),
      updatedAt: new Date(lay.createdAt),
    }
  })

  const benefits: EmployerBenefit[] = (dto.benefits ?? []).map((b) => ({
    id: String(b.benefitId),
    name: b.benefitName,
    amount: b.hasValue && b.value != null ? b.value : null,
    unit: b.hasValue && b.unitType != null && b.unitType in API_TO_BENEFIT_UNIT ? API_TO_BENEFIT_UNIT[b.unitType] : null,
  }))

  const rankingDisplay: EmployerRanking =
    dto.ranking != null && dto.ranking in API_TO_RANKING
      ? (["Standard", "Top", "DPL Favourite"] as EmployerRanking[])[dto.ranking]
      : "Standard"
  const employerTypesDb = dto.types?.map((t) => (t in API_TO_EMPLOYER_TYPE ? API_TO_EMPLOYER_TYPE[t] : "product_based")).filter(Boolean) as EmployerTypeDb[] ?? []
  const firstTypeDb = employerTypesDb[0]
  const employerTypeDisplay = firstTypeDb ? (EMPLOYER_TYPE_DB_LABELS[firstTypeDb] as "Services Based" | "Product Based" | "SAAS" | "Startup" | "Integrator" | "Resource Augmentation") : "Product Based"

  return {
    id: String(dto.id),
    name: dto.name,
    websiteUrl: dto.websiteUrl ?? null,
    linkedinUrl: dto.linkedInUrl ?? null,
    foundedYear: dto.foundedYear ?? null,
    workMode: dto.workMode != null && dto.workMode in API_TO_WORK_MODE ? API_TO_WORK_MODE[dto.workMode] : undefined,
    shiftType: dto.shiftType != null && dto.shiftType in API_TO_SHIFT_TYPE ? API_TO_SHIFT_TYPE[dto.shiftType] : undefined,
    isDPLCompetitive: dto.isDplCompetitor ?? false,
    ranking: rankingDisplay,
    employerType: employerTypeDisplay,
    employerTypes: employerTypesDb,
    locations,
    techStacks: dto.techStacks?.map((t) => t.name) ?? [],
    timeSupportZones: dto.timeSupportZones?.map((z) => z.name) ?? [],
    tags: dto.tags?.map((t) => t.name) ?? [],
    benefits,
    layoffs,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  }
}

// --- Build CreateEmployerDto from form + lookups ---
export interface BuildCreateEmployerDtoOptions {
  techStacksLookup: LookupItem[]
  tagsLookup: LookupItem[]
  timeSupportZonesLookup: LookupItem[]
  /** Resolve country name to country id. If not provided, 0 is used (backend may validate). */
  getCountryId?: (countryName: string) => number
}

const CURRENT_YEAR = new Date().getFullYear()

export function buildCreateEmployerDto(
  formData: EmployerFormData,
  options: BuildCreateEmployerDtoOptions
): CreateEmployerDto {
  const name = formData.name.trim()
  if (!name) throw new Error("Name is required.")

  const foundedYearParsed = formData.foundedYear?.trim()
    ? parseInt(formData.foundedYear.trim(), 10)
    : null
  if (
    foundedYearParsed != null &&
    (Number.isNaN(foundedYearParsed) || foundedYearParsed < 1800 || foundedYearParsed > CURRENT_YEAR)
  ) {
    throw new Error(`Founded year must be between 1800 and ${CURRENT_YEAR}.`)
  }

  const {
    techStacksLookup,
    tagsLookup,
    timeSupportZonesLookup,
    getCountryId = () => 0,
  } = options

  const tagIds = formData.tags
    .map((name) => tagsLookup.find((t) => t.name === name)?.id)
    .filter((id): id is number => id != null)
  const techStackIds = formData.techStacks
    .map((name) => techStacksLookup.find((t) => t.name === name)?.id)
    .filter((id): id is number => id != null)
  const timeSupportZoneIds = formData.timeSupportZones
    .map((name) => timeSupportZonesLookup.find((t) => t.name === name)?.id)
    .filter((id): id is number => id != null)

  // For hasValue === true send both unitType and value; for hasValue === false omit or send null.
  const benefits: CreateEmployerBenefitDto[] = formData.benefits
    .map((b): CreateEmployerBenefitDto | null => {
      const benefitId = typeof b.id === "string" ? parseInt(b.id, 10) : b.id
      if (Number.isNaN(benefitId) || benefitId <= 0) return null
      const hasValue = b.amount != null || (b.unit != null && String(b.unit).trim() !== "")
      const unitType =
        hasValue && b.unit && b.unit in BENEFIT_UNIT_TO_API ? BENEFIT_UNIT_TO_API[b.unit] : null
      const value = hasValue && b.amount != null ? b.amount : null
      if (hasValue && (unitType == null || value == null)) return null
      return hasValue
        ? { benefitId, hasValue: true, unitType: unitType!, value: value! }
        : { benefitId, hasValue: false, unitType: null, value: null }
    })
    .filter((b): b is CreateEmployerBenefitDto => b != null)

  const locations: CreateEmployerLocationDto[] = formData.locations
    .filter((loc) => loc.city.trim() || loc.country.trim())
    .map((loc) => ({
      countryId: getCountryId(loc.country.trim()) || 0,
      city: loc.city.trim() || "",
      address: loc.address.trim() || null,
      salaryPolicy: loc.salaryPolicy && loc.salaryPolicy in SALARY_POLICY_TO_API
        ? SALARY_POLICY_TO_API[loc.salaryPolicy]
        : null,
      minEmployees: loc.minSize ? parseInt(loc.minSize, 10) : null,
      maxEmployees: loc.maxSize ? parseInt(loc.maxSize, 10) : null,
      isHeadquarters: loc.isHeadquarters,
    }))

  const layoffs: CreateEmployerLayoffDto[] = formData.layoffs
    .filter((lay) => {
      if (!lay.layoffDate) return false
      const n = parseInt(String(lay.numberOfEmployeesLaidOff), 10)
      return !Number.isNaN(n) && n >= 0
    })
    .map((lay) => ({
      layoffDate: lay.layoffDate!.toISOString().slice(0, 10),
      affectedEmployees: parseInt(String(lay.numberOfEmployeesLaidOff), 10),
      reason: lay.reason in LAYOFF_REASON_TO_API ? LAYOFF_REASON_TO_API[lay.reason] : 0,
      source: lay.source?.trim() || null,
    }))

  const dto: CreateEmployerDto = {
    name,
    websiteUrl: formData.websiteUrl.trim() || null,
    linkedInUrl: formData.linkedinUrl.trim() || null,
    foundedYear: foundedYearParsed,
    workMode: formData.workMode && formData.workMode in WORK_MODE_TO_API ? WORK_MODE_TO_API[formData.workMode] : null,
    shiftType: formData.shiftType && formData.shiftType in SHIFT_TYPE_TO_API ? SHIFT_TYPE_TO_API[formData.shiftType] : null,
    isDplCompetitor: formData.isDPLCompetitive,
    ranking: formData.ranking && formData.ranking in RANKING_TO_API ? RANKING_TO_API[formData.ranking] : null,
    status: formData.statuses?.length
      ? formData.statuses.map((s) => EMPLOYER_STATUS_TO_API[s]).filter((n) => n != null)
      : null,
    employerTypes: formData.employerTypes.length
      ? formData.employerTypes.map((t) => EMPLOYER_TYPE_TO_API[t]).filter((n) => n != null)
      : null,
    tagIds: tagIds.length ? tagIds : null,
    techStackIds: techStackIds.length ? techStackIds : null,
    timeSupportZoneIds: timeSupportZoneIds.length ? timeSupportZoneIds : null,
    benefits: benefits.length ? benefits : null,
    locations: locations.length ? locations : null,
    layoffs: layoffs.length ? layoffs : null,
  }
  return dto
}

export function buildUpdateEmployerDto(formData: EmployerFormData): UpdateEmployerDto {
  return {
    name: formData.name.trim(),
    websiteUrl: formData.websiteUrl.trim() || null,
    linkedInUrl: formData.linkedinUrl.trim() || null,
    foundedYear: formData.foundedYear ? parseInt(formData.foundedYear, 10) : null,
    workMode: formData.workMode && formData.workMode in WORK_MODE_TO_API ? WORK_MODE_TO_API[formData.workMode] : null,
    shiftType: formData.shiftType && formData.shiftType in SHIFT_TYPE_TO_API ? SHIFT_TYPE_TO_API[formData.shiftType] : null,
    isDplCompetitor: formData.isDPLCompetitive,
    ranking: formData.ranking && formData.ranking in RANKING_TO_API ? RANKING_TO_API[formData.ranking] : null,
    status: formData.statuses?.length
      ? formData.statuses.map((s) => EMPLOYER_STATUS_TO_API[s]).filter((n) => n != null)
      : null,
    types: formData.employerTypes.length
      ? formData.employerTypes.map((t) => EMPLOYER_TYPE_TO_API[t]).filter((n) => n != null)
      : null,
  }
}
