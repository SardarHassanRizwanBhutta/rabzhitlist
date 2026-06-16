"use client"

import { Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EmptyField, FieldSection, FieldState } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import { COLD_CALLER_SECTION_ICONS } from "./cold-caller-section-icons"

/** Section display order for missing-fields sidebar */
const SECTION_ORDER: FieldSection[] = [
  "basic",
  "workExperience",
  "education",
  "certifications",
  "achievements",
  "techStacks",
  "projects",
]

export type CallNotesSidebarFieldStatus = "missing" | "answered"

function getFieldSidebarStatus(
  field: EmptyField,
  fieldStates: Map<string, FieldState>,
): CallNotesSidebarFieldStatus {
  const state = fieldStates.get(field.fieldPath)
  return state?.status === "answered" ? "answered" : "missing"
}

interface CallNotesFieldsSidebarProps {
  groupedFields: Map<FieldSection, EmptyField[]>
  fieldStates: Map<string, FieldState>
  activeFieldPath?: string | null
  onFieldSelect?: (fieldPath: string) => void
  className?: string
}

export function CallNotesFieldsSidebar({
  groupedFields,
  fieldStates,
  activeFieldPath,
  onFieldSelect,
  className,
}: CallNotesFieldsSidebarProps) {
  const sections = SECTION_ORDER.filter((section) => {
    const fields = groupedFields.get(section)
    return fields && fields.length > 0
  })

  const totalMissing = sections.reduce((sum, section) => {
    const fields = groupedFields.get(section) ?? []
    return (
      sum +
      fields.filter((f) => getFieldSidebarStatus(f, fieldStates) === "missing").length
    )
  }, 0)

  return (
    <aside
      className={cn(
        "w-56 shrink-0 border-r border-border bg-muted/30 overflow-y-auto flex flex-col",
        className,
      )}
      aria-label="Missing candidate fields"
    >
      <div className="p-3 border-b border-border sticky top-0 bg-muted/50 backdrop-blur z-10 space-y-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Missing Fields
        </span>
        <Badge variant="outline" className="text-xs">
          {totalMissing} pending
        </Badge>
      </div>

      {sections.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          All tracked fields are complete.
        </div>
      ) : (
        <div className="p-2 space-y-4 pb-4">
          {sections.map((section) => {
            const fields = groupedFields.get(section) ?? []
            const SectionIcon = COLD_CALLER_SECTION_ICONS[section]
            const missingCount = fields.filter(
              (f) => getFieldSidebarStatus(f, fieldStates) === "missing",
            ).length

            return (
              <div key={section} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1">
                  <SectionIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-foreground flex-1 truncate">
                    {SECTION_LABELS[section]}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                    {missingCount}
                  </Badge>
                </div>
                <ul className="space-y-0.5" role="list">
                  {fields.map((field) => {
                    const status = getFieldSidebarStatus(field, fieldStates)
                    const isActive = activeFieldPath === field.fieldPath

                    return (
                      <li key={field.fieldPath}>
                        <button
                          type="button"
                          onClick={() => onFieldSelect?.(field.fieldPath)}
                          className={cn(
                            "w-full flex items-start gap-2 px-3 py-1.5 rounded-md text-left text-sm transition-colors",
                            isActive && "bg-primary text-primary-foreground",
                            !isActive && status === "answered" &&
                              "text-green-700 dark:text-green-400",
                            !isActive && status !== "answered" &&
                              "hover:bg-muted text-foreground",
                          )}
                        >
                          <span className="shrink-0 mt-0.5" aria-hidden>
                            {status === "answered" ? (
                              <span className="text-xs">✓</span>
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{field.fieldLabel}</span>
                            <span
                              className={cn(
                                "block text-[10px] truncate",
                                isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              {status === "answered" ? "Answered in Fields View" : "Missing"}
                            </span>
                            {field.context && (
                              <span
                                className={cn(
                                  "block text-[10px] truncate",
                                  isActive ? "text-primary-foreground/60" : "text-muted-foreground/80",
                                )}
                              >
                                {field.context}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
