"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type ResizableSplitSide = "left" | "right"

interface UseResizableSplitOptions {
  storageKey: string
  side?: ResizableSplitSide
  defaultPercent?: number
  minPercent?: number
  maxPercent?: number
  enabled?: boolean
}

const DEFAULT_LEFT_PERCENT = 38
const DEFAULT_LEFT_MIN = 22
const DEFAULT_LEFT_MAX = 55

function readStoredPercent(
  storageKey: string,
  fallback: number,
  minPercent: number,
  maxPercent: number,
): number {
  if (typeof window === "undefined") return fallback
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (raw == null) return fallback
    const n = Number.parseFloat(raw)
    if (!Number.isFinite(n)) return fallback
    return Math.min(maxPercent, Math.max(minPercent, n))
  } catch {
    return fallback
  }
}

export function useResizableSplit({
  storageKey,
  side = "left",
  defaultPercent,
  minPercent,
  maxPercent,
  enabled = true,
}: UseResizableSplitOptions) {
  const resolvedDefault = defaultPercent ?? DEFAULT_LEFT_PERCENT
  const resolvedMin = minPercent ?? DEFAULT_LEFT_MIN
  const resolvedMax = maxPercent ?? DEFAULT_LEFT_MAX

  const containerRef = useRef<HTMLDivElement>(null)
  const [panelPercent, setPanelPercent] = useState(() =>
    readStoredPercent(storageKey, resolvedDefault, resolvedMin, resolvedMax),
  )
  const draggingRef = useRef(false)

  useEffect(() => {
    setPanelPercent(readStoredPercent(storageKey, resolvedDefault, resolvedMin, resolvedMax))
  }, [storageKey, resolvedDefault, resolvedMin, resolvedMax])

  const persistPercent = useCallback(
    (value: number) => {
      const clamped = Math.min(resolvedMax, Math.max(resolvedMin, value))
      setPanelPercent(clamped)
      try {
        sessionStorage.setItem(storageKey, String(clamped))
      } catch {
        // ignore quota errors
      }
    },
    [storageKey, resolvedMin, resolvedMax],
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
      const offset =
        side === "left" ? e.clientX - rect.left : rect.right - e.clientX
      const percent = (offset / rect.width) * 100
      persistPercent(percent)
    },
    [persistPercent, side],
  )

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return {
    containerRef,
    panelPercent,
    leftPercent: panelPercent,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      role: "separator" as const,
      "aria-orientation": "vertical" as const,
      "aria-valuenow": Math.round(panelPercent),
      "aria-valuemin": resolvedMin,
      "aria-valuemax": resolvedMax,
      tabIndex: 0,
    },
  }
}
