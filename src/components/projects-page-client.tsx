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
  type CreateProjectOptions,
} from "@/lib/services/projects-api"
import type { LookupItem } from "@/lib/services/lookups-api"
import {
  fetchTechStacks,
  fetchVerticalDomains,
  fetchHorizontalDomains,
  fetchTechnicalAspects,
  fetchClientLocations,
  createTechStack,
  createVerticalDomain,
  createHorizontalDomain,
  createTechnicalAspect,
  createClientLocation,
} from "@/lib/services/lookups-api"

const DEFAULT_PAGE_SIZE = 20

const initialFilters: ProjectFilters = {
  status: [],
  projectTypes: [],
  employers: [],
  employerCities: [],
  employerCountries: [],
  employerTypes: [],
  clientLocations: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
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

  // Lookup data for dropdowns (prefetched on mount; used by filter dialog and create/edit dialog)
  const [techStacksLookup, setTechStacksLookup] = useState<LookupItem[]>([])
  const [verticalDomainsLookup, setVerticalDomainsLookup] = useState<LookupItem[]>([])
  const [horizontalDomainsLookup, setHorizontalDomainsLookup] = useState<LookupItem[]>([])
  const [technicalAspectsLookup, setTechnicalAspectsLookup] = useState<LookupItem[]>([])
  const [clientLocationsLookup, setClientLocationsLookup] = useState<LookupItem[]>([])

  // Resolve filter names to IDs for server-side filtering (used when building params)
  const filterIds = useMemo(
    () => ({
      techStackIds: namesToIds(filters.techStacks, techStacksLookup),
      verticalDomainIds: namesToIds(filters.verticalDomains, verticalDomainsLookup),
      horizontalDomainIds: namesToIds(filters.horizontalDomains, horizontalDomainsLookup),
      technicalAspectIds: namesToIds(filters.technicalAspects, technicalAspectsLookup),
      clientLocationIds: namesToIds(filters.clientLocations, clientLocationsLookup),
    }),
    [
      filters.techStacks,
      filters.verticalDomains,
      filters.horizontalDomains,
      filters.technicalAspects,
      filters.clientLocations,
      techStacksLookup,
      verticalDomainsLookup,
      horizontalDomainsLookup,
      technicalAspectsLookup,
      clientLocationsLookup,
    ]
  )

  // Fetch lookups once on mount (for filter and create/edit dropdowns); do not re-run when projects or filters change
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTechStacks(),
      fetchVerticalDomains(),
      fetchHorizontalDomains(),
      fetchTechnicalAspects(),
      fetchClientLocations(),
    ]).then(([tech, vertical, horizontal, technical, clientLocs]) => {
      if (cancelled) return
      setTechStacksLookup(tech)
      setVerticalDomainsLookup(vertical)
      setHorizontalDomainsLookup(horizontal)
      setTechnicalAspectsLookup(technical)
      setClientLocationsLookup(clientLocs)
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

    const params = buildFetchProjectsParams(filters, pageNumber, pageSize, {
      techStackIds: filterIds.techStackIds.length ? filterIds.techStackIds : undefined,
      verticalDomainIds: filterIds.verticalDomainIds.length ? filterIds.verticalDomainIds : undefined,
      horizontalDomainIds: filterIds.horizontalDomainIds.length ? filterIds.horizontalDomainIds : undefined,
      technicalAspectIds: filterIds.technicalAspectIds.length ? filterIds.technicalAspectIds : undefined,
      clientLocationIds: filterIds.clientLocationIds.length ? filterIds.clientLocationIds : undefined,
    })

    fetchProjectsFiltered(params)
      .then((result) => {
        if (cancelled) return
        const items = result?.items ?? []
        setProjects(items.map(projectListItemDtoToProject))
        setTotalCount(result?.totalCount ?? 0)
        setTotalPages(result?.totalPages ?? 0)
        setHasNext(result?.hasNext ?? false)
        setHasPrevious(result?.hasPrevious ?? false)
      })
      .catch((e) => {
        if (cancelled) return
        const message = e instanceof Error ? e.message : "Failed to load projects"
        setError(message)
        toast.error(message)
        setProjects([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, pageNumber, pageSize, filterIds])

  const loadProjects = useCallback(async () => {
    const params = buildFetchProjectsParams(filters, pageNumber, pageSize, {
      techStackIds: filterIds.techStackIds.length ? filterIds.techStackIds : undefined,
      verticalDomainIds: filterIds.verticalDomainIds.length ? filterIds.verticalDomainIds : undefined,
      horizontalDomainIds: filterIds.horizontalDomainIds.length ? filterIds.horizontalDomainIds : undefined,
      technicalAspectIds: filterIds.technicalAspectIds.length ? filterIds.technicalAspectIds : undefined,
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
      verticalDomainIds: namesToIds(data.verticalDomains, verticalDomainsLookup),
      horizontalDomainIds: namesToIds(data.horizontalDomains, horizontalDomainsLookup),
      technicalAspectIds: namesToIds(data.technicalAspects, technicalAspectsLookup),
      clientLocationIds: namesToIds(data.clientLocations, clientLocationsLookup),
      employerId,
    }
    try {
      if (projectToEdit) {
        const body = buildUpdateProjectDto(data, {
          ...options,
          isPublished: projectToEdit.isPublished,
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
      verticalDomainIds: namesToIds(formData.verticalDomains, verticalDomainsLookup),
      horizontalDomainIds: namesToIds(formData.horizontalDomains, horizontalDomainsLookup),
      technicalAspectIds: namesToIds(formData.technicalAspects, technicalAspectsLookup),
      clientLocationIds: namesToIds(formData.clientLocations, clientLocationsLookup),
      employerId,
    }
    try {
      const body = buildUpdateProjectDto(formData, {
        ...options,
        isPublished: projectToVerify.isPublished,
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
  const handleCreateTechStack = useCallback(async (name: string) => {
    try {
      const created = await createTechStack(name)
      setTechStacksLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add technology")
      throw e
    }
  }, [])
  const handleCreateVerticalDomain = useCallback(async (name: string) => {
    try {
      const created = await createVerticalDomain(name)
      setVerticalDomainsLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add vertical domain")
      throw e
    }
  }, [])
  const handleCreateHorizontalDomain = useCallback(async (name: string) => {
    try {
      const created = await createHorizontalDomain(name)
      setHorizontalDomainsLookup((prev) => [...prev.filter((l) => l.id !== created.id && l.name !== created.name), created])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add horizontal domain")
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
              verticalDomains: verticalDomainsLookup.map((l) => ({ value: l.name, label: l.name })),
              horizontalDomains: horizontalDomainsLookup.map((l) => ({ value: l.name, label: l.name })),
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
              verticalDomains: verticalDomainsLookup,
              horizontalDomains: horizontalDomainsLookup,
              technicalAspects: technicalAspectsLookup,
              clientLocations: clientLocationsLookup,
            }}
            onCreateTechStack={handleCreateTechStack}
            onCreateVerticalDomain={handleCreateVerticalDomain}
            onCreateHorizontalDomain={handleCreateHorizontalDomain}
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
                verticalDomains: verticalDomainsLookup,
                horizontalDomains: horizontalDomainsLookup,
                technicalAspects: technicalAspectsLookup,
                clientLocations: clientLocationsLookup,
              }}
              onCreateTechStack={handleCreateTechStack}
              onCreateVerticalDomain={handleCreateVerticalDomain}
              onCreateHorizontalDomain={handleCreateHorizontalDomain}
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
                verticalDomains: verticalDomainsLookup,
                horizontalDomains: horizontalDomainsLookup,
                technicalAspects: technicalAspectsLookup,
                clientLocations: clientLocationsLookup,
              }}
              onCreateTechStack={handleCreateTechStack}
              onCreateVerticalDomain={handleCreateVerticalDomain}
              onCreateHorizontalDomain={handleCreateHorizontalDomain}
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
        projects={projects}
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
      />
    </div>
  )
}
