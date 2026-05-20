"use client"

import type { ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { CandidateDataProgressResponse } from "@/lib/types/candidate-data-progress"
import { cn } from "@/lib/utils"
import {
  getDataProgressBadgeClasses,
  getDataProgressStatus,
  normalizeProgress,
  sortDataProgressSections,
} from "@/lib/utils/candidate-data-progress"

interface CandidateDataProgressPanelProps {
  progress: CandidateDataProgressResponse | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

export function CandidateDataProgressPanel({
  progress,
  loading,
  error,
  onRetry,
}: CandidateDataProgressPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Unable to load data progress.</span>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 size-3.5" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!progress) return null

  const overall = normalizeProgress(progress.overallPercentage)
  const sections = sortDataProgressSections(progress.sections ?? [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Data Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataProgressOverallBlock overall={overall} />

        <div className="space-y-3">
          {sections.map((section) => {
            const value = normalizeProgress(section.percentage)
            return (
              <ProgressSectionRow key={section.sectionKey} section={section} value={value} />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function DataProgressOverallBlock({ overall }: { overall: number }) {
  const tierColors = getDataProgressBadgeClasses(overall)
  return (
    <div className="space-y-2">
      <ProgressLabelRow>
        <span className="text-sm font-medium">Overall Progress</span>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-normal border",
              tierColors.bg,
              tierColors.border,
              tierColors.text,
            )}
          >
            {getDataProgressStatus(overall)}
          </Badge>
          <span className="text-sm font-semibold tabular-nums">{overall.toFixed(1)}%</span>
        </div>
      </ProgressLabelRow>
      <Progress value={overall} className="h-2" />
    </div>
  )
}

function ProgressSectionRow({
  section,
  value,
}: {
  section: CandidateDataProgressResponse["sections"][number]
  value: number
}) {
  const score = Number.isFinite(section.score) ? section.score : 0
  const maxScore = Number.isFinite(section.maxScore) ? section.maxScore : 0

  return (
    <div className="space-y-2">
      <ProgressLabelRow>
        <span className="text-sm font-medium">{section.sectionName}</span>
        <div className="flex flex-col items-end text-right">
          <span className="text-sm font-medium tabular-nums">
            {score} / {maxScore}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{Math.round(value)}%</span>
        </div>
      </ProgressLabelRow>
      <Progress value={value} className="h-2" />
      {section.missingFields.length > 0 ? (
        <MissingFieldsBadges fields={section.missingFields} />
      ) : (
        <p className="text-xs text-muted-foreground">Complete</p>
      )}
    </div>
  )
}

function MissingFieldsBadges({ fields }: { fields: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {fields.map((field) => (
        <Badge key={field} variant="secondary" className="text-xs font-normal">
          {field}
        </Badge>
      ))}
    </div>
  )
}

function ProgressLabelRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-2">{children}</div>
}
