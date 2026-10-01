"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useEmployerSearch } from "@/hooks/useEmployerSearch"
import { fetchEmployerById, type EmployerLookupDto } from "@/lib/services/employers-api"

/** Applied from the Mentors Filters dialog. The page search box is separate. */
export interface MentorFilters {
  /** Case-insensitive substring on mentor name. Sent as `filterName`. */
  name: string
  /** Employer ids. A mentor matches when `employerId` is any of these. */
  employerIds: string[]
  /** Case-insensitive substring on designation. Sent as `designation`. */
  designation: string
}

export const emptyMentorFilters: MentorFilters = {
  name: "",
  employerIds: [],
  designation: "",
}

interface MentorsFilterDialogProps {
  filters: MentorFilters
  onFiltersChange: (filters: MentorFilters) => void
  onClearFilters: () => void
}

function countFilters(filters: MentorFilters): number {
  return (
    (filters.name.trim() ? 1 : 0) +
    filters.employerIds.length +
    (filters.designation.trim() ? 1 : 0)
  )
}

export function MentorsFilterDialog({
  filters,
  onFiltersChange,
  onClearFilters,
}: MentorsFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<MentorFilters>(filters)
  const [organizationOpen, setOrganizationOpen] = useState(false)
  const [employerNameById, setEmployerNameById] = useState<Record<string, string>>({})
  const employerNameByIdRef = useRef(employerNameById)
  employerNameByIdRef.current = employerNameById
  const {
    query: employerSearchQuery,
    setQuery: setEmployerSearchQuery,
    results: employerSearchResults,
    loading: employerSearchLoading,
    resetSearch: resetEmployerSearch,
  } = useEmployerSearch()

  const activeFilterCount = useMemo(() => countFilters(tempFilters), [tempFilters])
  const hasAnyTempFilters = activeFilterCount > 0

  useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  useEffect(() => {
    const missing = tempFilters.employerIds.filter(
      (id) => /^\d+$/.test(id) && !employerNameByIdRef.current[id],
    )
    if (missing.length === 0) return
    let cancelled = false
    void Promise.all(
      missing.map((id) =>
        fetchEmployerById(Number(id))
          .then((dto) => ({ id: String(dto.id), name: dto.name }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return
      setEmployerNameById((prev) => {
        const next = { ...prev }
        for (const row of results) {
          if (row) next[row.id] = row.name
        }
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [tempFilters.employerIds])

  const toggleEmployer = (employer: EmployerLookupDto) => {
    const id = String(employer.id)
    setEmployerNameById((prev) => ({ ...prev, [id]: employer.name }))
    setTempFilters((prev) => {
      const selected = prev.employerIds.includes(id)
      return {
        ...prev,
        employerIds: selected
          ? prev.employerIds.filter((value) => value !== id)
          : [...prev.employerIds, id],
      }
    })
  }

  const removeEmployer = (id: string) => {
    setTempFilters((prev) => ({
      ...prev,
      employerIds: prev.employerIds.filter((value) => value !== id),
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange({
      name: tempFilters.name.trim(),
      employerIds: tempFilters.employerIds,
      designation: tempFilters.designation.trim(),
    })
    setEmployerSearchQuery("")
    resetEmployerSearch()
    setOrganizationOpen(false)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setEmployerSearchQuery("")
    resetEmployerSearch()
    setOrganizationOpen(false)
    setTempFilters(emptyMentorFilters)
    onClearFilters()
  }

  const resetDraft = () => {
    setTempFilters(filters)
    setEmployerSearchQuery("")
    resetEmployerSearch()
    setOrganizationOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetDraft()
  }

  const handleCancel = () => {
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 cursor-pointer">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Mentors
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="mentor-filter-name" className="text-sm font-semibold">
                Name
              </Label>
              <Input
                id="mentor-filter-name"
                value={tempFilters.name}
                placeholder="Filter by name..."
                onChange={(event) =>
                  setTempFilters((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Organization</Label>
              <Popover open={organizationOpen} onOpenChange={setOrganizationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-10 w-full justify-between px-3 py-2 font-normal cursor-pointer"
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                      {tempFilters.employerIds.length === 0 && (
                        <span className="text-muted-foreground">Filter by organization...</span>
                      )}
                      {tempFilters.employerIds.slice(0, 3).map((id) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="max-w-full shrink gap-0 pr-0.5 font-normal hover:bg-secondary/80 flex items-center"
                        >
                          <span className="truncate max-w-[min(12rem,100%)] py-0.5 pl-1.5">
                            {employerNameById[id] ?? `Employer #${id}`}
                          </span>
                          <span
                            className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm"
                            role="button"
                            tabIndex={0}
                            aria-label={`Remove ${employerNameById[id] ?? id}`}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                event.stopPropagation()
                                removeEmployer(id)
                              }
                            }}
                            onMouseDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                            }}
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              removeEmployer(id)
                            }}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </span>
                        </Badge>
                      ))}
                      {tempFilters.employerIds.length > 3 && (
                        <Badge variant="secondary" className="font-normal">
                          +{tempFilters.employerIds.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <ChevronsUpDown className="mt-1 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Filter by organization..."
                      value={employerSearchQuery}
                      onValueChange={setEmployerSearchQuery}
                      className="h-9"
                    />
                    <CommandList>
                      {employerSearchLoading && (
                        <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
                      )}
                      {!employerSearchLoading && employerSearchQuery.trim().length < 2 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
                      )}
                      {!employerSearchLoading &&
                        employerSearchQuery.trim().length >= 2 &&
                        employerSearchResults.length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No employers found
                          </div>
                        )}
                      {!employerSearchLoading && employerSearchResults.length > 0 && (
                        <CommandGroup>
                          {employerSearchResults.map((employer) => {
                            const id = String(employer.id)
                            const selected = tempFilters.employerIds.includes(id)
                            return (
                              <CommandItem
                                key={employer.id}
                                value={id}
                                onSelect={() => toggleEmployer(employer)}
                                className="cursor-pointer"
                              >
                                {employer.name}
                                {selected ? <Check className="ml-auto h-4 w-4 opacity-100" /> : null}
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
            <div className="space-y-3">
              <Label htmlFor="mentor-filter-designation" className="text-sm font-semibold">
                Designation
              </Label>
              <Input
                id="mentor-filter-designation"
                value={tempFilters.designation}
                placeholder="Filter by designation..."
                onChange={(event) =>
                  setTempFilters((prev) => ({ ...prev, designation: event.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <div className="flex w-full gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} className="cursor-pointer">
              Cancel
            </Button>
            {hasAnyTempFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear All
              </Button>
            )}
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="ml-auto transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
