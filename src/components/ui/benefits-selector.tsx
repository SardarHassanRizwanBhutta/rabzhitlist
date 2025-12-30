"use client"

import * as React from "react"
import { useState } from "react"
import { X, Plus, Check, ChevronsUpDown, DollarSign, Calendar } from "lucide-react"
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
  CommandSeparator,
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
import { 
  PREDEFINED_BENEFITS, 
  benefitRequiresAmount, 
  getBenefitDefaultUnit,
  generateBenefitId,
  UNIT_LABELS 
} from "@/lib/sample-data/benefits"

interface BenefitsSelectorProps {
  benefits: EmployerBenefit[]
  onChange: (benefits: EmployerBenefit[]) => void
  disabled?: boolean
  className?: string
}

export function BenefitsSelector({
  benefits,
  onChange,
  disabled = false,
  className,
}: BenefitsSelectorProps) {
  const [open, setOpen] = useState(false)
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [customBenefitName, setCustomBenefitName] = useState("")
  const [customHasAmount, setCustomHasAmount] = useState(false)
  const [customAmount, setCustomAmount] = useState("")
  const [customUnit, setCustomUnit] = useState<BenefitUnit>("PKR")

  // Get selected benefit names
  const selectedNames = benefits.map(b => b.name)

  // Get icon for benefit based on unit type
  const getBenefitIcon = (benefitName: string) => {
    const template = PREDEFINED_BENEFITS.find(b => b.name === benefitName)
    if (!template?.hasAmount) return null
    
    if (template.defaultUnit === "days") {
      return <Calendar className="h-3 w-3 text-muted-foreground ml-auto" />
    }
    return <DollarSign className="h-3 w-3 text-muted-foreground ml-auto" />
  }

  // Toggle a predefined benefit
  const toggleBenefit = (benefitName: string) => {
    const isSelected = selectedNames.includes(benefitName)
    
    if (isSelected) {
      // Remove benefit
      onChange(benefits.filter(b => b.name !== benefitName))
    } else {
      // Add benefit
      const hasAmount = benefitRequiresAmount(benefitName)
      const defaultUnit = getBenefitDefaultUnit(benefitName)
      const newBenefit: EmployerBenefit = {
        id: generateBenefitId(),
        name: benefitName,
        amount: hasAmount ? 0 : null,
        unit: hasAmount ? defaultUnit : null,
      }
      onChange([...benefits, newBenefit])
    }
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

  // Add custom benefit
  const handleAddCustomBenefit = () => {
    if (!customBenefitName.trim()) return

    const newBenefit: EmployerBenefit = {
      id: generateBenefitId(),
      name: customBenefitName.trim(),
      amount: customHasAmount ? (parseInt(customAmount) || 0) : null,
      unit: customHasAmount ? customUnit : null,
    }
    
    onChange([...benefits, newBenefit])
    
    // Reset form
    setCustomBenefitName("")
    setCustomHasAmount(false)
    setCustomAmount("")
    setCustomUnit("PKR")
    setCustomDialogOpen(false)
  }

  // Get unit label for display
  const getUnitLabel = (unit: BenefitUnit | null): string => {
    if (!unit) return ""
    return UNIT_LABELS[unit]
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">Benefits</Label>
      
      {/* Benefit Selector Dropdown */}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
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
            <Command>
              <CommandInput placeholder="Search benefits..." />
              <CommandList>
                <CommandEmpty>No benefit found.</CommandEmpty>
                <CommandGroup>
                  {PREDEFINED_BENEFITS.map((benefit) => {
                    const isSelected = selectedNames.includes(benefit.name)
                    return (
                      <CommandItem
                        key={benefit.name}
                        value={benefit.name}
                        onSelect={() => toggleBenefit(benefit.name)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{benefit.name}</span>
                          {benefit.hasAmount && benefit.defaultUnit && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              ({benefit.defaultUnit === "days" ? "days" : benefit.defaultUnit === "count" ? "count" : benefit.defaultUnit === "percent" ? "%" : "PKR"})
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setCustomDialogOpen(true)
                    }}
                    className="cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Benefit
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Benefits Display */}
      {benefits.length > 0 && (
        <div className="space-y-2">
          {benefits.map((benefit) => {
            const template = PREDEFINED_BENEFITS.find(b => b.name === benefit.name)
            const requiresAmount = template?.hasAmount ?? (benefit.amount !== null)
            const currentUnit = benefit.unit || template?.defaultUnit || "PKR"
            
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
              onClick={() => setCustomDialogOpen(false)}
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
    </div>
  )
}
