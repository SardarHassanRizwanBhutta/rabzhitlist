import type { EmptyField, FieldSection } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"

/** Python section-opener keys — no editable field; questions only. @see docs/CANDIDATE_DATA_MAPPING.md */
export const SECTION_OPENER_API_FIELDS: Record<
  string,
  { label: string; section: FieldSection }
> = {
  work_experiences: {
    label: `${SECTION_LABELS.workExperience} (overview)`,
    section: "workExperience",
  },
  techStacks: {
    label: `${SECTION_LABELS.techStacks} (overview)`,
    section: "techStacks",
  },
  projects: {
    label: `${SECTION_LABELS.projects} (overview)`,
    section: "projects",
  },
  educations: {
    label: `${SECTION_LABELS.education} (overview)`,
    section: "education",
  },
  certifications: {
    label: `${SECTION_LABELS.certifications} (overview)`,
    section: "certifications",
  },
  achievements: {
    label: `${SECTION_LABELS.achievements} (overview)`,
    section: "achievements",
  },
}

/** Indexed apiFieldName → UI label (any row index). Matches Python empty-section mini-questions. */
const INDEXED_API_FIELD_LABELS: Array<{ pattern: RegExp; label: string; section?: FieldSection }> = [
  { pattern: /^work_experience_\d+_jobTitle$/, label: "Job Title", section: "workExperience" },
  { pattern: /^work_experience_\d+_employerName$/, label: "Employer", section: "workExperience" },
  { pattern: /^work_experience_\d+_startDate$/, label: "Start Date", section: "workExperience" },
  { pattern: /^work_experience_\d+_endDate$/, label: "End Date", section: "workExperience" },
  { pattern: /^work_experience_\d+_techStacks$/, label: "Tech Stacks", section: "workExperience" },
  { pattern: /^work_experience_\d+_shiftType$/, label: "Shift Type", section: "workExperience" },
  { pattern: /^work_experience_\d+_workMode$/, label: "Work Mode", section: "workExperience" },
  { pattern: /^work_experience_\d+_timeSupportZones$/, label: "Time Support Zones", section: "workExperience" },
  { pattern: /^work_experience_\d+_benefits$/, label: "Benefits", section: "workExperience" },
  { pattern: /^work_experience_\d+_project_\d+_projectName$/, label: "Project Name", section: "workExperience" },
  { pattern: /^work_experience_\d+_project_\d+_contributionNotes$/, label: "Contribution", section: "workExperience" },
  { pattern: /^education_\d+_universityLocationName$/, label: "University", section: "education" },
  { pattern: /^education_\d+_degreeName$/, label: "Degree Name", section: "education" },
  { pattern: /^education_\d+_majorName$/, label: "Major Name", section: "education" },
  { pattern: /^education_\d+_startMonth$/, label: "Start Month", section: "education" },
  { pattern: /^education_\d+_endMonth$/, label: "End Month", section: "education" },
  { pattern: /^education_\d+_grades$/, label: "Grades", section: "education" },
  { pattern: /^education_\d+_isTopper$/, label: "Topper", section: "education" },
  { pattern: /^education_\d+_isCheetah$/, label: "Cheetah", section: "education" },
  { pattern: /^certification_\d+_name$/, label: "Name", section: "certifications" },
  { pattern: /^certification_\d+_issueDate$/, label: "Issue Date", section: "certifications" },
  { pattern: /^certification_\d+_expiryDate$/, label: "Expiry Date", section: "certifications" },
  { pattern: /^certification_\d+_url$/, label: "Certification URL", section: "certifications" },
  { pattern: /^certification_\d+_level$/, label: "Certification Level", section: "certifications" },
  { pattern: /^project_\d+_projectName$/, label: "Name", section: "projects" },
  { pattern: /^project_\d+_contributionNotes$/, label: "Contribution", section: "projects" },
  { pattern: /^achievement_\d+_name$/, label: "Name", section: "achievements" },
  { pattern: /^achievement_\d+_type$/, label: "Type", section: "achievements" },
  { pattern: /^achievement_\d+_ranking$/, label: "Ranking", section: "achievements" },
  { pattern: /^achievement_\d+_year$/, label: "Year", section: "achievements" },
  { pattern: /^achievement_\d+_url$/, label: "URL", section: "achievements" },
  { pattern: /^achievement_\d+_description$/, label: "Description", section: "achievements" },
]

const WORK_EXPERIENCE_PROJECTS_OPENER = /^work_experience_(\d+)_projects$/

export interface QuestionFieldMeta {
  label: string
  isSectionOpener: boolean
  section?: FieldSection
}

function labelFromIndexedApiField(apiFieldName: string): QuestionFieldMeta | null {
  for (const { pattern, label, section } of INDEXED_API_FIELD_LABELS) {
    if (pattern.test(apiFieldName)) {
      return { label, isSectionOpener: false, section }
    }
  }
  return null
}

export function isQuestionSectionOpener(apiFieldName: string): boolean {
  if (apiFieldName in SECTION_OPENER_API_FIELDS) return true
  return WORK_EXPERIENCE_PROJECTS_OPENER.test(apiFieldName)
}

export function resolveQuestionFieldMeta(
  apiFieldName: string,
  emptyFields: EmptyField[],
): QuestionFieldMeta {
  const fromEmpty = emptyFields.find((f) => f.apiFieldName === apiFieldName)
  if (fromEmpty) {
    return {
      label: fromEmpty.fieldLabel,
      isSectionOpener: false,
      section: fromEmpty.section,
    }
  }

  const fromIndexed = labelFromIndexedApiField(apiFieldName)
  if (fromIndexed) return fromIndexed

  const staticOpener = SECTION_OPENER_API_FIELDS[apiFieldName]
  if (staticOpener) {
    return {
      label: staticOpener.label,
      isSectionOpener: true,
      section: staticOpener.section,
    }
  }

  const roleProjectsMatch = apiFieldName.match(WORK_EXPERIENCE_PROJECTS_OPENER)
  if (roleProjectsMatch) {
    return {
      label: "Projects",
      isSectionOpener: true,
      section: "workExperience",
    }
  }

  return { label: apiFieldName, isSectionOpener: false }
}

export function buildQuestionFieldLabelMap(
  emptyFields: EmptyField[],
): Map<string, QuestionFieldMeta> {
  const map = new Map<string, QuestionFieldMeta>()

  emptyFields.forEach((f) => {
    map.set(f.apiFieldName, {
      label: f.fieldLabel,
      isSectionOpener: false,
      section: f.section,
    })
  })

  for (const [apiFieldName, opener] of Object.entries(SECTION_OPENER_API_FIELDS)) {
    if (!map.has(apiFieldName)) {
      map.set(apiFieldName, {
        label: opener.label,
        isSectionOpener: true,
        section: opener.section,
      })
    }
  }

  return map
}
