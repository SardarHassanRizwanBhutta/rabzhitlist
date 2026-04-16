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
import { useCertificationSearch } from "@/hooks/useCertificationSearch"
import { cn } from "@/lib/utils"

export type SelectedCertification = {
  id: number
  name: string
  issuerName?: string | null
} | null

export interface CertificationComboboxProps {
  id?: string
  label?: string
  value: SelectedCertification
  onChange: (certification: SelectedCertification) => void
  disabled?: boolean
  className?: string
  error?: boolean
  /** Resume import: seed certification search when opening with no linked catalog row yet. */
  parsedNameHint?: string
}

export function CertificationCombobox({
  id,
  label = "Certification",
  value,
  onChange,
  disabled = false,
  className,
  error = false,
  parsedNameHint,
}: CertificationComboboxProps) {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, isLoading, resetSearch } = useCertificationSearch()
  const prevOpenRef = React.useRef(false)

  React.useEffect(() => {
    if (open && !prevOpenRef.current && parsedNameHint?.trim() && !value) {
      setQuery(parsedNameHint.trim())
    }
    prevOpenRef.current = open
  }, [open, parsedNameHint, value, setQuery])

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

  const selectCertification = (c: {
    id: number
    name: string
    issuerName: string | null
  }) => {
    onChange({
      id: c.id,
      name: c.name,
      issuerName: c.issuerName ?? null,
    })
    handleOpenChange(false)
  }

  const openCertificationsPage = () => {
    window.open("/certifications", "_blank", "noopener,noreferrer")
  }

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}
      {value ? (
        <div className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-1 border rounded-md bg-background px-3 py-2 min-h-9",
              error ? "border-red-500" : ""
            )}
          >
            <span className="flex-1 truncate">{value.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={disabled}
              onClick={clearSelection}
              aria-label="Clear certification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {value.issuerName ? (
            <p className="text-sm text-muted-foreground pl-0.5" aria-live="polite">
              {value.issuerName}
            </p>
          ) : null}
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
              className={cn(
                "w-full justify-between font-normal",
                error ? "border-red-500" : ""
              )}
            >
              <span
                className={
                  query || (!value && parsedNameHint?.trim())
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                {query || (!value && parsedNameHint?.trim()) || "Search certifications..."}
              </span>
              <ChevronsUpDown className="opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] min-w-[min(100vw-2rem,24rem)] p-0"
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search certifications..."
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
                      No certifications found
                    </div>
                    <CommandItem
                      value="__create_new_certification__"
                      onSelect={() => {
                        openCertificationsPage()
                      }}
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4 shrink-0" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>+ Create New</span>
                        <span>Certification</span>
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}
                {!isLoading && results.length > 0 && (
                  <CommandGroup>
                    {results.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={String(c.id)}
                        onSelect={() => selectCertification(c)}
                        className="cursor-pointer items-start py-2"
                      >
                        <div className="flex flex-1 flex-col gap-0.5 items-start min-w-0 pr-2">
                          <span className="font-medium leading-tight">{c.name}</span>
                          {c.issuerName ? (
                            <span className="text-xs text-muted-foreground leading-tight">
                              {c.issuerName}
                            </span>
                          ) : null}
                        </div>
                        <Check className="h-4 w-4 shrink-0 opacity-100 mt-0.5" />
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
