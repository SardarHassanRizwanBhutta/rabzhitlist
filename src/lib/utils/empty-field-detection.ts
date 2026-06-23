// Empty Field Detection Utility for Cold Caller Mode

import type { Candidate } from '@/lib/types/candidate'
import type { EmptyField, FieldSection, FieldType } from '@/types/cold-caller'
import { sampleProjects } from '@/lib/sample-data/projects'
import { sampleEmployers } from '@/lib/sample-data/employers'
import {
  CERTIFICATION_LEVEL_DB,
  CERTIFICATION_LEVEL_LABELS_DB,
} from '@/lib/constants/candidate-enums'
import {
  buildLinkedProjectEmptyFields,
  collectMissingLinkedProjectFields,
} from '@/lib/utils/project-catalog-fields'
import { RANKING_DISPLAY_TO_DB, type RankingDb } from '@/lib/types/employer'

// Shift type options
export const SHIFT_TYPE_OPTIONS = [
  { value: 'Morning', label: 'Morning' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Night', label: 'Night' },
  { value: 'Rotational', label: 'Rotational' },
  { value: '24x7', label: '24x7' },
]

// Work mode options
export const WORK_MODE_OPTIONS = [
  { value: 'Remote', label: 'Remote' },
  { value: 'Onsite', label: 'Onsite' },
  { value: 'Hybrid', label: 'Hybrid' },
]

// Time support zone options
export const TIME_SUPPORT_ZONE_OPTIONS = [
  { value: 'US', label: 'US' },
  { value: 'UK', label: 'UK' },
  { value: 'EU', label: 'EU' },
  { value: 'APAC', label: 'APAC' },
  { value: 'MEA', label: 'MEA' },
]

// Boolean options for Yes/No fields
export const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

const CERTIFICATION_LEVEL_OPTIONS = CERTIFICATION_LEVEL_DB.map((value) => ({
  value,
  label: CERTIFICATION_LEVEL_LABELS_DB[value],
}))

const EDUCATION_RANKING_OPTIONS = (Object.entries(RANKING_DISPLAY_TO_DB) as [RankingDb, string][]).map(
  ([value, label]) => ({ value, label }),
)

function appendEducationCatalogAndCampusEmptyFields(
  emptyFields: EmptyField[],
  index: number,
  context?: string,
): void {
  const catalogFields: Array<{
    path: string
    apiName: string
    label: string
    type: FieldType
    options?: { value: string; label: string }[]
  }> = [
    { path: 'country', apiName: `education_${index}_country`, label: 'Country', type: 'text' },
    {
      path: 'ranking',
      apiName: `education_${index}_ranking`,
      label: 'Ranking',
      type: 'select',
      options: EDUCATION_RANKING_OPTIONS,
    },
    { path: 'websiteUrl', apiName: `education_${index}_websiteUrl`, label: 'Website URL', type: 'text' },
    { path: 'linkedinUrl', apiName: `education_${index}_linkedinUrl`, label: 'LinkedIn URL', type: 'text' },
  ]

  for (const field of catalogFields) {
    emptyFields.push({
      fieldPath: `educations[${index}].${field.path}`,
      apiFieldName: field.apiName,
      fieldLabel: field.label,
      fieldType: field.type,
      section: 'education',
      context,
      currentValue: null,
      options: field.options,
      parentIndex: index,
    })
  }

  const campusFields: Array<{
    path: string
    apiSuffix: string
    label: string
    type: FieldType
    options?: { value: string; label: string }[]
  }> = [
    { path: 'locations[0].city', apiSuffix: 'city', label: 'City', type: 'text' },
    {
      path: 'locations[0].isMainCampus',
      apiSuffix: 'isMainCampus',
      label: 'Main Campus',
      type: 'boolean',
      options: BOOLEAN_OPTIONS,
    },
    { path: 'locations[0].address', apiSuffix: 'address', label: 'Office Location', type: 'text' },
  ]

  for (const field of campusFields) {
    emptyFields.push({
      fieldPath: `educations[${index}].${field.path}`,
      apiFieldName: `education_${index}_campus_0_${field.apiSuffix}`,
      fieldLabel: field.label,
      fieldType: field.type,
      section: 'education',
      context,
      currentValue: null,
      options: field.options,
      parentIndex: index,
    })
  }
}

// Helper functions to get combobox options
export function getProjectOptions(): { value: string; label: string }[] {
  return sampleProjects.map(project => ({
    label: project.projectName,
    value: project.projectName,
  }))
}

export function getEmployerOptions(): { value: string; label: string }[] {
  return sampleEmployers.map(employer => ({
    label: employer.name,
    value: employer.name,
  }))
}

export function getUniversityOptions(): { value: string; label: string }[] {
  return []
}

// TODO: Populate from API
export function getCertificationOptions(): { value: string; label: string }[] {
  return []
}

/**
 * Check if a value is considered empty/null
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/**
 * Get all empty/null fields from a candidate profile
 */
export function getEmptyFields(candidate: Candidate): EmptyField[] {
  const emptyFields: EmptyField[] = []

  // Basic Information Fields
  const basicFields: Array<{
    path: string
    apiName: string
    label: string
    type: FieldType
    options?: { value: string; label: string }[]
  }> = [
    { path: 'postingTitle', apiName: 'postingTitle', label: 'Posting Title', type: 'text' },
    { path: 'cnic', apiName: 'cnic', label: 'CNIC', type: 'text' },
    { path: 'currentSalary', apiName: 'currentSalary', label: 'Current Salary', type: 'number' },
    { path: 'expectedSalary', apiName: 'expectedSalary', label: 'Expected Salary', type: 'number' },
    { path: 'githubUrl', apiName: 'githubUrl', label: 'GitHub URL', type: 'text' },
    { path: 'linkedinUrl', apiName: 'linkedinUrl', label: 'LinkedIn URL', type: 'text' },
    { path: 'personalityType', apiName: 'personalityType', label: 'Personality Type', type: 'text' },
  ]

  basicFields.forEach(field => {
    const value = (candidate as unknown as Record<string, unknown>)[field.path]
    if (isEmpty(value)) {
      emptyFields.push({
        fieldPath: field.path,
        apiFieldName: field.apiName,
        fieldLabel: field.label,
        fieldType: field.type,
        section: 'basic',
        currentValue: value,
        options: field.options,
      })
    }
  })

  // Work Experience Fields
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    emptyFields.push({
      fieldPath: 'workExperiences[0].jobTitle',
      apiFieldName: 'work_experience_0_jobTitle',
      fieldLabel: 'Job Title',
      fieldType: 'text',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].employerName',
      apiFieldName: 'work_experience_0_employerName',
      fieldLabel: 'Employer',
      fieldType: 'combobox',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
      options: getEmployerOptions(),
      onCreateEntity: 'employer',
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].startDate',
      apiFieldName: 'work_experience_0_startDate',
      fieldLabel: 'Start Date',
      fieldType: 'date',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].endDate',
      apiFieldName: 'work_experience_0_endDate',
      fieldLabel: 'End Date',
      fieldType: 'date',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].techStacks',
      apiFieldName: 'work_experience_0_techStacks',
      fieldLabel: 'Tech Stacks',
      fieldType: 'multiselect',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].shiftType',
      apiFieldName: 'work_experience_0_shiftType',
      fieldLabel: 'Shift Type',
      fieldType: 'select',
      section: 'workExperience',
      currentValue: null,
      options: SHIFT_TYPE_OPTIONS,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].workMode',
      apiFieldName: 'work_experience_0_workMode',
      fieldLabel: 'Work Mode',
      fieldType: 'select',
      section: 'workExperience',
      currentValue: null,
      options: WORK_MODE_OPTIONS,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].timeSupportZones',
      apiFieldName: 'work_experience_0_timeSupportZones',
      fieldLabel: 'Time Support Zones',
      fieldType: 'multiselect',
      section: 'workExperience',
      currentValue: null,
      options: TIME_SUPPORT_ZONE_OPTIONS,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].benefits',
      apiFieldName: 'work_experience_0_benefits',
      fieldLabel: 'Benefits',
      fieldType: 'benefits',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push(...buildLinkedProjectEmptyFields({
      section: 'workExperience',
      fieldPathPrefix: 'workExperiences[0].projects[0]',
      apiPrefix: 'work_experience_0_project_0',
      parentIndex: 0,
    }))
  } else {
    // Existing work experiences - check for empty fields within them
    candidate.workExperiences.forEach((we, index) => {
      const context = `${we.employerName} - ${we.jobTitle}`
      
      const weFields: Array<{
        path: string
        apiName: string
        label: string
        type: FieldType
        options?: { value: string; label: string }[]
      }> = [
        { path: 'startDate', apiName: `work_experience_${index}_startDate`, label: 'Start Date', type: 'date' },
        { path: 'endDate', apiName: `work_experience_${index}_endDate`, label: 'End Date', type: 'date' },
        { path: 'shiftType', apiName: `work_experience_${index}_shiftType`, label: 'Shift Type', type: 'select', options: SHIFT_TYPE_OPTIONS },
        { path: 'workMode', apiName: `work_experience_${index}_workMode`, label: 'Work Mode', type: 'select', options: WORK_MODE_OPTIONS },
        { path: 'timeSupportZones', apiName: `work_experience_${index}_timeSupportZones`, label: 'Time Support Zones', type: 'multiselect', options: TIME_SUPPORT_ZONE_OPTIONS },
        { path: 'techStacks', apiName: `work_experience_${index}_techStacks`, label: 'Tech Stacks', type: 'multiselect' },
        { path: 'benefits', apiName: `work_experience_${index}_benefits`, label: 'Benefits', type: 'benefits' },
      ]

      weFields.forEach(field => {
        const value = (we as unknown as Record<string, unknown>)[field.path]
        if (isEmpty(value)) {
          emptyFields.push({
            fieldPath: `workExperiences[${index}].${field.path}`,
            apiFieldName: field.apiName,
            fieldLabel: field.label,
            fieldType: field.type,
            section: 'workExperience',
            context,
            currentValue: value,
            options: field.options,
            parentIndex: index,
          })
        }
      })

      if (!we.projects || we.projects.length === 0) {
        emptyFields.push(...buildLinkedProjectEmptyFields({
          section: 'workExperience',
          fieldPathPrefix: `workExperiences[${index}].projects[0]`,
          apiPrefix: `work_experience_${index}_project_0`,
          parentIndex: index,
          context,
        }))
      } else {
        we.projects.forEach((proj, projIndex) => {
          emptyFields.push(...collectMissingLinkedProjectFields(proj, {
            section: 'workExperience',
            fieldPathPrefix: `workExperiences[${index}].projects[${projIndex}]`,
            apiPrefix: `work_experience_${index}_project_${projIndex}`,
            parentIndex: index,
            context: `${context} → ${proj.projectName || 'Unnamed Project'}`,
          }))
        })
      }
    })
  }

  // Education Fields
  if (!candidate.educations || candidate.educations.length === 0) {
    // Section is completely empty - create placeholder fields for first entry
    emptyFields.push({
      fieldPath: 'educations[0].universityLocationName',
      apiFieldName: 'education_0_universityName',
      fieldLabel: 'University Name',
      fieldType: 'combobox',
      section: 'education',
      currentValue: null,
      parentIndex: 0,
      options: getUniversityOptions(),
      onCreateEntity: 'university',
    })
    emptyFields.push({
      fieldPath: 'educations[0].degreeName',
      apiFieldName: 'education_0_degreeName',
      fieldLabel: 'Degree Name',
      fieldType: 'text',
      section: 'education',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'educations[0].majorName',
      apiFieldName: 'education_0_majorName',
      fieldLabel: 'Major Name',
      fieldType: 'text',
      section: 'education',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'educations[0].startMonth',
      apiFieldName: 'education_0_startMonth',
      fieldLabel: 'Start Month',
      fieldType: 'date',
      section: 'education',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'educations[0].endMonth',
      apiFieldName: 'education_0_endMonth',
      fieldLabel: 'End Month',
      fieldType: 'date',
      section: 'education',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'educations[0].grades',
      apiFieldName: 'education_0_grades',
      fieldLabel: 'Grades',
      fieldType: 'text',
      section: 'education',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'educations[0].isTopper',
      apiFieldName: 'education_0_isTopper',
      fieldLabel: 'Topper',
      fieldType: 'boolean',
      section: 'education',
      currentValue: null,
      options: BOOLEAN_OPTIONS,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'educations[0].isCheetah',
      apiFieldName: 'education_0_isCheetah',
      fieldLabel: 'Cheetah',
      fieldType: 'boolean',
      section: 'education',
      currentValue: null,
      options: BOOLEAN_OPTIONS,
      parentIndex: 0,
    })
    appendEducationCatalogAndCampusEmptyFields(emptyFields, 0)
  } else {
    // Existing educations - check for empty fields within them
    let hasEmptyFields = false
    candidate.educations.forEach((edu, index) => {
      const context = `${edu.universityLocationName} - ${edu.degreeName}`
      
      const eduFields: Array<{
        path: string
        apiName: string
        label: string
        type: FieldType
        options?: { value: string; label: string }[]
      }> = [
        { path: 'grades', apiName: `education_${index}_grades`, label: 'Grades', type: 'text' },
        { path: 'isTopper', apiName: `education_${index}_isTopper`, label: 'Topper', type: 'boolean', options: BOOLEAN_OPTIONS },
        { path: 'isCheetah', apiName: `education_${index}_isCheetah`, label: 'Cheetah', type: 'boolean', options: BOOLEAN_OPTIONS },
      ]

      eduFields.forEach(field => {
        const value = (edu as unknown as Record<string, unknown>)[field.path]
        if (isEmpty(value)) {
          hasEmptyFields = true
          emptyFields.push({
            fieldPath: `educations[${index}].${field.path}`,
            apiFieldName: field.apiName,
            fieldLabel: field.label,
            fieldType: field.type,
            section: 'education',
            context,
            currentValue: value,
            options: field.options,
            parentIndex: index,
          })
        }
      })

      const catalogFields: Array<{
        path: keyof NonNullable<typeof edu> & string
        apiName: string
        label: string
        type: FieldType
        options?: { value: string; label: string }[]
      }> = [
        { path: 'country', apiName: `education_${index}_country`, label: 'Country', type: 'text' },
        {
          path: 'ranking',
          apiName: `education_${index}_ranking`,
          label: 'Ranking',
          type: 'select',
          options: EDUCATION_RANKING_OPTIONS,
        },
        { path: 'websiteUrl', apiName: `education_${index}_websiteUrl`, label: 'Website URL', type: 'text' },
        { path: 'linkedinUrl', apiName: `education_${index}_linkedinUrl`, label: 'LinkedIn URL', type: 'text' },
      ]

      catalogFields.forEach((field) => {
        const value = edu[field.path as keyof typeof edu]
        if (isEmpty(value)) {
          hasEmptyFields = true
          emptyFields.push({
            fieldPath: `educations[${index}].${field.path}`,
            apiFieldName: field.apiName,
            fieldLabel: field.label,
            fieldType: field.type,
            section: 'education',
            context,
            currentValue: value ?? null,
            options: field.options,
            parentIndex: index,
          })
        }
      })

      if (!edu.locations?.length) {
        hasEmptyFields = true
        const campusFields: Array<{
          path: string
          apiSuffix: string
          label: string
          type: FieldType
          options?: { value: string; label: string }[]
        }> = [
          { path: 'locations[0].city', apiSuffix: 'city', label: 'City', type: 'text' },
          {
            path: 'locations[0].isMainCampus',
            apiSuffix: 'isMainCampus',
            label: 'Main Campus',
            type: 'boolean',
            options: BOOLEAN_OPTIONS,
          },
          { path: 'locations[0].address', apiSuffix: 'address', label: 'Office Location', type: 'text' },
        ]
        for (const field of campusFields) {
          emptyFields.push({
            fieldPath: `educations[${index}].${field.path}`,
            apiFieldName: `education_${index}_campus_0_${field.apiSuffix}`,
            fieldLabel: field.label,
            fieldType: field.type,
            section: 'education',
            context,
            currentValue: null,
            options: field.options,
            parentIndex: index,
          })
        }
      }
    })
    
    // If no empty fields found in existing entries, create placeholder for a new entry
    if (!hasEmptyFields) {
      const newIndex = candidate.educations.length
      emptyFields.push({
        fieldPath: `educations[${newIndex}].universityLocationName`,
        apiFieldName: `education_${newIndex}_universityName`,
        fieldLabel: 'University Name',
        fieldType: 'combobox',
        section: 'education',
        currentValue: null,
        parentIndex: newIndex,
        options: getUniversityOptions(),
        onCreateEntity: 'university',
      })
      emptyFields.push({
        fieldPath: `educations[${newIndex}].degreeName`,
        apiFieldName: `education_${newIndex}_degreeName`,
        fieldLabel: 'Degree Name',
        fieldType: 'text',
        section: 'education',
        currentValue: null,
        parentIndex: newIndex,
      })
      emptyFields.push({
        fieldPath: `educations[${newIndex}].majorName`,
        apiFieldName: `education_${newIndex}_majorName`,
        fieldLabel: 'Major Name',
        fieldType: 'text',
        section: 'education',
        currentValue: null,
        parentIndex: newIndex,
      })
      emptyFields.push({
        fieldPath: `educations[${newIndex}].startMonth`,
        apiFieldName: `education_${newIndex}_startMonth`,
        fieldLabel: 'Start Month',
        fieldType: 'date',
        section: 'education',
        currentValue: null,
        parentIndex: newIndex,
      })
      emptyFields.push({
        fieldPath: `educations[${newIndex}].endMonth`,
        apiFieldName: `education_${newIndex}_endMonth`,
        fieldLabel: 'End Month',
        fieldType: 'date',
        section: 'education',
        currentValue: null,
        parentIndex: newIndex,
      })
      emptyFields.push({
        fieldPath: `educations[${newIndex}].grades`,
        apiFieldName: `education_${newIndex}_grades`,
        fieldLabel: 'Grades',
        fieldType: 'text',
        section: 'education',
        currentValue: null,
        parentIndex: newIndex,
      })
      emptyFields.push({
        fieldPath: `educations[${newIndex}].isTopper`,
        apiFieldName: `education_${newIndex}_isTopper`,
        fieldLabel: 'Topper',
        fieldType: 'boolean',
        section: 'education',
        currentValue: null,
        options: BOOLEAN_OPTIONS,
        parentIndex: newIndex,
      })
      emptyFields.push({
        fieldPath: `educations[${newIndex}].isCheetah`,
        apiFieldName: `education_${newIndex}_isCheetah`,
        fieldLabel: 'Cheetah',
        fieldType: 'boolean',
        section: 'education',
        currentValue: null,
        options: BOOLEAN_OPTIONS,
        parentIndex: newIndex,
      })
      appendEducationCatalogAndCampusEmptyFields(emptyFields, newIndex)
    }
  }

  // Certification Fields
  if (!candidate.certifications || candidate.certifications.length === 0) {
    emptyFields.push({
      fieldPath: 'certifications[0].certificationName',
      apiFieldName: 'certification_0_name',
      fieldLabel: 'Name',
      fieldType: 'combobox',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
      options: getCertificationOptions(),
      onCreateEntity: 'certification',
    })
    emptyFields.push({
      fieldPath: 'certifications[0].issueDate',
      apiFieldName: 'certification_0_issueDate',
      fieldLabel: 'Issue Date',
      fieldType: 'date',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'certifications[0].expiryDate',
      apiFieldName: 'certification_0_expiryDate',
      fieldLabel: 'Expiry Date',
      fieldType: 'date',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'certifications[0].certificationUrl',
      apiFieldName: 'certification_0_url',
      fieldLabel: 'Certification URL',
      fieldType: 'text',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'certifications[0].certificationLevel',
      apiFieldName: 'certification_0_level',
      fieldLabel: 'Level',
      fieldType: 'select',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
      options: CERTIFICATION_LEVEL_OPTIONS,
    })
    emptyFields.push({
      fieldPath: 'certifications[0].issuingBody',
      apiFieldName: 'certification_0_issuingBody',
      fieldLabel: 'Issuer body',
      fieldType: 'text',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'certifications[0].issuingBodyUrl',
      apiFieldName: 'certification_0_issuingBodyUrl',
      fieldLabel: 'Issuer body URL',
      fieldType: 'text',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
    })
  } else {
    // Existing certifications - check for empty fields within them
    candidate.certifications.forEach((cert, index) => {
      if (isEmpty(cert.certificationLevel)) {
        emptyFields.push({
          fieldPath: `certifications[${index}].certificationLevel`,
          apiFieldName: `certification_${index}_level`,
          fieldLabel: 'Certification Level',
          fieldType: 'select',
          section: 'certifications',
          context: cert.certificationName,
          currentValue: cert.certificationLevel,
          parentIndex: index,
          options: CERTIFICATION_LEVEL_OPTIONS,
        })
      }
      if (isEmpty(cert.certificationUrl)) {
        emptyFields.push({
          fieldPath: `certifications[${index}].certificationUrl`,
          apiFieldName: `certification_${index}_url`,
          fieldLabel: 'Certification URL',
          fieldType: 'text',
          section: 'certifications',
          context: cert.certificationName,
          currentValue: cert.certificationUrl,
          parentIndex: index,
        })
      }
    })
  }

  // Achievement Fields
  if (!candidate.achievements || candidate.achievements.length === 0) {
    // Section is completely empty - create placeholder fields for first entry
    emptyFields.push({
      fieldPath: 'achievements[0].name',
      apiFieldName: 'achievement_0_name',
      fieldLabel: 'Achievement Name',
      fieldType: 'text',
      section: 'achievements',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'achievements[0].achievementType',
      apiFieldName: 'achievement_0_type',
      fieldLabel: 'Achievement Type',
      fieldType: 'text',
      section: 'achievements',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'achievements[0].ranking',
      apiFieldName: 'achievement_0_ranking',
      fieldLabel: 'Ranking',
      fieldType: 'text',
      section: 'achievements',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'achievements[0].year',
      apiFieldName: 'achievement_0_year',
      fieldLabel: 'Year',
      fieldType: 'number',
      section: 'achievements',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'achievements[0].url',
      apiFieldName: 'achievement_0_url',
      fieldLabel: 'URL',
      fieldType: 'text',
      section: 'achievements',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'achievements[0].description',
      apiFieldName: 'achievement_0_description',
      fieldLabel: 'Description',
      fieldType: 'textarea',
      section: 'achievements',
      currentValue: null,
      parentIndex: 0,
    })
  } else {
    // Existing achievements - check for empty fields within them
    candidate.achievements.forEach((achievement, index) => {
      const context = achievement.name
      
      const achievementFields: Array<{
        path: string
        apiName: string
        label: string
        type: FieldType
      }> = [
        { path: 'ranking', apiName: `achievement_${index}_ranking`, label: 'Ranking', type: 'text' },
        { path: 'year', apiName: `achievement_${index}_year`, label: 'Year', type: 'number' },
        { path: 'url', apiName: `achievement_${index}_url`, label: 'URL', type: 'text' },
        { path: 'description', apiName: `achievement_${index}_description`, label: 'Description', type: 'textarea' },
      ]

      achievementFields.forEach(field => {
        const value = (achievement as unknown as Record<string, unknown>)[field.path]
        if (isEmpty(value)) {
          emptyFields.push({
            fieldPath: `achievements[${index}].${field.path}`,
            apiFieldName: field.apiName,
            fieldLabel: field.label,
            fieldType: field.type,
            section: 'achievements',
            context,
            currentValue: value,
            parentIndex: index,
          })
        }
      })
    })
  }

  // Independent Projects (Standalone projects not associated with work experience)
  if (!candidate.projects || candidate.projects.length === 0) {
    emptyFields.push(...buildLinkedProjectEmptyFields({
      section: 'projects',
      fieldPathPrefix: 'projects[0]',
      apiPrefix: 'project_0',
      parentIndex: 0,
    }))
  } else {
    let hasEmptyFields = false
    candidate.projects.forEach((project, index) => {
      const context = project.projectName || 'Unnamed Project'
      const missing = collectMissingLinkedProjectFields(project, {
        section: 'projects',
        fieldPathPrefix: `projects[${index}]`,
        apiPrefix: `project_${index}`,
        parentIndex: index,
        context,
      })
      if (missing.length > 0) hasEmptyFields = true
      emptyFields.push(...missing)
    })

    if (!hasEmptyFields) {
      const newIndex = candidate.projects.length
      emptyFields.push(...buildLinkedProjectEmptyFields({
        section: 'projects',
        fieldPathPrefix: `projects[${newIndex}]`,
        apiPrefix: `project_${newIndex}`,
        parentIndex: newIndex,
      }))
    }
  }

  // Standalone Tech Stacks
  if (isEmpty(candidate.techStacks)) {
    emptyFields.push({
      fieldPath: 'techStacks',
      apiFieldName: 'techStacks',
      fieldLabel: 'Tech Stacks',
      fieldType: 'multiselect',
      section: 'techStacks',
      currentValue: candidate.techStacks,
    })
  }

  return emptyFields
}

