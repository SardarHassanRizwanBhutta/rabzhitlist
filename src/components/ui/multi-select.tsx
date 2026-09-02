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
  CommandSeparator,
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
  /** When "+ Add" is clicked: if provided and returns a Promise, we await it and only add to selected on success. */
  onCreateNew?: (value: string) => void | Promise<void>
  /** Pin selected options to the top of the dropdown list (original order preserved within each group). */
  pinSelectedToTop?: boolean
  /** When `pinSelectedToTop`, heading for selected rows. `{count}` is replaced with selected visible count. */
  selectedGroupHeading?: string
  /** When `pinSelectedToTop`, heading for the remaining options below the separator. */
  remainingGroupHeading?: string
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
  pinSelectedToTop = false,
  selectedGroupHeading = "Selected ({count})",
  remainingGroupHeading = "All options",
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

  const [createInProgress, setCreateInProgress] = React.useState(false)
  const handleCreateNew = React.useCallback(
    async (value: string) => {
      const trimmedValue = value.trim()
      if (!trimmedValue || selected.includes(trimmedValue)) return
      setCreateInProgress(true)
      try {
        if (onCreateNew) await Promise.resolve(onCreateNew(trimmedValue))
        onChange([...selected, trimmedValue])
        setSearchValue("")
        setOpen(false)
      } finally {
        setCreateInProgress(false)
      }
    },
    [selected, onChange, onCreateNew]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Escape closes the combobox
    if (e.key === "Escape") {
      setOpen(false)
      setSearchValue("")
    }
    // Enter key creates new item if creatable and no results
    if (
      creatable &&
      e.key === "Enter" &&
      searchValue.trim() &&
      !items.some(
        (item) =>
          item.value.toLowerCase() === searchValue.trim().toLowerCase() ||
          item.label.toLowerCase() === searchValue.trim().toLowerCase(),
      )
    ) {
      e.preventDefault()
      void handleCreateNew(searchValue)
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

  const { pinnedListItems, unpinnedListItems } = React.useMemo(() => {
    if (!pinSelectedToTop || selected.length === 0) {
      return { pinnedListItems: [] as MultiSelectOption[], unpinnedListItems: filteredItems }
    }

    const selectedSet = new Set(selected)
    const selectedOrder = new Map(selected.map((value, index) => [value, index]))
    const pinned: MultiSelectOption[] = []
    const unpinned: MultiSelectOption[] = []

    for (const item of filteredItems) {
      if (selectedSet.has(item.value)) {
        pinned.push(item)
      } else {
        unpinned.push(item)
      }
    }

    pinned.sort(
      (a, b) =>
        (selectedOrder.get(a.value) ?? Number.MAX_SAFE_INTEGER) -
        (selectedOrder.get(b.value) ?? Number.MAX_SAFE_INTEGER),
    )

    return { pinnedListItems: pinned, unpinnedListItems: unpinned }
  }, [filteredItems, selected, pinSelectedToTop])

  const renderListItem = (item: MultiSelectOption) => {
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
            isSelected ? "opacity-100" : "opacity-0",
          )}
        />
        {item.label}
      </CommandItem>
    )
  }

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
    <div className="min-w-0 space-y-2">
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
              "h-auto min-h-[2.5rem] w-full min-w-0 max-w-full shrink justify-between overflow-hidden px-3 py-2",
              className
            )}
            disabled={disabled}
          >
            <div className="mr-2 flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {selectedOptions.length === 0 && (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              {selectedOptions.slice(0, maxDisplay).map((option) => (
                <Badge
                  variant="secondary"
                  key={option.value}
                  className="flex max-w-full min-w-0 shrink items-center hover:bg-secondary/80"
                  title={option.label}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
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
                    <X className="h-3 w-3 shrink-0 text-muted-foreground hover:text-foreground" />
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
                      onSelect={() => void handleCreateNew(searchValue)}
                      disabled={createInProgress}
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createInProgress ? "Adding…" : (createLabel || `Add "${searchValue.trim()}"`)}
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : filteredItems.length === 0 ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : pinSelectedToTop && pinnedListItems.length > 0 ? (
                <>
                  <CommandGroup
                    heading={selectedGroupHeading.replace(
                      "{count}",
                      String(pinnedListItems.length),
                    )}
                  >
                    {pinnedListItems.map(renderListItem)}
                  </CommandGroup>
                  {unpinnedListItems.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading={remainingGroupHeading}>
                        {unpinnedListItems.map(renderListItem)}
                      </CommandGroup>
                    </>
                  )}
                </>
              ) : (
                <CommandGroup>{filteredItems.map(renderListItem)}</CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
