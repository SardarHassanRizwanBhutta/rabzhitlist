"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"
import { Filter } from "lucide-react"
import { ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/types/project"
import { sampleEmployers } from "@/lib/sample-data/employers"

// Filter interfaces
export interface ProjectFilters {
  status: ProjectStatus[]
  projectTypes: string[]
  employers: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
  techStacks: string[]
}

interface ProjectsFilterDialogProps {
  children?: React.ReactNode
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  onClearFilters: () => void
}

// Mock data for filter options
const statusOptions: MultiSelectOption[] = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  value: value as ProjectStatus,
  label
}))

const projectTypeOptions: MultiSelectOption[] = [
  { value: "Employer", label: "Employer" },
  { value: "Academic", label: "Academic" },
  { value: "Freelance", label: "Freelance" },
  { value: "Personal", label: "Personal" },
]

const employerOptions: MultiSelectOption[] = sampleEmployers.map(employer => ({
  value: employer.id,
  label: employer.name
}))

const verticalDomainOptions: MultiSelectOption[] = [
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "e-commerce", label: "E-Commerce" },
  { value: "logistics", label: "Logistics" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "government", label: "Government" },
  { value: "entertainment", label: "Entertainment" },
  { value: "real-estate", label: "Real Estate" },
  { value: "automotive", label: "Automotive" },
  { value: "energy", label: "Energy" },
]

const horizontalDomainOptions: MultiSelectOption[] = [
  { value: "crm", label: "CRM" },
  { value: "erp", label: "ERP" },
  { value: "cms", label: "CMS" },
  { value: "lms", label: "LMS" },
  { value: "payment-gateway", label: "Payment Gateway" },
  { value: "inventory-management", label: "Inventory Management" },
  { value: "analytics", label: "Analytics" },
  { value: "monitoring", label: "Monitoring" },
  { value: "reporting", label: "Reporting" },
  { value: "workflow", label: "Workflow" },
  { value: "collaboration", label: "Collaboration" },
  { value: "project-management", label: "Project Management" },
]

const technicalAspectOptions: MultiSelectOption[] = [
  { value: "microservices", label: "Microservices" },
  { value: "authorization", label: "Authorization" },
  { value: "authentication", label: "Authentication" },
  { value: "real-time-updates", label: "Real-time Updates" },
  { value: "api-integration", label: "API Integration" },
  { value: "data-analytics", label: "Data Analytics" },
  { value: "machine-learning", label: "Machine Learning" },
  { value: "blockchain", label: "Blockchain" },
  { value: "iot-protocols", label: "IoT Protocols" },
  { value: "cloud-native", label: "Cloud Native" },
  { value: "serverless", label: "Serverless" },
  { value: "security", label: "Security" },
  { value: "encryption", label: "Encryption" },
  { value: "compliance", label: "Compliance" },
]

const techStackOptions: MultiSelectOption[] = [
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "nodejs", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "aspnet", label: "ASP.NET Core" },
  { value: "angular", label: "Angular" },
  { value: "vue", label: "Vue.js" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "mysql", label: "MySQL" },
  { value: "redis", label: "Redis" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "graphql", label: "GraphQL" },
]

const initialFilters: ProjectFilters = {
  status: [],
  projectTypes: [],
  employers: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  techStacks: [],
}

export function ProjectsFilterDialog({
  children,
  filters,
  onFiltersChange,
  onClearFilters,
}: ProjectsFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempFilters, setTempFilters] = useState<ProjectFilters>(filters)

  // Calculate active filter count
  const activeFilterCount = 
    filters.status.length +
    filters.projectTypes.length +
    filters.employers.length +
    filters.verticalDomains.length +
    filters.horizontalDomains.length +
    filters.technicalAspects.length +
    filters.techStacks.length

  React.useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleFilterChange = (field: keyof ProjectFilters, value: string[]) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setTempFilters(initialFilters)
    onClearFilters()
    // Keep dialog open for user to see cleared state
  }

  const handleCancel = () => {
    setTempFilters(filters) // Reset to current filters
    setOpen(false)
  }

  const hasAnyTempFilters = 
    tempFilters.status.length > 0 ||
    tempFilters.projectTypes.length > 0 ||
    tempFilters.employers.length > 0 ||
    tempFilters.verticalDomains.length > 0 ||
    tempFilters.horizontalDomains.length > 0 ||
    tempFilters.technicalAspects.length > 0 ||
    tempFilters.techStacks.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 min-w-[1.25rem] h-5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Projects
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiSelect
                  items={statusOptions}
                  selected={tempFilters.status}
                  onChange={(values) => handleFilterChange("status", values)}
                  placeholder="Filter by status..."
                  label="Project Status"
                  maxDisplay={3}
                />

                <MultiSelect
                  items={projectTypeOptions}
                  selected={tempFilters.projectTypes}
                  onChange={(values) => handleFilterChange("projectTypes", values)}
                  placeholder="Filter by project type..."
                  label="Project Type"
                  maxDisplay={3}
                />
              </div>

              <MultiSelect
                items={employerOptions}
                selected={tempFilters.employers}
                onChange={(values) => handleFilterChange("employers", values)}
                placeholder="Filter by employer..."
                label="Employer"
                searchPlaceholder="Search employers..."
                maxDisplay={3}
              />
            </div>

            <div className="space-y-4">
              <MultiSelect
                items={techStackOptions}
                selected={tempFilters.techStacks}
                onChange={(values) => handleFilterChange("techStacks", values)}
                placeholder="Filter by technology..."
                label="Technology Stack"
                searchPlaceholder="Search technologies..."
                maxDisplay={4}
              />

              <div className="space-y-4">
                <MultiSelect
                  items={verticalDomainOptions}
                  selected={tempFilters.verticalDomains}
                  onChange={(values) => handleFilterChange("verticalDomains", values)}
                  placeholder="Filter by vertical domain..."
                  label="Vertical Domains"
                  searchPlaceholder="Search vertical domains..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={horizontalDomainOptions}
                  selected={tempFilters.horizontalDomains}
                  onChange={(values) => handleFilterChange("horizontalDomains", values)}
                  placeholder="Filter by horizontal domain..."
                  label="Horizontal Domains"
                  searchPlaceholder="Search horizontal domains..."
                  maxDisplay={3}
                />

                <MultiSelect
                  items={technicalAspectOptions}
                  selected={tempFilters.technicalAspects}
                  onChange={(values) => handleFilterChange("technicalAspects", values)}
                  placeholder="Filter by technical aspect..."
                  label="Technical Aspects"
                  searchPlaceholder="Search technical aspects..."
                  maxDisplay={3}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            
            {hasAnyTempFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear All
              </Button>
            )}
            
            <Button 
              onClick={handleApplyFilters}
              className="ml-auto transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer"
            >
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
