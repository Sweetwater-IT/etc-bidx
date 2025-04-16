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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) pt-16 mb-12">
      <div className="flex w-full flex-col gap-2 px-4 lg:gap-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Input placeholder="Search..." className="pl-10 pr-16" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-muted rounded px-2 py-0.5 text-muted-foreground select-none">⌘ k</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative rounded-lg p-2 hover:bg-muted">
              <IconBell className="size-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button className="rounded-lg p-2 hover:bg-muted">
              <IconPower className="size-5" />
            </button>
            <ModeToggle />
          </div>
        </div>
        <h1 className="text-3xl font-bold mt-2 ml-2">{getCurrentTitle()}</h1>
      </div>
    </header>
  )
}
