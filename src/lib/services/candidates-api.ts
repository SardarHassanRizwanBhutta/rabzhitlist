/**
 * Candidates API client — list (paged), get by id, create, update, delete.
 * @see Candidates-API-Reference.md
 */

import type {
  Achievement,
  AchievementType,
  Candidate,
  CandidateCertification,
  CandidateEducation,
  CandidateStandaloneProject,
  ProjectExperience,
  WorkExperience,
} from "@/lib/types/candidate"
import type { CandidateFormData } from "@/components/candidate-creation-dialog"
import {
  MBTI_TYPES,
  CANDIDATE_SOURCE_DB,
  type CandidateSourceDb,
  parseCandidateSource,
  SHIFT_TYPE_DB,
  type ShiftTypeDb,
  WORK_MODE_DB,
  type WorkModeDb,
  CERTIFICATION_LEVEL_DB,
  type CertificationLevelDb,
  ACHIEVEMENT_TYPE_DB,
  type AchievementTypeDb,
} from "@/lib/constants/candidate-enums"
import { employerBenefitToApiValueFields, type BenefitUnit, type EmployerBenefit } from "@/lib/types/benefits"
import { API_BASE_URL } from "@/lib/config/api"

// --- API DTOs (aligned with Candidates-API-Reference.md) ---

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface CandidateListItemDto {
  id: number
  name: string
  email: string | null
  phoneNumber: string | null
  postingTitle: string | null
  cnic: string | null
  linkedInUrl: string | null
  githubUrl: string | null
  city: string | null
  totalExperienceYears: number | null
  currentSalary: number | null
  expectedSalary: number | null
  personalityType: number | null
  source: string | number | null
  status: string
  resumeUrl: string | null
  createdAt: string
  updatedAt: string
  /** Same as detail GET — for list badges/filters without an extra fetch. */
  isTopDeveloper?: boolean
}

export interface CreateCandidateDto {
  name: string
  email?: string | null
  phoneNumber?: string | null
  postingTitle?: string | null
  cnic?: string | null
  linkedInUrl?: string | null
  githubUrl?: string | null
  city?: string | null
  totalExperienceYears?: number | null
  currentSalary?: number | null
  expectedSalary?: number | null
  personalityType?: number | null
  source?: number | null
  status?: string
  resumeUrl?: string | null
  /** Optional; API defaults to false when omitted. */
  isTopDeveloper?: boolean
  techStackIds?: number[]
  projects?: CreateCandidateProjectDto[]
  educations?: CreateCandidateEducationDto[]
  certifications?: CreateCandidateCertificationDto[]
  achievements?: CreateCandidateAchievementDto[]
  workExperiences?: CreateCandidateWorkExperienceDto[]
}

interface CreateCandidateProjectDto {
  projectId: number
  contribution?: string | null
}

interface CreateCandidateEducationDto {
  universityId: number
  degreeId?: number | null
  majorId?: number | null
  startMonth?: string | null
  endMonth?: string | null
  grades?: string | null
  isTopper?: boolean
  isMainCheetah?: boolean
}

interface CreateCandidateCertificationDto {
  certificationId: number
  issueDate?: string | null
  expiryDate?: string | null
  url?: string | null
  level?: number | null
}

interface CreateCandidateAchievementDto {
  name: string
  type: number
  ranking?: string | null
  year?: number | null
  url?: string | null
  description?: string | null
}

interface CreateCandidateWorkExperienceBenefitDto {
  benefitId: number
  hasValue: boolean
  unitType?: number | null
  value?: number | null
}

interface CreateCandidateWorkExperienceDto {
  employerId: number
  jobTitle: string
  startDate?: string | null
  endDate?: string | null
  shiftType?: number | null
  workMode?: number | null
  timeSupportZoneIds?: number[]
  techStackIds?: number[]
  benefits?: CreateCandidateWorkExperienceBenefitDto[]
  projects?: CreateCandidateProjectDto[]
}

export interface UpdateCandidateDto {
  name: string
  email: string | null
  phoneNumber: string | null
  postingTitle: string | null
  cnic: string | null
  linkedInUrl: string | null
  githubUrl: string | null
  city: string | null
  totalExperienceYears: number | null
  currentSalary: number | null
  expectedSalary: number | null
  personalityType: number | null
  source: number | null
  status: string
  resumeUrl: string | null
  isTopDeveloper: boolean
}

function mbtiIndexToLabel(index: number | null | undefined): string | null {
  if (index == null || !Number.isInteger(index) || index < 0 || index >= MBTI_TYPES.length) {
    return null
  }
  return MBTI_TYPES[index] ?? null
}

function mbtiLabelToIndex(label: string | undefined | null): number | null {
  const t = (label ?? "").trim()
  if (!t) return null
  const i = MBTI_TYPES.indexOf(t as (typeof MBTI_TYPES)[number])
  return i === -1 ? null : i
}

function nullIfEmpty(s: string): string | null {
  const t = s.trim()
  return t === "" ? null : t
}

/** Send numeric enum index to match the C# backend enum. */
function sourceFormToApi(source: string): number | null {
  const s = source.trim().toLowerCase()
  const idx = CANDIDATE_SOURCE_DB.indexOf(s as CandidateSourceDb)
  return idx === -1 ? null : idx
}

function parseOptionalSalary(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const n = Number(t.replace(/,/g, ""))
  return Number.isFinite(n) ? n : null
}

