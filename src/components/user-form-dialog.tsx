"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
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
import { Loader2, Plus } from "lucide-react"
import type { AppUser } from "@/lib/types/app-user"

export interface UserFormData {
  fullName: string
  email: string
  password: string
}

type UserFormDialogMode = "create" | "edit"

interface UserFormDialogProps {
  mode?: UserFormDialogMode
  user?: AppUser | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit?: (data: UserFormData, mode: UserFormDialogMode) => Promise<void> | void
}

const emptyForm: UserFormData = {
  fullName: "",
  email: "",
  password: "",
}

function userToForm(user: AppUser): UserFormData {
  return {
    fullName: user.fullName,
    email: user.email,
    password: "",
  }
}

const MIN_PASSWORD_LENGTH = 8

export function UserFormDialog({
  mode = "create",
  user = null,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<UserFormData>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})
  const nameInputRef = useRef<HTMLInputElement>(null)

  const effectiveMode: UserFormDialogMode = user ? "edit" : mode

  useEffect(() => {
    if (!open) return
    setFormData(user ? userToForm(user) : emptyForm)
    setErrors({})
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 100)
    return () => window.clearTimeout(t)
  }, [open, user])

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof UserFormData, string>> = {}
    if (!formData.fullName.trim()) {
      next.fullName = "Full name is required"
    }
    if (!formData.email.trim()) {
      next.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      next.email = "Enter a valid email address"
    }
    if (effectiveMode === "create") {
      if (!formData.password.trim()) {
        next.password = "Password is required"
      } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
        next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      }
    } else if (formData.password.trim() && formData.password.length < MIN_PASSWORD_LENGTH) {
      next.password = "Minimum 8 characters if changing."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await onSubmit?.(
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
        },
        effectiveMode,
      )
      if (effectiveMode === "create") {
        setFormData(emptyForm)
      }
      setOpen(false)
    } catch {
      // Error toast handled by parent
    } finally {
      setIsLoading(false)
    }
  }

  const title = effectiveMode === "create" ? "Create user" : "Edit user"
  const submitLabel = effectiveMode === "create" ? "Create" : "Save changes"

  const dialogBody = (
    <DialogContent className="sm:max-w-[440px] [&>button]:cursor-pointer">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4" id="user-form">
        <div className="space-y-2">
          <Label htmlFor="userFullName">Full name *</Label>
          <Input
            ref={nameInputRef}
            id="userFullName"
            autoComplete="name"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className={errors.fullName ? "border-destructive" : ""}
            disabled={isLoading}
            required={effectiveMode === "create"}
          />
          {errors.fullName ? (
            <p className="text-destructive text-sm">{errors.fullName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="userEmail">Email *</Label>
          <Input
            id="userEmail"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={errors.email ? "border-destructive" : ""}
            disabled={isLoading}
            required={effectiveMode === "create"}
          />
          {errors.email ? (
            <p className="text-destructive text-sm">{errors.email}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="userPassword">
            {effectiveMode === "create" ? "Password *" : "New password"}
          </Label>
          <Input
            id="userPassword"
            type="password"
            autoComplete={effectiveMode === "create" ? "new-password" : "off"}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className={errors.password ? "border-destructive" : ""}
            disabled={isLoading}
            required={effectiveMode === "create"}
          />
          {errors.password ? (
            <p className="text-destructive text-sm">{errors.password}</p>
          ) : null}
        </div>
      </form>
      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isLoading}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button type="submit" form="user-form" disabled={isLoading} className="cursor-pointer">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  if (effectiveMode === "edit" || isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogBody}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </DialogTrigger>
      {dialogBody}
    </Dialog>
  )
}
