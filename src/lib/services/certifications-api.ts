import type { Certification, CertificationIssuer } from '@/lib/types/certification'

import { API_BASE_URL } from "@/lib/config/api"

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
}

export async function fetchCertificationsPage(params: FetchCertificationsParams = {}): Promise<CertificationsPageResponse> {
  const { name = '', issuerIds = [], pageNumber = 1, pageSize = 20 } = params
  const search = new URLSearchParams()
  if (name.trim()) search.set('name', name.trim())
  issuerIds.forEach(id => search.append('issuerId', String(id)))
  search.set('pageNumber', String(pageNumber))
  search.set('pageSize', String(pageSize))
  const query = search.toString()
  const url = `${API_BASE_URL}/api/Certifications${query ? `?${query}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch certifications: ${response.status}`)
  }

  return response.json()
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
  const response = await fetch(`${API_BASE_URL}/api/Certifications`, {
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

export async function updateCertification(id: number, data: UpdateCertificationRequest): Promise<Certification> {
  const response = await fetch(`${API_BASE_URL}/api/Certifications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (response.status === 404) {
    throw new Error('Not found')
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to update certification: ${response.status} — ${errorBody}`)
  }

  return response.json()
}

export async function deleteCertification(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/Certifications/${id}`, {
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
