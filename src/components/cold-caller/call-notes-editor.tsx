"use client"

import * as React from "react"
import { Loader2, Save, Sparkles, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const PLACEHOLDER = `Enter everything discussed during the call.

Example:
Current salary is 150000. In DPL his tech stacks were .NET and Azure.
At Swipbox he received paid leaves and matrimonial leaves.`

const HELPER_TEXT_SAVED = "Notes are saved for this candidate."
const HELPER_TEXT_DRAFT =
  "Notes are kept locally until you apply to create the candidate."

interface CallNotesEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  /** Draft Cold Caller: replace Save Notes with Apply to Create Candidate. */
  draftMode?: boolean
  onApplyToCreateCandidate?: () => void
  onAnalyzeNotes?: () => void
  isAnalyzing?: boolean
  showAnalyzeButton?: boolean
  analyzeDisabled?: boolean
  analyzeDisabledReason?: string | null
  disabled?: boolean
  isSaving?: boolean
  showDraftSavedHint?: boolean
  readOnly?: boolean
  className?: string
  /** Increment to move focus back to the textarea (e.g. dialog open, extract review closed). */
  focusSignal?: number
}

function isCallNotesEmpty(value: string): boolean {
  return value.trim().length === 0
}

export function CallNotesEditor({
  value,
  onChange,
  onSave,
  draftMode = false,
  onApplyToCreateCandidate,
  onAnalyzeNotes,
  isAnalyzing = false,
  showAnalyzeButton = true,
  analyzeDisabled = false,
  analyzeDisabledReason = null,
  disabled = false,
  isSaving = false,
  showDraftSavedHint = false,
  readOnly = false,
  className,
  focusSignal = 0,
}: CallNotesEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const canFocus = !disabled && !readOnly

  const focusTextarea = React.useCallback(
    (moveCursorToEnd = true) => {
      const el = textareaRef.current
      if (!el || !canFocus) return
      el.focus({ preventScroll: true })
      if (moveCursorToEnd) {
        const len = el.value.length
        el.setSelectionRange(len, len)
      }
    },
    [canFocus],
  )

  React.useEffect(() => {
    if (!canFocus) return
    const frame = requestAnimationFrame(() => focusTextarea())
    return () => cancelAnimationFrame(frame)
  }, [canFocus, focusSignal, focusTextarea])

  React.useEffect(() => {
    if (!canFocus) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const ta = textareaRef.current
      if (!ta) return
      if (document.activeElement === ta) return

      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      ) {
        return
      }
      if (active instanceof HTMLElement && active.isContentEditable) return

      const editorDialog = ta.closest('[role="dialog"]')
      const dialogs = document.querySelectorAll('[role="dialog"]')
      const topDialog = dialogs[dialogs.length - 1] ?? null
      if (topDialog && editorDialog && topDialog !== editorDialog) return

      const isPrintable =
        e.key.length === 1 || e.key === "Enter" || e.key === " "
      if (!isPrintable) return

      e.preventDefault()
      ta.focus()

      const start = ta.selectionStart ?? value.length
      const end = ta.selectionEnd ?? value.length
      const insert = e.key === "Enter" ? "\n" : e.key
      const next = value.slice(0, start) + insert + value.slice(end)
      onChange(next)

      requestAnimationFrame(() => {
        const pos = start + insert.length
        ta.setSelectionRange(pos, pos)
      })
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [canFocus, value, onChange])

  const canSave =
    !isCallNotesEmpty(value) && !disabled && !isSaving && !readOnly

  const analyzeButton = showAnalyzeButton && !readOnly ? (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onAnalyzeNotes?.()}
              disabled={
                disabled ||
                isSaving ||
                isAnalyzing ||
                analyzeDisabled
              }
              className="gap-1.5 shrink-0"
              aria-busy={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              Analyze Notes
            </Button>
          </span>
        </TooltipTrigger>
        {analyzeDisabled && analyzeDisabledReason ? (
          <TooltipContent side="top" className="max-w-xs">
            {analyzeDisabledReason}
          </TooltipContent>
        ) : null}
      </Tooltip>
    </TooltipProvider>
  ) : null

  return (
    <div
      data-call-notes-editor
      className={cn("flex flex-col min-h-0 gap-3 h-full", className)}
    >
      <div className="shrink-0">
        <Label htmlFor="cold-caller-call-notes" className="text-base font-semibold">
          Call Notes
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          {draftMode ? HELPER_TEXT_DRAFT : HELPER_TEXT_SAVED}
        </p>
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
        <div className="text-xs text-muted-foreground min-w-0">
          {readOnly ? (
            <span>Submitted notes (read-only)</span>
          ) : showDraftSavedHint ? (
            <span aria-live="polite">Draft saved locally</span>
          ) : analyzeDisabledReason && showAnalyzeButton ? (
            <span>{analyzeDisabledReason}</span>
          ) : null}
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {analyzeButton}
            {draftMode ? (
              <Button
                type="button"
                onClick={() => onApplyToCreateCandidate?.()}
                disabled={disabled || isSaving || isAnalyzing}
                className="gap-1.5 shrink-0"
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                Apply to Create Candidate
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onSave}
                disabled={!canSave || isAnalyzing}
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
        )}
      </div>
    </div>
  )
}
