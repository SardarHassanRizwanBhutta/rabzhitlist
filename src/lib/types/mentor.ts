/** A mentor person. Organization is an employer catalog row. */
export interface Mentor {
  id: number
  name: string
  designation: string | null
  employerId: number
  employerName: string
  linkedCandidates: MentorLinkedCandidate[]
}

/** One candidate's link to a mentor. Relationship and reasoning belong to the link. */
export interface MentorLinkedCandidate {
  candidateId: number
  candidateName: string
  relationship: string | null
  reasoning: string | null
}

/** Mentor link as returned on a candidate detail. `id` is the link id. */
export interface CandidateMentorLink {
  id: string
  mentorId: number
  name: string
  designation: string | null
  employerId: number
  employerName: string
  relationship: string | null
  reasoning: string | null
}

export interface MentorSearchHit {
  id: number
  name: string
  designation: string | null
  employerId: number
  employerName: string
}

/** One mentor row on the candidate create/edit form. */
export interface CandidateMentorFormRow {
  /** Link id from the API, or a local id before the link is saved. */
  id: string
  mentorId: number | null
  /** True when save should insert a new mentor, even if the name already exists. */
  createNew: boolean
  name: string
  designation: string
  employerId: number | null
  employerName: string
  relationship: string
  reasoning: string
}
