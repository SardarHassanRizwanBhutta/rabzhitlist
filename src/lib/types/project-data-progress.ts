/** Project data progress breakdown — @see docs/project_data_progress_frontend_integration.md §3 */

export type ProjectDataProgressSectionKey =
  | "basicInformation"
  | "projectDates"
  | "technicalAspectsAndTechStacks"
  | "domains"
  | "descriptionAndLinks"

export interface ProjectDataProgressSection {
  sectionKey: ProjectDataProgressSectionKey
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  missingFields: string[]
}

export interface ProjectDataProgressResponse {
  projectId: number
  overallPercentage: number
  sections: ProjectDataProgressSection[]
}

/** Canonical section order for future detail UI. */
export const PROJECT_DATA_PROGRESS_SECTION_ORDER: ProjectDataProgressSectionKey[] = [
  "basicInformation",
  "projectDates",
  "technicalAspectsAndTechStacks",
  "domains",
  "descriptionAndLinks",
]
