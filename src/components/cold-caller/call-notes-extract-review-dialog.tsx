"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  AllowedEmptyField,
  CallNotesExtraction,
} from "@/types/call-notes-extraction"
import { formatQgDisplayValue } from "@/lib/utils/qg-value"

export interface CallNotesExtractReviewRow extends CallNotesExtraction {
  fieldLabel: string
  context?: string
}

interface CallNotesExtractReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: CallNotesExtractReviewRow[]
  isApplying?: boolean
  isReAnalyzing?: boolean
  extractError?: string | null
  onApplySelected: (selected: CallNotesExtractReviewRow[]) => void
  onAnalyzeAgain: () => void
}

function buildReviewRows(
  extractions: CallNotesExtraction[],
  allowedEmptyFields: AllowedEmptyField[],
): CallNotesExtractReviewRow[] {
  const labelByPath = new Map(
    allowedEmptyFields.map((f) => [f.fieldPath, f]),
  )
  return extractions.map((extraction) => {
    const meta = labelByPath.get(extraction.fieldPath)
    return {
      ...extraction,
      fieldLabel: meta?.fieldLabel ?? extraction.fieldPath,
      context: meta?.context,
    }
  })
}

export { buildReviewRows }

export function CallNotesExtractReviewDialog({
  open,
  onOpenChange,
  rows,
  isApplying = false,
  isReAnalyzing = false,
  extractError = null,
  onApplySelected,
  onAnalyzeAgain,
}: CallNotesExtractReviewDialogProps) {
  const [selectedPaths, setSelectedPaths] = React.useState<Set<string>>(
    () => new Set(rows.map((r) => r.fieldPath)),
  )

  React.useEffect(() => {
    if (open) {
      setSelectedPaths(new Set(rows.map((r) => r.fieldPath)))
    }
  }, [open, rows])

  const togglePath = (fieldPath: string, checked: boolean) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (checked) next.add(fieldPath)
      else next.delete(fieldPath)
      return next
    })
  }

  const selectedRows = rows.filter((r) => selectedPaths.has(r.fieldPath))
  const hasRows = rows.length > 0
  const busy = isApplying || isReAnalyzing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] min-h-0 max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Review extracted fields</DialogTitle>
          <DialogDescription>
            {hasRows
              ? `${rows.length} proposal${rows.length === 1 ? "" : "s"} from call notes. Uncheck any row you do not want to apply.`
              : "No high-confidence values were found for the candidate's currently empty fields."}
          </DialogDescription>
        </DialogHeader>

        {extractError ? (
          <p className="shrink-0 px-6 text-sm text-destructive" role="alert">
            {extractError}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-6">
          {hasRows ? (
            <ul className="space-y-3 py-1 pb-4">
              {rows.map((row) => {
                const checked = selectedPaths.has(row.fieldPath)
                const confidencePct = Math.round(row.confidence * 100)
                return (
                  <li
                    key={row.fieldPath}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`extract-row-${row.fieldPath}`}
                        checked={checked}
                        onCheckedChange={(v) =>
                          togglePath(row.fieldPath, v === true)
                        }
                        disabled={busy}
                        aria-label={`Apply ${row.fieldLabel}`}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <label
                          htmlFor={`extract-row-${row.fieldPath}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {row.fieldLabel}
                          {row.context ? (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              — {row.context}
                            </span>
                          ) : null}
                        </label>
                        <p className="text-sm font-semibold break-words">
                          {formatQgDisplayValue(row.value)}
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          &ldquo;{row.sourceText}&rdquo;
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Confidence: {confidencePct}%
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onAnalyzeAgain}
            disabled={busy}
            className="gap-1.5"
          >
            {isReAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Analyze again
          </Button>
          <Button
            type="button"
            onClick={() => onApplySelected(selectedRows)}
            disabled={busy || selectedRows.length === 0}
            className="gap-1.5"
          >
            {isApplying ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Apply Selected
            {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
