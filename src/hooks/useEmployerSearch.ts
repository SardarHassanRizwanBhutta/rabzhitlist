"use client"

import { useState, useEffect, useRef } from "react"
import { searchEmployers } from "@/lib/services/employers-api"
import type { EmployerLookupDto } from "@/lib/services/employers-api"

/**
 * Debounced employer search (300ms), min 2 characters, aborts stale requests.
 * Used by EmployerCombobox; does not prefetch all employers.
 */
export function useEmployerSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<EmployerLookupDto[]>([])
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
      searchEmployers(q, 10, controller.signal)
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
