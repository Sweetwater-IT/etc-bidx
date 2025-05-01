"use client";

import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: typeof IconDashboard;
  items?: {
    title: string;
    url: string;
  }[];
}

interface Document {
  name: string;
  url: string;
  icon: typeof IconDatabase;
}

export const data = {
  user: {
    name: "Napoleon Dunn",
    email: "ndunn@establishedtraffic.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
        },
      ],
    },
    {
      title: "Inventory Position",
      url: "",
      icon: IconChartBar,
    },
    {
      title: "Quote Form",
      url: "/quotes",
      icon: IconFolder,
    },
    {
      title: "Sale Tracker",
      url: "/sales",
      icon: IconUsers,
    },
    {
      title: "Admin Portal",
      url: "",
      icon: IconUsers,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Reporting",
      url: "/reports",
      icon: IconUsers,
    },
    {
      title: "Contract Manager",
      url: "",
      icon: IconUsers,
    },
  ] as NavItem[],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "/capture",
      items: [
        {
          title: "Active Proposals",
          url: "/capture/active",
        },
        {
          title: "Archived",
          url: "/capture/archived",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "/proposals",
      items: [
        {
          title: "Active Proposals",
          url: "/proposals/active",
        },
        {
          title: "Archived",
          url: "/proposals/archived",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "/prompts",
      items: [
        {
          title: "Active Proposals",
          url: "/prompts/active",
        },
        {
          title: "Archived",
          url: "/prompts/archived",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "",
      icon: IconSearch,
    },
  ] as NavItem[],
  documents: [
    {
      name: "Job List",
      url: "/documents/jobs",
      icon: IconDatabase,
    },
    {
      name: "By Phase Job List",
      url: "/documents/jobs-by-phase",
      icon: IconReport,
    },
    {
      name: "Billing Tracker",
      url: "",
      icon: IconFileWord,
    },
    {
      name: "Equipment Tracker",
      url: "",
      icon: IconFileWord,
    },
  ] as Document[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 min-h-[2.5rem] overflow-visible"
            >
              <Link href="/">

                <span className="text-base font-semibold">BidX</span>
                {/* <ModeToggle /> */}
              
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