function parseIsoDate(v: unknown): Date | undefined {
  if (v == null) return undefined
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v
  if (typeof v !== "string") return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function mapProjectExperience(raw: Record<string, unknown>, idx: number): ProjectExperience {
  const pid = raw.projectId
  return {
    id: String(raw.id ?? `proj-${idx}`),
    projectId: typeof pid === "number" && Number.isFinite(pid) ? pid : pid != null ? Number(pid) || null : null,
    projectName: String(raw.projectName ?? ""),
    contributionNotes:
      raw.contribution != null
        ? String(raw.contribution)
        : raw.contributionNotes != null
          ? String(raw.contributionNotes)
          : "",
  }
}

const API_TO_BENEFIT_UNIT: Record<number, BenefitUnit> = { 0: "PKR", 1: "days", 2: "count", 3: "percent" }

function mapBenefit(raw: Record<string, unknown>, idx: number): EmployerBenefit {
  const u = raw.unitType ?? raw.unit
  let unit: BenefitUnit | null = null
  if (typeof u === "number") {
    unit = API_TO_BENEFIT_UNIT[u] ?? null
  } else if (u === "PKR" || u === "days" || u === "count" || u === "percent") {
    unit = u
  }
  const amt = raw.value ?? raw.amount
  const amountParsed =
    typeof amt === "number" ? amt : amt != null ? Number(amt) : null
  const amount =
    amountParsed != null && !Number.isNaN(amountParsed) ? amountParsed : null
  const hasValueFromApi = raw.hasValue
  const hasValue =
    typeof hasValueFromApi === "boolean"
      ? hasValueFromApi
      : amount != null || unit != null
  return {
    id: String(raw.benefitId ?? raw.id ?? `b-${idx}`),
    name: String(raw.name ?? raw.benefitName ?? ""),
    hasValue,
    amount: hasValue ? amount : null,
    unit: hasValue ? unit : null,
  }
}

function mapWorkExperience(raw: Record<string, unknown>, idx: number): WorkExperience {
  const projectsRaw = raw.projects
  const projects = Array.isArray(projectsRaw)
    ? projectsRaw.map((p, i) => mapProjectExperience(asRecord(p) ?? {}, i))
    : []
  const benefitsRaw = raw.benefits
  const benefits = Array.isArray(benefitsRaw)
    ? benefitsRaw.map((b, i) => mapBenefit(asRecord(b) ?? {}, i))
    : []
  const techRaw = raw.techStacks ?? raw.techStackNames
  const techStacks = Array.isArray(techRaw)
    ? techRaw.map((t) => {
        if (typeof t === "string") return t
        const r = asRecord(t) ?? {}
        return String(r.techStackName ?? r.name ?? t)
      })
    : []
  const tzRaw = raw.timeSupportZones ?? raw.timeSupportZoneNames
  const timeSupportZones = Array.isArray(tzRaw)
    ? tzRaw.map((z) => {
        if (typeof z === "string") return z
        const r = asRecord(z) ?? {}
        return String(r.timeSupportZoneName ?? r.name ?? z)
      })
    : []
  const eid = raw.employerId
  return {
    id: String(raw.id ?? `we-${idx}`),
    employerId:
      typeof eid === "number" && Number.isFinite(eid) ? eid : eid != null ? Number(eid) || null : null,
    employerName: String(raw.employerName ?? ""),
    jobTitle: String(raw.jobTitle ?? ""),
    projects,
    startDate: parseIsoDate(raw.startDate),
    endDate: parseIsoDate(raw.endDate),
    techStacks,
    shiftType: typeof raw.shiftType === "number"
      ? (SHIFT_TYPE_DB[raw.shiftType] ?? "") as WorkExperience["shiftType"]
      : (raw.shiftType as WorkExperience["shiftType"]) ?? "",
    workMode: typeof raw.workMode === "number"
      ? (WORK_MODE_DB[raw.workMode] ?? "") as WorkExperience["workMode"]
      : (raw.workMode as WorkExperience["workMode"]) ?? "",
    timeSupportZones,
    benefits,
  }
}

function mapStandaloneProject(raw: Record<string, unknown>, idx: number): CandidateStandaloneProject {
  const pid = raw.projectId
  return {
    id: String(raw.id ?? `sp-${idx}`),
    projectId: typeof pid === "number" && Number.isFinite(pid) ? pid : pid != null ? Number(pid) || null : null,
    projectName: String(raw.projectName ?? ""),
    contributionNotes:
      raw.contribution != null
        ? String(raw.contribution)
        : raw.contributionNotes != null
          ? String(raw.contributionNotes)
          : "",
  }
}

const ACHIEVEMENT_TYPES: AchievementType[] = [
  "competition",
  "openSource",
  "award",
  "medal",
  "publication",
  "certification",
  "recognition",
  "other",
]

function normalizeAchievementType(raw: unknown): AchievementType {
  if (typeof raw === "number") {
    return ACHIEVEMENT_TYPES[raw] ?? "other"
  }
  const s = String(raw ?? "competition")
  const lower = s.toLowerCase().replace(/[-_]/g, "")
  for (const t of ACHIEVEMENT_TYPES) {
    if (t.toLowerCase() === lower) return t
  }
  return "other"
}

function mapCertification(raw: Record<string, unknown>, idx: number): CandidateCertification {
  const cid = raw.certificationId ?? raw.certification_id
  const certId =
    typeof cid === "number" && Number.isFinite(cid) ? cid : cid != null ? Number(cid) : NaN
  const url =
    raw.certificationUrl != null
      ? String(raw.certificationUrl)
      : raw.url != null
        ? String(raw.url)
        : null
  return {
    id: String(raw.id ?? `cert-${idx}`),
    certificationId: Number.isFinite(certId) ? certId : null,
    certificationName: String(raw.certificationName ?? raw.name ?? ""),
    certificationIssuerName:
      raw.issuerName != null
        ? String(raw.issuerName)
        : raw.certificationIssuerName != null
          ? String(raw.certificationIssuerName)
          : null,
    certificationLevel: typeof raw.certificationLevel === "number"
      ? (CERTIFICATION_LEVEL_DB[raw.certificationLevel] ?? null) as CandidateCertification["certificationLevel"]
      : typeof raw.level === "number"
        ? (CERTIFICATION_LEVEL_DB[raw.level] ?? null) as CandidateCertification["certificationLevel"]
        : raw.certificationLevel != null
          ? (String(raw.certificationLevel).toLowerCase() as CandidateCertification["certificationLevel"])
          : null,
    issueDate: parseIsoDate(raw.issueDate),
    expiryDate: parseIsoDate(raw.expiryDate),
    certificationUrl: url,
  }
}

function mapEducation(raw: Record<string, unknown>, idx: number): CandidateEducation {
  const ulid = raw.universityLocationId ?? raw.universityId
  return {
    id: String(raw.id ?? `edu-${idx}`),
    universityLocationId: ulid != null ? String(ulid) : "",
    universityLocationName: String(
      raw.universityLocationName ?? raw.universityName ?? raw.university ?? ""
    ),
    degreeName: String(raw.degreeName ?? ""),
    majorName: String(raw.majorName ?? ""),
    startMonth: parseIsoDate(raw.startMonth ?? raw.startDate),
    endMonth: parseIsoDate(raw.endMonth ?? raw.endDate),
    grades: raw.grades != null ? String(raw.grades) : null,
    isTopper: typeof raw.isTopper === "boolean" ? raw.isTopper : null,
    isCheetah:
      typeof raw.isCheetah === "boolean"
        ? raw.isCheetah
        : typeof raw.isMainCheetah === "boolean"
          ? raw.isMainCheetah
          : null,
  }
}

function mapAchievement(raw: Record<string, unknown>, idx: number): Achievement {
  return {
    id: String(raw.id ?? `ach-${idx}`),
    name: String(raw.name ?? ""),
    achievementType: normalizeAchievementType(raw.achievementType ?? raw.type),
    ranking: raw.ranking != null ? String(raw.ranking) : undefined,
    year: typeof raw.year === "number" ? raw.year : raw.year != null ? Number(raw.year) : undefined,
    url: raw.url != null ? String(raw.url) : undefined,
    description: raw.description != null ? String(raw.description) : undefined,
  }
}

/** Map GET list row to UI {@link Candidate} (no nested graph). */
export function candidateListItemDtoToCandidate(row: CandidateListItemDto): Candidate {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email ?? "",
    mobileNo: row.phoneNumber ?? "",
    postingTitle: row.postingTitle,
    cnic: row.cnic,
    currentSalary: row.currentSalary,
    expectedSalary: row.expectedSalary,
    city: row.city ?? "",
    linkedinUrl: row.linkedInUrl,
    githubUrl: row.githubUrl,
    source: parseCandidateSource(row.source),
    status: row.status as Candidate["status"],
    resume: row.resumeUrl,
    totalExperienceYears: row.totalExperienceYears,
    personalityType: mbtiIndexToLabel(row.personalityType),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    workExperiences: [],
    projects: [],
    certifications: [],
    educations: [],
    techStacks: [],
    isTopDeveloper:
      typeof row.isTopDeveloper === "boolean" ? row.isTopDeveloper : false,
  }
}

