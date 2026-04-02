/**
 * DB enum values and display labels for candidate-related dropdowns.
 * Values match backend enums: shift_type_enum, work_mode_enum, mbti_type,
 * certification_level_enum, achievement_type_enum.
 */

export const SHIFT_TYPE_DB = [
  "day",
  "night",
  "evening",
  "rotational",
  "flexible",
  "on_call",
] as const
export type ShiftTypeDb = (typeof SHIFT_TYPE_DB)[number]

export const SHIFT_TYPE_LABELS: Record<ShiftTypeDb, string> = {
  day: "Day",
  night: "Night",
  evening: "Evening",
  rotational: "Rotational",
  flexible: "Flexible",
  on_call: "On Call",
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

export const ACHIEVEMENT_TYPE_DB = [
  "competition",
  "open_source",
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
  open_source: "Open Source",
  award: "Award",
  medal: "Medal",
  publication: "Publication",
  certification: "Certification",
  recognition: "Recognition",
  other: "Other",
}

/** PostgreSQL enum `source` on candidates — exact lowercase values for API. */
export const CANDIDATE_SOURCE_DB = ["headhunt", "referral", "zoho", "manual"] as const
export type CandidateSourceDb = (typeof CANDIDATE_SOURCE_DB)[number]

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSourceDb, string> = {
  headhunt: "Headhunt",
  referral: "Referral",
  zoho: "Zoho",
  manual: "Manual",
}

/** Map API/legacy free text to a valid form value; empty string if unknown. */
export function parseCandidateSource(raw: string | null | undefined): CandidateSourceDb | "" {
  const s = (raw ?? "").trim().toLowerCase()
  return CANDIDATE_SOURCE_DB.includes(s as CandidateSourceDb) ? (s as CandidateSourceDb) : ""
}
