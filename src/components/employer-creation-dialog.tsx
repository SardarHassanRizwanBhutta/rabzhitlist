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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Building2, MapPin, Trash2} from "lucide-react"
import { EmployerStatus, SalaryPolicy, EMPLOYER_STATUS_LABELS, SALARY_POLICY_LABELS } from "@/lib/types/employer"

// Form data interfaces
export interface EmployerLocationFormData {
  id: string
  country: string
  city: string
  address: string
  isHeadquarters: boolean
  salaryPolicy: SalaryPolicy | ""
  minSize: string
  maxSize: string
}

export interface EmployerFormData {
  name: string
  websiteUrl: string
  linkedinUrl: string
  status: EmployerStatus | ""
  foundedYear: string
  locations: EmployerLocationFormData[]
}

interface EmployerCreationDialogProps {
  children?: React.ReactNode
  onSubmit?: (data: EmployerFormData) => Promise<void> | void
}

const createEmptyLocation = (): EmployerLocationFormData => ({
  id: crypto.randomUUID(),
  country: "",
  city: "",
  address: "",
  isHeadquarters: false,
  salaryPolicy: "",
  minSize: "",
  maxSize: "",
})

const initialFormData: EmployerFormData = {
  name: "",
  websiteUrl: "",
  linkedinUrl: "",
  status: "",
  foundedYear: "",
  locations: [createEmptyLocation()], // Start with one location
}

// Status options
const statusOptions = Object.entries(EMPLOYER_STATUS_LABELS).map(([value, label]) => ({
  value: value as EmployerStatus,
  label
}))

// Salary policy options
const salaryPolicyOptions = Object.entries(SALARY_POLICY_LABELS).map(([value, label]) => ({
  value: value as SalaryPolicy,
  label
}))

