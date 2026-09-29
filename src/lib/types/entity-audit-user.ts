/** User snapshot on a parent detail's `createdBy` / `updatedBy`. */
export type EntityAuditUser = {
  id: number
  fullName: string
  email: string
}

/** `null` when the API value is null, missing, or has no display name. */
export function mapEntityAuditUser(value: unknown): EntityAuditUser | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const idValue = raw.id
  const id =
    typeof idValue === "number"
      ? idValue
      : typeof idValue === "string" && idValue.trim()
        ? Number(idValue)
        : NaN
  const fullName = typeof raw.fullName === "string" ? raw.fullName.trim() : ""
  const email = typeof raw.email === "string" ? raw.email : ""
  if (!Number.isInteger(id) || id <= 0 || !fullName) return null
  return { id, fullName, email }
}
