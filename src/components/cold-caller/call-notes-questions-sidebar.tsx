"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { EmptyField, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"

interface CallNotesQuestionsSidebarProps {
  questions: GeneratedQuestion[]
  isLoading: boolean
  error: string | null
  emptyFields: EmptyField[]
  /** When set, only show questions for empty fields in this section */
  section?: FieldSection
  activeQuestionField?: string | null
  onQuestionSelect?: (apiFieldName: string) => void
  onRetry?: () => void
  className?: string
}

function PriorityStars({ priority }: { priority: number }) {
  const count = Math.min(Math.max(priority, 0), 5)
  if (count === 0) return null
  return (
    <span className="inline-flex items-center gap-0.5" title={`Priority ${count}/5`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
      ))}
    </span>
  )
}

export function CallNotesQuestionsSidebar({
  questions,
  isLoading,
  error,
  emptyFields,
  section,
  activeQuestionField,
  onQuestionSelect,
  onRetry,
  className,
}: CallNotesQuestionsSidebarProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fieldMetaByApiName = useMemo(() => {
    const map = new Map<string, { label: string; fieldPath: string }>()
    emptyFields.forEach((f) => {
      map.set(f.apiFieldName, { label: f.fieldLabel, fieldPath: f.fieldPath })
    })
    return map
  }, [emptyFields])

  const sortedQuestions = useMemo(() => {
    const apiNamesInSection =
      section != null
        ? new Set(
            emptyFields.filter((f) => f.section === section).map((f) => f.apiFieldName),
          )
        : null

    const filtered =
      apiNamesInSection != null
        ? questions.filter((q) => apiNamesInSection.has(q.field))
        : questions

    return [...filtered].sort((a, b) => b.priority - a.priority)
  }, [questions, emptyFields, section])

  const handleCopy = (apiFieldName: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(apiFieldName)
      toast.success("Question copied")
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  return (
    <aside
      className={cn(
        "w-72 lg:w-80 xl:w-96 shrink-0 border-l border-border bg-muted/30 flex flex-col min-h-0",
        className,
      )}
      aria-label="Generated interview questions"
    >
      <div className="p-3 border-b border-border sticky top-0 bg-muted/50 backdrop-blur z-10 space-y-1 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {section ? `${SECTION_LABELS[section]} Questions` : "Questions"}
          </span>
          {!isLoading && !error && sortedQuestions.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {sortedQuestions.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3" aria-live="polite">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Generating questions…
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-md border border-border bg-card/50 p-3 space-y-2 animate-pulse"
              >
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 flex flex-col items-center text-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive shrink-0" aria-hidden />
            <p className="text-sm text-muted-foreground">{error}</p>
            {onRetry && (
              <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                Try Again
              </Button>
            )}
          </div>
        ) : sortedQuestions.length === 0 ? (
          <div className="p-4 flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <p className="text-sm text-muted-foreground">
              {section ? (
                <>
                  Use <span className="font-medium text-foreground">Generate Questions</span> in the
                  header to create questions for {SECTION_LABELS[section].toLowerCase()} fields.
                </>
              ) : (
                <>
                  Use <span className="font-medium text-foreground">Generate Questions</span> in the
                  header to create AI-guided questions for missing fields.
                </>
              )}
            </p>
          </div>
        ) : (
          <ul className="p-2 space-y-1" role="list">
            {sortedQuestions.map((question) => {
              const meta = fieldMetaByApiName.get(question.field)
              const label = meta?.label ?? question.field
              const isActive = activeQuestionField === question.field

              return (
                <li key={question.field}>
                  <div
                    className={cn(
                      "rounded-md border border-transparent flex items-stretch",
                      isActive ? "bg-primary border-primary" : "bg-card/40 hover:bg-muted",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onQuestionSelect?.(question.field)}
                      className={cn(
                        "flex-1 min-w-0 text-left px-3 py-2.5 transition-colors",
                        isActive && "text-primary-foreground",
                      )}
                    >
                      <div className="flex items-start gap-1.5 mb-1.5">
                        <MessageSquare
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 mt-0.5",
                            isActive ? "text-primary-foreground" : "text-primary",
                          )}
                          aria-hidden
                        />
                        <span className="text-xs font-semibold truncate flex-1">{label}</span>
                        <PriorityStars priority={question.priority} />
                      </div>
                      <p
                        className={cn(
                          "text-sm leading-snug line-clamp-4",
                          isActive ? "text-primary-foreground/95" : "text-foreground",
                        )}
                      >
                        &ldquo;{question.question}&rdquo;
                      </p>
                      {question.context && (
                        <p
                          className={cn(
                            "text-[11px] mt-1.5 line-clamp-2",
                            isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          Tip: {question.context}
                        </p>
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-auto w-9 shrink-0 rounded-none rounded-r-md",
                        isActive && "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground",
                      )}
                      aria-label={`Copy question for ${label}`}
                      onClick={(e) => handleCopy(question.field, question.question, e)}
                    >
                      {copiedField === question.field ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
