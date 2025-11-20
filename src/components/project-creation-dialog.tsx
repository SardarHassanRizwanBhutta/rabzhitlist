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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Loader2, Plus, Check, ChevronsUpDown } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/types/project"
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"

// Form data interface
export interface ProjectFormData {
  projectName: string
  projectType: string
  teamSize: string
  startDate: Date | undefined
  endDate: Date | undefined
  status: ProjectStatus | ""
  description: string
  notes: string
  projectLink: string
  techStacks: string[]
  verticalDomains: string[]
  horizontalDomains: string[]
  technicalAspects: string[]
}

interface ProjectCreationDialogProps {
  children?: React.ReactNode
  onSubmit?: (data: ProjectFormData) => Promise<void> | void
}

const initialFormData: ProjectFormData = {
  projectName: "",
  projectType: "",
  teamSize: "",
  startDate: undefined,
  endDate: undefined,
  status: "",
  description: "",
  notes: "",
  projectLink: "",
  techStacks: [],
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
}

const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  value: value as ProjectStatus,
  label
}))

// Project type options
const projectTypeOptions = [
  { value: "Employer", label: "Employer" },
  { value: "Academic", label: "Academic" },
  { value: "Freelance", label: "Freelance" },
  { value: "Personal", label: "Personal" },
]

// Mock data for multi-select fields
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

const verticalDomainOptions: MultiSelectOption[] = [
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "e-commerce", label: "E-Commerce" },
  { value: "logistics", label: "Logistics" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "government", label: "Government" },
  { value: "non-profit", label: "Non-Profit" },
  { value: "entertainment", label: "Entertainment" },
  { value: "real-estate", label: "Real Estate" },
  { value: "automotive", label: "Automotive" },
  { value: "energy", label: "Energy" },
  { value: "telecommunications", label: "Telecommunications" },
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
  { value: "communication", label: "Communication" },
  { value: "project-management", label: "Project Management" },
  { value: "hr-management", label: "HR Management" },
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
  { value: "edge-computing", label: "Edge Computing" },
  { value: "content-delivery", label: "Content Delivery" },
  { value: "caching", label: "Caching" },
  { value: "search-optimization", label: "Search Optimization" },
  { value: "security", label: "Security" },
  { value: "encryption", label: "Encryption" },
  { value: "compliance", label: "Compliance" },
]