/** Map full GET /api/candidates/{id} JSON to {@link Candidate}. */
export function mapCandidateDtoToCandidate(data: Record<string, unknown>): Candidate {
  const id = typeof data.id === "number" ? data.id : Number(data.id)
  const pt =
    typeof data.personalityType === "number"
      ? data.personalityType
      : data.personalityType != null
        ? Number(data.personalityType)
        : null
  const weRaw = data.workExperiences
  const workExperiences = Array.isArray(weRaw)
    ? weRaw.map((w, i) => mapWorkExperience(asRecord(w) ?? {}, i))
    : []
  const projRaw = data.projects
  const projects = Array.isArray(projRaw)
    ? projRaw.map((p, i) => mapStandaloneProject(asRecord(p) ?? {}, i))
    : []
  const techRaw = data.techStacks
  const techStacks = Array.isArray(techRaw)
    ? techRaw.map((t) => {
        if (typeof t === "string") return t
        const r = asRecord(t) ?? {}
        return String(r.techStackName ?? r.name ?? t)
      })
    : []
  const certRaw = data.certifications
  const certifications = Array.isArray(certRaw)
    ? certRaw.map((c, i) => mapCertification(asRecord(c) ?? {}, i))
    : []
  const eduRaw = data.educations
  const educations = Array.isArray(eduRaw)
    ? eduRaw.map((e, i) => mapEducation(asRecord(e) ?? {}, i))
    : []
  const achRaw = data.achievements
  const achievements = Array.isArray(achRaw)
    ? achRaw.map((a, i) => mapAchievement(asRecord(a) ?? {}, i))
    : []

  return {
    id: String(Number.isFinite(id) ? id : data.id),
    name: String(data.name ?? ""),
    email: data.email != null ? String(data.email) : "",
    mobileNo: data.phoneNumber != null ? String(data.phoneNumber) : "",
    postingTitle: data.postingTitle != null ? String(data.postingTitle) : null,
    cnic: data.cnic != null ? String(data.cnic) : null,
    currentSalary: typeof data.currentSalary === "number" ? data.currentSalary : null,
    expectedSalary: typeof data.expectedSalary === "number" ? data.expectedSalary : null,
    city: data.city != null ? String(data.city) : "",
    linkedinUrl: data.linkedInUrl != null ? String(data.linkedInUrl) : null,
    githubUrl: data.githubUrl != null ? String(data.githubUrl) : null,
    source: parseCandidateSource(data.source as string | number | null),
    status: String(data.status ?? "sourced") as Candidate["status"],
    resume: data.resumeUrl != null ? String(data.resumeUrl) : null,
    totalExperienceYears:
      typeof data.totalExperienceYears === "number" ? data.totalExperienceYears : null,
    personalityType: mbtiIndexToLabel(Number.isFinite(pt as number) ? (pt as number) : null),
    createdAt: parseIsoDate(data.createdAt) ?? new Date(),
    updatedAt: parseIsoDate(data.updatedAt) ?? new Date(),
    workExperiences,
    projects,
    certifications,
    educations,
    techStacks,
    isTopDeveloper: typeof data.isTopDeveloper === "boolean" ? data.isTopDeveloper : false,
    achievements,
    competitions: [],
  }
}

