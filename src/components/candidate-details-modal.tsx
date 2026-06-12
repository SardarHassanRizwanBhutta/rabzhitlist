"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useRef, Fragment } from "react"
import { useRouter } from "next/navigation"
import { 
  ExternalLink, 
  Download, 
  Mail, 
  Phone, 
  Github, 
  Linkedin, 
  User, 
  Briefcase, 
  GraduationCap,
  Award,
  Building2,
  ChevronDown,
  ChevronRight,
  Code,
  FolderOpen,
  Globe,
  ShieldCheck,
  CheckCircle,
  Users,
  Pencil,
  Check,
  Save,
  X,
  Loader2,
  CalendarIcon,
  ChevronsUpDown,
  Headphones,
  Trash2,
  MessageSquare,
  MessageCircle
} from "lucide-react"

import {
  Candidate,
  Competition,
  Achievement,
  AchievementType,
  CandidateEducation,
  CandidateCertification,
  ProjectExperience,
  WorkExperience,
} from "@/lib/types/candidate"
import type { CertificationIssuer } from "@/lib/types/certification"
import {
  CertificationCombobox,
  type SelectedCertification,
} from "@/components/certification-combobox"
import {
  ProjectCombobox,
  type SelectedProject,
} from "@/components/project-combobox"
import {
  UniversityCombobox,
  type SelectedUniversity,
} from "@/components/university-combobox"
import {
  EmployerCombobox,
  type SelectedEmployer,
} from "@/components/employer-combobox"
import type { BuildCreateEmployerDtoOptions } from "@/lib/services/employers-api"
import { fetchEmployerById } from "@/lib/services/employers-api"
import type { ProjectLookups } from "@/components/project-creation-dialog"
import { fetchCertificationById } from "@/lib/services/certifications-lookup-api"
import { fetchProjectById } from "@/lib/services/projects-lookup-api"
import { fetchCertificationIssuers } from "@/lib/services/certifications-api"
import {
  ACHIEVEMENT_TYPE_DB,
  ACHIEVEMENT_TYPE_LABELS,
  CERTIFICATION_LEVEL_DB,
  CERTIFICATION_LEVEL_LABELS_DB,
  SHIFT_TYPE_DB,
  SHIFT_TYPE_LABELS,
  WORK_MODE_DB,
  WORK_MODE_LABELS,
  CANDIDATE_SOURCE_DB,
  CANDIDATE_SOURCE_LABELS,
  MBTI_TYPES,
  parseCandidateSource,
  type AchievementTypeDb,
  type CandidateSourceDb,
  type CertificationLevelDb,
  type MbtiType,
  type ShiftTypeDb,
  type WorkModeDb,
} from "@/lib/constants/candidate-enums"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { FieldHistoryPopover } from "@/components/ui/field-history-popover"
import { CandidateCreationDialog, CandidateFormData, VerificationState, type CandidateLookups } from "@/components/candidate-creation-dialog"
import {
  updateCandidate,
  candidateFormDataToUpdateDto,
  syncCandidateSubResources,
  prepareCandidateCreateLookups,
  // fetchCandidateDataProgress,
  fetchCandidateById,
  upsertCandidateCertification,
  updateCandidateEducation,
  updateCandidateWorkExperience,
  addWeTimeSupportZone,
  removeWeTimeSupportZone,
  upsertWeBenefit,
  removeWeBenefit,
  upsertCandidateProject,
  removeCandidateProject,
  upsertWeProject,
  removeWeProject,
} from "@/lib/services/candidates-api"
// import { CandidateDataProgressPanel } from "@/components/candidate-data-progress-panel"
// import type { CandidateDataProgressResponse } from "@/lib/types/candidate-data-progress"
import { fetchTechStacks, type LookupItem } from "@/lib/services/lookups-api"
import { fetchTimeSupportZones, createTimeSupportZone, fetchTags } from "@/lib/services/tags-timesupportzones-api"
import { fetchBenefits, createBenefit } from "@/lib/services/benefits-api"
import {
  fetchDegrees,
  fetchMajors,
  createDegree,
  createMajor,
  type DegreeDto,
  type MajorDto,
} from "@/lib/services/majors-degrees-api"
import { 
  getVerificationsForCandidate,
  calculateVerificationSummary,
  getAuditLogsForVerification,
  sampleVerificationUsers,
} from "@/lib/sample-data/verification"
import { toast } from "sonner"
import { ProjectCreationDialog, ProjectFormData } from "@/components/project-creation-dialog"
import { CertificationCreationDialog, CertificationFormData } from "@/components/certification-creation-dialog"
import { ColdCallerDialog } from "@/components/cold-caller"
import type { InteractionMode } from "@/types/cold-caller"
import { MODE_CONFIG } from "@/types/cold-caller"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { sampleProjects } from "@/lib/sample-data/projects"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { formatBenefitAmount } from "@/lib/utils/benefits"
import { formatYearsOfExperience, getTotalExperienceYears } from "@/lib/utils/candidate-experience"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { BenefitsSelector } from "@/components/ui/benefits-selector"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmployerBenefit, employerBenefitToApiValueFields } from "@/lib/types/benefits"

// Option interfaces and data for comboboxes
interface ComboboxOption {
  value: string
  label: string
}

// Shift type and work mode options (DB enum keys + display labels)
const shiftTypeSelectOptions: ComboboxOption[] = (
  Object.entries(SHIFT_TYPE_LABELS) as [ShiftTypeDb, string][]
).map(([value, label]) => ({ value, label }))

const workModeSelectOptions: ComboboxOption[] = (
  Object.entries(WORK_MODE_LABELS) as [WorkModeDb, string][]
).map(([value, label]) => ({ value, label }))

function enumIndex<T extends string>(arr: readonly T[], val: string): number | null {
  const i = arr.indexOf(val as T)
  return i >= 0 ? i : null
}

function shiftTypeToSelectValue(raw: string | null | undefined): string {
  if (!raw?.trim()) return ""
  const normalized = raw.trim().toLowerCase().replace(/[\s_-]/g, "")
  for (const t of SHIFT_TYPE_DB) {
    if (t.toLowerCase() === normalized) return t
  }
  const legacy: Record<string, ShiftTypeDb> = {
    morning: "day",
    day: "day",
    evening: "evening",
    night: "night",
    rotational: "rotational",
    "24x7": "flexible",
    flexible: "flexible",
    oncall: "onCall",
  }
  if (normalized in legacy) return legacy[normalized]
  for (const [value, label] of Object.entries(SHIFT_TYPE_LABELS) as [ShiftTypeDb, string][]) {
    if (label.toLowerCase().replace(/\s/g, "") === normalized) return value
  }
  return ""
}

function shiftTypeDisplayLabel(raw: string | null | undefined): string {
  const value = shiftTypeToSelectValue(raw)
  return value ? SHIFT_TYPE_LABELS[value as ShiftTypeDb] : "N/A"
}

function workModeToSelectValue(raw: string | null | undefined): string {
  if (!raw?.trim()) return ""
  const normalized = raw.trim().toLowerCase().replace(/[\s_-]/g, "")
  for (const t of WORK_MODE_DB) {
    if (t.toLowerCase() === normalized) return t
  }
  for (const [value, label] of Object.entries(WORK_MODE_LABELS) as [WorkModeDb, string][]) {
    if (label.toLowerCase() === normalized) return value
  }
  return ""
}

function workModeDisplayLabel(raw: string | null | undefined): string {
  const value = workModeToSelectValue(raw)
  return value ? WORK_MODE_LABELS[value as WorkModeDb] : "N/A"
}

const candidateSourceSelectOptions: ComboboxOption[] = CANDIDATE_SOURCE_DB.map((key) => ({
  value: key,
  label: CANDIDATE_SOURCE_LABELS[key],
}))

/** Labels match DB enum `mbti_type` (four-letter codes only). */
const personalityTypeSelectOptions: ComboboxOption[] = MBTI_TYPES.map((t) => ({
  value: t,
  label: t,
}))

function candidateSourceToSelectValue(raw: string | null | undefined): string {
  return parseCandidateSource(raw ?? undefined)
}

function candidateSourceDisplayLabel(raw: string | null | undefined): string {
  const value = candidateSourceToSelectValue(raw)
  return value ? CANDIDATE_SOURCE_LABELS[value as CandidateSourceDb] : "N/A"
}

function personalityTypeToSelectValue(raw: string | null | undefined): string {
  if (!raw?.trim()) return ""
  const upper = raw.trim().toUpperCase()
  return MBTI_TYPES.includes(upper as MbtiType) ? upper : ""
}

const achievementTypeSelectOptions: ComboboxOption[] = (
  Object.entries(ACHIEVEMENT_TYPE_LABELS) as [AchievementTypeDb, string][]
).map(([value, label]) => ({ value, label }))

function achievementTypeToSelectValue(raw: string | undefined): AchievementType {
  if (!raw) return "competition"
  const normalized = raw.toLowerCase().replace(/[-_\s]/g, "")
  for (const t of ACHIEVEMENT_TYPE_DB) {
    if (t.toLowerCase() === normalized) return t
  }
  for (const [value, label] of Object.entries(ACHIEVEMENT_TYPE_LABELS) as [AchievementTypeDb, string][]) {
    if (label.toLowerCase().replace(/\s/g, "") === normalized) return value
  }
  return "other"
}

function achievementTypeDisplayLabel(raw: string | undefined): string {
  return ACHIEVEMENT_TYPE_LABELS[achievementTypeToSelectValue(raw)]
}

const certificationLevelSelectOptions: ComboboxOption[] = (
  Object.entries(CERTIFICATION_LEVEL_LABELS_DB) as [CertificationLevelDb, string][]
).map(([value, label]) => ({ value, label }))

function certificationLevelToSelectValue(raw: string | null | undefined): string {
  if (!raw) return ""
  const normalized = raw.toLowerCase()
  for (const t of CERTIFICATION_LEVEL_DB) {
    if (t.toLowerCase() === normalized) return t
  }
  for (const [value, label] of Object.entries(CERTIFICATION_LEVEL_LABELS_DB) as [
    CertificationLevelDb,
    string,
  ][]) {
    if (label.toLowerCase() === normalized) return value
  }
  return ""
}

function certificationLevelDisplayLabel(raw: string | null | undefined): string {
  const value = certificationLevelToSelectValue(raw)
  return value ? CERTIFICATION_LEVEL_LABELS_DB[value as CertificationLevelDb] : "N/A"
}

// Extract unique degree names from sample candidates
const extractUniqueDegreeNames = (): ComboboxOption[] => {
  const degrees = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.educations?.forEach(education => {
      if (education.degreeName) {
        degrees.add(education.degreeName)
      }
    })
  })
  return Array.from(degrees).sort().map(degree => ({
    label: degree,
    value: degree
  }))
}

// Extract unique major names from sample candidates
const extractUniqueMajorNames = (): ComboboxOption[] => {
  const majors = new Set<string>()
  sampleCandidates.forEach(candidate => {
    candidate.educations?.forEach(education => {
      if (education.majorName) {
        majors.add(education.majorName)
      }
    })
  })
  return Array.from(majors).sort().map(major => ({
    label: major,
    value: major
  }))
}

function mergeNamedComboboxOptions(
  catalog: { name: string }[],
  fallbackOptions: ComboboxOption[],
  selectedNames: Iterable<string>
): ComboboxOption[] {
  const byKey = new Map<string, ComboboxOption>()
  for (const item of catalog) {
    const n = item.name?.trim()
    if (!n) continue
    byKey.set(n.toLowerCase(), { value: n, label: n })
  }
  for (const option of fallbackOptions) {
    byKey.set(option.value.toLowerCase(), option)
  }
  for (const raw of selectedNames) {
    const n = raw?.trim()
    if (!n) continue
    const key = n.toLowerCase()
    if (!byKey.has(key)) byKey.set(key, { value: n, label: n })
  }
  return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label))
}
// Base options (extracted from sample data)
const baseDegreeOptions: ComboboxOption[] = extractUniqueDegreeNames()
const baseMajorOptions: ComboboxOption[] = extractUniqueMajorNames()

// Base project options
const baseProjectOptions: ComboboxOption[] = sampleProjects.map(project => ({
  label: project.projectName,
  value: project.projectName
}))

// TODO: Populate from API
const baseCertificationOptions: ComboboxOption[] = []

// Extract unique tech stacks from sample projects and candidates
const extractUniqueTechStacks = (): MultiSelectOption[] => {
  const techStacks = new Set<string>()
  // From projects
  sampleProjects.forEach(project => {
    project.techStacks.forEach(tech => techStacks.add(tech))
  })
  // From candidates
  sampleCandidates.forEach(candidate => {
    candidate.techStacks?.forEach(tech => techStacks.add(tech))
    candidate.workExperiences?.forEach(exp => {
      exp.techStacks.forEach(tech => techStacks.add(tech))
    })
  })
  return Array.from(techStacks).sort().map(tech => ({
    value: tech,
    label: tech
  }))
}

function normalizeMultiSelectKey(value: string): string {
  return value.trim().toLowerCase()
}

function findMultiSelectOptionMatch(
  name: string,
  options: MultiSelectOption[]
): MultiSelectOption | undefined {
  const key = normalizeMultiSelectKey(name)
  return options.find(
    (o) =>
      normalizeMultiSelectKey(o.value) === key ||
      normalizeMultiSelectKey(o.label) === key
  )
}

/** Union catalog options with names already on the candidate so MultiSelect can show them as selected. */
function mergeMultiSelectOptions(
  options: MultiSelectOption[],
  selectedNames: Iterable<string>
): MultiSelectOption[] {
  const byKey = new Map<string, MultiSelectOption>()
  for (const o of options) {
    const k = normalizeMultiSelectKey(o.value)
    if (k) byKey.set(k, o)
  }
  for (const raw of selectedNames) {
    const trimmed = raw?.trim()
    if (!trimmed) continue
    const key = normalizeMultiSelectKey(trimmed)
    if (byKey.has(key)) continue
    const existing = findMultiSelectOptionMatch(trimmed, options)
    if (existing) {
      byKey.set(normalizeMultiSelectKey(existing.value), existing)
      continue
    }
    byKey.set(key, { value: trimmed, label: trimmed })
  }
  return Array.from(byKey.values()).sort((a, b) => a.label.localeCompare(b.label))
}

/** Map stored names to option `value` strings so MultiSelect pre-selects correctly. */
function resolveMultiSelectValues(
  selected: string[],
  options: MultiSelectOption[]
): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of selected) {
    const trimmed = raw?.trim()
    if (!trimmed) continue
    const match = findMultiSelectOptionMatch(trimmed, options)
    const resolved = match?.value ?? trimmed
    const key = normalizeMultiSelectKey(resolved)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(resolved)
  }
  return result
}

function collectCandidateTechStackNames(candidate: Candidate | null | undefined): string[] {
  const names = new Set<string>()
  candidate?.techStacks?.forEach((t) => {
    if (t?.trim()) names.add(t.trim())
  })
  candidate?.workExperiences?.forEach((we) => {
    we.techStacks?.forEach((t) => {
      if (t?.trim()) names.add(t.trim())
    })
  })
  return Array.from(names)
}

function collectWorkExperienceTimeSupportZoneNames(
  candidate: Candidate | null | undefined
): string[] {
  const names = new Set<string>()
  candidate?.workExperiences?.forEach((we) => {
    we.timeSupportZones?.forEach((z) => {
      if (z?.trim()) names.add(z.trim())
    })
  })
  return Array.from(names)
}

