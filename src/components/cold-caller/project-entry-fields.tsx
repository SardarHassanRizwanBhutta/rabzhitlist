"use client"

import type { ReactNode } from "react"
import type { EmptyField } from "@/types/cold-caller"
import {
  catalogDetailsLabel,
  splitProjectFields,
} from "@/lib/utils/project-catalog-fields"
import { ProjectCatalogCollapsible } from "./project-catalog-collapsible"

interface ProjectEntryFieldsProps {
  fields: EmptyField[]
  renderField: (field: EmptyField) => ReactNode
}

/** Name + contribution flat; catalog fields inside Collapsible. */
export function ProjectEntryFields({ fields, renderField }: ProjectEntryFieldsProps) {
  const { linkFields, catalogFields } = splitProjectFields(fields)

  return (
    <div className="space-y-4">
      {linkFields.map((field) => (
        <div key={field.fieldPath}>{renderField(field)}</div>
      ))}
      {catalogFields.length > 0 && (
        <ProjectCatalogCollapsible label={catalogDetailsLabel(catalogFields.length)}>
          <div className="flex w-full flex-col gap-4">
            {catalogFields.map((field) => (
              <div key={field.fieldPath}>{renderField(field)}</div>
            ))}
          </div>
        </ProjectCatalogCollapsible>
      )}
    </div>
  )
}
