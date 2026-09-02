"use client"

import { useEffect, useState } from "react"
import { fetchUniversityById } from "@/lib/services/universities-api"
import type { UniversityLocation } from "@/lib/types/university"
import { formatUniversityLocationLabel } from "@/lib/utils/university-location-label"

export interface CampusLocationOption {
  id: number
  universityId: number
  city: string
  address: string | null
  label: string
}

function toOption(loc: UniversityLocation): CampusLocationOption | null {
  if (!Number.isFinite(loc.id) || loc.id <= 0) return null
  const city = loc.city?.trim() ?? ""
  if (!city) return null
  const address = loc.address?.trim() ? loc.address.trim() : null
  return {
    id: loc.id,
    universityId: loc.universityId,
    city,
    address,
    label: formatUniversityLocationLabel(city, address),
  }
}

/** Load campus rows for one university (create / details). */
export function useUniversityCampusLocations(universityId: number | null) {
  const [locations, setLocations] = useState<CampusLocationOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (universityId == null || universityId <= 0) {
      setLocations([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchUniversityById(universityId)
      .then((uni) => {
        if (cancelled) return
        setLocations((uni.locations ?? []).map(toOption).filter((x): x is CampusLocationOption => x != null))
      })
      .catch(() => {
        if (!cancelled) setLocations([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [universityId])

  return { locations, loading }
}

/** Load campus rows for several universities (Candidates filter). */
export function useUniversityCampusLocationsForIds(universityIds: number[]) {
  const key = universityIds.filter((id) => Number.isFinite(id) && id > 0).slice().sort((a, b) => a - b).join(",")
  const [locations, setLocations] = useState<CampusLocationOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const ids = key
      ? key.split(",").map((s) => Number(s)).filter((n) => Number.isFinite(n) && n > 0)
      : []
    if (ids.length === 0) {
      setLocations([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void Promise.all(ids.map((id) => fetchUniversityById(id).catch(() => null)))
      .then((unis) => {
        if (cancelled) return
        const next: CampusLocationOption[] = []
        for (const uni of unis) {
          if (!uni) continue
          for (const loc of uni.locations ?? []) {
            const opt = toOption(loc)
            if (opt) next.push(opt)
          }
        }
        setLocations(next)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return { locations, loading }
}
