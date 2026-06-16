"use client"

import { cn } from "@/lib/utils"
import type { ColdCallerViewMode } from "@/types/cold-caller"

interface ColdCallerViewSwitcherProps {
  value: ColdCallerViewMode
  onChange: (mode: ColdCallerViewMode) => void
  className?: string
}

const OPTIONS: { value: ColdCallerViewMode; label: string }[] = [
  { value: "fields", label: "Fields View" },
  { value: "callNotes", label: "Call Notes View" },
]

export function ColdCallerViewSwitcher({
  value,
  onChange,
  className,
}: ColdCallerViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Cold Caller view"
      className={cn(
        "inline-flex rounded-lg border border-border bg-muted/40 p-0.5",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
