/** Shared missing/populated checks and display formatting for Cold Caller QG. */

export function isQgValueMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string" && value.trim() === "") return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function formatQgDisplayValue(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ""
      : new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(value)
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item != null && typeof item === "object" && "name" in item) {
          const row = item as { name?: unknown; amount?: unknown; unit?: unknown }
          const name = row.name != null ? String(row.name) : ""
          if (row.amount == null) return name
          const amount = String(row.amount)
          const unit = row.unit != null ? String(row.unit) : ""
          return [name, amount, unit].filter(Boolean).join(" ")
        }
        return String(item)
      })
      .filter((part) => part.trim() !== "")
      .join(", ")
  }
  if (typeof value === "string") {
    const asDate = /^\d{4}-\d{2}-\d{2}/.test(value) ? new Date(value) : null
    if (asDate && !Number.isNaN(asDate.getTime())) {
      return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(asDate)
    }
    return value
  }
  return String(value)
}

export function formatSalaryDisplayValue(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value)
}

/** Blank → null. Non-whole or negative → null. `0` is valid. */
export function parseOptionalWholeSalary(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0 || !Number.isInteger(raw)) return null
    return raw
  }
  const text = String(raw).trim()
  if (!text) return null
  if (!/^\d+$/.test(text)) return null
  const n = Number(text)
  return Number.isSafeInteger(n) ? n : null
}

export function wholeSalaryFieldError(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  if (parseOptionalWholeSalary(text) == null) return "Enter a whole number."
  return null
}

export function salaryRangeOrderError(minRaw: string, maxRaw: string): string | null {
  const min = parseOptionalWholeSalary(minRaw)
  const max = parseOptionalWholeSalary(maxRaw)
  if (min == null || max == null) return null
  if (min > max) return "Minimum salary must be less than or equal to maximum salary."
  return null
}

/**
 * Overlap of a stored work-experience range with a filter span.
 * A missing stored bound is unbounded on that side.
 */
export function salaryRangesOverlap(
  storedMin: number | null | undefined,
  storedMax: number | null | undefined,
  filterMin: number | null,
  filterMax: number | null,
): boolean {
  if (filterMin == null && filterMax == null) return false
  if (storedMin == null && storedMax == null) return false
  const sMin = storedMin ?? Number.NEGATIVE_INFINITY
  const sMax = storedMax ?? Number.POSITIVE_INFINITY
  const fMin = filterMin ?? Number.NEGATIVE_INFINITY
  const fMax = filterMax ?? Number.POSITIVE_INFINITY
  return sMin <= fMax && sMax >= fMin
}
