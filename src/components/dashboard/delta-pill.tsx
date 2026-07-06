import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeltaPillProps {
  value: number
  /** Suffix after the number, e.g. "%" or "" for percentage points. */
  suffix?: string
  /** Decimal places. */
  precision?: number
  /** Native tooltip text. */
  title?: string
}

/** Tinted up/down/flat trend badge. */
export function DeltaPill({
  value,
  suffix = "",
  precision = 1,
  title,
}: DeltaPillProps) {
  if (value === 0) {
    return (
      <span
        title={title}
        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
      >
        <Minus className="size-3" aria-hidden />
        {(0).toFixed(precision)}
        {suffix}
      </span>
    )
  }

  const positive = value > 0
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        positive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      )}
    >
      {positive ? (
        <ArrowUpRight className="size-3" aria-hidden />
      ) : (
        <ArrowDownRight className="size-3" aria-hidden />
      )}
      {positive ? "+" : ""}
      {value.toFixed(precision)}
      {suffix}
    </span>
  )
}
