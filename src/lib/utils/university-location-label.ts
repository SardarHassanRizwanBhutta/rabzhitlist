/** City — Address; city only when address is empty. */
export function formatUniversityLocationLabel(
  city: string | null | undefined,
  address?: string | null,
): string {
  const c = city?.trim() ?? ""
  const a = address?.trim() ?? ""
  if (!c) return a
  if (!a) return c
  return `${c} — ${a}`
}
