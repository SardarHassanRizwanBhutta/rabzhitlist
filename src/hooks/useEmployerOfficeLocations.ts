"use client"

import { useEffect, useState } from "react"
import { fetchEmployerById, type EmployerLocationDto } from "@/lib/services/employers-api"
import { formatUniversityLocationLabel } from "@/lib/utils/university-location-label"

export interface EmployerOfficeLocationOption {
  id: number
  employerId: number
  city: string
  address: string | null
  label: string
}

function toOption(loc: EmployerLocationDto): EmployerOfficeLocationOption | null {
  if (!Number.isFinite(loc.id) || loc.id <= 0) return null
  const city = loc.city?.trim() ?? ""
  if (!city) return null
  const address = loc.address?.trim() ? loc.address.trim() : null
  return {
    id: loc.id,
    employerId: loc.employerId,
    city,
    address,
    label: formatUniversityLocationLabel(city, address),
  }
}

/** Load office rows for one employer (create / details). */
export function useEmployerOfficeLocations(employerId: number | null) {
  const [locations, setLocations] = useState<EmployerOfficeLocationOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (employerId == null || employerId <= 0) {
      setLocations([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchEmployerById(employerId)
      .then((employer) => {
        if (cancelled) return
        setLocations(
          (employer.locations ?? [])
            .map(toOption)
            .filter((x): x is EmployerOfficeLocationOption => x != null),
        )
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
  }, [employerId])

  return { locations, loading }
}

/** Load office rows for several employers (Candidates filter). */
export function useEmployerOfficeLocationsForIds(employerIds: number[]) {
  const key = employerIds
    .filter((id) => Number.isFinite(id) && id > 0)
    .slice()
    .sort((a, b) => a - b)
    .join(",")
  const [locations, setLocations] = useState<EmployerOfficeLocationOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const ids = key
      ? key
          .split(",")
          .map((s) => Number(s))
          .filter((n) => Number.isFinite(n) && n > 0)
      : []
    if (ids.length === 0) {
      setLocations([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void Promise.all(ids.map((id) => fetchEmployerById(id).catch(() => null)))
      .then((employers) => {
        if (cancelled) return
        const next: EmployerOfficeLocationOption[] = []
        for (const employer of employers) {
          if (!employer) continue
          for (const loc of employer.locations ?? []) {
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