function enumIndex<T extends string>(arr: readonly T[], val: string): number | null {
  const lower = val.trim().toLowerCase()
  const idx = arr.findIndex((v) => v.toLowerCase() === lower)
  return idx === -1 ? null : idx
}

function formatDateForApi(d: Date | undefined): string | null {
  if (!d) return null
  return d.toISOString().split("T")[0] ?? null
}

function lookupIdByName(
  lookups: Array<{ id: number; name: string }>,
  name: string,
): number | null {
  const lower = name.trim().toLowerCase()
  return lookups.find((l) => l.name.toLowerCase() === lower)?.id ?? null
}

export interface CandidateCreateLookups {
  techStacks?: Array<{ id: number; name: string }>
  timeSupportZones?: Array<{ id: number; name: string }>
  benefits?: Array<{ id: number; name: string }>
  degrees?: Array<{ id: number; name: string }>
  majors?: Array<{ id: number; name: string }>
}

export function candidateFormDataToCreateDto(
  data: CandidateFormData,
  lookups?: CandidateCreateLookups,
): CreateCandidateDto {
  const techStackIds = (data.techStacks ?? [])
    .map((name) => lookupIdByName(lookups?.techStacks ?? [], name))
    .filter((id): id is number => id != null)

  const projects: CreateCandidateProjectDto[] = (data.projects ?? [])
    .filter((p) => p.projectId != null)
    .map((p) => ({
      projectId: p.projectId!,
      contribution: nullIfEmpty(p.contributionNotes ?? ""),
    }))

  const educations: CreateCandidateEducationDto[] = (data.educations ?? [])
    .filter((e) => e.universityLocationId)
    .map((e) => ({
      universityId: Number(e.universityLocationId),
      degreeId: e.degreeName ? lookupIdByName(lookups?.degrees ?? [], e.degreeName) : null,
      majorId: e.majorName ? lookupIdByName(lookups?.majors ?? [], e.majorName) : null,
      startMonth: formatDateForApi(e.startMonth),
      endMonth: formatDateForApi(e.endMonth),
      grades: e.grades ?? null,
      isTopper: e.isTopper ?? false,
      isMainCheetah: e.isCheetah ?? false,
    }))

  const certifications: CreateCandidateCertificationDto[] = (data.certifications ?? [])
    .filter((c) => c.certificationId != null)
    .map((c) => ({
      certificationId: c.certificationId!,
      issueDate: formatDateForApi(c.issueDate),
      expiryDate: formatDateForApi(c.expiryDate),
      url: c.certificationUrl ?? null,
      level: c.certificationLevel
        ? enumIndex(CERTIFICATION_LEVEL_DB, c.certificationLevel)
        : null,
    }))

  const achievements: CreateCandidateAchievementDto[] = (data.achievements ?? [])
    .filter((a) => a.name.trim())
    .map((a) => ({
      name: a.name.trim(),
      type: enumIndex(ACHIEVEMENT_TYPE_DB, a.achievementType) ?? 7,
      ranking: a.ranking ?? null,
      year: a.year ?? null,
      url: a.url ?? null,
      description: a.description ?? null,
    }))

  const workExperiences: CreateCandidateWorkExperienceDto[] = (data.workExperiences ?? [])
    .filter((we) => we.employerId != null)
    .map((we) => {
      const weProjects: CreateCandidateProjectDto[] = (we.projects ?? [])
        .filter((p) => p.projectId != null)
        .map((p) => ({
          projectId: p.projectId!,
          contribution: nullIfEmpty(p.contributionNotes ?? ""),
        }))

      const weTechStackIds = (we.techStacks ?? [])
        .map((name) => lookupIdByName(lookups?.techStacks ?? [], name))
        .filter((id): id is number => id != null)

      const weTszIds = (we.timeSupportZones ?? [])
        .map((name) => lookupIdByName(lookups?.timeSupportZones ?? [], name))
        .filter((id): id is number => id != null)

      const weBenefits: CreateCandidateWorkExperienceBenefitDto[] = (we.benefits ?? [])
        .reduce<CreateCandidateWorkExperienceBenefitDto[]>((acc, b) => {
          const benefitId = lookupIdByName(lookups?.benefits ?? [], b.name)
          if (benefitId != null) {
            const { hasValue, unitType, value } = employerBenefitToApiValueFields(b)
            acc.push({
              benefitId,
              hasValue,
              unitType,
              value,
            })
          }
          return acc
        }, [])

      return {
        employerId: we.employerId!,
        jobTitle: we.jobTitle.trim(),
        startDate: formatDateForApi(we.startDate),
        endDate: formatDateForApi(we.endDate),
        shiftType: we.shiftType ? enumIndex(SHIFT_TYPE_DB, we.shiftType) : null,
        workMode: we.workMode ? enumIndex(WORK_MODE_DB, we.workMode) : null,
        timeSupportZoneIds: weTszIds.length > 0 ? weTszIds : undefined,
        techStackIds: weTechStackIds.length > 0 ? weTechStackIds : undefined,
        benefits: weBenefits.length > 0 ? weBenefits : undefined,
        projects: weProjects.length > 0 ? weProjects : undefined,
      }
    })

  return {
    name: data.name.trim(),
    email: nullIfEmpty(data.email),
    phoneNumber: nullIfEmpty(data.contactNumber),
    postingTitle: nullIfEmpty(data.postingTitle),
    cnic: nullIfEmpty(data.cnic),
    linkedInUrl: nullIfEmpty(data.linkedinUrl),
    githubUrl: nullIfEmpty(data.githubUrl),
    city: nullIfEmpty(data.city),
    totalExperienceYears: null,
    currentSalary: parseOptionalSalary(data.currentSalary),
    expectedSalary: parseOptionalSalary(data.expectedSalary),
    personalityType: mbtiLabelToIndex(data.personalityType),
    source: sourceFormToApi(data.source),
    status: "sourced",
    resumeUrl: null,
    isTopDeveloper: data.isTopDeveloper === true,
    techStackIds: techStackIds.length > 0 ? techStackIds : undefined,
    projects: projects.length > 0 ? projects : undefined,
    educations: educations.length > 0 ? educations : undefined,
    certifications: certifications.length > 0 ? certifications : undefined,
    achievements: achievements.length > 0 ? achievements : undefined,
    workExperiences: workExperiences.length > 0 ? workExperiences : undefined,
  }
}

