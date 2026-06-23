import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { GeneratedQuestion } from "@/types/cold-caller"
import { formatAlwaysAskExistingValue } from "@/lib/utils/basic-information-questions"

interface EnrichmentQuestionChromeProps {
  question: GeneratedQuestion
  isActive?: boolean
  className?: string
}

/** Contribution enrichment already quotes the full text in the question — chips are redundant. */
function shouldShowExistingValueChips(field: string): boolean {
  return !field.endsWith("_contributionNotes")
}

/** Reminder badge + optional existing_values chips (§ 4.8.2a, § 4.12.2a, § 4.9, § 4.10, § 4.14). */
export function EnrichmentQuestionChrome({
  question,
  isActive = false,
  className,
}: EnrichmentQuestionChromeProps) {
  if (question.promptType !== "enrichment") return null

  const values =
    shouldShowExistingValueChips(question.field)
      ? (question.existingValues?.filter((v) => v.trim() !== "") ?? [])
      : []

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <Badge
        variant="outline"
        className={cn(
          "text-[9px] px-1 py-0 h-4 shrink-0 border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200",
          isActive && "border-primary-foreground/40 bg-primary/20 text-primary-foreground",
        )}
      >
        Reminder
      </Badge>
      {values.map((value) => {
        const display = formatAlwaysAskExistingValue(question.field, value)
        return (
        <Badge
          key={value}
          variant="secondary"
          className={cn(
            "text-[9px] px-1 py-0 h-4 max-w-[8rem] truncate font-normal",
            isActive && "bg-primary-foreground/15 text-primary-foreground",
          )}
          title={display}
        >
          {display}
        </Badge>
        )
      })}
    </div>
  )
}
