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
import { useEmployerSearch } from "@/hooks/useEmployerSearch"
import {
  buildCreateEmployerDto,
  createEmployer,
  type BuildCreateEmployerDtoOptions,
} from "@/lib/services/employers-api"
import { EmployerCreationDialog, type EmployerFormData } from "@/components/employers/employer-creation-dialog"

export type SelectedEmployer = { id: number; name: string } | null

export interface EmployerComboboxProps {
  id?: string
  label?: string
  value: SelectedEmployer
  onChange: (employer: SelectedEmployer) => void
  disabled?: boolean
  className?: string
  error?: boolean
  /** Lookups for {@link buildCreateEmployerDto} when creating an employer from "+ Add New Employer". */
  createEmployerLookups?: BuildCreateEmployerDtoOptions
}

const defaultCreateLookups: BuildCreateEmployerDtoOptions = {
  techStacksLookup: [],
  tagsLookup: [],
  timeSupportZonesLookup: [],
}

export function EmployerCombobox({
  id,
  label = "Employer",
  value,
  onChange,
  disabled = false,
  className,
  error = false,
  createEmployerLookups = defaultCreateLookups,
}: EmployerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [addEmployerOpen, setAddEmployerOpen] = useState(false)
  const [addEmployerInitialName, setAddEmployerInitialName] = useState("")
  const { query, setQuery, results, loading, resetSearch } = useEmployerSearch()

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

  const selectEmployer = (emp: { id: number; name: string }) => {
    onChange({ id: emp.id, name: emp.name })
    handleOpenChange(false)
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
            aria-label="Clear employer"
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
                {query || "Search employers..."}
              </span>
              <ChevronsUpDown className="opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search employers..."
                value={query}
                onValueChange={setQuery}
                className="h-9"
              />
              <CommandList>
                {loading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                )}
                {!loading && query.trim().length < 2 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
                )}
                {!loading && query.trim().length >= 2 && results.length === 0 && (
                  <CommandGroup>
                    <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                      No employers found
                    </div>
                    <CommandItem
                      value="__add_new_employer__"
                      onSelect={() => {
                        setAddEmployerInitialName(query.trim())
                        handleOpenChange(false)
                        setAddEmployerOpen(true)
                      }}
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Employer
                    </CommandItem>
                  </CommandGroup>
                )}
                {!loading && results.length > 0 && (
                  <CommandGroup>
                    {results.map((emp) => (
                      <CommandItem
                        key={emp.id}
                        value={String(emp.id)}
                        onSelect={() => selectEmployer(emp)}
                        className="cursor-pointer"
                      >
                        {emp.name}
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

      <EmployerCreationDialog
        mode="create"
        open={addEmployerOpen}
        onOpenChange={(next) => {
          setAddEmployerOpen(next)
          if (!next) setAddEmployerInitialName("")
        }}
        initialName={addEmployerInitialName}
        onSubmit={async (formData: EmployerFormData) => {
          const dto = buildCreateEmployerDto(formData, createEmployerLookups)
          const created = await createEmployer(dto)
          return created ? { id: created.id, name: created.name } : undefined
        }}
        onSuccess={(employer) => {
          selectEmployer(employer)
          setAddEmployerOpen(false)
          setAddEmployerInitialName("")
          resetSearch()
        }}
      />
    </div>
  )
}
