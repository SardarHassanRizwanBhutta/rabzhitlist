import { catalogToSelectOptions, type CatalogSelectOption } from "@/lib/utils/domain-catalog"
import { getCachedDomainCatalogs } from "@/lib/services/lookups-api"

export type { CatalogSelectOption }

function tokenizeSpokenMultiselect(value: unknown): string[] {
  const parts = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : typeof value === "string" && value.trim()
      ? [value.trim()]
      : []
  return parts.flatMap((part) =>
    part
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean),
  )
}

function parentheticalAbbreviations(label: string): string[] {
  const matches = label.match(/\(([^)]+)\)/g) ?? []
  return matches.map((group) => group.slice(1, -1).trim()).filter(Boolean)
}

/** Map a spoken token to a catalog option value, or undefined if none uniquely match. */
export function matchCatalogOptionValue(
  raw: string,
  options: CatalogSelectOption[],
): string | undefined {
  const token = raw.trim()
  if (!token || options.length === 0) return undefined
  const lower = token.toLowerCase()

  const exact = options.find(
    (option) => option.value.toLowerCase() === lower || option.label.toLowerCase() === lower,
  )
  if (exact) return exact.value

  const fromAbbrev = options.filter((option) =>
    parentheticalAbbreviations(option.label).some((abbr) => abbr.toLowerCase() === lower),
  )
  if (fromAbbrev.length === 1) return fromAbbrev[0].value

  const fromPrefix = options.filter((option) => {
    const label = option.label.toLowerCase()
    return label.startsWith(`${lower} (`) || label.startsWith(`${lower} /`)
  })
  if (fromPrefix.length === 1) return fromPrefix[0].value

  return undefined
}

/**
 * Map extract/prefill strings onto catalog option values (order preserved, duplicates dropped).
 * Tokens with no catalog match are omitted.
 */
export function mapSpokenValuesToCatalogOptions(
  value: unknown,
  options: CatalogSelectOption[],
): string[] {
  const seen = new Set<string>()
  const mapped: string[] = []
  for (const token of tokenizeSpokenMultiselect(value)) {
    const catalogValue = matchCatalogOptionValue(token, options)
    if (!catalogValue || seen.has(catalogValue)) continue
    seen.add(catalogValue)
    mapped.push(catalogValue)
  }
  return mapped
}

/** Same as `mapSpokenValuesToCatalogOptions`, then resolve each match to the option label. */
export function mapSpokenValuesToCatalogLabels(
  value: unknown,
  options: CatalogSelectOption[],
): string[] {
  const byValue = new Map(options.map((option) => [option.value, option.label]))
  return mapSpokenValuesToCatalogOptions(value, options).map(
    (matched) => byValue.get(matched) ?? matched,
  )
}

export function catalogOptionsForProjectDomainKey(
  payloadKey: string,
): CatalogSelectOption[] | undefined {
  const catalogs = getCachedDomainCatalogs()
  if (payloadKey === "verticalDomains") return catalogToSelectOptions(catalogs.verticalDomains)
  if (payloadKey === "horizontalDomains") return catalogToSelectOptions(catalogs.horizontalDomains)
  if (payloadKey === "technicalDomains") return catalogToSelectOptions(catalogs.technicalDomains)
  if (payloadKey === "technicalAspects") return catalogToSelectOptions(catalogs.technicalAspects)
  return undefined
}

export function getVerticalDomainCatalogOptions(): CatalogSelectOption[] {
  return catalogToSelectOptions(getCachedDomainCatalogs().verticalDomains)
}

export function getHorizontalDomainCatalogOptions(): CatalogSelectOption[] {
  return catalogToSelectOptions(getCachedDomainCatalogs().horizontalDomains)
}

export function getTechnicalDomainCatalogOptions(): CatalogSelectOption[] {
  return catalogToSelectOptions(getCachedDomainCatalogs().technicalDomains)
}

