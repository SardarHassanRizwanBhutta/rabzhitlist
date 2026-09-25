"use client"

import * as React from "react"

type PageHeaderContextValue = {
  title: string | null
  setTitle: (title: string | null) => void
}

const PageHeaderContext = React.createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = React.useState<string | null>(null)
  const value = React.useMemo(() => ({ title, setTitle }), [title])
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
}

export function usePageHeaderTitle(): string | null {
  return React.useContext(PageHeaderContext)?.title ?? null
}

/** Sets the top app bar heading for the current page; clears on unmount. */
export function SetPageHeader({ title }: { title: string | null }) {
  const ctx = React.useContext(PageHeaderContext)
  React.useEffect(() => {
    if (!ctx) return
    ctx.setTitle(title)
    return () => ctx.setTitle(null)
  }, [ctx, title])
  return null
}
