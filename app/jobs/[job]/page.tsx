"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { getJobCards } from "@/data/jobs-cards"
import { jobsData, type JobType } from "@/data/jobs-data"
import { notFound } from "next/navigation";

export default function JobPage({ params }: any) {
  if (!['available', 'active-bids', 'active-jobs'].includes(params.job)) {
    notFound();
  }

  const jobType = params.job as JobType;
  const cards = getJobCards(jobType);
  const tableData = jobsData[jobType];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards data={cards} />
              <DataTable data={tableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 