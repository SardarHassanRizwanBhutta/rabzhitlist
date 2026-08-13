export interface SourceTextRange {
  start: number
  end: number
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Finds the first occurrence of QG `sourceText` in the notes snapshot.
 * Case-insensitive exact match first; then whitespace-flexible word sequence.
 */
export function findFirstSourceTextRange(
  notes: string,
  sourceText: string,
): SourceTextRange | null {
  const needle = sourceText.trim()
  if (!needle || !notes) return null

  const lowerNotes = notes.toLowerCase()
  const lowerNeedle = needle.toLowerCase()
  const exactIndex = lowerNotes.indexOf(lowerNeedle)
  if (exactIndex !== -1) {
    return { start: exactIndex, end: exactIndex + needle.length }
  }

  const words = needle.split(/\s+/).filter(Boolean)
  if (words.length === 0) return null

  const pattern = words.map(escapeRegExp).join("\\s+")
  const match = new RegExp(pattern, "i").exec(notes)
  if (!match) return null

  return { start: match.index, end: match.index + match[0].length }
}

export interface HighlightSegment {
  text: string
  highlighted: boolean
}

export function buildHighlightedNoteSegments(
  notes: string,
  range: SourceTextRange | null,
): HighlightSegment[] {
  if (!notes) return [{ text: "—", highlighted: false }]
  if (!range || range.start < 0 || range.end <= range.start || range.end > notes.length) {
    return [{ text: notes, highlighted: false }]
  }

  const segments: HighlightSegment[] = []
  if (range.start > 0) {
    segments.push({ text: notes.slice(0, range.start), highlighted: false })
  }
  segments.push({
    text: notes.slice(range.start, range.end),
    highlighted: true,
  })
  if (range.end < notes.length) {
    segments.push({ text: notes.slice(range.end), highlighted: false })
  }
  return segments
}
