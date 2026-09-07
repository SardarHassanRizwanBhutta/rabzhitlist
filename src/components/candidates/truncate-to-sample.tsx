import { cn } from "@/lib/utils"

type TruncateToSampleProps = {
  sample: string
  text: string
  className?: string
  /** When true, the box may shrink below the sample in a narrower parent. */
  allowShrink?: boolean
}

/** Caps visible text to the rendered width of `sample` in the inherited font. */
export function TruncateToSample({
  sample,
  text,
  className,
  allowShrink = false,
}: TruncateToSampleProps) {
  return (
    <span
      className={cn(
        "relative inline-block align-top",
        allowShrink && "max-w-full",
        className
      )}
    >
      <span aria-hidden="true" className="invisible block whitespace-nowrap">
        {sample}
      </span>
      <span className="absolute inset-0 block truncate" title={text || undefined}>
        {text}
      </span>
    </span>
  )
}
