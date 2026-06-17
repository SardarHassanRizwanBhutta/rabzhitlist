/**
 * Open a URL in a new tab after an async fetch (e.g. presigned S3 URL).
 *
 * Opens `about:blank` synchronously on the user gesture so pop-up blockers allow it.
 * Do not pass `noopener` on that first open — it returns null and breaks navigation.
 */
export async function openUrlInNewTabAfterFetch(
  fetchUrl: () => Promise<string>,
): Promise<void> {
  const previewWindow = window.open("about:blank", "_blank")

  if (previewWindow) {
    try {
      previewWindow.opener = null
    } catch {
      // Ignore if opener cannot be cleared
    }
  }

  try {
    const url = await fetchUrl()

    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.replace(url)
      return
    }

    const fallbackTab = window.open(url, "_blank", "noopener,noreferrer")
    if (!fallbackTab) {
      throw new Error(
        "Unable to open a new tab. Allow pop-ups for this site and try again.",
      )
    }
  } catch (error) {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.close()
    }
    throw error
  }
}