export function ProjectCreationDialog({
  children,
  onSubmit,
}: ProjectCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})

  const handleInputChange = (field: keyof ProjectFormData, value: string | Date | undefined | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {}

    // Required field validation
    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required"
    }

    if (!formData.teamSize.trim()) {
      newErrors.teamSize = "Team size is required"
    } else {
      // Validate team size format (single number or range)
      const teamSizePattern = /^\d+(-\d+)?$/
      if (!teamSizePattern.test(formData.teamSize.trim())) {
        newErrors.teamSize = "Team size must be a number (e.g., '5') or range (e.g., '5-10')"
      }
    }

    if (!formData.status) {
      newErrors.status = "Project status is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Project description is required"
    }

    // Optional URL validation
    if (formData.projectLink && !formData.projectLink.startsWith('http')) {
      newErrors.projectLink = "Project link must be a valid URL starting with http:// or https://"
    }

    // Date validation
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = "End date must be after start date"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSubmit?.(formData)
      setFormData(initialFormData)
      setErrors({})
      setOpen(false)
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setErrors({})
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6" id="project-form">
            {/* Project Name & Project Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  type="text"
                  placeholder="E-Commerce Platform Redesign"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange("projectName", e.target.value)}
                  className={errors.projectName ? "border-red-500" : ""}
                />
                {errors.projectName && <p className="text-sm text-red-500">{errors.projectName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between ${errors.projectType ? "border-red-500" : ""}`}
                    >
                      {formData.projectType
                        ? projectTypeOptions.find((option) => option.value === formData.projectType)?.label
                        : "Select project type"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search type..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup>
                          {projectTypeOptions.map((type) => (
                            <CommandItem
                              key={type.value}
                              value={type.value}
                              onSelect={(currentValue) => {
                                handleInputChange("projectType", currentValue)
                              }}
                              className="cursor-pointer"
                            >
                              {type.label}
                              <Check
                                className={`ml-auto ${formData.projectType === type.value ? "opacity-100" : "opacity-0"}`}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.projectType && <p className="text-sm text-red-500">{errors.projectType}</p>}
              </div>
            </div>

            {/* Team Size & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size *</Label>
                <Input
                  id="teamSize"
                  type="text"
                  placeholder="12 or 10-15"
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange("teamSize", e.target.value)}
                  className={errors.teamSize ? "border-red-500" : ""}
                />
                {errors.teamSize && <p className="text-sm text-red-500">{errors.teamSize}</p>}
                <p className="text-xs text-muted-foreground">
                  Enter single number (e.g., &quot;12&quot;) or range (e.g., &quot;10-15&quot;)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={`w-full justify-between ${errors.status ? "border-red-500" : ""}`}
                    >
                      {formData.status
                        ? statusOptions.find((option) => option.value === formData.status)?.label
                        : "Select project status"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search status..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No status found.</CommandEmpty>
                        <CommandGroup>
                          {statusOptions.map((status) => (
                            <CommandItem
                              key={status.value}
                              value={status.value}
                              onSelect={(currentValue) => {
                                handleInputChange("status", currentValue as ProjectStatus)
                              }}
                              className="cursor-pointer"
                            >
                              {status.label}
                              <Check
                                className={`ml-auto ${formData.status === status.value ? "opacity-100" : "opacity-0"}`}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
              </div>
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="startDate"
                      className="w-full justify-between font-normal"
                    >
                      {formData.startDate 
                        ? formData.startDate.toLocaleDateString() 
                        : "Select start date"}
                      <CalendarIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      captionLayout="dropdown"
                      onSelect={(date) => handleInputChange("startDate", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="endDate"
                      className={`w-full justify-between font-normal ${errors.endDate ? "border-red-500" : ""}`}
                    >
                      {formData.endDate 
                        ? formData.endDate.toLocaleDateString() 
                        : "Select end date"}
                      <CalendarIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      captionLayout="dropdown"
                      onSelect={(date) => handleInputChange("endDate", date)}
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
              </div>
            </div>

            {/* Tech Stacks */}
            <MultiSelect
              items={techStackOptions}
              selected={formData.techStacks}
              onChange={(values) => handleInputChange("techStacks", values)}
              placeholder="Select technologies..."
              label="Technology Stack"
              searchPlaceholder="Search technologies..."
              maxDisplay={4}
            />

            {/* Domains & Technical Aspects */}
            <div className="space-y-4">
              <MultiSelect
                items={verticalDomainOptions}
                selected={formData.verticalDomains}
                onChange={(values) => handleInputChange("verticalDomains", values)}
                placeholder="Select vertical domains..."
                label="Vertical Domains"
                searchPlaceholder="Search vertical domains..."
                maxDisplay={4}
              />

              <MultiSelect
                items={horizontalDomainOptions}
                selected={formData.horizontalDomains}
                onChange={(values) => handleInputChange("horizontalDomains", values)}
                placeholder="Select horizontal domains..."
                label="Horizontal Domains"
                searchPlaceholder="Search horizontal domains..."
                maxDisplay={4}
              />

              <MultiSelect
                items={technicalAspectOptions}
                selected={formData.technicalAspects}
                onChange={(values) => handleInputChange("technicalAspects", values)}
                placeholder="Select technical aspects..."
                label="Technical Aspects"
                searchPlaceholder="Search technical aspects..."
                maxDisplay={4}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the project, its goals, and key features..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Additional notes, requirements, or comments..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Brief additional information or special requirements
              </p>
            </div>

            {/* Project Link */}
            <div className="space-y-2">
              <Label htmlFor="projectLink">Project Link</Label>
              <Input
                id="projectLink"
                type="url"
                placeholder="https://project.example.com"
                value={formData.projectLink}
                onChange={(e) => handleInputChange("projectLink", e.target.value)}
                className={errors.projectLink ? "border-red-500" : ""}
              />
              {errors.projectLink && <p className="text-sm text-red-500">{errors.projectLink}</p>}
              <p className="text-xs text-muted-foreground">
                Optional link to project demo, repository, or documentation
              </p>
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="transition-all duration-150 ease-in-out hover:bg-accent hover:text-accent-foreground hover:border-accent cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="project-form"
            disabled={isLoading}
            className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
