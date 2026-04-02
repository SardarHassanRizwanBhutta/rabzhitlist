"use client"

import * as React from "react"
import { useState, useRef, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Building2, MapPin, Trash2, ShieldCheck, ChevronDown, ChevronRight, AlertTriangle, CalendarIcon, ChevronsUpDown, Check } from "lucide-react"
import { Employer, Layoff, type EmployerTypeDb, EMPLOYER_TYPE_DB_LABELS, EMPLOYER_TYPE_DISPLAY_TO_DB, type RankingDb, RANKING_DB_LABELS, RANKING_DISPLAY_TO_DB, type WorkModeDb, WORK_MODE_DB_LABELS, type ShiftTypeDb, SHIFT_TYPE_DB_LABELS, type EmployerStatusDb, EMPLOYER_STATUS_DB_LABELS, EMPLOYER_STATUS_DISPLAY_TO_DB, type LayoffReasonDb, LAYOFF_REASON_DB_LABELS, LAYOFF_REASON_DISPLAY_TO_DB, type SalaryPolicy, type SalaryPolicyDb, SALARY_POLICY_DB_LABELS, SALARY_POLICY_DISPLAY_TO_DB } from "@/lib/types/employer"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { EmployerBenefit } from "@/lib/types/benefits"
import { BenefitsSelector } from "@/components/ui/benefits-selector"
import type { LookupItem } from "@/lib/services/lookups-api"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { format } from "date-fns"
import type { Country } from "@/lib/types/country"
import { cn } from "@/lib/utils"

// Form data interfaces
export interface EmployerLocationFormData {
  id: string
  country: string
  city: string
  address: string
  isHeadquarters: boolean
  salaryPolicy: SalaryPolicyDb | ""
  minSize: string
  maxSize: string
}

export interface LayoffFormData {
  id: string
  layoffDate: Date | undefined
  numberOfEmployeesLaidOff: string
  reason: LayoffReasonDb
  reasonOther: string
  source: string
}

export interface EmployerFormData {
  name: string
  websiteUrl: string
  linkedinUrl: string
  statuses: EmployerStatusDb[]
  foundedYear: string
  employerTypes: EmployerTypeDb[]
  workMode: WorkModeDb | ""
  shiftType: ShiftTypeDb | ""
  ranking: RankingDb | ""
  techStacks: string[]
  timeSupportZones: string[]
  tags: string[]
  benefits: EmployerBenefit[]
  isDPLCompetitive: boolean
  avgJobTenure: string
  locations: EmployerLocationFormData[]
  layoffs: LayoffFormData[]
}

// Verification state export
export interface EmployerVerificationState {
  verifiedFields: Set<string>
  modifiedFields: Set<string>
}

type DialogMode = "create" | "edit"

export interface EmployerLookups {
  techStacks: LookupItem[]
  /** Tags from API; "+ Add Tag" calls onCreateTag when provided. */
  tags?: LookupItem[]
  /** Time support zones from API; "+ Add Time Zone" calls onCreateTimeSupportZone when provided. */
  timeSupportZones?: LookupItem[]
  /** Benefits from API; "Add Benefit" in BenefitsSelector calls onCreateBenefit when provided. */
  benefits?: LookupItem[]
}

interface EmployerCreationDialogProps {
  children?: React.ReactNode
  mode?: DialogMode
  employerData?: Employer
  showVerification?: boolean
  onSubmit?: (data: EmployerFormData, verificationState?: EmployerVerificationState) => Promise<{ id: number; name: string } | void> | void
  onSuccess?: (employer: { id: number; name: string }) => void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  initialName?: string  // For pre-filling employer name in create mode
  /** Normalized countries for location country combobox (from API). */
  countries?: Country[]
  countriesLoading?: boolean
  /** When provided, Tech Stacks / Tags / Time Support Zones use lookups; "+ Add" handlers create new items. */
  lookups?: EmployerLookups
  onCreateTechStack?: (name: string) => Promise<void>
  onCreateTag?: (name: string) => Promise<void>
  onCreateTimeSupportZone?: (name: string) => Promise<void>
  /** When BenefitsSelector "Add Benefit" is used; return new EmployerBenefit to add to form. */
  onCreateBenefit?: (name: string) => Promise<EmployerBenefit | null | void>
  /** When provided, allows adding a new country from location country combobox when not found. Should create and return the new country. */
  onCreateCountry?: (name: string) => Promise<Country | null>
}

const createEmptyLocation = (): EmployerLocationFormData => ({
  id: crypto.randomUUID(),
  country: "",
  city: "",
  address: "",
  isHeadquarters: false,
  salaryPolicy: "",
  minSize: "",
  maxSize: "",
})

const createEmptyLayoff = (): LayoffFormData => ({
  id: crypto.randomUUID(),
  layoffDate: undefined,
  numberOfEmployeesLaidOff: "",
  reason: "cost_reduction",
  reasonOther: "",
  source: "",
})

const initialFormData: EmployerFormData = {
  name: "",
  websiteUrl: "",
  linkedinUrl: "",
  statuses: [],
  foundedYear: "",
  employerTypes: [],
  workMode: "",
  shiftType: "",
  ranking: "",
  techStacks: [],
  timeSupportZones: [],
  tags: [],
  benefits: [],
  isDPLCompetitive: false,
  avgJobTenure: "",
  locations: [createEmptyLocation()], // Start with one location
  layoffs: [],
}

// Status options (DB enum values for multi-select)
const statusOptions: MultiSelectOption[] = (Object.entries(EMPLOYER_STATUS_DB_LABELS) as [EmployerStatusDb, string][]).map(
  ([value, label]) => ({ value, label })
)

// Salary policy options (DB enum values for location)
const salaryPolicyOptions = (Object.entries(SALARY_POLICY_DB_LABELS) as [SalaryPolicyDb, string][]).map(
  ([value, label]) => ({ value, label })
)

// Work mode, shift type, ranking options (DB enum values)
const workModeOptions = (Object.entries(WORK_MODE_DB_LABELS) as [WorkModeDb, string][]).map(([value, label]) => ({ value, label }))
const shiftTypeOptions = (Object.entries(SHIFT_TYPE_DB_LABELS) as [ShiftTypeDb, string][]).map(([value, label]) => ({ value, label }))
const rankingOptions = (Object.entries(RANKING_DB_LABELS) as [RankingDb, string][]).map(([value, label]) => ({ value, label }))

const normalizeTechStack = (tech: string): string => tech.trim()

// Use only employer's own tech stacks and benefits (no candidate-derived data).
const getEmployerTechStacks = (employer: Employer): string[] => {
  return employer.techStacks && employer.techStacks.length > 0 ? [...employer.techStacks] : []
}
const getEmployerBenefits = (employer: Employer): EmployerBenefit[] => {
  return employer.benefits && employer.benefits.length > 0 ? [...employer.benefits] : []
}

// Employer type options for MultiSelect (DB enum values with display labels)
const employerTypeOptions: MultiSelectOption[] = (Object.entries(EMPLOYER_TYPE_DB_LABELS) as [EmployerTypeDb, string][]).map(
  ([value, label]) => ({ value, label })
)

