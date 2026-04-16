"use client"

import { useState, useEffect, useRef } from "react"
import { searchUniversities } from "@/lib/services/universities-api"
import type { UniversityLookupDto } from "@/lib/services/universities-api"

/**
 * Debounced university search (300ms), min 2 characters, aborts stale requests.
 * Mirrors {@link useEmployerSearch}; used by UniversityCombobox.
 */
export function useUniversitySearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UniversityLookupDto[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const resetSearch = () => {
    setQuery("")
    setResults([])
    setLoading(false)
  }

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (query.trim().length < 2) {
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      setResults([])
      setLoading(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      const q = query.trim()
      searchUniversities(q, 10, controller.signal)
        .then((list) => {
          if (abortRef.current !== controller) return
          setResults(list)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return
          setResults([])
        })
        .finally(() => {
          if (abortRef.current === controller) {
            setLoading(false)
          }
        })
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [query])

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  return { query, setQuery, results, loading, resetSearch }
}
