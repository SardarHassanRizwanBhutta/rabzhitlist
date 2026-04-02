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
} from "@/lib/constants/candidate-enums"
import type { BenefitUnit, EmployerBenefit } from "@/lib/types/benefits"
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
  source: string | null
  status: string
  resumeUrl: string | null
  createdAt: string
  updatedAt: string
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
  source?: string | null
  status?: string
  resumeUrl?: string | null
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
  source: string | null
  status: string
  resumeUrl: string | null
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

/** Send only allowed enum values; otherwise null (form validation should prevent invalid). */
function sourceFormToApi(source: string): string | null {
  const s = source.trim().toLowerCase()
  return CANDIDATE_SOURCE_DB.includes(s as CandidateSourceDb) ? s : null
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

function mapBenefit(raw: Record<string, unknown>, idx: number): EmployerBenefit {
  const u = raw.unit
  const unit: BenefitUnit | null =
    u === "PKR" || u === "days" || u === "count" || u === "percent" ? u : null
  return {
    id: String(raw.id ?? `b-${idx}`),
    name: String(raw.name ?? ""),
    amount: typeof raw.amount === "number" ? raw.amount : raw.amount != null ? Number(raw.amount) : null,
    unit,
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
    ? techRaw.map((t) => (typeof t === "string" ? t : String((asRecord(t) ?? {}).name ?? t)))
    : []
  const domainsRaw = raw.domains
  const domains = Array.isArray(domainsRaw) ? domainsRaw.map((d) => String(d)) : []
  const tzRaw = raw.timeSupportZones ?? raw.timeSupportZoneNames
  const timeSupportZones = Array.isArray(tzRaw)
    ? tzRaw.map((z) => (typeof z === "string" ? z : String((asRecord(z) ?? {}).name ?? z)))
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
    domains,
    shiftType: (raw.shiftType as WorkExperience["shiftType"]) ?? "",
    workMode: (raw.workMode as WorkExperience["workMode"]) ?? "",
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
  "open_source",
  "award",
  "medal",
  "publication",
  "certification",
  "recognition",
  "other",
]

function normalizeAchievementType(raw: unknown): AchievementType {
  const s = String(raw ?? "competition").toLowerCase().replace(/-/g, "_")
  return (ACHIEVEMENT_TYPES.includes(s as AchievementType) ? s : "other") as AchievementType
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
    certificationLevel:
      raw.certificationLevel != null ? (String(raw.certificationLevel).toLowerCase() as CandidateCertification["certificationLevel"]) : null,
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
    isCheetah: typeof raw.isCheetah === "boolean" ? raw.isCheetah : null,
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
    source: row.source ?? "",
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
    ? techRaw.map((t) => (typeof t === "string" ? t : String((asRecord(t) ?? {}).name ?? t)))
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
    source: data.source != null ? String(data.source) : "",
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
    isTopDeveloper: typeof data.isTopDeveloper === "boolean" ? data.isTopDeveloper : null,
    achievements,
    competitions: [],
  }
}

export function candidateFormDataToCreateDto(data: CandidateFormData): CreateCandidateDto {
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
