"use client"

import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface ProjectCatalogCollapsibleProps {
  label: string
  children: ReactNode
  className?: string
  defaultOpen?: boolean
}

/** Shadcn Collapsible pattern for project catalog fields (name/contribution stay outside). */
export function ProjectCatalogCollapsible({
  label,
  children,
  className,
  defaultOpen = false,
}: ProjectCatalogCollapsibleProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn("rounded-md data-[state=open]:bg-muted", className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="group h-auto w-full justify-start gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex w-full flex-col gap-2 p-2.5 pt-0 text-sm">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
