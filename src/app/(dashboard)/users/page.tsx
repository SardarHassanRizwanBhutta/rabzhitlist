import { Suspense } from "react"
import { UsersPageClient } from "@/components/users-page-client"

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading users…</div>}>
      <UsersPageClient />
    </Suspense>
  )
}
