// Empty Field Detection Utility for Cold Caller Mode

import type { Candidate } from '@/lib/types/candidate'
import type { EmptyField, FieldSection, FieldType } from '@/types/cold-caller'

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
  candidate.workExperiences?.forEach((we, index) => {
    const context = `${we.employerName} - ${we.jobTitle}`
    
    const weFields: Array<{
      path: string
      apiName: string
      label: string
      type: FieldType
      options?: { value: string; label: string }[]
    }> = [
      { path: 'shiftType', apiName: `work_experience_${index}_shiftType`, label: 'Shift Type', type: 'select', options: SHIFT_TYPE_OPTIONS },
      { path: 'workMode', apiName: `work_experience_${index}_workMode`, label: 'Work Mode', type: 'select', options: WORK_MODE_OPTIONS },
      { path: 'timeSupportZones', apiName: `work_experience_${index}_timeSupportZones`, label: 'Time Support Zones', type: 'multiselect', options: TIME_SUPPORT_ZONE_OPTIONS },
      { path: 'techStacks', apiName: `work_experience_${index}_techStacks`, label: 'Tech Stacks', type: 'multiselect' },
      { path: 'domains', apiName: `work_experience_${index}_domains`, label: 'Domains', type: 'multiselect' },
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

    // Check project contribution notes
    we.projects?.forEach((proj, projIndex) => {
      if (isEmpty(proj.contributionNotes)) {
        emptyFields.push({
          fieldPath: `workExperiences[${index}].projects[${projIndex}].contributionNotes`,
          apiFieldName: `work_experience_${index}_project_${projIndex}_contributionNotes`,
          fieldLabel: 'Contribution Notes',
          fieldType: 'textarea',
          section: 'workExperience',
          context: `${context} → ${proj.projectName}`,
          currentValue: proj.contributionNotes,
          parentIndex: index,
        })
      }
    })
  })

  // Education Fields
  candidate.educations?.forEach((edu, index) => {
    const context = `${edu.universityLocationName} - ${edu.degreeName}`
    
    const eduFields: Array<{
      path: string
      apiName: string
      label: string
      type: FieldType
      options?: { value: string; label: string }[]
    }> = [
      { path: 'grades', apiName: `education_${index}_grades`, label: 'Grades', type: 'text' },
      { path: 'isTopper', apiName: `education_${index}_isTopper`, label: 'Is Topper', type: 'boolean', options: BOOLEAN_OPTIONS },
      { path: 'isCheetah', apiName: `education_${index}_isCheetah`, label: 'Is Cheetah', type: 'boolean', options: BOOLEAN_OPTIONS },
    ]

    eduFields.forEach(field => {
      const value = (edu as unknown as Record<string, unknown>)[field.path]
      if (isEmpty(value)) {
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
  })

  // Certification Fields
  candidate.certifications?.forEach((cert, index) => {
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

  // Achievement Fields
  candidate.achievements?.forEach((achievement, index) => {
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
  let total = 7 // Basic fields count
  
  // Work experience fields (6 per experience + projects)
  candidate.workExperiences?.forEach(we => {
    total += 6 // shiftType, workMode, timeSupportZones, techStacks, domains, benefits
    total += we.projects?.length || 0 // contribution notes per project
  })
  
  // Education fields (3 per education)
  total += (candidate.educations?.length || 0) * 3
  
  // Certification fields (1 per certification - URL)
  total += candidate.certifications?.length || 0
  
  // Achievement fields (4 per achievement)
  total += (candidate.achievements?.length || 0) * 4
  
  // Standalone tech stacks
  total += 1
  
  return total
}

