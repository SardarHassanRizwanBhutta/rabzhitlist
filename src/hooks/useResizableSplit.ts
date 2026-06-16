"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseResizableSplitOptions {
  storageKey: string
  defaultPercent?: number
  minPercent?: number
  maxPercent?: number
  enabled?: boolean
}

const DEFAULT_PERCENT = 38
const MIN_PERCENT = 22
const MAX_PERCENT = 55

function readStoredPercent(storageKey: string, fallback: number): number {
  if (typeof window === "undefined") return fallback
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (raw == null) return fallback
    const n = Number.parseFloat(raw)
    if (!Number.isFinite(n)) return fallback
    return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, n))
  } catch {
    return fallback
  }
}

export function useResizableSplit({
  storageKey,
  defaultPercent = DEFAULT_PERCENT,
  minPercent = MIN_PERCENT,
  maxPercent = MAX_PERCENT,
  enabled = true,
}: UseResizableSplitOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftPercent, setLeftPercent] = useState(() =>
    readStoredPercent(storageKey, defaultPercent),
  )
  const draggingRef = useRef(false)

  useEffect(() => {
    setLeftPercent(readStoredPercent(storageKey, defaultPercent))
  }, [storageKey, defaultPercent])

  const persistPercent = useCallback(
    (value: number) => {
      const clamped = Math.min(maxPercent, Math.max(minPercent, value))
      setLeftPercent(clamped)
      try {
        sessionStorage.setItem(storageKey, String(clamped))
      } catch {
        // ignore quota errors
      }
    },
    [storageKey, minPercent, maxPercent],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return
      e.preventDefault()
      draggingRef.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [enabled],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
      persistPercent(percent)
    },
    [persistPercent],
  )

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return {
    containerRef,
    leftPercent,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-valuenow": Math.round(leftPercent),
      "aria-valuemin": minPercent,
      "aria-valuemax": maxPercent,
      tabIndex: 0,
    },
  }
}
