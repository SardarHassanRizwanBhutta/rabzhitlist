/** @see docs/CALL_NOTES_EXTRACT_FRONTEND_HANDOFF.md §9 */

export const CALL_NOTES_EXTRACT_MAX_NOTES_LENGTH = (() => {
  const raw = process.env.CALL_NOTES_EXTRACT_MAX_NOTES_LENGTH?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100_000
})()

export const CALL_NOTES_EXTRACT_TIMEOUT_MS = (() => {
  const raw = process.env.CALL_NOTES_EXTRACT_TIMEOUT_MS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000
})()

export function questionsApiBaseUrl(): string {
  const raw =
    process.env.QUESTIONS_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_QUESTIONS_API_URL?.trim()
  if (raw) return raw.replace(/\/+$/, "")
  return "http://localhost:8002"
}
