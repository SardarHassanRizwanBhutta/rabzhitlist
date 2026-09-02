"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEmployerOfficeLocations } from "@/hooks/useEmployerOfficeLocations"
import { cn } from "@/lib/utils"

interface WorkExperienceOfficeLocationSelectProps {
  employerId: number | null
  value: number | null
  onChange: (locationId: number | null) => void
  disabled?: boolean
  id?: string
}

export function WorkExperienceOfficeLocationSelect({
  employerId,
  value,
  onChange,
  disabled,
  id = "office-location",
}: WorkExperienceOfficeLocationSelectProps) {
  const { locations, loading } = useEmployerOfficeLocations(employerId)
  const hasEmployer = employerId != null && employerId > 0
  const selectedValue = value != null && value > 0 ? String(value) : ""
  const selectedLabel = locations.find((loc) => String(loc.id) === selectedValue)?.label
  const comboboxDisabled = disabled || !hasEmployer || loading

  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const filteredLocations = React.useMemo(() => {
    if (!searchValue.trim()) return locations
    const searchLower = searchValue.toLowerCase()
    return locations.filter(
      (loc) =>
        loc.label.toLowerCase().includes(searchLower) || String(loc.id).includes(searchLower),
    )
  }, [locations, searchValue])

  const triggerText = selectedLabel
    ? selectedLabel
    : !hasEmployer
      ? "Select an employer first"
      : loading
        ? "Loading locations..."
        : "Select office location"

  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>Office Location</Label>
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) setSearchValue("")
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-9 w-full min-w-0 max-w-full shrink justify-between overflow-hidden font-normal"
            disabled={comboboxDisabled}
            title={selectedLabel ?? undefined}
          >
            <span className="min-w-0 flex-1 truncate text-left">{triggerText}</span>
            <ChevronsUpDown className="shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search locations..."
              className="h-9"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {filteredLocations.length === 0 ? (
                <CommandEmpty>
                  {loading ? "Loading locations..." : "No locations"}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredLocations.map((loc) => {
                    const locValue = String(loc.id)
                    return (
                      <CommandItem
                        key={loc.id}
                        value={locValue}
                        onSelect={() => {
                          onChange(locValue === selectedValue ? null : loc.id)
                          setOpen(false)
                          setSearchValue("")
                        }}
                        className="cursor-pointer"
                      >
                        {loc.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            selectedValue === locValue ? "opacity-100" : "opacity-0",
                          )}
                        />
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
