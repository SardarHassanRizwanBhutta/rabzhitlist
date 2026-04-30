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
  PopoverAnchor,
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
import { formatBenefitAmount, generateBenefitId } from "@/lib/utils/benefits"

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
  /** Which benefit's value editor popover is open (controlled with `Popover` + `PopoverAnchor`). */
  const [valuePopoverBenefitId, setValuePopoverBenefitId] = useState<string | null>(null)

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
      hasValue: false,
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
      hasValue: customHasAmount,
      amount: customHasAmount ? (parseFloat(customAmount) || 0) : null,
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


  const updateBenefitHasValue = (benefitId: string, hasValue: boolean) => {
    onChange(
      benefits.map((b) =>
        b.id === benefitId
          ? hasValue
            ? { ...b, hasValue: true, unit: b.unit ?? "PKR", amount: b.amount ?? null }
            : { ...b, hasValue: false, amount: null, unit: null }
          : b
      )
    )
    if (!hasValue && valuePopoverBenefitId === benefitId) {
      setValuePopoverBenefitId(null)
    }
  }

  const updateBenefitAmount = (benefitId: string, amount: number | null) => {
    onChange(benefits.map((b) => (b.id === benefitId ? { ...b, amount } : b)))
  }

  const updateBenefitUnit = (benefitId: string, unit: BenefitUnit) => {
    onChange(benefits.map((b) => (b.id === benefitId ? { ...b, unit } : b)))
  }

  // Remove a benefit
  const removeBenefit = (benefitId: string) => {
    onChange(benefits.filter(b => b.id !== benefitId))
  }


  const valueFieldLabel = (unit: BenefitUnit): string => {
    switch (unit) {
      case "PKR":
        return "Amount (PKR)"
      case "percent":
        return "Percentage (%)"
      default:
        return "Value"
    }
  }

  const valuePlaceholder = (unit: BenefitUnit): string => {
    switch (unit) {
      case "PKR":
        return "e.g. 50000"
      case "percent":
        return "e.g. 10"
      default:
        return ""
    }
  }

  const benefitValueSummary = (b: EmployerBenefit): string => {
    if (!b.hasValue) return ""
    if (b.unit != null && b.amount != null && !Number.isNaN(b.amount)) {
      return formatBenefitAmount(b.amount, b.unit)
    }
    return "Choose unit & value"
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
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">
                    Value {customUnit === "PKR" ? "(PKR)" : customUnit === "percent" ? "(%)" : ""}
                  </Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    step="any"
                    placeholder={customUnit === "percent" ? "e.g., 10" : "e.g., 10000"}
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
            const currentUnit = benefit.unit ?? "PKR"
            const valuePopoverOpen = valuePopoverBenefitId === benefit.id

            return (
              <div
                key={benefit.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-muted/20 p-2.5 shadow-xs transition-colors hover:bg-muted/35"
              >
                <Badge
                  variant="secondary"
                  className="shrink-0 max-w-[min(12rem,45%)] truncate font-medium"
                  title={benefit.name}
                >
                  {benefit.name}
                </Badge>

                <Popover
                  open={valuePopoverOpen}
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setValuePopoverBenefitId((id) => (id === benefit.id ? null : id))
                    }
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <PopoverAnchor asChild>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
                        <div className="flex items-center gap-2 shrink-0 rounded-md px-0.5 py-0.5">
                          <Checkbox
                            id={`benefit-has-value-${benefit.id}`}
                            checked={benefit.hasValue}
                            onCheckedChange={(checked) => {
                              const on = checked === true
                              if (on) {
                                updateBenefitHasValue(benefit.id, true)
                                setValuePopoverBenefitId(benefit.id)
                              } else {
                                updateBenefitHasValue(benefit.id, false)
                              }
                            }}
                            disabled={disabled}
                          />
                          <Label
                            htmlFor={`benefit-has-value-${benefit.id}`}
                            className="cursor-pointer text-sm font-medium text-foreground/90"
                          >
                            Has value
                          </Label>
                        </div>
                        {benefit.hasValue && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            className="h-8 shrink-0 border-dashed text-xs font-normal text-muted-foreground hover:border-solid hover:text-foreground"
                            onClick={() => setValuePopoverBenefitId(benefit.id)}
                          >
                            {benefitValueSummary(benefit)}
                          </Button>
                        )}
                      </div>
                    </PopoverAnchor>
                  </div>

                  <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    className="w-[min(100vw-1.5rem,20rem)] overflow-hidden p-0 shadow-lg"
                  >
                    <div className="border-b bg-gradient-to-br from-muted/80 to-muted/40 px-3 py-2.5">
                      <p className="text-sm font-semibold leading-tight">{benefit.name}</p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">
                        Pick a unit, then enter the amount. Changes apply as you type.
                      </p>
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Benefit unit
                        </Label>
                        <Select
                          value={currentUnit}
                          onValueChange={(value) =>
                            updateBenefitUnit(benefit.id, value as BenefitUnit)
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-9 w-full bg-background">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[60]">
                            <SelectItem value="PKR">PKR — currency</SelectItem>
                            <SelectItem value="percent">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor={`benefit-value-${benefit.id}`}
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {valueFieldLabel(currentUnit)}
                        </Label>
                        <Input
                          id={`benefit-value-${benefit.id}`}
                          type="number"
                          step="any"
                          inputMode="decimal"
                          placeholder={valuePlaceholder(currentUnit)}
                          value={benefit.amount ?? ""}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === "") {
                              updateBenefitAmount(benefit.id, null)
                              return
                            }
                            const n = parseFloat(v)
                            updateBenefitAmount(
                              benefit.id,
                              Number.isNaN(n) ? null : n
                            )
                          }}
                          disabled={disabled}
                          className="h-9 bg-background"
                        />
                      </div>
                      <Button
                        type="button"
                        className="h-9 w-full"
                        onClick={() => setValuePopoverBenefitId(null)}
                      >
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBenefit(benefit.id)}
                  disabled={disabled}
                  className="h-8 w-8 shrink-0 p-0 hover:bg-destructive/10 hover:text-destructive"
                  title="Remove benefit"
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
