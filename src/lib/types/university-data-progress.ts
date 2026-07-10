/** University data progress breakdown — @see docs/university_certification_data_progress_frontend_integration.md §5.1 */

export type UniversityDataProgressSectionKey =
  | "basicInformation"
  | "campusLocations"

export interface UniversityDataProgressSection {
  sectionKey: UniversityDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface UniversityDataProgressResponse {
  universityId: number
  overallPercentage: number
  sections: UniversityDataProgressSection[]
}

/** Canonical section order for future detail UI. */
export const UNIVERSITY_DATA_PROGRESS_SECTION_ORDER: UniversityDataProgressSectionKey[] = [
  "basicInformation",
  "campusLocations",
]
