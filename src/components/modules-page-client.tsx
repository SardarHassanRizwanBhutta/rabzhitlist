"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ModulesFilterDialog, emptyModuleFilters, type ModuleFilters } from "@/components/modules-filter-dialog"
import { ModulesTable } from "@/components/modules-table"
import { ProjectDetailDialog } from "@/components/projects-table"
import type { ProjectLookups } from "@/components/project-creation-dialog"
import type { MultiSelectOption } from "@/components/ui/multi-select"
import {
  ensureDomainCatalogsLoaded,
  fetchClientLocations,
  fetchTechnicalAspectTypes,
  fetchTechStacks,
  type LookupItem,
} from "@/lib/services/lookups-api"
import { fetchProjectModulesPage } from "@/lib/services/project-modules-api"
import { catalogToSelectOptions } from "@/lib/utils/domain-catalog"
import type { Project } from "@/lib/types/project"
import type { ProjectModuleListItem } from "@/lib/types/project-module"

const DEFAULT_PAGE_SIZE = 20

function projectShell(projectId: number, projectName: string): Project {
  return {
    id: String(projectId),
    projectName: projectName || "Project",
    employerName: null,
    techStacks: [],
    verticalDomains: [],
    horizontalDomains: [],
    technicalDomains: [],
    technicalAspects: [],
    aspectTypeLabels: [],
    teamSize: null,
    startDate: null,
    endDate: null,
    status: null,
    description: null,
    latestUpdate: null,
    projectLink: null,
    projectType: null,
    isPublished: false,
    publishPlatforms: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function idsFromFilter(values: string[]): number[] {
  return values
    .map((value) => Number.parseInt(value, 10))
    .filter((id) => Number.isInteger(id) && id > 0)
}

export function ModulesPageClient() {
  const [filters, setFilters] = useState<ModuleFilters>(emptyModuleFilters)
  const [modules, setModules] = useState<ProjectModuleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [techStacksLookup, setTechStacksLookup] = useState<LookupItem[]>([])
  const [lookups, setLookups] = useState<ProjectLookups>({
    techStacks: [],
    technicalAspects: [],
    clientLocations: [],
  })
  const [technicalDomainOptions, setTechnicalDomainOptions] = useState<MultiSelectOption[]>([])

  const techStackOptions = useMemo<MultiSelectOption[]>(
    () => techStacksLookup.map((item) => ({ value: String(item.id), label: item.name })),
    [techStacksLookup],
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTechStacks(),
      fetchClientLocations(),
      fetchTechnicalAspectTypes(),
      ensureDomainCatalogsLoaded(),
    ])
      .then(([tech, clientLocations, aspectTypes, catalogs]) => {
        if (cancelled) return
        setTechStacksLookup(tech)
        setTechnicalDomainOptions(catalogToSelectOptions(catalogs.technicalDomains))
        setLookups({
          techStacks: tech,
          technicalAspects: catalogs.technicalAspects,
          clientLocations,
          verticalDomains: catalogToSelectOptions(catalogs.verticalDomains),
          horizontalDomains: catalogToSelectOptions(catalogs.horizontalDomains),
          technicalDomains: catalogToSelectOptions(catalogs.technicalDomains),
          technicalAspectTypes: aspectTypes.map((item) => ({ value: String(item.id), label: item.name })),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setTechStacksLookup([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadModules = useCallback(async () => {
    setLoading(true)
    try {
      const page = await fetchProjectModulesPage({
        name: filters.name,
        projectIds: idsFromFilter(filters.projectIds),
        techStackIds: idsFromFilter(filters.techStackIds),
        pageNumber,
        pageSize,
      })
      setModules(page.items)
      setTotalCount(page.totalCount)
      setTotalPages(page.totalPages)
      setHasNext(page.hasNext)
      setHasPrevious(page.hasPrevious)
    } catch (error) {
      setModules([])
      setTotalCount(0)
      setTotalPages(0)
      setHasNext(false)
      setHasPrevious(false)
      toast.error(error instanceof Error ? error.message : "Failed to load modules.")
    } finally {
      setLoading(false)
    }
  }, [filters, pageNumber, pageSize])

  useEffect(() => {
    void loadModules()
  }, [loadModules])

  const handleFiltersChange = (next: ModuleFilters) => {
    setFilters(next)
    setPageNumber(1)
  }

  const handleClearFilters = () => {
    setFilters(emptyModuleFilters)
    setPageNumber(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">All Modules</h2>
        <ModulesFilterDialog
          filters={filters}
          techStackOptions={techStackOptions}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </div>
      <ModulesTable
        modules={modules}
        isLoading={loading}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalPages={totalPages}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={setPageNumber}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPageNumber(1)
        }}
        onOpen={(module) => setSelectedProject(projectShell(module.projectId, module.projectName))}
      />
      {selectedProject && (
        <ProjectDetailDialog
          project={selectedProject}
          open={selectedProject != null}
          focusModules
          onOpenChange={(open) => {
            if (!open) setSelectedProject(null)
          }}
          technicalDomainOptions={technicalDomainOptions}
          lookups={lookups}
        />
      )}
    </div>
  )
}