export function candidateFormDataToUpdateDto(
  data: CandidateFormData,
  existing: Pick<Candidate, "status" | "resume" | "totalExperienceYears">
): UpdateCandidateDto {
  const base = candidateFormDataToCreateDto(data)
  return {
    name: base.name,
    email: base.email ?? null,
    phoneNumber: base.phoneNumber ?? null,
    postingTitle: base.postingTitle ?? null,
    cnic: base.cnic ?? null,
    linkedInUrl: base.linkedInUrl ?? null,
    githubUrl: base.githubUrl ?? null,
    city: base.city ?? null,
    totalExperienceYears: existing.totalExperienceYears ?? null,
    currentSalary: base.currentSalary ?? null,
    expectedSalary: base.expectedSalary ?? null,
    personalityType: base.personalityType ?? null,
    source: base.source ?? null,
    status: existing.status,
    resumeUrl: existing.resume ?? null,
    isTopDeveloper: base.isTopDeveloper ?? false,
  }
}

export async function fetchCandidatesPage(
  pageNumber = 1,
  pageSize = 20,
  signal?: AbortSignal,
  options?: { certificationId?: number; universityId?: number }
): Promise<PagedResult<CandidateListItemDto>> {
  const params = new URLSearchParams()
  params.set("pageNumber", String(Math.max(1, pageNumber)))
  params.set("pageSize", String(Math.min(100, Math.max(1, pageSize))))
  if (
    options?.certificationId != null &&
    Number.isFinite(options.certificationId) &&
    options.certificationId > 0
  ) {
    params.set("certificationId", String(Math.floor(options.certificationId)))
  }
  if (
    options?.universityId != null &&
    Number.isFinite(options.universityId) &&
    options.universityId > 0
  ) {
    params.set("universityId", String(Math.floor(options.universityId)))
  }
  const path = `/api/candidates?${params.toString()}`
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Candidates list ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

export async function fetchCandidateById(id: number, signal?: AbortSignal): Promise<Candidate> {
  const path = `/api/candidates/${id}`
  const res = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Candidate ${path}: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as Record<string, unknown>
  return mapCandidateDtoToCandidate(data)
}

export async function createCandidate(body: CreateCandidateDto): Promise<Candidate> {
  const path = `/api/candidates`
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    if (text.includes("IX_candidates_cnic")) {
      throw new Error("A candidate with this CNIC already exists.")
    }
    if (text.includes("IX_candidates_email")) {
      throw new Error("A candidate with this email already exists.")
    }
    throw new Error(`Create candidate: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as Record<string, unknown>
  return mapCandidateDtoToCandidate(data)
}

export async function updateCandidate(id: number, body: UpdateCandidateDto): Promise<Candidate> {
  const path = `/api/candidates/${id}`
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Update candidate: ${res.status} — ${text}`)
  }
  const data = (await res.json()) as Record<string, unknown>
  return mapCandidateDtoToCandidate(data)
}

export async function deleteCandidate(id: number): Promise<void> {
  const path = `/api/candidates/${id}`
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" })
  if (res.status === 404) {
    throw new Error("Candidate not found or already deleted.")
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Delete candidate: ${res.status} — ${text}`)
  }
}

// ---------------------------------------------------------------------------
// Sub-resource API client functions (for granular edits after creation)
// ---------------------------------------------------------------------------

async function subPost(path: string, body?: object): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`POST ${path}: ${res.status} — ${text}`)
  }
  const ct = res.headers.get("content-type") ?? ""
  return ct.includes("application/json") ? res.json() : null
}

async function subPut(path: string, body: object): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PUT ${path}: ${res.status} — ${text}`)
  }
  const ct = res.headers.get("content-type") ?? ""
  return ct.includes("application/json") ? res.json() : null
}

async function subDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" })
  if (!res.ok && res.status !== 404) {
    const text = await res.text()
    throw new Error(`DELETE ${path}: ${res.status} — ${text}`)
  }
}

// --- Tech Stacks ---

export function addCandidateTechStack(candidateId: number, techStackId: number) {
  return subPost(`/api/candidates/${candidateId}/tech-stacks`, { techStackId })
}
export function removeCandidateTechStack(candidateId: number, techStackId: number) {
  return subDelete(`/api/candidates/${candidateId}/tech-stacks/${techStackId}`)
}

