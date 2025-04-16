"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { data } from "@/components/app-sidebar"

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
        <h1 className="text-base font-medium">{getCurrentTitle()}</h1>
      </div>
    </header>
  )
}
