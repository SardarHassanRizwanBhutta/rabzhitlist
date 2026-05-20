export interface CandidateDataProgressSection {
  sectionKey: string
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface CandidateDataProgressResponse {
  candidateId: number
  overallPercentage: number
  sections: CandidateDataProgressSection[]
}
