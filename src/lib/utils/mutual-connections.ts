import type { Candidate, WorkExperience, CandidateEducation } from "@/lib/types/candidate"

/**
 * Check if two date ranges overlap
 * @param start1 Start date of first range (or undefined/null for ongoing)
 * @param end1 End date of first range (or undefined/null for ongoing)
 * @param start2 Start date of second range (or undefined/null for ongoing)
 * @param end2 End date of second range (or undefined/null for ongoing)
 * @param toleranceMonths Optional tolerance in months for gap (default: 0)
 * @returns true if ranges overlap or are within tolerance
 */
export function dateRangesOverlap(
  start1: Date | undefined | null,
  end1: Date | undefined | null,
  start2: Date | undefined | null,
  end2: Date | undefined | null,
  toleranceMonths: number = 0
): boolean {
  // Handle undefined/null dates
  const today = new Date()
  const s1 = start1 ? new Date(start1) : null
  const e1 = end1 ? new Date(end1) : today // Ongoing = today
  const s2 = start2 ? new Date(start2) : null
  const e2 = end2 ? new Date(end2) : today // Ongoing = today

  // If either range has no start date, can't determine overlap
  if (!s1 || !s2) return false

  // Normalize dates to start of day
  s1.setHours(0, 0, 0, 0)
  e1.setHours(0, 0, 0, 0)
  s2.setHours(0, 0, 0, 0)
  e2.setHours(0, 0, 0, 0)

  // Calculate overlap
  const overlapStart = s1 > s2 ? s1 : s2
  const overlapEnd = e1 < e2 ? e1 : e2

  // If there's an overlap
  if (overlapStart <= overlapEnd) {
    return true
  }

  // If tolerance is specified, check if gap is within tolerance
  if (toleranceMonths > 0) {
    const gapMs = Math.abs(overlapStart.getTime() - overlapEnd.getTime())
    const gapMonths = gapMs / (1000 * 60 * 60 * 24 * 30.44) // Average days per month
    return gapMonths <= toleranceMonths
  }

  return false
}

/**
 * Check if two candidates have overlapping education at the same university
 */
export function hasOverlappingEducation(
  candidate1: Candidate,
  candidate2: Candidate,
  toleranceMonths: number = 0
): Array<{
  universityLocationId: string
  universityLocationName: string
  candidate1Education: CandidateEducation
  candidate2Education: CandidateEducation
  overlapStart: Date
  overlapEnd: Date
}> {
  const overlaps: Array<{
    universityLocationId: string
    universityLocationName: string
    candidate1Education: CandidateEducation
    candidate2Education: CandidateEducation
    overlapStart: Date
    overlapEnd: Date
  }> = []

  if (!candidate1.educations || !candidate2.educations) {
    return overlaps
  }

  // Store in local variables so TypeScript knows they're defined
  const educations1 = candidate1.educations
  const educations2 = candidate2.educations

  educations1.forEach(edu1 => {
    educations2.forEach(edu2 => {
      // Same university location
      if (edu1.universityLocationId === edu2.universityLocationId) {
        if (dateRangesOverlap(
          edu1.startMonth,
          edu1.endMonth,
          edu2.startMonth,
          edu2.endMonth,
          toleranceMonths
        )) {
          const s1 = edu1.startMonth ? new Date(edu1.startMonth) : new Date()
          const e1 = edu1.endMonth ? new Date(edu1.endMonth) : new Date()
          const s2 = edu2.startMonth ? new Date(edu2.startMonth) : new Date()
          const e2 = edu2.endMonth ? new Date(edu2.endMonth) : new Date()
          
          const overlapStart = s1 > s2 ? s1 : s2
          const overlapEnd = e1 < e2 ? e1 : e2

          overlaps.push({
            universityLocationId: edu1.universityLocationId,
            universityLocationName: edu1.universityLocationName,
            candidate1Education: edu1,
            candidate2Education: edu2,
            overlapStart,
            overlapEnd
          })
        }
      }
    })
  })

  return overlaps
}