// Helper function to convert Employer to EmployerFormData
const employerToFormData = (employer: Employer): EmployerFormData => {
  const employerTypes: EmployerTypeDb[] = employer.employerTypes?.length
    ? [...employer.employerTypes]
    : employer.employerType
      ? [EMPLOYER_TYPE_DISPLAY_TO_DB[employer.employerType]]
      : []
  const statuses: EmployerStatusDb[] = employer.statuses?.length
    ? [...employer.statuses]
    : employer.status
      ? [EMPLOYER_STATUS_DISPLAY_TO_DB[employer.status]]
      : []
  return {
    name: employer.name || "",
    websiteUrl: employer.websiteUrl || "",
    linkedinUrl: employer.linkedinUrl || "",
    statuses,
    foundedYear: employer.foundedYear?.toString() || "",
    employerTypes,
    workMode: employer.workMode ?? "",
    shiftType: employer.shiftType ?? "",
    ranking: employer.ranking ? RANKING_DISPLAY_TO_DB[employer.ranking] : "",
    techStacks: getEmployerTechStacks(employer),
    timeSupportZones: employer.timeSupportZones ?? [],
    tags: employer.tags ?? [],
    benefits: getEmployerBenefits(employer),
    isDPLCompetitive: employer.isDPLCompetitive || false,
    avgJobTenure: employer.avgJobTenure?.toString() || "",
    locations: employer.locations.map(loc => ({
      id: loc.id,
      country: loc.country || "",
      city: loc.city || "",
      address: loc.address || "",
      isHeadquarters: loc.isHeadquarters,
      salaryPolicy: (loc.salaryPolicy && loc.salaryPolicy in SALARY_POLICY_DB_LABELS)
        ? (loc.salaryPolicy as SalaryPolicyDb)
        : (loc.salaryPolicy ? SALARY_POLICY_DISPLAY_TO_DB[loc.salaryPolicy as SalaryPolicy] : ""),
      minSize: loc.minSize?.toString() || "",
      maxSize: loc.maxSize?.toString() || "",
    })),
    layoffs: (employer.layoffs || []).map(layoff => ({
      id: layoff.id,
      layoffDate: new Date(layoff.layoffDate),
      numberOfEmployeesLaidOff: layoff.numberOfEmployeesLaidOff.toString(),
      reason: LAYOFF_REASON_DISPLAY_TO_DB[layoff.reason],
      reasonOther: layoff.reasonOther || "",
      source: layoff.source,
    }))
  }
}

// All verifiable fields for employers (Basic Information section only)
const EMPLOYER_VERIFICATION_FIELDS = [
  'name', 'statuses', 'foundedYear', 'employerTypes', 'ranking', 'websiteUrl', 'linkedinUrl', 'isDPLCompetitive', 'avgJobTenure'
]

// Work Arrangements & Tags section fields
const WORK_ARRANGEMENTS_TAGS_FIELDS = ['workMode', 'shiftType', 'timeSupportZones', 'tags']

// Technology Stacks & Benefits section fields
const TECH_STACK_BENEFITS_FIELDS = ['techStacks', 'benefits']

// Location fields (dynamic based on number of locations)
const getLocationFieldNames = (locationIndex: number): string[] => {
  return [
    `locations[${locationIndex}].country`,
    `locations[${locationIndex}].city`,
    `locations[${locationIndex}].address`,
    `locations[${locationIndex}].salaryPolicy`,
    `locations[${locationIndex}].minSize`,
    `locations[${locationIndex}].maxSize`,
    `locations[${locationIndex}].isHeadquarters`
  ]
}

