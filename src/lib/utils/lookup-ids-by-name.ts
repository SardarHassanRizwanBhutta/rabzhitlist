import type { LookupItem } from "@/lib/services/lookups-api"

function findLookupByName(lookup: LookupItem[], name: string): LookupItem | undefined {
  const lower = name.trim().toLowerCase()
  if (!lower) return undefined
  return lookup.find((item) => item.name.toLowerCase() === lower)
}

/**
 * Map display names to lookup ids. Creates missing rows via `createMissing`
 * (exact spoken name, e.g. "USA") and uses the returned item's id.
 */
export async function resolveLookupIdsByName(
  names: string[],
  lookup: LookupItem[],
  createMissing?: (name: string) => Promise<LookupItem | void>,
): Promise<number[]> {
  const merged = [...lookup]
  const ids: number[] = []

  for (const raw of names) {
    const name = raw.trim()
    if (!name) continue

    let item = findLookupByName(merged, name)
    if (!item && createMissing) {
      const created = await createMissing(name)
      if (created && typeof created.id === "number") {
        merged.push(created)
        item = created
      } else {
        item = findLookupByName(merged, name)
      }
    }
    if (item) ids.push(item.id)
  }

  return ids
}
