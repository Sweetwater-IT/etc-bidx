"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { data } from "@/components/app-sidebar"

export function SiteHeader() {
  const pathname = usePathname()

  // Função para encontrar o título baseado na rota atual
  const getCurrentTitle = () => {
    // Procura em todas as seções do menu
    const allItems = [
      ...data.navMain,
      ...data.navClouds,
      ...data.navSecondary,
      ...data.documents.map(doc => ({ title: doc.name, url: doc.url }))
    ]
    
    // Encontra o item que corresponde à rota atual
    const currentItem = allItems.find(item => item.url === pathname)
    
    // Se encontrou, retorna o título, senão retorna "Dashboard" para a home
    return currentItem?.title || (pathname === "/" ? "Dashboard" : "")
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
