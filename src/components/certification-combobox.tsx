"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { useCertificationSearch } from "@/hooks/useCertificationSearch"
import {
  CertificationCreationDialog,
  type CertificationFormData,
} from "@/components/certification-creation-dialog"
import { createCertification } from "@/lib/services/certifications-api"
import { searchCertifications } from "@/lib/services/certifications-lookup-api"
import type { CertificationIssuer } from "@/lib/types/certification"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type SelectedCertification = {
  id: number
  name: string
  issuerName?: string | null
} | null

export interface CertificationComboboxProps {
  id?: string
  label?: string
  value: SelectedCertification
  onChange: (certification: SelectedCertification) => void
  disabled?: boolean
  className?: string
  error?: boolean
  /** Resume import: seed certification search when opening with no linked catalog row yet. */
  parsedNameHint?: string
  /** Resume import: prefill Issuing Body on Create New Certification. */
  parsedIssuerHint?: string
  /** Resume import: prefill website on Create New Issuer (from `issuing_body_url`). */
  parsedIssuerWebsiteHint?: string
  issuers?: CertificationIssuer[]
  issuersLoading?: boolean
  onIssuerCreated?: (issuer: CertificationIssuer) => void
}

export function CertificationCombobox({
  id,
  label = "Certification",
  value,
  onChange,
  disabled = false,
  className,
  error = false,
  parsedNameHint,
  parsedIssuerHint,
  parsedIssuerWebsiteHint,
  issuers = [],
  issuersLoading = false,
  onIssuerCreated,
}: CertificationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [addCertOpen, setAddCertOpen] = useState(false)
  const [addCertInitialName, setAddCertInitialName] = useState("")
  const [addCertInitialIssuer, setAddCertInitialIssuer] = useState("")
  const [addCertInitialIssuerWebsite, setAddCertInitialIssuerWebsite] = useState("")
  const { query, setQuery, results, isLoading, resetSearch } = useCertificationSearch()
  const prevOpenRef = React.useRef(false)

  React.useEffect(() => {
    if (open && !prevOpenRef.current && parsedNameHint?.trim() && !value) {
      setQuery(parsedNameHint.trim())
    }
    prevOpenRef.current = open
  }, [open, parsedNameHint, value, setQuery])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      resetSearch()
    }
  }

  const clearSelection = () => {
    onChange(null)
    resetSearch()
  }

  const selectCertification = (c: {
    id: number
    name: string
    issuerName: string | null
  }) => {
    onChange({
      id: c.id,
      name: c.name,
      issuerName: c.issuerName ?? null,
    })
    handleOpenChange(false)
  }

  const openCreateCertificationDialog = (nameFromQuery: string) => {
    const name = nameFromQuery.trim() || parsedNameHint?.trim() || ""
    setAddCertInitialName(name)
    setAddCertInitialIssuer(parsedIssuerHint?.trim() || "")
    setAddCertInitialIssuerWebsite(parsedIssuerWebsiteHint?.trim() || "")
    handleOpenChange(false)
    setAddCertOpen(true)
  }

  const handleCreateCertificationSubmit = async (data: CertificationFormData) => {
    if (!data.issuerId) {
      toast.error("Select or create an issuing body before saving the certification.")
      return
    }
    await createCertification({
      name: data.certificationName.trim(),
      issuerId: data.issuerId,
    })
    const list = await searchCertifications(data.certificationName.trim(), 10)
    const normalized = data.certificationName.trim().toLowerCase()
    const match =
      list.find((c) => c.name.trim().toLowerCase() === normalized) ?? list[0]
    if (!match) {
      toast.success(`Certification "${data.certificationName}" created. Search again to link it.`)
      setAddCertOpen(false)
      resetCreateCertState()
      return
    }
    selectCertification({
      id: match.id,
      name: match.name,
      issuerName: match.issuerName,
    })
    setAddCertOpen(false)
    resetCreateCertState()
    toast.success(`Certification "${match.name}" created and linked.`)
  }

  const resetCreateCertState = () => {
    setAddCertInitialName("")
    setAddCertInitialIssuer("")
    setAddCertInitialIssuerWebsite("")
  }

  const resumeIssuerHint =
    !value && parsedIssuerHint?.trim() ? parsedIssuerHint.trim() : null

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}
      {value ? (
        <div className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-1 border rounded-md bg-background px-3 py-2 min-h-9",
              error ? "border-red-500" : ""
            )}
          >
            <span className="flex-1 truncate">{value.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={disabled}
              onClick={clearSelection}
              aria-label="Clear certification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {value.issuerName ? (
            <p className="text-sm text-muted-foreground pl-0.5" aria-live="polite">
              {value.issuerName}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                disabled={disabled}
                className={cn(
                  "w-full justify-between font-normal",
                  error ? "border-red-500" : ""
                )}
              >
                <span
                  className={
                    query || (!value && parsedNameHint?.trim())
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {query || (!value && parsedNameHint?.trim()) || "Search certifications..."}
                </span>
                <ChevronsUpDown className="opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] min-w-[min(100vw-2rem,24rem)] p-0"
              align="start"
            >
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search certifications..."
                  value={query}
                  onValueChange={setQuery}
                  className="h-9"
                />
                <CommandList>
                  {isLoading && (
                    <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
                  )}
                  {!isLoading && query.trim().length < 2 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
                  )}
                  {!isLoading && query.trim().length >= 2 && results.length === 0 && (
                    <CommandGroup>
                      <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                        No certifications found
                      </div>
                      <CommandItem
                        value="__create_new_certification__"
                        onSelect={() => openCreateCertificationDialog(query.trim())}
                        className="cursor-pointer font-medium text-primary"
                      >
                        <Plus className="mr-2 h-4 w-4 shrink-0" />
                        <span className="flex flex-col items-start leading-tight">
                          <span>+ Create New</span>
                          <span>Certification</span>
                        </span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {!isLoading && results.length > 0 && (
                    <CommandGroup>
                      {results.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={String(c.id)}
                          onSelect={() => selectCertification(c)}
                          className="cursor-pointer items-start py-2"
                        >
                          <div className="flex flex-1 flex-col gap-0.5 items-start min-w-0 pr-2">
                            <span className="font-medium leading-tight">{c.name}</span>
                            {c.issuerName ? (
                              <span className="text-xs text-muted-foreground leading-tight">
                                {c.issuerName}
                              </span>
                            ) : null}
                          </div>
                          <Check className="h-4 w-4 shrink-0 opacity-100 mt-0.5" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {resumeIssuerHint ? (
            <p className="text-xs text-muted-foreground pl-0.5">
              Issuing body (from resume): {resumeIssuerHint}
            </p>
          ) : null}
        </>
      )}

      <CertificationCreationDialog
        mode="create"
        showVerification={false}
        open={addCertOpen}
        onOpenChange={(next) => {
          setAddCertOpen(next)
          if (!next) resetCreateCertState()
        }}
        initialName={addCertInitialName}
        initialIssuerName={addCertInitialIssuer}
        initialIssuerWebsiteUrl={addCertInitialIssuerWebsite}
        issuers={issuers}
        issuersLoading={issuersLoading}
        onIssuerCreated={onIssuerCreated}
        onSubmit={handleCreateCertificationSubmit}
      />
    </div>
  )
}
