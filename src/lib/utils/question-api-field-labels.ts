import type { EmptyField, FieldSection } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import {
  PROJECT_CATALOG_FIELD_LABELS,
  PROJECT_CATALOG_FIELD_SUFFIXES,
  PROJECT_LINK_FIELD_SUFFIXES,
} from "@/lib/utils/project-catalog-fields"
import { formatCertificationFieldLabel } from "@/lib/utils/certification-questions"
import { formatEducationFieldLabel } from "@/lib/utils/education-questions"
import { formatWorkExperienceFieldLabel } from "@/lib/utils/work-experience-questions"

const BASIC_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  postingTitle: "Posting title",
  email: "Email",
  mobileNo: "Mobile",
  cnic: "CNIC",
  city: "City",
  githubUrl: "GitHub URL",
  linkedinUrl: "LinkedIn URL",
  resume: "Resume",
  currentSalary: "Current salary",
  expectedSalary: "Expected salary",
  source: "Source",
  personalityType: "Personality type",
}

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
  { pattern: /^work_experience_\d+_foundedYear$/, label: "Founded year", section: "workExperience" },
  { pattern: /^work_experience_\d+_status$/, label: "Status", section: "workExperience" },
  { pattern: /^work_experience_\d+_types$/, label: "Employer types", section: "workExperience" },
  { pattern: /^work_experience_\d+_ranking$/, label: "Ranking", section: "workExperience" },
  { pattern: /^work_experience_\d+_minEmployees$/, label: "Min employees", section: "workExperience" },
  { pattern: /^work_experience_\d+_maxEmployees$/, label: "Max employees", section: "workExperience" },
  { pattern: /^work_experience_\d+_websiteUrl$/, label: "Website URL", section: "workExperience" },
  { pattern: /^work_experience_\d+_linkedInUrl$/, label: "LinkedIn URL", section: "workExperience" },
  { pattern: /^work_experience_\d+_isDplCompetitor$/, label: "DPL competitor", section: "workExperience" },
  { pattern: /^work_experience_\d+_salaryPolicy$/, label: "Salary policy", section: "workExperience" },
  { pattern: /^work_experience_\d+_office_\d+_country$/, label: "Country", section: "workExperience" },
  { pattern: /^work_experience_\d+_office_\d+_city$/, label: "City", section: "workExperience" },
  { pattern: /^work_experience_\d+_office_\d+_address$/, label: "Address", section: "workExperience" },
  { pattern: /^work_experience_\d+_office_\d+_isHeadquarters$/, label: "Headquarters", section: "workExperience" },
  { pattern: /^work_experience_\d+_layoff_\d+_layoffDate$/, label: "Layoff date", section: "workExperience" },
  { pattern: /^work_experience_\d+_layoff_\d+_affectedEmployees$/, label: "Affected employees", section: "workExperience" },
  { pattern: /^work_experience_\d+_layoff_\d+_reason$/, label: "Reason", section: "workExperience" },
  { pattern: /^work_experience_\d+_project_\d+_projectName$/, label: "Name", section: "workExperience" },
  { pattern: /^work_experience_\d+_project_\d+_contributionNotes$/, label: "Contribution", section: "workExperience" },
  { pattern: /^certification_\d+_name$/, label: "Name", section: "certifications" },
  { pattern: /^certification_\d+_issueDate$/, label: "Issue date", section: "certifications" },
  { pattern: /^certification_\d+_expiryDate$/, label: "Expiry date", section: "certifications" },
  { pattern: /^certification_\d+_url$/, label: "Certification URL", section: "certifications" },
  { pattern: /^certification_\d+_level$/, label: "Level", section: "certifications" },
  { pattern: /^certification_\d+_issuingBody$/, label: "Issuer body", section: "certifications" },
  { pattern: /^certification_\d+_issuingBodyUrl$/, label: "Issuer body URL", section: "certifications" },
  ...[...PROJECT_LINK_FIELD_SUFFIXES, ...PROJECT_CATALOG_FIELD_SUFFIXES].map((suffix) => ({
    pattern: new RegExp(`^work_experience_\\d+_project_\\d+_${suffix}$`),
    label: PROJECT_CATALOG_FIELD_LABELS[suffix],
    section: "workExperience" as FieldSection,
  })),
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

  if (
    apiFieldName === "work_experiences" ||
    /^work_experience_\d+_/.test(apiFieldName)
  ) {
    return {
      label: formatWorkExperienceFieldLabel(apiFieldName),
      isSectionOpener: apiFieldName === "work_experiences",
      section: "workExperience",
    }
  }

  if (apiFieldName === "certifications" || /^certification_\d+_/.test(apiFieldName)) {
    return {
      label: formatCertificationFieldLabel(apiFieldName),
      isSectionOpener: apiFieldName === "certifications",
      section: "certifications",
    }
  }

  if (apiFieldName === "educations" || /^education_\d+_/.test(apiFieldName)) {
    return {
      label: formatEducationFieldLabel(apiFieldName),
      isSectionOpener: apiFieldName === "educations",
      section: "education",
    }
  }

  const fromIndexed = labelFromIndexedApiField(apiFieldName)
  if (fromIndexed) return fromIndexed

  const basicLabel = BASIC_FIELD_LABELS[apiFieldName]
  if (basicLabel) {
    return {
      label: basicLabel,
      isSectionOpener: false,
      section: apiFieldName === "currentSalary" || apiFieldName === "expectedSalary"
        ? "preferences"
        : "basic",
    }
  }

  const staticOpener = SECTION_OPENER_API_FIELDS[apiFieldName]
  if (staticOpener) {
    return {
      label: staticOpener.label,
      isSectionOpener: true,
      section: staticOpener.section,
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
