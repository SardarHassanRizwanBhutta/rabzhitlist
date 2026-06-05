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
import { useProjectSearch } from "@/hooks/useProjectSearch"
import {
  ProjectCreationDialog,
  type ProjectFormData,
  type ProjectLookups,
  type SelectedEmployer,
} from "@/components/project-creation-dialog"
import {
  buildCreateProjectDto,
  createProject,
  horizontalDomainLabelToInt,
  technicalDomainLabelToInt,
  verticalDomainLabelToInt,
  type CreateProjectOptions,
} from "@/lib/services/projects-api"
import type { LookupItem } from "@/lib/services/lookups-api"
import { toast } from "sonner"

export type SelectedProject = { id: number; name: string } | null

function namesToIds(names: string[], lookup: LookupItem[]): number[] {
  return names
    .map((n) => lookup.find((l) => l.name === n)?.id)
    .filter((id): id is number => id != null)
}

function labelsToInts(labels: string[], toInt: (label: string) => number | undefined): number[] {
  return labels.map(toInt).filter((v): v is number => v != null)
}

export interface ProjectComboboxProps {
  id?: string
  label?: string
  value: SelectedProject
  onChange: (project: SelectedProject) => void
  disabled?: boolean
  className?: string
  error?: boolean
  /** Resume import: seed search when opening with no linked project yet. */
  parsedNameHint?: string
  /**
   * Create Candidate — work-experience project row: pre-select employer on Create Project
   * when parent WE employer is already linked.
   */
  createProjectInitialEmployer?: SelectedEmployer
  /**
   * Create Candidate — work-experience project row: seed employer search when parent WE
   * has a parsed name but no employerId yet.
   */
  createProjectEmployerNameHint?: string
  /** Lookups for ProjectCreationDialog and create payload mapping. */
  projectLookups?: ProjectLookups
  onCreateTechStack?: (name: string, context?: { aspectTypeId: number }) => Promise<void>
  onCreateTechnicalAspect?: (name: string) => Promise<void>
  onCreateClientLocation?: (name: string) => Promise<void>
}

export function ProjectCombobox({
  id,
  label = "Project",
  value,
  onChange,
  disabled = false,
  className,
  error = false,
  parsedNameHint,
  createProjectInitialEmployer,
  createProjectEmployerNameHint,
  projectLookups,
  onCreateTechStack,
  onCreateTechnicalAspect,
  onCreateClientLocation,
}: ProjectComboboxProps) {
  const [open, setOpen] = useState(false)
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [addProjectInitialName, setAddProjectInitialName] = useState("")
  const [addProjectInitialEmployer, setAddProjectInitialEmployer] = useState<SelectedEmployer>(null)
  const [addProjectEmployerNameHint, setAddProjectEmployerNameHint] = useState("")
  const { query, setQuery, results, isLoading, resetSearch } = useProjectSearch()
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

  const selectProject = (proj: { id: number; name: string }) => {
    onChange({ id: proj.id, name: proj.name })
    handleOpenChange(false)
  }

  const handleCreateProjectSubmit = async (data: ProjectFormData) => {
    const techStacks = projectLookups?.techStacks ?? []
    const technicalAspects = projectLookups?.technicalAspects ?? []
    const clientLocations = projectLookups?.clientLocations ?? []
    const options: CreateProjectOptions = {
      employerId: data.selectedEmployer?.id ?? null,
      techStackIds: namesToIds(data.techStacks, techStacks),
      verticalDomains: labelsToInts(data.verticalDomains, verticalDomainLabelToInt),
      horizontalDomains: labelsToInts(data.horizontalDomains, horizontalDomainLabelToInt),
      technicalDomains: labelsToInts(data.technicalDomains, technicalDomainLabelToInt),
      technicalAspects: namesToIds(data.technicalAspects, technicalAspects),
      clientLocationIds: namesToIds(data.clientLocations, clientLocations),
    }
    const body = buildCreateProjectDto(data, options)
    const created = await createProject(body)
    selectProject({ id: created.id, name: created.name })
    setAddProjectOpen(false)
    setAddProjectInitialName("")
    setAddProjectInitialEmployer(null)
    setAddProjectEmployerNameHint("")
    resetSearch()
    toast.success(`Project "${created.name}" created successfully.`)
  }

  const openCreateProjectDialog = () => {
    setAddProjectInitialName(query.trim())
    setAddProjectInitialEmployer(createProjectInitialEmployer ?? null)
    setAddProjectEmployerNameHint(createProjectEmployerNameHint?.trim() ?? "")
    handleOpenChange(false)
    setAddProjectOpen(true)
  }

  const closeCreateProjectDialog = () => {
    setAddProjectOpen(false)
    setAddProjectInitialName("")
    setAddProjectInitialEmployer(null)
    setAddProjectEmployerNameHint("")
  }

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {label ? (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}
      {value ? (
        <div
          className={`flex items-center gap-1 border rounded-md bg-background px-3 py-2 min-h-9 w-full ${error ? "border-red-500" : ""}`}
        >
          <span className="flex-1 truncate">{value.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            disabled={disabled}
            onClick={clearSelection}
            aria-label="Clear project"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              disabled={disabled}
              className={`w-full justify-between font-normal ${error ? "border-red-500" : ""}`}
            >
              <span
                className={
                  query || (!value && parsedNameHint?.trim())
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                {query || (!value && parsedNameHint?.trim()) || "Search projects..."}
              </span>
              <ChevronsUpDown className="opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search projects..."
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
                      No projects found
                    </div>
                    <CommandItem
                      value="__create_new_project__"
                      onSelect={openCreateProjectDialog}
                      className="cursor-pointer font-medium text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Project
                    </CommandItem>
                  </CommandGroup>
                )}
                {!isLoading && results.length > 0 && (
                  <CommandGroup>
                    {results.map((proj) => (
                      <CommandItem
                        key={proj.id}
                        value={String(proj.id)}
                        onSelect={() => selectProject(proj)}
                        className="cursor-pointer"
                      >
                        {proj.name}
                        <Check className="ml-auto opacity-100" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      <ProjectCreationDialog
        mode="create"
        showVerification={false}
        open={addProjectOpen}
        onOpenChange={(next) => {
          if (!next) closeCreateProjectDialog()
          else setAddProjectOpen(true)
        }}
        initialName={addProjectInitialName}
        initialSelectedEmployer={addProjectInitialEmployer}
        initialEmployerNameHint={addProjectEmployerNameHint || undefined}
        lookups={projectLookups}
        onCreateTechStack={onCreateTechStack}
        onCreateTechnicalAspect={onCreateTechnicalAspect}
        onCreateClientLocation={onCreateClientLocation}
        onSubmit={handleCreateProjectSubmit}
      />
    </div>
  )
}
