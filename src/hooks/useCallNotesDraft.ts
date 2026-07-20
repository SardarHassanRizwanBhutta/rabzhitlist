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
  /**
   * Apply editor value after server load (or GET failure fallback).
   * Sets React state and sessionStorage without the “draft saved” hint flash.
   */
  hydrate: (value: string) => void
  /** Remove sessionStorage draft only; keeps current editor text. */
  clearDraftStorage: () => void
  /** Clear sessionStorage and reset editor to "". */
  clearDraft: () => void
  /** Read current sessionStorage draft for this candidate (sync). */
  readStoredDraft: () => string
}

/**
 * Persists unsent call-notes draft per candidate in sessionStorage.
 * With `deferHydration`, does not restore on open — parent hydrates after GET.
 */
export function useCallNotesDraft(
  candidateId: string | number,
  dialogOpen: boolean,
  options?: { deferHydration?: boolean },
): UseCallNotesDraftResult {
  const deferHydration = options?.deferHydration ?? false
  const [draft, setDraftState] = useState("")
  const [showDraftSavedHint, setShowDraftSavedHint] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevCandidateRef = useRef<string | number | null>(null)
  const restoredForCandidateRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (!dialogOpen) return

    const candidateChanged = prevCandidateRef.current !== candidateId
    prevCandidateRef.current = candidateId

    if (candidateChanged || restoredForCandidateRef.current !== candidateId) {
      restoredForCandidateRef.current = candidateId
      if (deferHydration) {
        setDraftState("")
      } else {
        setDraftState(readCallNotesDraft(candidateId))
      }
      setShowDraftSavedHint(false)
    }
  }, [dialogOpen, candidateId, deferHydration])

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

  const hydrate = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setDraftState(value)
      writeCallNotesDraft(candidateId, value)
      setShowDraftSavedHint(false)
    },
    [candidateId],
  )

  const clearDraftStorage = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    clearCallNotesDraft(candidateId)
    setShowDraftSavedHint(false)
  }, [candidateId])

  const clearDraft = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    clearCallNotesDraft(candidateId)
    setDraftState("")
    setShowDraftSavedHint(false)
  }, [candidateId])

  const readStoredDraft = useCallback(
    () => readCallNotesDraft(candidateId),
    [candidateId],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (hintRef.current) clearTimeout(hintRef.current)
    }
  }, [])

  return {
    draft,
    setDraft,
    showDraftSavedHint,
    hydrate,
    clearDraftStorage,
    clearDraft,
    readStoredDraft,
  }
}
