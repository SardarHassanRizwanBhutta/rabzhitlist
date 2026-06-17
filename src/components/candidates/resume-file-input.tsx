"use client"

import * as React from "react"
import { FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  formatResumeFileSize,
  validateResumeFile,
} from "@/lib/utils/candidate-resume"

const RESUME_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export interface ResumeFileInputProps {
  id?: string
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  error?: string | null
  className?: string
  label?: string
}

export function ResumeFileInput({
  id = "resume-file-input",
  value,
  onChange,
  disabled = false,
  error,
  className,
  label = "Resume",
}: ResumeFileInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const displayError = error ?? localError

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateResumeFile(file)
    if (!validation.isValid) {
      setLocalError(validation.error ?? "Invalid resume file.")
      onChange(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setLocalError(null)
    onChange(file)
  }

  const handleRemove = () => {
    onChange(null)
    setLocalError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>

      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={value.name}>
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatResumeFileSize(value.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove selected resume file"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            ref={inputRef}
            id={id}
            type="file"
            accept={RESUME_ACCEPT}
            onChange={handleFileChange}
            disabled={disabled}
            className="cursor-pointer"
            aria-invalid={!!displayError}
            aria-describedby={displayError ? `${id}-error` : `${id}-hint`}
          />
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            Accepted formats: PDF, DOCX (max 10 MB)
          </p>
        </div>
      )}

      {displayError ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  )
}
