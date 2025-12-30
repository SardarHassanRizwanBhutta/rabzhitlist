"use client"

import { useState } from "react"
import { Check, X, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { VerificationBadge } from "./verification-badge"
import { FieldHistoryPopover } from "./field-history-popover"
import { 
  FieldVerification, 
  VerificationStatus,
  VerificationAuditLog,
} from "@/lib/types/verification"
import { sampleVerificationUsers } from "@/lib/sample-data/verification"

interface VerifiableFieldProps {
  label: string
  value: string | number | null
  fieldName: string
  verification?: FieldVerification
  history?: VerificationAuditLog[]
  onVerify?: (fieldName: string, status: VerificationStatus, notes?: string) => void
  onUpdate?: (fieldName: string, value: string) => void
  editable?: boolean
  className?: string
}

export function VerifiableField({
  label,
  value,
  fieldName,
  verification,
  history = [],
  onVerify,
  onUpdate,
  editable = true,
  className
}: VerifiableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value || ''))
  const [verificationNotes, setVerificationNotes] = useState('')
  const [verifyPopoverOpen, setVerifyPopoverOpen] = useState(false)
  
  const handleVerify = (status: VerificationStatus) => {
    if (onVerify) {
      onVerify(fieldName, status, verificationNotes || undefined)
    }
    setVerificationNotes('')
    setVerifyPopoverOpen(false)
  }
  
  const handleSave = () => {
    if (onUpdate) {
      onUpdate(fieldName, editValue)
    }
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setEditValue(String(value || ''))
    setIsEditing(false)
  }
  
  const displayValue = value !== null && value !== undefined ? String(value) : 'N/A'

  // Get user name from ID
  const getVerifiedByName = (userId: string | undefined) => {
    if (!userId) return undefined
    const user = sampleVerificationUsers.find(u => u.id === userId)
    return user?.name
  }
  
  return (
    <div className={cn(
      "group flex items-start gap-3 py-3 px-4 rounded-lg transition-colors",
      "hover:bg-muted/50",
      className
    )}>
      {/* Label & Value */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {verification && (
            <VerificationBadge 
              status={verification.status}
              source={verification.source}
              verifiedBy={getVerifiedByName(verification.verifiedBy)}
              verifiedAt={verification.verifiedAt}
              size="sm"
            />
          )}
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input 
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <span className={cn(
            "text-sm block",
            value === null || value === undefined ? "text-muted-foreground italic" : ""
          )}>
            {displayValue}
          </span>
        )}
      </div>
      
      {/* Action buttons - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {/* Edit button */}
        {editable && onUpdate && !isEditing && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Edit value</span>
          </Button>
        )}
        
        {/* Verify button */}
        {onVerify && (
          <Popover open={verifyPopoverOpen} onOpenChange={setVerifyPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0"
              >
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="sr-only">Verify field</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Verify: {label}</h4>
                <p className="text-xs text-muted-foreground">
                  Current value: <span className="font-medium text-foreground">{displayValue}</span>
                </p>
                <Textarea 
                  placeholder="Add verification notes (optional)"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="h-16 text-xs resize-none"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleVerify('verified')}
                  >
                    <Check className="h-3 w-3 mr-1" /> Verify
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {/* History button */}
        {history.length > 0 && (
          <FieldHistoryPopover 
            fieldName={fieldName}
            history={history}
          />
        )}
      </div>
    </div>
  )
}
