import type {
  WorkExperience,
  WorkExperienceLayoffRow,
  WorkExperienceOfficeLocation,
} from "@/lib/types/candidate"
import type { EmployerBenefit } from "@/lib/types/benefits"
import type { EmployerTypeDb, LayoffReasonDb, RankingDb, SalaryPolicyDb } from "@/lib/types/employer"
import type { EmployerDto } from "@/lib/services/employers-api"
import { fetchEmployerById } from "@/lib/services/employers-api"
import type {
  BenefitForService,
  WorkExperienceForService,
  WorkExperienceLayoffForService,
  WorkExperienceOfficeForService,
} from "@/types/question-generation"
import { mapLinkedProjectToServicePayload } from "@/lib/utils/map-linked-project-for-service"
import { rankingToEducationServicePayload } from "@/lib/utils/map-education-for-service"

const RANKING_FROM_API: Record<number, RankingDb> = {
  0: "tier_1",
  1: "tier_2",
  2: "tier_3",
  3: "dpl_favourite",
}

const EMPLOYER_TYPE_FROM_API: Record<number, EmployerTypeDb> = {
  0: "services_based",
  1: "product_based",
  2: "saas",
  3: "startup",
  4: "integrator",
  5: "resource_augmentation",
}

const SALARY_POLICY_FROM_API: Record<number, SalaryPolicyDb> = {
  0: "gross_salary",
  1: "remittance_salary",
  2: "net_salary",
  3: "fixed_salary_plus_commission_or_monthly_bonus",
}

const LAYOFF_REASON_FROM_API: Record<number, LayoffReasonDb> = {
  0: "cost_reduction",
  1: "restructuring",
  2: "economic_downturn",
  3: "funding_issues",
  4: "other",
}

const WORK_MODE_FROM_API: Record<number, string> = {
  0: "onsite",
  1: "remote",
  2: "hybrid",
}

const SHIFT_TYPE_FROM_API: Record<number, string> = {
  0: "day",
  1: "night",
  2: "evening",
  3: "rotational",
  4: "flexible",
  5: "on_call",
}

