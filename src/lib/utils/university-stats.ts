import { University } from "@/lib/types/university"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { sampleUniversities } from "@/lib/sample-data/universities"

export interface UniversityJobSuccessStats {
  totalGraduates: number
  successfulPlacements: number
  successRatio: number // Percentage (0-100)
}

/**
 * Calculate job success ratio for a university
 * 
 * Success is defined as:
 * 1. Status is "hired" (explicit success through this system) OR
 * 2. Has work experience (proves employment history) OR
 * 3. Has current salary > 0 (indicates current employment)
 * 
 * Explicit failures (rejected, withdrawn) are excluded from success count
 */
export function calculateUniversityJobSuccessRatio(
  university: University
): UniversityJobSuccessStats {
  // Find all graduates from this university
  // A graduate is a candidate who has education linked to this university's locations
  const graduates = sampleCandidates.filter(candidate => 
    candidate.educations?.some(edu => {
      const universityLocation = sampleUniversities
        .find(u => u.id === university.id)
        ?.locations.find(loc => loc.id === edu.universityLocationId)
      return universityLocation !== undefined
    })
  )
  
  const totalGraduates = graduates.length
  
  if (totalGraduates === 0) {
    return {
      totalGraduates: 0,
      successfulPlacements: 0,
      successRatio: 0
    }
  }
  
  // Define success as ANY of these conditions (OR logic):
  // 1. Status is "hired" (explicit success through this system)
  // 2. Has work experience (proves employment history)
  // 3. Has current salary > 0 (indicates current employment)
  // 
  // Explicit failures (rejected, withdrawn) are excluded from success count
  const successfulPlacements = graduates.filter(candidate => {
    // Explicit failures - exclude from success
    if (candidate.status === "rejected" || candidate.status === "withdrawn") {
      return false
    }
    
    // Success criteria (any one qualifies)
    return candidate.status === "hired" || 
           (candidate.workExperiences && candidate.workExperiences.length > 0) ||
           (candidate.currentSalary !== null && candidate.currentSalary > 0)
  }).length
  
  const successRatio = (successfulPlacements / totalGraduates) * 100
  
  return {
    totalGraduates,
    successfulPlacements,
    successRatio: Math.round(successRatio * 10) / 10 // Round to 1 decimal place
  }
}

