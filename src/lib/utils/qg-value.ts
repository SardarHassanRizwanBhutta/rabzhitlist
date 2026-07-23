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