// --- Standalone Projects ---

export function upsertCandidateProject(candidateId: number, projectId: number, contribution: string | null) {
  return subPut(`/api/candidates/${candidateId}/projects/${projectId}`, { projectId, contribution })
}
export function removeCandidateProject(candidateId: number, projectId: number) {
  return subDelete(`/api/candidates/${candidateId}/projects/${projectId}`)
}

// --- Educations ---

export function createCandidateEducation(candidateId: number, body: CreateCandidateEducationDto) {
  return subPost(`/api/candidates/${candidateId}/educations`, body) as Promise<Record<string, unknown>>
}
export function updateCandidateEducation(candidateId: number, educationId: number, body: CreateCandidateEducationDto) {
  return subPut(`/api/candidates/${candidateId}/educations/${educationId}`, body)
}
export function deleteCandidateEducation(candidateId: number, educationId: number) {
  return subDelete(`/api/candidates/${candidateId}/educations/${educationId}`)
}

// --- Certifications ---

export function upsertCandidateCertification(candidateId: number, body: CreateCandidateCertificationDto) {
  return subPut(`/api/candidates/${candidateId}/certifications`, body)
}
export function removeCandidateCertification(candidateId: number, certificationId: number) {
  return subDelete(`/api/candidates/${candidateId}/certifications/${certificationId}`)
}

// --- Achievements ---

export function createCandidateAchievement(candidateId: number, body: CreateCandidateAchievementDto) {
  return subPost(`/api/candidates/${candidateId}/achievements`, body) as Promise<Record<string, unknown>>
}
export function updateCandidateAchievement(candidateId: number, achievementId: number, body: CreateCandidateAchievementDto) {
  return subPut(`/api/candidates/${candidateId}/achievements/${achievementId}`, body)
}
export function deleteCandidateAchievement(candidateId: number, achievementId: number) {
  return subDelete(`/api/candidates/${candidateId}/achievements/${achievementId}`)
}

// --- Work Experiences ---

interface CreateWorkExperienceBody {
  employerId: number
  jobTitle: string
  startDate?: string | null
  endDate?: string | null
  shiftType?: number | null
  workMode?: number | null
}

export function createCandidateWorkExperience(candidateId: number, body: CreateWorkExperienceBody) {
  return subPost(`/api/candidates/${candidateId}/work-experiences`, body) as Promise<Record<string, unknown>>
}
export function updateCandidateWorkExperience(candidateId: number, weId: number, body: CreateWorkExperienceBody) {
  return subPut(`/api/candidates/${candidateId}/work-experiences/${weId}`, body)
}
export function deleteCandidateWorkExperience(candidateId: number, weId: number) {
  return subDelete(`/api/candidates/${candidateId}/work-experiences/${weId}`)
}

// --- Work Experience Sub-resources ---

export function addWeTechStack(candidateId: number, weId: number, techStackId: number) {
  return subPost(`/api/candidates/${candidateId}/work-experiences/${weId}/tech-stacks`, { techStackId })
}
export function removeWeTechStack(candidateId: number, weId: number, techStackId: number) {
  return subDelete(`/api/candidates/${candidateId}/work-experiences/${weId}/tech-stacks/${techStackId}`)
}
export function addWeTimeSupportZone(candidateId: number, weId: number, timeSupportZoneId: number) {
  return subPost(`/api/candidates/${candidateId}/work-experiences/${weId}/time-support-zones`, { timeSupportZoneId })
}
export function removeWeTimeSupportZone(candidateId: number, weId: number, tszId: number) {
  return subDelete(`/api/candidates/${candidateId}/work-experiences/${weId}/time-support-zones/${tszId}`)
}
export function upsertWeBenefit(candidateId: number, weId: number, body: CreateCandidateWorkExperienceBenefitDto) {
  return subPut(`/api/candidates/${candidateId}/work-experiences/${weId}/benefits/${body.benefitId}`, body)
}
export function removeWeBenefit(candidateId: number, weId: number, benefitId: number) {
  return subDelete(`/api/candidates/${candidateId}/work-experiences/${weId}/benefits/${benefitId}`)
}
export function upsertWeProject(candidateId: number, weId: number, projectId: number, contribution: string | null) {
  return subPut(`/api/candidates/${candidateId}/work-experiences/${weId}/projects/${projectId}`, { projectId, contribution })
}
export function removeWeProject(candidateId: number, weId: number, projectId: number) {
  return subDelete(`/api/candidates/${candidateId}/work-experiences/${weId}/projects/${projectId}`)
}

// ---------------------------------------------------------------------------
// syncCandidateSubResources — diff old vs new, call sub-resource APIs
// ---------------------------------------------------------------------------

