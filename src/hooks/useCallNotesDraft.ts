"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  clearCallNotesDraft,
  readCallNotesDraft,
  writeCallNotesDraft,
} from "@/lib/utils/call-notes-draft-storage"

const DEBOUNCE_MS = 400

export interface UseCallNotesDraftResult {
  draft: string
  setDraft: (value: string) => void
  /** True briefly after a debounced save to sessionStorage */
  showDraftSavedHint: boolean
  clearDraft: () => void
}

/**
 * Persists unsent call-notes draft per candidate in sessionStorage.
 * Restores when the dialog opens for the same candidate; clears on explicit clearDraft (after session submit in Phase 2).
 */
export function useCallNotesDraft(
  candidateId: string | number,
  dialogOpen: boolean,
): UseCallNotesDraftResult {
  const [draft, setDraftState] = useState("")
  const [showDraftSavedHint, setShowDraftSavedHint] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevCandidateRef = useRef<string | number | null>(null)
  const restoredForCandidateRef = useRef<string | number | null>(null)

  // Restore draft when dialog opens or candidate changes
  useEffect(() => {
    if (!dialogOpen) return

    const candidateChanged = prevCandidateRef.current !== candidateId
    prevCandidateRef.current = candidateId

    if (candidateChanged || restoredForCandidateRef.current !== candidateId) {
      restoredForCandidateRef.current = candidateId
      setDraftState(readCallNotesDraft(candidateId))
      setShowDraftSavedHint(false)
    }
  }, [dialogOpen, candidateId])

  const setDraft = useCallback(
    (value: string) => {
      setDraftState(value)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        writeCallNotesDraft(candidateId, value)
        setShowDraftSavedHint(true)
        if (hintRef.current) clearTimeout(hintRef.current)
        hintRef.current = setTimeout(() => setShowDraftSavedHint(false), 2000)
      }, DEBOUNCE_MS)
    },
    [candidateId],
  )

  const clearDraft = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    clearCallNotesDraft(candidateId)
    setDraftState("")
    setShowDraftSavedHint(false)
  }, [candidateId])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (hintRef.current) clearTimeout(hintRef.current)
    }
  }, [])

  return { draft, setDraft, showDraftSavedHint, clearDraft }
}