export function EmployerCreationDialog({
  children,
  onSubmit,
}: EmployerCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<EmployerFormData>(initialFormData)
  const [errors, setErrors] = useState<{
    employer?: Partial<Record<keyof Omit<EmployerFormData, 'locations'>, string>>
    locations?: { [index: number]: Partial<Record<keyof EmployerLocationFormData, string>> }
  }>({})

  const handleInputChange = (field: keyof Omit<EmployerFormData, 'locations'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors.employer?.[field]) {
      setErrors(prev => ({ 
        ...prev, 
        employer: { ...prev.employer, [field]: undefined }
      }))
    }
  }

  const handleLocationChange = (
    index: number,
    field: keyof EmployerLocationFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, i) => {
        if (i === index) {
          // If setting this location as headquarters, unset others
          if (field === "isHeadquarters" && value === true) {
            const updatedLocations = prev.locations.map((loc, locIndex) => ({
              ...loc,
              isHeadquarters: locIndex === index
            }))
            return { ...location, [field]: value }
          }
          return { ...location, [field]: value }
        }
        // If setting headquarters, unset all other headquarters
        if (field === "isHeadquarters" && value === true) {
          return { ...location, isHeadquarters: false }
        }
        return location
      })
    }))
    
    // Clear error when user starts typing
    if (errors.locations?.[index]?.[field]) {
      setErrors(prev => ({
        ...prev,
        locations: {
          ...prev.locations,
          [index]: {
            ...prev.locations?.[index],
            [field]: undefined
          }
        }
      }))
    }
  }

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, createEmptyLocation()]
    }))
  }

  const removeLocation = (index: number) => {
    if (formData.locations.length > 1) {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter((_, i) => i !== index)
      }))
      
      // Clear errors for removed location
      if (errors.locations?.[index]) {
        const newLocationErrors = { ...errors.locations }
        delete newLocationErrors[index]
        setErrors(prev => ({
          ...prev,
          locations: newLocationErrors
        }))
      }
    }
  }

  const validateForm = (): boolean => {
    const employerErrors: Partial<Record<keyof Omit<EmployerFormData, 'locations'>, string>> = {}
    const locationErrors: { [index: number]: Partial<Record<keyof EmployerLocationFormData, string>> } = {}

    // Employer validation
    if (!formData.name.trim()) employerErrors.name = "Employer name is required"
    if (!formData.status) employerErrors.status = "Status is required"
    if (!formData.foundedYear.trim()) {
      employerErrors.foundedYear = "Founded year is required"
    } else if (!/^\d{4}$/.test(formData.foundedYear) || parseInt(formData.foundedYear) < 1800 || parseInt(formData.foundedYear) > new Date().getFullYear()) {
      employerErrors.foundedYear = "Please enter a valid year (e.g., 2019)"
    }
    
    // URL validations
    if (formData.websiteUrl && !formData.websiteUrl.startsWith('http')) {
      employerErrors.websiteUrl = "Website URL must start with http:// or https://"
    }
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith('http')) {
      employerErrors.linkedinUrl = "LinkedIn URL must start with http:// or https://"
    }

    // Location validation
    const hasHeadquarters = formData.locations.some(loc => loc.isHeadquarters)
    
    formData.locations.forEach((location, index) => {
      const locErrors: Partial<Record<keyof EmployerLocationFormData, string>> = {}
      
      if (!location.country.trim()) locErrors.country = "Country is required"
      if (!location.city.trim()) locErrors.city = "City is required"
      if (!location.address.trim()) locErrors.address = "Address is required"
      if (!location.salaryPolicy) locErrors.salaryPolicy = "Salary policy is required"
      
      // Employee count validation
      if (!location.minSize.trim()) {
        locErrors.minSize = "Minimum employees is required"
      } else {
        const minSizeNum = parseInt(location.minSize)
        if (isNaN(minSizeNum) || minSizeNum <= 0) {
          locErrors.minSize = "Minimum employees must be a positive number"
        }
      }
      
      if (!location.maxSize.trim()) {
        locErrors.maxSize = "Maximum employees is required"
      } else {
        const maxSizeNum = parseInt(location.maxSize)
        const minSizeNum = parseInt(location.minSize)
        if (isNaN(maxSizeNum) || maxSizeNum <= 0) {
          locErrors.maxSize = "Maximum employees must be a positive number"
        } else if (!isNaN(minSizeNum) && maxSizeNum < minSizeNum) {
          locErrors.maxSize = "Maximum employees must be greater than or equal to minimum employees"
        }
      }
      
      if (Object.keys(locErrors).length > 0) {
        locationErrors[index] = locErrors
      }
    })

    // Check for headquarters requirement
    if (!hasHeadquarters && formData.locations.length > 0) {
      if (!locationErrors[0]) locationErrors[0] = {}
      locationErrors[0].isHeadquarters = "At least one location must be designated as headquarters"
    }

    const newErrors = {
      employer: Object.keys(employerErrors).length > 0 ? employerErrors : undefined,
      locations: Object.keys(locationErrors).length > 0 ? locationErrors : undefined,
    }

    setErrors(newErrors)
    return !newErrors.employer && !newErrors.locations
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
      console.error("Error creating employer:", error)
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
            Create Employer
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[750px] lg:max-w-[850px] max-h-[95vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Create New Employer</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6" id="employer-form">
            {/* Section 1: Employer Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Employer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Employer Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="TechCorp Solutions"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={errors.employer?.name ? "border-red-500" : ""}
                    />
                    {errors.employer?.name && <p className="text-sm text-red-500">{errors.employer.name}</p>}
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Founded Year *</Label>
                    <Input
                      id="foundedYear"
                      type="number"
                      placeholder="2019"
                      min="1800"
                      max={new Date().getFullYear()}
                      value={formData.foundedYear}
                      onChange={(e) => handleInputChange("foundedYear", e.target.value)}
                      className={errors.employer?.foundedYear ? "border-red-500" : ""}
                    />
                    {errors.employer?.foundedYear && <p className="text-sm text-red-500">{errors.employer.foundedYear}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: EmployerStatus) => handleInputChange("status", value)}
                    >
                      <SelectTrigger className={errors.employer?.status ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.employer?.status && <p className="text-sm text-red-500">{errors.employer.status}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://www.company.com"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                      className={errors.employer?.websiteUrl ? "border-red-500" : ""}
                    />
                    {errors.employer?.websiteUrl && <p className="text-sm text-red-500">{errors.employer.websiteUrl}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/company/..."
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                      className={errors.employer?.linkedinUrl ? "border-red-500" : ""}
                    />
                    {errors.employer?.linkedinUrl && <p className="text-sm text-red-500">{errors.employer.linkedinUrl}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Office Locations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-medium">Office Locations</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLocation}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              </div>

              {formData.locations.map((location, index) => (
                <Card key={location.id} className="relative">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Office Location {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                        disabled={formData.locations.length <= 1}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`country-${index}`}>Country *</Label>
                        <Input
                          id={`country-${index}`}
                          type="text"
                          placeholder="United States"
                          value={location.country}
                          onChange={(e) => handleLocationChange(index, "country", e.target.value)}
                          className={errors.locations?.[index]?.country ? "border-red-500" : ""}
                        />
                        <div className="min-h-[1.25rem]">
                          {errors.locations?.[index]?.country && (
                            <p className="text-sm text-red-500">{errors.locations[index].country}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`city-${index}`}>City *</Label>
                        <Input
                          id={`city-${index}`}
                          type="text"
                          placeholder="New York"
                          value={location.city}
                          onChange={(e) => handleLocationChange(index, "city", e.target.value)}
                          className={errors.locations?.[index]?.city ? "border-red-500" : ""}
                        />
                        <div className="min-h-[1.25rem]">
                          {errors.locations?.[index]?.city && (
                            <p className="text-sm text-red-500">{errors.locations[index].city}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`address-${index}`}>Address *</Label>
                        <Input
                          id={`address-${index}`}
                          type="text"
                          placeholder="123 Broadway, Manhattan, NY 10001"
                          value={location.address}
                          onChange={(e) => handleLocationChange(index, "address", e.target.value)}
                          className={errors.locations?.[index]?.address ? "border-red-500" : ""}
                        />
                        <div className="min-h-[1.25rem]">
                          {errors.locations?.[index]?.address && (
                            <p className="text-sm text-red-500">{errors.locations[index].address}</p>
                          )}
                        </div>
                      </div>


                       <div className="space-y-2">
                         <Label htmlFor={`minSize-${index}`}>Minimum Employees *</Label>
                         <Input
                           id={`minSize-${index}`}
                           type="number"
                           placeholder="10"
                           min="1"
                           value={location.minSize}
                           onChange={(e) => handleLocationChange(index, "minSize", e.target.value)}
                           className={errors.locations?.[index]?.minSize ? "border-red-500" : ""}
                         />
                         <div className="min-h-[1.25rem]">
                           {errors.locations?.[index]?.minSize && (
                             <p className="text-sm text-red-500">{errors.locations[index].minSize}</p>
                           )}
                         </div>
                       </div>

                      <div className="space-y-2">
                         <Label htmlFor={`maxSize-${index}`}>Maximum Employees *</Label>
                         <Input
                           id={`maxSize-${index}`}
                           type="number"
                           placeholder="50"
                           min="1"
                           value={location.maxSize}
                           onChange={(e) => handleLocationChange(index, "maxSize", e.target.value)}
                           className={errors.locations?.[index]?.maxSize ? "border-red-500" : ""}
                         />
                         <div className="min-h-[1.25rem]">
                           {errors.locations?.[index]?.maxSize && (
                             <p className="text-sm text-red-500">{errors.locations[index].maxSize}</p>
                           )}
                         </div>
                       </div>

                       <div className="space-y-2">
                         <Label htmlFor={`salaryPolicy-${index}`}>Salary Policy *</Label>
                         <Select
                           value={location.salaryPolicy}
                           onValueChange={(value: SalaryPolicy) => handleLocationChange(index, "salaryPolicy", value)}
                         >
                           <SelectTrigger className={errors.locations?.[index]?.salaryPolicy ? "border-red-500" : ""}>
                             <SelectValue placeholder="Select policy" />
                           </SelectTrigger>
                           <SelectContent>
                             {salaryPolicyOptions.map((policy) => (
                               <SelectItem key={policy.value} value={policy.value}>
                                 {policy.label}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <div className="min-h-[1.25rem]">
                           {errors.locations?.[index]?.salaryPolicy && (
                             <p className="text-sm text-red-500">{errors.locations[index].salaryPolicy}</p>
                           )}
                         </div>
                       </div>
                      <div className="space-y-2">
                        <div className="pt-6"> {/* Align with label spacing */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`isHeadquarters-${index}`}
                              checked={location.isHeadquarters}
                              onCheckedChange={(checked) => handleLocationChange(index, "isHeadquarters", !!checked)}
                            />
                            <Label htmlFor={`isHeadquarters-${index}`} className="text-sm font-normal">
                              Is Headquarters
                            </Label>
                          </div>
                        </div>
                        <div className="min-h-[1.25rem]">
                          {errors.locations?.[index]?.isHeadquarters && (
                            <p className="text-sm text-red-500">{errors.locations[index].isHeadquarters}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </form>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="employer-form"
            disabled={isLoading}
            className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Create Employer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