const STATUS_FROM_API: Record<number, string> = {
  0: "open",
  1: "closed",
  2: "flagged",
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function toIsoDate(value: Date | undefined | null): string | null {
  if (value == null) return null
  try {
    return value.toISOString()
  } catch {
    return null
  }
}

function shiftTypeToServicePayload(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (trimmed === "") return null
  if (trimmed === "onCall") return "on_call"
  return trimmed
}

function mapBenefitToService(benefit: EmployerBenefit): BenefitForService {
  if (!benefit.hasValue) {
    return { name: benefit.name, amount: null, unit: null }
  }
  return {
    name: benefit.name,
    amount: benefit.amount ?? null,
    unit: benefit.unit ?? null,
  }
}

function mapBenefitsFromEmployerDto(dto: EmployerDto): EmployerBenefit[] {
  return (dto.benefits ?? []).map((b) => ({
    id: String(b.benefitId),
    name: b.benefitName,
    hasValue: b.hasValue,
    amount: b.hasValue && b.value != null ? Number(b.value) : null,
    unit:
      b.hasValue && b.unitType != null
        ? b.unitType === 0
          ? "PKR"
          : b.unitType === 1
            ? "percent"
            : null
        : null,
  }))
}

export interface EmployerCatalogFromApi {
  foundedYear: number | null
  status: string | null
  types: string[]
  ranking: string | null
  minEmployees: number | null
  maxEmployees: number | null
  websiteUrl: string | null
  linkedinUrl: string | null
  isDplCompetitor: boolean | null
  salaryPolicy: string | null
  tags: string[]
  workMode: string | null
  shiftType: string | null
  timeSupportZones: string[]
  benefits: EmployerBenefit[]
  locations: WorkExperienceOfficeLocation[]
  layoffs: WorkExperienceLayoffRow[]
}

export function employerEntityToCatalog(dto: EmployerDto): EmployerCatalogFromApi {
  const statusNum = dto.status?.[0]
  const status =
    statusNum != null && statusNum in STATUS_FROM_API ? STATUS_FROM_API[statusNum] : null

  const types = (dto.types ?? [])
    .map((t) => (t in EMPLOYER_TYPE_FROM_API ? EMPLOYER_TYPE_FROM_API[t] : null))
    .filter((t): t is EmployerTypeDb => t != null)

  const ranking =
    dto.ranking != null && dto.ranking in RANKING_FROM_API
      ? RANKING_FROM_API[dto.ranking]
      : null

  const salaryPolicy =
    dto.salaryPolicy != null && dto.salaryPolicy in SALARY_POLICY_FROM_API
      ? SALARY_POLICY_FROM_API[dto.salaryPolicy]
      : null

  const locations: WorkExperienceOfficeLocation[] = (dto.locations ?? []).map((loc) => ({
    country: loc.country?.name != null ? String(loc.country.name) : null,
    city: emptyToNull(loc.city),
    address: emptyToNull(loc.address),
    isHeadquarters: typeof loc.isHeadquarters === "boolean" ? loc.isHeadquarters : null,
  }))

  const layoffs: WorkExperienceLayoffRow[] = (dto.layoffs ?? []).map((lay) => {
    const reasonNum = lay.reason
    const reason =
      reasonNum != null && reasonNum in LAYOFF_REASON_FROM_API
        ? LAYOFF_REASON_FROM_API[reasonNum]
        : null
    return {
      layoffDate: lay.layoffDate ? new Date(lay.layoffDate) : null,
      affectedEmployees: lay.affectedEmployees ?? null,
      reason,
      source: emptyToNull(lay.source),
    }
  })

  return {
    foundedYear: dto.foundedYear ?? null,
    status,
    types,
    ranking,
    minEmployees: dto.minEmployees ?? null,
    maxEmployees: dto.maxEmployees ?? null,
    websiteUrl: emptyToNull(dto.websiteUrl),
    linkedinUrl: emptyToNull(dto.linkedInUrl),
    isDplCompetitor: typeof dto.isDplCompetitor === "boolean" ? dto.isDplCompetitor : null,
    salaryPolicy,
    tags: (dto.tags ?? []).map((t) => t.name).filter((n) => n.trim() !== ""),
    workMode:
      dto.workMode != null && dto.workMode in WORK_MODE_FROM_API
        ? WORK_MODE_FROM_API[dto.workMode]
        : null,
    shiftType:
      dto.shiftType != null && dto.shiftType in SHIFT_TYPE_FROM_API
        ? SHIFT_TYPE_FROM_API[dto.shiftType]
        : null,
    timeSupportZones: (dto.timeSupportZones ?? []).map((z) => z.name),
    benefits: mapBenefitsFromEmployerDto(dto),
    locations,
    layoffs,
  }
}

export function resolveWorkExperienceEmployerId(we: WorkExperience): number | null {
  if (we.employerId != null && Number.isFinite(we.employerId) && we.employerId > 0) {
    return we.employerId
  }
  return null
}

function hasBenefitsValue(benefits: EmployerBenefit[] | undefined): boolean {
  return (benefits?.length ?? 0) > 0
}

export function mergeEmployerCatalogIntoWorkExperience(
  we: WorkExperience,
  catalog: EmployerCatalogFromApi,
): WorkExperience {
  const hasLocations = (we.locations?.length ?? 0) > 0
  const hasLayoffs = (we.layoffs?.length ?? 0) > 0

  return {
    ...we,
    foundedYear: we.foundedYear ?? catalog.foundedYear,
    status: we.status ?? catalog.status,
    types: (we.types?.length ?? 0) > 0 ? we.types : catalog.types,
    ranking: we.ranking ?? catalog.ranking,
    minEmployees: we.minEmployees ?? catalog.minEmployees,
    maxEmployees: we.maxEmployees ?? catalog.maxEmployees,
    websiteUrl: we.websiteUrl ?? catalog.websiteUrl,
    linkedinUrl: we.linkedinUrl ?? catalog.linkedinUrl,
    isDplCompetitor: we.isDplCompetitor ?? catalog.isDplCompetitor,
    salaryPolicy: we.salaryPolicy ?? catalog.salaryPolicy,
    tags: (we.tags?.length ?? 0) > 0 ? we.tags : catalog.tags,
    shiftType: we.shiftType ? we.shiftType : (catalog.shiftType as WorkExperience["shiftType"]),
    workMode: we.workMode ? we.workMode : (catalog.workMode as WorkExperience["workMode"]),
    timeSupportZones:
      (we.timeSupportZones?.length ?? 0) > 0 ? we.timeSupportZones : catalog.timeSupportZones,
    benefits: hasBenefitsValue(we.benefits) ? we.benefits : catalog.benefits,
    locations: hasLocations ? we.locations : catalog.locations,
    layoffs: hasLayoffs ? we.layoffs : catalog.layoffs,
  }
}

/**
 * Fetch employer catalog by `employerId` and merge into each work experience row
 * before POST to the question-generation service (§ 4.13).
 */
export async function enrichWorkExperiencesWithEmployerCatalog(
  workExperiences: WorkExperience[] | undefined,
): Promise<WorkExperience[]> {
  if (!workExperiences?.length) return workExperiences ?? []

  const ids = new Set<number>()
  for (const we of workExperiences) {
    const id = resolveWorkExperienceEmployerId(we)
    if (id != null) ids.add(id)
  }

  if (ids.size === 0) return workExperiences

  const catalogById = new Map<number, EmployerCatalogFromApi>()
  await Promise.all(
    [...ids].map(async (id) => {
      try {
        const employer = await fetchEmployerById(id)
        catalogById.set(id, employerEntityToCatalog(employer))
      } catch {
        // Leave catalog empty — question service treats fields as missing.
      }
    }),
  )

  return workExperiences.map((we) => {
    const id = resolveWorkExperienceEmployerId(we)
    if (id == null) return we
    const catalog = catalogById.get(id)
    if (!catalog) return we
    return mergeEmployerCatalogIntoWorkExperience(we, catalog)
  })
}

function mapOfficeToService(loc: WorkExperienceOfficeLocation): WorkExperienceOfficeForService {
  return {
    country: emptyToNull(loc.country),
    city: emptyToNull(loc.city),
    address: emptyToNull(loc.address),
    isHeadquarters: loc.isHeadquarters ?? null,
  }
}

function mapLayoffToService(lay: WorkExperienceLayoffRow): WorkExperienceLayoffForService {
  return {
    layoffDate: toIsoDate(lay.layoffDate ?? undefined),
    affectedEmployees: lay.affectedEmployees ?? null,
    reason: emptyToNull(lay.reason),
    source: emptyToNull(lay.source),
  }
}

export function mapWorkExperienceToServicePayload(we: WorkExperience): WorkExperienceForService {
  return {
    employerName: emptyToNull(we.employerName) ?? we.employerName,
    jobTitle: emptyToNull(we.jobTitle) ?? we.jobTitle,
    startDate: toIsoDate(we.startDate),
    endDate: toIsoDate(we.endDate),
    techStacks: we.techStacks ?? [],
    shiftType: shiftTypeToServicePayload(we.shiftType as string | null),
    workMode: emptyToNull(we.workMode as string | null),
    timeSupportZones: we.timeSupportZones ?? [],
    benefits: (we.benefits ?? []).map(mapBenefitToService),
    projects: (we.projects ?? []).map(mapLinkedProjectToServicePayload),
    foundedYear: we.foundedYear ?? null,
    status: emptyToNull(we.status),
    types: we.types ?? [],
    ranking: rankingToEducationServicePayload(we.ranking),
    minEmployees: we.minEmployees ?? null,
    maxEmployees: we.maxEmployees ?? null,
    websiteUrl: emptyToNull(we.websiteUrl),
    linkedInUrl: emptyToNull(we.linkedinUrl),
    isDplCompetitor: we.isDplCompetitor ?? null,
    salaryPolicy: emptyToNull(we.salaryPolicy),
    tags: we.tags ?? [],
    locations: (we.locations ?? []).map(mapOfficeToService),
    layoffs: (we.layoffs ?? []).map(mapLayoffToService),
  }
}
