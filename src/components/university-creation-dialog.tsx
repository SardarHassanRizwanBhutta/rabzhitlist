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
import { Loader2, Plus, GraduationCap, MapPin, Trash2 } from "lucide-react"
import { UniversityRanking, UNIVERSITY_RANKING_LABELS } from "@/lib/types/university"

// Form data interfaces
export interface UniversityLocationFormData {
  id: string
  city: string
  address: string
  isMainCampus: boolean
}

export interface UniversityFormData {
  name: string
  websiteUrl: string
  linkedinUrl: string
  country: string
  ranking: UniversityRanking | ""
  locations: UniversityLocationFormData[]
}

interface UniversityCreationDialogProps {
  children?: React.ReactNode
  onSubmit?: (data: UniversityFormData) => Promise<void> | void
}

const createEmptyLocation = (): UniversityLocationFormData => ({
  id: crypto.randomUUID(),
  city: "",
  address: "",
  isMainCampus: false,
})

const initialFormData: UniversityFormData = {
  name: "",
  websiteUrl: "",
  linkedinUrl: "",
  country: "",
  ranking: "",
  locations: [createEmptyLocation()], // Start with one location
}

// Ranking options
const rankingOptions = Object.entries(UNIVERSITY_RANKING_LABELS).map(([value, label]) => ({
  value: value as UniversityRanking,
  label
}))

export function UniversityCreationDialog({
  children,
  onSubmit,
}: UniversityCreationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<UniversityFormData>(initialFormData)
  const [errors, setErrors] = useState<{
    university?: Partial<Record<keyof Omit<UniversityFormData, 'locations'>, string>>
    locations?: { [index: number]: Partial<Record<keyof UniversityLocationFormData, string>> }
  }>({})

  const handleInputChange = (field: keyof Omit<UniversityFormData, 'locations'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors.university?.[field]) {
      setErrors(prev => ({ 
        ...prev, 
        university: { ...prev.university, [field]: undefined }
      }))
    }
  }

  const handleLocationChange = (
    index: number,
    field: keyof UniversityLocationFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, i) => {
        if (i === index) {
          // If setting this location as main campus, unset others
          if (field === "isMainCampus" && value === true) {
            return { ...location, [field]: value }
          }
          return { ...location, [field]: value }
        }
        // If setting main campus, unset all other main campuses
        if (field === "isMainCampus" && value === true) {
          return { ...location, isMainCampus: false }
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
    const universityErrors: Partial<Record<keyof Omit<UniversityFormData, 'locations'>, string>> = {}
    const locationErrors: { [index: number]: Partial<Record<keyof UniversityLocationFormData, string>> } = {}

    // University validation
    if (!formData.name.trim()) universityErrors.name = "University name is required"
    if (!formData.country.trim()) universityErrors.country = "Country is required"
    if (!formData.ranking) universityErrors.ranking = "Ranking is required"
    
    // URL validations
    if (!formData.websiteUrl.trim()) {
      universityErrors.websiteUrl = "Website URL is required"
    } else if (!formData.websiteUrl.startsWith('http')) {
      universityErrors.websiteUrl = "Website URL must start with http:// or https://"
    }
    
    if (formData.linkedinUrl && !formData.linkedinUrl.startsWith('http')) {
      universityErrors.linkedinUrl = "LinkedIn URL must start with http:// or https://"
    }

    // Location validation
    const hasMainCampus = formData.locations.some(loc => loc.isMainCampus)
    
    formData.locations.forEach((location, index) => {
      const locErrors: Partial<Record<keyof UniversityLocationFormData, string>> = {}
      
      if (!location.city.trim()) locErrors.city = "City is required"
      if (!location.address.trim()) locErrors.address = "Address is required"
      
      if (Object.keys(locErrors).length > 0) {
        locationErrors[index] = locErrors
      }
    })

    // Check for main campus requirement
    if (!hasMainCampus && formData.locations.length > 0) {
      if (!locationErrors[0]) locationErrors[0] = {}
      locationErrors[0].isMainCampus = "At least one location must be designated as main campus"
    }

    const newErrors = {
      university: Object.keys(universityErrors).length > 0 ? universityErrors : undefined,
      locations: Object.keys(locationErrors).length > 0 ? locationErrors : undefined,
    }

    setErrors(newErrors)
    return !newErrors.university && !newErrors.locations
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
      console.error("Error creating university:", error)
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
            Create University
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[750px] lg:max-w-[800px] max-h-[95vh] flex flex-col p-0 [&>button]:cursor-pointer">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Create New University</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6" id="university-form">
            {/* Section 1: University Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  University Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">University Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Massachusetts Institute of Technology"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={errors.university?.name ? "border-red-500" : ""}
                    />
                    <div className="min-h-[1.25rem]">
                      {errors.university?.name && <p className="text-sm text-red-500">{errors.university.name}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      type="text"
                      placeholder="United States"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      className={errors.university?.country ? "border-red-500" : ""}
                    />
                    <div className="min-h-[1.25rem]">
                      {errors.university?.country && <p className="text-sm text-red-500">{errors.university.country}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ranking">Ranking *</Label>
                    <Select
                      value={formData.ranking}
                      onValueChange={(value: UniversityRanking) => handleInputChange("ranking", value)}
                    >
                      <SelectTrigger className={errors.university?.ranking ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select ranking" />
                      </SelectTrigger>
                      <SelectContent>
                        {rankingOptions.map((ranking) => (
                          <SelectItem key={ranking.value} value={ranking.value}>
                            {ranking.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="min-h-[1.25rem]">
                      {errors.university?.ranking && <p className="text-sm text-red-500">{errors.university.ranking}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL *</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://www.university.edu"
                      value={formData.websiteUrl}
                      onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                      className={errors.university?.websiteUrl ? "border-red-500" : ""}
                    />
                    <div className="min-h-[1.25rem]">
                      {errors.university?.websiteUrl && <p className="text-sm text-red-500">{errors.university.websiteUrl}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/school/university-name"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                      className={errors.university?.linkedinUrl ? "border-red-500" : ""}
                    />
                    <div className="min-h-[1.25rem]">
                      {errors.university?.linkedinUrl && <p className="text-sm text-red-500">{errors.university.linkedinUrl}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Campus Locations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-medium">Campus Locations</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLocation}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Campus
                </Button>
              </div>

              {formData.locations.map((location, index) => (
                <Card key={location.id} className="relative">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Campus Location {index + 1}</span>
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
                        <Label htmlFor={`city-${index}`}>City *</Label>
                        <Input
                          id={`city-${index}`}
                          type="text"
                          placeholder="Cambridge"
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

                      <div className="space-y-2">
                        <div className="pt-6"> {/* Align with label spacing */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`isMainCampus-${index}`}
                              checked={location.isMainCampus}
                              onCheckedChange={(checked) => handleLocationChange(index, "isMainCampus", !!checked)}
                            />
                            <Label htmlFor={`isMainCampus-${index}`} className="text-sm font-normal">
                              Is Main Campus
                            </Label>
                          </div>
                        </div>
                        <div className="min-h-[1.25rem]">
                          {errors.locations?.[index]?.isMainCampus && (
                            <p className="text-sm text-red-500">{errors.locations[index].isMainCampus}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`address-${index}`}>Address *</Label>
                        <Input
                          id={`address-${index}`}
                          type="text"
                          placeholder="77 Massachusetts Avenue, Cambridge, MA 02139"
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
            form="university-form"
            disabled={isLoading}
            className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating..." : "Create University"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
