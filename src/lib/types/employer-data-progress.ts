/** Employer data progress breakdown — @see docs/employer_data_progress_frontend_integration.md */

export type EmployerDataProgressSectionKey =
  | "basicInformation"
  | "workArrangementsAndTags"
  | "benefitsAndSalaryPolicy"
  | "officeLocations"
  | "layoffs"

export interface EmployerDataProgressSection {
  sectionKey: EmployerDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface EmployerDataProgressResponse {
  employerId: number
  overallPercentage: number
  sections: EmployerDataProgressSection[]
}

/** Canonical section order for future detail UI. */
export const EMPLOYER_DATA_PROGRESS_SECTION_ORDER: EmployerDataProgressSectionKey[] = [
  "basicInformation",
  "workArrangementsAndTags",
  "benefitsAndSalaryPolicy",
  "officeLocations",
  "layoffs",
]
