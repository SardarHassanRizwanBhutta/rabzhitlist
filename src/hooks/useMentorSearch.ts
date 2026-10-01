"use client"

import { useEffect, useRef, useState } from "react"
import { searchMentors } from "@/lib/services/mentors-api"
import type { MentorSearchHit } from "@/lib/types/mentor"

/** Debounced mentor name search (300ms), minimum 2 characters. */
export function useMentorSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MentorSearchHit[]>([])
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
      abortRef.current?.abort()
      abortRef.current = null
      setResults([])
      setLoading(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      searchMentors(query.trim(), 10, controller.signal)
        .then((list) => {
          if (abortRef.current !== controller) return
          setResults(list)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return
          setResults([])
        })
        .finally(() => {
          if (abortRef.current === controller) setLoading(false)
        })
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [query])

  return { query, setQuery, results, loading, resetSearch }
}
