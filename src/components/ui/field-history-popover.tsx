"use client"

import { History, ArrowRight, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  VerificationAuditLog, 
  VerificationStatus,
  VERIFICATION_STATUS_LABELS 
} from "@/lib/types/verification"

interface FieldHistoryPopoverProps {
  fieldName: string
  history: VerificationAuditLog[]
  className?: string
}

const statusIcons: Record<VerificationStatus, typeof Check> = {
  verified: Check,
  unverified: Clock
}

const statusColors: Record<VerificationStatus, string> = {
  verified: 'text-green-600 dark:text-green-400',
  unverified: 'text-gray-500 dark:text-gray-400'
}

const dotColors: Record<VerificationStatus, string> = {
  verified: 'bg-green-500',
  unverified: 'bg-gray-400'
}

export function FieldHistoryPopover({ 
  fieldName, 
  history,
  className 
}: FieldHistoryPopoverProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else if (days === 1) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
  
  const getStatusIcon = (status: VerificationStatus | undefined) => {
    if (!status) return Clock
    return statusIcons[status]
  }
  
  const getStatusColor = (status: VerificationStatus | undefined) => {
    if (!status) return statusColors.unverified
    return statusColors[status]
  }
  
  const getDotColor = (status: VerificationStatus | undefined) => {
    if (!status) return dotColors.unverified
    return dotColors[status]
  }
  
  if (history.length === 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="sm" 
            variant="ghost" 
            className={cn("h-7 w-7 p-0", className)}
          >
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">View history</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="text-center py-4">
            <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No history available</p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant="ghost" 
          className={cn("h-7 w-7 p-0", className)}
        >
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="sr-only">View history</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">
            Change History: <span className="capitalize">{fieldName.replace(/([A-Z])/g, ' $1').trim()}</span>
          </h4>
          
          <ScrollArea className="h-64 pr-2">
            <div className="space-y-3 ml-2">
              {history.map((entry, idx) => {
                const NewStatusIcon = getStatusIcon(entry.newStatus)
                
                return (
                  <div 
                    key={entry.id} 
                    className="relative pl-5 pb-3 border-l-2 border-muted last:border-l-0 last:pb-0"
                  >
                    {/* Timeline dot */}
                    <div 
                      className={cn(
                        "absolute left-[-5px] top-0 w-2 h-2 rounded-full",
                        getDotColor(entry.newStatus)
                      )}
                    />
                    
                    {/* Content */}
                    <div className="space-y-1.5">
                      {/* Header: Date & User */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatDate(entry.changedAt)}
                        </span>
                      </div>
                      
                      <p className="text-xs font-medium">{entry.changedByName}</p>
                      
                      {/* Value change */}
                      {entry.oldValue !== entry.newValue && entry.newValue && (
                        <div className="flex items-center gap-1.5 text-xs">
                          {entry.oldValue && (
                            <>
                              <span className="line-through text-muted-foreground truncate max-w-[80px]">
                                {entry.oldValue}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            </>
                          )}
                          <span className="font-medium truncate max-w-[100px]">{entry.newValue}</span>
                        </div>
                      )}
                      
                      {/* Status change */}
                      {(entry.oldStatus || entry.newStatus) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          {entry.oldStatus && (
                            <>
                              <span className={cn("flex items-center gap-1", getStatusColor(entry.oldStatus))}>
                                {VERIFICATION_STATUS_LABELS[entry.oldStatus]}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            </>
                          )}
                          {entry.newStatus && (
                            <span className={cn("flex items-center gap-1 font-medium", getStatusColor(entry.newStatus))}>
                              <NewStatusIcon className="h-3 w-3" />
                              {VERIFICATION_STATUS_LABELS[entry.newStatus]}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Reason/Notes */}
                      {entry.reason && (
                        <p className="text-xs text-muted-foreground italic">
                          &ldquo;{entry.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
