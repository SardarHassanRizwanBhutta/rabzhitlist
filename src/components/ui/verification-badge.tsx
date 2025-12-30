"use client"

import { Check, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
  VerificationStatus, 
  DataSource,
  VERIFICATION_STATUS_COLORS,
  VERIFICATION_STATUS_LABELS,
  DATA_SOURCE_LABELS
} from "@/lib/types/verification"

interface VerificationBadgeProps {
  status: VerificationStatus
  source?: DataSource
  verifiedBy?: string
  verifiedAt?: Date
  showTooltip?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<VerificationStatus, { icon: typeof Check; iconColor: string }> = {
  verified: {
    icon: Check,
    iconColor: 'text-green-600 dark:text-green-400'
  },
  unverified: {
    icon: AlertTriangle,
    iconColor: 'text-red-500 dark:text-red-400'
  },
}

export function VerificationBadge({ 
  status, 
  source, 
  verifiedBy,
  verifiedAt,
  showTooltip = true,
  size = 'sm',
  className
}: VerificationBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  const sizeClasses = size === 'sm' 
    ? 'h-5 px-1.5 text-xs' 
    : 'h-6 px-2 text-sm'
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  
  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        VERIFICATION_STATUS_COLORS[status],
        sizeClasses,
        'border font-medium cursor-default',
        className
      )}
    >
      <Icon className={cn(iconSize, config.iconColor)} />
    </Badge>
  )
  
  if (!showTooltip) return badge
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-sm text-background">{VERIFICATION_STATUS_LABELS[status]}</p>
            {source && (
              <p className="text-background/70">
                Source: <span className="text-background font-medium">{DATA_SOURCE_LABELS[source]}</span>
              </p>
            )}
            {verifiedBy && (
              <p className="text-background/70">
                Verified by: <span className="text-background font-medium">{verifiedBy}</span>
              </p>
            )}
            {verifiedAt && (
              <p className="text-background/70">
                Date: <span className="text-background font-medium">{formatDate(verifiedAt)}</span>
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compact badge for tables - just shows icon
export function VerificationBadgeCompact({ 
  status,
  className 
}: { 
  status: VerificationStatus
  className?: string 
}) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex cursor-default", className)}>
            <Icon className={cn('h-4 w-4', config.iconColor)} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span className="text-xs font-medium text-background">{VERIFICATION_STATUS_LABELS[status]}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