// Extract unique horizontal domains from sample projects
const extractUniqueHorizontalDomains = (): MultiSelectOption[] => {
  const domains = new Set<string>()
  sampleProjects.forEach(project => {
    project.horizontalDomains.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort().map(domain => ({
    label: domain,
    value: domain
  }))
}

// Base tech stack options
const baseTechStackOptions: MultiSelectOption[] = extractUniqueTechStacks()

interface CandidateDetailsModalProps {
  candidate: Candidate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Refetch candidates list after mutations so table progress stays in sync. */
  onCandidateUpdated?: () => void
}

const normalizeKey = (value: string) => value.trim().toLowerCase()

const DomainBadges = ({
  projectName,
  verticalDomains,
  horizontalDomains,
  teamSize,
  maxDisplay = 3,
}: {
  projectName: string
  verticalDomains: string[]
  horizontalDomains: string[]
  teamSize?: string | null
  maxDisplay?: number
}) => {
  const hasVertical = verticalDomains.length > 0
  const hasHorizontal = horizontalDomains.length > 0
  const hasTeamSize = teamSize !== null && teamSize !== undefined

  if (!hasVertical && !hasHorizontal && !hasTeamSize) return null

  const renderGroup = (domains: string[], type: "vertical" | "horizontal") => {
    const visible = domains.slice(0, maxDisplay)
    const remaining = domains.slice(maxDisplay)
    const moreCount = remaining.length

    const baseClass =
      type === "vertical"
        ? "bg-teal-100 text-teal-700 border border-teal-300 dark:bg-teal-950/30 dark:text-teal-200 dark:border-teal-800"
        : "bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-800"

    return (
      <>
        {visible.map((d) => (
          <span
            key={`${type}-${d}`}
            className={`text-xs px-2 py-1 rounded-md ${baseClass}`}
          >
            {d}
          </span>
        ))}
        {moreCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700"
                aria-label={`Show ${moreCount} more ${type} domains for ${projectName}`}
              >
                +{moreCount} more
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6} className="max-w-xs">
              <div className="space-y-1">
                <div className="font-medium">
                  {type === "vertical" ? "Vertical Domains" : "Horizontal Domains"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {remaining.map((d) => (
                    <span key={`${type}-remaining-${d}`} className="px-1.5 py-0.5 rounded bg-background/20">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </>
    )
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 mt-2"
      aria-label={`Project domains and team size for ${projectName}`}
    >
      {hasVertical && renderGroup(verticalDomains, "vertical")}
      {hasVertical && hasHorizontal && (
        <span className="mx-2 text-muted-foreground" aria-hidden="true">
          •
        </span>
      )}
      {hasHorizontal && renderGroup(horizontalDomains, "horizontal")}
      {(hasVertical || hasHorizontal) && hasTeamSize && (
        <span className="mx-2 text-muted-foreground" aria-hidden="true">
          •
        </span>
      )}
      {hasTeamSize && (
        <span className="text-xs px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-800 flex items-center gap-1">
          <Users className="size-3" />
          {teamSize}
        </span>
      )}
    </div>
  )
}



// InlineEditableTextarea component for long text fields (like contribution)
interface InlineEditableTextareaProps {
  label?: string
  value: string | null | undefined
  fieldName: string
  onSave: (fieldName: string, newValue: string, shouldVerify: boolean) => Promise<void>
  maxLength?: number
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
}

const InlineEditableTextarea: React.FC<InlineEditableTextareaProps> = ({
  label,
  value,
  fieldName,
  onSave,
  maxLength = 100,
  verificationIndicator,
  getFieldVerification,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '')
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || ''
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Shift+Enter for new lines, but Ctrl/Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const displayText = value || ''
  const shouldTruncate = displayText.length > maxLength
  const truncatedText = shouldTruncate && !isExpanded 
    ? `${displayText.slice(0, maxLength)}...` 
    : displayText

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        )}
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn("min-h-[80px] resize-none text-sm", error && "border-red-500")}
            autoFocus
            disabled={isSaving}
            placeholder="Describe your key contributions, achievements, and responsibilities in this project..."
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Mark as verified checkbox - only in edit mode */}
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
              )}
            >
              {willVerify ? '✓ Verified' : 'Mark as verified'}
            </Label>
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  if (!displayText) {
    return (
      <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
        <div className="flex-1 min-w-0">
          {label ? (
            <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
          ) : null}
          <span className="text-sm text-muted-foreground italic block">N/A</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {verificationIndicator}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title={label ? `Edit ${label.toLowerCase()}` : "Edit"}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{truncatedText}</p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:underline mt-1 font-medium transition-colors cursor-pointer"
            type="button"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      {/* Three badges: Verification, History, Edit */}
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        {/* Edit Icon Badge - Always visible for quick access */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title="Edit contribution"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// InlineEditableCombobox component for dropdown/combobox fields
interface InlineEditableComboboxProps {
  label: string
  value: string
  fieldName: string
  options: ComboboxOption[]
  onSave: (fieldName: string, newValue: string, shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  renderDisplay?: (displayValue: string, value: string) => React.ReactNode
  creatable?: boolean
  createLabel?: string
  onCreateNew?: (searchValue: string) => void
  onCreateDialog?: (searchValue: string) => void
  catalogOptions?: ComboboxOption[]
  optionsLoading?: boolean
}

const InlineEditableCombobox: React.FC<InlineEditableComboboxProps> = ({
  label,
  value,
  fieldName,
  options,
  onSave,
  verificationIndicator,
  getFieldVerification,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className = "",
  renderDisplay,
  creatable = false,
  createLabel,
  onCreateNew,
  onCreateDialog,
  catalogOptions,
  optionsLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '')
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
    setOpen(false)
    setSearchValue("")
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || ''
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
      setIsEditing(false)
      setOpen(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
      setOpen(false)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleValueChange = (newValue: string) => {
    setEditValue(newValue)
    setOpen(false)
    setSearchValue("")
  }

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) return options
    const searchLower = searchValue.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower)
    )
  }, [options, searchValue])

  const existenceSource = catalogOptions ?? options

  // Check if search value already exists in catalog
  const searchValueExists = useMemo(() => {
    if (!searchValue.trim()) return false
    const searchLower = searchValue.trim().toLowerCase()
    const existsInSource = existenceSource.some(option => 
      option.value.toLowerCase() === searchLower ||
      option.label.toLowerCase() === searchLower
    )
    if (catalogOptions) return existsInSource
    return (
      existsInSource ||
      (!!value?.trim() && value.trim().toLowerCase() === searchLower)
    )
  }, [catalogOptions, existenceSource, value, searchValue])

  // Check if we should show "Create" option
  const shouldShowCreate = creatable && 
    searchValue.trim().length >= 2 && 
    !searchValueExists && 
    (catalogOptions != null || filteredOptions.length === 0)

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(searchValue.trim())
      setSearchValue("")
      setOpen(false)
    } else if (onCreateDialog) {
      onCreateDialog(searchValue.trim())
      setSearchValue("")
      setOpen(false)
    }
  }

  const displayValue = value 
    ? (options.find(opt => opt.value === value)?.label || value)
    : 'N/A'

  // Display mode - check if custom renderer is provided
  if (!isEditing && renderDisplay) {
    return (
      <div className={cn("flex items-center justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
        <div className="flex-1 min-w-0">
          {label && (
            <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
          )}
          {renderDisplay(displayValue, value)}
        </div>
        {/* Three badges: Verification, History, Edit */}
        <div className="flex items-center gap-1 shrink-0">
          {verificationIndicator}
          {/* Edit Icon Badge - Always visible for quick access */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <div className="space-y-2">
          <Popover open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (isOpen && editValue?.trim() && !options.some((o) => o.value === editValue)) {
              setSearchValue(editValue.trim())
            } else if (!isOpen) {
              setSearchValue("")
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={isSaving || optionsLoading}
              >
                {editValue
                  ? (options.find((option) => option.value === editValue)?.label ?? editValue)
                  : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              onWheel={(e) => e.stopPropagation()}
            >
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder={searchPlaceholder} 
                  className="h-9"
                  value={searchValue}
                  onValueChange={setSearchValue}
                  onKeyDown={(e) => {
                    if (creatable && e.key === "Enter" && shouldShowCreate) {
                      e.preventDefault()
                      handleCreateNew()
                    }
                  }}
                />
                <CommandList>
                  {shouldShowCreate ? (
                    <>
                      <CommandEmpty>
                        <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                          {emptyMessage}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value={searchValue}
                          onSelect={handleCreateNew}
                          className="cursor-pointer font-medium text-primary border-t border-border"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {createLabel 
                            ? (searchValue.trim() ? `Create "${searchValue.trim()}"` : createLabel)
                            : `Add "${searchValue.trim()}"`}
                        </CommandItem>
                      </CommandGroup>
                    </>
                  ) : filteredOptions.length === 0 ? (
                    <CommandEmpty>
                      {optionsLoading ? "Loading options…" : emptyMessage}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => handleValueChange(option.value)}
                          className="cursor-pointer"
                        >
                          {option.label}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              editValue === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Mark as verified checkbox - only in edit mode */}
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
              )}
            >
              {willVerify ? '✓ Verified' : 'Mark as verified'}
            </Label>
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex-1 min-w-0">
        {label && (
          <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
        )}
        {renderDisplay ? (
          renderDisplay(displayValue, value)
        ) : (
          <span className={`text-sm block ${!value ? 'text-muted-foreground italic' : ''}`}>
            {displayValue}
          </span>
        )}
      </div>
      {/* Three badges: Verification, History, Edit */}
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        {/* Edit Icon Badge - Always visible for quick access */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title={`Edit ${label.toLowerCase()}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// InlineEditableDate component for date fields
interface InlineEditableDateProps {
  label: string
  value: Date | undefined
  fieldName: string
  onSave: (fieldName: string, newValue: Date | undefined, shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  formatDisplay: (date: Date | undefined) => string
  className?: string
  mode?: 'date' | 'month' // For education dates (month/year only)
}

const InlineEditableDate: React.FC<InlineEditableDateProps> = ({
  label,
  value,
  fieldName,
  onSave,
  verificationIndicator,
  getFieldVerification,
  formatDisplay,
  className = "",
  mode = 'date'
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<Date | undefined>(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [open, setOpen] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
    setError(null)
    setOpen(false)
  }

  const handleSave = async () => {
    // No change check
    const verificationChanged = willVerify !== isCurrentlyVerified
    const dateChanged = editValue?.getTime() !== value?.getTime()
    if (!dateChanged && !verificationChanged) {
      setIsEditing(false)
      setOpen(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
      setOpen(false)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayValue = formatDisplay(value)

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <div className="space-y-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal"
                disabled={isSaving}
              >
                {editValue ? (
                  mode === 'month' 
                    ? editValue.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : editValue.toLocaleDateString()
                ) : (
                  `Select ${label.toLowerCase()}`
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={editValue}
                onSelect={(date) => {
                  setEditValue(date)
                  setOpen(false)
                }}
                captionLayout={mode === 'month' ? "dropdown" : "dropdown"}
                disabled={isSaving}
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Mark as verified checkbox - only in edit mode */}
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
              )}
            >
              {willVerify ? '✓ Verified' : 'Mark as verified'}
            </Label>
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
        <span className={`text-sm block ${!value ? 'text-muted-foreground italic' : ''}`}>
          {displayValue}
        </span>
      </div>
      {/* Three badges: Verification, History, Edit */}
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        {/* Edit Icon Badge - Always visible for quick access */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title={`Edit ${label.toLowerCase()}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// InlineEditableMultiSelect component for tech stacks
interface InlineEditableMultiSelectProps {
  label: string
  value: string[]
  fieldName: string
  options: MultiSelectOption[]
  onSave: (fieldName: string, newValue: string[], shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
  placeholder?: string
  searchPlaceholder?: string
  badgeColorClass?: string
  maxDisplay?: number
  creatable?: boolean
  createLabel?: string
  onCreateNew?: (value: string) => void
}

const InlineEditableMultiSelect: React.FC<InlineEditableMultiSelectProps> = ({
  label,
  value,
  fieldName,
  options,
  onSave,
  verificationIndicator,
  getFieldVerification,
  className = "",
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  badgeColorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  maxDisplay = 5,
  creatable = false,
  createLabel,
  onCreateNew
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string[]>(value || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const mergedOptions = useMemo(
    () => mergeMultiSelectOptions(options, value ?? []),
    [options, value]
  )

  const resolvedValue = useMemo(
    () => resolveMultiSelectValues(value ?? [], mergedOptions),
    [value, mergedOptions]
  )

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(resolvedValue)
    }
  }, [resolvedValue, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(resolveMultiSelectValues(value ?? [], mergedOptions))
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(resolvedValue)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const verificationChanged = willVerify !== isCurrentlyVerified
    const currentResolved = resolveMultiSelectValues(value ?? [], mergedOptions)
    const arraysEqual =
      currentResolved.length === editValue.length &&
      currentResolved.every((val) =>
        editValue.some(
          (e) => normalizeMultiSelectKey(e) === normalizeMultiSelectKey(val)
        )
      )
    
    if (arraysEqual && !verificationChanged) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayItems = value || []
  const shouldTruncate = displayItems.length > maxDisplay
  const displayItemsToShow = shouldTruncate && !isExpanded 
    ? displayItems.slice(0, maxDisplay)
    : displayItems
  const remainingCount = shouldTruncate && !isExpanded 
    ? displayItems.length - maxDisplay
    : 0

  if (isEditing) {
    return (
      <div className={cn("space-y-3 py-3 px-3 rounded-md bg-muted/30 border", className)}>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        </div>
        <div className="space-y-3">
          <div className="w-full">
            <MultiSelect
              items={mergedOptions}
              selected={editValue}
              onChange={(values) => setEditValue(values)}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              maxDisplay={maxDisplay}
              creatable={creatable}
              createLabel={createLabel}
              onCreateNew={onCreateNew}
            />
          </div>
          
          {/* Mark as verified checkbox */}
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
              )}
            >
              {willVerify ? '✓ Verified' : 'Mark as verified'}
            </Label>
          </div>
          
          <div className="flex gap-1 shrink-0">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {verificationIndicator}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {displayItems.length > 0 ? (
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {displayItemsToShow.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className={cn(badgeColorClass, "text-xs")}
            >
              {item}
            </Badge>
          ))}
          {remainingCount > 0 && !isExpanded && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsExpanded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsExpanded(true)
                }
              }}
            >
              +{remainingCount} more
            </Badge>
          )}
          {isExpanded && shouldTruncate && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsExpanded(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsExpanded(false)
                }
              }}
            >
              Show less
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No items selected</p>
      )}
    </div>
  )
}

// InlineEditableBenefits component for benefits
interface InlineEditableBenefitsProps {
  label: string
  value: EmployerBenefit[]
  fieldName: string
  onSave: (fieldName: string, newValue: EmployerBenefit[], shouldVerify: boolean) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  benefitOptions?: { id: number; name: string }[]
  onCreateBenefit?: (name: string) => Promise<EmployerBenefit | null | void>
  benefitsLoading?: boolean
  className?: string
  maxDisplay?: number
}

const InlineEditableBenefits: React.FC<InlineEditableBenefitsProps> = ({
  label,
  value,
  fieldName,
  onSave,
  verificationIndicator,
  getFieldVerification,
  benefitOptions = [],
  onCreateBenefit,
  benefitsLoading = false,
  className = "",
  maxDisplay = 4
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<EmployerBenefit[]>(value || [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || [])
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value || [])
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // No change check
    const currentValue = value || []
    const verificationChanged = willVerify !== isCurrentlyVerified
    const arraysEqual = currentValue.length === editValue.length && 
      currentValue.every((val, idx) => 
        val.id === editValue[idx]?.id && 
        val.name === editValue[idx]?.name &&
        val.hasValue === editValue[idx]?.hasValue &&
        val.amount === editValue[idx]?.amount &&
        val.unit === editValue[idx]?.unit
      )
    
    if (arraysEqual && !verificationChanged) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const displayItems = value || []
  const shouldTruncate = displayItems.length > maxDisplay
  const displayItemsToShow = shouldTruncate && !isExpanded 
    ? displayItems.slice(0, maxDisplay)
    : displayItems
  const remainingCount = shouldTruncate && !isExpanded 
    ? displayItems.length - maxDisplay
    : 0

  if (isEditing) {
    return (
      <div className={cn("space-y-3 py-3 px-3 rounded-md bg-muted/30 border", className)}>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
        </div>
        <div className="space-y-3">
          <div className="w-full">
            <BenefitsSelector
              benefits={editValue}
              onChange={(benefits) => setEditValue(benefits)}
              benefitOptions={benefitOptions}
              onCreateBenefit={onCreateBenefit}
              disabled={isSaving || benefitsLoading}
            />
          </div>
          
          {/* Mark as verified checkbox */}
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label 
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
              )}
            >
              {willVerify ? '✓ Verified' : 'Mark as verified'}
            </Label>
          </div>
          
          <div className="flex gap-1 shrink-0">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {verificationIndicator}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {displayItems.length > 0 ? (
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {displayItemsToShow.map((benefit, index) => (
            <Badge 
              key={benefit.id || index} 
              variant="outline" 
              className="text-xs bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800"
            >
              {benefit.name}
              {benefit.hasValue && benefit.amount != null && benefit.unit && (
                <span className="ml-1 font-semibold">
                  : {formatBenefitAmount(benefit.amount, benefit.unit)}
                </span>
              )}
            </Badge>
          ))}
          {remainingCount > 0 && !isExpanded && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsExpanded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsExpanded(true)
                }
              }}
            >
              +{remainingCount} more
            </Badge>
          )}
          {isExpanded && shouldTruncate && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => setIsExpanded(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsExpanded(false)
                }
              }}
            >
              Show less
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">No benefits selected</p>
      )}
    </div>
  )
}

// Validation functions
const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Invalid email format'
  }
  return null
}

const validateURL = (url: string): string | null => {
  if (!url || url.trim() === '') return null // Optional field
  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL format'
  }
}

const validateLinkedInURL = (url: string): string | null => {
  if (!url || url.trim() === '') return null
  if (!url.includes('linkedin.com')) {
    return 'Must be a LinkedIn URL'
  }
  return validateURL(url)
}

const validateGitHubURL = (url: string): string | null => {
  if (!url || url.trim() === '') return null
  if (!url.includes('github.com')) {
    return 'Must be a GitHub URL'
  }
  return validateURL(url)
}

function VisitUrlButton({ url, label }: { url: string | null | undefined; label: string }) {
  if (!url?.trim()) return null
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.open(url.trim(), "_blank")}
      className="h-7 text-xs"
    >
      <ExternalLink className="h-3 w-3 mr-1" />
      {label}
    </Button>
  )
}

const validateCNIC = (cnic: string): string | null => {
  if (!cnic || cnic.trim() === '') return 'CNIC is required'
  const cnicRegex = /^\d{5}-\d{7}-\d$/
  if (!cnicRegex.test(cnic.trim())) {
    return 'CNIC format: 12345-1234567-1'
  }
  return null
}

const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') return 'Contact number is required'
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  if (!phoneRegex.test(phone)) {
    return 'Invalid phone number format'
  }
  const digitsOnly = phone.replace(/\D/g, '')
  if (digitsOnly.length < 10) {
    return 'Phone number must be at least 10 digits'
  }
  return null
}

const validateSalary = (salary: string): string | null => {
  if (!salary || salary.trim() === '') return null // Optional field
  const num = Number(salary)
  if (isNaN(num)) return 'Must be a valid number'
  if (num < 0) return 'Salary cannot be negative'
  if (num > 10000000) return 'Salary seems too high'
  return null
}

const validateName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'Name is required'
  if (name.trim().length < 2) return 'Name must be at least 2 characters'
  if (name.trim().length > 100) return 'Name is too long'
  return null
}

function isInlineFieldValueEmpty(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true
  return String(value).trim() === ''
}

function formatInlineFieldDisplayValue(value: string | number | null | undefined): string {
  if (isInlineFieldValueEmpty(value)) return 'N/A'
  return String(value)
}

const RESUME_FILE_ACCEPT = ".pdf,.doc,.docx"

function getResumeFileName(resumeUrl: string | null | undefined): string | null {
  if (!resumeUrl?.trim()) return null
  try {
    const pathname = new URL(resumeUrl, "https://placeholder.local").pathname
    const name = pathname.split("/").filter(Boolean).pop()
    return name ? decodeURIComponent(name) : resumeUrl.trim()
  } catch {
    const name = resumeUrl.split(/[/\\]/).filter(Boolean).pop()
    return name ? decodeURIComponent(name) : resumeUrl.trim()
  }
}

interface InlineEditableResumeProps {
  label?: string
  resumeUrl: string | null | undefined
  fieldName: string
  onSave: (payload: { file: File | null; clearExisting: boolean; shouldVerify: boolean }) => Promise<void>
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
}

