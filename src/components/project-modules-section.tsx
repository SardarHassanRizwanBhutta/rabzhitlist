"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, Layers, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import type { ProjectModule, ProjectModuleContributor } from "@/lib/types/project-module"

const TECH_STACK_BADGE_CLASS = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
const MAX_TECH_STACKS = 4

const DESCRIPTION_MAX_LENGTH = 150

function TruncatedModuleDescription({ text }: { text: string | null | undefined }) {
  const [expanded, setExpanded] = useState(false)
  const displayText = text || ""
  const shouldTruncate = displayText.length > DESCRIPTION_MAX_LENGTH
  const truncatedText =
    shouldTruncate && !expanded ? `${displayText.slice(0, DESCRIPTION_MAX_LENGTH)}...` : displayText

  if (!displayText) {
    return <span className="text-sm italic text-muted-foreground">N/A</span>
  }

  return (
    <div className="space-y-1">
      <span className="block whitespace-pre-wrap text-sm leading-relaxed">{truncatedText}</span>
      {shouldTruncate && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((current) => !current)}
          className="h-7 px-0 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  )
}

const CONTRIBUTION_MAX_LENGTH = 100

function TruncatedCandidateContribution({ text }: { text: string | null | undefined }) {
  const [expanded, setExpanded] = useState(false)
  const displayText = text || ""
  const shouldTruncate = displayText.length > CONTRIBUTION_MAX_LENGTH
  const truncatedText =
    shouldTruncate && !expanded ? `${displayText.slice(0, CONTRIBUTION_MAX_LENGTH)}...` : displayText

  if (!displayText) {
    return <span className="block text-sm italic text-muted-foreground">N/A</span>
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">{truncatedText}</p>
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 cursor-pointer text-xs font-medium text-primary transition-colors hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function textOrNa(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return <span className="italic text-muted-foreground">N/A</span>
  return trimmed
}

function ModuleTechStacks({ stacks }: { stacks: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? stacks : stacks.slice(0, MAX_TECH_STACKS)
  const remaining = stacks.length - visible.length

  return (
    <div className="rounded-md px-3 py-2">
      <p className="mb-0.5 text-sm font-medium text-muted-foreground">Technology Stack</p>
      {stacks.length > 0 ? (
        <div className="flex min-h-8 flex-wrap gap-2">
          {visible.map((stack, index) => (
            <Badge key={`${stack}-${index}`} variant="secondary" className={`${TECH_STACK_BADGE_CLASS} text-xs`}>
              {stack}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge
              variant="outline"
              className="cursor-pointer text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              role="button"
              tabIndex={0}
              onClick={() => setExpanded(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setExpanded(true)
                }
              }}
            >
              +{remaining} more
            </Badge>
          )}
          {expanded && stacks.length > MAX_TECH_STACKS && (
            <Badge
              variant="outline"
              className="cursor-pointer text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              role="button"
              tabIndex={0}
              onClick={() => setExpanded(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setExpanded(false)
                }
              }}
            >
              Show less
            </Badge>
          )}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">No items selected</p>
      )}
    </div>
  )
}

function ModuleCandidates({
  contributors,
  onOpenCandidate,
}: {
  contributors: ProjectModuleContributor[]
  onOpenCandidate: (candidateId: number) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition-colors hover:bg-accent/50">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Users className="size-4 text-muted-foreground" />
          Candidates
        </span>
        {open ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-3 py-2">
          {contributors.length === 0 ? (
            <p className="py-6 text-center text-base italic text-muted-foreground">No candidates recorded</p>
          ) : (
            contributors.map((contributor, contributorIndex) => (
              <div key={contributor.linkId}>
                {contributorIndex > 0 && <Separator className="my-4" />}
                <div className="space-y-1 px-3 py-2">
                  <p className="mb-0.5 text-sm font-medium text-muted-foreground">Name</p>
                  {contributor.candidateName.trim() ? (
                    <button
                      type="button"
                      className="cursor-pointer text-left text-sm font-medium hover:text-primary hover:underline"
                      onClick={() => onOpenCandidate(contributor.candidateId)}
                    >
                      {contributor.candidateName.trim()}
                    </button>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">N/A</p>
                  )}
                  <p className="mb-0.5 mt-2 text-sm font-medium text-muted-foreground">Contribution</p>
                  <TruncatedCandidateContribution text={contributor.contribution} />
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface ProjectModulesSectionProps {
  modules: ProjectModule[]
}

export function ProjectModulesSection({ modules }: ProjectModulesSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer transition-colors hover:bg-accent/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-5" />
                Modules
                {modules.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {modules.length}
                  </Badge>
                )}
              </CardTitle>
              {open ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {modules.length === 0 ? (
              <p className="py-6 text-center text-base italic text-muted-foreground">No modules recorded</p>
            ) : (
              modules.map((module, index) => (
                <div key={module.id}>
                  {index > 0 && <Separator className="my-6" />}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="px-3 py-2">
                        <p className="mb-0.5 text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-sm">{module.name.trim() ? module.name : textOrNa(module.name)}</p>
                      </div>
                      <ModuleTechStacks stacks={module.techStacks} />
                    </div>
                    <div className="px-3 py-2">
                      <p className="mb-1 text-sm font-medium text-muted-foreground">Description</p>
                      <TruncatedModuleDescription text={module.description} />
                    </div>
                    <ModuleCandidates
                      contributors={module.contributors}
                      onOpenCandidate={(candidateId) => router.push(`/candidates?candidateId=${candidateId}`)}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
