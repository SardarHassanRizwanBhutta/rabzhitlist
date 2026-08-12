"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { EmployerCombobox } from "@/components/employer-combobox"
import { ProjectCombobox } from "@/components/project-combobox"
import { CertificationCombobox } from "@/components/certification-combobox"
import type { CandidateFormData } from "@/components/candidate-creation-dialog"
import type { AllowedEmptyField } from "@/types/call-notes-extraction"
import {
  extractedNameFromValue,
  getProjectCreateEmployerHints,
  inferExtractLookupKind,
  parseExtractFieldPath,
  type CallNotesCatalogResolution,
  type CallNotesExtractLookupContext,
} from "@/lib/utils/call-notes-extract-lookup"
import {
  buildEmployerCreatePrefillFromExtractRows,
  buildProjectCreatePrefillFromExtractRows,
} from "@/lib/utils/call-notes-extract-create-prefill"
import type { CallNotesExtractReviewRow } from "./call-notes-extract-review-dialog"

interface CallNotesExtractLookupResolverProps {
  fieldPath: string
  extractedValue: unknown
  resolution: CallNotesCatalogResolution | undefined
  onResolutionChange: (resolution: CallNotesCatalogResolution | undefined) => void
  lookupContext?: CallNotesExtractLookupContext
  formBase: CandidateFormData
  disabled?: boolean
  /** All review rows — used to prefill create dialogs from related catalog extractions. */
  extractRows: CallNotesExtractReviewRow[]
  selectedPaths: ReadonlySet<string>
  allowedEmptyFields: AllowedEmptyField[]
}

export function CallNotesExtractLookupResolver({
  fieldPath,
  extractedValue,
  resolution,
  onResolutionChange,
  lookupContext,
  formBase,
  disabled = false,
  extractRows,
  selectedPaths,
  allowedEmptyFields,
}: CallNotesExtractLookupResolverProps) {
  const kind = inferExtractLookupKind(fieldPath)
  const parsed = parseExtractFieldPath(fieldPath)
  const parsedNameHint = extractedNameFromValue(extractedValue)

  const metaByPath = React.useMemo(
    () => new Map(allowedEmptyFields.map((f) => [f.fieldPath, f])),
    [allowedEmptyFields],
  )

  const employerCreatePrefill = React.useMemo(() => {
    if (kind !== "employer" || !parsed?.workExperienceId) return undefined
    return buildEmployerCreatePrefillFromExtractRows(
      extractRows,
      selectedPaths,
      parsed.workExperienceId,
      metaByPath,
    )
  }, [kind, parsed?.workExperienceId, extractRows, selectedPaths, metaByPath])

  const projectCreatePrefill = React.useMemo(() => {
    if (kind !== "project" || !parsed?.workExperienceId || !parsed.projectId) {
      return undefined
    }
    return buildProjectCreatePrefillFromExtractRows(
      extractRows,
      selectedPaths,
      parsed.workExperienceId,
      parsed.projectId,
      metaByPath,
    )
  }, [kind, parsed?.workExperienceId, parsed?.projectId, extractRows, selectedPaths, metaByPath])

  if (!kind) return null

  const projectHints = getProjectCreateEmployerHints(formBase, parsed?.workExperienceId)

  if (kind === "employer") {
    return (
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Search and select the employer catalog record to link (required before apply).
          Creating a new employer will prefill catalog fields from selected extract rows.
        </p>
        <EmployerCombobox
          label="Catalog employer"
          value={
            resolution?.kind === "employer"
              ? { id: resolution.catalogId, name: resolution.catalogName }
              : null
          }
          onChange={(selected) => {
            if (!selected) {
              onResolutionChange(undefined)
              return
            }
            onResolutionChange({
              kind: "employer",
              catalogId: selected.id,
              catalogName: selected.name,
            })
          }}
          parsedNameHint={parsedNameHint || undefined}
          disabled={disabled}
          createEmployerLookups={lookupContext?.createEmployerLookups}
          nestedEmployerCreation={lookupContext?.nestedEmployerCreation}
          createEmployerPrefill={employerCreatePrefill}
        />
        {resolution?.kind === "employer" ? (
          <ResolvedBadge name={resolution.catalogName} />
        ) : null}
      </div>
    )
  }

  if (kind === "project") {
    return (
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Search and select the project catalog record to link (required before apply).
          Creating a new project will prefill catalog fields from selected extract rows.
        </p>
        <ProjectCombobox
          label="Catalog project"
          value={
            resolution?.kind === "project"
              ? { id: resolution.catalogId, name: resolution.catalogName }
              : null
          }
          onChange={(selected) => {
            if (!selected) {
              onResolutionChange(undefined)
              return
            }
            onResolutionChange({
              kind: "project",
              catalogId: selected.id,
              catalogName: selected.name,
            })
          }}
          parsedNameHint={parsedNameHint || undefined}
          disabled={disabled}
          projectLookups={lookupContext?.projectLookups}
          onCreateTechStack={lookupContext?.onCreateTechStack}
          onCreateTechnicalAspect={lookupContext?.onCreateTechnicalAspect}
          onCreateClientLocation={lookupContext?.onCreateClientLocation}
          createProjectInitialEmployer={projectHints.createProjectInitialEmployer}
          createProjectEmployerNameHint={projectHints.createProjectEmployerNameHint}
          createProjectPrefill={projectCreatePrefill?.formPrefill}
          createProjectEmployerNameHintFromExtract={projectCreatePrefill?.employerNameHint}
        />
        {resolution?.kind === "project" ? (
          <ResolvedBadge name={resolution.catalogName} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <p className="text-xs text-muted-foreground">
        Search and select the certification catalog record to link (required before apply).
      </p>
      <CertificationCombobox
        label="Catalog certification"
        value={
          resolution?.kind === "certification"
            ? {
                id: resolution.catalogId,
                name: resolution.catalogName,
                issuerName: resolution.issuerName ?? null,
              }
            : null
        }
        onChange={(selected) => {
          if (!selected) {
            onResolutionChange(undefined)
            return
          }
          onResolutionChange({
            kind: "certification",
            catalogId: selected.id,
            catalogName: selected.name,
            issuerName: selected.issuerName ?? null,
          })
        }}
        parsedNameHint={parsedNameHint || undefined}
        disabled={disabled}
        issuers={lookupContext?.certificationIssuers}
        issuersLoading={lookupContext?.certificationIssuersLoading}
        onIssuerCreated={lookupContext?.onCertificationIssuerCreated}
      />
      {resolution?.kind === "certification" ? (
        <ResolvedBadge
          name={
            resolution.issuerName?.trim()
              ? `${resolution.catalogName} — ${resolution.issuerName}`
              : resolution.catalogName
          }
        />
      ) : null}
    </div>
  )
}

function ResolvedBadge({ name }: { name: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Linked to catalog: {name}
    </p>
  )
}
