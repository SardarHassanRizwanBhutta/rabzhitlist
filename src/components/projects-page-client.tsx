"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Globe, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectsTable } from "@/components/projects-table"
import { ProjectCreationDialog, ProjectFormData, ProjectVerificationState } from "@/components/project-creation-dialog"
import { toast } from "sonner"
import { ProjectsFilterDialog, ProjectFilters } from "@/components/projects-filter-dialog"
import { useGlobalFilters } from "@/contexts/global-filter-context"
import { getGlobalFilterCount } from "@/lib/types/global-filters"
import type { Project } from "@/lib/types/project"
import {
  fetchProjectsFiltered,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject,
  projectListItemDtoToProject,
  projectDtoToProject,
  buildFetchProjectsParams,
  buildCreateProjectDto,
  buildUpdateProjectDto,
  VERTICAL_DOMAINS,
  HORIZONTAL_DOMAINS,
  verticalDomainLabelToInt,
  horizontalDomainLabelToInt,
  technicalDomainLabelToInt,
  ensureTechnicalDomainsCatalogLoaded,
  technicalDomainCatalogToSelectOptions,
  type CreateProjectOptions,
} from "@/lib/services/projects-api"
import type { LookupItem } from "@/lib/services/lookups-api"
import {
  fetchTechStacks,
  fetchTechnicalAspects,
  fetchTechnicalAspectTypes,
  fetchClientLocations,
  createTechStack,
  createTechnicalAspect,
  createClientLocation,
} from "@/lib/services/lookups-api"
import type { MultiSelectOption } from "@/components/ui/multi-select"

const DEFAULT_PAGE_SIZE = 20

const initialFilters: ProjectFilters = {
  status: [],
  projectTypes: [],
  employers: [],
  clientLocations: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalDomains: [],
  technicalAspects: [],
  technicalAspectTypeIds: [],
  techStacks: [],
  completionDateStart: null,
  completionDateEnd: null,
  startEndDateStart: null,
  startEndDateEnd: null,
  startDateStart: null,
  startDateEnd: null,
  teamSizeMin: "",
  teamSizeMax: "",
  projectName: "",
  projectLink: "",
  isPublished: null,
  publishPlatforms: [],
  minDownloadCount: "",
}

function namesToIds(names: string[], lookup: LookupItem[]): number[] {
  return names
    .map((n) => lookup.find((l) => l.name === n)?.id)
    .filter((id): id is number => id != null)
}

function labelsToInts(labels: string[], toInt: (label: string) => number | undefined): number[] {
  return labels.map(toInt).filter((v): v is number => v != null)
}

/**
 * Resolve UI aspect names to `TechnicalAspect` enum ints for the project
 * create/update body.
 *
 * NOTE: `data.technicalAspectTypeIds` (from GET /api/TechnicalAspectTypes) are
 * deliberately NOT merged here. That catalog is a separate enum used purely to
 * scope the tech-stack picker in the UI — it is not a persisted field on
 * `Project`. Sending those ids in `technicalAspects` causes 500s when a catalog
 * id falls outside the `TechnicalAspect` enum range (e.g. id 25 when the enum
 * tops out at 24).
 *
 * The legacy lookup at GET /api/technicalaspects is the authoritative source
 * for valid `TechnicalAspect` ints; `legacyLookup[i].id` IS the enum ordinal.
 */
function technicalAspectEnumsForProjectBody(
  legacyAspectNames: string[],
  legacyLookup: LookupItem[]
): number[] {
  return [...new Set(namesToIds(legacyAspectNames, legacyLookup))]
}

