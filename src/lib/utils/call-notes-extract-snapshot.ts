/**
 * Minimal candidate snapshot for Call Notes Extract disambiguation.
 * @see docs/CALL_NOTES_EXTRACT_API_CONTRACT.md §3.2
 */

import type { Candidate, ProjectExperience } from "@/lib/types/candidate"
import type { CallNotesExtractCandidateSnapshot } from "@/types/call-notes-extraction"

/**
 * Extract whitelist uses synthetic `projects[0]` when the WE has no project rows.
 * Snapshot must show that slot so the LLM does not skip nested project keys.
 */
function snapshotProjects(
  projects: ProjectExperience[] | undefined,
): Array<{ id: string; projectName: string | null }> {
  const rows = (projects ?? []).map((p) => ({
    id: p.id?.trim() || "0",
    projectName: p.projectName?.trim() ? p.projectName : null,
  }))
  if (rows.length > 0) return rows
  return [{ id: "0", projectName: null }]
}

export function buildCallNotesExtractCandidateSnapshot(
  candidate: Candidate,
): CallNotesExtractCandidateSnapshot {
  return {
    candidateId: candidate.id ?? null,
    linkedinUrl: candidate.linkedinUrl ?? null,
    currentSalary: candidate.currentSalary ?? null,
    expectedSalary: candidate.expectedSalary ?? null,
    techStacks: candidate.techStacks?.length ? [...candidate.techStacks] : undefined,
    hasResume: candidate.hasResume === true,
    workExperiences: (candidate.workExperiences ?? []).map((we) => ({
      id: we.id?.trim() || "0",
      employerName: we.employerName ?? null,
      jobTitle: we.jobTitle ?? null,
      projects: snapshotProjects(we.projects),
    })),
    certifications: (candidate.certifications ?? []).map((c) => ({
      id: c.id?.trim() || "0",
      certificationName: c.certificationName ?? null,
    })),
    achievements: (candidate.achievements ?? []).map((a) => ({
      id: a.id?.trim() || "0",
      name: a.name ?? null,
    })),
  }
}
