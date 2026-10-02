"use client"

import { useEffect, useRef, useState } from "react"
import { searchProjectModules } from "@/lib/services/project-modules-api"
import type { ProjectModuleSearchHit } from "@/lib/types/project-module"

/** Debounced module search under one project (300ms, min 2 characters). */
export function useProjectModuleSearch(projectId: number | null) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProjectModuleSearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const resetSearch = () => {
    setQuery("")
    setResults([])
    setLoading(false)
  }

  useEffect(() => {
    resetSearch()
  }, [projectId])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (projectId == null || projectId <= 0 || query.trim().length < 2) {
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
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      searchProjectModules(projectId, query.trim(), 10, controller.signal)
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
      if (abortRef.current) abortRef.current.abort()
    }
  }, [projectId, query])

  return { query, setQuery, results, loading, resetSearch }
}
