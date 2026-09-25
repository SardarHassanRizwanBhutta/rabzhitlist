import { ApiHttpError } from "@/lib/utils/api-error-message"

/** User-facing message for contributions fetch failures (toast / inline). */
export function userContributionsErrorMessage(error: unknown): string {
  if (error instanceof ApiHttpError) {
    if (error.status === 404 || error.message === "Not found") {
      return "User not found."
    }
    if (error.status === 403) {
      return error.message.trim() || "You do not have permission to perform this action."
    }
  }
  if (error instanceof Error && error.message === "Not found") {
    return "User not found."
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return "Failed to load contributions."
}
