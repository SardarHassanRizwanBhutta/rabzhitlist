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
import {
  hasUnresolvedCheckedLookupRows,
  type CallNotesCatalogResolution,
  type CallNotesExtractLookupContext,
} from "@/lib/utils/call-notes-extract-lookup"
import { hasUnresolvedCheckedCatalogIdRows } from "@/lib/utils/call-notes-extract-catalog"
import type { CandidateFormData } from "@/components/candidate-creation-dialog"
import { CallNotesExtractLookupResolver } from "./call-notes-extract-lookup-resolver"

export interface CallNotesExtractReviewRow extends CallNotesExtraction {
  fieldLabel: string
  context?: string
  requiresLookupResolution?: boolean
  requiresLinkedCatalogId?: "employer" | "project"
}

export interface CallNotesExtractApplyPayload {
  selected: CallNotesExtractReviewRow[]
  lookupResolutions?: Map<string, CallNotesCatalogResolution>
}

interface CallNotesExtractReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: CallNotesExtractReviewRow[]
  allowedEmptyFields: AllowedEmptyField[]
  /** Required when catalog linking happens in the review dialog (saved-candidate edit flow). */
  formBase?: CandidateFormData
  lookupContext?: CallNotesExtractLookupContext
  /**
   * Draft Auto-Profiler flow: apply names + catalog values without linking here;
   * user links in Create Candidate (same as resume import).
   */
  deferCatalogLinking?: boolean
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

export function CallNotesExtractReviewDialog({
  open,
  onOpenChange,
  rows,
  allowedEmptyFields,
  formBase,
  lookupContext,
  deferCatalogLinking = false,
  isApplying = false,
  isReAnalyzing = false,
  extractError = null,
  onApplySelected,
  onAnalyzeAgain,
}: CallNotesExtractReviewDialogProps) {
  const [selectedPaths, setSelectedPaths] = React.useState<Set<string>>(
    () => new Set(rows.map((r) => r.fieldPath)),
  )
  const [lookupResolutions, setLookupResolutions] = React.useState<
    Map<string, CallNotesCatalogResolution>
  >(() => new Map())

  React.useEffect(() => {
    if (open) {
      setSelectedPaths(new Set(rows.map((r) => r.fieldPath)))
      setLookupResolutions(new Map())
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

  const setResolutionForPath = (
    fieldPath: string,
    resolution: CallNotesCatalogResolution | undefined,
  ) => {
    setLookupResolutions((prev) => {
      const next = new Map(prev)
      if (resolution) next.set(fieldPath, resolution)
      else next.delete(fieldPath)
      return next
    })
  }

  const selectedRows = rows.filter((r) => selectedPaths.has(r.fieldPath))
  const hasRows = rows.length > 0
  const busy = isApplying || isReAnalyzing

  const hasUnresolvedLookups =
    !deferCatalogLinking &&
    hasUnresolvedCheckedLookupRows(selectedPaths, rows, lookupResolutions)
  const hasUnresolvedCatalogIds =
    !deferCatalogLinking &&
    formBase != null &&
    hasUnresolvedCheckedCatalogIdRows(
      selectedPaths,
      rows,
      formBase,
      lookupResolutions,
    )
  const applyBlocked = hasUnresolvedLookups || hasUnresolvedCatalogIds

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] min-h-0 max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Review extracted fields</DialogTitle>
          <DialogDescription>
            {hasRows
              ? `${rows.length} proposal${rows.length === 1 ? "" : "s"} from call notes. Uncheck any row you do not want to apply. Link employers and projects in the candidate form after applying.`
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
                const resolution = lookupResolutions.get(row.fieldPath)
                const needsLookup =
                  !deferCatalogLinking && row.requiresLookupResolution === true
                const lookupPending = needsLookup && checked && !resolution

                return (
                  <li
                    key={row.fieldPath}
                    className={`rounded-lg border p-3 space-y-2 ${
                      lookupPending ? "border-amber-500/60" : ""
                    }`}
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
                        {needsLookup && checked && formBase ? (
                          <CallNotesExtractLookupResolver
                            fieldPath={row.fieldPath}
                            extractedValue={row.value}
                            resolution={resolution}
                            onResolutionChange={(next) =>
                              setResolutionForPath(row.fieldPath, next)
                            }
                            lookupContext={lookupContext}
                            formBase={formBase}
                            disabled={busy}
                            extractRows={rows}
                            selectedPaths={selectedPaths}
                            allowedEmptyFields={allowedEmptyFields}
                          />
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 flex-col items-stretch gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
          {applyBlocked ? (
            <p
              className="text-xs text-amber-700 dark:text-amber-400 sm:mr-auto sm:max-w-[55%]"
              role="status"
            >
              {hasUnresolvedLookups
                ? "Resolve all selected employer, project, and certification lookups before applying, or uncheck those rows."
                : "Link employer and project catalog records (resolve name lookups or select existing IDs) before applying catalog fields, or uncheck those rows."}
            </p>
          ) : null}
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
                  lookupResolutions: deferCatalogLinking
                    ? undefined
                    : lookupResolutions,
                })
              }
              disabled={busy || selectedRows.length === 0 || applyBlocked}
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
