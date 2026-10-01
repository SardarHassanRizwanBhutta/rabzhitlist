"use client"

import { useEffect, useState } from "react"
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
import { EmployerCombobox, type EmployerComboboxNestedCreationProps } from "@/components/employer-combobox"
import type { Mentor } from "@/lib/types/mentor"

export interface MentorPersonFormData {
  name: string
  designation: string
  employerId: number | null
  employerName: string
}

const emptyForm: MentorPersonFormData = {
  name: "",
  designation: "",
  employerId: null,
  employerName: "",
}

export function MentorCreationDialog({
  open,
  onOpenChange,
  mode,
  mentor,
  nestedEmployerCreation,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  mentor?: Mentor | null
  nestedEmployerCreation?: EmployerComboboxNestedCreationProps
  onSubmit: (data: MentorPersonFormData) => Promise<void>
}) {
  const [form, setForm] = useState<MentorPersonFormData>(emptyForm)
  const [errors, setErrors] = useState<{ name?: string; employerId?: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      mentor
        ? {
            name: mentor.name,
            designation: mentor.designation ?? "",
            employerId: mentor.employerId,
            employerName: mentor.employerName,
          }
        : emptyForm,
    )
  }, [open, mentor])

  const handleSubmit = async () => {
    const nextErrors: { name?: string; employerId?: string } = {}
    if (!form.name.trim()) nextErrors.name = "Name is required"
    if (form.employerId == null) nextErrors.employerId = "Organization is required"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSaving(true)
    try {
      await onSubmit({ ...form, name: form.name.trim(), designation: form.designation.trim() })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Mentor" : "Create New Mentor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mentor-name">Name *</Label>
            <Input
              id="mentor-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mentor-designation">Designation</Label>
            <Input
              id="mentor-designation"
              value={form.designation}
              onChange={(event) => setForm((prev) => ({ ...prev, designation: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <EmployerCombobox
              id="mentor-organization"
              label="Organization *"
              value={
                form.employerId != null
                  ? { id: form.employerId, name: form.employerName }
                  : null
              }
              onChange={(employer) =>
                setForm((prev) => ({
                  ...prev,
                  employerId: employer?.id ?? null,
                  employerName: employer?.name ?? "",
                }))
              }
              error={!!errors.employerId}
              nestedEmployerCreation={nestedEmployerCreation}
            />
            {errors.employerId && <p className="text-sm text-red-500">{errors.employerId}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-sm cursor-pointer disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {saving ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save" : "Create Mentor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
