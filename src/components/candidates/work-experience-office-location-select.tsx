"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

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
import {
  EmployerOfficeLocationCreateDialog,
  type CreatedEmployerOfficeLocation,
} from "@/components/candidates/employer-office-location-create-dialog"
import { useEmployerOfficeLocations } from "@/hooks/useEmployerOfficeLocations"
import type { Country } from "@/lib/types/country"
import { cn } from "@/lib/utils"

export interface EmployerOfficeLocationCreateContext {
  countries: Country[]
  countriesLoading?: boolean
  onCreateCountry?: (name: string) => Promise<Country | null>
}

interface WorkExperienceOfficeLocationSelectProps {
  employerId: number | null
  value: number | null
  onChange: (locationId: number | null) => void
  disabled?: boolean
  id?: string
  createContext?: EmployerOfficeLocationCreateContext
}

export function WorkExperienceOfficeLocationSelect({
  employerId,
  value,
  onChange,
  disabled,
  id = "office-location",
  createContext,
}: WorkExperienceOfficeLocationSelectProps) {
  const { locations, loading, refetch } = useEmployerOfficeLocations(employerId)
  const [optimisticCreated, setOptimisticCreated] =
    React.useState<CreatedEmployerOfficeLocation | null>(null)

  React.useEffect(() => {
    setOptimisticCreated(null)
  }, [employerId])

  const locationOptions = React.useMemo(() => {
    if (
      optimisticCreated &&
      !locations.some((loc) => loc.id === optimisticCreated.id)
    ) {
      return [
        ...locations,
        {
          id: optimisticCreated.id,
          employerId: employerId ?? 0,
          city: optimisticCreated.label,
          address: null,
          label: optimisticCreated.label,
          isHeadquarters: false,
        },
      ]
    }
    return locations
  }, [locations, optimisticCreated, employerId])

  const hasEmployer = employerId != null && employerId > 0
  const canCreate = Boolean(createContext && hasEmployer)
  const selectedValue = value != null && value > 0 ? String(value) : ""
  const selectedLabel = locationOptions.find((loc) => String(loc.id) === selectedValue)?.label
  const comboboxDisabled = disabled || !hasEmployer || loading

  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [createDialogInitialCity, setCreateDialogInitialCity] = React.useState("")

  const filteredLocations = React.useMemo(() => {
    if (!searchValue.trim()) return locationOptions
    const searchLower = searchValue.toLowerCase()
    return locationOptions.filter(
      (loc) =>
        loc.label.toLowerCase().includes(searchLower) || String(loc.id).includes(searchLower),
    )
  }, [locationOptions, searchValue])

  const searchHasExactMatch = React.useMemo(() => {
    if (!searchValue.trim()) return false
    const q = searchValue.trim().toLowerCase()
    return locationOptions.some((loc) => loc.label.toLowerCase() === q)
  }, [locationOptions, searchValue])

  const shouldShowSearchCreate =
    canCreate &&
    !loading &&
    searchValue.trim().length >= 2 &&
    filteredLocations.length === 0 &&
    !searchHasExactMatch

  const showEmptyListCreate = canCreate && !loading && locationOptions.length === 0

  const hasExistingHeadquarters = locationOptions.some((loc) => loc.isHeadquarters)

  const openCreateDialog = (initialCity = "") => {
    setCreateDialogInitialCity(initialCity)
    setOpen(false)
    setSearchValue("")
    setCreateDialogOpen(true)
  }

  const handleCreated = (location: CreatedEmployerOfficeLocation) => {
    setOptimisticCreated(location)
    refetch()
    onChange(location.id)
  }

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

              {showEmptyListCreate ? (
                <CommandGroup>
                  <CommandItem
                    value="__add_office_location_empty__"
                    onSelect={() => openCreateDialog()}
                    className="cursor-pointer font-medium text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add office location
                  </CommandItem>
                </CommandGroup>
              ) : null}

              {shouldShowSearchCreate ? (
                <CommandGroup>
                  <CommandItem
                    value={`__add_office_location_${searchValue.trim()}`}
                    onSelect={() => openCreateDialog(searchValue.trim())}
                    className="cursor-pointer font-medium text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {`Add office location "${searchValue.trim()}"`}
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {canCreate && createContext && employerId != null && employerId > 0 ? (
        <EmployerOfficeLocationCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          employerId={employerId}
          countries={createContext.countries}
          countriesLoading={createContext.countriesLoading}
          onCreateCountry={createContext.onCreateCountry}
          initialCity={createDialogInitialCity}
          hasExistingHeadquarters={hasExistingHeadquarters}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  )
}
