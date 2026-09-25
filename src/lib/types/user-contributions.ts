import type { UserRole } from "@/lib/types/user-role"

export type UserContributionCounts = {
  candidates: number
  employers: number
  projects: number
  universities: number
  certifications: number
}

export type UserContributions = {
  id: number
  fullName: string
  email: string
  role: UserRole
  counts: UserContributionCounts
}

/** Display labels for v1 count keys (layout/copy owned by UX). */
export const CONTRIBUTION_COUNT_KEYS: {
  key: keyof UserContributionCounts
  label: string
}[] = [
  { key: "candidates", label: "Candidates" },
  { key: "employers", label: "Employers" },
  { key: "projects", label: "Projects" },
  { key: "universities", label: "Universities" },
  { key: "certifications", label: "Certifications" },
]
