"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  items: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  label?: string
  searchPlaceholder?: string
  emptyMessage?: string
  maxDisplay?: number
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  items,
  selected,
  onChange,
  placeholder = "Select items...",
  label,
  searchPlaceholder = "Search items...",
  emptyMessage = "No items found.",
  maxDisplay = 3,
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Handle wheel events to enable scrolling in dropdown
  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
  }, [])

  const selectedOptions = React.useMemo(
    () => items.filter((item) => selected.includes(item.value)),
    [items, selected]
  )

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    const input = e.target as HTMLInputElement
    if (input.value === "" && selected.length > 0) {
      if (e.key === "Delete" || e.key === "Backspace") {
        onChange(selected.slice(0, -1))
      }
    }
    // Escape closes the combobox
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-auto min-h-[2.5rem] px-3 py-2",
              className
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1 mr-2">
              {selectedOptions.length === 0 && (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              {selectedOptions.slice(0, maxDisplay).map((option) => (
                <Badge
                  variant="secondary"
                  key={option.value}
                  className="mr-1 mb-1 hover:bg-secondary/80 flex items-center"
                >
                  {option.label}
                  <span
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        e.stopPropagation()
                        handleUnselect(option.value)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(option.value)
                    }}
                    aria-label={`Remove ${option.label}`}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))}
              {selectedOptions.length > maxDisplay && (
                <Badge variant="secondary" className="mr-1 mb-1">
                  +{selectedOptions.length - maxDisplay} more
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0" 
          align="start"
          onWheel={handleWheel}
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9"
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const isSelected = selected.includes(item.value)
                  return (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item.value)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
