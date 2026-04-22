/**
 * Backend API base URL (no trailing slash).
 *
 * - Production (e.g. Amplify): set `NEXT_PUBLIC_API_URL` (e.g. https://rabzhitlist.dplit.com).
 * - Local (optional): point the frontend at your machine — e.g. in `.env.local`:
 *   - `NEXT_PUBLIC_API_URL=http://localhost:5000` — main backend
 *   - `NEXT_PUBLIC_PARSER_API_URL=http://localhost:7000` — Python resume parser (see `resume-parser-api.ts`)
 * - Legacy: `NEXT_PUBLIC_API_BASE_URL` is still read if `NEXT_PUBLIC_API_URL` is unset.
 */
function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "")
}

export const API_BASE_URL: string = (() => {
  const raw =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (raw) return normalizeBaseUrl(raw)
  return "http://localhost:5103"
})()
