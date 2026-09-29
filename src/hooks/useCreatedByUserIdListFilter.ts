"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CREATED_BY_USER_ID_QUERY,
  deleteCreatedByUserIdParam,
  parseCreatedByUserIdParam,
} from "@/lib/utils/created-by-user-id"

/**
 * Reads `createdByUserId` from the URL for the initial list request.
 * Call `dismissCreatedByUserId` when the user applies or clears module filters
 * so later requests (including pagination after that) omit it.
 */
export function useCreatedByUserIdListFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromUrl = parseCreatedByUserIdParam(searchParams.get(CREATED_BY_USER_ID_QUERY))
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [fromUrl])

  const createdByUserId = dismissed || fromUrl == null ? null : fromUrl

  const markCreatedByUserIdDismissed = useCallback(() => {
    setDismissed(true)
  }, [])

  const dismissCreatedByUserId = useCallback(() => {
    setDismissed(true)
    const params = new URLSearchParams(searchParams.toString())
    if (!params.has(CREATED_BY_USER_ID_QUERY)) return
    deleteCreatedByUserIdParam(params)
    const q = params.toString()
    router.replace(q ? `${pathname}?${q}` : pathname)
  }, [pathname, router, searchParams])

  return { createdByUserId, dismissCreatedByUserId, markCreatedByUserIdDismissed }
}
