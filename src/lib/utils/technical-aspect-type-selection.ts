/** Deduped sorted union of stack names selected under the given aspect type id strings. */
export function mergeStacksFromAspectSelections(
  typeIds: readonly string[],
  byAspect: Readonly<Record<string, readonly string[]>>
): string[] {
  const set = new Set<string>()
  for (const id of typeIds) {
    const list = byAspect[id]
    if (!list) continue
    for (const name of list) {
      if (name) set.add(name)
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
