"use client"

import * as React from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const PLACEHOLDER = `Enter everything discussed during the call.

Example:
Current salary is 150000. In DPL his tech stacks were .NET and Azure.
At Swipbox he received paid leaves and matrimonial leaves.`

const HELPER_TEXT =
  "Enter everything discussed during the call in natural language. The system will identify high-confidence values for currently empty candidate fields."

interface CallNotesEditorProps {
  value: string
  onChange: (value: string) => void
  onAnalyze: () => void
  disabled?: boolean
  isAnalyzing?: boolean
  showDraftSavedHint?: boolean
  readOnly?: boolean
  className?: string
}

export function CallNotesEditor({
  value,
  onChange,
  onAnalyze,
  disabled = false,
  isAnalyzing = false,
  showDraftSavedHint = false,
  readOnly = false,
  className,
}: CallNotesEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const canAnalyze = value.trim().length > 0 && !disabled && !isAnalyzing && !readOnly

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (canAnalyze) onAnalyze()
    }
  }

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
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
        readOnly={readOnly}
        disabled={disabled && !readOnly}
        className={cn(
          "flex-1 min-h-0 field-sizing-fixed resize-none overflow-y-auto text-sm leading-relaxed",
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
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="gap-1.5 shrink-0"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            Analyze Notes
          </Button>
        )}
      </div>
    </div>
  )
}
