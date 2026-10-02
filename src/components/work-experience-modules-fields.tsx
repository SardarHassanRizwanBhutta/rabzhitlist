"use client"

import { useState, type ReactNode } from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { useProjectSearch } from "@/hooks/useProjectSearch"
import { useProjectModuleSearch } from "@/hooks/useProjectModuleSearch"
import type { ProjectModuleSearchHit } from "@/lib/types/project-module"

export interface WorkExperienceModuleFormRow {
  id: string
  createNew: boolean
  moduleId: number | null
  projectId: number | null
  projectName: string
  name: string
  description: string
  techStacks: string[]
  contribution: string
}

export function createEmptyModuleRow(): WorkExperienceModuleFormRow {
  return {
    id: crypto.randomUUID(),
    createNew: false,
    moduleId: null,
    projectId: null,
    projectName: "",
    name: "",
    description: "",
    techStacks: [],
    contribution: "",
  }
}

export function isPersistedModuleLink(row: WorkExperienceModuleFormRow): boolean {
  return /^\d+$/.test(row.id) && !row.createNew
}

interface WorkExperienceModulesFieldsProps {
  experienceIndex: number
  modules: WorkExperienceModuleFormRow[]
  disabled?: boolean
  techStackOptions: MultiSelectOption[]
  errors?: { [moduleIndex: number]: Partial<Record<"projectId" | "name" | "moduleId", string>> }
  onChange: (modules: WorkExperienceModuleFormRow[]) => void
  renderVerification: (fieldPath: string) => ReactNode
}

