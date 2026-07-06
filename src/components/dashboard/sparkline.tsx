import { cn } from "@/lib/utils"

interface SparklineProps {
  values: number[]
  /** Tailwind text color class; the line uses currentColor. */
  className?: string
  height?: number
}

/**
 * Lightweight inline-SVG sparkline (no chart library). Scales `values` to a
 * 0–100 viewBox and stretches to the container width.
 */
export function Sparkline({ values, className, height = 32 }: SparklineProps) {
  if (values.length < 2) {
    return <div style={{ height }} aria-hidden />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = 100 / (values.length - 1)

  const points = values
    .map((v, i) => {
      const x = i * stepX
      // Invert Y (SVG origin is top-left); pad 6% top/bottom.
      const y = 94 - ((v - min) / span) * 88 + 3
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("w-full text-primary", className)}
      style={{ height }}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