/**
 * Check if two candidates have overlapping work experience at the same employer
 */
export function hasOverlappingWorkExperience(
  candidate1: Candidate,
  candidate2: Candidate,
  toleranceMonths: number = 0
): Array<{
  employerName: string
  candidate1WorkExperience: WorkExperience
  candidate2WorkExperience: WorkExperience
  overlapStart: Date
  overlapEnd: Date
}> {
  const overlaps: Array<{
    employerName: string
    candidate1WorkExperience: WorkExperience
    candidate2WorkExperience: WorkExperience
    overlapStart: Date
    overlapEnd: Date
  }> = []

  if (!candidate1.workExperiences || !candidate2.workExperiences) {
    return overlaps
  }

  // Store in local variables so TypeScript knows they're defined
  const workExperiences1 = candidate1.workExperiences
  const workExperiences2 = candidate2.workExperiences

  workExperiences1.forEach(we1 => {
    workExperiences2.forEach(we2 => {
      // Same employer (case-insensitive)
      if (we1.employerName.toLowerCase().trim() === we2.employerName.toLowerCase().trim()) {
        if (dateRangesOverlap(
          we1.startDate,
          we1.endDate,
          we2.startDate,
          we2.endDate,
          toleranceMonths
        )) {
          const s1 = we1.startDate ? new Date(we1.startDate) : new Date()
          const e1 = we1.endDate ? new Date(we1.endDate) : new Date()
          const s2 = we2.startDate ? new Date(we2.startDate) : new Date()
          const e2 = we2.endDate ? new Date(we2.endDate) : new Date()
          
          const overlapStart = s1 > s2 ? s1 : s2
          const overlapEnd = e1 < e2 ? e1 : e2

          overlaps.push({
            employerName: we1.employerName,
            candidate1WorkExperience: we1,
            candidate2WorkExperience: we2,
            overlapStart,
            overlapEnd
          })
        }
      }
    })
  })

  return overlaps
}

/**
 * Check if a candidate is a DPL employee
 */
export function isDPLEmployee(candidate: Candidate): boolean {
  if (!candidate.workExperiences) return false
  
  return candidate.workExperiences.some(we => 
    we.employerName.toLowerCase().trim() === "dpl"
  )
}

/**
 * Find mutual connections between a candidate and DPL employees
 * Returns array of DPL employees who have overlapping education/work experience
 */
export function findMutualConnectionsWithDPL(
  candidate: Candidate,
  allCandidates: Candidate[],
  toleranceMonths: number = 0
): Array<{
  dplEmployee: Candidate
  connectionType: 'education' | 'work' | 'both'
  educationOverlaps: ReturnType<typeof hasOverlappingEducation>
  workOverlaps: ReturnType<typeof hasOverlappingWorkExperience>
}> {
  const mutualConnections: Array<{
    dplEmployee: Candidate
    connectionType: 'education' | 'work' | 'both'
    educationOverlaps: ReturnType<typeof hasOverlappingEducation>
    workOverlaps: ReturnType<typeof hasOverlappingWorkExperience>
  }> = []

  // Find all DPL employees
  const dplEmployees = allCandidates.filter(c => 
    c.id !== candidate.id && isDPLEmployee(c)
  )

  dplEmployees.forEach(dplEmployee => {
    const educationOverlaps = hasOverlappingEducation(candidate, dplEmployee, toleranceMonths)
    const workOverlaps = hasOverlappingWorkExperience(candidate, dplEmployee, toleranceMonths)

    if (educationOverlaps.length > 0 || workOverlaps.length > 0) {
      let connectionType: 'education' | 'work' | 'both' = 'education'
      if (educationOverlaps.length > 0 && workOverlaps.length > 0) {
        connectionType = 'both'
      } else if (workOverlaps.length > 0) {
        connectionType = 'work'
      }

      mutualConnections.push({
        dplEmployee,
        connectionType,
        educationOverlaps,
        workOverlaps
      })
    }
  })

  return mutualConnections
}

