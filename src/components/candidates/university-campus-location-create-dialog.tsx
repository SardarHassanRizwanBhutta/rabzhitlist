"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  clearUniversityMainCampus,
  createUniversityLocation,
} from "@/lib/services/universities-api"
import { formatUniversityLocationLabel } from "@/lib/utils/university-location-label"

export interface CreatedUniversityCampusLocation {
  id: number
  label: string
}

export interface UniversityCampusLocationCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  universityId: number
  /** Prefill city from campus search text. */
  initialCity?: string
  /** When true, saving with Main campus checked clears main campus on other rows first. */
  hasExistingMainCampus?: boolean
  onCreated: (location: CreatedUniversityCampusLocation) => void
}

export function UniversityCampusLocationCreateDialog({
  open,
  onOpenChange,
  universityId,
  initialCity = "",
  hasExistingMainCampus = false,
  onCreated,
}: UniversityCampusLocationCreateDialogProps) {
  const [city, setCity] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [isMainCampus, setIsMainCampus] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<{ city?: string }>({})

  React.useEffect(() => {
    if (!open) return
    setCity(initialCity.trim())
    setAddress("")
    setIsMainCampus(false)
    setErrors({})
  }, [open, initialCity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!city.trim()) {
      setErrors({ city: "City is required" })
      return
    }

    setSubmitting(true)
    try {
      if (isMainCampus) {
        await clearUniversityMainCampus(universityId)
      }
      const created = await createUniversityLocation(universityId, {
        city: city.trim(),
        address: address.trim() || null,
        isMainCampus,
      })
      const label = formatUniversityLocationLabel(created.city, created.address)
      toast.success(`Campus "${label}" created.`)
      onCreated({ id: created.id, label })
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create campus.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add campus</DialogTitle>
        </DialogHeader>
        <form id="university-campus-location-create-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="university-campus-location-city">City</Label>
            <Input
              id="university-campus-location-city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                if (errors.city) setErrors({})
              }}
              placeholder="Islamabad"
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city ? <p className="text-sm text-red-500">{errors.city}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="university-campus-location-address">Address</Label>
            <Input
              id="university-campus-location-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Broadway, Manhattan, NY 10001"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="university-campus-location-is-main-campus"
              checked={isMainCampus}
              onCheckedChange={setIsMainCampus}
            />
            <Label htmlFor="university-campus-location-is-main-campus" className="text-sm font-normal">
              Main campus
            </Label>
          </div>
          {isMainCampus && hasExistingMainCampus ? (
            <p className="text-xs text-muted-foreground">
              The current main campus will be unset when this location is saved.
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="university-campus-location-create-form" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create campus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
