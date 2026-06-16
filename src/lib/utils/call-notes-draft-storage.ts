const DRAFT_KEY_PREFIX = "cold-caller-notes-draft:"

export function getCallNotesDraftStorageKey(candidateId: string | number): string {
  return `${DRAFT_KEY_PREFIX}${candidateId}`
}

export function readCallNotesDraft(candidateId: string | number): string {
  if (typeof window === "undefined") return ""
  try {
    return sessionStorage.getItem(getCallNotesDraftStorageKey(candidateId)) ?? ""
  } catch {
    return ""
  }
}

export function writeCallNotesDraft(candidateId: string | number, draft: string): void {
  if (typeof window === "undefined") return
  try {
    if (draft.trim()) {
      sessionStorage.setItem(getCallNotesDraftStorageKey(candidateId), draft)
    } else {
      sessionStorage.removeItem(getCallNotesDraftStorageKey(candidateId))
    }
  } catch {
    // sessionStorage may be unavailable (private mode, quota)
  }
}

export function clearCallNotesDraft(candidateId: string | number): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(getCallNotesDraftStorageKey(candidateId))
  } catch {
    // ignore
  }
}
