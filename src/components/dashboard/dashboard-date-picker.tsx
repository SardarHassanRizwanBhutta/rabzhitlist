"use client"

import * as React from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  formatSelectionRangeButtonLabel,
  getSelectionBounds,
  isoToLocalDate,
  MAX_DASHBOARD_CUSTOM_RANGE_DAYS,
  countInclusiveCalendarDays,
} from "@/lib/utils/dashboard-metrics"
import type { DashboardDateSelection } from "@/types/dashboard"

interface DashboardDatePickerProps {
  selection: DashboardDateSelection
  onSelectionChange: (selection: DashboardDateSelection) => void
  className?: string
}

export function DashboardDatePicker({
  selection,
  onSelectionChange,
  className,
}: DashboardDatePickerProps) {
  const today = React.useMemo(() => new Date(), [])
  const [open, setOpen] = React.useState(false)
  const [rangeError, setRangeError] = React.useState<string | null>(null)
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>()

  const appliedBounds = React.useMemo(
    () => getSelectionBounds(selection, today),
    [selection, today],
  )

  const buttonLabel = formatSelectionRangeButtonLabel(selection, today)

  const calendarSelected = React.useMemo<DateRange>(() => {
    if (pendingRange?.from) {
      return pendingRange
    }
    return {
      from: isoToLocalDate(appliedBounds.from),
      to: isoToLocalDate(appliedBounds.to),
    }
  }, [appliedBounds.from, appliedBounds.to, pendingRange])

  const defaultMonth = calendarSelected.to ?? calendarSelected.from ?? today

  const handleRangeSelect = (range: DateRange | undefined) => {
    setRangeError(null)
    if (!range?.from) {
      setPendingRange(undefined)
      return
    }

    setPendingRange(range)

    if (!range.to) {
      return
    }

    const from = format(range.from, "yyyy-MM-dd")
    const to = format(range.to, "yyyy-MM-dd")
    const orderedFrom = from <= to ? from : to
    const orderedTo = from <= to ? to : from
    const dayCount = countInclusiveCalendarDays(orderedFrom, orderedTo)

    if (dayCount > MAX_DASHBOARD_CUSTOM_RANGE_DAYS) {
      setRangeError(`Maximum range is ${MAX_DASHBOARD_CUSTOM_RANGE_DAYS} days.`)
      return
    }

    onSelectionChange({ mode: "range", from: orderedFrom, to: orderedTo })
    setPendingRange(undefined)
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setPendingRange(undefined)
      setRangeError(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("justify-start font-normal min-w-[10.5rem]", className)}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" aria-hidden />
          <span className="truncate">{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={calendarSelected}
          defaultMonth={defaultMonth}
          onSelect={handleRangeSelect}
          disabled={{ after: today }}
          numberOfMonths={1}
        />
        {rangeError && (
          <p className="px-3 pb-3 text-xs text-destructive">{rangeError}</p>
        )}
        {!rangeError && pendingRange?.from && !pendingRange.to && (
          <p className="px-3 pb-3 text-xs text-muted-foreground">
            Select end date (same day for a single day).
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
