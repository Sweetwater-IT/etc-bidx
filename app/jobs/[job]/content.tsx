"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { getJobCards } from "@/data/jobs-cards"
import { jobsData, type JobType, type JobData } from "@/data/jobs-data"
import { availableJobsData, availableJobsColumns, type AvailableJob } from "@/data/available-jobs"
import { notFound } from "next/navigation";
import { useState } from "react";
import { OpenBidSheet } from "@/components/open-bid-sheet";

const AVAILABLE_JOBS_SEGMENTS = [
  { label: "All", value: "all" },
  { label: "Unset", value: "unset" },
  { label: "No Bid", value: "no-bid" },
  { label: "Bid", value: "bid" },
];

const DEFAULT_SEGMENTS = [
  { label: "Outline", value: "outline" },
  { label: "Past Performance", value: "past-performance" },
  { label: "Key Personnel", value: "key-personnel" },
  { label: "Focus Documents", value: "focus-documents" },
];

const DEFAULT_COLUMNS = [
  { key: "title", title: "Title" },
  { key: "company", title: "Company" },
  { key: "location", title: "Location" },
  { key: "type", title: "Type" },
  { key: "status", title: "Status" },
  { key: "budget", title: "Budget", className: "text-right" },
  { key: "deadline", title: "Deadline" },
];

interface JobPageContentProps {
  job: string
}

export function JobPageContent({ job }: JobPageContentProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!['available', 'active-bids', 'active-jobs'].includes(job)) {
    notFound();
  }

  const jobType = job as JobType;
  const cards = getJobCards(jobType);
  
  const isAvailableJobs = jobType === "available";
  const segments = isAvailableJobs ? AVAILABLE_JOBS_SEGMENTS : DEFAULT_SEGMENTS;
  const addButtonLabel = isAvailableJobs ? "Create Open Bid" : "Add Section";
  const columns = isAvailableJobs ? availableJobsColumns : DEFAULT_COLUMNS;
  const data = isAvailableJobs ? availableJobsData : jobsData[jobType];

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

              <OpenBidSheet open={sheetOpen} onOpenChange={setSheetOpen} />

              {isAvailableJobs ? (
                <DataTable<AvailableJob>
                  data={data as AvailableJob[]}
                  columns={columns}
                  segments={segments}
                  addButtonLabel={addButtonLabel}
                  adOnClick={() => setSheetOpen(true)}
                />
              ) : (
                <DataTable<JobData>
                  data={data as JobData[]}
                  columns={columns}
                  segments={segments}
                  addButtonLabel={addButtonLabel}
                />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 