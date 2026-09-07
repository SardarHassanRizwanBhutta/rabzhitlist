/** Shared helpers for GET-only `{ id, name }` catalogs (domains, technical aspects, aspect types). */

export type CatalogItem = { id: number; name: string }

export type CatalogSelectOption = { value: string; label: string }

/** Parse list JSON as `{ id, name }` only. Skip rows that do not match that shape. */
export function parseIdNameList(data: unknown): CatalogItem[] {
  if (!Array.isArray(data)) return []
  const items: CatalogItem[] = []
  for (const row of data) {
    if (!row || typeof row !== "object") continue
    const record = row as Record<string, unknown>
    if (typeof record.id !== "number" || !Number.isFinite(record.id)) continue
    if (typeof record.name !== "string") continue
    const name = record.name.trim()
    if (!name) continue
    items.push({ id: record.id, name })
  }
  return items
}

export function catalogToSelectOptions(items: CatalogItem[]): CatalogSelectOption[] {
  return items.map((item) => ({ value: String(item.id), label: item.name }))
}

/** MultiSelect `value` strings → catalog ids for API bodies and query params. */
export function catalogIdStringsToInts(values: string[]): number[] {
  const ids: number[] = []
  const seen = new Set<number>()
  for (const raw of values) {
    const n = Number.parseInt(String(raw).trim(), 10)
    if (!Number.isFinite(n) || seen.has(n)) continue
    seen.add(n)
    ids.push(n)
  }
  return ids
}

export function catalogLabelForValue(
  value: string,
  options: ReadonlyArray<CatalogSelectOption>,
): string {
  return options.find((option) => option.value === value)?.label ?? value
}

export function catalogLabelsForValues(
  values: string[],
  options: ReadonlyArray<CatalogSelectOption>,
): string[] {
  return values.map((value) => catalogLabelForValue(value, options))
}

export function catalogNameById(items: CatalogItem[], id: number): string {
  return items.find((item) => item.id === id)?.name ?? String(id)
}

export function catalogNamesForIds(ids: number[] | undefined, items: CatalogItem[]): string[] {
  if (!ids?.length) return []
  const byId = new Map(items.map((item) => [item.id, item.name]))
  return ids.map((id) => byId.get(id) ?? String(id)).filter((name) => name.trim() !== "")
}
