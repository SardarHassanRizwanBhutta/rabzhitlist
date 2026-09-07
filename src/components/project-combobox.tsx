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
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
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
  type CreateProjectOptions,
} from "@/lib/services/projects-api"
import { createClientLocation, type LookupItem } from "@/lib/services/lookups-api"
import { catalogIdStringsToInts } from "@/lib/utils/domain-catalog"
import { resolveLookupIdsByName } from "@/lib/utils/lookup-ids-by-name"
import { toast } from "sonner"

export type SelectedProject = { id: number; name: string } | null

function namesToIds(names: string[], lookup: LookupItem[]): number[] {
  return names
    .map((n) => lookup.find((l) => l.name === n)?.id)
    .filter((id): id is number => id != null)
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
  onCreateClientLocation?: (name: string) => Promise<LookupItem | void>
  /** Prefill catalog fields when opening "+ Add New Project" (e.g. Call Notes extract review). */
  createProjectPrefill?: Partial<ProjectFormData>
  /** Extra employer name hint for project create (from extract project employer row). */
  createProjectEmployerNameHintFromExtract?: string
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
  createProjectPrefill,
  createProjectEmployerNameHintFromExtract,
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

  const selectProject = (proj: { id: number; name: string }) => {
    if (value?.id === proj.id) {
      onChange(null)
    } else {
      onChange({ id: proj.id, name: proj.name })
    }
    handleOpenChange(false)
  }

  const handleCreateProjectSubmit = async (data: ProjectFormData) => {
    const techStacks = projectLookups?.techStacks ?? []
    const clientLocations = projectLookups?.clientLocations ?? []
    const createMissingClientLocation = async (name: string): Promise<LookupItem> => {
      if (onCreateClientLocation) {
        const created = await onCreateClientLocation(name)
        if (created && typeof created.id === "number") return created
        throw new Error(`Failed to create client location "${name}".`)
      }
      return createClientLocation(name)
    }
    const clientLocationIds = await resolveLookupIdsByName(
      data.clientLocations,
      clientLocations,
      createMissingClientLocation,
    )
    const options: CreateProjectOptions = {
      employerId: data.selectedEmployer?.id ?? null,
      techStackIds: namesToIds(data.techStacks, techStacks),
      verticalDomains: catalogIdStringsToInts(data.verticalDomains),
      horizontalDomains: catalogIdStringsToInts(data.horizontalDomains),
      technicalDomains: catalogIdStringsToInts(data.technicalDomains),
      technicalAspects: catalogIdStringsToInts(data.technicalAspects),
      clientLocationIds,
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
    setAddProjectEmployerNameHint(
      createProjectEmployerNameHintFromExtract?.trim() ||
        createProjectEmployerNameHint?.trim() ||
        "",
    )
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
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "h-9 w-full min-w-0 justify-between overflow-hidden font-normal",
              error ? "border-red-500" : "",
            )}
            title={value?.name}
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left",
                value || query || parsedNameHint?.trim()
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {value?.name ||
                query ||
                parsedNameHint?.trim() ||
                "Search projects..."}
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
              {!isLoading && query.trim().length < 2 && !value && (
                <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
              )}
              {!isLoading && query.trim().length < 2 && value && (
                <CommandGroup>
                  <CommandItem
                    value={String(value.id)}
                    onSelect={() => selectProject(value)}
                    className="cursor-pointer"
                  >
                    {value.name}
                    <Check className="ml-auto opacity-100" />
                  </CommandItem>
                </CommandGroup>
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
                      <Check
                        className={cn(
                          "ml-auto",
                          value?.id === proj.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
        initialCreatePrefill={createProjectPrefill}
        lookups={projectLookups}
        onCreateTechStack={onCreateTechStack}
        onCreateTechnicalAspect={onCreateTechnicalAspect}
        onCreateClientLocation={onCreateClientLocation}
        onSubmit={handleCreateProjectSubmit}
      />
    </div>
  )
}
