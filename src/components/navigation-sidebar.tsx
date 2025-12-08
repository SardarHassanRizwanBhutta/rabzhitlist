"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, FolderOpen, Building2, Award, GraduationCap } from "lucide-react"
import { GlobalFilterDialog } from "@/components/global-filter-dialog"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Navigation items configuration
const navigationItems = [
  {
    title: "Candidates",
    url: "/candidates",
    icon: Users,
    description: "Manage candidate profiles and applications",
  },
  {
    title: "Projects",
    url: "/projects", 
    icon: FolderOpen,
    description: "View and manage ongoing projects",
  },
  {
    title: "Employers",
    url: "/employers",
    icon: Building2,
    description: "Manage employer relationships and requirements",
  },
  {
    title: "Universities",
    url: "/universities",
    icon: GraduationCap,
    description: "Manage university database and institutional information",
  },
  {
    title: "Certifications",
    url: "/certifications",
    icon: Award,
    description: "Manage professional certifications and achievements",
  },
] as const

// Navigation item type
type NavigationItem = {
  title: string
  url: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description: string
}

// Navigation sidebar component props
interface NavigationSidebarProps {
  /**
   * Whether the sidebar should be open by default
   * @default true
   */
  defaultOpen?: boolean
  /**
   * Custom className for the sidebar wrapper
   */
  className?: string
  /**
   * Children to render in the main content area
   */
  children?: React.ReactNode
}

export function NavigationSidebar({ 
  defaultOpen = true, 
  className,
  children 
}: NavigationSidebarProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen} className={className}>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Rabz Hit List</h1>
          </div>
          <GlobalFilterDialog />
        </header>
        <div className="flex-1 space-y-4 p-6">
          {children}
        </div>  
      </main>
      <SidebarRail />
    </SidebarProvider>
  )
}

function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Rabz Hit List</span>
          </div>
        </div>
      </SidebarHeader>
          <SidebarMenu className="p-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.description}
                    className="transition-all duration-200 ease-in-out hover:scale-[1.02]"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="size-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        {/* </div> */}
    </Sidebar>
  )
}

// Export navigation items for potential reuse
export { navigationItems }
export type { NavigationItem }
