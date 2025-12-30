export type VerificationStatus = 
  | 'unverified'      // Default - not yet reviewed
  | 'verified'        // Confirmed accurate by human

export type DataSource = 
  | 'zoho'
  | 'resume_parse'
  | 'linkedin'
  | 'manual_entry'

export type EntityType = 'candidate' | 'project'

export interface FieldVerification {
  id: string
  entityId: string             // ID of the candidate or project
  entityType: EntityType       // Type of entity being verified
  candidateId?: string         // Deprecated: use entityId + entityType. Kept for backwards compatibility
  fieldName: string
  fieldPath?: string           // For nested fields: "workExperiences[0].jobTitle"
  currentValue: string | null
  status: VerificationStatus
  source: DataSource
  verifiedBy?: string          // User ID
  verifiedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface VerificationAuditLog {
  id: string
  verificationId: string       // Links to FieldVerification.id
  action: 'status_change' | 'value_update' | 'note_added' | 'source_change'
  oldStatus?: VerificationStatus
  newStatus?: VerificationStatus
  oldValue?: string
  newValue?: string
  changedBy: string            // User ID or 'system'
  changedByName: string        // Display name
  changedAt: Date
  reason?: string
}

export interface ConflictingSource {
  id: string
  verificationId: string
  source: DataSource
  sourceValue: string
  extractedAt: Date
}

export interface VerificationUser {
  id: string
  name: string
  role: 'admin' | 'hr' | 'manager' | 'system'
  email: string
}

// Verification summary for a candidate
export interface CandidateVerificationSummary {
  candidateId: string
  totalFields: number
  verifiedFields: number
  unverifiedFields: number
  verificationPercentage: number
  lastVerifiedAt?: Date
  lastVerifiedBy?: string
}

// Verification summary for a project
export interface ProjectVerificationSummary {
  projectId: string
  totalFields: number
  verifiedFields: number
  unverifiedFields: number
  verificationPercentage: number
  lastVerifiedAt?: Date
  lastVerifiedBy?: string
}

// Status colors for UI
export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, string> = {
  verified: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800",
  unverified: "text-red-500 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800",
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  verified: "Verified",
  unverified: "Unverified",
}

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  zoho: "Zoho CRM",
  resume_parse: "Resume Parse",
  linkedin: "LinkedIn",
  manual_entry: "Manual Entry",
}
