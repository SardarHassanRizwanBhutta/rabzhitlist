import {
  HORIZONTAL_DOMAINS,
  TECHNICAL_DOMAIN_HUMAN_LABELS,
  VERTICAL_DOMAINS,
} from "@/lib/services/projects-api"

export type CatalogSelectOption = { value: string; label: string }

export const VERTICAL_DOMAIN_CATALOG_OPTIONS: CatalogSelectOption[] = VERTICAL_DOMAINS.map(
  (domain) => ({ value: domain.label, label: domain.label }),
)

export const HORIZONTAL_DOMAIN_CATALOG_OPTIONS: CatalogSelectOption[] = HORIZONTAL_DOMAINS.map(
  (domain) => ({ value: domain.label, label: domain.label }),
)

export const TECHNICAL_DOMAIN_CATALOG_OPTIONS: CatalogSelectOption[] = TECHNICAL_DOMAIN_HUMAN_LABELS.map(
  (label) => ({ value: label, label }),
)

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

export function catalogOptionsForProjectDomainKey(
  payloadKey: string,
): CatalogSelectOption[] | undefined {
  if (payloadKey === "verticalDomains") return VERTICAL_DOMAIN_CATALOG_OPTIONS
  if (payloadKey === "horizontalDomains") return HORIZONTAL_DOMAIN_CATALOG_OPTIONS
  if (payloadKey === "technicalDomains") return TECHNICAL_DOMAIN_CATALOG_OPTIONS
  return undefined
}
