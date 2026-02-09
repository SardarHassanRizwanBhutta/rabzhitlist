"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { 
  Check, 
  Loader2, 
  MessageSquare,
  Star,
  Copy,
  Target,
  CalendarIcon,
  ChevronsUpDown,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { BenefitsSelector } from "@/components/ui/benefits-selector"
import { VerificationBadge } from "@/components/ui/verification-badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { EmptyField, FieldStatus, GeneratedQuestion } from "@/types/cold-caller"
import type { EmployerBenefit } from "@/lib/types/benefits"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { sampleProjects } from "@/lib/sample-data/projects"

// Extract unique tech stacks from sample data
const extractUniqueTechStacks = (): MultiSelectOption[] => {
  const techStacksMap = new Map<string, string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.techStacks?.forEach(tech => {
        const lower = tech.toLowerCase().trim()
        if (!techStacksMap.has(lower)) {
          techStacksMap.set(lower, tech)
        }
      })
    })
    candidate.techStacks?.forEach(tech => {
      const lower = tech.toLowerCase().trim()
      if (!techStacksMap.has(lower)) {
        techStacksMap.set(lower, tech)
      }
    })
  })
  
  sampleProjects.forEach(project => {
    project.techStacks?.forEach(tech => {
      const lower = tech.toLowerCase().trim()
      if (!techStacksMap.has(lower)) {
        techStacksMap.set(lower, tech)
      }
    })
  })
  
  return Array.from(techStacksMap.values())
    .sort((a, b) => a.localeCompare(b))
    .map(tech => ({ value: tech, label: tech }))
}

// Extract unique domains from sample data
const extractUniqueDomains = (): MultiSelectOption[] => {
  const domainsMap = new Map<string, string>()
  
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.domains?.forEach(domain => {
        const lower = domain.toLowerCase().trim()
        if (!domainsMap.has(lower)) {
          domainsMap.set(lower, domain)
        }
      })
    })
  })
  
  sampleProjects.forEach(project => {
    project.verticalDomains?.forEach(domain => {
      const lower = domain.toLowerCase().trim()
      if (!domainsMap.has(lower)) {
        domainsMap.set(lower, domain)
      }
    })
  })
  
  return Array.from(domainsMap.values())
    .sort((a, b) => a.localeCompare(b))
    .map(domain => ({ value: domain, label: domain }))
}

// Pre-compute options
const techStackOptions = extractUniqueTechStacks()
const domainOptions = extractUniqueDomains()

interface QuestionFieldCardProps {
  field: EmptyField
  question?: GeneratedQuestion
  status: FieldStatus
  value: unknown
  onValueChange: (fieldPath: string, value: unknown) => void
  onSave: (fieldPath: string, value: unknown, verified?: boolean) => Promise<void>
  onStatusChange: (fieldPath: string, status: FieldStatus, note?: string) => void
  isVerified?: boolean
  onVerificationToggle?: (fieldPath: string, verified: boolean) => void
  isCompact?: boolean  // For focus mode
  showPriority?: boolean
  onCreateEntity?: (field: EmptyField, searchValue: string) => void
}

