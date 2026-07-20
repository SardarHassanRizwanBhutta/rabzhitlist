"use client"

import * as React from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const PLACEHOLDER = `Enter everything discussed during the call.

Example:
Current salary is 150000. In DPL his tech stacks were .NET and Azure.
At Swipbox he received paid leaves and matrimonial leaves.`

const HELPER_TEXT = "Notes are saved for this candidate."

interface CallNotesEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  disabled?: boolean
  isSaving?: boolean
  showDraftSavedHint?: boolean
  readOnly?: boolean
  className?: string
}

function isCallNotesEmpty(value: string): boolean {
  return value.trim().length === 0
}

export function CallNotesEditor({
  value,
  onChange,
  onSave,
  disabled = false,
  isSaving = false,
  showDraftSavedHint = false,
  readOnly = false,
  className,
}: CallNotesEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const canSave =
    !isCallNotesEmpty(value) && !disabled && !isSaving && !readOnly

  return (
    <div className={cn("flex flex-col min-h-0 gap-3 h-full", className)}>
      <div className="shrink-0">
        <Label htmlFor="cold-caller-call-notes" className="text-base font-semibold">
          Call Notes
        </Label>
        <p className="text-sm text-muted-foreground mt-1">{HELPER_TEXT}</p>
      </div>

      <Textarea
        ref={textareaRef}
        id="cold-caller-call-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        readOnly={readOnly}
        disabled={disabled && !readOnly}
        className={cn(
          "flex-1 min-h-0 field-sizing-fixed resize-none overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed",
          readOnly && "bg-muted/40 cursor-default",
        )}
        aria-describedby="call-notes-editor-hint"
      />

      <div
        id="call-notes-editor-hint"
        className="flex flex-wrap items-center justify-between gap-3 pt-1 shrink-0"
      >
        <div className="text-xs text-muted-foreground">
          {readOnly ? (
            <span>Submitted notes (read-only)</span>
          ) : showDraftSavedHint ? (
            <span aria-live="polite">Draft saved locally</span>
          ) : null}
        </div>

        {!readOnly && (
          <Button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="gap-1.5 shrink-0"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Save Notes
          </Button>
        )}
      </div>
    </div>
  )
}
