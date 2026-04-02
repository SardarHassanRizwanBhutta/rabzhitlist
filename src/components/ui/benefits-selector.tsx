"use client"

import * as React from "react"
import { useState } from "react"
import { X, Plus, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { EmployerBenefit, BenefitUnit } from "@/lib/types/benefits"
import { generateBenefitId, UNIT_LABELS } from "@/lib/utils/benefits"

/** Option from API (e.g. BenefitDto). */
export interface BenefitOption {
  id: number
  name: string
}

interface BenefitsSelectorProps {
  benefits: EmployerBenefit[]
  onChange: (benefits: EmployerBenefit[]) => void
  /** Options from API to show in dropdown. When provided with onCreateBenefit, "Add Benefit" appears when search has no match. */
  benefitOptions?: BenefitOption[]
  /** When user clicks "Add Benefit", call API to create; return new EmployerBenefit to add to selection. */
  onCreateBenefit?: (name: string) => Promise<EmployerBenefit | null | void>
  disabled?: boolean
  className?: string
}

export function BenefitsSelector({
  benefits,
  onChange,
  benefitOptions = [],
  onCreateBenefit,
  disabled = false,
  className,
}: BenefitsSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [customBenefitName, setCustomBenefitName] = useState("")
  const [customHasAmount, setCustomHasAmount] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  const [customUnit, setCustomUnit] = useState<BenefitUnit>("PKR")
  const [isAddingBenefit, setIsAddingBenefit] = useState(false)

  const selectedNames = benefits.map((b) => b.name)
  const searchLower = searchValue.trim().toLowerCase()

  // Options that match search and are not already selected
  const filteredOptions = React.useMemo(() => {
    if (!searchLower) return benefitOptions
    return benefitOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(searchLower) &&
        !selectedNames.some((n) => n.toLowerCase() === opt.name.toLowerCase())
    )
  }, [benefitOptions, searchLower, selectedNames])

  // Search matches an existing option (by name)
  const searchMatchesOption = React.useMemo(
    () =>
      searchLower &&
      benefitOptions.some((opt) => opt.name.toLowerCase() === searchLower),
    [benefitOptions, searchLower]
  )
  const searchValueExists = selectedNames.some((n) => n.toLowerCase() === searchLower)

  // Show "Add Benefit" when search has no match and we have a create handler
  const shouldShowAddBenefit =
    searchValue.trim().length >= 1 &&
    !searchValueExists &&
    !searchMatchesOption &&
    !!onCreateBenefit

  const addBenefitToSelection = (opt: BenefitOption) => {
    const newBenefit: EmployerBenefit = {
      id: String(opt.id),
      name: opt.name,
      amount: null,
      unit: null,
    }
    onChange([...benefits, newBenefit])
  }

  const handleAddBenefitViaApi = async () => {
    if (!searchValue.trim() || searchValueExists || !onCreateBenefit) return
    setIsAddingBenefit(true)
    try {
      const added = await onCreateBenefit(searchValue.trim())
      if (added) {
        onChange([...benefits, added])
        setSearchValue("")
        setOpen(false)
      }
    } finally {
      setIsAddingBenefit(false)
    }
  }

  // Fallback: open dialog when no API handler (e.g. legacy flow)
  const handleCreateNewBenefit = () => {
    if (onCreateBenefit) {
      handleAddBenefitViaApi()
      return
    }
    if (!searchValue.trim() || searchValueExists) return
    setCustomBenefitName(searchValue.trim())
    setCustomHasAmount(false)
    setCustomAmount("")
    setCustomUnit("PKR")
    setOpen(false)
    setCustomDialogOpen(true)
  }

  const handleAddCustomBenefit = () => {
    if (!customBenefitName.trim()) return

    const newBenefit: EmployerBenefit = {
      id: generateBenefitId(),
      name: customBenefitName.trim(),
      amount: customHasAmount ? (parseInt(customAmount) || 0) : null,
      unit: customHasAmount ? customUnit : null,
    }
    onChange([...benefits, newBenefit])
    setCustomBenefitName("")
    setCustomHasAmount(false)
    setCustomAmount("")
    setCustomUnit("PKR")
    setCustomDialogOpen(false)
    setSearchValue("")
  }


  // Update benefit amount
  const updateBenefitAmount = (benefitId: string, amount: number) => {
    onChange(benefits.map(b => 
      b.id === benefitId ? { ...b, amount } : b
    ))
  }

  // Update benefit unit
  const updateBenefitUnit = (benefitId: string, unit: BenefitUnit) => {
    onChange(benefits.map(b => 
      b.id === benefitId ? { ...b, unit } : b
    ))
  }

  // Remove a benefit
  const removeBenefit = (benefitId: string) => {
    onChange(benefits.filter(b => b.id !== benefitId))
  }


  // Get unit label for display
  const getUnitLabel = (unit: BenefitUnit | null): string => {
    if (!unit) return ""
    return UNIT_LABELS[unit]
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      <Label className="text-sm font-medium">Benefits</Label>
      
      {/* Benefit Selector Dropdown */}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setSearchValue("") // Clear search when closing
          }
        }}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="flex-1 justify-between font-normal"
            >
              {benefits.length > 0 
                ? `${benefits.length} benefit${benefits.length > 1 ? 's' : ''} selected`
                : "Select benefits..."
              }
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Search benefits..." 
                value={searchValue}
                onValueChange={setSearchValue}
                onKeyDown={(e) => {
                  if (shouldShowAddBenefit && e.key === "Enter") {
                    e.preventDefault()
                    handleCreateNewBenefit()
                  }
                }}
              />
              <CommandList>
                {filteredOptions.length > 0 && (
                  <CommandGroup heading="Benefits">
                    {filteredOptions.map((opt) => (
                      <CommandItem
                        key={opt.id}
                        value={opt.name}
                        onSelect={() => {
                          addBenefitToSelection(opt)
                          setSearchValue("")
                        }}
                        className="cursor-pointer"
                      >
                        {opt.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {shouldShowAddBenefit && (
                  <CommandGroup>
                    <CommandItem
                      value={`add:${searchValue}`}
                      onSelect={handleCreateNewBenefit}
                      disabled={isAddingBenefit}
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isAddingBenefit ? "Adding..." : "Add Benefit"}
                    </CommandItem>
                  </CommandGroup>
                )}
                {filteredOptions.length === 0 && !shouldShowAddBenefit && (
                  <CommandEmpty>
                    <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                      {searchValue.trim().length === 0
                        ? "Type to search benefits"
                        : "No matching benefits. Type a name and use \"Add Benefit\" to create one."}
                    </div>
                  </CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Custom Benefit Dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Custom Benefit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-benefit-name">Benefit Name</Label>
              <Input
                id="custom-benefit-name"
                placeholder="e.g., Car Allowance"
                value={customBenefitName}
                onChange={(e) => setCustomBenefitName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-has-amount"
                checked={customHasAmount}
                onCheckedChange={(checked) => setCustomHasAmount(checked === true)}
              />
              <Label htmlFor="custom-has-amount" className="cursor-pointer">
                This benefit has a value
              </Label>
            </div>
            
            {customHasAmount && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-unit">Unit Type</Label>
                  <Select
                    value={customUnit}
                    onValueChange={(value) => setCustomUnit(value as BenefitUnit)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PKR">PKR (Currency)</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="count">Count/Number</SelectItem>
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">
                    Value {customUnit === "PKR" ? "(PKR)" : customUnit === "days" ? "(days)" : customUnit === "percent" ? "(%)" : ""}
                  </Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder={customUnit === "days" ? "e.g., 20" : customUnit === "percent" ? "e.g., 10" : "e.g., 10000"}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCustomDialogOpen(false)
                setCustomBenefitName("")
                setCustomHasAmount(false)
                setCustomAmount("")
                setCustomUnit("PKR")
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCustomBenefit}
              disabled={!customBenefitName.trim()}
            >
              Add Benefit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selected Benefits Display */}
      {benefits.length > 0 && (
        <div className="space-y-2">
          {benefits.map((benefit) => {
            const requiresAmount = benefit.amount !== null || benefit.unit !== null
            const currentUnit = benefit.unit ?? "PKR"

            return (
              <div 
                key={benefit.id} 
                className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
              >
                <Badge variant="secondary" className="shrink-0">
                  {benefit.name}
                </Badge>
                
                {requiresAmount && (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={benefit.amount ?? ""}
                      onChange={(e) => updateBenefitAmount(benefit.id, parseInt(e.target.value) || 0)}
                      disabled={disabled}
                      className="h-8 w-24"
                    />
                    <Select
                      value={currentUnit}
                      onValueChange={(value) => updateBenefitUnit(benefit.id, value as BenefitUnit)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKR">PKR</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="percent">Percent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBenefit(benefit.id)}
                  disabled={disabled}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
