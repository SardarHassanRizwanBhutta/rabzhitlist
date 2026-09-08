"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, MapPin, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import {
  buildCreateEmployerLocationDtoFromFormRow,
  clearEmployerHeadquarters,
  createEmployerLocation,
} from "@/lib/services/employers-api"
import type { Country } from "@/lib/types/country"
import { formatUniversityLocationLabel } from "@/lib/utils/university-location-label"
import { cn } from "@/lib/utils"

export interface CreatedEmployerOfficeLocation {
  id: number
  label: string
}

export interface EmployerOfficeLocationCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employerId: number
  countries: Country[]
  countriesLoading?: boolean
  onCreateCountry?: (name: string) => Promise<Country | null>
  /** Prefill city from office-location search text. */
  initialCity?: string
  /** When true, saving with Headquarters checked clears HQ on other employer offices first. */
  hasExistingHeadquarters?: boolean
  onCreated: (location: CreatedEmployerOfficeLocation) => void
}

export function EmployerOfficeLocationCreateDialog({
  open,
  onOpenChange,
  employerId,
  countries,
  countriesLoading = false,
  onCreateCountry,
  initialCity = "",
  hasExistingHeadquarters = false,
  onCreated,
}: EmployerOfficeLocationCreateDialogProps) {
  const [country, setCountry] = React.useState("")
  const [city, setCity] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [isHeadquarters, setIsHeadquarters] = React.useState(false)
  const [countryPopoverOpen, setCountryPopoverOpen] = React.useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = React.useState("")
  const [countryCreateInProgress, setCountryCreateInProgress] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ country?: string; city?: string }>({})

  React.useEffect(() => {
    if (!open) return
    setCountry("")
    setCity(initialCity.trim())
    setAddress("")
    setIsHeadquarters(false)
    setCountrySearchQuery("")
    setCountryPopoverOpen(false)
    setErrors({})
  }, [open, initialCity])

  const filteredCountries = React.useMemo(() => {
    if (!countrySearchQuery.trim()) return countries
    const q = countrySearchQuery.toLowerCase().trim()
    return countries.filter((c) => c.name.toLowerCase().includes(q))
  }, [countries, countrySearchQuery])

  const getCountryId = React.useCallback(
    (countryName: string) => countries.find((c) => c.name === countryName)?.id ?? 0,
    [countries],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { country?: string; city?: string } = {}
    if (!country.trim()) nextErrors.country = "Country is required"
    if (!city.trim()) nextErrors.city = "City is required"
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const body = buildCreateEmployerLocationDtoFromFormRow(
      {
        id: "",
        country: country.trim(),
        city: city.trim(),
        address: address.trim(),
        isHeadquarters,
      },
      getCountryId,
    )
    if (!body) {
      toast.error("Enter a valid country and city.")
      return
    }

    setSubmitting(true)
    try {
      if (isHeadquarters) {
        await clearEmployerHeadquarters(employerId)
      }
      const created = await createEmployerLocation(employerId, body)
      const label = formatUniversityLocationLabel(created.city, created.address)
      toast.success(`Office location "${label}" created.`)
      onCreated({ id: created.id, label })
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create office location.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add office location</DialogTitle>
        </DialogHeader>
        <form id="employer-office-location-create-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Popover
                open={countryPopoverOpen}
                onOpenChange={(isOpen) => {
                  setCountryPopoverOpen(isOpen)
                  if (!isOpen) setCountrySearchQuery("")
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryPopoverOpen}
                    className={cn(
                      "w-full justify-between font-normal",
                      !country && "text-muted-foreground",
                      errors.country && "border-red-500",
                    )}
                  >
                    {country ? (
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {country}
                      </span>
                    ) : (
                      "Select country..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search countries..."
                      value={countrySearchQuery}
                      onValueChange={setCountrySearchQuery}
                    />
                    <CommandList>
                      {countriesLoading ? (
                        <CommandEmpty>
                          <div className="flex items-center justify-center gap-2 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Loading countries...</span>
                          </div>
                        </CommandEmpty>
                      ) : filteredCountries.length === 0 ? (
                        <>
                          <CommandEmpty>
                            {countrySearchQuery.trim() ? "No country found." : "No countries available."}
                          </CommandEmpty>
                          {countrySearchQuery.trim() && onCreateCountry ? (
                            <CommandGroup>
                              <CommandItem
                                value={`add-country-${countrySearchQuery.trim()}`}
                                onSelect={async () => {
                                  const name = countrySearchQuery.trim()
                                  if (!name || countryCreateInProgress) return
                                  setCountryCreateInProgress(true)
                                  try {
                                    const newCountry = await onCreateCountry(name)
                                    if (newCountry) {
                                      setCountry(newCountry.name)
                                      setCountryPopoverOpen(false)
                                      setCountrySearchQuery("")
                                      setErrors((prev) => ({ ...prev, country: undefined }))
                                    }
                                  } finally {
                                    setCountryCreateInProgress(false)
                                  }
                                }}
                                disabled={countryCreateInProgress}
                                className="cursor-pointer font-medium text-primary"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                {countryCreateInProgress
                                  ? "Adding…"
                                  : `Add "${countrySearchQuery.trim()}" as new country`}
                              </CommandItem>
                            </CommandGroup>
                          ) : null}
                        </>
                      ) : (
                        <CommandGroup>
                          {filteredCountries.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={String(c.id)}
                              onSelect={() => {
                                setCountry(c.name)
                                setCountryPopoverOpen(false)
                                setCountrySearchQuery("")
                                setErrors((prev) => ({ ...prev, country: undefined }))
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  country === c.name ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                          {countrySearchQuery.trim() &&
                          onCreateCountry &&
                          !filteredCountries.some(
                            (c) => c.name.toLowerCase() === countrySearchQuery.trim().toLowerCase(),
                          ) ? (
                            <CommandItem
                              value={`add-country-${countrySearchQuery.trim()}`}
                              onSelect={async () => {
                                const name = countrySearchQuery.trim()
                                if (!name || countryCreateInProgress) return
                                setCountryCreateInProgress(true)
                                try {
                                  const newCountry = await onCreateCountry(name)
                                  if (newCountry) {
                                    setCountry(newCountry.name)
                                    setCountryPopoverOpen(false)
                                    setCountrySearchQuery("")
                                    setErrors((prev) => ({ ...prev, country: undefined }))
                                  }
                                } finally {
                                  setCountryCreateInProgress(false)
                                }
                              }}
                              disabled={countryCreateInProgress}
                              className="cursor-pointer font-medium text-primary"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {countryCreateInProgress
                                ? "Adding…"
                                : `Add "${countrySearchQuery.trim()}" as new country`}
                            </CommandItem>
                          ) : null}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.country ? <p className="text-sm text-red-500">{errors.country}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employer-office-location-city">City</Label>
              <Input
                id="employer-office-location-city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  if (errors.city) setErrors((prev) => ({ ...prev, city: undefined }))
                }}
                placeholder="Karachi"
                className={errors.city ? "border-red-500" : ""}
              />
              {errors.city ? <p className="text-sm text-red-500">{errors.city}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer-office-location-address">Address</Label>
            <Input
              id="employer-office-location-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Broadway, Manhattan, NY 10001"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="employer-office-location-is-headquarters"
              checked={isHeadquarters}
              onCheckedChange={setIsHeadquarters}
            />
            <Label htmlFor="employer-office-location-is-headquarters" className="text-sm font-normal">
              Headquarters
            </Label>
          </div>
          {isHeadquarters && hasExistingHeadquarters ? (
            <p className="text-xs text-muted-foreground">
              The current headquarters office will be unset when this location is saved.
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="employer-office-location-create-form" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
