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