const InlineEditableResume: React.FC<InlineEditableResumeProps> = ({
  label = "Resume",
  resumeUrl,
  fieldName,
  onSave,
  verificationIndicator,
  getFieldVerification,
  className = "",
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [existingRemoved, setExistingRemoved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'
  const existingFileName = getResumeFileName(resumeUrl)
  const hasExistingResume = !!existingFileName && !existingRemoved

  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const resetEditState = () => {
    setResumeFile(null)
    setExistingRemoved(false)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleEdit = () => {
    resetEditState()
    setWillVerify(isCurrentlyVerified)
    setIsEditing(true)
  }

  const handleCancel = () => {
    resetEditState()
    setWillVerify(isCurrentlyVerified)
    setIsEditing(false)
  }

  const handleSave = async () => {
    const verificationChanged = willVerify !== isCurrentlyVerified
    const hasNewFile = resumeFile != null
    const clearedExisting = existingRemoved && !!existingFileName

    if (!hasNewFile && !clearedExisting && !verificationChanged) {
      setIsEditing(false)
      return
    }

    if (!hasNewFile && !clearedExisting && !existingFileName && verificationChanged) {
      setError("Select a resume file to upload.")
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        file: resumeFile,
        clearExisting: clearedExisting,
        shouldVerify: willVerify,
      })
      setIsEditing(false)
      resetEditState()
      setError(null)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveSelectedFile = () => {
    setResumeFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveExistingResume = () => {
    setExistingRemoved(true)
    setResumeFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-2 py-2 px-3 rounded-md", className)}>
        <Label htmlFor={`${fieldName}-resume-upload`} className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        {resumeFile ? (
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate" title={resumeFile.name}>
                {resumeFile.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                ({(resumeFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveSelectedFile}
              disabled={isSaving}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : hasExistingResume ? (
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate" title={existingFileName ?? undefined}>
                {existingFileName}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveExistingResume}
              disabled={isSaving}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              id={`${fieldName}-resume-upload`}
              type="file"
              ref={fileInputRef}
              accept={RESUME_FILE_ACCEPT}
              disabled={isSaving}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setResumeFile(file)
                  setError(null)
                }
              }}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, DOC, DOCX
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0"
            title={willVerify ? "Save & Verify" : "Save"}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 pl-1">
          <Checkbox
            id={`verify-${fieldName}`}
            checked={willVerify}
            onCheckedChange={(checked) => setWillVerify(checked as boolean)}
            disabled={isSaving}
            className="h-4 w-4"
          />
          <Label
            htmlFor={`verify-${fieldName}`}
            className={cn(
              "text-xs cursor-pointer",
              willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
            )}
          >
            {willVerify ? '✓ Verified' : 'Mark as verified'}
          </Label>
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
        {existingFileName ? (
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            {resumeUrl?.trim() ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate"
                title={existingFileName}
              >
                {existingFileName}
              </a>
            ) : (
              <span className="text-sm truncate">{existingFileName}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground italic block">N/A</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        {resumeUrl?.trim() ? (
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" title="Download resume">
              <Download className="w-3.5 h-3.5" />
            </a>
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title="Edit resume"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// InlineEditableField component with edit + verification
interface InlineEditableFieldProps {
  label: string
  value: string | number | null | undefined
  fieldName: string
  fieldType?: 'text' | 'email' | 'url' | 'number'
  validation?: (value: string) => string | null
  onSave: (fieldName: string, newValue: string | number, shouldVerify: boolean) => Promise<void>
  formatDisplay?: (value: string | number | null | undefined) => string
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
}

const InlineEditableField: React.FC<InlineEditableFieldProps> = ({
  label,
  value,
  fieldName,
  fieldType = 'text',
  validation,
  onSave,
  formatDisplay,
  verificationIndicator,
  getFieldVerification,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value !== null && value !== undefined ? String(value) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)

  // Get current verification status
  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'

  // Update editValue when value prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value !== null && value !== undefined ? String(value) : '')
    }
  }, [value, isEditing])

  // Initialize willVerify based on current verification status when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(isCurrentlyVerified) // Initialize checkbox to current verification status
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value !== null && value !== undefined ? String(value) : '')
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    // Validate
    if (validation) {
      const validationError = validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // No change check
    const currentValue = value !== null && value !== undefined ? String(value) : ''
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
      setIsEditing(false)
      return
    }

    // Save
    setIsSaving(true)
    try {
      const newValue = fieldType === 'number' ? Number(editValue) : editValue
      await onSave(fieldName, newValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const displayValue = formatDisplay 
    ? (isInlineFieldValueEmpty(value) ? 'N/A' : formatDisplay(value))
    : formatInlineFieldDisplayValue(value)

  return (
    <div className={cn("flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
              <Input
                type={fieldType}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn("text-sm", error && "border-red-500")}
                autoFocus
                disabled={isSaving}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0 shrink-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0 shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {/* Mark as verified checkbox - only in edit mode */}
            <div className="flex items-center gap-2 pl-1">
              <Checkbox
                id={`verify-${fieldName}`}
                checked={willVerify}
                onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label 
                htmlFor={`verify-${fieldName}`}
                className={cn(
                  "text-xs cursor-pointer",
                  willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                )}
              >
                {willVerify ? '✓ Verified' : 'Mark as verified'}
              </Label>
            </div>
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between group w-full">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
              <span className={`text-sm block ${isInlineFieldValueEmpty(value) ? 'text-muted-foreground italic' : ''}`}>
                {displayValue}
              </span>
            </div>
            {/* Three badges: Verification, History, Edit */}
            <div className="flex items-center gap-1 shrink-0">
              {verificationIndicator}
              {/* Edit Icon Badge - Always visible for quick access */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                type="button"
                title="Edit field"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface InlineEditableSelectProps {
  label: string
  value: string | null | undefined
  fieldName: string
  options: ComboboxOption[]
  onSave: (fieldName: string, newValue: string, shouldVerify: boolean) => Promise<void>
  normalizeValue?: (raw: string | undefined) => string
  formatDisplay?: (value: string | null | undefined) => string
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
}

const InlineEditableSelect: React.FC<InlineEditableSelectProps> = ({
  label,
  value,
  fieldName,
  options,
  onSave,
  normalizeValue = (raw) => raw ?? "",
  formatDisplay,
  verificationIndicator,
  getFieldVerification,
  className = "",
}) => {
  const resolvedValue = normalizeValue(value ?? undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(resolvedValue)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)

  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === "verified"

  useEffect(() => {
    if (!isEditing) {
      setEditValue(normalizeValue(value ?? undefined))
    }
  }, [value, isEditing, normalizeValue])

  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(normalizeValue(value ?? undefined))
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(normalizeValue(value ?? undefined))
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    const currentValue = normalizeValue(value ?? undefined)
    const verificationChanged = willVerify !== isCurrentlyVerified
    if (editValue === currentValue && !verificationChanged) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const displayValue = formatDisplay
    ? formatDisplay(value ?? undefined)
    : (options.find((opt) => opt.value === resolvedValue)?.label ?? resolvedValue) || "N/A"

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors w-full min-w-0",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
              <Select
                value={editValue}
                onValueChange={setEditValue}
                disabled={isSaving}
              >
                <SelectTrigger className="text-sm flex-1 min-w-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0 shrink-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0 shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <Checkbox
                id={`verify-${fieldName}`}
                checked={willVerify}
                onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label
                htmlFor={`verify-${fieldName}`}
                className={cn(
                  "text-xs cursor-pointer",
                  willVerify
                    ? "text-green-600 dark:text-green-400 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {willVerify ? "✓ Verified" : "Mark as verified"}
              </Label>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between group w-full">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-muted-foreground block mb-0.5">{label}</span>
              <span
                className={`text-sm block ${!value ? "text-muted-foreground italic" : ""}`}
              >
                {displayValue}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {verificationIndicator}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                type="button"
                title="Edit field"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatCertDateForApi(d: Date | undefined): string | null {
  if (!d || Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function lookupIdByName<T extends { id: number; name: string }>(
  items: T[],
  name: string | undefined
): number | null {
  if (!name?.trim()) return null
  const key = name.trim().toLowerCase()
  const match = items.find((item) => item.name.trim().toLowerCase() === key)
  return match?.id ?? null
}

function resolveWorkExperienceBenefitId(
  benefit: EmployerBenefit,
  benefitsLookup: LookupItem[]
): number | null {
  const byName = lookupIdByName(benefitsLookup, benefit.name)
  if (byName != null) return byName
  const parsed = Number(benefit.id)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function universitySelectionsEqual(
  a: SelectedUniversity,
  b: SelectedUniversity | null
): boolean {
  if (!a || !b) return !a && !b
  return a.id === b.id && a.name === b.name
}

function educationLinkedUniversity(education: CandidateEducation): SelectedUniversity {
  const name = education.universityLocationName?.trim()
  if (!name) return null
  const uid = education.universityLocationId?.trim()
  if (!uid) return null
  const idNum = Number(uid)
  if (!Number.isFinite(idNum)) return null
  return { id: idNum, name }
}

interface InlineEditableUniversityProps {
  education: CandidateEducation
  eduIndex: number
  onSave: (
    eduIndex: number,
    selection: SelectedUniversity,
    shouldVerify: boolean
  ) => Promise<void>
  onUniversityClick: (universityId: number, universityName: string) => void
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: "verified" | "unverified" } | undefined
  className?: string
}

const InlineEditableUniversity: React.FC<InlineEditableUniversityProps> = ({
  education,
  eduIndex,
  onSave,
  onUniversityClick,
  verificationIndicator,
  getFieldVerification,
  className = "",
}) => {
  const fieldName = `educations[${eduIndex}].universityLocationName`
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<SelectedUniversity>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)

  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === "verified"

  const linkedUniversity = useMemo(
    () => educationLinkedUniversity(education),
    [education.universityLocationId, education.universityLocationName]
  )
  const universityName = education.universityLocationName?.trim() || "N/A"

  useEffect(() => {
    if (!isEditing) {
      setEditValue(linkedUniversity)
    }
  }, [education, linkedUniversity, isEditing])

  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(linkedUniversity)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(linkedUniversity)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    if (!editValue?.id) {
      setError("Select a university")
      return
    }
    const verificationChanged = willVerify !== isCurrentlyVerified
    const selectionChanged =
      !linkedUniversity || !universitySelectionsEqual(editValue, linkedUniversity)
    if (!selectionChanged && !verificationChanged) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(eduIndex, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-2 py-2 px-3 rounded-md", className)}>
        <div className="space-y-2">
          <UniversityCombobox
            id={`details-education-university-${eduIndex}`}
            label="University"
            value={editValue}
            onChange={setEditValue}
            disabled={isSaving}
            parsedNameHint={
              !linkedUniversity ? education.universityLocationName?.trim() || undefined : undefined
            }
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0 shrink-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0 shrink-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {willVerify ? "✓ Verified" : "Mark as verified"}
            </Label>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors w-full min-w-0",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {linkedUniversity?.id != null ? (
          <button
            type="button"
            onClick={() => onUniversityClick(linkedUniversity.id, universityName)}
            className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer"
            title={`View ${universityName} details`}
          >
            {universityName}
          </button>
        ) : (
          <span className="font-semibold text-lg block">{universityName}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title="Edit university"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

function employerSelectionsEqual(
  a: SelectedEmployer,
  b: SelectedEmployer | null
): boolean {
  if (!a || !b) return !a && !b
  return a.id === b.id && a.name === b.name
}

function workExperienceToSelectedEmployer(
  experience: WorkExperience,
  preloadedName: string | null
): SelectedEmployer {
  if (experience.employerId == null) return null
  const name = experience.employerName?.trim() || preloadedName
  if (!name) return null
  return { id: experience.employerId, name }
}

interface InlineEditableEmployerProps {
  experience: WorkExperience
  weIndex: number
  onSave: (
    weIndex: number,
    selection: SelectedEmployer,
    shouldVerify: boolean
  ) => Promise<void>
  onEmployerClick: (employerId: number, employerName: string) => void
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: "verified" | "unverified" } | undefined
  createEmployerLookups?: BuildCreateEmployerDtoOptions
  className?: string
}

const InlineEditableEmployer: React.FC<InlineEditableEmployerProps> = ({
  experience,
  weIndex,
  onSave,
  onEmployerClick,
  verificationIndicator,
  getFieldVerification,
  createEmployerLookups,
  className = "",
}) => {
  const fieldName = `workExperiences[${weIndex}].employerName`
  const [preloadedName, setPreloadedName] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<SelectedEmployer>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)

  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === "verified"

  useEffect(() => {
    setPreloadedName(null)
    if (experience.employerId == null) return
    if (experience.employerName?.trim()) return
    let cancelled = false
    fetchEmployerById(experience.employerId)
      .then((e) => {
        if (!cancelled) setPreloadedName(e.name)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [experience.id, experience.employerId, experience.employerName])

  const linkedEmployer = useMemo(
    () => workExperienceToSelectedEmployer(experience, preloadedName),
    [experience.employerId, experience.employerName, preloadedName]
  )
  const employerName =
    linkedEmployer?.name || experience.employerName?.trim() || "N/A"

  useEffect(() => {
    if (!isEditing) {
      setEditValue(linkedEmployer)
    }
  }, [linkedEmployer, isEditing])

  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(linkedEmployer)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(linkedEmployer)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    if (!editValue?.id) {
      setError("Select an employer")
      return
    }
    const verificationChanged = willVerify !== isCurrentlyVerified
    const selectionChanged =
      !linkedEmployer || !employerSelectionsEqual(editValue, linkedEmployer)
    if (!selectionChanged && !verificationChanged) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(weIndex, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-2 w-full min-w-0", className)}>
        <EmployerCombobox
          id={`details-work-experience-employer-${weIndex}`}
          label=""
          value={editValue}
          onChange={setEditValue}
          disabled={isSaving}
          createEmployerLookups={createEmployerLookups}
          parsedNameHint={
            !linkedEmployer ? experience.employerName?.trim() || undefined : undefined
          }
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 p-0 shrink-0"
            title={willVerify ? "Save & Verify" : "Save"}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-8 w-8 p-0 shrink-0"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 pl-1">
          <Checkbox
            id={`verify-${fieldName}`}
            checked={willVerify}
            onCheckedChange={(checked) => setWillVerify(checked as boolean)}
            disabled={isSaving}
            className="h-4 w-4"
          />
          <Label
            htmlFor={`verify-${fieldName}`}
            className={cn(
              "text-xs cursor-pointer",
              willVerify
                ? "text-green-600 dark:text-green-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {willVerify ? "✓ Verified" : "Mark as verified"}
          </Label>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 w-full min-w-0",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {linkedEmployer?.id != null ? (
          <button
            type="button"
            onClick={() => onEmployerClick(linkedEmployer.id, employerName)}
            className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer leading-tight truncate"
            title={`View ${employerName} details`}
          >
            {employerName}
          </button>
        ) : (
          <span className="font-semibold text-lg block truncate">{employerName}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title="Edit employer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

function certificationLevelToApiIndex(
  level: CandidateCertification["certificationLevel"]
): number | null {
  if (!level) return null
  const idx = CERTIFICATION_LEVEL_DB.indexOf(level as CertificationLevelDb)
  return idx >= 0 ? idx : null
}

function certificationSelectionsEqual(
  a: SelectedCertification,
  b: SelectedCertification | null
): boolean {
  if (!a || !b) return !a && !b
  return a.id === b.id && a.name === b.name && (a.issuerName ?? null) === (b.issuerName ?? null)
}

function certificationToSelected(
  cert: CandidateCertification,
  preloadedName: string | null,
  preloadedIssuer: string | null
): SelectedCertification {
  if (cert.certificationId == null) return null
  const displayName = cert.certificationName?.trim() || preloadedName
  if (!displayName) return null
  const issuerName = cert.certificationName?.trim()
    ? cert.certificationIssuerName ?? null
    : preloadedIssuer
  return {
    id: cert.certificationId,
    name: displayName,
    issuerName: issuerName ?? null,
  }
}

interface InlineEditableCertificationProps {
  cert: CandidateCertification
  certIndex: number
  onSave: (index: number, selection: SelectedCertification, shouldVerify: boolean) => Promise<void>
  onCertificationClick: (certificationId: string, certificationName: string) => void
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: "verified" | "unverified" } | undefined
  certificationIssuers: CertificationIssuer[]
  certificationIssuersLoading: boolean
  onIssuerCreated: (issuer: CertificationIssuer) => void
  className?: string
}

const InlineEditableCertification: React.FC<InlineEditableCertificationProps> = ({
  cert,
  certIndex,
  onSave,
  onCertificationClick,
  verificationIndicator,
  getFieldVerification,
  certificationIssuers,
  certificationIssuersLoading,
  onIssuerCreated,
  className = "",
}) => {
  const fieldName = `certifications[${certIndex}].certificationId`
  const [preloadedName, setPreloadedName] = useState<string | null>(null)
  const [preloadedIssuer, setPreloadedIssuer] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<SelectedCertification>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)

  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === "verified"

  useEffect(() => {
    setPreloadedName(null)
    setPreloadedIssuer(null)
    if (cert.certificationId == null) return
    if (cert.certificationName?.trim()) return
    let cancelled = false
    fetchCertificationById(cert.certificationId)
      .then((c) => {
        if (!cancelled) {
          setPreloadedName(c.name)
          setPreloadedIssuer(c.issuerName)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [cert.id, cert.certificationId, cert.certificationName])

  const displaySelection = certificationToSelected(cert, preloadedName, preloadedIssuer)
  const displayName =
    displaySelection?.name || cert.certificationName?.trim() || "N/A"

  useEffect(() => {
    if (!isEditing) {
      setEditValue(certificationToSelected(cert, preloadedName, preloadedIssuer))
    }
  }, [cert, preloadedName, preloadedIssuer, isEditing])

  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(displaySelection)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(displaySelection)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    if (!editValue?.id) {
      setError("Select a certification")
      return
    }
    const verificationChanged = willVerify !== isCurrentlyVerified
    const selectionChanged =
      !displaySelection ||
      !certificationSelectionsEqual(editValue, displaySelection)
    if (!selectionChanged && !verificationChanged) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(certIndex, editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className={cn("space-y-2 py-2 px-3 rounded-md", className)}>
        <div className="space-y-2">
          <CertificationCombobox
            id={`details-certification-${certIndex}`}
            label="Certification"
            value={editValue}
            onChange={setEditValue}
            disabled={isSaving || certificationIssuersLoading}
            issuers={certificationIssuers}
            issuersLoading={certificationIssuersLoading}
            onIssuerCreated={onIssuerCreated}
            parsedNameHint={
              cert.certificationId == null ? cert.certificationName?.trim() || undefined : undefined
            }
            parsedIssuerHint={
              cert.certificationId == null ? cert.certificationIssuerName?.trim() || undefined : undefined
            }
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0 shrink-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0 shrink-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {willVerify ? "✓ Verified" : "Mark as verified"}
            </Label>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors w-full min-w-0",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-muted-foreground block mb-0.5">
          Certification
        </span>
        {cert.certificationId != null ? (
          <button
            type="button"
            onClick={() =>
              onCertificationClick(String(cert.certificationId), displayName)
            }
            className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer"
            title={`View ${displayName} details`}
          >
            {displayName}
          </button>
        ) : (
          <span className="font-semibold text-lg block">{displayName}</span>
        )}
        {displaySelection?.issuerName && (
          <span className="text-sm text-muted-foreground block mt-0.5">
            {displaySelection.issuerName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title="Edit certification"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

function projectToSelected(
  project: ProjectExperience,
  preloadedName: string | null
): SelectedProject {
  if (project.projectId == null) return null
  const name = project.projectName?.trim() || preloadedName
  if (!name) return null
  return { id: project.projectId, name }
}

function projectSelectionsEqual(a: SelectedProject, b: SelectedProject | null): boolean {
  if (!a || !b) return !a && !b
  return a.id === b.id && a.name === b.name
}

interface InlineEditableProjectProps {
  project: ProjectExperience
  comboboxId: string
  fieldName: string
  onSave: (selection: SelectedProject, shouldVerify: boolean) => Promise<void>
  onProjectClick: (projectId: number | null, projectName: string) => void
  verificationIndicator: React.ReactNode
  getFieldVerification: (fieldName: string) => { status: "verified" | "unverified" } | undefined
  projectLookups?: ProjectLookups
  titleClassName?: string
  className?: string
}

const InlineEditableProject: React.FC<InlineEditableProjectProps> = ({
  project,
  comboboxId,
  fieldName,
  onSave,
  onProjectClick,
  verificationIndicator,
  getFieldVerification,
  projectLookups,
  titleClassName = "font-semibold text-lg",
  className = "",
}) => {
  const [preloadedName, setPreloadedName] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<SelectedProject>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(false)

  const verification = getFieldVerification(fieldName)
  const isCurrentlyVerified = verification?.status === "verified"

  useEffect(() => {
    setPreloadedName(null)
    if (project.projectId == null) return
    if (project.projectName?.trim()) return
    let cancelled = false
    fetchProjectById(project.projectId)
      .then((p) => {
        if (!cancelled) setPreloadedName(p.name)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [project.id, project.projectId, project.projectName])

  const displaySelection = projectToSelected(project, preloadedName)
  const displayName =
    displaySelection?.name || project.projectName?.trim() || "Unnamed Project"

  useEffect(() => {
    if (!isEditing) {
      setEditValue(projectToSelected(project, preloadedName))
    }
  }, [project, preloadedName, isEditing])

  useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])

  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(displaySelection)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(displaySelection)
    setWillVerify(isCurrentlyVerified)
    setError(null)
  }

  const handleSave = async () => {
    if (!editValue?.id) {
      setError("Select a project")
      return
    }
    const verificationChanged = willVerify !== isCurrentlyVerified
    const selectionChanged =
      !displaySelection || !projectSelectionsEqual(editValue, displaySelection)
    if (!selectionChanged && !verificationChanged) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue, willVerify)
      setIsEditing(false)
      setError(null)
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div
        className={cn(
          "space-y-3 py-3 px-3 rounded-md bg-muted/30 border w-full min-w-0",
          className
        )}
      >
        <div className="space-y-2 w-full min-w-0">
          <ProjectCombobox
            id={comboboxId}
            label="Project"
            value={editValue}
            onChange={setEditValue}
            disabled={isSaving}
            projectLookups={projectLookups}
            className="w-full"
            parsedNameHint={
              project.projectId == null ? project.projectName?.trim() || undefined : undefined
            }
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0 shrink-0"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0 shrink-0"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <Checkbox
              id={`verify-${fieldName}`}
              checked={willVerify}
              onCheckedChange={(checked) => setWillVerify(checked as boolean)}
              disabled={isSaving}
              className="h-4 w-4"
            />
            <Label
              htmlFor={`verify-${fieldName}`}
              className={cn(
                "text-xs cursor-pointer",
                willVerify
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {willVerify ? "✓ Verified" : "Mark as verified"}
            </Label>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors w-full min-w-0",
        className
      )}
    >
      <div className="flex-1 min-w-0 w-full">
        <span className="text-sm font-medium text-muted-foreground block mb-0.5">Project</span>
        <button
          type="button"
          onClick={() => onProjectClick(project.projectId, displayName)}
          className={cn(
            titleClassName,
            "hover:text-primary hover:underline transition-colors text-left cursor-pointer block w-full break-words"
          )}
          title={`View ${displayName} details`}
        >
          {displayName}
        </button>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {verificationIndicator}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
          title="Edit project"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// Inline Editable Checkbox Component
interface InlineEditableCheckboxProps {
  label: string
  value: boolean
  fieldName: string
  onSave: (fieldName: string, newValue: boolean, verify: boolean) => Promise<void>
  getFieldVerification?: (fieldName: string) => { status: 'verified' | 'unverified' } | undefined
  className?: string
  description?: string
}

const InlineEditableCheckbox: React.FC<InlineEditableCheckboxProps> = ({
  label,
  value,
  fieldName,
  onSave,
  getFieldVerification,
  className,
  description
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [willVerify, setWillVerify] = useState(true)
  
  const verification = getFieldVerification?.(fieldName)
  const isCurrentlyVerified = verification?.status === 'verified'
  
  // Initialize willVerify based on current verification status when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setWillVerify(isCurrentlyVerified)
    }
  }, [isEditing, isCurrentlyVerified])
  
  const handleEdit = () => {
    setIsEditing(true)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setWillVerify(isCurrentlyVerified)
  }
  
  const handleSave = async () => {
    // No change check
    const verificationChanged = willVerify !== isCurrentlyVerified
    const valueChanged = editValue !== value
    
    if (!valueChanged && !verificationChanged) {
      setIsEditing(false)
      return
    }
    
    setIsSaving(true)
    try {
      await onSave(fieldName, editValue, willVerify)
      setIsEditing(false)
    } catch (err) {
      // Error handling - revert on error
      setEditValue(value)
      setWillVerify(isCurrentlyVerified)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Verification indicator component
  const VerificationIndicator = ({ 
    fieldName: fName
  }: { 
    fieldName: string
  }) => {
    const verificationData = getFieldVerification?.(fName)
    const status = verificationData?.status || 'unverified'
    
    return (
      <div className="flex items-center gap-1 shrink-0">
        <VerificationBadge 
          status={status}
          size="sm"
        />
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-1 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors", className)}>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <VerificationIndicator fieldName={fieldName} />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              type="button"
              title="Edit field"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-3">
              {/* Checkbox or Switch */}
              <div className="flex items-center gap-2 pl-1">
                {label === "Top Developer" || label === "Topper" || label === "Cheetah" ? (
                  <>
                    <Switch
                      id={`switch-${fieldName}`}
                      checked={editValue}
                      onCheckedChange={(checked) => setEditValue(checked as boolean)}
                      disabled={isSaving}
                    />
                    <Label 
                      htmlFor={`switch-${fieldName}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {label}
                    </Label>
                  </>
                ) : (
                  <>
                    <Checkbox
                      id={`checkbox-${fieldName}`}
                      checked={editValue}
                      onCheckedChange={(checked) => setEditValue(checked as boolean)}
                      disabled={isSaving}
                      className="h-4 w-4"
                    />
                    <Label 
                      htmlFor={`checkbox-${fieldName}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {label}
                    </Label>
                  </>
                )}
              </div>
              
              {description && (
                <p className="text-xs text-muted-foreground pl-6 -mt-1">{description}</p>
              )}
              
              {/* Mark as verified checkbox */}
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id={`verify-${fieldName}`}
                  checked={willVerify}
                  onCheckedChange={(checked) => setWillVerify(checked as boolean)}
                  disabled={isSaving}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`verify-${fieldName}`}
                  className={cn(
                    "text-xs cursor-pointer",
                    willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                  )}
                >
                  {willVerify ? '✓ Verified' : 'Mark as verified'}
                </Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title={willVerify ? "Save & Verify" : "Save"}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8 w-8 p-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {label === "Top Developer" || label === "Topper" || label === "Cheetah" ? (
              <Switch
                checked={value}
                disabled
                className="opacity-50"
              />
            ) : (
              <Checkbox
                checked={value}
                disabled
                className="h-4 w-4 opacity-50"
              />
            )}
            <span className={cn(
              "text-sm",
              value ? "font-medium" : "text-muted-foreground"
            )}>
              {value ? 'Yes' : 'No'}
            </span>
            {value && label !== "Top Developer" && label !== "Topper" && label !== "Cheetah" && (
              <Badge 
                variant="default" 
                className="text-xs"
              >
                {label}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Prefer backend-derived latest job title; fall back to latest work experience for detail-only display.
const getJobTitle = (candidate: Candidate): string => {
  return candidate.latestJobTitle || candidate.workExperiences?.[0]?.jobTitle || "N/A"
}

// Helper function to calculate candidate's average tenure across all employers
const calculateCandidateAverageTenure = (candidate: Candidate): number => {
  if (!candidate.workExperiences || candidate.workExperiences.length === 0) {
    return 0
  }

  const today = new Date()
  const employerTenures: number[] = []

  // Group work experiences by employer to calculate tenure per employer
  const employerMap = new Map<string, { startDate: Date | null, endDate: Date | null }>()

  candidate.workExperiences.forEach(we => {
    const employerName = we.employerName.toLowerCase().trim()
    const startDate = we.startDate ? new Date(we.startDate) : null
    const endDate = we.endDate ? new Date(we.endDate) : null

    if (!employerMap.has(employerName)) {
      employerMap.set(employerName, { startDate: null, endDate: null })
    }

    const existing = employerMap.get(employerName)!

    // Update start date (earliest)
    if (startDate && (!existing.startDate || startDate < existing.startDate)) {
      existing.startDate = startDate
    }

    // Update end date (latest)
    if (endDate && (!existing.endDate || endDate > existing.endDate)) {
      existing.endDate = endDate
    } else if (!endDate && !existing.endDate) {
      // Current job
      existing.endDate = today
    }
  })

  // Calculate tenure for each employer
  employerMap.forEach(({ startDate, endDate }) => {
    if (startDate && endDate) {
      // Calculate tenure in years
      const tenureMs = endDate.getTime() - startDate.getTime()
      const tenureYears = tenureMs / (1000 * 60 * 60 * 24 * 365.25)

      if (tenureYears > 0) {
        employerTenures.push(tenureYears)
      }
    }
  })

  // Calculate average across all employers
  if (employerTenures.length === 0) {
    return 0
  }

  const totalTenure = employerTenures.reduce((sum, tenure) => sum + tenure, 0)
  return Math.round((totalTenure / employerTenures.length) * 10) / 10 // Round to 1 decimal place
}

export function CandidateDetailsModal({ 
  candidate, 
  open, 
  onOpenChange,
  onCandidateUpdated,
}: CandidateDetailsModalProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "work-experience", "tech-stacks", "independent-projects", "education", "certifications", "competitions", "verification"]))
  const [activeSection, setActiveSection] = useState<string>("basic-info")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  
  // Options state (for creatable functionality)
  const [projectOptions, setProjectOptions] = useState<ComboboxOption[]>(baseProjectOptions)
  const [certificationOptions, setCertificationOptions] = useState<ComboboxOption[]>(baseCertificationOptions)
  const [apiTechStacks, setApiTechStacks] = useState<LookupItem[]>([])
  const [apiTimeSupportZones, setApiTimeSupportZones] = useState<LookupItem[]>([])
  const [apiBenefits, setApiBenefits] = useState<LookupItem[]>([])
  const [benefitsCatalogLoading, setBenefitsCatalogLoading] = useState(false)
  const [apiTags, setApiTags] = useState<LookupItem[]>([])
  const [extraTechStackOptions, setExtraTechStackOptions] = useState<MultiSelectOption[]>([])
  
  // Creation dialog state
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false)
  const [pendingProjectName, setPendingProjectName] = useState<string>("")
  const [pendingProjectFieldName, setPendingProjectFieldName] = useState<string | null>(null)
  
  const [createCertificationDialogOpen, setCreateCertificationDialogOpen] = useState(false)
  const [pendingCertificationName, setPendingCertificationName] = useState<string>("")
  const [pendingCertificationFieldName, setPendingCertificationFieldName] = useState<string | null>(null)
  
  // Delete confirmation dialog state
  // const [dataProgress, setDataProgress] = useState<CandidateDataProgressResponse | null>(null)
  // const [dataProgressLoading, setDataProgressLoading] = useState(false)
  // const [dataProgressError, setDataProgressError] = useState<string | null>(null)

  const [certificationIssuers, setCertificationIssuers] = useState<CertificationIssuer[]>([])
  const [certificationIssuersLoading, setCertificationIssuersLoading] = useState(false)
  const [degreeMajorLookups, setDegreeMajorLookups] = useState<{
    degrees: DegreeDto[]
    majors: MajorDto[]
  }>({ degrees: [], majors: [] })
  const [degreesMajorsLoading, setDegreesMajorsLoading] = useState(false)

  /** Full candidate from GET /api/candidates/{id} (list rows omit nested educations, etc.). */
  const [fullCandidate, setFullCandidate] = useState<Candidate | null>(null)
  const [fullCandidateLoading, setFullCandidateLoading] = useState(false)
  const resolvedCandidate = fullCandidate ?? candidate

  const degreeCatalogOptions = useMemo(
    () => mergeNamedComboboxOptions(degreeMajorLookups.degrees, [], []),
    [degreeMajorLookups.degrees]
  )

  const majorCatalogOptions = useMemo(
    () => mergeNamedComboboxOptions(degreeMajorLookups.majors, [], []),
    [degreeMajorLookups.majors]
  )

  const degreeOptions = useMemo(
    () =>
      mergeNamedComboboxOptions(
        degreeMajorLookups.degrees,
        baseDegreeOptions,
        (resolvedCandidate?.educations ?? []).map((e) => e.degreeName)
      ),
    [degreeMajorLookups.degrees, resolvedCandidate?.educations]
  )

  const majorOptions = useMemo(
    () =>
      mergeNamedComboboxOptions(
        degreeMajorLookups.majors,
        baseMajorOptions,
        (resolvedCandidate?.educations ?? []).map((e) => e.majorName)
      ),
    [degreeMajorLookups.majors, resolvedCandidate?.educations]
  )

  const techStackOptions = useMemo(() => {
    const catalogOptions: MultiSelectOption[] = apiTechStacks
      .filter((l) => l?.name?.trim())
      .map((l) => {
        const n = l.name.trim()
        return { value: n, label: n }
      })
    const selectedNames = collectCandidateTechStackNames(resolvedCandidate)
    return mergeMultiSelectOptions(
      [...baseTechStackOptions, ...catalogOptions, ...extraTechStackOptions],
      selectedNames
    )
  }, [apiTechStacks, extraTechStackOptions, resolvedCandidate])

  const timeSupportZoneOptions = useMemo(() => {
    const catalogOptions: MultiSelectOption[] = apiTimeSupportZones
      .filter((l) => l?.name?.trim())
      .map((l) => {
        const n = l.name.trim()
        return { value: n, label: n }
      })
    const selectedNames = collectWorkExperienceTimeSupportZoneNames(resolvedCandidate)
    return mergeMultiSelectOptions(catalogOptions, selectedNames)
  }, [apiTimeSupportZones, resolvedCandidate])

  const employerCreateLookups = useMemo<BuildCreateEmployerDtoOptions>(
    () => ({
      tagsLookup: apiTags,
      timeSupportZonesLookup: apiTimeSupportZones,
    }),
    [apiTags, apiTimeSupportZones]
  )

  const projectLookups = useMemo<ProjectLookups>(
    () => ({
      techStacks: apiTechStacks,
      technicalAspects: [],
      clientLocations: [],
    }),
    [apiTechStacks]
  )

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ 
    type: 'independent' | 'workExperience' | 'education' | 'certification' | 'workExperienceEntry' | 'achievement'
    index: number
    workExperienceIndex?: number
    itemName: string 
  } | null>(null)
  
  // Define sections for navigation
  const sections = [
    { id: "basic", sectionId: "basic-info", label: "Basic Information", shortLabel: "Basic" },
    { id: "work-experience", sectionId: "work-experience", label: "Work Experience", shortLabel: "Experience" },
    { id: "tech-stacks", sectionId: "tech-stacks", label: "Tech Stacks", shortLabel: "Tech" },
    { id: "independent-projects", sectionId: "projects", label: "Projects", shortLabel: "Projects" },
    { id: "education", sectionId: "education", label: "Education", shortLabel: "Education" },
    { id: "certifications", sectionId: "certifications", label: "Certifications", shortLabel: "Certs" },
    { id: "competitions", sectionId: "competitions", label: "Achievements", shortLabel: "Achievements" },
  ]

  const projectsByName = useMemo(() => {
    const map = new Map<string, (typeof sampleProjects)[number]>()
    sampleProjects.forEach((p) => {
      map.set(normalizeKey(p.projectName), p)
    })
    return map
  }, [])

  const getProjectDetails = (projectName: string) => {
    const project = projectsByName.get(normalizeKey(projectName))
    return {
      verticalDomains: project?.verticalDomains ?? [],
      horizontalDomains: project?.horizontalDomains ?? [],
      teamSize: project?.teamSize ?? null,
    }
  }

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (!element || !scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const yOffset = 80 // Account for sticky header
    
    // Ensure section is expanded before scrolling
    const sectionKey = sections.find(s => s.sectionId === sectionId)?.id
    if (sectionKey && !expandedSections.has(sectionKey)) {
      toggleSection(sectionKey)
      // Wait for expansion animation before scrolling
      setTimeout(() => {
        scrollToElement(element, container, yOffset, sectionId)
      }, 300)
    } else {
      scrollToElement(element, container, yOffset, sectionId)
    }
  }

  // Helper function to scroll to element
  const scrollToElement = (element: HTMLElement, container: HTMLElement, yOffset: number, sectionId: string) => {
    // Set flag to prevent IntersectionObserver from interfering
    isScrollingRef.current = true
    
    // Update active section immediately
    setActiveSection(sectionId)
    
    // Use requestAnimationFrame to ensure layout is calculated
    requestAnimationFrame(() => {
      // Get current scroll position
      const currentScrollTop = container.scrollTop
      
      // Get bounding rects
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      
      // Calculate element's position relative to container's scrollable content
      // elementRect.top is relative to viewport
      // containerRect.top is container's position in viewport
      // currentScrollTop is how much we've scrolled
      const elementTopInContainer = elementRect.top - containerRect.top + currentScrollTop
      
      // Calculate target scroll position accounting for sticky header
      const targetScrollTop = elementTopInContainer - yOffset
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      })
      
      // Reset flag after scroll completes (smooth scroll takes ~500ms)
      setTimeout(() => {
        isScrollingRef.current = false
      }, 600)
    })
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    scrollToSection(value)
  }

  // IntersectionObserver to detect active section
  useEffect(() => {
    if (!candidate || !open || !scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const sectionIds = sections.map(s => s.sectionId)
    
    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update if we're manually scrolling
        if (isScrollingRef.current) return
        
        // Find the entry with the highest intersection ratio
        let maxRatio = 0
        let activeId = sectionIds[0] || "basic-info"
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            activeId = entry.target.id
          }
        })
        
        if (maxRatio > 0.2) {
          setActiveSection(activeId)
        }
      },
      {
        threshold: [0.2, 0.5, 0.8],
        root: container,
        rootMargin: '-80px 0px -60% 0px'
      }
    )

    // Observe all sections
    const sectionElements: (Element | null)[] = []
    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        observer.observe(element)
        sectionElements.push(element)
      }
    })

    return () => {
      sectionElements.forEach((element) => {
        if (element) observer.unobserve(element)
      })
      observer.disconnect()
    }
  }, [candidate, open])
  
  // State for Edit dialog (now includes verification by default)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Lookups for the edit dialog (loaded lazily when edit dialog opens)
  const [editLookups, setEditLookups] = useState<CandidateLookups>({ techStacks: [] })
  const editLookupsLoadedRef = useRef(false)

  useEffect(() => {
    if (!editDialogOpen || editLookupsLoadedRef.current) return
    editLookupsLoadedRef.current = true
    Promise.all([
      fetchTechStacks().catch(() => []),
      fetchTimeSupportZones().catch(() => []),
      fetchBenefits().catch(() => []),
      fetchDegrees().catch(() => []),
      fetchMajors().catch(() => []),
    ]).then(([techStacks, timeSupportZones, benefits, degrees, majors]) => {
      setEditLookups({ techStacks, timeSupportZones, benefits, degrees, majors })
    })
  }, [editDialogOpen])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setBenefitsCatalogLoading(true)
    Promise.all([
      fetchTechStacks().catch(() => []),
      fetchTimeSupportZones().catch(() => []),
      fetchTags().catch(() => []),
      fetchBenefits().catch(() => []),
    ])
      .then(([stacks, zones, tags, benefits]) => {
        if (!cancelled) {
          setApiTechStacks(Array.isArray(stacks) ? stacks : [])
          setApiTimeSupportZones(Array.isArray(zones) ? zones : [])
          setApiTags(Array.isArray(tags) ? tags : [])
          setApiBenefits(Array.isArray(benefits) ? benefits : [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiTechStacks([])
          setApiTimeSupportZones([])
          setApiTags([])
          setApiBenefits([])
        }
      })
      .finally(() => {
        if (!cancelled) setBenefitsCatalogLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDegreesMajorsLoading(true)
    Promise.all([fetchDegrees().catch(() => []), fetchMajors().catch(() => [])])
      .then(([degrees, majors]) => {
        if (!cancelled) {
          setDegreeMajorLookups({
            degrees: Array.isArray(degrees) ? degrees : [],
            majors: Array.isArray(majors) ? majors : [],
          })
        }
      })
      .finally(() => {
        if (!cancelled) setDegreesMajorsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCertificationIssuersLoading(true)
    fetchCertificationIssuers()
      .then((issuers) => {
        if (!cancelled) setCertificationIssuers(Array.isArray(issuers) ? issuers : [])
      })
      .catch(() => {
        if (!cancelled) setCertificationIssuers([])
      })
      .finally(() => {
        if (!cancelled) setCertificationIssuersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  // State for Interaction Mode dialog
  const [interactionMode, setInteractionMode] = useState<InteractionMode | null>(null)
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false)
  
  // Create icon mapping for modes
  const MODE_ICONS: Record<InteractionMode, React.ElementType> = {
    coldCaller: Phone,
    interviewer: MessageSquare,
    l1: MessageCircle,
    l2: Users,
  }
  
  // Persist mode selection to localStorage when a mode is selected
  useEffect(() => {
    if (interactionMode && typeof window !== 'undefined') {
      localStorage.setItem('lastInteractionMode', interactionMode)
    }
  }, [interactionMode])
  
  const handleResumeSave = async (payload: {
    file: File | null
    clearExisting: boolean
    shouldVerify: boolean
  }) => {
    if (!candidate) return

    try {
      if (payload.file) {
        const message = payload.shouldVerify
          ? "Resume updated and verified ✓"
          : "Resume updated"
        toast.success(message)
      } else if (payload.clearExisting) {
        const message = payload.shouldVerify
          ? "Resume removed and verified ✓"
          : "Resume removed"
        toast.success(message)
      } else if (payload.shouldVerify) {
        toast.success("Resume verified ✓")
      }
    } catch (error) {
      toast.error("Failed to save. Please try again.")
      throw error
    }
  }
  
  // Handle inline field save with verification
  const handleFieldSave = async (fieldName: string, newValue: string | number | Date | undefined | string[] | EmployerBenefit[] | boolean, shouldVerify: boolean) => {
    if (!candidate) return
    
    try {
      // In real app, this would call API to update candidate field AND verification
      // await updateCandidateField(candidate.id, {
      //   fieldName,
      //   newValue,
      //   verify: shouldVerify,
      //   verifiedBy: currentUserId,
      //   verifiedAt: new Date(),
      //   source: 'manual'
      // })
      
      // For now, just show success message
      const message = shouldVerify 
        ? `${fieldName} updated and verified ✓` 
        : `${fieldName} updated`
      toast.success(message)
      
      // Note: In real implementation, you'd update local state or refetch candidate data
      // This would also update the verification status in the verification system
    } catch (error) {
      toast.error('Failed to save. Please try again.')
      throw error
    }
  }
  
  // Wrapper for multi-select field save
  const handleMultiSelectFieldSave = async (fieldName: string, newValue: string[], shouldVerify: boolean) => {
    await handleFieldSave(fieldName, newValue, shouldVerify)
  }
  
  const handleCreateBenefit = React.useCallback(async (name: string): Promise<EmployerBenefit | null> => {
    try {
      const created = await createBenefit(name)
      setApiBenefits((prev) =>
        [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created].sort(
          (a, b) => a.name.localeCompare(b.name)
        )
      )
      return {
        id: String(created.id),
        name: created.name,
        hasValue: false,
        amount: null,
        unit: null,
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add benefit")
      return null
    }
  }, [])

  // Handle independent project deletion - show confirmation dialog
  const handleDeleteProject = (projectIndex: number) => {
    if (!resolvedCandidate) return
    
    const project = resolvedCandidate.projects?.[projectIndex]
    if (!project) return
    
    // Set project to delete and open confirmation dialog
    setItemToDelete({
      type: 'independent',
      index: projectIndex,
      itemName: project.projectName || 'Unnamed Project'
    })
    setDeleteDialogOpen(true)
  }

  // Handle work experience project deletion - show confirmation dialog
  const handleDeleteWorkExperienceProject = (workExperienceIndex: number, projectIndex: number) => {
    if (!resolvedCandidate) return
    
    const workExperience = resolvedCandidate.workExperiences?.[workExperienceIndex]
    const project = workExperience?.projects?.[projectIndex]
    if (!project) return
    
    // Set project to delete and open confirmation dialog
    setItemToDelete({
      type: 'workExperience',
      index: projectIndex,
      workExperienceIndex,
      itemName: project.projectName || 'Unnamed Project'
    })
    setDeleteDialogOpen(true)
  }

  // Handle education entry deletion - show confirmation dialog
  const handleDeleteEducation = (educationIndex: number) => {
    if (!resolvedCandidate) return
    
    const education = resolvedCandidate.educations?.[educationIndex]
    if (!education) return
    
    // Create a descriptive name for the education entry
    const educationName = education.universityLocationName 
      ? `${education.universityLocationName}${education.degreeName ? ` - ${education.degreeName}` : ''}`
      : education.degreeName || 'Education entry'
    
    setItemToDelete({
      type: 'education',
      index: educationIndex,
      itemName: educationName
    })
    setDeleteDialogOpen(true)
  }

  // Handle certification deletion - show confirmation dialog
  const handleDeleteCertification = (certificationIndex: number) => {
    if (!resolvedCandidate) return
    
    const certification = resolvedCandidate.certifications?.[certificationIndex]
    if (!certification) return
    
    setItemToDelete({
      type: 'certification',
      index: certificationIndex,
      itemName: certification.certificationName || 'Certification'
    })
    setDeleteDialogOpen(true)
  }

  // Handle work experience entry deletion - show confirmation dialog
  const handleDeleteWorkExperience = (workExperienceIndex: number) => {
    if (!resolvedCandidate) return
    
    const workExperience = resolvedCandidate.workExperiences?.[workExperienceIndex]
    if (!workExperience) return
    
    // Create a descriptive name for the work experience entry
    const experienceName = workExperience.employerName 
      ? `${workExperience.employerName}${workExperience.jobTitle ? ` - ${workExperience.jobTitle}` : ''}`
      : workExperience.jobTitle || 'Work experience entry'
    
    setItemToDelete({
      type: 'workExperienceEntry',
      index: workExperienceIndex,
      itemName: experienceName
    })
    setDeleteDialogOpen(true)
  }

  // Handle achievement deletion - show confirmation dialog
  const handleDeleteAchievement = (achievementIndex: number) => {
    if (!resolvedCandidate) return
    
    const achievements = resolvedCandidate.achievements || resolvedCandidate.competitions?.map(comp => ({
      id: comp.id,
      name: comp.competitionName,
      achievementType: 'Competition',
      ranking: comp.ranking,
      year: comp.year,
      url: comp.url,
      description: undefined
    }))
    const achievement = achievements?.[achievementIndex]
    if (!achievement) return
    
    setItemToDelete({
      type: 'achievement',
      index: achievementIndex,
      itemName: achievement.name || 'Achievement'
    })
    setDeleteDialogOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!candidate || !itemToDelete) return
    
    try {
      if (itemToDelete.type === 'independent') {
        // In real app, this would call API to delete the independent project
        // await deleteCandidateProject(candidate.id, candidate.projects[itemToDelete.index].id)
        toast.success(`Project "${itemToDelete.itemName}" deleted successfully`)
      } else if (itemToDelete.type === 'workExperience' && itemToDelete.workExperienceIndex !== undefined) {
        // In real app, this would call API to delete the work experience project
        // await deleteWorkExperienceProject(candidate.id, itemToDelete.workExperienceIndex, itemToDelete.index)
        toast.success(`Project "${itemToDelete.itemName}" deleted successfully`)
      } else if (itemToDelete.type === 'education') {
        // In real app, this would call API to delete the education entry
        // await deleteEducation(candidate.id, candidate.educations[itemToDelete.index].id)
        toast.success(`Education entry "${itemToDelete.itemName}" deleted successfully`)
      } else if (itemToDelete.type === 'certification') {
        // In real app, this would call API to delete the certification
        // await deleteCertification(candidate.id, candidate.certifications[itemToDelete.index].id)
        toast.success(`Certification "${itemToDelete.itemName}" deleted successfully`)
      } else if (itemToDelete.type === 'workExperienceEntry') {
        // In real app, this would call API to delete the work experience entry
        // await deleteWorkExperience(candidate.id, candidate.workExperiences[itemToDelete.index].id)
        toast.success(`Work experience "${itemToDelete.itemName}" deleted successfully`)
      } else if (itemToDelete.type === 'achievement') {
        // In real app, this would call API to delete the achievement
        // await deleteAchievement(candidate.id, candidate.achievements[itemToDelete.index].id)
        toast.success(`Achievement "${itemToDelete.itemName}" deleted successfully`)
      }
      
      // Note: In real implementation, you'd update local state or refetch candidate data
      // This would remove the item from the appropriate array
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      toast.error('Failed to delete item. Please try again.')
      console.error('Error deleting item:', error)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  // Handle project creation
  const handleProjectCreated = async (projectData: ProjectFormData) => {
    try {
      const newProjectName = projectData.projectName.trim()
      
      if (!newProjectName) {
        toast.error("Project name is required")
        return
      }

      // Add new project to options
      const newOption = { label: newProjectName, value: newProjectName }
      setProjectOptions(prev => {
        const updated = [...prev, newOption]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the newly created project if we have a pending field
      if (pendingProjectFieldName) {
        await handleFieldSave(pendingProjectFieldName, newProjectName, false)
      }

      toast.success(`Project "${newProjectName}" has been created successfully.`)
      setCreateProjectDialogOpen(false)
      setPendingProjectName("")
      setPendingProjectFieldName(null)
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project. Please try again.")
    }
  }

  const handleCertificationIssuerCreated = (issuer: CertificationIssuer) => {
    setCertificationIssuers((prev) => {
      if (prev.some((i) => i.id === issuer.id)) return prev
      return [...prev, issuer].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const persistEducationUniversity = async (
    eduIndex: number,
    selection: SelectedUniversity,
    shouldVerify: boolean
  ) => {
    if (!candidate || !selection?.id) return
    const candidateId = Number(candidate.id)
    if (!Number.isFinite(candidateId)) {
      toast.error("Invalid candidate id.")
      throw new Error("Invalid candidate id")
    }
    const edu = (fullCandidate ?? candidate).educations?.[eduIndex]
    if (!edu) return
    const educationId = Number(edu.id)
    if (!Number.isFinite(educationId)) {
      toast.error("Cannot update education without a valid id.")
      throw new Error("Invalid education id")
    }

    await updateCandidateEducation(candidateId, educationId, {
      universityId: selection.id,
      degreeId: lookupIdByName(degreeMajorLookups.degrees, edu.degreeName),
      majorId: lookupIdByName(degreeMajorLookups.majors, edu.majorName),
      startMonth: formatCertDateForApi(edu.startMonth),
      endMonth: formatCertDateForApi(edu.endMonth),
      grades: edu.grades ?? null,
      isTopper: edu.isTopper ?? false,
      isMainCheetah: edu.isCheetah ?? false,
    })

    setFullCandidate((prev) => {
      const base = prev ?? candidate
      if (!base.educations?.[eduIndex]) return prev ?? base
      const nextEducations = [...base.educations]
      nextEducations[eduIndex] = {
        ...nextEducations[eduIndex],
        universityLocationId: String(selection.id),
        universityLocationName: selection.name,
      }
      return { ...base, educations: nextEducations }
    })

    const message = shouldVerify
      ? "University updated and verified ✓"
      : "University updated"
    toast.success(message)
    await refreshFullCandidate()
    onCandidateUpdated?.()
  }

  const handleEducationUniversitySave = async (
    eduIndex: number,
    selection: SelectedUniversity,
    shouldVerify: boolean
  ) => {
    if (!selection?.id) return
    try {
      await persistEducationUniversity(eduIndex, selection, shouldVerify)
    } catch (err) {
      if (err instanceof Error && err.message === "Invalid education id") return
      toast.error(err instanceof Error ? err.message : "Failed to update university.")
      throw err
    }
  }

  const persistWorkExperienceRow = async (
    weIndex: number,
    patch: {
      shiftType?: string
      workMode?: string
      employerId?: number
      employerName?: string
    },
    shouldVerify: boolean,
    successLabel: string
  ) => {
    if (!candidate) return
    const candidateId = Number(candidate.id)
    if (!Number.isFinite(candidateId)) {
      toast.error("Invalid candidate id.")
      throw new Error("Invalid candidate id")
    }
    const we = (fullCandidate ?? candidate).workExperiences?.[weIndex]
    if (!we) return
    const weId = Number(we.id)
    if (!Number.isFinite(weId)) {
      toast.error("Cannot update work experience without a valid id.")
      throw new Error("Invalid work experience id")
    }
    const employerId = patch.employerId ?? we.employerId
    if (employerId == null) {
      toast.error("Link an employer before updating this field.")
      throw new Error("Employer not linked")
    }

    const nextShiftType =
      patch.shiftType !== undefined
        ? shiftTypeToSelectValue(patch.shiftType)
        : shiftTypeToSelectValue(we.shiftType ?? "")
    const nextWorkMode =
      patch.workMode !== undefined
        ? workModeToSelectValue(patch.workMode)
        : workModeToSelectValue(we.workMode ?? "")

    await updateCandidateWorkExperience(candidateId, weId, {
      employerId,
      jobTitle: we.jobTitle,
      startDate: formatCertDateForApi(we.startDate),
      endDate: formatCertDateForApi(we.endDate),
      shiftType: nextShiftType ? enumIndex(SHIFT_TYPE_DB, nextShiftType) : null,
      workMode: nextWorkMode ? enumIndex(WORK_MODE_DB, nextWorkMode) : null,
    })

    setFullCandidate((prev) => {
      const base = prev ?? candidate
      if (!base.workExperiences?.[weIndex]) return prev ?? base
      const nextWorkExperiences = [...base.workExperiences]
      nextWorkExperiences[weIndex] = {
        ...nextWorkExperiences[weIndex],
        ...(patch.shiftType !== undefined
          ? { shiftType: (nextShiftType || "") as WorkExperience["shiftType"] }
          : {}),
        ...(patch.workMode !== undefined
          ? { workMode: (nextWorkMode || "") as WorkExperience["workMode"] }
          : {}),
        ...(patch.employerId !== undefined ? { employerId: patch.employerId } : {}),
        ...(patch.employerName !== undefined ? { employerName: patch.employerName } : {}),
      }
      return { ...base, workExperiences: nextWorkExperiences }
    })

    const message = shouldVerify
      ? `${successLabel} updated and verified ✓`
      : `${successLabel} updated`
    toast.success(message)
    await refreshFullCandidate()
    onCandidateUpdated?.()
  }

  const handleWorkExperienceEmployerSave = async (
    weIndex: number,
    selection: SelectedEmployer,
    shouldVerify: boolean
  ) => {
    if (!selection?.id) return
    try {
      await persistWorkExperienceRow(
        weIndex,
        { employerId: selection.id, employerName: selection.name },
        shouldVerify,
        "Employer"
      )
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === "Invalid work experience id" ||
          err.message === "Employer not linked")
      ) {
        return
      }
      toast.error(err instanceof Error ? err.message : "Failed to update employer.")
      throw err
    }
  }

  const handleWorkExperienceShiftTypeSave = async (
    weIndex: number,
    shiftTypeValue: string,
    shouldVerify: boolean
  ) => {
    if (!shiftTypeValue) {
      toast.error("Select a shift type.")
      throw new Error("Shift type required")
    }
    try {
      await persistWorkExperienceRow(
        weIndex,
        { shiftType: shiftTypeValue },
        shouldVerify,
        "Shift type"
      )
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === "Invalid work experience id" ||
          err.message === "Employer not linked" ||
          err.message === "Shift type required")
      ) {
        return
      }
      toast.error(err instanceof Error ? err.message : "Failed to update shift type.")
      throw err
    }
  }

  const handleWorkExperienceWorkModeSave = async (
    weIndex: number,
    workModeValue: string,
    shouldVerify: boolean
  ) => {
    if (!workModeValue) {
      toast.error("Select a work mode.")
      throw new Error("Work mode required")
    }
    try {
      await persistWorkExperienceRow(
        weIndex,
        { workMode: workModeValue },
        shouldVerify,
        "Work mode"
      )
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === "Invalid work experience id" ||
          err.message === "Employer not linked" ||
          err.message === "Work mode required")
      ) {
        return
      }
      toast.error(err instanceof Error ? err.message : "Failed to update work mode.")
      throw err
    }
  }

  const handleWorkExperienceTimeSupportZonesSave = async (
    weIndex: number,
    zoneNames: string[],
    shouldVerify: boolean
  ) => {
    try {
      if (!candidate) return
      const candidateId = Number(candidate.id)
      if (!Number.isFinite(candidateId)) {
        toast.error("Invalid candidate id.")
        throw new Error("Invalid candidate id")
      }
      const we = (fullCandidate ?? candidate).workExperiences?.[weIndex]
      if (!we) return
      const weId = Number(we.id)
      if (!Number.isFinite(weId)) {
        toast.error("Cannot update work experience without a valid id.")
        throw new Error("Invalid work experience id")
      }

      const tszLookup = apiTimeSupportZones
      const oldZones = we.timeSupportZones ?? []
      const oldIds = new Set<number>()
      for (const name of oldZones) {
        const id = lookupIdByName(tszLookup, name)
        if (id != null) oldIds.add(id)
      }

      const newIds = new Set<number>()
      for (const name of zoneNames) {
        const id = lookupIdByName(tszLookup, name)
        if (id == null) {
          toast.error(`Unknown time support zone: ${name}`)
          throw new Error("Unknown time support zone")
        }
        newIds.add(id)
      }

      const ops: Promise<unknown>[] = []
      for (const id of newIds) {
        if (!oldIds.has(id)) ops.push(addWeTimeSupportZone(candidateId, weId, id))
      }
      for (const id of oldIds) {
        if (!newIds.has(id)) ops.push(removeWeTimeSupportZone(candidateId, weId, id))
      }
      await Promise.all(ops)

      setFullCandidate((prev) => {
        const base = prev ?? candidate
        if (!base.workExperiences?.[weIndex]) return prev ?? base
        const nextWorkExperiences = [...base.workExperiences]
        nextWorkExperiences[weIndex] = {
          ...nextWorkExperiences[weIndex],
          timeSupportZones: zoneNames,
        }
        return { ...base, workExperiences: nextWorkExperiences }
      })

      const message = shouldVerify
        ? "Time support zones updated and verified ✓"
        : "Time support zones updated"
      toast.success(message)
      await refreshFullCandidate()
      onCandidateUpdated?.()
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === "Invalid candidate id" ||
          err.message === "Invalid work experience id" ||
          err.message === "Unknown time support zone")
      ) {
        return
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update time support zones."
      )
      throw err
    }
  }

  const handleWorkExperienceBenefitsSave = async (
    weIndex: number,
    benefits: EmployerBenefit[],
    shouldVerify: boolean
  ) => {
    try {
      if (!candidate) return
      const candidateId = Number(candidate.id)
      if (!Number.isFinite(candidateId)) {
        toast.error("Invalid candidate id.")
        throw new Error("Invalid candidate id")
      }
      const we = (fullCandidate ?? candidate).workExperiences?.[weIndex]
      if (!we) return
      const weId = Number(we.id)
      if (!Number.isFinite(weId)) {
        toast.error("Cannot update work experience without a valid id.")
        throw new Error("Invalid work experience id")
      }

      const benefitsLookup = apiBenefits
      const oldBenefits = we.benefits ?? []

      const oldIds = new Set<number>()
      for (const b of oldBenefits) {
        const id = resolveWorkExperienceBenefitId(b, benefitsLookup)
        if (id != null) oldIds.add(id)
      }

      const newIds = new Set<number>()
      const upsertOps: Promise<unknown>[] = []
      for (const b of benefits) {
        const benefitId = resolveWorkExperienceBenefitId(b, benefitsLookup)
        if (benefitId == null) {
          toast.error(`Unknown benefit: ${b.name}`)
          throw new Error("Unknown benefit")
        }
        newIds.add(benefitId)
        upsertOps.push(
          upsertWeBenefit(candidateId, weId, {
            benefitId,
            ...employerBenefitToApiValueFields(b),
          })
        )
      }

      const removeOps: Promise<unknown>[] = []
      for (const id of oldIds) {
        if (!newIds.has(id)) {
          removeOps.push(removeWeBenefit(candidateId, weId, id))
        }
      }

      await Promise.all([...upsertOps, ...removeOps])

      setFullCandidate((prev) => {
        const base = prev ?? candidate
        if (!base.workExperiences?.[weIndex]) return prev ?? base
        const nextWorkExperiences = [...base.workExperiences]
        nextWorkExperiences[weIndex] = {
          ...nextWorkExperiences[weIndex],
          benefits,
        }
        return { ...base, workExperiences: nextWorkExperiences }
      })

      const message = shouldVerify
        ? "Benefits updated and verified ✓"
        : "Benefits updated"
      toast.success(message)
      await refreshFullCandidate()
      onCandidateUpdated?.()
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === "Invalid candidate id" ||
          err.message === "Invalid work experience id" ||
          err.message === "Unknown benefit")
      ) {
        return
      }
      toast.error(err instanceof Error ? err.message : "Failed to update benefits.")
      throw err
    }
  }

  const persistCertificationRow = async (
    certIndex: number,
    patch: {
      certificationId?: number
      certificationLevel?: CandidateCertification["certificationLevel"]
      certificationName?: string
      certificationIssuerName?: string | null
    },
    shouldVerify: boolean,
    successLabel: string
  ) => {
    if (!candidate) return
    const candidateId = Number(candidate.id)
    if (!Number.isFinite(candidateId)) {
      toast.error("Invalid candidate id.")
      throw new Error("Invalid candidate id")
    }
    const cert = (fullCandidate ?? candidate).certifications?.[certIndex]
    if (!cert) return

    const certificationId = patch.certificationId ?? cert.certificationId
    if (certificationId == null) {
      toast.error("Link a certification before updating this field.")
      throw new Error("Certification not linked")
    }

    const nextLevel = patch.certificationLevel ?? cert.certificationLevel

    await upsertCandidateCertification(candidateId, {
      certificationId,
      issueDate: formatCertDateForApi(cert.issueDate),
      expiryDate: formatCertDateForApi(cert.expiryDate),
      url: cert.certificationUrl ?? null,
      level: certificationLevelToApiIndex(nextLevel),
    })

    setFullCandidate((prev) => {
      const base = prev ?? candidate
      if (!base.certifications?.[certIndex]) return prev ?? base
      const nextCerts = [...base.certifications]
      nextCerts[certIndex] = {
        ...nextCerts[certIndex],
        ...(patch.certificationId != null ? { certificationId: patch.certificationId } : {}),
        ...(patch.certificationName != null
          ? { certificationName: patch.certificationName }
          : {}),
        ...(patch.certificationIssuerName !== undefined
          ? { certificationIssuerName: patch.certificationIssuerName }
          : {}),
        ...(patch.certificationLevel !== undefined
          ? { certificationLevel: patch.certificationLevel }
          : {}),
      }
      return { ...base, certifications: nextCerts }
    })

    const message = shouldVerify
      ? `${successLabel} updated and verified ✓`
      : `${successLabel} updated`
    toast.success(message)
    await refreshFullCandidate()
    onCandidateUpdated?.()
  }

  const handleCertificationLinkSave = async (
    certIndex: number,
    selection: SelectedCertification,
    shouldVerify: boolean
  ) => {
    if (!selection?.id) return
    try {
      await persistCertificationRow(
        certIndex,
        {
          certificationId: selection.id,
          certificationName: selection.name,
          certificationIssuerName: selection.issuerName ?? null,
        },
        shouldVerify,
        "Certification"
      )
    } catch (err) {
      if (err instanceof Error && err.message === "Certification not linked") return
      toast.error(err instanceof Error ? err.message : "Failed to update certification.")
      throw err
    }
  }

  const handleCertificationLevelSave = async (
    certIndex: number,
    levelValue: string,
    shouldVerify: boolean
  ) => {
    const level = certificationLevelToSelectValue(levelValue) as CertificationLevelDb
    if (!level) {
      toast.error("Select a certification level.")
      throw new Error("Level required")
    }
    try {
      await persistCertificationRow(
        certIndex,
        {
          certificationLevel: level as CandidateCertification["certificationLevel"],
        },
        shouldVerify,
        "Certification level"
      )
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === "Certification not linked" || err.message === "Level required")
      ) {
        return
      }
      toast.error(err instanceof Error ? err.message : "Failed to update certification level.")
      throw err
    }
  }

  const handleStandaloneProjectLinkSave = async (
    projectIndex: number,
    selection: SelectedProject,
    shouldVerify: boolean
  ) => {
    if (!selection?.id || !candidate) return
    const candidateId = Number(candidate.id)
    if (!Number.isFinite(candidateId)) {
      toast.error("Invalid candidate id.")
      return
    }
    const proj = (fullCandidate ?? candidate).projects?.[projectIndex]
    if (!proj) return

    try {
      const oldProjectId = proj.projectId
      const contribution = proj.contributionNotes ?? null

      if (oldProjectId != null && oldProjectId !== selection.id) {
        await removeCandidateProject(candidateId, oldProjectId)
      }
      await upsertCandidateProject(candidateId, selection.id, contribution)

      setFullCandidate((prev) => {
        const base = prev ?? candidate
        if (!base.projects?.[projectIndex]) return prev ?? base
        const nextProjects = [...base.projects]
        nextProjects[projectIndex] = {
          ...nextProjects[projectIndex],
          projectId: selection.id,
          projectName: selection.name,
        }
        return { ...base, projects: nextProjects }
      })

      toast.success(
        shouldVerify ? "Project updated and verified ✓" : "Project updated"
      )
      await refreshFullCandidate()
      onCandidateUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project.")
      throw err
    }
  }

  const handleWorkExperienceProjectLinkSave = async (
    weIndex: number,
    projectIndex: number,
    selection: SelectedProject,
    shouldVerify: boolean
  ) => {
    if (!selection?.id || !candidate) return
    const candidateId = Number(candidate.id)
    if (!Number.isFinite(candidateId)) {
      toast.error("Invalid candidate id.")
      return
    }
    const we = (fullCandidate ?? candidate).workExperiences?.[weIndex]
    const proj = we?.projects?.[projectIndex]
    if (!we || !proj) return

    const weId = Number(we.id)
    if (!Number.isFinite(weId)) {
      toast.error("Invalid work experience id.")
      return
    }

    try {
      const oldProjectId = proj.projectId
      const contribution = proj.contributionNotes ?? null

      if (oldProjectId != null && oldProjectId !== selection.id) {
        await removeWeProject(candidateId, weId, oldProjectId)
      }
      await upsertWeProject(candidateId, weId, selection.id, contribution)

      setFullCandidate((prev) => {
        const base = prev ?? candidate
        const workExperiences = base.workExperiences
        if (!workExperiences?.[weIndex]?.projects?.[projectIndex]) return prev ?? base
        const nextWorkExperiences = [...workExperiences]
        const nextProjects = [...nextWorkExperiences[weIndex].projects]
        nextProjects[projectIndex] = {
          ...nextProjects[projectIndex],
          projectId: selection.id,
          projectName: selection.name,
        }
        nextWorkExperiences[weIndex] = {
          ...nextWorkExperiences[weIndex],
          projects: nextProjects,
        }
        return { ...base, workExperiences: nextWorkExperiences }
      })

      toast.success(
        shouldVerify ? "Project updated and verified ✓" : "Project updated"
      )
      await refreshFullCandidate()
      onCandidateUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project.")
      throw err
    }
  }

  // Handle certification creation
  const handleCertificationCreated = async (certificationData: CertificationFormData) => {
    try {
      const certificationName = certificationData.certificationName.trim()
      
      if (!certificationName) {
        toast.error("Certification name is required")
        return
      }

      // Generate a new ID for the certification (in a real app, this would come from the API)
      const newCertificationId = crypto.randomUUID()
      
      // Create new certification option
      const newOption = { label: certificationName, value: newCertificationId }
      setCertificationOptions(prev => {
        const updated = [...prev, newOption]
        return updated.sort((a, b) => a.label.localeCompare(b.label))
      })

      // Auto-select the newly created certification if we have a pending field
      if (pendingCertificationFieldName) {
        await handleFieldSave(pendingCertificationFieldName, newCertificationId, false)
        // Also update the name field if it exists
        const nameFieldName = pendingCertificationFieldName.replace('.certificationId', '.certificationName')
        await handleFieldSave(nameFieldName, certificationName, false)
      }

      toast.success(`Certification "${certificationName}" has been created successfully.`)
      setCreateCertificationDialogOpen(false)
      setPendingCertificationName("")
      setPendingCertificationFieldName(null)
    } catch (error) {
      console.error("Error creating certification:", error)
      toast.error("Failed to create certification. Please try again.")
    }
  }
  
  // const loadDataProgress = React.useCallback(async () => {
  //   if (!candidate) return
  //   const id = Number(candidate.id)
  //   if (!Number.isFinite(id)) return
  //   setDataProgressLoading(true)
  //   setDataProgressError(null)
  //   try {
  //     const result = await fetchCandidateDataProgress(id)
  //     setDataProgress(result)
  //   } catch (e) {
  //     setDataProgress(null)
  //     setDataProgressError(e instanceof Error ? e.message : "Failed to load data progress")
  //   } finally {
  //     setDataProgressLoading(false)
  //   }
  // }, [candidate])

  // useEffect(() => {
  //   if (!open || !candidate) {
  //     setDataProgress(null)
  //     setDataProgressError(null)
  //     setDataProgressLoading(false)
  //     return
  //   }
  //   void loadDataProgress()
  // }, [open, candidate?.id, loadDataProgress])

  const refreshFullCandidate = React.useCallback(async () => {
    if (!candidate?.id) return
    const id = Number(candidate.id)
    if (!Number.isFinite(id)) return
    try {
      const full = await fetchCandidateById(id)
      setFullCandidate(full)
    } catch {
      // Keep prior fullCandidate on refresh failure
    }
  }, [candidate?.id])

  useEffect(() => {
    if (!open || !candidate?.id) {
      setFullCandidate(null)
      setFullCandidateLoading(false)
      return
    }
    const id = Number(candidate.id)
    if (!Number.isFinite(id)) return

    let cancelled = false
    setFullCandidateLoading(true)
    fetchCandidateById(id)
      .then((full) => {
        if (!cancelled) setFullCandidate(full)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load candidate details."
          )
          setFullCandidate(null)
        }
      })
      .finally(() => {
        if (!cancelled) setFullCandidateLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, candidate?.id])
  
  const handleEditSubmit = async (formData: CandidateFormData, verificationState?: VerificationState) => {
    if (!candidate) return
    const id = Number(candidate.id)
    if (!Number.isFinite(id)) {
      toast.error("Invalid candidate id.")
      return
    }
    const existing = fullCandidate ?? candidate
    try {
      const preparedLookups = await prepareCandidateCreateLookups(formData, editLookups)
      await updateCandidate(id, candidateFormDataToUpdateDto(formData, existing))
      await syncCandidateSubResources(id, formData, existing, preparedLookups)

      const verifiedCount = verificationState?.verifiedFields.size || 0
      const modifiedCount = verificationState?.modifiedFields.size || 0
      toast.success(
        `Candidate updated! ${verifiedCount} field(s) verified${modifiedCount > 0 ? `, ${modifiedCount} field(s) modified` : ""}.`,
        { duration: 4000 }
      )
      setEditDialogOpen(false)
      // await loadDataProgress()
      await refreshFullCandidate()
      onCandidateUpdated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update candidate.")
      throw err
    }
  }

  // Get verification data for this candidate
  const verifications = useMemo(() => 
    candidate ? getVerificationsForCandidate(candidate.id) : [],
    [candidate]
  )
  
  const verificationSummary = useMemo(() => 
    candidate ? calculateVerificationSummary(candidate.id) : null,
    [candidate]
  )
  
  // Helper to get verification status for a field
  const getFieldVerification = (fieldName: string) => {
    return verifications.find(v => v.fieldName === fieldName)
  }
  
  // Helper to get audit history for a field
  const getFieldHistory = (fieldName: string) => {
    const verification = getFieldVerification(fieldName)
    if (!verification) return []
    return getAuditLogsForVerification(verification.id)
  }
  
  // Get user name from ID
  const getVerifiedByName = (userId: string | undefined) => {
    if (!userId) return undefined
    const user = sampleVerificationUsers.find(u => u.id === userId)
    return user?.name
  }

  // Calculate section-specific verification progress
  const calculateSectionProgress = (fieldNames: string[]): { percentage: number; verified: number; total: number } => {
    let verified = 0
    let total = 0

    fieldNames.forEach(fieldName => {
      total++
      const verification = getFieldVerification(fieldName)
      if (verification && verification.status === 'verified') {
        verified++
      }
    })

    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0
    return { percentage, verified, total }
  }

  // Get progress color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-500 hover:bg-green-600'
    if (percentage >= 70) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-red-500 hover:bg-red-600'
  }

  // Section Progress Badge Component
  const SectionProgressBadge = ({ 
    percentage, 
    verified, 
    total 
  }: { 
    percentage: number
    verified: number
    total: number 
  }) => {
    if (total === 0) return null

    return (
      <Badge 
        variant="default" 
        className={`${getProgressColor(percentage)} text-white text-xs font-medium`}
      >
        {percentage}% verified ({verified}/{total})
      </Badge>
    )
  }

  // Calculate progress for each section
  const basicInfoFields = [
    'name', 'city', 'email', 'mobileNo', 'cnic', 'postingTitle', 
    'currentSalary', 'expectedSalary', 'source', 'githubUrl', 'linkedinUrl', 'resume', 'personalityType'
  ]
  const basicInfoProgress = useMemo(() => 
    calculateSectionProgress(basicInfoFields),
    [verifications, resolvedCandidate]
  )

  const workExperienceProgress = useMemo(() => {
    if (!resolvedCandidate?.workExperiences || resolvedCandidate.workExperiences.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    resolvedCandidate.workExperiences.forEach((exp, idx) => {
      fields.push(`workExperiences[${idx}].employerName`)
      fields.push(`workExperiences[${idx}].jobTitle`)
      fields.push(`workExperiences[${idx}].dates`)
      fields.push(`workExperiences[${idx}].shiftType`)
      fields.push(`workExperiences[${idx}].workMode`)
      fields.push(`workExperiences[${idx}].timeSupportZones`)
      fields.push(`workExperiences[${idx}].techStacks`)
      exp.projects.forEach((proj, projIdx) => {
        fields.push(`workExperiences[${idx}].projects[${projIdx}].projectId`)
        fields.push(`workExperiences[${idx}].projects[${projIdx}].contributionNotes`)
      })
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, resolvedCandidate])

  const techStacksProgress = useMemo(() => {
    if (!resolvedCandidate?.techStacks || resolvedCandidate.techStacks.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    return calculateSectionProgress(['techStacks'])
  }, [verifications, resolvedCandidate])

  const independentProjectsProgress = useMemo(() => {
    if (!resolvedCandidate?.projects || resolvedCandidate.projects.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    resolvedCandidate.projects.forEach((proj, idx) => {
      fields.push(`projects[${idx}].projectId`)
      fields.push(`projects[${idx}].contributionNotes`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, resolvedCandidate])

  const educationProgress = useMemo(() => {
    if (!resolvedCandidate?.educations || resolvedCandidate.educations.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    resolvedCandidate.educations.forEach((edu, idx) => {
      fields.push(`educations[${idx}].universityLocationName`)
      fields.push(`educations[${idx}].degreeName`)
      fields.push(`educations[${idx}].majorName`)
      fields.push(`educations[${idx}].dates`)
      fields.push(`educations[${idx}].grades`)
      fields.push(`educations[${idx}].isTopper`)
      fields.push(`educations[${idx}].isCheetah`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, resolvedCandidate])

  const certificationsProgress = useMemo(() => {
    if (!resolvedCandidate?.certifications || resolvedCandidate.certifications.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    resolvedCandidate.certifications.forEach((cert, idx) => {
      fields.push(`certifications[${idx}].certificationId`)
      fields.push(`certifications[${idx}].certificationName`)
      fields.push(`certifications[${idx}].certificationLevel`)
      fields.push(`certifications[${idx}].issueDate`)
      fields.push(`certifications[${idx}].expiryDate`)
      fields.push(`certifications[${idx}].certificationUrl`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, resolvedCandidate])

  const achievementsProgress = useMemo(() => {
    const achievements = resolvedCandidate?.achievements || resolvedCandidate?.competitions?.map(comp => ({
      id: comp.id,
      name: comp.competitionName,
      achievementType: "Competition" as const,
      ranking: comp.ranking,
      year: comp.year,
      url: comp.url,
      description: "",
    })) || []
    
    if (achievements.length === 0) {
      return { percentage: 0, verified: 0, total: 0 }
    }
    
    const fields: string[] = []
    achievements.forEach((ach, idx) => {
      fields.push(`achievements[${idx}].name`)
      fields.push(`achievements[${idx}].achievementType`)
      fields.push(`achievements[${idx}].ranking`)
      fields.push(`achievements[${idx}].year`)
      fields.push(`achievements[${idx}].url`)
      fields.push(`achievements[${idx}].description`)
    })
    
    return calculateSectionProgress(fields)
  }, [verifications, resolvedCandidate])


  // Helper function to get progress for a section by sectionId
  const getSectionProgress = (sectionId: string) => {
    switch (sectionId) {
      case 'basic-info':
        return basicInfoProgress
      case 'work-experience':
        return workExperienceProgress
      case 'tech-stacks':
        return techStacksProgress
      case 'projects':
        return independentProjectsProgress
      case 'education':
        return educationProgress
      case 'certifications':
        return certificationsProgress
      case 'competitions':
        return achievementsProgress
      default:
        return { percentage: 0, verified: 0, total: 0 }
    }
  }

  // Helper function to get verification badge color (matches section badge styling)
  const getVerificationBadgeColor = (percentage: number): string => {
    if (percentage === 100) {
      return 'bg-green-500 hover:bg-green-600 text-white'
    } else if (percentage >= 70) {
      return 'bg-yellow-500 hover:bg-yellow-600 text-white'
    } else {
      return 'bg-red-500 hover:bg-red-600 text-white'
    }
  }

  if (!candidate) return null

  const viewCandidate: Candidate = fullCandidate ?? candidate
  
  // Verification indicator component - shows badge and history together
  const VerificationIndicator = ({ 
    fieldName, 
    className = "" 
  }: { 
    fieldName: string
    className?: string 
  }) => {
    const verification = getFieldVerification(fieldName)
    const history = getFieldHistory(fieldName)
    
    // If no verification data exists, show unverified badge
    const status = verification?.status || 'unverified'
    
    return (
      <div className={`flex items-center gap-1 shrink-0 ${className}`}>
        <VerificationBadge 
          status={status}
          source={verification?.source}
          verifiedBy={getVerifiedByName(verification?.verifiedBy)}
          verifiedAt={verification?.verifiedAt}
          size="sm"
        />
        {history.length > 0 && (
          <FieldHistoryPopover 
            fieldName={fieldName}
            history={history}
          />
        )}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    }).format(date)
  }

  const formatMonth = (date: Date | undefined) => {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short'
    }).format(date)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handleEmployerClick = (employerId: number, employerName: string) => {
      const params = new URLSearchParams({
      employerFilter: employerName,
      employerId: String(employerId),
      })
      router.push(`/employers?${params.toString()}`)
    onOpenChange(false)
  }

  const handleUniversityClick = (universityId: string, universityName: string) => {
    const idNum = Number(universityId)
    if (!Number.isFinite(idNum)) return
      const params = new URLSearchParams({
      universityFilter: universityName,
      universityId: String(idNum),
      })
      router.push(`/universities?${params.toString()}`)
    onOpenChange(false)
  }

  const handleCertificationClick = (certificationId: string, certificationName: string) => {
    const params = new URLSearchParams({
      certificationFilter: certificationName,
      certificationId: certificationId
    })
    router.push(`/certifications?${params.toString()}`)
    onOpenChange(false)
  }

  const handleProjectClick = (projectId: number | null, projectName: string) => {
    if (projectId != null && Number.isFinite(projectId)) {
      const params = new URLSearchParams({
        projectFilter: projectName,
        projectId: String(projectId),
      })
      router.push(`/projects?${params.toString()}`)
      onOpenChange(false)
      return
    }
    const project = sampleProjects.find(
      (proj) => proj.projectName.trim().toLowerCase() === projectName.trim().toLowerCase()
    )
    if (project) {
      const params = new URLSearchParams({
        projectFilter: project.projectName,
        projectId: project.id,
      })
      router.push(`/projects?${params.toString()}`)
      onOpenChange(false)
    }
  }

  const workExperiences = viewCandidate.workExperiences || []
  const independentProjects = viewCandidate.projects || []
  const educations = viewCandidate.educations || []
  const certifications = viewCandidate.certifications || []
  // Use achievements if available, otherwise fall back to competitions (legacy)
  const achievements = viewCandidate.achievements || viewCandidate.competitions?.map(comp => ({
    id: comp.id,
    name: comp.competitionName,
    achievementType: "Competition" as const,
    ranking: comp.ranking,
    year: comp.year,
    url: comp.url,
    description: "",
  })) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-6xl lg:!max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="size-7 text-primary" />
            </div>
            <div>
                <DialogTitle className="text-2xl font-semibold mb-1">
                  {viewCandidate.name}
          </DialogTitle>
                <p className="text-sm text-muted-foreground mb-2">{getJobTitle(viewCandidate)}</p>
              </div>
            </div>
            <div className="flex gap-2 mr-12">
              {/* Edit & Verify Button (includes verification) */}
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setEditDialogOpen(true)}
                className="gap-1.5"
              >
                <ShieldCheck className="size-4" />
                Edit & Verify
              </Button>
              
              {/* Interaction Mode Selector */}
              <Select 
                value={interactionMode || undefined} 
                onValueChange={(value) => {
                  const selectedMode = value as InteractionMode
                  setInteractionMode(selectedMode)
                  setInteractionDialogOpen(true)
                }}
              >
                <SelectTrigger 
                  size="sm" 
                  className="w-[180px] h-8 px-3 gap-1.5 text-sm font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 [&_svg:not([class*='text-'])]:text-foreground data-[placeholder]:text-foreground"
                >
                  <SelectValue placeholder="Select a Mode">
                    {interactionMode ? (() => {
                      const config = MODE_CONFIG[interactionMode]
                      const Icon = MODE_ICONS[interactionMode]
                      return (
                        <div className="flex items-center gap-1.5">
                          <Icon className="size-4" />
                          <span>{config.label}</span>
                        </div>
                      )
                    })() : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODE_CONFIG).map(([key, config]) => {
                    const Icon = MODE_ICONS[key as InteractionMode]
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{config.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {config.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              
              {viewCandidate.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${viewCandidate.email}`}>
                  <Mail className="size-4" />
                </a>
              </Button>
              )}
              {viewCandidate.mobileNo && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${viewCandidate.mobileNo}`}>
                  <Phone className="size-4" />
                </a>
              </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Sticky Section Navigation */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border shadow-sm">
          <Tabs 
            value={activeSection} 
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {sections.map((section) => {
                const progress = getSectionProgress(section.sectionId)
                const isFullyVerified = progress.percentage === 100
                
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.sectionId}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-t transition-colors whitespace-nowrap h-12 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                      "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground",
                      "border-b-2 border-transparent",
                      "cursor-pointer flex items-center gap-2"
                    )}
                    aria-label={`Jump to ${section.label} section - ${progress.percentage}% verified (${progress.verified}/${progress.total})`}
                  >
                    <span className="hidden lg:inline">{section.label}</span>
                    <span className="lg:hidden">{section.shortLabel}</span>
                    
                    {/* Verification Badge */}
                    {progress.total > 0 && (
                      <Badge 
                        variant="default"
                        className={cn(
                          "text-xs px-1.5 py-0.5 font-medium shrink-0",
                          getVerificationBadgeColor(progress.percentage)
                        )}
                      >
                        {isFullyVerified ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          `${progress.percentage}%`
                        )}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
              </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          {/* <CandidateDataProgressPanel
            progress={dataProgress}
            loading={dataProgressLoading}
            error={dataProgressError}
            onRetry={() => void loadDataProgress()}
          /> */}

          {/* Verification Summary Bar */}
          {verificationSummary && verificationSummary.totalFields > 0 && (
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
              <ShieldCheck className="size-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">Data Verification</span>
                  <Badge variant={verificationSummary.verificationPercentage === 100 ? 'default' : 'secondary'}>
                    {verificationSummary.verificationPercentage}% Verified
                  </Badge>
              </div>
                <Progress value={verificationSummary.verificationPercentage} className="h-2" />
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{verificationSummary.verifiedFields} verified</span>
                  <span>{verificationSummary.unverifiedFields} unverified</span>
              </div>
              </div>
              </div>
          )}

          {/* Basic Information */}
          <section id="basic-info">
            <Collapsible 
              open={expandedSections.has("basic")} 
              onOpenChange={() => toggleSection("basic")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="size-5" />
                      Basic Information
                      <SectionProgressBadge 
                        percentage={basicInfoProgress.percentage}
                        verified={basicInfoProgress.verified}
                        total={basicInfoProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("basic") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
              </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-2">
                  {/* Inline Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    <InlineEditableField 
                      label="Full Name" 
                      value={viewCandidate.name} 
                      fieldName="name"
                      fieldType="text"
                      validation={validateName}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="name" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="City" 
                      value={viewCandidate.city} 
                      fieldName="city"
                      fieldType="text"
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="city" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Email Address" 
                      value={viewCandidate.email} 
                      fieldName="email"
                      fieldType="email"
                      validation={validateEmail}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="email" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Mobile Number" 
                      value={viewCandidate.mobileNo} 
                      fieldName="mobileNo"
                      fieldType="text"
                      validation={validatePhone}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="mobileNo" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="CNIC" 
                      value={viewCandidate.cnic} 
                      fieldName="cnic"
                      fieldType="text"
                      validation={validateCNIC}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="cnic" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Posting Title" 
                      value={viewCandidate.postingTitle} 
                      fieldName="postingTitle"
                      fieldType="text"
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="postingTitle" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Current Salary" 
                      value={viewCandidate.currentSalary} 
                      fieldName="currentSalary"
                      fieldType="number"
                      validation={validateSalary}
                      onSave={handleFieldSave}
                      formatDisplay={(val) => val ? formatCurrency(Number(val)) : 'N/A'}
                      verificationIndicator={<VerificationIndicator fieldName="currentSalary" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableField 
                      label="Expected Salary" 
                      value={viewCandidate.expectedSalary} 
                      fieldName="expectedSalary"
                      fieldType="number"
                      validation={validateSalary}
                      onSave={handleFieldSave}
                      formatDisplay={(val) => val ? formatCurrency(Number(val)) : 'N/A'}
                      verificationIndicator={<VerificationIndicator fieldName="expectedSalary" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableSelect
                      label="Source"
                      value={viewCandidate.source}
                      fieldName="source"
                      options={candidateSourceSelectOptions}
                      normalizeValue={candidateSourceToSelectValue}
                      formatDisplay={candidateSourceDisplayLabel}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="source" />}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableCheckbox
                      label="Top Developer"
                      value={viewCandidate.isTopDeveloper === true}
                      fieldName="isTopDeveloper"
                      onSave={async (fieldName, newValue, verify) => {
                        await handleFieldSave(fieldName, newValue, verify)
                      }}
                      getFieldVerification={getFieldVerification}
                    />
                    <InlineEditableCombobox
                      label="Personality Type"
                      value={personalityTypeToSelectValue(viewCandidate.personalityType)}
                      fieldName="personalityType"
                      options={personalityTypeSelectOptions}
                      onSave={handleFieldSave}
                      verificationIndicator={<VerificationIndicator fieldName="personalityType" />}
                      getFieldVerification={getFieldVerification}
                      placeholder="Select personality type..."
                      searchPlaceholder="Search personality types..."
                      emptyMessage="No personality type found."
                    />
          </div>

                  <Separator />
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Links & Resources</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      <div className="space-y-2">
                        <InlineEditableField 
                          label="LinkedIn URL" 
                          value={viewCandidate.linkedinUrl ?? ''} 
                          fieldName="linkedinUrl"
                          fieldType="url"
                          validation={validateLinkedInURL}
                          onSave={handleFieldSave}
                          verificationIndicator={<VerificationIndicator fieldName="linkedinUrl" />}
                          getFieldVerification={getFieldVerification}
                        />
                        <VisitUrlButton url={viewCandidate.linkedinUrl} label="Visit LinkedIn" />
                      </div>
                      <div className="space-y-2">
                        <InlineEditableField 
                          label="GitHub URL" 
                          value={viewCandidate.githubUrl ?? ''} 
                          fieldName="githubUrl"
                          fieldType="url"
                          validation={validateGitHubURL}
                          onSave={handleFieldSave}
                          verificationIndicator={<VerificationIndicator fieldName="githubUrl" />}
                          getFieldVerification={getFieldVerification}
                        />
                        <VisitUrlButton url={viewCandidate.githubUrl} label="Visit GitHub" />
                      </div>
                      <InlineEditableResume
                        label="Resume"
                        resumeUrl={viewCandidate.resume}
                        fieldName="resume"
                        onSave={handleResumeSave}
                        verificationIndicator={<VerificationIndicator fieldName="resume" />}
                        getFieldVerification={getFieldVerification}
                      />
                    </div>
                  </div>

                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Work Experience */}
          <section id="work-experience">
            <Collapsible 
              open={expandedSections.has("work-experience")} 
              onOpenChange={() => toggleSection("work-experience")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="size-5" />
                      Work Experience
                      {workExperiences.length > 0 && (
                        <>
                          <Badge variant="secondary" className="ml-2">
                            {workExperiences.length}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="ml-1 h-5 px-1.5 text-xs font-medium border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          >
                            Avg {calculateCandidateAverageTenure(viewCandidate).toFixed(1)}y tenure
                          </Badge>
                          {getTotalExperienceYears(viewCandidate) != null && (
                            <Badge
                              variant="outline"
                              className="ml-1 h-5 px-1.5 text-xs font-medium border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              {formatYearsOfExperience(viewCandidate)} total
                            </Badge>
                          )}
                        </>
                      )}
                      <SectionProgressBadge
                        percentage={workExperienceProgress.percentage}
                        verified={workExperienceProgress.verified}
                        total={workExperienceProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("work-experience") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {workExperiences.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No work experience recorded</p>
                  ) : (
                    workExperiences.map((experience, idx) => (
                      <div key={experience.id}>
                        {idx > 0 && <Separator className="my-6" />}
          <div className="space-y-4">
                          {/* Employer and Job Title */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="size-5 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <InlineEditableEmployer
                                    experience={experience}
                                    weIndex={idx}
                                    onSave={handleWorkExperienceEmployerSave}
                                    onEmployerClick={handleEmployerClick}
                                    createEmployerLookups={employerCreateLookups}
                                    verificationIndicator={
                                      <VerificationIndicator
                                    fieldName={`workExperiences[${idx}].employerName`}
                                      />
                                    }
                                    getFieldVerification={getFieldVerification}
                                  />
                                </div>
                              </div>
                              <div className="ml-7">
                                <InlineEditableField 
                                  label="Job Title" 
                                  value={experience.jobTitle} 
                                  fieldName={`workExperiences[${idx}].jobTitle`}
                                  fieldType="text"
                                  onSave={handleFieldSave}
                                  verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].jobTitle`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteWorkExperience(idx)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex-shrink-0"
                                title="Delete work experience"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InlineEditableDate
                                  label="Start Date"
                                  value={experience.startDate}
                                  fieldName={`workExperiences[${idx}].startDate`}
                                  onSave={handleFieldSave}
                                  formatDisplay={formatDate}
                                  verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].startDate`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                                <InlineEditableDate
                                  label="End Date"
                                  value={experience.endDate}
                                  fieldName={`workExperiences[${idx}].endDate`}
                                  onSave={handleFieldSave}
                                  formatDisplay={formatDate}
                                  verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].endDate`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Work Details Grid */}
                          <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InlineEditableSelect
                                label="Shift Type"
                                value={experience.shiftType}
                                fieldName={`workExperiences[${idx}].shiftType`}
                              options={shiftTypeSelectOptions}
                              normalizeValue={shiftTypeToSelectValue}
                              formatDisplay={shiftTypeDisplayLabel}
                              onSave={async (_fieldName, newValue, shouldVerify) => {
                                await handleWorkExperienceShiftTypeSave(idx, newValue, shouldVerify)
                              }}
                              verificationIndicator={
                                <VerificationIndicator fieldName={`workExperiences[${idx}].shiftType`} />
                              }
                                getFieldVerification={getFieldVerification}
                              />
                            <InlineEditableSelect
                                label="Work Mode"
                                value={experience.workMode}
                                fieldName={`workExperiences[${idx}].workMode`}
                              options={workModeSelectOptions}
                              normalizeValue={workModeToSelectValue}
                              formatDisplay={workModeDisplayLabel}
                              onSave={async (_fieldName, newValue, shouldVerify) => {
                                await handleWorkExperienceWorkModeSave(idx, newValue, shouldVerify)
                              }}
                              verificationIndicator={
                                <VerificationIndicator fieldName={`workExperiences[${idx}].workMode`} />
                              }
                                getFieldVerification={getFieldVerification}
                              />
                          </div>

                          {/* Time Support Zones */}
                          <div className="ml-7">
                            <InlineEditableMultiSelect
                              label="Time Support Zones"
                              value={experience.timeSupportZones || []}
                              fieldName={`workExperiences[${idx}].timeSupportZones`}
                              options={timeSupportZoneOptions}
                              onSave={async (_fieldName, newValue, shouldVerify) => {
                                await handleWorkExperienceTimeSupportZonesSave(
                                  idx,
                                  newValue,
                                  shouldVerify
                                )
                              }}
                              verificationIndicator={
                                <VerificationIndicator
                                  fieldName={`workExperiences[${idx}].timeSupportZones`}
                                />
                              }
                              getFieldVerification={getFieldVerification}
                              placeholder="Select time zones..."
                              searchPlaceholder="Search time zones..."
                              badgeColorClass="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              maxDisplay={5}
                              creatable={true}
                              createLabel="Add Time Zone"
                              onCreateNew={async (newZone) => {
                                try {
                                  const created = await createTimeSupportZone(newZone)
                                  setApiTimeSupportZones((prev) => [
                                    ...prev.filter((z) => z.id !== created.id),
                                    created,
                                  ])
                                  const currentValue = experience.timeSupportZones || []
                                  if (!currentValue.includes(created.name)) {
                                    await handleWorkExperienceTimeSupportZonesSave(
                                      idx,
                                      [...currentValue, created.name],
                                      false
                                    )
                                  }
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to add time support zone."
                                  )
                                }
                              }}
                            />
                          </div>

                          {/* Tech Stacks */}
                          <div className="ml-7">
                            <InlineEditableMultiSelect
                              label="Tech Stacks"
                              value={experience.techStacks || []}
                              fieldName={`workExperiences[${idx}].techStacks`}
                              options={techStackOptions}
                              onSave={handleMultiSelectFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].techStacks`} />}
                              getFieldVerification={getFieldVerification}
                              placeholder="Select technologies..."
                              searchPlaceholder="Search technologies..."
                              badgeColorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              maxDisplay={5}
                              creatable={true}
                              createLabel="Create Tech Stack"
                              onCreateNew={(newTechStack) => {
                                const newOption = { label: newTechStack, value: newTechStack }
                                setExtraTechStackOptions((prev) => {
                                  const updated = [...prev, newOption]
                                  return updated.sort((a, b) => a.label.localeCompare(b.label))
                                })
                                // Add to current selection
                                const currentValue = experience.techStacks || []
                                if (!currentValue.includes(newTechStack)) {
                                  handleMultiSelectFieldSave(`workExperiences[${idx}].techStacks`, [...currentValue, newTechStack], false)
                                }
                              }}
                            />
                          </div>
                          {/* Benefits */}
                          <div className="ml-7">
                            <InlineEditableBenefits
                              label="Benefits"
                              value={experience.benefits || []}
                              fieldName={`workExperiences[${idx}].benefits`}
                              benefitOptions={apiBenefits}
                              onCreateBenefit={handleCreateBenefit}
                              benefitsLoading={benefitsCatalogLoading}
                              onSave={async (_fieldName, newValue, shouldVerify) => {
                                await handleWorkExperienceBenefitsSave(idx, newValue, shouldVerify)
                              }}
                              verificationIndicator={<VerificationIndicator fieldName={`workExperiences[${idx}].benefits`} />}
                              getFieldVerification={getFieldVerification}
                              maxDisplay={4}
                            />
                          </div>

                          {/* Projects within Work Experience */}
                          {experience.projects.length > 0 && (
                            <div className="ml-7 space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <FolderOpen className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Projects ({experience.projects.length})</span>
                              </div>
                              <div className="space-y-3">
                                {experience.projects.map((project, projIdx) => (
                                  <div key={project.id} className="border rounded-md p-4 bg-muted/30">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="mb-2 w-full min-w-0">
                                          <InlineEditableProject
                                            project={project}
                                            comboboxId={`work-exp-project-${idx}-${projIdx}`}
                                            fieldName={`workExperiences[${idx}].projects[${projIdx}].projectId`}
                                            onSave={(selection, shouldVerify) =>
                                              handleWorkExperienceProjectLinkSave(
                                                idx,
                                                projIdx,
                                                selection,
                                                shouldVerify
                                              )
                                            }
                                            onProjectClick={handleProjectClick}
                                            verificationIndicator={
                                              <VerificationIndicator
                                                fieldName={`workExperiences[${idx}].projects[${projIdx}].projectId`}
                                              />
                                            }
                                            getFieldVerification={getFieldVerification}
                                            projectLookups={projectLookups}
                                            titleClassName="text-base font-medium"
                                          />
                                        </div>
                                        {project.projectName && (
                                          <DomainBadges
                                            projectName={project.projectName}
                                            {...getProjectDetails(project.projectName)}
                                          />
                                        )}
                                          <InlineEditableTextarea
                                          value={project.contributionNotes ?? ''}
                                            fieldName={`workExperiences[${idx}].projects[${projIdx}].contributionNotes`}
                                            onSave={handleFieldSave}
                                            maxLength={100}
                                            verificationIndicator={
                                              <VerificationIndicator fieldName={`workExperiences[${idx}].projects[${projIdx}].contributionNotes`} />
                                            }
                                            getFieldVerification={getFieldVerification}
                                          />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteWorkExperienceProject(idx, projIdx)}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex-shrink-0"
                                        title="Delete project"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Tech Stacks */}
          <section id="tech-stacks">
            <Collapsible 
              open={expandedSections.has("tech-stacks")} 
              onOpenChange={() => toggleSection("tech-stacks")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="size-5" />
                      Tech Stacks
                      {viewCandidate.techStacks && viewCandidate.techStacks.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {viewCandidate.techStacks.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={techStacksProgress.percentage}
                        verified={techStacksProgress.verified}
                        total={techStacksProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("tech-stacks") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {!viewCandidate.techStacks || viewCandidate.techStacks.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No tech stacks recorded</p>
                  ) : (
                    <div className="space-y-4">
                      <InlineEditableMultiSelect
                        label="Technical Skills"
                        value={viewCandidate.techStacks}
                        fieldName="techStacks"
                        options={techStackOptions}
                        onSave={handleMultiSelectFieldSave}
                        verificationIndicator={<VerificationIndicator fieldName="techStacks" />}
                        getFieldVerification={getFieldVerification}
                        placeholder="Select technologies..."
                        searchPlaceholder="Search technologies..."
                        badgeColorClass="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        maxDisplay={6}
                        creatable={true}
                        createLabel="Create Tech Stack"
                        onCreateNew={(newTechStack) => {
                          const newOption = { label: newTechStack, value: newTechStack }
                          setExtraTechStackOptions((prev) => {
                            const updated = [...prev, newOption]
                            return updated.sort((a, b) => a.label.localeCompare(b.label))
                          })
                          // Add to current selection
                          const currentValue = viewCandidate.techStacks || []
                          if (!currentValue.includes(newTechStack)) {
                            handleMultiSelectFieldSave("techStacks", [...currentValue, newTechStack], false)
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Independent Projects */}
          <section id="projects">
            <Collapsible 
              open={expandedSections.has("independent-projects")} 
              onOpenChange={() => toggleSection("independent-projects")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="size-5" />
                      Projects
                      {independentProjects.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {independentProjects.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={independentProjectsProgress.percentage}
                        verified={independentProjectsProgress.verified}
                        total={independentProjectsProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("independent-projects") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {independentProjects.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No projects recorded</p>
                  ) : (
                    independentProjects.map((project, idx) => (
                      <div key={project.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-2 w-full min-w-0">
                                <InlineEditableProject
                                  project={project}
                                  comboboxId={`standalone-project-${idx}`}
                                  fieldName={`projects[${idx}].projectId`}
                                  onSave={(selection, shouldVerify) =>
                                    handleStandaloneProjectLinkSave(idx, selection, shouldVerify)
                                  }
                                  onProjectClick={handleProjectClick}
                                  verificationIndicator={
                                    <VerificationIndicator
                                      fieldName={`projects[${idx}].projectId`}
                                    />
                                  }
                                  getFieldVerification={getFieldVerification}
                                  projectLookups={projectLookups}
                                />
                              </div>
                              {project.projectName && (
                                <DomainBadges
                                  projectName={project.projectName}
                                  {...getProjectDetails(project.projectName)}
                                />
                              )}
                                <InlineEditableTextarea
                                value={project.contributionNotes ?? ''}
                                  fieldName={`projects[${idx}].contributionNotes`}
                                  onSave={handleFieldSave}
                                  maxLength={100}
                                  className="mt-2"
                                  verificationIndicator={
                                    <VerificationIndicator fieldName={`projects[${idx}].contributionNotes`} />
                                  }
                                  getFieldVerification={getFieldVerification}
                                />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(idx)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex-shrink-0"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Education */}
          <section id="education">
            <Collapsible 
              open={expandedSections.has("education")} 
              onOpenChange={() => toggleSection("education")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="size-5" />
                      Education
                      {educations.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {educations.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={educationProgress.percentage}
                        verified={educationProgress.verified}
                        total={educationProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("education") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {fullCandidateLoading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      <span className="text-base">Loading education…</span>
                    </div>
                  ) : educations.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No education records</p>
                  ) : (
                    educations.map((education, idx) => (
                      <div key={education.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          {/* University Name */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <InlineEditableUniversity
                                education={education}
                                eduIndex={idx}
                                onSave={handleEducationUniversitySave}
                                onUniversityClick={(universityId, universityName) =>
                                  handleUniversityClick(String(universityId), universityName)
                                }
                                verificationIndicator={
                                  <VerificationIndicator
                                    fieldName={`educations[${idx}].universityLocationName`}
                                  />
                                }
                                  getFieldVerification={getFieldVerification}
                              />
                              {/* Degree, Major, and Grades - Same size and spacing */}
                              <div className="space-y-2">
                                <InlineEditableCombobox
                                  label="Degree Name"
                                  value={education.degreeName}
                                  fieldName={`educations[${idx}].degreeName`}
                                  options={degreeOptions}
                                  catalogOptions={degreeCatalogOptions}
                                  optionsLoading={degreesMajorsLoading}
                                  onSave={handleFieldSave}
                                  placeholder="Select degree..."
                                  searchPlaceholder="Search degrees..."
                                  verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].degreeName`} />}
                                  getFieldVerification={getFieldVerification}
                                  creatable={true}
                                  createLabel="Add New Degree"
                                  onCreateNew={async (newDegree) => {
                                    try {
                                      const created = await createDegree(newDegree)
                                      setDegreeMajorLookups((prev) => ({
                                        ...prev,
                                        degrees: [
                                          ...prev.degrees.filter((d) => d.id !== created.id),
                                          created,
                                        ].sort((a, b) => a.name.localeCompare(b.name)),
                                      }))
                                      await handleFieldSave(
                                        `educations[${idx}].degreeName`,
                                        created.name,
                                        false
                                      )
                                    } catch (err) {
                                      toast.error(
                                        err instanceof Error ? err.message : "Failed to add degree."
                                      )
                                    }
                                  }}
                                />
                                  <InlineEditableCombobox
                                    label="Major Name"
                                  value={education.majorName ?? ''}
                                    fieldName={`educations[${idx}].majorName`}
                                    options={majorOptions}
                                    catalogOptions={majorCatalogOptions}
                                    optionsLoading={degreesMajorsLoading}
                                    onSave={handleFieldSave}
                                    placeholder="Select major..."
                                    searchPlaceholder="Search majors..."
                                    verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].majorName`} />}
                                    getFieldVerification={getFieldVerification}
                                    creatable={true}
                                    createLabel="Add New Major"
                                    onCreateNew={async (newMajor) => {
                                      try {
                                        const created = await createMajor(newMajor)
                                        setDegreeMajorLookups((prev) => ({
                                          ...prev,
                                          majors: [
                                            ...prev.majors.filter((m) => m.id !== created.id),
                                            created,
                                          ].sort((a, b) => a.name.localeCompare(b.name)),
                                        }))
                                        await handleFieldSave(
                                          `educations[${idx}].majorName`,
                                          created.name,
                                          false
                                        )
                                      } catch (err) {
                                        toast.error(
                                          err instanceof Error ? err.message : "Failed to add major."
                                        )
                                      }
                                  }}
                                />
                                  <InlineEditableField 
                                    label="Grades" 
                                  value={education.grades ?? ''}
                                    fieldName={`educations[${idx}].grades`}
                                    fieldType="text"
                                    onSave={handleFieldSave}
                                    verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].grades`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEducation(idx)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex-shrink-0"
                                title="Delete education entry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InlineEditableDate
                                  label="Start Month"
                                  value={education.startMonth}
                                  fieldName={`educations[${idx}].startMonth`}
                                  onSave={handleFieldSave}
                                  formatDisplay={formatMonth}
                                  mode="month"
                                  verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].startMonth`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                                <InlineEditableDate
                                  label="End Month"
                                  value={education.endMonth}
                                  fieldName={`educations[${idx}].endMonth`}
                                  onSave={handleFieldSave}
                                  formatDisplay={formatMonth}
                                  mode="month"
                                  verificationIndicator={<VerificationIndicator fieldName={`educations[${idx}].endMonth`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Topper and Cheetah in separate row with two columns */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InlineEditableCheckbox
                              label="Topper"
                              value={education.isTopper === true}
                              fieldName={`educations[${idx}].isTopper`}
                              onSave={async (fieldName, newValue, verify) => {
                                await handleFieldSave(fieldName, newValue, verify)
                              }}
                              getFieldVerification={getFieldVerification}
                            />
                            <InlineEditableCheckbox
                              label="Cheetah"
                              value={education.isCheetah === true}
                              fieldName={`educations[${idx}].isCheetah`}
                              onSave={async (fieldName, newValue, verify) => {
                                await handleFieldSave(fieldName, newValue, verify)
                              }}
                              getFieldVerification={getFieldVerification}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Certifications */}
          <section id="certifications">
            <Collapsible 
              open={expandedSections.has("certifications")} 
              onOpenChange={() => toggleSection("certifications")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="size-5" />
                      Certifications
                      {certifications.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {certifications.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={certificationsProgress.percentage}
                        verified={certificationsProgress.verified}
                        total={certificationsProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("certifications") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {certifications.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No certifications recorded</p>
                  ) : (
                    certifications.map((cert, idx) => (
                      <div key={cert.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <InlineEditableCertification
                                cert={cert}
                                certIndex={idx}
                                onSave={handleCertificationLinkSave}
                                onCertificationClick={handleCertificationClick}
                                verificationIndicator={
                                  <VerificationIndicator
                                  fieldName={`certifications[${idx}].certificationId`}
                                  />
                                }
                                  getFieldVerification={getFieldVerification}
                                certificationIssuers={certificationIssuers}
                                certificationIssuersLoading={certificationIssuersLoading}
                                onIssuerCreated={handleCertificationIssuerCreated}
                              />
                              <InlineEditableSelect
                                label="Certification Level"
                                value={cert.certificationLevel ?? ""}
                                fieldName={`certifications[${idx}].certificationLevel`}
                                options={certificationLevelSelectOptions}
                                normalizeValue={certificationLevelToSelectValue}
                                formatDisplay={(v) => certificationLevelDisplayLabel(v)}
                                onSave={async (_fieldName, newValue, shouldVerify) => {
                                  await handleCertificationLevelSave(idx, newValue, shouldVerify)
                                }}
                                verificationIndicator={
                                  <VerificationIndicator
                                    fieldName={`certifications[${idx}].certificationLevel`}
                                  />
                                }
                                getFieldVerification={getFieldVerification}
                              />
                              {/* Dates */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <InlineEditableDate
                                    label="Issue Date"
                                    value={cert.issueDate}
                                    fieldName={`certifications[${idx}].issueDate`}
                                    onSave={handleFieldSave}
                                  formatDisplay={formatDate}
                                    verificationIndicator={<VerificationIndicator fieldName={`certifications[${idx}].issueDate`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                                  <InlineEditableDate
                                    label="Expiry Date"
                                    value={cert.expiryDate}
                                    fieldName={`certifications[${idx}].expiryDate`}
                                    onSave={handleFieldSave}
                                  formatDisplay={formatDate}
                                    verificationIndicator={<VerificationIndicator fieldName={`certifications[${idx}].expiryDate`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCertification(idx)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex-shrink-0"
                              title="Delete certification"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Certificate Link */}
                          <div className="space-y-2">
                            <InlineEditableField 
                              label="Certification URL" 
                              value={cert.certificationUrl ?? ''} 
                              fieldName={`certifications[${idx}].certificationUrl`}
                              fieldType="url"
                              validation={validateURL}
                              onSave={handleFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`certifications[${idx}].certificationUrl`} />}
                              getFieldVerification={getFieldVerification}
                            />
                            <VisitUrlButton url={cert.certificationUrl} label="Visit Certification" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

          {/* Competitions */}
          <section id="competitions">
            <Collapsible 
              open={expandedSections.has("competitions")} 
              onOpenChange={() => toggleSection("competitions")}
            >
              <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="size-5" />
                      Achievements
                      {achievements.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {achievements.length}
                        </Badge>
                      )}
                      <SectionProgressBadge 
                        percentage={achievementsProgress.percentage}
                        verified={achievementsProgress.verified}
                        total={achievementsProgress.total}
                      />
                    </CardTitle>
                    {expandedSections.has("competitions") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {achievements.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No achievements recorded</p>
                  ) : (
                    achievements.map((ach, idx) => (
                      <div key={ach.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          {/* Name and Achievement Type */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InlineEditableField
                                  label="Name"
                                  value={ach.name}
                                  fieldName={`achievements[${idx}].name`}
                                  fieldType="text"
                                  onSave={handleFieldSave}
                                  verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].name`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                                <InlineEditableSelect
                                  label="Achievement Type"
                                  value={ach.achievementType}
                                  fieldName={`achievements[${idx}].achievementType`}
                                  options={achievementTypeSelectOptions}
                                  normalizeValue={achievementTypeToSelectValue}
                                  formatDisplay={(v) => achievementTypeDisplayLabel(v ?? undefined)}
                                  onSave={handleFieldSave}
                                  verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].achievementType`} />}
                                  getFieldVerification={getFieldVerification}
                                />
                              </div>
                              {/* Ranking and Year */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                  <InlineEditableField
                                    label="Ranking"
                                  value={ach.ranking ?? ''}
                                    fieldName={`achievements[${idx}].ranking`}
                                    fieldType="text"
                                    onSave={handleFieldSave}
                                    verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].ranking`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                                  <InlineEditableField
                                    label="Year"
                                  value={ach.year != null ? ach.year.toString() : ''}
                                    fieldName={`achievements[${idx}].year`}
                                    fieldType="number"
                                    onSave={async (fieldName: string, newValue: string | number, shouldVerify: boolean) => {
                                      const yearValue: number | undefined = typeof newValue === 'string' ? (newValue ? parseInt(newValue, 10) : undefined) : newValue
                                      await handleFieldSave(fieldName, yearValue, shouldVerify)
                                    }}
                                    verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].year`} />}
                                    getFieldVerification={getFieldVerification}
                                  />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAchievement(idx)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer flex-shrink-0"
                              title="Delete achievement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Achievement URL */}
                          <div className="space-y-2">
                            <InlineEditableField 
                              label="URL" 
                              value={ach.url ?? ''} 
                              fieldName={`achievements[${idx}].url`}
                              fieldType="url"
                              validation={validateURL}
                              onSave={handleFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].url`} />}
                              getFieldVerification={getFieldVerification}
                            />
                            <VisitUrlButton url={ach.url} label="Visit Link" />
                          </div>
                          {/* Description */}
                            <InlineEditableField 
                              label="Description" 
                            value={ach.description ?? ''} 
                              fieldName={`achievements[${idx}].description`}
                              fieldType="text"
                              onSave={handleFieldSave}
                              verificationIndicator={<VerificationIndicator fieldName={`achievements[${idx}].description`} />}
                              getFieldVerification={getFieldVerification}
                            />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          </section>

        </div>
      </DialogContent>
      
      {/* Edit & Verify Dialog (verification is always enabled in edit mode) */}
      {candidate && (
        <CandidateCreationDialog
          mode="edit"
          candidateData={viewCandidate}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditSubmit}
          lookups={editLookups}
        />
      )}

      {/* Interaction Mode Dialog */}
      {candidate && interactionMode && (
        <ColdCallerDialog
          open={interactionDialogOpen}
          onOpenChange={setInteractionDialogOpen}
          candidate={viewCandidate}
          mode={interactionMode}
          onSaveField={async (fieldPath, value, verified) => {
            // Handle field save - this will update the candidate data
            // In a real implementation, this would call an API
            console.log('Saving field:', fieldPath, value, 'verified:', verified)
            await handleFieldSave(
              fieldPath, 
              value as string | number | Date | undefined | string[] | EmployerBenefit[] | boolean, 
              verified ?? false
            )
          }}
        />
      )}

      {/* Create Project Dialog */}
      <ProjectCreationDialog
        mode="create"
        open={createProjectDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCreateProjectDialogOpen(false)
            setPendingProjectName("")
            setPendingProjectFieldName(null)
          } else {
            setCreateProjectDialogOpen(isOpen)
          }
        }}
        onSubmit={async (projectData: ProjectFormData) => {
          await handleProjectCreated(projectData)
        }}
        initialName={pendingProjectName}
      />

      {/* Create Certification Dialog */}
      <CertificationCreationDialog
        mode="create"
        open={createCertificationDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCreateCertificationDialogOpen(false)
            setPendingCertificationName("")
            setPendingCertificationFieldName(null)
          } else {
            setCreateCertificationDialogOpen(isOpen)
          }
        }}
        onSubmit={async (certificationData: CertificationFormData) => {
          await handleCertificationCreated(certificationData)
        }}
        initialName={pendingCertificationName}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete ? (
                <>
                  This will permanently delete{' '}
                  {itemToDelete.type === 'independent' && 'the independent project'}
                  {itemToDelete.type === 'workExperience' && 'the work experience project'}
                  {itemToDelete.type === 'education' && 'the education entry'}
                  {itemToDelete.type === 'certification' && 'the certification'}
                  {itemToDelete.type === 'workExperienceEntry' && 'the work experience entry'}
                  {itemToDelete.type === 'achievement' && 'the achievement'}{' '}
                  <strong>{itemToDelete.itemName}</strong>. This action cannot be undone.
                </>
              ) : (
                'This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