export async function syncCandidateSubResources(
  candidateId: number,
  formData: CandidateFormData,
  existing: Candidate,
  lookups?: CandidateCreateLookups,
): Promise<void> {
  const errors: string[] = []

  function safe(label: string, fn: () => Promise<unknown>): Promise<void> {
    return fn().then(() => {}, (err) => {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`)
    })
  }

  // --- Tech Stacks ---
  const oldTsIds = new Set<number>()
  const tsLookup = lookups?.techStacks ?? []
  for (const name of existing.techStacks ?? []) {
    const id = lookupIdByName(tsLookup, name)
    if (id != null) oldTsIds.add(id)
  }
  const newTsIds = new Set<number>()
  for (const name of formData.techStacks ?? []) {
    const id = lookupIdByName(tsLookup, name)
    if (id != null) newTsIds.add(id)
  }
  const tsOps: Promise<void>[] = []
  for (const id of newTsIds) {
    if (!oldTsIds.has(id)) tsOps.push(safe("Add tech stack", () => addCandidateTechStack(candidateId, id)))
  }
  for (const id of oldTsIds) {
    if (!newTsIds.has(id)) tsOps.push(safe("Remove tech stack", () => removeCandidateTechStack(candidateId, id)))
  }

  // --- Standalone Projects ---
  const oldProjIds = new Set((existing.projects ?? []).map(p => p.projectId).filter((id): id is number => id != null))
  const projOps: Promise<void>[] = []
  for (const p of formData.projects ?? []) {
    if (p.projectId != null) {
      projOps.push(safe("Upsert project", () => upsertCandidateProject(candidateId, p.projectId!, nullIfEmpty(p.contributionNotes ?? ""))))
      oldProjIds.delete(p.projectId)
    }
  }
  for (const id of oldProjIds) {
    projOps.push(safe("Remove project", () => removeCandidateProject(candidateId, id)))
  }

  // --- Educations ---
  const oldEduMap = new Map((existing.educations ?? []).map(e => [Number(e.id), e]))
  const seenEduIds = new Set<number>()
  const eduOps: Promise<void>[] = []
  for (const edu of formData.educations ?? []) {
    if (!edu.universityLocationId && !edu.degreeName && !edu.majorName) continue
    const eduBody: CreateCandidateEducationDto = {
      universityId: edu.universityLocationId ? Number(edu.universityLocationId) : 0,
      degreeId: edu.degreeName ? lookupIdByName(lookups?.degrees ?? [], edu.degreeName) : null,
      majorId: edu.majorName ? lookupIdByName(lookups?.majors ?? [], edu.majorName) : null,
      startMonth: formatDateForApi(edu.startMonth),
      endMonth: formatDateForApi(edu.endMonth),
      grades: edu.grades ?? null,
      isTopper: edu.isTopper ?? false,
      isMainCheetah: edu.isCheetah ?? false,
    }
    const numId = Number(edu.id)
    if (oldEduMap.has(numId)) {
      seenEduIds.add(numId)
      eduOps.push(safe("Update education", () => updateCandidateEducation(candidateId, numId, eduBody)))
    } else {
      eduOps.push(safe("Create education", () => createCandidateEducation(candidateId, eduBody)))
    }
  }
  for (const id of oldEduMap.keys()) {
    if (!seenEduIds.has(id)) eduOps.push(safe("Delete education", () => deleteCandidateEducation(candidateId, id)))
  }

  // --- Certifications ---
  const oldCertIds = new Set((existing.certifications ?? []).map(c => c.certificationId).filter((id): id is number => id != null))
  const certOps: Promise<void>[] = []
  for (const cert of formData.certifications ?? []) {
    if (cert.certificationId == null) continue
    const certBody: CreateCandidateCertificationDto = {
      certificationId: cert.certificationId,
      issueDate: formatDateForApi(cert.issueDate),
      expiryDate: formatDateForApi(cert.expiryDate),
      url: cert.certificationUrl ?? null,
      level: cert.certificationLevel ? enumIndex(CERTIFICATION_LEVEL_DB, cert.certificationLevel) : null,
    }
    certOps.push(safe("Upsert certification", () => upsertCandidateCertification(candidateId, certBody)))
    oldCertIds.delete(cert.certificationId)
  }
  for (const id of oldCertIds) {
    certOps.push(safe("Remove certification", () => removeCandidateCertification(candidateId, id)))
  }

  // --- Achievements ---
  const oldAchMap = new Map((existing.achievements ?? []).map(a => [Number(a.id), a]))
  const seenAchIds = new Set<number>()
  const achOps: Promise<void>[] = []
  for (const ach of formData.achievements ?? []) {
    if (!ach.name.trim()) continue
    const achBody: CreateCandidateAchievementDto = {
      name: ach.name.trim(),
      type: enumIndex(ACHIEVEMENT_TYPE_DB, ach.achievementType) ?? 7,
      ranking: ach.ranking || null,
      year: ach.year ?? null,
      url: ach.url || null,
      description: ach.description || null,
    }
    const numId = Number(ach.id)
    if (oldAchMap.has(numId)) {
      seenAchIds.add(numId)
      achOps.push(safe("Update achievement", () => updateCandidateAchievement(candidateId, numId, achBody)))
    } else {
      achOps.push(safe("Create achievement", () => createCandidateAchievement(candidateId, achBody)))
    }
  }
  for (const id of oldAchMap.keys()) {
    if (!seenAchIds.has(id)) achOps.push(safe("Delete achievement", () => deleteCandidateAchievement(candidateId, id)))
  }

  // --- Work Experiences ---
  const oldWeMap = new Map((existing.workExperiences ?? []).map(w => [Number(w.id), w]))
  const seenWeIds = new Set<number>()
  const weOps: Promise<void>[] = []

  for (const we of formData.workExperiences ?? []) {
    if (we.employerId == null) continue
    const weBasic: CreateWorkExperienceBody = {
      employerId: we.employerId,
      jobTitle: we.jobTitle.trim(),
      startDate: formatDateForApi(we.startDate),
      endDate: formatDateForApi(we.endDate),
      shiftType: we.shiftType ? enumIndex(SHIFT_TYPE_DB, we.shiftType) : null,
      workMode: we.workMode ? enumIndex(WORK_MODE_DB, we.workMode) : null,
    }

    const numId = Number(we.id)
    if (oldWeMap.has(numId)) {
      // Update existing work experience basic fields, then sync sub-resources
      seenWeIds.add(numId)
      weOps.push(safe("Update work experience", async () => {
        await updateCandidateWorkExperience(candidateId, numId, weBasic)
        await syncWeSubResources(candidateId, numId, we, oldWeMap.get(numId)!, lookups)
      }))
    } else {
      // Create new work experience, then add sub-resources using the returned ID
      weOps.push(safe("Create work experience", async () => {
        const result = await createCandidateWorkExperience(candidateId, weBasic) as Record<string, unknown>
        const newId = typeof result.id === "number" ? result.id : Number(result.id)
        if (!Number.isFinite(newId)) return
        await addWeSubResources(candidateId, newId, we, lookups)
      }))
    }
  }
  for (const id of oldWeMap.keys()) {
    if (!seenWeIds.has(id)) weOps.push(safe("Delete work experience", () => deleteCandidateWorkExperience(candidateId, id)))
  }

  // Execute all sections in parallel
  await Promise.all([...tsOps, ...projOps, ...eduOps, ...certOps, ...achOps, ...weOps])

  if (errors.length > 0) {
    throw new Error(`Some updates failed:\n${errors.join("\n")}`)
  }
}

/** Add all sub-resources for a newly created work experience. */
async function addWeSubResources(
  candidateId: number,
  weId: number,
  we: CandidateFormData["workExperiences"][number],
  lookups?: CandidateCreateLookups,
): Promise<void> {
  const tsLookup = lookups?.techStacks ?? []
  const tszLookup = lookups?.timeSupportZones ?? []
  const benefitsLookup = lookups?.benefits ?? []

  const ops: Promise<unknown>[] = []

  for (const name of we.techStacks ?? []) {
    const id = lookupIdByName(tsLookup, name)
    if (id != null) ops.push(addWeTechStack(candidateId, weId, id))
  }
  for (const name of we.timeSupportZones ?? []) {
    const id = lookupIdByName(tszLookup, name)
    if (id != null) ops.push(addWeTimeSupportZone(candidateId, weId, id))
  }
  for (const b of we.benefits ?? []) {
    const benefitId = lookupIdByName(benefitsLookup, b.name)
    if (benefitId != null) {
      ops.push(
        upsertWeBenefit(candidateId, weId, {
          benefitId,
          ...employerBenefitToApiValueFields(b),
        })
      )
    }
  }
  for (const p of we.projects ?? []) {
    if (p.projectId != null) {
      ops.push(upsertWeProject(candidateId, weId, p.projectId, nullIfEmpty(p.contributionNotes ?? "")))
    }
  }

  await Promise.all(ops)
}

/** Sync sub-resources for an existing work experience (diff old vs new). */
async function syncWeSubResources(
  candidateId: number,
  weId: number,
  newWe: CandidateFormData["workExperiences"][number],
  oldWe: WorkExperience,
  lookups?: CandidateCreateLookups,
): Promise<void> {
  const tsLookup = lookups?.techStacks ?? []
  const tszLookup = lookups?.timeSupportZones ?? []
  const benefitsLookup = lookups?.benefits ?? []
  const ops: Promise<unknown>[] = []

  // Tech stacks
  const oldWeTsIds = new Set<number>()
  for (const name of oldWe.techStacks ?? []) {
    const id = lookupIdByName(tsLookup, name)
    if (id != null) oldWeTsIds.add(id)
  }
  const newWeTsIds = new Set<number>()
  for (const name of newWe.techStacks ?? []) {
    const id = lookupIdByName(tsLookup, name)
    if (id != null) newWeTsIds.add(id)
  }
  for (const id of newWeTsIds) {
    if (!oldWeTsIds.has(id)) ops.push(addWeTechStack(candidateId, weId, id))
  }
  for (const id of oldWeTsIds) {
    if (!newWeTsIds.has(id)) ops.push(removeWeTechStack(candidateId, weId, id))
  }

  // Time support zones
  const oldTszIds = new Set<number>()
  for (const name of oldWe.timeSupportZones ?? []) {
    const id = lookupIdByName(tszLookup, name)
    if (id != null) oldTszIds.add(id)
  }
  const newTszIds = new Set<number>()
  for (const name of newWe.timeSupportZones ?? []) {
    const id = lookupIdByName(tszLookup, name)
    if (id != null) newTszIds.add(id)
  }
  for (const id of newTszIds) {
    if (!oldTszIds.has(id)) ops.push(addWeTimeSupportZone(candidateId, weId, id))
  }
  for (const id of oldTszIds) {
    if (!newTszIds.has(id)) ops.push(removeWeTimeSupportZone(candidateId, weId, id))
  }

  // Benefits
  const oldBenefitIds = new Set<number>()
  for (const b of oldWe.benefits ?? []) {
    const id = lookupIdByName(benefitsLookup, b.name)
    if (id != null) oldBenefitIds.add(id)
  }
  const newBenefitIds = new Set<number>()
  for (const b of newWe.benefits ?? []) {
    const benefitId = lookupIdByName(benefitsLookup, b.name)
    if (benefitId != null) {
      newBenefitIds.add(benefitId)
      ops.push(
        upsertWeBenefit(candidateId, weId, {
          benefitId,
          ...employerBenefitToApiValueFields(b),
        })
      )
    }
  }
  for (const id of oldBenefitIds) {
    if (!newBenefitIds.has(id)) ops.push(removeWeBenefit(candidateId, weId, id))
  }

  // Projects
  const oldProjIds = new Set((oldWe.projects ?? []).map(p => p.projectId).filter((id): id is number => id != null))
  for (const p of newWe.projects ?? []) {
    if (p.projectId != null) {
      ops.push(upsertWeProject(candidateId, weId, p.projectId, nullIfEmpty(p.contributionNotes ?? "")))
      oldProjIds.delete(p.projectId)
    }
  }
  for (const id of oldProjIds) {
    ops.push(removeWeProject(candidateId, weId, id))
  }

  await Promise.all(ops)
}
