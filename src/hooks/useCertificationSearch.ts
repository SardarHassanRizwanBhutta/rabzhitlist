"use client"

import { useState, useEffect, useRef } from "react"
import { searchCertifications } from "@/lib/services/certifications-lookup-api"
import type { CertificationLookupDto } from "@/lib/services/certifications-lookup-api"

/**
 * Debounced certification search (300ms), min 2 characters before any request, aborts stale requests.
 * Used by CertificationCombobox; does not prefetch all certifications.
 */
export function useCertificationSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CertificationLookupDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const resetSearch = () => {
    setQuery("")
    setResults([])
    setIsLoading(false)
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
      setIsLoading(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller
      setIsLoading(true)
      const q = query.trim()
      searchCertifications(q, 10, controller.signal)
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
            setIsLoading(false)
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

  return { query, setQuery, results, isLoading, resetSearch }
}
