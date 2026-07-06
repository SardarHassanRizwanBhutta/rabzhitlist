import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMetricInteger } from "@/lib/utils/dashboard-metrics"

export interface DashboardKpiCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  value?: number
  loading: boolean
  href?: string
  hint?: string
  formatValue?: (n: number) => string
}

export function DashboardKpiCard({
  title,
  icon: Icon,
  value,
  loading,
  href,
  hint,
  formatValue = formatMetricInteger,
}: DashboardKpiCardProps) {
  const content = (
    <Card className={href ? "transition-colors hover:bg-muted/30" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">
            {value != null ? formatValue(value) : "—"}
          </p>
        )}
        {hint && !loading && (
          <p className="text-xs text-muted-foreground mt-2">{hint}</p>
        )}
        {href && !loading && (
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            View all
            <ArrowRight className="size-3" />
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        {content}
      </Link>
    )
  }

  return content
}
