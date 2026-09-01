/**
 * DB enum values and display labels for candidate-related dropdowns.
 * Values match backend enums: shift_type_enum, work_mode_enum, mbti_type,
 * certification_level_enum, achievement_type_enum.
 */

/** Backend enum ShiftType: 0=day, 1=night, 2=evening, 3=rotational, 4=flexible, 5=onCall */
export const SHIFT_TYPE_DB = [
  "day",
  "night",
  "evening",
  "rotational",
  "flexible",
  "onCall",
] as const
export type ShiftTypeDb = (typeof SHIFT_TYPE_DB)[number]

export const SHIFT_TYPE_LABELS: Record<ShiftTypeDb, string> = {
  day: "Day",
  night: "Night",
  evening: "Evening",
  rotational: "Rotational",
  flexible: "Flexible",
  onCall: "On Call",
}

export const WORK_MODE_DB = ["onsite", "remote", "hybrid"] as const
export type WorkModeDb = (typeof WORK_MODE_DB)[number]

export const WORK_MODE_LABELS: Record<WorkModeDb, string> = {
  onsite: "Onsite",
  remote: "Remote",
  hybrid: "Hybrid",
}

/** DB enum mbti_type */
export const MBTI_TYPES = [
  "ESTJ", "ENTJ", "ESFJ", "ENFJ",
  "ISTJ", "ISFJ", "INTJ", "INFJ",
  "ESTP", "ESFP", "ENTP", "ENFP",
  "ISTP", "ISFP", "INTP", "INFP",
] as const
export type MbtiType = (typeof MBTI_TYPES)[number]

export const CERTIFICATION_LEVEL_DB = [
  "foundation",
  "associate",
  "professional",
  "expert",
  "master",
] as const
export type CertificationLevelDb = (typeof CERTIFICATION_LEVEL_DB)[number]

export const CERTIFICATION_LEVEL_LABELS_DB: Record<CertificationLevelDb, string> = {
  foundation: "Foundation",
  associate: "Associate",
  professional: "Professional",
  expert: "Expert",
  master: "Master",
}

/** Backend enum AchievementType: 0=competition, 1=openSource, 2=award, 3=medal, 4=publication, 5=certification, 6=recognition, 7=other */
export const ACHIEVEMENT_TYPE_DB = [
  "competition",
  "openSource",
  "award",
  "medal",
  "publication",
  "certification",
  "recognition",
  "other",
] as const
export type AchievementTypeDb = (typeof ACHIEVEMENT_TYPE_DB)[number]

export const ACHIEVEMENT_TYPE_LABELS: Record<AchievementTypeDb, string> = {
  competition: "Competition",
  openSource: "Open Source",
  award: "Award",
  medal: "Medal",
  publication: "Publication",
  certification: "Certification",
  recognition: "Recognition",
  other: "Other",
}

/** Backend enum CandidateSource: 0=headhunt, 1=zoho, 2=manual, 3=referral */
export const CANDIDATE_SOURCE_DB = ["headhunt", "zoho", "manual", "referral"] as const
export type CandidateSourceDb = (typeof CANDIDATE_SOURCE_DB)[number]

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSourceDb, string> = {
  headhunt: "Headhunt",
  referral: "Referral",
  zoho: "Zoho",
  manual: "Manual",
}

/** Map API value (numeric index or string) to a valid form value; empty string if unknown. */
export function parseCandidateSource(raw: string | number | null | undefined): CandidateSourceDb | "" {
  if (raw == null) return ""
  if (typeof raw === "number") {
    return CANDIDATE_SOURCE_DB[raw] ?? ""
  }
  const s = raw.trim().toLowerCase()
  return CANDIDATE_SOURCE_DB.includes(s as CandidateSourceDb) ? (s as CandidateSourceDb) : ""
}

/**
 * Candidate call status (`callStatus` on GET/POST/PUT /api/candidates).
 * API ints: 0=Pending, 1=Done, 2=Follow-up. Distinct from pipeline `status`.
 */
export const CALL_STATUS_DB = ["pending", "done", "followUp"] as const
export type CallStatusDb = (typeof CALL_STATUS_DB)[number]

/** Select / filter option order: Done, Pending, Follow-up. */
export const CALL_STATUS_UI_ORDER = ["done", "pending", "followUp"] as const

export const CALL_STATUS_LABELS: Record<CallStatusDb, string> = {
  pending: "Pending",
  done: "Done",
  followUp: "Follow-up",
}

export const CALL_STATUS_BADGE_CLASSES: Record<CallStatusDb, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  followUp: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
}

export function parseCallStatus(raw: unknown): CallStatusDb | null {
  if (raw == null) return null
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 2) {
    return CALL_STATUS_DB[raw] ?? null
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw)
    if (Number.isInteger(n) && n >= 0 && n <= 2) return CALL_STATUS_DB[n] ?? null
  }
  return null
}

export function callStatusToApi(value: string): number | null {
  const i = CALL_STATUS_DB.indexOf(value as CallStatusDb)
  return i >= 0 ? i : null
}
