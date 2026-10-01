"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMentorSearch } from "@/hooks/useMentorSearch"
import type { MentorSearchHit } from "@/lib/types/mentor"
import { cn } from "@/lib/utils"

export function MentorCombobox({
  id,
  value,
  excludeIds = [],
  onChange,
  disabled = false,
  error = false,
}: {
  id?: string
  value: MentorSearchHit | null
  excludeIds?: number[]
  onChange: (mentor: MentorSearchHit | null) => void
  disabled?: boolean
  error?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, loading, resetSearch } = useMentorSearch()
  const visible = results.filter((hit) => !excludeIds.includes(hit.id) || hit.id === value?.id)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetSearch()
  }

  const label = value
    ? [value.name, value.designation, value.employerName].filter(Boolean).join(" · ")
    : ""

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full min-w-0 justify-between overflow-hidden font-normal",
            error && "border-red-500",
          )}
          title={label || undefined}
        >
          <span className={cn("min-w-0 flex-1 truncate text-left", !value && "text-muted-foreground")}>
            {label || "Search mentors..."}
          </span>
          <ChevronsUpDown className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name..."
            value={query}
            onValueChange={setQuery}
            className="h-9"
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
            )}
            {!loading && query.trim().length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">Type at least 2 characters</div>
            )}
            {!loading && query.trim().length >= 2 && visible.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No mentors found</div>
            )}
            {!loading && visible.length > 0 && (
              <CommandGroup>
                {visible.map((hit) => (
                  <CommandItem
                    key={hit.id}
                    value={String(hit.id)}
                    onSelect={() => {
                      onChange(value?.id === hit.id ? null : hit)
                      handleOpenChange(false)
                    }}
                    className="cursor-pointer"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{hit.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[hit.designation, hit.employerName].filter(Boolean).join(" · ") || "No designation"}
                      </span>
                    </span>
                    <Check className={cn("ml-auto", value?.id === hit.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
