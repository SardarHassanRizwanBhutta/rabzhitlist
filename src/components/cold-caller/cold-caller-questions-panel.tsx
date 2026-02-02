"use client"

import * as React from "react"
import { useState } from "react"
import { 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Lightbulb
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { GeneratedQuestion } from "@/types/cold-caller"

interface ColdCallerQuestionsPanelProps {
  questions: GeneratedQuestion[]
  isLoading: boolean
  error: string | null
  onGenerateQuestions: () => void
  onRetry: () => void
  onQuestionClick?: (fieldName: string) => void
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  compensation: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  experience: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  technical: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  education: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  personal: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

function QuestionCard({ 
  question, 
  index,
  onCopy,
  onQuestionClick 
}: { 
  question: GeneratedQuestion
  index: number
  onCopy: (text: string) => void
  onQuestionClick?: (fieldName: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = () => {
    onCopy(question.question)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const categoryColor = CATEGORY_COLORS[question.category] || CATEGORY_COLORS.default

  return (
    <div 
      className={cn(
        "p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors",
        "cursor-pointer"
      )}
      onClick={() => onQuestionClick?.(question.field)}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
          {index + 1}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-relaxed">
              &quot;{question.question}&quot;
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs", categoryColor)}>
              {question.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Priority: {question.priority}/5
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono">
              {question.field}
            </Badge>
          </div>
          
          {question.context && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              <Lightbulb className="h-3 w-3" />
              <span>Interviewer tip</span>
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
          
          {expanded && question.context && (
            <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3 inline mr-1" />
              {question.context}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ColdCallerQuestionsPanel({
  questions,
  isLoading,
  error,
  onGenerateQuestions,
  onRetry,
  onQuestionClick,
}: ColdCallerQuestionsPanelProps) {
  const handleCopyQuestion = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Question copied to clipboard")
  }

  const handleCopyAll = () => {
    const allQuestions = questions
      .sort((a, b) => b.priority - a.priority)
      .map((q, i) => `${i + 1}. ${q.question}`)
      .join('\n\n')
    navigator.clipboard.writeText(allQuestions)
    toast.success("All questions copied to clipboard")
  }

  // Sort questions by priority (highest first)
  const sortedQuestions = [...questions].sort((a, b) => b.priority - a.priority)

  // Initial state - no questions generated yet
  if (!isLoading && !error && questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">AI-Powered Questions</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          Generate intelligent questions based on missing candidate information to guide your conversation.
        </p>
        <Button onClick={onGenerateQuestions} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Questions
        </Button>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Generating questions with AI...
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border border-border space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to Generate</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {error}
        </p>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  // Questions loaded
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Questions</h3>
            <Badge variant="secondary">{questions.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyAll}
              className="gap-1.5 text-xs"
            >
              <Copy className="h-3 w-3" />
              Copy All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onGenerateQuestions}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Questions are sorted by priority. Click a question to highlight the related field.
        </p>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedQuestions.map((question, index) => (
          <QuestionCard
            key={`${question.field}-${index}`}
            question={question}
            index={index}
            onCopy={handleCopyQuestion}
            onQuestionClick={onQuestionClick}
          />
        ))}
      </div>
    </div>
  )
}