export function EmployerCreationDialog({
  children,
  mode = "create",
  employerData,
  showVerification = true,
  onSubmit,
  onSuccess,
  onOpenChange,
  open: controlledOpen,
  initialName,
  countries = [],
  countriesLoading = false,
  lookups,
  onCreateTechStack,
  onCreateTag,
  onCreateTimeSupportZone,
  onCreateBenefit,
  onCreateCountry,
}: EmployerCreationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EmployerFormData>(initialFormData)
  const [errors, setErrors] = useState<{
    employer?: Partial<Record<keyof Omit<EmployerFormData, 'locations' | 'layoffs'>, string>>
    locations?: { [index: number]: Partial<Record<keyof EmployerLocationFormData, string>> }
    layoffs?: { [index: number]: Partial<Record<keyof LayoffFormData, string>> }
  }>({})
  const initialFormDataRef = useRef<EmployerFormData | null>(null)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  
  // Verification state
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set())
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic-info", "work-arrangements-tags", "tech-stack-benefits", "locations"])
  )

  // Location country combobox: which location's popover is open (null = none)
  const [locationCountryPopoverIndex, setLocationCountryPopoverIndex] = useState<number | null>(null)
  const [locationCountrySearchQuery, setLocationCountrySearchQuery] = useState("")
  const [locationCountryCreateInProgress, setLocationCountryCreateInProgress] = useState<number | null>(null)
  const filteredCountries = useMemo(() => {
    if (!locationCountrySearchQuery.trim()) return countries
    const q = locationCountrySearchQuery.toLowerCase().trim()
    return countries.filter((c) => c.name.toLowerCase().includes(q))
  }, [countries, locationCountrySearchQuery])

  const techStackOptions: MultiSelectOption[] = useMemo(
    () => lookups?.techStacks?.map((l) => ({ value: l.name, label: l.name })) ?? [],
    [lookups?.techStacks]
  )
  const tagOptions: MultiSelectOption[] = useMemo(
    () => lookups?.tags?.map((l) => ({ value: l.name, label: l.name })) ?? [],
    [lookups?.tags]
  )
  const timeSupportZoneOptions: MultiSelectOption[] = useMemo(
    () => lookups?.timeSupportZones?.map((l) => ({ value: l.name, label: l.name })) ?? [],
    [lookups?.timeSupportZones]
  )

  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  // Reset form when dialog opens/closes or mode/employerData changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && employerData) {
        const formDataFromEmployer = employerToFormData(employerData)
        setFormData(formDataFromEmployer)
        initialFormDataRef.current = formDataFromEmployer
      } else {
        const initialData = initialName 
          ? { ...initialFormData, name: initialName }
          : initialFormData
        setFormData(initialData)
        initialFormDataRef.current = initialData
      }
      setErrors({})
      setModifiedFields(new Set())
      
      // Reset verified fields if not in verification mode
      if (!showVerification) {
        setVerifiedFields(new Set())
      }
    } else {
      // Reset form when dialog closes
      setFormData(initialFormData)
      setErrors({})
      initialFormDataRef.current = null
      setModifiedFields(new Set())
      if (!showVerification) {
        setVerifiedFields(new Set())
      }
    }
  }, [open, mode, employerData, showVerification, initialName])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!showVerification) return false
    return modifiedFields.size > 0 || verifiedFields.size > 0
  }, [showVerification, modifiedFields, verifiedFields])

  // Handle close with unsaved changes check
  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setOpen(newOpen)
  }

  const handleInputChange = (field: keyof Omit<EmployerFormData, 'locations' | 'layoffs'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Track modifications and auto-verify in verification mode
    if (showVerification) {
      setModifiedFields(prev => new Set(prev).add(field))
      setVerifiedFields(prev => new Set(prev).add(field))
    }
    
    // Clear error when user starts typing
    if (errors.employer?.[field]) {
      setErrors(prev => ({ 
        ...prev, 
        employer: { ...prev.employer, [field]: undefined }
      }))
    }
  }

  const handleLocationChange = (
    index: number,
    field: keyof EmployerLocationFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, i) => {
        if (i === index) {
          // If setting this location as headquarters, unset others
          if (field === "isHeadquarters" && value === true) {
            return { ...location, [field]: value }
          }
          return { ...location, [field]: value }
        }
        // If setting headquarters, unset all other headquarters
        if (field === "isHeadquarters" && value === true) {
          return { ...location, isHeadquarters: false }
        }
        return location
      })
    }))
    
    // Track modifications and auto-verify in verification mode
    if (showVerification) {
      const fieldPath = `locations[${index}].${field}`
      setModifiedFields(prev => new Set(prev).add(fieldPath))
      setVerifiedFields(prev => new Set(prev).add(fieldPath))
    }
    
    // Clear error when user starts typing
    if (errors.locations?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        locations: {
          ...prev.locations,
          [index]: {
            ...prev.locations?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, createEmptyLocation()]
    }))
  }

  const removeLocation = (index: number) => {
    if (formData.locations.length > 1) {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter((_, i) => i !== index)
      }))
      
      // Clear errors for removed location
      if (errors.locations?.[index]) {
        const newLocationErrors = { ...errors.locations }
        delete newLocationErrors[index]
        setErrors(prev => ({
          ...prev,
          locations: newLocationErrors
        }))
      }
    }
  }

  const handleLayoffChange = (
    index: number,
    field: keyof LayoffFormData,
    value: string | Date | undefined | LayoffReasonDb
  ) => {
    setFormData(prev => ({
      ...prev,
      layoffs: prev.layoffs.map((layoff, i) => {
        if (i === index) {
          return { ...layoff, [field]: value }
        }
        return layoff
      })
    }))
    
    // Track modifications and auto-verify in verification mode
    if (showVerification) {
      const fieldPath = `layoffs[${index}].${field}`
      setModifiedFields(prev => new Set(prev).add(fieldPath))
      setVerifiedFields(prev => new Set(prev).add(fieldPath))
    }
    
    // Clear error when user starts typing
    if (errors.layoffs?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        layoffs: {
          ...prev.layoffs,
          [index]: {
            ...prev.layoffs?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const addLayoff = () => {
    setFormData(prev => ({
      ...prev,
      layoffs: [...prev.layoffs, createEmptyLayoff()]
    }))
  }

  const removeLayoff = (index: number) => {
    setFormData(prev => ({
      ...prev,
      layoffs: prev.layoffs.filter((_, i) => i !== index)
    }))
    
    // Clear errors for removed layoff
    if (errors.layoffs?.[index]) {
      const newLayoffErrors = { ...errors.layoffs }
      delete newLayoffErrors[index]
      setErrors(prev => ({
        ...prev,
        layoffs: newLayoffErrors
      }))
    }
  }

  const validateForm = (): boolean => {
    const employerErrors: Partial<Record<keyof Omit<EmployerFormData, 'locations' | 'layoffs'>, string>> = {}
    const locationErrors: { [index: number]: Partial<Record<keyof EmployerLocationFormData, string>> } = {}
    const layoffErrors: { [index: number]: Partial<Record<keyof LayoffFormData, string>> } = {}

    // Employer validation (name required; foundedYear optional but must be 1800–current year if set)
    if (!formData.name.trim()) employerErrors.name = "Employer name is required"
    if (formData.foundedYear.trim()) {
      const year = parseInt(formData.foundedYear, 10)
      const currentYear = new Date().getFullYear()
      if (!/^\d{4}$/.test(formData.foundedYear) || Number.isNaN(year) || year < 1800 || year > currentYear) {
        employerErrors.foundedYear = `Please enter a valid year between 1800 and ${currentYear}`
      }
    }
    
    // URL validations
    if (formData.websiteUrl && !formData.websiteUrl.startsWith('http')) {
      employerErrors.websiteUrl = "Website URL must start with http:// or https://"
    }
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith('http')) {
      employerErrors.linkedinUrl = "LinkedIn URL must start with http:// or https://"
    }

    // Location validation
    const hasHeadquarters = formData.locations.some(loc => loc.isHeadquarters)
    
    formData.locations.forEach((location, index) => {
      const locErrors: Partial<Record<keyof EmployerLocationFormData, string>> = {}
      
      if (!location.country.trim()) locErrors.country = "Country is required"
      if (!location.city.trim()) locErrors.city = "City is required"
      if (!location.address.trim()) locErrors.address = "Address is required"
      if (!location.salaryPolicy) locErrors.salaryPolicy = "Salary policy is required"
      
      // Employee count validation
      if (!location.minSize.trim()) {
        locErrors.minSize = "Minimum employees is required"
      } else {
        const minSizeNum = parseInt(location.minSize)
        if (isNaN(minSizeNum) || minSizeNum <= 0) {
          locErrors.minSize = "Minimum employees must be a positive number"
        }
      }
      
      if (!location.maxSize.trim()) {
        locErrors.maxSize = "Maximum employees is required"
      } else {
        const maxSizeNum = parseInt(location.maxSize)
        const minSizeNum = parseInt(location.minSize)
        if (isNaN(maxSizeNum) || maxSizeNum <= 0) {
          locErrors.maxSize = "Maximum employees must be a positive number"
        } else if (!isNaN(minSizeNum) && maxSizeNum < minSizeNum) {
          locErrors.maxSize = "Maximum employees must be greater than or equal to minimum employees"
        }
      }
      
      if (Object.keys(locErrors).length > 0) {
        locationErrors[index] = locErrors
      }
    })

    // Check for headquarters requirement
    if (!hasHeadquarters && formData.locations.length > 0) {
      if (!locationErrors[0]) locationErrors[0] = {}
      locationErrors[0].isHeadquarters = "At least one location must be designated as headquarters"
    }

    const newErrors = {
      employer: Object.keys(employerErrors).length > 0 ? employerErrors : undefined,
      locations: Object.keys(locationErrors).length > 0 ? locationErrors : undefined,
    }

    setErrors(newErrors)
    return !newErrors.employer && !newErrors.locations
  }

  // Toggle verification checkbox
  const handleVerificationToggle = (fieldName: string, checked: boolean) => {
    setVerifiedFields(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(fieldName)
      } else {
        newSet.delete(fieldName)
      }
      return newSet
    })
  }

  // Calculate section progress
  const calculateSectionProgress = (fieldNames: string[]): { percentage: number; verified: number; total: number } => {
    let verified = 0
    const total = fieldNames.length

    fieldNames.forEach(fieldName => {
      if (verifiedFields.has(fieldName)) {
        verified++
      }
    })

    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0
    return { percentage, verified, total }
  }

  // Get progress color
  const getProgressColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-500 hover:bg-green-600'
    if (percentage >= 70) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-red-500 hover:bg-red-600'
  }

  // Section progress badge component
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

  // Section progress calculations
  const basicInfoProgress = useMemo(() => 
    calculateSectionProgress(EMPLOYER_VERIFICATION_FIELDS),
    [verifiedFields]
  )

  const workArrangementsTagsProgress = useMemo(() =>
    calculateSectionProgress(WORK_ARRANGEMENTS_TAGS_FIELDS),
    [verifiedFields]
  )

  const techStackBenefitsProgress = useMemo(() =>
    calculateSectionProgress(TECH_STACK_BENEFITS_FIELDS),
    [verifiedFields]
  )

  const locationsProgress = useMemo(() => {
    let total = 0
    let verified = 0
    
    formData.locations.forEach((_, idx) => {
      const locationFields = getLocationFieldNames(idx)
      locationFields.forEach(fieldName => {
        total++
        if (verifiedFields.has(fieldName)) verified++
      })
    })
    
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [verifiedFields, formData.locations])

  const layoffsProgress = useMemo(() => {
    let total = 0
    let verified = 0
    
    formData.layoffs.forEach((_, idx) => {
      const layoffFields = [
        `layoffs[${idx}].layoffDate`,
        `layoffs[${idx}].numberOfEmployeesLaidOff`,
        `layoffs[${idx}].reason`,
        `layoffs[${idx}].source`
      ]
      layoffFields.forEach(fieldName => {
        total++
        if (verifiedFields.has(fieldName)) verified++
      })
    })
    
    return { 
      percentage: total > 0 ? Math.round((verified / total) * 100) : 0,
      verified,
      total
    }
  }, [verifiedFields, formData.layoffs])

  // Overall verification progress
  const verificationProgress = useMemo(() => {
    let total = EMPLOYER_VERIFICATION_FIELDS.length
    let verified = 0
    
    // Count employer fields
    EMPLOYER_VERIFICATION_FIELDS.forEach(field => {
      if (verifiedFields.has(field)) verified++
    })
    
    // Count location fields
    formData.locations.forEach((_, idx) => {
      const locationFields = getLocationFieldNames(idx)
      total += locationFields.length
      locationFields.forEach(fieldName => {
        if (verifiedFields.has(fieldName)) verified++
      })
    })
    
    // Count layoff fields
    formData.layoffs.forEach((_, idx) => {
      const layoffFields = [
        `layoffs[${idx}].layoffDate`,
        `layoffs[${idx}].numberOfEmployeesLaidOff`,
        `layoffs[${idx}].reason`,
        `layoffs[${idx}].source`
      ]
      total += layoffFields.length
      layoffFields.forEach(fieldName => {
        if (verifiedFields.has(fieldName)) verified++
      })
    })
    
    return total > 0 ? Math.round((verified / total) * 100) : 0
  }, [verifiedFields, formData.locations, formData.layoffs])

  // Helper to get field names for a section
  const getSectionFieldNames = (sectionId: string): string[] => {
    if (sectionId === 'basic-info') {
      return EMPLOYER_VERIFICATION_FIELDS
    }
    if (sectionId === 'work-arrangements-tags') {
      return WORK_ARRANGEMENTS_TAGS_FIELDS
    }
    if (sectionId === 'tech-stack-benefits') {
      return TECH_STACK_BENEFITS_FIELDS
    }
    if (sectionId === 'locations') {
      const fields: string[] = []
      formData.locations.forEach((_, idx) => {
        fields.push(...getLocationFieldNames(idx))
      })
      return fields
    }
    if (sectionId === 'layoffs') {
      const fields: string[] = []
      formData.layoffs.forEach((_, idx) => {
        fields.push(
          `layoffs[${idx}].layoffDate`,
          `layoffs[${idx}].numberOfEmployeesLaidOff`,
          `layoffs[${idx}].reason`,
          `layoffs[${idx}].source`
        )
      })
      return fields
    }
    return []
  }

  // Check if all fields in a section are verified
  const isSectionFullyVerified = (sectionId: string): boolean => {
    const sectionFields = getSectionFieldNames(sectionId)
    if (sectionFields.length === 0) return false
    return sectionFields.every(fieldName => verifiedFields.has(fieldName))
  }

  // Handle verify all for a section
  const handleVerifyAllSection = (sectionId: string, checked: boolean) => {
    const sectionFields = getSectionFieldNames(sectionId)
    setVerifiedFields(prev => {
      const newSet = new Set(prev)
      sectionFields.forEach(fieldName => {
        if (checked) {
          newSet.add(fieldName)
        } else {
          newSet.delete(fieldName)
        }
      })
      return newSet
    })
    // Also mark fields as modified when verifying
    if (checked) {
      setModifiedFields(prev => {
        const newSet = new Set(prev)
        sectionFields.forEach(fieldName => newSet.add(fieldName))
        return newSet
      })
    }
  }

  // Verification checkbox component
  const VerificationCheckbox = ({ 
    fieldName, 
    label,
    inline = false
  }: { 
    fieldName: string
    label?: string
    inline?: boolean // If true, display alongside label (for special cases like Headquarters)
  }) => {
    if (!showVerification) return null
    
    const isChecked = verifiedFields.has(fieldName)
    
    if (inline) {
      return (
        <div className="flex items-center gap-1.5 ml-2">
          <Checkbox
            id={`verify-${fieldName}`}
            checked={isChecked}
            onCheckedChange={(checked) => handleVerificationToggle(fieldName, checked === true)}
            className="h-4 w-4"
          />
          <Label 
            htmlFor={`verify-${fieldName}`} 
            className={`text-xs cursor-pointer ${isChecked ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
          >
            {isChecked ? '✓ Verified' : label || 'Mark as verified'}
          </Label>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-2 mt-1">
        <Checkbox
          id={`verify-${fieldName}`}
          checked={isChecked}
          onCheckedChange={(checked) => handleVerificationToggle(fieldName, checked === true)}
          className="cursor-pointer"
        />
        <Label 
          htmlFor={`verify-${fieldName}`}
          className={`text-xs cursor-pointer ${isChecked ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
        >
          {isChecked ? '✓ Verified' : label || 'Mark as verified'}
        </Label>
      </div>
    )
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Include verification state if in verification mode
      const verificationState: EmployerVerificationState | undefined = showVerification 
        ? { verifiedFields, modifiedFields }
        : undefined
        
      const result = await onSubmit?.(formData, verificationState)
      if (result && typeof result === "object" && "id" in result && "name" in result) {
        onSuccess?.(result as { id: number; name: string })
      }
      setFormData(initialFormData)
      setErrors({})
      setVerifiedFields(new Set())
      setModifiedFields(new Set())
      setOpen(false)
    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} employer:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true)
      return
    }
    setFormData(initialFormData)
    setErrors({})
    setVerifiedFields(new Set())
    setModifiedFields(new Set())
    setOpen(false)
  }

  const handleDiscardChanges = () => {
    setShowUnsavedWarning(false)
    setFormData(initialFormData)
    setErrors({})
    setVerifiedFields(new Set())
    setModifiedFields(new Set())
    setOpen(false)
  }

  // Get dialog title based on mode and verification
  const getDialogTitle = () => {
    if (showVerification) {
      return "Verify Employer"
    }
    return mode === "edit" ? "Edit Employer" : "Create New Employer"
  }

  // Get submit button text based on mode and verification
  const getSubmitButtonText = () => {
    if (isLoading) {
      if (showVerification) return "Saving & Verifying..."
      return mode === "edit" ? "Updating..." : "Creating..."
    }
    if (showVerification) return "Update & Verify"
    return mode === "edit" ? "Update Employer" : "Create Employer"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        {mode === "create" && controlledOpen === undefined && (
          <DialogTrigger asChild>
            {children || (
              <Button className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Employer
              </Button>
            )}
          </DialogTrigger>
        )}
        
        <DialogContent className="sm:max-w-[750px] lg:max-w-[850px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                {showVerification && <ShieldCheck className="size-5 text-primary" />}
                {getDialogTitle()}
              </DialogTitle>
            </div>
            
            {/* Verification Progress Bar */}
            {showVerification && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Verification Progress</span>
                  <Badge variant={verificationProgress === 100 ? 'default' : 'secondary'}>
                    {verificationProgress}% Complete ({verifiedFields.size} fields)
                  </Badge>
                </div>
                <Progress value={verificationProgress} className="h-2" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{verifiedFields.size} verified</span>
                  <span>{getSectionFieldNames('basic-info').length + getSectionFieldNames('locations').length - verifiedFields.size} remaining</span>
                  {modifiedFields.size > 0 && (
                    <span className="text-blue-600">{modifiedFields.size} modified</span>
                  )}
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4" id="employer-form">
              
              {/* Basic Information Section */}
              <Collapsible 
                open={expandedSections.has("basic-info")} 
                onOpenChange={() => toggleSection("basic-info")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Basic Information
                          {showVerification && (
                            <SectionProgressBadge 
                              percentage={basicInfoProgress.percentage}
                              verified={basicInfoProgress.verified}
                              total={basicInfoProgress.total}
                            />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {showVerification && (
                            <div 
                              className="flex items-center gap-2" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                id="verify-all-basic-info"
                                checked={isSectionFullyVerified("basic-info")}
                                onCheckedChange={(checked) => handleVerifyAllSection("basic-info", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label 
                                htmlFor="verify-all-basic-info" 
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("basic-info") ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="TechCorp Solutions"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className={errors.employer?.name ? "border-red-500" : ""}
                          />
                          {errors.employer?.name && <p className="text-sm text-red-500">{errors.employer.name}</p>}
                          <VerificationCheckbox fieldName="name" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="foundedYear">Founded Year *</Label>
                          <Input
                            id="foundedYear"
                            type="number"
                            placeholder="2019"
                            min="1800"
                            max={new Date().getFullYear()}
                            value={formData.foundedYear}
                            onChange={(e) => handleInputChange("foundedYear", e.target.value)}
                            className={errors.employer?.foundedYear ? "border-red-500" : ""}
                          />
                          {errors.employer?.foundedYear && <p className="text-sm text-red-500">{errors.employer.foundedYear}</p>}
                          <VerificationCheckbox fieldName="foundedYear" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="statuses">Status</Label>
                          <MultiSelect
                            items={statusOptions}
                            selected={formData.statuses}
                            onChange={(values) => {
                              setFormData(prev => ({ ...prev, statuses: values as EmployerStatusDb[] }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("statuses"))
                                setVerifiedFields(prev => new Set(prev).add("statuses"))
                              }
                            }}
                            placeholder="Select status"
                            searchPlaceholder="Search statuses..."
                            maxDisplay={3}
                          />
                          {errors.employer?.statuses && <p className="text-sm text-red-500">{errors.employer.statuses}</p>}
                          <VerificationCheckbox fieldName="statuses" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employerTypes">Type</Label>
                          <MultiSelect
                            items={employerTypeOptions}
                            selected={formData.employerTypes}
                            onChange={(values) => {
                              setFormData(prev => ({ ...prev, employerTypes: values as EmployerTypeDb[] }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("employerTypes"))
                                setVerifiedFields(prev => new Set(prev).add("employerTypes"))
                              }
                            }}
                            placeholder="Select employer type"
                            searchPlaceholder="Search types..."
                            maxDisplay={4}
                          />
                          <VerificationCheckbox fieldName="employerTypes" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ranking">Ranking</Label>
                          <Select
                            value={formData.ranking || undefined}
                            onValueChange={(value: RankingDb) => {
                              setFormData(prev => ({ ...prev, ranking: value }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("ranking"))
                                setVerifiedFields(prev => new Set(prev).add("ranking"))
                              }
                            }}
                          >
                            <SelectTrigger className={errors.employer?.ranking ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select ranking" />
                            </SelectTrigger>
                            <SelectContent>
                              {rankingOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.employer?.ranking && <p className="text-sm text-red-500">{errors.employer.ranking}</p>}
                          <VerificationCheckbox fieldName="ranking" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="websiteUrl">Website URL</Label>
                          <Input
                            id="websiteUrl"
                            type="url"
                            placeholder="https://www.company.com"
                            value={formData.websiteUrl}
                            onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                            className={errors.employer?.websiteUrl ? "border-red-500" : ""}
                          />
                          {errors.employer?.websiteUrl && <p className="text-sm text-red-500">{errors.employer.websiteUrl}</p>}
                          <VerificationCheckbox fieldName="websiteUrl" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                          <Input
                            id="linkedinUrl"
                            type="url"
                            placeholder="https://linkedin.com/company/..."
                            value={formData.linkedinUrl}
                            onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                            className={errors.employer?.linkedinUrl ? "border-red-500" : ""}
                          />
                          {errors.employer?.linkedinUrl && <p className="text-sm text-red-500">{errors.employer.linkedinUrl}</p>}
                          <VerificationCheckbox fieldName="linkedinUrl" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="isDPLCompetitive">DPL Competitive</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch
                              id="isDPLCompetitive"
                              checked={formData.isDPLCompetitive}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({ ...prev, isDPLCompetitive: checked }))
                                if (showVerification) {
                                  setModifiedFields(prev => new Set(prev).add("isDPLCompetitive"))
                                  setVerifiedFields(prev => new Set(prev).add("isDPLCompetitive"))
                                }
                              }}
                            />
                            <Label htmlFor="isDPLCompetitive" className="cursor-pointer font-normal">
                              {formData.isDPLCompetitive ? "Yes" : "No"}
                            </Label>
                          </div>
                          <VerificationCheckbox fieldName="isDPLCompetitive" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="avgJobTenure">Average Job Tenure (Years)</Label>
                          <Input
                            id="avgJobTenure"
                            type="number"
                            placeholder="e.g., 2.5"
                            min="0"
                            step="0.1"
                            value={formData.avgJobTenure}
                            onChange={(e) => {
                              setFormData(prev => ({ ...prev, avgJobTenure: e.target.value }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("avgJobTenure"))
                                setVerifiedFields(prev => new Set(prev).add("avgJobTenure"))
                              }
                            }}
                          />
                          <VerificationCheckbox fieldName="avgJobTenure" />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Work Arrangements & Tags Section */}
              <Collapsible
                open={expandedSections.has("work-arrangements-tags")}
                onOpenChange={() => toggleSection("work-arrangements-tags")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Work Arrangements &amp; Tags
                          {showVerification && (
                            <SectionProgressBadge
                              percentage={workArrangementsTagsProgress.percentage}
                              verified={workArrangementsTagsProgress.verified}
                              total={workArrangementsTagsProgress.total}
                            />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {showVerification && (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                id="verify-all-work-arrangements-tags"
                                checked={isSectionFullyVerified("work-arrangements-tags")}
                                onCheckedChange={(checked) => handleVerifyAllSection("work-arrangements-tags", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label
                                htmlFor="verify-all-work-arrangements-tags"
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("work-arrangements-tags") ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="workMode">Work Mode</Label>
                          <Select
                            value={formData.workMode || undefined}
                            onValueChange={(value: WorkModeDb) => {
                              setFormData(prev => ({ ...prev, workMode: value }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("workMode"))
                                setVerifiedFields(prev => new Set(prev).add("workMode"))
                              }
                            }}
                          >
                            <SelectTrigger className={errors.employer?.workMode ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select work mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {workModeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.employer?.workMode && <p className="text-sm text-red-500">{errors.employer.workMode}</p>}
                          <VerificationCheckbox fieldName="workMode" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shiftType">Shift Type</Label>
                          <Select
                            value={formData.shiftType || undefined}
                            onValueChange={(value: ShiftTypeDb) => {
                              setFormData(prev => ({ ...prev, shiftType: value }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("shiftType"))
                                setVerifiedFields(prev => new Set(prev).add("shiftType"))
                              }
                            }}
                          >
                            <SelectTrigger className={errors.employer?.shiftType ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select shift type" />
                            </SelectTrigger>
                            <SelectContent>
                              {shiftTypeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.employer?.shiftType && <p className="text-sm text-red-500">{errors.employer.shiftType}</p>}
                          <VerificationCheckbox fieldName="shiftType" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timeSupportZones">Time Support Zones</Label>
                          <MultiSelect
                            items={timeSupportZoneOptions}
                            selected={formData.timeSupportZones}
                            onChange={(values) => {
                              setFormData(prev => ({ ...prev, timeSupportZones: values }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("timeSupportZones"))
                                setVerifiedFields(prev => new Set(prev).add("timeSupportZones"))
                              }
                            }}
                            placeholder="Select time zones..."
                            searchPlaceholder="Search time zones..."
                            maxDisplay={5}
                            creatable={true}
                            createLabel="+ Add Time Zone"
                            onCreateNew={onCreateTimeSupportZone ? (name) => onCreateTimeSupportZone(name) : undefined}
                          />
                          <VerificationCheckbox fieldName="timeSupportZones" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags">Tags</Label>
                          <MultiSelect
                            items={tagOptions}
                            selected={formData.tags}
                            onChange={(values) => {
                              setFormData(prev => ({ ...prev, tags: values }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("tags"))
                                setVerifiedFields(prev => new Set(prev).add("tags"))
                              }
                            }}
                            placeholder="Select tags..."
                            searchPlaceholder="Search tags..."
                            maxDisplay={3}
                            creatable={true}
                            createLabel="Add Tag"
                            onCreateNew={onCreateTag ? (name) => onCreateTag(name) : undefined}
                          />
                          <VerificationCheckbox fieldName="tags" />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Technology Stacks & Benefits Section */}
              <Collapsible
                open={expandedSections.has("tech-stack-benefits")}
                onOpenChange={() => toggleSection("tech-stack-benefits")}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          Technology Stacks &amp; Benefits
                          {showVerification && (
                            <SectionProgressBadge
                              percentage={techStackBenefitsProgress.percentage}
                              verified={techStackBenefitsProgress.verified}
                              total={techStackBenefitsProgress.total}
                            />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {showVerification && (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                id="verify-all-tech-stack-benefits"
                                checked={isSectionFullyVerified("tech-stack-benefits")}
                                onCheckedChange={(checked) => handleVerifyAllSection("tech-stack-benefits", checked === true)}
                                className="h-4 w-4"
                              />
                              <Label
                                htmlFor="verify-all-tech-stack-benefits"
                                className="text-xs text-muted-foreground cursor-pointer font-normal"
                              >
                                Verify All
                              </Label>
                            </div>
                          )}
                          {expandedSections.has("tech-stack-benefits") ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="techStacks">Tech Stacks</Label>
                          <MultiSelect
                            items={techStackOptions}
                            selected={formData.techStacks}
                            onChange={(values) => {
                              setFormData(prev => ({ ...prev, techStacks: values }))
                              if (showVerification) {
                                setModifiedFields(prev => new Set(prev).add("techStacks"))
                                setVerifiedFields(prev => new Set(prev).add("techStacks"))
                              }
                            }}
                            placeholder="Select technologies..."
                            searchPlaceholder="Search technologies..."
                            maxDisplay={4}
                            creatable={true}
                            createLabel="Add Technology"
                            onCreateNew={onCreateTechStack ? (name) => onCreateTechStack(name) : undefined}
                          />
                          <VerificationCheckbox fieldName="techStacks" />
                        </div>
                      <div className="space-y-2">
                        <BenefitsSelector
                          benefits={formData.benefits}
                            benefitOptions={lookups?.benefits ?? []}
                            onCreateBenefit={
                              onCreateBenefit
                                ? async (name) => {
                                    const added = await onCreateBenefit(name)
                                    if (added)
                                      setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, added] }))
                                    return added
                                  }
                                : undefined
                            }
                          onChange={(benefits) => {
                            setFormData(prev => ({ ...prev, benefits }))
                            if (showVerification) {
                              setModifiedFields(prev => new Set(prev).add("benefits"))
                              setVerifiedFields(prev => new Set(prev).add("benefits"))
                            }
                          }}
                        />
                        <VerificationCheckbox fieldName="benefits" />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Office Locations Section */}
              <Collapsible 
                open={expandedSections.has("locations")} 
                onOpenChange={() => toggleSection("locations")}
              >
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-lg font-medium">Office Locations</span>
                        {formData.locations.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {formData.locations.length}
                          </Badge>
                        )}
                        {showVerification && (
                          <SectionProgressBadge 
                            percentage={locationsProgress.percentage}
                            verified={locationsProgress.verified}
                            total={locationsProgress.total}
                          />
                        )}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          expandedSections.has("locations") ? "transform rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  {showVerification && (
                    <div 
                      className="flex items-center gap-2 px-2" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id="verify-all-locations"
                        checked={isSectionFullyVerified("locations")}
                        onCheckedChange={(checked) => handleVerifyAllSection("locations", checked === true)}
                        aria-label="Verify all fields in Office Locations section"
                      />
                      <Label 
                        htmlFor="verify-all-locations"
                        className="text-sm text-muted-foreground cursor-pointer font-normal whitespace-nowrap"
                      >
                        Verify All
                      </Label>
                    </div>
                  )}
                </div>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLocation}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Button>
                  </div>

              {formData.locations.map((location, index) => (
                <Card key={location.id} className="relative">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Office Location {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                        disabled={formData.locations.length <= 1}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Country *</Label>
                                <Popover
                                  open={locationCountryPopoverIndex === index}
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setLocationCountryPopoverIndex(null)
                                      setLocationCountrySearchQuery("")
                                    } else {
                                      setLocationCountryPopoverIndex(index)
                                      setLocationCountrySearchQuery("")
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={locationCountryPopoverIndex === index}
                                      className={cn(
                                        "w-full justify-between",
                                        !location.country && "text-muted-foreground",
                                        errors.locations?.[index]?.country && "border-red-500"
                                      )}
                                    >
                                      {location.country ? (
                                        <span className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 shrink-0" />
                                          {location.country}
                                        </span>
                                      ) : (
                                        "Select country..."
                                      )}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput
                                        placeholder="Search countries..."
                                        value={locationCountryPopoverIndex === index ? locationCountrySearchQuery : ""}
                                        onValueChange={setLocationCountrySearchQuery}
                                      />
                                      <CommandList>
                                        {countriesLoading ? (
                                          <CommandEmpty>
                                            <div className="flex items-center justify-center gap-2 py-2">
                                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                              <span className="text-sm text-muted-foreground">Loading countries...</span>
                                            </div>
                                          </CommandEmpty>
                                        ) : filteredCountries.length === 0 ? (
                                          <>
                                            <CommandEmpty>
                                              {locationCountrySearchQuery.trim() ? "No country found." : "No countries available."}
                                            </CommandEmpty>
                                            {locationCountrySearchQuery.trim() && onCreateCountry && (
                                              <CommandGroup>
                                                <CommandItem
                                                  value={`add-country-${locationCountrySearchQuery.trim()}`}
                                                  onSelect={async () => {
                                                    const name = locationCountrySearchQuery.trim()
                                                    if (!name) return
                                                    setLocationCountryCreateInProgress(index)
                                                    try {
                                                      const newCountry = await onCreateCountry(name)
                                                      if (newCountry) {
                                                        handleLocationChange(index, "country", newCountry.name)
                                                        setLocationCountryPopoverIndex(null)
                                                        setLocationCountrySearchQuery("")
                                                      }
                                                    } finally {
                                                      setLocationCountryCreateInProgress(null)
                                                    }
                                                  }}
                                                  disabled={locationCountryCreateInProgress !== null}
                                                  className="flex items-center gap-2 font-medium text-primary cursor-pointer"
                                                >
                                                  <Plus className="h-4 w-4" />
                                                  {locationCountryCreateInProgress === index ? "Adding…" : `Add "${locationCountrySearchQuery.trim()}" as new country`}
                                                </CommandItem>
                                              </CommandGroup>
                                            )}
                                          </>
                                        ) : (
                                          <CommandGroup>
                                            {filteredCountries.map((country) => (
                                              <CommandItem
                                                key={country.id}
                                                value={String(country.id)}
                                                onSelect={() => {
                                                  handleLocationChange(index, "country", country.name)
                                                  setLocationCountryPopoverIndex(null)
                                                  setLocationCountrySearchQuery("")
                                                }}
                                                className="flex items-center gap-2"
                                              >
                                                <Check
                                                  className={cn(
                                                    "h-4 w-4",
                                                    location.country === country.name ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                {country.name}
                                              </CommandItem>
                                            ))}
                                            {locationCountrySearchQuery.trim() && onCreateCountry && !filteredCountries.some((c) => c.name.toLowerCase() === locationCountrySearchQuery.trim().toLowerCase()) && (
                                              <CommandItem
                                                value={`add-country-${locationCountrySearchQuery.trim()}`}
                                                onSelect={async () => {
                                                  const name = locationCountrySearchQuery.trim()
                                                  if (!name) return
                                                  setLocationCountryCreateInProgress(index)
                                                  try {
                                                    const newCountry = await onCreateCountry(name)
                                                    if (newCountry) {
                                                      handleLocationChange(index, "country", newCountry.name)
                                                      setLocationCountryPopoverIndex(null)
                                                      setLocationCountrySearchQuery("")
                                                    }
                                                  } finally {
                                                    setLocationCountryCreateInProgress(null)
                                                  }
                                                }}
                                                disabled={locationCountryCreateInProgress !== null}
                                                className="flex items-center gap-2 font-medium text-primary cursor-pointer"
                                              >
                                                <Plus className="h-4 w-4" />
                                                {locationCountryCreateInProgress === index ? "Adding…" : `Add "${name}" as new country`}
                                              </CommandItem>
                                            )}
                                          </CommandGroup>
                                        )}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                {errors.locations?.[index]?.country && (
                                  <p className="text-sm text-red-500">{errors.locations[index].country}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].country`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`city-${index}`}>City *</Label>
                                <Input
                                  id={`city-${index}`}
                                  type="text"
                                  placeholder="New York"
                                  value={location.city}
                                  onChange={(e) => handleLocationChange(index, "city", e.target.value)}
                                  className={errors.locations?.[index]?.city ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.city && (
                                  <p className="text-sm text-red-500">{errors.locations[index].city}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].city`} />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`address-${index}`}>Address *</Label>
                                <Input
                                  id={`address-${index}`}
                                  type="text"
                                  placeholder="123 Broadway, Manhattan, NY 10001"
                                  value={location.address}
                                  onChange={(e) => handleLocationChange(index, "address", e.target.value)}
                                  className={errors.locations?.[index]?.address ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.address && (
                                  <p className="text-sm text-red-500">{errors.locations[index].address}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].address`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`minSize-${index}`}>Minimum Employees *</Label>
                                <Input
                                  id={`minSize-${index}`}
                                  type="number"
                                  placeholder="10"
                                  min="1"
                                  value={location.minSize}
                                  onChange={(e) => handleLocationChange(index, "minSize", e.target.value)}
                                  className={errors.locations?.[index]?.minSize ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.minSize && (
                                  <p className="text-sm text-red-500">{errors.locations[index].minSize}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].minSize`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`maxSize-${index}`}>Maximum Employees *</Label>
                                <Input
                                  id={`maxSize-${index}`}
                                  type="number"
                                  placeholder="50"
                                  min="1"
                                  value={location.maxSize}
                                  onChange={(e) => handleLocationChange(index, "maxSize", e.target.value)}
                                  className={errors.locations?.[index]?.maxSize ? "border-red-500" : ""}
                                />
                                {errors.locations?.[index]?.maxSize && (
                                  <p className="text-sm text-red-500">{errors.locations[index].maxSize}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].maxSize`} />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`salaryPolicy-${index}`}>Salary Policy *</Label>
                                <Select
                                  value={location.salaryPolicy}
                                  onValueChange={(value: SalaryPolicyDb) => handleLocationChange(index, "salaryPolicy", value)}
                                >
                                  <SelectTrigger className={errors.locations?.[index]?.salaryPolicy ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select policy" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {salaryPolicyOptions.map((policy) => (
                                      <SelectItem key={policy.value} value={policy.value}>
                                        {policy.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.locations?.[index]?.salaryPolicy && (
                                  <p className="text-sm text-red-500">{errors.locations[index].salaryPolicy}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].salaryPolicy`} />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 pt-6">
                                  <Switch
                                    id={`isHeadquarters-${index}`}
                                    checked={location.isHeadquarters}
                                    onCheckedChange={(checked) => handleLocationChange(index, "isHeadquarters", !!checked)}
                                  />
                                  <Label htmlFor={`isHeadquarters-${index}`} className="text-sm font-normal">
                                    Headquarters
                                  </Label>
                                </div>
                                {errors.locations?.[index]?.isHeadquarters && (
                                  <p className="text-sm text-red-500">{errors.locations[index].isHeadquarters}</p>
                                )}
                                <VerificationCheckbox fieldName={`locations[${index}].isHeadquarters`} />
                              </div>
                            </div>
                  </CardContent>
                </Card>
              ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Layoffs Section */}
              <Collapsible 
                open={expandedSections.has("layoffs")} 
                onOpenChange={() => toggleSection("layoffs")}
              >
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-lg font-medium">Layoffs</span>
                        {formData.layoffs.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {formData.layoffs.length}
                          </Badge>
                        )}
                        {showVerification && (
                          <SectionProgressBadge 
                            percentage={layoffsProgress.percentage}
                            verified={layoffsProgress.verified}
                            total={layoffsProgress.total}
                          />
                        )}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          expandedSections.has("layoffs") ? "transform rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  {showVerification && (
                    <div 
                      className="flex items-center gap-2 px-2" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id="verify-all-layoffs"
                        checked={isSectionFullyVerified("layoffs")}
                        onCheckedChange={(checked) => handleVerifyAllSection("layoffs", checked === true)}
                        aria-label="Verify all fields in Layoffs section"
                      />
                      <Label 
                        htmlFor="verify-all-layoffs"
                        className="text-sm text-muted-foreground cursor-pointer font-normal whitespace-nowrap"
                      >
                        Verify All
                      </Label>
                    </div>
                  )}
                </div>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLayoff}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Layoff
                    </Button>
                  </div>

                  {formData.layoffs.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No layoffs recorded</p>
                  ) : (
                    formData.layoffs.map((layoff, index) => (
                      <Card key={layoff.id} className="relative">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between text-base">
                            <span>Layoff {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLayoff(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`layoffDate-${index}`}>Date *</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !layoff.layoffDate && "text-muted-foreground",
                                      errors.layoffs?.[index]?.layoffDate && "border-red-500"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                    {layoff.layoffDate ? format(layoff.layoffDate, "PPP") : "Pick a layoff date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={layoff.layoffDate}
                                    onSelect={(date) => handleLayoffChange(index, "layoffDate", date)}
                                    disabled={(date) => date > new Date()}
                                    captionLayout="dropdown"
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              {errors.layoffs?.[index]?.layoffDate && (
                                <p className="text-sm text-red-500">{errors.layoffs[index].layoffDate}</p>
                              )}
                              <VerificationCheckbox fieldName={`layoffs[${index}].layoffDate`} />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`numberOfEmployeesLaidOff-${index}`}>No. of Affected Employees *</Label>
                              <Input
                                id={`numberOfEmployeesLaidOff-${index}`}
                                type="number"
                                min="1"
                                value={layoff.numberOfEmployeesLaidOff}
                                onChange={(e) => handleLayoffChange(index, "numberOfEmployeesLaidOff", e.target.value)}
                                placeholder="e.g., 50"
                                className={errors.layoffs?.[index]?.numberOfEmployeesLaidOff ? "border-red-500" : ""}
                              />
                              {errors.layoffs?.[index]?.numberOfEmployeesLaidOff && (
                                <p className="text-sm text-red-500">{errors.layoffs[index].numberOfEmployeesLaidOff}</p>
                              )}
                              <VerificationCheckbox fieldName={`layoffs[${index}].numberOfEmployeesLaidOff`} />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`reason-${index}`}>Reason *</Label>
                              <Select 
                                value={layoff.reason} 
                                onValueChange={(value) => handleLayoffChange(index, "reason", value as LayoffReasonDb)}
                              >
                                <SelectTrigger className={errors.layoffs?.[index]?.reason ? "border-red-500" : ""}>
                                  <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.entries(LAYOFF_REASON_DB_LABELS) as [LayoffReasonDb, string][]).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {layoff.reason === "other" && (
                                <div className="mt-2">
                                  <Input
                                    placeholder="Specify reason"
                                    value={layoff.reasonOther}
                                    onChange={(e) => handleLayoffChange(index, "reasonOther", e.target.value)}
                                    className={errors.layoffs?.[index]?.reasonOther ? "border-red-500" : ""}
                                  />
                                  {errors.layoffs?.[index]?.reasonOther && (
                                    <p className="text-sm text-red-500 mt-1">{errors.layoffs[index].reasonOther}</p>
                                  )}
                                </div>
                              )}
                              <VerificationCheckbox fieldName={`layoffs[${index}].reason`} />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`source-${index}`}>Source *</Label>
                              <Input
                                id={`source-${index}`}
                                value={layoff.source}
                                onChange={(e) => handleLayoffChange(index, "source", e.target.value)}
                                placeholder="e.g., Company announcement, News article"
                                className={errors.layoffs?.[index]?.source ? "border-red-500" : ""}
                              />
                              {errors.layoffs?.[index]?.source && (
                                <p className="text-sm text-red-500">{errors.layoffs[index].source}</p>
                              )}
                              <VerificationCheckbox fieldName={`layoffs[${index}].source`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>
          </form>
        </div>

          <DialogFooter className="px-6 py-4 border-t border-border gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="transition-all duration-150 ease-in-out hover:bg-accent hover:text-accent-foreground hover:border-accent cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="employer-form"
              disabled={isLoading}
              className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getSubmitButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved verification changes. Are you sure you want to close without saving?
              {modifiedFields.size > 0 && (
                <span className="block mt-2 text-sm">
                  <strong>{modifiedFields.size}</strong> field(s) modified
                </span>
              )}
              {verifiedFields.size > 0 && (
                <span className="block mt-1 text-sm">
                  <strong>{verifiedFields.size}</strong> field(s) marked as verified
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Continue Editing</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDiscardChanges}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
