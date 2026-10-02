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
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { useProjectSearch } from "@/hooks/useProjectSearch"
import { fetchProjectById, type ProjectLookupDto } from "@/lib/services/projects-lookup-api"

/** Applied from the Modules Filters dialog. */
export interface ModuleFilters {
  /** Case-insensitive substring on module name. Sent as `name`. */
  name: string
  /** Main project ids. A module matches when it belongs to any of these. */
  projectIds: string[]
  /** Tech stack catalog ids. A module matches when it has any of these. */
  techStackIds: string[]
}

export const emptyModuleFilters: ModuleFilters = {
  name: "",
  projectIds: [],
  techStackIds: [],
}

interface ModulesFilterDialogProps {
  filters: ModuleFilters
  techStackOptions: MultiSelectOption[]
  onFiltersChange: (filters: ModuleFilters) => void
  onClearFilters: () => void
}

function countFilters(filters: ModuleFilters): number {
  return (
    (filters.name.trim() ? 1 : 0) +
    filters.projectIds.length +
    filters.techStackIds.length
  )
}

export function ModulesFilterDialog({
  filters,
  techStackOptions,
  onFiltersChange,
  onClearFilters,
}: ModulesFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<ModuleFilters>(filters)
  const [projectOpen, setProjectOpen] = useState(false)
  const [projectNameById, setProjectNameById] = useState<Record<string, string>>({})
  const projectNameByIdRef = useRef(projectNameById)
  projectNameByIdRef.current = projectNameById
  const {
    query: projectSearchQuery,
    setQuery: setProjectSearchQuery,
    results: projectSearchResults,
    isLoading: projectSearchLoading,
    resetSearch: resetProjectSearch,
  } = useProjectSearch()

  const activeFilterCount = useMemo(() => countFilters(filters), [filters])
  const hasAnyTempFilters = countFilters(tempFilters) > 0

  useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  useEffect(() => {
    const missing = tempFilters.projectIds.filter(
      (id) => /^\d+$/.test(id) && !projectNameByIdRef.current[id],
    )
    if (missing.length === 0) return
    let cancelled = false
    void Promise.all(
      missing.map((id) =>
        fetchProjectById(Number(id))
          .then((dto) => ({ id: String(dto.id), name: dto.name }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return
      setProjectNameById((prev) => {
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
  }, [tempFilters.projectIds])

  const toggleProject = (project: ProjectLookupDto) => {
    const id = String(project.id)
    setProjectNameById((prev) => ({ ...prev, [id]: project.name }))
    setTempFilters((prev) => {
      const selected = prev.projectIds.includes(id)
      return {
        ...prev,
        projectIds: selected ? prev.projectIds.filter((value) => value !== id) : [...prev.projectIds, id],
      }
    })
  }

  const removeProject = (id: string) => {
    setTempFilters((prev) => ({
      ...prev,
      projectIds: prev.projectIds.filter((value) => value !== id),
    }))
  }

  const resetDraft = () => {
    setTempFilters(filters)
    setProjectSearchQuery("")
    resetProjectSearch()
    setProjectOpen(false)
  }

  const handleApplyFilters = () => {
    onFiltersChange({
      name: tempFilters.name.trim(),
      projectIds: tempFilters.projectIds,
      techStackIds: tempFilters.techStackIds,
    })
    setProjectSearchQuery("")
    resetProjectSearch()
    setProjectOpen(false)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setProjectSearchQuery("")
    resetProjectSearch()
    setProjectOpen(false)
    setTempFilters(emptyModuleFilters)
    onClearFilters()
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetDraft()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex cursor-pointer items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-[560px] [&>button]:cursor-pointer">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Modules
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="module-filter-name" className="text-sm font-semibold">
                Name
              </Label>
              <Input
                id="module-filter-name"
                value={tempFilters.name}
                placeholder="Filter by name..."
                onChange={(event) => setTempFilters((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Main project</Label>
              <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-10 w-full cursor-pointer justify-between px-3 py-2 font-normal"
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                      {tempFilters.projectIds.length === 0 && (
                        <span className="text-muted-foreground">Filter by main project...</span>
                      )}
                      {tempFilters.projectIds.slice(0, 3).map((id) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="flex max-w-full shrink items-center gap-0 pr-0.5 font-normal hover:bg-secondary/80"
                        >
                          <span className="max-w-[min(12rem,100%)] truncate py-0.5 pl-1.5">
                            {projectNameById[id] ?? `Project #${id}`}
                          </span>
                          <span
                            className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm"
                            role="button"
                            tabIndex={0}
                            aria-label={`Remove ${projectNameById[id] ?? id}`}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                event.stopPropagation()
                                removeProject(id)
                              }
                            }}
                            onMouseDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                            }}
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              removeProject(id)
                            }}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </span>
                        </Badge>
                      ))}
                      {tempFilters.projectIds.length > 3 && (
                        <Badge variant="secondary" className="font-normal">
                          +{tempFilters.projectIds.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <ChevronsUpDown className="mt-1 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Filter by main project..."
                      value={projectSearchQuery}
                      onValueChange={setProjectSearchQuery}
                      className="h-9"
                    />
                    <CommandList>
                      {projectSearchLoading && (
                        <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
                      )}
                      {!projectSearchLoading && projectSearchQuery.trim().length < 2 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
                      )}
                      {!projectSearchLoading &&
                        projectSearchQuery.trim().length >= 2 &&
                        projectSearchResults.length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">No projects found</div>
                        )}
                      {!projectSearchLoading && projectSearchResults.length > 0 && (
                        <CommandGroup>
                          {projectSearchResults.map((project) => {
                            const id = String(project.id)
                            const selected = tempFilters.projectIds.includes(id)
                            return (
                              <CommandItem
                                key={project.id}
                                value={id}
                                onSelect={() => toggleProject(project)}
                                className="cursor-pointer"
                              >
                                {project.name}
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
            <MultiSelect
              label="Tech Stacks"
              items={techStackOptions}
              selected={tempFilters.techStackIds}
              placeholder="Filter by tech stacks..."
              searchPlaceholder="Search technologies..."
              onChange={(techStackIds) => setTempFilters((prev) => ({ ...prev, techStackIds }))}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-border px-6 py-4">
          <div className="flex w-full gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="cursor-pointer">
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
              className="ml-auto cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
