"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { EmployerCombobox } from "@/components/employer-combobox"
import { ProjectCombobox } from "@/components/project-combobox"
import { CertificationCombobox } from "@/components/certification-combobox"
import type { CandidateFormData } from "@/components/candidate-creation-dialog"
import {
  extractedNameFromValue,
  getProjectCreateEmployerHints,
  inferExtractLookupKind,
  parseExtractFieldPath,
  type CallNotesCatalogResolution,
  type CallNotesExtractLookupContext,
} from "@/lib/utils/call-notes-extract-lookup"

interface CallNotesExtractLookupResolverProps {
  fieldPath: string
  extractedValue: unknown
  resolution: CallNotesCatalogResolution | undefined
  onResolutionChange: (resolution: CallNotesCatalogResolution | undefined) => void
  lookupContext?: CallNotesExtractLookupContext
  formBase: CandidateFormData
  disabled?: boolean
}

export function CallNotesExtractLookupResolver({
  fieldPath,
  extractedValue,
  resolution,
  onResolutionChange,
  lookupContext,
  formBase,
  disabled = false,
}: CallNotesExtractLookupResolverProps) {
  const kind = inferExtractLookupKind(fieldPath)
  const parsed = parseExtractFieldPath(fieldPath)
  const parsedNameHint = extractedNameFromValue(extractedValue)

  if (!kind) return null

  const projectHints = getProjectCreateEmployerHints(formBase, parsed?.workExperienceId)

  if (kind === "employer") {
    return (
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Search and select the employer catalog record to link (required before apply).
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
