"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Plus } from "lucide-react"
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
  creatable?: boolean  // New prop
  createLabel?: string  // New prop - e.g., "Add Technology", "Add Domain"
  onCreateNew?: (value: string) => void  // New prop - callback when creating
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
  creatable = false,  // Default to false for backward compatibility
  createLabel,  // e.g., "Add Technology", "Add Domain"
  onCreateNew,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

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

  const handleCreateNew = (value: string) => {
    const trimmedValue = value.trim()
    if (trimmedValue && !selected.includes(trimmedValue)) {
      // Add the new value to selected
      onChange([...selected, trimmedValue])
      // Call the callback if provided
      onCreateNew?.(trimmedValue)
      // Clear search and close popover
      setSearchValue("")
      setOpen(false)
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
      setSearchValue("")
    }
  // Enter key creates new item if creatable and no results
  if (creatable && e.key === "Enter" && searchValue.trim() && !items.some(item => 
    item.value.toLowerCase() === searchValue.trim().toLowerCase() ||
    item.label.toLowerCase() === searchValue.trim().toLowerCase()
  )) {
    e.preventDefault()
    handleCreateNew(searchValue)
  }
}

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!searchValue.trim()) return items
    const searchLower = searchValue.toLowerCase()
    return items.filter(item => 
      item.label.toLowerCase().includes(searchLower) ||
      item.value.toLowerCase().includes(searchLower)
    )
  }, [items, searchValue])

  // Check if search value already exists
  const searchValueExists = React.useMemo(() => {
    if (!searchValue.trim()) return false
    const searchLower = searchValue.trim().toLowerCase()
    return items.some(item => 
      item.value.toLowerCase() === searchLower ||
      item.label.toLowerCase() === searchLower
    ) || selected.includes(searchValue.trim())
  }, [items, selected, searchValue])

  // Check if we should show "Create" option
  const shouldShowCreate = creatable && 
    searchValue.trim() && 
    !searchValueExists && 
    filteredItems.length === 0

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
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
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9"
              onKeyDown={handleKeyDown}
              value={searchValue}
              onValueChange={setSearchValue}
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
                      onSelect={() => handleCreateNew(searchValue)}
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createLabel || `Add "${searchValue.trim()}"`}
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : filteredItems.length === 0 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredItems.map((item) => {
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
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
