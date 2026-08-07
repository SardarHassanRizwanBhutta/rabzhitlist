// Cold Caller Mode Type Definitions

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
  | 'preferences'

/** Call Notes View workflow stage (Phase 2+ wires backend) */
export type CallNotesStage =
  | 'draft'
  | 'submitting'
  | 'extracting'
  | 'review'
  | 'applying'
  | 'completed'
  | 'extractionError'
  | 'applyError'

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

export type PromptType = "basic" | "advanced" | "enrichment"

export interface GeneratedQuestion {
  question: string
  field: string               // Maps to EmptyField.apiFieldName
  section: FieldSection
  priority: number            // server-assigned; higher = ask first
  context: string             // Guidance for the interviewer
  /** From QG: `basic` | `advanced`. FE value cards may use `enrichment` locally. */
  promptType?: PromptType
  /**
   * FE-only: raw items for populated list value cards rendered as badges
   * (tech stacks, domains, technical aspects, client locations, etc.).
   */
  valueItems?: string[]
  /**
   * QG enum display labels (`options: string[]`). Call Notes renders read-only chips
   * under the stem when non-empty. Not the same as EmptyField.options (value/label pairs).
   */
  options?: string[]
}

/** Per-section question payload after mapping the Python API response. */
export interface ColdCallerSectionQuestions {
  section: FieldSection
  label: string
  missingFields: string[]
  questions: GeneratedQuestion[]
}

export interface CallNotesViewState {
  stage: CallNotesStage
  rawNotesDraft: string
  sessionId?: number
  selectedMappingIds: Set<number>
  unresolvedLookupCount: number
  extractionError?: string
  applyError?: string
}

// Section labels for display
export const SECTION_LABELS: Record<FieldSection, string> = {
  basic: 'Basic Information',
  workExperience: 'Work Experience',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
  techStacks: 'Independent Tech Stacks',
  preferences: 'Preferences',
}

// Section icons mapping
export const SECTION_ICONS: Record<FieldSection, string> = {
  basic: 'User',
  workExperience: 'Briefcase',
  education: 'GraduationCap',
  certifications: 'Award',
  achievements: 'Trophy',
  techStacks: 'Code',
  preferences: 'SlidersHorizontal',
}
