// Cold Caller Mode Type Definitions

import type { Candidate } from '@/lib/types/candidate'

export type InteractionMode = 'coldCaller' | 'interviewer' | 'l1' | 'l2'

export interface ModeConfig {
  label: string
  icon: string // Icon name from lucide-react
  description: string
  color: string
}

export const MODE_CONFIG: Record<InteractionMode, ModeConfig> = {
  coldCaller: {
    label: 'Cold Caller',
    icon: 'Phone',
    description: 'Initial data collection and verification',
    color: 'text-blue-600 dark:text-blue-400'
  },
  interviewer: {
    label: 'Interviewer',
    icon: 'MessageSquare',
    description: 'Technical interview questions',
    color: 'text-purple-600 dark:text-purple-400'
  },
  l1: {
    label: 'L1 Interview',
    icon: 'MessageCircle',
    description: 'Level 1 screening interview',
    color: 'text-green-600 dark:text-green-400'
  },
  l2: {
    label: 'L2 Interview',
    icon: 'Users',
    description: 'Level 2 deep dive interview',
    color: 'text-orange-600 dark:text-orange-400'
  }
}

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'multiselect' | 'benefits' | 'boolean' | 'textarea' | 'combobox'

export type FieldSection = 
  | 'basic' 
  | 'workExperience' 
  | 'education' 
  | 'certifications' 
  | 'achievements' 
  | 'techStacks'
  | 'projects'

// Field status for tracking progress during cold call
export type FieldStatus = 'pending' | 'answered' | 'skipped' | 'askLater'

// View mode for the cold caller dialog
export type ColdCallerViewMode = 'list' | 'focus'

export interface EmptyField {
  fieldPath: string           // e.g., "postingTitle", "workExperiences[0].shiftType"
  apiFieldName: string        // API format: "work_experience_0_benefits"
  fieldLabel: string          // Human-readable label
  fieldType: FieldType
  section: FieldSection
  context?: string            // Additional context (e.g., employer name)
  options?: { value: string; label: string }[]  // For select/multiselect/combobox
  currentValue: unknown
  parentIndex?: number        // Index for array fields (work experience, education, etc.)
  onCreateEntity?: 'project' | 'employer' | 'university' | 'certification'  // Which entity to create for combobox fields
}

// Extended field state with status tracking
export interface FieldState {
  field: EmptyField
  status: FieldStatus
  value: unknown
  note?: string               // Optional note for skipped/askLater
  question?: GeneratedQuestion // Linked question for this field
}

export interface GeneratedQuestion {
  question: string
  field: string               // Maps to EmptyField.apiFieldName
  category: string
  priority: number            // 1-5, higher = ask first
  context: string             // Guidance for the interviewer
}

export interface GenerateQuestionsRequest {
  candidate_id: string
  missing_fields: string[]
  candidate_data: Candidate
  conversation_context: InteractionMode | string
}

export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[]
  generated_at: string
  candidate_id: string
  total_questions: number
}

export interface ColdCallerState {
  isOpen: boolean
  emptyFields: EmptyField[]
  fieldStates: Map<string, FieldState>  // Map<fieldPath, FieldState>
  questionsMap: Map<string, GeneratedQuestion>  // Map<apiFieldName, Question>
  questions: GeneratedQuestion[]
  isLoadingQuestions: boolean
  questionsError: string | null
  expandedSections: Set<string>
  isSaving: boolean
  viewMode: ColdCallerViewMode
  focusIndex: number          // Current index in focus mode
}

// Section labels for display
export const SECTION_LABELS: Record<FieldSection, string> = {
  basic: 'Basic Information',
  workExperience: 'Work Experience',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
  techStacks: 'Tech Stacks',
  projects: 'Independent Projects',
}

// Section icons mapping
export const SECTION_ICONS: Record<FieldSection, string> = {
  basic: 'User',
  workExperience: 'Briefcase',
  education: 'GraduationCap',
  certifications: 'Award',
  achievements: 'Trophy',
  techStacks: 'Code',
  projects: 'FolderOpen',
}

// Status labels and colors
export const FIELD_STATUS_CONFIG: Record<FieldStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground', icon: 'Circle' },
  answered: { label: 'Answered', color: 'text-green-600', icon: 'CheckCircle' },
  skipped: { label: 'Skipped', color: 'text-gray-500', icon: 'SkipForward' },
  askLater: { label: 'Ask Later', color: 'text-amber-600', icon: 'Clock' },
}