export function WorkExperienceModulesFields({
  experienceIndex,
  modules,
  disabled,
  techStackOptions,
  errors,
  onChange,
  renderVerification,
}: WorkExperienceModulesFieldsProps) {
  const updateRow = (moduleIndex: number, patch: Partial<WorkExperienceModuleFormRow>) => {
    onChange(modules.map((row, index) => (index === moduleIndex ? { ...row, ...patch } : row)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <Label className="px-3 text-sm font-semibold text-muted-foreground">Modules</Label>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...modules, createEmptyModuleRow()])}
          className="flex cursor-pointer items-center gap-1 transition-all duration-150 ease-in-out hover:border-accent hover:bg-accent/50"
        >
          <Plus className="h-3 w-3" />
          Add Module
        </Button>
      </div>
      {modules.map((row, moduleIndex) => {
        const persisted = isPersistedModuleLink(row)
        const sharedReadOnly = persisted || (!row.createNew && row.moduleId != null)
        const rowErrors = errors?.[moduleIndex]
        const linkedModuleIds = modules
          .filter((item, index) => index !== moduleIndex && item.moduleId != null)
          .map((item) => item.moduleId as number)
        return (
          <div
            key={row.id}
            className="relative rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Module {moduleIndex + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(modules.filter((_, index) => index !== moduleIndex))}
                className="h-6 w-6 cursor-pointer p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-3">
              <MainProjectField
                row={row}
                disabled={disabled || persisted}
                error={rowErrors?.projectId}
                onSelect={(projectId, projectName) =>
                  updateRow(moduleIndex, {
                    projectId,
                    projectName,
                    moduleId: null,
                    name: row.createNew ? row.name : "",
                    description: row.createNew ? row.description : "",
                    techStacks: row.createNew ? row.techStacks : [],
                  })
                }
              />
              {renderVerification(
                `workExperiences.${experienceIndex}.modules.${moduleIndex}.projectId`,
              )}
              {row.projectId != null && !persisted && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={row.createNew ? "outline" : "default"}
                    className="cursor-pointer"
                    onClick={() =>
                      updateRow(moduleIndex, {
                        createNew: false,
                        moduleId: null,
                        name: "",
                        description: "",
                        techStacks: [],
                      })
                    }
                  >
                    Link existing
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={row.createNew ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      updateRow(moduleIndex, {
                        createNew: true,
                        moduleId: null,
                        name: "",
                        description: "",
                        techStacks: [],
                      })
                    }
                  >
                    Create module
                  </Button>
                </div>
              )}
              {row.projectId != null && !row.createNew && !persisted && (
                <ModulePicker
                  projectId={row.projectId}
                  selectedName={row.name}
                  excludeIds={linkedModuleIds}
                  disabled={disabled}
                  error={rowErrors?.moduleId}
                  onSelect={(hit) =>
                    updateRow(moduleIndex, {
                      moduleId: hit.id,
                      name: hit.name,
                      description: hit.description ?? "",
                      techStacks: hit.techStacks,
                    })
                  }
                />
              )}
              {(row.createNew || persisted || row.moduleId != null) && row.projectId != null && (
                <>
                  <div className="space-y-2">
                    <Label>Name{row.createNew ? " *" : ""}</Label>
                    <Input
                      value={row.name}
                      disabled={disabled || sharedReadOnly}
                      placeholder="Module name"
                      onChange={(event) => updateRow(moduleIndex, { name: event.target.value })}
                    />
                    {rowErrors?.name && <p className="text-sm text-red-500">{rowErrors.name}</p>}
                    {row.createNew &&
                      renderVerification(
                        `workExperiences.${experienceIndex}.modules.${moduleIndex}.name`,
                      )}
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={row.description}
                      disabled={disabled || sharedReadOnly}
                      placeholder="What this module covers"
                      className="min-h-[80px] resize-none"
                      onChange={(event) =>
                        updateRow(moduleIndex, { description: event.target.value })
                      }
                    />
                    {row.createNew &&
                      renderVerification(
                        `workExperiences.${experienceIndex}.modules.${moduleIndex}.description`,
                      )}
                  </div>
                  <div className="space-y-2">
                    <MultiSelect
                      label="Tech Stacks"
                      items={techStackOptions}
                      selected={row.techStacks}
                      disabled={disabled || sharedReadOnly}
                      placeholder="Select technologies..."
                      searchPlaceholder="Search technologies..."
                      onChange={(techStacks) => updateRow(moduleIndex, { techStacks })}
                    />
                    {row.createNew &&
                      renderVerification(
                        `workExperiences.${experienceIndex}.modules.${moduleIndex}.techStacks`,
                      )}
                  </div>
                </>
              )}
              {row.projectId != null && (row.createNew || row.moduleId != null || persisted) && (
                <div className="space-y-2">
                  <Label>Contribution</Label>
                  <Textarea
                    value={row.contribution}
                    disabled={disabled}
                    placeholder="What this candidate contributed to the module"
                    className="min-h-[80px] resize-none"
                    onChange={(event) =>
                      updateRow(moduleIndex, { contribution: event.target.value })
                    }
                  />
                  {renderVerification(
                    `workExperiences.${experienceIndex}.modules.${moduleIndex}.contribution`,
                  )}
                </div>
              )}
              {!row.createNew &&
                renderVerification(
                  `workExperiences.${experienceIndex}.modules.${moduleIndex}.moduleId`,
                )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MainProjectField({
  row,
  disabled,
  error,
  onSelect,
}: {
  row: WorkExperienceModuleFormRow
  disabled?: boolean
  error?: string
  onSelect: (projectId: number, projectName: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, isLoading: loading } = useProjectSearch()
  return (
    <div className="space-y-2">
      <Label>Main project *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full cursor-pointer justify-between font-normal"
          >
            <span className={row.projectName ? "" : "text-muted-foreground"}>
              {row.projectName || "Select a project"}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search projects..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
              )}
              {!loading && query.trim().length < 2 && (
                <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
              )}
              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No projects found
                </div>
              )}
              {!loading && results.length > 0 && (
                <CommandGroup>
                  {results.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={String(project.id)}
                      className="cursor-pointer"
                      onSelect={() => {
                        onSelect(project.id, project.name)
                        setOpen(false)
                      }}
                    >
                      {project.name}
                      {row.projectId === project.id ? (
                        <Check className="ml-auto h-4 w-4" />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

function ModulePicker({
  projectId,
  selectedName,
  excludeIds,
  disabled,
  error,
  onSelect,
}: {
  projectId: number
  selectedName: string
  excludeIds: number[]
  disabled?: boolean
  error?: string
  onSelect: (hit: ProjectModuleSearchHit) => void
}) {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, loading } = useProjectModuleSearch(projectId)
  const visible = results.filter((hit) => !excludeIds.includes(hit.id))
  return (
    <div className="space-y-2">
      <Label>Module *</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full cursor-pointer justify-between font-normal"
          >
            <span className={selectedName ? "" : "text-muted-foreground"}>
              {selectedName || "Search modules"}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search modules..." value={query} onValueChange={setQuery} />
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
              )}
              {!loading && query.trim().length < 2 && (
                <div className="py-6 text-center text-sm text-muted-foreground">Type to search</div>
              )}
              {!loading && query.trim().length >= 2 && visible.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No modules found
                </div>
              )}
              {!loading && visible.length > 0 && (
                <CommandGroup>
                  {visible.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={String(hit.id)}
                      className="cursor-pointer"
                      onSelect={() => {
                        onSelect(hit)
                        setOpen(false)
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block">{hit.name}</span>
                        {hit.description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {hit.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
