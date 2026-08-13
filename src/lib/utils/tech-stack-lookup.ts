/**
 * Tech stack catalog helpers — usage-based ordering for multi-select dropdowns.
 * Backend: GET /api/TechStacks returns { id, name, usageCount }.
 */

import type { LookupItem } from "@/lib/services/lookups-api"
import type { MultiSelectOption } from "@/components/ui/multi-select"

/** Combined usage across candidates, work experiences, and projects. */
export interface TechStackLookupItem extends LookupItem {
  usageCount?: number
}

function normalizeUsageCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value)
  if (typeof value === "string") {
    const n = Number(value.trim())
    if (Number.isFinite(n)) return Math.max(0, n)
  }
  return 0
}

export function normalizeTechStackLookupItem(raw: unknown): TechStackLookupItem | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const id = row.id
  const name = row.name
  if (typeof id !== "number" || !Number.isFinite(id)) return null
  if (typeof name !== "string" || !name.trim()) return null
  return {
    id,
    name: name.trim(),
    usageCount: normalizeUsageCount(row.usageCount),
  }
}

export function normalizeTechStackLookupList(raw: unknown): TechStackLookupItem[] {
  if (!Array.isArray(raw)) return []
  const out: TechStackLookupItem[] = []
  const seen = new Set<number>()
  for (const item of raw) {
    const normalized = normalizeTechStackLookupItem(item)
    if (!normalized || seen.has(normalized.id)) continue
    seen.add(normalized.id)
    out.push(normalized)
  }
  return out
}

/** Sort by usageCount descending, then name A–Z. */
export function compareTechStacksByUsage(
  a: Pick<TechStackLookupItem, "name" | "usageCount">,
  b: Pick<TechStackLookupItem, "name" | "usageCount">,
): number {
  const usageDiff =
    normalizeUsageCount(b.usageCount) - normalizeUsageCount(a.usageCount)
  if (usageDiff !== 0) return usageDiff
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
}

export function sortTechStackLookupItems(
  items: ReadonlyArray<TechStackLookupItem>,
): TechStackLookupItem[] {
  return [...items].sort(compareTechStacksByUsage)
}

export function techStackLookupItemsToMultiSelectOptions(
  items: ReadonlyArray<TechStackLookupItem | LookupItem>,
): MultiSelectOption[] {
  return sortTechStackLookupItems(
    items.map((item) => ({
      id: item.id,
      name: item.name.trim(),
      usageCount: normalizeUsageCount(
        (item as TechStackLookupItem).usageCount,
      ),
    })),
  ).map((item) => ({ value: item.name, label: item.name }))
}

/**
 * Build sorted multi-select options from catalog + extra names (usage 0 when not in catalog).
 */
export function buildTechStackMultiSelectOptions(
  catalog: ReadonlyArray<TechStackLookupItem | LookupItem>,
  extraNames?: Iterable<string>,
): MultiSelectOption[] {
  const usageByKey = new Map<string, number>()
  const optionByKey = new Map<string, MultiSelectOption>()

  for (const item of catalog) {
    const name = item.name?.trim()
    if (!name) continue
    const key = name.toLowerCase()
    usageByKey.set(key, normalizeUsageCount((item as TechStackLookupItem).usageCount))
    optionByKey.set(key, { value: name, label: name })
  }

  for (const raw of extraNames ?? []) {
    const name = raw?.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (optionByKey.has(key)) continue
    usageByKey.set(key, 0)
    optionByKey.set(key, { value: name, label: name })
  }

  return Array.from(optionByKey.values()).sort((a, b) => {
    const ua = usageByKey.get(a.value.toLowerCase()) ?? 0
    const ub = usageByKey.get(b.value.toLowerCase()) ?? 0
    if (ub !== ua) return ub - ua
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  })
}
