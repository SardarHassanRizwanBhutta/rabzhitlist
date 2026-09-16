/**
 * Parse error response bodies from the ASP.NET backend into a user-facing message.
 *
 * Common shapes:
 * - JSON-encoded string: `"Work experience 1: end date …"`
 * - Plain text
 * - ProblemDetails-like object: `{ detail, message, title }`
 */
export function extractApiErrorMessage(text: string, status: number): string {
  const trimmed = text.trim()
  if (!trimmed) return `Request failed (${status})`

  try {
    const parsed: unknown = JSON.parse(trimmed)

    if (typeof parsed === "string" && parsed.trim()) {
      return parsed.trim()
    }

    if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>
      if (typeof obj.detail === "string" && obj.detail.trim()) return obj.detail.trim()
      if (typeof obj.message === "string" && obj.message.trim()) return obj.message.trim()
      if (typeof obj.title === "string" && obj.title.trim()) return obj.title.trim()
    }
  } catch {
    /* not JSON — fall through to plain text */
  }

  if (trimmed.length <= 600 && !trimmed.startsWith("<")) return trimmed
  return `Request failed (${status})`
}

/** Backend ValidationException messages (employer / university name uniqueness). */
export const API_NAME_REQUIRED_MESSAGE = "Name is required."
export const API_EMPLOYER_DUPLICATE_NAME_MESSAGE =
  "An employer with this name already exists."
export const API_UNIVERSITY_DUPLICATE_NAME_MESSAGE =
  "A university with this name already exists."

export function employerNameFieldErrorFromApi(message: string): string | null {
  if (
    message === API_EMPLOYER_DUPLICATE_NAME_MESSAGE ||
    message === API_NAME_REQUIRED_MESSAGE
  ) {
    return message
  }
  return null
}

export function universityNameFieldErrorFromApi(message: string): string | null {
  if (
    message === API_UNIVERSITY_DUPLICATE_NAME_MESSAGE ||
    message === API_NAME_REQUIRED_MESSAGE
  ) {
    return message
  }
  return null
}
