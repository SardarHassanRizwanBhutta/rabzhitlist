"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { EmptyField, FieldSection, GeneratedQuestion } from "@/types/cold-caller"
import { SECTION_LABELS } from "@/types/cold-caller"
import {
  buildQuestionFieldLabelMap,
  resolveQuestionFieldMeta,
} from "@/lib/utils/question-api-field-labels"

interface CallNotesQuestionsSidebarProps {
  questions: GeneratedQuestion[]
  sectionMissingFields?: string[]
  sectionComplete?: boolean
  isLoading: boolean
  error: string | null
  emptyFields: EmptyField[]
  section?: FieldSection
  activeQuestionField?: string | null
  onQuestionSelect?: (apiFieldName: string) => void
  onRetry?: () => void
  className?: string
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority <= 0) return null
  return (
    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 tabular-nums shrink-0">
      {priority}
    </Badge>
  )
}

export function CallNotesQuestionsSidebar({
  questions,
  sectionMissingFields,
  sectionComplete = false,
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

  const fieldMetaByApiName = useMemo(
    () => buildQuestionFieldLabelMap(emptyFields),
    [emptyFields],
  )

  const sortedQuestions = useMemo(() => {
    const filtered =
      section != null ? questions.filter((q) => q.section === section) : questions
    return [...filtered].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return a.field.localeCompare(b.field)
    })
  }, [questions, section])

  const handleCopy = (apiFieldName: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedField(apiFieldName)
      toast.success("Question copied")
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  const hasGenerated = sectionMissingFields != null || sectionComplete || sortedQuestions.length > 0

  return (
    <aside
      className={cn(
        "flex flex-col min-h-0 min-w-0 overflow-hidden border-l border-border bg-muted/30",
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

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
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
        ) : sectionComplete ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-600 shrink-0" aria-hidden />
            <p className="text-sm font-medium">Section complete</p>
            <p className="text-xs text-muted-foreground">No missing fields in this section.</p>
          </div>
        ) : hasGenerated && sectionMissingFields && sectionMissingFields.length > 0 && sortedQuestions.length === 0 ? (
          <div className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Missing fields
            </p>
            <ul className="space-y-1">
                  {sectionMissingFields.map((fieldKey) => {
                    const meta = resolveQuestionFieldMeta(fieldKey, emptyFields)
                    return (
                <li
                  key={fieldKey}
                  className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/50 truncate"
                  title={meta.label}
                >
                  {meta.label}
                </li>
                    )
                  })}
            </ul>
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
          <div className="p-2 space-y-2">
            {sectionMissingFields && sectionMissingFields.length > 0 && (
              <div className="px-2 pb-1 min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Missing fields
                </p>
                <div className="flex flex-wrap gap-1 min-w-0">
                  {sectionMissingFields.map((fieldKey) => {
                    const meta = resolveQuestionFieldMeta(fieldKey, emptyFields)
                    return (
                    <Badge
                      key={fieldKey}
                      variant="secondary"
                      className="text-[10px] max-w-full truncate"
                      title={meta.label}
                    >
                      {meta.label}
                    </Badge>
                    )
                  })}
                </div>
              </div>
            )}
            <ul className="space-y-1" role="list">
              {sortedQuestions.map((question, index) => {
                const meta =
                  fieldMetaByApiName.get(question.field) ??
                  resolveQuestionFieldMeta(question.field, emptyFields)
                const label = meta.label
                const isActive = activeQuestionField === question.field

                return (
                  <li key={`${question.field}-${index}`}>
                    <div
                      className={cn(
                        "rounded-md border border-transparent flex items-stretch",
                        isActive ? "bg-primary border-primary" : "bg-card/40 hover:bg-muted",
                        meta.isSectionOpener && !isActive && "border-dashed border-border/60",
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
                        <div className="flex items-start gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0 mt-0.5">
                            {index + 1}.
                          </span>
                          <MessageSquare
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 mt-0.5",
                              isActive ? "text-primary-foreground" : "text-primary",
                            )}
                            aria-hidden
                          />
                          <span className="text-xs font-semibold flex-1 min-w-0 break-words">
                            {label}
                          </span>
                          {meta.isSectionOpener && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] px-1 py-0 h-4 shrink-0",
                                isActive && "border-primary-foreground/40 text-primary-foreground",
                              )}
                            >
                              Section
                            </Badge>
                          )}
                          <PriorityBadge priority={question.priority} />
                        </div>
                        <p
                          className={cn(
                            "text-sm font-medium leading-snug break-words",
                            isActive ? "text-primary-foreground/95" : "text-foreground",
                          )}
                        >
                          &ldquo;{question.question}&rdquo;
                        </p>
                        {question.context && (
                          <p
                            className={cn(
                              "text-[11px] mt-1.5 break-words",
                              isActive ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {question.context}
                          </p>
                        )}
                        <p
                          className={cn(
                            "text-[10px] mt-1 font-mono truncate",
                            isActive ? "text-primary-foreground/60" : "text-muted-foreground/80",
                          )}
                          title={question.field}
                        >
                          {question.field}
                        </p>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-auto w-9 shrink-0 rounded-none rounded-r-md",
                          isActive &&
                            "text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground",
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
          </div>
        )}
      </div>
    </aside>
  )
}
