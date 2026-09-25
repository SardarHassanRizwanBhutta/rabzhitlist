"use client"

import type { ComponentType } from "react"
import {
  Award,
  Building2,
  FolderOpen,
  GraduationCap,
  Users,
} from "lucide-react"
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card"
import { Card, CardContent } from "@/components/ui/card"
import type { UserContributionCounts } from "@/lib/types/user-contributions"

export const USER_PROFILE_MODULE_CARDS: {
  key: keyof UserContributionCounts
  title: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { key: "candidates", title: "Candidates", icon: Users },
  { key: "employers", title: "Employers", icon: Building2 },
  { key: "projects", title: "Projects", icon: FolderOpen },
  { key: "universities", title: "Universities", icon: GraduationCap },
  { key: "certifications", title: "Certifications", icon: Award },
]

export type UserProfileContributionsSectionProps = {
  loading: boolean
  error: string | null
  counts: UserContributionCounts | null
}

export function UserProfileContributionsSection({
  loading,
  error,
  counts,
}: UserProfileContributionsSectionProps) {
  return (
    <section className="mt-8 space-y-4" aria-labelledby="contributions-heading">
      <h3 id="contributions-heading" className="text-lg font-semibold tracking-tight">
        Contributions
      </h3>

      {error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {USER_PROFILE_MODULE_CARDS.map(({ key, title, icon }) => (
          <DashboardKpiCard
            key={key}
            title={title}
            icon={icon}
            loading={loading}
            value={counts ? counts[key] : undefined}
            hint="Records created"
          />
        ))}
      </div>
    </section>
  )
}