export function ProjectsPageClient() {
  const { filters: globalFilters, isActive: hasGlobalFilters } = useGlobalFilters()
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)

  // Lookup data for dropdowns (prefetched on mount)
  const [techStacksLookup, setTechStacksLookup] = useState<LookupItem[]>([])
  const [technicalAspectsLookup, setTechnicalAspectsLookup] = useState<LookupItem[]>([])
  const [clientLocationsLookup, setClientLocationsLookup] = useState<LookupItem[]>([])
  const [technicalDomainSelectOptions, setTechnicalDomainSelectOptions] = useState<MultiSelectOption[]>([])
  const [technicalAspectTypeSelectOptions, setTechnicalAspectTypeSelectOptions] = useState<MultiSelectOption[]>([])

  // Resolve filter names/labels to IDs/integers for server-side filtering.
  // `technicalAspectTypeIds` is NOT included here: it's a different enum
  // (TechnicalAspectType catalog) used only to scope the tech-stack picker;
  // GET /api/projects does not accept it, and merging its ids into
  // `technicalAspects` causes 500s when an id falls outside the
  // `TechnicalAspect` enum range.
  const filterIds = useMemo(() => {
    const technicalAspectEnumValues = [
      ...new Set(namesToIds(filters.technicalAspects, technicalAspectsLookup)),
    ]
    return {
      techStackIds: namesToIds(filters.techStacks, techStacksLookup),
      verticalDomains: labelsToInts(filters.verticalDomains, verticalDomainLabelToInt),
      horizontalDomains: labelsToInts(filters.horizontalDomains, horizontalDomainLabelToInt),
      technicalDomains: labelsToInts(filters.technicalDomains, technicalDomainLabelToInt),
      technicalAspectEnumValues,
      clientLocationIds: namesToIds(filters.clientLocations, clientLocationsLookup),
    }
  }, [
    filters.techStacks,
    filters.verticalDomains,
    filters.horizontalDomains,
    filters.technicalDomains,
    filters.technicalAspects,
    filters.clientLocations,
    techStacksLookup,
    technicalAspectsLookup,
    clientLocationsLookup,
  ])

  // Client-side filter for `technicalAspectTypeIds`. Server doesn't support
  // this query parameter, but the project DTO now ships server-derived
  // `aspectTypeLabels`, so we filter the already-loaded page here. Pagination
  // counts therefore reflect the server result, not the post-filter set --
  // acceptable trade-off given this is a UI-only refinement.
  const visibleProjects = useMemo(() => {
    const ids = filters.technicalAspectTypeIds
    if (!ids?.length) return projects
    const idToLabel = new Map(technicalAspectTypeSelectOptions.map((o) => [o.value, o.label]))
    const wantedLabels = new Set(
      ids.map((id) => idToLabel.get(id)).filter((label): label is string => Boolean(label))
    )
    if (wantedLabels.size === 0) return projects
    return projects.filter((p) => p.aspectTypeLabels.some((label) => wantedLabels.has(label)))
  }, [projects, filters.technicalAspectTypeIds, technicalAspectTypeSelectOptions])

  // Fetch lookups once on mount (technical domains from GET /api/TechnicalDomains)
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTechStacks(),
      fetchTechnicalAspects(),
      fetchClientLocations(),
      fetchTechnicalAspectTypes(),
      ensureTechnicalDomainsCatalogLoaded(),
    ]).then(([tech, technical, clientLocs, aspectTypes, tdCatalog]) => {
      if (cancelled) return
      setTechStacksLookup(tech)
      setTechnicalAspectsLookup(technical)
      setClientLocationsLookup(clientLocs)
      setTechnicalAspectTypeSelectOptions(
        aspectTypes.map((a) => ({ value: String(a.value), label: a.label }))
      )
      setTechnicalDomainSelectOptions(technicalDomainCatalogToSelectOptions(tdCatalog))
    })
      .catch(() => {
        if (!cancelled) {
          setTechStacksLookup([])
          setTechnicalAspectsLookup([])
          setClientLocationsLookup([])
          setTechnicalAspectTypeSelectOptions([])
          setTechnicalDomainSelectOptions([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Load projects when filters or page change; use current lookups only to resolve filter names to IDs
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        await ensureTechnicalDomainsCatalogLoaded()
        if (cancelled) return
        const params = buildFetchProjectsParams(filters, pageNumber, pageSize, {
          techStackIds: filterIds.techStackIds.length ? filterIds.techStackIds : undefined,
          verticalDomains: filterIds.verticalDomains.length ? filterIds.verticalDomains : undefined,
          horizontalDomains: filterIds.horizontalDomains.length ? filterIds.horizontalDomains : undefined,
          technicalDomains: filterIds.technicalDomains.length ? filterIds.technicalDomains : undefined,
          technicalAspectEnumValues: filterIds.technicalAspectEnumValues.length
            ? filterIds.technicalAspectEnumValues
            : undefined,
          clientLocationIds: filterIds.clientLocationIds.length ? filterIds.clientLocationIds : undefined,
        })
        const result = await fetchProjectsFiltered(params)
        if (cancelled) return
        const items = result?.items ?? []
        setProjects(items.map(projectListItemDtoToProject))
        setTotalCount(result?.totalCount ?? 0)
        setTotalPages(result?.totalPages ?? 0)
        setHasNext(result?.hasNext ?? false)
        setHasPrevious(result?.hasPrevious ?? false)
      } catch (e) {
        if (cancelled) return
        const message = e instanceof Error ? e.message : "Failed to load projects"
        setError(message)
        toast.error(message)
        setProjects([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [filters, pageNumber, pageSize, filterIds])

  const loadProjects = useCallback(async () => {
    await ensureTechnicalDomainsCatalogLoaded()
    const params = buildFetchProjectsParams(filters, pageNumber, pageSize, {
      techStackIds: filterIds.techStackIds.length ? filterIds.techStackIds : undefined,
      verticalDomains: filterIds.verticalDomains.length ? filterIds.verticalDomains : undefined,
      horizontalDomains: filterIds.horizontalDomains.length ? filterIds.horizontalDomains : undefined,
      technicalDomains: filterIds.technicalDomains.length ? filterIds.technicalDomains : undefined,
      technicalAspectEnumValues: filterIds.technicalAspectEnumValues.length
        ? filterIds.technicalAspectEnumValues
        : undefined,
      clientLocationIds: filterIds.clientLocationIds.length ? filterIds.clientLocationIds : undefined,
    })
    const result = await fetchProjectsFiltered(params)
    const items = result?.items ?? []
    setProjects(items.map(projectListItemDtoToProject))
    setTotalCount(result?.totalCount ?? 0)
    setTotalPages(result?.totalPages ?? 0)
    setHasNext(result?.hasNext ?? false)
    setHasPrevious(result?.hasPrevious ?? false)
  }, [filters, pageNumber, pageSize, filterIds])

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [projectToVerify, setProjectToVerify] = useState<Project | null>(null)

  const handleProjectSubmit = async (data: ProjectFormData, _verificationState?: ProjectVerificationState) => {
    const employerId = data.selectedEmployer?.id ?? null
    const options: CreateProjectOptions = {
      techStackIds: namesToIds(data.techStacks, techStacksLookup),
      verticalDomains: labelsToInts(data.verticalDomains, verticalDomainLabelToInt),
      horizontalDomains: labelsToInts(data.horizontalDomains, horizontalDomainLabelToInt),
      technicalDomains: labelsToInts(data.technicalDomains, technicalDomainLabelToInt),
      technicalAspects: technicalAspectEnumsForProjectBody(
        data.technicalAspects,
        technicalAspectsLookup
      ),
      clientLocationIds: namesToIds(data.clientLocations, clientLocationsLookup),
      employerId,
    }
    try {
      if (projectToEdit) {
        const body = buildUpdateProjectDto(data, {
          ...options,
          employerId,
        })
        await updateProject(Number(projectToEdit.id), body)
        toast.success("Project updated successfully!")
        setEditDialogOpen(false)
        setProjectToEdit(null)
      } else {
        const body = buildCreateProjectDto(data, options)
        await createProject(body)
        toast.success("Project created successfully!")
        setCreateDialogOpen(false)
      }
      await loadProjects()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed"
      toast.error(message)
      throw e
    }
  }

  const handleVerifySubmit = async (formData: ProjectFormData, verificationState?: ProjectVerificationState) => {
    if (!projectToVerify) return
    const employerId = formData.selectedEmployer?.id ?? null
    const options: CreateProjectOptions = {
      techStackIds: namesToIds(formData.techStacks, techStacksLookup),
      verticalDomains: labelsToInts(formData.verticalDomains, verticalDomainLabelToInt),
      horizontalDomains: labelsToInts(formData.horizontalDomains, horizontalDomainLabelToInt),
      technicalDomains: labelsToInts(formData.technicalDomains, technicalDomainLabelToInt),
      technicalAspects: technicalAspectEnumsForProjectBody(
        formData.technicalAspects,
        technicalAspectsLookup
      ),
      clientLocationIds: namesToIds(formData.clientLocations, clientLocationsLookup),
      employerId,
    }
    try {
      const body = buildUpdateProjectDto(formData, {
        ...options,
        employerId,
      })
      await updateProject(Number(projectToVerify.id), body)
      const verifiedCount = verificationState?.verifiedFields.size || 0
      const modifiedCount = verificationState?.modifiedFields.size || 0
      toast.success(
        `Project updated! ${verifiedCount} field(s) verified${modifiedCount > 0 ? `, ${modifiedCount} field(s) modified` : ""}.`,
        { duration: 4000 }
      )
      setVerifyDialogOpen(false)
      setProjectToVerify(null)
      await loadProjects()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed"
      toast.error(message)
      throw e
    }
  }

  const handleEdit = async (project: Project) => {
    try {
      await ensureTechnicalDomainsCatalogLoaded()
      const dto = await fetchProjectById(Number(project.id))
      const full = projectDtoToProject(dto)
      setProjectToEdit(full)
      setEditDialogOpen(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load project"
      toast.error(message)
    }
  }

  const handleVerify = async (project: Project) => {
    try {
      await ensureTechnicalDomainsCatalogLoaded()
      const dto = await fetchProjectById(Number(project.id))
      const full = projectDtoToProject(dto)
      setProjectToVerify(full)
      setVerifyDialogOpen(true)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load project"
      toast.error(message)
    }
  }

  const handleDelete = async (project: Project) => {
    try {
      await deleteProject(Number(project.id))
      toast.success("Project deleted.")
      await loadProjects()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete project"
      toast.error(message)
    }
  }

  const handleFiltersChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters)
    setPageNumber(1)
  }

  // Create lookup handlers: POST new value, add to state so dropdown and submit have it
  const handleCreateTechStack = useCallback(async (name: string, context?: { aspectTypeId: number }) => {
    try {
      const ids = context?.aspectTypeId != null ? [context.aspectTypeId] : undefined
      const created = await createTechStack(name, ids)
      setTechStacksLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add technology")
      throw e
    }
  }, [])
  const handleCreateTechnicalAspect = useCallback(async (name: string) => {
    try {
      const created = await createTechnicalAspect(name)
      setTechnicalAspectsLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add technical aspect")
      throw e
    }
  }, [])

  const handleCreateClientLocation = useCallback(async (name: string) => {
    try {
      const created = await createClientLocation(name)
      setClientLocationsLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add client location")
      throw e
    }
  }, [])

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPageNumber(1)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setPageNumber(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Projects</h2>
        </div>
        <div className="flex items-center gap-2">
          <ProjectsFilterDialog
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            lookupOptions={{
              techStacks: techStacksLookup.map((l) => ({ value: l.name, label: l.name })),
              verticalDomains: VERTICAL_DOMAINS.map((d) => ({ value: d.label, label: d.label })),
              horizontalDomains: HORIZONTAL_DOMAINS.map((d) => ({ value: d.label, label: d.label })),
              technicalDomains: technicalDomainSelectOptions,
              technicalAspectTypes: technicalAspectTypeSelectOptions,
              technicalAspects: technicalAspectsLookup.map((l) => ({ value: l.name, label: l.name })),
              clientLocations: clientLocationsLookup.map((l) => ({ value: l.name, label: l.name })),
            }}
          />
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
          <ProjectCreationDialog
            mode="create"
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSubmit={handleProjectSubmit}
            lookups={{
              techStacks: techStacksLookup,
              technicalAspects: technicalAspectsLookup,
              clientLocations: clientLocationsLookup,
              technicalDomains: technicalDomainSelectOptions,
              technicalAspectTypes: technicalAspectTypeSelectOptions,
            }}
            onCreateTechStack={handleCreateTechStack}
            onCreateTechnicalAspect={handleCreateTechnicalAspect}
            onCreateClientLocation={handleCreateClientLocation}
          />
          {projectToEdit && (
            <ProjectCreationDialog
              mode="edit"
              projectData={projectToEdit}
              open={editDialogOpen}
              onOpenChange={(open) => {
                setEditDialogOpen(open)
                if (!open) setProjectToEdit(null)
              }}
              onSubmit={handleProjectSubmit}
              lookups={{
                techStacks: techStacksLookup,
                technicalAspects: technicalAspectsLookup,
                clientLocations: clientLocationsLookup,
                technicalDomains: technicalDomainSelectOptions,
                technicalAspectTypes: technicalAspectTypeSelectOptions,
              }}
              onCreateTechStack={handleCreateTechStack}
              onCreateTechnicalAspect={handleCreateTechnicalAspect}
              onCreateClientLocation={handleCreateClientLocation}
            />
          )}
          {projectToVerify && (
            <ProjectCreationDialog
              mode="edit"
              projectData={projectToVerify}
              showVerification={true}
              open={verifyDialogOpen}
              onOpenChange={(open) => {
                setVerifyDialogOpen(open)
                if (!open) setProjectToVerify(null)
              }}
              onSubmit={handleVerifySubmit}
              lookups={{
                techStacks: techStacksLookup,
                technicalAspects: technicalAspectsLookup,
                clientLocations: clientLocationsLookup,
                technicalDomains: technicalDomainSelectOptions,
                technicalAspectTypes: technicalAspectTypeSelectOptions,
              }}
              onCreateTechStack={handleCreateTechStack}
              onCreateTechnicalAspect={handleCreateTechnicalAspect}
              onCreateClientLocation={handleCreateClientLocation}
            />
          )}
        </div>
      </div>

      {hasGlobalFilters && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Global filters active ({getGlobalFilterCount(globalFilters)} filters applied across all tables)
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <ProjectsTable
        projects={visibleProjects}
        isLoading={loading}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalPages={totalPages}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={setPageNumber}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onVerify={handleVerify}
        technicalDomainOptions={technicalDomainSelectOptions}
      />
    </div>
  )
}
