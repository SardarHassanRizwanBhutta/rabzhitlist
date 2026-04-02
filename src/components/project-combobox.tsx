"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { useProjectSearch } from "@/hooks/useProjectSearch"

export type SelectedProject = { id: number; name: string } | null

export interface ProjectComboboxProps {
  id?: string
  label?: string
  value: SelectedProject
  onChange: (project: SelectedProject) => void
  disabled?: boolean
  className?: string
  error?: boolean
}

export function ProjectCombobox({
  id,
  label = "Project",
  value,
  onChange,
  disabled = false,
  className,
  error = false,
}: ProjectComboboxProps) {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, isLoading, resetSearch } = useProjectSearch()

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      resetSearch()
    }
  }

  const clearSelection = () => {
    onChange(null)
    resetSearch()
  }

  const selectProject = (proj: { id: number; name: string }) => {
    onChange({ id: proj.id, name: proj.name })
    handleOpenChange(false)
  }

  const openProjectsPage = () => {
    window.open("/projects", "_blank", "noopener,noreferrer")
  }

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}
      {value ? (
        <div
          className={`flex items-center gap-1 border rounded-md bg-background px-3 py-2 min-h-9 ${error ? "border-red-500" : ""}`}
        >
          <span className="flex-1 truncate">{value.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            disabled={disabled}
            onClick={clearSelection}
            aria-label="Clear project"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              disabled={disabled}
              className={`w-full justify-between font-normal ${error ? "border-red-500" : ""}`}
            >
              <span className={query ? "text-foreground" : "text-muted-foreground"}>
                {query || "Search projects..."}
              </span>
              <ChevronsUpDown className="opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search projects..."
                value={query}
                onValueChange={setQuery}
                className="h-9"
              />
              <CommandList>
                {isLoading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                )}
                {!isLoading && query.trim().length < 2 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
                )}
                {!isLoading && query.trim().length >= 2 && results.length === 0 && (
                  <CommandGroup>
                    <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                      No projects found
                    </div>
                    <CommandItem
                      value="__create_new_project__"
                      onSelect={() => {
                        openProjectsPage()
                      }}
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      + Create New Project
                    </CommandItem>
                  </CommandGroup>
                )}
                {!isLoading && results.length > 0 && (
                  <CommandGroup>
                    {results.map((proj) => (
                      <CommandItem
                        key={proj.id}
                        value={String(proj.id)}
                        onSelect={() => selectProject(proj)}
                        className="cursor-pointer"
                      >
                        {proj.name}
                        <Check className="ml-auto opacity-100" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
