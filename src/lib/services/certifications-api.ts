import type { Certification, CertificationIssuer } from '@/lib/types/certification'
import type { CertificationDataProgressResponse } from '@/lib/types/certification-data-progress'

import { API_BASE_URL } from "@/lib/config/api"

function parseDataProgressPercentage(value: unknown): number | null {
  if (typeof value === "number") return value
  if (value != null) {
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }
  return null
}

function mapCertificationDto(data: Record<string, unknown>): Certification {
  return {
    ...(data as unknown as Certification),
    dataProgressPercentage: parseDataProgressPercentage(data.dataProgressPercentage),
  }
}

export interface CertificationsPageResponse {
  items: Certification[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface FetchCertificationsParams {
  name?: string
  issuerIds?: number[]
  pageNumber?: number
  pageSize?: number
  minDataProgressPercentage?: number
  maxDataProgressPercentage?: number
}

export async function fetchCertificationsPage(params: FetchCertificationsParams = {}): Promise<CertificationsPageResponse> {
  const { name = '', issuerIds = [], pageNumber = 1, pageSize = 20 } = params
  const search = new URLSearchParams()
  if (name.trim()) search.set('name', name.trim())
  issuerIds.forEach(id => search.append('issuerId', String(id)))
  search.set('pageNumber', String(pageNumber))
  search.set('pageSize', String(pageSize))
  if (params.minDataProgressPercentage != null) {
    search.set('minDataProgressPercentage', String(params.minDataProgressPercentage))
  }
  if (params.maxDataProgressPercentage != null) {
    search.set('maxDataProgressPercentage', String(params.maxDataProgressPercentage))
  }
  const query = search.toString()
  const url = `${API_BASE_URL}/api/certifications${query ? `?${query}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch certifications: ${response.status} — ${text}`)
  }

  const data = await response.json() as CertificationsPageResponse
  return {
    ...data,
    items: data.items.map((item) => mapCertificationDto(item as unknown as Record<string, unknown>)),
  }
}

export async function fetchCertificationIssuers(): Promise<CertificationIssuer[]> {
  const response = await fetch(`${API_BASE_URL}/api/CertificationIssuers`)

  if (!response.ok) {
    throw new Error(`Failed to fetch certification issuers: ${response.status}`)
  }

  return response.json()
}

interface CreateCertificationIssuerRequest {
  name: string
  websiteUrl: string
}

export async function createCertificationIssuer(data: CreateCertificationIssuerRequest): Promise<CertificationIssuer> {
  const response = await fetch(`${API_BASE_URL}/api/CertificationIssuers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to create certification issuer: ${response.status} — ${errorBody}`)
  }

  return response.json()
}

interface CreateCertificationRequest {
  name: string
  issuerId: number
}

export async function createCertification(data: CreateCertificationRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/certifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to create certification: ${response.status} — ${errorBody}`)
  }
}

export interface UpdateCertificationRequest {
  name: string
  issuerId: number | null
}

export async function updateCertification(id: number, body: UpdateCertificationRequest): Promise<Certification> {
  const response = await fetch(`${API_BASE_URL}/api/certifications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (response.status === 404) {
    throw new Error('Not found')
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to update certification: ${response.status} — ${errorBody}`)
  }

  const payload = await response.json()
  return mapCertificationDto(payload as Record<string, unknown>)
}

export async function fetchCertificationDataProgress(
  certificationId: number,
  signal?: AbortSignal,
): Promise<CertificationDataProgressResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/certifications/${certificationId}/data-progress`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    },
  )
  if (response.status === 404) throw new Error("Not found")
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Certification data progress failed (${response.status}): ${text}`)
  }
  return response.json() as Promise<CertificationDataProgressResponse>
}

export async function deleteCertification(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/certifications/${id}`, {
    method: 'DELETE',
  })

  if (response.status === 404) {
    throw new Error('Not found')
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to delete certification: ${response.status} — ${errorBody}`)
  }
}
