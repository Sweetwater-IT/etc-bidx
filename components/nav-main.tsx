"use client"

import { type Icon } from "@tabler/icons-react"
import { IconChevronDown } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import { IconDashboard, IconListDetails } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const [openItem, setOpenItem] = React.useState<string | null>('Bid / Job List')

  React.useEffect(() => {
    items.forEach((item) => {
      if (item.items?.some(subItem => pathname?.startsWith(subItem.url))) {
        setOpenItem(item.title)
      }
    })
  }, [pathname, items])

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Project Estimating</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.items ? (
                <>
                  <SidebarMenuButton
                    onClick={() => setOpenItem(openItem === item.title ? null : item.title)}
                    className={pathname?.startsWith(item.url) ? "bg-muted" : ""}
                    data-state={openItem === item.title ? "open" : "closed"}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <IconChevronDown
                      className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180"
                      data-state={openItem === item.title ? "open" : "closed"}
                    />
                  </SidebarMenuButton>
                  {openItem === item.title && (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={pathname === subItem.url ? "bg-muted" : ""}
                          >
                            <Link href={subItem.url}>
                              {subItem.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={pathname === item.url ? "bg-muted" : ""}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Bid / Job List",
      url: "/jobs",
      icon: IconListDetails,
      items: [
        {
          title: "Available Jobs",
          url: "/jobs/available",
        },
        {
          title: "Active Bids",
          url: "/jobs/active-bids",
        },
        {
          title: "Active Jobs",
          url: "/jobs/active-jobs",
        }
      ]
    },
    // ... rest of the navigation items
  ],
  // ... rest of the data
}
