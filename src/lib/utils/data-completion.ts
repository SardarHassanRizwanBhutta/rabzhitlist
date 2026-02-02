// Data Completion Utility for Candidate Profile

import type { Candidate } from '@/lib/types/candidate'
import { getEmptyFields, getTotalTrackableFields } from './empty-field-detection'
import type { FieldSection } from '@/types/cold-caller'
import { SECTION_LABELS } from '@/types/cold-caller'

export interface DataCompletionSummary {
  candidateId: string
  totalFields: number
  filledFields: number
  emptyFields: number
  completionPercentage: number
  sectionBreakdown: {
    section: FieldSection
    label: string
    total: number
    filled: number
    empty: number
    percentage: number
  }[]
}

/**
 * Calculate data completion summary for a candidate
 */
export function calculateDataCompletion(candidate: Candidate): DataCompletionSummary {
  const emptyFields = getEmptyFields(candidate)
  const totalFields = getTotalTrackableFields(candidate)
  const filledFields = totalFields - emptyFields.length
  const completionPercentage = totalFields > 0 
    ? Math.round((filledFields / totalFields) * 100) 
    : 100

  // Group empty fields by section
  const sectionEmptyMap = new Map<FieldSection, number>()
  emptyFields.forEach(field => {
    const count = sectionEmptyMap.get(field.section) || 0
    sectionEmptyMap.set(field.section, count + 1)
  })

  // Calculate section breakdown
  const sectionBreakdown: DataCompletionSummary['sectionBreakdown'] = []
  
  // Basic Information fields (8 fields: postingTitle, cnic, currentSalary, expectedSalary, githubUrl, linkedinUrl, personalityType, resume)
  const basicTotal = 8
  const basicEmpty = sectionEmptyMap.get('basic') || 0
  sectionBreakdown.push({
    section: 'basic',
    label: SECTION_LABELS.basic,
    total: basicTotal,
    filled: basicTotal - basicEmpty,
    empty: basicEmpty,
    percentage: basicTotal > 0 ? Math.round(((basicTotal - basicEmpty) / basicTotal) * 100) : 100
  })

  // Work Experience fields
  // 6 fields per work experience: shiftType, workMode, timeSupportZones, techStacks, domains, benefits
  const weTotal = (candidate.workExperiences?.length || 0) * 6
  // Plus contribution notes for each project
  const weProjectsTotal = candidate.workExperiences?.reduce((sum, we) => sum + (we.projects?.length || 0), 0) || 0
  const weTotalWithProjects = weTotal + weProjectsTotal
  const weEmpty = sectionEmptyMap.get('workExperience') || 0
  sectionBreakdown.push({
    section: 'workExperience',
    label: SECTION_LABELS.workExperience,
    total: weTotalWithProjects,
    filled: weTotalWithProjects - weEmpty,
    empty: weEmpty,
    percentage: weTotalWithProjects > 0 ? Math.round(((weTotalWithProjects - weEmpty) / weTotalWithProjects) * 100) : 100
  })

  // Education fields (3 fields per education: grades, isTopper, isCheetah)
  const eduTotal = (candidate.educations?.length || 0) * 3
  const eduEmpty = sectionEmptyMap.get('education') || 0
  sectionBreakdown.push({
    section: 'education',
    label: SECTION_LABELS.education,
    total: eduTotal,
    filled: eduTotal - eduEmpty,
    empty: eduEmpty,
    percentage: eduTotal > 0 ? Math.round(((eduTotal - eduEmpty) / eduTotal) * 100) : 100
  })

  // Certifications fields (1 field per certification: certificationUrl)
  const certTotal = candidate.certifications?.length || 0
  const certEmpty = sectionEmptyMap.get('certifications') || 0
  sectionBreakdown.push({
    section: 'certifications',
    label: SECTION_LABELS.certifications,
    total: certTotal,
    filled: certTotal - certEmpty,
    empty: certEmpty,
    percentage: certTotal > 0 ? Math.round(((certTotal - certEmpty) / certTotal) * 100) : 100
  })

  // Achievements fields (4 fields per achievement: ranking, year, url, description)
  const achievementTotal = (candidate.achievements?.length || 0) * 4
  const achievementEmpty = sectionEmptyMap.get('achievements') || 0
  sectionBreakdown.push({
    section: 'achievements',
    label: SECTION_LABELS.achievements,
    total: achievementTotal,
    filled: achievementTotal - achievementEmpty,
    empty: achievementEmpty,
    percentage: achievementTotal > 0 ? Math.round(((achievementTotal - achievementEmpty) / achievementTotal) * 100) : 100
  })

  // Tech Stacks (1 field: standalone techStacks array)
  const techTotal = 1
  const techEmpty = sectionEmptyMap.get('techStacks') || 0
  sectionBreakdown.push({
    section: 'techStacks',
    label: SECTION_LABELS.techStacks,
    total: techTotal,
    filled: techTotal - techEmpty,
    empty: techEmpty,
    percentage: techTotal > 0 ? Math.round(((techTotal - techEmpty) / techTotal) * 100) : 100
  })

  return {
    candidateId: candidate.id,
    totalFields,
    filledFields,
    emptyFields: emptyFields.length,
    completionPercentage,
    sectionBreakdown
  }
}


