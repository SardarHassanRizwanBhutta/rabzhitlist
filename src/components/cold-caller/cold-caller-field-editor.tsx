"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Check, X, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"
import type { EmptyField } from "@/types/cold-caller"
import type { EmployerBenefit } from "@/lib/types/benefits"
import { sampleCandidates } from "@/lib/sample-data/candidates"
import { sampleProjects } from "@/lib/sample-data/projects"

// Extract unique tech stacks from sample data (case-insensitive deduplication)
const extractUniqueTechStacks = (): MultiSelectOption[] => {
  const techStacksMap = new Map<string, string>() // Map<lowercase, original>
  
  // From candidates' work experiences
  sampleCandidates.forEach(candidate => {
    candidate.workExperiences?.forEach(we => {
      we.techStacks?.forEach(tech => {
        const lower = tech.toLowerCase().trim()
        if (!techStacksMap.has(lower)) {
          techStacksMap.set(lower, tech)
        }
      })
    })
    // From candidate's standalone tech stacks
    candidate.techStacks?.forEach(tech => {
      const lower = tech.toLowerCase().trim()
      if (!techStacksMap.has(lower)) {
        techStacksMap.set(lower, tech)
      }
    })
  })
  
  // From projects
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

interface ColdCallerFieldEditorProps {
  field: EmptyField
  value: unknown
  onChange: (fieldPath: string, value: unknown) => void
  onSave: (fieldPath: string, value: unknown) => Promise<void>
  isSaved: boolean
  highlightedField?: string | null
}

export function ColdCallerFieldEditor({
  field,
  value,
  onChange,
  onSave,
  isSaved,
  highlightedField,
}: ColdCallerFieldEditorProps) {
  // Initialize with appropriate default based on field type
  const getDefaultValue = (fieldType: string, currentValue: unknown) => {
    if (currentValue !== null && currentValue !== undefined) return currentValue
    if (fieldType === 'multiselect' || fieldType === 'benefits') return []
    if (fieldType === 'boolean') return null
    return ''
  }
  
  const [localValue, setLocalValue] = useState<unknown>(() => getDefaultValue(field.fieldType, value))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(getDefaultValue(field.fieldType, value))
  }, [value, field.fieldType])

  const handleChange = (newValue: unknown) => {
    setLocalValue(newValue)
    onChange(field.fieldPath, newValue)
    setError(null)
  }

  const handleSave = async () => {
    // Check for empty values based on field type
    const isEmpty = () => {
      if (localValue === null || localValue === undefined) return true
      if (typeof localValue === 'string' && localValue.trim() === '') return true
      if (Array.isArray(localValue) && localValue.length === 0) return true
      return false
    }
    
    if (isEmpty()) {
      setError('Please enter a value')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave(field.fieldPath, localValue)
    } catch (err) {
      setError('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const isHighlighted = highlightedField === field.apiFieldName

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
            rows={3}
          />
        )

      case 'select':
        return (
          <Select
            value={(localValue as string) || undefined}
            onValueChange={(val) => handleChange(val)}
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
                checked={localValue === true || localValue === 'true'}
                onCheckedChange={(checked) => handleChange(checked ? true : false)}
              />
              <Label htmlFor={`${field.fieldPath}-yes`} className="text-sm cursor-pointer">
                Yes
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${field.fieldPath}-no`}
                checked={localValue === false || localValue === 'false'}
                onCheckedChange={(checked) => handleChange(checked ? false : true)}
              />
              <Label htmlFor={`${field.fieldPath}-no`} className="text-sm cursor-pointer">
                No
              </Label>
            </div>
          </div>
        )

      case 'multiselect':
        // Determine which options to use based on field label
        const getMultiSelectOptions = (): MultiSelectOption[] => {
          const fieldLabelLower = field.fieldLabel.toLowerCase()
          if (fieldLabelLower.includes('tech stack')) {
            return techStackOptions
          }
          if (fieldLabelLower.includes('domain')) {
            return domainOptions
          }
          // For fields with predefined options (like Time Support Zones)
          if (field.options && field.options.length > 0) {
            return field.options
          }
          // Default: return empty array, user can type custom values
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
            />
          </div>
        )

      case 'benefits':
        // Use the proper BenefitsSelector component
        const benefitsValue: EmployerBenefit[] = Array.isArray(localValue) ? localValue : []
        return (
          <div className="flex-1">
            <BenefitsSelector
              benefits={benefitsValue}
              onChange={(benefits) => handleChange(benefits)}
            />
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
          />
        )
    }
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-300",
        isHighlighted 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-border bg-card hover:bg-muted/30",
        isSaved && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{field.fieldLabel}</Label>
            {field.context && (
              <Badge variant="outline" className="text-xs font-normal">
                {field.context}
              </Badge>
            )}
            {isSaved && (
              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
          
          <div className="flex items-start gap-2">
            {renderInput()}
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className={cn(
                "shrink-0",
                isSaved && "bg-green-600 hover:bg-green-600"
              )}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <Check className="h-4 w-4" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
          
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}

