"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { data } from "@/components/app-sidebar"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/toggle-color"
import { IconBell, IconPower } from "@tabler/icons-react"

export function SiteHeader() {
  const pathname = usePathname()

  const findTitle = (items: any[]): string | undefined => {
    for (const item of items) {
      if (item.url === pathname) return item.title || item.name
      if (item.items) {
        const found = findTitle(item.items)
        if (found) return found
      }
    }
    return undefined
  }

  const getCurrentTitle = () => {
    const allItems = [
      ...data.navMain,
      ...data.navClouds,
      ...data.navSecondary,
      ...data.documents.map(doc => ({ title: doc.name, url: doc.url }))
    ]
    const foundTitle = findTitle(allItems)
    return foundTitle || (pathname === "/" ? "Dashboard" : "")
  }

  return (

    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Project Estimating</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>

        </div>
        <h1 className="text-3xl font-bold mt-2 ml-2">{getCurrentTitle()}</h1>
      </div>
    </header>
  )
}