export function QuestionFieldCard({
  field,
  question,
  status,
  value,
  onValueChange,
  onSave,
  onStatusChange,
  isVerified = false,
  onVerificationToggle,
  isCompact = false,
  showPriority = true,
  onCreateEntity,
}: QuestionFieldCardProps) {
  const [localValue, setLocalValue] = useState<unknown>(() => {
    if (value !== null && value !== undefined) return value
    if (field.fieldType === 'multiselect' || field.fieldType === 'benefits') return []
    if (field.fieldType === 'boolean') return null
    if (field.fieldType === 'date') return null
    return ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [willVerify, setWillVerify] = useState(isVerified)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Update local value when prop changes
  useEffect(() => {
    if (value !== null && value !== undefined) {
      setLocalValue(value)
    }
  }, [value])

  // Update willVerify when isVerified prop changes
  useEffect(() => {
    setWillVerify(isVerified)
  }, [isVerified])

  // Reset search value when combobox closes
  useEffect(() => {
    if (!comboboxOpen) {
      setSearchValue("")
    }
  }, [comboboxOpen])

  const handleChange = (newValue: unknown) => {
    setLocalValue(newValue)
    onValueChange(field.fieldPath, newValue)
    setError(null)
    
    // Auto-check verification when a value is entered (if not already verified)
    if (!willVerify) {
      const hasValue = () => {
        if (newValue === null || newValue === undefined) return false
        if (typeof newValue === 'string' && newValue.trim() === '') return false
        if (Array.isArray(newValue) && newValue.length === 0) return false
        if (field.fieldType === 'date' && !(newValue instanceof Date)) return false
        return true
      }
      if (hasValue()) {
        setWillVerify(true)
      }
    }
  }

  const handleSave = async () => {
    const isEmpty = () => {
      if (localValue === null || localValue === undefined) return true
      if (typeof localValue === 'string' && localValue.trim() === '') return true
      if (Array.isArray(localValue) && localValue.length === 0) return true
      if (field.fieldType === 'date' && !(localValue instanceof Date)) return true
      return false
    }
    
    if (isEmpty()) {
      setError('Please enter a value')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave(field.fieldPath, localValue, willVerify)
      onStatusChange(field.fieldPath, 'answered')
      // Update verification state if handler provided
      if (onVerificationToggle && willVerify !== isVerified) {
        onVerificationToggle(field.fieldPath, willVerify)
      }
      toast.success(`${field.fieldLabel} saved!`)
    } catch (err) {
      setError('Failed to save')
      toast.error('Failed to save field')
    } finally {
      setIsSaving(false)
    }
  }


  const handleCopyQuestion = () => {
    if (question) {
      navigator.clipboard.writeText(question.question)
      toast.success('Question copied to clipboard')
    }
  }

  const getPriorityStars = (priority: number) => {
    return Array(Math.min(priority, 5)).fill(0).map((_, i) => (
      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
    ))
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'answered':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
            <Check className="h-3 w-3 mr-1" />
            Answered
          </Badge>
        )
      default:
        return null
    }
  }

  const renderInput = () => {
    switch (field.fieldType) {
      case 'text':
      case 'number':
        return (
          <Input
            type={field.fieldType}
            value={localValue as string | number | undefined}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
            className="flex-1"
            disabled={status === 'answered'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={localValue as string | undefined}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
            className="flex-1 min-h-[80px]"
            disabled={status === 'answered'}
            rows={3}
          />
        )

      case 'select':
        return (
          <Select
            value={(localValue as string) || undefined}
            onValueChange={(val) => handleChange(val)}
            disabled={status === 'answered'}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={`Select ${field.fieldLabel.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${field.fieldPath}-yes`}
                checked={localValue === true}
                onCheckedChange={(checked) => handleChange(checked ? true : false)}
                disabled={status === 'answered'}
              />
              <Label htmlFor={`${field.fieldPath}-yes`} className="text-sm cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${field.fieldPath}-no`}
                checked={localValue === false}
                onCheckedChange={(checked) => handleChange(checked ? false : true)}
                disabled={status === 'answered'}
              />
              <Label htmlFor={`${field.fieldPath}-no`} className="text-sm cursor-pointer">
                No
              </Label>
            </div>
          </div>
        )

      case 'multiselect':
        const getMultiSelectOptions = (): MultiSelectOption[] => {
          const fieldLabelLower = field.fieldLabel.toLowerCase()
          if (fieldLabelLower.includes('tech stack')) {
            return techStackOptions
          }
          if (fieldLabelLower.includes('domain')) {
            return domainOptions
          }
          if (field.options && field.options.length > 0) {
            return field.options
          }
          return []
        }
        
        const multiSelectOptions = getMultiSelectOptions()
        const selectedValues = Array.isArray(localValue) ? localValue : []
        
        return (
          <div className="flex-1">
            <MultiSelect
              items={multiSelectOptions}
              selected={selectedValues}
              onChange={(values) => handleChange(values)}
              placeholder={`Select ${field.fieldLabel.toLowerCase()}...`}
              searchPlaceholder={`Search ${field.fieldLabel.toLowerCase()}...`}
              creatable={true}
              createLabel={`Add new ${field.fieldLabel.toLowerCase().replace(/s$/, '')}`}
              maxDisplay={3}
              disabled={status === 'answered'}
            />
          </div>
        )

      case 'benefits':
        const benefitsValue: EmployerBenefit[] = Array.isArray(localValue) ? localValue : []
        return (
          <div className="flex-1">
            <BenefitsSelector
              benefits={benefitsValue}
              onChange={(benefits) => handleChange(benefits)}
              disabled={status === 'answered'}
            />
          </div>
        )

      case 'date':
        const dateValue = localValue instanceof Date ? localValue : null
        return (
          <div className="flex-1">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                  disabled={status === 'answered'}
                >
                  {dateValue 
                    ? dateValue.toLocaleDateString()
                    : `Select ${field.fieldLabel.toLowerCase()}...`}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue || undefined}
                  onSelect={(date) => {
                    handleChange(date || null)
                    setDatePickerOpen(false)
                  }}
                  captionLayout="dropdown"
                  disabled={status === 'answered'}
                />
              </PopoverContent>
            </Popover>
          </div>
        )

      case 'combobox':
        const comboboxOptions = field.options || []
        const selectedOption = comboboxOptions.find(opt => opt.value === (localValue as string))
        
        // Filter options based on search
        const filteredOptions = (() => {
          if (!searchValue.trim()) return comboboxOptions
          const searchLower = searchValue.toLowerCase()
          return comboboxOptions.filter(opt => 
            opt.label.toLowerCase().includes(searchLower) ||
            opt.value.toLowerCase().includes(searchLower)
          )
        })()
        
        // Check if search value exists
        const searchValueExists = (() => {
          if (!searchValue.trim()) return false
          const searchLower = searchValue.trim().toLowerCase()
          return comboboxOptions.some(opt => 
            opt.value.toLowerCase() === searchLower ||
            opt.label.toLowerCase() === searchLower
          ) || (localValue as string)?.toLowerCase() === searchLower
        })()
        
        const shouldShowCreate = field.onCreateEntity && 
          searchValue.trim().length >= 2 && 
          !searchValueExists && 
          filteredOptions.length === 0

        return (
          <div className="flex-1">
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                  disabled={status === 'answered'}
                >
                  {selectedOption ? selectedOption.label : `Select ${field.fieldLabel.toLowerCase()}...`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder={`Search ${field.fieldLabel.toLowerCase()}...`}
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {shouldShowCreate ? (
                        <div className="p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              if (onCreateEntity) {
                                onCreateEntity(field, searchValue.trim())
                              }
                              setSearchValue("")
                              setComboboxOpen(false)
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create &quot;{searchValue.trim()}&quot;
                          </Button>
                        </div>
                      ) : (
                        "No results found."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            handleChange(option.value)
                            setSearchValue("")
                            setComboboxOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              localValue === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )

      default:
        return (
          <Input
            type="text"
            value={localValue as string | number | undefined}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${field.fieldLabel.toLowerCase()}...`}
            className="flex-1"
            disabled={status === 'answered'}
          />
        )
    }
  }

  const isDisabled = status === 'answered'

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200",
        status === 'answered' && "border-green-200 bg-green-50/50 dark:border-green-800/50 dark:bg-green-950/20",
        status === 'pending' && "border-border bg-card hover:border-primary/50",
        isCompact ? "p-4" : "p-4 md:p-5"
      )}
    >
      {/* Prominent Field Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ask About
            </span>
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {field.fieldLabel}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {field.context && (
            <Badge variant="outline" className="text-xs font-normal">
              {field.context}
            </Badge>
          )}
          {status === 'answered' && isVerified && (
            <VerificationBadge 
              status="verified" 
              size="sm" 
              showTooltip={true}
            />
          )}
          {getStatusBadge()}
        </div>
      </div>

      {/* Question Section */}
      {question && (
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-primary">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Question to ask:</span>
            </div>
            <div className="flex items-center gap-2">
              {showPriority && question.priority > 0 && (
                <div className="flex items-center gap-0.5" title={`Priority: ${question.priority}/5`}>
                  {getPriorityStars(question.priority)}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyQuestion}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Copy question"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className={cn(
            "text-base leading-relaxed pl-6",
            isCompact ? "text-sm" : "text-base"
          )}>
            &quot;{question.question}&quot;
          </p>
        </div>
      )}

      {/* No question yet - show placeholder */}
      {!question && (
        <div className="mb-4 p-3 bg-muted/30 rounded-md border border-dashed border-muted-foreground/30">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>Click &quot;Generate Questions&quot; to get AI-suggested questions</span>
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="space-y-3">
        <div className={cn(
          "flex gap-2",
          field.fieldType === 'textarea' || field.fieldType === 'multiselect' || field.fieldType === 'benefits'
            ? "flex-col"
            : "flex-row items-start"
        )}>
          {renderInput()}
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {/* Action Buttons */}
        {status === 'pending' && (
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`verify-${field.fieldPath}`}
                checked={willVerify}
                onCheckedChange={(checked) => setWillVerify(checked === true)}
                disabled={isSaving}
                className="h-4 w-4"
              />
              <Label 
                htmlFor={`verify-${field.fieldPath}`}
                className={cn(
                  "text-sm cursor-pointer select-none",
                  willVerify ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'
                )}
              >
                {willVerify ? '✓ Verified' : 'Mark as verified'}
              </Label>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1.5"
              title={willVerify ? "Save & Verify" : "Save"}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {willVerify ? 'Save & Verify' : 'Save'}
            </Button>
          </div>
        )}

        {/* Allow editing for answered */}
        {status === 'answered' && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(field.fieldPath, 'pending')}
              className="gap-1.5"
            >
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

