// Empty Field Detection Utility for Cold Caller Mode

import type { Candidate } from '@/lib/types/candidate'
import type { EmptyField, FieldSection, FieldType } from '@/types/cold-caller'
import { sampleProjects } from '@/lib/sample-data/projects'
import { sampleEmployers } from '@/lib/sample-data/employers'
import { sampleUniversities } from '@/lib/sample-data/universities'
import { sampleCertifications } from '@/lib/sample-data/certifications'

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
  return sampleUniversities.flatMap(university =>
    university.locations.map(location => ({
      label: `${university.name} - ${location.city}`,
      value: `${university.name} - ${location.city}`,
    }))
  )
}

export function getCertificationOptions(): { value: string; label: string }[] {
  return sampleCertifications.map(cert => ({
    label: cert.certificationName,
    value: cert.certificationName,
  }))
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
    // Section is completely empty - create placeholder fields for first entry
    emptyFields.push({
      fieldPath: 'workExperiences[0].employerName',
      apiFieldName: 'work_experience_0_employerName',
      fieldLabel: 'Employer Name',
      fieldType: 'combobox',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
      options: getEmployerOptions(),
      onCreateEntity: 'employer',
    })
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
      fieldPath: 'workExperiences[0].techStacks',
      apiFieldName: 'work_experience_0_techStacks',
      fieldLabel: 'Tech Stacks',
      fieldType: 'multiselect',
      section: 'workExperience',
      currentValue: null,
      parentIndex: 0,
    })
    emptyFields.push({
      fieldPath: 'workExperiences[0].domains',
      apiFieldName: 'work_experience_0_domains',
      fieldLabel: 'Domains',
      fieldType: 'multiselect',
      section: 'workExperience',
      currentValue: null,
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
    // Note: Projects are added dynamically via handleAddProject() - not included here
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

      // Check projects - if no projects exist, add placeholder project
      if (!we.projects || we.projects.length === 0) {
          emptyFields.push({
            fieldPath: `workExperiences[${index}].projects[0].projectName`,
            apiFieldName: `work_experience_${index}_project_0_projectName`,
            fieldLabel: 'Project Name',
            fieldType: 'combobox',
            section: 'workExperience',
            context,
            currentValue: null,
            parentIndex: index,
            options: getProjectOptions(),
            onCreateEntity: 'project',
          })
        emptyFields.push({
          fieldPath: `workExperiences[${index}].projects[0].contributionNotes`,
          apiFieldName: `work_experience_${index}_project_0_contributionNotes`,
          fieldLabel: 'Contribution Notes',
          fieldType: 'textarea',
          section: 'workExperience',
          context,
          currentValue: null,
          parentIndex: index,
        })
      } else {
        // Check project contribution notes for existing projects
        we.projects.forEach((proj, projIndex) => {
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
      }
    })
  }

  // Education Fields
  if (!candidate.educations || candidate.educations.length === 0) {
    // Section is completely empty - create placeholder fields for first entry
    emptyFields.push({
      fieldPath: 'educations[0].universityLocationName',
      apiFieldName: 'education_0_universityLocationName',
      fieldLabel: 'University Location',
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
  } else {
    // Existing educations - check for empty fields within them
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
  }

  // Certification Fields
  if (!candidate.certifications || candidate.certifications.length === 0) {
    // Section is completely empty - create placeholder fields for first entry
    emptyFields.push({
      fieldPath: 'certifications[0].certificationName',
      apiFieldName: 'certification_0_name',
      fieldLabel: 'Certification Name',
      fieldType: 'combobox',
      section: 'certifications',
      currentValue: null,
      parentIndex: 0,
      options: getCertificationOptions(),
      onCreateEntity: 'certification',
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
  } else {
    // Existing certifications - check for empty fields within them
    candidate.certifications.forEach((cert, index) => {
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
    // Section is completely empty - create placeholder fields for first entry
    emptyFields.push({
      fieldPath: 'projects[0].projectName',
      apiFieldName: 'project_0_projectName',
      fieldLabel: 'Project Name',
      fieldType: 'combobox',
      section: 'projects',
      currentValue: null,
      parentIndex: 0,
      options: getProjectOptions(),
      onCreateEntity: 'project',
    })
    emptyFields.push({
      fieldPath: 'projects[0].contributionNotes',
      apiFieldName: 'project_0_contributionNotes',
      fieldLabel: 'Contribution Notes',
      fieldType: 'textarea',
      section: 'projects',
      currentValue: null,
      parentIndex: 0,
    })
  } else {
    // Existing projects - check for empty fields within them
    candidate.projects.forEach((project, index) => {
      const context = project.projectName || 'Unnamed Project'
      
      if (isEmpty(project.projectName)) {
        emptyFields.push({
          fieldPath: `projects[${index}].projectName`,
          apiFieldName: `project_${index}_projectName`,
          fieldLabel: 'Project Name',
          fieldType: 'combobox',
          section: 'projects',
          context,
          currentValue: project.projectName,
          parentIndex: index,
          options: getProjectOptions(),
          onCreateEntity: 'project',
        })
      }
      
      if (isEmpty(project.contributionNotes)) {
        emptyFields.push({
          fieldPath: `projects[${index}].contributionNotes`,
          apiFieldName: `project_${index}_contributionNotes`,
          fieldLabel: 'Contribution Notes',
          fieldType: 'textarea',
          section: 'projects',
          context,
          currentValue: project.contributionNotes,
          parentIndex: index,
        })
      }
    })
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
          fieldPath: `workExperiences[${index}].employerName`,
          apiFieldName: `work_experience_${index}_employerName`,
          fieldLabel: 'Employer Name',
          fieldType: 'combobox',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
          options: getEmployerOptions(),
          onCreateEntity: 'employer',
        },
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
          fieldPath: `workExperiences[${index}].techStacks`,
          apiFieldName: `work_experience_${index}_techStacks`,
          fieldLabel: 'Tech Stacks',
          fieldType: 'multiselect',
          section: 'workExperience',
          currentValue: null,
          parentIndex: index,
        },
        {
          fieldPath: `workExperiences[${index}].domains`,
          apiFieldName: `work_experience_${index}_domains`,
          fieldLabel: 'Domains',
          fieldType: 'multiselect',
          section: 'workExperience',
          currentValue: null,
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
          apiFieldName: `education_${index}_universityLocationName`,
          fieldLabel: 'University Location',
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
        }
      )
      break
      
    case 'certifications':
      fields.push(
        {
          fieldPath: `certifications[${index}].certificationName`,
          apiFieldName: `certification_${index}_name`,
          fieldLabel: 'Certification Name',
          fieldType: 'combobox',
          section: 'certifications',
          currentValue: null,
          parentIndex: index,
          options: getCertificationOptions(),
          onCreateEntity: 'certification',
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
        {
          fieldPath: `projects[${index}].projectName`,
          apiFieldName: `project_${index}_projectName`,
          fieldLabel: 'Project Name',
          fieldType: 'combobox',
          section: 'projects',
          currentValue: null,
          parentIndex: index,
          options: getProjectOptions(),
          onCreateEntity: 'project',
        },
        {
          fieldPath: `projects[${index}].contributionNotes`,
          apiFieldName: `project_${index}_contributionNotes`,
          fieldLabel: 'Contribution Notes',
          fieldType: 'textarea',
          section: 'projects',
          currentValue: null,
          parentIndex: index,
        }
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
  return [
        {
          fieldPath: `workExperiences[${workExperienceIndex}].projects[${projectIndex}].projectName`,
          apiFieldName: `work_experience_${workExperienceIndex}_project_${projectIndex}_projectName`,
          fieldLabel: 'Project Name',
          fieldType: 'combobox',
          section: 'workExperience',
          currentValue: null,
          parentIndex: workExperienceIndex,
          options: getProjectOptions(),
          onCreateEntity: 'project',
        },
    {
      fieldPath: `workExperiences[${workExperienceIndex}].projects[${projectIndex}].contributionNotes`,
      apiFieldName: `work_experience_${workExperienceIndex}_project_${projectIndex}_contributionNotes`,
      fieldLabel: 'Contribution Notes',
      fieldType: 'textarea',
      section: 'workExperience',
      currentValue: null,
      parentIndex: workExperienceIndex,
    }
  ]
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
  
  // Work experience fields (8 per experience: startDate, endDate, shiftType, workMode, timeSupportZones, techStacks, domains, benefits)
  candidate.workExperiences?.forEach(we => {
    total += 8 // startDate, endDate, shiftType, workMode, timeSupportZones, techStacks, domains, benefits
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