/**
 * Create placeholder fields for a specific entry index in a dynamic section
 * This is used when users manually add new entries in Cold Caller mode
 */
export function createEntryFields(
  section: 'workExperience' | 'education' | 'certifications' | 'achievements' | 'projects',
  index: number
): EmptyField[] {
  const fields: EmptyField[] = []
  
  switch (section) {
    case 'workExperience':
      fields.push(
        {
          fieldPath: `workExperiences[${index}].jobTitle`,
          apiFieldName: `work_experience_${index}_jobTitle`,
          fieldLabel: 'Job Title',
          fieldType: 'text',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].employerName`,
          apiFieldName: `work_experience_${index}_employerName`,
          fieldLabel: 'Employer',
          fieldType: 'combobox',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
          options: getEmployerOptions(),
          onCreateEntity: 'employer',
        },
        {
          fieldPath: `workExperiences[${index}].startDate`,
          apiFieldName: `work_experience_${index}_startDate`,
          fieldLabel: 'Start Date',
          fieldType: 'date',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].endDate`,
          apiFieldName: `work_experience_${index}_endDate`,
          fieldLabel: 'End Date',
          fieldType: 'date',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].techStacks`,
          apiFieldName: `work_experience_${index}_techStacks`,
          fieldLabel: 'Tech Stacks',
          fieldType: 'multiselect',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].shiftType`,
          apiFieldName: `work_experience_${index}_shiftType`,
          fieldLabel: 'Shift Type',
          fieldType: 'select',
          section: 'workExperience',
          currentValue: null,
          options: SHIFT_TYPE_OPTIONS,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].workMode`,
          apiFieldName: `work_experience_${index}_workMode`,
          fieldLabel: 'Work Mode',
          fieldType: 'select',
          section: 'workExperience',
          currentValue: null,
          options: WORK_MODE_OPTIONS,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].timeSupportZones`,
          apiFieldName: `work_experience_${index}_timeSupportZones`,
          fieldLabel: 'Time Support Zones',
          fieldType: 'multiselect',
          section: 'workExperience',
          currentValue: null,
          options: TIME_SUPPORT_ZONE_OPTIONS,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].benefits`,
          apiFieldName: `work_experience_${index}_benefits`,
          fieldLabel: 'Benefits',
          fieldType: 'benefits',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
        }
        // Note: Projects are added dynamically via handleAddProject() - not included here
      )
      break
      
    case 'education':
      fields.push(
        {
          fieldPath: `educations[${index}].universityLocationName`,
          apiFieldName: `education_${index}_universityName`,
          fieldLabel: 'University Name',
          fieldType: 'combobox',
          section: 'education',
          currentValue: null,
          parentIndex: index,
          options: getUniversityOptions(),
          onCreateEntity: 'university',
        },
        {
          fieldPath: `educations[${index}].degreeName`,
          apiFieldName: `education_${index}_degreeName`,
          fieldLabel: 'Degree Name',
          fieldType: 'text',
          section: 'education',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `educations[${index}].majorName`,
          apiFieldName: `education_${index}_majorName`,
          fieldLabel: 'Major Name',
          fieldType: 'text',
          section: 'education',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `educations[${index}].startMonth`,
          apiFieldName: `education_${index}_startMonth`,
          fieldLabel: 'Start Month',
          fieldType: 'date',
          section: 'education',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `educations[${index}].endMonth`,
          apiFieldName: `education_${index}_endMonth`,
          fieldLabel: 'End Month',
          fieldType: 'date',
          section: 'education',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `educations[${index}].grades`,
          apiFieldName: `education_${index}_grades`,
          fieldLabel: 'Grades',
          fieldType: 'text',
          section: 'education',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `educations[${index}].isTopper`,
          apiFieldName: `education_${index}_isTopper`,
          fieldLabel: 'Topper',
          fieldType: 'boolean',
          section: 'education',
          currentValue: null,
          options: BOOLEAN_OPTIONS,
          parentIndex: index,
        },
        {
          fieldPath: `educations[${index}].isCheetah`,
          apiFieldName: `education_${index}_isCheetah`,
          fieldLabel: 'Cheetah',
          fieldType: 'boolean',
          section: 'education',
          currentValue: null,
          options: BOOLEAN_OPTIONS,
          parentIndex: index,
        },
      )
      appendEducationCatalogAndCampusEmptyFields(fields, index)
      break
      
    case 'certifications':
      fields.push(
        {
          fieldPath: `certifications[${index}].certificationName`,
          apiFieldName: `certification_${index}_name`,
          fieldLabel: 'Name',
          fieldType: 'combobox',
          section: 'certifications',
          currentValue: null,
          parentIndex: index,
          options: getCertificationOptions(),
          onCreateEntity: 'certification',
        },
        {
          fieldPath: `certifications[${index}].issueDate`,
          apiFieldName: `certification_${index}_issueDate`,
          fieldLabel: 'Issue Date',
          fieldType: 'date',
          section: 'certifications',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `certifications[${index}].expiryDate`,
          apiFieldName: `certification_${index}_expiryDate`,
          fieldLabel: 'Expiry Date',
          fieldType: 'date',
          section: 'certifications',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `certifications[${index}].certificationUrl`,
          apiFieldName: `certification_${index}_url`,
          fieldLabel: 'Certification URL',
          fieldType: 'text',
          section: 'certifications',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `certifications[${index}].certificationLevel`,
          apiFieldName: `certification_${index}_level`,
          fieldLabel: 'Certification Level',
          fieldType: 'select',
          section: 'certifications',
          currentValue: null,
          parentIndex: index,
          options: CERTIFICATION_LEVEL_OPTIONS,
        }
      )
      break
      
    case 'achievements':
      fields.push(
        {
          fieldPath: `achievements[${index}].name`,
          apiFieldName: `achievement_${index}_name`,
          fieldLabel: 'Achievement Name',
          fieldType: 'text',
          section: 'achievements',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `achievements[${index}].achievementType`,
          apiFieldName: `achievement_${index}_type`,
          fieldLabel: 'Achievement Type',
          fieldType: 'text',
          section: 'achievements',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `achievements[${index}].ranking`,
          apiFieldName: `achievement_${index}_ranking`,
          fieldLabel: 'Ranking',
          fieldType: 'text',
          section: 'achievements',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `achievements[${index}].year`,
          apiFieldName: `achievement_${index}_year`,
          fieldLabel: 'Year',
          fieldType: 'number',
          section: 'achievements',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `achievements[${index}].url`,
          apiFieldName: `achievement_${index}_url`,
          fieldLabel: 'URL',
          fieldType: 'text',
          section: 'achievements',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `achievements[${index}].description`,
          apiFieldName: `achievement_${index}_description`,
          fieldLabel: 'Description',
          fieldType: 'textarea',
          section: 'achievements',
          currentValue: null,
          parentIndex: index,
        }
      )
      break
      
    case 'projects':
      fields.push(
        ...buildLinkedProjectEmptyFields({
          section: 'projects',
          fieldPathPrefix: `projects[${index}]`,
          apiPrefix: `project_${index}`,
          parentIndex: index,
        }),
      )
      break
  }
  
  return fields
}

/**
 * Create placeholder fields for a project within a work experience entry
 * This is used when users manually add new projects to a work experience in Cold Caller mode
 */
export function createProjectFields(
  workExperienceIndex: number,
  projectIndex: number
): EmptyField[] {
  return buildLinkedProjectEmptyFields({
    section: 'workExperience',
    fieldPathPrefix: `workExperiences[${workExperienceIndex}].projects[${projectIndex}]`,
    apiPrefix: `work_experience_${workExperienceIndex}_project_${projectIndex}`,
    parentIndex: workExperienceIndex,
  })
}

/**
 * Group empty fields by section
 */
export function groupEmptyFieldsBySection(emptyFields: EmptyField[]): Map<FieldSection, EmptyField[]> {
  const grouped = new Map<FieldSection, EmptyField[]>()
  
  emptyFields.forEach(field => {
    const existing = grouped.get(field.section) || []
    existing.push(field)
    grouped.set(field.section, existing)
  })

  return grouped
}

/**
 * Get API field names for the request
 */
export function getApiFieldNames(emptyFields: EmptyField[]): string[] {
  return emptyFields.map(field => field.apiFieldName)
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(
  totalFields: number,
  emptyFieldsCount: number
): number {
  if (totalFields === 0) return 100
  const filledFields = totalFields - emptyFieldsCount
  return Math.round((filledFields / totalFields) * 100)
}

/**
 * Get a rough estimate of total trackable fields for a candidate
 */
export function getTotalTrackableFields(candidate: Candidate): number {
  let total = 7 // Basic fields count: postingTitle, cnic, currentSalary, expectedSalary, githubUrl, linkedinUrl, personalityType
  
  // Work experience fields (7 per experience: startDate, endDate, shiftType, workMode, timeSupportZones, techStacks, benefits)
  candidate.workExperiences?.forEach(we => {
    total += 7 // startDate, endDate, shiftType, workMode, timeSupportZones, techStacks, benefits
    total += we.projects?.length || 0 // contribution notes per project
  })
  
  // Education fields (3 per education: grades, isTopper, isCheetah)
  total += (candidate.educations?.length || 0) * 3
  
  // Certification fields (1 per certification - URL)
  total += candidate.certifications?.length || 0
  
  // Achievement fields (4 per achievement: ranking, year, url, description)
  total += (candidate.achievements?.length || 0) * 4
  
  // Standalone tech stacks
  total += 1
  
  return total
}

