/** Certification data progress breakdown — @see docs/university_certification_data_progress_frontend_integration.md §5.2 */

export type CertificationDataProgressSectionKey = "basicInformation"

export interface CertificationDataProgressSection {
  sectionKey: CertificationDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface CertificationDataProgressResponse {
  certificationId: number
  overallPercentage: number
  sections: CertificationDataProgressSection[]
}
