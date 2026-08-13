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
import { cn } from "@/lib/utils"
import {
  CANDIDATE_FORM_DIALOG_FOOTER_CLASS,
  CANDIDATE_FORM_DIALOG_HEADER_CLASS,
  CANDIDATE_FORM_DIALOG_SHELL_CLASS,
} from "@/lib/utils/candidate-form-dialog-layout"

export interface CallNotesExtractReviewRow extends CallNotesExtraction {
  fieldLabel: string
  context?: string
  requiresLookupResolution?: boolean
  requiresLinkedCatalogId?: "employer" | "project"
}

export interface CallNotesExtractApplyPayload {
  selected: CallNotesExtractReviewRow[]
}

interface CallNotesExtractReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: CallNotesExtractReviewRow[]
  /** Read-only notes text sent to extract (frozen at Analyze time). */
  notesSnapshot: string
  isApplying?: boolean
  isReAnalyzing?: boolean
  extractError?: string | null
  onApplySelected: (payload: CallNotesExtractApplyPayload) => void
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
      requiresLookupResolution: meta?.requiresLookupResolution === true,
      requiresLinkedCatalogId: meta?.requiresLinkedCatalogId,
    }
  })
}

export { buildReviewRows }

function CallNotesSnapshotPanel({ notesSnapshot }: { notesSnapshot: string }) {
  return (
    <section
      className="flex min-h-[min(28vh,240px)] min-w-0 flex-col sm:min-h-0 sm:w-1/2 sm:shrink-0 sm:border-r"
      aria-label="Call notes snapshot"
    >
      <h3 className="shrink-0 border-b bg-muted/40 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Call notes
      </h3>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/10 px-5 py-4">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {notesSnapshot.trim() || "—"}
        </p>
      </div>
    </section>
  )
}

function ExtractProposalsList({
  rows,
  selectedPaths,
  busy,
  onTogglePath,
}: {
  rows: CallNotesExtractReviewRow[]
  selectedPaths: Set<string>
  busy: boolean
  onTogglePath: (fieldPath: string, checked: boolean) => void
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        No field proposals to review.
      </p>
    )
  }

  return (
    <ul className="space-y-3 px-5 py-4">
      {rows.map((row) => {
        const checked = selectedPaths.has(row.fieldPath)
        const confidencePct = Math.round(row.confidence * 100)

        return (
          <li
            key={row.fieldPath}
            className="rounded-lg border bg-background p-3 space-y-2"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={`extract-row-${row.fieldPath}`}
                checked={checked}
                onCheckedChange={(v) => onTogglePath(row.fieldPath, v === true)}
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
  )
}

export function CallNotesExtractReviewDialog({
  open,
  onOpenChange,
  rows,
  notesSnapshot,
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
      <DialogContent
        className={cn(
          CANDIDATE_FORM_DIALOG_SHELL_CLASS,
          "min-h-0 gap-0 overflow-hidden",
        )}
      >
        <DialogHeader
          className={cn(CANDIDATE_FORM_DIALOG_HEADER_CLASS, "shrink-0 text-left")}
        >
          <DialogTitle>Review extracted fields</DialogTitle>
          <DialogDescription>
            {hasRows
              ? `${rows.length} proposal${rows.length === 1 ? "" : "s"} from call notes. Compare with the full notes snapshot, uncheck any row you do not want to apply, then link employers and projects in the candidate form after applying.`
              : "No high-confidence values were found for the candidate's currently empty fields."}
          </DialogDescription>
        </DialogHeader>

        {extractError ? (
          <p className="shrink-0 px-6 text-sm text-destructive" role="alert">
            {extractError}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <CallNotesSnapshotPanel notesSnapshot={notesSnapshot} />

          <section className="flex min-h-0 min-w-0 flex-1 flex-col sm:w-1/2">
            <h3 className="shrink-0 border-b bg-muted/40 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Proposals
              {hasRows ? ` (${rows.length})` : ""}
            </h3>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <ExtractProposalsList
                rows={rows}
                selectedPaths={selectedPaths}
                busy={busy}
                onTogglePath={togglePath}
              />
            </div>
          </section>
        </div>

        <DialogFooter
          className={cn(
            CANDIDATE_FORM_DIALOG_FOOTER_CLASS,
            "shrink-0 bg-background sm:flex-row sm:items-center sm:justify-end",
          )}
        >
          <div className="flex flex-wrap justify-end gap-2">
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
              onClick={() =>
                onApplySelected({
                  selected: selectedRows,
                })
              }
              disabled={busy || selectedRows.length === 0}
              className="gap-1.5"
            >
              {isApplying ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Apply Selected
              {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
