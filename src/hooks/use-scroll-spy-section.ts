import { useEffect, useRef, type RefObject } from "react"

type UseScrollSpySectionOptions = {
  enabled: boolean
  sectionIds: readonly string[]
  scrollOffset?: number
  onActiveSectionChange: (sectionId: string) => void
  isScrollingRef: RefObject<boolean>
  /** Re-attach when scroll content layout may have changed. */
  layoutKey?: unknown
}

function resolveActiveSectionId(
  container: HTMLElement,
  sectionIds: readonly string[],
  scrollOffset: number,
): string | null {
  if (sectionIds.length === 0) return null

  const marker = container.getBoundingClientRect().top + scrollOffset
  let activeId = sectionIds[0]

  for (const sectionId of sectionIds) {
    const element = container.querySelector<HTMLElement>(`#${CSS.escape(sectionId)}`)
    if (!element) continue

    if (element.getBoundingClientRect().top <= marker + 1) {
      activeId = sectionId
    }
  }

  return activeId
}

export function useScrollSpySection(
  containerRef: RefObject<HTMLDivElement | null>,
  {
    enabled,
    sectionIds,
    scrollOffset = 80,
    onActiveSectionChange,
    isScrollingRef,
    layoutKey,
  }: UseScrollSpySectionOptions,
) {
  const sectionKey = sectionIds.join("|")
  const onActiveSectionChangeRef = useRef(onActiveSectionChange)
  onActiveSectionChangeRef.current = onActiveSectionChange

  useEffect(() => {
    if (!enabled) return

    let rafId = 0
    let container: HTMLDivElement | null = null

    const updateActiveSection = () => {
      if (!container || isScrollingRef.current) return

      const activeId = resolveActiveSectionId(container, sectionIds, scrollOffset)
      if (activeId) {
        onActiveSectionChangeRef.current(activeId)
      }
    }

    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateActiveSection)
    }

    const attach = () => {
      container = containerRef.current
      if (!container) return false

      container.addEventListener("scroll", handleScroll, { passive: true })
      updateActiveSection()
      return true
    }

    if (!attach()) {
      const setupFrame = requestAnimationFrame(() => {
        attach()
      })

      return () => {
        cancelAnimationFrame(setupFrame)
        cancelAnimationFrame(rafId)
        container?.removeEventListener("scroll", handleScroll)
      }
    }

    return () => {
      cancelAnimationFrame(rafId)
      container?.removeEventListener("scroll", handleScroll)
    }
  }, [enabled, sectionKey, scrollOffset, isScrollingRef, containerRef, layoutKey, sectionIds])
}
